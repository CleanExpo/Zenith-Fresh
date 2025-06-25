import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLogger } from '@/lib/audit/audit-logger';
import { z } from 'zod';

const DashboardQuerySchema = z.object({
  teamId: z.string().optional()
});

/**
 * GET /api/analytics/dashboards/[dashboardId]
 * 
 * Get specific dashboard data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { dashboardId: string } }
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
    const query = DashboardQuerySchema.parse(Object.fromEntries(searchParams));
    const { dashboardId } = params;

    // If teamId is provided, verify team access
    if (query.teamId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: query.teamId,
          userId: session.user.id
        }
      });

      if (!teamMember) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get dashboard from database
    let dashboard;
    
    if (dashboardId === 'default') {
      // Get or create default dashboard for team
      dashboard = await getOrCreateDefaultDashboard(query.teamId || '');
    } else {
      dashboard = await prisma.analyticsDashboard.findFirst({
        where: {
          id: dashboardId,
          ...(query.teamId && { teamId: query.teamId })
        },
        include: {
          widgets: true
        }
      });
    }

    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      );
    }

    // Log access
    try {
      await auditLogger.logUserAction(
        session.user.id,
        'API_ACCESS' as any,
        'API' as any,
        dashboardId,
        {
          action: 'view_dashboard',
          teamId: query.teamId,
          timestamp: new Date().toISOString()
        }
      );
    } catch (auditError) {
      console.warn('Audit logging failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      dashboard: {
        id: dashboard.id,
        name: dashboard.name,
        description: dashboard.description,
        layout: dashboard.layout,
        widgets: dashboard.widgets,
        isDefault: dashboard.isDefault,
        isPublic: dashboard.isPublic,
        lastUpdated: dashboard.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve dashboard',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/analytics/dashboards/[dashboardId]
 * 
 * Update dashboard configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { dashboardId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dashboardId } = params;
    const body = await request.json();

    // Verify team access if teamId is provided
    if (body.teamId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: body.teamId,
          userId: session.user.id
        }
      });

      if (!teamMember) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Update dashboard
    const updatedDashboard = await prisma.analyticsDashboard.update({
      where: { id: dashboardId },
      data: {
        name: body.name,
        description: body.description,
        layout: body.layout,
        updatedAt: new Date()
      },
      include: {
        widgets: true
      }
    });

    // Update widgets if provided
    if (body.widgets) {
      // Delete existing widgets
      await prisma.analyticsWidget.deleteMany({
        where: { dashboardId }
      });

      // Create new widgets
      await prisma.analyticsWidget.createMany({
        data: body.widgets.map((widget: any) => ({
          dashboardId,
          type: widget.type,
          title: widget.title,
          description: widget.description,
          config: widget.config,
          dataSource: widget.dataSource,
          position: widget.position,
          refreshRate: widget.refreshRate
        }))
      });
    }

    return NextResponse.json({
      success: true,
      dashboard: updatedDashboard
    });

  } catch (error) {
    console.error('Dashboard update error:', error);
    return NextResponse.json(
      { error: 'Failed to update dashboard' },
      { status: 500 }
    );
  }
}

async function getOrCreateDefaultDashboard(teamId: string) {
  // Try to find existing default dashboard
  let dashboard = await prisma.analyticsDashboard.findFirst({
    where: {
      teamId,
      isDefault: true
    },
    include: {
      widgets: true
    }
  });

  if (!dashboard && teamId) {
    // Create default dashboard
    dashboard = await prisma.analyticsDashboard.create({
      data: {
        name: 'Overview Dashboard',
        description: 'Key metrics and insights overview',
        teamId,
        layout: {
          columns: 12,
          rowHeight: 60,
          margin: [16, 16]
        },
        isDefault: true,
        createdBy: 'system'
      },
      include: {
        widgets: true
      }
    });

    // Create default widgets
    const defaultWidgets = [
      {
        dashboardId: dashboard.id,
        type: 'kpi',
        title: 'Key Performance Indicators',
        config: { layout: 'grid', showTrends: true },
        dataSource: 'metrics',
        position: { x: 0, y: 0, w: 12, h: 2 }
      },
      {
        dashboardId: dashboard.id,
        type: 'chart',
        title: 'User Growth',
        config: { chartType: 'line', metric: 'users' },
        dataSource: 'metrics',
        position: { x: 0, y: 2, w: 6, h: 4 }
      },
      {
        dashboardId: dashboard.id,
        type: 'chart',
        title: 'Website Analyses',
        config: { chartType: 'area', metric: 'analyses' },
        dataSource: 'metrics',
        position: { x: 6, y: 2, w: 6, h: 4 }
      },
      {
        dashboardId: dashboard.id,
        type: 'table',
        title: 'Top Pages',
        config: { columns: ['Page', 'Views', 'Score'], limit: 10 },
        dataSource: 'pages',
        position: { x: 0, y: 6, w: 8, h: 4 }
      },
      {
        dashboardId: dashboard.id,
        type: 'funnel',
        title: 'User Journey',
        config: { orientation: 'vertical', showConversionRates: true },
        dataSource: 'events',
        position: { x: 8, y: 6, w: 4, h: 4 }
      }
    ];

    await prisma.analyticsWidget.createMany({
      data: defaultWidgets
    });

    // Refetch with widgets
    dashboard = await prisma.analyticsDashboard.findUnique({
      where: { id: dashboard.id },
      include: { widgets: true }
    });
  }

  return dashboard;
}