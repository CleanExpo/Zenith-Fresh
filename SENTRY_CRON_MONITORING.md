# Sentry Cron Monitoring Implementation

## ✅ IMPLEMENTATION COMPLETED

### 1. **Cron Monitoring Library**
Created `src/lib/cron-monitoring.ts` with:
- ✅ `CronMonitor` class for tracking cron job execution
- ✅ Pre-configured monitors for common tasks
- ✅ Automatic error handling and reporting
- ✅ Success/failure tracking with Sentry integration

### 2. **Cron Job API Endpoints**
Created monitoring-enabled cron jobs:

#### **Health Check** (`/api/cron/health-check`)
- **Schedule**: Every minute (`* * * * *`)
- **Purpose**: Monitor database, Redis, and external API connectivity
- **Timeout**: 1 minute
- **Sentry Monitor**: `health-check`

#### **Database Cleanup** (`/api/cron/database-cleanup`)
- **Schedule**: Daily at 2 AM (`0 2 * * *`)
- **Purpose**: Clean expired sessions, old logs, orphaned tokens
- **Timeout**: 5 minutes
- **Sentry Monitor**: `database-cleanup`

#### **Email Queue Processing** (`/api/cron/email-queue`)
- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Purpose**: Process pending emails with retry logic
- **Timeout**: 3 minutes
- **Sentry Monitor**: `email-queue-processor`

### 3. **Vercel Cron Configuration**
Updated `vercel.json` with:
- ✅ Cron job schedules
- ✅ Extended timeouts for cron functions (300s)
- ✅ Automatic execution by Vercel

### 4. **Security & Authentication**
- ✅ Added `CRON_SECRET` environment variable
- ✅ Bearer token authentication for cron endpoints
- ✅ Protection against unauthorized execution

## 🎯 PRE-CONFIGURED CRON MONITORS

```typescript
// Available monitors in CronMonitors object:
CronMonitors.healthCheck        // Every minute
CronMonitors.emailQueue         // Every 5 minutes  
CronMonitors.analyticsAggregation // Every hour
CronMonitors.databaseCleanup    // Daily at 2 AM
CronMonitors.backupCreation     // Daily at 3 AM
CronMonitors.userCleanup        // Weekly on Sunday
```

## 📋 USAGE EXAMPLES

### Basic Usage
```typescript
import { CronMonitors } from '@/lib/cron-monitoring';

// Simple monitoring
await CronMonitors.healthCheck.monitor(async () => {
  // Your cron job logic here
  console.log('Performing health check...');
});
```

### Advanced Usage
```typescript
import { createCronMonitor } from '@/lib/cron-monitoring';

// Custom cron monitor
const customMonitor = createCronMonitor({
  monitorSlug: 'my-custom-job',
  schedule: {
    type: 'crontab',
    value: '0 */6 * * *', // Every 6 hours
  },
  checkinMargin: 5,
  maxRuntime: 30,
  timezone: 'America/Los_Angeles',
});

await customMonitor.monitor(async () => {
  // Your custom job logic
});
```

### Manual Control
```typescript
const monitor = CronMonitors.databaseCleanup;

// Start monitoring
const checkInId = monitor.start();

try {
  // Your job logic
  await performDatabaseCleanup();
  
  // Mark as successful
  if (checkInId) {
    monitor.success(checkInId);
  }
} catch (error) {
  // Mark as failed
  if (checkInId) {
    monitor.failure(checkInId, error);
  }
  throw error;
}
```

## 🔧 ENVIRONMENT VARIABLES

Add to your Vercel environment variables:

```env
# Required for cron job authentication
CRON_SECRET=zenith-cron-secret-key-2024

# Required for Sentry monitoring (replace with real DSN)
NEXT_PUBLIC_SENTRY_DSN=https://your-real-dsn@sentry.io/project-id
SENTRY_ORG=zenith-9l1
SENTRY_PROJECT=javascript-nextjs
```

## 📊 SENTRY DASHBOARD FEATURES

Once deployed, you'll see in Sentry:
- ✅ **Cron Job Status** - Success/failure rates
- ✅ **Performance Metrics** - Execution times
- ✅ **Alert System** - Notifications for failures
- ✅ **Historical Data** - Trend analysis
- ✅ **Error Tracking** - Detailed failure logs

## 🚀 DEPLOYMENT STEPS

### 1. Update Environment Variables
```bash
# In Vercel Dashboard, add:
CRON_SECRET=zenith-cron-secret-key-2024
```

### 2. Deploy to Vercel
```bash
vercel --prod
```

### 3. Verify Cron Jobs
Check Vercel Dashboard > Functions > Crons to see:
- Health check running every minute
- Email queue processing every 5 minutes
- Database cleanup scheduled for 2 AM daily

### 4. Monitor in Sentry
- Go to Sentry Dashboard
- Navigate to Crons section
- View monitor status and performance

## ⚙️ CRON JOB SCHEDULES

| Job | Schedule | Frequency | Purpose |
|-----|----------|-----------|---------|
| Health Check | `* * * * *` | Every minute | System health monitoring |
| Email Queue | `*/5 * * * *` | Every 5 minutes | Email processing |
| Database Cleanup | `0 2 * * *` | Daily at 2 AM | Clean old data |
| Analytics | `0 * * * *` | Every hour | Data aggregation |
| Backup | `0 3 * * *` | Daily at 3 AM | Data backup |
| User Cleanup | `0 1 * * 0` | Weekly Sunday 1 AM | User data cleanup |

## 🔍 TESTING LOCALLY

### Test Health Check
```bash
curl -X GET http://localhost:3000/api/cron/health-check \
  -H "Authorization: Bearer zenith-cron-secret-key-2024"
```

### Test Database Cleanup
```bash
curl -X POST http://localhost:3000/api/cron/database-cleanup \
  -H "Authorization: Bearer zenith-cron-secret-key-2024"
```

### Test Email Queue
```bash
curl -X POST http://localhost:3000/api/cron/email-queue \
  -H "Authorization: Bearer zenith-cron-secret-key-2024"
```

## 🚨 MONITORING & ALERTS

### Sentry Alerts Configuration
1. Go to Sentry > Alerts
2. Create alert rules for:
   - Cron job failures
   - Execution time anomalies
   - High error rates

### Recommended Alert Thresholds
- **Health Check**: Alert if fails 3 times in 5 minutes
- **Database Cleanup**: Alert if fails once
- **Email Queue**: Alert if fails 5 times in 1 hour

## 🔗 USEFUL LINKS

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Sentry Cron Monitoring](https://docs.sentry.io/product/crons/)
- [Crontab Syntax](https://crontab.guru/)

Your cron monitoring system is now fully configured and ready for production deployment! 🎉