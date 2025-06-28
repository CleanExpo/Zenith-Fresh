import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLogger, AuditEventType } from '@/lib/audit/audit-logger';

const HUBSPOT_AUTH_URL = 'https://app.hubspot.com/oauth/authorize';
const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      // Start OAuth flow
      const clientId = process.env.HUBSPOT_CLIENT_ID;
      const redirectUri = process.env.HUBSPOT_REDIRECT_URI;
      
      if (!clientId || !redirectUri) {
        return NextResponse.json(
          { error: 'HubSpot OAuth not configured' },
          { status: 500 }
        );
      }

      const authUrl = new URL(HUBSPOT_AUTH_URL);
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'contacts content forms oauth');
      authUrl.searchParams.set('state', session.user.id);

      return NextResponse.redirect(authUrl.toString());
    }

    // Handle OAuth callback
    if (state !== session.user.id) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    const redirectUri = process.env.HUBSPOT_REDIRECT_URI;

    // Exchange code for tokens
    const tokenResponse = await fetch(HUBSPOT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri!,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('HubSpot token exchange failed:', tokenData);
      return NextResponse.json(
        { error: 'Failed to exchange code for tokens' },
        { status: 400 }
      );
    }

    // Get account info from HubSpot
    const accountResponse = await fetch('https://api.hubapi.com/oauth/v1/access-tokens/' + tokenData.access_token, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const accountData = await accountResponse.json();

    // Store integration credentials securely
    await prisma.integrationCredential.upsert({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: 'hubspot',
        },
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        instanceUrl: 'https://api.hubapi.com',
        metadata: {
          hubId: accountData.hub_id,
          hubDomain: accountData.hub_domain,
          scopes: accountData.scopes,
          tokenType: tokenData.token_type,
          user: accountData.user,
        },
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        provider: 'hubspot',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        instanceUrl: 'https://api.hubapi.com',
        expiresAt: new Date(Date.now() + (tokenData.expires_in || 21600) * 1000),
        metadata: {
          hubId: accountData.hub_id,
          hubDomain: accountData.hub_domain,
          scopes: accountData.scopes,
          tokenType: tokenData.token_type,
          user: accountData.user,
        },
      },
    });

    // Log the integration
    await auditLogger.log({
      userId: session.user.id,
      action: 'INTEGRATION_CONNECTED',
      resource: 'hubspot',
      details: {
        provider: 'hubspot',
        hubId: accountData.hub_id,
        hubDomain: accountData.hub_domain,
      },
    });

    // Redirect to integrations page with success
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?connected=hubspot`
    );
  } catch (error) {
    console.error('HubSpot OAuth error:', error);
    return NextResponse.json(
      { error: 'OAuth flow failed' },
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

    // Remove HubSpot integration
    await prisma.integrationCredential.deleteMany({
      where: {
        userId: session.user.id,
        provider: 'hubspot',
      },
    });

    await auditLogger.log({
      userId: session.user.id,
      action: 'INTEGRATION_DISCONNECTED',
      resource: 'hubspot',
      details: { provider: 'hubspot' },
    });

    return NextResponse.json({ success: true, message: 'HubSpot integration disconnected' });
  } catch (error) {
    console.error('Failed to disconnect HubSpot:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}