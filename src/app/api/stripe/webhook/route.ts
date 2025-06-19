import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-05-28.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
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
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
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
        const failedInvoice = event.data.object as Stripe.Invoice;
        if (failedInvoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription as string);
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
              stripeSubscriptionId: null,
            },
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