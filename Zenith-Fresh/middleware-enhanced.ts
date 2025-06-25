/**
 * Enhanced Security Middleware with Comprehensive Protection
 * Integrates rate limiting, DDoS protection, threat detection, and more
 */

import { NextResponse, NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';

// Note: These imports would work in a real environment with proper module resolution
// For now, we'll implement the core logic inline

// Configuration
const SECURITY_CONFIG = {
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  DDOS_THRESHOLD: 1000, // requests per minute
  PROTECTED_PATHS: ['/api/', '/dashboard/', '/admin/'],
  AUTH_PROTECTED_PATHS: ['/dashboard', '/admin'],
  PUBLIC_PATHS: ['/', '/about', '/pricing', '/contact', '/auth/signin', '/auth/signup'],
  MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
  THREAT_PATTERNS: {
    SQL_INJECTION: [
      /(\s*(union|select|insert|delete|update|drop|create|alter|exec|execute)\s+)/i,
      /((\%27)|(\'))\s*((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /(((\%27)|(\'))union|union.*select)/i,
    ],
    XSS: [
      /<script[^>]*>.*?<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[^>]*>/i,
    ],
    MALICIOUS_USER_AGENT: [
      /sqlmap/i,
      /nikto/i,
      /nessus/i,
      /burp/i,
      /nmap/i,
    ],
  },
};

// In-memory stores for edge runtime
const requestStore = new Map();
const threatStore = new Map();
const ddosStore = new Map();
const systemMetrics = {
  requestCount: 0,
  errorCount: 0,
  threatCount: 0,
  blockedCount: 0,
  lastReset: Date.now(),
};

/**
 * Enhanced security middleware with comprehensive protection
 */
export async function enhancedSecurityMiddleware(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Generate request ID for tracking
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Extract client information
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const method = request.method;
  
  try {
    // Update system metrics
    systemMetrics.requestCount++;
    
    // Step 1: Basic request validation
    const validationResult = validateRequest(request, ip, userAgent);
    if (!validationResult.allowed) {
      return createSecurityResponse(validationResult.reason!, 400, requestId);
    }
    
    // Step 2: Threat detection
    const threatResult = await detectThreats(request, ip, userAgent);
    if (threatResult.blocked) {
      systemMetrics.threatCount++;
      systemMetrics.blockedCount++;
      return createSecurityResponse(threatResult.reason!, 403, requestId);
    }
    
    // Step 3: DDoS protection
    const ddosResult = await checkDDoSProtection(ip, pathname);
    if (ddosResult.blocked) {
      systemMetrics.blockedCount++;
      return createSecurityResponse(ddosResult.reason!, 429, requestId);
    }
    
    // Step 4: Rate limiting
    const rateLimitResult = checkRateLimit(ip, pathname);
    if (!rateLimitResult.allowed) {
      systemMetrics.blockedCount++;
      return createRateLimitResponse(rateLimitResult);
    }
    
    // Step 5: Authentication check for protected paths
    if (isAuthProtectedPath(pathname)) {
      const token = request.cookies.get('next-auth.session-token') || 
                    request.cookies.get('__Secure-next-auth.session-token');
      
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
    }
    
    // Step 6: IP filtering (whitelist/blacklist)
    const ipFilterResult = await checkIPFiltering(ip);
    if (ipFilterResult.blocked) {
      systemMetrics.blockedCount++;
      return createSecurityResponse(ipFilterResult.reason!, 403, requestId);
    }
    
    // Log successful request (for monitoring)
    logSecurityEvent({
      type: 'REQUEST_ALLOWED',
      severity: 'LOW',
      ip,
      userAgent,
      pathname,
      method,
      requestId,
      timestamp: new Date().toISOString(),
    });
    
    // Create response with security headers
    const response = NextResponse.next();
    addSecurityHeaders(response, request, {
      requestId,
      processingTime: Date.now() - startTime,
      rateLimitRemaining: rateLimitResult.remaining,
      threatLevel: threatResult.level,
    });
    
    return response;
    
  } catch (error) {
    systemMetrics.errorCount++;
    console.error('Security middleware error:', error);
    
    // Log error
    logSecurityEvent({
      type: 'SYSTEM_ERROR',
      severity: 'HIGH',
      ip,
      userAgent,
      pathname,
      method,
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    
    // Fail-safe: allow request with basic security headers
    const response = NextResponse.next();
    addBasicSecurityHeaders(response);
    return response;
  }
}

/**
 * Validate basic request properties
 */
function validateRequest(request: NextRequest, ip: string, userAgent: string): { allowed: boolean; reason?: string } {
  // Check request size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > SECURITY_CONFIG.MAX_REQUEST_SIZE) {
    return { allowed: false, reason: 'Request too large' };
  }
  
  // Check for missing required headers
  if (!userAgent || userAgent === 'unknown') {
    return { allowed: false, reason: 'Invalid user agent' };
  }
  
  // Check for suspicious HTTP methods
  const suspiciousMethods = ['TRACE', 'CONNECT'];
  if (suspiciousMethods.includes(request.method)) {
    return { allowed: false, reason: 'Suspicious HTTP method' };
  }
  
  return { allowed: true };
}

/**
 * Detect various security threats
 */
async function detectThreats(
  request: NextRequest, 
  ip: string, 
  userAgent: string
): Promise<{ blocked: boolean; reason?: string; level: string }> {
  const url = new URL(request.url);
  const queryString = url.searchParams.toString();
  
  // Check for malicious user agents
  for (const pattern of SECURITY_CONFIG.THREAT_PATTERNS.MALICIOUS_USER_AGENT) {
    if (pattern.test(userAgent)) {
      logSecurityEvent({
        type: 'MALICIOUS_USER_AGENT',
        severity: 'HIGH',
        ip,
        userAgent,
        pattern: pattern.toString(),
        timestamp: new Date().toISOString(),
      });
      return { blocked: true, reason: 'Malicious user agent detected', level: 'HIGH' };
    }
  }
  
  // Check for SQL injection in URL
  for (const pattern of SECURITY_CONFIG.THREAT_PATTERNS.SQL_INJECTION) {
    if (pattern.test(queryString) || pattern.test(url.pathname)) {
      logSecurityEvent({
        type: 'SQL_INJECTION_ATTEMPT',
        severity: 'CRITICAL',
        ip,
        userAgent,
        pattern: pattern.toString(),
        target: queryString || url.pathname,
        timestamp: new Date().toISOString(),
      });
      return { blocked: true, reason: 'SQL injection attempt detected', level: 'CRITICAL' };
    }
  }
  
  // Check for XSS in URL
  for (const pattern of SECURITY_CONFIG.THREAT_PATTERNS.XSS) {
    if (pattern.test(queryString) || pattern.test(url.pathname)) {
      logSecurityEvent({
        type: 'XSS_ATTEMPT',
        severity: 'HIGH',
        ip,
        userAgent,
        pattern: pattern.toString(),
        target: queryString || url.pathname,
        timestamp: new Date().toISOString(),
      });
      return { blocked: true, reason: 'XSS attempt detected', level: 'HIGH' };
    }
  }
  
  // Check for directory traversal
  if (/\.\.\/|\.\.\\/.test(url.pathname)) {
    logSecurityEvent({
      type: 'DIRECTORY_TRAVERSAL',
      severity: 'HIGH',
      ip,
      userAgent,
      target: url.pathname,
      timestamp: new Date().toISOString(),
    });
    return { blocked: true, reason: 'Directory traversal attempt detected', level: 'HIGH' };
  }
  
  return { blocked: false, level: 'LOW' };
}

/**
 * Check for DDoS attacks
 */
async function checkDDoSProtection(ip: string, pathname: string): Promise<{ blocked: boolean; reason?: string }> {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  
  // Get or initialize IP request history
  if (!ddosStore.has(ip)) {
    ddosStore.set(ip, []);
  }
  
  const requests = ddosStore.get(ip);
  
  // Clean old requests
  const recentRequests = requests.filter((timestamp: number) => timestamp > windowStart);
  ddosStore.set(ip, recentRequests);
  
  // Add current request
  recentRequests.push(now);
  
  // Check for DDoS threshold
  if (recentRequests.length > SECURITY_CONFIG.DDOS_THRESHOLD) {
    logSecurityEvent({
      type: 'DDOS_DETECTED',
      severity: 'CRITICAL',
      ip,
      requestCount: recentRequests.length,
      pathname,
      timestamp: new Date().toISOString(),
    });
    
    return { blocked: true, reason: 'DDoS attack detected' };
  }
  
  // Check for rapid request spikes
  if (recentRequests.length > SECURITY_CONFIG.DDOS_THRESHOLD * 0.7) {
    logSecurityEvent({
      type: 'TRAFFIC_SPIKE',
      severity: 'HIGH',
      ip,
      requestCount: recentRequests.length,
      pathname,
      timestamp: new Date().toISOString(),
    });
  }
  
  return { blocked: false };
}

/**
 * Enhanced rate limiting
 */
function checkRateLimit(clientId: string, pathname: string): { allowed: boolean; remaining: number; resetTime: Date } {
  const now = Date.now();
  const windowStart = now - SECURITY_CONFIG.RATE_LIMIT_WINDOW;
  
  // Determine rate limit based on path
  let limit = SECURITY_CONFIG.RATE_LIMIT_REQUESTS;
  if (pathname.startsWith('/api/')) {
    limit = Math.floor(limit * 0.5); // Stricter for API endpoints
  }
  
  if (!requestStore.has(clientId)) {
    requestStore.set(clientId, []);
  }
  
  const requests = requestStore.get(clientId);
  
  // Clean old requests
  const validRequests = requests.filter((timestamp: number) => timestamp > windowStart);
  requestStore.set(clientId, validRequests);
  
  // Check limit
  if (validRequests.length >= limit) {
    logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      severity: 'MEDIUM',
      ip: clientId,
      requestCount: validRequests.length,
      limit,
      pathname,
      timestamp: new Date().toISOString(),
    });
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(now + SECURITY_CONFIG.RATE_LIMIT_WINDOW),
    };
  }
  
  // Add current request
  validRequests.push(now);
  
  return {
    allowed: true,
    remaining: limit - validRequests.length,
    resetTime: new Date(now + SECURITY_CONFIG.RATE_LIMIT_WINDOW),
  };
}

/**
 * Check IP filtering (simplified for edge runtime)
 */
async function checkIPFiltering(ip: string): Promise<{ blocked: boolean; reason?: string }> {
  // Simplified IP blocking for common attack sources
  const blockedRanges = [
    '0.0.0.0',
    '127.0.0.1',
    '169.254.', // Link-local addresses
    '224.', // Multicast
    '255.255.255.255',
  ];
  
  for (const range of blockedRanges) {
    if (ip.startsWith(range)) {
      return { blocked: true, reason: 'IP address not allowed' };
    }
  }
  
  // Check threat history (simplified)
  const threatHistory = threatStore.get(ip) || 0;
  if (threatHistory > 10) {
    return { blocked: true, reason: 'IP has exceeded threat threshold' };
  }
  
  return { blocked: false };
}

/**
 * Check if path requires authentication
 */
function isAuthProtectedPath(pathname: string): boolean {
  return SECURITY_CONFIG.AUTH_PROTECTED_PATHS.some(path => pathname.startsWith(path));
}

/**
 * Check if path is protected
 */
function isProtectedPath(pathname: string): boolean {
  return SECURITY_CONFIG.PROTECTED_PATHS.some(path => pathname.startsWith(path));
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
 * Add comprehensive security headers
 */
function addSecurityHeaders(
  response: NextResponse, 
  request: NextRequest, 
  context: {
    requestId: string;
    processingTime: number;
    rateLimitRemaining: number;
    threatLevel: string;
  }
): void {
  const isHTTPS = request.url.startsWith('https://');
  
  // Basic security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS (only for HTTPS)
  if (isHTTPS) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.openai.com https://api.anthropic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);
  
  // Additional security headers
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  
  // Custom headers
  response.headers.set('X-Request-ID', context.requestId);
  response.headers.set('X-Processing-Time', context.processingTime.toString());
  response.headers.set('X-Rate-Limit-Remaining', context.rateLimitRemaining.toString());
  response.headers.set('X-Threat-Level', context.threatLevel);
  response.headers.set('X-Security-Version', '2.0');
}

/**
 * Add basic security headers (fallback)
 */
function addBasicSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
}

/**
 * Create security error response
 */
function createSecurityResponse(reason: string, statusCode: number, requestId: string): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: 'Security check failed',
      message: reason,
      requestId,
      timestamp: new Date().toISOString(),
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-Request-ID': requestId,
      },
    }
  );
}

/**
 * Create rate limit response
 */
function createRateLimitResponse(rateLimitResult: { remaining: number; resetTime: Date }): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000).toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.getTime().toString(),
      },
    }
  );
}

/**
 * Log security events (simplified for edge runtime)
 */
function logSecurityEvent(event: any): void {
  console.log(JSON.stringify({
    ...event,
    source: 'security-middleware',
    version: '2.0',
  }));
  
  // Update threat store for IP-based tracking
  if (event.ip && ['HIGH', 'CRITICAL'].includes(event.severity)) {
    const current = threatStore.get(event.ip) || 0;
    threatStore.set(event.ip, current + 1);
  }
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  return enhancedSecurityMiddleware(request);
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};