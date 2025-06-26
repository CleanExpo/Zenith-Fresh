/**
 * Enterprise Billing Service
 * Comprehensive billing and subscription management for Fortune 500 companies
 */

import { stripe, StripeHelpers, PLAN_CONFIG } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { PlanTier, SubscriptionStatus, InvoiceStatus, PaymentStatus, UsageType } from '@prisma/client';
import Stripe from 'stripe';

export class BillingService {
  /**
   * Create or retrieve Stripe customer
   */
  static async createOrGetCustomer(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { billingAddress: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Return existing customer if available
    if (user.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        return customer;
      } catch (error) {
        console.warn('Stripe customer not found, creating new one');
      }
    }

    // Create new Stripe customer
    const customerData: Stripe.CustomerCreateParams = {
      email: user.email,
      name: user.name || undefined,
      metadata: {
        userId: user.id,
        tier: user.tier
      }
    };

    // Add billing address if available
    if (user.billingAddress) {
      customerData.address = {
        line1: user.billingAddress.line1,
        line2: user.billingAddress.line2 || undefined,
        city: user.billingAddress.city,
        state: user.billingAddress.state || undefined,
        postal_code: user.billingAddress.postalCode,
        country: user.billingAddress.country
      };

      if (user.billingAddress.companyName) {
        customerData.name = user.billingAddress.companyName;
      }

      if (user.billingAddress.vatNumber) {
        customerData.tax_id_data = [{
          type: 'eu_vat',
          value: user.billingAddress.vatNumber
        }];
      }
    }

    const customer = await stripe.customers.create(customerData);

    // Update user with Stripe customer ID
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id }
    });

    return customer;
  }

  /**
   * Create subscription with enterprise features
   */
  static async createSubscription(params: {
    userId: string;
    planId: string;
    paymentMethodId?: string;
    trialDays?: number;
    contractId?: string;
    purchaseOrder?: string;
    billingContact?: string;
    customPricing?: any;
    prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
  }) {
    const { userId, planId, paymentMethodId, trialDays, contractId, purchaseOrder, billingContact, customPricing, prorationBehavior = 'create_prorations' } = params;

    // Get user and plan
    const [user, plan] = await Promise.all([
      this.createOrGetCustomer(userId),
      prisma.plan.findUnique({ where: { id: planId } })
    ]);

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Prepare subscription data
    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: user.id,
      items: [{
        price: plan.stripePriceId,
        quantity: 1
      }],
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId,
        planId,
        planTier: plan.tier,
        contractId: contractId || '',
        purchaseOrder: purchaseOrder || '',
        billingContact: billingContact || ''
      },
      proration_behavior: prorationBehavior
    };

    // Add trial period if specified
    if (trialDays) {
      subscriptionData.trial_period_days = trialDays;
    }

    // Set default payment method
    if (paymentMethodId) {
      subscriptionData.default_payment_method = paymentMethodId;
    }

    // Add custom pricing if provided
    if (customPricing && plan.customPricing) {
      subscriptionData.items = customPricing.items || subscriptionData.items;
    }

    // Enable tax collection for enterprise customers
    if (plan.tier === 'ENTERPRISE' || plan.tier === 'BUSINESS') {
      subscriptionData.automatic_tax = { enabled: true };
    }

    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create(subscriptionData);

    // Create database subscription record
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        stripeSubscriptionId: stripeSubscription.id,
        status: stripeSubscription.status as SubscriptionStatus,
        currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        trialStart: (stripeSubscription as any).trial_start ? new Date((stripeSubscription as any).trial_start * 1000) : null,
        trialEnd: (stripeSubscription as any).trial_end ? new Date((stripeSubscription as any).trial_end * 1000) : null,
        contractId,
        customPricing,
        billingContact,
        purchaseOrder,
        latestInvoiceId: (stripeSubscription as any).latest_invoice?.toString(),
        defaultPaymentMethodId: paymentMethodId
      },
      include: {
        plan: true,
        user: true
      }
    });

    // Create subscription items for usage tracking
    if (plan.meteringEnabled) {
      await this.createSubscriptionItems(subscription.id, stripeSubscription.items.data);
    }

    // Update user tier
    await prisma.user.update({
      where: { id: userId },
      data: { tier: plan.tier.toLowerCase() }
    });

    // Log billing event
    await this.logBillingEvent({
      userId,
      subscriptionId: subscription.id,
      eventType: 'subscription_created',
      data: { subscription: stripeSubscription }
    });

    return { subscription, stripeSubscription };
  }

  /**
   * Create subscription items for usage-based billing
   */
  static async createSubscriptionItems(subscriptionId: string, stripeItems: Stripe.SubscriptionItem[]) {
    const items = stripeItems.map(item => ({
      subscriptionId,
      stripePriceId: item.price.id,
      stripeSubscriptionItemId: item.id,
      quantity: item.quantity || 1,
      usageType: this.getUsageTypeFromPrice(item.price) as UsageType,
      unitAmount: item.price.unit_amount
    }));

    await prisma.subscriptionItem.createMany({ data: items });
  }

  /**
   * Update subscription
   */
  static async updateSubscription(subscriptionId: string, updates: Partial<Stripe.SubscriptionUpdateParams>) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Update Stripe subscription
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      updates
    );

    // Update database record
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: stripeSubscription.status as SubscriptionStatus,
        currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: (stripeSubscription as any).cancel_at_period_end,
        canceledAt: (stripeSubscription as any).canceled_at ? new Date((stripeSubscription as any).canceled_at * 1000) : null
      }
    });

    // Log billing event
    await this.logBillingEvent({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      eventType: 'subscription_updated',
      data: { subscription: stripeSubscription, updates }
    });

    return updatedSubscription;
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string, cancelImmediately = false) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    let stripeSubscription;
    
    if (cancelImmediately) {
      stripeSubscription = await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    } else {
      stripeSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
    }

    // Update database record
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: stripeSubscription.status as SubscriptionStatus,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null
      }
    });

    // Log billing event
    await this.logBillingEvent({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      eventType: 'subscription_canceled',
      data: { subscription: stripeSubscription, cancelImmediately }
    });

    return updatedSubscription;
  }

  /**
   * Record usage for metered billing
   */
  static async recordUsage(params: {
    userId: string;
    metricName: string;
    quantity: number;
    timestamp?: Date;
    source?: string;
    metadata?: any;
    subscriptionId?: string;
  }) {
    const { userId, metricName, quantity, timestamp = new Date(), source, metadata, subscriptionId } = params;

    // Get current billing period
    const currentPeriod = await this.getCurrentBillingPeriod(userId, subscriptionId);
    
    // Create usage record
    const usageRecord = await prisma.usageRecord.create({
      data: {
        userId,
        subscriptionId,
        metricName,
        quantity,
        timestamp,
        billingPeriodStart: currentPeriod.start,
        billingPeriodEnd: currentPeriod.end,
        source,
        metadata
      }
    });

    // Report to Stripe if subscription has metered billing
    if (subscriptionId) {
      await this.reportUsageToStripe(usageRecord.id);
    }

    return usageRecord;
  }

  /**
   * Report usage to Stripe for billing
   */
  static async reportUsageToStripe(usageRecordId: string) {
    const usageRecord = await prisma.usageRecord.findUnique({
      where: { id: usageRecordId },
      include: {
        subscription: {
          include: {
            subscriptionItems: true
          }
        }
      }
    });

    if (!usageRecord?.subscription) {
      return;
    }

    // Find matching subscription item
    const subscriptionItem = usageRecord.subscription.subscriptionItems.find(
      item => item.usageType === usageRecord.metricName.toUpperCase().replace(' ', '_')
    );

    if (!subscriptionItem) {
      return;
    }

    try {
      // Create Stripe usage record
      const stripeUsageRecord = await (stripe.subscriptionItems as any).createUsageRecord(
        subscriptionItem.stripeSubscriptionItemId,
        {
          quantity: usageRecord.quantity,
          timestamp: Math.floor(usageRecord.timestamp.getTime() / 1000),
          action: 'increment'
        }
      );

      // Update database record
      await prisma.usageRecord.update({
        where: { id: usageRecordId },
        data: {
          stripeUsageRecordId: stripeUsageRecord.id,
          reportedToStripe: true,
          reportedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Failed to report usage to Stripe:', error);
    }
  }

  /**
   * Create invoice
   */
  static async createInvoice(params: {
    userId: string;
    subscriptionId?: string;
    amount: number;
    currency?: string;
    description?: string;
    dueDate?: Date;
    purchaseOrder?: string;
    customFields?: any;
  }) {
    const { userId, subscriptionId, amount, currency = 'usd', description, dueDate, purchaseOrder, customFields } = params;

    const customer = await this.createOrGetCustomer(userId);

    // Create Stripe invoice
    const stripeInvoice = await stripe.invoices.create({
      customer: customer.id,
      currency,
      auto_advance: false, // Manual review for enterprise
      collection_method: 'send_invoice',
      days_until_due: dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 30,
      metadata: {
        userId,
        subscriptionId: subscriptionId || '',
        purchaseOrder: purchaseOrder || ''
      }
    });

    // Add invoice line item
    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: stripeInvoice.id,
      amount: StripeHelpers.toCents(amount),
      currency,
      description: description || 'Zenith Platform Services'
    });

    // Finalize invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(stripeInvoice.id!);

    // Create database record
    const invoice = await prisma.invoice.create({
      data: {
        userId,
        subscriptionId,
        stripeInvoiceId: finalizedInvoice.id!,
        number: StripeHelpers.generateInvoiceNumber(),
        amount: (finalizedInvoice as any).amount_due,
        currency: (finalizedInvoice as any).currency,
        status: (finalizedInvoice as any).status as InvoiceStatus,
        dueDate,
        purchaseOrder,
        customFields,
        invoicePdfUrl: (finalizedInvoice as any).invoice_pdf,
        hostedInvoiceUrl: (finalizedInvoice as any).hosted_invoice_url
      }
    });

    // Log billing event
    await this.logBillingEvent({
      userId,
      subscriptionId,
      invoiceId: invoice.id,
      eventType: 'invoice_created',
      data: { invoice: finalizedInvoice }
    });

    return { invoice, stripeInvoice: finalizedInvoice };
  }

  /**
   * Process payment attempt
   */
  static async processPaymentAttempt(invoiceId: string, paymentIntentId?: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    let paymentIntent;
    if (paymentIntentId) {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    }

    const attempt = await prisma.paymentAttempt.create({
      data: {
        invoiceId,
        stripePaymentIntentId: paymentIntentId,
        amount: invoice.amount,
        currency: invoice.currency,
        status: paymentIntent?.status as PaymentStatus || 'PENDING',
        failureCode: paymentIntent?.last_payment_error?.code,
        failureMessage: paymentIntent?.last_payment_error?.message,
        paymentMethodId: paymentIntent?.payment_method?.toString()
      }
    });

    // Update invoice attempt count
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { attemptCount: { increment: 1 } }
    });

    return attempt;
  }

  /**
   * Get current billing period
   */
  static async getCurrentBillingPeriod(userId: string, subscriptionId?: string) {
    if (subscriptionId) {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });
      
      if (subscription) {
        return {
          start: subscription.currentPeriodStart,
          end: subscription.currentPeriodEnd
        };
      }
    }

    // Default to monthly period
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return { start, end };
  }

  /**
   * Calculate revenue metrics
   */
  static async calculateRevenueMetrics(periodType: 'daily' | 'weekly' | 'monthly' | 'yearly', periodStart: Date, periodEnd: Date) {
    // Get all paid invoices in period
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        status: 'PAID',
        paidAt: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });

    // Calculate metrics
    const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const recurringRevenue = paidInvoices
      .filter(invoice => invoice.subscription)
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    const oneTimeRevenue = totalRevenue - recurringRevenue;

    // Get customer metrics
    const newCustomers = await prisma.user.count({
      where: {
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        }
      }
    });

    const totalCustomers = await prisma.user.count();

    // Get subscription metrics
    const newSubscriptions = await prisma.subscription.count({
      where: {
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        }
      }
    });

    const canceledSubscriptions = await prisma.subscription.count({
      where: {
        canceledAt: {
          gte: periodStart,
          lte: periodEnd
        }
      }
    });

    const totalSubscriptions = await prisma.subscription.count({
      where: {
        status: 'ACTIVE'
      }
    });

    // Calculate derived metrics
    const averageRevenuePerUser = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;
    const churnRate = totalSubscriptions > 0 ? (canceledSubscriptions / totalSubscriptions) * 100 : 0;

    // Plan breakdown
    const planMetrics = paidInvoices.reduce((acc, invoice) => {
      if (invoice.subscription?.plan) {
        const planName = invoice.subscription.plan.name;
        acc[planName] = (acc[planName] || 0) + invoice.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    // Save metrics
    const metrics = await prisma.revenueMetric.create({
      data: {
        periodType,
        periodStart,
        periodEnd,
        totalRevenue,
        recurringRevenue,
        oneTimeRevenue,
        newCustomers,
        totalCustomers,
        newSubscriptions,
        canceledSubscriptions,
        totalSubscriptions,
        averageRevenuePerUser,
        churnRate,
        planMetrics
      }
    });

    return metrics;
  }

  /**
   * Log billing event
   */
  static async logBillingEvent(params: {
    userId?: string;
    subscriptionId?: string;
    invoiceId?: string;
    eventType: string;
    stripeEventId?: string;
    data: any;
  }) {
    const { userId, subscriptionId, invoiceId, eventType, stripeEventId, data } = params;

    return prisma.billingEvent.create({
      data: {
        userId,
        subscriptionId,
        invoiceId,
        eventType,
        stripeEventId,
        data,
        processed: true,
        processedAt: new Date()
      }
    });
  }

  /**
   * Get usage type from Stripe price
   */
  private static getUsageTypeFromPrice(price: Stripe.Price): string {
    // Extract usage type from price metadata or nickname
    if (price.metadata?.usageType) {
      return price.metadata.usageType;
    }
    
    if (price.nickname?.includes('api')) return 'API_REQUESTS';
    if (price.nickname?.includes('monitoring')) return 'MONITORING_CHECKS';
    if (price.nickname?.includes('team')) return 'TEAM_MEMBERS';
    if (price.nickname?.includes('project')) return 'PROJECTS';
    if (price.nickname?.includes('storage')) return 'STORAGE_GB';
    if (price.nickname?.includes('bandwidth')) return 'BANDWIDTH_GB';
    
    return 'CUSTOM';
  }
}

export default BillingService;