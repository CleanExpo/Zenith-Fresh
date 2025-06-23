/**
 * Redis-based Metrics Storage for Serverless Environment
 * Replaces in-memory metrics storage for production scalability
 */

class RedisMetricsStore {
  constructor() {
    this.redisClient = null;
    this.initialized = false;
    this.fallbackMetrics = new Map(); // Fallback for Redis failures
    this.fallbackAlerts = []; // Fallback for alerts
  }

  /**
   * Initialize Redis connection
   */
  async init() {
    if (this.initialized) return;

    try {
      const Redis = require('ioredis');
      
      this.redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: 2,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        // Serverless optimizations
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 5000,
        commandTimeout: 3000
      });

      this.redisClient.on('error', (error) => {
        console.error('[REDIS_METRICS] Connection error:', error);
      });

      this.initialized = true;
      console.log('[REDIS_METRICS] Redis metrics store initialized');
    } catch (error) {
      console.error('[REDIS_METRICS] Failed to initialize Redis:', error);
      throw error;
    }
  }

  /**
   * Ensure Redis is connected
   */
  async ensureConnection() {
    if (!this.initialized) {
      await this.init();
    }
    
    if (!this.redisClient || this.redisClient.status !== 'ready') {
      await this.redisClient.connect();
    }
  }

  /**
   * Store metric data point
   */
  async trackMetric(name, value, tags = {}) {
    const timestamp = Date.now();
    const metric = {
      name,
      value,
      tags,
      timestamp
    };

    try {
      await this.ensureConnection();
      
      // Store in Redis sorted set for time-series data
      const key = `metrics:${name}`;
      const score = timestamp;
      const member = JSON.stringify({ value, tags, timestamp });
      
      const pipeline = this.redisClient.pipeline();
      
      // Add metric data point
      pipeline.zadd(key, score, member);
      
      // Keep only last 1000 entries per metric
      pipeline.zremrangebyrank(key, 0, -1001);
      
      // Set expiration (7 days)
      pipeline.expire(key, 7 * 24 * 60 * 60);
      
      await pipeline.exec();
      
      console.log(`[REDIS_METRICS] Tracked metric: ${name} = ${value}`);
      
      // Check for alerts
      await this.checkAlerts(name, value, tags);
      
      return true;
    } catch (error) {
      console.error('[REDIS_METRICS] Failed to track metric, using fallback:', error);
      
      // Fallback to memory
      if (!this.fallbackMetrics.has(name)) {
        this.fallbackMetrics.set(name, []);
      }
      
      const metricHistory = this.fallbackMetrics.get(name);
      metricHistory.push(metric);
      
      // Keep only last 100 entries
      if (metricHistory.length > 100) {
        metricHistory.shift();
      }
      
      return true;
    }
  }

  /**
   * Get metric history
   */
  async getMetricHistory(name, limitHours = 24) {
    const endTime = Date.now();
    const startTime = endTime - (limitHours * 60 * 60 * 1000);
    
    try {
      await this.ensureConnection();
      
      const key = `metrics:${name}`;
      const results = await this.redisClient.zrangebyscore(
        key, 
        startTime, 
        endTime, 
        'WITHSCORES'
      );
      
      const metrics = [];
      for (let i = 0; i < results.length; i += 2) {
        try {
          const data = JSON.parse(results[i]);
          const timestamp = parseInt(results[i + 1]);
          metrics.push({
            ...data,
            timestamp
          });
        } catch (parseError) {
          console.error('[REDIS_METRICS] Failed to parse metric data:', parseError);
        }
      }
      
      return metrics;
    } catch (error) {
      console.error('[REDIS_METRICS] Failed to get metric history, using fallback:', error);
      
      // Fallback to memory
      const metricHistory = this.fallbackMetrics.get(name) || [];
      return metricHistory.filter(m => m.timestamp >= startTime);
    }
  }

  /**
   * Get metrics summary
   */
  async getMetricsSummary() {
    try {
      await this.ensureConnection();
      
      const keys = await this.redisClient.keys('metrics:*');
      const summary = {};
      
      for (const key of keys) {
        const metricName = key.replace('metrics:', '');
        
        try {
          // Get recent data points
          const recentData = await this.redisClient.zrevrange(key, 0, 99, 'WITHSCORES');
          
          if (recentData.length === 0) continue;
          
          const values = [];
          const recent = [];
          
          for (let i = 0; i < recentData.length; i += 2) {
            try {
              const data = JSON.parse(recentData[i]);
              const timestamp = parseInt(recentData[i + 1]);
              
              values.push(data.value);
              if (recent.length < 10) {
                recent.push({ value: data.value, timestamp });
              }
            } catch (parseError) {
              console.error('[REDIS_METRICS] Failed to parse summary data:', parseError);
            }
          }
          
          if (values.length > 0) {
            summary[metricName] = {
              count: values.length,
              latest: values[0],
              average: values.reduce((a, b) => a + b, 0) / values.length,
              min: Math.min(...values),
              max: Math.max(...values),
              recent: recent
            };
          }
        } catch (keyError) {
          console.error(`[REDIS_METRICS] Failed to process metric ${metricName}:`, keyError);
        }
      }
      
      return summary;
    } catch (error) {
      console.error('[REDIS_METRICS] Failed to get metrics summary, using fallback:', error);
      
      // Fallback to memory
      const summary = {};
      for (const [name, history] of this.fallbackMetrics.entries()) {
        if (history.length === 0) continue;
        
        const values = history.map(m => m.value);
        const recent = history.slice(-10);
        
        summary[name] = {
          count: history.length,
          latest: values[values.length - 1],
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          recent: recent.map(m => ({ value: m.value, timestamp: m.timestamp })),
          fallback: true
        };
      }
      
      return summary;
    }
  }

  /**
   * Add alert
   */
  async addAlert(type, message, metadata = {}) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: Date.now(),
      metadata,
      acknowledged: false
    };

    try {
      await this.ensureConnection();
      
      const key = 'alerts:active';
      const score = alert.timestamp;
      const member = JSON.stringify(alert);
      
      const pipeline = this.redisClient.pipeline();
      
      // Add alert
      pipeline.zadd(key, score, member);
      
      // Keep only last 100 alerts
      pipeline.zremrangebyrank(key, 0, -101);
      
      // Set expiration (30 days)
      pipeline.expire(key, 30 * 24 * 60 * 60);
      
      await pipeline.exec();
      
      console.log(`[REDIS_METRICS] Alert added: ${type} - ${message}`);
      return alert;
    } catch (error) {
      console.error('[REDIS_METRICS] Failed to add alert, using fallback:', error);
      
      // Fallback to memory
      this.fallbackAlerts.push(alert);
      
      // Keep only last 50 alerts
      if (this.fallbackAlerts.length > 50) {
        this.fallbackAlerts.shift();
      }
      
      return alert;
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts() {
    try {
      await this.ensureConnection();
      
      const key = 'alerts:active';
      const alertData = await this.redisClient.zrevrange(key, 0, -1);
      
      const alerts = [];
      for (const data of alertData) {
        try {
          const alert = JSON.parse(data);
          if (!alert.acknowledged) {
            alerts.push(alert);
          }
        } catch (parseError) {
          console.error('[REDIS_METRICS] Failed to parse alert data:', parseError);
        }
      }
      
      return alerts;
    } catch (error) {
      console.error('[REDIS_METRICS] Failed to get active alerts, using fallback:', error);
      
      // Fallback to memory
      return this.fallbackAlerts.filter(alert => !alert.acknowledged);
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId) {
    try {
      await this.ensureConnection();
      
      const key = 'alerts:active';
      const alertData = await this.redisClient.zrange(key, 0, -1);
      
      for (const data of alertData) {
        try {
          const alert = JSON.parse(data);
          if (alert.id === alertId) {
            // Update alert
            alert.acknowledged = true;
            alert.acknowledgedAt = Date.now();
            
            // Replace in Redis
            await this.redisClient.zrem(key, data);
            await this.redisClient.zadd(key, alert.timestamp, JSON.stringify(alert));
            
            console.log(`[REDIS_METRICS] Alert acknowledged: ${alertId}`);
            return true;
          }
        } catch (parseError) {
          console.error('[REDIS_METRICS] Failed to parse alert for acknowledgment:', parseError);
        }
      }
      
      return false;
    } catch (error) {
      console.error('[REDIS_METRICS] Failed to acknowledge alert, using fallback:', error);
      
      // Fallback to memory
      const alert = this.fallbackAlerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        alert.acknowledgedAt = Date.now();
        return true;
      }
      
      return false;
    }
  }

  /**
   * Check for alert conditions
   */
  async checkAlerts(metricName, value, tags) {
    const thresholds = {
      'api_response_time': { max: 5000, message: 'High API response time' },
      'api_error_count': { max: 10, message: 'High API error rate' },
      'memory_usage': { max: 85, message: 'High memory usage' },
      'auth_failure': { max: 5, message: 'Multiple authentication failures' }
    };

    const threshold = thresholds[metricName];
    if (!threshold) return;

    if (value > threshold.max) {
      await this.addAlert('threshold', threshold.message, {
        metric: metricName,
        value,
        threshold: threshold.max,
        tags
      });
    }
  }

  /**
   * Clear all metrics and alerts
   */
  async clearAll() {
    try {
      await this.ensureConnection();
      
      const metricKeys = await this.redisClient.keys('metrics:*');
      const alertKeys = await this.redisClient.keys('alerts:*');
      const allKeys = [...metricKeys, ...alertKeys];
      
      if (allKeys.length > 0) {
        await this.redisClient.del(...allKeys);
      }
      
      // Clear fallback
      this.fallbackMetrics.clear();
      this.fallbackAlerts.length = 0;
      
      console.log(`[REDIS_METRICS] Cleared ${allKeys.length} metric/alert keys`);
      return true;
    } catch (error) {
      console.error('[REDIS_METRICS] Failed to clear metrics:', error);
      
      // Clear fallback
      this.fallbackMetrics.clear();
      this.fallbackAlerts.length = 0;
      
      return true;
    }
  }

  /**
   * Clean up Redis connection
   */
  async disconnect() {
    if (this.redisClient) {
      await this.redisClient.disconnect();
      this.initialized = false;
      console.log('[REDIS_METRICS] Redis connection closed');
    }
  }
}

// Hybrid metrics store that falls back to in-memory for development
class HybridMetricsStore {
  constructor() {
    this.useRedis = process.env.REDIS_URL && process.env.NODE_ENV === 'production';
    
    if (this.useRedis) {
      this.redisStore = new RedisMetricsStore();
    } else {
      // Fallback to in-memory for development
      this.memoryMetrics = new Map();
      this.memoryAlerts = [];
    }
  }

  async trackMetric(name, value, tags) {
    if (this.useRedis) {
      return await this.redisStore.trackMetric(name, value, tags);
    } else {
      // In-memory implementation
      if (!this.memoryMetrics.has(name)) {
        this.memoryMetrics.set(name, []);
      }
      
      const metricHistory = this.memoryMetrics.get(name);
      metricHistory.push({ name, value, tags, timestamp: Date.now() });
      
      if (metricHistory.length > 100) {
        metricHistory.shift();
      }
      
      return true;
    }
  }

  async getMetricHistory(name, limitHours) {
    if (this.useRedis) {
      return await this.redisStore.getMetricHistory(name, limitHours);
    } else {
      const startTime = Date.now() - (limitHours * 60 * 60 * 1000);
      const history = this.memoryMetrics.get(name) || [];
      return history.filter(m => m.timestamp >= startTime);
    }
  }

  async getMetricsSummary() {
    if (this.useRedis) {
      return await this.redisStore.getMetricsSummary();
    } else {
      const summary = {};
      for (const [name, history] of this.memoryMetrics.entries()) {
        if (history.length === 0) continue;
        
        const values = history.map(m => m.value);
        const recent = history.slice(-10);
        
        summary[name] = {
          count: history.length,
          latest: values[values.length - 1],
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          recent: recent.map(m => ({ value: m.value, timestamp: m.timestamp })),
          memory: true
        };
      }
      return summary;
    }
  }

  async addAlert(type, message, metadata) {
    if (this.useRedis) {
      return await this.redisStore.addAlert(type, message, metadata);
    } else {
      const alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        message,
        timestamp: Date.now(),
        metadata,
        acknowledged: false
      };
      
      this.memoryAlerts.push(alert);
      
      if (this.memoryAlerts.length > 50) {
        this.memoryAlerts.shift();
      }
      
      return alert;
    }
  }

  async getActiveAlerts() {
    if (this.useRedis) {
      return await this.redisStore.getActiveAlerts();
    } else {
      return this.memoryAlerts.filter(alert => !alert.acknowledged);
    }
  }

  async acknowledgeAlert(alertId) {
    if (this.useRedis) {
      return await this.redisStore.acknowledgeAlert(alertId);
    } else {
      const alert = this.memoryAlerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        alert.acknowledgedAt = Date.now();
        return true;
      }
      return false;
    }
  }
}

// Singleton instance
let metricsStoreInstance = null;

function getRedisMetricsStore() {
  if (!metricsStoreInstance) {
    metricsStoreInstance = new HybridMetricsStore();
  }
  return metricsStoreInstance;
}

// CommonJS exports
module.exports = {
  RedisMetricsStore,
  HybridMetricsStore,
  getRedisMetricsStore,
  default: RedisMetricsStore
};

// Example usage in monitoring.js
/*
// Replace the existing Monitor class usage:

const { getRedisMetricsStore } = require('./redis-metrics-store.js');
const metricsStore = getRedisMetricsStore();

class Monitor {
  constructor() {
    this.startTime = Date.now();
    this.metricsStore = metricsStore;
  }

  // Track application metrics
  async trackMetric(name, value, tags = {}) {
    await this.metricsStore.trackMetric(name, value, tags);
  }

  // Add alert
  async addAlert(type, message, metadata = {}) {
    return await this.metricsStore.addAlert(type, message, metadata);
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
}
*/