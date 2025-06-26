import Redis from 'ioredis';

// Redis connection configuration
const getRedisConfig = () => {
  // Check if REDIS_URL is provided (Redis Cloud format)
  if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('redis://')) {
    return {
      ...parseRedisUrl(process.env.REDIS_URL),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: null, // Disable retry limit for better reliability
      lazyConnect: true,
      connectTimeout: 15000,
      commandTimeout: 10000,
      enableReadyCheck: true,
      tls: {
        // Enable TLS for Redis Cloud connections
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    };
  }

  // Fallback to individual environment variables
  const config: any = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    db: parseInt(process.env.REDIS_DB || '0'),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: null, // Disable retry limit for better reliability
    lazyConnect: true,
    connectTimeout: 15000,
    commandTimeout: 10000,
    enableReadyCheck: true,
  };

  // Add authentication if provided
  if (process.env.REDIS_PASSWORD) {
    config.password = process.env.REDIS_PASSWORD;
  }

  if (process.env.REDIS_USERNAME) {
    config.username = process.env.REDIS_USERNAME;
  }

  // Add TLS configuration for Redis Cloud when using individual env vars
  if (process.env.REDIS_URL && process.env.REDIS_URL.includes('rediss://')) {
    config.tls = {
      rejectUnauthorized: false, // Allow self-signed certificates
    };
  }

  return config;
};

/**
 * Parse Redis URL into configuration object
 */
function parseRedisUrl(url: string) {
  try {
    const parsed = new URL(url);
    const config: any = {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 6379,
    };

    if (parsed.username) {
      config.username = parsed.username;
    }

    if (parsed.password) {
      config.password = parsed.password;
    }

    // Extract database number from pathname
    if (parsed.pathname && parsed.pathname.length > 1) {
      const db = parseInt(parsed.pathname.slice(1));
      if (!isNaN(db)) {
        config.db = db;
      }
    }

    // Add TLS configuration for Redis Cloud URLs
    if (url.startsWith('rediss://') || (parsed.port && parseInt(parsed.port) === 6380)) {
      config.tls = {
        rejectUnauthorized: false, // Allow self-signed certificates
      };
    }

    return config;
  } catch (error) {
    console.error('Failed to parse Redis URL:', error);
    throw new Error('Invalid Redis URL format');
  }
}

const redisConfig = getRedisConfig();

// Create Redis instances
let redis: Redis | null = null;
let redisPub: Redis | null = null;
let redisSub: Redis | null = null;

/**
 * Get main Redis instance with improved error handling
 */
export function getRedis(): Redis {
  if (!redis) {
    try {
      redis = new Redis(redisConfig);
      
      redis.on('error', (error) => {
        console.error('Redis connection error:', error);
        // Don't reset redis to null here to allow for reconnection
      });
      
      redis.on('connect', () => {
        console.log('Redis connected successfully');
      });
      
      redis.on('ready', () => {
        console.log('Redis ready for commands');
      });
      
      redis.on('close', () => {
        console.log('Redis connection closed');
      });

      redis.on('reconnecting', (ms: number) => {
        console.log(`Redis reconnecting in ${ms}ms`);
      });

      redis.on('end', () => {
        console.log('Redis connection ended');
        redis = null; // Reset only when connection truly ends
      });
      
    } catch (error) {
      console.error('Failed to create Redis instance:', error);
      throw error;
    }
  }
  
  return redis;
}

/**
 * Get Redis publisher instance
 */
export function getRedisPub(): Redis {
  if (!redisPub) {
    redisPub = new Redis(redisConfig);
    
    redisPub.on('error', (error) => {
      console.error('Redis publisher error:', error);
    });
  }
  
  return redisPub;
}

/**
 * Get Redis subscriber instance
 */
export function getRedisSub(): Redis {
  if (!redisSub) {
    redisSub = new Redis(redisConfig);
    
    redisSub.on('error', (error) => {
      console.error('Redis subscriber error:', error);
    });
  }
  
  return redisSub;
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const redis = getRedis();
    // Don't call connect() explicitly as ioredis handles lazy connection
    const result = await redis.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
}

/**
 * Safe Redis operations with error handling
 */
export class RedisOperations {
  /**
   * Set a key with expiration (setex) with error handling
   */
  static async setex(key: string, seconds: number, value: string): Promise<boolean> {
    try {
      const redis = getRedis();
      const result = await redis.setex(key, seconds, value);
      return result === 'OK';
    } catch (error) {
      console.error(`Redis setex failed for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set a key-value pair with error handling
   */
  static async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      const redis = getRedis();
      let result;
      if (ttl) {
        result = await redis.setex(key, ttl, value);
      } else {
        result = await redis.set(key, value);
      }
      return result === 'OK';
    } catch (error) {
      console.error(`Redis set failed for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get a value by key with error handling
   */
  static async get(key: string): Promise<string | null> {
    try {
      const redis = getRedis();
      const result = await redis.get(key);
      return result;
    } catch (error) {
      console.error(`Redis get failed for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a key with error handling
   */
  static async del(key: string): Promise<boolean> {
    try {
      const redis = getRedis();
      const result = await redis.del(key);
      return result > 0;
    } catch (error) {
      console.error(`Redis del failed for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if a key exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const redis = getRedis();
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis exists failed for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment a key's value
   */
  static async incr(key: string, ttl?: number): Promise<number | null> {
    try {
      const redis = getRedis();
      const result = await redis.incr(key);
      if (ttl && result === 1) {
        // Set TTL only on first increment
        await redis.expire(key, ttl);
      }
      return result;
    } catch (error) {
      console.error(`Redis incr failed for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get TTL of a key
   */
  static async ttl(key: string): Promise<number | null> {
    try {
      const redis = getRedis();
      const result = await redis.ttl(key);
      return result;
    } catch (error) {
      console.error(`Redis ttl failed for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Execute multiple commands in a transaction
   */
  static async multi(commands: Array<[string, ...any[]]>): Promise<any[] | null> {
    try {
      const redis = getRedis();
      const pipeline = redis.multi();
      
      commands.forEach(([command, ...args]) => {
        (pipeline as any)[command](...args);
      });
      
      const results = await pipeline.exec();
      return results ? results.map(([err, result]) => {
        if (err) throw err;
        return result;
      }) : null;
    } catch (error) {
      console.error('Redis multi transaction failed:', error);
      return null;
    }
  }
}

/**
 * Close all Redis connections
 */
export async function closeRedisConnections(): Promise<void> {
  try {
    if (redis) {
      await redis.quit();
      redis = null;
    }
    if (redisPub) {
      await redisPub.quit();
      redisPub = null;
    }
    if (redisSub) {
      await redisSub.quit();
      redisSub = null;
    }
  } catch (error) {
    console.error('Error closing Redis connections:', error);
  }
}

/**
 * Redis key generators
 */
export const RedisKeys = {
  rateLimit: (identifier: string, window: string) => `rl:${identifier}:${window}`,
  apiKey: (keyId: string) => `api:${keyId}`,
  userSession: (userId: string) => `session:${userId}`,
  securityEvent: (eventId: string) => `security:${eventId}`,
  ipBlacklist: (ip: string) => `blacklist:${ip}`,
  ipWhitelist: (ip: string) => `whitelist:${ip}`,
  threatPattern: (patternId: string) => `threat:${patternId}`,
  abuseScore: (identifier: string) => `abuse:${identifier}`,
  ddosProtection: (ip: string) => `ddos:${ip}`,
  securityAlert: (alertId: string) => `alert:${alertId}`,
};

export default getRedis;