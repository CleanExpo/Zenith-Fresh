/**
 * Premium Feature Gates
 * Controls access to premium features based on subscription tier
 */

// Removed React hooks import - this file is used server-side
import { prisma } from '@/lib/prisma';
import { auditLogger } from '@/lib/audit/audit-logger';

export interface FeatureConfig {
  key: string;
  name: string;
  description: string;
  requiredPlans: string[];
  usageMetric?: string;
  limit?: number;
}

export const PREMIUM_FEATURES: Record<string, FeatureConfig> = {
  // AI Features
  'ai.gpt4': {
    key: 'ai.gpt4',
    name: 'GPT-4 AI Analysis',
    description: 'Advanced AI analysis using GPT-4',
    requiredPlans: ['pro', 'enterprise'],
  },
  'ai.claude': {
    key: 'ai.claude',
    name: 'Claude AI Assistant',
    description: 'Claude AI integration for advanced assistance',
    requiredPlans: ['pro', 'enterprise'],
  },
  'ai.custom_models': {
    key: 'ai.custom_models',
    name: 'Custom AI Models',
    description: 'Train and deploy custom AI models',
    requiredPlans: ['enterprise'],
  },

  // Team Features
  'team.unlimited_members': {
    key: 'team.unlimited_members',
    name: 'Unlimited Team Members',
    description: 'Add unlimited team members',
    requiredPlans: ['enterprise'],
    usageMetric: 'team_members',
  },
  'team.advanced_permissions': {
    key: 'team.advanced_permissions',
    name: 'Advanced Permissions',
    description: 'Granular role-based access control',
    requiredPlans: ['pro', 'enterprise'],
  },
  'team.sso': {
    key: 'team.sso',
    name: 'Single Sign-On',
    description: 'Enterprise SSO integration',
    requiredPlans: ['enterprise'],
  },

  // Integration Features
  'integrations.api_access': {
    key: 'integrations.api_access',
    name: 'API Access',
    description: 'Full API access for integrations',
    requiredPlans: ['pro', 'enterprise'],
    usageMetric: 'api_calls',
  },
  'integrations.webhooks': {
    key: 'integrations.webhooks',
    name: 'Webhooks',
    description: 'Real-time webhook notifications',
    requiredPlans: ['pro', 'enterprise'],
  },
  'integrations.custom': {
    key: 'integrations.custom',
    name: 'Custom Integrations',
    description: 'Build custom integrations',
    requiredPlans: ['enterprise'],
  },

  // Analytics Features
  'analytics.advanced': {
    key: 'analytics.advanced',
    name: 'Advanced Analytics',
    description: 'Deep insights and custom reports',
    requiredPlans: ['pro', 'enterprise'],
  },
  'analytics.export': {
    key: 'analytics.export',
    name: 'Data Export',
    description: 'Export analytics data',
    requiredPlans: ['pro', 'enterprise'],
  },
  'analytics.white_label': {
    key: 'analytics.white_label',
    name: 'White Label Reports',
    description: 'Custom branded reports',
    requiredPlans: ['enterprise'],
  },

  // Support Features
  'support.priority': {
    key: 'support.priority',
    name: 'Priority Support',
    description: '24/7 priority support',
    requiredPlans: ['pro', 'enterprise'],
  },
  'support.dedicated': {
    key: 'support.dedicated',
    name: 'Dedicated Support',
    description: 'Dedicated account manager',
    requiredPlans: ['enterprise'],
  },
  'support.sla': {
    key: 'support.sla',
    name: 'SLA Guarantee',
    description: '99.9% uptime SLA',
    requiredPlans: ['enterprise'],
  },

  // Storage & Limits
  'storage.unlimited': {
    key: 'storage.unlimited',
    name: 'Unlimited Storage',
    description: 'Unlimited file storage',
    requiredPlans: ['enterprise'],
    usageMetric: 'storage_gb',
  },
  'storage.cdn': {
    key: 'storage.cdn',
    name: 'CDN Distribution',
    description: 'Global CDN for files',
    requiredPlans: ['pro', 'enterprise'],
  },

  // Advanced Features
  'advanced.custom_branding': {
    key: 'advanced.custom_branding',
    name: 'Custom Branding',
    description: 'Full platform customization',
    requiredPlans: ['enterprise'],
  },
  'advanced.multi_region': {
    key: 'advanced.multi_region',
    name: 'Multi-Region Deployment',
    description: 'Deploy across multiple regions',
    requiredPlans: ['enterprise'],
  },
  'advanced.compliance': {
    key: 'advanced.compliance',
    name: 'Compliance Tools',
    description: 'GDPR, SOC2, HIPAA compliance',
    requiredPlans: ['enterprise'],
  },
};

export class FeatureGateManager {
  private static instance: FeatureGateManager;

  private constructor() {}

  static getInstance(): FeatureGateManager {
    if (!FeatureGateManager.instance) {
      FeatureGateManager.instance = new FeatureGateManager();
    }
    return FeatureGateManager.instance;
  }

  /**
   * Check if a team has access to a feature
   */
  async hasAccess(teamId: string, featureKey: string): Promise<boolean> {
    try {
      const feature = PREMIUM_FEATURES[featureKey];
      if (!feature) {
        console.warn(`Unknown feature: ${featureKey}`);
        return false;
      }

      // Get team subscription
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          subscription: true,
        },
      });

      if (!team) {
        return false;
      }

      // Check if feature is available in free tier
      if (feature.requiredPlans.includes('free')) {
        return true;
      }

      // No subscription means free tier
      if (!team.subscription || team.subscription.status !== 'ACTIVE') {
        return false;
      }

      // Check if plan includes feature
      const planId = team.subscription.planId;
      if (!feature.requiredPlans.includes(planId)) {
        await this.logAccessDenied(teamId, featureKey, planId);
        return false;
      }

      // Check usage limits if applicable
      if (feature.usageMetric && feature.limit !== undefined) {
        const hasLimit = await this.checkUsageLimit(
          teamId,
          feature.usageMetric,
          feature.limit
        );
        if (!hasLimit) {
          await this.logLimitExceeded(teamId, featureKey, feature.usageMetric);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Get all features available to a team
   */
  async getAvailableFeatures(teamId: string): Promise<string[]> {
    const availableFeatures: string[] = [];

    for (const [key, feature] of Object.entries(PREMIUM_FEATURES)) {
      if (await this.hasAccess(teamId, key)) {
        availableFeatures.push(key);
      }
    }

    return availableFeatures;
  }

  /**
   * Check if team has exceeded usage limit
   */
  private async checkUsageLimit(
    teamId: string,
    metric: string,
    limit: number
  ): Promise<boolean> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const usage = await prisma.usageAggregate.findFirst({
      where: {
        teamId,
        metric,
        period: { gte: currentMonth },
        periodType: 'month',
      },
      orderBy: { period: 'desc' },
    });

    return !usage || usage.value < limit;
  }

  /**
   * Track feature usage
   */
  async trackUsage(
    teamId: string,
    featureKey: string,
    quantity: number = 1,
    userId?: string
  ): Promise<void> {
    try {
      const feature = PREMIUM_FEATURES[featureKey];
      if (!feature || !feature.usageMetric) {
        return;
      }

      // Get subscription
      const subscription = await prisma.subscription.findFirst({
        where: { teamId },
      });

      if (!subscription) {
        return;
      }

      // Record usage
      await prisma.usageRecord.create({
        data: {
          subscriptionId: subscription.id,
          teamId,
          userId,
          metric: feature.usageMetric,
          quantity,
          metadata: {
            feature: featureKey,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Update aggregates
      await this.updateUsageAggregates(teamId, feature.usageMetric, quantity);

      await auditLogger.log({
        action: 'feature_usage_tracked',
        userId,
        details: {
          teamId,
          feature: featureKey,
          metric: feature.usageMetric,
          quantity,
        },
      });
    } catch (error) {
      console.error('Error tracking feature usage:', error);
    }
  }

  /**
   * Update usage aggregates
   */
  private async updateUsageAggregates(
    teamId: string,
    metric: string,
    quantity: number
  ): Promise<void> {
    const now = new Date();
    
    // Update hourly aggregate
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);
    
    await prisma.usageAggregate.upsert({
      where: {
        teamId_metric_period_periodType: {
          teamId,
          metric,
          period: hourStart,
          periodType: 'hour',
        },
      },
      create: {
        teamId,
        metric,
        period: hourStart,
        periodType: 'hour',
        value: quantity,
        recordCount: 1,
      },
      update: {
        value: { increment: quantity },
        recordCount: { increment: 1 },
      },
    });

    // Update daily aggregate
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    
    await prisma.usageAggregate.upsert({
      where: {
        teamId_metric_period_periodType: {
          teamId,
          metric,
          period: dayStart,
          periodType: 'day',
        },
      },
      create: {
        teamId,
        metric,
        period: dayStart,
        periodType: 'day',
        value: quantity,
        recordCount: 1,
      },
      update: {
        value: { increment: quantity },
        recordCount: { increment: 1 },
      },
    });

    // Update monthly aggregate
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    await prisma.usageAggregate.upsert({
      where: {
        teamId_metric_period_periodType: {
          teamId,
          metric,
          period: monthStart,
          periodType: 'month',
        },
      },
      create: {
        teamId,
        metric,
        period: monthStart,
        periodType: 'month',
        value: quantity,
        recordCount: 1,
      },
      update: {
        value: { increment: quantity },
        recordCount: { increment: 1 },
      },
    });
  }

  /**
   * Get feature usage for a team
   */
  async getUsage(
    teamId: string,
    metric: string,
    periodType: 'hour' | 'day' | 'month' = 'month'
  ): Promise<{ current: number; limit?: number; percentage?: number }> {
    const period = new Date();
    
    switch (periodType) {
      case 'hour':
        period.setMinutes(0, 0, 0);
        break;
      case 'day':
        period.setHours(0, 0, 0, 0);
        break;
      case 'month':
        period.setDate(1);
        period.setHours(0, 0, 0, 0);
        break;
    }

    const usage = await prisma.usageAggregate.findFirst({
      where: {
        teamId,
        metric,
        period,
        periodType,
      },
    });

    const current = usage?.value || 0;

    // Get limit from subscription
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { subscription: true },
    });

    if (!team?.subscription) {
      return { current };
    }

    // Get plan limits
    const plan = await prisma.pricingPlan.findFirst({
      where: { id: team.subscription.planId },
    });

    if (!plan?.limits) {
      return { current };
    }

    const limits = plan.limits as any;
    const limit = limits[metric];

    if (limit === undefined || limit === -1) {
      return { current };
    }

    return {
      current,
      limit,
      percentage: (current / limit) * 100,
    };
  }

  /**
   * Check if approaching usage limit
   */
  async checkUsageWarnings(teamId: string): Promise<Array<{
    metric: string;
    current: number;
    limit: number;
    percentage: number;
    warning: 'approaching' | 'exceeded';
  }>> {
    const warnings = [];

    // Get all metrics with limits
    const metricsToCheck = ['api_calls', 'storage_gb', 'team_members'];

    for (const metric of metricsToCheck) {
      const usage = await this.getUsage(teamId, metric);
      
      if (usage.limit && usage.percentage) {
        if (usage.percentage >= 100) {
          warnings.push({
            metric,
            current: usage.current,
            limit: usage.limit,
            percentage: usage.percentage,
            warning: 'exceeded' as const,
          });
        } else if (usage.percentage >= 80) {
          warnings.push({
            metric,
            current: usage.current,
            limit: usage.limit,
            percentage: usage.percentage,
            warning: 'approaching' as const,
          });
        }
      }
    }

    return warnings;
  }

  /**
   * Logging methods
   */
  private async logAccessDenied(
    teamId: string,
    featureKey: string,
    currentPlan: string
  ): Promise<void> {
    await auditLogger.log({
      action: 'feature_access_denied',
      details: {
        teamId,
        feature: featureKey,
        currentPlan,
        reason: 'insufficient_plan',
      },
    });
  }

  private async logLimitExceeded(
    teamId: string,
    featureKey: string,
    metric: string
  ): Promise<void> {
    await auditLogger.log({
      action: 'feature_limit_exceeded',
      details: {
        teamId,
        feature: featureKey,
        metric,
        reason: 'usage_limit_exceeded',
      },
    });
  }
}

export const featureGates = FeatureGateManager.getInstance();

/**
 * React hook for feature gates
 */
export function useFeatureGate(featureKey: string, teamId: string) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      const access = await featureGates.hasAccess(teamId, featureKey);
      setHasAccess(access);
      setLoading(false);
    };

    checkAccess();
  }, [featureKey, teamId]);

  return { hasAccess, loading };
}