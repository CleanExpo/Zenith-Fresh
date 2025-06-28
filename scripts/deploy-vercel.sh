#!/bin/bash

echo "🚀 Zenith Platform - Direct Vercel Deployment"
echo "============================================"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
fi

# Set the token
export VERCEL_TOKEN="N5UFI8ZprlgY69oigubxRp6s"

echo "✅ Vercel token configured"
echo ""
echo "📋 Pre-deployment checklist:"
echo "1. Ensure you're logged into Vercel CLI"
echo "2. Your project should be linked to Vercel"
echo "3. Environment variables should be configured in Vercel dashboard"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Build the project first
echo "🏗️ Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to production
    echo "🚀 Deploying to Vercel production..."
    vercel --prod --yes
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployment successful!"
        echo "🌐 Your app should be live at: https://zenith.engineer"
    else
        echo "❌ Deployment failed. Please check the error messages above."
        echo ""
        echo "Common issues:"
        echo "1. Missing VERCEL_ORG_ID or VERCEL_PROJECT_ID"
        echo "2. Project not linked (run: vercel link)"
        echo "3. Environment variables not set in Vercel"
    fi
else
    echo "❌ Build failed. Please fix build errors before deploying."
fi