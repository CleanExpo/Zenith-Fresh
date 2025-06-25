# Railway Staging Database Setup Guide

This guide provides step-by-step instructions for setting up a PostgreSQL database on Railway for the Zenith platform staging environment.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Railway Project Setup](#railway-project-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Database Migration](#database-migration)
6. [Verification](#verification)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- Railway CLI installed (`npm install -g @railway/cli`)
- Node.js and npm installed
- Git repository with Zenith platform code

## Railway Project Setup

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

### 3. Create New Project
```bash
railway new
# Select "Empty Project"
# Name: "zenith-staging"
```

### 4. Link Local Repository
```bash
cd /path/to/zenith-platform
railway link
# Select the "zenith-staging" project
```

## Database Configuration

### 1. Add PostgreSQL Database
```bash
railway add postgresql
```

This automatically provisions a PostgreSQL database with:
- SSL enabled by default
- Automatic backups
- Connection pooling support
- High availability

### 2. View Database Information
```bash
railway variables
```

You'll see environment variables like:
- `DATABASE_URL`: Main connection string
- `PGHOST`: Database host
- `PGPORT`: Database port (usually 5432)
- `PGUSER`: Database username
- `PGPASSWORD`: Database password
- `PGDATABASE`: Database name

## Environment Variables

### 1. Set Staging Environment Variables
```bash
# Set environment to staging
railway variables set NODE_ENV=staging
railway variables set RAILWAY_ENVIRONMENT=staging

# Database connection pooling
railway variables set DATABASE_POOL_MIN=2
railway variables set DATABASE_POOL_MAX=10
railway variables set DATABASE_CONNECTION_TIMEOUT=10000
railway variables set DATABASE_IDLE_TIMEOUT=30000
railway variables set DATABASE_SSL_ENABLED=true

# Backup and monitoring
railway variables set BACKUP_ENABLED=true
railway variables set DATABASE_MONITORING_ENABLED=true
railway variables set HEALTH_CHECK_ENABLED=true

# Application settings
railway variables set NEXT_PUBLIC_APP_URL=https://zenith-staging.vercel.app
railway variables set NEXT_PUBLIC_APP_NAME="Zenith Platform (Staging)"
railway variables set CORS_ORIGIN=https://zenith-staging.vercel.app
```

### 2. Set Authentication Variables
```bash
railway variables set NEXTAUTH_URL=https://zenith-staging.vercel.app
railway variables set NEXTAUTH_SECRET="your-staging-nextauth-secret"

# Copy from production or create new OAuth apps
railway variables set GOOGLE_CLIENT_ID="your-google-client-id"
railway variables set GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Set API Keys (Staging/Test)
```bash
# Use staging/test API keys
railway variables set OPENAI_API_KEY="your-staging-openai-key"
railway variables set ANTHROPIC_API_KEY="your-staging-anthropic-key"
railway variables set RESEND_API_KEY="your-staging-resend-key"
railway variables set STRIPE_SECRET_KEY="sk_test_your-staging-stripe-key"
```

## Database Migration

### 1. Setup Database Schema
```bash
# Run the database setup script
railway run bash scripts/staging/setup-database.sh
```

This script will:
- Install dependencies
- Generate Prisma client
- Run database migrations
- Create performance indexes
- Seed staging data
- Verify setup

### 2. Manual Migration (if needed)
```bash
# Generate Prisma client
railway run npx prisma generate

# Deploy migrations
railway run npx prisma migrate deploy

# Seed data
railway run node scripts/staging/seed-staging-data.js
```

### 3. Create Performance Indexes
```bash
railway run npx prisma db execute --file=./scripts/staging/create-indexes.sql
```

## Verification

### 1. Test Database Connection
```bash
railway run node scripts/staging/verify-database.js
```

### 2. Check Health Status
```bash
railway run node scripts/staging/health-check.js
```

### 3. View Database in Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Select your "zenith-staging" project
3. Click on the PostgreSQL service
4. Use the "Data" tab to browse tables

## Monitoring & Maintenance

### 1. Daily Health Checks
Set up a cron job or schedule to run:
```bash
railway run node scripts/staging/health-check.js
```

### 2. Database Backups
Manual backup:
```bash
railway run bash scripts/staging/backup-database.sh
```

Automated backups (Railway Pro):
- Railway automatically creates daily backups
- Backups are retained for 7 days (Pro plan)
- Point-in-time recovery available

### 3. Monitoring Metrics
Railway provides built-in monitoring:
- CPU usage
- Memory usage
- Network I/O
- Database connections
- Query performance

Access monitoring at:
```
https://railway.app/project/{project-id}/service/{service-id}/metrics
```

### 4. Logs and Debugging
View real-time logs:
```bash
railway logs
```

Or in the Railway dashboard under the "Logs" tab.

## Integration with Vercel

### 1. Connect Railway Database to Vercel
1. In Vercel dashboard, go to your staging project
2. Navigate to Settings > Environment Variables
3. Add Railway database variables:

```
DATABASE_URL = @railway-database-url
POSTGRES_PRISMA_URL = @railway-database-url-pooled
POSTGRES_URL_NON_POOLING = @railway-database-url-direct
DIRECT_URL = @railway-database-url-direct
```

### 2. Configure Vercel Environment Variables
Use the values from Railway:
```bash
# Get Railway database URL
railway variables | grep DATABASE_URL

# Set in Vercel (or use Vercel CLI)
vercel env add DATABASE_URL staging
# Paste the Railway DATABASE_URL value
```

## Security Best Practices

### 1. Database Access
- Railway databases are private by default
- SSL is enabled automatically
- Use connection pooling for better performance

### 2. Environment Isolation
- Keep staging and production environments separate
- Use different API keys for staging
- Implement proper CORS configuration

### 3. Access Control
- Limit Railway project access to necessary team members
- Use Railway's team features for access management
- Rotate database credentials periodically

## Performance Optimization

### 1. Connection Pooling
Railway supports connection pooling out of the box:
```bash
# Use pooled connection URL
DATABASE_URL="postgresql://user:pass@host:port/db?pgbouncer=true&connect_timeout=15"
```

### 2. Database Indexes
The setup script automatically creates performance indexes. Monitor index usage:
```sql
SELECT * FROM pg_stat_user_indexes ORDER BY idx_scan DESC;
```

### 3. Query Optimization
- Enable pg_stat_statements for query analysis
- Monitor slow queries in Railway dashboard
- Use EXPLAIN ANALYZE for query optimization

## Backup and Recovery

### 1. Automated Backups (Railway Pro)
Railway Pro includes:
- Daily automated backups
- 7-day retention
- Point-in-time recovery
- Cross-region backup storage

### 2. Manual Backups
```bash
# Create backup
railway run bash scripts/staging/backup-database.sh

# Restore from backup
railway run bash scripts/staging/restore-database.sh /path/to/backup.sql.gz
```

### 3. Disaster Recovery
1. Export database schema and data
2. Store backups in external storage (Google Cloud Storage)
3. Document recovery procedures
4. Test recovery process regularly

## Cost Management

### 1. Resource Monitoring
- Monitor database CPU and memory usage
- Optimize queries to reduce resource consumption
- Use appropriate database size for staging workload

### 2. Railway Pricing Tiers
- **Hobby Plan**: $5/month, suitable for staging
- **Pro Plan**: $20/month, includes automated backups
- **Team Plan**: $100/month, for team collaboration

### 3. Cost Optimization
- Use smaller instance size for staging
- Clean up old data regularly
- Monitor connection pool usage

## Troubleshooting

### Common Issues

#### Connection Refused
```bash
# Check Railway service status
railway status

# Verify environment variables
railway variables

# Test connection
railway run psql $DATABASE_URL -c "SELECT 1;"
```

#### Migration Failures
```bash
# Reset migrations (staging only!)
railway run npx prisma migrate reset --force

# Re-run setup
railway run bash scripts/staging/setup-database.sh
```

#### Performance Issues
```bash
# Run health check
railway run node scripts/staging/health-check.js

# Check slow queries
railway run psql $DATABASE_URL -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

#### SSL Certificate Issues
```bash
# Verify SSL configuration
railway run psql $DATABASE_URL -c "SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid();"
```

### Getting Help

1. **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
2. **Railway Discord**: Community support
3. **Railway Support**: For paid plans
4. **Zenith Platform Issues**: Check project documentation

## Next Steps

After completing the Railway setup:

1. ✅ Deploy application to Vercel staging
2. ✅ Configure Vercel environment variables
3. ✅ Test end-to-end functionality
4. ✅ Set up monitoring and alerts
5. ✅ Document access credentials
6. ✅ Schedule regular backups
7. ✅ Plan production migration

## Railway Dashboard URLs

- **Project Dashboard**: `https://railway.app/project/{project-id}`
- **Database Service**: `https://railway.app/project/{project-id}/service/{service-id}`
- **Metrics**: `https://railway.app/project/{project-id}/service/{service-id}/metrics`
- **Logs**: `https://railway.app/project/{project-id}/service/{service-id}/logs`
- **Settings**: `https://railway.app/project/{project-id}/service/{service-id}/settings`

---

## Summary

Railway provides an excellent PostgreSQL hosting solution for staging environments with:

- ✅ **Easy Setup**: One-command database provisioning
- ✅ **SSL by Default**: Secure connections out of the box
- ✅ **Automatic Backups**: Built-in backup and recovery (Pro plan)
- ✅ **Monitoring**: Real-time metrics and logging
- ✅ **Scalability**: Easy resource scaling as needed
- ✅ **Team Collaboration**: Built-in access control
- ✅ **Cost Effective**: Competitive pricing for staging workloads

The Zenith platform staging database is now ready for development and testing workflows!