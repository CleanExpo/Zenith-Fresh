import { Strategy as SamlStrategy } from '@node-saml/passport-saml';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export interface SamlConfig {
  entryPoint: string;
  issuer: string;
  callbackUrl: string;
  cert: string;
  privateKey?: string;
  signatureAlgorithm?: 'sha1' | 'sha256' | 'sha512';
  identifierFormat?: string;
  acceptedClockSkewMs?: number;
  attributeConsumingServiceIndex?: number;
  disableRequestedAuthnContext?: boolean;
  forceAuthn?: boolean;
}

export interface SamlProfile {
  nameID: string;
  nameIDFormat: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  groups?: string[];
  attributes?: Record<string, any>;
}

export class SamlProvider {
  private strategy: SamlStrategy;
  private config: SamlConfig;
  private tenantId: string;

  constructor(tenantId: string, config: SamlConfig) {
    this.tenantId = tenantId;
    this.config = config;
    
    this.strategy = new SamlStrategy(
      {
        entryPoint: config.entryPoint,
        issuer: config.issuer,
        callbackUrl: config.callbackUrl,
        cert: config.cert,
        privateKey: config.privateKey,
        signatureAlgorithm: config.signatureAlgorithm || 'sha256',
        identifierFormat: config.identifierFormat,
        acceptedClockSkewMs: config.acceptedClockSkewMs || 180000,
        disableRequestedAuthnContext: config.disableRequestedAuthnContext || true,
        forceAuthn: config.forceAuthn || false,
      },
      async (profile: any, done: any) => {
        try {
          const samlProfile = this.mapProfile(profile);
          const user = await this.findOrCreateUser(samlProfile);
          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    );
  }

  private mapProfile(profile: any): SamlProfile {
    return {
      nameID: profile.nameID,
      nameIDFormat: profile.nameIDFormat,
      email: profile.email || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      firstName: profile.firstName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'],
      lastName: profile.lastName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'],
      displayName: profile.displayName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
      groups: profile.groups || profile['http://schemas.xmlsoap.org/claims/Group'],
      attributes: profile,
    };
  }

  private async findOrCreateUser(profile: SamlProfile) {
    const email = profile.email?.toLowerCase();
    if (!email) {
      throw new Error('Email is required for SAML authentication');
    }

    // Find or create SSO mapping
    let ssoMapping = await prisma.sSOMapping.findUnique({
      where: {
        provider_providerUserId_tenantId: {
          provider: 'saml',
          providerUserId: profile.nameID,
          tenantId: this.tenantId,
        },
      },
      include: {
        user: true,
      },
    });

    if (ssoMapping) {
      // Update user info if needed
      await prisma.user.update({
        where: { id: ssoMapping.userId },
        data: {
          name: profile.displayName || `${profile.firstName} ${profile.lastName}`.trim(),
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
          name: profile.displayName || `${profile.firstName} ${profile.lastName}`.trim(),
          password: '', // No password for SSO users
          emailVerified: new Date(), // SSO users are pre-verified
          lastLoginAt: new Date(),
        },
      });
    }

    // Create SSO mapping
    await prisma.sSOMapping.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        provider: 'saml',
        providerUserId: profile.nameID,
        tenantId: this.tenantId,
        metadata: profile.attributes,
      },
    });

    // Handle group memberships if applicable
    if (profile.groups && profile.groups.length > 0) {
      await this.syncUserGroups(user.id, profile.groups);
    }

    return user;
  }

  private async syncUserGroups(userId: string, groups: string[]) {
    // Implementation depends on your group/team structure
    // This is a placeholder for group synchronization logic
    console.log(`Syncing groups for user ${userId}:`, groups);
  }

  public getStrategy() {
    return this.strategy;
  }

  public async generateMetadata(): Promise<string> {
    return `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="${this.config.issuer}">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                         Location="${this.config.callbackUrl}/logout"/>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                              Location="${this.config.callbackUrl}"
                              index="0"
                              isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>`;
  }
}

// SAML configuration manager
export class SamlConfigManager {
  static async getConfig(tenantId: string): Promise<SamlConfig | null> {
    const config = await prisma.sSOConfiguration.findUnique({
      where: {
        tenantId_provider: {
          tenantId,
          provider: 'saml',
        },
      },
    });

    if (!config || !config.enabled) {
      return null;
    }

    return config.configuration as SamlConfig;
  }

  static async saveConfig(tenantId: string, config: SamlConfig, enabled: boolean = true) {
    await prisma.sSOConfiguration.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider: 'saml',
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
        provider: 'saml',
        configuration: config,
        enabled,
      },
    });
  }

  static async validateConfig(config: SamlConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!config.entryPoint) {
      errors.push('Entry point URL is required');
    }
    if (!config.issuer) {
      errors.push('Issuer is required');
    }
    if (!config.callbackUrl) {
      errors.push('Callback URL is required');
    }
    if (!config.cert) {
      errors.push('Certificate is required');
    }

    // Validate certificate format
    if (config.cert && !config.cert.includes('BEGIN CERTIFICATE')) {
      errors.push('Invalid certificate format');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}