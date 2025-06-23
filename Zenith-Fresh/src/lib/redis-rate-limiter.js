/**
 * Redis-based Rate Limiting for Serverless Environment
 * Replaces in-memory rate limiting for production scalability
 */

class RedisRateLimiter {
  constructor() {
    this.redisClient = null;
    this.initialized = false;
    this.fallbackCounts = new Map(); // Fallback for Redis failures
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
        console.error('[REDIS_RATE_LIMITER] Connection error:', error);
      });

      this.initialized = true;
      console.log('[REDIS_RATE_LIMITER] Redis rate limiter initialized');
    } catch (error) {
      console.error('[REDIS_RATE_LIMITER] Failed to initialize Redis:', error);
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
   * Check rate limit using sliding window algorithm
   */
  async checkRateLimit(clientId, maxRequests = 100, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    try {
      await this.ensureConnection();
      
      const key = `rate_limit:${clientId}`;
      
      // Use Redis sorted set for sliding window
      const pipeline = this.redisClient.pipeline();
      
      // Remove expired entries
      pipeline.zremrangebyscore(key, 0, windowStart);
      
      // Count current requests in window
      pipeline.zcard(key);
      
      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      
      // Set expiration
      pipeline.expire(key, Math.ceil(windowMs / 1000) + 60); // Add buffer
      
      const results = await pipeline.exec();
      
      if (!results || results.some(result => result[0])) {
        throw new Error('Redis pipeline failed');
      }
      
      const currentCount = results[1][1]; // Count after cleanup
      const allowed = currentCount < maxRequests;
      
      // If not allowed, remove the request we just added
      if (!allowed) {
        await this.redisClient.zremrangebyscore(key, now, now);
      }
      
      return {
        allowed,
        count: currentCount + (allowed ? 1 : 0),
        remaining: Math.max(0, maxRequests - currentCount - (allowed ? 1 : 0)),
        resetTime: now + windowMs,
        windowMs
      };
      
    } catch (error) {
      console.error('[REDIS_RATE_LIMITER] Redis rate limiting failed, using fallback:', error);
      return this.fallbackRateLimit(clientId, maxRequests, windowMs);
    }
  }

  /**
   * Fallback rate limiting using memory (for Redis failures)
   */
  fallbackRateLimit(clientId, maxRequests, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.fallbackCounts.has(clientId)) {
      this.fallbackCounts.set(clientId, []);
    }
    
    const requests = this.fallbackCounts.get(clientId);
    
    // Remove expired requests
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    this.fallbackCounts.set(clientId, validRequests);
    
    // Clean up old entries periodically
    if (this.fallbackCounts.size > 1000) {
      const cutoffTime = now - (windowMs * 10);
      for (const [id, timestamps] of this.fallbackCounts.entries()) {
        if (timestamps.length === 0 || Math.max(...timestamps) < cutoffTime) {
          this.fallbackCounts.delete(id);
        }
      }
    }
    
    const allowed = validRequests.length < maxRequests;
    
    if (allowed) {
      validRequests.push(now);
    }
    
    return {
      allowed,
      count: validRequests.length,
      remaining: Math.max(0, maxRequests - validRequests.length),
      resetTime: now + windowMs,
      windowMs,
      fallback: true
    };
  }

  /**
   * Get rate limit status without incrementing
   */
  async getRateLimitStatus(clientId, maxRequests = 100, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    try {
      await this.ensureConnection();
      
      const key = `rate_limit:${clientId}`;
      
      // Clean up and count without incrementing
      await this.redisClient.zremrangebyscore(key, 0, windowStart);
      const count = await this.redisClient.zcard(key);
      
      return {
        count,
        remaining: Math.max(0, maxRequests - count),
        resetTime: now + windowMs,
        windowMs
      };
      
    } catch (error) {
      console.error('[REDIS_RATE_LIMITER] Failed to get rate limit status:', error);
      
      // Fallback
      const requests = this.fallbackCounts.get(clientId) || [];
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      
      return {
        count: validRequests.length,
        remaining: Math.max(0, maxRequests - validRequests.length),
        resetTime: now + windowMs,
        windowMs,
        fallback: true
      };
    }
  }

  /**
   * Reset rate limit for a client
   */
  async resetRateLimit(clientId) {
    try {
      await this.ensureConnection();
      
      const key = `rate_limit:${clientId}`;
      const result = await this.redisClient.del(key);
      
      // Also clear fallback
      this.fallbackCounts.delete(clientId);
      
      return result > 0;
    } catch (error) {
      console.error('[REDIS_RATE_LIMITER] Failed to reset rate limit:', error);
      
      // Fallback
      this.fallbackCounts.delete(clientId);
      return true;
    }
  }

  /**
   * Get all clients with active rate limits
   */
  async getActiveClients() {
    try {
      await this.ensureConnection();
      
      const keys = await this.redisClient.keys('rate_limit:*');
      const clients = [];
      
      for (const key of keys) {
        const clientId = key.replace('rate_limit:', '');
        const count = await this.redisClient.zcard(key);
        const ttl = await this.redisClient.ttl(key);
        
        clients.push({
          clientId,
          requestCount: count,
          ttl: ttl > 0 ? ttl : null
        });
      }
      
      return clients;
    } catch (error) {
      console.error('[REDIS_RATE_LIMITER] Failed to get active clients:', error);
      
      // Fallback
      const clients = [];
      for (const [clientId, requests] of this.fallbackCounts.entries()) {
        clients.push({
          clientId,
          requestCount: requests.length,
          fallback: true
        });
      }
      return clients;
    }
  }

  /**
   * Clear all rate limit data
   */
  async clearAllRateLimits() {
    try {
      await this.ensureConnection();
      
      const keys = await this.redisClient.keys('rate_limit:*');
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
      
      // Clear fallback
      this.fallbackCounts.clear();
      
      console.log(`[REDIS_RATE_LIMITER] Cleared ${keys.length} rate limits`);
      return true;
    } catch (error) {
      console.error('[REDIS_RATE_LIMITER] Failed to clear rate limits:', error);
      
      // Fallback
      this.fallbackCounts.clear();
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
      console.log('[REDIS_RATE_LIMITER] Redis connection closed');
    }
  }
}

// Factory function for creating Redis rate limiter
function createRedisRateLimiter() {
  return new RedisRateLimiter();
}

// Hybrid rate limiter that falls back to in-memory for development
class HybridRateLimiter {
  constructor() {
    this.useRedis = process.env.REDIS_URL && process.env.NODE_ENV === 'production';
    
    if (this.useRedis) {
      this.redisLimiter = new RedisRateLimiter();
    } else {
      // Fallback to in-memory for development
      this.memoryLimiter = new Map();
    }
  }

  async checkRateLimit(clientId, maxRequests, windowMs) {
    if (this.useRedis) {
      return await this.redisLimiter.checkRateLimit(clientId, maxRequests, windowMs);
    } else {
      return this.memoryRateLimit(clientId, maxRequests, windowMs);
    }
  }

  memoryRateLimit(clientId, maxRequests, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.memoryLimiter.has(clientId)) {
      this.memoryLimiter.set(clientId, []);
    }
    
    const requests = this.memoryLimiter.get(clientId);
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    const allowed = validRequests.length < maxRequests;
    
    if (allowed) {
      validRequests.push(now);
    }
    
    this.memoryLimiter.set(clientId, validRequests);
    
    return {
      allowed,
      count: validRequests.length,
      remaining: Math.max(0, maxRequests - validRequests.length),
      resetTime: now + windowMs,
      windowMs,
      memory: true
    };
  }

  async getRateLimitStatus(clientId, maxRequests, windowMs) {
    if (this.useRedis) {
      return await this.redisLimiter.getRateLimitStatus(clientId, maxRequests, windowMs);
    } else {
      const now = Date.now();
      const windowStart = now - windowMs;
      const requests = this.memoryLimiter.get(clientId) || [];
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      
      return {
        count: validRequests.length,
        remaining: Math.max(0, maxRequests - validRequests.length),
        resetTime: now + windowMs,
        windowMs,
        memory: true
      };
    }
  }

  async resetRateLimit(clientId) {
    if (this.useRedis) {
      return await this.redisLimiter.resetRateLimit(clientId);
    } else {
      this.memoryLimiter.delete(clientId);
      return true;
    }
  }
}

// Singleton instance
let rateLimiterInstance = null;

function getRedisRateLimiter() {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new HybridRateLimiter();
  }
  return rateLimiterInstance;
}

// CommonJS exports
module.exports = {
  RedisRateLimiter,
  HybridRateLimiter,
  getRedisRateLimiter,
  createRedisRateLimiter,
  default: RedisRateLimiter
};

// Example usage in traffic manager
/*
// Replace the existing rate limiting logic in traffic-manager/route.js:

const { getRedisRateLimiter } = require('../../../lib/redis-rate-limiter.js');
const rateLimiter = getRedisRateLimiter();

// In checkRateLimit function:
async function checkRateLimit(clientId) {
  try {
    const result = await rateLimiter.checkRateLimit(
      clientId, 
      MAX_REQUESTS_PER_MINUTE, 
      RATE_LIMIT_WINDOW
    );
    
    return result.allowed;
  } catch (error) {
    console.error('Rate limiting failed:', error);
    return true; // Allow on error to prevent blocking legitimate traffic
  }
}

// For getting rate limit headers:
async function getRateLimitHeaders(clientId) {
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
}
*/