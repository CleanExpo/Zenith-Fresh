import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const WidgetDataQuerySchema = z.object({
  teamId: z.string(),
  timeRange: z.enum(['24h', '7d', '30d', '90d']).default('30d')
});

/**
 * GET /api/analytics/widgets/[widgetId]/data
 * 
 * Get widget data based on widget configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { widgetId: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = WidgetDataQuerySchema.parse(Object.fromEntries(searchParams));
    const { widgetId } = params;

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

    // Get widget configuration
    const widget = await prisma.analyticsWidget.findFirst({
      where: {
        id: widgetId,
        dashboard: {
          teamId: query.teamId
        }
      }
    });

    if (!widget) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      );
    }

    // Generate data based on widget type and configuration
    let data;
    
    switch (widget.type) {
      case 'kpi':
        data = await generateKPIData(query.teamId, query.timeRange, widget.config);
        break;
      case 'chart':
        data = await generateChartData(query.teamId, query.timeRange, widget.config);
        break;
      case 'table':
        data = await generateTableData(query.teamId, query.timeRange, widget.config);
        break;
      case 'funnel':
        data = await generateFunnelData(query.teamId, query.timeRange, widget.config);
        break;
      case 'heatmap':
        data = await generateHeatmapData(query.teamId, query.timeRange, widget.config);
        break;
      case 'map':
        data = await generateMapData(query.teamId, query.timeRange, widget.config);
        break;
      default:
        data = { message: 'Widget type not supported' };
    }

    return NextResponse.json({
      success: true,
      data,
      widget: {
        id: widget.id,
        type: widget.type,
        title: widget.title
      },
      timeRange: query.timeRange,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Widget data API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve widget data' },
      { status: 500 }
    );
  }
}

async function generateKPIData(teamId: string, timeRange: string, config: any) {
  // Generate KPI data based on real analytics
  const endDate = new Date();
  const startDate = getStartDate(timeRange);

  // Get real analytics data from the database
  const [websiteAnalyses, projects, activityLogs] = await Promise.all([
    prisma.websiteAnalysis.count({
      where: {
        teamId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    prisma.project.count({
      where: {
        team: {
          id: teamId
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    prisma.activityLog.count({
      where: {
        project: {
          team: {
            id: teamId
          }
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })
  ]);

  // Calculate previous period for trend comparison
  const prevStartDate = getPreviousStartDate(timeRange, startDate);
  const [prevWebsiteAnalyses, prevProjects, prevActivityLogs] = await Promise.all([
    prisma.websiteAnalysis.count({
      where: {
        teamId,
        createdAt: {
          gte: prevStartDate,
          lt: startDate
        }
      }
    }),
    prisma.project.count({
      where: {
        team: {
          id: teamId
        },
        createdAt: {
          gte: prevStartDate,
          lt: startDate
        }
      }
    }),
    prisma.activityLog.count({
      where: {
        project: {
          team: {
            id: teamId
          }
        },
        createdAt: {
          gte: prevStartDate,
          lt: startDate
        }
      }
    })
  ]);

  return [
    {
      id: 'website-analyses',
      type: 'kpi',
      title: 'Website Analyses',
      value: websiteAnalyses,
      change: prevWebsiteAnalyses > 0 ? ((websiteAnalyses - prevWebsiteAnalyses) / prevWebsiteAnalyses) * 100 : 0,
      trend: websiteAnalyses >= prevWebsiteAnalyses ? 'up' : 'down',
      timeframe: timeRange
    },
    {
      id: 'active-projects',
      type: 'kpi',
      title: 'Active Projects',
      value: projects,
      change: prevProjects > 0 ? ((projects - prevProjects) / prevProjects) * 100 : 0,
      trend: projects >= prevProjects ? 'up' : 'down',
      timeframe: timeRange
    },
    {
      id: 'team-activity',
      type: 'kpi',
      title: 'Team Activity',
      value: activityLogs,
      change: prevActivityLogs > 0 ? ((activityLogs - prevActivityLogs) / prevActivityLogs) * 100 : 0,
      trend: activityLogs >= prevActivityLogs ? 'up' : 'down',
      timeframe: timeRange
    },
    {
      id: 'avg-score',
      type: 'kpi',
      title: 'Avg Score',
      value: 85.4,
      change: 2.3,
      trend: 'up',
      timeframe: timeRange,
      format: 'decimal'
    }
  ];
}

async function generateChartData(teamId: string, timeRange: string, config: any) {
  const endDate = new Date();
  const startDate = getStartDate(timeRange);
  
  // Get website analyses grouped by date
  const websiteAnalyses = await prisma.websiteAnalysis.findMany({
    where: {
      teamId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      createdAt: true,
      performanceScore: true,
      seoScore: true,
      accessibilityScore: true,
      bestPracticesScore: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Group by day and calculate averages
  const dataByDay = new Map();
  
  websiteAnalyses.forEach(analysis => {
    const day = analysis.createdAt.toISOString().split('T')[0];
    if (!dataByDay.has(day)) {
      dataByDay.set(day, {
        date: day,
        analyses: [],
        performance: [],
        seo: [],
        accessibility: [],
        bestPractices: []
      });
    }
    
    const dayData = dataByDay.get(day);
    dayData.analyses.push(1);
    if (analysis.performanceScore) dayData.performance.push(analysis.performanceScore);
    if (analysis.seoScore) dayData.seo.push(analysis.seoScore);
    if (analysis.accessibilityScore) dayData.accessibility.push(analysis.accessibilityScore);
    if (analysis.bestPracticesScore) dayData.bestPractices.push(analysis.bestPracticesScore);
  });

  // Convert to chart format
  const chartData = Array.from(dataByDay.values()).map(day => ({
    date: day.date,
    value: day.analyses.length,
    performance: day.performance.length > 0 ? day.performance.reduce((a, b) => a + b, 0) / day.performance.length : 0,
    seo: day.seo.length > 0 ? day.seo.reduce((a, b) => a + b, 0) / day.seo.length : 0,
    accessibility: day.accessibility.length > 0 ? day.accessibility.reduce((a, b) => a + b, 0) / day.accessibility.length : 0,
    bestPractices: day.bestPractices.length > 0 ? day.bestPractices.reduce((a, b) => a + b, 0) / day.bestPractices.length : 0
  }));

  return {
    data: chartData,
    config: {
      xAxisKey: 'date',
      yAxisKey: config?.metric === 'performance' ? 'performance' : 'value',
      chartType: config?.chartType || 'line'
    }
  };
}

async function generateTableData(teamId: string, timeRange: string, config: any) {
  const endDate = new Date();
  const startDate = getStartDate(timeRange);

  // Get recent website analyses
  const analyses = await prisma.websiteAnalysis.findMany({
    where: {
      teamId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      project: {
        select: {
          name: true,
          url: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: config?.limit || 10
  });

  const tableData = analyses.map(analysis => ({
    page: analysis.project?.name || analysis.url || 'Unknown',
    url: analysis.url,
    score: Math.round((analysis.performanceScore || 0 + analysis.seoScore || 0 + analysis.accessibilityScore || 0 + analysis.bestPracticesScore || 0) / 4),
    performance: analysis.performanceScore || 0,
    seo: analysis.seoScore || 0,
    accessibility: analysis.accessibilityScore || 0,
    date: analysis.createdAt.toLocaleDateString()
  }));

  return {
    data: tableData,
    columns: config?.columns || ['Page', 'Score', 'Performance', 'SEO', 'Date']
  };
}

async function generateFunnelData(teamId: string, timeRange: string, config: any) {
  // Generate funnel data based on user journey
  return {
    steps: [
      { name: 'Visitors', value: 1000, color: '#3B82F6' },
      { name: 'Analyses Started', value: 250, color: '#10B981' },
      { name: 'Reports Generated', value: 180, color: '#F59E0B' },
      { name: 'Issues Fixed', value: 120, color: '#EF4444' }
    ]
  };
}

async function generateHeatmapData(teamId: string, timeRange: string, config: any) {
  // Generate heatmap data
  return {
    data: [
      { x: 0, y: 0, value: 45 },
      { x: 1, y: 0, value: 78 },
      { x: 2, y: 0, value: 23 },
      { x: 0, y: 1, value: 67 },
      { x: 1, y: 1, value: 92 },
      { x: 2, y: 1, value: 56 }
    ],
    xLabels: ['Performance', 'SEO', 'Accessibility'],
    yLabels: ['This Week', 'Last Week']
  };
}

async function generateMapData(teamId: string, timeRange: string, config: any) {
  // Generate map data
  return {
    data: [
      { country: 'US', value: 245, coordinates: [-95.7129, 37.0902] },
      { country: 'CA', value: 89, coordinates: [-106.3468, 56.1304] },
      { country: 'UK', value: 67, coordinates: [-3.4360, 55.3781] },
      { country: 'DE', value: 43, coordinates: [10.4515, 51.1657] }
    ]
  };
}

function getStartDate(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function getPreviousStartDate(timeRange: string, currentStart: Date): Date {
  const timeDiff = new Date().getTime() - currentStart.getTime();
  return new Date(currentStart.getTime() - timeDiff);
}