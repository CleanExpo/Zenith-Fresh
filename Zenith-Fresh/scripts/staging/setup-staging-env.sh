#!/bin/bash

# =============================================================================
# ZENITH PLATFORM - AUTOMATED STAGING ENVIRONMENT SETUP
# =============================================================================
# This script automatically configures all staging environment variables
# Usage: ./scripts/staging/setup-staging-env.sh [--dry-run] [--update-only]
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGING_URL="https://staging.zenith.engineer"
DRY_RUN=false
UPDATE_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --update-only)
            UPDATE_ONLY=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--dry-run] [--update-only]"
            exit 1
            ;;
    esac
done

# Logging functions
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
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        error "Vercel CLI is not installed. Please install it with: npm install -g vercel"
        exit 1
    fi
    
    # Check if we're logged in to Vercel
    if ! vercel whoami > /dev/null 2>&1; then
        error "Not logged in to Vercel. Please run: vercel login"
        exit 1
    fi
    
    # Check if openssl is available for generating secrets
    if ! command -v openssl &> /dev/null; then
        error "OpenSSL is not available. Please install OpenSSL."
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Generate secure random secrets
generate_secret() {
    openssl rand -hex 32
}

generate_jwt_secret() {
    openssl rand -hex 64
}

# Set environment variable in Vercel
set_vercel_env() {
    local key=$1
    local value=$2
    local description=$3
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "[DRY RUN] Would set $key = $value"
        return 0
    fi
    
    log "Setting $key..."
    if [[ -n "$description" ]]; then
        log "  Description: $description"
    fi
    
    # Check if environment variable already exists
    if vercel env ls | grep -q "^$key"; then
        if [[ "$UPDATE_ONLY" == "true" ]]; then
            log "  Updating existing environment variable: $key"
            echo "$value" | vercel env add "$key" staging --force > /dev/null 2>&1 || {
                warning "Failed to update $key, attempting to remove and re-add..."
                vercel env rm "$key" staging --yes > /dev/null 2>&1 || true
                echo "$value" | vercel env add "$key" staging > /dev/null 2>&1
            }
        else
            warning "  Environment variable $key already exists, skipping..."
            return 0
        fi
    else
        echo "$value" | vercel env add "$key" staging > /dev/null 2>&1 || {
            error "Failed to set $key"
            return 1
        }
    fi
    
    success "  ✅ $key configured"
}

# Configure core application settings
configure_core_settings() {
    log "Configuring core application settings..."
    
    set_vercel_env "NODE_ENV" "staging" "Node.js environment"
    set_vercel_env "NEXT_PUBLIC_APP_ENV" "staging" "Public app environment identifier"
    set_vercel_env "NEXTAUTH_URL" "$STAGING_URL" "NextAuth base URL for staging"
    set_vercel_env "NEXT_PUBLIC_APP_URL" "$STAGING_URL" "Public app URL"
    set_vercel_env "NEXT_PUBLIC_API_URL" "$STAGING_URL/api" "Public API URL"
    set_vercel_env "CORS_ORIGIN" "$STAGING_URL" "CORS allowed origin"
    
    success "Core settings configured"
}

# Configure authentication secrets
configure_auth_secrets() {
    log "Configuring authentication secrets..."
    
    # Generate new secrets for staging
    NEXTAUTH_SECRET=$(generate_secret)
    JWT_SECRET=$(generate_jwt_secret)
    
    set_vercel_env "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET" "NextAuth secret for session signing"
    set_vercel_env "JWT_SECRET" "$JWT_SECRET" "JWT secret for token signing"
    
    success "Authentication secrets configured"
}

# Configure database connections
configure_database() {
    log "Configuring database connections..."
    
    # Note: These will need to be filled with actual Railway database URLs
    warning "Database URLs need to be configured manually with Railway values:"
    log "  Please run: railway variables"
    log "  Then set these environment variables with the Railway values:"
    log "    - DATABASE_URL"
    log "    - POSTGRES_PRISMA_URL"
    log "    - POSTGRES_URL_NON_POOLING"
    log "    - DIRECT_URL"
    
    # For now, we'll create placeholders
    if [[ "$DRY_RUN" == "false" ]]; then
        log "Creating database URL placeholders (to be updated with Railway values)..."
        set_vercel_env "DATABASE_URL" "postgresql://placeholder:placeholder@placeholder:5432/placeholder" "Main database URL (UPDATE WITH RAILWAY)"
        set_vercel_env "POSTGRES_PRISMA_URL" "postgresql://placeholder:placeholder@placeholder:5432/placeholder" "Prisma database URL (UPDATE WITH RAILWAY)"
        set_vercel_env "POSTGRES_URL_NON_POOLING" "postgresql://placeholder:placeholder@placeholder:5432/placeholder" "Non-pooling database URL (UPDATE WITH RAILWAY)"
        set_vercel_env "DIRECT_URL" "postgresql://placeholder:placeholder@placeholder:5432/placeholder" "Direct database URL (UPDATE WITH RAILWAY)"
    fi
    
    success "Database configuration prepared (requires Railway values)"
}

# Configure OAuth settings
configure_oauth() {
    log "Configuring OAuth settings..."
    
    warning "OAuth settings need manual configuration:"
    log "  1. Google OAuth Console: https://console.developers.google.com/"
    log "  2. Add authorized redirect URI: $STAGING_URL/api/auth/callback/google"
    log "  3. Copy Client ID and Secret to these environment variables:"
    log "     - GOOGLE_CLIENT_ID"
    log "     - GOOGLE_CLIENT_SECRET"
    
    # Create placeholders
    if [[ "$DRY_RUN" == "false" ]]; then
        set_vercel_env "GOOGLE_CLIENT_ID" "PLACEHOLDER_GOOGLE_CLIENT_ID" "Google OAuth Client ID (UPDATE WITH REAL VALUE)"
        set_vercel_env "GOOGLE_CLIENT_SECRET" "PLACEHOLDER_GOOGLE_CLIENT_SECRET" "Google OAuth Client Secret (UPDATE WITH REAL VALUE)"
    fi
    
    success "OAuth configuration prepared"
}

# Configure payment processing (test mode)
configure_payments() {
    log "Configuring payment processing (test mode)..."
    
    set_vercel_env "STRIPE_SECRET_KEY" "sk_test_PLACEHOLDER_STRIPE_SECRET_KEY" "Stripe test secret key"
    set_vercel_env "STRIPE_PUBLISHABLE_KEY" "pk_test_PLACEHOLDER_STRIPE_PUBLISHABLE_KEY" "Stripe test publishable key"
    set_vercel_env "STRIPE_WEBHOOK_SECRET" "whsec_PLACEHOLDER_STRIPE_WEBHOOK_SECRET" "Stripe test webhook secret"
    set_vercel_env "DISABLE_PAYMENT_PROCESSING" "true" "Disable payment processing in staging"
    
    success "Payment processing configured for test mode"
}

# Configure Redis cache
configure_redis() {
    log "Configuring Redis cache..."
    
    warning "Redis URL needs to be configured with actual Redis instance:"
    log "  Please set up a staging Redis instance and update REDIS_URL"
    
    set_vercel_env "REDIS_URL" "redis://placeholder:6379" "Redis URL (UPDATE WITH REAL VALUE)"
    
    success "Redis configuration prepared"
}

# Configure email settings
configure_email() {
    log "Configuring email settings..."
    
    set_vercel_env "EMAIL_FROM" "staging@zenith.engineer" "From email address for staging"
    set_vercel_env "RESEND_API_KEY" "PLACEHOLDER_RESEND_API_KEY" "Resend API key (UPDATE WITH REAL VALUE)"
    
    success "Email settings configured"
}

# Configure AI API keys
configure_ai_apis() {
    log "Configuring AI API keys..."
    
    warning "AI API keys should be copied from production or use test keys:"
    log "  - OPENAI_API_KEY"
    log "  - ANTHROPIC_API_KEY"
    log "  - GOOGLE_AI_API_KEY"
    
    # Create placeholders
    if [[ "$DRY_RUN" == "false" ]]; then
        set_vercel_env "OPENAI_API_KEY" "PLACEHOLDER_OPENAI_API_KEY" "OpenAI API key (UPDATE WITH REAL VALUE)"
        set_vercel_env "ANTHROPIC_API_KEY" "PLACEHOLDER_ANTHROPIC_API_KEY" "Anthropic API key (UPDATE WITH REAL VALUE)"
        set_vercel_env "GOOGLE_AI_API_KEY" "PLACEHOLDER_GOOGLE_AI_API_KEY" "Google AI API key (UPDATE WITH REAL VALUE)"
    fi
    
    success "AI API configuration prepared"
}

# Configure monitoring and analytics
configure_monitoring() {
    log "Configuring monitoring and analytics..."
    
    set_vercel_env "SENTRY_ORG" "zenith-platform" "Sentry organization"
    set_vercel_env "SENTRY_PROJECT" "zenith-staging" "Sentry project for staging"
    set_vercel_env "NEXT_PUBLIC_SENTRY_DSN" "PLACEHOLDER_SENTRY_DSN" "Sentry DSN for staging (UPDATE WITH REAL VALUE)"
    set_vercel_env "NEXT_PUBLIC_GA_MEASUREMENT_ID" "PLACEHOLDER_GA_MEASUREMENT_ID" "Google Analytics measurement ID for staging"
    
    success "Monitoring configuration prepared"
}

# Configure feature flags
configure_feature_flags() {
    log "Configuring feature flags for staging..."
    
    set_vercel_env "FEATURE_FLAGS_ENABLED" "true" "Enable feature flags system"
    set_vercel_env "NEXT_PUBLIC_FEATURE_ENHANCED_ANALYZER" "true" "Enable enhanced analyzer features"
    set_vercel_env "NEXT_PUBLIC_FEATURE_TEAM_MANAGEMENT" "true" "Enable team management features"
    set_vercel_env "NEXT_PUBLIC_FEATURE_AI_CONTENT_ANALYSIS" "false" "Disable AI content analysis in staging"
    set_vercel_env "NEXT_PUBLIC_FEATURE_COMPETITIVE_INTELLIGENCE" "false" "Disable competitive intelligence in staging"
    
    success "Feature flags configured"
}

# Configure staging-specific settings
configure_staging_settings() {
    log "Configuring staging-specific settings..."
    
    set_vercel_env "STAGING_MODE" "true" "Enable staging mode"
    set_vercel_env "MOCK_EXTERNAL_APIS" "false" "Disable API mocking"
    set_vercel_env "FORCE_HTTPS" "true" "Force HTTPS in staging"
    set_vercel_env "SECURE_COOKIES" "true" "Enable secure cookies"
    set_vercel_env "NEXT_TELEMETRY_DISABLED" "1" "Disable Next.js telemetry"
    
    success "Staging-specific settings configured"
}

# Generate configuration summary
generate_summary() {
    log "Generating configuration summary..."
    
    cat > staging-env-summary.md << EOF
# Staging Environment Configuration Summary

**Configuration Date:** $(date)  
**Staging URL:** $STAGING_URL  

## Environment Variables Configured

### Core Application Settings ✅
- NODE_ENV: staging
- NEXT_PUBLIC_APP_ENV: staging
- NEXTAUTH_URL: $STAGING_URL
- NEXT_PUBLIC_APP_URL: $STAGING_URL
- NEXT_PUBLIC_API_URL: $STAGING_URL/api
- CORS_ORIGIN: $STAGING_URL

### Authentication & Security ✅
- NEXTAUTH_SECRET: Generated (32 chars)
- JWT_SECRET: Generated (64 chars)
- FORCE_HTTPS: true
- SECURE_COOKIES: true

### Feature Flags ✅
- FEATURE_FLAGS_ENABLED: true
- NEXT_PUBLIC_FEATURE_ENHANCED_ANALYZER: true
- NEXT_PUBLIC_FEATURE_TEAM_MANAGEMENT: true
- NEXT_PUBLIC_FEATURE_AI_CONTENT_ANALYSIS: false
- NEXT_PUBLIC_FEATURE_COMPETITIVE_INTELLIGENCE: false

### Staging Settings ✅
- STAGING_MODE: true
- DISABLE_PAYMENT_PROCESSING: true
- MOCK_EXTERNAL_APIS: false

## Manual Configuration Required ⚠️

### Database (Railway) 🔄
- DATABASE_URL: Update with Railway PostgreSQL URL
- POSTGRES_PRISMA_URL: Update with Railway URL
- POSTGRES_URL_NON_POOLING: Update with Railway URL
- DIRECT_URL: Update with Railway URL

### OAuth (Google) 🔄
- GOOGLE_CLIENT_ID: Configure in Google Console
- GOOGLE_CLIENT_SECRET: Configure in Google Console
- Redirect URI: $STAGING_URL/api/auth/callback/google

### Payment Processing (Stripe Test) 🔄
- STRIPE_SECRET_KEY: Use Stripe test keys
- STRIPE_PUBLISHABLE_KEY: Use Stripe test keys
- STRIPE_WEBHOOK_SECRET: Configure test webhook

### External Services 🔄
- REDIS_URL: Configure staging Redis instance
- RESEND_API_KEY: Configure email service
- OPENAI_API_KEY: Copy from production or use test key
- ANTHROPIC_API_KEY: Copy from production or use test key
- GOOGLE_AI_API_KEY: Copy from production or use test key

### Monitoring 🔄
- NEXT_PUBLIC_SENTRY_DSN: Create staging Sentry project
- NEXT_PUBLIC_GA_MEASUREMENT_ID: Create staging GA property

## Next Steps

1. **Database**: Configure Railway database URLs
2. **OAuth**: Set up Google OAuth redirect URIs
3. **External Services**: Update API keys and service URLs
4. **Testing**: Verify all environment variables work correctly
5. **Documentation**: Update team documentation with staging URLs

## Verification Commands

\`\`\`bash
# View all staging environment variables
vercel env ls

# Test staging deployment
./scripts/staging/deploy-staging.sh --quick

# Verify database connection
node scripts/staging/verify-database.js
\`\`\`

---

*Generated by Zenith Platform Staging Environment Setup*
EOF
    
    success "Configuration summary generated: staging-env-summary.md"
}

# Main setup function
main() {
    log "Starting Zenith Platform staging environment setup..."
    log "Configuration: Dry Run=$DRY_RUN, Update Only=$UPDATE_ONLY"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        warning "Running in DRY RUN mode - no changes will be made"
    fi
    
    # Run setup steps
    check_prerequisites
    configure_core_settings
    configure_auth_secrets
    configure_database
    configure_oauth
    configure_payments
    configure_redis
    configure_email
    configure_ai_apis
    configure_monitoring
    configure_feature_flags
    configure_staging_settings
    generate_summary
    
    success "🚀 Staging environment setup completed!"
    success "📊 Configuration summary: staging-env-summary.md"
    
    log "Next steps:"
    log "  1. Review staging-env-summary.md for manual configuration items"
    log "  2. Configure Railway database URLs"
    log "  3. Set up Google OAuth redirect URIs"
    log "  4. Update external service API keys"
    log "  5. Test staging deployment: ./scripts/staging/deploy-staging.sh"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        warning "Some environment variables contain placeholders that need manual updates"
        log "Run 'vercel env ls' to see all configured variables"
    fi
}

# Run main function
main "$@"