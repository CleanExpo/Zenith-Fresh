import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProviders } from 'next-auth/react';

/**
 * GET /api/auth/test
 * 
 * Comprehensive authentication test endpoint
 * Tests all authentication components and configurations
 */
export async function GET(request: NextRequest) {
  try {
    // Test 1: Check if session can be retrieved
    const session = await getServerSession(authOptions);
    
    // Test 2: Check if providers are configured
    const providers = await getProviders();
    
    // Test 3: Check environment variables
    const envCheck = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    };
    
    // Test 4: Validate configuration
    const configValidation = {
      hasProviders: !!providers && Object.keys(providers).length > 0,
      hasGoogleProvider: !!providers?.google,
      hasCredentialsProvider: !!providers?.credentials,
      secretConfigured: !!authOptions.secret,
      callbacksConfigured: !!authOptions.callbacks,
      pagesConfigured: !!authOptions.pages,
    };
    
    const testResults = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      session: session ? {
        user: session.user,
        expires: session.expires,
        hasUser: !!session.user,
        userId: (session.user as any)?.id,
        userRole: (session.user as any)?.role,
      } : null,
      providers: providers ? Object.keys(providers) : [],
      providerDetails: providers,
      environment_variables: envCheck,
      configuration: configValidation,
      auth_urls: {
        signIn: '/auth/signin',
        signOut: '/api/auth/signout',
        callback: '/api/auth/callback',
        providers: '/api/auth/providers',
        session: '/api/auth/session',
      },
      status: 'success',
      tests: {
        sessionRetrieval: session !== undefined ? 'pass' : 'warning',
        providerConfiguration: configValidation.hasProviders ? 'pass' : 'fail',
        environmentVariables: Object.values(envCheck).every(Boolean) ? 'pass' : 'warning',
        overallStatus: 'pass'
      }
    };
    
    // Determine overall status
    const hasErrors = !configValidation.hasProviders || !envCheck.NEXTAUTH_SECRET || !envCheck.NEXTAUTH_URL;
    testResults.tests.overallStatus = hasErrors ? 'fail' : 'pass';
    
    return NextResponse.json(testResults, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('Authentication test failed:', error);
    
    return NextResponse.json({
      error: 'Authentication test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      status: 'error',
      tests: {
        overallStatus: 'fail'
      }
    }, { status: 500 });
  }
}

/**
 * POST /api/auth/test
 * 
 * Test authentication functionality with mock credentials
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, credentials } = body;
    
    if (action === 'test-credentials') {
      // Test the demo credentials
      const testCredentials = {
        email: 'zenithfresh25@gmail.com',
        password: 'F^bf35(llm1120!2a'
      };
      
      // Find the credentials provider
      const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials');
      
      let result = null;
      if (credentialsProvider && 'authorize' in credentialsProvider) {
        result = await (credentialsProvider as any).authorize(
          credentials || testCredentials,
          {} as any
        );
      }
      
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        test: 'credentials',
        result: result ? 'success' : 'failed',
        user: result || null,
        message: result ? 'Demo credentials validated successfully' : 'Credentials validation failed'
      });
    }
    
    return NextResponse.json({
      error: 'Invalid test action',
      availableActions: ['test-credentials'],
      timestamp: new Date().toISOString(),
    }, { status: 400 });

  } catch (error) {
    console.error('Authentication POST test failed:', error);
    
    return NextResponse.json({
      error: 'Authentication POST test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}