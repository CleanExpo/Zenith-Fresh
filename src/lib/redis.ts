import Redis from 'ioredis';
import * as Sentry from '@sentry/nextjs';

// Build-time safety: Only create Redis client at runtime, never during build
const isBuildTime = process.env.NODE_ENV === 'development' && !process.env.REDIS_URL;
const isVercelBuild = process.env.VERCEL_ENV === undefined && process.env.NODE_ENV === 'production';
const shouldSkipRedis = isBuildTime || isVercelBuild || !process.env.REDIS_URL;

// Safe Redis client for build time and fallback
// NOTE: This returns null to force fallback to real database queries, not mock data
const safeRedisClient = {
  get: async () => null, // Force DB fallback - never return mock data
  set: async () => 'OK', // No-op during build
  setex: async () => 'OK', // No-op during build
  del: async () => 1, // No-op during build
  flushall: async () => 'OK', // No-op during build
  status: 'ready',
  on: () => {},
  once: () => {},
  disconnect: async () => {}
};

// Create Redis client only if appropriate
const redisClient = shouldSkipRedis ? null : (() => {
  try {
    const client = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 5000,
      lazyConnect: true, // Don't connect immediately
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      }
    });

    client.on('error', (error) => {
      console.warn('Redis connection error (using fallback):', error.message);
      if (typeof Sentry !== 'undefined' && Sentry.captureException) {
        Sentry.captureException(error, { extra: { context: 'redis-client' } });
      }
    });

    return client;
  } catch (error) {
    console.warn('Redis initialization failed, using mock client:', error);
    return null;
  }
})();

// Cache configuration
const DEFAULT_TTL = 3600; // 1 hour in seconds

export class Cache {
  private static instance: Cache;
  private client = redisClient || safeRedisClient;
  private connected = false;
  private isUsingSafeMode = !redisClient;

  private constructor() {
    if (this.isUsingSafeMode) {
      console.log('🔄 Using safe Redis client (build-time or fallback mode - will use real DB for data)');
      this.connected = true;
    } else if (this.client) {
      this.connect();
    }
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  private async connect() {
    if (!this.client || this.isUsingSafeMode) return;
    
    try {
      // For real Redis client, attempt connection
      if (this.client.status === 'ready') {
        this.connected = true;
        console.log('✅ Redis connected successfully');
      } else {
        // Wait for ready event with timeout
        await Promise.race([
          new Promise((resolve) => {
            this.client!.once('ready', () => {
              this.connected = true;
              console.log('✅ Redis connected successfully');
              resolve(true);
            });
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 10000))
        ]);
      }
    } catch (error) {
      console.warn('⚠️ Redis connection failed, switching to safe mode (real DB fallback):', (error as Error).message);
      this.client = safeRedisClient;
      this.isUsingSafeMode = true;
      this.connected = true;
      if (typeof Sentry !== 'undefined' && Sentry.captureException) {
        Sentry.captureException(error as Error, { extra: { context: 'redis-connect' } });
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.connected) {
      return null;
    }
    
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      Sentry.captureException(error as Error, { extra: { context: 'redis-get', key } });
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }
    
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      Sentry.captureException(error as Error, { extra: { context: 'redis-set', key } });
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }
    
    try {
      await this.client.del(key);
    } catch (error) {
      Sentry.captureException(error as Error, { extra: { context: 'redis-del', key } });
    }
  }

  async flush(): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }
    
    try {
      await this.client.flushall();
    } catch (error) {
      Sentry.captureException(error as Error, { extra: { context: 'redis-flush' } });
    }
  }
}

// Export a singleton instance
export const cache = Cache.getInstance();
export const redis = redisClient;
