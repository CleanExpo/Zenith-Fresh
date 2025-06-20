#!/bin/bash

# Zenith Platform Deployment Script
# This script handles the deployment process for the Zenith Platform

set -e  # Exit on any error

echo "🚀 Starting Zenith Platform Deployment..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Check if required tools are installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed."
    exit 1
fi

echo "✅ Environment checks passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate

# Run linting
echo "🔍 Running linting..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm run test

# Build the application
echo "🏗️  Building application..."
npm run build

echo "✅ Build completed successfully!"

# Check if Vercel CLI is available for deployment
if command -v vercel &> /dev/null; then
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    echo "✅ Deployment completed!"
else
    echo "ℹ️  Vercel CLI not found. Please install it with: npm i -g vercel"
    echo "ℹ️  Or deploy through the Vercel dashboard at https://vercel.com"
    echo "✅ Build is ready for deployment!"
fi

echo ""
echo "🎉 Deployment process completed!"
echo ""
echo "Next steps:"
echo "1. If not using Vercel CLI, upload the .next folder to your hosting provider"
echo "2. Set up environment variables on your hosting platform"
echo "3. Run database migrations: npm run prisma:migrate"
echo "4. Monitor application logs for any issues"
echo ""
echo "For more details, see DEPLOYMENT.md"
