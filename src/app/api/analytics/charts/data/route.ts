import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ChartQuerySchema = z.object({
  teamId: z.string(),
  timeRange: z.enum(['24h', '7d', '30d', '90d', '1y']).default('30d'),
  chartType: z.enum(['line', 'area', 'bar', 'pie', 'composed']),
  metric: z.string().optional(),
  metrics: z.string().optional(), // Comma-separated
  aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).default('count'),
  breakdown: z.string().optional() // Field to break down by
});

/**
 * GET /api/analytics/charts/data
 * 
 * Get chart data for analytics widgets
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = ChartQuerySchema.parse(Object.fromEntries(searchParams));

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

    // Generate chart data based on query
    const chartData = await generateChartData(query, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: chartData,
      timeRange: query.timeRange,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Chart data API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}

async function generateChartData(
  query: z.infer<typeof ChartQuerySchema>,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const data: any[] = [];

  try {
    // Determine time intervals
    const intervals = getTimeIntervals(startDate, endDate, query.timeRange);
    
    // Process each interval
    for (const interval of intervals) {
      const dataPoint: any = {
        date: formatDateForChart(interval.start, query.timeRange)
      };

      if (query.metric === 'users' || query.metrics?.includes('users')) {
        // User growth data
        const userCount = await prisma.user.count({
          where: {
            createdAt: {
              gte: interval.start,
              lt: interval.end
            }
          }
        });
        dataPoint.users = userCount;
      }

      if (query.metric === 'analyses' || query.metrics?.includes('analyses')) {
        // Website analyses data
        const analysisCount = await prisma.websiteAnalysis.count({
          where: {
            createdAt: {
              gte: interval.start,
              lt: interval.end
            }
          }
        });
        dataPoint.analyses = analysisCount;
      }

      if (query.metric === 'projects' || query.metrics?.includes('projects')) {
        // Project activity data
        const projectCount = await prisma.project.count({
          where: {
            createdAt: {
              gte: interval.start,
              lt: interval.end
            }
          }
        });
        dataPoint.projects = projectCount;
      }

      if (query.metric === 'events' || query.metrics?.includes('events')) {
        // Analytics events data
        const eventCount = await prisma.analyticsEvent.count({
          where: {
            timestamp: {
              gte: interval.start,
              lt: interval.end
            }
          }
        });
        dataPoint.events = eventCount;
      }

      if (query.metric === 'score' || query.metrics?.includes('score')) {
        // Average website score data
        const avgScore = await prisma.websiteAnalysis.aggregate({
          where: {
            createdAt: {
              gte: interval.start,
              lt: interval.end
            }
          },
          _avg: {
            overallScore: true
          }
        });
        dataPoint.score = Math.round(avgScore._avg.overallScore || 0);
      }

      // Default metrics if none specified
      if (!query.metric && !query.metrics) {
        const userCount = await prisma.user.count({
          where: {
            createdAt: {
              gte: interval.start,
              lt: interval.end
            }
          }
        });
        
        const analysisCount = await prisma.websiteAnalysis.count({
          where: {
            createdAt: {
              gte: interval.start,
              lt: interval.end
            }
          }
        });

        dataPoint.users = userCount;
        dataPoint.analyses = analysisCount;
      }

      data.push(dataPoint);
    }

    // For pie charts, aggregate data differently
    if (query.chartType === 'pie') {
      return await generatePieChartData(query, startDate, endDate);
    }

  } catch (error) {
    console.error('Error generating chart data:', error);
  }

  return data;
}

async function generatePieChartData(
  query: z.infer<typeof ChartQuerySchema>,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const data: any[] = [];

  try {
    // Browser distribution (mock data - would come from analytics events)
    if (query.metric === 'browsers' || query.breakdown === 'browser') {
      const browsers = [
        { name: 'Chrome', value: Math.floor(Math.random() * 1000) + 500 },
        { name: 'Firefox', value: Math.floor(Math.random() * 500) + 200 },
        { name: 'Safari', value: Math.floor(Math.random() * 400) + 150 },
        { name: 'Edge', value: Math.floor(Math.random() * 300) + 100 },
        { name: 'Other', value: Math.floor(Math.random() * 200) + 50 }
      ];
      data.push(...browsers);
    }
    
    // Traffic sources (mock data)
    else if (query.metric === 'sources' || query.breakdown === 'source') {
      const sources = [
        { name: 'Organic Search', value: Math.floor(Math.random() * 800) + 400 },
        { name: 'Direct', value: Math.floor(Math.random() * 600) + 300 },
        { name: 'Social Media', value: Math.floor(Math.random() * 400) + 200 },
        { name: 'Referral', value: Math.floor(Math.random() * 300) + 150 },
        { name: 'Email', value: Math.floor(Math.random() * 200) + 100 }
      ];
      data.push(...sources);
    }
    
    // Device types
    else if (query.metric === 'devices' || query.breakdown === 'device') {
      const devices = [
        { name: 'Desktop', value: Math.floor(Math.random() * 600) + 400 },
        { name: 'Mobile', value: Math.floor(Math.random() * 800) + 500 },
        { name: 'Tablet', value: Math.floor(Math.random() * 200) + 100 }
      ];
      data.push(...devices);
    }
    
    // Default: User activity distribution
    else {
      const activities = [
        { name: 'Website Analysis', value: Math.floor(Math.random() * 500) + 300 },
        { name: 'Project Creation', value: Math.floor(Math.random() * 300) + 200 },
        { name: 'Team Collaboration', value: Math.floor(Math.random() * 400) + 250 },
        { name: 'Report Generation', value: Math.floor(Math.random() * 200) + 150 }
      ];
      data.push(...activities);
    }

  } catch (error) {
    console.error('Error generating pie chart data:', error);
  }

  return data;
}

function getTimeIntervals(startDate: Date, endDate: Date, timeRange: string) {
  const intervals = [];
  const current = new Date(startDate);

  while (current < endDate) {
    const intervalStart = new Date(current);
    const intervalEnd = new Date(current);

    switch (timeRange) {
      case '24h':
        intervalEnd.setHours(intervalEnd.getHours() + 1);
        break;
      case '7d':
        intervalEnd.setDate(intervalEnd.getDate() + 1);
        break;
      case '30d':
        intervalEnd.setDate(intervalEnd.getDate() + 1);
        break;
      case '90d':
        intervalEnd.setDate(intervalEnd.getDate() + 3);
        break;
      case '1y':
        intervalEnd.setDate(intervalEnd.getDate() + 7);
        break;
    }

    if (intervalEnd > endDate) {
      intervalEnd.setTime(endDate.getTime());
    }

    intervals.push({
      start: intervalStart,
      end: intervalEnd
    });

    current.setTime(intervalEnd.getTime());
  }

  return intervals;
}

function formatDateForChart(date: Date, timeRange: string): string {
  switch (timeRange) {
    case '24h':
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    case '7d':
    case '30d':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    case '90d':
    case '1y':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    default:
      return date.toLocaleDateString();
  }
}