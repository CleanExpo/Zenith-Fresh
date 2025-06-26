import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const url = searchParams.get('url');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const exportFormat = searchParams.get('export'); // csv, json
    const comparison = searchParams.get('comparison'); // period, competitor
    const competitorUrl = searchParams.get('competitorUrl');

    if (!projectId) {
      return NextResponse.json(
        { error: 'ProjectId is required' },
        { status: 400 }
      );
    }

    // Validate project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const whereClause: any = {
      projectId,
      status: 'completed',
    };

    if (url) {
      whereClause.url = url;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    // Get analytics data
    const analyses = await prisma.websiteAnalysis.findMany({
      where: whereClause,
      include: {
        performanceMetrics: true,
        coreWebVitals: true,
        technicalChecks: true,
        analysisAlerts: {
          where: { isResolved: false },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate aggregated statistics
    const stats = calculateAnalyticsStats(analyses);

    // Handle comparison requests
    let comparisonData = null;
    if (comparison === 'competitor' && competitorUrl) {
      comparisonData = await getCompetitorComparison(projectId, competitorUrl);
    } else if (comparison === 'period' && startDate && endDate) {
      comparisonData = await getPeriodComparison(projectId, url, startDate, endDate);
    }

    const responseData = {
      analytics: stats,
      rawData: analyses,
      comparison: comparisonData,
      timeframe: {
        start: startDate,
        end: endDate,
        period: endDate && startDate ? 
          `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}` : 
          'All time',
      },
    };

    // Handle export formats
    if (exportFormat === 'csv') {
      const csv = convertToCSV(analyses);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${projectId}-${Date.now()}.csv"`,
        },
      });
    }

    if (exportFormat === 'json') {
      return new NextResponse(JSON.stringify(responseData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="analytics-${projectId}-${Date.now()}.json"`,
        },
      });
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

function calculateAnalyticsStats(analyses: any[]) {
  if (analyses.length === 0) {
    return {
      totalAnalyses: 0,
      averageScore: 0,
      scoreDistribution: {},
      performanceTrends: {},
      alerts: { total: 0, byType: {}, bySeverity: {} },
    };
  }

  const scores = analyses.map(a => a.overallScore).filter(s => s !== null);
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  // Score distribution
  const scoreDistribution = {
    excellent: scores.filter(s => s >= 90).length,
    good: scores.filter(s => s >= 70 && s < 90).length,
    needsWork: scores.filter(s => s >= 50 && s < 70).length,
    poor: scores.filter(s => s < 50).length,
  };

  // Performance trends
  const performanceTrends = {
    loadTime: {
      average: calculateAverage(analyses.map(a => a.performanceMetrics?.pageLoadTime).filter(Boolean)),
      trend: calculateTrend(analyses.map(a => a.performanceMetrics?.pageLoadTime).filter(Boolean)),
    },
    coreWebVitals: {
      lcp: calculateAverage(analyses.map(a => a.coreWebVitals?.largestContentfulPaint).filter((score): score is number => score !== undefined)),
      fid: calculateAverage(analyses.map(a => a.coreWebVitals?.firstInputDelay).filter((score): score is number => score !== undefined)),
      cls: calculateAverage(analyses.map(a => a.coreWebVitals?.cumulativeLayoutShift).filter((score): score is number => score !== undefined)),
    },
    scores: {
      performance: calculateAverage(analyses.map(a => a.performanceMetrics ? 
        (a.performanceMetrics.cacheScore + a.performanceMetrics.compressionScore) / 2 : null).filter((score): score is number => score !== null)),
      accessibility: calculateAverage(analyses.map(a => a.technicalChecks?.accessibilityScore).filter((score): score is number => score !== undefined)),
      seo: calculateAverage(analyses.map(a => a.technicalChecks?.seoScore).filter((score): score is number => score !== undefined)),
      security: calculateAverage(analyses.map(a => a.technicalChecks?.securityScore).filter((score): score is number => score !== undefined)),
    },
  };

  // Alert statistics
  const allAlerts = analyses.flatMap(a => a.analysisAlerts || []);
  const alertStats = {
    total: allAlerts.length,
    byType: allAlerts.reduce((acc: any, alert) => {
      acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
      return acc;
    }, {}),
    bySeverity: allAlerts.reduce((acc: any, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {}),
  };

  return {
    totalAnalyses: analyses.length,
    averageScore: Math.round(averageScore),
    scoreDistribution,
    performanceTrends,
    alerts: alertStats,
    timeframe: {
      earliest: analyses[analyses.length - 1]?.createdAt,
      latest: analyses[0]?.createdAt,
    },
  };
}

function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
}

function calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
  if (values.length < 2) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (change > 5) return 'improving';
  if (change < -5) return 'declining';
  return 'stable';
}

async function getCompetitorComparison(projectId: string, competitorUrl: string) {
  const competitorAnalyses = await prisma.competitorAnalysis.findMany({
    where: {
      projectId,
      competitorUrl,
    },
    orderBy: { analysisDate: 'desc' },
    take: 10,
  });

  return competitorAnalyses.map(analysis => ({
    date: analysis.analysisDate,
    competitorScore: analysis.overallScore,
    scoreDifference: analysis.scoreDifference,
    loadTimeDifference: analysis.loadTimeDifference,
  }));
}

async function getPeriodComparison(projectId: string, url: string | null, startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Calculate period duration
  const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // Get data for comparison period (same duration before start date)
  const comparisonStart = new Date(start.getTime() - (periodDays * 24 * 60 * 60 * 1000));
  
  const whereClause: any = {
    projectId,
    status: 'completed',
  };
  
  if (url) {
    whereClause.url = url;
  }

  const currentPeriod = await prisma.websiteAnalysis.findMany({
    where: {
      ...whereClause,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      performanceMetrics: true,
      coreWebVitals: true,
      technicalChecks: true,
    },
  });

  const previousPeriod = await prisma.websiteAnalysis.findMany({
    where: {
      ...whereClause,
      createdAt: {
        gte: comparisonStart,
        lt: start,
      },
    },
    include: {
      performanceMetrics: true,
      coreWebVitals: true,
      technicalChecks: true,
    },
  });

  const currentStats = calculateAnalyticsStats(currentPeriod);
  const previousStats = calculateAnalyticsStats(previousPeriod);

  return {
    current: currentStats,
    previous: previousStats,
    changes: {
      scoreChange: currentStats.averageScore - previousStats.averageScore,
      analysisCountChange: currentStats.totalAnalyses - previousStats.totalAnalyses,
      alertChange: currentStats.alerts.total - previousStats.alerts.total,
    },
  };
}

function convertToCSV(analyses: any[]): string {
  if (analyses.length === 0) return '';

  const headers = [
    'Date',
    'URL',
    'Overall Score',
    'Page Load Time',
    'LCP',
    'FID',
    'CLS',
    'Performance Score',
    'Accessibility Score',
    'SEO Score',
    'Security Score',
    'Alert Count',
  ];

  const rows = analyses.map(analysis => [
    format(new Date(analysis.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    analysis.url,
    analysis.overallScore || 0,
    analysis.performanceMetrics?.pageLoadTime || 0,
    analysis.coreWebVitals?.largestContentfulPaint || 0,
    analysis.coreWebVitals?.firstInputDelay || 0,
    analysis.coreWebVitals?.cumulativeLayoutShift || 0,
    analysis.performanceMetrics ? 
      Math.round((analysis.performanceMetrics.cacheScore + analysis.performanceMetrics.compressionScore) / 2) : 0,
    analysis.technicalChecks?.accessibilityScore || 0,
    analysis.technicalChecks?.seoScore || 0,
    analysis.technicalChecks?.securityScore || 0,
    analysis.analysisAlerts?.length || 0,
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}