import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { createHmac } from 'crypto';

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  tenantId: string;
  resourceId?: string;
  resourceType?: string;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  tenantId: string;
  filters?: Record<string, any>;
  retryConfig: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffSeconds: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDelivery {
  id: string;
  subscriptionId: string;
  eventId: string;
  status: 'pending' | 'success' | 'failed' | 'retry';
  attempts: number;
  lastAttemptAt?: Date;
  nextAttemptAt?: Date;
  response?: {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  };
  error?: string;
}

export class WebhookManager {
  static async createSubscription(data: {
    url: string;
    events: string[];
    tenantId: string;
    secret?: string;
    filters?: Record<string, any>;
    retryConfig?: {
      maxRetries: number;
      backoffMultiplier: number;
      maxBackoffSeconds: number;
    };
  }): Promise<WebhookSubscription> {
    const secret = data.secret || this.generateSecret();
    
    const subscription = await prisma.webhookSubscription.create({
      data: {
        id: randomUUID(),
        url: data.url,
        events: data.events,
        tenantId: data.tenantId,
        secret,
        active: true,
        filters: data.filters || {},
        retryConfig: data.retryConfig || {
          maxRetries: 3,
          backoffMultiplier: 2,
          maxBackoffSeconds: 300,
        },
      },
    });

    return subscription;
  }

  static async getSubscription(id: string, tenantId: string): Promise<WebhookSubscription | null> {
    return prisma.webhookSubscription.findFirst({
      where: { id, tenantId },
    });
  }

  static async listSubscriptions(tenantId: string): Promise<WebhookSubscription[]> {
    return prisma.webhookSubscription.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateSubscription(
    id: string,
    tenantId: string,
    data: Partial<{
      url: string;
      events: string[];
      active: boolean;
      filters: Record<string, any>;
    }>
  ): Promise<WebhookSubscription> {
    return prisma.webhookSubscription.update({
      where: { id, tenantId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  static async deleteSubscription(id: string, tenantId: string): Promise<void> {
    await prisma.webhookSubscription.delete({
      where: { id, tenantId },
    });
  }

  static async validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    const expectedSignature = this.generateSignature(payload, secret);
    return signature === expectedSignature;
  }

  private static generateSecret(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  private static generateSignature(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }
}

export class WebhookEventManager {
  static async createEvent(data: {
    type: string;
    data: any;
    tenantId: string;
    resourceId?: string;
    resourceType?: string;
  }): Promise<WebhookEvent> {
    const event = await prisma.webhookEvent.create({
      data: {
        id: randomUUID(),
        type: data.type,
        data: data.data,
        tenantId: data.tenantId,
        resourceId: data.resourceId,
        resourceType: data.resourceType,
        timestamp: new Date(),
      },
    });

    // Trigger webhook deliveries
    await this.triggerWebhooks(event);

    return event;
  }

  private static async triggerWebhooks(event: WebhookEvent): Promise<void> {
    const subscriptions = await prisma.webhookSubscription.findMany({
      where: {
        tenantId: event.tenantId,
        active: true,
        events: { has: event.type },
      },
    });

    const deliveries = subscriptions
      .filter(sub => this.matchesFilters(event, sub.filters))
      .map(sub => ({
        id: randomUUID(),
        subscriptionId: sub.id,
        eventId: event.id,
        status: 'pending' as const,
        attempts: 0,
        nextAttemptAt: new Date(),
      }));

    if (deliveries.length > 0) {
      await prisma.webhookDelivery.createMany({
        data: deliveries,
      });

      // Process deliveries immediately
      for (const delivery of deliveries) {
        await this.processDelivery(delivery.id);
      }
    }
  }

  private static matchesFilters(event: WebhookEvent, filters?: Record<string, any>): boolean {
    if (!filters || Object.keys(filters).length === 0) {
      return true;
    }

    // Simple filter matching - can be extended for complex queries
    for (const [key, value] of Object.entries(filters)) {
      if (event.data[key] !== value) {
        return false;
      }
    }

    return true;
  }

  static async processDelivery(deliveryId: string): Promise<void> {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        subscription: true,
        event: true,
      },
    });

    if (!delivery || !delivery.subscription || !delivery.event) {
      return;
    }

    const { subscription, event } = delivery;

    try {
      const payload = JSON.stringify({
        id: event.id,
        type: event.type,
        data: event.data,
        timestamp: event.timestamp,
        resourceId: event.resourceId,
        resourceType: event.resourceType,
      });

      const signature = createHmac('sha256', subscription.secret)
        .update(payload)
        .digest('hex');

      const response = await fetch(subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event.type,
          'X-Webhook-ID': event.id,
          'User-Agent': 'Zenith-Webhooks/1.0',
        },
        body: payload,
      });

      const responseBody = await response.text();

      if (response.ok) {
        // Success
        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'success',
            attempts: delivery.attempts + 1,
            lastAttemptAt: new Date(),
            response: {
              statusCode: response.status,
              headers: Object.fromEntries(response.headers.entries()),
              body: responseBody,
            },
          },
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${responseBody}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const attempts = delivery.attempts + 1;
      const maxRetries = subscription.retryConfig.maxRetries;

      if (attempts < maxRetries) {
        // Schedule retry
        const backoffSeconds = Math.min(
          Math.pow(subscription.retryConfig.backoffMultiplier, attempts - 1),
          subscription.retryConfig.maxBackoffSeconds
        );
        const nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000);

        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'retry',
            attempts,
            lastAttemptAt: new Date(),
            nextAttemptAt,
            error: errorMessage,
          },
        });

        // Schedule retry (in production, use a proper queue system)
        setTimeout(() => {
          this.processDelivery(deliveryId);
        }, backoffSeconds * 1000);
      } else {
        // Max retries exceeded
        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'failed',
            attempts,
            lastAttemptAt: new Date(),
            error: errorMessage,
          },
        });
      }
    }
  }

  static async retryFailedDeliveries(): Promise<void> {
    const failedDeliveries = await prisma.webhookDelivery.findMany({
      where: {
        status: 'retry',
        nextAttemptAt: { lte: new Date() },
      },
      include: {
        subscription: true,
      },
    });

    for (const delivery of failedDeliveries) {
      if (delivery.subscription?.active) {
        await this.processDelivery(delivery.id);
      }
    }
  }

  static async getDeliveryHistory(
    subscriptionId: string,
    tenantId: string,
    limit: number = 50
  ): Promise<WebhookDelivery[]> {
    return prisma.webhookDelivery.findMany({
      where: {
        subscriptionId,
        subscription: { tenantId },
      },
      include: {
        event: true,
      },
      orderBy: { lastAttemptAt: 'desc' },
      take: limit,
    });
  }
}

// Common webhook events
export class WebhookEvents {
  // User events
  static async userCreated(tenantId: string, user: any): Promise<void> {
    await WebhookEventManager.createEvent({
      type: 'user.created',
      data: user,
      tenantId,
      resourceId: user.id,
      resourceType: 'user',
    });
  }

  static async userUpdated(tenantId: string, user: any): Promise<void> {
    await WebhookEventManager.createEvent({
      type: 'user.updated',
      data: user,
      tenantId,
      resourceId: user.id,
      resourceType: 'user',
    });
  }

  static async userDeleted(tenantId: string, userId: string): Promise<void> {
    await WebhookEventManager.createEvent({
      type: 'user.deleted',
      data: { id: userId },
      tenantId,
      resourceId: userId,
      resourceType: 'user',
    });
  }

  // Project events
  static async projectCreated(tenantId: string, project: any): Promise<void> {
    await WebhookEventManager.createEvent({
      type: 'project.created',
      data: project,
      tenantId,
      resourceId: project.id,
      resourceType: 'project',
    });
  }

  static async projectUpdated(tenantId: string, project: any): Promise<void> {
    await WebhookEventManager.createEvent({
      type: 'project.updated',
      data: project,
      tenantId,
      resourceId: project.id,
      resourceType: 'project',
    });
  }

  static async projectDeleted(tenantId: string, projectId: string): Promise<void> {
    await WebhookEventManager.createEvent({
      type: 'project.deleted',
      data: { id: projectId },
      tenantId,
      resourceId: projectId,
      resourceType: 'project',
    });
  }

  // Team events
  static async teamMemberAdded(tenantId: string, data: { teamId: string; userId: string; role: string }): Promise<void> {
    await WebhookEventManager.createEvent({
      type: 'team.member_added',
      data,
      tenantId,
      resourceId: data.teamId,
      resourceType: 'team',
    });
  }

  static async teamMemberRemoved(tenantId: string, data: { teamId: string; userId: string }): Promise<void> {
    await WebhookEventManager.createEvent({
      type: 'team.member_removed',
      data,
      tenantId,
      resourceId: data.teamId,
      resourceType: 'team',
    });
  }

  // Subscription events
  static async subscriptionCreated(tenantId: string, subscription: any): Promise<void> {
    await WebhookEventManager.createEvent({
      type: 'subscription.created',
      data: subscription,
      tenantId,
      resourceId: subscription.id,
      resourceType: 'subscription',
    });
  }

  static async subscriptionUpdated(tenantId: string, subscription: any): Promise<void> {
    await WebhookEventManager.createEvent({
      type: 'subscription.updated',
      data: subscription,
      tenantId,
      resourceId: subscription.id,
      resourceType: 'subscription',
    });
  }

  static async subscriptionCancelled(tenantId: string, subscriptionId: string): Promise<void> {
    await WebhookEventManager.createEvent({
      type: 'subscription.cancelled',
      data: { id: subscriptionId },
      tenantId,
      resourceId: subscriptionId,
      resourceType: 'subscription',
    });
  }
}