// src/app/api/cron/competitive-monitoring/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { competitiveAlertsEngine } from '@/lib/services/competitive-alerts-engine';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (in production, add proper authentication)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting competitive monitoring cron job...');
    
    const startTime = Date.now();
    
    // Process all active monitoring configurations
    await competitiveAlertsEngine.processMonitoringQueue();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Competitive monitoring cron job completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Competitive monitoring processed successfully',
        duration,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Competitive monitoring cron error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Competitive monitoring cron failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Manual trigger for testing (requires admin access)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminKey, teamId, targetDomain } = body;

    // Verify admin access
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Manual competitive monitoring trigger...');
    
    if (teamId && targetDomain) {
      // Process specific monitoring configuration
      console.log(`Processing monitoring for ${targetDomain} (team: ${teamId})`);
      // This would require modifying the engine to handle specific targets
    } else {
      // Process all configurations
      await competitiveAlertsEngine.processMonitoringQueue();
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Manual competitive monitoring completed',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Manual competitive monitoring error:', error);
    return NextResponse.json(
      { error: 'Manual trigger failed' },
      { status: 500 }
    );
  }
}