import { createClient } from 'redis';
import { captureException } from './sentry';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (error) => {
  captureException(error, { context: 'redis-client' });
});

// Cache configuration
const DEFAULT_TTL = 3600; // 1 hour in seconds

export class Cache {
  private static instance: Cache;
  private client = redisClient;

  private constructor() {
    this.connect();
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  private async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      captureException(error as Error, { context: 'redis-connect' });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      captureException(error as Error, { context: 'redis-get', key });
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), {
        EX: ttl,
      });
    } catch (error) {
      captureException(error as Error, { context: 'redis-set', key });
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      captureException(error as Error, { context: 'redis-del', key });
    }
  }

  async flush(): Promise<void> {
    try {
      await this.client.flushAll();
    } catch (error) {
      captureException(error as Error, { context: 'redis-flush' });
    }
  }
}

// Export a singleton instance
export const cache = Cache.getInstance(); 