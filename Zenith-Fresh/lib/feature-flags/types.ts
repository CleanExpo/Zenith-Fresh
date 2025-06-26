/**
 * =============================================================================
 * ZENITH PLATFORM - FEATURE FLAGS TYPES
 * =============================================================================
 * TypeScript type definitions for feature flags system
 * =============================================================================
 */

export interface FeatureFlag {
  enabled: boolean;
  description: string;
  type: 'boolean' | 'string' | 'number' | 'json';
  rolloutPercentage: number;
  environments: string[];
  userTargeting: boolean;
  value?: any;
  conditions?: FeatureFlagCondition[];
  metadata?: Record<string, any>;
}

export interface FeatureFlagCondition {
  type: 'user_id' | 'user_email' | 'user_role' | 'percentage' | 'date_range';
  operator: 'equals' | 'contains' | 'in' | 'greater_than' | 'less_than';
  value: any;
}

export interface FeatureFlagConfig {
  environment: string;
  version: string;
  lastUpdated: Date;
  flags: Record<string, FeatureFlag>;
  userTargeting?: Record<string, UserTargetingRule>;
  overrides?: Record<string, EnvironmentOverride>;
}

export interface UserTargetingRule {
  description: string;
  enabled: boolean;
  criteria: {
    emails?: string[];
    domains?: string[];
    roles?: string[];
    userAttributes?: string[];
    percentage: number;
  };
}

export interface EnvironmentOverride {
  forceEnabled?: string[];
  forceDisabled?: string[];
}

export interface UserContext {
  id?: string;
  userId?: string;
  email?: string;
  role?: string;
  roles?: string[];
  attributes?: string[];
  metadata?: Record<string, any>;
}

export interface FeatureFlagEvaluation {
  flagName: string;
  enabled: boolean;
  value: any;
  reason: string;
  metadata?: Record<string, any>;
}

export interface FeatureFlagAnalytics {
  flagName: string;
  evaluations: number;
  enabled: number;
  disabled: number;
  lastEvaluated: Date;
}