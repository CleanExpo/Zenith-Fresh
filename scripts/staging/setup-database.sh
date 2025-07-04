#!/bin/bash

# Railway Staging Database Setup Script
# This script sets up the Railway PostgreSQL database for staging environment

set -e

echo "🚀 Setting up Railway Staging Database..."

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please ensure Railway database is configured and environment variables are available"
    exit 1
fi

echo "✅ Environment variables validated"

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm ci --only=production

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

# Check database connection
echo "🔍 Testing database connection..."
npx prisma db execute --file=./scripts/staging/test-connection.sql || echo "⚠️ Connection test failed, but continuing..."

# Run staging data seeding
echo "🌱 Seeding staging database..."
node ./scripts/staging/seed-staging-data.js

# Create database indexes for performance
echo "⚡ Creating performance indexes..."
npx prisma db execute --file=./scripts/staging/create-indexes.sql

# Verify database setup
echo "✅ Verifying database setup..."
node ./scripts/staging/verify-database.js

echo "🎉 Railway staging database setup completed successfully!"
echo ""
echo "Database URL: $DATABASE_URL"
echo "Environment: staging"
echo "SSL Enabled: ${DATABASE_SSL_ENABLED:-true}"
echo ""
echo "Next steps:"
echo "1. Deploy your application to Railway"
echo "2. Configure environment variables in Railway dashboard"
echo "3. Test the staging environment"
echo ""
echo "Monitoring:"
echo "- Health checks: ${HEALTH_CHECK_ENABLED:-true}"
echo "- Database monitoring: ${DATABASE_MONITORING_ENABLED:-true}"
echo "- Backup enabled: ${BACKUP_ENABLED:-true}"