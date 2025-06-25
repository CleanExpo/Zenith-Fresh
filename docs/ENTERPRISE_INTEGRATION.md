# Enterprise Integration Features - Week 6

This document provides comprehensive documentation for the enterprise integration features implemented in Week 6 of the SaaS development roadmap.

## Overview

The Enterprise Integration system provides B2B customers with:

1. **Single Sign-On (SSO)** - SAML 2.0 and OAuth providers
2. **API Management** - RESTful APIs with authentication and rate limiting
3. **Webhook System** - Real-time event notifications
4. **Third-Party Integrations** - Slack, Teams, GitHub, and more
5. **White-Label Platform** - Custom branding and domains

## Table of Contents

- [SSO Integration](#sso-integration)
- [API Management](#api-management)
- [Webhook System](#webhook-system)
- [Third-Party Integrations](#third-party-integrations)
- [White-Label Platform](#white-label-platform)
- [Security Considerations](#security-considerations)
- [Development Guide](#development-guide)

---

## SSO Integration

### SAML 2.0 Support

The platform supports SAML 2.0 for enterprise single sign-on.

#### Configuration

```typescript
import { SamlProvider, SamlConfigManager } from '@/lib/auth/sso/saml-provider';

// Save SAML configuration
await SamlConfigManager.saveConfig(tenantId, {
  entryPoint: 'https://sso.company.com/saml/login',
  issuer: 'https://company.zenith.engineer',
  callbackUrl: 'https://company.zenith.engineer/auth/saml/callback',
  cert: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
  signatureAlgorithm: 'sha256'
});

// Create SAML provider
const samlProvider = new SamlProvider(tenantId, config);
const metadata = await samlProvider.generateMetadata();
```

#### API Endpoints

- `GET /api/enterprise/sso/saml?tenantId={id}` - Get SAML metadata
- `POST /api/enterprise/sso/saml` - Save SAML configuration

### OAuth Providers

Support for Google Workspace, Microsoft 365, Okta, and Auth0.

```typescript
import { OAuthProvider, OAuthConfigManager } from '@/lib/auth/sso/oauth-provider';

// Configure Google Workspace SSO
await OAuthConfigManager.saveConfig(tenantId, {
  provider: 'google_workspace',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  domain: 'company.com' // Domain restriction
});
```

### SCIM Directory Sync

Automatic user and group synchronization from identity providers.

#### SCIM Endpoints

- `GET /api/scim/v2/Users` - List users
- `POST /api/scim/v2/Users` - Create user
- `GET /api/scim/v2/Users/{id}` - Get user
- `PUT /api/scim/v2/Users/{id}` - Update user
- `DELETE /api/scim/v2/Users/{id}` - Delete user
- `GET /api/scim/v2/Groups` - List groups
- `POST /api/scim/v2/Groups` - Create group

#### SCIM Configuration

```typescript
import { ScimProvider } from '@/lib/auth/sso/scim-provider';

const scim = new ScimProvider(tenantId, baseUrl);

// Create a user
const user = await scim.createUser({
  schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
  userName: 'john.doe@company.com',
  name: {
    givenName: 'John',
    familyName: 'Doe'
  },
  emails: [{
    value: 'john.doe@company.com',
    primary: true
  }],
  active: true
});
```

---

## API Management

### API Key Management

Secure API key generation, rotation, and management.

```typescript
import { ApiKeyManager } from '@/lib/api/api-management';

// Create an API key
const apiKey = await ApiKeyManager.createApiKey({
  name: 'Production API',
  tenantId: 'tenant-123',
  scope: ['users', 'projects', 'analytics'],
  rateLimit: 1000,
  rateLimitWindow: 3600000, // 1 hour
  expiresAt: new Date('2024-12-31')
});

// Validate API key
const validation = await ApiKeyManager.validateApiKey(keyString);
if (validation.valid) {
  // API key is valid
  console.log('API key belongs to:', validation.apiKey.tenantId);
}
```

### Rate Limiting

Built-in rate limiting with configurable windows and limits.

```typescript
import { RateLimiter } from '@/lib/api/api-management';

// Check rate limit
const rateLimit = await RateLimiter.checkRateLimit(apiKeyId, {
  requests: 1000,
  windowMs: 3600000 // 1 hour
});

if (!rateLimit.allowed) {
  // Rate limit exceeded
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { 
      status: 429,
      headers: {
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    }
  );
}
```

### SDK Generation

Automatic SDK generation for popular programming languages.

```typescript
import { SdkGenerator } from '@/lib/api/api-management';

// Generate TypeScript SDK
const sdkCode = await SdkGenerator.generateTypeScriptSdk(tenantId);

// The generated SDK includes:
// - Type-safe API client
// - Authentication handling
// - Error handling
// - Rate limit awareness
```

### API Endpoints

- `GET /api/enterprise/api-keys` - List API keys
- `POST /api/enterprise/api-keys` - Create API key
- `DELETE /api/enterprise/api-keys` - Revoke API key
- `POST /api/enterprise/api-keys/rotate` - Rotate API key

---

## Webhook System

### Creating Webhooks

```typescript
import { WebhookManager } from '@/lib/webhooks/webhook-system';

// Create a webhook subscription
const subscription = await WebhookManager.createSubscription({
  url: 'https://api.company.com/webhooks/zenith',
  events: ['user.created', 'project.updated', 'task.completed'],
  tenantId: 'tenant-123',
  secret: 'webhook-secret', // Optional
  filters: { // Optional event filtering
    projectId: 'project-456'
  },
  retryConfig: {
    maxRetries: 3,
    backoffMultiplier: 2,
    maxBackoffSeconds: 300
  }
});
```

### Event Types

- **User Events**: `user.created`, `user.updated`, `user.deleted`
- **Project Events**: `project.created`, `project.updated`, `project.deleted`
- **Team Events**: `team.member_added`, `team.member_removed`
- **Subscription Events**: `subscription.created`, `subscription.updated`, `subscription.cancelled`

### Triggering Events

```typescript
import { WebhookEvents } from '@/lib/webhooks/webhook-system';

// Trigger user creation event
await WebhookEvents.userCreated(tenantId, {
  id: 'user-123',
  email: 'john@company.com',
  name: 'John Doe',
  createdAt: new Date()
});

// Trigger project update event
await WebhookEvents.projectUpdated(tenantId, {
  id: 'project-456',
  name: 'Updated Project',
  status: 'in-progress'
});
```

### Webhook Security

Webhooks are secured with HMAC signatures:

```typescript
import { WebhookManager } from '@/lib/webhooks/webhook-system';

// Validate webhook signature
const isValid = await WebhookManager.validateWebhookSignature(
  payload,
  signature,
  secret
);

if (!isValid) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

### API Endpoints

- `GET /api/enterprise/webhooks` - List webhook subscriptions
- `POST /api/enterprise/webhooks` - Create webhook subscription
- `PUT /api/enterprise/webhooks` - Update webhook subscription
- `DELETE /api/enterprise/webhooks` - Delete webhook subscription

---

## Third-Party Integrations

### Slack Integration

```typescript
import { SlackIntegration, SlackConfigManager } from '@/lib/integrations/slack-integration';

// Configure Slack integration
await SlackConfigManager.saveConfig(tenantId, {
  botToken: 'xoxb-your-bot-token',
  signingSecret: 'your-signing-secret',
  appId: 'your-app-id',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  workspaceId: 'workspace-id',
  workspaceName: 'Company Workspace'
});

// Send project notification
const slack = new SlackIntegration(tenantId, config);
await slack.sendProjectNotification(project, 'created');
```

#### Slack Features

- Project notifications
- Team member updates
- Slash commands (`/zenith projects list`, `/zenith teams`)
- Interactive buttons and cards

### Microsoft Teams Integration

```typescript
import { TeamsIntegration, TeamsConfigManager } from '@/lib/integrations/teams-integration';

// Configure Teams integration
await TeamsConfigManager.saveConfig(tenantId, {
  appId: 'your-app-id',
  appPassword: 'your-app-password',
  tenantId: 'azure-tenant-id',
  servicePrincipalId: 'service-principal-id'
});

// Send adaptive card notification
const teams = new TeamsIntegration(tenantId, config);
await teams.sendProjectNotification(project, 'updated');
```

### GitHub Integration

```typescript
import { GitHubIntegration, GitHubConfigManager } from '@/lib/integrations/github-integration';

// Configure GitHub App
await GitHubConfigManager.saveConfig(tenantId, {
  appId: 'your-github-app-id',
  privateKey: 'your-private-key',
  webhookSecret: 'your-webhook-secret',
  installationId: 'installation-id',
  repositoryName: 'owner/repository'
});

// Create GitHub issue from task
const github = new GitHubIntegration(tenantId, config);
const issue = await github.createIssue({
  title: 'Task: Fix user authentication',
  body: 'Description of the task...',
  labels: ['bug', 'high-priority'],
  assignees: ['developer-username']
});
```

#### GitHub Features

- Automatic issue creation from tasks
- Pull request notifications
- Issue/PR status synchronization
- User mapping between GitHub and platform

### Webhook Endpoints

- `POST /api/webhooks/slack` - Slack events and commands
- `POST /api/webhooks/teams` - Microsoft Teams bot activities
- `POST /api/webhooks/github` - GitHub repository events

---

## White-Label Platform

### Brand Configuration

```typescript
import { BrandingManager } from '@/lib/white-label/branding-system';

// Configure branding
await BrandingManager.saveBrandingConfig({
  tenantId: 'tenant-123',
  brandName: 'Company Portal',
  logoUrl: 'https://company.com/logo.png',
  primaryColor: '#1f2937',
  secondaryColor: '#6b7280',
  accentColor: '#3b82f6',
  fontFamily: 'Inter, sans-serif',
  customCSS: `
    .custom-header {
      background: linear-gradient(45deg, #1f2937, #3b82f6);
    }
  `
});

// Generate CSS
const css = await BrandingManager.generateCSS(tenantId);
```

### Custom Domains

```typescript
import { CustomDomainManager } from '@/lib/white-label/branding-system';

// Add custom domain
const domainConfig = await CustomDomainManager.addCustomDomain(
  tenantId,
  'app.company.com'
);

console.log('DNS Records to configure:', domainConfig.dnsRecords);

// Verify domain
const verified = await CustomDomainManager.verifyDomain('app.company.com');
if (verified) {
  console.log('Domain verification successful');
}
```

### Email Templates

```typescript
import { EmailTemplateManager } from '@/lib/white-label/branding-system';

// Generate branded email
const emailHtml = await EmailTemplateManager.generateBrandedEmailTemplate(
  tenantId,
  'welcome',
  {
    name: 'John Doe',
    dashboardUrl: 'https://app.company.com/dashboard'
  }
);
```

### Onboarding Flows

```typescript
import { OnboardingFlowManager } from '@/lib/white-label/branding-system';

// Customize onboarding
await OnboardingFlowManager.saveOnboardingFlow(tenantId, {
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Company Portal',
      description: 'Let\'s get you started',
      component: 'WelcomeStep',
      required: true
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Tell us about yourself',
      component: 'ProfileStep',
      required: true
    }
  ],
  welcomeMessage: 'Welcome to Company Portal!',
  completionMessage: 'You\'re all set!'
});
```

---

## Security Considerations

### Authentication

- All API endpoints require valid API keys or session authentication
- SCIM endpoints use bearer token authentication
- Webhook signatures prevent tampering

### Authorization

- Multi-tenant isolation ensures data separation
- Role-based access control for enterprise features
- Scope-based API key permissions

### Data Protection

- All sensitive data is encrypted at rest
- API keys are hashed using SHA-256
- Webhook secrets use HMAC-SHA256 signatures

### Rate Limiting

- Configurable rate limits per API key
- Sliding window rate limiting
- Graceful degradation on limit exceeded

### Audit Logging

```typescript
// All enterprise operations are logged
await prisma.auditLog.create({
  data: {
    action: 'api_key_created',
    entityType: 'api_key',
    entityId: apiKey.id,
    userId: session.user.id,
    metadata: {
      tenantId,
      scope: apiKey.scope
    },
    ipAddress: request.ip,
    userAgent: request.headers['user-agent']
  }
});
```

---

## Development Guide

### Project Structure

```
src/
├── lib/
│   ├── auth/sso/           # SSO providers
│   ├── api/                # API management
│   ├── webhooks/           # Webhook system
│   ├── integrations/       # Third-party integrations
│   └── white-label/        # Branding system
├── app/api/
│   ├── enterprise/         # Enterprise API routes
│   ├── scim/v2/           # SCIM endpoints
│   └── webhooks/          # Webhook handlers
└── components/enterprise/  # Enterprise UI components
```

### Environment Variables

```bash
# SSO Configuration
SAML_CERT_PATH=/path/to/cert.pem
SAML_PRIVATE_KEY_PATH=/path/to/private-key.pem

# OAuth Providers
GOOGLE_WORKSPACE_CLIENT_ID=your-client-id
GOOGLE_WORKSPACE_CLIENT_SECRET=your-client-secret
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret

# Third-Party Integrations
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
GITHUB_APP_ID=your-github-app-id
GITHUB_PRIVATE_KEY=your-github-private-key

# Webhook Security
WEBHOOK_SIGNING_SECRET=your-webhook-secret

# Custom Domains
CUSTOM_DOMAIN_VERIFICATION_TOKEN=your-verification-token
```

### Database Schema

The enterprise features use the following new models:

- `SSOConfiguration` - SSO provider settings
- `SSOMapping` - User identity mappings
- `SCIMMapping` - SCIM resource mappings
- `APIKey` - API key management
- `APIUsage` - API usage tracking
- `WebhookSubscription` - Webhook subscriptions
- `WebhookEvent` - Webhook events
- `WebhookDelivery` - Delivery tracking
- `Integration` - Third-party integrations
- `BrandingConfig` - White-label branding
- `CustomDomain` - Custom domain settings

### Testing

```bash
# Run enterprise integration tests
npm run test:enterprise

# Test SCIM endpoints
npm run test:scim

# Test webhook deliveries
npm run test:webhooks

# Test integrations
npm run test:integrations
```

### Deployment

1. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.production
   # Configure enterprise environment variables
   ```

3. **SSL Certificates**
   ```bash
   # For SAML, ensure SSL certificates are properly configured
   # For custom domains, set up SSL termination
   ```

4. **Webhook Endpoints**
   ```bash
   # Ensure webhook endpoints are publicly accessible
   # Configure proper firewall rules
   ```

---

## Support and Documentation

### API Documentation

Visit `/api/docs` for interactive API documentation using OpenAPI/Swagger.

### Integration Guides

- [Slack Integration Guide](./slack-integration.md)
- [Teams Integration Guide](./teams-integration.md)
- [GitHub Integration Guide](./github-integration.md)
- [SAML SSO Setup Guide](./saml-sso-setup.md)

### Troubleshooting

Common issues and solutions:

1. **SAML Authentication Fails**
   - Verify certificate format
   - Check entity ID matches
   - Validate SSO URL accessibility

2. **API Rate Limiting Issues**
   - Review API key scope
   - Check rate limit configuration
   - Monitor usage patterns

3. **Webhook Delivery Failures**
   - Verify endpoint accessibility
   - Check signature validation
   - Review retry configuration

4. **Integration Sync Issues**
   - Verify API credentials
   - Check permission scopes
   - Review error logs

---

## Enterprise Support

For enterprise customers requiring additional support:

- Priority support channel
- Dedicated integration assistance
- Custom integration development
- On-premise deployment options
- Advanced security configurations

Contact: enterprise@zenith.engineer