# Serverless Migration Implementation Guide

This guide provides step-by-step instructions for migrating from in-memory storage to external storage solutions to make Zenith Fresh fully serverless-compatible.

## Overview

The current implementation uses in-memory storage (Maps, Sets, arrays) that will be lost between serverless function executions. This guide walks through replacing these with Redis and database storage.

## Prerequisites

### 1. Install Required Dependencies

```bash
# Redis client for Node.js
npm install ioredis

# Optional: For database session storage
npm install @vercel/kv  # For Vercel KV (Redis)
# OR
npm install redis  # Standard Redis client
```

### 2. Environment Variables

Add these to your `.env.local` and production environment:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
# For production, use services like:
# - Vercel KV: kv-url from Vercel dashboard
# - Railway: REDISURL from Railway
# - AWS ElastiCache: elasticache endpoint
# - Upstash: Redis URL from Upstash dashboard

# Database Configuration (existing)
DATABASE_URL=postgresql://...

# Session Configuration
SESSION_TTL=86400  # 24 hours in seconds
SESSION_CLEANUP_INTERVAL=300  # 5 minutes

# Rate Limiting Configuration
RATE_LIMIT_RPM=100  # Requests per minute
RATE_LIMIT_BURST=10  # Burst limit
RATE_LIMIT_WINDOW=60  # Window in seconds

# Metrics Configuration
METRICS_RETENTION_HOURS=168  # 7 days
METRICS_MAX_POINTS=1000  # Max points per metric
```

## Phase 1: Session Storage Migration (Critical)

### Step 1: Replace Session Store

**Current file:** `/src/lib/session-store.js`  
**New file:** `/src/lib/redis-session-store.js` (already created)

Update the auth system to use Redis sessions:

```javascript
// In /src/app/api/auth/route.js
// Replace:
import { getSessionStore } from '../../../lib/session-store.mjs';

// With:
import { getRedisSessionStore } from '../../../lib/redis-session-store.js';

// In AuthSystem constructor:
class AuthSystem {
  constructor() {
    // Replace:
    this.sessionStore = getSessionStore();
    
    // With:
    this.sessionStore = getRedisSessionStore();
    
    // ... rest of constructor
  }
}
```

### Step 2: Test Session Migration

1. **Local Testing:**
   ```bash
   # Start Redis locally
   docker run -d -p 6379:6379 redis:alpine
   
   # Test session creation/validation
   npm run dev
   ```

2. **Verify Session Persistence:**
   - Log in to the application
   - Restart the development server
   - Verify the session is still valid

## Phase 2: Rate Limiting Migration (Critical)

### Step 1: Replace Traffic Manager Rate Limiting

**File:** `/src/app/api/traffic-manager/route.js`

Replace the existing rate limiting logic:

```javascript
// Add at the top of the file:
const { getRedisRateLimiter } = require('../../../lib/redis-rate-limiter.js');
const rateLimiter = getRedisRateLimiter();

// Replace the existing requestCounts Map and checkRateLimit function:

// OLD CODE (remove these lines):
const requestCounts = new Map();

function checkRateLimit(clientId) {
  // ... existing logic
}

// NEW CODE:
async function checkRateLimit(clientId) {
  try {
    const result = await rateLimiter.checkRateLimit(
      clientId, 
      MAX_REQUESTS_PER_MINUTE, 
      RATE_LIMIT_WINDOW
    );
    
    return result.allowed;
  } catch (error) {
    logError(error, 'rate_limit_check', { clientId });
    // Allow on error to prevent blocking legitimate traffic
    return true;
  }
}

// Add function to get rate limit headers:
async function getRateLimitHeaders(clientId) {
  try {
    const status = await rateLimiter.getRateLimitStatus(
      clientId,
      MAX_REQUESTS_PER_MINUTE,
      RATE_LIMIT_WINDOW
    );
    
    return {
      'X-RateLimit-Limit': MAX_REQUESTS_PER_MINUTE.toString(),
      'X-RateLimit-Remaining': status.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(status.resetTime / 1000).toString()
    };
  } catch (error) {
    logError(error, 'rate_limit_headers', { clientId });
    return {};
  }
}
```

### Step 2: Update Rate Limit Response Headers

In the GET handler, add rate limiting headers to successful responses:

```javascript
// In the successful response section:
const headers = await getRateLimitHeaders(clientId);

return NextResponse.json({
  success: true,
  message: 'Request processed successfully',
  // ... existing response data
}, {
  headers: {
    ...headers,
    'X-Processing-Time': processingTime.toString(),
    'X-System-Load': typeof loadData.cpuLoad === 'number' ? loadData.cpuLoad.toFixed(2) : 'unknown',
    'X-Request-ID': requestId,
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  }
});
```

## Phase 3: Metrics and Monitoring Migration

### Step 1: Replace System Monitor Storage

**File:** `/src/app/api/system-monitor/route.js`

Replace the global metrics storage:

```javascript
// Add at the top:
const { getRedisMetricsStore } = require('../../../lib/redis-metrics-store.js');
const metricsStore = getRedisMetricsStore();

// Remove these global variables:
// let systemMetrics = { ... };
// const metricsHistory = [];

// Replace updateMetrics function:
async function updateMetrics() {
  try {
    const resources = getSystemResources();
    const performance = calculatePerformanceMetrics();
    const now = Date.now();
    
    // Store individual metrics in Redis
    await metricsStore.trackMetric('cpu_load', resources.cpuLoad, { timestamp: now });
    await metricsStore.trackMetric('memory_usage', resources.memoryUsage, { timestamp: now });
    await metricsStore.trackMetric('active_connections', resources.activeConnections, { timestamp: now });
    await metricsStore.trackMetric('error_rate', performance.errorRate, { timestamp: now });
    
    // Store in database as backup
    try {
      const systemMetrics = {
        timestamp: now,
        requests: { /* ... */ },
        performance: { /* ... */ },
        resources: resources,
        traffic: { /* ... */ }
      };
      
      await withTimeout(
        metricsOperations.storeMetrics(systemMetrics),
        3000,
        'Database metrics storage'
      );
    } catch (error) {
      logError(error, 'database_metrics_storage');
    }
  } catch (error) {
    logError(error, 'update_metrics');
    throw error;
  }
}

// Update getDashboardMetrics to use Redis:
async function getDashboardMetrics() {
  try {
    const metricsSummary = await metricsStore.getMetricsSummary();
    const activeAlerts = await metricsStore.getActiveAlerts();
    
    return {
      overview: {
        status: activeAlerts.length > 0 ? 'degraded' : 'healthy',
        healthScore: Math.max(0, 100 - (activeAlerts.length * 10)),
        uptime: '99.9%',
        lastUpdate: new Date().toISOString()
      },
      traffic: {
        requestsPerMinute: metricsSummary['request_rate']?.latest || 0,
        totalRequests: metricsSummary['total_requests']?.latest || 0,
        errorRate: metricsSummary['error_rate']?.latest || 0,
        activeUsers: metricsSummary['active_connections']?.latest || 0
      },
      performance: {
        averageResponseTime: metricsSummary['api_response_time']?.average || 0,
        cpuUsage: Math.round((metricsSummary['cpu_load']?.latest || 0) * 100),
        memoryUsage: Math.round((metricsSummary['memory_usage']?.latest || 0) * 100)
      },
      alerts: activeAlerts
    };
  } catch (error) {
    logError(error, 'dashboard_metrics');
    // Return default metrics on error
    return getDefaultMetrics();
  }
}
```

### Step 2: Replace Monitoring System

**File:** `/src/lib/monitoring.js`

Replace the Monitor class:

```javascript
// Add at the top:
const { getRedisMetricsStore } = require('./redis-metrics-store.js');

class Monitor {
  constructor() {
    this.startTime = Date.now();
    this.metricsStore = getRedisMetricsStore();
  }

  // Track application metrics
  async trackMetric(name, value, tags = {}) {
    await this.metricsStore.trackMetric(name, value, tags);
    logger.performance(name, value, tags);
  }

  // Track API response times
  async trackApiCall(path, method, statusCode, startTime) {
    const duration = Date.now() - startTime;
    
    await this.trackMetric('api_response_time', duration, {
      path, method, statusCode
    });

    await this.trackMetric('api_call_count', 1, {
      path, method, statusCode
    });

    // Track error rates
    if (statusCode >= 400) {
      await this.trackMetric('api_error_count', 1, {
        path, method, statusCode
      });
    }
  }

  // Add alert
  async addAlert(type, message, metadata = {}) {
    const alert = await this.metricsStore.addAlert(type, message, metadata);
    logger.error('Alert triggered', null, alert);
    return alert;
  }

  // Get metrics summary
  async getMetricsSummary() {
    return await this.metricsStore.getMetricsSummary();
  }

  // Get active alerts
  async getActiveAlerts() {
    return await this.metricsStore.getActiveAlerts();
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId) {
    return await this.metricsStore.acknowledgeAlert(alertId);
  }

  // Health check
  async getHealthStatus() {
    const uptime = Date.now() - this.startTime;
    const activeAlerts = await this.getActiveAlerts();
    const metrics = await this.getMetricsSummary();
    
    // Determine overall health
    let status = 'healthy';
    let issues = [];
    
    // Check for critical alerts
    const criticalAlerts = activeAlerts.filter(a => a.type === 'security' || a.type === 'threshold');
    if (criticalAlerts.length > 0) {
      status = 'degraded';
      issues.push(`${criticalAlerts.length} critical alerts`);
    }
    
    return {
      status,
      uptime,
      issues,
      alertCount: activeAlerts.length,
      metrics: Object.keys(metrics).length,
      timestamp: Date.now()
    };
  }
}
```

## Phase 4: User Management Migration

### Step 1: Move Staff Users to Database

Create a database migration for staff users:

```sql
-- Add to your database schema
CREATE TABLE IF NOT EXISTS staff_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'staff_tester',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- Insert default staff users
INSERT INTO staff_users (username, password_hash, name, role) VALUES
('staff_1', '$2b$10$hashed_password_here', 'Staff Tester 1', 'staff_tester'),
('staff_2', '$2b$10$hashed_password_here', 'Staff Tester 2', 'staff_tester'),
('qa_lead', '$2b$10$hashed_password_here', 'QA Lead', 'staff_tester'),
('dev_test', '$2b$10$hashed_password_here', 'Developer Test', 'staff_tester');
```

### Step 2: Update Auth System

**File:** `/src/app/api/auth/route.js`

Replace the in-memory staff users:

```javascript
class AuthSystem {
  constructor() {
    this.sessionStore = getRedisSessionStore();
    this.masterCredentials = {
      username: process.env.MASTER_USERNAME || 'zenith_master',
      password: process.env.MASTER_PASSWORD || 'ZenithMaster2024!',
      role: 'master_admin'
    };
    
    // Remove: this.staffUsers = new Map();
    // Remove: this.initializeStaffUsers();
    
    this.permissionLevels = {
      // Move to environment variables or database
      master_admin: JSON.parse(process.env.MASTER_PERMISSIONS || '{"name":"Master Administrator","access":"all_features",...}'),
      staff_tester: JSON.parse(process.env.STAFF_PERMISSIONS || '{"name":"Staff Tester","access":"premium_features",...}')
    };
  }

  async authenticate(username, password) {
    try {
      // Check master credentials
      if (username === this.masterCredentials.username && 
          password === this.masterCredentials.password) {
        return await this.createSession({
          username: this.masterCredentials.username,
          role: this.masterCredentials.role,
          name: 'Master Administrator',
          permissions: this.permissionLevels.master_admin
        });
      }

      // Check staff credentials from database
      try {
        const staff = await userOperations.authenticateUser(username, password);
        if (staff && staff.active) {
          // Update last login
          await userOperations.updateLastLogin(username);
          
          return await this.createSession({
            username: staff.username,
            role: staff.role,
            name: staff.name,
            permissions: this.permissionLevels[staff.role]
          });
        }
      } catch (dbError) {
        logError(dbError, 'database_staff_auth', { username });
        // Continue to return null
      }

      return null;
    } catch (error) {
      logError(error, 'authenticate', { username: username?.substring(0, 3) + '***' });
      throw error;
    }
  }

  // Remove initializeStaffUsers method
}
```

## Phase 5: Testing and Validation

### 1. Local Testing Setup

Create a `docker-compose.yml` for local Redis:

```yaml
version: '3.8'
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### 2. Test Migration Steps

```bash
# 1. Start Redis
docker-compose up -d redis

# 2. Run tests
npm test

# 3. Manual testing
npm run dev

# Test session persistence:
# - Log in
# - Restart server
# - Verify session still valid

# Test rate limiting:
# - Make rapid requests
# - Verify rate limiting works
# - Check Redis for rate limit data

# Test metrics:
# - Make API calls
# - Check metrics in Redis
# - Verify monitoring data
```

### 3. Production Deployment Checklist

- [ ] Redis/KV service configured
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Session storage working
- [ ] Rate limiting working
- [ ] Metrics collection working
- [ ] User management working
- [ ] Monitoring and alerts working

## Phase 6: Production Migration

### 1. Recommended Redis Services

**For Vercel:**
- Vercel KV (Recommended)
- Upstash Redis

**For Railway:**
- Railway Redis
- External Redis Cloud

**For AWS:**
- ElastiCache Redis
- AWS MemoryDB

**For Google Cloud:**
- Cloud Memorystore

### 2. Connection Configuration

```javascript
// Vercel KV
import { kv } from '@vercel/kv';

// Upstash
const Redis = require('ioredis');
const redis = new Redis(process.env.UPSTASH_REDIS_REST_URL);

// AWS ElastiCache
const redis = new Redis({
  host: process.env.ELASTICACHE_ENDPOINT,
  port: 6379,
  family: 4,
  keepAlive: true,
  tls: {}
});
```

### 3. Monitoring

Add monitoring for:
- Redis connection health
- Session creation/validation rates
- Rate limiting effectiveness
- Metrics storage performance

## Rollback Plan

If issues occur during migration:

1. **Session Storage Rollback:**
   ```javascript
   // Switch back to memory sessions
   const useRedis = false; // Set to false
   ```

2. **Rate Limiting Rollback:**
   ```javascript
   // Re-enable memory rate limiting
   const requestCounts = new Map();
   ```

3. **Environment Variable:**
   ```bash
   ENABLE_REDIS_STORAGE=false
   ```

## Performance Optimization

### 1. Redis Connection Pooling

```javascript
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  // Connection pooling
  family: 4,
  keepAlive: true,
  connectTimeout: 10000,
  lazyConnect: true
});
```

### 2. Metrics Batching

```javascript
// Batch metrics to reduce Redis calls
const metricsBatch = [];

function batchMetric(name, value, tags) {
  metricsBatch.push({ name, value, tags, timestamp: Date.now() });
  
  if (metricsBatch.length >= 10) {
    flushMetricsBatch();
  }
}

async function flushMetricsBatch() {
  if (metricsBatch.length === 0) return;
  
  const pipeline = redis.pipeline();
  for (const metric of metricsBatch) {
    const key = `metrics:${metric.name}`;
    pipeline.zadd(key, metric.timestamp, JSON.stringify(metric));
  }
  
  await pipeline.exec();
  metricsBatch.length = 0;
}
```

This guide provides a complete migration path from in-memory storage to Redis/database storage, ensuring your Zenith Fresh application is fully serverless-compatible.