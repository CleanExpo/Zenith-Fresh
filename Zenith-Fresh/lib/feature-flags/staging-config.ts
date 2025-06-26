/**
 * =============================================================================
 * ZENITH PLATFORM - STAGING FEATURE FLAGS CONFIGURATION
 * =============================================================================
 * TypeScript configuration for staging-specific feature flags
 * =============================================================================
 */

import { FeatureFlag, FeatureFlagConfig, UserContext } from './types';

// Staging-specific feature flag configuration
export const STAGING_FEATURE_FLAGS: FeatureFlagConfig = {
  environment: 'staging',
  version: '1.0.0',
  lastUpdated: new Date('2025-06-25T08:00:00Z'),
  
  // Core feature flags for staging
  flags: {
    // Core System Features
    FEATURE_FLAGS_ENABLED: {
      enabled: true,
      description: 'Enable the feature flags system globally',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
    },
    
    STAGING_MODE: {
      enabled: true,
      description: 'Enable staging mode with debugging and enhanced logging',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging'],
      userTargeting: false,
    },
    
    DEBUG_MODE: {
      enabled: true,
      description: 'Enable debug mode with detailed error information',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging'],
      userTargeting: false,
    },
    
    // Website Analyzer Features
    NEXT_PUBLIC_FEATURE_ENHANCED_ANALYZER: {
      enabled: true,
      description: 'Enhanced website analyzer with advanced features',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
      metadata: {
        features: [
          'PDF report generation',
          'Scheduled scans',
          'Historical tracking',
          'Performance insights',
          'SEO analysis'
        ]
      }
    },
    
    FEATURE_ANALYZER_NOTIFICATIONS: {
      enabled: true,
      description: 'Email notifications for analyzer results',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
    },
    
    FEATURE_ANALYZER_SCHEDULING: {
      enabled: true,
      description: 'Scheduled website analysis scans',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
    },
    
    // Team Management Features
    NEXT_PUBLIC_FEATURE_TEAM_MANAGEMENT: {
      enabled: true,
      description: 'Team management and collaboration features',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
      metadata: {
        features: [
          'Team creation',
          'Member invitations',
          'Role management',
          'Team analytics',
          'Shared projects'
        ]
      }
    },
    
    FEATURE_TEAM_ANALYTICS: {
      enabled: true,
      description: 'Team performance analytics and insights',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
    },
    
    FEATURE_TEAM_PERMISSIONS: {
      enabled: true,
      description: 'Granular team permissions and access control',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
    },
    
    // AI Features (Disabled in Staging)
    NEXT_PUBLIC_FEATURE_AI_CONTENT_ANALYSIS: {
      enabled: false,
      description: 'AI-powered content analysis and optimization',
      type: 'boolean',
      rolloutPercentage: 0,
      environments: ['staging'],
      userTargeting: false,
      metadata: {
        reason: 'Disabled in staging to conserve AI API usage',
        features: [
          'Content optimization suggestions',
          'SEO improvements',
          'Accessibility analysis',
          'Performance recommendations'
        ]
      }
    },
    
    FEATURE_AI_CHATBOT: {
      enabled: false,
      description: 'AI-powered support chatbot',
      type: 'boolean',
      rolloutPercentage: 0,
      environments: ['staging'],
      userTargeting: false,
      metadata: {
        reason: 'Disabled in staging to conserve AI API usage'
      }
    },
    
    FEATURE_AI_INSIGHTS: {
      enabled: false,
      description: 'AI-generated insights and recommendations',
      type: 'boolean',
      rolloutPercentage: 0,
      environments: ['staging'],
      userTargeting: false,
      metadata: {
        reason: 'Disabled in staging to conserve AI API usage'
      }
    },
    
    // Enterprise Features (Limited in Staging)
    NEXT_PUBLIC_FEATURE_COMPETITIVE_INTELLIGENCE: {
      enabled: false,
      description: 'Competitive intelligence and market analysis',
      type: 'boolean',
      rolloutPercentage: 0,
      environments: ['staging'],
      userTargeting: false,
      metadata: {
        reason: 'Disabled in staging - requires production data sources',
        features: [
          'Competitor analysis',
          'Market trends',
          'Performance benchmarking',
          'Strategic insights'
        ]
      }
    },
    
    FEATURE_ENTERPRISE_INTEGRATIONS: {
      enabled: false,
      description: 'Enterprise system integrations',
      type: 'boolean',
      rolloutPercentage: 0,
      environments: ['staging'],
      userTargeting: false,
      metadata: {
        reason: 'Disabled in staging - requires enterprise credentials'
      }
    },
    
    FEATURE_ADVANCED_ANALYTICS: {
      enabled: true,
      description: 'Advanced analytics dashboard',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
    },
    
    // Payment and Billing (Disabled/Test Mode in Staging)
    DISABLE_PAYMENT_PROCESSING: {
      enabled: true,
      description: 'Disable payment processing in staging environment',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging'],
      userTargeting: false,
      metadata: {
        reason: 'Always disabled in staging for safety'
      }
    },
    
    FEATURE_BILLING_DASHBOARD: {
      enabled: true,
      description: 'Billing dashboard and subscription management',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
      metadata: {
        testMode: true
      }
    },
    
    FEATURE_USAGE_TRACKING: {
      enabled: true,
      description: 'Usage tracking and metering',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
    },
    
    // Development and Testing Features
    MOCK_EXTERNAL_APIS: {
      enabled: false,
      description: 'Mock external API responses for testing',
      type: 'boolean',
      rolloutPercentage: 0,
      environments: ['staging'],
      userTargeting: false,
      metadata: {
        reason: 'Disabled to test real integrations'
      }
    },
    
    FEATURE_TEST_DATA: {
      enabled: true,
      description: 'Enable test data generation and seeding',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging'],
      userTargeting: false,
    },
    
    FEATURE_PERFORMANCE_PROFILING: {
      enabled: true,
      description: 'Enable performance profiling and metrics',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging'],
      userTargeting: false,
    },
    
    FEATURE_ERROR_BOUNDARIES: {
      enabled: true,
      description: 'Enhanced error boundaries with debugging info',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging'],
      userTargeting: false,
    },
    
    // Security Features
    FORCE_HTTPS: {
      enabled: true,
      description: 'Force HTTPS redirects',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
    },
    
    SECURE_COOKIES: {
      enabled: true,
      description: 'Enable secure cookie settings',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
    },
    
    FEATURE_AUDIT_LOGGING: {
      enabled: true,
      description: 'Comprehensive audit logging',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
    },
    
    FEATURE_RATE_LIMITING: {
      enabled: true,
      description: 'API rate limiting and throttling',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
    },
    
    // Monitoring and Observability
    FEATURE_DETAILED_LOGGING: {
      enabled: true,
      description: 'Enhanced logging with detailed context',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging'],
      userTargeting: false,
    },
    
    FEATURE_PERFORMANCE_MONITORING: {
      enabled: true,
      description: 'Real-time performance monitoring',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
    },
    
    FEATURE_ERROR_TRACKING: {
      enabled: true,
      description: 'Advanced error tracking and reporting',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
    },
    
    FEATURE_HEALTH_CHECKS: {
      enabled: true,
      description: 'Comprehensive health check endpoints',
      type: 'boolean',
      rolloutPercentage: 100,
      environments: ['staging', 'production'],
      userTargeting: false,
    },
  },
  
  // User targeting rules
  userTargeting: {
    betaUsers: {
      description: 'Users opted into beta features',
      enabled: true,
      criteria: {
        userAttributes: ['beta_user'],
        emails: ['zenithfresh25@gmail.com'],
        percentage: 10,
      },
    },
    teamLeaders: {
      description: 'Team leaders and administrators',
      enabled: true,
      criteria: {
        roles: ['admin', 'team_leader'],
        percentage: 100,
      },
    },
    stagingTesters: {
      description: 'Internal staging testers',
      enabled: true,
      criteria: {
        emails: ['zenithfresh25@gmail.com'],
        domains: ['zenith.engineer'],
        percentage: 100,
      },
    },
  },
  
  // Environment-specific overrides
  overrides: {
    staging: {
      forceEnabled: [
        'STAGING_MODE',
        'DEBUG_MODE',
        'FEATURE_DETAILED_LOGGING',
        'FEATURE_TEST_DATA',
        'FEATURE_PERFORMANCE_PROFILING',
        'FEATURE_ERROR_BOUNDARIES',
      ],
      forceDisabled: [
        'NEXT_PUBLIC_FEATURE_AI_CONTENT_ANALYSIS',
        'NEXT_PUBLIC_FEATURE_COMPETITIVE_INTELLIGENCE',
        'FEATURE_AI_CHATBOT',
        'FEATURE_AI_INSIGHTS',
        'FEATURE_ENTERPRISE_INTEGRATIONS',
        'MOCK_EXTERNAL_APIS',
      ],
    },
  },
};

// Utility functions for staging feature flags
export class StagingFeatureFlags {
  private static instance: StagingFeatureFlags;
  private config: FeatureFlagConfig;
  
  constructor() {
    this.config = STAGING_FEATURE_FLAGS;
  }
  
  static getInstance(): StagingFeatureFlags {
    if (!StagingFeatureFlags.instance) {
      StagingFeatureFlags.instance = new StagingFeatureFlags();
    }
    return StagingFeatureFlags.instance;
  }
  
  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flagName: string, userContext?: UserContext): boolean {
    const flag = this.config.flags[flagName];
    
    if (!flag) {
      console.warn(`Feature flag ${flagName} not found`);
      return false;
    }
    
    // Check environment-specific overrides
    const overrides = this.config.overrides?.staging;
    if (overrides?.forceEnabled?.includes(flagName)) {
      return true;
    }
    if (overrides?.forceDisabled?.includes(flagName)) {
      return false;
    }
    
    // Check base enabled state
    if (!flag.enabled) {
      return false;
    }
    
    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashUserForFlag(flagName, userContext);
      if (hash > flag.rolloutPercentage) {
        return false;
      }
    }
    
    // Check user targeting
    if (flag.userTargeting && userContext) {
      return this.checkUserTargeting(flagName, userContext);
    }
    
    return flag.enabled;
  }
  
  /**
   * Get feature flag configuration
   */
  getFlag(flagName: string): FeatureFlag | null {
    return this.config.flags[flagName] || null;
  }
  
  /**
   * Get all enabled feature flags
   */
  getEnabledFlags(userContext?: UserContext): string[] {
    return Object.keys(this.config.flags).filter(flagName =>
      this.isEnabled(flagName, userContext)
    );
  }
  
  /**
   * Get all feature flags with their status
   */
  getAllFlags(userContext?: UserContext): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    Object.keys(this.config.flags).forEach(flagName => {
      result[flagName] = this.isEnabled(flagName, userContext);
    });
    return result;
  }
  
  /**
   * Get staging-specific flags only
   */
  getStagingFlags(userContext?: UserContext): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    Object.entries(this.config.flags).forEach(([flagName, flag]) => {
      if (flag.environments.includes('staging')) {
        result[flagName] = this.isEnabled(flagName, userContext);
      }
    });
    return result;
  }
  
  /**
   * Hash user for consistent flag rollout
   */
  private hashUserForFlag(flagName: string, userContext?: UserContext): number {
    if (!userContext?.userId) {
      return Math.random() * 100;
    }
    
    // Simple hash function for consistent user bucketing
    const str = `${flagName}:${userContext.userId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }
  
  /**
   * Check user targeting rules
   */
  private checkUserTargeting(flagName: string, userContext: UserContext): boolean {
    const targeting = this.config.userTargeting;
    
    if (!targeting) {
      return false;
    }
    
    // Check each targeting rule
    for (const [ruleName, rule] of Object.entries(targeting)) {
      if (!rule.enabled) continue;
      
      const criteria = rule.criteria;
      let matches = false;
      
      // Check email targeting
      if (criteria.emails && userContext.email) {
        matches = criteria.emails.includes(userContext.email);
      }
      
      // Check domain targeting
      if (criteria.domains && userContext.email) {
        const domain = userContext.email.split('@')[1];
        matches = matches || criteria.domains.includes(domain);
      }
      
      // Check role targeting
      if (criteria.roles && userContext.roles) {
        matches = matches || criteria.roles.some(role => userContext.roles?.includes(role));
      }
      
      // Check user attributes
      if (criteria.userAttributes && userContext.attributes) {
        matches = matches || criteria.userAttributes.some(attr => 
          userContext.attributes?.includes(attr)
        );
      }
      
      if (matches) {
        // Check percentage rollout for this targeting rule
        const hash = this.hashUserForFlag(`${flagName}:${ruleName}`, userContext);
        return hash <= criteria.percentage;
      }
    }
    
    return false;
  }
}

// Export singleton instance
export const stagingFeatureFlags = StagingFeatureFlags.getInstance();

// Export commonly used flag names as constants
export const STAGING_FLAGS = {
  // Core
  FEATURE_FLAGS_ENABLED: 'FEATURE_FLAGS_ENABLED',
  STAGING_MODE: 'STAGING_MODE',
  DEBUG_MODE: 'DEBUG_MODE',
  
  // Website Analyzer
  ENHANCED_ANALYZER: 'NEXT_PUBLIC_FEATURE_ENHANCED_ANALYZER',
  ANALYZER_NOTIFICATIONS: 'FEATURE_ANALYZER_NOTIFICATIONS',
  ANALYZER_SCHEDULING: 'FEATURE_ANALYZER_SCHEDULING',
  
  // Team Management
  TEAM_MANAGEMENT: 'NEXT_PUBLIC_FEATURE_TEAM_MANAGEMENT',
  TEAM_ANALYTICS: 'FEATURE_TEAM_ANALYTICS',
  TEAM_PERMISSIONS: 'FEATURE_TEAM_PERMISSIONS',
  
  // AI Features (Disabled)
  AI_CONTENT_ANALYSIS: 'NEXT_PUBLIC_FEATURE_AI_CONTENT_ANALYSIS',
  AI_CHATBOT: 'FEATURE_AI_CHATBOT',
  AI_INSIGHTS: 'FEATURE_AI_INSIGHTS',
  
  // Enterprise Features (Limited)
  COMPETITIVE_INTELLIGENCE: 'NEXT_PUBLIC_FEATURE_COMPETITIVE_INTELLIGENCE',
  ENTERPRISE_INTEGRATIONS: 'FEATURE_ENTERPRISE_INTEGRATIONS',
  ADVANCED_ANALYTICS: 'FEATURE_ADVANCED_ANALYTICS',
  
  // Payment & Billing
  DISABLE_PAYMENTS: 'DISABLE_PAYMENT_PROCESSING',
  BILLING_DASHBOARD: 'FEATURE_BILLING_DASHBOARD',
  USAGE_TRACKING: 'FEATURE_USAGE_TRACKING',
  
  // Development & Testing
  MOCK_APIS: 'MOCK_EXTERNAL_APIS',
  TEST_DATA: 'FEATURE_TEST_DATA',
  PERFORMANCE_PROFILING: 'FEATURE_PERFORMANCE_PROFILING',
  ERROR_BOUNDARIES: 'FEATURE_ERROR_BOUNDARIES',
  
  // Security
  FORCE_HTTPS: 'FORCE_HTTPS',
  SECURE_COOKIES: 'SECURE_COOKIES',
  AUDIT_LOGGING: 'FEATURE_AUDIT_LOGGING',
  RATE_LIMITING: 'FEATURE_RATE_LIMITING',
  
  // Monitoring
  DETAILED_LOGGING: 'FEATURE_DETAILED_LOGGING',
  PERFORMANCE_MONITORING: 'FEATURE_PERFORMANCE_MONITORING',
  ERROR_TRACKING: 'FEATURE_ERROR_TRACKING',
  HEALTH_CHECKS: 'FEATURE_HEALTH_CHECKS',
} as const;