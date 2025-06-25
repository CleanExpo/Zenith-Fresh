# OAuth Provider Setup Guide

## Overview

This guide provides step-by-step instructions for configuring OAuth providers (Google, GitHub, Microsoft Azure AD) for production authentication in the Zenith Platform.

## 🔐 Security Requirements

### Production OAuth Security Checklist
- [ ] Use HTTPS for all redirect URIs
- [ ] Implement PKCE for public clients
- [ ] Validate state parameters
- [ ] Secure client secrets in environment variables
- [ ] Regular key rotation (quarterly)
- [ ] Monitor for suspicious activity
- [ ] Implement rate limiting

## 🌐 Google OAuth 2.0 Setup

### Step 1: Google Cloud Console Configuration

1. **Create/Select Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select existing project or create new one
   - Project Name: `Zenith Platform Production`

2. **Enable Google+ API**
   ```bash
   # Enable APIs
   gcloud services enable plus.googleapis.com
   gcloud services enable oauth2.googleapis.com
   ```

3. **Configure OAuth Consent Screen**
   ```
   Application Type: External
   Application Name: Zenith Platform
   User Support Email: support@your-domain.com
   Logo: [Upload your logo - 120x120px PNG]
   Application Homepage: https://your-domain.com
   Privacy Policy: https://your-domain.com/privacy
   Terms of Service: https://your-domain.com/terms
   ```

4. **Create OAuth 2.0 Credentials**
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application Type: Web Application
   - Name: `Zenith Platform Production`

5. **Configure Redirect URIs**
   ```
   Authorized JavaScript Origins:
   - https://your-domain.com
   - https://app.your-domain.com
   
   Authorized Redirect URIs:
   - https://your-domain.com/api/auth/callback/google
   - https://app.your-domain.com/api/auth/callback/google
   ```

### Step 2: Production Configuration

```typescript
// Google OAuth Configuration
const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    }
  }
};

// Environment Variables
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Step 3: Scopes and Permissions

```typescript
// Required scopes for Zenith Platform
const googleScopes = [
  'openid',           // Required for OpenID Connect
  'email',            // User email address
  'profile',          // Basic profile information
  
  // Optional scopes (request only when needed)
  'https://www.googleapis.com/auth/drive.readonly',  // Google Drive access
  'https://www.googleapis.com/auth/calendar.readonly' // Calendar access
];
```

### Step 4: Production Monitoring

```typescript
// Google OAuth analytics
const googleAnalytics = {
  // Track OAuth events
  events: [
    'oauth_attempt',
    'oauth_success',
    'oauth_failure',
    'oauth_consent_granted',
    'oauth_consent_denied'
  ],
  
  // Monitor quota usage
  quotaMonitoring: {
    dailyQuota: 10000,
    alertThreshold: 8000
  }
};
```

## 🐙 GitHub OAuth Setup

### Step 1: GitHub OAuth App Configuration

1. **Create OAuth App**
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"

2. **Application Configuration**
   ```
   Application Name: Zenith Platform
   Homepage URL: https://your-domain.com
   Application Description: Enterprise SaaS platform for website analysis and team collaboration
   Authorization Callback URL: https://your-domain.com/api/auth/callback/github
   ```

3. **Generate Client Secret**
   - Click "Generate a new client secret"
   - Store securely in environment variables

### Step 2: Production Configuration

```typescript
// GitHub OAuth Configuration
const githubConfig = {
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: 'user:email read:user'
    }
  }
};

// Environment Variables
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Step 3: Scopes and Permissions

```typescript
// GitHub OAuth scopes
const githubScopes = [
  'user:email',       // User email addresses
  'read:user',        // Read user profile data
  
  // Optional scopes (for enhanced features)
  'read:org',         // Organization membership
  'repo',             // Repository access (if needed)
  'admin:repo_hook'   // Webhook management (if needed)
];
```

### Step 4: Webhook Configuration (Optional)

```typescript
// GitHub webhook for enhanced integration
const githubWebhook = {
  url: 'https://your-domain.com/api/webhooks/github',
  events: ['push', 'pull_request', 'repository'],
  secret: process.env.GITHUB_WEBHOOK_SECRET
};
```

## 🔷 Microsoft Azure AD Setup

### Step 1: Azure Portal Configuration

1. **Register Application**
   - Go to [Azure Portal](https://portal.azure.com/)
   - Navigate to Azure Active Directory → App registrations
   - Click "New registration"

2. **Application Registration**
   ```
   Name: Zenith Platform
   Supported Account Types: Accounts in any organizational directory and personal Microsoft accounts
   Redirect URI: https://your-domain.com/api/auth/callback/azure-ad
   ```

3. **Configure Authentication**
   - Go to Authentication section
   - Add additional redirect URIs:
     - `https://your-domain.com/api/auth/callback/azure-ad`
     - `https://app.your-domain.com/api/auth/callback/azure-ad`

4. **Create Client Secret**
   - Go to Certificates & secrets
   - Click "New client secret"
   - Description: `Zenith Platform Production`
   - Expires: 24 months

### Step 2: API Permissions

```typescript
// Azure AD permissions
const azurePermissions = [
  'openid',                    // OpenID Connect
  'profile',                   // Basic profile
  'email',                     // Email address
  'User.Read',                 // Read user profile
  'Directory.Read.All',        // Read directory data
  'Group.Read.All'             // Read group memberships
];
```

### Step 3: Production Configuration

```typescript
// Azure AD OAuth Configuration
const azureConfig = {
  clientId: process.env.AZURE_AD_CLIENT_ID!,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
  tenantId: process.env.AZURE_AD_TENANT_ID!,
  authorization: {
    params: {
      scope: 'openid profile email'
    }
  }
};

// Environment Variables
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id
```

## 🔧 NextAuth.js Integration

### Complete Provider Configuration

```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import AzureADProvider from 'next-auth/providers/azure-ad';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    }),
    
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'user:email read:user'
        }
      }
    }),
    
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      // Custom sign-in logic
      if (!user.email) {
        return false;
      }
      
      // Log OAuth sign-in
      console.log(`OAuth sign-in: ${account?.provider} - ${user.email}`);
      
      return true;
    },
    
    async session({ session, token }) {
      // Add custom session data
      session.user.id = token.sub;
      session.user.provider = token.provider;
      return session;
    },
    
    async jwt({ token, account, profile }) {
      // Add provider information to token
      if (account) {
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }
      return token;
    }
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Production security settings
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
  
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Track OAuth events
      await trackOAuthEvent('signin', {
        provider: account?.provider,
        userId: user.id,
        isNewUser
      });
    },
    
    async signOut({ token }) {
      // Track sign-out events
      await trackOAuthEvent('signout', {
        provider: token.provider,
        userId: token.sub
      });
    }
  }
});
```

## 🛡️ Security Best Practices

### 1. Environment Variable Security

```bash
# Generate secure secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET

# Environment variable validation
node -e "
const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}
console.log('All OAuth environment variables are set');
"
```

### 2. Rate Limiting

```typescript
// OAuth rate limiting
const oauthRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 OAuth attempts per window
  message: 'Too many OAuth attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};
```

### 3. CSRF Protection

```typescript
// CSRF token validation
const csrfProtection = {
  secret: process.env.NEXTAUTH_SECRET,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production'
};
```

### 4. Session Security

```typescript
// Secure session configuration
const sessionConfig = {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60,    // Update every 24 hours
  generateSessionToken: () => {
    return crypto.randomUUID();
  }
};
```

## 📊 Monitoring and Analytics

### 1. OAuth Metrics

```typescript
// Track OAuth performance
const oauthMetrics = {
  // Success rates by provider
  successRates: {
    google: 0.95,
    github: 0.93,
    azureAd: 0.91
  },
  
  // Common failure reasons
  failureReasons: [
    'user_cancelled',
    'access_denied',
    'invalid_scope',
    'server_error'
  ],
  
  // Performance metrics
  averageResponseTime: {
    google: 1200,   // ms
    github: 800,    // ms
    azureAd: 1500   // ms
  }
};
```

### 2. Alert Configuration

```typescript
// OAuth monitoring alerts
const oauthAlerts = {
  successRateThreshold: 0.85,  // Alert if success rate < 85%
  responseTimeThreshold: 5000, // Alert if response time > 5s
  errorRateThreshold: 0.15,    // Alert if error rate > 15%
  
  notifications: {
    email: 'devops@your-company.com',
    slack: '#alerts-production',
    pagerduty: true
  }
};
```

## 🔄 Disaster Recovery

### 1. Provider Failover

```typescript
// OAuth provider failover
const providerFailover = {
  primary: 'google',
  fallback: ['github', 'azureAd'],
  
  async handleProviderFailure(provider: string) {
    // Disable failed provider
    await disableProvider(provider);
    
    // Notify users
    await notifyUsers(`${provider} login temporarily unavailable`);
    
    // Alert operations team
    await alertOpsTeam(`OAuth provider ${provider} is down`);
  }
};
```

### 2. Backup Authentication

```typescript
// Email/password backup authentication
const backupAuth = {
  enabled: true,
  message: 'Social login unavailable. Please use email/password.',
  
  async enableBackupAuth() {
    // Enable email/password forms
    await updateFeatureFlag('email_auth_enabled', true);
    
    // Show backup login UI
    await showBackupLoginUI();
  }
};
```

## 🧪 Testing OAuth Integration

### 1. Development Testing

```typescript
// OAuth testing utilities
const oauthTesting = {
  // Test OAuth flow
  async testOAuthFlow(provider: string) {
    const authUrl = await generateAuthUrl(provider);
    console.log(`Test ${provider} OAuth:`, authUrl);
    
    // Validate callback handling
    const mockCallback = {
      code: 'test_code',
      state: 'test_state'
    };
    
    const result = await handleOAuthCallback(provider, mockCallback);
    console.log('OAuth test result:', result);
  },
  
  // Test token refresh
  async testTokenRefresh(provider: string, refreshToken: string) {
    const newToken = await refreshOAuthToken(provider, refreshToken);
    console.log('Token refresh result:', newToken);
  }
};
```

### 2. Production Testing

```bash
#!/bin/bash
# OAuth production testing script

echo "Testing OAuth providers..."

# Test Google OAuth
curl -I "https://accounts.google.com/oauth2/v2/auth?client_id=$GOOGLE_CLIENT_ID&response_type=code&scope=openid%20email%20profile&redirect_uri=https://your-domain.com/api/auth/callback/google"

# Test GitHub OAuth
curl -I "https://github.com/login/oauth/authorize?client_id=$GITHUB_CLIENT_ID&response_type=code&scope=user:email"

# Test Azure AD OAuth
curl -I "https://login.microsoftonline.com/$AZURE_AD_TENANT_ID/oauth2/v2.0/authorize?client_id=$AZURE_AD_CLIENT_ID&response_type=code&scope=openid%20profile%20email"

echo "OAuth provider tests completed"
```

## 📋 Go-Live Checklist

### Pre-Launch (1 week before)
- [ ] Configure all OAuth providers in production
- [ ] Verify redirect URIs are correct
- [ ] Test OAuth flows end-to-end
- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting
- [ ] Implement CSRF protection
- [ ] Test failover scenarios
- [ ] Document incident response procedures

### Launch Day
- [ ] Monitor OAuth success rates
- [ ] Watch for authentication errors
- [ ] Check provider response times
- [ ] Verify user account creation
- [ ] Monitor rate limiting effectiveness
- [ ] Check security logs
- [ ] Validate session management

### Post-Launch (1 week after)
- [ ] Analyze OAuth conversion rates
- [ ] Review error patterns
- [ ] Optimize provider ordering
- [ ] Update documentation
- [ ] Plan provider additions
- [ ] Review security posture
- [ ] Gather user feedback

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Invalid Redirect URI
```
Error: redirect_uri_mismatch
Solution: Ensure redirect URI in OAuth app matches exactly with NextAuth configuration
```

#### 2. Invalid Client ID/Secret
```
Error: invalid_client
Solution: Verify environment variables are set correctly and secrets are valid
```

#### 3. Scope Permissions Denied
```
Error: access_denied
Solution: Review requested scopes and ensure they're approved in OAuth consent screen
```

#### 4. CSRF Token Mismatch
```
Error: CSRF token mismatch
Solution: Verify NEXTAUTH_SECRET is set and consistent across deployments
```

## 📞 Support Resources

### Provider Support
- **Google**: [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- **GitHub**: [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- **Microsoft**: [Azure AD OAuth Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)

### NextAuth.js Resources
- **Documentation**: [NextAuth.js Docs](https://next-auth.js.org/)
- **GitHub**: [NextAuth.js Repository](https://github.com/nextauthjs/next-auth)
- **Discord**: NextAuth.js Community Discord

### Internal Resources
- **Runbook**: `/docs/oauth-runbook.md`
- **API Documentation**: `/docs/api/authentication.md`
- **Security Guide**: `/docs/security/oauth-security.md`

---

**Last Updated**: 2025-06-25  
**Version**: 1.0  
**Reviewed By**: Security Team, DevOps Team