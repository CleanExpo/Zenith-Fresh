import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const KPIQuerySchema = z.object({
  teamId: z.string(),
  timeRange: z.enum(['24h', '7d', '30d', '90d', '1y']).default('30d'),
  category: z.enum(['revenue', 'users', 'engagement', 'performance']).optional(),
  metrics: z.string().optional() // Comma-separated list of specific metrics
});

interface KPI {
  id: string;
  type: 'kpi';
  title: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
  timeframe?: string;
  format?: 'number' | 'currency' | 'percentage';
  target?: number;
  icon?: string;
  color?: string;
  description?: string;
}

/**
 * GET /api/analytics/kpis
 * 
 * Get KPI data for dashboard widgets
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = KPIQuerySchema.parse(Object.fromEntries(searchParams));

    // Verify team access
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: query.teamId,
        userId: session.user.id
      }
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (query.timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Previous period for comparison
    const prevStartDate = new Date(startDate);
    const prevEndDate = new Date(startDate);
    const timeSpan = endDate.getTime() - startDate.getTime();
    prevStartDate.setTime(prevStartDate.getTime() - timeSpan);

    // Fetch KPI data
    const kpis = await calculateKPIs(query.teamId, startDate, endDate, prevStartDate, prevEndDate);

    return NextResponse.json({
      success: true,
      kpis,
      timeRange: query.timeRange,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('KPI API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPI data' },
      { status: 500 }
    );
  }
}

async function calculateKPIs(
  teamId: string, 
  startDate: Date, 
  endDate: Date, 
  prevStartDate: Date, 
  prevEndDate: Date
): Promise<KPI[]> {
  const kpis: KPI[] = [];

  try {
    // Total Users KPI
    const totalUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const prevTotalUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: prevStartDate,
          lte: prevEndDate
        }
      }
    });

    const userChange = prevTotalUsers > 0 ? ((totalUsers - prevTotalUsers) / prevTotalUsers) * 100 : 0;

    kpis.push({
      id: 'total-users',
      type: 'kpi',
      title: 'New Users',
      value: totalUsers,
      change: userChange,
      trend: userChange > 0 ? 'up' : userChange < 0 ? 'down' : 'flat',
      timeframe: 'vs previous period',
      format: 'number',
      icon: 'users',
      color: 'bg-blue-100',
      description: 'New user registrations'
    });

    // Website Analyses KPI
    const websiteAnalyses = await prisma.websiteAnalysis.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const prevWebsiteAnalyses = await prisma.websiteAnalysis.count({
      where: {
        createdAt: {
          gte: prevStartDate,
          lte: prevEndDate
        }
      }
    });

    const analysesChange = prevWebsiteAnalyses > 0 ? ((websiteAnalyses - prevWebsiteAnalyses) / prevWebsiteAnalyses) * 100 : 0;

    kpis.push({
      id: 'website-analyses',
      type: 'kpi',
      title: 'Website Analyses',
      value: websiteAnalyses,
      change: analysesChange,
      trend: analysesChange > 0 ? 'up' : analysesChange < 0 ? 'down' : 'flat',
      timeframe: 'vs previous period',
      format: 'number',
      icon: 'activity',
      color: 'bg-green-100',
      description: 'Website analysis reports generated'
    });

    // Active Projects KPI
    const activeProjects = await prisma.project.count({
      where: {
        status: 'active',
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const prevActiveProjects = await prisma.project.count({
      where: {
        status: 'active',
        updatedAt: {
          gte: prevStartDate,
          lte: prevEndDate
        }
      }
    });

    const projectsChange = prevActiveProjects > 0 ? ((activeProjects - prevActiveProjects) / prevActiveProjects) * 100 : 0;

    kpis.push({
      id: 'active-projects',
      type: 'kpi',
      title: 'Active Projects',
      value: activeProjects,
      change: projectsChange,
      trend: projectsChange > 0 ? 'up' : projectsChange < 0 ? 'down' : 'flat',
      timeframe: 'vs previous period',
      format: 'number',
      icon: 'target',
      color: 'bg-purple-100',
      description: 'Projects with recent activity'
    });

    // Team Activity KPI (Analytics Events)
    const analyticsEvents = await prisma.analyticsEvent.count({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const prevAnalyticsEvents = await prisma.analyticsEvent.count({
      where: {
        timestamp: {
          gte: prevStartDate,
          lte: prevEndDate
        }
      }
    });

    const eventsChange = prevAnalyticsEvents > 0 ? ((analyticsEvents - prevAnalyticsEvents) / prevAnalyticsEvents) * 100 : 0;

    kpis.push({
      id: 'platform-activity',
      type: 'kpi',
      title: 'Platform Activity',
      value: analyticsEvents,
      change: eventsChange,
      trend: eventsChange > 0 ? 'up' : eventsChange < 0 ? 'down' : 'flat',
      timeframe: 'vs previous period',
      format: 'number',
      icon: 'activity',
      color: 'bg-orange-100',
      description: 'Total platform interactions'
    });

    // Average Website Score KPI
    const avgScore = await prisma.websiteAnalysis.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _avg: {
        overallScore: true
      }
    });

    const prevAvgScore = await prisma.websiteAnalysis.aggregate({
      where: {
        createdAt: {
          gte: prevStartDate,
          lte: prevEndDate
        }
      },
      _avg: {
        overallScore: true
      }
    });

    const currentAvg = avgScore._avg.overallScore || 0;
    const prevAvg = prevAvgScore._avg.overallScore || 0;
    const scoreChange = prevAvg > 0 ? ((currentAvg - prevAvg) / prevAvg) * 100 : 0;

    kpis.push({
      id: 'avg-website-score',
      type: 'kpi',
      title: 'Avg. Website Score',
      value: Math.round(currentAvg),
      change: scoreChange,
      trend: scoreChange > 0 ? 'up' : scoreChange < 0 ? 'down' : 'flat',
      timeframe: 'vs previous period',
      format: 'number',
      target: 85,
      icon: 'trending-up',
      color: 'bg-yellow-100',
      description: 'Average website quality score'
    });

    // Conversion Rate KPI (simplified - using ratio of analyses to users)
    const conversionRate = totalUsers > 0 ? (websiteAnalyses / totalUsers) * 100 : 0;
    const prevConversionRate = prevTotalUsers > 0 ? (prevWebsiteAnalyses / prevTotalUsers) * 100 : 0;
    const conversionChange = prevConversionRate > 0 ? ((conversionRate - prevConversionRate) / prevConversionRate) * 100 : 0;

    kpis.push({
      id: 'conversion-rate',
      type: 'kpi',
      title: 'Analysis Rate',
      value: conversionRate,
      change: conversionChange,
      trend: conversionChange > 0 ? 'up' : conversionChange < 0 ? 'down' : 'flat',
      timeframe: 'vs previous period',
      format: 'percentage',
      target: 25,
      icon: 'target',
      color: 'bg-red-100',
      description: 'Percentage of users who run analyses'
    });

  } catch (error) {
    console.error('Error calculating KPIs:', error);
  }

  return kpis;
}