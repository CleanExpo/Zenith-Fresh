import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { aiInsightsService } from '@/lib/analytics/ai-insights';
import { z } from 'zod';

const InsightsQuerySchema = z.object({
  teamId: z.string(),
  timeRange: z.enum(['24h', '7d', '30d', '90d']).default('30d'),
  refresh: z.boolean().default(false)
});

/**
 * GET /api/analytics/insights/ai
 * 
 * Get AI-powered analytics insights
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = InsightsQuerySchema.parse(Object.fromEntries(searchParams));

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

    let insights;

    if (query.refresh) {
      // Generate fresh insights
      insights = await aiInsightsService.generateInsights(query.teamId, query.timeRange);
    } else {
      // Try to get stored insights first
      insights = await aiInsightsService.getStoredInsights(query.teamId);
      
      // If no stored insights or they're stale, generate new ones
      if (insights.length === 0) {
        insights = await aiInsightsService.generateInsights(query.teamId, query.timeRange);
      }
    }

    // Group insights by type for better organization
    const groupedInsights = {
      anomalies: insights.filter(i => i.type === 'anomaly'),
      trends: insights.filter(i => i.type === 'trend'),
      predictions: insights.filter(i => i.type === 'prediction'),
      recommendations: insights.filter(i => i.type === 'recommendation')
    };

    // Calculate summary statistics
    const summary = {
      total: insights.length,
      critical: insights.filter(i => i.severity === 'critical').length,
      warning: insights.filter(i => i.severity === 'warning').length,
      actionable: insights.filter(i => i.actionable).length,
      avgConfidence: insights.length > 0 
        ? insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length 
        : 0
    };

    return NextResponse.json({
      success: true,
      insights: groupedInsights,
      summary,
      timeRange: query.timeRange,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI insights API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/insights/ai
 * 
 * Mark insight as read or dismissed
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { insightId, action } = body;

    if (!insightId || !['read', 'dismiss'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Find the insight and verify team access
    const insight = await prisma.analyticsInsight.findUnique({
      where: { id: insightId },
      include: {
        team: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    });

    if (!insight || insight.team.members.length === 0) {
      return NextResponse.json({ error: 'Insight not found or access denied' }, { status: 404 });
    }

    // Update insight status
    await prisma.analyticsInsight.update({
      where: { id: insightId },
      data: {
        isRead: true,
        ...(action === 'dismiss' && {
          expiresAt: new Date() // Mark as expired to hide it
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: `Insight ${action === 'dismiss' ? 'dismissed' : 'marked as read'} successfully`
    });

  } catch (error) {
    console.error('Insight action API error:', error);
    return NextResponse.json(
      { error: 'Failed to update insight' },
      { status: 500 }
    );
  }
}