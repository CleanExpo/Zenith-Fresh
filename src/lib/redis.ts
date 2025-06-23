import { createClient } from 'redis';
import * as Sentry from '@sentry/nextjs';

// Create Redis client only if REDIS_URL is configured
const redisClient = process.env.REDIS_URL ? createClient({
  url: process.env.REDIS_URL,
  socket: {
    connectTimeout: 5000, // 5 second timeout
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
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
      await this.client.connect();
      this.connected = true;
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
      await this.client.set(key, JSON.stringify(value), {
        EX: ttl,
      });
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
      await this.client.flushAll();
    } catch (error) {
      Sentry.captureException(error as Error, { extra: { context: 'redis-flush' } });
    }
  }
}

// Export a singleton instance
export const cache = Cache.getInstance();
export const redis = redisClient;
