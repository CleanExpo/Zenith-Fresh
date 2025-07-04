// Redis connection with build-safe fallbacks
import { createClient } from 'redis';

const isRedisEnabled = process.env.REDIS_URL && process.env.NODE_ENV !== 'development';

let redis: any = null;
let isRedisAvailable = false;

async function initRedisSafe() {
  if (!isRedisEnabled) return;
  try {
    redis = createClient({ url: process.env.REDIS_URL });
    redis.on('error', (err: any) => {
      console.warn('⚠️ Redis error:', err.message);
      isRedisAvailable = false;
    });
    await redis.connect();
    isRedisAvailable = true;
    console.log('✅ Connected to Redis');
  } catch (err: any) {
    console.warn('🚫 Redis connection failed:', err.message);
    redis = null;
    isRedisAvailable = false;
  }
}

export { redis };

// Rate limiting fallback when Redis is unavailable
const memoryStore = new Map();

export function rateLimit(key: string, limit: number, window: number) {
  if (isRedisAvailable && redis) {
    // Use Redis for distributed rate limiting
    return redis.incr(key).then((count: number) => {
      if (count === 1) {
        redis.expire(key, window);
      }
      return count <= limit;
    }).catch(() => true); // Allow on Redis errors
  }
  
  // Memory fallback for development/build
  const now = Date.now();
  const windowStart = Math.floor(now / (window * 1000)) * (window * 1000);
  const memKey = `${key}:${windowStart}`;
  
  const current = memoryStore.get(memKey) || 0;
  memoryStore.set(memKey, current + 1);
  
  // Clean old entries
  setTimeout(() => memoryStore.delete(memKey), window * 1000);
  
  return current < limit;
}