/**
 * Enhanced Security Middleware with Comprehensive Protection
 * Integrates rate limiting, DDoS protection, threat detection, and more
 */

import { NextResponse, NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';

// Configuration
const RATE_LIMIT_REQUESTS = 100;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const PROTECTED_PATHS = ['/api/', '/dashboard/', '/admin/'];
const AUTH_PROTECTED_PATHS = ['/dashboard', '/admin'];
const PUBLIC_PATHS = ['/', '/about', '/pricing', '/contact', '/auth/signin', '/auth/signup'];

// In-memory store for edge runtime
const requestStore = new Map();
const systemMetrics = {
  requestCount: 0,
  errorCount: 0,
  lastReset: Date.now()
};

/**
 * Check if path requires protection
 */
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(path => pathname.startsWith(path));
}

/**
 * Check if path requires authentication
 */
function isAuthProtectedPath(pathname: string): boolean {
  return AUTH_PROTECTED_PATHS.some(path => pathname.startsWith(path));
}

/**
 * Check if path is publicly accessible
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next/');
}

/**
 * Rate limiting implementation
 */
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!requestStore.has(clientId)) {
    requestStore.set(clientId, []);
  }
  
  const requests = requestStore.get(clientId);
  
  // Clean old requests
  const validRequests = requests.filter((timestamp: number) => timestamp > windowStart);
  requestStore.set(clientId, validRequests);
  
  // Check limit
  if (validRequests.length >= RATE_LIMIT_REQUESTS) {
    return false;
  }
  
  // Add current request
  validRequests.push(now);
  return true;
}

/**
 * Get system health metrics
 */
function getSystemHealth() {
  const now = Date.now();
  const timeSinceReset = now - systemMetrics.lastReset;
  
  // Reset metrics every hour
  if (timeSinceReset > 3600000) {
    systemMetrics.requestCount = 0;
    systemMetrics.errorCount = 0;
    systemMetrics.lastReset = now;
  }
  
  const errorRate = systemMetrics.requestCount > 0 
    ? systemMetrics.errorCount / systemMetrics.requestCount 
    : 0;
  
  const requestRate = timeSinceReset > 0 
    ? (systemMetrics.requestCount / timeSinceReset) * 1000 
    : 0;
  
  return {
    requestCount: systemMetrics.requestCount,
    errorCount: systemMetrics.errorCount,
    errorRate,
    requestRate,
    isHealthy: errorRate < 0.1 && requestRate < 100 // Less than 10% error rate and 100 req/sec
  };
}

/**
 * Create rate limit response
 */
function createRateLimitResponse() {
  return new NextResponse(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil(RATE_LIMIT_WINDOW / 1000).toString(),
        'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': (Date.now() + RATE_LIMIT_WINDOW).toString()
      }
    }
  );
}

/**
 * Create maintenance response
 */
function createMaintenanceResponse() {
  return new NextResponse(
    JSON.stringify({
      error: 'System maintenance',
      message: 'System is currently under maintenance. Please try again later.',
      retryAfter: 300
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '300'
      }
    }
  );
}

/**
 * Log request for monitoring
 */
function logRequest(request: NextRequest, clientId: string, allowed = true) {
  // const { geo } = geolocation(request); // Commented out due to missing @vercel/edge package
  const url = new URL(request.url);
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method: request.method,
    pathname: url.pathname,
    clientId: clientId.substring(0, 16) + '***', // Mask for privacy
    userAgent: request.headers.get('user-agent')?.substring(0, 100),
    // country: geo?.country,  // Commented out due to missing @vercel/edge package
    // city: geo?.city,        // Commented out due to missing @vercel/edge package
    allowed,
    systemHealth: getSystemHealth()
  }));
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Handle authentication for protected paths
  if (isAuthProtectedPath(pathname)) {
    // Check for NextAuth session token
    const token = request.cookies.get('next-auth.session-token') || 
                  request.cookies.get('__Secure-next-auth.session-token');
    
    if (!token) {
      // Redirect to sign-in page
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }
  
  return trafficManagementMiddleware(request);
}

/**
 * Traffic management middleware function
 */
function trafficManagementMiddleware(request: NextRequest) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Update system metrics
    systemMetrics.requestCount++;
    
    // Get client identification
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const clientId = `${clientIp}-${userAgent.slice(0, 20)}`;
    
    // Skip middleware for public static assets
    if (pathname.startsWith('/_next/static/') || 
        pathname.startsWith('/favicon.ico') ||
        pathname.includes('.')) {
      return NextResponse.next();
    }
    
    // Check system health
    const health = getSystemHealth();
    if (!health.isHealthy && !isPublicPath(pathname)) {
      logRequest(request, clientId, false);
      systemMetrics.errorCount++;
      return createMaintenanceResponse();
    }
    
    // Apply rate limiting to protected paths
    if (isProtectedPath(pathname)) {
      if (!checkRateLimit(clientId)) {
        logRequest(request, clientId, false);
        return createRateLimitResponse();
      }
    }
    
    // Log successful request
    logRequest(request, clientId, true);
    
    // Create response with performance headers
    const response = NextResponse.next();
    const processingTime = Date.now() - startTime;
    
    // Add performance and monitoring headers
    response.headers.set('X-Processing-Time', processingTime.toString());
    response.headers.set('X-Request-ID', `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    response.headers.set('X-System-Health', health.isHealthy ? 'healthy' : 'degraded');
    response.headers.set('X-Rate-Limit-Limit', RATE_LIMIT_REQUESTS.toString());
    
    // Add rate limit headers for protected paths
    if (isProtectedPath(pathname)) {
      const requests = requestStore.get(clientId) || [];
      const remaining = Math.max(0, RATE_LIMIT_REQUESTS - requests.length);
      
      response.headers.set('X-Rate-Limit-Remaining', remaining.toString());
      response.headers.set('X-Rate-Limit-Reset', (Date.now() + RATE_LIMIT_WINDOW).toString());
    }
    
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
    
  } catch (error) {
    systemMetrics.errorCount++;
    console.error('Middleware error:', error);
    
    // Return graceful fallback
    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};