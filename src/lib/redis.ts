import { createClient } from 'redis';
import * as Sentry from '@sentry/nextjs';

// Build-time safety: Only create Redis client at runtime, never during build
const isRedisEnabled = process.env.REDIS_URL && 
  process.env.NODE_ENV !== 'test' && 
  process.env.VERCEL_ENV !== undefined; // Only in runtime environments

let redisClient: ReturnType<typeof createClient> | null = null;
let isRedisAvailable = false;
let initPromise: Promise<void> | null = null;

// Cache configuration
const DEFAULT_TTL = 3600; // 1 hour in seconds

async function initRedis() {
  // Skip if already initialized or not enabled
  if (initPromise || !isRedisEnabled) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      redisClient = createClient({ 
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 3) return false;
            return Math.min(retries * 100, 3000);
          }
        }
      });

      redisClient.on('error', (err) => {
        console.warn('⚠️ Redis error:', err.message);
        isRedisAvailable = false;
        if (typeof Sentry !== 'undefined' && Sentry.captureException) {
          Sentry.captureException(err, { extra: { context: 'redis-error' } });
        }
      });

      redisClient.on('ready', () => {
        console.log('✅ Redis connected successfully');
        isRedisAvailable = true;
      });

      await redisClient.connect();
      isRedisAvailable = true;
    } catch (err) {
      console.warn('🚫 Redis connection failed. Continuing without cache.');
      if (typeof Sentry !== 'undefined' && Sentry.captureException) {
        Sentry.captureException(err as Error, { extra: { context: 'redis-init' } });
      }
      redisClient = null;
      isRedisAvailable = false;
    }
  })();

  return initPromise;
}

// Exported cache interface with safe fallbacks
export const cache = {
  async get(key: string): Promise<string | null> {
    if (isRedisAvailable && redisClient) {
      try {
        return await redisClient.get(key);
      } catch (error) {
        console.warn('Redis get error:', error);
        return null;
      }
    }
    return null;
  },

  async set(key: string, value: string, ttl: number = DEFAULT_TTL): Promise<void> {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.setEx(key, ttl, value);
      } catch (error) {
        console.warn('Redis set error:', error);
        // Ignore cache set errors - continue without caching
      }
    }
  },

  async del(key: string): Promise<void> {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.del(key);
      } catch (error) {
        console.warn('Redis del error:', error);
      }
    }
  },

  async disconnect(): Promise<void> {
    if (redisClient) {
      await redisClient.quit();
      isRedisAvailable = false;
    }
  },

  isAvailable: () => isRedisAvailable
};

// Helper class for JSON caching
export class JSONCache {
  static async get<T>(key: string): Promise<T | null> {
    const data = await cache.get(key);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return null;
  }

  static async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await cache.set(key, JSON.stringify(value), ttl);
    } catch {
      // Ignore JSON stringify errors
    }
  }
}

// Export for backward compatibility
export const redis = redisClient;
export { initRedis };
