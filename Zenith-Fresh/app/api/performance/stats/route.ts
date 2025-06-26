import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PerformanceMonitor } from '@/lib/performance';
import { RedisOperations } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const timeRange = searchParams.get('timeRange') || '1h';

    if (endpoint) {
      // Get stats for specific endpoint
      const stats = await PerformanceMonitor.getEndpointStats(endpoint);
      
      if (!stats) {
        return NextResponse.json(
          { error: 'No performance data available for this endpoint' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        endpoint,
        stats,
        timeRange
      });
    }

    // Get overall performance metrics
    const criticalEndpoints = [
      '/api/website-analyzer/scan',
      '/api/auth/[...nextauth]',
      '/api/projects',
      '/api/teams',
      '/api/website-analyzer/analyze',
      '/api/billing/subscription',
      '/api/security/events'
    ];

    const performanceData = await Promise.all(
      criticalEndpoints.map(async (ep) => {
        const stats = await PerformanceMonitor.getEndpointStats(ep);
        return {
          endpoint: ep,
          stats: stats || {
            count: 0,
            avgDuration: 0,
            maxDuration: 0,
            minDuration: 0,
            errorCount: 0,
            lastUpdated: null
          }
        };
      })
    );

    // Calculate overall health score
    const totalRequests = performanceData.reduce((sum, d) => sum + (d.stats.count || 0), 0);
    const totalErrors = performanceData.reduce((sum, d) => sum + (d.stats.errorCount || 0), 0);
    const avgResponseTime = performanceData.reduce((sum, d) => {
      return sum + (d.stats.avgDuration || 0) * (d.stats.count || 0);
    }, 0) / (totalRequests || 1);

    const healthScore = calculateHealthScore(avgResponseTime, totalErrors, totalRequests);

    // Get Redis connection status
    let redisHealthy = false;
    try {
      const testKey = 'perf:health:check';
      await RedisOperations.set(testKey, 'ok', 10);
      const result = await RedisOperations.get(testKey);
      redisHealthy = result === 'ok';
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    return NextResponse.json({
      summary: {
        healthScore,
        totalRequests,
        totalErrors,
        errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime),
        targetResponseTime: 200,
        performanceStatus: avgResponseTime < 200 ? 'optimal' : avgResponseTime < 500 ? 'acceptable' : 'poor',
        redisHealthy
      },
      endpoints: performanceData.sort((a, b) => 
        (b.stats.avgDuration || 0) - (a.stats.avgDuration || 0)
      ),
      recommendations: generateRecommendations(performanceData, avgResponseTime),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Performance stats API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function calculateHealthScore(avgResponseTime: number, errors: number, requests: number): number {
  if (requests === 0) return 100;

  // Response time score (0-50 points)
  let responseScore = 50;
  if (avgResponseTime > 200) {
    responseScore = Math.max(0, 50 - ((avgResponseTime - 200) / 10));
  }

  // Error rate score (0-50 points)
  const errorRate = (errors / requests) * 100;
  let errorScore = 50;
  if (errorRate > 0) {
    errorScore = Math.max(0, 50 - (errorRate * 5));
  }

  return Math.round(responseScore + errorScore);
}

function generateRecommendations(
  performanceData: any[],
  avgResponseTime: number
): string[] {
  const recommendations: string[] = [];

  // Check for slow endpoints
  const slowEndpoints = performanceData.filter(d => 
    d.stats.avgDuration > 500
  );

  if (slowEndpoints.length > 0) {
    recommendations.push(
      `Optimize slow endpoints: ${slowEndpoints.map(e => e.endpoint).join(', ')}`
    );
  }

  // Check for high error rates
  const errorProneEndpoints = performanceData.filter(d => 
    d.stats.count > 0 && (d.stats.errorCount / d.stats.count) > 0.05
  );

  if (errorProneEndpoints.length > 0) {
    recommendations.push(
      `Investigate high error rates in: ${errorProneEndpoints.map(e => e.endpoint).join(', ')}`
    );
  }

  // General recommendations based on average response time
  if (avgResponseTime > 200) {
    recommendations.push('Consider implementing more aggressive caching strategies');
    recommendations.push('Review database query optimization and indexing');
  }

  if (avgResponseTime > 500) {
    recommendations.push('Critical: Response times are significantly above target');
    recommendations.push('Consider horizontal scaling or infrastructure upgrades');
  }

  // Check for endpoints with no caching
  const uncachedEndpoints = performanceData.filter(d => 
    d.endpoint.includes('GET') && d.stats.avgDuration > 100
  );

  if (uncachedEndpoints.length > 0) {
    recommendations.push('Enable caching for frequently accessed GET endpoints');
  }

  if (recommendations.length === 0) {
    recommendations.push('Performance is optimal - continue monitoring');
  }

  return recommendations;
}