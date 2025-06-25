# Staging OAuth Configuration Guide

This document provides comprehensive instructions for configuring OAuth authentication in the staging environment, including Google OAuth and other providers.

## 🎯 Overview

The staging environment requires separate OAuth application configurations to ensure proper authentication flows without affecting production systems.

## 🔧 Google OAuth Setup

### 1. Google Cloud Console Configuration

#### Access Google Cloud Console
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one for staging
3. Go to "APIs & Services" → "Credentials"

#### Create OAuth 2.0 Client ID
1. **Click "Create Credentials"** → "OAuth 2.0 Client ID"
2. **Application Type:** Web application
3. **Name:** Zenith Platform - Staging
4. **Authorized JavaScript Origins:**
   ```
   https://staging.zenith.engineer
   ```
5. **Authorized Redirect URIs:**
   ```
   https://staging.zenith.engineer/api/auth/callback/google
   ```

#### Configure Consent Screen
1. Go to "OAuth consent screen"
2. **User Type:** External (for testing) or Internal (if within organization)
3. **Application Information:**
   - App name: Zenith Platform (Staging)
   - User support email: Your email
   - Application home page: https://staging.zenith.engineer
   - Application privacy policy: https://staging.zenith.engineer/privacy
   - Application terms of service: https://staging.zenith.engineer/terms
4. **Scopes:** Add required scopes
   ```
   email
   profile
   openid
   ```
5. **Test Users:** Add email addresses for testing

### 2. Environment Variable Configuration

#### Using Vercel CLI
```bash
# Set Google OAuth Client ID for staging
vercel env add GOOGLE_CLIENT_ID staging
# Enter the Client ID from Google Cloud Console

# Set Google OAuth Client Secret for staging
vercel env add GOOGLE_CLIENT_SECRET staging
# Enter the Client Secret from Google Cloud Console

# Verify environment variables
vercel env ls | grep GOOGLE
```

#### Using Staging Environment Script
```bash
# Run the staging environment setup script
./scripts/staging/setup-staging-env.sh

# Update OAuth-specific variables
vercel env add GOOGLE_CLIENT_ID staging --force
vercel env add GOOGLE_CLIENT_SECRET staging --force
```

### 3. NextAuth Configuration Update

#### Verify NextAuth Configuration
Ensure your NextAuth configuration handles staging environment properly:

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Handle staging environment redirects
      const stagingUrl = 'https://staging.zenith.engineer'
      
      if (process.env.NEXT_PUBLIC_APP_ENV === 'staging') {
        // Ensure redirects stay within staging domain
        if (url.startsWith('/')) {
          return `${stagingUrl}${url}`
        }
        if (url.startsWith(stagingUrl)) {
          return url
        }
        return stagingUrl
      }
      
      // Production logic
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async session({ session, token }) {
      // Add staging-specific session handling if needed
      if (process.env.NEXT_PUBLIC_APP_ENV === 'staging') {
        session.environment = 'staging'
      }
      return session
    },
    async jwt({ token, user, account }) {
      // Add staging-specific JWT handling if needed
      if (process.env.NEXT_PUBLIC_APP_ENV === 'staging') {
        token.environment = 'staging'
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_APP_ENV === 'staging',
})

export { handler as GET, handler as POST }
```

## 🔐 Additional OAuth Providers

### GitHub OAuth (Optional)

#### GitHub App Configuration
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. **Application Information:**
   - Application name: Zenith Platform - Staging
   - Homepage URL: https://staging.zenith.engineer
   - Authorization callback URL: https://staging.zenith.engineer/api/auth/callback/github

#### Environment Variables
```bash
vercel env add GITHUB_CLIENT_ID staging
vercel env add GITHUB_CLIENT_SECRET staging
```

### Microsoft OAuth (Optional)

#### Azure App Registration
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "App registrations"
3. Click "New registration"
4. **Application Information:**
   - Name: Zenith Platform - Staging
   - Redirect URI: https://staging.zenith.engineer/api/auth/callback/azure-ad

#### Environment Variables
```bash
vercel env add AZURE_AD_CLIENT_ID staging
vercel env add AZURE_AD_CLIENT_SECRET staging
vercel env add AZURE_AD_TENANT_ID staging
```

## 🧪 Testing OAuth Configuration

### 1. Automated Testing Script

Create a testing script to verify OAuth configuration:

```bash
#!/bin/bash
# scripts/staging/test-oauth.sh

echo "🔐 Testing OAuth configuration for staging..."

STAGING_URL="https://staging.zenith.engineer"

# Test OAuth endpoints
echo "Testing OAuth endpoints..."

# Test Google OAuth
echo "📍 Testing Google OAuth callback..."
curl -I "${STAGING_URL}/api/auth/callback/google" 2>/dev/null | head -n 1

# Test sign-in page
echo "📍 Testing sign-in page..."
curl -I "${STAGING_URL}/api/auth/signin" 2>/dev/null | head -n 1

# Test session endpoint
echo "📍 Testing session endpoint..."
curl -I "${STAGING_URL}/api/auth/session" 2>/dev/null | head -n 1

echo "✅ OAuth endpoint tests completed"
```

### 2. Manual Testing Checklist

#### Google OAuth Flow
- [ ] **Sign-in Page:** Navigate to staging and click "Sign in with Google"
- [ ] **Google Consent:** Verify Google consent screen shows correct app name
- [ ] **Redirect:** Ensure redirect back to staging domain after authorization
- [ ] **Session:** Verify user is logged in and session persists
- [ ] **Sign-out:** Test sign-out functionality

#### Environment-Specific Testing
- [ ] **Staging Domain:** All redirects stay within staging.zenith.engineer
- [ ] **Production Isolation:** No cross-contamination with production OAuth
- [ ] **Error Handling:** Test error scenarios (cancelled auth, invalid tokens)
- [ ] **Session Management:** Test session expiration and renewal

### 3. Debugging OAuth Issues

#### Common Issues and Solutions

**Issue: OAuth callback URL mismatch**
```bash
# Check configured URLs
vercel env get NEXTAUTH_URL staging
# Should be: https://staging.zenith.engineer

# Verify Google Cloud Console callback URL
# Should be: https://staging.zenith.engineer/api/auth/callback/google
```

**Issue: Invalid client credentials**
```bash
# Verify environment variables are set
vercel env ls | grep GOOGLE

# Test environment variable values (be careful with secrets)
vercel env get GOOGLE_CLIENT_ID staging
```

**Issue: CORS or domain errors**
```bash
# Check authorized JavaScript origins in Google Cloud Console
# Should include: https://staging.zenith.engineer

# Verify NEXTAUTH_URL environment variable
vercel env get NEXTAUTH_URL staging
```

## 🔄 OAuth Configuration Script

### Automated OAuth Setup Script

```bash
#!/bin/bash
# scripts/staging/setup-oauth.sh

echo "🔐 Setting up OAuth configuration for staging..."

# Check if environment variables are provided
if [[ -z "$GOOGLE_CLIENT_ID" ]] || [[ -z "$GOOGLE_CLIENT_SECRET" ]]; then
    echo "❌ Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be provided"
    echo "Usage: GOOGLE_CLIENT_ID=your_id GOOGLE_CLIENT_SECRET=your_secret ./setup-oauth.sh"
    exit 1
fi

# Set OAuth environment variables
echo "Setting Google OAuth environment variables..."
echo "$GOOGLE_CLIENT_ID" | vercel env add GOOGLE_CLIENT_ID staging --force
echo "$GOOGLE_CLIENT_SECRET" | vercel env add GOOGLE_CLIENT_SECRET staging --force

# Set NextAuth configuration
echo "Setting NextAuth configuration..."
echo "https://staging.zenith.engineer" | vercel env add NEXTAUTH_URL staging --force

# Generate NextAuth secret if not provided
if [[ -z "$NEXTAUTH_SECRET" ]]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
fi
echo "$NEXTAUTH_SECRET" | vercel env add NEXTAUTH_SECRET staging --force

echo "✅ OAuth configuration completed for staging"
echo "📋 Next steps:"
echo "1. Deploy the application to staging"
echo "2. Test OAuth flow manually"
echo "3. Verify all redirects work correctly"
```

## 📋 OAuth Environment Variables Checklist

### Required Variables
- [ ] **GOOGLE_CLIENT_ID** - Google OAuth Client ID for staging
- [ ] **GOOGLE_CLIENT_SECRET** - Google OAuth Client Secret for staging
- [ ] **NEXTAUTH_URL** - https://staging.zenith.engineer
- [ ] **NEXTAUTH_SECRET** - Secret for signing JWT tokens

### Optional Variables (if using additional providers)
- [ ] **GITHUB_CLIENT_ID** - GitHub OAuth Client ID
- [ ] **GITHUB_CLIENT_SECRET** - GitHub OAuth Client Secret
- [ ] **AZURE_AD_CLIENT_ID** - Microsoft Azure AD Client ID
- [ ] **AZURE_AD_CLIENT_SECRET** - Microsoft Azure AD Client Secret
- [ ] **AZURE_AD_TENANT_ID** - Microsoft Azure AD Tenant ID

### Verification Commands
```bash
# Check all OAuth-related environment variables
vercel env ls | grep -E "(GOOGLE|GITHUB|AZURE|NEXTAUTH)"

# Test OAuth configuration
./scripts/staging/test-oauth.sh

# Deploy and test
./scripts/staging/deploy-staging.sh
```

## 🚨 Security Considerations

### Staging-Specific Security

#### 1. Separate OAuth Applications
- **Always use separate OAuth applications for staging and production**
- **Never share client secrets between environments**
- **Use different callback URLs for each environment**

#### 2. Test User Management
- **Add specific test users to OAuth consent screen**
- **Use dedicated staging email accounts for testing**
- **Regularly rotate staging OAuth credentials**

#### 3. Data Protection
- **Ensure staging doesn't access production user data**
- **Use test data for staging authentication flows**
- **Implement proper session isolation**

### Security Checklist
- [ ] **Separate OAuth Apps:** Staging uses different OAuth app than production
- [ ] **Callback URL Security:** Only staging domain in authorized redirect URIs
- [ ] **Secret Management:** OAuth secrets properly secured in Vercel
- [ ] **Test Data:** Using test accounts, not production user data
- [ ] **Session Security:** Proper session configuration for staging domain

## 🔄 Deployment Integration

### CI/CD Integration

#### GitHub Actions Integration
```yaml
# In .github/workflows/staging-deploy.yml
- name: Verify OAuth Configuration
  run: |
    echo "Verifying OAuth configuration..."
    
    # Check required environment variables
    if [[ -z "${{ secrets.STAGING_GOOGLE_CLIENT_ID }}" ]]; then
      echo "❌ STAGING_GOOGLE_CLIENT_ID not configured"
      exit 1
    fi
    
    if [[ -z "${{ secrets.STAGING_GOOGLE_CLIENT_SECRET }}" ]]; then
      echo "❌ STAGING_GOOGLE_CLIENT_SECRET not configured"
      exit 1
    fi
    
    echo "✅ OAuth configuration verified"

- name: Test OAuth Endpoints
  run: |
    echo "Testing OAuth endpoints..."
    ./scripts/staging/test-oauth.sh
```

#### Staging Deployment Script Integration
```bash
# In scripts/staging/deploy-staging.sh
# Add OAuth verification step

verify_oauth_config() {
    log "Verifying OAuth configuration..."
    
    # Check environment variables
    if ! vercel env get GOOGLE_CLIENT_ID staging > /dev/null 2>&1; then
        error "GOOGLE_CLIENT_ID not configured for staging"
        return 1
    fi
    
    if ! vercel env get NEXTAUTH_URL staging > /dev/null 2>&1; then
        error "NEXTAUTH_URL not configured for staging"
        return 1
    fi
    
    success "OAuth configuration verified"
}
```

## 📞 Troubleshooting Guide

### Common OAuth Issues

#### 1. "Invalid redirect URI" Error
**Cause:** Callback URL mismatch between Google Cloud Console and application
**Solution:**
- Verify Google Cloud Console redirect URI: `https://staging.zenith.engineer/api/auth/callback/google`
- Check NEXTAUTH_URL environment variable: `https://staging.zenith.engineer`

#### 2. "Invalid client" Error
**Cause:** Wrong client ID or secret
**Solution:**
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel
- Ensure using staging-specific OAuth application

#### 3. Session Issues
**Cause:** Session configuration problems
**Solution:**
- Check NEXTAUTH_SECRET is properly set
- Verify session domain configuration
- Clear browser cookies and test again

#### 4. CORS Errors
**Cause:** Domain not authorized in Google Cloud Console
**Solution:**
- Add `https://staging.zenith.engineer` to authorized JavaScript origins
- Verify CORS configuration in next.config.js

### Debug Commands
```bash
# Check OAuth environment variables
vercel env ls | grep -E "(GOOGLE|NEXTAUTH)"

# Test OAuth endpoints
curl -v https://staging.zenith.engineer/api/auth/signin

# Check session endpoint
curl https://staging.zenith.engineer/api/auth/session

# Verify deployment status
vercel logs --follow
```

## ✅ Success Criteria

OAuth configuration is successful when:

1. ✅ Google OAuth application configured for staging domain
2. ✅ All required environment variables set in Vercel
3. ✅ OAuth sign-in flow works correctly
4. ✅ Users can authenticate and maintain sessions
5. ✅ Sign-out functionality works properly
6. ✅ No cross-contamination with production OAuth
7. ✅ All redirects stay within staging domain
8. ✅ Error handling works correctly

## 📈 Next Steps

After OAuth configuration:

1. **Test Authentication Flows**
   - Manual testing of sign-in/sign-out
   - Automated testing in CI/CD pipeline
   - Cross-browser compatibility testing

2. **Monitor Authentication**
   - Set up authentication error monitoring
   - Track authentication success rates
   - Monitor session management

3. **User Management**
   - Configure user roles for staging
   - Set up test user accounts
   - Implement staging-specific user permissions

4. **Documentation**
   - Update team documentation
   - Create troubleshooting runbooks
   - Document OAuth application management

---

**🔐 With proper OAuth configuration, your staging environment will have secure, isolated authentication that doesn't interfere with production systems.**