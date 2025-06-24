import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { businessIntelligence } from '@/lib/analytics/business-intelligence-integration';
import { auditLogger } from '@/lib/audit/audit-logger';

/**
 * GET /api/analytics/insights
 * 
 * Get business insights with filtering
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // opportunity, risk, trend, anomaly
    const impact = searchParams.get('impact'); // high, medium, low
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Log access
    await auditLogger.logUserAction(
      session.user.id || 'unknown',
      'API_ACCESS' as any,
      'API' as any,
      'business_intelligence',
      {
        action: 'view_insights',
        filters: { type, impact },
        pagination: { limit, offset }
      }
    );

    // Get insights
    const allInsights = await businessIntelligence.getInsights({
      type: type || undefined,
      impact: impact || undefined
    });

    // Apply pagination
    const paginatedInsights = allInsights.slice(offset, offset + limit);

    // Enrich insights with additional context
    const enrichedInsights = paginatedInsights.map(insight => ({
      ...insight,
      actionable: insight.recommendations.length > 0,
      priority: calculatePriority(insight),
      estimatedValue: estimateValue(insight)
    }));

    return NextResponse.json({
      success: true,
      insights: enrichedInsights,
      pagination: {
        total: allInsights.length,
        limit,
        offset,
        hasMore: offset + limit < allInsights.length
      },
      filters: { type, impact }
    });

  } catch (error) {
    console.error('Insights API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve insights',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate insight priority based on impact and confidence
 */
function calculatePriority(insight: any): number {
  const impactScore = insight.impact === 'high' ? 3 : 
                     insight.impact === 'medium' ? 2 : 1;
  const confidenceScore = insight.confidence * 3;
  const typeScore = insight.type === 'risk' ? 1.5 : 
                   insight.type === 'opportunity' ? 1.3 : 1;
  
  return Math.round((impactScore + confidenceScore) * typeScore);
}

/**
 * Estimate potential value of acting on insight
 */
function estimateValue(insight: any): string {
  if (insight.type === 'opportunity' && insight.impact === 'high') {
    return '$50K-$100K';
  } else if (insight.type === 'risk' && insight.impact === 'high') {
    return 'Prevent $25K-$75K loss';
  } else if (insight.impact === 'medium') {
    return '$10K-$25K';
  }
  return '<$10K';
}