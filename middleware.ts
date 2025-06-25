/**
 * Next.js Middleware
 * Handles authentication, rate limiting, and usage tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { usageTrackingMiddleware } from '@/middleware/usage-tracking';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and auth routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const token = await getToken({ req: request as any });
  
  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/team',
    '/billing',
    '/settings',
    '/api/team',
    '/api/billing',
    '/api/analytics',
  ];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute && !token) {
    // Redirect to sign in
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Apply usage tracking for API routes
  if (pathname.startsWith('/api/') && token) {
    const usageResponse = await usageTrackingMiddleware(request);
    if (usageResponse) {
      return usageResponse;
    }
  }

  // Admin-only routes
  const adminRoutes = [
    '/admin',
    '/api/admin',
    '/api/billing/analytics',
  ];

  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  
  if (isAdminRoute && token?.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};