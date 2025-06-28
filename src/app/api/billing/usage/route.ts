/**
 * Usage Tracking API
 * Provides usage statistics and limits for billing
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { featureGates } from '@/lib/premium-features/feature-gates';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const metric = searchParams.get('metric');

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        teams: {
          include: {
            team: {
              include: {
                subscription: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.teams.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const team = user.teams[0].team;
    const teamId = team.id;

    if (metric) {
      // Get specific metric usage
      const usage = await featureGates.getUsage(teamId, metric, period as any);
      return NextResponse.json({ metric, usage });
    }

    // Get all usage metrics
    const metrics = ['api_calls', 'storage_gb', 'team_members'];
    const usageData: Record<string, any> = {};

    for (const metricName of metrics) {
      usageData[metricName] = await featureGates.getUsage(teamId, metricName, period as any);
    }

    // Get plan details
    const subscription = team.subscription;
    const plan = subscription
      ? await prisma.pricingPlan.findFirst({
          where: { id: subscription.planId },
        })
      : null;

    // Get usage warnings
    const warnings = await featureGates.checkUsageWarnings(teamId);

    // Get billing period info
    const billingPeriod = subscription
      ? {
          start: subscription.currentPeriodStart,
          end: subscription.currentPeriodEnd,
        }
      : null;

    return NextResponse.json({
      usage: usageData,
      plan: plan || { id: 'free', name: 'Free', limits: {} },
      warnings,
      billingPeriod,
      teamId,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { metric, quantity = 1, metadata } = await request.json();

    if (!metric) {
      return NextResponse.json({ error: 'Metric is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        teams: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!user || user.teams.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const teamId = user.teams[0].teamId;

    // Get subscription
    const subscription = await prisma.subscription.findFirst({
      where: { teamId },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Record usage
    await prisma.usageRecord.create({
      data: {
        subscriptionId: subscription.id,
        teamId,
        userId: user.id,
        metric,
        quantity,
        metadata: metadata || {},
      },
    });

    // Update aggregates (simplified for API endpoint)
    const now = new Date();
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording usage:', error);
    return NextResponse.json(
      { error: 'Failed to record usage' },
      { status: 500 }
    );
  }
}