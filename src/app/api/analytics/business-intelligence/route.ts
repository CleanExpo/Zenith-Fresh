import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { auth } from '@/lib/auth';
import { businessIntelligence } from '@/lib/analytics/business-intelligence-integration';
import { auditLogger } from '@/lib/audit/audit-logger';

/**
 * GET /api/analytics/business-intelligence
 * 
 * Get comprehensive business intelligence analysis
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions (executive or admin role required)
    const userRole = (session.user as any)?.role || 'user';
    if (!['admin', 'executive', 'analyst'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Log access
    await auditLogger.logUserAction(
      session.user.id || 'unknown',
      'API_ACCESS' as any,
      'API' as any,
      'business-intelligence',
      {
        endpoint: '/api/analytics/business-intelligence'
      }
    );

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const dashboardId = searchParams.get('dashboard');
    const insightType = searchParams.get('insightType');
    const insightImpact = searchParams.get('insightImpact');

    // Handle specific requests
    if (dashboardId) {
      const dashboard = await businessIntelligence.getDashboard(dashboardId);
      if (!dashboard) {
        return NextResponse.json(
          { error: 'Dashboard not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ dashboard });
    }

    if (insightType || insightImpact) {
      const insights = await businessIntelligence.getInsights({
        type: insightType || undefined,
        impact: insightImpact || undefined
      });
      return NextResponse.json({ insights });
    }

    // Return full analysis
    const analysis = await businessIntelligence.getAnalysis();
    
    return NextResponse.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Business intelligence API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve business intelligence data',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/business-intelligence
 * 
 * Execute custom analytics query or generate report
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions
    const userRole = (session.user as any)?.role || 'user';
    if (!['admin', 'executive', 'analyst'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ...params } = body;

    // Log action
    await auditLogger.logUserAction(
      session.user.id || 'unknown',
      'API_ACCESS' as any,
      'API' as any,
      `bi_${action}`,
      params
    );

    let result;

    switch (action) {
      case 'query':
        // Execute custom analytics query
        result = await businessIntelligence.query(params);
        break;

      case 'generateReport':
        // Generate custom report
        result = await businessIntelligence.generateReport({
          ...params,
          requestedBy: session.user.email
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Business intelligence API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Business intelligence operation failed',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}