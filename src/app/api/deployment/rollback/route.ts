import { NextRequest, NextResponse } from 'next/server';
import { deploymentPipeline } from '@/lib/deployment/zero-downtime-pipeline';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin users to trigger rollbacks
    if (session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { sessionId, targetVersion, force, preserveData } = body;

    const rollbackSession = await deploymentPipeline.rollback(sessionId, {
      targetVersion,
      force,
      preserveData
    });

    return NextResponse.json({
      success: true,
      message: 'Rollback completed successfully',
      data: {
        sessionId: rollbackSession.id,
        targetVersion: rollbackSession.version,
        status: rollbackSession.status,
        startTime: rollbackSession.startTime,
        endTime: rollbackSession.endTime,
        duration: rollbackSession.duration
      }
    });

  } catch (error) {
    console.error('Rollback failed:', error);
    return NextResponse.json(
      { error: 'Failed to execute rollback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}