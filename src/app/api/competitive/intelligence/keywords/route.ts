// src/app/api/competitive/intelligence/keywords/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { competitiveIntelligenceEngine } from '@/lib/services/competitive-intelligence-engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetDomain, competitors, options = {} } = body;

    if (!targetDomain || !competitors || !Array.isArray(competitors)) {
      return NextResponse.json(
        { error: 'Target domain and competitors array are required' },
        { status: 400 }
      );
    }

    // Check team access
    const teamId = request.headers.get('x-team-id');
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { billing: true }
    });

    if (!team || !['pro', 'enterprise'].includes(team.subscriptionPlan || '')) {
      return NextResponse.json(
        { error: 'Upgrade required for keyword gap analysis' },
        { status: 403 }
      );
    }

    // Analyze keyword gaps
    const keywordGaps = await competitiveIntelligenceEngine.analyzeKeywordGaps(
      targetDomain,
      competitors,
      {
        keywords: options.keywords,
        limit: options.limit || 100,
        minVolume: options.minVolume || 100,
        maxDifficulty: options.maxDifficulty || 80
      }
    );

    // Find or create competitive analysis record
    let analysis = await prisma.competitiveAnalysis.findFirst({
      where: {
        targetDomain,
        teamId,
        status: 'COMPLETED'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!analysis) {
      analysis = await prisma.competitiveAnalysis.create({
        data: {
          targetDomain,
          teamId,
          marketPosition: {},
          opportunities: [],
          strengths: [],
          weaknesses: [],
          recommendations: [],
          benchmarkData: {},
          status: 'IN_PROGRESS'
        }
      });
    }

    // Store keyword gaps in database
    await Promise.all(
      keywordGaps.slice(0, 50).map(async (gap) => { // Limit to prevent overwhelming DB
        return prisma.keywordGap.upsert({
          where: {
            id: `${targetDomain}_${gap.keyword}`.replace(/[^a-zA-Z0-9]/g, '_')
          },
          update: {
            searchVolume: gap.searchVolume,
            difficulty: gap.difficulty,
            targetPosition: gap.targetPosition,
            competitorData: gap.competitors,
            gapType: gap.gapType.toUpperCase() as any,
            opportunityScore: gap.opportunityScore,
            priority: gap.priority.toUpperCase() as any,
            cluster: gap.cluster,
            intent: gap.intent.toUpperCase() as any,
            analysisId: analysis.id
          },
          create: {
            targetDomain,
            keyword: gap.keyword,
            searchVolume: gap.searchVolume,
            difficulty: gap.difficulty,
            targetPosition: gap.targetPosition,
            competitorData: gap.competitors,
            gapType: gap.gapType.toUpperCase() as any,
            opportunityScore: gap.opportunityScore,
            priority: gap.priority.toUpperCase() as any,
            cluster: gap.cluster,
            intent: gap.intent.toUpperCase() as any,
            analysisId: analysis.id
          }
        });
      })
    );

    // Calculate gap summary statistics
    const gapStats = {
      total: keywordGaps.length,
      missing: keywordGaps.filter(g => g.gapType === 'missing').length,
      underperforming: keywordGaps.filter(g => g.gapType === 'underperforming').length,
      opportunities: keywordGaps.filter(g => g.gapType === 'opportunity').length,
      contentGaps: keywordGaps.filter(g => g.gapType === 'content_gap').length,
      urgent: keywordGaps.filter(g => g.priority === 'urgent').length,
      high: keywordGaps.filter(g => g.priority === 'high').length,
      avgOpportunityScore: keywordGaps.reduce((sum, g) => sum + g.opportunityScore, 0) / keywordGaps.length
    };

    // Calculate potential traffic impact
    const potentialTraffic = keywordGaps
      .filter(g => g.priority === 'urgent' || g.priority === 'high')
      .reduce((sum, g) => sum + (g.searchVolume * 0.1), 0); // Assume 10% CTR for top positions

    // Track API usage
    await prisma.analyticsEvent.create({
      data: {
        event: 'competitive_intelligence_keyword_gaps',
        userId: session.user.id,
        sessionId: session.user.id,
        properties: {
          targetDomain,
          competitors,
          gapsFound: keywordGaps.length,
          teamId
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        targetDomain,
        competitors,
        keywordGaps: keywordGaps.slice(0, 100), // Limit response size
        summary: {
          ...gapStats,
          potentialMonthlyTraffic: Math.round(potentialTraffic),
          topOpportunities: keywordGaps
            .filter(g => g.priority === 'urgent')
            .slice(0, 5)
            .map(g => ({
              keyword: g.keyword,
              searchVolume: g.searchVolume,
              opportunityScore: g.opportunityScore,
              gapType: g.gapType
            }))
        },
        metadata: {
          analysisDate: new Date().toISOString(),
          analysisId: analysis.id,
          limitApplied: keywordGaps.length > 100
        }
      }
    });

  } catch (error) {
    console.error('Keyword gap analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        message: 'Unable to analyze keyword gaps. Please try again.'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetDomain = searchParams.get('domain');
    const analysisId = searchParams.get('analysisId');
    const gapType = searchParams.get('gapType');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!targetDomain) {
      return NextResponse.json(
        { error: 'Target domain is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = { targetDomain };
    if (analysisId) where.analysisId = analysisId;
    if (gapType) where.gapType = gapType.toUpperCase();
    if (priority) where.priority = priority.toUpperCase();

    // Get stored keyword gaps
    const keywordGaps = await prisma.keywordGap.findMany({
      where,
      take: limit,
      orderBy: {
        opportunityScore: 'desc'
      },
      include: {
        analysis: {
          select: {
            id: true,
            createdAt: true,
            status: true
          }
        }
      }
    });

    // Calculate summary stats
    const allGaps = await prisma.keywordGap.findMany({
      where: { targetDomain },
      select: {
        gapType: true,
        priority: true,
        opportunityScore: true,
        searchVolume: true
      }
    });

    const summary = {
      total: allGaps.length,
      missing: allGaps.filter(g => g.gapType === 'MISSING').length,
      underperforming: allGaps.filter(g => g.gapType === 'UNDERPERFORMING').length,
      opportunities: allGaps.filter(g => g.gapType === 'OPPORTUNITY').length,
      urgent: allGaps.filter(g => g.priority === 'URGENT').length,
      high: allGaps.filter(g => g.priority === 'HIGH').length,
      avgOpportunityScore: allGaps.reduce((sum, g) => sum + g.opportunityScore, 0) / allGaps.length
    };

    return NextResponse.json({
      success: true,
      data: {
        targetDomain,
        keywordGaps: keywordGaps.map(gap => ({
          id: gap.id,
          keyword: gap.keyword,
          searchVolume: gap.searchVolume,
          difficulty: gap.difficulty,
          targetPosition: gap.targetPosition,
          competitors: gap.competitorData,
          gapType: gap.gapType.toLowerCase(),
          opportunityScore: gap.opportunityScore,
          priority: gap.priority.toLowerCase(),
          cluster: gap.cluster,
          intent: gap.intent.toLowerCase(),
          createdAt: gap.createdAt,
          analysisId: gap.analysisId
        })),
        summary,
        cached: true
      }
    });

  } catch (error) {
    console.error('Get keyword gaps error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve keyword gaps' },
      { status: 500 }
    );
  }
}