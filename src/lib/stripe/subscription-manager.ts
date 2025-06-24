/**
 * Stripe Subscription Manager
 * 
 * Complete subscription lifecycle management for production-ready SaaS
 * Handles trials, upgrades, downgrades, cancellations, and payment failures
 */

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

// Initialize Stripe with error handling
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
    })
  : null;

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceId: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    websiteScans?: number;
    competitiveReports?: number;
    teamMembers?: number;
    apiCalls?: number;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'freemium',
    name: 'Freemium',
    priceId: '', // No price ID for free tier
    price: 0,
    interval: 'month',
    features: [
      '5 website health scans per day',
      'Basic health score',
      'Core recommendations',
      'Email support'
    ],
    limits: {
      websiteScans: 5,
      competitiveReports: 0,
      teamMembers: 1,
      apiCalls: 100
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
    price: 79,
    interval: 'month',
    features: [
      '100 website health scans per day',
      'Detailed insights & recommendations',
      'Competitive gap analysis',
      'Priority support',
      'API access',
      'Export reports'
    ],
    limits: {
      websiteScans: 100,
      competitiveReports: 10,
      teamMembers: 5,
      apiCalls: 5000
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    price: 199,
    interval: 'month',
    features: [
      'Unlimited website health scans',
      'White-label reports',
      'Full API access',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Multi-region deployment'
    ],
    limits: {
      websiteScans: -1, // Unlimited
      competitiveReports: -1, // Unlimited
      teamMembers: -1, // Unlimited
      apiCalls: -1 // Unlimited
    }
  }
];

export class StripeSubscriptionManager {
  constructor() {
    if (!stripe) {
      console.warn('⚠️ Stripe not configured - subscription features disabled');
    }
  }

  /**
   * Create a new subscription with trial period
   */
  async createSubscription(
    teamId: string,
    priceId: string,
    options?: {
      trialDays?: number;
      couponId?: string;
      paymentMethodId?: string;
    }
  ) {
    if (!stripe) throw new Error('Stripe not configured');

    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: { members: true }
      });

      if (!team) throw new Error('Team not found');

      // Create or retrieve Stripe customer
      let customerId = team.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: team.members[0]?.user.email,
          metadata: { teamId }
        });
        customerId = customer.id;

        await prisma.team.update({
          where: { id: teamId },
          data: { stripeCustomerId: customerId }
        });
      }

      // Create subscription
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: priceId }],
        metadata: { teamId },
        trial_period_days: options?.trialDays || 14,
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent']
      };

      if (options?.couponId) {
        subscriptionParams.coupon = options.couponId;
      }

      if (options?.paymentMethodId) {
        subscriptionParams.default_payment_method = options.paymentMethodId;
      }

      const subscription = await stripe.subscriptions.create(subscriptionParams);

      // Update team with subscription info
      await prisma.team.update({
        where: { id: teamId },
        data: {
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          subscriptionPlan: this.getPlanFromPriceId(priceId)?.id || 'premium',
          subscriptionStartDate: new Date(subscription.created * 1000),
          subscriptionEndDate: subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000) 
            : null
        }
      });

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription (upgrade/downgrade)
   */
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
    options?: {
      prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
      immediatePayment?: boolean;
    }
  ) {
    if (!stripe) throw new Error('Stripe not configured');

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      if (!subscription) throw new Error('Subscription not found');

      // Update subscription items
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId
        }],
        proration_behavior: options?.prorationBehavior || 'create_prorations',
        payment_behavior: options?.immediatePayment ? 'pending_if_incomplete' : 'allow_incomplete'
      });

      // Update team plan
      const team = await prisma.team.findFirst({
        where: { stripeSubscriptionId: subscriptionId }
      });

      if (team) {
        await prisma.team.update({
          where: { id: team.id },
          data: {
            subscriptionPlan: this.getPlanFromPriceId(newPriceId)?.id || 'premium',
            subscriptionStatus: updatedSubscription.status
          }
        });
      }

      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    options?: {
      cancelAtPeriodEnd?: boolean;
      cancellationReason?: string;
    }
  ) {
    if (!stripe) throw new Error('Stripe not configured');

    try {
      const cancelOptions: Stripe.SubscriptionUpdateParams = {
        cancel_at_period_end: options?.cancelAtPeriodEnd ?? true
      };

      if (!options?.cancelAtPeriodEnd) {
        // Immediate cancellation
        const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
        
        // Update team
        const team = await prisma.team.findFirst({
          where: { stripeSubscriptionId: subscriptionId }
        });

        if (team) {
          await prisma.team.update({
            where: { id: team.id },
            data: {
              subscriptionStatus: 'canceled',
              subscriptionEndDate: new Date(),
              cancellationReason: options?.cancellationReason
            }
          });
        }

        return canceledSubscription;
      } else {
        // Cancel at period end
        const subscription = await stripe.subscriptions.update(subscriptionId, cancelOptions);
        
        // Update team
        const team = await prisma.team.findFirst({
          where: { stripeSubscriptionId: subscriptionId }
        });

        if (team) {
          await prisma.team.update({
            where: { id: team.id },
            data: {
              subscriptionStatus: 'canceling',
              scheduledCancellationDate: subscription.current_period_end 
                ? new Date(subscription.current_period_end * 1000) 
                : null,
              cancellationReason: options?.cancellationReason
            }
          });
        }

        return subscription;
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Resume a canceled subscription
   */
  async resumeSubscription(subscriptionId: string) {
    if (!stripe) throw new Error('Stripe not configured');

    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });

      // Update team
      const team = await prisma.team.findFirst({
        where: { stripeSubscriptionId: subscriptionId }
      });

      if (team) {
        await prisma.team.update({
          where: { id: team.id },
          data: {
            subscriptionStatus: 'active',
            scheduledCancellationDate: null,
            cancellationReason: null
          }
        });
      }

      return subscription;
    } catch (error) {
      console.error('Error resuming subscription:', error);
      throw error;
    }
  }

  /**
   * Handle payment failure and retry
   */
  async handlePaymentFailure(invoiceId: string) {
    if (!stripe) throw new Error('Stripe not configured');

    try {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      
      if (!invoice.subscription) return;

      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      
      // Update team status
      const team = await prisma.team.findFirst({
        where: { stripeSubscriptionId: subscription.id }
      });

      if (team) {
        await prisma.team.update({
          where: { id: team.id },
          data: {
            subscriptionStatus: 'past_due',
            lastPaymentFailure: new Date()
          }
        });

        // Send payment failure notification
        await this.sendPaymentFailureNotification(team.id, invoice);
      }

      return invoice;
    } catch (error) {
      console.error('Error handling payment failure:', error);
      throw error;
    }
  }

  /**
   * Create a customer portal session
   */
  async createPortalSession(teamId: string, returnUrl: string) {
    if (!stripe) throw new Error('Stripe not configured');

    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId }
      });

      if (!team || !team.stripeCustomerId) {
        throw new Error('No Stripe customer found for team');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: team.stripeCustomerId,
        return_url: returnUrl
      });

      return session;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  /**
   * Get subscription usage and limits
   */
  async getSubscriptionUsage(teamId: string) {
    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId }
      });

      if (!team) throw new Error('Team not found');

      const plan = SUBSCRIPTION_PLANS.find(p => p.id === (team.subscriptionPlan || 'freemium'));
      
      // Get current usage from database
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const websiteScans = await prisma.websiteScan.count({
        where: {
          teamId,
          createdAt: { gte: today }
        }
      });

      const competitiveReports = await prisma.competitiveReport.count({
        where: {
          teamId,
          createdAt: { 
            gte: new Date(today.getFullYear(), today.getMonth(), 1) 
          }
        }
      });

      const teamMembers = await prisma.teamMember.count({
        where: { teamId }
      });

      return {
        plan: plan || SUBSCRIPTION_PLANS[0],
        usage: {
          websiteScans,
          competitiveReports,
          teamMembers,
          apiCalls: 0 // TODO: Implement API call tracking
        },
        limits: plan?.limits || SUBSCRIPTION_PLANS[0].limits,
        percentages: {
          websiteScans: plan?.limits.websiteScans === -1 ? 0 : 
            (websiteScans / (plan?.limits.websiteScans || 1)) * 100,
          competitiveReports: plan?.limits.competitiveReports === -1 ? 0 :
            (competitiveReports / (plan?.limits.competitiveReports || 1)) * 100,
          teamMembers: plan?.limits.teamMembers === -1 ? 0 :
            (teamMembers / (plan?.limits.teamMembers || 1)) * 100
        }
      };
    } catch (error) {
      console.error('Error getting subscription usage:', error);
      throw error;
    }
  }

  /**
   * Check if team can access a feature based on subscription
   */
  async canAccessFeature(teamId: string, feature: string): Promise<boolean> {
    try {
      const usage = await this.getSubscriptionUsage(teamId);
      
      switch (feature) {
        case 'website_scan':
          return usage.limits.websiteScans === -1 || 
            usage.usage.websiteScans < usage.limits.websiteScans;
        
        case 'competitive_report':
          return usage.limits.competitiveReports === -1 || 
            usage.usage.competitiveReports < usage.limits.competitiveReports;
        
        case 'add_team_member':
          return usage.limits.teamMembers === -1 || 
            usage.usage.teamMembers < usage.limits.teamMembers;
        
        case 'api_access':
          return usage.plan.id !== 'freemium';
        
        case 'white_label':
          return usage.plan.id === 'enterprise';
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Get upcoming invoice preview
   */
  async getUpcomingInvoice(teamId: string) {
    if (!stripe) throw new Error('Stripe not configured');

    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId }
      });

      if (!team || !team.stripeCustomerId) {
        throw new Error('No Stripe customer found for team');
      }

      const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        customer: team.stripeCustomerId
      });

      return upcomingInvoice;
    } catch (error) {
      console.error('Error getting upcoming invoice:', error);
      throw error;
    }
  }

  /**
   * Apply coupon to subscription
   */
  async applyCoupon(subscriptionId: string, couponId: string) {
    if (!stripe) throw new Error('Stripe not configured');

    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        coupon: couponId
      });

      return subscription;
    } catch (error) {
      console.error('Error applying coupon:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private getPlanFromPriceId(priceId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find(plan => plan.priceId === priceId);
  }

  private async sendPaymentFailureNotification(teamId: string, invoice: Stripe.Invoice) {
    // TODO: Implement email notification using Resend
    console.log(`Payment failure notification for team ${teamId}, invoice ${invoice.id}`);
  }

  /**
   * Create Stripe products and prices (run once during setup)
   */
  async setupStripeProducts() {
    if (!stripe) throw new Error('Stripe not configured');

    try {
      // Create products
      const premiumProduct = await stripe.products.create({
        name: 'Zenith Premium',
        description: 'Advanced website analysis and competitive intelligence'
      });

      const enterpriseProduct = await stripe.products.create({
        name: 'Zenith Enterprise',
        description: 'Unlimited access with white-label and custom integrations'
      });

      // Create prices
      const premiumPrice = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 7900, // $79.00
        currency: 'usd',
        recurring: { interval: 'month' }
      });

      const enterprisePrice = await stripe.prices.create({
        product: enterpriseProduct.id,
        unit_amount: 19900, // $199.00
        currency: 'usd',
        recurring: { interval: 'month' }
      });

      console.log('Stripe products created:');
      console.log(`Premium Price ID: ${premiumPrice.id}`);
      console.log(`Enterprise Price ID: ${enterprisePrice.id}`);
      console.log('Add these to your environment variables:');
      console.log(`STRIPE_PREMIUM_PRICE_ID=${premiumPrice.id}`);
      console.log(`STRIPE_ENTERPRISE_PRICE_ID=${enterprisePrice.id}`);

      return { premiumPrice, enterprisePrice };
    } catch (error) {
      console.error('Error setting up Stripe products:', error);
      throw error;
    }
  }
}

export const subscriptionManager = new StripeSubscriptionManager();