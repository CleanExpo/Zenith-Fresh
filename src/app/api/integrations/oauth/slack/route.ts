import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLogger } from '@/lib/audit/audit-logger';

const SLACK_AUTH_URL = 'https://slack.com/oauth/v2/authorize';
const SLACK_TOKEN_URL = 'https://slack.com/api/oauth.v2.access';

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
      const clientId = process.env.SLACK_CLIENT_ID;
      
      if (!clientId) {
        return NextResponse.json(
          { error: 'Slack OAuth not configured' },
          { status: 500 }
        );
      }

      const authUrl = new URL(SLACK_AUTH_URL);
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('scope', 'chat:write,channels:read,users:read');
      authUrl.searchParams.set('state', session.user.id);
      authUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/integrations/oauth/slack`);

      return NextResponse.redirect(authUrl.toString());
    }

    // Handle OAuth callback
    if (state !== session.user.id) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;

    // Exchange code for tokens
    const tokenResponse = await fetch(SLACK_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/oauth/slack`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.ok) {
      console.error('Slack token exchange failed:', tokenData);
      return NextResponse.json(
        { error: 'Failed to exchange code for tokens' },
        { status: 400 }
      );
    }

    // Store integration credentials securely
    await prisma.integrationCredential.upsert({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: 'slack',
        },
      },
      update: {
        accessToken: tokenData.access_token,
        instanceUrl: 'https://slack.com/api',
        metadata: {
          team: tokenData.team,
          scope: tokenData.scope,
          botUserId: tokenData.bot_user_id,
          appId: tokenData.app_id,
        },
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        provider: 'slack',
        accessToken: tokenData.access_token,
        instanceUrl: 'https://slack.com/api',
        metadata: {
          team: tokenData.team,
          scope: tokenData.scope,
          botUserId: tokenData.bot_user_id,
          appId: tokenData.app_id,
        },
      },
    });

    // Log the integration
    await auditLogger.log({
      userId: session.user.id,
      action: 'INTEGRATION_CONNECTED',
      resource: 'slack',
      details: {
        provider: 'slack',
        teamId: tokenData.team.id,
        teamName: tokenData.team.name,
      },
    });

    // Redirect to integrations page with success
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?connected=slack`
    );
  } catch (error) {
    console.error('Slack OAuth error:', error);
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

    // Remove Slack integration
    await prisma.integrationCredential.deleteMany({
      where: {
        userId: session.user.id,
        provider: 'slack',
      },
    });

    await auditLogger.log({
      userId: session.user.id,
      action: 'INTEGRATION_DISCONNECTED',
      resource: 'slack',
      details: { provider: 'slack' },
    });

    return NextResponse.json({ success: true, message: 'Slack integration disconnected' });
  } catch (error) {
    console.error('Failed to disconnect Slack:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}