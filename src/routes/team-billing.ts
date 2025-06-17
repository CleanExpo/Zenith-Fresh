import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { hasRole } from '../middleware/roles';
import { createAuditLog } from './audit';
import Stripe from 'stripe';

const router = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// Get team billing info
router.get('/:teamId', auth, hasRole(['ADMIN']), async (req, res) => {
  try {
    const { teamId } = req.params;

    const billing = await prisma.teamBilling.findUnique({
      where: { teamId },
      include: {
        team: {
          select: {
            name: true,
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!billing) {
      return res.status(404).json({ error: 'Billing not found' });
    }

    // Get Stripe subscription details if exists
    let subscription = null;
    if (billing.stripeSubscriptionId) {
      subscription = await stripe.subscriptions.retrieve(billing.stripeSubscriptionId);
    }

    res.json({
      ...billing,
      subscription
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create Stripe customer and subscription
router.post('/:teamId/subscribe', auth, hasRole(['ADMIN']), async (req, res) => {
  try {
    const { teamId } = req.params;
    const { plan, paymentMethodId } = req.body;
    const userId = req.user!.id;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { role: 'ADMIN' },
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Get or create Stripe customer
    let billing = await prisma.teamBilling.findUnique({
      where: { teamId }
    });

    let customerId = billing?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: team.members[0].user.email,
        metadata: {
          teamId
        }
      });
      customerId = customer.id;
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: process.env[`STRIPE_${plan.toUpperCase()}_PRICE_ID`] }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent']
    });

    // Update or create billing record
    billing = await prisma.teamBilling.upsert({
      where: { teamId },
      create: {
        teamId,
        plan,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      },
      update: {
        plan,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });

    await createAuditLog({
      action: 'subscribe',
      entityType: 'team_billing',
      entityId: billing.id,
      newValue: { ...billing, subscription },
      userId
    });

    res.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any).payment_intent.client_secret
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel subscription
router.post('/:teamId/cancel', auth, hasRole(['ADMIN']), async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user!.id;

    const billing = await prisma.teamBilling.findUnique({
      where: { teamId }
    });

    if (!billing?.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    // Cancel at period end
    const subscription = await stripe.subscriptions.update(
      billing.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    await prisma.teamBilling.update({
      where: { teamId },
      data: {
        cancelAtPeriodEnd: true
      }
    });

    await createAuditLog({
      action: 'cancel_subscription',
      entityType: 'team_billing',
      entityId: billing.id,
      newValue: { subscription },
      userId
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update payment method
router.post('/:teamId/payment-method', auth, hasRole(['ADMIN']), async (req, res) => {
  try {
    const { teamId } = req.params;
    const { paymentMethodId } = req.body;
    const userId = req.user!.id;

    const billing = await prisma.teamBilling.findUnique({
      where: { teamId }
    });

    if (!billing?.stripeCustomerId) {
      return res.status(400).json({ error: 'No customer found' });
    }

    // Attach new payment method
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: billing.stripeCustomerId
    });

    // Set as default
    await stripe.customers.update(billing.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    await createAuditLog({
      action: 'update_payment_method',
      entityType: 'team_billing',
      entityId: billing.id,
      newValue: { paymentMethodId },
      userId
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']!;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const teamId = subscription.metadata.teamId;

        await prisma.teamBilling.update({
          where: { teamId },
          data: {
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          }
        });
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: 'Webhook error' });
  }
});

export default router; 