import { NextRequest, NextResponse } from 'next/server';
import { monthlyReleaseAgent } from '@/lib/agents/monthly-release-agent';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin users to trigger monthly releases
    if (session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const releasePackage = await monthlyReleaseAgent.generateMonthlyRelease();

    return NextResponse.json({
      success: true,
      message: 'Monthly release generated successfully',
      data: {
        version: releasePackage.version,
        featuresCount: releasePackage.releaseNotes.split('###').length - 1,
        testCoverage: releasePackage.testResults.unitTestCoverage,
        deploymentStrategy: releasePackage.deploymentConfig.rolloutStrategy
      }
    });

  } catch (error) {
    console.error('Monthly release generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate monthly release', details: error instanceof Error ? error.message : 'Unknown error' },
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

    // Return release status and history
    return NextResponse.json({
      success: true,
      data: {
        lastRelease: {
          version: '1.0.0',
          date: new Date().toISOString(),
          status: 'deployed'
        },
        nextScheduledRelease: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        releaseFrequency: 'monthly'
      }
    });

  } catch (error) {
    console.error('Failed to get release status:', error);
    return NextResponse.json(
      { error: 'Failed to get release status' },
      { status: 500 }
    );
  }
}