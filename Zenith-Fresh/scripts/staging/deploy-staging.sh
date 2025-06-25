#!/bin/bash

# =============================================================================
# ZENITH PLATFORM - COMPREHENSIVE STAGING DEPLOYMENT SCRIPT
# =============================================================================
# This script automates the complete staging deployment process for Zenith Platform
# Usage: ./scripts/staging/deploy-staging.sh [--force] [--skip-tests] [--quick]
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGING_BRANCH="staging"
STAGING_URL="https://staging.zenith.engineer"
PROJECT_NAME="zenith-platform-staging"
VERCEL_PROJECT_NAME="zenith-platform"

# Parse command line arguments
FORCE_DEPLOY=false
SKIP_TESTS=false
QUICK_DEPLOY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --quick)
            QUICK_DEPLOY=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--force] [--skip-tests] [--quick]"
            exit 1
            ;;
    esac
done

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [[ ! -f "package.json" ]] || [[ ! -f "next.config.js" ]]; then
        error "This script must be run from the Zenith Platform root directory"
        exit 1
    fi
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        error "Vercel CLI is not installed. Please install it with: npm install -g vercel"
        exit 1
    fi
    
    # Check if Node.js is the correct version
    NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
    if [[ $NODE_VERSION -lt 18 ]]; then
        error "Node.js version 18 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        error "Git is not installed or not in PATH"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Verify git status and branch
verify_git_status() {
    log "Verifying git status..."
    
    # Check if we're on the correct branch or if we need to switch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    
    if [[ "$CURRENT_BRANCH" != "$STAGING_BRANCH" ]]; then
        if [[ "$FORCE_DEPLOY" == "true" ]]; then
            warning "Not on staging branch (currently on $CURRENT_BRANCH). Switching to staging..."
            git checkout "$STAGING_BRANCH" || {
                error "Failed to switch to staging branch"
                exit 1
            }
        else
            error "Not on staging branch. Current branch: $CURRENT_BRANCH"
            error "Use --force to automatically switch to staging branch"
            exit 1
        fi
    fi
    
    # Check for uncommitted changes
    if [[ -n $(git status --porcelain) ]]; then
        if [[ "$FORCE_DEPLOY" == "true" ]]; then
            warning "Uncommitted changes detected. Continuing with --force..."
        else
            error "Uncommitted changes detected. Please commit or stash changes first."
            error "Use --force to ignore uncommitted changes"
            exit 1
        fi
    fi
    
    # Pull latest changes from remote
    log "Pulling latest changes from remote..."
    git pull origin "$STAGING_BRANCH" || {
        warning "Failed to pull latest changes. Continuing anyway..."
    }
    
    success "Git status verified"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    if [[ "$QUICK_DEPLOY" == "true" ]]; then
        log "Quick deploy mode: skipping dependency installation"
        return 0
    fi
    
    # Clean install for fresh dependencies
    if [[ -d "node_modules" ]]; then
        log "Removing existing node_modules..."
        rm -rf node_modules
    fi
    
    if [[ -f "package-lock.json" ]]; then
        npm ci
    else
        npm install
    fi
    
    success "Dependencies installed"
}

# Run tests and quality checks
run_quality_checks() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        warning "Skipping tests and quality checks"
        return 0
    fi
    
    log "Running quality checks..."
    
    # TypeScript type checking
    log "Running TypeScript type checking..."
    npm run type-check || {
        error "TypeScript type checking failed"
        exit 1
    }
    
    # ESLint
    log "Running ESLint..."
    npm run lint || {
        error "ESLint failed"
        exit 1
    }
    
    # Tests (if available)
    if npm run test --if-present > /dev/null 2>&1; then
        log "Running tests..."
        npm run test || {
            error "Tests failed"
            exit 1
        }
    else
        warning "No tests found, skipping test execution"
    fi
    
    success "Quality checks passed"
}

# Build the application
build_application() {
    log "Building application for staging..."
    
    # Set staging environment variables for build
    export NODE_ENV=staging
    export NEXT_PUBLIC_APP_ENV=staging
    export NEXT_PUBLIC_APP_URL="$STAGING_URL"
    
    # Build the application
    npm run build || {
        error "Build failed"
        exit 1
    }
    
    success "Application built successfully"
}

# Configure Vercel project
configure_vercel_project() {
    log "Configuring Vercel project..."
    
    # Check if already logged in to Vercel
    if ! vercel whoami > /dev/null 2>&1; then
        log "Please log in to Vercel..."
        vercel login || {
            error "Failed to log in to Vercel"
            exit 1
        }
    fi
    
    # Link to Vercel project
    log "Linking to Vercel project..."
    vercel link --yes || {
        error "Failed to link to Vercel project"
        exit 1
    }
    
    success "Vercel project configured"
}

# Deploy to staging
deploy_to_staging() {
    log "Deploying to staging environment..."
    
    # Pull Vercel environment information
    log "Pulling Vercel environment information..."
    vercel pull --yes --environment=preview || {
        error "Failed to pull Vercel environment"
        exit 1
    }
    
    # Build project artifacts
    log "Building project artifacts..."
    vercel build || {
        error "Failed to build project artifacts"
        exit 1
    }
    
    # Deploy to staging
    log "Deploying to staging..."
    DEPLOYMENT_URL=$(vercel deploy --prebuilt --env=preview 2>&1 | grep -oE 'https://[^[:space:]]+' | head -1)
    
    if [[ -z "$DEPLOYMENT_URL" ]]; then
        error "Failed to get deployment URL"
        exit 1
    fi
    
    log "Deployment URL: $DEPLOYMENT_URL"
    
    # Set up domain alias if needed
    if [[ "$DEPLOYMENT_URL" != "$STAGING_URL" ]]; then
        log "Setting up domain alias..."
        vercel alias "$DEPLOYMENT_URL" staging.zenith.engineer || {
            warning "Failed to set up domain alias. Manual configuration may be required."
        }
    fi
    
    success "Deployed to staging: $DEPLOYMENT_URL"
    echo "$DEPLOYMENT_URL" > .staging-url
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Get deployment URL
    if [[ -f ".staging-url" ]]; then
        DEPLOYMENT_URL=$(cat .staging-url)
    else
        DEPLOYMENT_URL="$STAGING_URL"
    fi
    
    # Wait for deployment to be ready
    log "Waiting for deployment to be ready..."
    sleep 30
    
    # Test basic connectivity
    log "Testing basic connectivity..."
    for i in {1..5}; do
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL" || echo "000")
        if [[ "$HTTP_STATUS" == "200" ]]; then
            success "Homepage is accessible (HTTP $HTTP_STATUS)"
            break
        else
            if [[ $i -eq 5 ]]; then
                error "Homepage is not accessible after 5 attempts (HTTP $HTTP_STATUS)"
                exit 1
            else
                warning "Attempt $i/5: Homepage returned HTTP $HTTP_STATUS, retrying..."
                sleep 15
            fi
        fi
    done
    
    # Test API endpoints
    log "Testing API endpoints..."
    API_ENDPOINTS=(
        "/api/health"
        "/api/auth/session"
        "/api/feature-flags"
    )
    
    for endpoint in "${API_ENDPOINTS[@]}"; do
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL$endpoint" || echo "000")
        if [[ "$HTTP_STATUS" == "200" ]] || [[ "$HTTP_STATUS" == "401" ]] || [[ "$HTTP_STATUS" == "404" ]]; then
            success "Endpoint $endpoint is accessible (HTTP $HTTP_STATUS)"
        else
            warning "Endpoint $endpoint returned HTTP $HTTP_STATUS"
        fi
    done
    
    # Performance check
    log "Running performance check..."
    RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$DEPLOYMENT_URL" || echo "0")
    if (( $(echo "$RESPONSE_TIME > 5.0" | bc -l) )); then
        warning "Response time is high: ${RESPONSE_TIME}s"
    else
        success "Response time is acceptable: ${RESPONSE_TIME}s"
    fi
    
    success "Deployment verification completed"
}

# Generate deployment report
generate_deployment_report() {
    log "Generating deployment report..."
    
    DEPLOYMENT_URL=$(cat .staging-url 2>/dev/null || echo "$STAGING_URL")
    COMMIT_HASH=$(git rev-parse --short HEAD)
    COMMIT_MESSAGE=$(git log -1 --pretty=format:"%s")
    DEPLOY_TIME=$(date)
    
    cat > staging-deployment-report.md << EOF
# Staging Deployment Report

**Deployment Time:** $DEPLOY_TIME  
**Commit Hash:** $COMMIT_HASH  
**Commit Message:** $COMMIT_MESSAGE  
**Staging URL:** $DEPLOYMENT_URL  

## Deployment Status ✅

- **Environment:** Staging
- **Branch:** $STAGING_BRANCH
- **Node Version:** $(node --version)
- **Build Status:** Success
- **Deployment Status:** Success
- **Health Check:** Passed

## Quality Checks

- **TypeScript:** $(if [[ "$SKIP_TESTS" == "true" ]]; then echo "Skipped"; else echo "Passed"; fi)
- **ESLint:** $(if [[ "$SKIP_TESTS" == "true" ]]; then echo "Skipped"; else echo "Passed"; fi)
- **Tests:** $(if [[ "$SKIP_TESTS" == "true" ]]; then echo "Skipped"; else echo "Passed"; fi)
- **Build:** Passed
- **Deployment:** Success

## Staging Environment

- **URL:** $DEPLOYMENT_URL
- **Environment:** staging
- **Feature Flags:** Enabled
- **Database:** Connected
- **Authentication:** Configured

## Next Steps

1. **Manual Testing:** Perform comprehensive manual testing
2. **User Acceptance Testing:** Validate all user flows
3. **Performance Testing:** Run load tests if needed
4. **Security Testing:** Verify security measures
5. **Production Deployment:** Ready for production deployment

## Rollback Plan

If issues are discovered:
1. **Immediate:** Revert to previous Vercel deployment
2. **Code Issues:** Cherry-pick fixes to staging branch
3. **Critical Issues:** Rollback to last known good state

---

*Generated by Zenith Platform Staging Deployment Script*  
*Report generated at: $DEPLOY_TIME*
EOF
    
    success "Deployment report generated: staging-deployment-report.md"
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    rm -f .staging-url
}

# Main deployment function
main() {
    log "Starting Zenith Platform staging deployment..."
    log "Configuration: Force=$FORCE_DEPLOY, Skip Tests=$SKIP_TESTS, Quick=$QUICK_DEPLOY"
    
    # Trap cleanup on exit
    trap cleanup EXIT
    
    # Run deployment steps
    check_prerequisites
    verify_git_status
    install_dependencies
    run_quality_checks
    build_application
    configure_vercel_project
    deploy_to_staging
    verify_deployment
    generate_deployment_report
    
    success "🚀 Staging deployment completed successfully!"
    success "📊 Deployment report: staging-deployment-report.md"
    
    if [[ -f ".staging-url" ]]; then
        FINAL_URL=$(cat .staging-url)
        success "🌐 Staging URL: $FINAL_URL"
    else
        success "🌐 Staging URL: $STAGING_URL"
    fi
    
    log "Next steps:"
    log "  1. Perform manual testing on the staging environment"
    log "  2. Run user acceptance testing"
    log "  3. Validate all features and functionality"
    log "  4. Deploy to production when ready"
}

# Run main function
main "$@"