#!/bin/bash

# Test Health Check Script
# This script demonstrates running the health check system with proper environment setup

set -e  # Exit on any error

echo "🔍 Zenith Platform Health Check Test"
echo "===================================="

# Load environment variables from .env if it exists
if [ -f ".env" ]; then
    echo "📁 Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
else
    echo "⚠️  No .env file found - using system environment"
fi

# Display current environment info
echo ""
echo "🌍 Environment Information:"
echo "  Node.js: $(node --version)"
echo "  NPM: $(npm --version)"
echo "  Environment: ${NODE_ENV:-development}"
echo "  Working Directory: $(pwd)"

# Check if database URL is set (without exposing the full URL)
if [ -n "$DATABASE_URL" ]; then
    echo "  Database: ✅ Configured"
else
    echo "  Database: ❌ Not configured"
fi

# Check if auth secrets are set
if [ -n "$NEXTAUTH_SECRET" ]; then
    echo "  Auth Secret: ✅ Configured"
else
    echo "  Auth Secret: ❌ Not configured"
fi

if [ -n "$NEXTAUTH_URL" ]; then
    echo "  Auth URL: ✅ Configured ($NEXTAUTH_URL)"
else
    echo "  Auth URL: ❌ Not configured"
fi

echo ""
echo "🚀 Running comprehensive health check..."
echo "========================================"

# Run the health check
npm run health-check

# Capture the exit code
HEALTH_CHECK_EXIT_CODE=$?

echo ""
echo "📊 Health Check Results:"
echo "======================="

if [ $HEALTH_CHECK_EXIT_CODE -eq 0 ]; then
    echo "✅ SUCCESS: System is ready for deployment"
    echo "   All critical checks passed"
    echo "   You can proceed with deployment"
else
    echo "❌ FAILURE: System is not ready for deployment"
    echo "   Critical issues detected"
    echo "   Review the health check report and fix issues before deploying"
fi

echo ""
echo "📄 Check the detailed report at: health-check-report.json"
echo "📚 For troubleshooting, see: scripts/HEALTH-CHECK-README.md"

exit $HEALTH_CHECK_EXIT_CODE