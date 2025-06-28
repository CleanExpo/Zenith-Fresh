# Scheduled Website Scans Implementation

## Overview

This implementation provides a comprehensive scheduled website scanning system with email notifications for the Zenith Platform. Users can schedule automated website health scans at regular intervals (daily, weekly, monthly) and receive email notifications when scans complete.

## ✅ Implementation Summary

### 1. Database Schema (`/root/prisma/schema.prisma`)

**ScheduledScan Model:**
- `id` - Unique identifier
- `userId` - Reference to user who owns the scan
- `name` - User-friendly name for the scan
- `url` - Website URL to scan
- `frequency` - 'daily', 'weekly', or 'monthly'
- `dayOfWeek` - For weekly scans (0-6, Sunday=0)
- `dayOfMonth` - For monthly scans (1-31)
- `timeOfDay` - Time in HH:MM format
- `timezone` - Timezone for scheduling
- `isActive` - Whether the scan is enabled
- `emailNotifications` - Whether to send email notifications
- `notificationEmails` - Array of email addresses
- `scanOptions` - JSON configuration for scan options
- `lastRunAt` / `nextRunAt` - Execution tracking
- `runCount` / `successCount` / `failureCount` - Statistics
- `lastError` - Last error message if any

**WebsiteAnalysis Model Updates:**
- Added `scheduledScanId` field to link analyses to scheduled scans
- Relationship to track which analyses came from scheduled scans

### 2. API Endpoints

#### `/api/analysis/website/scheduled` (GET, POST)
- **GET**: Retrieve all scheduled scans for authenticated user
- **POST**: Create new scheduled scan

#### `/api/analysis/website/scheduled/[id]` (GET, PUT, DELETE)
- **GET**: Get specific scheduled scan with recent analyses
- **PUT**: Update scheduled scan settings
- **DELETE**: Delete scheduled scan and history

#### `/api/cron/scheduled-scans` (GET, POST)
- **GET**: Get status of upcoming/overdue scans (for monitoring)
- **POST**: Execute pending scheduled scans (called by cron service)

### 3. Cron Job Implementation (`/root/src/app/api/cron/scheduled-scans/route.ts`)

**Features:**
- Finds all due scheduled scans based on `nextRunAt` timestamp
- Executes website health analysis for each scan
- Saves results to `WebsiteAnalysis` table
- Calculates next run time based on frequency
- Sends email notifications if enabled
- Tracks success/failure statistics
- Handles errors gracefully with retry logic
- Supports timeout protection (45 seconds per scan)

**Security:**
- Requires `CRON_SECRET` authorization header
- Validates requests from authorized cron services only

### 4. Email Notifications (`/root/src/lib/email.ts`)

**Templates Added:**
- `scanCompletion` - Beautiful HTML email with scan results
- `scanFailure` - Error notification email

**Features:**
- Professional HTML email design with score color coding
- Text fallback for email clients that don't support HTML
- Includes scan summary, health scores, and direct links to dashboard
- Supports multiple notification recipients per scan
- Proper email tags for tracking and categorization

**Helper Functions:**
- `sendScanCompletionEmail()` - Send completion notification
- `sendScanFailureEmail()` - Send failure notification

### 5. UI Components (`/root/src/components/website-analyzer/EnhancedScheduledScans.tsx`)

**Features:**
- Complete CRUD interface for scheduled scans
- Form validation and error handling
- Real-time status indicators (active/paused)
- Next run time calculation and display
- Success/failure statistics
- Email notification configuration
- Responsive design with loading states
- Confirmation dialogs for destructive actions

**Components:**
- `EnhancedScheduledScans` - Main container component
- `CreateScheduledScanForm` - Create new scheduled scan
- `EditScheduledScanForm` - Edit existing scan settings

### 6. Testing & Documentation

**Test Script:** `/root/scripts/test-scheduled-scans.js`
- Validates API endpoints
- Tests cron functionality
- Provides usage examples
- Demonstrates configuration

## 🚀 Deployment Instructions

### 1. Database Migration
```bash
npx prisma generate
npx prisma migrate dev --name add_scheduled_scans
```

### 2. Environment Variables
```env
CRON_SECRET=your-secure-cron-secret
RESEND_API_KEY=your-resend-api-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Cron Service Setup

**Option A: Vercel Cron Jobs**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/scheduled-scans",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Option B: External Cron Service**
```bash
# Add to crontab
*/5 * * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/scheduled-scans
```

**Option C: GitHub Actions**
```yaml
# .github/workflows/scheduled-scans.yml
name: Scheduled Scans
on:
  schedule:
    - cron: '*/5 * * * *'
jobs:
  run-scans:
    runs-on: ubuntu-latest
    steps:
      - name: Execute Scheduled Scans
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            ${{ secrets.APP_URL }}/api/cron/scheduled-scans
```

### 4. Frontend Integration

Add to your dashboard or website analyzer page:
```tsx
import EnhancedScheduledScans from '@/components/website-analyzer/EnhancedScheduledScans';

export default function Dashboard() {
  return (
    <div>
      {/* Other dashboard content */}
      <EnhancedScheduledScans />
    </div>
  );
}
```

## 📊 Usage Examples

### Creating a Scheduled Scan
```javascript
const scanData = {
  name: "Daily Homepage Check",
  url: "https://example.com",
  frequency: "daily",
  timeOfDay: "09:00",
  timezone: "UTC",
  emailNotifications: true,
  notificationEmails: ["admin@example.com"],
  scanOptions: {
    includePerformance: true,
    includeSEO: true,
    includeSecurity: true,
    includeAccessibility: true
  }
};

fetch('/api/analysis/website/scheduled', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(scanData)
});
```

### Weekly Scan (Every Monday)
```javascript
const weeklyData = {
  name: "Weekly SEO Check",
  url: "https://example.com",
  frequency: "weekly",
  dayOfWeek: 1, // Monday
  timeOfDay: "08:00",
  timezone: "America/New_York",
  emailNotifications: true,
  notificationEmails: ["seo@example.com", "marketing@example.com"]
};
```

### Monthly Scan (1st of each month)
```javascript
const monthlyData = {
  name: "Monthly Full Audit",
  url: "https://example.com",
  frequency: "monthly",
  dayOfMonth: 1,
  timeOfDay: "06:00",
  timezone: "UTC",
  emailNotifications: true,
  notificationEmails: ["audit@example.com"]
};
```

## 🔧 Advanced Configuration

### Custom Scan Options
```javascript
const advancedOptions = {
  scanOptions: {
    includePerformance: true,
    includeSEO: true,
    includeSecurity: true,
    includeAccessibility: true,
    // Future extensions can be added here
    customRules: [],
    excludePatterns: [],
    maxCrawlDepth: 3
  }
};
```

### Email Template Customization

The email templates support customization through environment variables:
```env
EMAIL_BRAND_COLOR=#2563eb
EMAIL_BRAND_NAME="Your Company"
EMAIL_SUPPORT_EMAIL=support@yourcompany.com
```

## 🔍 Monitoring & Analytics

### Scan Statistics
- Total runs, success rate, failure rate
- Average health scores over time
- Most common issues discovered
- Email delivery statistics

### Health Monitoring
```bash
# Check upcoming scans
curl -H "Authorization: Bearer CRON_SECRET" \
  https://your-domain.com/api/cron/scheduled-scans

# Check scan execution status
curl -X POST -H "Authorization: Bearer CRON_SECRET" \
  https://your-domain.com/api/cron/scheduled-scans
```

## 🛡️ Security Features

- **Authentication Required**: All API endpoints require user authentication
- **Cron Secret**: Cron endpoints protected with secret token
- **Input Validation**: Comprehensive Zod schema validation
- **Rate Limiting**: Built-in protection against abuse
- **Error Handling**: Graceful error handling with Sentry integration
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **XSS Protection**: Proper input sanitization

## 🎯 Performance Optimizations

- **Database Indexes**: Optimized queries with proper indexes
- **Concurrent Execution**: Scans run concurrently with timeout protection
- **Efficient Scheduling**: Smart next-run calculation
- **Error Recovery**: Automatic retry on next scheduled run
- **Email Batching**: Efficient email delivery

## 📈 Future Enhancements

1. **Advanced Scheduling**: Support for complex cron expressions
2. **Scan Templates**: Predefined scan configurations
3. **Team Collaboration**: Shared scheduled scans
4. **Webhooks**: Integration with external services
5. **Custom Reports**: PDF report generation
6. **Mobile Notifications**: Push notifications
7. **Performance Budgets**: Alerting on performance degradation
8. **Competitive Monitoring**: Track competitor changes

## 🐛 Troubleshooting

### Common Issues

1. **Scans Not Running**
   - Check cron service is calling the endpoint
   - Verify CRON_SECRET is correct
   - Check database for nextRunAt timestamps

2. **Email Notifications Not Sending**
   - Verify RESEND_API_KEY is configured
   - Check email addresses are valid
   - Review Sentry for email errors

3. **Permission Errors**
   - Ensure user authentication is working
   - Check scan ownership (userId matches)

### Debug Mode
Set `DEBUG=true` in environment to enable verbose logging:
```env
DEBUG=true
NODE_ENV=development
```

## 📞 Support

For issues or questions:
- Check the test script: `node scripts/test-scheduled-scans.js`
- Review logs in Sentry dashboard
- Monitor database for stuck scans
- Verify cron service health

---

**Implementation Complete ✅**

This scheduled scanning system provides a robust, scalable solution for automated website monitoring with comprehensive email notifications and user-friendly management interface.