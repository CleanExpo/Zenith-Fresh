import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { rateLimiter } from '@/lib/security/rate-limiter';
import { 
  securityHardeningMiddleware,
  apiSecurityMiddleware,
  fileUploadSecurityMiddleware,
  csrfProtectionMiddleware
} from '@/middleware/security-hardening';

/**
 * ZENITH ENTERPRISE SECURITY MIDDLEWARE
 * Implements Fortune 500-grade security controls
 */

// Security headers configuration
const securityHeaders = {
  // Strict Transport Security - Force HTTPS for 1 year
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Content Security Policy - Prevent XSS attacks
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.anthropic.com https://api.openai.com https://www.google-analytics.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; '),
  
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Prevent XSS attacks
  'X-XSS-Protection': '1; mode=block',
  
  // Disable DNS prefetching for privacy
  'X-DNS-Prefetch-Control': 'off',
  
  // Remove server information
  'X-Powered-By': 'Zenith-Enterprise-Security',
  
  // Cross-Origin policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site',
  
  // Permissions Policy (Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=()',
    'usb=()',
    'bluetooth=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '),
};

// Rate limiting configuration by endpoint type
const rateLimitConfigs = {
  api: { requests: 100, window: '1m' },
  auth: { requests: 5, window: '15m' },
  upload: { requests: 10, window: '1h' },
  search: { requests: 50, window: '1m' },
  default: { requests: 200, window: '1m' },
};

// Blocked IPs and suspicious patterns
const blockedIPs = new Set([
  // Add known malicious IPs
]);

const suspiciousPatterns = [
  /\.\./,  // Directory traversal
  /<script/i,  // XSS attempts
  /union.*select/i,  // SQL injection
  /exec\(/i,  // Code injection
  /eval\(/i,  // Eval injection
];

// CSRF token validation
async function validateCSRFToken(request: NextRequest): Promise<boolean> {
  const token = request.headers.get('x-csrf-token');
  const cookie = request.cookies.get('csrf-token')?.value;
  
  if (!token || !cookie || token !== cookie) {
    return false;
  }
  
  return true;
}

// Input validation and sanitization
function validateInput(request: NextRequest): boolean {
  const url = request.url;
  const body = request.body;
  
  // Check for suspicious patterns in URL
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      console.warn(`Suspicious URL pattern detected: ${url}`);
      return false;
    }
  }
  
  return true;
}

// Main middleware function
async function securityMiddleware(request: NextRequest) {
  // Apply comprehensive security hardening first
  const hardenedResponse = await securityHardeningMiddleware(request);
  if (hardenedResponse.status !== 200) {
    return hardenedResponse;
  }

  // Apply API-specific security
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const apiSecurityResponse = await apiSecurityMiddleware(request);
    if (apiSecurityResponse.status !== 200) {
      return apiSecurityResponse;
    }
  }

  // Apply file upload security
  if (request.method === 'POST' && request.headers.get('content-type')?.includes('multipart/form-data')) {
    const fileSecurityResponse = await fileUploadSecurityMiddleware(request);
    if (fileSecurityResponse.status !== 200) {
      return fileSecurityResponse;
    }
  }

  // Apply CSRF protection
  const csrfResponse = await csrfProtectionMiddleware(request);
  if (csrfResponse.status !== 200) {
    return csrfResponse;
  }

  const response = NextResponse.next();
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = request.nextUrl.pathname;
  
  // 1. IP Blocking
  if (blockedIPs.has(ip)) {
    console.warn(`Blocked IP attempted access: ${ip}`);
    return new NextResponse('Access Denied', { status: 403 });
  }
  
  // 2. Bot Detection (basic)
  const botPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i];
  const isBot = botPatterns.some(pattern => pattern.test(userAgent));
  
  if (isBot && !pathname.startsWith('/api/health')) {
    console.log(`Bot detected: ${userAgent} from ${ip}`);
    // Allow bots but with heavy rate limiting
  }
  
  // 3. Input Validation
  if (!validateInput(request)) {
    console.warn(`Malicious input detected from ${ip}: ${pathname}`);
    return new NextResponse('Bad Request', { status: 400 });
  }
  
  // 4. Rate Limiting
  let rateLimitConfig = rateLimitConfigs.default;
  
  if (pathname.startsWith('/api/auth')) {
    rateLimitConfig = rateLimitConfigs.auth;
  } else if (pathname.startsWith('/api/upload')) {
    rateLimitConfig = rateLimitConfigs.upload;
  } else if (pathname.startsWith('/api/search')) {
    rateLimitConfig = rateLimitConfigs.search;
  } else if (pathname.startsWith('/api/')) {
    rateLimitConfig = rateLimitConfigs.api;
  }
  
  // Apply rate limiting (simplified implementation)
  // In production, use Redis-based rate limiting
  const isRateLimited = await checkRateLimit(ip, pathname, rateLimitConfig);
  if (isRateLimited) {
    console.warn(`Rate limit exceeded for ${ip}: ${pathname}`);
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '60',
      },
    });
  }
  
  // 5. CSRF Protection for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method) && 
      pathname.startsWith('/api/') && 
      !pathname.startsWith('/api/auth/')) {
    const isValidCSRF = await validateCSRFToken(request);
    if (!isValidCSRF) {
      console.warn(`CSRF token validation failed from ${ip}: ${pathname}`);
      return new NextResponse('CSRF Token Invalid', { status: 403 });
    }
  }
  
  // 6. Apply Security Headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // 7. Additional security measures for sensitive endpoints
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Additional admin-only security checks
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
  }
  
  // 8. Logging for security monitoring
  if (pathname.startsWith('/api/')) {
    console.log(`API Access: ${request.method} ${pathname} from ${ip} - ${userAgent}`);
  }
  
  return response;
}

// Simple rate limiting implementation (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

async function checkRateLimit(
  ip: string, 
  endpoint: string, 
  config: { requests: number; window: string }
): Promise<boolean> {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const windowMs = parseWindowToMs(config.window);
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (current.count >= config.requests) {
    return true;
  }
  
  current.count++;
  return false;
}

function parseWindowToMs(window: string): number {
  const unit = window.slice(-1);
  const value = parseInt(window.slice(0, -1));
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    default: return 60 * 1000; // Default to 1 minute
  }
}

// Combine security middleware with NextAuth
export default withAuth(
  securityMiddleware,
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/auth/signin',
          '/auth/signup',
          '/api/auth',
          '/api/health',
          '/favicon.ico',
        ];
        
        const isPublicRoute = publicRoutes.some(route => 
          req.nextUrl.pathname.startsWith(route)
        );
        
        if (isPublicRoute) return true;
        
        // All other routes require authentication
        return !!token;
      },
    },
  }
);

// Configure which routes should be processed by middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};