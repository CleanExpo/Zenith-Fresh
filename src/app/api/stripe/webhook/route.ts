import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

// Lazy initialization of Stripe client to avoid build-time errors
let stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
    }
    stripe = new Stripe(apiKey, {
      apiVersion: '2025-05-28.basil',
    });
  }
  return stripe;
}

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not configured');
  }
  return secret;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    const stripeClient = getStripeClient();
    const webhookSecret = getWebhookSecret();
    event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'setup_intent.created':
        console.log('Setup intent created:', event.data.object);
        break;

      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const teamId = session.metadata?.teamId;
        
        if (teamId && session.subscription) {
          await prisma.team.update({
            where: { id: teamId },
            data: {
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: 'active',
            },
          });
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          const stripeClient = getStripeClient();
          const subscription = await stripeClient.subscriptions.retrieve(invoice.subscription as string);
          const team = await prisma.team.findFirst({
            where: { stripeSubscriptionId: subscription.id },
          });
          
          if (team) {
            await prisma.team.update({
              where: { id: team.id },
              data: { subscriptionStatus: 'active' },
            });
          }
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as any;
        if (failedInvoice.subscription) {
          const stripeClient = getStripeClient();
          const subscription = await stripeClient.subscriptions.retrieve(failedInvoice.subscription as string);
          const team = await prisma.team.findFirst({
            where: { stripeSubscriptionId: subscription.id },
          });
          
          if (team) {
            await prisma.team.update({
              where: { id: team.id },
              data: { subscriptionStatus: 'past_due' },
            });
          }
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        const team = await prisma.team.findFirst({
          where: { stripeSubscriptionId: deletedSubscription.id },
        });
        
        if (team) {
          await prisma.team.update({
            where: { id: team.id },
            data: { 
              subscriptionStatus: 'canceled',
              subscriptionEndDate: new Date(),
            },
          });
        }
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        const updatedTeam = await prisma.team.findFirst({
          where: { stripeSubscriptionId: updatedSubscription.id },
        });
        
        if (updatedTeam) {
          await prisma.team.update({
            where: { id: updatedTeam.id },
            data: { 
              subscriptionStatus: updatedSubscription.status,
              subscriptionEndDate: updatedSubscription.current_period_end 
                ? new Date(updatedSubscription.current_period_end * 1000) 
                : null,
              scheduledCancellationDate: updatedSubscription.cancel_at 
                ? new Date(updatedSubscription.cancel_at * 1000) 
                : null,
            },
          });
        }
        break;

      case 'customer.subscription.trial_will_end':
        const trialEndingSubscription = event.data.object as Stripe.Subscription;
        const trialTeam = await prisma.team.findFirst({
          where: { stripeSubscriptionId: trialEndingSubscription.id },
        });
        
        if (trialTeam) {
          // TODO: Send trial ending notification email
          console.log(`Trial ending soon for team ${trialTeam.id}`);
        }
        break;

      case 'invoice.payment_action_required':
        const actionRequiredInvoice = event.data.object as any;
        if (actionRequiredInvoice.subscription) {
          const stripeClient = getStripeClient();
          const subscription = await stripeClient.subscriptions.retrieve(actionRequiredInvoice.subscription as string);
          const paymentTeam = await prisma.team.findFirst({
            where: { stripeSubscriptionId: subscription.id },
          });
          
          if (paymentTeam) {
            // TODO: Send payment action required email
            console.log(`Payment action required for team ${paymentTeam.id}`);
          }
        }
        break;

      case 'customer.created':
        const customer = event.data.object as Stripe.Customer;
        if (customer.metadata?.teamId) {
          await prisma.team.update({
            where: { id: customer.metadata.teamId },
            data: { stripeCustomerId: customer.id },
          });
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
