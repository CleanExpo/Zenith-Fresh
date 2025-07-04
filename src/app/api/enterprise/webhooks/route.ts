import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WebhookManager, WebhookEventManager } from '@/lib/webhooks/webhook-system';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = request.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const subscriptions = await WebhookManager.listSubscriptions(tenantId);
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Webhook list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, events, tenantId, secret, filters, retryConfig } = body;

    if (!url || !events || !tenantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const subscription = await WebhookManager.createSubscription({
      url,
      events,
      tenantId,
      secret,
      filters,
      retryConfig,
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Webhook creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, tenantId, ...updateData } = body;

    if (!id || !tenantId) {
      return NextResponse.json({ error: 'ID and Tenant ID required' }, { status: 400 });
    }

    const subscription = await WebhookManager.updateSubscription(id, tenantId, updateData);
    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Webhook update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    const tenantId = request.nextUrl.searchParams.get('tenantId');

    if (!id || !tenantId) {
      return NextResponse.json({ error: 'ID and Tenant ID required' }, { status: 400 });
    }

    await WebhookManager.deleteSubscription(id, tenantId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}