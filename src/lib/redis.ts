import Redis from 'ioredis';
import * as Sentry from '@sentry/nextjs';

// Create Redis client only if REDIS_URL is configured
const redisClient = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 5000,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 100, 3000);
  }
}) : null;

if (redisClient) {
  redisClient.on('error', (error) => {
    console.warn('Redis connection error:', error.message);
    Sentry.captureException(error, { extra: { context: 'redis-client' } });
  });
}

// Cache configuration
const DEFAULT_TTL = 3600; // 1 hour in seconds

export class Cache {
  private static instance: Cache;
  private client = redisClient;
  private connected = false;

  private constructor() {
    if (this.client) {
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
    if (!this.client) return;
    
    try {
      // ioredis auto-connects, just check if ready
      if (this.client.status === 'ready') {
        this.connected = true;
      } else {
        // Wait for ready event
        await new Promise((resolve) => {
          this.client!.once('ready', () => {
            this.connected = true;
            resolve(true);
          });
        });
      }
    } catch (error) {
      console.warn('Redis connection failed, operating without cache:', (error as Error).message);
      Sentry.captureException(error as Error, { extra: { context: 'redis-connect' } });
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
