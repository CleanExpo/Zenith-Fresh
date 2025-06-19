import { NextRequest, NextResponse } from 'next/server';
import { CronMonitors } from '@/lib/cron-monitoring';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis';

export async function GET(req: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await CronMonitors.healthCheck.monitor(async () => {
      // Check database connectivity
      await prisma.$queryRaw`SELECT 1`;
      
      // Check Redis connectivity
      await cache.set('health-check', Date.now(), 60);
      await cache.get('health-check');
      
      // Check external API connectivity (example)
      const response = await fetch('https://api.github.com/status', {
        timeout: 5000,
      });
      
      if (!response.ok) {
        throw new Error(`External API check failed: ${response.status}`);
      }
      
      console.log('Health check passed all tests');
    });

    return NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        redis: 'ok',
        external_api: 'ok'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { 
      status: 500 
    });
  }
}