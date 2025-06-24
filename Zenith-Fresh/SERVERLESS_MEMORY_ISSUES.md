# Serverless In-Memory Storage Issues - Zenith Fresh

This document identifies all in-memory storage implementations that will cause issues in a serverless environment where instances are ephemeral and data doesn't persist between executions.

## Critical Issues Found

### 1. System Monitor API (`/src/app/api/system-monitor/route.js`)

**Issues:**
- **Global metrics object** (lines 139-162): Stores system metrics in memory
- **Metrics history array** (lines 165-166): Stores historical data for 24 hours
- **Request rate calculation** (lines 277-284): Depends on historical data

**Current Implementation:**
```javascript
// System metrics storage (use external DB in production)
let systemMetrics = {
  timestamp: Date.now(),
  requests: { total: 0, successful: 0, failed: 0, rate: 0 },
  performance: { averageResponseTime: 0, slowQueries: 0, errorRate: 0 },
  resources: { memoryUsage: 0, cpuLoad: 0, activeConnections: 0 },
  traffic: { currentLoad: 0, peakLoad: 0, throttledRequests: 0 }
};

// Historical data (last 24 hours)
const metricsHistory = [];
const MAX_HISTORY_ENTRIES = 1440; // 24 hours * 60 minutes
```

**Impact:** Complete loss of metrics data between serverless executions

**Suggested Solutions:**
- Use Redis for real-time metrics storage
- Use time-series database (InfluxDB, TimescaleDB) for historical data
- Implement database fallback for metrics persistence

### 2. Traffic Manager API (`/src/app/api/traffic-manager/route.js`)

**Issues:**
- **Rate limiting Map** (line 112): Stores request counts per client
- **System metrics object** (lines 113-117): Stores current load state
- **Memory cleanup logic** (lines 195-203): Relies on persistent memory

**Current Implementation:**
```javascript
// In-memory store for edge (use external DB in production)
const requestCounts = new Map();
const systemMetrics = {
  currentLoad: 0,
  lastUpdated: Date.now(),
  activeConnections: 0
};
```

**Impact:** Rate limiting will not work across serverless executions; users could bypass limits

**Suggested Solutions:**
- Use Redis with TTL for rate limiting
- Store system metrics in Redis with atomic updates
- Implement sliding window rate limiting in Redis

### 3. Session Store (`/src/lib/session-store.js`)

**Issues:**
- **Sessions Map** (line 10): All session data stored in memory
- **Cleanup timer** (line 113): setTimeout won't work in serverless
- **Singleton pattern** (lines 133-140): Instance won't persist

**Current Implementation:**
```javascript
class SessionStore {
  constructor() {
    // For now, use in-memory storage with proper cleanup
    // TODO: Replace with Redis in production
    this.sessions = new Map();
    this.cleanup();
  }
```

**Impact:** Users will be logged out after every serverless function execution

**Suggested Solutions:**
- Use Redis for session storage with TTL
- Implement JWT tokens with secure storage
- Use database session storage as fallback

### 4. Monitoring System (`/src/lib/monitoring.js`)

**Issues:**
- **Metrics Map** (line 10): Stores all metrics in memory
- **Alerts array** (line 11): Stores alerts in memory
- **Historical data retention** (lines 33-35): Keeps last 100 entries per metric

**Current Implementation:**
```javascript
class Monitor {
  constructor() {
    this.startTime = Date.now();
    this.metrics = new Map();
    this.alerts = [];
  }
```

**Impact:** Loss of monitoring data and alerts between executions

**Suggested Solutions:**
- Use Redis for real-time metrics
- Use database for alert persistence
- Implement external monitoring service integration

### 5. Authentication System (`/src/app/api/auth/route.js`)

**Issues:**
- **Staff users Map** (line 84): Stores user definitions in memory
- **Permission levels object** (lines 85-114): Static configuration that should be in database

**Current Implementation:**
```javascript
class AuthSystem {
  constructor() {
    this.staffUsers = new Map();
    this.permissionLevels = { /* ... */ };
    this.initializeStaffUsers();
  }
```

**Impact:** Staff users will need to be re-initialized on every execution

**Suggested Solutions:**
- Move staff users to database
- Store permissions in configuration database
- Use environment variables for initialization

## Implementation Priority

### Critical (Must Fix)
1. **Session Storage** - Immediate user impact
2. **Rate Limiting** - Security vulnerability
3. **System Metrics** - Monitoring failure

### High Priority
1. **User Management** - Administrative functions
2. **Alert System** - Operational visibility

### Medium Priority
1. **Historical Metrics** - Analytics and reporting

## Recommended External Storage Solutions

### Redis (Recommended for Real-time Data)
```javascript
// Rate limiting example
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

async function checkRateLimit(clientId) {
  const key = `rate_limit:${clientId}`;
  const count = await client.incr(key);
  if (count === 1) {
    await client.expire(key, 60); // 1 minute window
  }
  return count <= MAX_REQUESTS_PER_MINUTE;
}
```

### Database (Recommended for Persistent Data)
```javascript
// Session storage example
async function storeSession(sessionId, data, ttl) {
  await db.query(
    'INSERT INTO sessions (id, data, expires_at) VALUES (?, ?, ?)',
    [sessionId, JSON.stringify(data), new Date(Date.now() + ttl * 1000)]
  );
}
```

### Environment Variables (Recommended for Configuration)
```javascript
// Static configuration
const RATE_LIMITS = {
  requests_per_minute: parseInt(process.env.RATE_LIMIT_RPM) || 100,
  burst_limit: parseInt(process.env.RATE_LIMIT_BURST) || 10
};
```

## Migration Steps

1. **Phase 1**: Add TODO comments to all identified locations
2. **Phase 2**: Implement Redis connections and fallback logic
3. **Phase 3**: Migrate session storage to Redis/database
4. **Phase 4**: Migrate rate limiting to Redis
5. **Phase 5**: Migrate metrics and monitoring data
6. **Phase 6**: Move user management to database
7. **Phase 7**: Remove all in-memory storage code

## Testing Recommendations

1. **Load Testing**: Verify rate limiting works across multiple instances
2. **Session Testing**: Ensure sessions persist across deployments
3. **Monitoring Testing**: Confirm metrics collection works in serverless
4. **Failover Testing**: Test database/Redis connection failures

## Environment Variables Needed

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_TTL_SESSIONS=86400
REDIS_TTL_RATE_LIMITS=60

# Database Configuration
DATABASE_URL=postgresql://...
DB_POOL_SIZE=10
DB_TIMEOUT=5000

# Rate Limiting
RATE_LIMIT_RPM=100
RATE_LIMIT_BURST=10
RATE_LIMIT_WINDOW=60

# Session Configuration
SESSION_TTL=86400
SESSION_CLEANUP_INTERVAL=300
```

## Notes

- All files are using Node.js runtime (`export const runtime = 'nodejs'`) which helps with persistence during a single execution
- However, serverless functions are still ephemeral and memory is not shared between executions
- The codebase has good error handling and fallback mechanisms in place
- Database operations are already implemented as fallbacks in many cases