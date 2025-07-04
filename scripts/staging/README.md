# Railway Staging Database Scripts

This directory contains all scripts and configuration files for the Railway PostgreSQL staging database setup.

## 📁 Files Overview

### Configuration Files
- **`/root/.env.staging`** - Environment variables for staging
- **`/root/vercel.staging.json`** - Vercel staging configuration with Railway database variables
- **`/root/railway.toml`** - Railway service configuration
- **`/root/railway.json`** - Railway project configuration (JSON format)

### Setup Scripts
- **`setup-database.sh`** - Complete database setup automation
- **`test-connection.sql`** - Database connection and permissions test
- **`create-indexes.sql`** - Performance indexes for optimal queries
- **`seed-staging-data.js`** - Test data seeding for staging environment
- **`verify-database.js`** - Database setup and integrity verification

### Maintenance Scripts
- **`backup-database.sh`** - Create database backups with compression
- **`restore-database.sh`** - Restore database from backup files
- **`health-check.js`** - Comprehensive database health monitoring

### Documentation
- **`RAILWAY_SETUP_GUIDE.md`** - Complete Railway setup documentation
- **`README.md`** - This file

## 🚀 Quick Start

### 1. Initial Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and setup project
railway login
railway new  # Select "Empty Project", name "zenith-staging"
cd /path/to/zenith-platform
railway link

# Add PostgreSQL database
railway add postgresql
```

### 2. Configure Environment
```bash
# Set staging environment variables
railway variables set NODE_ENV=staging
railway variables set RAILWAY_ENVIRONMENT=staging
railway variables set DATABASE_POOL_MIN=2
railway variables set DATABASE_POOL_MAX=10
```

### 3. Setup Database
```bash
# Run complete database setup
railway run bash scripts/staging/setup-database.sh
```

### 4. Verify Setup
```bash
# Verify database configuration
railway run node scripts/staging/verify-database.js

# Run health check
railway run node scripts/staging/health-check.js
```

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Run comprehensive health check
node scripts/staging/health-check.js

# View Railway logs
railway logs

# Check service status
railway status
```

### Backup Operations
```bash
# Create backup
bash scripts/staging/backup-database.sh

# Restore from backup
bash scripts/staging/restore-database.sh /path/to/backup.sql.gz
```

### Database Management
```bash
# Seed test data
node scripts/staging/seed-staging-data.js

# Create performance indexes
npx prisma db execute --file=scripts/staging/create-indexes.sql

# Test database connection
railway run psql $DATABASE_URL -c "SELECT 1;"
```

## 🔧 Configuration Details

### Environment Variables
The staging environment uses the following key variables:
- `DATABASE_URL` - Main Railway database connection
- `POSTGRES_PRISMA_URL` - Pooled connection for Prisma
- `DATABASE_POOL_MIN/MAX` - Connection pool settings
- `BACKUP_ENABLED` - Enable automated backups
- `HEALTH_CHECK_ENABLED` - Enable health monitoring

### Railway Features Used
- **PostgreSQL Database** - Managed PostgreSQL with SSL
- **Automatic Backups** - Daily backups with retention (Pro plan)
- **Connection Pooling** - Built-in pgBouncer support
- **SSL Encryption** - Enabled by default
- **Monitoring** - Real-time metrics and logging

## 🔒 Security Features

### Database Security
- SSL/TLS encryption enabled by default
- Private networking within Railway
- Environment-specific access controls
- Encrypted environment variables

### Backup Security
- Compressed backups with gzip
- Optional cloud storage integration
- Audit logging for all backup operations
- Point-in-time recovery (Pro plan)

## 📈 Performance Optimization

### Connection Pooling
```bash
# Railway provides built-in connection pooling
DATABASE_URL="postgresql://user:pass@host:port/db?pgbouncer=true&connect_timeout=15"
```

### Database Indexes
Performance indexes are automatically created for:
- User lookups (email, role)
- Project relationships
- Analytics queries
- Team management
- Audit logs

### Query Optimization
- Slow query monitoring
- Index usage tracking
- Connection pool monitoring
- Performance metrics collection

## 🚨 Troubleshooting

### Common Issues

#### Connection Problems
```bash
# Check Railway service status
railway status

# Verify environment variables
railway variables

# Test direct connection
railway run psql $DATABASE_URL -c "SELECT 1;"
```

#### Migration Issues
```bash
# Reset staging database (CAREFUL!)
railway run npx prisma migrate reset --force

# Re-run setup
railway run bash scripts/staging/setup-database.sh
```

#### Performance Issues
```bash
# Run health check
node scripts/staging/health-check.js

# Check slow queries
railway run psql $DATABASE_URL -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

## 📞 Support

### Documentation
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Setup Guide**: `RAILWAY_SETUP_GUIDE.md`
- **Project Docs**: `/root/CLAUDE.md`

### Getting Help
1. Check Railway dashboard for service status
2. Review logs with `railway logs`
3. Run health check for detailed diagnostics
4. Consult setup guide for step-by-step instructions

## 🎯 Next Steps

After completing Railway setup:
1. ✅ Deploy application to Vercel staging
2. ✅ Configure Vercel environment variables  
3. ✅ Test end-to-end functionality
4. ✅ Set up monitoring and alerts
5. ✅ Schedule regular backups
6. ✅ Plan production migration

---

## 📊 Railway Dashboard Access

- **Project**: `https://railway.app/project/{project-id}`
- **Database Service**: `https://railway.app/project/{project-id}/service/{service-id}`
- **Metrics**: `https://railway.app/project/{project-id}/service/{service-id}/metrics`
- **Logs**: `https://railway.app/project/{project-id}/service/{service-id}/logs`

**The Railway staging database provides a robust, scalable foundation for Zenith Platform's staging environment with enterprise-grade security, monitoring, and backup capabilities.**