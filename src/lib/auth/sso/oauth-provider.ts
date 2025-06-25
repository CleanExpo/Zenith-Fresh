import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export interface OAuthConfig {
  provider: 'google_workspace' | 'microsoft' | 'okta' | 'auth0' | 'custom';
  clientId: string;
  clientSecret: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  scope?: string[];
  domain?: string; // For domain-restricted sign-ins
  customFields?: Record<string, any>;
}

export interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
  domain?: string;
  metadata?: Record<string, any>;
}

export class OAuthProvider {
  private config: OAuthConfig;
  private tenantId: string;

  constructor(tenantId: string, config: OAuthConfig) {
    this.tenantId = tenantId;
    this.config = config;
  }

  public async getAuthorizationUrl(state: string, redirectUri: string): Promise<string> {
    const baseUrl = this.getAuthorizationEndpoint();
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: this.getScope(),
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    // Add domain hint for Google Workspace
    if (this.config.provider === 'google_workspace' && this.config.domain) {
      params.append('hd', this.config.domain);
    }

    // Add domain hint for Microsoft
    if (this.config.provider === 'microsoft' && this.config.domain) {
      params.append('domain_hint', this.config.domain);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  public async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
    const tokenUrl = this.getTokenEndpoint();
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return response.json();
  }

  public async getUserProfile(accessToken: string): Promise<OAuthProfile> {
    const userInfoUrl = this.getUserInfoEndpoint();
    
    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = await response.json();
    return this.mapProfile(profile);
  }

  private mapProfile(profile: any): OAuthProfile {
    switch (this.config.provider) {
      case 'google_workspace':
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          emailVerified: profile.email_verified,
          domain: profile.hd,
          metadata: profile,
        };
      
      case 'microsoft':
        return {
          id: profile.id,
          email: profile.mail || profile.userPrincipalName,
          name: profile.displayName,
          picture: profile.photo?.$value,
          emailVerified: true,
          domain: profile.mail?.split('@')[1],
          metadata: profile,
        };
      
      case 'okta':
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          emailVerified: profile.email_verified,
          metadata: profile,
        };
      
      default:
        // Generic mapping for custom providers
        return {
          id: profile.id || profile.sub,
          email: profile.email,
          name: profile.name || profile.display_name,
          picture: profile.picture || profile.avatar_url,
          emailVerified: profile.email_verified ?? true,
          metadata: profile,
        };
    }
  }

  public async findOrCreateUser(profile: OAuthProfile) {
    const email = profile.email?.toLowerCase();
    if (!email) {
      throw new Error('Email is required for OAuth authentication');
    }

    // Check domain restriction
    if (this.config.domain && profile.domain !== this.config.domain) {
      throw new Error(`Access restricted to ${this.config.domain} domain`);
    }

    // Find or create SSO mapping
    let ssoMapping = await prisma.sSOMapping.findUnique({
      where: {
        provider_providerUserId_tenantId: {
          provider: this.config.provider,
          providerUserId: profile.id,
          tenantId: this.tenantId,
        },
      },
      include: {
        user: true,
      },
    });

    if (ssoMapping) {
      // Update user info
      await prisma.user.update({
        where: { id: ssoMapping.userId },
        data: {
          name: profile.name,
          image: profile.picture,
          lastLoginAt: new Date(),
        },
      });
      return ssoMapping.user;
    }

    // Check if user exists with this email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          id: randomUUID(),
          email,
          name: profile.name || email.split('@')[0],
          image: profile.picture,
          password: '', // No password for SSO users
          emailVerified: profile.emailVerified ? new Date() : null,
          lastLoginAt: new Date(),
        },
      });
    }

    // Create SSO mapping
    await prisma.sSOMapping.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        provider: this.config.provider,
        providerUserId: profile.id,
        tenantId: this.tenantId,
        metadata: profile.metadata,
      },
    });

    return user;
  }

  private getAuthorizationEndpoint(): string {
    if (this.config.authorizationUrl) {
      return this.config.authorizationUrl;
    }

    switch (this.config.provider) {
      case 'google_workspace':
        return 'https://accounts.google.com/o/oauth2/v2/auth';
      case 'microsoft':
        return 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
      case 'okta':
        return `https://${this.config.domain}/oauth2/v1/authorize`;
      case 'auth0':
        return `https://${this.config.domain}/authorize`;
      default:
        throw new Error('Authorization URL is required for custom providers');
    }
  }

  private getTokenEndpoint(): string {
    if (this.config.tokenUrl) {
      return this.config.tokenUrl;
    }

    switch (this.config.provider) {
      case 'google_workspace':
        return 'https://oauth2.googleapis.com/token';
      case 'microsoft':
        return 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      case 'okta':
        return `https://${this.config.domain}/oauth2/v1/token`;
      case 'auth0':
        return `https://${this.config.domain}/oauth/token`;
      default:
        throw new Error('Token URL is required for custom providers');
    }
  }

  private getUserInfoEndpoint(): string {
    if (this.config.userInfoUrl) {
      return this.config.userInfoUrl;
    }

    switch (this.config.provider) {
      case 'google_workspace':
        return 'https://www.googleapis.com/oauth2/v2/userinfo';
      case 'microsoft':
        return 'https://graph.microsoft.com/v1.0/me';
      case 'okta':
        return `https://${this.config.domain}/oauth2/v1/userinfo`;
      case 'auth0':
        return `https://${this.config.domain}/userinfo`;
      default:
        throw new Error('User info URL is required for custom providers');
    }
  }

  private getScope(): string {
    if (this.config.scope && this.config.scope.length > 0) {
      return this.config.scope.join(' ');
    }

    switch (this.config.provider) {
      case 'google_workspace':
        return 'openid email profile';
      case 'microsoft':
        return 'openid email profile User.Read';
      case 'okta':
        return 'openid email profile';
      case 'auth0':
        return 'openid email profile';
      default:
        return 'openid email profile';
    }
  }
}

// OAuth configuration manager
export class OAuthConfigManager {
  static async getConfig(tenantId: string, provider: string): Promise<OAuthConfig | null> {
    const config = await prisma.sSOConfiguration.findUnique({
      where: {
        tenantId_provider: {
          tenantId,
          provider,
        },
      },
    });

    if (!config || !config.enabled) {
      return null;
    }

    return config.configuration as OAuthConfig;
  }

  static async saveConfig(tenantId: string, config: OAuthConfig, enabled: boolean = true) {
    await prisma.sSOConfiguration.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider: config.provider,
        },
      },
      update: {
        configuration: config,
        enabled,
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        tenantId,
        provider: config.provider,
        configuration: config,
        enabled,
      },
    });
  }

  static async listConfigs(tenantId: string) {
    return prisma.sSOConfiguration.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}