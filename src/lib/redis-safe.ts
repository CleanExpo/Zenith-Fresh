// Redis connection with build-safe fallbacks
let redis: any = null;

try {
  if (process.env.REDIS_URL && typeof window === 'undefined') {
    const Redis = require('ioredis');
    redis = new Redis(process.env.REDIS_URL, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 1000,
      commandTimeout: 1000,
    });
    
    redis.on('error', (error: any) => {
      console.warn('Redis connection error (using fallback):', error.message);
      redis = null;
    });
  }
} catch (error) {
  console.warn('Redis not available, using memory fallback');
  redis = null;
}

export { redis };

// Rate limiting fallback when Redis is unavailable
const memoryStore = new Map();

export function rateLimit(key: string, limit: number, window: number) {
  if (redis) {
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
