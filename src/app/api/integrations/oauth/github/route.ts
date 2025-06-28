import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLogger } from '@/lib/audit/audit-logger';

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

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
      const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
      
      if (!clientId) {
        return NextResponse.json(
          { error: 'GitHub OAuth not configured' },
          { status: 500 }
        );
      }

      const authUrl = new URL(GITHUB_AUTH_URL);
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('scope', 'repo,user,admin:repo_hook');
      authUrl.searchParams.set('state', session.user.id);
      authUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/integrations/oauth/github`);

      return NextResponse.redirect(authUrl.toString());
    }

    // Handle OAuth callback
    if (state !== session.user.id) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

    // Exchange code for tokens
    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/oauth/github`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error('GitHub token exchange failed:', tokenData);
      return NextResponse.json(
        { error: 'Failed to exchange code for tokens' },
        { status: 400 }
      );
    }

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
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
          provider: 'github',
        },
      },
      update: {
        accessToken: tokenData.access_token,
        instanceUrl: 'https://api.github.com',
        metadata: {
          user: userData,
          scope: tokenData.scope,
          tokenType: tokenData.token_type,
        },
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        provider: 'github',
        accessToken: tokenData.access_token,
        instanceUrl: 'https://api.github.com',
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
      resource: 'github',
      details: {
        provider: 'github',
        username: userData.login,
        userId: userData.id,
      },
    });

    // Redirect to integrations page with success
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?connected=github`
    );
  } catch (error) {
    console.error('GitHub OAuth error:', error);
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

    // Remove GitHub integration
    await prisma.integrationCredential.deleteMany({
      where: {
        userId: session.user.id,
        provider: 'github',
      },
    });

    await auditLogger.log({
      userId: session.user.id,
      action: 'INTEGRATION_DISCONNECTED',
      resource: 'github',
      details: { provider: 'github' },
    });

    return NextResponse.json({ success: true, message: 'GitHub integration disconnected' });
  } catch (error) {
    console.error('Failed to disconnect GitHub:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}