import { RedisOperations } from './redis';
import crypto from 'crypto';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  compress?: boolean;
  invalidatePattern?: string;
}

export class APICache {
  private static readonly DEFAULT_TTL = 300; // 5 minutes
  private static readonly CACHE_PREFIX = 'cache:api:';

  /**
   * Generate cache key from request parameters
   */
  static generateKey(
    endpoint: string,
    params?: Record<string, any>,
    userId?: string
  ): string {
    const keyData = {
      endpoint,
      params: params || {},
      userId: userId || 'anonymous'
    };

    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex')
      .substring(0, 16);

    return `${this.CACHE_PREFIX}${endpoint}:${hash}`;
  }

  /**
   * Get cached data
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await RedisOperations.get(key);
      if (!cached) return null;

      const data = JSON.parse(cached);
      
      // Check if cache has expired (redundant with Redis TTL but good for safety)
      if (data.expiresAt && data.expiresAt < Date.now()) {
        await RedisOperations.del(key);
        return null;
      }

      return data.value as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cache data
   */
  static async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const ttl = options.ttl || this.DEFAULT_TTL;
      const data = {
        value,
        cachedAt: Date.now(),
        expiresAt: Date.now() + (ttl * 1000)
      };

      return await RedisOperations.setex(
        key,
        ttl,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete cache entry
   */
  static async delete(key: string): Promise<boolean> {
    try {
      return await RedisOperations.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  static async has(key: string): Promise<boolean> {
    try {
      return await RedisOperations.exists(key);
    } catch (error) {
      console.error('Cache has error:', error);
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  static async invalidate(pattern: string): Promise<void> {
    // In production, you'd use Redis SCAN command
    // For now, we'll use a simplified approach
    console.log(`Cache invalidation requested for pattern: ${pattern}`);
  }

  /**
   * Clear all cache (use with caution)
   */
  static async clear(): Promise<void> {
    console.warn('Cache clear requested - implement with Redis FLUSHDB if needed');
  }

  /**
   * Cache-aside pattern implementation
   */
  static async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, execute factory function
    const value = await factory();

    // Store in cache (don't await to not block response)
    this.set(key, value, options).catch(error => {
      console.error('Failed to cache value:', error);
    });

    return value;
  }

  /**
   * Middleware for caching API responses
   */
  static middleware(options: CacheOptions = {}) {
    return async (req: Request, context: any) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return context.next();
      }

      const url = new URL(req.url);
      const endpoint = url.pathname;
      const searchParams = Object.fromEntries(url.searchParams);
      
      // Extract user ID from headers or session
      const userId = req.headers.get('x-user-id') || undefined;
      
      const cacheKey = this.generateKey(endpoint, searchParams, userId);

      // Try to get cached response
      const cached = await this.get<any>(cacheKey);
      if (cached) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey
          }
        });
      }

      // If not cached, proceed with request
      const response = await context.next();
      
      // Only cache successful responses
      if (response.status === 200) {
        try {
          const data = await response.json();
          
          // Cache the response (don't await)
          this.set(cacheKey, data, options).catch(console.error);

          // Return new response with cache headers
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'MISS',
              'X-Cache-Key': cacheKey
            }
          });
        } catch (error) {
          // If response is not JSON, return as-is
          return response;
        }
      }

      return response;
    };
  }
}

/**
 * Decorator for caching method results
 */
export function cacheable(options: CacheOptions = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const className = target.constructor.name;
      const cacheKey = APICache.generateKey(
        `${className}.${propertyKey}`,
        { args }
      );

      return APICache.getOrSet(
        cacheKey,
        () => originalMethod.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}

/**
 * Website scan specific caching
 */
export class WebsiteScanCache {
  private static readonly SCAN_CACHE_TTL = 3600; // 1 hour
  
  static generateScanKey(url: string, scanType: string): string {
    const normalizedUrl = new URL(url).hostname;
    return `cache:api:scan:${normalizedUrl}:${scanType}`;
  }

  static async getCachedScan(url: string, scanType: string): Promise<any> {
    const key = this.generateScanKey(url, scanType);
    return APICache.get(key);
  }

  static async cacheScan(url: string, scanType: string, result: any): Promise<boolean> {
    const key = this.generateScanKey(url, scanType);
    return APICache.set(key, result, { ttl: this.SCAN_CACHE_TTL });
  }

  static async invalidateScan(url: string): Promise<void> {
    const normalizedUrl = new URL(url).hostname;
    await APICache.invalidate(`scan:${normalizedUrl}:*`);
  }
}

// Backward compatibility with simple cache interface
export const cache = {
  get: async <T>(key: string): Promise<T | null> => APICache.get<T>(key),
  set: async <T>(key: string, value: T, ttlSeconds: number = 3600): Promise<boolean> => 
    APICache.set(key, value, { ttl: ttlSeconds }),
  delete: async (key: string): Promise<boolean> => APICache.delete(key),
  has: async (key: string): Promise<boolean> => APICache.has(key),
  clear: async (): Promise<void> => APICache.clear(),
  size: async (): Promise<number> => {
    console.warn('Size operation not available with Redis cache');
    return 0;
  },
};

export default cache;