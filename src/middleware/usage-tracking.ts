/**
 * Usage Tracking Middleware
 * Tracks API calls, resource usage, and feature usage for billing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { featureGates } from '@/lib/premium-features/feature-gates';

interface UsageContext {
  teamId?: string;
  userId?: string;
  endpoint: string;
  method: string;
  requestSize: number;
  responseSize?: number;
  duration?: number;
  statusCode?: number;
}

export class UsageTracker {
  private static instance: UsageTracker;
  private buffer: Map<string, any[]> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startFlushInterval();
  }

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  /**
   * Track API usage
   */
  async trackApiUsage(context: UsageContext): Promise<void> {
    try {
      if (!context.teamId) return;

      // Buffer the usage data
      const key = `api_calls:${context.teamId}`;
      const buffer = this.buffer.get(key) || [];
      buffer.push({
        ...context,
        timestamp: new Date(),
      });
      this.buffer.set(key, buffer);

      // Track feature usage if applicable
      const featureKey = this.getFeatureFromEndpoint(context.endpoint);
      if (featureKey) {
        await featureGates.trackUsage(
          context.teamId,
          featureKey,
          1,
          context.userId
        );
      }
    } catch (error) {
      console.error('Error tracking API usage:', error);
    }
  }

  /**
   * Track storage usage
   */
  async trackStorageUsage(
    teamId: string,
    bytes: number,
    operation: 'upload' | 'download' | 'delete'
  ): Promise<void> {
    try {
      const gbUsed = bytes / (1024 * 1024 * 1024);
      
      // For deletes, use negative value
      const quantity = operation === 'delete' ? -gbUsed : gbUsed;

      await featureGates.trackUsage(teamId, 'storage.unlimited', quantity);

      // Buffer storage operations
      const key = `storage_gb:${teamId}`;
      const buffer = this.buffer.get(key) || [];
      buffer.push({
        operation,
        bytes,
        gbUsed: quantity,
        timestamp: new Date(),
      });
      this.buffer.set(key, buffer);
    } catch (error) {
      console.error('Error tracking storage usage:', error);
    }
  }

  /**
   * Track team member changes
   */
  async trackTeamMemberChange(
    teamId: string,
    change: 'added' | 'removed'
  ): Promise<void> {
    try {
      const quantity = change === 'added' ? 1 : -1;
      await featureGates.trackUsage(teamId, 'team.unlimited_members', quantity);
    } catch (error) {
      console.error('Error tracking team member change:', error);
    }
  }

  /**
   * Flush buffered usage data to database
   */
  private async flushBuffer(): Promise<void> {
    try {
      const entries = Array.from(this.buffer.entries());
      
      for (const [key, data] of entries) {
        const [metric, teamId] = key.split(':');
        
        if (data.length === 0) continue;

        // Get subscription
        const subscription = await prisma.subscription.findFirst({
          where: { teamId },
        });

        if (!subscription) continue;

        // Aggregate data
        const totalQuantity = data.reduce((sum, item) => {
          if (metric === 'api_calls') return sum + 1;
          if (metric === 'storage_gb') return sum + (item.gbUsed || 0);
          return sum;
        }, 0);

        // Create usage record
        await prisma.usageRecord.create({
          data: {
            subscriptionId: subscription.id,
            teamId,
            metric,
            quantity: totalQuantity,
            metadata: {
              count: data.length,
              details: data.slice(0, 100), // Keep first 100 for debugging
            },
          },
        });

        // Update aggregates
        await this.updateAggregates(teamId, metric, totalQuantity);
      }

      // Clear buffer
      this.buffer.clear();
    } catch (error) {
      console.error('Error flushing usage buffer:', error);
    }
  }

  /**
   * Update usage aggregates
   */
  private async updateAggregates(
    teamId: string,
    metric: string,
    quantity: number
  ): Promise<void> {
    const now = new Date();
    const periods = [
      { type: 'hour', date: new Date(now.setMinutes(0, 0, 0)) },
      { type: 'day', date: new Date(now.setHours(0, 0, 0, 0)) },
      { type: 'month', date: new Date(now.setDate(1)) },
    ];

    for (const { type, date } of periods) {
      await prisma.usageAggregate.upsert({
        where: {
          teamId_metric_period_periodType: {
            teamId,
            metric,
            period: date,
            periodType: type,
          },
        },
        create: {
          teamId,
          metric,
          period: date,
          periodType: type,
          value: quantity,
          recordCount: 1,
        },
        update: {
          value: { increment: quantity },
          recordCount: { increment: 1 },
        },
      });
    }
  }

  /**
   * Start interval to flush buffer
   */
  private startFlushInterval(): void {
    // Flush every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushBuffer();
    }, 30000);
  }

  /**
   * Stop the flush interval
   */
  stopFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Map endpoints to features
   */
  private getFeatureFromEndpoint(endpoint: string): string | null {
    const featureMap: Record<string, string> = {
      '/api/ai/gpt4': 'ai.gpt4',
      '/api/ai/claude': 'ai.claude',
      '/api/analytics/export': 'analytics.export',
      '/api/integrations/webhook': 'integrations.webhooks',
      '/api/reports/white-label': 'analytics.white_label',
    };

    for (const [pattern, feature] of Object.entries(featureMap)) {
      if (endpoint.startsWith(pattern)) {
        return feature;
      }
    }

    return null;
  }
}

/**
 * Usage tracking middleware
 */
export async function usageTrackingMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const startTime = Date.now();
  const tracker = UsageTracker.getInstance();

  try {
    // Get auth token
    const token = await getToken({ req: request as any });
    if (!token?.sub) return null;

    // Get team from user
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      include: {
        teams: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!user || user.teams.length === 0) return null;

    const teamId = user.teams[0].teamId;
    const endpoint = request.nextUrl.pathname;
    const method = request.method;

    // Calculate request size
    const requestSize = request.headers.get('content-length') 
      ? parseInt(request.headers.get('content-length')!)
      : 0;

    // Track the request
    await tracker.trackApiUsage({
      teamId,
      userId: user.id,
      endpoint,
      method,
      requestSize,
    });

    // Check rate limits based on plan
    const hasAccess = await featureGates.hasAccess(teamId, 'integrations.api_access');
    if (!hasAccess && endpoint.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'API access requires a paid subscription' },
        { status: 403 }
      );
    }

    // Check specific feature access
    const requiredFeature = getRequiredFeature(endpoint);
    if (requiredFeature) {
      const featureAccess = await featureGates.hasAccess(teamId, requiredFeature);
      if (!featureAccess) {
        return NextResponse.json(
          { 
            error: 'This feature requires a higher subscription tier',
            feature: requiredFeature,
            upgrade_url: '/billing/upgrade'
          },
          { status: 403 }
        );
      }
    }

    return null;
  } catch (error) {
    console.error('Usage tracking error:', error);
    return null;
  }
}

/**
 * Get required feature for endpoint
 */
function getRequiredFeature(endpoint: string): string | null {
  // Define endpoints that require specific features
  const featureRequirements: Record<string, string> = {
    '/api/ai/gpt4': 'ai.gpt4',
    '/api/ai/claude': 'ai.claude',
    '/api/ai/custom-model': 'ai.custom_models',
    '/api/team/sso': 'team.sso',
    '/api/analytics/advanced': 'analytics.advanced',
    '/api/analytics/export': 'analytics.export',
    '/api/reports/white-label': 'analytics.white_label',
    '/api/integrations/custom': 'integrations.custom',
    '/api/support/priority': 'support.priority',
  };

  for (const [pattern, feature] of Object.entries(featureRequirements)) {
    if (endpoint.startsWith(pattern)) {
      return feature;
    }
  }

  return null;
}

export const usageTracker = UsageTracker.getInstance();