/**
 * Feature Flag System
 * Provides safe feature rollouts with user-based targeting and gradual exposure
 */

import { getEnvironmentConfig } from './environment';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  targetUsers?: string[]; // Specific user IDs
  targetRoles?: string[]; // User roles that should see this feature
  environments?: string[]; // Environments where this flag is active
  startDate?: Date;
  endDate?: Date;
}

export interface FeatureFlagContext {
  userId?: string;
  userRole?: string;
  environment: string;
  timestamp: Date;
}

/**
 * Default feature flags configuration
 */
const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: 'enhanced_website_analyzer',
    name: 'Enhanced Website Analyzer',
    description: 'PDF reports, scheduling, and historical tracking',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['development', 'staging'],
  },
  {
    key: 'team_management',
    name: 'Team Management',
    description: 'Team creation, member invitations, and collaboration',
    enabled: true,
    rolloutPercentage: 0, // Not rolled out yet
    environments: ['development', 'staging'],
  },
  {
    key: 'ai_content_analysis',
    name: 'AI Content Analysis',
    description: 'AI-powered content optimization and recommendations',
    enabled: true,
    rolloutPercentage: 0, // Not rolled out yet
    environments: ['development', 'staging'],
  },
  {
    key: 'competitive_intelligence',
    name: 'Competitive Intelligence',
    description: 'Competitor analysis and market intelligence',
    enabled: false, // Not ready yet
    rolloutPercentage: 0,
    environments: ['development'],
  },
  {
    key: 'enterprise_integrations',
    name: 'Enterprise Integrations',
    description: 'CRM, marketing tools, and enterprise API integrations',
    enabled: false, // Not ready yet
    rolloutPercentage: 0,
    environments: ['development'],
  },
  {
    key: 'ai_agent_orchestration',
    name: 'AI Agent Orchestration',
    description: 'Advanced AI agent management and automation',
    enabled: false, // Not ready yet
    rolloutPercentage: 0,
    environments: ['development'],
  },
  {
    key: 'staging_banner',
    name: 'Staging Environment Banner',
    description: 'Shows banner in staging environment',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['staging'],
  },
];

/**
 * Feature flag evaluation engine
 */
export class FeatureFlagService {
  private flags: FeatureFlag[] = DEFAULT_FEATURE_FLAGS;

  constructor() {
    this.loadEnvironmentFlags();
  }

  /**
   * Load feature flags from environment variables
   */
  private loadEnvironmentFlags() {
    const envConfig = getEnvironmentConfig();
    
    // Override flags based on environment variables
    this.flags = this.flags.map(flag => {
      const envKey = `NEXT_PUBLIC_FEATURE_${flag.key.toUpperCase()}`;
      const envValue = process.env[envKey];
      
      if (envValue !== undefined) {
        flag.enabled = envValue === 'true';
        if (flag.enabled) {
          flag.rolloutPercentage = 100; // If explicitly enabled, roll out to 100%
        }
      }
      
      return flag;
    });
  }

  /**
   * Check if a feature is enabled for a given context
   */
  isFeatureEnabled(featureKey: string, context: FeatureFlagContext): boolean {
    const flag = this.flags.find(f => f.key === featureKey);
    
    if (!flag) {
      console.warn(`Feature flag not found: ${featureKey}`);
      return false;
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check environment restrictions
    if (flag.environments && !flag.environments.includes(context.environment)) {
      return false;
    }

    // Check date restrictions
    if (flag.startDate && context.timestamp < flag.startDate) {
      return false;
    }
    
    if (flag.endDate && context.timestamp > flag.endDate) {
      return false;
    }

    // Check specific user targeting
    if (flag.targetUsers && context.userId) {
      return flag.targetUsers.includes(context.userId);
    }

    // Check role targeting
    if (flag.targetRoles && context.userRole) {
      return flag.targetRoles.includes(context.userRole);
    }

    // Check rollout percentage
    if (context.userId) {
      const userHash = this.hashUserId(context.userId, featureKey);
      const userPercentile = userHash % 100;
      return userPercentile < flag.rolloutPercentage;
    }

    // For anonymous users, use simple percentage
    return Math.random() * 100 < flag.rolloutPercentage;
  }

  /**
   * Get all available feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return [...this.flags];
  }

  /**
   * Get enabled features for a context
   */
  getEnabledFeatures(context: FeatureFlagContext): string[] {
    return this.flags
      .filter(flag => this.isFeatureEnabled(flag.key, context))
      .map(flag => flag.key);
  }

  /**
   * Update a feature flag (for admin interface)
   */
  updateFlag(featureKey: string, updates: Partial<FeatureFlag>): boolean {
    const flagIndex = this.flags.findIndex(f => f.key === featureKey);
    
    if (flagIndex === -1) {
      return false;
    }

    this.flags[flagIndex] = { ...this.flags[flagIndex], ...updates };
    return true;
  }

  /**
   * Create a consistent hash for user-based rollouts
   */
  private hashUserId(userId: string, featureKey: string): number {
    const str = `${userId}:${featureKey}`;
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }
}

/**
 * Global feature flag service instance
 */
export const featureFlagService = new FeatureFlagService();

/**
 * React hook for feature flags
 */
export function useFeatureFlag(featureKey: string, userId?: string, userRole?: string): boolean {
  const envConfig = getEnvironmentConfig();
  
  const context: FeatureFlagContext = {
    userId,
    userRole,
    environment: envConfig.environment,
    timestamp: new Date(),
  };

  return featureFlagService.isFeatureEnabled(featureKey, context);
}

/**
 * React hook for multiple feature flags
 */
export function useFeatureFlags(userId?: string, userRole?: string): Record<string, boolean> {
  const envConfig = getEnvironmentConfig();
  
  const context: FeatureFlagContext = {
    userId,
    userRole,
    environment: envConfig.environment,
    timestamp: new Date(),
  };

  const flags = featureFlagService.getAllFlags();
  const result: Record<string, boolean> = {};

  flags.forEach(flag => {
    result[flag.key] = featureFlagService.isFeatureEnabled(flag.key, context);
  });

  return result;
}

/**
 * Server-side feature flag check
 */
export function checkFeatureFlag(featureKey: string, context: FeatureFlagContext): boolean {
  return featureFlagService.isFeatureEnabled(featureKey, context);
}