# Zenith Platform - Complete Staging Deployment Guide

This comprehensive guide covers the complete setup and deployment process for the Zenith Platform staging environment.

## 🎯 Overview

The staging environment provides a production-like testing environment at `https://staging.zenith.engineer` that allows safe testing and validation of features before production deployment.

## 📋 Prerequisites

Before starting the staging deployment process, ensure you have:

### Required Tools
- [ ] **Node.js 18+** installed locally
- [ ] **npm** or **yarn** package manager
- [ ] **Git** version control system
- [ ] **Vercel CLI** installed globally (`npm install -g vercel`)
- [ ] **Railway CLI** installed globally (`npm install -g @railway/cli`)

### Required Accounts & Access
- [ ] **Vercel account** with project access
- [ ] **Railway account** for database hosting
- [ ] **Google Cloud Console** access for OAuth
- [ ] **GitHub** repository access
- [ ] **Domain management** access for zenith.engineer

### Environment Setup
- [ ] **Repository cloned** locally
- [ ] **Dependencies installed** (`npm install`)
- [ ] **Development environment** working (`npm run dev`)

## 🚀 Quick Start (Automated Setup)

For experienced users who want to set up staging quickly:

```bash
# 1. Clone and setup repository
git clone https://github.com/your-org/zenith-platform.git
cd zenith-platform
npm install

# 2. Run automated staging setup
./scripts/staging/setup-staging-env.sh

# 3. Configure database
node scripts/staging/setup-staging-database.js setup

# 4. Deploy to staging
./scripts/staging/deploy-staging.sh

# 5. Verify deployment
node scripts/staging/ci-staging-workflow.js healthCheck
```

## 📚 Detailed Setup Process

### Step 1: Environment Configuration

#### 1.1 Configure Staging Environment Variables
```bash
# Run the automated environment setup
./scripts/staging/setup-staging-env.sh

# Or set variables manually
vercel env add NODE_ENV staging
vercel env add NEXT_PUBLIC_APP_ENV staging
vercel env add NEXTAUTH_URL https://staging.zenith.engineer
```

#### 1.2 Generate Required Secrets
```bash
# Generate NextAuth secret
openssl rand -base64 32

# Generate JWT secret
openssl rand -hex 64

# Set secrets in Vercel
echo "your-nextauth-secret" | vercel env add NEXTAUTH_SECRET staging
echo "your-jwt-secret" | vercel env add JWT_SECRET staging
```

#### 1.3 Verify Environment Configuration
```bash
# List all staging environment variables
vercel env ls

# Check specific variables
vercel env get NEXTAUTH_URL staging
vercel env get NODE_ENV staging
```

### Step 2: Database Setup

#### 2.1 Railway Database Configuration
```bash
# Login to Railway
railway login

# Link to Railway project (or create new)
railway link

# Add PostgreSQL database
railway add postgresql

# Run database setup script
node scripts/staging/setup-staging-database.js setup
```

#### 2.2 Database Migration and Seeding
```bash
# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed database with test data
node scripts/seed.js
```

#### 2.3 Verify Database Connection
```bash
# Test database connection
node scripts/staging/setup-staging-database.js verify

# Check database via Railway
railway connect postgresql
```

### Step 3: Domain Configuration

#### 3.1 DNS Configuration
Follow the detailed instructions in [STAGING-DOMAIN-SETUP.md](./STAGING-DOMAIN-SETUP.md):

1. **Add CNAME record** in your DNS provider:
   ```
   Type: CNAME
   Name: staging
   Value: cname.vercel-dns.com
   ```

2. **Verify DNS propagation**:
   ```bash
   nslookup staging.zenith.engineer
   dig staging.zenith.engineer CNAME
   ```

#### 3.2 Vercel Domain Setup
```bash
# Add domain to Vercel project
vercel domains add staging.zenith.engineer

# Assign to staging branch
vercel alias staging.zenith.engineer --local
```

### Step 4: OAuth Configuration

#### 4.1 Google OAuth Setup
Follow the detailed instructions in [STAGING-OAUTH-SETUP.md](./STAGING-OAUTH-SETUP.md):

1. **Create Google OAuth app** for staging
2. **Configure redirect URIs**: `https://staging.zenith.engineer/api/auth/callback/google`
3. **Set environment variables**:
   ```bash
   vercel env add GOOGLE_CLIENT_ID staging
   vercel env add GOOGLE_CLIENT_SECRET staging
   ```

#### 4.2 Test OAuth Configuration
```bash
# Test OAuth endpoints
curl -I https://staging.zenith.engineer/api/auth/signin
curl -I https://staging.zenith.engineer/api/auth/session
```

### Step 5: Feature Flags Configuration

#### 5.1 Configure Staging Feature Flags
The staging feature flags are pre-configured in:
- `config/staging-feature-flags.json`
- `lib/feature-flags/staging-config.ts`

#### 5.2 Set Feature Flag Environment Variables
```bash
# Enable core feature flags
vercel env add FEATURE_FLAGS_ENABLED true staging
vercel env add STAGING_MODE true staging
vercel env add DEBUG_MODE true staging

# Configure feature-specific flags
vercel env add NEXT_PUBLIC_FEATURE_ENHANCED_ANALYZER true staging
vercel env add NEXT_PUBLIC_FEATURE_TEAM_MANAGEMENT true staging
vercel env add NEXT_PUBLIC_FEATURE_AI_CONTENT_ANALYSIS false staging
```

### Step 6: Monitoring Setup

#### 6.1 Configure Staging Monitoring
```bash
# Run monitoring setup script
node scripts/staging/setup-staging-monitoring.js setup

# Verify monitoring configuration
node scripts/staging/setup-staging-monitoring.js verify
```

#### 6.2 Set Up Health Checks
```bash
# Test health check script
node scripts/staging/health-check.js

# Set up monitoring environment variables
vercel env add NEXT_PUBLIC_MONITORING_ENABLED true staging
vercel env add MONITORING_ENVIRONMENT staging
```

### Step 7: Deployment

#### 7.1 Automated Deployment
```bash
# Full deployment with all checks
./scripts/staging/deploy-staging.sh

# Quick deployment (skip some checks)
./scripts/staging/deploy-staging.sh --quick

# Force deployment (override warnings)
./scripts/staging/deploy-staging.sh --force
```

#### 7.2 Manual Deployment Steps
```bash
# 1. Ensure on staging branch
git checkout staging
git pull origin staging

# 2. Install dependencies
npm install

# 3. Run quality checks
npm run type-check
npm run lint
npm run test

# 4. Build application
npm run build

# 5. Deploy to Vercel
vercel --prod --confirm
```

### Step 8: Post-Deployment Verification

#### 8.1 Automated Verification
```bash
# Run comprehensive health check
node scripts/staging/ci-staging-workflow.js healthCheck

# Run monitoring tests
node scripts/staging/setup-staging-monitoring.js test

# Verify database connectivity
node scripts/staging/setup-staging-database.js verify
```

#### 8.2 Manual Verification
Use the checklist in [STAGING-DEPLOYMENT-CHECKLIST.md](./STAGING-DEPLOYMENT-CHECKLIST.md):

- [ ] **Basic Access**: https://staging.zenith.engineer loads
- [ ] **Authentication**: Sign-in/sign-out works
- [ ] **Database**: Data persistence works
- [ ] **Feature Flags**: Staging-specific features enabled
- [ ] **Monitoring**: Health checks operational

## 🔧 Configuration Files Reference

### Essential Configuration Files

#### `vercel.staging.json`
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "env": {
    "NODE_ENV": "staging",
    "NEXT_PUBLIC_APP_ENV": "staging",
    "NEXTAUTH_URL": "https://staging.zenith.engineer"
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

#### `.github/workflows/staging-deploy.yml`
Automated CI/CD pipeline for staging deployments with:
- Security scanning
- Quality checks
- Database migrations
- Health verification
- Performance testing

#### Environment Variables Summary
```bash
# Core Application
NODE_ENV=staging
NEXT_PUBLIC_APP_ENV=staging
NEXTAUTH_URL=https://staging.zenith.engineer
NEXT_PUBLIC_APP_URL=https://staging.zenith.engineer

# Database (from Railway)
DATABASE_URL=postgresql://...
POSTGRES_PRISMA_URL=postgresql://...
DIRECT_URL=postgresql://...

# Authentication
NEXTAUTH_SECRET=generated-secret
JWT_SECRET=generated-secret
GOOGLE_CLIENT_ID=staging-client-id
GOOGLE_CLIENT_SECRET=staging-client-secret

# Feature Flags
FEATURE_FLAGS_ENABLED=true
STAGING_MODE=true
DEBUG_MODE=true
NEXT_PUBLIC_FEATURE_ENHANCED_ANALYZER=true
NEXT_PUBLIC_FEATURE_TEAM_MANAGEMENT=true

# External Services (test/staging keys)
STRIPE_SECRET_KEY=sk_test_...
REDIS_URL=redis://...
RESEND_API_KEY=re_...

# Monitoring
NEXT_PUBLIC_MONITORING_ENABLED=true
MONITORING_ENVIRONMENT=staging
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

The staging environment integrates with GitHub Actions for automated deployments:

#### Trigger Conditions
- **Push to staging branch**: Automatic deployment
- **Pull request to staging**: Preview deployment
- **Manual trigger**: On-demand deployment

#### Pipeline Steps
1. **Security Scan**: Vulnerability detection
2. **Quality Checks**: TypeScript, ESLint, tests
3. **Database Migration**: Apply schema changes
4. **Build & Deploy**: Create and deploy artifacts
5. **Health Verification**: Post-deployment checks
6. **Performance Testing**: Lighthouse audits
7. **E2E Testing**: User journey validation
8. **Monitoring Setup**: Health check activation

#### Workflow Commands
```bash
# Trigger staging deployment
git push origin staging

# Manual workflow trigger
gh workflow run staging-deploy.yml

# Check workflow status
gh run list --workflow=staging-deploy.yml
```

### Branch Management

#### Staging Branch Strategy
```bash
# Create staging branch from main
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging

# Merge features to staging
git checkout staging
git merge feature/your-feature
git push origin staging

# Promote staging to production
git checkout main
git merge staging
git push origin main
```

## 🧪 Testing Procedures

### Automated Testing

#### Health Checks
```bash
# Basic health check
curl https://staging.zenith.engineer/api/health

# Comprehensive monitoring check
node scripts/staging/ci-staging-workflow.js healthCheck

# Database connectivity test
node scripts/staging/setup-staging-database.js verify
```

#### Performance Testing
```bash
# Lighthouse audit
npm install -g @lhci/cli
lhci autorun --collect.url=https://staging.zenith.engineer

# Response time testing
curl -o /dev/null -s -w "%{time_total}" https://staging.zenith.engineer
```

### Manual Testing

#### Core Functionality Testing
- [ ] **Homepage**: Loads without errors
- [ ] **Authentication**: Sign-in/sign-out flow
- [ ] **Dashboard**: User dashboard functionality
- [ ] **Website Analyzer**: Core feature works
- [ ] **Team Management**: Team features (if enabled)
- [ ] **Settings**: User settings modification

#### Cross-Browser Testing
- [ ] **Chrome**: Latest version
- [ ] **Firefox**: Latest version
- [ ] **Safari**: Latest version (if available)
- [ ] **Mobile**: Responsive design

#### Error Handling Testing
- [ ] **Network errors**: Offline/slow connection
- [ ] **Authentication errors**: Invalid credentials
- [ ] **Database errors**: Connection issues
- [ ] **API errors**: Rate limiting, timeouts

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Deployment Failures
**Issue**: Build fails with TypeScript errors
```bash
# Solution: Fix type errors
npm run type-check
# Fix reported errors and redeploy
```

**Issue**: Environment variable not found
```bash
# Solution: Verify environment variables
vercel env ls
vercel env add MISSING_VAR staging
```

#### Database Issues
**Issue**: Database connection fails
```bash
# Solution: Verify database configuration
railway variables
node scripts/staging/setup-staging-database.js verify
```

**Issue**: Migration fails
```bash
# Solution: Reset and re-apply migrations
npx prisma migrate reset
npx prisma migrate deploy
```

#### OAuth Issues
**Issue**: OAuth redirect fails
```bash
# Solution: Verify OAuth configuration
vercel env get NEXTAUTH_URL staging
# Should be: https://staging.zenith.engineer

# Check Google Cloud Console redirect URI
# Should be: https://staging.zenith.engineer/api/auth/callback/google
```

#### Performance Issues
**Issue**: Slow page loads
```bash
# Solution: Check performance metrics
curl -w "@curl-format.txt" https://staging.zenith.engineer
node scripts/staging/setup-staging-monitoring.js test
```

### Debug Commands
```bash
# Check deployment logs
vercel logs --follow

# Test specific endpoints
curl -v https://staging.zenith.engineer/api/health
curl -v https://staging.zenith.engineer/api/auth/session

# Check database status
railway status
railway logs postgresql

# Verify environment configuration
vercel env ls | grep -E "(DATABASE|NEXTAUTH|GOOGLE)"
```

## 📊 Monitoring and Maintenance

### Continuous Monitoring

#### Health Monitoring
- **Uptime monitoring**: External service (Uptime Robot)
- **Performance monitoring**: Built-in health checks
- **Error tracking**: Sentry integration
- **Database monitoring**: Railway dashboard

#### Monitoring Dashboard
Access the staging monitoring dashboard at:
- `https://staging.zenith.engineer/staging-monitoring`
- Real-time health metrics
- Performance indicators
- Database status

### Maintenance Tasks

#### Regular Maintenance
- [ ] **Weekly**: Review staging environment health
- [ ] **Bi-weekly**: Update dependencies
- [ ] **Monthly**: Rotate secrets and credentials
- [ ] **Quarterly**: Review and optimize configuration

#### Security Maintenance
- [ ] **SSL certificates**: Auto-renewed by Vercel
- [ ] **OAuth credentials**: Rotate every 6 months
- [ ] **Database credentials**: Managed by Railway
- [ ] **API keys**: Rotate per vendor recommendations

## 🎯 Success Metrics

### Technical Metrics
- **Uptime**: >99.9%
- **Response time**: <200ms average
- **Error rate**: <0.1%
- **Build success rate**: >95%

### Functional Metrics
- **Authentication success rate**: >99%
- **Feature flag reliability**: 100%
- **Database connection stability**: >99.9%
- **Monitoring accuracy**: 100%

## 📞 Support and Resources

### Documentation
- [Staging Domain Setup](./STAGING-DOMAIN-SETUP.md)
- [OAuth Configuration](./STAGING-OAUTH-SETUP.md)
- [Deployment Checklist](./STAGING-DEPLOYMENT-CHECKLIST.md)
- [Feature Flags Configuration](./config/staging-feature-flags.json)

### Scripts and Tools
- `./scripts/staging/deploy-staging.sh` - Full deployment script
- `./scripts/staging/setup-staging-env.sh` - Environment setup
- `./scripts/staging/setup-staging-database.js` - Database configuration
- `./scripts/staging/setup-staging-monitoring.js` - Monitoring setup
- `./scripts/staging/ci-staging-workflow.js` - CI/CD workflow

### External Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)

### Team Contacts
- **Platform Team**: [Your team contact]
- **DevOps Team**: [DevOps contact]
- **Security Team**: [Security contact]

## 🎉 Conclusion

With this comprehensive staging deployment guide, you now have:

✅ **Complete staging environment setup**  
✅ **Automated deployment scripts**  
✅ **Comprehensive monitoring and health checks**  
✅ **Proper OAuth and authentication configuration**  
✅ **Database setup and management**  
✅ **Feature flag management**  
✅ **CI/CD integration**  
✅ **Troubleshooting procedures**

The staging environment provides a safe, production-like environment for testing and validation before production deployments, ensuring the highest quality and reliability for the Zenith Platform.

---

**🚀 Ready to deploy? Start with the Quick Start section or follow the detailed steps for a comprehensive setup.**