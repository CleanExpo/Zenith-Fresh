import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '../../../../../lib/prisma';
import { FunnelService } from '../../../../../lib/services/funnel-service';
import { 
  GetOptimizationSuggestionsRequest,
  GetOptimizationSuggestionsResponse,
  OptimizationType
} from '../../../../../types/funnel';

const funnelService = new FunnelService(prisma);

// POST /api/funnels/[id]/optimize - Get optimization suggestions
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
    const body = await request.json() as GetOptimizationSuggestionsRequest;

    // Check if user has access to the funnel
    const funnel = await funnelService.getFunnel(funnelId);
    if (!funnel || funnel.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Funnel not found or access denied' },
        { status: 404 }
      );
    }

    // Generate optimization suggestions
    const suggestions = await funnelService.generateOptimizationSuggestions(
      funnelId,
      body.analysisTypes
    );

    // Filter by confidence if specified
    const filteredSuggestions = body.minConfidence 
      ? suggestions.filter(s => s.confidence >= body.minConfidence!)
      : suggestions;

    // Limit results if specified
    const limitedSuggestions = body.maxSuggestions
      ? filteredSuggestions.slice(0, body.maxSuggestions)
      : filteredSuggestions;

    // Calculate summary
    const summary = {
      totalSuggestions: limitedSuggestions.length,
      highImpactSuggestions: limitedSuggestions.filter(s => s.impact === 'high').length,
      quickWins: limitedSuggestions.filter(s => s.effort === 'low' && s.impact !== 'low').length,
      estimatedTotalLift: limitedSuggestions.reduce((sum, s) => sum + s.expectedLift, 0),
      prioritizedSuggestions: limitedSuggestions
        .sort((a, b) => {
          // Sort by impact first, then by effort (lower effort first), then by confidence
          const impactScore = (suggestion: typeof a) => 
            suggestion.impact === 'high' ? 3 : suggestion.impact === 'medium' ? 2 : 1;
          const effortScore = (suggestion: typeof a) => 
            suggestion.effort === 'low' ? 3 : suggestion.effort === 'medium' ? 2 : 1;
          
          const scoreA = impactScore(a) * 0.5 + effortScore(a) * 0.3 + a.confidence * 0.2;
          const scoreB = impactScore(b) * 0.5 + effortScore(b) * 0.3 + b.confidence * 0.2;
          
          return scoreB - scoreA;
        })
        .slice(0, 5) // Top 5 prioritized suggestions
    };

    // Log optimization request
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'FUNNEL_OPTIMIZATION_REQUESTED',
        resource: 'funnel',
        resourceId: funnelId,
        details: {
          suggestionCount: limitedSuggestions.length,
          analysisTypes: body.analysisTypes,
          minConfidence: body.minConfidence
        }
      }
    });

    const response: GetOptimizationSuggestionsResponse = {
      success: true,
      suggestions: limitedSuggestions,
      summary
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to generate optimization suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate optimization suggestions' },
      { status: 500 }
    );
  }
}

// GET /api/funnels/[id]/optimize - Get existing optimization records
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
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Check if user has access to the funnel
    const funnel = await funnelService.getFunnel(funnelId);
    if (!funnel || funnel.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Funnel not found or access denied' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: any = { funnelId };
    if (status) where.status = status;
    if (type) where.type = type;

    // Get optimization records
    const optimizations = await prisma.funnelOptimization.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Get statistics
    const stats = await prisma.funnelOptimization.groupBy({
      by: ['status'],
      where: { funnelId },
      _count: { status: true }
    });

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      optimizations,
      stats: {
        total: optimizations.length,
        byStatus: statusCounts,
        pending: statusCounts.pending || 0,
        implemented: statusCounts.implemented || 0,
        testing: statusCounts.testing || 0,
        rejected: statusCounts.rejected || 0
      }
    });

  } catch (error) {
    console.error('Failed to get optimization records:', error);
    return NextResponse.json(
      { error: 'Failed to get optimization records' },
      { status: 500 }
    );
  }
}