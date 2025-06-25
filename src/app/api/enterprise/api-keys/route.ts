import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ApiKeyManager, RateLimiter } from '@/lib/api/api-management';

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

    const apiKeys = await ApiKeyManager.listApiKeys(tenantId);
    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error('API keys list error:', error);
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
    const { name, tenantId, scope, rateLimit, rateLimitWindow, expiresAt } = body;

    if (!name || !tenantId || !scope) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = await ApiKeyManager.createApiKey({
      name,
      tenantId,
      scope,
      rateLimit,
      rateLimitWindow,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error('API key creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keyId = request.nextUrl.searchParams.get('keyId');
    const tenantId = request.nextUrl.searchParams.get('tenantId');

    if (!keyId || !tenantId) {
      return NextResponse.json({ error: 'Key ID and Tenant ID required' }, { status: 400 });
    }

    await ApiKeyManager.revokeApiKey(keyId, tenantId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API key revocation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}