# Website Health Analyzer - Comprehensive Monitoring System

A production-ready website monitoring and notification system with automated scanning, real-time alerts, and multi-channel notifications.

## 🚀 Features

### Core Functionality
- **Real-time Website Scanning**: Comprehensive analysis using Lighthouse and custom metrics
- **Performance Monitoring**: Core Web Vitals, loading times, and optimization recommendations  
- **Accessibility Auditing**: WCAG compliance checking and accessibility scoring
- **SEO Analysis**: Technical SEO auditing and optimization suggestions
- **Security Scanning**: HTTPS validation, mixed content detection, and vulnerability checks

### Automation & Scheduling
- **Scheduled Scans**: Daily, weekly, monthly, or custom cron-based scanning
- **Background Job Processing**: Redis-backed queue system with Bull/BullMQ
- **Intelligent Retry Logic**: Exponential backoff and comprehensive error handling
- **Scalable Architecture**: Horizontal scaling support for high-volume scanning

### Notifications & Alerts
- **Multi-Channel Notifications**: Email, Slack, Discord, and custom webhooks
- **Smart Alert Thresholds**: Configurable performance and quality thresholds
- **Real-time Alerting**: Instant notifications when issues are detected
- **Historical Tracking**: Trend analysis and performance degradation detection

### User Experience
- **Intuitive Dashboard**: Real-time scan monitoring and results visualization
- **Project Management**: Organize websites into projects for better management
- **Feature Flags**: Gradual rollout and A/B testing capabilities
- **Comprehensive Reporting**: Detailed analysis with actionable insights

## 🏗️ System Architecture

### Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Queue System**: Bull/BullMQ with Redis
- **Scanning Engine**: Lighthouse, Puppeteer, Cheerio
- **Notifications**: Resend (email), Slack/Discord webhooks
- **Scheduling**: Node-cron with Redis persistence

### Database Schema
```sql
-- Core entities
- Users (authentication and preferences)
- Projects (website organization)
- WebsiteScans (scan results and metrics)
- ScheduledScans (automation configuration)

-- Alerting system
- ScanAlerts (detected issues and thresholds)
- NotificationPreferences (user notification settings)
- AlertNotifications (delivery tracking)
```

### Queue Architecture
```mermaid
graph TD
    A[Website Scan Request] --> B[Scan Queue]
    B --> C[Scan Processor]
    C --> D[Lighthouse Analysis]
    C --> E[Custom Analysis]
    D --> F[Results Processing]
    E --> F
    F --> G[Alert Detection]
    G --> H[Notification Queue]
    H --> I[Email Processor]
    H --> J[Slack Processor]
    H --> K[Discord Processor]
    H --> L[Webhook Processor]
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Redis server
- Resend API key (for email notifications)

### Environment Configuration
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/zenith_dev"

# Redis Queue System
REDIS_URL="redis://localhost:6379"

# Email Notifications (Resend)
RESEND_API_KEY="your-resend-api-key"
EMAIL_FROM="noreply@zenith.engineer"

# Notification Integrations
SLACK_BOT_TOKEN="your-slack-bot-token"
DISCORD_WEBHOOK_URL="your-discord-webhook-url"

# Feature Flags
NEXT_PUBLIC_FEATURE_ENHANCED_ANALYZER=true
NEXT_PUBLIC_FEATURE_EMAIL_NOTIFICATIONS=true
NEXT_PUBLIC_FEATURE_SLACK_NOTIFICATIONS=true
NEXT_PUBLIC_FEATURE_DISCORD_NOTIFICATIONS=true
NEXT_PUBLIC_FEATURE_WEBHOOK_NOTIFICATIONS=true
NEXT_PUBLIC_FEATURE_SCHEDULED_SCANS=true
NEXT_PUBLIC_FEATURE_ALERT_THRESHOLDS=true
```

### Database Setup
```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# (Optional) Create demo user
node scripts/create-demo-user.js
```

### Service Initialization
```bash
# Start the application
npm run dev

# Services will auto-initialize on startup
# Monitor initialization at /api/services/initialize
```

## 📊 API Endpoints

### Website Scanning
```typescript
// Start a new scan
POST /api/website-analyzer/scan
{
  "url": "https://example.com",
  "projectId": "optional-project-id",
  "scanType": "manual",
  "options": {
    "device": "desktop",
    "includeScreenshot": true
  }
}

// Get scan results
GET /api/website-analyzer/scan?scanId=scan-id

// Get scan history
GET /api/website-analyzer/scan?projectId=project-id&page=1&limit=20
```

### Scheduled Scans
```typescript
// Create scheduled scan
POST /api/website-analyzer/scheduled-scans
{
  "projectId": "project-id",
  "name": "Daily Homepage Scan",
  "schedule": "daily", // or cron expression
  "alertThresholds": { /* custom thresholds */ }
}

// Update scheduled scan
PUT /api/website-analyzer/scheduled-scans
{
  "id": "schedule-id",
  "isActive": false
}

// Delete scheduled scan
DELETE /api/website-analyzer/scheduled-scans?id=schedule-id
```

### Notifications
```typescript
// Get notification preferences
GET /api/website-analyzer/notifications

// Update notification preferences
PUT /api/website-analyzer/notifications
{
  "email": true,
  "emailAddress": "user@example.com",
  "slack": true,
  "slackWebhookUrl": "https://hooks.slack.com/...",
  "alertTypes": {
    "performance_drop": true,
    "accessibility_issue": true
  }
}

// Test notifications
POST /api/website-analyzer/notifications
{
  "action": "test",
  "channel": "email"
}
```

## 🔔 Alert System

### Alert Types
- **Performance Degradation**: Significant drops in performance scores
- **Accessibility Issues**: WCAG compliance violations
- **SEO Problems**: Technical SEO issues
- **Error Detection**: JavaScript errors or failed requests
- **Significant Changes**: 20%+ changes in key metrics

### Threshold Configuration
```typescript
const alertThresholds = {
  performance_score: { min: 50, critical: 30 },
  accessibility_score: { min: 70, critical: 50 },
  seo_score: { min: 80, critical: 60 },
  first_contentful_paint: { max: 3000, critical: 5000 },
  largest_contentful_paint: { max: 4000, critical: 6000 }
};
```

### Notification Channels
- **Email**: Detailed HTML reports with scores and recommendations
- **Slack**: Rich message cards with key metrics and alerts
- **Discord**: Embedded messages with color-coded severity
- **Webhooks**: JSON payloads for custom integrations

## 🎛️ Configuration

### Feature Flags
Control feature rollout and access through environment variables:

```env
# Core Features
NEXT_PUBLIC_FEATURE_ENHANCED_ANALYZER=true
NEXT_PUBLIC_FEATURE_SCHEDULED_SCANS=true

# Notification Channels
NEXT_PUBLIC_FEATURE_EMAIL_NOTIFICATIONS=true
NEXT_PUBLIC_FEATURE_SLACK_NOTIFICATIONS=true
NEXT_PUBLIC_FEATURE_DISCORD_NOTIFICATIONS=true
NEXT_PUBLIC_FEATURE_WEBHOOK_NOTIFICATIONS=true

# Advanced Features
NEXT_PUBLIC_FEATURE_ALERT_THRESHOLDS=true
NEXT_PUBLIC_FEATURE_PDF_REPORTS=true
```

### Queue Configuration
```typescript
// lib/queue/config.ts
export const queueConfig = {
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};
```

### Scan Configuration
```typescript
// Custom scan options
const scanOptions = {
  device: 'desktop' | 'mobile',
  includeScreenshot: boolean,
  timeout: 30000, // milliseconds
  lighthouse: {
    // Lighthouse-specific options
  }
};
```

## 🚦 Monitoring & Operations

### Health Checks
- **Application Health**: `/api/health`
- **Service Status**: `/api/services/initialize`
- **Queue Monitoring**: Built-in Bull dashboard integration

### Logging & Debugging
- Comprehensive error logging with context
- Job progress tracking and status updates
- Alert delivery confirmation and retry logic

### Performance Optimization
- Redis connection pooling
- Database query optimization
- Concurrent scan processing (configurable)
- Background job queue management

## 🔒 Security & Reliability

### Security Features
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure webhook payload verification
- SQL injection prevention via Prisma

### Reliability Features
- Exponential backoff for failed jobs
- Dead letter queue for failed notifications
- Service health monitoring
- Graceful shutdown handling

### Error Handling
- Comprehensive try-catch blocks
- Detailed error logging with context
- User-friendly error messages
- Automatic retry mechanisms

## 📈 Scalability

### Horizontal Scaling
- Stateless application design
- Redis-backed job queues
- Database connection pooling
- Load balancer compatible

### Performance Considerations
- Concurrent job processing
- Efficient database queries
- Memory usage optimization
- Resource cleanup procedures

## 🧪 Testing & Development

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run in separate terminal for background services
node scripts/initialize-services.js
```

### Testing Commands
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Test specific notification channel
curl -X POST /api/website-analyzer/notifications \
  -H "Content-Type: application/json" \
  -d '{"action":"test","channel":"email"}'
```

## 🚀 Deployment

### Production Setup
1. Configure all environment variables
2. Set up PostgreSQL and Redis instances
3. Configure monitoring and alerting
4. Enable background service auto-start
5. Set up load balancing (if needed)

### Service Management
```bash
# Production service initialization
NODE_ENV=production node scripts/initialize-services.js

# Monitor service status
curl /api/services/initialize

# Graceful shutdown
kill -TERM <process-id>
```

## 📋 Usage Examples

### Basic Website Scan
```javascript
// Start a manual scan
const response = await fetch('/api/website-analyzer/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    options: { device: 'desktop' }
  })
});

const { scan } = await response.json();
console.log('Scan started:', scan.id);
```

### Schedule Daily Scans
```javascript
// Create a daily scan schedule
await fetch('/api/website-analyzer/scheduled-scans', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'project-123',
    name: 'Daily Homepage Check',
    schedule: 'daily',
    alertThresholds: {
      performance_score: 70,
      accessibility_score: 80
    }
  })
});
```

### Configure Notifications
```javascript
// Set up Slack notifications
await fetch('/api/website-analyzer/notifications', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    slack: true,
    slackWebhookUrl: 'https://hooks.slack.com/...',
    alertTypes: {
      performance_drop: true,
      error_increase: true
    }
  })
});
```

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Write comprehensive tests
3. Update documentation for new features
4. Use feature flags for experimental features
5. Ensure proper error handling

### Code Structure
```
lib/
├── queue/               # Job queue system
├── services/           # Core business logic
├── scheduler/          # Cron scheduling
└── feature-flags.ts    # Feature flag management

components/
└── website-analyzer/   # UI components

app/
└── api/website-analyzer/ # API endpoints
```

---

## 📞 Support

For technical support or feature requests, please refer to the main project documentation or create an issue in the repository.

This system provides enterprise-grade website monitoring with comprehensive alerting and notification capabilities, designed for scalability and reliability in production environments.