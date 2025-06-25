# Zenith Platform Staging Deployment Guide

This guide provides comprehensive instructions for setting up and deploying the Zenith Platform staging environment.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Railway Database Configuration](#railway-database-configuration)
3. [Vercel Staging Environment Setup](#vercel-staging-environment-setup)
4. [GitHub Secrets Configuration](#github-secrets-configuration)
5. [Environment Variables](#environment-variables)
6. [Deployment Process](#deployment-process)
7. [Testing Checklist](#testing-checklist)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting the staging deployment, ensure you have:

- [ ] Railway CLI installed (`npm install -g @railway/cli`)
- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] GitHub repository access with admin privileges
- [ ] Node.js 18+ and npm/yarn installed
- [ ] PostgreSQL client tools (for database verification)
- [ ] Access to all required API keys and secrets

## Railway Database Configuration

### Step 1: Initialize Railway Project

```bash
# Login to Railway
railway login

# Create new project or link existing
railway link

# Add PostgreSQL database
railway add postgresql
```

### Step 2: Configure Database Environment

```bash
# Set database environment variables
railway variables set NODE_ENV=staging
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
railway variables set POSTGRES_PRISMA_URL=${{Postgres.DATABASE_URL}}
railway variables set POSTGRES_URL_NON_POOLING=${{Postgres.DATABASE_URL}}

# Enable connection pooling
railway variables set DATABASE_CONNECTION_LIMIT=10
railway variables set DATABASE_POOL_TIMEOUT=30
```

### Step 3: Setup Database Schema

```bash
# Run database setup script
bash scripts/staging/setup-database.sh

# Or manually run these commands:
npx prisma generate
npx prisma db push --accept-data-loss
node scripts/staging/seed-staging-data.js
```

### Step 4: Create Performance Indexes

```bash
# Apply performance optimizations
npx prisma db execute --file=scripts/staging/create-indexes.sql

# Verify indexes
railway run psql $DATABASE_URL -c "\di"
```

### Step 5: Configure Automated Backups

```bash
# Set up daily backups
railway variables set BACKUP_SCHEDULE="0 2 * * *"
railway variables set BACKUP_RETENTION_DAYS=7

# Test backup script
bash scripts/staging/backup-database.sh
```

## Vercel Staging Environment Setup

### Step 1: Create Staging Project

```bash
# Initialize Vercel project
vercel

# Select "Create new project"
# Name it: zenith-platform-staging
# Framework: Next.js
# Build settings: Use defaults
```

### Step 2: Configure Staging Branch

```bash
# Link staging branch
vercel git-branch staging

# Set production branch to staging
vercel --prod --scope=your-team
```

### Step 3: Environment Configuration

```bash
# Set environment variables for staging
vercel env add DATABASE_URL staging
vercel env add NEXTAUTH_URL staging
vercel env add NEXTAUTH_SECRET staging
vercel env add REDIS_URL staging

# Add all required variables (see Environment Variables section)
```

### Step 4: Domain Configuration

```bash
# Add staging subdomain
vercel domains add staging.zenith.engineer

# Configure SSL certificate
vercel certs issue staging.zenith.engineer
```

## GitHub Secrets Configuration

### Step 1: Repository Secrets

Navigate to: Settings → Secrets and variables → Actions

Add the following secrets:

```yaml
# Railway Secrets
RAILWAY_TOKEN: Your Railway API token
RAILWAY_PROJECT_ID: Your Railway project ID
RAILWAY_ENVIRONMENT_ID: Staging environment ID

# Vercel Secrets
VERCEL_TOKEN: Your Vercel API token
VERCEL_ORG_ID: Your Vercel organization ID
VERCEL_PROJECT_ID: Staging project ID

# Database
STAGING_DATABASE_URL: PostgreSQL connection string
STAGING_REDIS_URL: Redis connection string

# Authentication
STAGING_NEXTAUTH_SECRET: Generated secret for staging
STAGING_GOOGLE_CLIENT_ID: OAuth client ID
STAGING_GOOGLE_CLIENT_SECRET: OAuth client secret

# API Keys
STAGING_OPENAI_API_KEY: OpenAI API key
STAGING_ANTHROPIC_API_KEY: Claude API key
STAGING_STRIPE_SECRET_KEY: Stripe test key
```

### Step 2: GitHub Actions Workflow

Create `.github/workflows/staging-deploy.yml`:

```yaml
name: Deploy to Staging

on:
  push:
    branches: [staging]
  pull_request:
    branches: [staging]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Staging
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## Environment Variables

### Required Environment Variables

Create `.env.staging` file:

```bash
# Application
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.zenith.engineer

# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
POSTGRES_PRISMA_URL=${DATABASE_URL}
POSTGRES_URL_NON_POOLING=${DATABASE_URL}

# Authentication
NEXTAUTH_URL=https://staging.zenith.engineer
NEXTAUTH_SECRET=your-staging-secret-here

# OAuth Providers
GOOGLE_CLIENT_ID=your-staging-google-client-id
GOOGLE_CLIENT_SECRET=your-staging-google-secret

# Redis Cache
REDIS_URL=redis://default:password@host:port

# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-google-ai-key

# Payment Processing
STRIPE_SECRET_KEY=sk_test_your-stripe-test-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Analytics & Monitoring
SENTRY_DSN=your-sentry-staging-dsn
GA_MEASUREMENT_ID=G-STAGING123

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_TEAM_FEATURES=true
ENABLE_PAYMENT_FEATURES=false
```

### Vercel Environment Setup

```bash
# Load all variables from .env.staging
while IFS= read -r line; do
  if [[ ! "$line" =~ ^# ]] && [[ -n "$line" ]]; then
    key=$(echo "$line" | cut -d '=' -f 1)
    value=$(echo "$line" | cut -d '=' -f 2-)
    vercel env add "$key" staging < <(echo "$value")
  fi
done < .env.staging
```

## Deployment Process

### Step 1: Prepare Staging Branch

```bash
# Create staging branch from main
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging
```

### Step 2: Database Migration

```bash
# Connect to Railway environment
railway environment staging

# Run migrations
railway run npx prisma migrate deploy
railway run node scripts/staging/seed-staging-data.js

# Verify database
railway run node scripts/staging/verify-database.js
```

### Step 3: Deploy Application

```bash
# Manual deployment
vercel --prod

# Or push to staging branch for automatic deployment
git push origin staging
```

### Step 4: Post-Deployment Verification

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs staging.zenith.engineer

# Run health checks
curl https://staging.zenith.engineer/api/health
```

## Testing Checklist

### Pre-Deployment Tests

- [ ] All unit tests passing (`npm test`)
- [ ] Integration tests passing (`npm run test:integration`)
- [ ] Build completes without errors (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Database migrations tested locally

### Post-Deployment Tests

#### 1. Infrastructure Verification
- [ ] Application loads without errors
- [ ] Database connection established
- [ ] Redis cache functioning
- [ ] Environment variables loaded correctly

#### 2. Authentication Testing
- [ ] User registration flow works
- [ ] Login with email/password successful
- [ ] Google OAuth login functional
- [ ] Session persistence working
- [ ] Logout functionality works

#### 3. Core Features Testing
- [ ] Website Health Analyzer runs successfully
- [ ] Project creation and management works
- [ ] User dashboard loads properly
- [ ] API endpoints responding correctly

#### 4. Performance Testing
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] No memory leaks detected
- [ ] Database queries optimized

#### 5. Security Testing
- [ ] HTTPS enforced
- [ ] Authentication required for protected routes
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Input validation working

### Automated Testing Script

Create `scripts/staging/test-deployment.js`:

```javascript
const testDeployment = async () => {
  const STAGING_URL = 'https://staging.zenith.engineer';
  const tests = [];

  // Test home page
  tests.push({
    name: 'Home page loads',
    test: async () => {
      const res = await fetch(STAGING_URL);
      return res.status === 200;
    }
  });

  // Test API health
  tests.push({
    name: 'API health check',
    test: async () => {
      const res = await fetch(`${STAGING_URL}/api/health`);
      const data = await res.json();
      return data.status === 'healthy';
    }
  });

  // Test authentication endpoint
  tests.push({
    name: 'Auth endpoint accessible',
    test: async () => {
      const res = await fetch(`${STAGING_URL}/api/auth/providers`);
      return res.status === 200;
    }
  });

  // Run all tests
  for (const test of tests) {
    try {
      const result = await test.test();
      console.log(`✅ ${test.name}: ${result ? 'PASSED' : 'FAILED'}`);
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    }
  }
};

testDeployment();
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Issues

**Problem**: "Can't connect to PostgreSQL server"
```bash
# Solution: Verify DATABASE_URL format
railway variables

# Check SSL settings
railway run psql $DATABASE_URL -c "SELECT 1"

# Update Prisma schema if needed
# Add: ?sslmode=require to DATABASE_URL
```

#### 2. Build Failures on Vercel

**Problem**: "Build failed with exit code 1"
```bash
# Solution: Check build logs
vercel logs --output=raw

# Common fixes:
# - Ensure all dependencies are in package.json
# - Check for missing environment variables
# - Verify Node.js version compatibility
```

#### 3. Authentication Not Working

**Problem**: "NextAuth error: Please define NEXTAUTH_URL"
```bash
# Solution: Set environment variables
vercel env add NEXTAUTH_URL staging
vercel env add NEXTAUTH_SECRET staging

# Regenerate secret if needed
openssl rand -base64 32
```

#### 4. Redis Connection Failed

**Problem**: "Redis connection refused"
```bash
# Solution: Verify Redis URL format
# Format: redis://default:password@host:port

# Test connection
railway run node -e "
  const redis = require('ioredis');
  const client = new redis(process.env.REDIS_URL);
  client.ping().then(() => console.log('Redis connected')).catch(console.error);
"
```

#### 5. Prisma Schema Issues

**Problem**: "Prisma schema not in sync"
```bash
# Solution: Reset and sync database
railway run npx prisma db push --force-reset
railway run npx prisma generate
railway run node scripts/staging/seed-staging-data.js
```

### Debug Commands

```bash
# View all environment variables
vercel env ls staging

# Check Railway logs
railway logs --tail

# Inspect Vercel build output
vercel inspect [deployment-url]

# Database connection test
railway run npx prisma db execute --stdin <<< "SELECT version();"

# View running services
railway status
```

### Support Resources

- Railway Documentation: https://docs.railway.app
- Vercel Documentation: https://vercel.com/docs
- Prisma Troubleshooting: https://www.prisma.io/docs/guides
- NextAuth.js Errors: https://next-auth.js.org/errors

---

## Next Steps

After successful staging deployment:

1. Run comprehensive test suite
2. Perform load testing with staging data
3. Review security configurations
4. Set up monitoring and alerts
5. Document any environment-specific configurations
6. Create rollback procedures

For production deployment, see `PRODUCTION-DEPLOYMENT.md`.

---

*Last updated: 2025-06-25*