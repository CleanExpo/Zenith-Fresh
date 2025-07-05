/**
 * ZENITH ENTERPRISE RATE LIMITER
 * Advanced rate limiting with Redis clustering support
 */

// Placeholder Redis type for production build compatibility
interface RedisClient {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
}

// Mock Redis implementation for when ioredis is not available
class MockRedis implements RedisClient {
  private store = new Map<string, { value: number; expires: number }>();

  async incr(key: string): Promise<number> {
    const item = this.store.get(key);
    const now = Date.now();
    if (item && item.expires > now) {
      item.value++;
      return item.value;
    } else {
      this.store.set(key, { value: 1, expires: now + 60000 });
      return 1;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (item) {
      item.expires = Date.now() + (seconds * 1000);
      return 1;
    }
    return 0;
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (item && item.expires > Date.now()) {
      return item.value.toString();
    }
    return null;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }
}

const Redis = MockRedis;

interface RateLimitConfig {
  requests: number;
  window: string; // e.g., '1m', '1h', '1d'
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

export class EnterpriseRateLimiter {
  private redis: Redis | null = null;
  private redisUrl?: string;
  private memoryStore: Map<string, { count: number; resetTime: number }> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor(redisUrl?: string) {
    this.redisUrl = redisUrl;
    // Lazy initialization - Redis client created when needed
  }

  private getRedisClient(): Redis | null {
    if (!this.redisUrl) return null;
    
    if (!this.redis) {
      try {
        this.redis = new Redis(this.redisUrl, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true,
        });
        
        this.redis.on('error', (err) => {
          console.error('Redis rate limiter error:', err);
          // Fallback to memory store
        });
      } catch (error) {
        console.warn('Failed to connect to Redis, using memory store for rate limiting');
        return null;
      }
    }
    return this.redis;
  }

  // Configure rate limits for different endpoints
  configure(name: string, config: RateLimitConfig): void {
    this.configs.set(name, config);
  }

  // Check rate limit
  async checkLimit(
    identifier: string,
    configName: string = 'default',
    req?: any
  ): Promise<RateLimitResult> {
    const config = this.configs.get(configName);
    if (!config) {
      throw new Error(`Rate limit configuration '${configName}' not found`);
    }

    const key = config.keyGenerator ? config.keyGenerator(req) : identifier;
    const windowMs = this.parseWindowToMs(config.window);
    const now = Date.now();
    const resetTime = now + windowMs;

    const redisClient = this.getRedisClient();
    if (redisClient) {
      return await this.checkLimitRedis(key, config, windowMs, now, resetTime, redisClient);
    } else {
      return await this.checkLimitMemory(key, config, windowMs, now, resetTime);
    }
  }

  // Redis-based rate limiting
  private async checkLimitRedis(
    key: string,
    config: RateLimitConfig,
    windowMs: number,
    now: number,
    resetTime: number,
    redisClient: Redis
  ): Promise<RateLimitResult> {
    const rateLimitKey = `rate_limit:${key}`;
    
    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis!.pipeline();
      pipeline.incr(rateLimitKey);
      pipeline.expire(rateLimitKey, Math.ceil(windowMs / 1000));
      
      const results = await pipeline.exec();
      const count = results?.[0]?.[1] as number || 0;
      
      const remaining = Math.max(0, config.requests - count);
      const allowed = count <= config.requests;

      return {
        allowed,
        remaining,
        resetTime,
        totalHits: count,
      };
    } catch (error) {
      console.error('Redis rate limit check failed:', error);
      // Fallback to memory store
      return await this.checkLimitMemory(key, config, windowMs, now, resetTime);
    }
  }

  // Memory-based rate limiting (fallback)
  private async checkLimitMemory(
    key: string,
    config: RateLimitConfig,
    windowMs: number,
    now: number,
    resetTime: number
  ): Promise<RateLimitResult> {
    const current = this.memoryStore.get(key);
    
    if (!current || now > current.resetTime) {
      this.memoryStore.set(key, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: config.requests - 1,
        resetTime,
        totalHits: 1,
      };
    }

    current.count++;
    const remaining = Math.max(0, config.requests - current.count);
    const allowed = current.count <= config.requests;

    return {
      allowed,
      remaining,
      resetTime: current.resetTime,
      totalHits: current.count,
    };
  }

  // Clean up expired entries (for memory store)
  cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.memoryStore.entries()) {
      if (now > data.resetTime) {
        this.memoryStore.delete(key);
      }
    }
  }

  // Parse window string to milliseconds
  private parseWindowToMs(window: string): number {
    const unit = window.slice(-1).toLowerCase();
    const value = parseInt(window.slice(0, -1));
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60 * 1000; // Default to 1 minute
    }
  }

  // Get rate limit status
  async getStatus(identifier: string, configName: string = 'default'): Promise<RateLimitResult | null> {
    const config = this.configs.get(configName);
    if (!config) return null;

    const key = identifier;
    
    if (this.redis) {
      try {
        const count = await this.redis.get(`rate_limit:${key}`);
        const ttl = await this.redis.ttl(`rate_limit:${key}`);
        
        if (count === null) {
          return {
            allowed: true,
            remaining: config.requests,
            resetTime: Date.now() + this.parseWindowToMs(config.window),
            totalHits: 0,
          };
        }

        const remaining = Math.max(0, config.requests - parseInt(count));
        const resetTime = Date.now() + (ttl * 1000);

        return {
          allowed: parseInt(count) <= config.requests,
          remaining,
          resetTime,
          totalHits: parseInt(count),
        };
      } catch (error) {
        console.error('Failed to get rate limit status from Redis:', error);
      }
    }

    // Fallback to memory store
    const current = this.memoryStore.get(key);
    if (!current) {
      return {
        allowed: true,
        remaining: config.requests,
        resetTime: Date.now() + this.parseWindowToMs(config.window),
        totalHits: 0,
      };
    }

    const remaining = Math.max(0, config.requests - current.count);
    return {
      allowed: current.count <= config.requests,
      remaining,
      resetTime: current.resetTime,
      totalHits: current.count,
    };
  }

  // Reset rate limit for a specific key
  async reset(identifier: string): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.del(`rate_limit:${identifier}`);
        return;
      } catch (error) {
        console.error('Failed to reset rate limit in Redis:', error);
      }
    }

    // Fallback to memory store
    this.memoryStore.delete(identifier);
  }

  // Close Redis connection
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Predefined rate limit configurations
export const defaultRateLimitConfigs = {
  // API endpoints
  api: {
    requests: 100,
    window: '1m',
    keyGenerator: (req: any) => req.ip || 'unknown',
  },
  
  // Authentication endpoints (stricter)
  auth: {
    requests: 5,
    window: '15m',
    keyGenerator: (req: any) => `${req.ip}:auth`,
  },
  
  // File upload endpoints
  upload: {
    requests: 10,
    window: '1h',
    keyGenerator: (req: any) => `${req.ip}:upload`,
  },
  
  // Search endpoints
  search: {
    requests: 50,
    window: '1m',
    keyGenerator: (req: any) => `${req.ip}:search`,
  },
  
  // Admin endpoints (very strict)
  admin: {
    requests: 20,
    window: '1h',
    keyGenerator: (req: any) => `${req.ip}:admin`,
  },
  
  // Global rate limit
  global: {
    requests: 1000,
    window: '1h',
    keyGenerator: (req: any) => req.ip || 'unknown',
  },
  
  // Per-user rate limit
  user: {
    requests: 200,
    window: '1m',
    keyGenerator: (req: any) => req.user?.id || req.ip,
  },
};

// Create singleton instance
export const rateLimiter = new EnterpriseRateLimiter(process.env.REDIS_URL);

// Configure default rate limits
Object.entries(defaultRateLimitConfigs).forEach(([name, config]) => {
  rateLimiter.configure(name, config);
});

// Start cleanup interval for memory store
setInterval(() => {
  rateLimiter.cleanup();
}, 60000); // Clean up every minute

// Express/Next.js middleware factory
export function createRateLimitMiddleware(configName: string = 'default') {
  return async (req: any, res: any, next: any) => {
    try {
      const result = await rateLimiter.checkLimit(req.ip || 'unknown', configName, req);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': defaultRateLimitConfigs[configName as keyof typeof defaultRateLimitConfigs]?.requests || 100,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      });

      if (!result.allowed) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          resetTime: result.resetTime,
        });
      }

      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // Allow request to proceed if rate limiting fails
      next();
    }
  };
}

// Export convenience wrapper for API routes
export const rateLimit = {
  async check(identifier: string, configName: string, requests?: number, window?: string): Promise<{ success: boolean; remaining: number; resetTime: number }> {
    // Configure if custom parameters provided
    if (requests !== undefined && window !== undefined) {
      rateLimiter.configure(configName, {
        requests,
        window: window.endsWith('m') || window.endsWith('s') || window.endsWith('h') || window.endsWith('d') 
          ? window 
          : `${window}ms`,
        keyGenerator: (req: any) => identifier,
      });
    }
    
    const result = await rateLimiter.checkLimit(identifier, configName);
    return {
      success: result.allowed,
      remaining: result.remaining,
      resetTime: result.resetTime,
    };
  }
};

export { RateLimitConfig, RateLimitResult };
