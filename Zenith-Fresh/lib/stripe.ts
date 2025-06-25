/**
 * Enterprise Stripe Integration
 * Comprehensive billing and subscription management for Fortune 500 companies
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

// Initialize Stripe with enterprise configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
  telemetry: false, // Disable telemetry for security compliance
  maxNetworkRetries: 3,
  timeout: 30000, // 30 second timeout for enterprise operations
  appInfo: {
    name: 'Zenith Platform',
    version: '1.0.0',
    url: 'https://zenith.engineer'
  }
});

// Enterprise pricing tiers configuration
export const PLAN_CONFIG = {
  FREEMIUM: {
    name: 'Freemium',
    maxProjects: 3,
    maxTeamMembers: 1,
    maxAPIRequests: 1000,
    maxMonitoringChecks: 100,
    features: {
      websiteAnalyzer: true,
      basicReporting: true,
      emailSupport: true,
      advancedAnalytics: false,
      teamCollaboration: false,
      enterpriseIntegrations: false,
      customReporting: false,
      prioritySupport: false,
      sla: false,
      sso: false,
      auditLogs: false,
      apiAccess: 'limited',
      whiteLabeling: false,
      customContracts: false
    }
  },
  STARTER: {
    name: 'Starter',
    maxProjects: 10,
    maxTeamMembers: 5,
    maxAPIRequests: 10000,
    maxMonitoringChecks: 1000,
    features: {
      websiteAnalyzer: true,
      basicReporting: true,
      emailSupport: true,
      advancedAnalytics: true,
      teamCollaboration: true,
      enterpriseIntegrations: false,
      customReporting: false,
      prioritySupport: false,
      sla: false,
      sso: false,
      auditLogs: false,
      apiAccess: 'standard',
      whiteLabeling: false,
      customContracts: false
    }
  },
  PROFESSIONAL: {
    name: 'Professional',
    maxProjects: 50,
    maxTeamMembers: 25,
    maxAPIRequests: 100000,
    maxMonitoringChecks: 10000,
    features: {
      websiteAnalyzer: true,
      basicReporting: true,
      emailSupport: true,
      advancedAnalytics: true,
      teamCollaboration: true,
      enterpriseIntegrations: true,
      customReporting: true,
      prioritySupport: true,
      sla: false,
      sso: false,
      auditLogs: true,
      apiAccess: 'full',
      whiteLabeling: false,
      customContracts: false
    }
  },
  BUSINESS: {
    name: 'Business',
    maxProjects: 200,
    maxTeamMembers: 100,
    maxAPIRequests: 1000000,
    maxMonitoringChecks: 100000,
    features: {
      websiteAnalyzer: true,
      basicReporting: true,
      emailSupport: true,
      advancedAnalytics: true,
      teamCollaboration: true,
      enterpriseIntegrations: true,
      customReporting: true,
      prioritySupport: true,
      sla: '99.9%',
      sso: true,
      auditLogs: true,
      apiAccess: 'full',
      whiteLabeling: true,
      customContracts: false
    }
  },
  ENTERPRISE: {
    name: 'Enterprise',
    maxProjects: -1, // Unlimited
    maxTeamMembers: -1, // Unlimited
    maxAPIRequests: -1, // Unlimited
    maxMonitoringChecks: -1, // Unlimited
    features: {
      websiteAnalyzer: true,
      basicReporting: true,
      emailSupport: true,
      advancedAnalytics: true,
      teamCollaboration: true,
      enterpriseIntegrations: true,
      customReporting: true,
      prioritySupport: true,
      sla: '99.99%',
      sso: true,
      auditLogs: true,
      apiAccess: 'unlimited',
      whiteLabeling: true,
      customContracts: true,
      dedicatedSupport: true,
      onPremise: true,
      customIntegrations: true,
      dataResidency: true,
      advancedSecurity: true
    }
  },
  CUSTOM: {
    name: 'Custom',
    maxProjects: -1,
    maxTeamMembers: -1,
    maxAPIRequests: -1,
    maxMonitoringChecks: -1,
    features: {
      // All features enabled, customizable
      websiteAnalyzer: true,
      basicReporting: true,
      emailSupport: true,
      advancedAnalytics: true,
      teamCollaboration: true,
      enterpriseIntegrations: true,
      customReporting: true,
      prioritySupport: true,
      sla: 'custom',
      sso: true,
      auditLogs: true,
      apiAccess: 'unlimited',
      whiteLabeling: true,
      customContracts: true,
      dedicatedSupport: true,
      onPremise: true,
      customIntegrations: true,
      dataResidency: true,
      advancedSecurity: true,
      customFeatures: true
    }
  }
} as const;

// Usage-based pricing metrics
export const USAGE_METRICS = {
  API_REQUESTS: {
    name: 'API Requests',
    unit: 'request',
    displayName: 'API Requests',
    description: 'Number of API requests made'
  },
  MONITORING_CHECKS: {
    name: 'Monitoring Checks',
    unit: 'check',
    displayName: 'Monitoring Checks',
    description: 'Website monitoring and analysis checks'
  },
  TEAM_MEMBERS: {
    name: 'Team Members',
    unit: 'user',
    displayName: 'Team Members',
    description: 'Number of team members in the organization'
  },
  PROJECTS: {
    name: 'Projects',
    unit: 'project',
    displayName: 'Active Projects',
    description: 'Number of active projects being monitored'
  },
  STORAGE_GB: {
    name: 'Storage',
    unit: 'gb',
    displayName: 'Storage (GB)',
    description: 'Data storage usage in gigabytes'
  },
  BANDWIDTH_GB: {
    name: 'Bandwidth',
    unit: 'gb',
    displayName: 'Bandwidth (GB)',
    description: 'Data transfer usage in gigabytes'
  }
} as const;

// Enterprise tax configuration
export const TAX_CONFIG = {
  // US States requiring sales tax
  US_TAX_STATES: [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'FL', 'GA', 'HI',
    'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA',
    'MI', 'MN', 'MS', 'MO', 'NE', 'NV', 'NJ', 'NM', 'NY', 'NC',
    'ND', 'OH', 'OK', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT',
    'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ],
  
  // EU countries requiring VAT
  EU_VAT_COUNTRIES: [
    'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI',
    'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT',
    'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'
  ],
  
  // Tax rates by region (fallback - use Stripe Tax for real-time rates)
  DEFAULT_RATES: {
    US: 8.25, // Average US sales tax
    EU: 21.0,  // Average EU VAT
    UK: 20.0,  // UK VAT
    CA: 13.0,  // Average Canadian tax
    AU: 10.0,  // Australian GST
    SG: 7.0,   // Singapore GST
    JP: 10.0   // Japan consumption tax
  }
};

// Enterprise compliance features
export const COMPLIANCE_CONFIG = {
  // Data processing agreements
  DPA_REQUIRED_COUNTRIES: ['DE', 'FR', 'NL', 'AT', 'BE', 'DK', 'FI', 'SE', 'NO'],
  
  // Business Associate Agreements (HIPAA)
  BAA_REQUIRED_INDUSTRIES: ['healthcare', 'medical', 'pharmaceutical'],
  
  // SOC 2 compliance
  SOC2_FEATURES: {
    auditLogs: true,
    encryption: true,
    accessControls: true,
    dataRetention: true,
    incidentResponse: true
  },
  
  // GDPR compliance
  GDPR_FEATURES: {
    dataPortability: true,
    rightToErasure: true,
    consentManagement: true,
    dataMinimization: true,
    privacyByDesign: true
  }
};

// Enterprise SLA definitions
export const SLA_CONFIG = {
  STARTER: {
    uptime: 99.0,
    responseTime: 24, // hours
    support: 'email'
  },
  PROFESSIONAL: {
    uptime: 99.5,
    responseTime: 8, // hours
    support: 'email + chat'
  },
  BUSINESS: {
    uptime: 99.9,
    responseTime: 4, // hours
    support: 'phone + email + chat'
  },
  ENTERPRISE: {
    uptime: 99.99,
    responseTime: 1, // hour
    support: 'dedicated account manager'
  }
};

// Multi-currency support
export const CURRENCY_CONFIG = {
  DEFAULT: 'usd',
  SUPPORTED: [
    'usd', 'eur', 'gbp', 'cad', 'aud', 'jpy', 'sgd', 'chf', 'sek', 'nok', 'dkk'
  ],
  SYMBOLS: {
    usd: '$',
    eur: '€',
    gbp: '£',
    cad: 'C$',
    aud: 'A$',
    jpy: '¥',
    sgd: 'S$',
    chf: 'CHF',
    sek: 'kr',
    nok: 'kr',
    dkk: 'kr'
  },
  DISPLAY_NAMES: {
    usd: 'US Dollar',
    eur: 'Euro',
    gbp: 'British Pound',
    cad: 'Canadian Dollar',
    aud: 'Australian Dollar',
    jpy: 'Japanese Yen',
    sgd: 'Singapore Dollar',
    chf: 'Swiss Franc',
    sek: 'Swedish Krona',
    nok: 'Norwegian Krone',
    dkk: 'Danish Krone'
  }
};

// Helper functions for enterprise billing
export class StripeHelpers {
  /**
   * Format amount for display (convert from cents)
   */
  static formatAmount(amountInCents: number, currency = 'usd'): string {
    const amount = amountInCents / 100;
    const symbol = CURRENCY_CONFIG.SYMBOLS[currency as keyof typeof CURRENCY_CONFIG.SYMBOLS] || '$';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Convert amount to cents for Stripe
   */
  static toCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Get plan features by tier
   */
  static getPlanFeatures(tier: keyof typeof PLAN_CONFIG) {
    return PLAN_CONFIG[tier];
  }

  /**
   * Check if user has access to feature
   */
  static hasFeature(userTier: string, feature: string): boolean {
    const tierConfig = PLAN_CONFIG[userTier as keyof typeof PLAN_CONFIG];
    return tierConfig?.features[feature as keyof typeof tierConfig.features] || false;
  }

  /**
   * Get usage limit for metric
   */
  static getUsageLimit(userTier: string, metric: string): number {
    const tierConfig = PLAN_CONFIG[userTier as keyof typeof PLAN_CONFIG];
    if (!tierConfig) return 0;
    
    switch (metric) {
      case 'projects':
        return tierConfig.maxProjects;
      case 'team_members':
        return tierConfig.maxTeamMembers;
      case 'api_requests':
        return tierConfig.maxAPIRequests;
      case 'monitoring_checks':
        return tierConfig.maxMonitoringChecks;
      default:
        return 0;
    }
  }

  /**
   * Determine if tax collection is required
   */
  static requiresTax(country: string, state?: string): boolean {
    if (country === 'US' && state) {
      return TAX_CONFIG.US_TAX_STATES.includes(state);
    }
    
    if (TAX_CONFIG.EU_VAT_COUNTRIES.includes(country)) {
      return true;
    }
    
    return ['GB', 'CA', 'AU', 'SG', 'JP'].includes(country);
  }

  /**
   * Get appropriate tax rate
   */
  static getTaxRate(country: string): number {
    if (TAX_CONFIG.EU_VAT_COUNTRIES.includes(country)) {
      return TAX_CONFIG.DEFAULT_RATES.EU;
    }
    
    return TAX_CONFIG.DEFAULT_RATES[country as keyof typeof TAX_CONFIG.DEFAULT_RATES] || 0;
  }

  /**
   * Generate enterprise invoice number
   */
  static generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `ZEN-${year}${month}-${timestamp}`;
  }

  /**
   * Generate enterprise quote number
   */
  static generateQuoteNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `ZEN-QT-${year}${month}-${timestamp}`;
  }

  /**
   * Generate enterprise contract number
   */
  static generateContractNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `ZEN-CT-${year}${month}-${timestamp}`;
  }
}

export default stripe;