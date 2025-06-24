import { NextRequest, NextResponse } from 'next/server';
import { CronMonitors } from '@/lib/cron-monitoring';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await CronMonitors.databaseCleanup.monitor(async () => {
      const cleanupResults = {
        expiredSessions: 0,
        oldLogs: 0,
        orphanedRecords: 0,
      };

      // Clean up expired sessions (older than 30 days)
      const expiredSessionsResult = await prisma.session.deleteMany({
        where: {
          expires: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          },
        },
      });
      cleanupResults.expiredSessions = expiredSessionsResult.count;

      // Clean up old activity logs (older than 90 days)
      const oldLogsResult = await prisma.activityLog.deleteMany({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          },
        },
      });
      cleanupResults.oldLogs = oldLogsResult.count;

      // Clean up orphaned verification tokens (older than 7 days)
      const orphanedTokensResult = await prisma.verificationToken.deleteMany({
        where: {
          expires: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          },
        },
      });
      cleanupResults.orphanedRecords = orphanedTokensResult.count;

      console.log('Database cleanup completed:', cleanupResults);
      return cleanupResults;
    });

    return NextResponse.json({
      status: 'completed',
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('Database cleanup failed:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, {
      status: 500
    });
  }
}