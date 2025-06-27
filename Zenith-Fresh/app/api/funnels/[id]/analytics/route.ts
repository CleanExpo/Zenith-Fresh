import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '../../../../../lib/prisma';
import { FunnelService } from '../../../../../lib/services/funnel-service';
import { 
  GetFunnelAnalyticsRequest,
  GetFunnelAnalyticsResponse,
  FunnelAnalysisType
} from '../../../../../types/funnel';

const funnelService = new FunnelService(prisma);

// POST /api/funnels/[id]/analytics - Get funnel analytics
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const funnelId = params.id;
    const body = await request.json() as GetFunnelAnalyticsRequest;

    // Validate request
    if (!body.periodStart || !body.periodEnd) {
      return NextResponse.json(
        { error: 'Period start and end dates are required' },
        { status: 400 }
      );
    }

    // Check if user has access to the funnel
    const funnel = await funnelService.getFunnel(funnelId);
    if (!funnel || funnel.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Funnel not found or access denied' },
        { status: 404 }
      );
    }

    const periodStart = new Date(body.periodStart);
    const periodEnd = new Date(body.periodEnd);

    // Validate date range
    if (periodStart >= periodEnd) {
      return NextResponse.json(
        { error: 'Period start must be before period end' },
        { status: 400 }
      );
    }

    // Check if date range is not too large (max 1 year)
    const maxDays = 365;
    const daysDiff = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxDays) {
      return NextResponse.json(
        { error: `Date range cannot exceed ${maxDays} days` },
        { status: 400 }
      );
    }

    // Get funnel metrics
    const metrics = await funnelService.getFunnelMetrics(
      funnelId,
      periodStart,
      periodEnd
    );

    // Generate analyses if requested
    const analyses = [];
    const analysisTypes = body.analysisTypes || [
      FunnelAnalysisType.CONVERSION_RATE,
      FunnelAnalysisType.DROPOFF_ANALYSIS
    ];

    for (const analysisType of analysisTypes) {
      try {
        const analysis = await funnelService.generateAnalysis(
          funnelId,
          analysisType,
          periodStart,
          periodEnd
        );
        analyses.push(analysis);
      } catch (error) {
        console.error(`Failed to generate ${analysisType} analysis:`, error);
        // Continue with other analyses even if one fails
      }
    }

    // Get comparisons if requested
    const comparisons = [];
    if (body.compareWithPrevious) {
      const previousPeriodStart = new Date(periodStart.getTime() - (periodEnd.getTime() - periodStart.getTime()));
      const previousPeriodEnd = new Date(periodStart.getTime() - 1);

      try {
        const previousMetrics = await funnelService.getFunnelMetrics(
          funnelId,
          previousPeriodStart,
          previousPeriodEnd
        );

        // Create comparison data
        comparisons.push({
          id: 'previous_period',
          funnelId,
          cohortId: 'previous_period',
          comparisonType: 'time_period',
          periodStart: previousPeriodStart,
          periodEnd: previousPeriodEnd,
          results: {
            currentMetrics: metrics,
            previousMetrics,
            changes: {
              conversionRate: metrics.overallConversionRate - previousMetrics.overallConversionRate,
              totalUsers: metrics.totalUsers - previousMetrics.totalUsers,
              revenue: metrics.totalRevenue - previousMetrics.totalRevenue,
              timeToConvert: metrics.averageTimeToConvert - previousMetrics.averageTimeToConvert
            }
          },
          significance: null,
          winnerDetermined: false,
          createdAt: new Date()
        });
      } catch (error) {
        console.error('Failed to generate previous period comparison:', error);
      }
    }

    // Log analytics access
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'FUNNEL_ANALYTICS_ACCESSED',
        resource: 'funnel',
        resourceId: funnelId,
        details: {
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          analysisTypes,
          totalUsers: metrics.totalUsers,
          conversionRate: metrics.overallConversionRate
        }
      }
    });

    const response: GetFunnelAnalyticsResponse = {
      success: true,
      metrics,
      analyses,
      comparisons
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to get funnel analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get funnel analytics' },
      { status: 500 }
    );
  }
}

// GET /api/funnels/[id]/analytics - Get basic funnel metrics (simplified)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const funnelId = params.id;
    const { searchParams } = new URL(request.url);
    
    // Default to last 30 days if no date range provided
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const periodStart = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : startDate;
    const periodEnd = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : endDate;

    // Check if user has access to the funnel
    const funnel = await funnelService.getFunnel(funnelId);
    if (!funnel || funnel.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Funnel not found or access denied' },
        { status: 404 }
      );
    }

    // Get basic metrics
    const metrics = await funnelService.getFunnelMetrics(
      funnelId,
      periodStart,
      periodEnd
    );

    return NextResponse.json({
      success: true,
      metrics,
      funnel: {
        id: funnel.id,
        name: funnel.name,
        description: funnel.description,
        category: funnel.category,
        stepCount: funnel.steps.length
      },
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString()
      }
    });

  } catch (error) {
    console.error('Failed to get funnel analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get funnel analytics' },
      { status: 500 }
    );
  }
}