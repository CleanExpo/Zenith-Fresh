# Vercel Deployment Fix Guide

## Current Issue
The GitHub Actions workflow is failing at the Vercel deployment step. This is likely due to missing or incorrect configuration.

## Solution Steps

### 1. Configure GitHub Repository Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
VERCEL_TOKEN=N5UFI8ZprlgY69oigubxRp6s
VERCEL_ORG_ID=(Get from Vercel dashboard)
VERCEL_PROJECT_ID=(Get from Vercel dashboard)
```

To get the Vercel Org ID and Project ID:
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → General
4. Copy the "Project ID" and "Team ID" (org ID)

### 2. Configure Vercel Environment Variables

Option A: Using Vercel Dashboard (Recommended)
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add all variables from `.env.production` file

Option B: Using Vercel CLI
```bash
# Login to Vercel
vercel login

# Link to your project
vercel link

# Run the setup script
./scripts/setup-vercel-env.sh
```

### 3. Manual Deployment (If GitHub Actions continues to fail)

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Deploy to production
vercel --prod
```

### 4. Fix Routes Manifest Issue

The "routes-manifest.json couldn't be found" error is resolved by:
- Using `output: 'standalone'` in next.config.js ✅ (Already done)
- Ensuring all API routes have `export const dynamic = 'force-dynamic'` ✅ (Already done)

### 5. Required Environment Variables Summary

**Critical for deployment:**
- DATABASE_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

**Required for features:**
- GOOGLE_PAGESPEED_API_KEY (for website analyzer)
- STRIPE_SECRET_KEY (for billing)
- RESEND_API_KEY (for emails)
- AI API keys (for AI features)

## Security Notice

⚠️ **IMMEDIATE ACTION REQUIRED**: All the API keys and credentials have been exposed. After successful deployment:

1. **Rotate all credentials:**
   - Generate new Anthropic API key
   - Generate new OpenAI API key
   - Rotate Google API keys
   - Generate new Stripe keys (coordinate with Stripe support)
   - Change database password
   - Generate new JWT secret
   - Update all other secrets

2. **Update in all locations:**
   - Vercel environment variables
   - GitHub secrets
   - Local .env files

## Verification Steps

After deployment:
1. Visit https://zenith.engineer
2. Check the free URL analyzer works
3. Test authentication with Google OAuth
4. Verify database connectivity

## Support

If deployment continues to fail:
1. Check Vercel build logs for specific errors
2. Ensure domain is properly configured in Vercel
3. Verify SSL certificates are active
4. Check that all required environment variables are set