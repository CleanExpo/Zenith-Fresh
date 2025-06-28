/**
 * Subscription Management API
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { auditLogger } from '@/lib/audit/audit-logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const subscription = team.subscription;

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        plan: 'free',
        status: 'no_subscription',
      });
    }

    // Get plan details
    const plan = await prisma.pricingPlan.findFirst({
      where: { id: subscription.planId },
    });

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planId: subscription.planId,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        trialEnd: subscription.trialEnd,
      },
      plan,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
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

    const { planId, paymentMethodId } = await request.json();

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

    const team = user.teams[0].team;

    // Get plan details
    const plan = await prisma.pricingPlan.findFirst({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Create or get Stripe customer
    let customerId = team.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          teamId: team.id,
          userId: user.id,
        },
      });
      customerId = customer.id;

      await prisma.team.update({
        where: { id: team.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Attach payment method
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripePriceId! }],
      trial_period_days: 14,
      metadata: {
        teamId: team.id,
        planId: plan.id,
      },
    });

    // Create subscription in database
    const subscription = await prisma.subscription.create({
      data: {
        teamId: team.id,
        stripeSubscriptionId: stripeSubscription.id,
        planId: plan.id,
        status: 'TRIALING',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialStart: stripeSubscription.trial_start
          ? new Date(stripeSubscription.trial_start * 1000)
          : null,
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
      },
    });

    // Update team
    await prisma.team.update({
      where: { id: team.id },
      data: {
        stripeSubscriptionId: stripeSubscription.id,
        subscriptionStatus: stripeSubscription.status,
        subscriptionPlan: plan.id,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    await auditLogger.log({
      action: 'subscription_created',
      userId: user.id,
      details: {
        teamId: team.id,
        planId: plan.id,
        subscriptionId: subscription.id,
        stripeSubscriptionId: stripeSubscription.id,
      },
    });

    return NextResponse.json({
      subscription,
      plan,
      clientSecret: null, // No payment required for trial
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await request.json();

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
    const subscription = team.subscription;

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
    }

    // Get new plan
    const newPlan = await prisma.pricingPlan.findFirst({
      where: { id: planId },
    });

    if (!newPlan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Update Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: newPlan.stripePriceId!,
      }],
      proration_behavior: 'create_prorations',
    });

    // Update database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: newPlan.id,
      },
    });

    await prisma.team.update({
      where: { id: team.id },
      data: {
        subscriptionPlan: newPlan.id,
      },
    });

    await auditLogger.log({
      action: 'subscription_updated',
      userId: user.id,
      details: {
        teamId: team.id,
        oldPlanId: subscription.planId,
        newPlanId: newPlan.id,
        subscriptionId: subscription.id,
      },
    });

    return NextResponse.json({
      subscription: {
        ...subscription,
        planId: newPlan.id,
      },
      plan: newPlan,
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const immediate = searchParams.get('immediate') === 'true';

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
    const subscription = team.subscription;

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
    }

    if (immediate) {
      // Cancel immediately
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
          endedAt: new Date(),
        },
      });

      await prisma.team.update({
        where: { id: team.id },
        data: {
          subscriptionStatus: 'canceled',
          subscriptionPlan: 'free',
          subscriptionEndDate: new Date(),
        },
      });
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: true,
        },
      });

      await prisma.team.update({
        where: { id: team.id },
        data: {
          scheduledCancellationDate: subscription.currentPeriodEnd,
        },
      });
    }

    await auditLogger.log({
      action: 'subscription_canceled',
      userId: user.id,
      details: {
        teamId: team.id,
        subscriptionId: subscription.id,
        immediate,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}