import { createClient } from 'redis';

const isRedisEnabled = process.env.REDIS_URL && process.env.NODE_ENV !== 'development';

let redisClient = null;
let isRedisAvailable = false;

export async function initRedis() {
  if (!isRedisEnabled) return;
  try {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => {
      console.warn('⚠️ Redis error:', err.message);
      isRedisAvailable = false;
    });
    await redisClient.connect();
    isRedisAvailable = true;
    console.log('✅ Connected to Redis');
  } catch (err) {
    console.warn('🚫 Redis connection failed:', err.message);
    redisClient = null;
    isRedisAvailable = false;
  }
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

  async set(key: string, value: string, ttl: number = 3600): Promise<void> {
    if (isRedisAvailable && redisClient) {
      try {
        await redisClient.setEx(key, ttl, value);
      } catch (error) {
        console.warn('Redis set error:', error);
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