import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of API routes that should have caching
const CACHEABLE_ROUTES = [
  '/api/website-analyzer/scan',
  '/api/projects',
  '/api/teams',
  '/api/user-success-metrics',
  '/api/system-monitor',
  '/api/security/stats',
  '/api/billing/plans'
];

// List of routes that should skip performance monitoring
const SKIP_MONITORING = [
  '/api/health',
  '/_next',
  '/static',
  '/favicon.ico'
];

// Simple timer without Redis dependency
class DevPerformanceMonitor {
  static startTimer(): { stop: () => number } {
    const startTime = process.hrtime.bigint();
    
    return {
      stop: () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
        return duration;
      }
    };
  }

  static async recordMetric(metric: any): Promise<void> {
    // In development mode without Redis, just log slow requests
    if (metric.duration > 200) {
      console.warn(`[DEV] Slow request: ${metric.endpoint} took ${metric.duration.toFixed(2)}ms`);
    }
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip non-API routes and static assets
  if (!path.startsWith('/api/') || SKIP_MONITORING.some(skip => path.startsWith(skip))) {
    return NextResponse.next();
  }

  const timer = DevPerformanceMonitor.startTimer();
  
  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  
  // Add performance tracking header
  requestHeaders.set('x-request-start', Date.now().toString());
  
  // Enable compression hint
  requestHeaders.set('accept-encoding', 'gzip, deflate, br');

  // Create the response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Add cache headers for cacheable routes (without Redis)
  if (CACHEABLE_ROUTES.some(route => path.startsWith(route)) && request.method === 'GET') {
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
    response.headers.set('Vary', 'Accept-Encoding, Authorization');
  } else {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }

  // Add CORS headers for API routes
  if (path.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  }

  // Add performance timing header
  const duration = timer.stop();
  response.headers.set('X-Middleware-Time', `${duration.toFixed(2)}ms`);
  response.headers.set('X-Redis-Status', 'disabled-dev-mode');

  // Record middleware performance without Redis
  if (!SKIP_MONITORING.some(skip => path.startsWith(skip))) {
    DevPerformanceMonitor.recordMetric({
      endpoint: `middleware:${path}`,
      method: request.method,
      duration,
      statusCode: response.status,
      timestamp: Date.now()
    }).catch(console.error);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};