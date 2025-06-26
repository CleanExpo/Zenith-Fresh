import Redis from 'ioredis';

// Create Redis connection with graceful fallback
function createRedisConnection() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    lazyConnect: true,
    connectTimeout: 10000,
  });

  redis.on('error', (error) => {
    // Only log errors in production/runtime, not during build
    if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_URL || process.env.RAILWAY_ENVIRONMENT) {
      console.error('Redis connection error:', error.message);
    }
  });

  redis.on('connect', () => {
    console.log('Connected to Redis');
  });

  redis.on('ready', () => {
    console.log('Redis is ready');
  });

  redis.on('close', () => {
    console.log('Redis connection closed');
  });

  return redis;
}

const redis = createRedisConnection();

export default redis;