import Redis from 'ioredis';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// Create Redis instances
let redis: Redis | null = null;
let redisPub: Redis | null = null;
let redisSub: Redis | null = null;

/**
 * Get main Redis instance
 */
export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(redisConfig);
    
    redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
    
    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
    
    redis.on('close', () => {
      console.log('Redis connection closed');
    });
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
    const result = await redis.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
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