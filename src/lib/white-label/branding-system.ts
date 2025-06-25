import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export interface BrandingConfig {
  tenantId: string;
  customDomain?: string;
  brandName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily?: string;
  customCSS?: string;
  emailTemplate?: {
    headerColor: string;
    footerText: string;
    logoUrl?: string;
  };
  onboardingFlow?: {
    steps: Array<{
      id: string;
      title: string;
      description: string;
      component: string;
      required: boolean;
    }>;
    welcomeMessage?: string;
    completionMessage?: string;
  };
}

export interface CustomDomainConfig {
  domain: string;
  tenantId: string;
  verified: boolean;
  sslEnabled: boolean;
  dnsRecords?: Array<{
    type: string;
    name: string;
    value: string;
    status: 'pending' | 'verified' | 'failed';
  }>;
}

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  typography: {
    fontFamily: string;
    headingFont?: string;
    sizes: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
  };
  spacing: {
    borderRadius: string;
    containerPadding: string;
  };
  components?: {
    button?: {
      borderRadius: string;
      fontWeight: string;
    };
    card?: {
      borderRadius: string;
      shadow: string;
    };
    input?: {
      borderRadius: string;
      borderColor: string;
    };
  };
}

export class BrandingManager {
  static async getBrandingConfig(tenantId: string): Promise<BrandingConfig | null> {
    const branding = await prisma.brandingConfig.findUnique({
      where: { tenantId },
    });

    if (!branding) {
      return this.getDefaultBranding(tenantId);
    }

    return branding.config as BrandingConfig;
  }

  static async saveBrandingConfig(config: BrandingConfig): Promise<void> {
    await prisma.brandingConfig.upsert({
      where: { tenantId: config.tenantId },
      update: {
        config,
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        tenantId: config.tenantId,
        config,
      },
    });

    // Clear cache
    await this.clearBrandingCache(config.tenantId);
  }

  static async getThemeConfig(tenantId: string): Promise<ThemeConfig> {
    const branding = await this.getBrandingConfig(tenantId);
    if (!branding) {
      return this.getDefaultTheme();
    }

    return {
      colors: {
        primary: branding.primaryColor,
        secondary: branding.secondaryColor,
        accent: branding.accentColor,
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1f2937',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      typography: {
        fontFamily: branding.fontFamily || 'Inter, system-ui, sans-serif',
        sizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          md: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
        },
      },
      spacing: {
        borderRadius: '0.5rem',
        containerPadding: '1rem',
      },
      components: {
        button: {
          borderRadius: '0.375rem',
          fontWeight: '600',
        },
        card: {
          borderRadius: '0.5rem',
          shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        },
        input: {
          borderRadius: '0.375rem',
          borderColor: '#d1d5db',
        },
      },
    };
  }

  static async generateCSS(tenantId: string): Promise<string> {
    const theme = await this.getThemeConfig(tenantId);
    const branding = await this.getBrandingConfig(tenantId);

    let css = `
/* Custom Branding CSS for ${branding?.brandName || 'Zenith'} */
:root {
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-accent: ${theme.colors.accent};
  --color-background: ${theme.colors.background};
  --color-surface: ${theme.colors.surface};
  --color-text: ${theme.colors.text};
  --color-text-secondary: ${theme.colors.textSecondary};
  --color-border: ${theme.colors.border};
  --color-success: ${theme.colors.success};
  --color-warning: ${theme.colors.warning};
  --color-error: ${theme.colors.error};
  
  --font-family: ${theme.typography.fontFamily};
  --border-radius: ${theme.spacing.borderRadius};
  --container-padding: ${theme.spacing.containerPadding};
}

/* Brand-specific styles */
.brand-primary { color: var(--color-primary); }
.brand-secondary { color: var(--color-secondary); }
.brand-accent { color: var(--color-accent); }

.bg-brand-primary { background-color: var(--color-primary); }
.bg-brand-secondary { background-color: var(--color-secondary); }
.bg-brand-accent { background-color: var(--color-accent); }

.border-brand-primary { border-color: var(--color-primary); }

/* Button styles */
.btn-primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  border-radius: var(--border-radius);
  font-weight: ${theme.components?.button?.fontWeight || '600'};
}

.btn-primary:hover {
  background-color: color-mix(in srgb, var(--color-primary) 90%, black);
}

.btn-secondary {
  background-color: var(--color-secondary);
  border-color: var(--color-secondary);
  border-radius: var(--border-radius);
}

/* Card styles */
.card {
  background-color: var(--color-surface);
  border-radius: ${theme.components?.card?.borderRadius || theme.spacing.borderRadius};
  box-shadow: ${theme.components?.card?.shadow || '0 1px 3px 0 rgb(0 0 0 / 0.1)'};
}

/* Input styles */
.form-input {
  border-radius: ${theme.components?.input?.borderRadius || theme.spacing.borderRadius};
  border-color: ${theme.components?.input?.borderColor || theme.colors.border};
}

.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent);
}

/* Navigation styles */
.nav-brand {
  color: var(--color-primary);
  font-weight: 700;
}

/* Footer styles */
.footer-brand {
  color: var(--color-text-secondary);
}

/* Logo positioning */
.brand-logo {
  max-height: 40px;
  width: auto;
}

.brand-logo-large {
  max-height: 60px;
  width: auto;
}
`;

    // Add custom CSS if provided
    if (branding?.customCSS) {
      css += `\n\n/* Custom CSS */\n${branding.customCSS}`;
    }

    return css;
  }

  private static getDefaultBranding(tenantId: string): BrandingConfig {
    return {
      tenantId,
      brandName: 'Zenith',
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      accentColor: '#06b6d4',
      fontFamily: 'Inter, system-ui, sans-serif',
    };
  }

  private static getDefaultTheme(): ThemeConfig {
    return {
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1f2937',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        sizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          md: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
        },
      },
      spacing: {
        borderRadius: '0.5rem',
        containerPadding: '1rem',
      },
    };
  }

  private static async clearBrandingCache(tenantId: string): Promise<void> {
    // In production, clear Redis cache or CDN cache
    console.log(`Clearing branding cache for tenant: ${tenantId}`);
  }
}

export class CustomDomainManager {
  static async addCustomDomain(tenantId: string, domain: string): Promise<CustomDomainConfig> {
    // Validate domain format
    if (!this.isValidDomain(domain)) {
      throw new Error('Invalid domain format');
    }

    // Check if domain is already in use
    const existing = await prisma.customDomain.findUnique({
      where: { domain },
    });

    if (existing && existing.tenantId !== tenantId) {
      throw new Error('Domain is already in use');
    }

    const config: CustomDomainConfig = {
      domain,
      tenantId,
      verified: false,
      sslEnabled: false,
      dnsRecords: [
        {
          type: 'CNAME',
          name: domain,
          value: 'cname.zenith.engineer',
          status: 'pending',
        },
        {
          type: 'TXT',
          name: `_zenith-verification.${domain}`,
          value: `zenith-domain-verification=${randomUUID()}`,
          status: 'pending',
        },
      ],
    };

    await prisma.customDomain.upsert({
      where: { domain },
      update: {
        tenantId,
        config,
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        domain,
        tenantId,
        config,
      },
    });

    return config;
  }

  static async verifyDomain(domain: string): Promise<boolean> {
    const domainRecord = await prisma.customDomain.findUnique({
      where: { domain },
    });

    if (!domainRecord) {
      throw new Error('Domain not found');
    }

    const config = domainRecord.config as CustomDomainConfig;

    // Verify DNS records
    const verificationPromises = config.dnsRecords?.map(async (record) => {
      try {
        const dns = require('dns').promises;
        let result;

        switch (record.type) {
          case 'CNAME':
            result = await dns.resolveCname(record.name);
            return result.includes(record.value);
          case 'TXT':
            result = await dns.resolveTxt(record.name);
            return result.some(txt => txt.join('').includes(record.value));
          default:
            return false;
        }
      } catch (error) {
        return false;
      }
    }) || [];

    const verificationResults = await Promise.all(verificationPromises);
    const allVerified = verificationResults.every(result => result);

    if (allVerified) {
      // Update domain status
      config.verified = true;
      config.dnsRecords = config.dnsRecords?.map(record => ({
        ...record,
        status: 'verified' as const,
      }));

      await prisma.customDomain.update({
        where: { domain },
        data: {
          config,
          updatedAt: new Date(),
        },
      });

      // Enable SSL certificate
      await this.enableSSL(domain);
    }

    return allVerified;
  }

  static async enableSSL(domain: string): Promise<void> {
    // In production, integrate with your SSL certificate provider
    // This could be Let's Encrypt, Cloudflare, or your CDN provider
    
    await prisma.customDomain.update({
      where: { domain },
      data: {
        config: {
          sslEnabled: true,
        },
      },
    });
  }

  static async getCustomDomain(tenantId: string): Promise<CustomDomainConfig | null> {
    const domainRecord = await prisma.customDomain.findFirst({
      where: { tenantId },
    });

    return domainRecord?.config as CustomDomainConfig || null;
  }

  static async removeCustomDomain(tenantId: string): Promise<void> {
    await prisma.customDomain.deleteMany({
      where: { tenantId },
    });
  }

  private static isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    return domainRegex.test(domain) && domain.length <= 253;
  }
}

export class EmailTemplateManager {
  static async generateBrandedEmailTemplate(
    tenantId: string,
    templateType: 'welcome' | 'reset_password' | 'invitation' | 'notification',
    data: Record<string, any> = {}
  ): Promise<string> {
    const branding = await BrandingManager.getBrandingConfig(tenantId);
    if (!branding) {
      return this.getDefaultEmailTemplate(templateType, data);
    }

    const logoUrl = branding.logoUrl || `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`;
    const brandName = branding.brandName;
    const primaryColor = branding.primaryColor;
    const footerText = branding.emailTemplate?.footerText || `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`;

    const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName}</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background-color: #f4f4f4; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff; 
      border-radius: 8px; 
      overflow: hidden; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
    }
    .header { 
      background-color: ${primaryColor}; 
      padding: 20px; 
      text-align: center; 
    }
    .logo { 
      max-height: 50px; 
      width: auto; 
    }
    .content { 
      padding: 30px; 
    }
    .button { 
      display: inline-block; 
      background-color: ${primaryColor}; 
      color: #ffffff; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 6px; 
      font-weight: 600; 
      margin: 20px 0; 
    }
    .footer { 
      background-color: #f8f9fa; 
      padding: 20px; 
      text-align: center; 
      color: #666; 
      font-size: 14px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="${brandName}" class="logo">
    </div>
    <div class="content">
      {{CONTENT}}
    </div>
    <div class="footer">
      ${footerText}
    </div>
  </div>
</body>
</html>`;

    let content = '';
    
    switch (templateType) {
      case 'welcome':
        content = `
          <h1>Welcome to ${brandName}!</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Welcome to ${brandName}! We're excited to have you on board.</p>
          <p>Get started by exploring your dashboard and setting up your first project.</p>
          <a href="${data.dashboardUrl || '#'}" class="button">Get Started</a>
          <p>If you have any questions, don't hesitate to reach out to our support team.</p>
        `;
        break;

      case 'reset_password':
        content = `
          <h1>Reset Your Password</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>You requested to reset your password for your ${brandName} account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${data.resetUrl}" class="button">Reset Password</a>
          <p>This link will expire in 24 hours. If you didn't request this, please ignore this email.</p>
        `;
        break;

      case 'invitation':
        content = `
          <h1>You're Invited!</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>You've been invited to join ${data.teamName || 'a team'} on ${brandName}.</p>
          <p>Click the button below to accept the invitation and create your account:</p>
          <a href="${data.invitationUrl}" class="button">Accept Invitation</a>
          <p>This invitation will expire in 7 days.</p>
        `;
        break;

      case 'notification':
        content = `
          <h1>${data.title || 'Notification'}</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>${data.message || 'You have a new notification.'}</p>
          ${data.actionUrl ? `<a href="${data.actionUrl}" class="button">${data.actionText || 'View Details'}</a>` : ''}
        `;
        break;
    }

    return baseTemplate.replace('{{CONTENT}}', content);
  }

  private static getDefaultEmailTemplate(templateType: string, data: Record<string, any>): string {
    // Return basic email template without branding
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1>Zenith</h1>
            <p>Default email template for ${templateType}</p>
            <pre>${JSON.stringify(data, null, 2)}</pre>
          </div>
        </body>
      </html>
    `;
  }
}

export class OnboardingFlowManager {
  static async getOnboardingFlow(tenantId: string): Promise<any> {
    const branding = await BrandingManager.getBrandingConfig(tenantId);
    
    if (branding?.onboardingFlow) {
      return branding.onboardingFlow;
    }

    // Return default onboarding flow
    return {
      steps: [
        {
          id: 'welcome',
          title: 'Welcome',
          description: 'Welcome to your new workspace',
          component: 'WelcomeStep',
          required: true,
        },
        {
          id: 'profile',
          title: 'Profile Setup',
          description: 'Complete your profile information',
          component: 'ProfileStep',
          required: true,
        },
        {
          id: 'team',
          title: 'Create Team',
          description: 'Set up your first team',
          component: 'TeamStep',
          required: false,
        },
        {
          id: 'project',
          title: 'First Project',
          description: 'Create your first project',
          component: 'ProjectStep',
          required: false,
        },
      ],
      welcomeMessage: 'Let\'s get you set up!',
      completionMessage: 'You\'re all set! Welcome to your workspace.',
    };
  }

  static async saveOnboardingFlow(tenantId: string, flow: any): Promise<void> {
    const branding = await BrandingManager.getBrandingConfig(tenantId) || 
                     BrandingManager['getDefaultBranding'](tenantId);

    branding.onboardingFlow = flow;
    await BrandingManager.saveBrandingConfig(branding);
  }
}