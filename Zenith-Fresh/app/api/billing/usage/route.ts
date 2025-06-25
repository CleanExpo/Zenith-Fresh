/**
 * Usage Tracking API Routes
 * Handle usage recording and retrieval for metered billing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BillingService } from '@/lib/services/billing';
import { USAGE_METRICS, StripeHelpers } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get('metric');
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    // Get current billing period
    const currentPeriod = await BillingService.getCurrentBillingPeriod(
      user.id,
      user.subscriptions[0]?.id
    );

    const where: any = {
      userId: user.id,
      billingPeriodStart: currentPeriod.start,
      billingPeriodEnd: currentPeriod.end
    };

    if (metricName) {
      where.metricName = metricName;
    }

    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get usage records
    const usageRecords = await prisma.usageRecord.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    // Calculate current usage by metric
    const currentUsage = usageRecords.reduce((acc, record) => {
      acc[record.metricName] = (acc[record.metricName] || 0) + record.quantity;
      return acc;
    }, {} as Record<string, number>);

    // Get usage limits from subscription plan
    const subscription = user.subscriptions[0];
    const usageMetrics = Object.entries(USAGE_METRICS).map(([key, metric]) => {
      const current = currentUsage[key] || 0;
      const limit = subscription ? StripeHelpers.getUsageLimit(subscription.plan.tier, key.toLowerCase()) : 0;
      
      // Calculate trend (mock data for now)
      const trend = Math.random() * 20 - 10; // -10% to +10%
      
      return {
        metricName: key,
        displayName: metric.displayName,
        description: metric.description,
        unit: metric.unit,
        current,
        limit,
        percentage: limit > 0 ? (current / limit) * 100 : 0,
        trend
      };
    });

    return NextResponse.json({
      success: true,
      usage: usageMetrics,
      records: usageRecords,
      currentPeriod
    });

  } catch (error) {
    console.error('Failed to fetch usage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      metricName,
      quantity,
      timestamp,
      source = 'api',
      metadata
    } = body;

    if (!metricName || quantity === undefined) {
      return NextResponse.json(
        { error: 'Metric name and quantity are required' },
        { status: 400 }
      );
    }

    // Validate metric name
    if (!USAGE_METRICS[metricName as keyof typeof USAGE_METRICS]) {
      return NextResponse.json(
        { error: 'Invalid metric name' },
        { status: 400 }
      );
    }

    // Record usage
    const usageRecord = await BillingService.recordUsage({
      userId: user.id,
      metricName,
      quantity,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      source,
      metadata,
      subscriptionId: user.subscriptions[0]?.id
    });

    return NextResponse.json({
      success: true,
      usageRecord
    });

  } catch (error) {
    console.error('Failed to record usage:', error);
    return NextResponse.json(
      { error: 'Failed to record usage' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');
    const metricName = searchParams.get('metric');
    const userId = searchParams.get('userId');

    if (recordId) {
      // Delete specific usage record
      await prisma.usageRecord.delete({
        where: { id: recordId }
      });
    } else if (metricName && userId) {
      // Delete all usage records for a metric and user
      await prisma.usageRecord.deleteMany({
        where: {
          userId,
          metricName
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Record ID or metric/user combination required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usage records deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete usage records:', error);
    return NextResponse.json(
      { error: 'Failed to delete usage records' },
      { status: 500 }
    );
  }
}