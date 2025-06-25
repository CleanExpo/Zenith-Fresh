# Stripe Production Configuration Guide

## Overview

This guide provides comprehensive instructions for configuring Stripe in production for the Zenith Platform, including security best practices, webhook setup, and compliance requirements.

## 🔐 Production Security Requirements

### 1. API Key Management

**CRITICAL**: Never use test keys in production environments.

```bash
# Production Keys (Live Mode)
STRIPE_PUBLISHABLE_KEY=pk_live_...  # Public key for client-side
STRIPE_SECRET_KEY=sk_live_...       # Secret key for server-side
STRIPE_WEBHOOK_SECRET=whsec_...     # Webhook endpoint secret
```

### 2. Key Rotation Policy

- **Quarterly Rotation**: Rotate all Stripe keys every 3 months
- **Incident Response**: Immediate rotation if keys are compromised
- **Access Logging**: Monitor all API key usage

```bash
# Generate new webhook secret
curl -X POST https://api.stripe.com/v1/webhook_endpoints \
  -u sk_live_...: \
  -d url="https://your-domain.com/api/webhooks/stripe" \
  -d "enabled_events[]"="*"
```

## 🏗️ Production Setup Steps

### Step 1: Stripe Dashboard Configuration

1. **Enable Live Mode**
   - Navigate to Stripe Dashboard
   - Toggle to "Live" mode in top-left corner
   - Complete business verification if required

2. **Business Information**
   ```
   Business Name: [Your Company Name]
   Business Type: SaaS Platform
   Industry: Software/Technology
   Website: https://your-domain.com
   ```

3. **Tax Settings**
   - Enable automatic tax calculation
   - Configure tax rates by jurisdiction
   - Set up tax reporting

### Step 2: Product Configuration

```typescript
// Create products and prices
const products = [
  {
    name: "Zenith Starter",
    price: 2900, // $29.00
    interval: "month",
    features: ["Website Analyzer", "Basic Analytics", "Email Support"]
  },
  {
    name: "Zenith Professional",
    price: 9900, // $99.00
    interval: "month",
    features: ["All Starter", "Advanced Analytics", "Team Collaboration", "Priority Support"]
  },
  {
    name: "Zenith Enterprise",
    price: 29900, // $299.00
    interval: "month",
    features: ["All Professional", "AI Orchestration", "Custom Integrations", "Dedicated Support"]
  }
];
```

### Step 3: Webhook Configuration

```typescript
// Required webhook events
const webhookEvents = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.created',
  'customer.updated',
  'payment_method.attached',
  'setup_intent.succeeded',
  'checkout.session.completed'
];
```

**Production Webhook Endpoint**: `https://your-domain.com/api/webhooks/stripe`

### Step 4: Customer Portal Configuration

1. **Enable Customer Portal**
   - Go to Billing → Customer Portal
   - Configure allowed actions:
     - Update payment methods
     - View billing history
     - Cancel subscriptions
     - Update billing information

2. **Branding Configuration**
   ```
   Logo: Upload your company logo
   Primary Color: #your-brand-color
   Privacy Policy: https://your-domain.com/privacy
   Terms of Service: https://your-domain.com/terms
   ```

## 💳 Payment Processing Configuration

### 1. Payment Methods

Enable multiple payment methods for global customers:

```typescript
// Supported payment methods
const paymentMethods = [
  'card',           // Credit/Debit cards
  'alipay',         // Alipay (China)
  'ideal',          // iDEAL (Netherlands)
  'sepa_debit',     // SEPA Direct Debit (Europe)
  'ach_debit',      // ACH Direct Debit (US)
  'bacs_debit',     // Bacs Direct Debit (UK)
  'bancontact',     // Bancontact (Belgium)
  'giropay',        // Giropay (Germany)
  'p24',            // Przelewy24 (Poland)
  'sofort'          // Sofort (Europe)
];
```

### 2. Currency Configuration

```typescript
// Multi-currency support
const supportedCurrencies = {
  'USD': { symbol: '$', locale: 'en-US' },
  'EUR': { symbol: '€', locale: 'de-DE' },
  'GBP': { symbol: '£', locale: 'en-GB' },
  'CAD': { symbol: 'C$', locale: 'en-CA' },
  'AUD': { symbol: 'A$', locale: 'en-AU' },
  'JPY': { symbol: '¥', locale: 'ja-JP' }
};
```

### 3. Tax Configuration

```typescript
// Automatic tax calculation
const taxConfig = {
  automatic_tax: {
    enabled: true,
    liability: {
      type: 'self'
    }
  },
  customer_update: {
    address: 'auto',
    shipping: 'auto'
  }
};
```

## 🔒 Security Best Practices

### 1. Webhook Security

```typescript
// Webhook signature verification
export async function verifyStripeWebhook(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    return true;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}
```

### 2. API Security

```typescript
// Rate limiting for Stripe API calls
const rateLimiter = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  skipSuccessfulRequests: true
};

// Idempotency keys for safe retries
const createPaymentIntent = async (amount: number, customerId: string) => {
  const idempotencyKey = `pi_${customerId}_${Date.now()}`;
  
  return await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    customer: customerId
  }, {
    idempotencyKey
  });
};
```

### 3. Data Protection

```typescript
// PCI DSS Compliance
const pciCompliance = {
  // Never store card data
  storeCardData: false,
  
  // Use Stripe Elements for card collection
  useStripeElements: true,
  
  // Implement strong authentication
  requireSCA: true,
  
  // Regular security scans
  securityScans: 'quarterly'
};
```

## 📊 Monitoring & Analytics

### 1. Key Metrics to Monitor

```typescript
const stripeMetrics = {
  // Revenue metrics
  mrr: 'Monthly Recurring Revenue',
  arr: 'Annual Recurring Revenue',
  churn: 'Customer Churn Rate',
  ltv: 'Customer Lifetime Value',
  
  // Operational metrics
  failedPayments: 'Failed Payment Rate',
  disputeRate: 'Dispute Rate',
  refundRate: 'Refund Rate',
  
  // Conversion metrics
  checkoutConversion: 'Checkout Conversion Rate',
  trialConversion: 'Trial to Paid Conversion',
  upsellConversion: 'Upsell Conversion Rate'
};
```

### 2. Alert Configuration

```typescript
// Critical alerts
const alertThresholds = {
  failedPaymentRate: 5,    // Alert if >5% payments fail
  disputeRate: 1,          // Alert if >1% dispute rate
  webhookFailures: 10,     // Alert if >10 webhook failures/hour
  apiErrorRate: 2          // Alert if >2% API error rate
};
```

## 🌍 Global Compliance

### 1. Regional Requirements

```typescript
const complianceRequirements = {
  EU: {
    sca: true,              // Strong Customer Authentication
    gdpr: true,             // GDPR compliance
    vatMoss: true           // VAT MOSS for digital services
  },
  US: {
    pciDss: true,           // PCI DSS compliance
    stateTax: true,         // State-level tax compliance
    achCompliance: true     // ACH processing compliance
  },
  UK: {
    sca: true,              // Strong Customer Authentication
    ukca: true,             // UK Conformity Assessed
    vatDigital: true        // Digital VAT rules
  }
};
```

### 2. Tax Compliance

```typescript
// Automatic tax calculation setup
const taxCalculation = {
  // Enable for all transactions
  automaticTax: true,
  
  // Tax inclusive pricing where required
  taxInclusive: {
    EU: true,
    UK: true,
    AU: true,
    CA: false,
    US: false
  },
  
  // Tax reporting
  reporting: {
    frequency: 'monthly',
    automated: true,
    jurisdiction: 'all'
  }
};
```

## 🔄 Disaster Recovery

### 1. Backup Procedures

```bash
#!/bin/bash
# Stripe data backup script

# Export customer data
stripe customers list --limit 100 > customers_backup.json

# Export subscription data
stripe subscriptions list --limit 100 > subscriptions_backup.json

# Export product data
stripe products list --limit 100 > products_backup.json

# Store backups securely
aws s3 cp *.json s3://your-backup-bucket/stripe/$(date +%Y-%m-%d)/
```

### 2. Incident Response

```typescript
// Automated incident response
const incidentResponse = {
  webhookFailures: {
    threshold: 10,
    action: 'alert_devops',
    escalation: '15_minutes'
  },
  
  paymentFailures: {
    threshold: '5%',
    action: 'alert_finance',
    escalation: '5_minutes'
  },
  
  apiErrors: {
    threshold: '2%',
    action: 'failover_processing',
    escalation: 'immediate'
  }
};
```

## 🧪 Testing in Production

### 1. Staged Rollouts

```typescript
// Feature flags for payment features
const paymentFeatureFlags = {
  newCheckoutFlow: {
    enabled: true,
    rollout: 25  // 25% of users
  },
  
  multiCurrency: {
    enabled: true,
    rollout: 50  // 50% of users
  },
  
  customerPortalV2: {
    enabled: false,
    rollout: 0   // Not yet released
  }
};
```

### 2. A/B Testing

```typescript
// Pricing experiments
const pricingTests = {
  starterPricing: {
    control: 2900,      // $29/month
    variant: 3900,      // $39/month
    traffic: 50,        // 50/50 split
    metric: 'conversion_rate'
  }
};
```

## 📋 Go-Live Checklist

### Pre-Launch (2 weeks before)
- [ ] Complete Stripe account verification
- [ ] Configure all products and pricing
- [ ] Set up webhook endpoints
- [ ] Implement webhook signature verification
- [ ] Configure customer portal
- [ ] Set up tax calculation
- [ ] Test payment flows end-to-end
- [ ] Verify refund processes
- [ ] Configure monitoring and alerts
- [ ] Document incident response procedures

### Launch Week
- [ ] Switch to live API keys
- [ ] Enable webhook endpoints
- [ ] Monitor all payment flows
- [ ] Test customer portal access
- [ ] Verify tax calculations
- [ ] Monitor webhook delivery
- [ ] Check subscription renewals
- [ ] Validate invoice generation

### Post-Launch (1 week after)
- [ ] Review payment success rates
- [ ] Analyze customer behavior
- [ ] Monitor churn indicators
- [ ] Validate tax compliance
- [ ] Review security logs
- [ ] Update documentation
- [ ] Plan next optimizations

## 🔧 Troubleshooting Common Issues

### 1. Webhook Delivery Failures

```typescript
// Retry failed webhooks
const retryWebhook = async (eventId: string) => {
  try {
    const event = await stripe.events.retrieve(eventId);
    await processWebhookEvent(event);
    
    // Log successful retry
    console.log(`Webhook ${eventId} processed successfully on retry`);
  } catch (error) {
    console.error(`Webhook retry failed for ${eventId}:`, error);
    // Alert development team
    await alertDevTeam(`Webhook ${eventId} failed after retry`);
  }
};
```

### 2. Payment Failures

```typescript
// Handle failed payments gracefully
const handlePaymentFailure = async (customerId: string, error: any) => {
  // Update customer payment status
  await updateCustomerStatus(customerId, 'payment_failed');
  
  // Send notification to customer
  await sendPaymentFailureEmail(customerId, error.decline_code);
  
  // Trigger dunning management
  await triggerDunningProcess(customerId);
  
  // Log for analysis
  console.log(`Payment failed for customer ${customerId}:`, error);
};
```

### 3. Subscription State Issues

```typescript
// Synchronize subscription states
const syncSubscriptionState = async (subscriptionId: string) => {
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const localSubscription = await getLocalSubscription(subscriptionId);
  
  if (stripeSubscription.status !== localSubscription.status) {
    await updateLocalSubscription(subscriptionId, {
      status: stripeSubscription.status,
      current_period_end: stripeSubscription.current_period_end,
      current_period_start: stripeSubscription.current_period_start
    });
    
    console.log(`Synchronized subscription ${subscriptionId} state`);
  }
};
```

## 📞 Support and Resources

### Stripe Support Channels
- **Live Chat**: Available 24/7 for production issues
- **Email Support**: support@stripe.com
- **Phone Support**: Available for high-volume accounts
- **Developer Slack**: Stripe Developer Community

### Internal Resources
- **Runbook**: `/docs/stripe-runbook.md`
- **API Documentation**: `/docs/api/billing.md`
- **Incident Response**: `/docs/incident-response.md`
- **Compliance Guide**: `/docs/compliance/payment-processing.md`

### Emergency Contacts
- **Primary**: development-team@your-company.com
- **Secondary**: devops@your-company.com
- **Finance**: finance@your-company.com
- **Legal**: legal@your-company.com

---

**Last Updated**: 2025-06-25  
**Version**: 1.0  
**Reviewed By**: DevOps Team, Finance Team, Legal Team