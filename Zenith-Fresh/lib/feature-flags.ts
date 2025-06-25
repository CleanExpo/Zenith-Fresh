/**
 * Feature Flag System
 * Allows gradual rollout of features and A/B testing
 */

import { headers } from 'next/headers';

export type FeatureFlag = {
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number;
  allowedUsers?: string[];
  allowedEmails?: string[];
  environments?: ('development' | 'staging' | 'production')[];
};

// Feature flag definitions
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  ENHANCED_ANALYZER: {
    name: 'Enhanced Website Analyzer',
    description: 'Advanced website analysis with PDF reports and scheduling',
    enabled: process.env.NEXT_PUBLIC_FEATURE_ENHANCED_ANALYZER === 'true',
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },
  TEAM_MANAGEMENT: {
    name: 'Team Management',
    description: 'Team creation, member invitations, and collaboration features',
    enabled: process.env.NEXT_PUBLIC_FEATURE_TEAM_MANAGEMENT === 'true',
    rolloutPercentage: 50,
    environments: ['development', 'staging'],
  },
  AI_CONTENT_ANALYSIS: {
    name: 'AI-Powered Content Analysis',
    description: 'AI-driven content optimization and recommendations',
    enabled: process.env.NEXT_PUBLIC_FEATURE_AI_CONTENT_ANALYSIS === 'true',
    rolloutPercentage: 10,
    environments: ['development', 'staging'],
    allowedEmails: ['admin@zenith.engineer', 'beta@zenith.engineer'],
  },
  COMPETITIVE_INTELLIGENCE: {
    name: 'Competitive Intelligence',
    description: 'Competitor analysis and market intelligence platform',
    enabled: process.env.NEXT_PUBLIC_FEATURE_COMPETITIVE_INTELLIGENCE === 'true',
    rolloutPercentage: 0,
    environments: ['development'],
    allowedUsers: [],
  },
  DARK_MODE: {
    name: 'Dark Mode',
    description: 'Dark theme support across the application',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['development', 'staging', 'production'],
  },
};

/**
 * Check if a feature is enabled for the current user
 */
export function isFeatureEnabled(
  featureName: keyof typeof FEATURE_FLAGS,
  userEmail?: string | null,
  userId?: string | null
): boolean {
  const feature = FEATURE_FLAGS[featureName];
  
  if (!feature || !feature.enabled) {
    return false;
  }

  // Check environment
  const currentEnv = process.env.NODE_ENV as 'development' | 'staging' | 'production';
  if (feature.environments && !feature.environments.includes(currentEnv)) {
    return false;
  }

  // Check allowed users
  if (feature.allowedUsers && userId) {
    if (!feature.allowedUsers.includes(userId)) {
      return false;
    }
  }

  // Check allowed emails
  if (feature.allowedEmails && userEmail) {
    if (!feature.allowedEmails.includes(userEmail)) {
      return false;
    }
  }

  // Check rollout percentage
  if (feature.rolloutPercentage !== undefined && feature.rolloutPercentage < 100) {
    // Use user ID or email to create consistent hash
    const identifier = userId || userEmail || 'anonymous';
    const hash = hashString(identifier + featureName);
    const percentage = (hash % 100) + 1;
    return percentage <= feature.rolloutPercentage;
  }

  return true;
}

/**
 * Get all enabled features for a user
 */
export function getEnabledFeatures(
  userEmail?: string | null,
  userId?: string | null
): string[] {
  return Object.keys(FEATURE_FLAGS).filter((flag) =>
    isFeatureEnabled(flag as keyof typeof FEATURE_FLAGS, userEmail, userId)
  );
}

/**
 * Feature flag React hook
 */
export function useFeatureFlag(featureName: keyof typeof FEATURE_FLAGS): boolean {
  // This is a simplified version - in production, you'd get user info from context
  if (typeof window === 'undefined') {
    // Server-side rendering
    return isFeatureEnabled(featureName);
  }
  
  // Client-side - you'd typically get this from user context
  const userEmail = null; // Replace with actual user email from context
  const userId = null; // Replace with actual user ID from context
  
  return isFeatureEnabled(featureName, userEmail, userId);
}

/**
 * Simple hash function for consistent rollout
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Feature flag admin utilities
 */
export const FeatureFlagAdmin = {
  /**
   * Enable a feature flag (admin only)
   */
  enableFeature(featureName: keyof typeof FEATURE_FLAGS): void {
    if (FEATURE_FLAGS[featureName]) {
      FEATURE_FLAGS[featureName].enabled = true;
    }
  },

  /**
   * Disable a feature flag (admin only)
   */
  disableFeature(featureName: keyof typeof FEATURE_FLAGS): void {
    if (FEATURE_FLAGS[featureName]) {
      FEATURE_FLAGS[featureName].enabled = false;
    }
  },

  /**
   * Update rollout percentage (admin only)
   */
  updateRolloutPercentage(
    featureName: keyof typeof FEATURE_FLAGS,
    percentage: number
  ): void {
    if (FEATURE_FLAGS[featureName]) {
      FEATURE_FLAGS[featureName].rolloutPercentage = Math.max(0, Math.min(100, percentage));
    }
  },

  /**
   * Add allowed user (admin only)
   */
  addAllowedUser(featureName: keyof typeof FEATURE_FLAGS, userId: string): void {
    const feature = FEATURE_FLAGS[featureName];
    if (feature) {
      if (!feature.allowedUsers) {
        feature.allowedUsers = [];
      }
      if (!feature.allowedUsers.includes(userId)) {
        feature.allowedUsers.push(userId);
      }
    }
  },
};

/**
 * Server-side feature flag check with request context
 */
export async function checkFeatureFlag(
  featureName: keyof typeof FEATURE_FLAGS,
  request?: Request
): Promise<boolean> {
  // In a real implementation, you'd extract user info from the request
  // For now, just use the basic check
  return isFeatureEnabled(featureName);
}