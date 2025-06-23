# Environment Variables Documentation

This document outlines all environment variables used in the application, their purposes, and requirements.

## Required Variables

### Core Functionality
- `DATABASE_URL` - Database connection string (used by Prisma)
- `NEXTAUTH_SECRET` - Secret key for NextAuth.js JWT tokens
- `NEXTAUTH_URL` - The URL of the app for NextAuth callbacks
- `JWT_SECRET` - Secret key for custom JWT tokens
- `NEXT_PUBLIC_APP_URL` - Public URL of the application

### Authentication
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (required for Google authentication)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (required for Google authentication)

### Email Configuration
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port
- `SMTP_SECURE` - Whether to use secure connection ("true"/"false")
- `SMTP_USER` - SMTP authentication username
- `SMTP_PASS` - SMTP authentication password
- `SMTP_FROM` - Default "from" email address

### Payment Processing
- `STRIPE_SECRET_KEY` - Stripe secret key for payment processing
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key for client-side integration
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret for verifying webhooks

### WebSocket
- `CORS_ORIGIN` - Allowed CORS origin for WebSocket connections

## Optional Variables

### Caching
- `REDIS_URL` - Redis connection URL for caching (app works without it)

### Monitoring
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN for error tracking
- `NODE_ENV` - Node environment ("development", "production", etc.)
  - Affects Prisma logging
  - Controls Sentry error tracking
  - Determines development features

### API Configuration
- `NEXT_PUBLIC_API_URL` - API base URL (defaults to empty string)

## Testing Variables

### E2E Testing
- `TEST_USER_EMAIL` - Test user email for E2E tests
- `TEST_USER_PASSWORD` - Test user password for E2E tests

## Example .env File

```env
# Core
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Authentication
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-smtp-username"
SMTP_PASS="your-smtp-password"
SMTP_FROM="noreply@example.com"

# Payment
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# WebSocket
CORS_ORIGIN="http://localhost:3000"

# Optional
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_API_URL=""
NODE_ENV="development"

# Testing
TEST_USER_EMAIL="test@example.com"
TEST_USER_PASSWORD="test-password"
```

## Notes

1. All required variables must be set for the application to function properly
2. Optional variables have defaults or the application will gracefully degrade functionality
3. Testing variables are only required when running tests
4. Never commit the actual `.env` file to version control
5. Keep a `.env.example` file in version control with dummy values
6. `NODE_ENV` affects multiple features:
   - Prisma logging (query, error, warn in development)
   - Sentry error tracking (enabled in production)
   - Development features and debugging
7. `NEXT_PUBLIC_APP_URL` is used for:
   - CORS configuration
   - WebSocket connections
   - Email links
   - API documentation 