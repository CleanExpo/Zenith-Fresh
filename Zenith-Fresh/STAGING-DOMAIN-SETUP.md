# Staging Domain Configuration - staging.zenith.engineer

This document provides comprehensive instructions for setting up the staging domain `staging.zenith.engineer` for the Zenith Platform.

## 🎯 Overview

The staging environment uses the subdomain `staging.zenith.engineer` to provide a production-like environment for testing and validation before production deployments.

## 📋 Domain Setup Steps

### 1. DNS Configuration

#### Option A: Cloudflare DNS (Recommended)
If your domain is managed through Cloudflare:

1. **Log in to Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com/
   ```

2. **Navigate to DNS Settings**
   - Select the `zenith.engineer` domain
   - Go to "DNS" section

3. **Add CNAME Record for Staging**
   ```
   Type: CNAME
   Name: staging
   Content: cname.vercel-dns.com
   TTL: Auto
   Proxy Status: DNS Only (Gray Cloud)
   ```

#### Option B: Other DNS Providers
For other DNS providers, add a CNAME record:
```
Type: CNAME
Host: staging
Value: cname.vercel-dns.com
TTL: 3600 (or minimum allowed)
```

### 2. Vercel Domain Configuration

#### Using Vercel Dashboard
1. **Access Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **Navigate to Project Settings**
   - Select your Zenith Platform project
   - Go to "Settings" → "Domains"

3. **Add Staging Domain**
   - Click "Add Domain"
   - Enter: `staging.zenith.engineer`
   - Select "Assign to Preview Branch"
   - Choose branch: `staging`

#### Using Vercel CLI
```bash
# Add staging domain
vercel domains add staging.zenith.engineer

# Assign to staging branch
vercel alias staging.zenith.engineer --local
```

### 3. SSL Certificate Configuration

Vercel automatically provisions SSL certificates for custom domains. The process typically takes 5-10 minutes.

**Verification:**
```bash
# Check SSL certificate status
curl -I https://staging.zenith.engineer

# Should return HTTP/2 200 with valid SSL
```

## 🔧 Environment-Specific Configuration

### Vercel Project Settings

Create or update `vercel.staging.json`:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "NODE_ENV": "staging",
    "NEXT_PUBLIC_APP_ENV": "staging",
    "NEXTAUTH_URL": "https://staging.zenith.engineer",
    "NEXT_PUBLIC_APP_URL": "https://staging.zenith.engineer"
  },
  "build": {
    "env": {
      "NODE_ENV": "staging",
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Environment",
          "value": "staging"
        }
      ]
    }
  ]
}
```

### Branch-Specific Deployment

Configure automatic deployment for the staging branch:

1. **Vercel Git Integration**
   - Enable automatic deployments for `staging` branch
   - Set `staging` branch to deploy to `staging.zenith.engineer`

2. **GitHub Actions Integration**
   ```yaml
   # In .github/workflows/staging-deploy.yml
   on:
     push:
       branches: [staging]
   ```

## 🌐 OAuth and Authentication Setup

### Google OAuth Configuration

1. **Google Cloud Console**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Update OAuth Client**
   - Select your OAuth 2.0 Client ID
   - Add to "Authorized redirect URIs":
     ```
     https://staging.zenith.engineer/api/auth/callback/google
     ```

3. **Environment Variables**
   ```bash
   # Add to Vercel staging environment
   vercel env add GOOGLE_CLIENT_ID staging
   vercel env add GOOGLE_CLIENT_SECRET staging
   ```

### NextAuth Configuration

Update your NextAuth configuration to handle staging domain:

```javascript
// pages/api/auth/[...nextauth].js or app/api/auth/[...nextauth]/route.js
export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Handle staging environment redirects
      if (process.env.NEXT_PUBLIC_APP_ENV === 'staging') {
        return url.startsWith('https://staging.zenith.engineer') 
          ? url 
          : 'https://staging.zenith.engineer'
      }
      return url.startsWith(baseUrl) ? url : baseUrl
    },
  },
})
```

## 🔒 Security Configuration

### CORS Settings
```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'staging' 
              ? 'https://staging.zenith.engineer'
              : 'https://zenith.engineer'
          },
        ],
      },
    ]
  },
}
```

### Cookie Configuration
```javascript
// Ensure cookies work correctly on staging domain
const sessionOptions = {
  cookieName: 'zenith-session',
  password: process.env.NEXTAUTH_SECRET,
  cookieOptions: {
    secure: true, // Always true for staging
    domain: process.env.NODE_ENV === 'staging' 
      ? '.zenith.engineer' 
      : '.zenith.engineer',
    sameSite: 'lax',
  },
}
```

## 🧪 Testing and Validation

### Automated Domain Verification
```bash
# Run domain verification script
./scripts/staging/verify-staging-domain.sh
```

### Manual Verification Checklist

1. **DNS Resolution**
   ```bash
   nslookup staging.zenith.engineer
   dig staging.zenith.engineer CNAME
   ```

2. **SSL Certificate**
   ```bash
   openssl s_client -connect staging.zenith.engineer:443 -servername staging.zenith.engineer
   ```

3. **HTTP Response**
   ```bash
   curl -I https://staging.zenith.engineer
   ```

4. **Application Loading**
   - Visit https://staging.zenith.engineer
   - Check console for any errors
   - Verify all assets load correctly

5. **Authentication Flow**
   - Test login/logout functionality
   - Verify OAuth redirects work correctly
   - Check session persistence

## 🚨 Troubleshooting

### Common Issues

#### Domain Not Resolving
- **Check DNS propagation**: Use online DNS checkers
- **Verify CNAME record**: Ensure it points to `cname.vercel-dns.com`
- **TTL settings**: Lower TTL for faster propagation during setup

#### SSL Certificate Issues
- **Wait for provisioning**: SSL certificates can take up to 24 hours
- **Force refresh**: Remove and re-add domain in Vercel
- **Check CAA records**: Ensure no CAA records block Let's Encrypt

#### Authentication Problems
- **OAuth redirect URIs**: Verify all callback URLs are configured
- **Environment variables**: Check all auth-related env vars are set
- **Session cookies**: Verify cookie domain settings

### Debug Commands
```bash
# Check Vercel domain status
vercel domains ls

# Check environment variables
vercel env ls

# View deployment logs
vercel logs

# Test staging API endpoints
curl https://staging.zenith.engineer/api/health
curl https://staging.zenith.engineer/api/auth/session
```

## 📊 Monitoring and Alerts

### Health Monitoring
Set up monitoring for the staging domain:

```javascript
// Health check endpoint
// /api/staging-health
export default function handler(req, res) {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: 'staging',
    domain: 'staging.zenith.engineer',
    database: 'connected', // Add actual DB check
    auth: 'configured',    // Add actual auth check
    ssl: 'active',         // Add actual SSL check
  }
  
  res.status(200).json(checks)
}
```

### Uptime Monitoring
Consider setting up external monitoring:
- **Uptime Robot**: Free tier available
- **Pingdom**: Comprehensive monitoring
- **StatusCake**: Free SSL monitoring

## 🔄 Deployment Workflow

### Automated Deployment
```bash
# Deploy to staging (from staging branch)
git checkout staging
git push origin staging  # Triggers automatic Vercel deployment
```

### Manual Deployment
```bash
# Using staging deployment script
./scripts/staging/deploy-staging.sh

# Using Vercel CLI directly
vercel --prod --confirm --env=preview
```

## 📝 Environment Variables Checklist

Ensure these variables are set in Vercel for staging:

### Core Application
- [ ] `NODE_ENV=staging`
- [ ] `NEXT_PUBLIC_APP_ENV=staging`
- [ ] `NEXTAUTH_URL=https://staging.zenith.engineer`
- [ ] `NEXT_PUBLIC_APP_URL=https://staging.zenith.engineer`

### Database
- [ ] `DATABASE_URL` (Railway staging database)
- [ ] `POSTGRES_PRISMA_URL`
- [ ] `DIRECT_URL`

### Authentication
- [ ] `NEXTAUTH_SECRET`
- [ ] `JWT_SECRET`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`

### External Services
- [ ] `STRIPE_SECRET_KEY` (test keys)
- [ ] `STRIPE_PUBLISHABLE_KEY` (test keys)
- [ ] `REDIS_URL`
- [ ] `RESEND_API_KEY`

## 🎯 Success Criteria

The staging domain setup is successful when:

1. ✅ `https://staging.zenith.engineer` loads without SSL warnings
2. ✅ All application features work correctly
3. ✅ Authentication flows function properly
4. ✅ Database connections are established
5. ✅ API endpoints respond correctly
6. ✅ Feature flags are properly configured
7. ✅ Monitoring and health checks are active

## 📞 Support and Next Steps

### For Issues:
1. Check this documentation first
2. Review Vercel deployment logs
3. Verify DNS and SSL status
4. Test with the provided debug commands

### After Setup:
1. Run comprehensive testing suite
2. Validate all user journeys
3. Performance test the staging environment
4. Document any environment-specific behaviors
5. Set up monitoring and alerting

---

**🌟 Once staging.zenith.engineer is fully operational, you'll have a production-like environment for safe testing and validation of all features before production deployment.**