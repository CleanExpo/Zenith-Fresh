import { Redis } from 'ioredis';
import { NextRequest, NextResponse } from 'next/server';
import { performance } from 'perf_hooks';

interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: Record<string, any>;
  timestamp: number;
  blocked: boolean;
  resolved: boolean;
}

interface SecurityRule {
  id: string;
  name: string;
  type: 'rate_limit' | 'ip_filter' | 'header_check' | 'content_filter' | 'geo_filter';
  enabled: boolean;
  priority: number;
  conditions: Record<string, any>;
  actions: SecurityAction[];
  metadata: Record<string, any>;
}

interface SecurityAction {
  type: 'block' | 'log' | 'challenge' | 'rate_limit' | 'notify';
  parameters: Record<string, any>;
  duration?: number; // milliseconds
}

interface WAFRule {
  id: string;
  name: string;
  pattern: string;
  type: 'regex' | 'string' | 'ip' | 'header';
  action: 'block' | 'log' | 'challenge';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

interface CSPPolicy {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'frame-src': string[];
  'object-src': string[];
  'media-src': string[];
  'worker-src': string[];
  'manifest-src': string[];
  'base-uri': string[];
  'form-action': string[];
  'frame-ancestors': string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

interface SecurityHeaders {
  'Strict-Transport-Security': string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Content-Security-Policy': string;
  'Cross-Origin-Embedder-Policy': string;
  'Cross-Origin-Opener-Policy': string;
  'Cross-Origin-Resource-Policy': string;
}

/**
 * Web Application Firewall (WAF)
 */
class WebApplicationFirewall {
  private rules: Map<string, WAFRule> = new Map();
  private redis: Redis;
  private requestCount = new Map<string, number>();

  constructor(redis: Redis) {
    this.redis = redis;
    this.initializeDefaultRules();
  }

  /**
   * Analyze request for security threats
   */
  async analyzeRequest(req: NextRequest): Promise<{
    threat: boolean;
    threats: string[];
    risk: 'low' | 'medium' | 'high' | 'critical';
    action: 'allow' | 'block' | 'challenge' | 'rate_limit';
    details: Record<string, any>;
  }> {
    const threats: string[] = [];
    let maxRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let action: 'allow' | 'block' | 'challenge' | 'rate_limit' = 'allow';
    const details: Record<string, any> = {};

    const clientIP = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || '';
    const url = req.nextUrl.href;
    const method = req.method;

    // Check each active rule
    for (const rule of Array.from(this.rules.values())) {
      if (!rule.enabled) continue;

      const ruleResult = await this.checkRule(rule, {
        ip: clientIP,
        userAgent,
        url,
        method,
        headers: req.headers,
        body: await this.safeGetBody(req),
      });

      if (ruleResult.matched) {
        threats.push(rule.name);
        details[rule.id] = ruleResult.details;

        // Update risk level
        if (this.riskPriority(rule.severity) > this.riskPriority(maxRisk)) {
          maxRisk = rule.severity;
        }

        // Determine action
        if (rule.action === 'block') {
          action = 'block';
          break; // Block immediately
        } else if (rule.action === 'challenge' && action === 'allow') {
          action = 'challenge';
        }
      }
    }

    // Additional rate limiting check
    const rateLimitResult = await this.checkRateLimit(clientIP, method);
    if (rateLimitResult.exceeded) {
      threats.push('Rate limit exceeded');
      action = 'rate_limit';
      details.rate_limit = rateLimitResult;
    }

    return {
      threat: threats.length > 0,
      threats,
      risk: maxRisk,
      action,
      details,
    };
  }

  /**
   * Add custom WAF rule
   */
  addRule(rule: WAFRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove WAF rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Get WAF statistics
   */
  async getStats(): Promise<{
    totalRules: number;
    activeRules: number;
    totalThreats: number;
    threatsBlocked: number;
    topThreats: Array<{ threat: string; count: number }>;
  }> {
    const activeRules = Array.from(this.rules.values()).filter(r => r.enabled).length;
    
    // Get threat statistics from Redis
    const threatStats = await this.getThreatStats();

    return {
      totalRules: this.rules.size,
      activeRules,
      totalThreats: threatStats.total,
      threatsBlocked: threatStats.blocked,
      topThreats: threatStats.top,
    };
  }

  private initializeDefaultRules(): void {
    // SQL Injection protection
    this.addRule({
      id: 'sql-injection',
      name: 'SQL Injection Attack',
      pattern: '(union|select|insert|update|delete|drop|create|alter|exec|execute|sp_|xp_)',
      type: 'regex',
      action: 'block',
      severity: 'critical',
      enabled: true,
    });

    // XSS protection
    this.addRule({
      id: 'xss-attack',
      name: 'Cross-Site Scripting',
      pattern: '(<script|javascript:|onload=|onerror=|onclick=|onmouseover=)',
      type: 'regex',
      action: 'block',
      severity: 'high',
      enabled: true,
    });

    // Path traversal protection
    this.addRule({
      id: 'path-traversal',
      name: 'Path Traversal Attack',
      pattern: '(\\.\\./|\\.\\.\\/|%2e%2e%2f|%2e%2e/)',
      type: 'regex',
      action: 'block',
      severity: 'high',
      enabled: true,
    });

    // Command injection protection
    this.addRule({
      id: 'command-injection',
      name: 'Command Injection',
      pattern: '(;|\\||&|`|\\$\\(|\\${)',
      type: 'regex',
      action: 'block',
      severity: 'critical',
      enabled: true,
    });

    // Suspicious user agents
    this.addRule({
      id: 'malicious-ua',
      name: 'Malicious User Agent',
      pattern: '(sqlmap|nikto|nessus|acunetix|nmap|masscan|zap|burp)',
      type: 'regex',
      action: 'block',
      severity: 'medium',
      enabled: true,
    });

    // Large payload protection
    this.addRule({
      id: 'large-payload',
      name: 'Oversized Request',
      pattern: '',
      type: 'string',
      action: 'block',
      severity: 'medium',
      enabled: true,
    });
  }

  private async checkRule(rule: WAFRule, context: {
    ip: string;
    userAgent: string;
    url: string;
    method: string;
    headers: Headers;
    body: string;
  }): Promise<{ matched: boolean; details?: any }> {
    try {
      switch (rule.type) {
        case 'regex':
          return this.checkRegexRule(rule, context);
        case 'string':
          return this.checkStringRule(rule, context);
        case 'ip':
          return this.checkIPRule(rule, context);
        case 'header':
          return this.checkHeaderRule(rule, context);
        default:
          return { matched: false };
      }
    } catch (error) {
      console.error(`WAF rule check error for ${rule.id}:`, error);
      return { matched: false };
    }
  }

  private checkRegexRule(rule: WAFRule, context: any): { matched: boolean; details?: any } {
    const regex = new RegExp(rule.pattern, 'i');
    const testStrings = [
      context.url,
      context.userAgent,
      context.body,
      ...Array.from(context.headers.values()),
    ];

    for (const testString of testStrings) {
      if (regex.test(testString)) {
        return {
          matched: true,
          details: { matchedString: testString, pattern: rule.pattern },
        };
      }
    }

    return { matched: false };
  }

  private checkStringRule(rule: WAFRule, context: any): { matched: boolean; details?: any } {
    // Special rules
    if (rule.id === 'large-payload') {
      const bodySize = Buffer.byteLength(context.body, 'utf8');
      if (bodySize > 10 * 1024 * 1024) { // 10MB limit
        return {
          matched: true,
          details: { bodySize, limit: 10 * 1024 * 1024 },
        };
      }
    }

    return { matched: false };
  }

  private checkIPRule(rule: WAFRule, context: any): { matched: boolean; details?: any } {
    // IP-based rules would check against blacklists, geolocation, etc.
    return { matched: false };
  }

  private checkHeaderRule(rule: WAFRule, context: any): { matched: boolean; details?: any } {
    // Header-based rules
    return { matched: false };
  }

  private async checkRateLimit(ip: string, method: string): Promise<{
    exceeded: boolean;
    current: number;
    limit: number;
    resetTime: number;
  }> {
    const key = `rate_limit:${ip}:${method}`;
    const limit = method === 'POST' ? 100 : 200; // requests per minute
    const window = 60; // seconds

    try {
      const current = await this.redis.incr(key);
      
      if (current === 1) {
        await this.redis.expire(key, window);
      }

      const ttl = await this.redis.ttl(key);
      const resetTime = Date.now() + (ttl * 1000);

      return {
        exceeded: current > limit,
        current,
        limit,
        resetTime,
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { exceeded: false, current: 0, limit, resetTime: Date.now() + 60000 };
    }
  }

  private getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    return req.headers.get('x-real-ip') || 
           req.headers.get('x-client-ip') || 
           req.ip || 
           'unknown';
  }

  private async safeGetBody(req: NextRequest): Promise<string> {
    try {
      if (req.method === 'GET' || req.method === 'HEAD') {
        return '';
      }
      
      const clone = req.clone();
      return await clone.text();
    } catch (error) {
      return '';
    }
  }

  private riskPriority(risk: string): number {
    const priorities = { low: 1, medium: 2, high: 3, critical: 4 };
    return priorities[risk as keyof typeof priorities] || 0;
  }

  private async getThreatStats(): Promise<{
    total: number;
    blocked: number;
    top: Array<{ threat: string; count: number }>;
  }> {
    // Mock implementation - in production, get from Redis/database
    return {
      total: 1250,
      blocked: 892,
      top: [
        { threat: 'SQL Injection Attack', count: 342 },
        { threat: 'Cross-Site Scripting', count: 198 },
        { threat: 'Rate limit exceeded', count: 156 },
        { threat: 'Path Traversal Attack', count: 89 },
        { threat: 'Malicious User Agent', count: 67 },
      ],
    };
  }
}

/**
 * Security Headers Manager
 */
class SecurityHeadersManager {
  private defaultCSP: CSPPolicy = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.vercel.com', 'https://va.vercel-scripts.com'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", 'https://api.zenith.engineer', 'wss:', 'https://vitals.vercel-insights.com'],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': true,
    'block-all-mixed-content': true,
  };

  /**
   * Generate security headers
   */
  generateSecurityHeaders(customCSP?: Partial<CSPPolicy>): SecurityHeaders {
    const csp = { ...this.defaultCSP, ...customCSP };
    
    return {
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': this.generatePermissionsPolicy(),
      'Content-Security-Policy': this.generateCSPHeader(csp),
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
    };
  }

  /**
   * Apply security headers to response
   */
  applyHeaders(response: NextResponse, customCSP?: Partial<CSPPolicy>): NextResponse {
    const headers = this.generateSecurityHeaders(customCSP);
    
    Object.entries(headers).forEach(([name, value]) => {
      response.headers.set(name, value);
    });

    // Additional security headers
    response.headers.set('X-Powered-By', ''); // Remove server fingerprinting
    response.headers.set('Server', ''); // Remove server fingerprinting
    response.headers.set('X-Zenith-Security', 'enabled');
    
    return response;
  }

  private generateCSPHeader(csp: CSPPolicy): string {
    const directives: string[] = [];
    
    Object.entries(csp).forEach(([directive, sources]) => {
      if (directive === 'upgrade-insecure-requests' && sources) {
        directives.push('upgrade-insecure-requests');
      } else if (directive === 'block-all-mixed-content' && sources) {
        directives.push('block-all-mixed-content');
      } else if (Array.isArray(sources) && sources.length > 0) {
        directives.push(`${directive} ${sources.join(' ')}`);
      }
    });
    
    return directives.join('; ');
  }

  private generatePermissionsPolicy(): string {
    const policies = [
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'battery=()',
      'camera=()',
      'cross-origin-isolated=()',
      'display-capture=()',
      'document-domain=()',
      'encrypted-media=()',
      'execution-while-not-rendered=()',
      'execution-while-out-of-viewport=()',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'keyboard-map=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'navigation-override=()',
      'payment=()',
      'picture-in-picture=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=()',
      'xr-spatial-tracking=()',
    ];
    
    return policies.join(', ');
  }
}

/**
 * Input Validation and Sanitization
 */
class InputValidator {
  /**
   * Validate and sanitize input data
   */
  validateInput(data: any, schema: Record<string, any>): {
    valid: boolean;
    sanitized: any;
    errors: string[];
  } {
    const errors: string[] = [];
    const sanitized: any = {};

    try {
      for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];
        const result = this.validateField(field, value, rules);
        
        if (result.valid) {
          sanitized[field] = result.sanitized;
        } else {
          errors.push(...result.errors);
        }
      }

      return {
        valid: errors.length === 0,
        sanitized,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        sanitized: {},
        errors: ['Validation error occurred'],
      };
    }
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHTML(html: string): string {
    // Remove potentially dangerous tags and attributes
    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'meta', 'link'];
    const dangerousAttrs = ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'javascript:'];
    
    let sanitized = html;
    
    // Remove dangerous tags
    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
      sanitized = sanitized.replace(regex, '');
      
      const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, 'gis');
      sanitized = sanitized.replace(selfClosingRegex, '');
    });
    
    // Remove dangerous attributes
    dangerousAttrs.forEach(attr => {
      const regex = new RegExp(`${attr}="[^"]*"`, 'gis');
      sanitized = sanitized.replace(regex, '');
      
      const singleQuoteRegex = new RegExp(`${attr}='[^']*'`, 'gis');
      sanitized = sanitized.replace(singleQuoteRegex, '');
    });
    
    return sanitized;
  }

  /**
   * Validate SQL input for injection attempts
   */
  validateSQL(input: string): boolean {
    const sqlPatterns = [
      /(\s|^)(union|select|insert|update|delete|drop|create|alter|exec|execute)\s/i,
      /(\s|^)(sp_|xp_)\w+/i,
      /(--|\/\*|\*\/)/,
      /(\s|^)(or|and)\s+\d+\s*=\s*\d+/i,
      /(\s|^)(or|and)\s+['"]\w+['"]\s*=\s*['"]\w+['"]/i,
    ];
    
    return !sqlPatterns.some(pattern => pattern.test(input));
  }

  private validateField(field: string, value: any, rules: any): {
    valid: boolean;
    sanitized: any;
    errors: string[];
  } {
    const errors: string[] = [];
    let sanitized = value;

    // Required validation
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      return { valid: false, sanitized: null, errors };
    }

    if (value === undefined || value === null) {
      return { valid: true, sanitized: null, errors: [] };
    }

    // Type validation
    if (rules.type) {
      const typeResult = this.validateType(value, rules.type);
      if (!typeResult.valid) {
        errors.push(`${field} must be of type ${rules.type}`);
        return { valid: false, sanitized: value, errors };
      }
      sanitized = typeResult.sanitized;
    }

    // Length validation
    if (rules.minLength && typeof sanitized === 'string' && sanitized.length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters`);
    }

    if (rules.maxLength && typeof sanitized === 'string' && sanitized.length > rules.maxLength) {
      errors.push(`${field} must be no more than ${rules.maxLength} characters`);
      sanitized = sanitized.substring(0, rules.maxLength);
    }

    // Pattern validation
    if (rules.pattern && typeof sanitized === 'string') {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(sanitized)) {
        errors.push(`${field} format is invalid`);
      }
    }

    // Sanitization
    if (rules.sanitize && typeof sanitized === 'string') {
      switch (rules.sanitize) {
        case 'html':
          sanitized = this.sanitizeHTML(sanitized);
          break;
        case 'sql':
          if (!this.validateSQL(sanitized)) {
            errors.push(`${field} contains potentially dangerous content`);
          }
          break;
        case 'trim':
          sanitized = sanitized.trim();
          break;
        case 'lowercase':
          sanitized = sanitized.toLowerCase();
          break;
        case 'uppercase':
          sanitized = sanitized.toUpperCase();
          break;
      }
    }

    return {
      valid: errors.length === 0,
      sanitized,
      errors,
    };
  }

  private validateType(value: any, type: string): { valid: boolean; sanitized: any } {
    switch (type) {
      case 'string':
        return { valid: typeof value === 'string', sanitized: String(value) };
      case 'number':
        const num = Number(value);
        return { valid: !isNaN(num), sanitized: num };
      case 'boolean':
        return { valid: typeof value === 'boolean', sanitized: Boolean(value) };
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return { valid: typeof value === 'string' && emailRegex.test(value), sanitized: value };
      case 'url':
        try {
          new URL(value);
          return { valid: true, sanitized: value };
        } catch {
          return { valid: false, sanitized: value };
        }
      default:
        return { valid: true, sanitized: value };
    }
  }
}

/**
 * Main Production Security Manager
 */
export class ProductionSecurityManager {
  public waf: WebApplicationFirewall;
  public headers: SecurityHeadersManager;
  public validator: InputValidator;
  private redis: Redis;
  private securityEvents: SecurityEvent[] = [];

  constructor(redis: Redis) {
    this.redis = redis;
    this.waf = new WebApplicationFirewall(redis);
    this.headers = new SecurityHeadersManager();
    this.validator = new InputValidator();
  }

  /**
   * Security middleware for Next.js
   */
  middleware() {
    return async (req: NextRequest) => {
      const startTime = performance.now();

      try {
        // WAF analysis
        const wafResult = await this.waf.analyzeRequest(req);
        
        if (wafResult.action === 'block') {
          await this.logSecurityEvent({
            type: 'request_blocked',
            severity: wafResult.risk,
            source: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
            details: {
              threats: wafResult.threats,
              url: req.nextUrl.href,
              userAgent: req.headers.get('user-agent'),
              ...wafResult.details,
            },
            blocked: true,
          });

          return new NextResponse('Access Denied', { 
            status: 403,
            headers: {
              'Content-Type': 'text/plain',
              'X-Security-Block': 'WAF',
              'X-Block-Reason': wafResult.threats.join(', '),
            },
          });
        }

        if (wafResult.action === 'rate_limit') {
          return new NextResponse('Rate Limit Exceeded', { 
            status: 429,
            headers: {
              'Content-Type': 'text/plain',
              'Retry-After': '60',
              'X-RateLimit-Limit': wafResult.details.rate_limit?.limit?.toString() || '100',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': wafResult.details.rate_limit?.resetTime?.toString() || '',
            },
          });
        }

        // Log security events for non-blocked threats
        if (wafResult.threat) {
          await this.logSecurityEvent({
            type: 'threat_detected',
            severity: wafResult.risk,
            source: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
            details: {
              threats: wafResult.threats,
              url: req.nextUrl.href,
              action: wafResult.action,
              ...wafResult.details,
            },
            blocked: false,
          });
        }

        // Continue with request
        const response = NextResponse.next();

        // Apply security headers
        this.headers.applyHeaders(response);

        // Add security metrics
        response.headers.set('X-Security-Check-Time', `${(performance.now() - startTime).toFixed(2)}ms`);
        response.headers.set('X-Security-Threats', wafResult.threats.length.toString());

        return response;

      } catch (error) {
        console.error('Security middleware error:', error);
        
        // Log security error
        await this.logSecurityEvent({
          type: 'security_error',
          severity: 'medium',
          source: req.ip || 'unknown',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            url: req.nextUrl.href,
          },
          blocked: false,
        });

        // Allow request to continue on security error
        return NextResponse.next();
      }
    };
  }

  /**
   * API request validation
   */
  async validateAPIRequest(req: NextRequest, schema: Record<string, any>): Promise<{
    valid: boolean;
    data: any;
    errors: string[];
  }> {
    try {
      const body = await req.json();
      const validation = this.validator.validateInput(body, schema);
      
      if (!validation.valid) {
        await this.logSecurityEvent({
          type: 'validation_error',
          severity: 'low',
          source: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
          details: {
            errors: validation.errors,
            url: req.nextUrl.href,
          },
          blocked: false,
        });
      }

      return {
        valid: validation.valid,
        data: validation.sanitized || {},
        errors: validation.errors,
      };
    } catch (error) {
      return {
        valid: false,
        data: {},
        errors: ['Invalid JSON payload'],
      };
    }
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboard(): Promise<{
    wafStats: any;
    recentEvents: SecurityEvent[];
    threatSummary: {
      total: number;
      blocked: number;
      byType: Record<string, number>;
      bySeverity: Record<string, number>;
    };
    recommendations: string[];
  }> {
    const wafStats = await this.waf.getStats();
    const recentEvents = this.securityEvents.slice(-50);
    
    const threatSummary = this.calculateThreatSummary();
    const recommendations = this.generateSecurityRecommendations(threatSummary);

    return {
      wafStats,
      recentEvents,
      threatSummary,
      recommendations,
    };
  }

  /**
   * Security health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail';
      details?: string;
    }>;
  }> {
    const checks = await Promise.all([
      this.checkWAFHealth(),
      this.checkRateLimitHealth(),
      this.checkSecurityHeaders(),
      this.checkRedisConnection(),
    ]);

    const failedChecks = checks.filter(check => check.status === 'fail');
    const status = failedChecks.length === 0 ? 'healthy' : 
                  failedChecks.length <= 1 ? 'degraded' : 'unhealthy';

    return { status, checks };
  }

  private async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      resolved: false,
      ...event,
    };

    this.securityEvents.push(securityEvent);

    // Keep only last 10000 events in memory
    if (this.securityEvents.length > 10000) {
      this.securityEvents = this.securityEvents.slice(-10000);
    }

    // Store in Redis for persistence
    try {
      await this.redis.lpush('security_events', JSON.stringify(securityEvent));
      await this.redis.ltrim('security_events', 0, 9999); // Keep last 10000
    } catch (error) {
      console.error('Failed to store security event:', error);
    }

    // Log critical events
    if (event.severity === 'critical') {
      console.warn(`🚨 Critical Security Event: ${event.type}`, event.details);
    }
  }

  private calculateThreatSummary() {
    const total = this.securityEvents.length;
    const blocked = this.securityEvents.filter(e => e.blocked).length;
    
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    
    this.securityEvents.forEach(event => {
      byType[event.type] = (byType[event.type] || 0) + 1;
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
    });

    return { total, blocked, byType, bySeverity };
  }

  private generateSecurityRecommendations(summary: any): string[] {
    const recommendations: string[] = [];

    if (summary.total > 1000) {
      recommendations.push('High volume of security events detected. Consider implementing additional protection measures.');
    }

    if (summary.blocked / summary.total < 0.8) {
      recommendations.push('Consider tightening WAF rules to block more potential threats.');
    }

    if (summary.bySeverity.critical > 10) {
      recommendations.push('Multiple critical security events detected. Immediate investigation recommended.');
    }

    if (summary.byType.sql_injection > 50) {
      recommendations.push('High number of SQL injection attempts. Review database security.');
    }

    return recommendations;
  }

  private async checkWAFHealth(): Promise<{ name: string; status: 'pass' | 'fail'; details?: string }> {
    try {
      const stats = await this.waf.getStats();
      return {
        name: 'WAF',
        status: stats.activeRules > 0 ? 'pass' : 'fail',
        details: `${stats.activeRules} active rules`,
      };
    } catch (error) {
      return {
        name: 'WAF',
        status: 'fail',
        details: 'WAF check failed',
      };
    }
  }

  private async checkRateLimitHealth(): Promise<{ name: string; status: 'pass' | 'fail'; details?: string }> {
    try {
      await this.redis.ping();
      return {
        name: 'Rate Limiting',
        status: 'pass',
        details: 'Redis connection healthy',
      };
    } catch (error) {
      return {
        name: 'Rate Limiting',
        status: 'fail',
        details: 'Redis connection failed',
      };
    }
  }

  private async checkSecurityHeaders(): Promise<{ name: string; status: 'pass' | 'fail'; details?: string }> {
    const headers = this.headers.generateSecurityHeaders();
    const requiredHeaders = ['Strict-Transport-Security', 'Content-Security-Policy', 'X-Frame-Options'];
    
    const missingHeaders = requiredHeaders.filter(header => !headers[header as keyof SecurityHeaders]);
    
    return {
      name: 'Security Headers',
      status: missingHeaders.length === 0 ? 'pass' : 'fail',
      details: missingHeaders.length > 0 ? `Missing: ${missingHeaders.join(', ')}` : 'All headers configured',
    };
  }

  private async checkRedisConnection(): Promise<{ name: string; status: 'pass' | 'fail'; details?: string }> {
    try {
      await this.redis.ping();
      return {
        name: 'Redis Connection',
        status: 'pass',
        details: 'Connection healthy',
      };
    } catch (error) {
      return {
        name: 'Redis Connection',
        status: 'fail',
        details: 'Connection failed',
      };
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

/**
 * Factory function
 */
export function createProductionSecurityManager(redis: Redis): ProductionSecurityManager {
  return new ProductionSecurityManager(redis);
}