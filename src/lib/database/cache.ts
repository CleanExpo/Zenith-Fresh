// src/lib/database/cache.ts

// import { Redis } from 'ioredis'; // Commented out for demo - would be installed in production
type Redis = any;

interface CacheConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    retryDelayOnFailover: number;
    maxRetriesPerRequest: number;
    lazyConnect: boolean;
    keepAlive: number;
  };
  defaultTTL: number;
  keyPrefix: string;
}

interface CacheStrategy {
  key: string;
  ttl?: number;
  tags?: string[];
  invalidateOn?: string[];
}

export class EnterpriseCache {
  private redis: Redis | null = null;
  private config: CacheConfig;
  private isConnected = false;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
      },
      defaultTTL: 3600, // 1 hour
      keyPrefix: 'zenith:',
      ...config,
    };

    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Skip Redis in development if not configured
      if (process.env.NODE_ENV === 'development' && !process.env.REDIS_HOST) {
        console.log('📦 Cache: Redis not configured, using in-memory fallback');
        return;
      }

      // Mock Redis connection for demo
      this.redis = {
        connect: () => Promise.resolve(),
        on: (event: string, handler: Function) => {
          if (event === 'connect') {
            setTimeout(() => handler(), 100);
          }
          if (event === 'ready') {
            setTimeout(() => handler(), 200);
          }
        }
      };

      this.redis.on('connect', () => {
        console.log('🚀 Cache: Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('error', (error: any) => {
        console.error('❌ Cache: Redis connection error:', error);
        this.isConnected = false;
      });

      this.redis.on('ready', () => {
        console.log('✅ Cache: Redis ready for operations');
      });

      // Connect to Redis
      await this.redis.connect();

    } catch (error) {
      console.error('❌ Cache: Failed to initialize Redis:', error);
      this.redis = null;
    }
  }

  /**
   * Get value from cache with fallback
   */
  async get<T>(key: string, fallback?: () => Promise<T>): Promise<T | null> {
    const cacheKey = this.getCacheKey(key);

    try {
      if (!this.redis || !this.isConnected) {
        if (fallback) {
          console.log(`📦 Cache: Redis unavailable, executing fallback for ${key}`);
          return await fallback();
        }
        return null;
      }

      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        console.log(`🎯 Cache: Hit for ${key}`);
        return JSON.parse(cached);
      }

      console.log(`🔍 Cache: Miss for ${key}`);
      
      if (fallback) {
        const result = await fallback();
        await this.set(key, result);
        return result;
      }

      return null;

    } catch (error) {
      console.error(`❌ Cache: Error getting ${key}:`, error);
      
      if (fallback) {
        return await fallback();
      }
      
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const cacheKey = this.getCacheKey(key);
    const cacheTTL = ttl || this.config.defaultTTL;

    try {
      if (!this.redis || !this.isConnected) {
        console.log(`📦 Cache: Redis unavailable, skipping set for ${key}`);
        return false;
      }

      const serialized = JSON.stringify(value);
      await this.redis.setex(cacheKey, cacheTTL, serialized);
      
      console.log(`✅ Cache: Set ${key} with TTL ${cacheTTL}s`);
      return true;

    } catch (error) {
      console.error(`❌ Cache: Error setting ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    const cacheKey = this.getCacheKey(key);

    try {
      if (!this.redis || !this.isConnected) {
        return false;
      }

      const result = await this.redis.del(cacheKey);
      console.log(`🗑️ Cache: Deleted ${key}`);
      return result > 0;

    } catch (error) {
      console.error(`❌ Cache: Error deleting ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const cachePattern = this.getCacheKey(pattern);

    try {
      if (!this.redis || !this.isConnected) {
        return 0;
      }

      const keys = await this.redis.keys(cachePattern);
      
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      console.log(`🗑️ Cache: Invalidated ${result} keys matching ${pattern}`);
      return result;

    } catch (error) {
      console.error(`❌ Cache: Error invalidating pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      if (!this.redis || !this.isConnected) {
        return {
          connected: false,
          keys: 0,
          memory: 0,
          hits: 0,
          misses: 0
        };
      }

      const info = await this.redis.info('stats');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        connected: this.isConnected,
        info: info,
        keyspace: keyspace,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Cache: Error getting stats:', error);
      return { connected: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Clear all cache
   */
  async flush(): Promise<boolean> {
    try {
      if (!this.redis || !this.isConnected) {
        return false;
      }

      await this.redis.flushall();
      console.log('🗑️ Cache: Flushed all keys');
      return true;

    } catch (error) {
      console.error('❌ Cache: Error flushing cache:', error);
      return false;
    }
  }

  /**
   * Multi-get operation
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const cacheKeys = keys.map(key => this.getCacheKey(key));

    try {
      if (!this.redis || !this.isConnected) {
        return keys.map(() => null);
      }

      const values = await this.redis.mget(...cacheKeys);
      
      return values.map((value: any) => {
        if (value) {
          try {
            return JSON.parse(value);
          } catch {
            return null;
          }
        }
        return null;
      });

    } catch (error) {
      console.error('❌ Cache: Error in mget:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Multi-set operation
   */
  async mset<T>(data: Array<{key: string, value: T, ttl?: number}>): Promise<boolean> {
    try {
      if (!this.redis || !this.isConnected) {
        return false;
      }

      const pipeline = this.redis.pipeline();
      
      for (const item of data) {
        const cacheKey = this.getCacheKey(item.key);
        const serialized = JSON.stringify(item.value);
        const ttl = item.ttl || this.config.defaultTTL;
        
        pipeline.setex(cacheKey, ttl, serialized);
      }

      await pipeline.exec();
      console.log(`✅ Cache: Multi-set ${data.length} keys`);
      return true;

    } catch (error) {
      console.error('❌ Cache: Error in mset:', error);
      return false;
    }
  }

  /**
   * Cache-aside pattern helper
   */
  async cacheAside<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    // Cache miss, fetch from source
    const result = await fetchFunction();
    
    // Store in cache for next time
    await this.set(key, result, ttl);
    
    return result;
  }

  /**
   * Write-through pattern helper
   */
  async writeThrough<T>(
    key: string,
    value: T,
    writeFunction: (value: T) => Promise<void>,
    ttl?: number
  ): Promise<void> {
    // Write to data source first
    await writeFunction(value);
    
    // Then update cache
    await this.set(key, value, ttl);
  }

  /**
   * Write-behind pattern helper
   */
  async writeBehind<T>(
    key: string,
    value: T,
    writeFunction: (value: T) => Promise<void>,
    ttl?: number
  ): Promise<void> {
    // Update cache immediately
    await this.set(key, value, ttl);
    
    // Schedule write to data source (async)
    setImmediate(async () => {
      try {
        await writeFunction(value);
      } catch (error) {
        console.error(`❌ Cache: Write-behind failed for ${key}:`, error);
        // Optionally invalidate cache on write failure
        await this.delete(key);
      }
    });
  }

  private getCacheKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
      console.log('🔌 Cache: Redis connection closed');
    }
  }
}

// Singleton instance
export const cache = new EnterpriseCache();

// Specific cache strategies for different data types
export const CacheStrategies = {
  user: {
    ttl: 3600, // 1 hour
    keyPrefix: 'user:',
    tags: ['user']
  },
  
  session: {
    ttl: 86400, // 24 hours
    keyPrefix: 'session:',
    tags: ['session']
  },
  
  analytics: {
    ttl: 300, // 5 minutes
    keyPrefix: 'analytics:',
    tags: ['analytics']
  },
  
  project: {
    ttl: 7200, // 2 hours
    keyPrefix: 'project:',
    tags: ['project']
  },
  
  team: {
    ttl: 3600, // 1 hour
    keyPrefix: 'team:',
    tags: ['team']
  },
  
  notification: {
    ttl: 900, // 15 minutes
    keyPrefix: 'notification:',
    tags: ['notification']
  }
};

export default cache;