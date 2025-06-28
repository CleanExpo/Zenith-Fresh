import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLogger, AuditEventType } from '@/lib/audit/audit-logger';

const SALESFORCE_AUTH_URL = 'https://login.salesforce.com/services/oauth2/authorize';
const SALESFORCE_TOKEN_URL = 'https://login.salesforce.com/services/oauth2/token';

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
      const clientId = process.env.SALESFORCE_CLIENT_ID;
      const redirectUri = process.env.SALESFORCE_REDIRECT_URI;
      
      if (!clientId || !redirectUri) {
        return NextResponse.json(
          { error: 'Salesforce OAuth not configured' },
          { status: 500 }
        );
      }

      const authUrl = new URL(SALESFORCE_AUTH_URL);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'api refresh_token');
      authUrl.searchParams.set('state', session.user.id);

      return NextResponse.redirect(authUrl.toString());
    }

    // Handle OAuth callback
    if (state !== session.user.id) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const redirectUri = process.env.SALESFORCE_REDIRECT_URI;

    // Exchange code for tokens
    const tokenResponse = await fetch(SALESFORCE_TOKEN_URL, {
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
      console.error('Salesforce token exchange failed:', tokenData);
      return NextResponse.json(
        { error: 'Failed to exchange code for tokens' },
        { status: 400 }
      );
    }

    // Get user info from Salesforce
    const userResponse = await fetch(`${tokenData.instance_url}/services/oauth2/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    // Store integration credentials securely
    await prisma.integrationCredential.upsert({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: 'salesforce',
        },
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        instanceUrl: tokenData.instance_url,
        metadata: {
          user: userData,
          scope: tokenData.scope,
          tokenType: tokenData.token_type,
        },
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        provider: 'salesforce',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        instanceUrl: tokenData.instance_url,
        expiresAt: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000),
        metadata: {
          user: userData,
          scope: tokenData.scope,
          tokenType: tokenData.token_type,
        },
      },
    });

    // Log the integration
    await auditLogger.log({
      userId: session.user.id,
      action: 'INTEGRATION_CONNECTED',
      resource: 'salesforce',
      details: {
        provider: 'salesforce',
        organizationId: userData.organization_id,
        username: userData.preferred_username,
      },
    });

    // Redirect to integrations page with success
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?connected=salesforce`
    );
  } catch (error) {
    console.error('Salesforce OAuth error:', error);
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

    // Remove Salesforce integration
    await prisma.integrationCredential.deleteMany({
      where: {
        userId: session.user.id,
        provider: 'salesforce',
      },
    });

    await auditLogger.log({
      userId: session.user.id,
      action: 'INTEGRATION_DISCONNECTED',
      resource: 'salesforce',
      details: { provider: 'salesforce' },
    });

    return NextResponse.json({ success: true, message: 'Salesforce integration disconnected' });
  } catch (error) {
    console.error('Failed to disconnect Salesforce:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}