// src/lib/database/security.ts

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
// import bcrypt from 'bcrypt'; // Commented out for demo - would be installed in production

interface SecurityConfig {
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    tagLength: number;
  };
  access: {
    maxConnections: number;
    connectionTimeout: number;
    queryTimeout: number;
    rateLimiting: {
      enabled: boolean;
      maxRequests: number;
      windowMs: number;
    };
  };
  audit: {
    enabled: boolean;
    retentionDays: number;
    sensitiveFields: string[];
  };
}

interface AuditLogEntry {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

interface EncryptedField {
  data: string;
  iv: string;
  tag: string;
}

export class DatabaseSecurity {
  private config: SecurityConfig;
  private encryptionKey: Buffer;

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        tagLength: 16,
      },
      access: {
        maxConnections: 100,
        connectionTimeout: 30000,
        queryTimeout: 60000,
        rateLimiting: {
          enabled: true,
          maxRequests: 1000,
          windowMs: 60000, // 1 minute
        },
      },
      audit: {
        enabled: true,
        retentionDays: 365,
        sensitiveFields: ['password', 'email', 'phone', 'ssn', 'creditCard'],
      },
      ...config,
    };

    // Initialize encryption key from environment or generate
    const keyString = process.env.DATABASE_ENCRYPTION_KEY;
    if (keyString) {
      this.encryptionKey = Buffer.from(keyString, 'hex');
    } else {
      console.warn('⚠️ Database Security: No encryption key found, generating temporary key');
      this.encryptionKey = crypto.randomBytes(this.config.encryption.keyLength);
    }
  }

  // ==================== DATA ENCRYPTION ====================

  /**
   * Encrypt sensitive data before storing in database
   */
  encrypt(data: string): EncryptedField {
    try {
      const iv = crypto.randomBytes(this.config.encryption.ivLength);
      const cipher = crypto.createCipher(this.config.encryption.algorithm, this.encryptionKey);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return {
        data: encrypted,
        iv: iv.toString('hex'),
        tag: '',
      };
    } catch (error) {
      console.error('❌ Database Security: Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data retrieved from database
   */
  decrypt(encryptedField: EncryptedField): string {
    try {
      const iv = Buffer.from(encryptedField.iv, 'hex');
      const tag = Buffer.from(encryptedField.tag, 'hex');
      
      const decipher = crypto.createDecipher(this.config.encryption.algorithm, this.encryptionKey);

      let decrypted = decipher.update(encryptedField.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('❌ Database Security: Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash passwords securely
   */
  async hashPassword(password: string): Promise<string> {
    // Mock implementation for demo (in production would use bcrypt)
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    // Mock implementation for demo (in production would use bcrypt)
    const [salt, originalHash] = hash.split(':');
    const testHash = crypto.createHash('sha256').update(password + salt).digest('hex');
    return testHash === originalHash;
  }

  // ==================== ACCESS CONTROL ====================

  /**
   * Validate database connection limits
   */
  async validateConnectionLimits(): Promise<boolean> {
    try {
      // In a real implementation, this would check actual connection count
      const activeConnections = await this.getActiveConnectionCount();
      
      if (activeConnections >= this.config.access.maxConnections) {
        console.warn(`⚠️ Database Security: Connection limit reached (${activeConnections}/${this.config.access.maxConnections})`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Database Security: Connection validation failed:', error);
      return false;
    }
  }

  /**
   * Implement query timeout protection
   */
  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs?: number
  ): Promise<T> {
    const timeout = timeoutMs || this.config.access.queryTimeout;
    
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      ),
    ]);
  }

  /**
   * Rate limiting for database operations
   */
  private rateLimitCache = new Map<string, { count: number; resetTime: number }>();

  checkRateLimit(identifier: string): boolean {
    if (!this.config.access.rateLimiting.enabled) {
      return true;
    }

    const now = Date.now();
    const key = `rate_limit:${identifier}`;
    const limit = this.rateLimitCache.get(key);

    if (!limit || now > limit.resetTime) {
      // Reset or initialize limit
      this.rateLimitCache.set(key, {
        count: 1,
        resetTime: now + this.config.access.rateLimiting.windowMs,
      });
      return true;
    }

    if (limit.count >= this.config.access.rateLimiting.maxRequests) {
      console.warn(`⚠️ Database Security: Rate limit exceeded for ${identifier}`);
      return false;
    }

    limit.count++;
    return true;
  }

  // ==================== AUDIT LOGGING ====================

  /**
   * Log database operations for audit trail
   */
  async auditLog(entry: AuditLogEntry): Promise<void> {
    if (!this.config.audit.enabled) {
      return;
    }

    try {
      // Sanitize sensitive data before logging
      const sanitizedEntry = this.sanitizeAuditEntry(entry);

      await prisma.auditLog.create({
        data: {
          userId: sanitizedEntry.userId,
          action: sanitizedEntry.action,
          entityType: sanitizedEntry.entityType,
          entityId: sanitizedEntry.entityId,
          oldValue: sanitizedEntry.oldValue ? JSON.stringify(sanitizedEntry.oldValue) : null,
          newValue: sanitizedEntry.newValue ? JSON.stringify(sanitizedEntry.newValue) : null,
          metadata: sanitizedEntry.metadata ? JSON.stringify(sanitizedEntry.metadata) : null,
          ipAddress: sanitizedEntry.ipAddress,
          userAgent: sanitizedEntry.userAgent,
          createdAt: sanitizedEntry.timestamp,
        },
      });

      console.log(`📝 Database Security: Audit log created for ${entry.action} on ${entry.entityType}`);
    } catch (error) {
      console.error('❌ Database Security: Audit logging failed:', error);
      // Don't throw - audit failure shouldn't break the operation
    }
  }

  /**
   * Sanitize audit entries to remove sensitive data
   */
  private sanitizeAuditEntry(entry: AuditLogEntry): AuditLogEntry {
    const sanitized = { ...entry };

    // Remove sensitive fields from old and new values
    if (sanitized.oldValue) {
      sanitized.oldValue = this.sanitizeObject(sanitized.oldValue);
    }

    if (sanitized.newValue) {
      sanitized.newValue = this.sanitizeObject(sanitized.newValue);
    }

    return sanitized;
  }

  /**
   * Remove sensitive fields from objects
   */
  private sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized = { ...obj };

    for (const field of this.config.audit.sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  async cleanupAuditLogs(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.audit.retentionDays);

      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`🗑️ Database Security: Cleaned up ${result.count} old audit logs`);
      return result.count;
    } catch (error) {
      console.error('❌ Database Security: Audit cleanup failed:', error);
      return 0;
    }
  }

  // ==================== SQL INJECTION PROTECTION ====================

  /**
   * Validate and sanitize user input to prevent SQL injection
   */
  validateInput(input: any, type: 'string' | 'number' | 'email' | 'uuid'): boolean {
    if (input === null || input === undefined) {
      return false;
    }

    switch (type) {
      case 'string':
        return typeof input === 'string' && input.length <= 1000 && !/[<>'";\\\x00-\x1f\x7f-\x9f]/.test(input);
      
      case 'number':
        return typeof input === 'number' && isFinite(input);
      
      case 'email':
        return typeof input === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      
      case 'uuid':
        return typeof input === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
      
      default:
        return false;
    }
  }

  /**
   * Escape special characters in strings
   */
  escapeString(str: string): string {
    if (typeof str !== 'string') {
      return '';
    }

    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\x00/g, '\\0');
  }

  // ==================== MONITORING & ALERTS ====================

  /**
   * Monitor for suspicious database activity
   */
  async monitorSuspiciousActivity(userId: string, action: string): Promise<void> {
    try {
      // Check for unusual patterns
      const recentLogs = await prisma.auditLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 3600000), // Last hour
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

      // Detect rapid-fire operations
      if (recentLogs.length > 50) {
        console.warn(`⚠️ Database Security: Suspicious activity detected for user ${userId}: ${recentLogs.length} operations in last hour`);
        await this.triggerSecurityAlert('HIGH_ACTIVITY', userId, { operationCount: recentLogs.length });
      }

      // Detect failed operations pattern
      const failedOperations = recentLogs.filter(log => 
        log.metadata && log.metadata.includes('"status":"failed"')
      );

      if (failedOperations.length > 10) {
        console.warn(`⚠️ Database Security: Multiple failed operations for user ${userId}`);
        await this.triggerSecurityAlert('FAILED_OPERATIONS', userId, { failedCount: failedOperations.length });
      }

    } catch (error) {
      console.error('❌ Database Security: Activity monitoring failed:', error);
    }
  }

  /**
   * Trigger security alerts
   */
  private async triggerSecurityAlert(type: string, userId: string, details: any): Promise<void> {
    // In production, this would integrate with monitoring systems
    console.log(`🚨 Security Alert: ${type} for user ${userId}`, details);
    
    // Could integrate with Sentry, Datadog, or other monitoring services
    // await sentry.captureMessage(`Security Alert: ${type}`, 'warning', { userId, details });
  }

  // ==================== UTILITY METHODS ====================

  private async getActiveConnectionCount(): Promise<number> {
    // Mock implementation - would query actual database connection stats
    return Math.floor(Math.random() * 50) + 10;
  }

  /**
   * Generate secure random tokens
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash sensitive identifiers for lookups
   */
  hashIdentifier(identifier: string): string {
    return crypto.createHash('sha256').update(identifier).digest('hex');
  }

  /**
   * Validate database configuration security
   */
  validateSecurityConfig(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check encryption key
    if (!process.env.DATABASE_ENCRYPTION_KEY) {
      issues.push('Database encryption key not configured');
    }

    // Check SSL configuration
    if (!process.env.DATABASE_URL?.includes('sslmode=require')) {
      issues.push('SSL not enforced for database connections');
    }

    // Check password complexity requirements
    // This would check actual password policy configuration

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get security metrics for monitoring
   */
  async getSecurityMetrics(): Promise<any> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);
      const oneDayAgo = new Date(now.getTime() - 86400000);

      const [
        recentAuditLogs,
        dailyAuditLogs,
        totalUsers,
        activeUsers,
      ] = await Promise.all([
        prisma.auditLog.count({
          where: { createdAt: { gte: oneHourAgo } },
        }),
        prisma.auditLog.count({
          where: { createdAt: { gte: oneDayAgo } },
        }),
        prisma.user.count(),
        prisma.user.count({
          where: {
            updatedAt: { gte: oneDayAgo },
          },
        }),
      ]);

      return {
        auditLogs: {
          lastHour: recentAuditLogs,
          lastDay: dailyAuditLogs,
        },
        users: {
          total: totalUsers,
          activeLastDay: activeUsers,
        },
        security: {
          encryptionEnabled: !!process.env.DATABASE_ENCRYPTION_KEY,
          auditingEnabled: this.config.audit.enabled,
          rateLimitingEnabled: this.config.access.rateLimiting.enabled,
        },
        timestamp: now,
      };
    } catch (error) {
      console.error('❌ Database Security: Failed to get metrics:', error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }
}

// Singleton instance
export const databaseSecurity = new DatabaseSecurity();

export default databaseSecurity;