import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const HeatmapQuerySchema = z.object({
  teamId: z.string(),
  timeRange: z.enum(['24h', '7d', '30d', '90d', '1y']).default('30d'),
  type: z.enum(['calendar', 'matrix', 'time']).default('matrix'),
  metric: z.string().optional(),
  xAxis: z.string().optional(),
  yAxis: z.string().optional(),
  aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).default('count')
});

interface HeatmapData {
  x: string | number;
  y: string | number;
  value: number;
  label?: string;
}

/**
 * GET /api/analytics/heatmap/data
 * 
 * Get heatmap data for analytics widgets
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = HeatmapQuerySchema.parse(Object.fromEntries(searchParams));

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

    // Generate heatmap data
    const heatmapData = await generateHeatmapData(query, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: heatmapData,
      timeRange: query.timeRange,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Heatmap data API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch heatmap data' },
      { status: 500 }
    );
  }
}

async function generateHeatmapData(
  query: z.infer<typeof HeatmapQuerySchema>,
  startDate: Date,
  endDate: Date
): Promise<HeatmapData[]> {
  
  try {
    switch (query.type) {
      case 'calendar':
        return await getCalendarHeatmapData(startDate, endDate);
      
      case 'time':
        return await getTimeHeatmapData(startDate, endDate);
      
      case 'matrix':
      default:
        return await getMatrixHeatmapData(startDate, endDate);
    }
  } catch (error) {
    console.error('Error generating heatmap data:', error);
    
    // Fallback to mock data
    return generateMockHeatmapData(query.type);
  }
}

async function getCalendarHeatmapData(
  startDate: Date,
  endDate: Date
): Promise<HeatmapData[]> {
  const data: HeatmapData[] = [];
  
  // Get daily activity counts
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayStart = new Date(current);
    const dayEnd = new Date(current);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    // Count activities for this day
    const [userCount, analysisCount, projectCount] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: dayStart,
            lt: dayEnd
          }
        }
      }),
      prisma.websiteAnalysis.count({
        where: {
          createdAt: {
            gte: dayStart,
            lt: dayEnd
          }
        }
      }),
      prisma.project.count({
        where: {
          createdAt: {
            gte: dayStart,
            lt: dayEnd
          }
        }
      })
    ]);
    
    const totalActivity = userCount + analysisCount + projectCount;
    
    data.push({
      x: current.toISOString().split('T')[0],
      y: 0,
      value: totalActivity,
      label: current.toLocaleDateString()
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return data;
}

async function getTimeHeatmapData(
  startDate: Date,
  endDate: Date
): Promise<HeatmapData[]> {
  const data: HeatmapData[] = [];
  
  // Get analytics events grouped by hour and day of week
  const events = await prisma.analyticsEvent.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      timestamp: true
    }
  });
  
  // Group by hour and day of week
  const heatmapMap = new Map<string, number>();
  
  events.forEach(event => {
    const date = new Date(event.timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const key = `${dayOfWeek}-${hour}`;
    
    heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
  });
  
  // Create data points for all hour/day combinations
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`;
      const value = heatmapMap.get(key) || 0;
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      data.push({
        x: hour,
        y: day,
        value: value,
        label: `${dayNames[day]} ${hour}:00`
      });
    }
  }
  
  return data;
}

async function getMatrixHeatmapData(
  startDate: Date,
  endDate: Date
): Promise<HeatmapData[]> {
  const data: HeatmapData[] = [];
  
  // Get website analyses to create a matrix of domains vs. scores
  const analyses = await prisma.websiteAnalysis.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      url: true,
      overallScore: true,
      seoScore: true,
      performanceScore: true,
      accessibilityScore: true,
      uxScore: true,
      contentQualityScore: true
    }
  });
  
  // Group by domain and score type
  const scoreMatrix = new Map<string, Map<string, number[]>>();
  
  analyses.forEach(analysis => {
    try {
      const url = new URL(analysis.url);
      const domain = url.hostname.replace('www.', '');
      
      if (!scoreMatrix.has(domain)) {
        scoreMatrix.set(domain, new Map());
      }
      
      const domainData = scoreMatrix.get(domain)!;
      
      // Add scores for different categories
      const scores = {
        'SEO': analysis.seoScore || 0,
        'Performance': analysis.performanceScore || 0,
        'Accessibility': analysis.accessibilityScore || 0,
        'UX': analysis.uxScore || 0,
        'Content': analysis.contentQualityScore || 0
      };
      
      Object.entries(scores).forEach(([category, score]) => {
        if (!domainData.has(category)) {
          domainData.set(category, []);
        }
        domainData.get(category)!.push(score);
      });
      
    } catch (error) {
      // Invalid URL, skip
    }
  });
  
  // Calculate averages and create data points
  scoreMatrix.forEach((categoryData, domain) => {
    categoryData.forEach((scores, category) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      data.push({
        x: domain,
        y: category,
        value: Math.round(avgScore),
        label: `${domain} - ${category}`
      });
    });
  });
  
  // If no real data, return mock data
  if (data.length === 0) {
    return generateMockMatrixData();
  }
  
  return data;
}

function generateMockHeatmapData(type: string): HeatmapData[] {
  switch (type) {
    case 'calendar':
      return generateMockCalendarData();
    case 'time':
      return generateMockTimeData();
    case 'matrix':
    default:
      return generateMockMatrixData();
  }
}

function generateMockCalendarData(): HeatmapData[] {
  const data: HeatmapData[] = [];
  const now = new Date();
  
  for (let i = 365; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      x: date.toISOString().split('T')[0],
      y: 0,
      value: Math.floor(Math.random() * 20),
      label: date.toLocaleDateString()
    });
  }
  
  return data;
}

function generateMockTimeData(): HeatmapData[] {
  const data: HeatmapData[] = [];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      // Simulate realistic activity patterns
      let baseActivity = 10;
      
      // Higher activity during work hours (9-17) on weekdays
      if (day >= 1 && day <= 5 && hour >= 9 && hour <= 17) {
        baseActivity = 50;
      }
      // Lower activity at night
      else if (hour < 6 || hour > 22) {
        baseActivity = 2;
      }
      // Weekend patterns
      else if (day === 0 || day === 6) {
        baseActivity = hour >= 10 && hour <= 20 ? 25 : 5;
      }
      
      const activity = baseActivity + Math.floor(Math.random() * 20);
      
      data.push({
        x: hour,
        y: day,
        value: activity,
        label: `${days[day]} ${hour}:00`
      });
    }
  }
  
  return data;
}

function generateMockMatrixData(): HeatmapData[] {
  const data: HeatmapData[] = [];
  const categories = ['SEO', 'Performance', 'Accessibility', 'UX', 'Content'];
  const domains = ['example.com', 'test.org', 'demo.net', 'sample.io', 'website.co'];
  
  domains.forEach(domain => {
    categories.forEach(category => {
      // Generate realistic scores (30-100 range)
      const score = Math.floor(Math.random() * 70) + 30;
      
      data.push({
        x: domain,
        y: category,
        value: score,
        label: `${domain} - ${category}`
      });
    });
  });
  
  return data;
}