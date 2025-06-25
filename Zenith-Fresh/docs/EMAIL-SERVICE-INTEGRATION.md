# Email Service Integration Guide

## Overview

This guide provides comprehensive instructions for configuring email services (Resend and SendGrid) for production deployment of the Zenith Platform, including transactional emails, notifications, and marketing automation.

## 🎯 Email Service Strategy

### Production Email Architecture
```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Application   │───▶│ Email Queue  │───▶│ Email Provider  │
│   (Next.js)     │    │   (Redis)    │    │ (Resend/SG)     │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              │                      │
                              ▼                      ▼
                       ┌──────────────┐    ┌─────────────────┐
                       │   Webhooks   │    │   Analytics     │
                       │  (Delivery)  │    │ (Open/Click)    │
                       └──────────────┘    └─────────────────┘
```

### Email Types by Service
- **Transactional**: User authentication, password resets, receipts
- **Notifications**: System alerts, scan reports, team invitations
- **Marketing**: Newsletters, feature announcements, onboarding
- **Operational**: Monitoring alerts, system status updates

## 📧 Resend Configuration (Primary)

### Step 1: Resend Account Setup

1. **Create Resend Account**
   - Go to [Resend Dashboard](https://resend.com/dashboard)
   - Create account with business email
   - Verify domain ownership

2. **Domain Configuration**
   ```bash
   # DNS Records for your-domain.com
   TXT  @  "resend-domain-verification=your-verification-token"
   
   # MX Records (optional, for receiving emails)
   MX   @  1 feedback-smtp.resend.com
   MX   @  10 feedback-smtp.resend.com
   
   # DKIM Records
   CNAME resend._domainkey "resend._domainkey.resend.com"
   ```

3. **API Key Generation**
   ```
   API Key Name: Zenith Platform Production
   Permissions: Send emails, Webhooks
   Domain: your-domain.com
   ```

### Step 2: Production Configuration

```typescript
// lib/email-service.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailConfig = {
  provider: 'resend',
  from: {
    name: 'Zenith Platform',
    email: 'noreply@your-domain.com'
  },
  replyTo: 'support@your-domain.com',
  
  // Rate limiting
  rateLimit: {
    perHour: 1000,
    perDay: 10000,
    burst: 50
  },
  
  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential'
  }
};

// Environment Variables
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=noreply@your-domain.com
SUPPORT_EMAIL=support@your-domain.com
EMAIL_PROVIDER=resend
```

### Step 3: Email Templates

```typescript
// Email template system
export const emailTemplates = {
  // Authentication emails
  verifyEmail: {
    subject: 'Verify your Zenith Platform account',
    template: 'auth/verify-email',
    category: 'authentication'
  },
  
  passwordReset: {
    subject: 'Reset your password',
    template: 'auth/password-reset',
    category: 'authentication'
  },
  
  // Notification emails
  scanComplete: {
    subject: 'Website scan completed',
    template: 'notifications/scan-complete',
    category: 'notifications'
  },
  
  teamInvitation: {
    subject: 'You\'ve been invited to join a team',
    template: 'notifications/team-invitation',
    category: 'notifications'
  },
  
  // Billing emails
  subscriptionCreated: {
    subject: 'Welcome to Zenith Platform!',
    template: 'billing/subscription-created',
    category: 'billing'
  },
  
  paymentFailed: {
    subject: 'Payment failed - Action required',
    template: 'billing/payment-failed',
    category: 'billing'
  }
};
```

### Step 4: Webhook Configuration

```typescript
// Resend webhook handler
export async function handleResendWebhook(payload: any) {
  const { type, data } = payload;
  
  switch (type) {
    case 'email.sent':
      await updateEmailStatus(data.email_id, 'sent');
      break;
      
    case 'email.delivered':
      await updateEmailStatus(data.email_id, 'delivered');
      break;
      
    case 'email.bounced':
      await handleEmailBounce(data);
      break;
      
    case 'email.complained':
      await handleSpamComplaint(data);
      break;
      
    default:
      console.log(`Unhandled webhook type: ${type}`);
  }
}

// Webhook endpoint
// POST /api/webhooks/resend
```

## 📮 SendGrid Configuration (Backup)

### Step 1: SendGrid Account Setup

1. **Create SendGrid Account**
   - Go to [SendGrid Dashboard](https://sendgrid.com/)
   - Choose appropriate plan (Essentials or Pro)
   - Complete sender authentication

2. **Domain Authentication**
   ```bash
   # CNAME Records for SendGrid
   CNAME s1._domainkey.your-domain.com "s1.domainkey.u12345.wl123.sendgrid.net"
   CNAME s2._domainkey.your-domain.com "s2.domainkey.u12345.wl123.sendgrid.net"
   
   # SPF Record
   TXT @ "v=spf1 include:sendgrid.net ~all"
   
   # DMARC Record
   TXT _dmarc "v=DMARC1; p=none; rua=mailto:dmarc@your-domain.com"
   ```

3. **API Key Generation**
   ```
   API Key Name: Zenith Platform Production
   Permissions: Full Access (for production)
   IP Whitelisting: [Your server IPs]
   ```

### Step 2: SendGrid Configuration

```typescript
// SendGrid configuration
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendGridConfig = {
  provider: 'sendgrid',
  from: {
    name: 'Zenith Platform',
    email: 'noreply@your-domain.com'
  },
  
  // Categories for tracking
  categories: [
    'authentication',
    'notifications',
    'billing',
    'marketing'
  ],
  
  // Tracking settings
  tracking: {
    clickTracking: true,
    openTracking: true,
    subscriptionTracking: false,
    ganalytics: true
  }
};

// Environment Variables
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@your-domain.com
```

### Step 3: SendGrid Templates

```typescript
// Dynamic template system
const sendGridTemplates = {
  verifyEmail: 'd-12345678901234567890',
  passwordReset: 'd-12345678901234567891',
  scanComplete: 'd-12345678901234567892',
  teamInvitation: 'd-12345678901234567893',
  subscriptionCreated: 'd-12345678901234567894',
  paymentFailed: 'd-12345678901234567895'
};

// Send email with template
export async function sendTemplatedEmail(
  to: string,
  templateId: string,
  dynamicTemplateData: any
) {
  const msg = {
    to,
    from: sendGridConfig.from,
    templateId,
    dynamicTemplateData,
    categories: ['transactional'],
    trackingSettings: sendGridConfig.tracking
  };
  
  await sgMail.send(msg);
}
```

## 🔄 Email Service Abstraction Layer

### Unified Email Service

```typescript
// lib/email/email-service.ts
interface EmailProvider {
  send(email: EmailMessage): Promise<EmailResult>;
  sendBulk(emails: EmailMessage[]): Promise<EmailResult[]>;
  getStatus(messageId: string): Promise<EmailStatus>;
}

class EmailService {
  private primaryProvider: EmailProvider;
  private fallbackProvider: EmailProvider;
  
  constructor() {
    this.primaryProvider = new ResendProvider();
    this.fallbackProvider = new SendGridProvider();
  }
  
  async send(email: EmailMessage): Promise<EmailResult> {
    try {
      // Try primary provider first
      return await this.primaryProvider.send(email);
    } catch (error) {
      console.error('Primary email provider failed:', error);
      
      // Fallback to secondary provider
      return await this.fallbackProvider.send(email);
    }
  }
  
  async sendWithTemplate(
    to: string,
    template: string,
    data: any
  ): Promise<EmailResult> {
    const email = await this.buildEmailFromTemplate(template, to, data);
    return this.send(email);
  }
}

export const emailService = new EmailService();
```

### Email Queue System

```typescript
// lib/email/email-queue.ts
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export const emailQueue = new Queue('email', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Email job processor
export async function processEmailJob(job: any) {
  const { type, data } = job.data;
  
  switch (type) {
    case 'single':
      return await emailService.send(data);
      
    case 'bulk':
      return await emailService.sendBulk(data.emails);
      
    case 'template':
      return await emailService.sendWithTemplate(
        data.to,
        data.template,
        data.templateData
      );
      
    default:
      throw new Error(`Unknown email job type: ${type}`);
  }
}

// Add email to queue
export async function queueEmail(emailData: any) {
  return emailQueue.add('send-email', emailData, {
    priority: emailData.priority || 5,
    delay: emailData.delay || 0
  });
}
```

## 📊 Email Analytics and Monitoring

### 1. Delivery Metrics

```typescript
// Email analytics tracking
export const emailAnalytics = {
  // Track email events
  async trackEvent(
    messageId: string,
    event: string,
    metadata?: any
  ) {
    await redis.hincrby('email:stats', `${event}:count`, 1);
    await redis.hincrby('email:stats', `${event}:today`, 1);
    
    // Store event details
    await redis.lpush(`email:events:${messageId}`, JSON.stringify({
      event,
      timestamp: Date.now(),
      metadata
    }));
  },
  
  // Get delivery statistics
  async getStats(period: string = 'today') {
    const stats = await redis.hgetall(`email:stats:${period}`);
    return {
      sent: parseInt(stats.sent || '0'),
      delivered: parseInt(stats.delivered || '0'),
      bounced: parseInt(stats.bounced || '0'),
      complained: parseInt(stats.complained || '0'),
      opened: parseInt(stats.opened || '0'),
      clicked: parseInt(stats.clicked || '0')
    };
  }
};
```

### 2. Alert Configuration

```typescript
// Email service monitoring
const emailAlerts = {
  bounceRateThreshold: 5,      // Alert if bounce rate > 5%
  complaintRateThreshold: 0.1,  // Alert if complaint rate > 0.1%
  deliveryRateThreshold: 95,    // Alert if delivery rate < 95%
  queueLengthThreshold: 1000,   // Alert if queue length > 1000
  
  async checkHealthMetrics() {
    const stats = await emailAnalytics.getStats();
    const bounceRate = (stats.bounced / stats.sent) * 100;
    const complaintRate = (stats.complained / stats.sent) * 100;
    const deliveryRate = (stats.delivered / stats.sent) * 100;
    
    if (bounceRate > this.bounceRateThreshold) {
      await this.alertOpsTeam(`High bounce rate: ${bounceRate}%`);
    }
    
    if (complaintRate > this.complaintRateThreshold) {
      await this.alertOpsTeam(`High complaint rate: ${complaintRate}%`);
    }
    
    if (deliveryRate < this.deliveryRateThreshold) {
      await this.alertOpsTeam(`Low delivery rate: ${deliveryRate}%`);
    }
  }
};
```

## 🔒 Email Security Best Practices

### 1. Authentication and Encryption

```typescript
// Email security configuration
const emailSecurity = {
  // SPF, DKIM, DMARC validation
  domainAuthentication: {
    spf: 'v=spf1 include:resend.com include:sendgrid.net ~all',
    dkim: true,
    dmarc: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@your-domain.com'
  },
  
  // Content security
  contentValidation: {
    sanitizeHtml: true,
    validateUrls: true,
    checkSpamScore: true,
    maxAttachmentSize: '10MB'
  },
  
  // Rate limiting
  rateLimiting: {
    perUser: '50/hour',
    perIP: '100/hour',
    global: '10000/hour'
  }
};
```

### 2. Data Protection

```typescript
// GDPR compliance for emails
const emailGDPR = {
  // Consent tracking
  async trackConsent(email: string, type: string) {
    await redis.hset(`email:consent:${email}`, type, Date.now());
  },
  
  // Unsubscribe handling
  async handleUnsubscribe(email: string, category: string) {
    await redis.sadd(`email:unsubscribed:${category}`, email);
    await this.trackConsent(email, `unsubscribed_${category}`);
  },
  
  // Data retention
  async cleanupOldData() {
    const cutoff = Date.now() - (365 * 24 * 60 * 60 * 1000); // 1 year
    
    // Remove old email logs
    const keys = await redis.keys('email:events:*');
    for (const key of keys) {
      await redis.expire(key, 86400); // 24 hours
    }
  }
};
```

## 🧪 Testing Email Integration

### 1. Development Testing

```typescript
// Email testing utilities
export const emailTesting = {
  // Test email service configuration
  async testConfiguration() {
    try {
      // Test primary provider
      await emailService.send({
        to: 'test@your-domain.com',
        subject: 'Email Service Test',
        text: 'This is a test email from Zenith Platform'
      });
      
      console.log('Email service test successful');
      return true;
    } catch (error) {
      console.error('Email service test failed:', error);
      return false;
    }
  },
  
  // Test template rendering
  async testTemplate(templateName: string, data: any) {
    const email = await buildEmailFromTemplate(templateName, 'test@example.com', data);
    console.log('Rendered email:', email);
    return email;
  },
  
  // Test webhook processing
  async testWebhook(provider: string, payload: any) {
    if (provider === 'resend') {
      return await handleResendWebhook(payload);
    } else if (provider === 'sendgrid') {
      return await handleSendGridWebhook(payload);
    }
  }
};
```

### 2. Production Testing

```bash
#!/bin/bash
# Email service production testing

echo "Testing email service configuration..."

# Test Resend API
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@your-domain.com",
    "to": "test@your-domain.com",
    "subject": "Production Test",
    "text": "This is a production test email"
  }'

# Test SendGrid API
curl -X POST "https://api.sendgrid.com/v3/mail/send" \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{
      "to": [{"email": "test@your-domain.com"}]
    }],
    "from": {"email": "test@your-domain.com"},
    "subject": "Production Test",
    "content": [{
      "type": "text/plain",
      "value": "This is a production test email"
    }]
  }'

echo "Email service tests completed"
```

## 📋 Go-Live Checklist

### Pre-Launch (1 week before)
- [ ] Configure domain authentication (SPF, DKIM, DMARC)
- [ ] Set up primary and backup email providers
- [ ] Create and test all email templates
- [ ] Configure webhook endpoints
- [ ] Set up email queue processing
- [ ] Implement rate limiting
- [ ] Configure monitoring and alerts
- [ ] Test email deliverability
- [ ] Verify GDPR compliance features

### Launch Day
- [ ] Monitor email delivery rates
- [ ] Watch for bounce/complaint rates
- [ ] Check webhook processing
- [ ] Verify template rendering
- [ ] Monitor queue processing
- [ ] Check rate limiting effectiveness
- [ ] Validate analytics tracking

### Post-Launch (1 week after)
- [ ] Analyze email performance metrics
- [ ] Review deliverability reports
- [ ] Optimize template engagement
- [ ] Fine-tune rate limits
- [ ] Update monitoring thresholds
- [ ] Plan template improvements
- [ ] Review security posture

## 🔧 Troubleshooting

### Common Issues

#### 1. Email Not Delivered
```
Check: SPF/DKIM/DMARC records
Check: Sender reputation
Check: Content spam score
Check: Recipient email validity
```

#### 2. High Bounce Rate
```
Check: Email list quality
Check: Double opt-in process
Check: Regular list cleaning
Check: Soft vs hard bounces
```

#### 3. Webhook Failures
```
Check: Endpoint URL configuration
Check: SSL certificate validity
Check: Response time limits
Check: Payload signature verification
```

## 📞 Support Resources

### Provider Support
- **Resend**: [Documentation](https://resend.com/docs), support@resend.com
- **SendGrid**: [Documentation](https://docs.sendgrid.com), support@sendgrid.com

### Email Deliverability Tools
- **Mail Tester**: [mail-tester.com](https://www.mail-tester.com/)
- **MXToolbox**: [mxtoolbox.com](https://mxtoolbox.com/)
- **Google Postmaster**: [postmaster.google.com](https://postmaster.google.com/)

### Internal Resources
- **Email Templates**: `/components/email-templates/`
- **Analytics Dashboard**: `/dashboard/email-analytics`
- **Configuration Guide**: `/docs/email-configuration.md`

---

**Last Updated**: 2025-06-25  
**Version**: 1.0  
**Reviewed By**: DevOps Team, Marketing Team