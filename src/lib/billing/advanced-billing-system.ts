/**
 * Advanced Billing and Subscription Management System
 * Enterprise-grade billing with dunning management, usage tracking, and tax compliance
 */

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { auditLogger } from '@/lib/audit/audit-logger';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  limits: {
    users: number;
    projects: number;
    apiCalls: number;
    storage: number; // in GB
  };
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
}

export interface UsageMetric {
  userId: string;
  teamId: string;
  metric: string;
  value: number;
  timestamp: Date;
  metadata?: any;
}

export interface Invoice {
  id: string;
  teamId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  dueDate: Date;
  paidAt?: Date;
  items: InvoiceItem[];
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: 'subscription' | 'usage' | 'addon' | 'credit';
}

export interface DunningConfiguration {
  enabled: boolean;
  maxAttempts: number;
  attemptInterval: number; // in days
  gracePeriod: number; // in days
  finalWarningDays: number;
  emailTemplates: {
    firstReminder: string;
    secondReminder: string;
    finalWarning: string;
    suspension: string;
  };
}

export interface TaxConfiguration {
  provider: 'stripe' | 'taxjar' | 'avalara';
  enabled: boolean;
  automaticCollection: boolean;
  taxIds: Record<string, string>; // country/region -> tax ID
}

class AdvancedBillingSystem {
  private static instance: AdvancedBillingSystem;
  private usageMetrics: Map<string, UsageMetric[]> = new Map();
  private subscriptionTiers: Map<string, SubscriptionTier> = new Map();
  private dunningConfig: DunningConfiguration;
  private taxConfig: TaxConfiguration;

  private constructor() {
    this.initializeSubscriptionTiers();
    this.initializeDunningConfiguration();
    this.initializeTaxConfiguration();
    this.startUsageAggregation();
    this.startDunningProcess();
  }

  static getInstance(): AdvancedBillingSystem {
    if (!AdvancedBillingSystem.instance) {
      AdvancedBillingSystem.instance = new AdvancedBillingSystem();
    }
    return AdvancedBillingSystem.instance;
  }

  // ==================== SUBSCRIPTION MANAGEMENT ====================

  async createSubscription(
    teamId: string,
    tierId: string,
    billingPeriod: 'monthly' | 'yearly',
    customerId: string,
    paymentMethodId?: string
  ): Promise<any> {
    try {
      const tier = this.subscriptionTiers.get(tierId);
      if (!tier) throw new Error('Invalid subscription tier');

      const priceId = billingPeriod === 'monthly' 
        ? tier.stripePriceIdMonthly 
        : tier.stripePriceIdYearly;

      // Create Stripe subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_options: {
            card: {
              request_three_d_secure: 'if_required',
            },
          },
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          teamId,
          tierId,
          billingPeriod,
        },
        // Enable automatic tax calculation
        automatic_tax: {
          enabled: this.taxConfig.automaticCollection,
        },
        // Set up usage-based billing for API calls
        billing_cycle_anchor_config: {
          day_of_month: 1,
        },
      });

      // Update team subscription in database
      await prisma.team.update({
        where: { id: teamId },
        data: {
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          subscriptionTier: tierId,
          billingPeriod,
          subscriptionStartDate: new Date(),
          subscriptionEndDate: new Date(subscription.current_period_end * 1000),
        },
      });

      // Log subscription creation
      await auditLogger.log({
        action: 'subscription_created',
        userId: null, // Could be extracted from team
        details: {
          teamId,
          subscriptionId: subscription.id,
          tier: tierId,
          billingPeriod,
          amount: billingPeriod === 'monthly' ? tier.priceMonthly : tier.priceYearly,
        },
      });

      return {
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        status: subscription.status,
      };
    } catch (error) {
      await auditLogger.log({
        action: 'subscription_creation_failed',
        details: {
          teamId,
          tierId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  async updateSubscription(
    teamId: string,
    tierId: string,
    billingPeriod: 'monthly' | 'yearly'
  ): Promise<void> {
    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { stripeSubscriptionId: true, subscriptionTier: true },
      });

      if (!team?.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      const tier = this.subscriptionTiers.get(tierId);
      if (!tier) throw new Error('Invalid subscription tier');

      const priceId = billingPeriod === 'monthly' 
        ? tier.stripePriceIdMonthly 
        : tier.stripePriceIdYearly;

      // Get current subscription
      const subscription = await stripe.subscriptions.retrieve(team.stripeSubscriptionId);
      
      // Calculate proration for immediate upgrade/downgrade
      const isUpgrade = this.isUpgrade(team.subscriptionTier!, tierId);
      const prorationBehavior = isUpgrade ? 'always_invoice' : 'create_prorations';

      // Update subscription
      await stripe.subscriptions.update(team.stripeSubscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: priceId,
        }],
        proration_behavior: prorationBehavior,
        metadata: {
          teamId,
          tierId,
          billingPeriod,
          updatedAt: new Date().toISOString(),
        },
      });

      // Update database
      await prisma.team.update({
        where: { id: teamId },
        data: {
          subscriptionTier: tierId,
          billingPeriod,
          updatedAt: new Date(),
        },
      });

      await auditLogger.log({
        action: 'subscription_updated',
        details: {
          teamId,
          oldTier: team.subscriptionTier,
          newTier: tierId,
          billingPeriod,
          isUpgrade,
        },
      });

      // Send update confirmation email
      await this.sendSubscriptionUpdateEmail(teamId, tierId, isUpgrade);
    } catch (error) {
      await auditLogger.log({
        action: 'subscription_update_failed',
        details: {
          teamId,
          tierId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  async cancelSubscription(
    teamId: string,
    cancelAt: 'immediately' | 'period_end' = 'period_end',
    reason?: string
  ): Promise<void> {
    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { stripeSubscriptionId: true, subscriptionTier: true },
      });

      if (!team?.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      if (cancelAt === 'immediately') {
        await stripe.subscriptions.cancel(team.stripeSubscriptionId);
      } else {
        await stripe.subscriptions.update(team.stripeSubscriptionId, {
          cancel_at_period_end: true,
          metadata: {
            cancellation_reason: reason || 'User requested',
            cancelled_at: new Date().toISOString(),
          },
        });
      }

      await prisma.team.update({
        where: { id: teamId },
        data: {
          subscriptionStatus: cancelAt === 'immediately' ? 'cancelled' : 'cancel_at_period_end',
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
      });

      await auditLogger.log({
        action: 'subscription_cancelled',
        details: {
          teamId,
          tier: team.subscriptionTier,
          cancelAt,
          reason,
        },
      });

      await this.sendCancellationEmail(teamId, cancelAt, reason);
    } catch (error) {
      await auditLogger.log({
        action: 'subscription_cancellation_failed',
        details: {
          teamId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  // ==================== USAGE TRACKING ====================

  async recordUsage(usage: Omit<UsageMetric, 'timestamp'>): Promise<void> {
    const fullUsage: UsageMetric = {
      ...usage,
      timestamp: new Date(),
    };

    // Store in memory for recent access
    const key = `${usage.teamId}:${usage.metric}`;
    const metrics = this.usageMetrics.get(key) || [];
    metrics.push(fullUsage);
    
    // Keep only last 1000 metrics per team/metric
    if (metrics.length > 1000) {
      metrics.shift();
    }
    this.usageMetrics.set(key, metrics);

    // Store in database for persistence
    await prisma.usageRecord.create({
      data: {
        teamId: usage.teamId,
        userId: usage.userId,
        metric: usage.metric,
        value: usage.value,
        metadata: usage.metadata ? JSON.stringify(usage.metadata) : null,
        recordedAt: fullUsage.timestamp,
      },
    });

    // Check usage limits
    await this.checkUsageLimits(usage.teamId, usage.metric);

    await auditLogger.log({
      action: 'usage_recorded',
      userId: usage.userId,
      details: {
        teamId: usage.teamId,
        metric: usage.metric,
        value: usage.value,
      },
    });
  }

  async getUsageForPeriod(
    teamId: string,
    metric: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    daily: Array<{ date: Date; value: number }>;
    limit?: number;
    remaining?: number;
  }> {
    const records = await prisma.usageRecord.findMany({
      where: {
        teamId,
        metric,
        recordedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { recordedAt: 'asc' },
    });

    const total = records.reduce((sum, record) => sum + record.value, 0);
    
    // Group by day
    const dailyUsage = new Map<string, number>();
    records.forEach(record => {
      const dateKey = record.recordedAt.toDateString();
      dailyUsage.set(dateKey, (dailyUsage.get(dateKey) || 0) + record.value);
    });

    const daily = Array.from(dailyUsage.entries()).map(([dateStr, value]) => ({
      date: new Date(dateStr),
      value,
    }));

    // Get team limits
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { subscriptionTier: true },
    });

    const tier = team?.subscriptionTier ? this.subscriptionTiers.get(team.subscriptionTier) : null;
    const limit = tier ? this.getUsageLimit(tier, metric) : undefined;
    const remaining = limit !== undefined ? Math.max(0, limit - total) : undefined;

    return { total, daily, limit, remaining };
  }

  async generateUsageInvoice(teamId: string, periodStart: Date, periodEnd: Date): Promise<Invoice> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) throw new Error('Team not found');

    const tier = team.subscriptionTier ? this.subscriptionTiers.get(team.subscriptionTier) : null;
    if (!tier) throw new Error('Invalid subscription tier');

    // Get usage for the period
    const apiUsage = await this.getUsageForPeriod(teamId, 'api_calls', periodStart, periodEnd);
    const storageUsage = await this.getUsageForPeriod(teamId, 'storage_gb', periodStart, periodEnd);

    // Calculate overage charges
    const items: InvoiceItem[] = [];
    
    // Base subscription fee
    items.push({
      description: `${tier.name} subscription`,
      quantity: 1,
      unitPrice: team.billingPeriod === 'monthly' ? tier.priceMonthly : tier.priceYearly,
      amount: team.billingPeriod === 'monthly' ? tier.priceMonthly : tier.priceYearly,
      type: 'subscription',
    });

    // API overage
    if (apiUsage.total > tier.limits.apiCalls) {
      const overage = apiUsage.total - tier.limits.apiCalls;
      const overageRate = 0.001; // $0.001 per API call
      items.push({
        description: `API calls overage (${overage.toLocaleString()} calls)`,
        quantity: overage,
        unitPrice: overageRate,
        amount: overage * overageRate,
        type: 'usage',
      });
    }

    // Storage overage
    if (storageUsage.total > tier.limits.storage) {
      const overage = storageUsage.total - tier.limits.storage;
      const overageRate = 5; // $5 per GB
      items.push({
        description: `Storage overage (${overage.toFixed(2)} GB)`,
        quantity: overage,
        unitPrice: overageRate,
        amount: overage * overageRate,
        type: 'usage',
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = await this.calculateTax(teamId, subtotal);
    const discountAmount = 0; // Could implement discount logic
    const totalAmount = subtotal + taxAmount - discountAmount;

    const invoice: Invoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      teamId,
      subscriptionId: team.stripeSubscriptionId!,
      amount: subtotal,
      currency: 'usd',
      status: 'open',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      items,
      taxAmount,
      discountAmount,
      totalAmount,
      createdAt: new Date(),
    };

    return invoice;
  }

  // ==================== DUNNING MANAGEMENT ====================

  async initiateDunningProcess(teamId: string, invoiceId: string): Promise<void> {
    const dunningState = await prisma.dunningState.findUnique({
      where: { teamId_invoiceId: { teamId, invoiceId } },
    });

    if (dunningState) {
      // Continue existing dunning process
      await this.continueDunningProcess(dunningState);
    } else {
      // Start new dunning process
      await prisma.dunningState.create({
        data: {
          teamId,
          invoiceId,
          attempt: 1,
          nextAttemptDate: new Date(Date.now() + this.dunningConfig.attemptInterval * 24 * 60 * 60 * 1000),
          status: 'active',
          createdAt: new Date(),
        },
      });

      await this.sendDunningEmail(teamId, invoiceId, 'firstReminder');
    }

    await auditLogger.log({
      action: 'dunning_process_initiated',
      details: { teamId, invoiceId },
    });
  }

  private async continueDunningProcess(dunningState: any): Promise<void> {
    if (dunningState.attempt >= this.dunningConfig.maxAttempts) {
      // Max attempts reached, suspend account
      await this.suspendAccount(dunningState.teamId, 'payment_failed');
      await prisma.dunningState.update({
        where: { id: dunningState.id },
        data: { status: 'failed' },
      });
      return;
    }

    const nextAttempt = dunningState.attempt + 1;
    let emailType: keyof DunningConfiguration['emailTemplates'] = 'secondReminder';
    
    if (nextAttempt >= this.dunningConfig.maxAttempts - 1) {
      emailType = 'finalWarning';
    }

    await prisma.dunningState.update({
      where: { id: dunningState.id },
      data: {
        attempt: nextAttempt,
        nextAttemptDate: new Date(Date.now() + this.dunningConfig.attemptInterval * 24 * 60 * 60 * 1000),
        lastAttemptDate: new Date(),
      },
    });

    await this.sendDunningEmail(dunningState.teamId, dunningState.invoiceId, emailType);
  }

  private async sendDunningEmail(
    teamId: string,
    invoiceId: string,
    type: keyof DunningConfiguration['emailTemplates']
  ): Promise<void> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: { where: { role: 'OWNER' } } },
    });

    if (!team || team.members.length === 0) return;

    const ownerEmail = team.members[0].user.email;
    const template = this.dunningConfig.emailTemplates[type];

    const subject = this.getDunningEmailSubject(type);
    const message = template
      .replace('{teamName}', team.name)
      .replace('{invoiceId}', invoiceId)
      .replace('{paymentUrl}', `${process.env.NEXT_PUBLIC_APP_URL}/billing`);

    if (resend) {
      await resend.emails.send({
        from: 'Zenith Billing <billing@zenith.engineer>',
        to: [ownerEmail],
        subject,
        html: message,
        headers: {
          'X-Dunning-Type': type,
          'X-Team-ID': teamId,
          'X-Invoice-ID': invoiceId,
        },
      });
    }

    await auditLogger.log({
      action: 'dunning_email_sent',
      details: { teamId, invoiceId, type, recipient: ownerEmail },
    });
  }

  private async suspendAccount(teamId: string, reason: string): Promise<void> {
    await prisma.team.update({
      where: { id: teamId },
      data: {
        subscriptionStatus: 'suspended',
        suspensionReason: reason,
        suspendedAt: new Date(),
      },
    });

    await this.sendDunningEmail(teamId, '', 'suspension');

    await auditLogger.log({
      action: 'account_suspended',
      details: { teamId, reason },
    });
  }

  // ==================== TAX COMPLIANCE ====================

  private async calculateTax(teamId: string, amount: number): Promise<number> {
    if (!this.taxConfig.enabled || !this.taxConfig.automaticCollection) {
      return 0;
    }

    try {
      // Get team billing address
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { stripeCustomerId: true },
      });

      if (!team?.stripeCustomerId) return 0;

      const customer = await stripe.customers.retrieve(team.stripeCustomerId);
      
      if (typeof customer === 'string' || !customer.address) return 0;

      // Use Stripe Tax (recommended) or integrate with external tax providers
      if (this.taxConfig.provider === 'stripe') {
        const taxCalculation = await stripe.tax.calculations.create({
          currency: 'usd',
          line_items: [{
            amount: Math.round(amount * 100), // Convert to cents
            reference: `team_${teamId}`,
          }],
          customer_details: {
            address: customer.address,
            address_source: 'billing',
          },
        });

        return taxCalculation.amount_total / 100; // Convert back to dollars
      }

      // Fallback to simple tax calculation based on location
      const taxRate = this.getSimpleTaxRate(customer.address.country);
      return amount * taxRate;
    } catch (error) {
      console.error('Tax calculation failed:', error);
      return 0; // Don't fail billing for tax calculation errors
    }
  }

  private getSimpleTaxRate(country: string | null): number {
    // Simplified tax rates - in production, use proper tax calculation service
    const taxRates: Record<string, number> = {
      'US': 0.08, // Average US sales tax
      'CA': 0.13, // Average Canadian tax
      'GB': 0.20, // UK VAT
      'DE': 0.19, // German VAT
      'FR': 0.20, // French VAT
    };

    return taxRates[country || ''] || 0;
  }

  // ==================== HELPER METHODS ====================

  private initializeSubscriptionTiers(): void {
    const tiers: SubscriptionTier[] = [
      {
        id: 'starter',
        name: 'Starter',
        description: 'Perfect for small teams getting started',
        priceMonthly: 29,
        priceYearly: 290, // 2 months free
        features: [
          '5 team members',
          '10 projects',
          '10,000 API calls/month',
          '10 GB storage',
          'Email support',
          'Basic analytics',
        ],
        limits: {
          users: 5,
          projects: 10,
          apiCalls: 10000,
          storage: 10,
        },
        stripePriceIdMonthly: 'price_starter_monthly',
        stripePriceIdYearly: 'price_starter_yearly',
      },
      {
        id: 'professional',
        name: 'Professional',
        description: 'Advanced features for growing businesses',
        priceMonthly: 99,
        priceYearly: 990, // 2 months free
        features: [
          '25 team members',
          '50 projects',
          '100,000 API calls/month',
          '100 GB storage',
          'Priority support',
          'Advanced analytics',
          'Custom integrations',
          'White-label options',
        ],
        limits: {
          users: 25,
          projects: 50,
          apiCalls: 100000,
          storage: 100,
        },
        stripePriceIdMonthly: 'price_professional_monthly',
        stripePriceIdYearly: 'price_professional_yearly',
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Full-scale solution for large organizations',
        priceMonthly: 299,
        priceYearly: 2990, // 2 months free
        features: [
          'Unlimited team members',
          'Unlimited projects',
          '1,000,000 API calls/month',
          '1 TB storage',
          '24/7 dedicated support',
          'Custom analytics',
          'Advanced security',
          'SLA guarantees',
          'On-premise deployment',
        ],
        limits: {
          users: -1, // Unlimited
          projects: -1, // Unlimited
          apiCalls: 1000000,
          storage: 1000,
        },
        stripePriceIdMonthly: 'price_enterprise_monthly',
        stripePriceIdYearly: 'price_enterprise_yearly',
      },
    ];

    tiers.forEach(tier => {
      this.subscriptionTiers.set(tier.id, tier);
    });
  }

  private initializeDunningConfiguration(): void {
    this.dunningConfig = {
      enabled: true,
      maxAttempts: 4,
      attemptInterval: 7, // 7 days
      gracePeriod: 3, // 3 days
      finalWarningDays: 7,
      emailTemplates: {
        firstReminder: `
          <h2>Payment Reminder - {teamName}</h2>
          <p>We noticed your recent payment for {invoiceId} was unsuccessful.</p>
          <p>Please update your payment method to continue using Zenith Platform without interruption.</p>
          <a href="{paymentUrl}">Update Payment Method</a>
        `,
        secondReminder: `
          <h2>Second Payment Reminder - {teamName}</h2>
          <p>Your payment for {invoiceId} is still pending.</p>
          <p>To avoid service interruption, please update your payment method immediately.</p>
          <a href="{paymentUrl}">Pay Now</a>
        `,
        finalWarning: `
          <h2>Final Warning - {teamName}</h2>
          <p>This is your final reminder about the overdue payment for {invoiceId}.</p>
          <p>Your account will be suspended in 24 hours if payment is not received.</p>
          <a href="{paymentUrl}">Pay Immediately</a>
        `,
        suspension: `
          <h2>Account Suspended - {teamName}</h2>
          <p>Your Zenith Platform account has been suspended due to non-payment.</p>
          <p>Contact our billing team to restore your account.</p>
          <a href="{paymentUrl}">Contact Billing</a>
        `,
      },
    };
  }

  private initializeTaxConfiguration(): void {
    this.taxConfig = {
      provider: 'stripe',
      enabled: true,
      automaticCollection: true,
      taxIds: {
        'US': 'US123456789',
        'CA': 'CA123456789',
        'GB': 'GB123456789',
      },
    };
  }

  private async startUsageAggregation(): Promise<void> {
    // Aggregate usage metrics every hour
    setInterval(async () => {
      try {
        await this.aggregateUsageMetrics();
      } catch (error) {
        console.error('Usage aggregation failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  private async startDunningProcess(): Promise<void> {
    // Check for failed payments every 6 hours
    setInterval(async () => {
      try {
        await this.processDunningSchedule();
      } catch (error) {
        console.error('Dunning process failed:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours
  }

  private async aggregateUsageMetrics(): Promise<void> {
    // Aggregate in-memory metrics to database
    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    for (const [key, metrics] of this.usageMetrics) {
      const [teamId, metric] = key.split(':');
      const hourlyMetrics = metrics.filter(m => m.timestamp >= hourStart);
      
      if (hourlyMetrics.length === 0) continue;

      const totalValue = hourlyMetrics.reduce((sum, m) => sum + m.value, 0);

      await prisma.usageAggregate.upsert({
        where: {
          teamId_metric_period: {
            teamId,
            metric,
            period: hourStart,
          },
        },
        create: {
          teamId,
          metric,
          value: totalValue,
          period: hourStart,
          recordCount: hourlyMetrics.length,
        },
        update: {
          value: { increment: totalValue },
          recordCount: { increment: hourlyMetrics.length },
        },
      });
    }
  }

  private async processDunningSchedule(): Promise<void> {
    const pendingDunning = await prisma.dunningState.findMany({
      where: {
        status: 'active',
        nextAttemptDate: { lte: new Date() },
      },
    });

    for (const dunning of pendingDunning) {
      await this.continueDunningProcess(dunning);
    }
  }

  private isUpgrade(currentTier: string, newTier: string): boolean {
    const tierOrder = ['starter', 'professional', 'enterprise'];
    return tierOrder.indexOf(newTier) > tierOrder.indexOf(currentTier);
  }

  private getUsageLimit(tier: SubscriptionTier, metric: string): number | undefined {
    switch (metric) {
      case 'api_calls': return tier.limits.apiCalls;
      case 'storage_gb': return tier.limits.storage;
      case 'projects': return tier.limits.projects === -1 ? undefined : tier.limits.projects;
      case 'users': return tier.limits.users === -1 ? undefined : tier.limits.users;
      default: return undefined;
    }
  }

  private async checkUsageLimits(teamId: string, metric: string): Promise<void> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { subscriptionTier: true },
    });

    if (!team?.subscriptionTier) return;

    const tier = this.subscriptionTiers.get(team.subscriptionTier);
    if (!tier) return;

    const limit = this.getUsageLimit(tier, metric);
    if (!limit) return; // Unlimited

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const usage = await this.getUsageForPeriod(teamId, metric, currentMonth, new Date());

    if (usage.total >= limit) {
      await this.notifyUsageLimitReached(teamId, metric, usage.total, limit);
    } else if (usage.total >= limit * 0.8) {
      await this.notifyUsageWarning(teamId, metric, usage.total, limit);
    }
  }

  private async notifyUsageLimitReached(
    teamId: string,
    metric: string,
    current: number,
    limit: number
  ): Promise<void> {
    // Implement usage limit notification
    await auditLogger.log({
      action: 'usage_limit_reached',
      details: { teamId, metric, current, limit },
    });
  }

  private async notifyUsageWarning(
    teamId: string,
    metric: string,
    current: number,
    limit: number
  ): Promise<void> {
    // Implement usage warning notification
    await auditLogger.log({
      action: 'usage_warning',
      details: { teamId, metric, current, limit, percentage: (current / limit) * 100 },
    });
  }

  private async sendSubscriptionUpdateEmail(
    teamId: string,
    newTier: string,
    isUpgrade: boolean
  ): Promise<void> {
    // Implement subscription update email
    await auditLogger.log({
      action: 'subscription_update_email_sent',
      details: { teamId, newTier, isUpgrade },
    });
  }

  private async sendCancellationEmail(
    teamId: string,
    cancelAt: string,
    reason?: string
  ): Promise<void> {
    // Implement cancellation email
    await auditLogger.log({
      action: 'cancellation_email_sent',
      details: { teamId, cancelAt, reason },
    });
  }

  private getDunningEmailSubject(type: keyof DunningConfiguration['emailTemplates']): string {
    const subjects = {
      firstReminder: 'Payment Reminder - Update Your Payment Method',
      secondReminder: 'Second Payment Reminder - Action Required',
      finalWarning: 'Final Warning - Account Will Be Suspended',
      suspension: 'Account Suspended - Contact Billing Team',
    };
    return subjects[type];
  }

  // ==================== PUBLIC API ====================

  getSubscriptionTiers(): SubscriptionTier[] {
    return Array.from(this.subscriptionTiers.values());
  }

  getSubscriptionTier(tierId: string): SubscriptionTier | undefined {
    return this.subscriptionTiers.get(tierId);
  }

  async generateBillingReport(teamId: string, year: number, month: number): Promise<any> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const usage = await this.getUsageForPeriod(teamId, 'api_calls', startDate, endDate);
    const invoice = await this.generateUsageInvoice(teamId, startDate, endDate);

    return {
      period: { year, month },
      usage,
      invoice,
      generatedAt: new Date(),
    };
  }
}

export const advancedBillingSystem = AdvancedBillingSystem.getInstance();