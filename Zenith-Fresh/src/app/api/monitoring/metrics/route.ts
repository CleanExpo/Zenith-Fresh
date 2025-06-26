import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * API endpoint for error metrics reporting and retrieval
 */
export async function POST(request: NextRequest) {
  try {
    const { metrics, timestamp } = await request.json();
    
    if (!metrics || !timestamp) {
      return NextResponse.json(
        { error: 'Missing metrics or timestamp' },
        { status: 400 }
      );
    }

    // Get user session for context
    const session = await getServerSession(authOptions);
    
    // Store metrics snapshot
    await prisma.auditLog.create({
      data: {
        action: 'METRICS_REPORTED',
        details: {
          metrics,
          reportedAt: timestamp,
          userAgent: request.headers.get('user-agent'),
          source: 'error-tracking-service'
        },
        userId: session?.user?.id || null
      }
    });

    // Check for concerning metrics
    if (metrics.errorRate > 0.1) { // 10% error rate
      console.warn('HIGH ERROR RATE DETECTED:', {
        errorRate: metrics.errorRate,
        errorCount: metrics.errorCount,
        userId: session?.user?.id,
        timestamp
      });

      // Alert for high error rates in production
      if (process.env.NODE_ENV === 'production') {
        await handleHighErrorRateAlert(metrics, session?.user);
      }
    }

    return NextResponse.json({ 
      success: true,
      metricsReceived: timestamp
    });

  } catch (error) {
    console.error('Failed to process metrics report:', error);
    
    return NextResponse.json(
      { error: 'Failed to process metrics report' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for metrics dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '24h';
    
    // Calculate time range
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };
    
    const timeRange = timeRanges[timeframe as keyof typeof timeRanges] || timeRanges['24h'];
    const startTime = new Date(Date.now() - timeRange);

    // Get error metrics
    const [errorLogs, metricsReports] = await Promise.all([
      // Recent errors
      prisma.auditLog.findMany({
        where: {
          action: 'ERROR_OCCURRED',
          createdAt: {
            gte: startTime
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      // Metrics reports
      prisma.auditLog.findMany({
        where: {
          action: 'METRICS_REPORTED',
          createdAt: {
            gte: startTime
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    ]);

    // Calculate current metrics
    const currentMetrics = calculateCurrentMetrics(errorLogs, timeRange);
    
    // Get historical trends
    const trends = calculateTrends(errorLogs, timeRange);
    
    // Get latest metrics report
    const latestMetricsReport = metricsReports[0]?.details || null;

    return NextResponse.json({
      timeframe,
      current: currentMetrics,
      trends,
      latestReport: latestMetricsReport,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get metrics:', error);
    
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}

/**
 * Calculate current error metrics
 */
function calculateCurrentMetrics(errors: any[], timeRangeMs: number) {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  
  // Recent errors (last hour)
  const recentErrors = errors.filter(error => 
    new Date(error.timestamp).getTime() > oneHourAgo
  );

  // Error rate calculation (errors per 1000 requests - simplified)
  const errorRate = recentErrors.length / 1000;

  // Group by level
  const errorsByLevel = errors.reduce((acc, error) => {
    const level = (error.details as any)?.level || 'unknown';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by component
  const errorsByComponent = errors.reduce((acc, error) => {
    const component = (error.details as any)?.componentName || 'unknown';
    acc[component] = (acc[component] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top error messages
  const errorMessages = errors.reduce((acc, error) => {
    const message = (error.details as any)?.message || 'unknown';
    acc[message] = (acc[message] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topErrors = Object.entries(errorMessages)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([message, count]) => ({ message, count }));

  return {
    totalErrors: errors.length,
    recentErrors: recentErrors.length,
    errorRate,
    errorsByLevel,
    errorsByComponent,
    topErrors,
    lastError: errors[0]?.timestamp || null
  };
}

/**
 * Calculate error trends over time
 */
function calculateTrends(errors: any[], timeRangeMs: number) {
  const now = Date.now();
  const bucketSize = Math.max(timeRangeMs / 24, 60 * 60 * 1000); // At least 1 hour buckets
  const buckets: Record<string, number> = {};

  errors.forEach(error => {
    const timestamp = new Date(error.timestamp).getTime();
    const bucketKey = Math.floor(timestamp / bucketSize) * bucketSize;
    const bucketTime = new Date(bucketKey).toISOString();
    buckets[bucketTime] = (buckets[bucketTime] || 0) + 1;
  });

  // Convert to array and sort
  const trends = Object.entries(buckets)
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return trends;
}

/**
 * Handle high error rate alerts
 */
async function handleHighErrorRateAlert(metrics: any, user?: any) {
  try {
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: `⚠️ High Error Rate Alert`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*High Error Rate Detected*\n\n*Error Rate:* ${(metrics.errorRate * 100).toFixed(2)}%\n*Total Errors:* ${metrics.errorCount}\n*Top Errors:*\n${metrics.topErrors?.slice(0, 3).map((e: any) => `• ${e.message} (${e.count}x)`).join('\n') || 'None'}\n*Time:* ${new Date().toISOString()}`
              }
            }
          ]
        })
      });
    }
  } catch (alertError) {
    console.error('Failed to send high error rate alert:', alertError);
  }
}