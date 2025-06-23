/**
 * Enterprise Webhook System
 * Comprehensive webhook management with delivery guarantees, retry logic, and monitoring
 */

import { createHash, createHmac, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { enterpriseCache } from '@/lib/scalability/enterprise-redis-cache';

export interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  headers: Record<string, string>;
  metadata: Record<string, any>;
  retryPolicy: {
    maxRetries: number;
    backoffType: 'linear' | 'exponential' | 'fixed';
    initialDelay: number; // milliseconds
    maxDelay: number; // milliseconds
    multiplier?: number; // for exponential backoff
  };
  filterExpression?: string; // JSONPath expression for filtering
  timeout: number; // milliseconds
  createdAt: Date;
  updatedAt: Date;
  lastDelivery?: Date;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
}

export interface WebhookEvent {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata: Record<string, any>;
  version: string;
  correlationId?: string;
  traceId?: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  attempt: number;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  httpStatusCode?: number;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  duration: number; // milliseconds
  errorMessage?: string;
  scheduledAt: Date;
  deliveredAt?: Date;
  nextRetryAt?: Date;
}

export interface WebhookSignature {
  algorithm: 'sha256' | 'sha512';
  header: string;
  format: 'hex' | 'base64';
}

class EnterpriseWebhookSystem {
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private eventQueue: Array<{ event: WebhookEvent; endpoints: string[] }> = [];
  private deliveryQueue: WebhookDelivery[] = [];
  private processing: boolean = false;
  private signatureConfig: WebhookSignature = {
    algorithm: 'sha256',
    header: 'X-Webhook-Signature',
    format: 'hex'
  };

  constructor() {
    this.startEventProcessor();
    this.startDeliveryProcessor();
    this.startRetryProcessor();
    this.loadWebhookEndpoints();
  }

  /**
   * Register a new webhook endpoint
   */
  async registerWebhook(webhook: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt' | 'totalDeliveries' | 'successfulDeliveries' | 'failedDeliveries'>): Promise<WebhookEndpoint> {
    try {
      const webhookId = randomBytes(16).toString('hex');
      const now = new Date();

      const newWebhook: WebhookEndpoint = {
        id: webhookId,
        ...webhook,
        secret: webhook.secret || this.generateSecret(),
        createdAt: now,
        updatedAt: now,
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0
      };

      this.endpoints.set(webhookId, newWebhook);

      // Store in database
      await this.storeWebhookEndpoint(newWebhook);

      // Log webhook registration
      await this.logWebhookActivity('webhook_registered', {
        webhookId,
        url: webhook.url,
        events: webhook.events
      });

      return newWebhook;
    } catch (error) {
      console.error('Failed to register webhook:', error);
      throw error;
    }
  }

  /**
   * Update webhook endpoint
   */
  async updateWebhook(webhookId: string, updates: Partial<WebhookEndpoint>): Promise<WebhookEndpoint> {
    try {
      const existingWebhook = this.endpoints.get(webhookId);
      if (!existingWebhook) {
        throw new Error('Webhook not found');
      }

      const updatedWebhook: WebhookEndpoint = {
        ...existingWebhook,
        ...updates,
        updatedAt: new Date()
      };

      this.endpoints.set(webhookId, updatedWebhook);

      // Update in database
      await this.updateWebhookEndpoint(webhookId, updatedWebhook);

      await this.logWebhookActivity('webhook_updated', {
        webhookId,
        changes: Object.keys(updates)
      });

      return updatedWebhook;
    } catch (error) {
      console.error('Failed to update webhook:', error);
      throw error;
    }
  }

  /**
   * Delete webhook endpoint
   */
  async deleteWebhook(webhookId: string): Promise<boolean> {
    try {
      const webhook = this.endpoints.get(webhookId);
      if (!webhook) {
        return false;
      }

      this.endpoints.delete(webhookId);

      // Remove from database
      await this.deleteWebhookEndpoint(webhookId);

      await this.logWebhookActivity('webhook_deleted', { webhookId });

      return true;
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      throw error;
    }
  }

  /**
   * Trigger webhook event
   */
  async triggerEvent(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const webhookEvent: WebhookEvent = {
        id: randomBytes(16).toString('hex'),
        timestamp: new Date(),
        ...event
      };

      // Find matching endpoints
      const matchingEndpoints = Array.from(this.endpoints.values())
        .filter(endpoint => 
          endpoint.enabled && 
          endpoint.events.includes(event.type) &&
          this.matchesFilter(event, endpoint.filterExpression)
        )
        .map(endpoint => endpoint.id);

      if (matchingEndpoints.length === 0) {
        console.log(`No matching endpoints for event type: ${event.type}`);
        return;
      }

      // Add to event queue
      this.eventQueue.push({
        event: webhookEvent,
        endpoints: matchingEndpoints
      });

      // Store event
      await this.storeWebhookEvent(webhookEvent);

      await this.logWebhookActivity('event_triggered', {
        eventId: webhookEvent.id,
        eventType: event.type,
        endpointsCount: matchingEndpoints.length
      });
    } catch (error) {
      console.error('Failed to trigger webhook event:', error);
      throw error;
    }
  }

  /**
   * Get webhook delivery history
   */
  async getDeliveryHistory(webhookId?: string, eventId?: string, limit: number = 100): Promise<WebhookDelivery[]> {
    try {
      // Filter deliveries based on criteria
      let deliveries = this.deliveryQueue;

      if (webhookId) {
        deliveries = deliveries.filter(d => d.webhookId === webhookId);
      }

      if (eventId) {
        deliveries = deliveries.filter(d => d.eventId === eventId);
      }

      // Sort by delivery date (most recent first)
      deliveries.sort((a, b) => {
        const dateA = a.deliveredAt || a.scheduledAt;
        const dateB = b.deliveredAt || b.scheduledAt;
        return dateB.getTime() - dateA.getTime();
      });

      return deliveries.slice(0, limit);
    } catch (error) {
      console.error('Failed to get delivery history:', error);
      return [];
    }
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(webhookId?: string): Promise<{
    totalEndpoints: number;
    activeEndpoints: number;
    totalEvents: number;
    totalDeliveries: number;
    successRate: number;
    averageDeliveryTime: number;
    endpointStats?: {
      webhookId: string;
      url: string;
      totalDeliveries: number;
      successfulDeliveries: number;
      failedDeliveries: number;
      successRate: number;
      averageDeliveryTime: number;
      lastDelivery?: Date;
    };
  }> {
    try {
      const endpoints = webhookId ? 
        [this.endpoints.get(webhookId)].filter(Boolean) as WebhookEndpoint[] :
        Array.from(this.endpoints.values());

      const activeEndpoints = endpoints.filter(e => e.enabled).length;
      
      const deliveries = webhookId ?
        this.deliveryQueue.filter(d => d.webhookId === webhookId) :
        this.deliveryQueue;

      const successfulDeliveries = deliveries.filter(d => d.status === 'success').length;
      const totalDeliveries = deliveries.length;
      const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

      const completedDeliveries = deliveries.filter(d => d.deliveredAt);
      const averageDeliveryTime = completedDeliveries.length > 0 ?
        completedDeliveries.reduce((sum, d) => sum + d.duration, 0) / completedDeliveries.length : 0;

      const stats = {
        totalEndpoints: endpoints.length,
        activeEndpoints,
        totalEvents: this.eventQueue.length, // This would be persisted count in production
        totalDeliveries,
        successRate,
        averageDeliveryTime
      };

      if (webhookId && endpoints.length === 1) {
        const endpoint = endpoints[0];
        const endpointDeliveries = deliveries.filter(d => d.webhookId === webhookId);
        const endpointSuccessful = endpointDeliveries.filter(d => d.status === 'success').length;
        const endpointTotal = endpointDeliveries.length;
        const endpointSuccessRate = endpointTotal > 0 ? (endpointSuccessful / endpointTotal) * 100 : 0;
        const endpointAvgTime = endpointDeliveries.filter(d => d.deliveredAt).length > 0 ?
          endpointDeliveries.filter(d => d.deliveredAt).reduce((sum, d) => sum + d.duration, 0) / 
          endpointDeliveries.filter(d => d.deliveredAt).length : 0;

        (stats as any).endpointStats = {
          webhookId,
          url: endpoint.url,
          totalDeliveries: endpointTotal,
          successfulDeliveries: endpointSuccessful,
          failedDeliveries: endpointTotal - endpointSuccessful,
          successRate: endpointSuccessRate,
          averageDeliveryTime: endpointAvgTime,
          lastDelivery: endpoint.lastDelivery
        };
      }

      return stats;
    } catch (error) {
      console.error('Failed to get webhook stats:', error);
      throw error;
    }
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(webhookId: string): Promise<{
    success: boolean;
    statusCode?: number;
    responseTime: number;
    errorMessage?: string;
  }> {
    try {
      const webhook = this.endpoints.get(webhookId);
      if (!webhook) {
        throw new Error('Webhook not found');
      }

      const testEvent: WebhookEvent = {
        id: 'test-' + randomBytes(8).toString('hex'),
        type: 'webhook.test',
        source: 'webhook-system',
        timestamp: new Date(),
        data: { message: 'This is a test webhook delivery' },
        metadata: { test: true },
        version: '1.0'
      };

      const startTime = Date.now();
      const result = await this.deliverWebhook(webhook, testEvent, 1);
      const responseTime = Date.now() - startTime;

      return {
        success: result.status === 'success',
        statusCode: result.httpStatusCode,
        responseTime,
        errorMessage: result.errorMessage
      };
    } catch (error) {
      console.error('Failed to test webhook:', error);
      return {
        success: false,
        responseTime: 0,
        errorMessage: error.message
      };
    }
  }

  /**
   * Validate webhook signature
   */
  validateSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = this.generateSignature(payload, secret);
      return this.secureCompare(signature, expectedSignature);
    } catch (error) {
      console.error('Failed to validate webhook signature:', error);
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private generateSecret(): string {
    return randomBytes(32).toString('hex');
  }

  private generateSignature(payload: string, secret: string): string {
    const hmac = createHmac(this.signatureConfig.algorithm, secret);
    hmac.update(payload);
    const signature = hmac.digest(this.signatureConfig.format);
    return `${this.signatureConfig.algorithm}=${signature}`;
  }

  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  private matchesFilter(event: WebhookEvent, filterExpression?: string): boolean {
    if (!filterExpression) {
      return true;
    }

    try {
      // Simplified filter matching - in production, use JSONPath library
      return true;
    } catch (error) {
      console.error('Failed to evaluate filter expression:', error);
      return false;
    }
  }

  private startEventProcessor(): void {
    setInterval(async () => {
      if (this.processing || this.eventQueue.length === 0) {
        return;
      }

      this.processing = true;
      
      try {
        const batch = this.eventQueue.splice(0, 10); // Process 10 events at a time
        
        for (const { event, endpoints } of batch) {
          for (const webhookId of endpoints) {
            const webhook = this.endpoints.get(webhookId);
            if (webhook && webhook.enabled) {
              const delivery: WebhookDelivery = {
                id: randomBytes(16).toString('hex'),
                webhookId,
                eventId: event.id,
                attempt: 1,
                status: 'pending',
                duration: 0,
                scheduledAt: new Date()
              };

              this.deliveryQueue.push(delivery);
            }
          }
        }
      } catch (error) {
        console.error('Event processing error:', error);
      } finally {
        this.processing = false;
      }
    }, 1000); // Process every second
  }

  private startDeliveryProcessor(): void {
    setInterval(async () => {
      const pendingDeliveries = this.deliveryQueue.filter(d => 
        d.status === 'pending' && d.scheduledAt <= new Date()
      );

      for (const delivery of pendingDeliveries.slice(0, 5)) { // Process 5 deliveries at a time
        await this.processDelivery(delivery);
      }
    }, 2000); // Process every 2 seconds
  }

  private startRetryProcessor(): void {
    setInterval(async () => {
      const retryDeliveries = this.deliveryQueue.filter(d => 
        d.status === 'failed' && 
        d.nextRetryAt && 
        d.nextRetryAt <= new Date()
      );

      for (const delivery of retryDeliveries) {
        await this.processDelivery(delivery);
      }
    }, 5000); // Check for retries every 5 seconds
  }

  private async processDelivery(delivery: WebhookDelivery): Promise<void> {
    try {
      const webhook = this.endpoints.get(delivery.webhookId);
      if (!webhook) {
        delivery.status = 'cancelled';
        delivery.errorMessage = 'Webhook endpoint not found';
        return;
      }

      const event = await this.getWebhookEvent(delivery.eventId);
      if (!event) {
        delivery.status = 'cancelled';
        delivery.errorMessage = 'Event not found';
        return;
      }

      delivery.status = 'pending';
      const result = await this.deliverWebhook(webhook, event, delivery.attempt);
      
      // Update delivery record
      delivery.status = result.status;
      delivery.httpStatusCode = result.httpStatusCode;
      delivery.responseBody = result.responseBody;
      delivery.responseHeaders = result.responseHeaders;
      delivery.duration = result.duration;
      delivery.errorMessage = result.errorMessage;
      delivery.deliveredAt = new Date();

      // Update webhook statistics
      webhook.totalDeliveries++;
      webhook.lastDelivery = new Date();
      
      if (result.status === 'success') {
        webhook.successfulDeliveries++;
      } else {
        webhook.failedDeliveries++;
        
        // Schedule retry if configured and not exceeded max retries
        if (delivery.attempt < webhook.retryPolicy.maxRetries) {
          const nextDelay = this.calculateRetryDelay(webhook.retryPolicy, delivery.attempt);
          delivery.nextRetryAt = new Date(Date.now() + nextDelay);
          delivery.attempt++;
          delivery.status = 'failed';
        }
      }

      // Store delivery result
      await this.storeDeliveryResult(delivery);

    } catch (error) {
      console.error('Failed to process delivery:', error);
      delivery.status = 'failed';
      delivery.errorMessage = error.message;
    }
  }

  private async deliverWebhook(webhook: WebhookEndpoint, event: WebhookEvent, attempt: number): Promise<{
    status: 'success' | 'failed';
    httpStatusCode?: number;
    responseBody?: string;
    responseHeaders?: Record<string, string>;
    duration: number;
    errorMessage?: string;
  }> {
    const startTime = Date.now();

    try {
      const payload = JSON.stringify({
        id: event.id,
        type: event.type,
        source: event.source,
        timestamp: event.timestamp.toISOString(),
        data: event.data,
        metadata: {
          ...event.metadata,
          attempt,
          delivery_id: randomBytes(8).toString('hex')
        },
        version: event.version
      });

      const signature = this.generateSignature(payload, webhook.secret);
      
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Zenith-Webhooks/1.0',
        [this.signatureConfig.header]: signature,
        'X-Webhook-Event-Type': event.type,
        'X-Webhook-Event-Id': event.id,
        'X-Webhook-Attempt': attempt.toString(),
        'X-Webhook-Timestamp': event.timestamp.getTime().toString(),
        ...webhook.headers
      };

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payload,
        signal: AbortSignal.timeout(webhook.timeout)
      });

      const duration = Date.now() - startTime;
      const responseBody = await response.text();
      const responseHeaders = Object.fromEntries(response.headers.entries());

      if (response.ok) {
        return {
          status: 'success',
          httpStatusCode: response.status,
          responseBody,
          responseHeaders,
          duration
        };
      } else {
        return {
          status: 'failed',
          httpStatusCode: response.status,
          responseBody,
          responseHeaders,
          duration,
          errorMessage: `HTTP ${response.status}: ${response.statusText}`
        };
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        status: 'failed',
        duration,
        errorMessage: error.message
      };
    }
  }

  private calculateRetryDelay(retryPolicy: WebhookEndpoint['retryPolicy'], attempt: number): number {
    switch (retryPolicy.backoffType) {
      case 'linear':
        return Math.min(retryPolicy.initialDelay * attempt, retryPolicy.maxDelay);
      case 'exponential':
        const multiplier = retryPolicy.multiplier || 2;
        return Math.min(retryPolicy.initialDelay * Math.pow(multiplier, attempt - 1), retryPolicy.maxDelay);
      case 'fixed':
      default:
        return retryPolicy.initialDelay;
    }
  }

  private async loadWebhookEndpoints(): Promise<void> {
    try {
      // Load webhooks from database
      const webhooks = await this.getStoredWebhooks();
      webhooks.forEach(webhook => {
        this.endpoints.set(webhook.id, webhook);
      });
    } catch (error) {
      console.error('Failed to load webhook endpoints:', error);
    }
  }

  // Database operations (simplified - would use actual database calls)
  private async storeWebhookEndpoint(webhook: WebhookEndpoint): Promise<void> {
    await prisma.systemMetrics.create({
      data: {
        type: 'webhook_endpoint',
        value: webhook.enabled ? 1 : 0,
        metadata: JSON.stringify(webhook)
      }
    });
  }

  private async updateWebhookEndpoint(webhookId: string, webhook: WebhookEndpoint): Promise<void> {
    // Update in database
  }

  private async deleteWebhookEndpoint(webhookId: string): Promise<void> {
    // Delete from database
  }

  private async storeWebhookEvent(event: WebhookEvent): Promise<void> {
    await prisma.systemMetrics.create({
      data: {
        type: 'webhook_event',
        value: 1,
        metadata: JSON.stringify(event)
      }
    });
  }

  private async storeDeliveryResult(delivery: WebhookDelivery): Promise<void> {
    await prisma.systemMetrics.create({
      data: {
        type: 'webhook_delivery',
        value: delivery.status === 'success' ? 1 : 0,
        metadata: JSON.stringify(delivery)
      }
    });
  }

  private async getStoredWebhooks(): Promise<WebhookEndpoint[]> {
    // Retrieve from database
    return [];
  }

  private async getWebhookEvent(eventId: string): Promise<WebhookEvent | null> {
    // Retrieve from database or cache
    return null;
  }

  private async logWebhookActivity(activity: string, data: any): Promise<void> {
    await prisma.systemMetrics.create({
      data: {
        type: 'webhook_activity',
        value: 1,
        metadata: JSON.stringify({ activity, ...data })
      }
    });
  }
}

// Export singleton instance
export const enterpriseWebhooks = new EnterpriseWebhookSystem();