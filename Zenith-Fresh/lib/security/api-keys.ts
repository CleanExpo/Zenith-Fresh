import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import { prisma } from '../prisma';
import { getRedis, RedisKeys } from '../redis';

// API Key scopes and permissions
export const API_SCOPES = {
  // Website Analysis
  'website:analyze': 'Analyze website performance and SEO',
  'website:scan': 'Perform website security scans',
  'website:export': 'Export analysis reports',
  
  // Project Management
  'projects:read': 'Read project information',
  'projects:write': 'Create and modify projects',
  'projects:delete': 'Delete projects',
  
  // Team Management
  'teams:read': 'Read team information',
  'teams:write': 'Manage team members and settings',
  'teams:admin': 'Full team administration',
  
  // Analytics
  'analytics:read': 'Access analytics data',
  'analytics:export': 'Export analytics reports',
  
  // API Management
  'api:read': 'Read API usage statistics',
  'api:manage': 'Manage API keys and limits',
  
  // Admin
  'admin:users': 'Manage users',
  'admin:security': 'Access security features',
  'admin:system': 'System administration',
} as const;

export type APIScope = keyof typeof API_SCOPES;

// Default scopes by user tier
export const DEFAULT_SCOPES_BY_TIER = {
  free: ['website:analyze', 'projects:read', 'projects:write'] as APIScope[],
  pro: [
    'website:analyze', 'website:scan', 'website:export',
    'projects:read', 'projects:write', 'projects:delete',
    'analytics:read', 'api:read'
  ] as APIScope[],
  enterprise: [
    'website:analyze', 'website:scan', 'website:export',
    'projects:read', 'projects:write', 'projects:delete',
    'teams:read', 'teams:write',
    'analytics:read', 'analytics:export',
    'api:read', 'api:manage'
  ] as APIScope[],
  admin: Object.keys(API_SCOPES) as APIScope[],
};

export interface CreateAPIKeyOptions {
  userId: string;
  name: string;
  scopes?: APIScope[];
  rateLimit?: number;
  expiresAt?: Date;
}

export interface APIKeyInfo {
  id: string;
  name: string;
  keyPreview: string;
  scopes: APIScope[];
  rateLimit: number;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidateAPIKeyResult {
  valid: boolean;
  apiKey?: APIKeyInfo;
  userId?: string;
  error?: string;
}

/**
 * Generate a secure API key
 */
function generateAPIKey(): { key: string; hash: string; preview: string } {
  // Generate a secure random key
  const keyId = uuidv4().replace(/-/g, '');
  const keySecret = CryptoJS.lib.WordArray.random(32).toString();
  const fullKey = `ak_${keyId.substring(0, 8)}_${keySecret}`;
  
  // Hash the key for storage
  const hash = bcrypt.hashSync(fullKey, 12);
  
  // Create preview (first 12 characters + ...)
  const preview = `${fullKey.substring(0, 12)}...`;
  
  return { key: fullKey, hash, preview };
}

/**
 * Create a new API key
 */
export async function createAPIKey(options: CreateAPIKeyOptions): Promise<{ apiKey: APIKeyInfo; key: string }> {
  const { userId, name, scopes, rateLimit, expiresAt } = options;
  
  try {
    // Get user information to determine default scopes and rate limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true, role: true },
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const userTier = user.role === 'admin' ? 'admin' : (user.tier as keyof typeof DEFAULT_SCOPES_BY_TIER) || 'free';
    
    // Generate API key
    const { key, hash, preview } = generateAPIKey();
    
    // Determine scopes
    const finalScopes = scopes || DEFAULT_SCOPES_BY_TIER[userTier];
    
    // Validate scopes against user tier
    const allowedScopes = DEFAULT_SCOPES_BY_TIER[userTier];
    const validScopes = finalScopes.filter(scope => allowedScopes.includes(scope));
    
    if (validScopes.length === 0) {
      throw new Error('No valid scopes provided');
    }
    
    // Determine rate limit
    const defaultRateLimits = {
      free: 100,
      pro: 1000,
      enterprise: 10000,
      admin: 50000,
    };
    
    const finalRateLimit = rateLimit || defaultRateLimits[userTier];
    
    // Create API key in database
    const apiKeyRecord = await prisma.aPIKey.create({
      data: {
        name,
        keyHash: hash,
        keyPreview: preview,
        userId,
        scopes: validScopes,
        rateLimit: finalRateLimit,
        expiresAt,
        isActive: true,
      },
    });
    
    // Cache API key info in Redis for fast validation
    const redis = getRedis();
    const cacheData = {
      id: apiKeyRecord.id,
      userId: apiKeyRecord.userId,
      scopes: apiKeyRecord.scopes,
      rateLimit: apiKeyRecord.rateLimit,
      expiresAt: apiKeyRecord.expiresAt?.toISOString() || null,
      isActive: apiKeyRecord.isActive,
    };
    
    await redis.setex(RedisKeys.apiKey(apiKeyRecord.id), 3600, JSON.stringify(cacheData));
    
    const apiKeyInfo: APIKeyInfo = {
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      keyPreview: apiKeyRecord.keyPreview,
      scopes: apiKeyRecord.scopes as APIScope[],
      rateLimit: apiKeyRecord.rateLimit,
      expiresAt: apiKeyRecord.expiresAt,
      lastUsedAt: apiKeyRecord.lastUsedAt,
      isActive: apiKeyRecord.isActive,
      createdAt: apiKeyRecord.createdAt,
      updatedAt: apiKeyRecord.updatedAt,
    };
    
    return { apiKey: apiKeyInfo, key };
  } catch (error) {
    console.error('Error creating API key:', error);
    throw new Error('Failed to create API key');
  }
}

/**
 * Validate an API key
 */
export async function validateAPIKey(key: string): Promise<ValidateAPIKeyResult> {
  if (!key || !key.startsWith('ak_')) {
    return { valid: false, error: 'Invalid API key format' };
  }
  
  try {
    // Extract key ID from the key (first part after ak_)
    const keyParts = key.split('_');
    if (keyParts.length < 3) {
      return { valid: false, error: 'Invalid API key format' };
    }
    
    const keyId = keyParts[1];
    
    // Try to get from Redis cache first
    const redis = getRedis();
    let apiKeyData: any = null;
    
    try {
      const cached = await redis.get(RedisKeys.apiKey(keyId));
      if (cached) {
        apiKeyData = JSON.parse(cached);
      }
    } catch (redisError) {
      console.warn('Redis cache miss for API key validation');
    }
    
    // If not in cache, query database
    if (!apiKeyData) {
      const apiKeyRecord = await prisma.aPIKey.findFirst({
        where: {
          keyPreview: { startsWith: `ak_${keyId}` },
          isActive: true,
        },
      });
      
      if (!apiKeyRecord) {
        return { valid: false, error: 'API key not found' };
      }
      
      // Verify the full key against the stored hash
      const isValidKey = await bcrypt.compare(key, apiKeyRecord.keyHash);
      if (!isValidKey) {
        return { valid: false, error: 'Invalid API key' };
      }
      
      apiKeyData = {
        id: apiKeyRecord.id,
        userId: apiKeyRecord.userId,
        name: apiKeyRecord.name,
        keyPreview: apiKeyRecord.keyPreview,
        scopes: apiKeyRecord.scopes,
        rateLimit: apiKeyRecord.rateLimit,
        expiresAt: apiKeyRecord.expiresAt?.toISOString() || null,
        lastUsedAt: apiKeyRecord.lastUsedAt?.toISOString() || null,
        isActive: apiKeyRecord.isActive,
        createdAt: apiKeyRecord.createdAt.toISOString(),
        updatedAt: apiKeyRecord.updatedAt.toISOString(),
      };
      
      // Cache for future requests
      await redis.setex(RedisKeys.apiKey(keyId), 3600, JSON.stringify(apiKeyData));
    } else {
      // Still need to verify the key against the database hash for security
      const apiKeyRecord = await prisma.aPIKey.findUnique({
        where: { id: apiKeyData.id },
        select: { keyHash: true, isActive: true },
      });
      
      if (!apiKeyRecord || !apiKeyRecord.isActive) {
        return { valid: false, error: 'API key not found or inactive' };
      }
      
      const isValidKey = await bcrypt.compare(key, apiKeyRecord.keyHash);
      if (!isValidKey) {
        return { valid: false, error: 'Invalid API key' };
      }
    }
    
    // Check if key is expired
    if (apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date()) {
      return { valid: false, error: 'API key expired' };
    }
    
    if (!apiKeyData.isActive) {
      return { valid: false, error: 'API key inactive' };
    }
    
    // Update last used timestamp (async, don't wait)
    updateLastUsed(apiKeyData.id).catch(console.error);
    
    const apiKeyInfo: APIKeyInfo = {
      id: apiKeyData.id,
      name: apiKeyData.name,
      keyPreview: apiKeyData.keyPreview,
      scopes: apiKeyData.scopes,
      rateLimit: apiKeyData.rateLimit,
      expiresAt: apiKeyData.expiresAt ? new Date(apiKeyData.expiresAt) : null,
      lastUsedAt: apiKeyData.lastUsedAt ? new Date(apiKeyData.lastUsedAt) : null,
      isActive: apiKeyData.isActive,
      createdAt: new Date(apiKeyData.createdAt),
      updatedAt: new Date(apiKeyData.updatedAt),
    };
    
    return {
      valid: true,
      apiKey: apiKeyInfo,
      userId: apiKeyData.userId,
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return { valid: false, error: 'Internal server error' };
  }
}

/**
 * Check if API key has specific scope
 */
export function hasScope(apiKey: APIKeyInfo, requiredScope: APIScope): boolean {
  return apiKey.scopes.includes(requiredScope);
}

/**
 * Check if API key has any of the specified scopes
 */
export function hasAnyScope(apiKey: APIKeyInfo, requiredScopes: APIScope[]): boolean {
  return requiredScopes.some(scope => apiKey.scopes.includes(scope));
}

/**
 * Get user's API keys
 */
export async function getUserAPIKeys(userId: string): Promise<APIKeyInfo[]> {
  try {
    const apiKeys = await prisma.aPIKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    
    return apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      keyPreview: key.keyPreview,
      scopes: key.scopes as APIScope[],
      rateLimit: key.rateLimit,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      isActive: key.isActive,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }));
  } catch (error) {
    console.error('Error getting user API keys:', error);
    return [];
  }
}

/**
 * Revoke an API key
 */
export async function revokeAPIKey(keyId: string, userId: string): Promise<boolean> {
  try {
    const result = await prisma.aPIKey.updateMany({
      where: {
        id: keyId,
        userId: userId,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
    
    if (result.count > 0) {
      // Remove from Redis cache
      const redis = getRedis();
      await redis.del(RedisKeys.apiKey(keyId));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error revoking API key:', error);
    return false;
  }
}

/**
 * Update API key scopes (admin only)
 */
export async function updateAPIKeyScopes(keyId: string, scopes: APIScope[], adminUserId: string): Promise<boolean> {
  try {
    // Verify admin has admin privileges
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { role: true },
    });
    
    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Insufficient privileges');
    }
    
    const result = await prisma.aPIKey.update({
      where: { id: keyId },
      data: {
        scopes: scopes,
        updatedAt: new Date(),
      },
    });
    
    // Clear Redis cache
    const redis = getRedis();
    await redis.del(RedisKeys.apiKey(keyId));
    
    return !!result;
  } catch (error) {
    console.error('Error updating API key scopes:', error);
    return false;
  }
}

/**
 * Get API key usage statistics
 */
export async function getAPIKeyUsage(keyId: string, days: number = 30): Promise<any> {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    // This would typically integrate with your usage tracking system
    // For now, return basic info from security events
    const usage = await prisma.securityEvent.findMany({
      where: {
        apiKeyId: keyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        type: true,
        createdAt: true,
        details: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return {
      totalRequests: usage.length,
      dailyUsage: usage.reduce((acc, event) => {
        const date = event.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      eventTypes: usage.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  } catch (error) {
    console.error('Error getting API key usage:', error);
    return { totalRequests: 0, dailyUsage: {}, eventTypes: {} };
  }
}

/**
 * Update last used timestamp (internal function)
 */
async function updateLastUsed(keyId: string): Promise<void> {
  try {
    await prisma.aPIKey.update({
      where: { id: keyId },
      data: { lastUsedAt: new Date() },
    });
  } catch (error) {
    console.error('Error updating last used timestamp:', error);
  }
}