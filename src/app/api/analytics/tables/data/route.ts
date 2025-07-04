import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const TableQuerySchema = z.object({
  teamId: z.string(),
  timeRange: z.enum(['24h', '7d', '30d', '90d', '1y']).default('30d'),
  limit: z.coerce.number().min(1).max(100).default(20),
  dataSource: z.enum(['users', 'analyses', 'projects', 'events', 'pages']).optional(),
  aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).optional(),
  groupBy: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * GET /api/analytics/tables/data
 * 
 * Get table data for analytics widgets
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = TableQuerySchema.parse(Object.fromEntries(searchParams));

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

    // Generate table data based on data source
    const tableData = await generateTableData(query, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: tableData,
      timeRange: query.timeRange,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Table data API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table data' },
      { status: 500 }
    );
  }
}

async function generateTableData(
  query: z.infer<typeof TableQuerySchema>,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const data: any[] = [];

  try {
    switch (query.dataSource) {
      case 'users':
        return await getUsersTableData(query, startDate, endDate);
      
      case 'analyses':
        return await getAnalysesTableData(query, startDate, endDate);
      
      case 'projects':
        return await getProjectsTableData(query, startDate, endDate);
      
      case 'events':
        return await getEventsTableData(query, startDate, endDate);
      
      case 'pages':
        return await getPagesTableData(query, startDate, endDate);
      
      default:
        // Default to top pages mock data
        return await getPagesTableData(query, startDate, endDate);
    }
  } catch (error) {
    console.error('Error generating table data:', error);
    return [];
  }
}

async function getUsersTableData(
  query: z.infer<typeof TableQuerySchema>,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: {
        select: {
          websiteAnalyses: true,
          projects: true
        }
      }
    },
    orderBy: {
      createdAt: query.sortOrder
    },
    take: query.limit
  });

  return users.map(user => ({
    name: user.name || 'Unknown',
    email: user.email,
    joined: user.createdAt.toLocaleDateString(),
    analyses: user._count.websiteAnalyses,
    projects: user._count.projects,
    status: 'Active'
  }));
}

async function getAnalysesTableData(
  query: z.infer<typeof TableQuerySchema>,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const analyses = await prisma.websiteAnalysis.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      id: true,
      url: true,
      overallScore: true,
      contentQualityScore: true,
      seoScore: true,
      uxScore: true,
      performanceScore: true,
      accessibilityScore: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: query.sortOrder
    },
    take: query.limit
  });

  return analyses.map(analysis => ({
    url: analysis.url,
    overallScore: analysis.overallScore,
    seoScore: analysis.seoScore || 0,
    performanceScore: analysis.performanceScore || 0,
    accessibilityScore: analysis.accessibilityScore || 0,
    user: analysis.user.name || analysis.user.email,
    date: analysis.createdAt.toLocaleDateString()
  }));
}

async function getProjectsTableData(
  query: z.infer<typeof TableQuerySchema>,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const projects = await prisma.project.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          tasks: true
        }
      }
    },
    orderBy: {
      createdAt: query.sortOrder
    },
    take: query.limit
  });

  return projects.map(project => ({
    name: project.name,
    description: project.description || '',
    status: project.status,
    tasks: project._count.tasks,
    owner: project.user.name || project.user.email,
    created: project.createdAt.toLocaleDateString(),
    updated: project.updatedAt.toLocaleDateString()
  }));
}

async function getEventsTableData(
  query: z.infer<typeof TableQuerySchema>,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const events = await prisma.analyticsEvent.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      id: true,
      event: true,
      timestamp: true,
      properties: true,
      value: true,
      currency: true,
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      timestamp: query.sortOrder
    },
    take: query.limit
  });

  return events.map(event => ({
    event: event.event,
    user: event.user?.name || event.user?.email || 'Anonymous',
    value: event.value || 0,
    timestamp: event.timestamp.toLocaleString(),
    properties: JSON.stringify(event.properties)
  }));
}

async function getPagesTableData(
  query: z.infer<typeof TableQuerySchema>,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  // This would typically come from Google Analytics or similar
  // For now, we'll return mock data based on website analyses
  
  const analyses = await prisma.websiteAnalysis.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      url: true,
      overallScore: true
    },
    take: query.limit * 2 // Get more to aggregate
  });

  // Group by domain/page
  const pageStats = new Map();
  
  analyses.forEach(analysis => {
    try {
      const url = new URL(analysis.url);
      const page = url.pathname || '/';
      const domain = url.hostname;
      const key = `${domain}${page}`;
      
      if (pageStats.has(key)) {
        const existing = pageStats.get(key);
        existing.views += 1;
        existing.totalScore += analysis.overallScore;
      } else {
        pageStats.set(key, {
          page: page === '/' ? 'Home' : page.replace('/', '').replace(/[-_]/g, ' '),
          domain: domain,
          views: 1,
          totalScore: analysis.overallScore,
          bounceRate: Math.random() * 60 + 20, // Mock data
          timeOnPage: `${Math.floor(Math.random() * 300) + 30}s`,
          conversions: Math.floor(Math.random() * 50)
        });
      }
    } catch (error) {
      // Invalid URL, skip
    }
  });

  // Convert to array and calculate averages
  const result = Array.from(pageStats.values()).map(stat => ({
    page: stat.page,
    domain: stat.domain,
    views: stat.views,
    avgScore: Math.round(stat.totalScore / stat.views),
    bounceRate: `${stat.bounceRate.toFixed(1)}%`,
    timeOnPage: stat.timeOnPage,
    conversions: stat.conversions
  }));

  // Sort by views descending
  result.sort((a, b) => b.views - a.views);

  // If no real data, return mock data
  if (result.length === 0) {
    return [
      { page: 'Home', views: 1247, timeOnPage: '2m 34s', bounceRate: '32.4%', conversions: 89 },
      { page: 'About', views: 856, timeOnPage: '1m 52s', bounceRate: '45.2%', conversions: 23 },
      { page: 'Products', views: 743, timeOnPage: '3m 15s', bounceRate: '28.7%', conversions: 156 },
      { page: 'Contact', views: 521, timeOnPage: '1m 23s', bounceRate: '38.9%', conversions: 67 },
      { page: 'Blog', views: 467, timeOnPage: '4m 02s', bounceRate: '22.1%', conversions: 34 },
      { page: 'Pricing', views: 389, timeOnPage: '2m 45s', bounceRate: '41.3%', conversions: 78 },
      { page: 'Features', views: 312, timeOnPage: '2m 18s', bounceRate: '35.6%', conversions: 45 },
      { page: 'Support', views: 298, timeOnPage: '3m 33s', bounceRate: '29.8%', conversions: 12 },
      { page: 'Login', views: 267, timeOnPage: '0m 45s', bounceRate: '15.2%', conversions: 234 },
      { page: 'Dashboard', views: 234, timeOnPage: '5m 17s', bounceRate: '12.4%', conversions: 0 }
    ].slice(0, query.limit);
  }

  return result.slice(0, query.limit);
}