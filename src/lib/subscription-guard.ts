import { prisma } from '@/lib/prisma';
import { 
  SubscriptionLimits, 
  getPlanById, 
  hasFeatureAccess, 
  isWithinLimit, 
  getUpgradePromptMessage 
} from './subscription-plans';

export interface SubscriptionCheckResult {
  allowed: boolean;
  message?: string;
  currentUsage?: number;
  limit?: number | boolean;
  upgradeRequired?: boolean;
}

export class SubscriptionGuard {
  private userId: string;
  private teamId?: string;
  
  constructor(userId: string, teamId?: string) {
    this.userId = userId;
    this.teamId = teamId;
  }

  async getUserPlan(): Promise<string> {
    if (this.teamId) {
      // Check team subscription
      const teamBilling = await prisma.teamBilling.findUnique({
        where: { teamId: this.teamId },
      });
      
      if (teamBilling && teamBilling.status === 'active') {
        return teamBilling.plan;
      }
    }
    
    // Fallback to free plan
    return 'free';
  }

  async checkFeatureAccess(feature: keyof SubscriptionLimits): Promise<SubscriptionCheckResult> {
    const planId = await this.getUserPlan();
    
    if (!hasFeatureAccess(planId, feature)) {
      return {
        allowed: false,
        message: getUpgradePromptMessage(planId, feature),
        upgradeRequired: true,
      };
    }

    return { allowed: true };
  }

  async checkUsageLimit(feature: keyof SubscriptionLimits, currentUsage?: number): Promise<SubscriptionCheckResult> {
    const planId = await this.getUserPlan();
    const plan = getPlanById(planId);
    
    if (!plan) {
      return {
        allowed: false,
        message: 'Invalid subscription plan',
        upgradeRequired: true,
      };
    }

    // If current usage is not provided, fetch it
    if (currentUsage === undefined) {
      currentUsage = await this.getCurrentUsage(feature);
    }

    const limit = plan.limits[feature];
    const withinLimit = isWithinLimit(planId, feature, currentUsage);

    if (!withinLimit) {
      return {
        allowed: false,
        message: getUpgradePromptMessage(planId, feature),
        currentUsage,
        limit,
        upgradeRequired: true,
      };
    }

    return {
      allowed: true,
      currentUsage,
      limit,
    };
  }

  private async getCurrentUsage(feature: keyof SubscriptionLimits): Promise<number> {
    const baseCondition = this.teamId ? { teamId: this.teamId } : { userId: this.userId };

    switch (feature) {
      case 'projects':
        return await prisma.project.count({
          where: baseCondition,
        });

      case 'teamMembers':
        if (!this.teamId) return 0;
        return await prisma.teamMember.count({
          where: { teamId: this.teamId },
        });

      case 'apiCalls':
        // Get this month's API usage
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const analytics = await prisma.teamAnalytics.findUnique({
          where: { teamId: this.teamId || 'no-team' },
          include: {
            usageStats: {
              where: {
                date: {
                  gte: startOfMonth,
                },
              },
            },
          },
        });

        return analytics?.usageStats.reduce((total, stat) => total + stat.requests, 0) || 0;

      case 'storage':
        const files = await prisma.file.findMany({
          where: baseCondition,
          select: { size: true },
        });
        
        const totalBytes = files.reduce((total, file) => total + (file.size || 0), 0);
        return Math.round(totalBytes / (1024 * 1024 * 1024)); // Convert to GB

      case 'emailCampaigns':
        // Get this month's email campaigns
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        return await prisma.emailCampaign.count({
          where: {
            ...baseCondition,
            createdAt: {
              gte: monthStart,
            },
          },
        });

      case 'reviewCampaigns':
        // Get this month's review campaigns
        const reviewMonthStart = new Date();
        reviewMonthStart.setDate(1);
        reviewMonthStart.setHours(0, 0, 0, 0);

        return await prisma.reviewCampaign.count({
          where: {
            userId: this.userId,
            createdAt: {
              gte: reviewMonthStart,
            },
          },
        });

      case 'seoAnalyses':
        // Get this month's SEO analyses
        const seoMonthStart = new Date();
        seoMonthStart.setDate(1);
        seoMonthStart.setHours(0, 0, 0, 0);

        // This would need to be tracked in a separate table or analytics
        // For now, return 0 as placeholder
        return 0;

      default:
        return 0;
    }
  }

  async recordUsage(feature: keyof SubscriptionLimits, amount: number = 1): Promise<void> {
    // Record usage for billing/analytics purposes
    try {
      if (this.teamId) {
        // Update team analytics
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await prisma.usageStats.upsert({
          where: {
            teamAnalyticsId_date: {
              teamAnalyticsId: this.teamId,
              date: today,
            },
          },
          update: {
            requests: {
              increment: feature === 'apiCalls' ? amount : 0,
            },
          },
          create: {
            teamAnalyticsId: this.teamId,
            date: today,
            requests: feature === 'apiCalls' ? amount : 0,
            tokens: 0,
          },
        });
      }
    } catch (error) {
      console.error('Failed to record usage:', error);
      // Don't throw error, as this is for analytics only
    }
  }

  async getUsageSummary(): Promise<{
    plan: string;
    usage: Record<string, { current: number; limit: number | boolean; percentage?: number }>;
  }> {
    const planId = await this.getUserPlan();
    const plan = getPlanById(planId);
    
    if (!plan) {
      throw new Error('Invalid subscription plan');
    }

    const features: (keyof SubscriptionLimits)[] = [
      'projects',
      'teamMembers',
      'apiCalls',
      'storage',
      'emailCampaigns',
      'reviewCampaigns',
      'seoAnalyses',
    ];

    const usage: Record<string, { current: number; limit: number | boolean; percentage?: number }> = {};

    for (const feature of features) {
      const current = await this.getCurrentUsage(feature);
      const limit = plan.limits[feature];
      
      let percentage: number | undefined;
      if (typeof limit === 'number' && limit > 0) {
        percentage = Math.round((current / limit) * 100);
      }

      usage[feature] = {
        current,
        limit,
        percentage,
      };
    }

    return {
      plan: planId,
      usage,
    };
  }
}

// Helper functions for middleware and API routes
export async function requireFeatureAccess(
  userId: string,
  feature: keyof SubscriptionLimits,
  teamId?: string
): Promise<SubscriptionCheckResult> {
  const guard = new SubscriptionGuard(userId, teamId);
  return await guard.checkFeatureAccess(feature);
}

export async function requireUsageLimit(
  userId: string,
  feature: keyof SubscriptionLimits,
  teamId?: string,
  currentUsage?: number
): Promise<SubscriptionCheckResult> {
  const guard = new SubscriptionGuard(userId, teamId);
  return await guard.checkUsageLimit(feature, currentUsage);
}

export function createSubscriptionMiddleware(feature: keyof SubscriptionLimits) {
  return async (userId: string, teamId?: string) => {
    const result = await requireFeatureAccess(userId, feature, teamId);
    
    if (!result.allowed) {
      throw new Error(result.message || 'Feature not available on your current plan');
    }
    
    return result;
  };
}