/**
 * Subscription Management API Routes
 * Handle subscription creation, updates, and retrieval
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BillingService } from '@/lib/services/billing';
import { StripeHelpers } from '@/lib/stripe';

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
          include: {
            plan: true,
            usageRecords: {
              where: {
                billingPeriodStart: {
                  lte: new Date()
                },
                billingPeriodEnd: {
                  gte: new Date()
                }
              },
              orderBy: { timestamp: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const subscription = user.subscriptions[0];
    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    // Calculate current usage
    const currentUsage = subscription.usageRecords.reduce((acc, record) => {
      acc[record.metricName] = (acc[record.metricName] || 0) + record.quantity;
      return acc;
    }, {} as Record<string, number>);

    // Get usage limits
    const usageLimit = {
      projects: StripeHelpers.getUsageLimit(subscription.plan.tier, 'projects'),
      team_members: StripeHelpers.getUsageLimit(subscription.plan.tier, 'team_members'),
      api_requests: StripeHelpers.getUsageLimit(subscription.plan.tier, 'api_requests'),
      monitoring_checks: StripeHelpers.getUsageLimit(subscription.plan.tier, 'monitoring_checks')
    };

    return NextResponse.json({
      success: true,
      subscription: {
        ...subscription,
        currentUsage,
        usageLimit
      }
    });

  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
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
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      planId,
      paymentMethodId,
      trialDays,
      contractId,
      purchaseOrder,
      billingContact,
      customPricing,
      prorationBehavior = 'create_prorations'
    } = body;

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Create subscription using billing service
    const result = await BillingService.createSubscription({
      userId: user.id,
      planId,
      paymentMethodId,
      trialDays,
      contractId,
      purchaseOrder,
      billingContact,
      customPricing,
      prorationBehavior
    });

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      stripeSubscription: result.stripeSubscription
    });

  } catch (error) {
    console.error('Failed to create subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    if (!user || !user.subscriptions[0]) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const body = await request.json();
    const subscription = user.subscriptions[0];

    // Update subscription using billing service
    const updatedSubscription = await BillingService.updateSubscription(
      subscription.id,
      body
    );

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription
    });

  } catch (error) {
    console.error('Failed to update subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
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
      where: { email: session.user.email },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1
        }
      }
    });

    if (!user || !user.subscriptions[0]) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const cancelImmediately = searchParams.get('immediate') === 'true';

    const subscription = user.subscriptions[0];

    // Cancel subscription using billing service
    const canceledSubscription = await BillingService.cancelSubscription(
      subscription.id,
      cancelImmediately
    );

    return NextResponse.json({
      success: true,
      subscription: canceledSubscription
    });

  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}