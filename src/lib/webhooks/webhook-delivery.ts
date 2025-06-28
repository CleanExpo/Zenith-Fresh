import { createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';

export interface WebhookEvent {
  type: string;
  data: any;
  userId: string;
  timestamp: string;
  id: string;
}

export interface WebhookDeliveryResult {
  success: boolean;
  status?: number;
  error?: string;
  duration: number;
}

class WebhookDeliveryService {
  async deliverWebhook(
    webhookId: string,
    event: WebhookEvent
  ): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();

    try {
      // Get webhook subscription
      const webhook = await prisma.webhookSubscription.findUnique({
        where: { id: webhookId },
      });

      if (!webhook || !webhook.active) {
        return {
          success: false,
          error: 'Webhook not found or inactive',
          duration: Date.now() - startTime,
        };
      }

      // Check if webhook should receive this event type
      const events = JSON.parse(webhook.events);
      if (!events.includes(event.type)) {
        return {
          success: true, // Not an error, just not subscribed
          duration: Date.now() - startTime,
        };
      }

      // Create webhook signature
      const signature = this.createSignature(event, webhook.secret);

      // Prepare payload
      const payload = {
        id: event.id,
        type: event.type,
        data: event.data,
        timestamp: event.timestamp,
        user_id: event.userId,
      };

      // Deliver webhook
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event.type,
          'X-Webhook-ID': event.id,
          'User-Agent': 'Zenith-Webhooks/1.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const duration = Date.now() - startTime;

      // Update delivery count
      await prisma.webhookSubscription.update({
        where: { id: webhookId },
        data: {
          deliveries: { increment: 1 },
          lastDelivery: new Date(),
        },
      });

      // Log delivery attempt
      await this.logDeliveryAttempt(webhookId, event, {
        success: response.ok,
        status: response.status,
        duration,
      });

      return {
        success: response.ok,
        status: response.status,
        duration,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed delivery
      await this.logDeliveryAttempt(webhookId, event, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      };
    }
  }

  async deliverToAllSubscribers(event: WebhookEvent): Promise<void> {
    try {
      // Get all active webhooks for this user that subscribe to this event type
      const webhooks = await prisma.webhookSubscription.findMany({
        where: {
          userId: event.userId,
          active: true,
        },
      });

      const filteredWebhooks = webhooks.filter(webhook => {
        const events = JSON.parse(webhook.events);
        return events.includes(event.type);
      });

      // Deliver to all webhooks in parallel
      const deliveryPromises = filteredWebhooks.map(webhook =>
        this.deliverWebhook(webhook.id, event)
      );

      await Promise.allSettled(deliveryPromises);
    } catch (error) {
      console.error('Failed to deliver webhooks:', error);
    }
  }

  private createSignature(event: WebhookEvent, secret: string): string {
    const payload = JSON.stringify({
      id: event.id,
      type: event.type,
      data: event.data,
      timestamp: event.timestamp,
      user_id: event.userId,
    });

    return 'sha256=' + createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  private async logDeliveryAttempt(
    webhookId: string,
    event: WebhookEvent,
    result: Partial<WebhookDeliveryResult>
  ): Promise<void> {
    try {
      await prisma.webhookDeliveryLog.create({
        data: {
          webhookId,
          eventType: event.type,
          eventId: event.id,
          status: result.success ? 'success' : 'failed',
          httpStatus: result.status,
          error: result.error,
          duration: result.duration || 0,
          deliveredAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to log webhook delivery:', error);
    }
  }

  // Webhook event helpers
  static createEvent(type: string, data: any, userId: string): WebhookEvent {
    return {
      type,
      data,
      userId,
      timestamp: new Date().toISOString(),
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  // Common event types
  static events = {
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    PROJECT_CREATED: 'project.created',
    PROJECT_UPDATED: 'project.updated',
    PROJECT_DELETED: 'project.deleted',
    TEAM_MEMBER_ADDED: 'team.member_added',
    TEAM_MEMBER_REMOVED: 'team.member_removed',
    INTEGRATION_CONNECTED: 'integration.connected',
    INTEGRATION_DISCONNECTED: 'integration.disconnected',
    ANALYSIS_COMPLETED: 'analysis.completed',
    SCAN_SCHEDULED: 'scan.scheduled',
    SCAN_COMPLETED: 'scan.completed',
  };
}

export const webhookDelivery = new WebhookDeliveryService();

// Helper function to trigger webhooks
export async function triggerWebhook(
  type: string,
  data: any,
  userId: string
): Promise<void> {
  const event = WebhookDeliveryService.createEvent(type, data, userId);
  await webhookDelivery.deliverToAllSubscribers(event);
}