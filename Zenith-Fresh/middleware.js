/**
 * Next.js Middleware - Basic Version
 * Simple request handling without external dependencies
 */

import { NextResponse } from 'next/server';

export function middleware(request) {
  // Basic middleware that doesn't use @vercel/edge
  const response = NextResponse.next();
  
  // Add basic security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  return response;
}

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
}