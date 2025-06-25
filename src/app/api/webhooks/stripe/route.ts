/**
 * Stripe Webhook Handler
 * Handles subscription lifecycle events from Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { auditLogger } from '@/lib/audit/audit-logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Log the webhook event
    await auditLogger.log({
      action: 'stripe_webhook_received',
      details: {
        eventType: event.type,
        eventId: event.id,
      },
    });

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.upcoming':
        await handleInvoiceUpcoming(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Store billing event
    await storeBillingEvent(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const teamId = subscription.metadata.teamId;
    if (!teamId) return;

    // Get plan ID from price
    const priceId = subscription.items.data[0]?.price?.id;
    const planId = await getPlanIdFromPrice(priceId);

    // Create subscription record
    await prisma.subscription.create({
      data: {
        teamId,
        stripeSubscriptionId: subscription.id,
        planId: planId || 'free',
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialStart: subscription.trial_start
          ? new Date(subscription.trial_start * 1000)
          : null,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
        metadata: subscription.metadata,
      },
    });

    // Update team
    await prisma.team.update({
      where: { id: teamId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionPlan: planId || 'free',
        subscriptionStartDate: new Date(subscription.created * 1000),
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
      },
    });

    await auditLogger.log({
      action: 'subscription_created',
      details: {
        teamId,
        subscriptionId: subscription.id,
        planId,
        status: subscription.status,
      },
    });
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const teamId = subscription.metadata.teamId;
    if (!teamId) return;

    // Get plan ID from price
    const priceId = subscription.items.data[0]?.price?.id;
    const planId = await getPlanIdFromPrice(priceId);

    // Update subscription record
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        planId: planId || 'free',
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
        endedAt: subscription.ended_at
          ? new Date(subscription.ended_at * 1000)
          : null,
        metadata: subscription.metadata,
      },
    });

    // Update team
    await prisma.team.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        subscriptionStatus: subscription.status,
        subscriptionPlan: planId || 'free',
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
        scheduledCancellationDate: subscription.cancel_at_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
      },
    });

    await auditLogger.log({
      action: 'subscription_updated',
      details: {
        teamId,
        subscriptionId: subscription.id,
        planId,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const teamId = subscription.metadata.teamId;
    if (!teamId) return;

    // Update subscription record
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELED',
        endedAt: new Date(),
      },
    });

    // Update team to free plan
    await prisma.team.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        subscriptionStatus: 'canceled',
        subscriptionPlan: 'free',
        subscriptionEndDate: new Date(),
      },
    });

    await auditLogger.log({
      action: 'subscription_canceled',
      details: {
        teamId,
        subscriptionId: subscription.id,
      },
    });
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) return;

    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (!subscription) return;

    // Create invoice record
    await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        number: invoice.number || `inv_${Date.now()}`,
        status: 'PAID',
        currency: invoice.currency,
        subtotal: invoice.subtotal / 100,
        tax: invoice.tax || 0 / 100,
        total: invoice.total / 100,
        amountPaid: invoice.amount_paid / 100,
        amountDue: invoice.amount_due / 100,
        paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
        periodStart: new Date(invoice.period_start! * 1000),
        periodEnd: new Date(invoice.period_end! * 1000),
        metadata: invoice.metadata,
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        invoiceId: (await prisma.invoice.findFirst({
          where: { stripeInvoiceId: invoice.id },
          select: { id: true },
        }))!.id,
        stripePaymentId: invoice.payment_intent as string,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: 'SUCCEEDED',
        processedAt: new Date(),
      },
    });

    // Update revenue metrics
    await updateRevenueMetrics(subscription.teamId, invoice.total / 100);

    await auditLogger.log({
      action: 'payment_succeeded',
      details: {
        teamId: subscription.teamId,
        invoiceId: invoice.id,
        amount: invoice.total / 100,
      },
    });
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) return;

    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (!subscription) return;

    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'PAST_DUE' },
    });

    // Update team
    await prisma.team.update({
      where: { id: subscription.teamId },
      data: {
        subscriptionStatus: 'past_due',
        lastPaymentFailure: new Date(),
      },
    });

    // Create failed payment record
    const invoiceRecord = await prisma.invoice.findFirst({
      where: { stripeInvoiceId: invoice.id },
    });

    if (invoiceRecord) {
      await prisma.payment.create({
        data: {
          invoiceId: invoiceRecord.id,
          amount: invoice.total / 100,
          currency: invoice.currency,
          status: 'FAILED',
          failureReason: 'Payment method declined',
        },
      });

      // Start dunning process
      await initiateDunningProcess(invoiceRecord.id);
    }

    await auditLogger.log({
      action: 'payment_failed',
      details: {
        teamId: subscription.teamId,
        invoiceId: invoice.id,
        amount: invoice.total / 100,
      },
    });
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

/**
 * Handle trial ending soon
 */
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  try {
    const teamId = subscription.metadata.teamId;
    if (!teamId) return;

    // Send trial ending notification
    // TODO: Implement email notification

    await auditLogger.log({
      action: 'trial_ending_notification',
      details: {
        teamId,
        subscriptionId: subscription.id,
        trialEnd: subscription.trial_end,
      },
    });
  } catch (error) {
    console.error('Error handling trial will end:', error);
  }
}

/**
 * Handle upcoming invoice
 */
async function handleInvoiceUpcoming(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) return;

    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (!subscription) return;

    // Send upcoming invoice notification
    // TODO: Implement email notification

    await auditLogger.log({
      action: 'upcoming_invoice_notification',
      details: {
        teamId: subscription.teamId,
        invoiceId: invoice.id,
        amount: invoice.total / 100,
        dueDate: invoice.next_payment_attempt,
      },
    });
  } catch (error) {
    console.error('Error handling upcoming invoice:', error);
  }
}

/**
 * Store billing event
 */
async function storeBillingEvent(event: Stripe.Event) {
  try {
    const data = event.data.object as any;
    let teamId = data.metadata?.teamId;

    // Try to get team ID from subscription if not in metadata
    if (!teamId && data.subscription) {
      const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: data.subscription },
        select: { teamId: true },
      });
      teamId = subscription?.teamId;
    }

    if (!teamId) return;

    await prisma.billingEvent.create({
      data: {
        teamId,
        type: event.type,
        data: event.data.object,
        stripeEventId: event.id,
        processedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error storing billing event:', error);
  }
}

/**
 * Initiate dunning process for failed payment
 */
async function initiateDunningProcess(invoiceId: string) {
  try {
    await prisma.dunningAttempt.create({
      data: {
        invoiceId,
        attemptNumber: 1,
        status: 'PENDING',
        nextAttemptDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      },
    });
  } catch (error) {
    console.error('Error initiating dunning process:', error);
  }
}

/**
 * Update revenue metrics
 */
async function updateRevenueMetrics(teamId: string, amount: number) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.revenueMetric.upsert({
      where: { date: today },
      create: {
        date: today,
        mrr: amount,
        arr: amount * 12,
        newMrr: amount,
        churnedMrr: 0,
        expansionMrr: 0,
        contractionMrr: 0,
        activeSubscriptions: 1,
        newSubscriptions: 1,
        churnedSubscriptions: 0,
        trialConversions: 0,
        averageRevenue: amount,
      },
      update: {
        mrr: { increment: amount },
        arr: { increment: amount * 12 },
        newMrr: { increment: amount },
        activeSubscriptions: { increment: 1 },
        newSubscriptions: { increment: 1 },
      },
    });
  } catch (error) {
    console.error('Error updating revenue metrics:', error);
  }
}

/**
 * Map Stripe status to our enum
 */
function mapStripeStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    'trialing': 'TRIALING',
    'active': 'ACTIVE',
    'past_due': 'PAST_DUE',
    'canceled': 'CANCELED',
    'unpaid': 'UNPAID',
    'incomplete': 'INCOMPLETE',
    'incomplete_expired': 'INCOMPLETE_EXPIRED',
    'paused': 'PAUSED',
  };

  return statusMap[stripeStatus] || 'INCOMPLETE';
}

/**
 * Get plan ID from Stripe price ID
 */
async function getPlanIdFromPrice(priceId?: string): Promise<string | null> {
  if (!priceId) return null;

  const plan = await prisma.pricingPlan.findFirst({
    where: { stripePriceId: priceId },
    select: { id: true },
  });

  return plan?.id || null;
}