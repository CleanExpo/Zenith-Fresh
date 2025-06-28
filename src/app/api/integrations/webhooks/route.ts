import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLogger } from '@/lib/audit/audit-logger';
import { randomBytes, createHmac } from 'crypto';

interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  deliveries: number;
  lastDelivery?: string;
  userId: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's webhook subscriptions
    const webhooks = await prisma.webhookSubscription.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        deliveries: true,
        lastDelivery: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      webhooks: webhooks.map(webhook => ({
        ...webhook,
        events: Array.isArray(webhook.events) ? webhook.events : JSON.parse(webhook.events as string),
      })),
    });
  } catch (error) {
    console.error('Failed to get webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve webhooks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, events, active = true } = await request.json();

    if (!url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'URL and events array are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Generate webhook secret
    const secret = randomBytes(32).toString('hex');

    // Create webhook subscription
    const webhook = await prisma.webhookSubscription.create({
      data: {
        userId: session.user.id,
        url,
        events: JSON.stringify(events),
        active,
        secret,
        deliveries: 0,
      },
    });

    await auditLogger.log({
      userId: session.user.id,
      action: 'WEBHOOK_CREATED',
      resource: 'webhook',
      details: {
        webhookId: webhook.id,
        url,
        events,
      },
    });

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: JSON.parse(webhook.events),
        active: webhook.active,
        secret: webhook.secret,
        deliveries: webhook.deliveries,
        createdAt: webhook.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to create webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, url, events, active } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    // Check if webhook belongs to user
    const existingWebhook = await prisma.webhookSubscription.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingWebhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Update webhook
    const updatedWebhook = await prisma.webhookSubscription.update({
      where: { id },
      data: {
        ...(url && { url }),
        ...(events && { events: JSON.stringify(events) }),
        ...(active !== undefined && { active }),
        updatedAt: new Date(),
      },
    });

    await auditLogger.log({
      userId: session.user.id,
      action: 'WEBHOOK_UPDATED',
      resource: 'webhook',
      details: {
        webhookId: id,
        changes: { url, events, active },
      },
    });

    return NextResponse.json({
      success: true,
      webhook: {
        id: updatedWebhook.id,
        url: updatedWebhook.url,
        events: JSON.parse(updatedWebhook.events),
        active: updatedWebhook.active,
        deliveries: updatedWebhook.deliveries,
        lastDelivery: updatedWebhook.lastDelivery,
        updatedAt: updatedWebhook.updatedAt,
      },
    });
  } catch (error) {
    console.error('Failed to update webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    // Check if webhook belongs to user
    const existingWebhook = await prisma.webhookSubscription.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingWebhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Delete webhook
    await prisma.webhookSubscription.delete({
      where: { id },
    });

    await auditLogger.log({
      userId: session.user.id,
      action: 'WEBHOOK_DELETED',
      resource: 'webhook',
      details: {
        webhookId: id,
        url: existingWebhook.url,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}