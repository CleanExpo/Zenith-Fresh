import { NextRequest, NextResponse } from 'next/server';
import { getProviders } from 'next-auth/react';

/**
 * GET /api/auth/providers
 * 
 * Returns the list of authentication providers configured for NextAuth.js
 * This is a critical endpoint for authentication setup and client-side provider discovery.
 */
export async function GET(request: NextRequest) {
  try {
    // Get configured providers from NextAuth
    const providers = await getProviders();
    
    if (!providers) {
      return NextResponse.json(
        { 
          error: 'No authentication providers configured',
          providers: {},
          timestamp: new Date().toISOString()
        }, 
        { status: 500 }
      );
    }

    // Return providers with additional metadata
    return NextResponse.json({
      providers,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

  } catch (error) {
    console.error('Error fetching authentication providers:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch authentication providers',
        message: error instanceof Error ? error.message : 'Unknown error',
        providers: {},
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/auth/providers
 * 
 * Handle CORS preflight requests for authentication providers
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}