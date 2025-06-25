#!/bin/bash

# Zenith Platform - Staging Deployment Script
# This script deploys the current branch to staging environment

set -e

echo "🚀 Starting Zenith Platform Staging Deployment..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Get current commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)
echo "🔗 Commit hash: $COMMIT_HASH"

# Update cache bust in staging config
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
sed -i.bak "s/\"CACHE_BUST\": \"staging-[^\"]*\"/\"CACHE_BUST\": \"staging-$TIMESTAMP\"/g" vercel.staging.json
rm -f vercel.staging.json.bak

echo "⚡ Updated cache bust to: staging-$TIMESTAMP"

# Ensure all changes are committed
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Committing staging configuration changes..."
    git add vercel.staging.json
    git commit -m "staging: Update cache bust for deployment $TIMESTAMP"
fi

# Deploy to staging
echo "🚀 Deploying to staging environment..."
vercel --config vercel.staging.json --env NODE_ENV=staging --confirm

# Get the deployment URL
STAGING_URL=$(vercel ls --config vercel.staging.json | grep "zenith-platform-staging" | head -1 | awk '{print $2}')

echo ""
echo "✅ Staging deployment complete!"
echo "🌍 Staging URL: https://$STAGING_URL"
echo "📊 Branch: $CURRENT_BRANCH"
echo "🔗 Commit: $COMMIT_HASH"
echo ""
echo "🧪 Next steps:"
echo "   1. Test the staging environment"
echo "   2. Verify all features work correctly"
echo "   3. Run automated tests against staging"
echo "   4. If tests pass, deploy to production"
echo ""
echo "📋 Staging checklist:"
echo "   [ ] Authentication works"
echo "   [ ] Database operations functional"
echo "   [ ] Website analyzer working"
echo "   [ ] New features behave correctly"
echo "   [ ] Performance is acceptable"
echo ""