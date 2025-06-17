import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting configuration
const RATE_LIMIT = 100; // requests
const RATE_LIMIT_WINDOW = 60; // seconds
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

export default withAuth(
  function middleware(req: NextRequest) {
    // Rate limiting
    const ip = req.ip ?? 'anonymous';
    const now = Date.now();
    const requestData = ipRequestCounts.get(ip);

    if (requestData) {
      if (now > requestData.resetTime) {
        // Reset counter if window has passed
        ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW * 1000 });
      } else if (requestData.count >= RATE_LIMIT) {
        // Rate limit exceeded
        return new NextResponse('Too Many Requests', { status: 429 });
      } else {
        // Increment counter
        requestData.count++;
      }
    } else {
      // First request from this IP
      ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW * 1000 });
    }

    // Security headers
    const response = NextResponse.next();
    
    // CORS headers
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL!);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Security headers
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
    );

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/analytics/:path*',
    '/settings/:path*',
  ],
}; 