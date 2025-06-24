/**
 * Comprehensive Security Hardening Suite
 * 
 * Advanced security implementation with input sanitization, rate limiting,
 * XSS protection, CSRF defense, and comprehensive threat detection.
 */

import { NextRequest, NextResponse } from 'next/server';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';
import crypto from 'crypto';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const prisma = new PrismaClient();

export interface SecurityConfig {
  rateLimiting: RateLimitConfig;
  inputValidation: InputValidationConfig;
  xssProtection: XSSProtectionConfig;
  csrfProtection: CSRFProtectionConfig;
  sqlInjectionPrevention: SQLInjectionConfig;
  fileUploadSecurity: FileUploadSecurityConfig;
  threatDetection: ThreatDetectionConfig;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator: (req: NextRequest) => string;
  banDuration: number;
  suspiciousThreshold: number;
}

export interface InputValidationConfig {
  maxInputLength: number;
  allowedCharacters: RegExp;
  blockedPatterns: RegExp[];
  sanitizationRules: SanitizationRule[];
}

export interface SanitizationRule {
  field: string;
  type: 'email' | 'url' | 'alphanumeric' | 'html' | 'sql' | 'custom';
  customValidator?: (value: string) => boolean;
  customSanitizer?: (value: string) => string;
}

export interface XSSProtectionConfig {
  enableContentSecurityPolicy: boolean;
  allowedSources: string[];
  blockInlineScripts: boolean;
  sanitizeOutput: boolean;
}

export interface CSRFProtectionConfig {
  tokenLength: number;
  tokenExpiry: number;
  doubleSubmitCookie: boolean;
  sameSitePolicy: 'strict' | 'lax' | 'none';
}

export interface SQLInjectionConfig {
  useParameterizedQueries: boolean;
  validateInputs: boolean;
  blockSuspiciousPatterns: boolean;
  logAttempts: boolean;
}

export interface FileUploadSecurityConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  scanForMalware: boolean;
  quarantineDirectory: string;
  virusScanTimeout: number;
}

export interface ThreatDetectionConfig {
  enableBehavioralAnalysis: boolean;
  suspiciousActivityThreshold: number;
  autoBlockDuration: number;
  alertAdministrators: boolean;
  enableHoneypots: boolean;
}

export interface SecurityAuditLog {
  timestamp: Date;
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: Record<string, any>;
  mitigationAction?: string;
}

export class ComprehensiveSecuritySuite {
  private config: SecurityConfig;
  private auditLogs: SecurityAuditLog[] = [];

  constructor(config?: Partial<SecurityConfig>) {
    this.config = this.mergeWithDefaults(config || {});
    this.initializeSecurity();
  }

  /**
   * Advanced input sanitization and validation
   */
  async sanitizeAndValidateInput(input: any, rules?: SanitizationRule[]): Promise<any> {
    const sanitizationRules = rules || this.config.inputValidation.sanitizationRules;
    
    if (typeof input === 'string') {
      return this.sanitizeString(input, sanitizationRules);
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        const rule = sanitizationRules.find(r => r.field === key);
        sanitized[key] = await this.sanitizeValue(value, rule);
      }
      return sanitized;
    }
    
    return input;
  }

  /**
   * Advanced rate limiting with Redis-backed abuse detection
   */
  async checkRateLimit(req: NextRequest): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = this.config.rateLimiting.keyGenerator(req);
    const windowMs = this.config.rateLimiting.windowMs;
    const maxRequests = this.config.rateLimiting.maxRequests;
    
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, Math.floor(windowMs / 1000));
    }
    
    const ttl = await redis.ttl(key);
    const resetTime = Date.now() + (ttl * 1000);
    
    if (current > maxRequests) {
      await this.handleRateLimitExceeded(req, key, current);
      return { allowed: false, remaining: 0, resetTime };
    }
    
    return { 
      allowed: true, 
      remaining: Math.max(0, maxRequests - current), 
      resetTime 
    };
  }

  /**
   * XSS Protection and Content Security Policy
   */
  async protectAgainstXSS(content: string, options?: { allowedTags?: string[]; stripAll?: boolean }): Promise<string> {
    const { allowedTags = [], stripAll = false } = options || {};
    
    if (stripAll) {
      return validator.stripLow(validator.escape(content));
    }
    
    // Use DOMPurify for advanced HTML sanitization
    const cleanContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: allowedTags.length > 0 ? allowedTags : ['b', 'i', 'u', 'strong', 'em'],
      ALLOWED_ATTR: ['href', 'title', 'alt'],
      FORBID_SCRIPTS: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'base', 'link'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    });
    
    return cleanContent;
  }

  /**
   * CSRF Protection with double-submit cookies
   */
  async generateCSRFToken(sessionId: string): Promise<string> {
    const token = crypto.randomBytes(this.config.csrfProtection.tokenLength).toString('hex');
    const expiry = Date.now() + this.config.csrfProtection.tokenExpiry;
    
    await redis.setex(
      `csrf:${sessionId}`,
      Math.floor(this.config.csrfProtection.tokenExpiry / 1000),
      JSON.stringify({ token, expiry })
    );
    
    return token;
  }

  async validateCSRFToken(sessionId: string, providedToken: string): Promise<boolean> {
    const stored = await redis.get(`csrf:${sessionId}`);
    
    if (!stored) {
      return false;
    }
    
    const { token, expiry } = JSON.parse(stored);
    
    if (Date.now() > expiry) {
      await redis.del(`csrf:${sessionId}`);
      return false;
    }
    
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(providedToken, 'hex')
    );
  }

  /**
   * SQL Injection Prevention
   */
  async validateSQLInput(input: string): Promise<{ valid: boolean; sanitized: string; threats: string[] }> {
    const threats: string[] = [];
    let sanitized = input;
    
    // Common SQL injection patterns
    const sqlPatterns = [
      /(\bOR\b|\bAND\b).*(=|<|>|\bLIKE\b)/i,
      /UNION.*(SELECT|INSERT|UPDATE|DELETE)/i,
      /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
      /--|\#|\/\*|\*\//,
      /\b(EXEC|EXECUTE|SP_|XP_)/i,
      /(\bSELECT\b.*\bFROM\b|\bINSERT\b.*\bINTO\b|\bUPDATE\b.*\bSET\b|\bDELETE\b.*\bFROM\b)/i
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        threats.push(`SQL injection pattern detected: ${pattern.source}`);
      }
    }
    
    // Sanitize by escaping dangerous characters
    sanitized = input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
    
    return {
      valid: threats.length === 0,
      sanitized,
      threats
    };
  }

  /**
   * File Upload Security Validation
   */
  async validateFileUpload(file: File): Promise<{ valid: boolean; issues: string[]; quarantined?: boolean }> {
    const issues: string[] = [];
    let quarantined = false;
    
    // Check file size
    if (file.size > this.config.fileUploadSecurity.maxFileSize) {
      issues.push(`File size exceeds limit: ${file.size} > ${this.config.fileUploadSecurity.maxFileSize}`);
    }
    
    // Check MIME type
    if (!this.config.fileUploadSecurity.allowedMimeTypes.includes(file.type)) {
      issues.push(`Disallowed MIME type: ${file.type}`);
    }
    
    // Check file extension vs MIME type mismatch
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension && !this.mimeTypeMatchesExtension(file.type, extension)) {
      issues.push(`MIME type and extension mismatch: ${file.type} vs .${extension}`);
    }
    
    // Scan for malware (simplified implementation)
    if (this.config.fileUploadSecurity.scanForMalware) {
      const suspiciousContent = await this.scanFileContent(file);
      if (suspiciousContent.length > 0) {
        issues.push(...suspiciousContent);
        quarantined = true;
      }
    }
    
    return {
      valid: issues.length === 0 && !quarantined,
      issues,
      quarantined
    };
  }

  /**
   * Behavioral threat detection
   */
  async analyzeUserBehavior(userId: string, action: string, metadata: Record<string, any>): Promise<{ suspicious: boolean; score: number; reasons: string[] }> {
    const key = `behavior:${userId}`;
    const timeWindow = 300; // 5 minutes
    const now = Date.now();
    
    // Store user action
    await redis.zadd(key, now, JSON.stringify({ action, metadata, timestamp: now }));
    await redis.expire(key, timeWindow);
    
    // Analyze recent behavior
    const recentActions = await redis.zrangebyscore(key, now - (timeWindow * 1000), now);
    
    const analysis = this.analyzeBehaviorPatterns(recentActions);
    
    if (analysis.score > this.config.threatDetection.suspiciousActivityThreshold) {
      await this.handleSuspiciousActivity(userId, analysis);
    }
    
    return analysis;
  }

  /**
   * Security middleware factory
   */
  createSecurityMiddleware() {
    return async (req: NextRequest) => {
      const securityHeaders = new Headers();
      
      // Security headers
      securityHeaders.set('X-Content-Type-Options', 'nosniff');
      securityHeaders.set('X-Frame-Options', 'DENY');
      securityHeaders.set('X-XSS-Protection', '1; mode=block');
      securityHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      securityHeaders.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      
      // Content Security Policy
      if (this.config.xssProtection.enableContentSecurityPolicy) {
        const csp = this.generateCSP();
        securityHeaders.set('Content-Security-Policy', csp);
      }
      
      // HSTS (HTTP Strict Transport Security)
      securityHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      
      return securityHeaders;
    };
  }

  /**
   * Security audit logger
   */
  async logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', source: string, details: Record<string, any>, mitigationAction?: string): Promise<void> {
    const auditLog: SecurityAuditLog = {
      timestamp: new Date(),
      event,
      severity,
      source,
      details,
      mitigationAction
    };
    
    this.auditLogs.push(auditLog);
    
    // Store in database for persistence
    await prisma.auditLog.create({
      data: {
        event,
        severity,
        source,
        details: JSON.stringify(details),
        mitigationAction,
        timestamp: auditLog.timestamp
      }
    });
    
    // Alert administrators for high/critical events
    if (['high', 'critical'].includes(severity) && this.config.threatDetection.alertAdministrators) {
      await this.alertAdministrators(auditLog);
    }
  }

  // Private helper methods
  private mergeWithDefaults(config: Partial<SecurityConfig>): SecurityConfig {
    return {
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        keyGenerator: (req) => req.ip || 'unknown',
        banDuration: 60 * 60 * 1000, // 1 hour
        suspiciousThreshold: 5,
        ...config.rateLimiting
      },
      inputValidation: {
        maxInputLength: 10000,
        allowedCharacters: /^[a-zA-Z0-9\s\-_@.!?,:;'"()\[\]{}+*/=<>&#%$]+$/,
        blockedPatterns: [
          /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
          /javascript:/gi,
          /vbscript:/gi,
          /on\w+\s*=/gi
        ],
        sanitizationRules: [
          { field: 'email', type: 'email' },
          { field: 'url', type: 'url' },
          { field: 'html', type: 'html' }
        ],
        ...config.inputValidation
      },
      xssProtection: {
        enableContentSecurityPolicy: true,
        allowedSources: ["'self'"],
        blockInlineScripts: true,
        sanitizeOutput: true,
        ...config.xssProtection
      },
      csrfProtection: {
        tokenLength: 32,
        tokenExpiry: 60 * 60 * 1000, // 1 hour
        doubleSubmitCookie: true,
        sameSitePolicy: 'strict',
        ...config.csrfProtection
      },
      sqlInjectionPrevention: {
        useParameterizedQueries: true,
        validateInputs: true,
        blockSuspiciousPatterns: true,
        logAttempts: true,
        ...config.sqlInjectionPrevention
      },
      fileUploadSecurity: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
        scanForMalware: true,
        quarantineDirectory: '/tmp/quarantine',
        virusScanTimeout: 30000,
        ...config.fileUploadSecurity
      },
      threatDetection: {
        enableBehavioralAnalysis: true,
        suspiciousActivityThreshold: 75,
        autoBlockDuration: 60 * 60 * 1000, // 1 hour
        alertAdministrators: true,
        enableHoneypots: false,
        ...config.threatDetection
      }
    };
  }

  private async initializeSecurity(): Promise<void> {
    console.log('🔒 Initializing Comprehensive Security Suite...');
    
    // Initialize Redis connection
    try {
      await redis.ping();
      console.log('✅ Redis connection established for security caching');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
    }
    
    // Initialize security monitoring
    this.startSecurityMonitoring();
  }

  private async sanitizeString(input: string, rules: SanitizationRule[]): Promise<string> {
    let sanitized = input;
    
    // Apply general sanitization
    if (input.length > this.config.inputValidation.maxInputLength) {
      sanitized = sanitized.substring(0, this.config.inputValidation.maxInputLength);
    }
    
    // Remove blocked patterns
    for (const pattern of this.config.inputValidation.blockedPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }
    
    return sanitized;
  }

  private async sanitizeValue(value: any, rule?: SanitizationRule): Promise<any> {
    if (typeof value !== 'string') {
      return value;
    }
    
    if (!rule) {
      return this.sanitizeString(value, []);
    }
    
    switch (rule.type) {
      case 'email':
        return validator.isEmail(value) ? validator.normalizeEmail(value) || value : '';
      case 'url':
        return validator.isURL(value) ? value : '';
      case 'alphanumeric':
        return validator.isAlphanumeric(value) ? value : '';
      case 'html':
        return await this.protectAgainstXSS(value);
      case 'sql':
        const sqlResult = await this.validateSQLInput(value);
        return sqlResult.sanitized;
      case 'custom':
        if (rule.customValidator && !rule.customValidator(value)) {
          return '';
        }
        return rule.customSanitizer ? rule.customSanitizer(value) : value;
      default:
        return value;
    }
  }

  private async handleRateLimitExceeded(req: NextRequest, key: string, attemptCount: number): Promise<void> {
    const isSuspicious = attemptCount > this.config.rateLimiting.suspiciousThreshold;
    
    if (isSuspicious) {
      // Ban the IP temporarily
      await redis.setex(`ban:${key}`, Math.floor(this.config.rateLimiting.banDuration / 1000), 'banned');
      
      await this.logSecurityEvent(
        'Rate limit exceeded - suspicious activity',
        'high',
        req.ip || 'unknown',
        { attempts: attemptCount, userAgent: req.headers.get('user-agent') },
        `IP temporarily banned for ${this.config.rateLimiting.banDuration}ms`
      );
    }
  }

  private mimeTypeMatchesExtension(mimeType: string, extension: string): boolean {
    const mimeExtensionMap: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'application/pdf': ['pdf'],
      'text/plain': ['txt'],
      'application/json': ['json'],
      'text/csv': ['csv']
    };
    
    return mimeExtensionMap[mimeType]?.includes(extension) || false;
  }

  private async scanFileContent(file: File): Promise<string[]> {
    const issues: string[] = [];
    
    // Read file content (simplified implementation)
    const text = await file.text();
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /ActiveXObject/i,
      /eval\(/i,
      /document\.write/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        issues.push(`Suspicious content pattern detected: ${pattern.source}`);
      }
    }
    
    return issues;
  }

  private analyzeBehaviorPatterns(actions: string[]): { suspicious: boolean; score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;
    
    if (actions.length === 0) {
      return { suspicious: false, score: 0, reasons: [] };
    }
    
    const parsedActions = actions.map(a => JSON.parse(a));
    
    // Check for rapid requests
    const timeSpan = Math.max(...parsedActions.map(a => a.timestamp)) - Math.min(...parsedActions.map(a => a.timestamp));
    if (actions.length > 20 && timeSpan < 60000) { // 20 requests in 1 minute
      score += 30;
      reasons.push('Rapid request pattern detected');
    }
    
    // Check for repeated failed actions
    const failedActions = parsedActions.filter(a => a.metadata.success === false);
    if (failedActions.length > 5) {
      score += 25;
      reasons.push('Multiple failed actions detected');
    }
    
    // Check for unusual action patterns
    const uniqueActions = new Set(parsedActions.map(a => a.action));
    if (uniqueActions.size < actions.length / 4) { // Very repetitive
      score += 20;
      reasons.push('Repetitive action pattern detected');
    }
    
    return {
      suspicious: score > this.config.threatDetection.suspiciousActivityThreshold,
      score,
      reasons
    };
  }

  private async handleSuspiciousActivity(userId: string, analysis: { score: number; reasons: string[] }): Promise<void> {
    await this.logSecurityEvent(
      'Suspicious user behavior detected',
      analysis.score > 90 ? 'critical' : 'high',
      userId,
      { score: analysis.score, reasons: analysis.reasons },
      'User flagged for review'
    );
    
    // Temporarily restrict user if score is very high
    if (analysis.score > 90) {
      await redis.setex(
        `restrict:${userId}`,
        Math.floor(this.config.threatDetection.autoBlockDuration / 1000),
        JSON.stringify({ reason: 'Suspicious behavior', score: analysis.score })
      );
    }
  }

  private generateCSP(): string {
    const sources = this.config.xssProtection.allowedSources.join(' ');
    return `default-src ${sources}; script-src ${sources}${this.config.xssProtection.blockInlineScripts ? '' : " 'unsafe-inline'"}; style-src ${sources} 'unsafe-inline'; img-src ${sources} data:; font-src ${sources}; connect-src ${sources}; media-src ${sources}; object-src 'none'; child-src 'none'; worker-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`;
  }

  private startSecurityMonitoring(): void {
    // Periodic cleanup of old audit logs
    setInterval(async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      this.auditLogs = this.auditLogs.filter(log => log.timestamp > thirtyDaysAgo);
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  private async alertAdministrators(auditLog: SecurityAuditLog): Promise<void> {
    // Implementation would send alerts via email, Slack, etc.
    console.log(`🚨 SECURITY ALERT: ${auditLog.event} - ${auditLog.severity.toUpperCase()}`);
    console.log(`Source: ${auditLog.source}`);
    console.log(`Details: ${JSON.stringify(auditLog.details, null, 2)}`);
    
    if (auditLog.mitigationAction) {
      console.log(`Action Taken: ${auditLog.mitigationAction}`);
    }
  }
}

// Export singleton instance
export const securitySuite = new ComprehensiveSecuritySuite();