import { NextRequest, NextResponse } from 'next/server';
import { integrationTestSuite } from '@/lib/testing/comprehensive-integration-suite';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin users to run comprehensive tests
    if (session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { testType = 'comprehensive' } = body;

    let result;

    switch (testType) {
      case 'comprehensive':
        result = await integrationTestSuite.runComprehensiveTests();
        break;
      case 'performance':
        result = await integrationTestSuite.runPerformanceBenchmarks();
        break;
      case 'security':
        result = await integrationTestSuite.runSecurityValidation();
        break;
      case 'load':
        result = await integrationTestSuite.runLoadTests();
        break;
      default:
        return NextResponse.json({ error: 'Invalid test type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${testType} tests completed successfully`,
      data: result
    });

  } catch (error) {
    console.error('Testing suite failed:', error);
    return NextResponse.json(
      { error: 'Failed to run tests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return test suite capabilities and status
    return NextResponse.json({
      success: true,
      data: {
        capabilities: {
          comprehensive: true,
          performance: true,
          security: true,
          load: true,
          integration: true
        },
        status: {
          ready: true,
          environment: process.env.NODE_ENV,
          lastRun: new Date().toISOString()
        },
        configuration: {
          parallel: true,
          maxConcurrency: 10,
          defaultTimeout: 30000,
          retryCount: 2
        }
      }
    });

  } catch (error) {
    console.error('Failed to get test suite status:', error);
    return NextResponse.json(
      { error: 'Failed to get test suite status' },
      { status: 500 }
    );
  }
}