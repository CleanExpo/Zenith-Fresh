# Production Monitoring and APM Setup Guide

## Overview

This guide provides comprehensive instructions for implementing enterprise-grade monitoring, observability, and Application Performance Monitoring (APM) for the Zenith Platform production deployment.

## 🎯 Monitoring Strategy

### Monitoring Architecture
```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Application   │───▶│ APM Agent    │───▶│ APM Platform    │
│   (Next.js)     │    │ (DataDog/NR) │    │ (DataDog/NR)    │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                       │                      │
         ▼                       ▼                      ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│ Error Tracking  │    │ Log Aggreg.  │    │  Dashboards     │
│    (Sentry)     │    │ (DataDog/ELK)│    │ & Alerts        │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                       │                      │
         ▼                       ▼                      ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│ Real User Mon.  │    │ Synthetic    │    │ Business Intel. │
│ (RUM/Analytics) │    │ Monitoring   │    │   Metrics       │
└─────────────────┘    └──────────────┘    └─────────────────┘
```

### Monitoring Pillars
1. **Infrastructure Monitoring**: Server, database, network performance
2. **Application Performance**: Response times, throughput, errors
3. **User Experience**: Real user monitoring, Core Web Vitals
4. **Business Metrics**: Conversions, revenue, user engagement
5. **Security Monitoring**: Threat detection, audit logs
6. **Synthetic Monitoring**: Proactive uptime and performance checks

## 🔧 APM Platform Setup

### 1. DataDog APM (Recommended)

**DataDog Agent Installation:**
```bash
# Install DataDog agent
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=your-api-key DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# Configure DataDog agent
sudo tee /etc/datadog-agent/datadog.yaml > /dev/null <<EOF
api_key: your-datadog-api-key
site: datadoghq.com
hostname: zenith-platform-prod

# Enable APM
apm_config:
  enabled: true
  
# Enable process monitoring
process_config:
  enabled: true

# Enable log collection
logs_enabled: true

# Enable network monitoring
network_config:
  enabled: true
EOF

# Start DataDog agent
sudo systemctl enable datadog-agent
sudo systemctl start datadog-agent
```

**Next.js DataDog Integration:**
```typescript
// lib/monitoring/datadog.ts
import { datadogRum } from '@datadog/browser-rum';
import { datadogLogs } from '@datadog/browser-logs';

// Initialize DataDog RUM (Real User Monitoring)
export function initializeDataDog() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    datadogRum.init({
      applicationId: process.env.NEXT_PUBLIC_DD_APPLICATION_ID!,
      clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN!,
      site: 'datadoghq.com',
      service: 'zenith-platform',
      env: 'production',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      sessionSampleRate: 100,
      sessionReplaySampleRate: 10,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask-user-input'
    });

    // Initialize logs
    datadogLogs.init({
      clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN!,
      site: 'datadoghq.com',
      service: 'zenith-platform',
      env: 'production',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      sessionSampleRate: 100
    });
  }
}

// Custom DataDog logger
export const ddLogger = {
  info: (message: string, context?: any) => {
    if (typeof window !== 'undefined') {
      datadogLogs.logger.info(message, context);
    }
    console.log(message, context);
  },
  
  warn: (message: string, context?: any) => {
    if (typeof window !== 'undefined') {
      datadogLogs.logger.warn(message, context);
    }
    console.warn(message, context);
  },
  
  error: (message: string, context?: any) => {
    if (typeof window !== 'undefined') {
      datadogLogs.logger.error(message, context);
    }
    console.error(message, context);
  }
};

// Environment Variables
NEXT_PUBLIC_DD_APPLICATION_ID=your-datadog-application-id
NEXT_PUBLIC_DD_CLIENT_TOKEN=your-datadog-client-token
DD_API_KEY=your-datadog-api-key
DD_SITE=datadoghq.com
DD_SERVICE=zenith-platform
DD_ENV=production
DD_VERSION=1.0.0
```

**DataDog APM Tracing:**
```typescript
// lib/monitoring/tracing.ts
import tracer from 'dd-trace';

// Initialize tracer (server-side only)
if (typeof window === 'undefined') {
  tracer.init({
    service: 'zenith-platform',
    env: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    logInjection: true,
    runtimeMetrics: true,
    profiling: true
  });
}

// Custom span creation
export function createSpan(operationName: string, options?: any) {
  if (typeof window === 'undefined') {
    return tracer.startSpan(operationName, options);
  }
  return null;
}

// Database query tracing
export async function traceDbQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const span = createSpan('db.query', {
    tags: {
      'db.operation': queryName,
      'service.name': 'zenith-platform-db'
    }
  });

  try {
    const result = await queryFn();
    span?.setTag('db.rows_affected', Array.isArray(result) ? result.length : 1);
    return result;
  } catch (error) {
    span?.setTag('error', true);
    span?.setTag('error.message', error.message);
    throw error;
  } finally {
    span?.finish();
  }
}

// API endpoint tracing
export function traceApiEndpoint(handler: any) {
  return async (req: any, res: any) => {
    const span = createSpan('http.request', {
      tags: {
        'http.method': req.method,
        'http.url': req.url,
        'service.name': 'zenith-platform-api'
      }
    });

    try {
      const result = await handler(req, res);
      span?.setTag('http.status_code', res.statusCode);
      return result;
    } catch (error) {
      span?.setTag('error', true);
      span?.setTag('error.message', error.message);
      span?.setTag('http.status_code', 500);
      throw error;
    } finally {
      span?.finish();
    }
  };
}
```

### 2. New Relic APM (Alternative)

**New Relic Agent Setup:**
```bash
# Install New Relic agent
npm install newrelic

# Create newrelic.js configuration
cat > newrelic.js << EOF
'use strict'

exports.config = {
  app_name: ['Zenith Platform'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  },
  
  distributed_tracing: {
    enabled: true
  },
  
  browser_monitoring: {
    enable: true
  }
}
EOF

# Environment Variables
NEW_RELIC_LICENSE_KEY=your-license-key
NEW_RELIC_APP_NAME=Zenith Platform
NEW_RELIC_LOG_LEVEL=info
```

**New Relic Next.js Integration:**
```typescript
// pages/_app.tsx
import { useEffect } from 'react';

// Import New Relic at the top (server-side only)
if (typeof window === 'undefined') {
  require('newrelic');
}

export default function App({ Component, pageProps }: any) {
  useEffect(() => {
    // Initialize New Relic browser agent
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      const script = document.createElement('script');
      script.innerHTML = window.NREUM || '';
      document.head.appendChild(script);
    }
  }, []);

  return <Component {...pageProps} />;
}

// Custom New Relic integration
export const newRelicLogger = {
  recordCustomEvent: (eventType: string, attributes: any) => {
    if (typeof window !== 'undefined' && window.newrelic) {
      window.newrelic.recordCustomEvent(eventType, attributes);
    }
  },
  
  addPageAction: (name: string, attributes?: any) => {
    if (typeof window !== 'undefined' && window.newrelic) {
      window.newrelic.addPageAction(name, attributes);
    }
  },
  
  setCustomAttribute: (name: string, value: any) => {
    if (typeof window !== 'undefined' && window.newrelic) {
      window.newrelic.setCustomAttribute(name, value);
    }
  }
};
```

## 📊 Error Tracking with Sentry

### Sentry Configuration

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

// Sentry configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Performance monitoring
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.nextRouterInstrumentation,
    }),
  ],
  
  // Error filtering
  beforeSend(event) {
    // Filter out non-actionable errors
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
      return null;
    }
    
    // Add user context
    if (event.user?.id) {
      event.tags = {
        ...event.tags,
        user_tier: 'premium' // Add business context
      };
    }
    
    return event;
  },
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.APP_VERSION,
  
  // Privacy settings
  beforeBreadcrumb(breadcrumb) {
    // Filter sensitive data from breadcrumbs
    if (breadcrumb.category === 'auth') {
      return null;
    }
    return breadcrumb;
  }
});

// Custom error context
export const sentryLogger = {
  captureException: (error: Error, context?: any) => {
    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }
      Sentry.captureException(error);
    });
  },
  
  captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
    Sentry.captureMessage(message, level);
  },
  
  setUser: (user: { id: string; email?: string; tier?: string }) => {
    Sentry.setUser(user);
  },
  
  addBreadcrumb: (breadcrumb: any) => {
    Sentry.addBreadcrumb(breadcrumb);
  }
};

// Environment Variables
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ORG=your-organization
SENTRY_PROJECT=zenith-platform
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

**Sentry Performance Monitoring:**
```typescript
// lib/monitoring/sentry-performance.ts
import * as Sentry from '@sentry/nextjs';

// Custom performance monitoring
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: 'function',
    },
    async () => {
      return await fn();
    }
  );
}

// Database operation monitoring
export async function measureDbOperation<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name: `db.${operation}`,
      op: 'db.query',
      data: {
        'db.system': 'postgresql',
        'db.operation': operation
      }
    },
    async () => {
      return await fn();
    }
  );
}

// API call monitoring
export async function measureApiCall<T>(
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name: `api.${endpoint}`,
      op: 'http.client',
      data: {
        'http.method': 'POST',
        'http.url': endpoint
      }
    },
    async () => {
      return await fn();
    }
  );
}
```

## 📈 Business Metrics and Analytics

### Custom Analytics Dashboard

```typescript
// lib/analytics/business-metrics.ts
import { redis } from '@/lib/redis';

export class BusinessMetrics {
  private redis = redis;

  // Track user events
  async trackEvent(
    userId: string,
    event: string,
    properties?: Record<string, any>
  ) {
    const eventData = {
      userId,
      event,
      properties: properties || {},
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };

    // Store in Redis for real-time analytics
    await this.redis.lpush('events:recent', JSON.stringify(eventData));
    await this.redis.expire('events:recent', 86400); // 24 hours

    // Increment daily counters
    await this.redis.hincrby(`events:daily:${eventData.date}`, event, 1);
    await this.redis.expire(`events:daily:${eventData.date}`, 2592000); // 30 days

    // Track unique users
    await this.redis.sadd(`users:active:${eventData.date}`, userId);
    await this.redis.expire(`users:active:${eventData.date}`, 2592000);
  }

  // Subscription metrics
  async trackSubscription(
    userId: string,
    action: 'created' | 'upgraded' | 'downgraded' | 'cancelled',
    plan: string,
    amount?: number
  ) {
    const subscriptionData = {
      userId,
      action,
      plan,
      amount,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };

    await this.trackEvent(userId, `subscription_${action}`, subscriptionData);

    // Update revenue metrics
    if (amount && action === 'created') {
      await this.redis.incrbyfloat(
        `revenue:daily:${subscriptionData.date}`,
        amount
      );
    }
  }

  // Feature usage tracking
  async trackFeatureUsage(userId: string, feature: string) {
    const date = new Date().toISOString().split('T')[0];
    
    await this.redis.hincrby(`features:usage:${date}`, feature, 1);
    await this.redis.sadd(`features:users:${feature}:${date}`, userId);
    await this.redis.expire(`features:usage:${date}`, 2592000);
    await this.redis.expire(`features:users:${feature}:${date}`, 2592000);
  }

  // Performance metrics
  async trackPerformance(
    endpoint: string,
    responseTime: number,
    statusCode: number
  ) {
    const date = new Date().toISOString().split('T')[0];
    const key = `performance:${endpoint}:${date}`;

    await this.redis.lpush(`${key}:response_times`, responseTime);
    await this.redis.hincrby(`${key}:status_codes`, statusCode.toString(), 1);
    await this.redis.expire(`${key}:response_times`, 2592000);
    await this.redis.expire(`${key}:status_codes`, 2592000);
  }

  // Get analytics dashboard data
  async getDashboardData(days: number = 7) {
    const dates = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const [
      dailyActiveUsers,
      dailyRevenue,
      featureUsage,
      errorRates
    ] = await Promise.all([
      this.getDailyActiveUsers(dates),
      this.getDailyRevenue(dates),
      this.getFeatureUsage(dates[0]),
      this.getErrorRates(dates)
    ]);

    return {
      dailyActiveUsers,
      dailyRevenue,
      featureUsage,
      errorRates,
      period: `${dates[dates.length - 1]} to ${dates[0]}`
    };
  }

  private async getDailyActiveUsers(dates: string[]) {
    const results = await Promise.all(
      dates.map(async (date) => {
        const count = await this.redis.scard(`users:active:${date}`);
        return { date, count };
      })
    );
    return results.reverse();
  }

  private async getDailyRevenue(dates: string[]) {
    const results = await Promise.all(
      dates.map(async (date) => {
        const revenue = await this.redis.get(`revenue:daily:${date}`);
        return { date, revenue: parseFloat(revenue || '0') };
      })
    );
    return results.reverse();
  }

  private async getFeatureUsage(date: string) {
    const usage = await this.redis.hgetall(`features:usage:${date}`);
    return Object.entries(usage).map(([feature, count]) => ({
      feature,
      count: parseInt(count)
    }));
  }

  private async getErrorRates(dates: string[]) {
    const results = await Promise.all(
      dates.map(async (date) => {
        const total = await this.redis.hget(`performance:api:${date}:status_codes`, 'total') || '0';
        const errors = await this.redis.hget(`performance:api:${date}:status_codes`, '500') || '0';
        const errorRate = parseInt(total) > 0 ? (parseInt(errors) / parseInt(total)) * 100 : 0;
        return { date, errorRate };
      })
    );
    return results.reverse();
  }
}

export const businessMetrics = new BusinessMetrics();
```

### Real-Time Monitoring Dashboard

```typescript
// components/monitoring/MonitoringDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardData {
  systemHealth: {
    cpu: number;
    memory: number;
    database: 'healthy' | 'warning' | 'critical';
    redis: 'healthy' | 'warning' | 'critical';
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
  };
  business: {
    activeUsers: number;
    conversions: number;
    revenue: number;
  };
}

export function MonitoringDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/monitoring/dashboard');
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (error) {
        console.error('Failed to fetch monitoring data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <div>Loading monitoring dashboard...</div>;
  }

  if (!data) {
    return <div>Failed to load monitoring data</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>CPU Usage:</span>
              <span className={data.systemHealth.cpu > 80 ? 'text-red-500' : 'text-green-500'}>
                {data.systemHealth.cpu}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Memory Usage:</span>
              <span className={data.systemHealth.memory > 80 ? 'text-red-500' : 'text-green-500'}>
                {data.systemHealth.memory}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Database:</span>
              <span className={getHealthColor(data.systemHealth.database)}>
                {data.systemHealth.database}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Redis:</span>
              <span className={getHealthColor(data.systemHealth.redis)}>
                {data.systemHealth.redis}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Avg Response Time:</span>
              <span>{data.performance.avgResponseTime}ms</span>
            </div>
            <div className="flex justify-between">
              <span>Error Rate:</span>
              <span className={data.performance.errorRate > 1 ? 'text-red-500' : 'text-green-500'}>
                {data.performance.errorRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Throughput:</span>
              <span>{data.performance.throughput} req/min</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Business Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Active Users:</span>
              <span>{data.business.activeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span>Conversions Today:</span>
              <span>{data.business.conversions}</span>
            </div>
            <div className="flex justify-between">
              <span>Revenue Today:</span>
              <span>${data.business.revenue.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getHealthColor(status: string): string {
  switch (status) {
    case 'healthy':
      return 'text-green-500';
    case 'warning':
      return 'text-yellow-500';
    case 'critical':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}
```

## 🚨 Alerting and Incident Response

### Alert Configuration

```typescript
// lib/monitoring/alerts.ts
import { businessMetrics } from '@/lib/analytics/business-metrics';

export interface AlertConfig {
  name: string;
  condition: () => Promise<boolean>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // minutes
  notifications: string[];
}

export class AlertManager {
  private alertConfigs: AlertConfig[] = [
    {
      name: 'High Error Rate',
      condition: async () => {
        const errorRate = await this.getErrorRate();
        return errorRate > 5; // 5% error rate
      },
      severity: 'high',
      cooldown: 15,
      notifications: ['email', 'slack', 'pagerduty']
    },
    {
      name: 'Slow Response Time',
      condition: async () => {
        const avgResponseTime = await this.getAvgResponseTime();
        return avgResponseTime > 2000; // 2 seconds
      },
      severity: 'medium',
      cooldown: 30,
      notifications: ['email', 'slack']
    },
    {
      name: 'Database Connection Issues',
      condition: async () => {
        return !(await this.checkDatabaseHealth());
      },
      severity: 'critical',
      cooldown: 5,
      notifications: ['email', 'slack', 'pagerduty', 'sms']
    },
    {
      name: 'Low Conversion Rate',
      condition: async () => {
        const conversionRate = await this.getConversionRate();
        return conversionRate < 2; // 2% conversion rate
      },
      severity: 'low',
      cooldown: 60,
      notifications: ['email']
    }
  ];

  async checkAlerts() {
    for (const alert of this.alertConfigs) {
      try {
        const shouldAlert = await alert.condition();
        
        if (shouldAlert) {
          await this.triggerAlert(alert);
        }
      } catch (error) {
        console.error(`Error checking alert ${alert.name}:`, error);
      }
    }
  }

  private async triggerAlert(alert: AlertConfig) {
    const alertKey = `alert:${alert.name}`;
    const lastAlerted = await redis.get(alertKey);
    
    // Check cooldown period
    if (lastAlerted && Date.now() - parseInt(lastAlerted) < alert.cooldown * 60 * 1000) {
      return;
    }

    // Send notifications
    for (const channel of alert.notifications) {
      await this.sendNotification(channel, alert);
    }

    // Set cooldown
    await redis.setex(alertKey, alert.cooldown * 60, Date.now().toString());
  }

  private async sendNotification(channel: string, alert: AlertConfig) {
    switch (channel) {
      case 'email':
        await this.sendEmailAlert(alert);
        break;
      case 'slack':
        await this.sendSlackAlert(alert);
        break;
      case 'pagerduty':
        await this.sendPagerDutyAlert(alert);
        break;
      case 'sms':
        await this.sendSMSAlert(alert);
        break;
    }
  }

  private async sendEmailAlert(alert: AlertConfig) {
    // Implement email notification
    console.log(`EMAIL ALERT: ${alert.name} - Severity: ${alert.severity}`);
  }

  private async sendSlackAlert(alert: AlertConfig) {
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook) return;

    const payload = {
      text: `🚨 ${alert.name}`,
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: 'Time',
              value: new Date().toISOString(),
              short: true
            }
          ]
        }
      ]
    };

    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  private async sendPagerDutyAlert(alert: AlertConfig) {
    // Implement PagerDuty integration
    console.log(`PAGERDUTY ALERT: ${alert.name} - Severity: ${alert.severity}`);
  }

  private async sendSMSAlert(alert: AlertConfig) {
    // Implement SMS notification (Twilio)
    console.log(`SMS ALERT: ${alert.name} - Severity: ${alert.severity}`);
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff6600';
      case 'medium': return '#ffcc00';
      case 'low': return '#00ff00';
      default: return '#888888';
    }
  }

  // Alert condition helpers
  private async getErrorRate(): Promise<number> {
    // Implement error rate calculation
    return 0;
  }

  private async getAvgResponseTime(): Promise<number> {
    // Implement response time calculation
    return 0;
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    // Implement database health check
    return true;
  }

  private async getConversionRate(): Promise<number> {
    // Implement conversion rate calculation
    return 0;
  }
}

export const alertManager = new AlertManager();

// Run alerts every 5 minutes
setInterval(() => {
  alertManager.checkAlerts();
}, 5 * 60 * 1000);
```

## 📱 Synthetic Monitoring

### Uptime Monitoring

```typescript
// lib/monitoring/synthetic.ts
export class SyntheticMonitor {
  private endpoints = [
    { name: 'Homepage', url: 'https://your-domain.com', timeout: 10000 },
    { name: 'API Health', url: 'https://your-domain.com/api/health', timeout: 5000 },
    { name: 'Login Page', url: 'https://your-domain.com/auth/signin', timeout: 10000 },
    { name: 'Dashboard', url: 'https://your-domain.com/dashboard', timeout: 15000 }
  ];

  async runChecks() {
    const results = await Promise.all(
      this.endpoints.map(endpoint => this.checkEndpoint(endpoint))
    );

    // Store results for analysis
    await this.storeResults(results);

    // Check for failures and alert
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      await this.alertOnFailures(failures);
    }

    return results;
  }

  private async checkEndpoint(endpoint: any) {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);

      const response = await fetch(endpoint.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Zenith-Synthetic-Monitor/1.0'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      return {
        name: endpoint.name,
        url: endpoint.url,
        success: response.ok,
        statusCode: response.status,
        responseTime,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        name: endpoint.name,
        url: endpoint.url,
        success: false,
        statusCode: 0,
        responseTime: Date.now() - startTime,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  private async storeResults(results: any[]) {
    for (const result of results) {
      await redis.lpush('synthetic:results', JSON.stringify(result));
      await redis.ltrim('synthetic:results', 0, 1000); // Keep last 1000 results
    }
  }

  private async alertOnFailures(failures: any[]) {
    const message = `Synthetic monitoring failures detected:\n${failures.map(f => 
      `- ${f.name}: ${f.error || 'HTTP ' + f.statusCode}`
    ).join('\n')}`;

    await alertManager.sendSlackAlert({
      name: 'Synthetic Monitor Failures',
      severity: 'high'
    } as any);
  }
}

export const syntheticMonitor = new SyntheticMonitor();

// Run synthetic checks every 5 minutes
setInterval(() => {
  syntheticMonitor.runChecks();
}, 5 * 60 * 1000);
```

## 📋 Monitoring Setup Checklist

### Pre-Production Setup
- [ ] **APM Platform Configuration**
  - [ ] DataDog/New Relic account setup
  - [ ] Agent installation and configuration
  - [ ] Application instrumentation
  - [ ] Custom metrics configuration
  - [ ] Performance monitoring setup

- [ ] **Error Tracking**
  - [ ] Sentry project setup and configuration
  - [ ] Error filtering and alert rules
  - [ ] Release tracking configuration
  - [ ] User context and privacy settings
  - [ ] Integration testing

- [ ] **Business Metrics**
  - [ ] Custom analytics implementation
  - [ ] Event tracking setup
  - [ ] Revenue and conversion tracking
  - [ ] Feature usage monitoring
  - [ ] Real-time dashboard creation

### Production Deployment
- [ ] **Monitoring Activation**
  - [ ] Enable all monitoring agents
  - [ ] Verify data collection
  - [ ] Test alert notifications
  - [ ] Configure monitoring dashboards
  - [ ] Set up on-call schedules

### Post-Production
- [ ] **Optimization and Tuning**
  - [ ] Analyze monitoring data patterns
  - [ ] Adjust alert thresholds
  - [ ] Optimize dashboard layouts
  - [ ] Fine-tune performance monitoring
  - [ ] Regular monitoring review meetings

## 📞 Support and Resources

### APM Platform Documentation
- **DataDog**: [docs.datadoghq.com](https://docs.datadoghq.com/)
- **New Relic**: [docs.newrelic.com](https://docs.newrelic.com/)
- **Sentry**: [docs.sentry.io](https://docs.sentry.io/)

### Monitoring Best Practices
- **The Four Golden Signals**: Latency, Traffic, Errors, Saturation
- **RED Method**: Rate, Errors, Duration
- **USE Method**: Utilization, Saturation, Errors

---

**Last Updated**: 2025-06-25  
**Version**: 1.0  
**Reviewed By**: DevOps Team, SRE Team