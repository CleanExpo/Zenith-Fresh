import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';

// Simple middleware for production compatibility
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow all static files and public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/user') ||
    pathname.startsWith('/auth') ||
    pathname === '/' ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Only protect specific authenticated routes
  const protectedRoutes = ['/dashboard', '/projects', '/analytics', '/settings'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Use NextAuth middleware only for protected routes
    return withAuth(
      function middleware(req: NextRequest) {
        return NextResponse.next();
      },
      {
        callbacks: {
          authorized: ({ token }) => !!token,
        },
        pages: {
          signIn: '/auth/signin',
        },
      }
    )(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 