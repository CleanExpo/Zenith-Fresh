import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { businessIntelligence } from '@/lib/analytics/business-intelligence-integration';
import { auditLogger } from '@/lib/audit/audit-logger';

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
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { dashboardId } = params;

    // Check dashboard-specific permissions
    const userRole = (session.user as any)?.role || 'user';
    const dashboardPermissions: Record<string, string[]> = {
      'executive-dashboard': ['admin', 'executive'],
      'revenue-dashboard': ['admin', 'executive', 'finance'],
      'customer-dashboard': ['admin', 'executive', 'analyst', 'sales'],
      'marketing-dashboard': ['admin', 'executive', 'marketing'],
      'operational-dashboard': ['admin', 'executive', 'operations', 'engineering']
    };

    const allowedRoles = dashboardPermissions[dashboardId] || ['admin'];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions for this dashboard' },
        { status: 403 }
      );
    }

    // Log access
    await auditLogger.logUserAction(
      session.user.id || 'unknown',
      'API_ACCESS' as any,
      'API' as any,
      dashboardId,
      {
        action: 'view_dashboard',
        userRole,
        timestamp: new Date().toISOString()
      }
    );

    // Get dashboard data
    const dashboard = await businessIntelligence.getDashboard(dashboardId);
    
    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      );
    }

    // Filter sensitive data based on role
    if (userRole !== 'admin' && userRole !== 'executive') {
      // Remove sensitive financial data for non-executive roles
      if (dashboard.widgets) {
        dashboard.widgets = dashboard.widgets.filter((widget: any) => {
          return !['revenue-forecast', 'financial-projections'].includes(widget.type);
        });
      }
    }

    return NextResponse.json({
      success: true,
      dashboard,
      userRole,
      lastUpdated: dashboard.lastUpdated || new Date().toISOString()
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