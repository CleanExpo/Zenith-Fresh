import { NextRequest, NextResponse } from 'next/server';
import { deploymentPipeline } from '@/lib/deployment/zero-downtime-pipeline';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin users to trigger deployments
    if (session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { version, environment, strategy, skipHealthChecks, dryRun } = body;

    if (!version) {
      return NextResponse.json({ error: 'Version is required' }, { status: 400 });
    }

    const deploymentSession = await deploymentPipeline.deploy(version, {
      environment,
      strategy,
      skipHealthChecks,
      dryRun
    });

    return NextResponse.json({
      success: true,
      message: 'Deployment started successfully',
      data: {
        sessionId: deploymentSession.id,
        version: deploymentSession.version,
        environment: deploymentSession.environment,
        strategy: deploymentSession.strategy,
        status: deploymentSession.status,
        startTime: deploymentSession.startTime,
        stepsCount: deploymentSession.steps.length
      }
    });

  } catch (error) {
    console.error('Deployment failed:', error);
    return NextResponse.json(
      { error: 'Failed to start deployment', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (sessionId) {
      // Get specific deployment status
      const deploymentStatus = await deploymentPipeline.getDeploymentStatus(sessionId);
      
      if (!deploymentStatus) {
        return NextResponse.json({ error: 'Deployment session not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: deploymentStatus
      });
    } else {
      // Get deployment history
      const history = await deploymentPipeline.getDeploymentHistory(limit);
      
      return NextResponse.json({
        success: true,
        data: {
          deployments: history,
          total: history.length
        }
      });
    }

  } catch (error) {
    console.error('Failed to get deployment status:', error);
    return NextResponse.json(
      { error: 'Failed to get deployment status' },
      { status: 500 }
    );
  }
}