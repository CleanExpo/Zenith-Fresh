/**
 * Redis Usage Examples
 * Demonstrates how to use the fixed Redis client with proper error handling
 */

import { RedisOperations, RedisKeys } from './redis';

/**
 * Example: Rate Limiting Implementation
 */
export async function checkRateLimit(userId: string, window: number = 60, limit: number = 10): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
}> {
  const key = RedisKeys.rateLimit(userId, `window_${window}`);
  
  // Increment the counter and set TTL if it's the first request
  const count = await RedisOperations.incr(key, window);
  
  if (count === null) {
    // Redis error occurred, allow request but log the issue
    console.error('Rate limiting Redis error - allowing request');
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: Date.now() + (window * 1000)
    };
  }
  
  const remaining = Math.max(0, limit - count);
  const resetTime = Date.now() + (window * 1000);
  
  return {
    allowed: count <= limit,
    remaining,
    resetTime
  };
}

/**
 * Example: Session Management
 */
export async function storeUserSession(userId: string, sessionData: any, ttl: number = 3600): Promise<boolean> {
  const key = RedisKeys.userSession(userId);
  const sessionJson = JSON.stringify(sessionData);
  
  return await RedisOperations.setex(key, ttl, sessionJson);
}

export async function getUserSession(userId: string): Promise<any | null> {
  const key = RedisKeys.userSession(userId);
  const sessionJson = await RedisOperations.get(key);
  
  if (!sessionJson) {
    return null;
  }
  
  try {
    return JSON.parse(sessionJson);
  } catch (error) {
    console.error('Failed to parse session data:', error);
    // Clean up corrupted session
    await RedisOperations.del(key);
    return null;
  }
}

/**
 * Example: API Key Caching
 */
export async function cacheApiKey(keyId: string, keyData: any, ttl: number = 3600): Promise<boolean> {
  const key = RedisKeys.apiKey(keyId);
  const keyJson = JSON.stringify(keyData);
  
  return await RedisOperations.setex(key, ttl, keyJson);
}

export async function getCachedApiKey(keyId: string): Promise<any | null> {
  const key = RedisKeys.apiKey(keyId);
  const keyJson = await RedisOperations.get(key);
  
  if (!keyJson) {
    return null;
  }
  
  try {
    return JSON.parse(keyJson);
  } catch (error) {
    console.error('Failed to parse API key data:', error);
    await RedisOperations.del(key);
    return null;
  }
}

/**
 * Example: Security Event Logging
 */
export async function logSecurityEvent(eventId: string, eventData: any, ttl: number = 86400): Promise<boolean> {
  const key = RedisKeys.securityEvent(eventId);
  const eventJson = JSON.stringify({
    ...eventData,
    timestamp: new Date().toISOString(),
    id: eventId
  });
  
  return await RedisOperations.setex(key, ttl, eventJson);
}

/**
 * Example: DDoS Protection
 */
export async function checkDDoSProtection(ip: string, window: number = 60, threshold: number = 100): Promise<{
  blocked: boolean;
  requestCount: number;
  remaining: number;
}> {
  const key = RedisKeys.ddosProtection(ip);
  
  const count = await RedisOperations.incr(key, window);
  
  if (count === null) {
    // Redis error - allow request but log
    console.error('DDoS protection Redis error - allowing request');
    return {
      blocked: false,
      requestCount: 1,
      remaining: threshold - 1
    };
  }
  
  const remaining = Math.max(0, threshold - count);
  
  return {
    blocked: count > threshold,
    requestCount: count,
    remaining
  };
}

/**
 * Example: IP Blacklist Management
 */
export async function addToBlacklist(ip: string, ttl: number = 3600): Promise<boolean> {
  const key = RedisKeys.ipBlacklist(ip);
  return await RedisOperations.setex(key, ttl, 'blocked');
}

export async function isBlacklisted(ip: string): Promise<boolean> {
  const key = RedisKeys.ipBlacklist(ip);
  return await RedisOperations.exists(key);
}

export async function removeFromBlacklist(ip: string): Promise<boolean> {
  const key = RedisKeys.ipBlacklist(ip);
  return await RedisOperations.del(key);
}

/**
 * Example: Abuse Score Tracking
 */
export async function updateAbuseScore(identifier: string, increment: number = 1, ttl: number = 3600): Promise<number | null> {
  const key = RedisKeys.abuseScore(identifier);
  
  // Use multi transaction to increment and set TTL
  const result = await RedisOperations.multi([
    ['incr', key],
    ['expire', key, ttl]
  ]);
  
  return result ? result[0] : null;
}

export async function getAbuseScore(identifier: string): Promise<number> {
  const key = RedisKeys.abuseScore(identifier);
  const score = await RedisOperations.get(key);
  return score ? parseInt(score, 10) : 0;
}

/**
 * Example: Bulk Operations
 */
export async function bulkCacheOperations(operations: Array<{
  action: 'set' | 'get' | 'del';
  key: string;
  value?: string;
  ttl?: number;
}>): Promise<any[]> {
  const commands: Array<[string, ...any[]]> = [];
  
  for (const op of operations) {
    switch (op.action) {
      case 'set':
        if (op.ttl) {
          commands.push(['setex', op.key, op.ttl, op.value]);
        } else {
          commands.push(['set', op.key, op.value]);
        }
        break;
      case 'get':
        commands.push(['get', op.key]);
        break;
      case 'del':
        commands.push(['del', op.key]);
        break;
    }
  }
  
  return await RedisOperations.multi(commands) || [];
}

/**
 * Export all utility functions
 */
export const RedisUtils = {
  // Rate limiting
  checkRateLimit,
  
  // Session management
  storeUserSession,
  getUserSession,
  
  // API key caching
  cacheApiKey,
  getCachedApiKey,
  
  // Security
  logSecurityEvent,
  checkDDoSProtection,
  addToBlacklist,
  isBlacklisted,
  removeFromBlacklist,
  updateAbuseScore,
  getAbuseScore,
  
  // Bulk operations
  bulkCacheOperations
};