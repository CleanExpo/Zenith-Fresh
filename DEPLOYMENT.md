# Deployment Guide

This guide outlines the steps to deploy the Zenith application to production.

## Prerequisites

- Node.js 18 or later
- npm or yarn
- A PostgreSQL database
- Redis instance
- Sentry account
- Vercel account (recommended for deployment)

## Environment Setup

1. Create a `.env.production` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"
POSTGRES_PRISMA_URL="postgresql://user:password@host:port/database?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"

# Authentication
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-nextauth-secret"
JWT_SECRET="your-jwt-secret"

# API Keys
ANTHROPIC_API_KEY="your-anthropic-api-key"
OPENAI_API_KEY="your-openai-api-key"
GOOGLE_AI_API_KEY="your-google-ai-api-key"

# Redis
REDIS_URL="redis://user:password@host:port"

# Email
RESEND_API_KEY="your-resend-api-key"

# Supabase
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# App Configuration
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_APP_NAME="Zenith Platform"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_API_URL="https://your-api-domain.com"
NODE_ENV="production"

# Monitoring
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
```

## Deployment Steps

1. **Database Setup**
   ```bash
   # Run migrations
   npm run prisma:migrate
   
   # Generate Prisma client
   npm run prisma:generate
   ```

2. **Build the Application**
   ```bash
   # Install dependencies
   npm install
   
   # Build the application
   npm run build
   ```

3. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Configure environment variables in Vercel dashboard
   - Deploy the application

4. **Post-Deployment Checks**
   - Verify database connections
   - Check Redis connectivity
   - Test authentication flow
   - Monitor error tracking
   - Verify API endpoints

## Monitoring

1. **Sentry Setup**
   - Configure error tracking
   - Set up performance monitoring
   - Create alerts for critical errors

2. **Performance Monitoring**
   - Monitor API response times
   - Track database query performance
   - Monitor Redis cache hit rates

3. **Logging**
   - Set up application logging
   - Configure log aggregation
   - Set up log retention policies

## Maintenance

1. **Regular Updates**
   ```bash
   # Update dependencies
   npm update
   
   # Run tests
   npm test
   
   # Check for security vulnerabilities
   npm audit
   ```

2. **Database Maintenance**
   ```bash
   # Backup database
   npm run db:backup
   
   # Run database maintenance
   npm run db:maintenance
   ```

3. **Monitoring Checks**
   - Review error rates
   - Check performance metrics
   - Monitor resource usage

## Troubleshooting

1. **Common Issues**
   - Database connection issues
   - Redis connectivity problems
   - Authentication errors
   - API endpoint failures

2. **Debugging Steps**
   - Check application logs
   - Review Sentry error reports
   - Verify environment variables
   - Test database connectivity

## Security

1. **Regular Security Checks**
   - Update dependencies
   - Review access controls
   - Check for security vulnerabilities
   - Monitor for suspicious activity

2. **Backup Strategy**
   - Regular database backups
   - Configuration backups
   - Disaster recovery plan

## Support

For support, contact:
- Technical Support: support@zenith.com
- Emergency Contact: emergency@zenith.com
- Documentation: docs.zenith.com 