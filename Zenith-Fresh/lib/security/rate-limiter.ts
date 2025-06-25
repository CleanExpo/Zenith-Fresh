import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { getRedis, RedisKeys } from '../redis';
import { prisma } from '../prisma';

// Rate limit configurations by user tier
export const RATE_LIMIT_CONFIGS = {
  free: {
    api: { points: 100, duration: 3600 }, // 100 requests per hour
    websiteAnalysis: { points: 10, duration: 3600 }, // 10 analyses per hour
    export: { points: 5, duration: 3600 }, // 5 exports per hour
  },
  pro: {
    api: { points: 1000, duration: 3600 }, // 1000 requests per hour
    websiteAnalysis: { points: 100, duration: 3600 }, // 100 analyses per hour
    export: { points: 50, duration: 3600 }, // 50 exports per hour
  },
  enterprise: {
    api: { points: 10000, duration: 3600 }, // 10000 requests per hour
    websiteAnalysis: { points: 1000, duration: 3600 }, // 1000 analyses per hour
    export: { points: 500, duration: 3600 }, // 500 exports per hour
  },
  admin: {
    api: { points: 50000, duration: 3600 }, // 50000 requests per hour
    websiteAnalysis: { points: 5000, duration: 3600 }, // 5000 analyses per hour
    export: { points: 2500, duration: 3600 }, // 2500 exports per hour
  }
};

// Global rate limiters for different types
const globalRateLimiters = new Map<string, RateLimiterRedis | RateLimiterMemory>();

/**
 * Get or create rate limiter for specific configuration
 */
function getRateLimiter(key: string, config: { points: number; duration: number }): RateLimiterRedis | RateLimiterMemory {
  if (!globalRateLimiters.has(key)) {
    try {
      const redis = getRedis();
      const limiter = new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: `rl:${key}`,
        points: config.points,
        duration: config.duration,
        blockDuration: config.duration,
        execEvenly: true,
      });
      globalRateLimiters.set(key, limiter);
    } catch (error) {
      console.error('Failed to create Redis rate limiter, falling back to memory:', error);
      // Fallback to memory-based rate limiter
      const limiter = new RateLimiterMemory({
        keyPrefix: `rl:${key}`,
        points: config.points,
        duration: config.duration,
        blockDuration: config.duration,
        execEvenly: true,
      });
      globalRateLimiters.set(key, limiter);
    }
  }
  
  return globalRateLimiters.get(key)!;
}

/**
 * Advanced rate limiting interface
 */
export interface RateLimitOptions {
  identifier: string; // IP, user ID, or API key
  type: 'api' | 'websiteAnalysis' | 'export' | 'custom';
  tier?: 'free' | 'pro' | 'enterprise' | 'admin';
  customConfig?: { points: number; duration: number };
  skipIfWhitelisted?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  tier: string;
  used: number;
  total: number;
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { identifier, type, tier = 'free', customConfig, skipIfWhitelisted = true } = options;
  
  try {
    // Check if IP/user is whitelisted (skip rate limiting)
    if (skipIfWhitelisted && await isWhitelisted(identifier)) {
      return {
        allowed: true,
        remaining: 999999,
        resetTime: new Date(Date.now() + 3600000),
        tier: 'whitelisted',
        used: 0,
        total: 999999,
      };
    }
    
    // Check if IP/user is blacklisted (deny immediately)
    if (await isBlacklisted(identifier)) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 3600000),
        retryAfter: 3600,
        tier: 'blacklisted',
        used: 999999,
        total: 0,
      };
    }
    
    // Get rate limit configuration
    const config = customConfig || RATE_LIMIT_CONFIGS[tier]?.[type] || RATE_LIMIT_CONFIGS.free[type];
    
    if (!config) {
      throw new Error(`No rate limit configuration found for type: ${type}`);
    }
    
    // Get rate limiter
    const rateLimiter = getRateLimiter(`${tier}:${type}`, config);
    
    try {
      // Attempt to consume a point
      const result = await rateLimiter.consume(identifier);
      
      return {
        allowed: true,
        remaining: result.remainingPoints || 0,
        resetTime: new Date(result.msBeforeNext + Date.now()),
        tier,
        used: config.points - (result.remainingPoints || 0),
        total: config.points,
      };
    } catch (rateLimiterRes) {
      // Rate limit exceeded
      const res = rateLimiterRes as RateLimiterRes;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(res.msBeforeNext + Date.now()),
        retryAfter: Math.ceil(res.msBeforeNext / 1000),
        tier,
        used: config.points,
        total: config.points,
      };
    }
  } catch (error) {
    console.error('Rate limit check error:', error);
    
    // Fail-safe: allow request if rate limiting fails
    return {
      allowed: true,
      remaining: 1,
      resetTime: new Date(Date.now() + 3600000),
      tier: 'error',
      used: 0,
      total: 1,
    };
  }
}

/**
 * Get user's tier from database
 */
export async function getUserTier(userId: string): Promise<'free' | 'pro' | 'enterprise' | 'admin'> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true, role: true },
    });
    
    if (!user) return 'free';
    
    // Admin role overrides tier
    if (user.role === 'admin') return 'admin';
    
    return (user.tier as 'free' | 'pro' | 'enterprise') || 'free';
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'free';
  }
}

/**
 * Check if identifier is whitelisted
 */
async function isWhitelisted(identifier: string): Promise<boolean> {
  try {
    // Check Redis cache first
    const redis = getRedis();
    const cached = await redis.get(RedisKeys.ipWhitelist(identifier));
    if (cached === 'true') return true;
    if (cached === 'false') return false;
    
    // Check database
    const whitelisted = await prisma.iPWhitelist.findFirst({
      where: {
        OR: [
          { ipAddress: identifier },
          { ipRange: { contains: identifier } },
        ],
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
    
    const result = !!whitelisted;
    
    // Cache result for 5 minutes
    await redis.setex(RedisKeys.ipWhitelist(identifier), 300, result.toString());
    
    return result;
  } catch (error) {
    console.error('Error checking whitelist:', error);
    return false;
  }
}

/**
 * Check if identifier is blacklisted
 */
async function isBlacklisted(identifier: string): Promise<boolean> {
  try {
    // Check Redis cache first
    const redis = getRedis();
    const cached = await redis.get(RedisKeys.ipBlacklist(identifier));
    if (cached === 'true') return true;
    if (cached === 'false') return false;
    
    // Check database
    const blacklisted = await prisma.iPBlacklist.findFirst({
      where: {
        OR: [
          { ipAddress: identifier },
          { ipRange: { contains: identifier } },
        ],
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
    
    const result = !!blacklisted;
    
    // Cache result for 1 minute (shorter cache for security)
    await redis.setex(RedisKeys.ipBlacklist(identifier), 60, result.toString());
    
    return result;
  } catch (error) {
    console.error('Error checking blacklist:', error);
    return false;
  }
}

/**
 * Create custom rate limit configuration
 */
export async function createCustomRateLimit(
  userId: string,
  endpoint: string,
  requests: number,
  window: number
): Promise<void> {
  await prisma.rateLimitConfig.upsert({
    where: {
      userId_endpoint: {
        userId,
        endpoint,
      },
    },
    update: {
      requests,
      window,
      isActive: true,
      updatedAt: new Date(),
    },
    create: {
      userId,
      endpoint,
      requests,
      window,
      isActive: true,
    },
  });
}

/**
 * Get custom rate limit configuration
 */
export async function getCustomRateLimit(
  userId: string,
  endpoint: string
): Promise<{ points: number; duration: number } | null> {
  try {
    const config = await prisma.rateLimitConfig.findUnique({
      where: {
        userId_endpoint: {
          userId,
          endpoint,
        },
        isActive: true,
      },
    });
    
    if (!config) return null;
    
    return {
      points: config.requests,
      duration: config.window,
    };
  } catch (error) {
    console.error('Error getting custom rate limit:', error);
    return null;
  }
}

/**
 * Clear rate limit for identifier (admin function)
 */
export async function clearRateLimit(identifier: string, type?: string): Promise<void> {
  try {
    const redis = getRedis();
    
    if (type) {
      // Clear specific type
      const keys = await redis.keys(`rl:*:${type}:${identifier}`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      // Clear all rate limits for identifier
      const keys = await redis.keys(`rl:*:${identifier}`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch (error) {
    console.error('Error clearing rate limit:', error);
  }
}

/**
 * Get rate limit status for identifier
 */
export async function getRateLimitStatus(
  identifier: string,
  type: string,
  tier: string = 'free'
): Promise<{ used: number; remaining: number; resetTime: Date } | null> {
  try {
    const config = RATE_LIMIT_CONFIGS[tier as keyof typeof RATE_LIMIT_CONFIGS]?.[type as keyof typeof RATE_LIMIT_CONFIGS.free];
    if (!config) return null;
    
    const rateLimiter = getRateLimiter(`${tier}:${type}`, config);
    const result = await rateLimiter.get(identifier);
    
    if (!result) {
      return {
        used: 0,
        remaining: config.points,
        resetTime: new Date(Date.now() + config.duration * 1000),
      };
    }
    
    return {
      used: config.points - (result.remainingPoints || 0),
      remaining: result.remainingPoints || 0,
      resetTime: new Date(result.msBeforeNext + Date.now()),
    };
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return null;
  }
}