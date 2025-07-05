/**
 * Next.js Middleware - COMPLETELY DISABLED FOR DEBUGGING
 * Temporarily disabled to isolate server error
 */

import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // COMPLETELY DISABLED - Just pass through all requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Disable middleware for now
    '/disabled-middleware-path-that-never-matches',
  ],
};
