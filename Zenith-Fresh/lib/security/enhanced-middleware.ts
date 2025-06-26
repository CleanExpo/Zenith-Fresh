import { NextRequest, NextResponse } from 'next/server';
import helmet from 'helmet';
import { checkRateLimit, getUserTier } from './rate-limiter';
import { validateAPIKey, hasScope } from './api-keys';
import { isIPWhitelisted, isIPBlacklisted, analyzeIPBehavior, autoBlockSuspiciousIP } from './ip-filtering';
import { logSecurityEvent, SECURITY_EVENT_TYPES } from './audit-logger';
import { detectThreats } from './threat-detector';
import { prisma } from '../prisma';

export interface SecurityContext {
  ip: string;
  userAgent: string;
  userId?: string;
  apiKey?: any;
  isAuthenticated: boolean;
  userTier: 'free' | 'pro' | 'enterprise' | 'admin';
  requestId: string;
}

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  headers?: Record<string, string>;
  statusCode?: number;
  context: SecurityContext;
}

/**
 * Enhanced security middleware with comprehensive protection
 */
export async function enhancedSecurityMiddleware(request: NextRequest): Promise<SecurityCheckResult> {
  const startTime = Date.now();
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Generate request ID for tracking
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Extract client information
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Initialize security context
  const context: SecurityContext = {
    ip,
    userAgent,
    isAuthenticated: false,
    userTier: 'free',
    requestId,
  };
  
  try {
    // Step 1: IP Filtering - Check blacklist/whitelist
    const ipCheck = await checkIPFiltering(ip);
    if (!ipCheck.allowed) {
      await logSecurityEvent({
        type: 'IP_BLOCKED',
        severity: 'HIGH',
        sourceIp: ip,
        userAgent,
        details: {
          reason: ipCheck.reason,
          pathname,
          requestId,
        },
        blocked: true,
      });
      
      return {
        allowed: false,
        reason: ipCheck.reason || 'IP blocked',
        statusCode: 403,
        context,
      };
    }
    
    // Step 2: Threat Detection - Analyze request for malicious patterns
    const threatCheck = await detectThreats(request);
    if (threatCheck.threat) {
      await logSecurityEvent({
        type: threatCheck.type as any,
        severity: threatCheck.severity as any,
        sourceIp: ip,
        userAgent,
        details: {
          threat: threatCheck.threat,
          pattern: threatCheck.pattern,
          pathname,
          requestId,
        },
        blocked: true,
      });
      
      // Auto-block high severity threats
      if (threatCheck.severity === 'HIGH' || threatCheck.severity === 'CRITICAL') {
        await autoBlockSuspiciousIP(ip, `Threat detected: ${threatCheck.threat}`, 'HIGH', 3600);
      }
      
      return {
        allowed: false,
        reason: 'Security threat detected',
        statusCode: 403,
        context,
      };
    }
    
    // Step 3: Authentication - Check session or API key
    const authResult = await checkAuthentication(request);
    context.isAuthenticated = authResult.authenticated;
    context.userId = authResult.userId;
    context.apiKey = authResult.apiKey;
    context.userTier = authResult.userTier;
    
    // Step 4: Rate Limiting - Apply tier-based limits
    const rateLimitResult = await checkRateLimit({
      identifier: context.userId || ip,
      type: getRequestType(pathname),
      tier: context.userTier,
      skipIfWhitelisted: true,
    });
    
    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'MEDIUM',
        sourceIp: ip,
        userAgent,
        userId: context.userId,
        apiKeyId: context.apiKey?.id,
        details: {
          pathname,
          tier: context.userTier,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          requestId,
        },
        blocked: true,
      });
      
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        statusCode: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.total.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.getTime().toString(),
          'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
        },
        context,
      };
    }
    
    // Step 5: Authorization - Check API scopes for protected endpoints
    if (context.apiKey && isProtectedEndpoint(pathname)) {
      const requiredScope = getRequiredScope(pathname);
      if (requiredScope && !hasScope(context.apiKey, requiredScope as any)) {
        await logSecurityEvent({
          type: 'UNAUTHORIZED_ACCESS',
          severity: 'HIGH',
          sourceIp: ip,
          userAgent,
          userId: context.userId,
          apiKeyId: context.apiKey.id,
          details: {
            pathname,
            requiredScope,
            availableScopes: context.apiKey.scopes,
            requestId,
          },
          blocked: true,
        });
        
        return {
          allowed: false,
          reason: 'Insufficient API permissions',
          statusCode: 403,
          context,
        };
      }
    }
    
    // Step 6: Behavioral Analysis - Check for suspicious patterns
    const behaviorAnalysis = await analyzeIPBehavior(ip);
    if (behaviorAnalysis.shouldBlock) {
      await autoBlockSuspiciousIP(
        ip,
        behaviorAnalysis.reason!,
        behaviorAnalysis.severity!,
        3600
      );
      
      return {
        allowed: false,
        reason: 'Suspicious behavior detected',
        statusCode: 403,
        context,
      };
    }
    
    // Step 7: Log successful request
    if (context.isAuthenticated || isProtectedEndpoint(pathname)) {
      await logSecurityEvent({
        type: context.apiKey ? 'API_KEY_USED' : 'LOGIN_SUCCESS',
        severity: 'LOW',
        sourceIp: ip,
        userAgent,
        userId: context.userId,
        apiKeyId: context.apiKey?.id,
        details: {
          pathname,
          method: request.method,
          tier: context.userTier,
          requestId,
          processingTime: Date.now() - startTime,
        },
      });
    }
    
    // Generate security headers
    const securityHeaders = generateSecurityHeaders(request, context);
    
    return {
      allowed: true,
      headers: {
        ...securityHeaders,
        'X-Request-ID': requestId,
        'X-Processing-Time': (Date.now() - startTime).toString(),
        'X-Security-Level': determineSecurityLevel(context),
        'X-RateLimit-Limit': rateLimitResult.total.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.getTime().toString(),
      },
      context,
    };
    
  } catch (error) {
    console.error('Security middleware error:', error);
    
    await logSecurityEvent({
      type: 'SYSTEM_ERROR',
      severity: 'HIGH',
      sourceIp: ip,
      userAgent,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        pathname,
        requestId,
      },
    });
    
    // Fail-safe: allow request if security checks fail
    return {
      allowed: true,
      reason: 'Security check failed, allowing request',
      headers: generateBasicSecurityHeaders(),
      context,
    };
  }
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  if (realIP) return realIP;
  
  return request.ip || 'unknown';
}

/**
 * Check IP filtering (whitelist/blacklist)
 */
async function checkIPFiltering(ip: string): Promise<{ allowed: boolean; reason?: string }> {
  // Check if IP is whitelisted (always allow)
  if (await isIPWhitelisted(ip)) {
    return { allowed: true };
  }
  
  // Check if IP is blacklisted
  const blacklistResult = await isIPBlacklisted(ip);
  if (blacklistResult.blacklisted) {
    return {
      allowed: false,
      reason: blacklistResult.reason || 'IP is blacklisted',
    };
  }
  
  return { allowed: true };
}

/**
 * Check authentication (session or API key)
 */
async function checkAuthentication(request: NextRequest): Promise<{
  authenticated: boolean;
  userId?: string;
  apiKey?: any;
  userTier: 'free' | 'pro' | 'enterprise' | 'admin';
}> {
  // Check for API key authentication
  const apiKeyHeader = request.headers.get('authorization');
  if (apiKeyHeader && apiKeyHeader.startsWith('Bearer ')) {
    const apiKey = apiKeyHeader.substring(7);
    const validation = await validateAPIKey(apiKey);
    
    if (validation.valid && validation.apiKey && validation.userId) {
      const userTier = await getUserTier(validation.userId);
      return {
        authenticated: true,
        userId: validation.userId,
        apiKey: validation.apiKey,
        userTier,
      };
    }
  }
  
  // Check for session authentication
  const sessionToken = request.cookies.get('next-auth.session-token') || 
                      request.cookies.get('__Secure-next-auth.session-token');
  
  if (sessionToken) {
    try {
      // Verify session (this would integrate with NextAuth)
      const session = await prisma.session.findUnique({
        where: { sessionToken: sessionToken.value },
        include: { user: true },
      });
      
      if (session && session.expires > new Date()) {
        const userTier = await getUserTier(session.userId);
        return {
          authenticated: true,
          userId: session.userId,
          userTier,
        };
      }
    } catch (error) {
      console.error('Session validation error:', error);
    }
  }
  
  return {
    authenticated: false,
    userTier: 'free',
  };
}

/**
 * Get request type for rate limiting
 */
function getRequestType(pathname: string): 'api' | 'websiteAnalysis' | 'export' {
  if (pathname.includes('/analyze') || pathname.includes('/scan')) {
    return 'websiteAnalysis';
  }
  if (pathname.includes('/export') || pathname.includes('/download')) {
    return 'export';
  }
  return 'api';
}

/**
 * Check if endpoint is protected
 */
function isProtectedEndpoint(pathname: string): boolean {
  const protectedPaths = [
    '/api/analyze',
    '/api/scan',
    '/api/export',
    '/api/admin',
    '/api/security',
    '/api/keys',
    '/dashboard',
    '/admin',
  ];
  
  return protectedPaths.some(path => pathname.startsWith(path));
}

/**
 * Get required scope for endpoint
 */
function getRequiredScope(pathname: string): string | null {
  if (pathname.startsWith('/api/analyze')) return 'website:analyze';
  if (pathname.startsWith('/api/scan')) return 'website:scan';
  if (pathname.startsWith('/api/export')) return 'website:export';
  if (pathname.startsWith('/api/admin')) return 'admin:system';
  if (pathname.startsWith('/api/security')) return 'admin:security';
  if (pathname.startsWith('/api/keys')) return 'api:manage';
  
  return null;
}

/**
 * Generate comprehensive security headers
 */
function generateSecurityHeaders(request: NextRequest, context: SecurityContext): Record<string, string> {
  const isHTTPS = request.url.startsWith('https://');
  
  return {
    // Basic security headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // HSTS (only for HTTPS)
    ...(isHTTPS && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    }),
    
    // Content Security Policy
    'Content-Security-Policy': generateCSP(request),
    
    // Additional security headers
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    
    // Custom security headers
    'X-Security-Context': context.userTier,
    'X-Client-IP-Hash': hashIP(context.ip),
  };
}

/**
 * Generate Content Security Policy
 */
function generateCSP(request: NextRequest): string {
  const nonce = generateNonce();
  
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.openai.com https://api.anthropic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ];
  
  return directives.join('; ');
}

/**
 * Generate basic security headers (fallback)
 */
function generateBasicSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

/**
 * Determine security level
 */
function determineSecurityLevel(context: SecurityContext): string {
  if (context.apiKey) return 'api-authenticated';
  if (context.isAuthenticated) return 'user-authenticated';
  return 'anonymous';
}

/**
 * Generate nonce for CSP
 */
function generateNonce(): string {
  return Buffer.from(Math.random().toString(36)).toString('base64');
}

/**
 * Hash IP for privacy
 */
function hashIP(ip: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

/**
 * Create security error response
 */
export function createSecurityErrorResponse(
  reason: string,
  statusCode: number = 403,
  headers: Record<string, string> = {}
): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: 'Security check failed',
      message: reason,
      timestamp: new Date().toISOString(),
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...generateBasicSecurityHeaders(),
        ...headers,
      },
    }
  );
}