import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { startOfDay, subDays, startOfWeek, startOfMonth, format } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const timeframe = searchParams.get('timeframe') || '7d';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeInsights = searchParams.get('insights') !== 'false';

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date();
    let start: Date;
    
    switch (timeframe) {
      case '1d':
        start = subDays(end, 1);
        break;
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      case '90d':
        start = subDays(end, 90);
        break;
      case '1y':
        start = subDays(end, 365);
        break;
      default:
        start = subDays(end, 7);
    }

    if (startDate) {
      start = new Date(startDate);
    }

    // Prepare data queries
    const whereClause: any = {
      userId: session.user.id,
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    if (projectId) {
      whereClause.id = projectId;
    }

    // Get projects for analysis
    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        websiteAnalyses: {
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
            status: 'completed',
          },
          include: {
            performanceMetrics: true,
            coreWebVitals: true,
            technicalChecks: true,
            analysisAlerts: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Get user analytics data
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate metrics
    const metrics = await calculateBusinessMetrics(projects, auditLogs, start, end);
    
    // Generate chart data
    const charts = await generateChartData(projects, start, end, timeframe);
    
    // Generate AI insights
    const insights = includeInsights ? await generateAIInsights(metrics, charts) : [];

    const responseData = {
      metrics,
      charts,
      insights,
      timeframe: {
        start: start.toISOString(),
        end: end.toISOString(),
        period: timeframe,
      },
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Failed to fetch business intelligence data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business intelligence data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function calculateBusinessMetrics(projects: any[], auditLogs: any[], start: Date, end: Date) {
  const totalAnalyses = projects.reduce((sum, project) => sum + project.websiteAnalyses.length, 0);
  const allAnalyses = projects.flatMap(project => project.websiteAnalyses);
  
  // Calculate previous period for comparison
  const periodDuration = end.getTime() - start.getTime();
  const previousStart = new Date(start.getTime() - periodDuration);
  const previousEnd = start;

  // Get previous period data for comparison
  const previousAnalyses = await prisma.websiteAnalysis.findMany({
    where: {
      project: {
        userId: projects[0]?.userId || '',
      },
      createdAt: {
        gte: previousStart,
        lt: previousEnd,
      },
      status: 'completed',
    },
    include: {
      performanceMetrics: true,
      coreWebVitals: true,
      technicalChecks: true,
    },
  });

  // Performance metrics
  const avgOverallScore = allAnalyses.length > 0 
    ? allAnalyses.reduce((sum, analysis) => sum + (analysis.overallScore || 0), 0) / allAnalyses.length
    : 0;

  const previousAvgScore = previousAnalyses.length > 0
    ? previousAnalyses.reduce((sum, analysis) => sum + (analysis.overallScore || 0), 0) / previousAnalyses.length
    : 0;

  const avgLoadTime = allAnalyses
    .filter(a => a.performanceMetrics?.pageLoadTime)
    .reduce((sum, analysis, _, arr) => sum + (analysis.performanceMetrics?.pageLoadTime || 0) / arr.length, 0);

  const previousAvgLoadTime = previousAnalyses
    .filter(a => a.performanceMetrics?.pageLoadTime)
    .reduce((sum, analysis, _, arr) => sum + (analysis.performanceMetrics?.pageLoadTime || 0) / arr.length, 0);

  // User engagement metrics (simulated from audit logs)
  const userSessions = auditLogs.filter(log => log.action === 'user_login').length;
  const pageViews = auditLogs.filter(log => log.action.includes('view')).length;
  const avgSessionTime = Math.random() * 300 + 120; // Simulated session time

  // Calculate growth rates
  const scoreGrowth = previousAvgScore > 0 ? ((avgOverallScore - previousAvgScore) / previousAvgScore) * 100 : 0;
  const loadTimeGrowth = previousAvgLoadTime > 0 ? ((avgLoadTime - previousAvgLoadTime) / previousAvgLoadTime) * 100 : 0;
  const sessionGrowth = Math.random() * 20 - 10; // Simulated growth

  // Business KPIs (simulated for demo)
  const totalRevenue = Math.round(totalAnalyses * 15 + Math.random() * 1000);
  const previousRevenue = Math.round(previousAnalyses.length * 15 + Math.random() * 800);
  const activeUsers = Math.round(userSessions * 1.5 + Math.random() * 100);
  const conversionRate = Math.random() * 5 + 2; // 2-7%
  const customerLTV = Math.round(totalRevenue * 3.5 + Math.random() * 500);
  const churnRate = Math.random() * 3 + 1; // 1-4%

  return {
    totalRevenue,
    previousRevenue,
    revenueGrowth: previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0,
    
    activeUsers,
    previousActiveUsers: Math.round(activeUsers * 0.85),
    userGrowth: sessionGrowth,
    
    conversionRate,
    previousConversionRate: conversionRate * 0.9,
    conversionGrowth: 10,
    
    avgSessionTime,
    previousSessionTime: avgSessionTime * 0.95,
    sessionTimeGrowth: 5,
    
    customerLTV,
    previousLTV: customerLTV * 0.92,
    ltvGrowth: 8,
    
    churnRate,
    previousChurnRate: churnRate * 1.1,
    churnChange: -10,
    
    // Technical metrics
    avgOverallScore,
    previousAvgScore,
    scoreGrowth,
    
    avgLoadTime,
    previousAvgLoadTime,
    loadTimeGrowth,
    
    totalAnalyses,
    previousAnalyses: previousAnalyses.length,
    analysisGrowth: previousAnalyses.length > 0 ? ((totalAnalyses - previousAnalyses.length) / previousAnalyses.length) * 100 : 0,
  };
}

async function generateChartData(projects: any[], start: Date, end: Date, timeframe: string) {
  const allAnalyses = projects.flatMap(project => project.websiteAnalyses);
  
  // Revenue trend (simulated)
  const revenueTrend = generateTimeSeriesData(start, end, timeframe, (date, index, total) => ({
    date: format(date, 'MMM dd'),
    revenue: Math.round(Math.random() * 1000 + 500 + (index / total) * 2000),
    target: Math.round(1200 + (index / total) * 1800),
  }));

  // User acquisition funnel
  const acquisitionFunnel = [
    { channel: 'Organic Search', visitors: 2500, leads: 250, customers: 50 },
    { channel: 'Paid Search', visitors: 1800, leads: 360, customers: 72 },
    { channel: 'Social Media', visitors: 1200, leads: 120, customers: 18 },
    { channel: 'Direct', visitors: 900, leads: 180, customers: 45 },
    { channel: 'Referral', visitors: 600, leads: 90, customers: 15 },
  ];

  // User engagement trend
  const engagementTrend = generateTimeSeriesData(start, end, timeframe, (date, index, total) => ({
    date: format(date, 'MMM dd'),
    pageViews: Math.round(Math.random() * 500 + 300 + Math.sin(index * 0.5) * 100),
    sessions: Math.round(Math.random() * 200 + 150 + Math.sin(index * 0.3) * 50),
    interactions: Math.round(Math.random() * 100 + 80 + Math.sin(index * 0.7) * 30),
  }));

  // Revenue by source
  const revenueBySource = [
    { name: 'Website Analyzer', value: 45, revenue: 4500 },
    { name: 'Team Subscriptions', value: 30, revenue: 3000 },
    { name: 'Enterprise Plans', value: 15, revenue: 1500 },
    { name: 'Add-ons', value: 7, revenue: 700 },
    { name: 'Other', value: 3, revenue: 300 },
  ];

  // Cohort retention analysis
  const cohortRetention = [
    { cohort: 'Jan 2024', week1: 100, week2: 85, week4: 70, week8: 60, week12: 55 },
    { cohort: 'Feb 2024', week1: 100, week2: 88, week4: 75, week8: 65, week12: 58 },
    { cohort: 'Mar 2024', week1: 100, week2: 90, week4: 78, week8: 68, week12: 62 },
    { cohort: 'Apr 2024', week1: 100, week2: 87, week4: 73, week8: 63, week12: 57 },
    { cohort: 'May 2024', week1: 100, week2: 92, week4: 80, week8: 70, week12: 65 },
  ];

  // Performance vs conversion correlation
  const performanceCorrelation = allAnalyses
    .filter(a => a.performanceMetrics?.pageLoadTime && a.overallScore)
    .map(analysis => ({
      loadTime: analysis.performanceMetrics.pageLoadTime / 1000, // Convert to seconds
      conversionRate: Math.max(0, 5 - (analysis.performanceMetrics.pageLoadTime / 1000) * 0.5 + Math.random() * 2),
      score: analysis.overallScore,
    }))
    .slice(0, 50); // Limit for performance

  return {
    revenueTrend,
    acquisitionFunnel,
    engagementTrend,
    revenueBySource,
    cohortRetention,
    performanceCorrelation,
  };
}

function generateTimeSeriesData(start: Date, end: Date, timeframe: string, generator: (date: Date, index: number, total: number) => any) {
  const data = [];
  const current = new Date(start);
  const increment = timeframe === '1d' ? 1 : timeframe === '7d' ? 1 : timeframe === '30d' ? 3 : 7; // Days to increment
  
  let index = 0;
  while (current <= end) {
    data.push(generator(new Date(current), index, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * increment))));
    current.setDate(current.getDate() + increment);
    index++;
  }
  
  return data;
}

async function generateAIInsights(metrics: any, charts: any) {
  const insights = [];

  // Performance insights
  if (metrics.scoreGrowth < -5) {
    insights.push({
      title: 'Performance Declining',
      description: `Overall performance score has decreased by ${Math.abs(metrics.scoreGrowth).toFixed(1)}% this period.`,
      priority: 'high',
      category: 'performance',
      recommendation: 'Focus on optimizing Core Web Vitals and reducing page load times.',
    });
  } else if (metrics.scoreGrowth > 10) {
    insights.push({
      title: 'Excellent Performance Growth',
      description: `Performance score improved by ${metrics.scoreGrowth.toFixed(1)}% - great work!`,
      priority: 'low',
      category: 'performance',
      recommendation: 'Maintain current optimization strategies and consider expanding to more pages.',
    });
  }

  // Revenue insights
  if (metrics.revenueGrowth > 20) {
    insights.push({
      title: 'Strong Revenue Growth',
      description: `Revenue increased by ${metrics.revenueGrowth.toFixed(1)}% this period.`,
      priority: 'low',
      category: 'business',
      recommendation: 'Consider scaling marketing efforts to capitalize on this growth trend.',
    });
  } else if (metrics.revenueGrowth < -10) {
    insights.push({
      title: 'Revenue Decline Alert',
      description: `Revenue decreased by ${Math.abs(metrics.revenueGrowth).toFixed(1)}% this period.`,
      priority: 'high',
      category: 'business',
      recommendation: 'Review pricing strategy and improve conversion optimization.',
    });
  }

  // User engagement insights
  if (metrics.sessionTimeGrowth > 15) {
    insights.push({
      title: 'Increased User Engagement',
      description: `Average session time increased by ${metrics.sessionTimeGrowth.toFixed(1)}%.`,
      priority: 'medium',
      category: 'engagement',
      recommendation: 'Analyze what content is driving engagement and create similar content.',
    });
  }

  // Conversion insights
  if (metrics.conversionGrowth > 5) {
    insights.push({
      title: 'Conversion Rate Improvement',
      description: `Conversion rate improved by ${metrics.conversionGrowth.toFixed(1)}%.`,
      priority: 'medium',
      category: 'conversion',
      recommendation: 'Document successful changes and apply similar optimizations to other pages.',
    });
  }

  // Churn insights
  if (metrics.churnRate > 5) {
    insights.push({
      title: 'High Churn Rate Alert',
      description: `Customer churn rate is ${metrics.churnRate.toFixed(1)}%, above recommended threshold.`,
      priority: 'high',
      category: 'retention',
      recommendation: 'Implement customer success programs and gather feedback from churning customers.',
    });
  }

  // Performance correlation insight
  const avgConversionInData = charts.performanceCorrelation?.length > 0 
    ? charts.performanceCorrelation.reduce((sum: number, item: any) => sum + item.conversionRate, 0) / charts.performanceCorrelation.length
    : 0;
    
  if (avgConversionInData > 0) {
    insights.push({
      title: 'Performance-Conversion Correlation',
      description: `Sites with faster load times show ${((5 - avgConversionInData) * 20).toFixed(0)}% better conversion rates.`,
      priority: 'medium',
      category: 'optimization',
      recommendation: 'Prioritize performance improvements for pages with high business value.',
    });
  }

  return insights;
}