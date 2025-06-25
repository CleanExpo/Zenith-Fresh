import { prisma } from '../prisma';
import { getRedis, RedisKeys } from '../redis';
import { logSecurityEvent } from './audit-logger';

// CIDR utility functions
function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

function parseCIDR(cidr: string): { network: number; mask: number } | null {
  const [ip, prefixLength] = cidr.split('/');
  if (!ip || !prefixLength) return null;
  
  const network = ipToNumber(ip);
  const mask = (0xffffffff << (32 - parseInt(prefixLength))) >>> 0;
  
  return { network: network & mask, mask };
}

function isIPInRange(ip: string, cidr: string): boolean {
  const range = parseCIDR(cidr);
  if (!range) return false;
  
  const ipNum = ipToNumber(ip);
  return (ipNum & range.mask) === range.network;
}

/**
 * Check if IP is whitelisted
 */
export async function isIPWhitelisted(ip: string): Promise<boolean> {
  try {
    // Check Redis cache first
    const redis = getRedis();
    const cacheKey = RedisKeys.ipWhitelist(ip);
    const cached = await redis.get(cacheKey);
    
    if (cached === 'true') return true;
    if (cached === 'false') return false;
    
    // Check database for exact IP match
    let whitelisted = await prisma.iPWhitelist.findFirst({
      where: {
        ipAddress: ip,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
    
    // If no exact match, check IP ranges
    if (!whitelisted) {
      const ranges = await prisma.iPWhitelist.findMany({
        where: {
          ipRange: { not: null },
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        select: { ipRange: true },
      });
      
      for (const range of ranges) {
        if (range.ipRange && isIPInRange(ip, range.ipRange)) {
          whitelisted = range as any;
          break;
        }
      }
    }
    
    const result = !!whitelisted;
    
    // Cache result for 5 minutes
    await redis.setex(cacheKey, 300, result.toString());
    
    return result;
  } catch (error) {
    console.error('Error checking IP whitelist:', error);
    return false;
  }
}

/**
 * Check if IP is blacklisted
 */
export async function isIPBlacklisted(ip: string): Promise<{ blacklisted: boolean; reason?: string; severity?: string }> {
  try {
    // Check Redis cache first
    const redis = getRedis();
    const cacheKey = RedisKeys.ipBlacklist(ip);
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      const data = JSON.parse(cached);
      return data;
    }
    
    // Check database for exact IP match
    let blacklisted = await prisma.iPBlacklist.findFirst({
      where: {
        ipAddress: ip,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      select: {
        reason: true,
        severity: true,
        autoBlocked: true,
      },
    });
    
    // If no exact match, check IP ranges
    if (!blacklisted) {
      const ranges = await prisma.iPBlacklist.findMany({
        where: {
          ipRange: { not: null },
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        select: { ipRange: true, reason: true, severity: true, autoBlocked: true },
      });
      
      for (const range of ranges) {
        if (range.ipRange && isIPInRange(ip, range.ipRange)) {
          blacklisted = range;
          break;
        }
      }
    }
    
    const result = blacklisted ? {
      blacklisted: true,
      reason: blacklisted.reason,
      severity: blacklisted.severity,
    } : { blacklisted: false };
    
    // Cache result for 1 minute (shorter for security)
    await redis.setex(cacheKey, 60, JSON.stringify(result));
    
    return result;
  } catch (error) {
    console.error('Error checking IP blacklist:', error);
    return { blacklisted: false };
  }
}

/**
 * Add IP to whitelist
 */
export async function addIPToWhitelist(
  ip: string,
  description?: string,
  userId?: string,
  expiresAt?: Date
): Promise<boolean> {
  try {
    await prisma.iPWhitelist.create({
      data: {
        ipAddress: ip,
        description,
        userId,
        expiresAt,
        isActive: true,
      },
    });
    
    // Clear cache
    const redis = getRedis();
    await redis.del(RedisKeys.ipWhitelist(ip));
    
    // Log security event
    await logSecurityEvent({
      type: 'IP_WHITELISTED',
      severity: 'LOW',
      sourceIp: ip,
      userId: userId || undefined,
      details: {
        ip,
        description,
        action: 'added_to_whitelist',
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error adding IP to whitelist:', error);
    return false;
  }
}

/**
 * Add IP to blacklist
 */
export async function addIPToBlacklist(
  ip: string,
  reason: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM',
  autoBlocked: boolean = false,
  expiresAt?: Date
): Promise<boolean> {
  try {
    await prisma.iPBlacklist.create({
      data: {
        ipAddress: ip,
        reason,
        severity,
        autoBlocked,
        expiresAt,
        isActive: true,
      },
    });
    
    // Clear cache
    const redis = getRedis();
    await redis.del(RedisKeys.ipBlacklist(ip));
    
    // Log security event
    await logSecurityEvent({
      type: 'IP_BLACKLISTED',
      severity,
      sourceIp: ip,
      details: {
        ip,
        reason,
        severity,
        autoBlocked,
        action: 'added_to_blacklist',
      },
      blocked: true,
    });
    
    return true;
  } catch (error) {
    console.error('Error adding IP to blacklist:', error);
    return false;
  }
}

/**
 * Remove IP from whitelist
 */
export async function removeIPFromWhitelist(ip: string, userId?: string): Promise<boolean> {
  try {
    const result = await prisma.iPWhitelist.updateMany({
      where: { ipAddress: ip },
      data: { isActive: false },
    });
    
    if (result.count > 0) {
      // Clear cache
      const redis = getRedis();
      await redis.del(RedisKeys.ipWhitelist(ip));
      
      // Log security event
      await logSecurityEvent({
        type: 'IP_WHITELIST_REMOVED',
        severity: 'LOW',
        sourceIp: ip,
        userId: userId || undefined,
        details: {
          ip,
          action: 'removed_from_whitelist',
        },
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error removing IP from whitelist:', error);
    return false;
  }
}

/**
 * Remove IP from blacklist
 */
export async function removeIPFromBlacklist(ip: string, userId?: string): Promise<boolean> {
  try {
    const result = await prisma.iPBlacklist.updateMany({
      where: { ipAddress: ip },
      data: { isActive: false },
    });
    
    if (result.count > 0) {
      // Clear cache
      const redis = getRedis();
      await redis.del(RedisKeys.ipBlacklist(ip));
      
      // Log security event
      await logSecurityEvent({
        type: 'IP_BLACKLIST_REMOVED',
        severity: 'LOW',
        sourceIp: ip,
        userId: userId || undefined,
        details: {
          ip,
          action: 'removed_from_blacklist',
        },
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error removing IP from blacklist:', error);
    return false;
  }
}

/**
 * Add IP range to whitelist
 */
export async function addIPRangeToWhitelist(
  cidr: string,
  description?: string,
  userId?: string,
  expiresAt?: Date
): Promise<boolean> {
  try {
    // Validate CIDR format
    if (!parseCIDR(cidr)) {
      throw new Error('Invalid CIDR format');
    }
    
    await prisma.iPWhitelist.create({
      data: {
        ipAddress: cidr.split('/')[0], // Store base IP
        ipRange: cidr,
        description,
        userId,
        expiresAt,
        isActive: true,
      },
    });
    
    // Log security event
    await logSecurityEvent({
      type: 'IP_RANGE_WHITELISTED',
      severity: 'LOW',
      sourceIp: cidr.split('/')[0],
      userId: userId || undefined,
      details: {
        cidr,
        description,
        action: 'added_range_to_whitelist',
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error adding IP range to whitelist:', error);
    return false;
  }
}

/**
 * Add IP range to blacklist
 */
export async function addIPRangeToBlacklist(
  cidr: string,
  reason: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM',
  autoBlocked: boolean = false,
  expiresAt?: Date
): Promise<boolean> {
  try {
    // Validate CIDR format
    if (!parseCIDR(cidr)) {
      throw new Error('Invalid CIDR format');
    }
    
    await prisma.iPBlacklist.create({
      data: {
        ipAddress: cidr.split('/')[0], // Store base IP
        ipRange: cidr,
        reason,
        severity,
        autoBlocked,
        expiresAt,
        isActive: true,
      },
    });
    
    // Log security event
    await logSecurityEvent({
      type: 'IP_RANGE_BLACKLISTED',
      severity,
      sourceIp: cidr.split('/')[0],
      details: {
        cidr,
        reason,
        severity,
        autoBlocked,
        action: 'added_range_to_blacklist',
      },
      blocked: true,
    });
    
    return true;
  } catch (error) {
    console.error('Error adding IP range to blacklist:', error);
    return false;
  }
}

/**
 * Get whitelist entries
 */
export async function getWhitelistEntries(limit: number = 100): Promise<any[]> {
  try {
    return await prisma.iPWhitelist.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  } catch (error) {
    console.error('Error getting whitelist entries:', error);
    return [];
  }
}

/**
 * Get blacklist entries
 */
export async function getBlacklistEntries(limit: number = 100): Promise<any[]> {
  try {
    return await prisma.iPBlacklist.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('Error getting blacklist entries:', error);
    return [];
  }
}

/**
 * Auto-block suspicious IP based on patterns
 */
export async function autoBlockSuspiciousIP(
  ip: string,
  reason: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  duration: number = 3600 // 1 hour default
): Promise<boolean> {
  try {
    // Check if IP is already blacklisted
    const existing = await isIPBlacklisted(ip);
    if (existing.blacklisted) {
      return false; // Already blacklisted
    }
    
    // Check if IP is whitelisted (don't auto-block whitelisted IPs)
    const whitelisted = await isIPWhitelisted(ip);
    if (whitelisted) {
      // Log the attempt but don't block
      await logSecurityEvent({
        type: 'AUTO_BLOCK_PREVENTED',
        severity: 'MEDIUM',
        sourceIp: ip,
        details: {
          ip,
          reason: 'IP is whitelisted',
          originalReason: reason,
          originalSeverity: severity,
        },
      });
      return false;
    }
    
    const expiresAt = new Date(Date.now() + duration * 1000);
    
    return await addIPToBlacklist(
      ip,
      `Auto-blocked: ${reason}`,
      severity,
      true,
      expiresAt
    );
  } catch (error) {
    console.error('Error auto-blocking suspicious IP:', error);
    return false;
  }
}

/**
 * Check if IP should be auto-blocked based on request patterns
 */
export async function analyzeIPBehavior(ip: string): Promise<{
  shouldBlock: boolean;
  reason?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}> {
  try {
    const redis = getRedis();
    const now = Date.now();
    const windowMinutes = 10;
    const windowMs = windowMinutes * 60 * 1000;
    
    // Get recent security events for this IP
    const events = await prisma.securityEvent.findMany({
      where: {
        sourceIp: ip,
        createdAt: { gte: new Date(now - windowMs) },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    
    // Analysis patterns
    const rateLimit = events.filter(e => e.type === 'RATE_LIMIT_EXCEEDED').length;
    const suspiciousActivity = events.filter(e => e.type === 'SUSPICIOUS_ACTIVITY').length;
    const failedAuth = events.filter(e => e.type === 'FAILED_AUTHENTICATION').length;
    const sqlInjection = events.filter(e => e.type === 'SQL_INJECTION_ATTEMPT').length;
    const xss = events.filter(e => e.type === 'XSS_ATTEMPT').length;
    
    // Decision logic
    if (sqlInjection > 0 || xss > 0) {
      return {
        shouldBlock: true,
        reason: 'SQL injection or XSS attempt detected',
        severity: 'CRITICAL',
      };
    }
    
    if (rateLimit > 20) {
      return {
        shouldBlock: true,
        reason: 'Excessive rate limit violations',
        severity: 'HIGH',
      };
    }
    
    if (failedAuth > 10) {
      return {
        shouldBlock: true,
        reason: 'Brute force authentication attempts',
        severity: 'HIGH',
      };
    }
    
    if (suspiciousActivity > 5) {
      return {
        shouldBlock: true,
        reason: 'Multiple suspicious activities detected',
        severity: 'MEDIUM',
      };
    }
    
    return { shouldBlock: false };
  } catch (error) {
    console.error('Error analyzing IP behavior:', error);
    return { shouldBlock: false };
  }
}

/**
 * Clean up expired entries
 */
export async function cleanupExpiredEntries(): Promise<void> {
  try {
    const now = new Date();
    
    // Deactivate expired whitelist entries
    await prisma.iPWhitelist.updateMany({
      where: {
        expiresAt: { lt: now },
        isActive: true,
      },
      data: { isActive: false },
    });
    
    // Deactivate expired blacklist entries
    await prisma.iPBlacklist.updateMany({
      where: {
        expiresAt: { lt: now },
        isActive: true,
      },
      data: { isActive: false },
    });
    
    console.log('Cleaned up expired IP filtering entries');
  } catch (error) {
    console.error('Error cleaning up expired entries:', error);
  }
}