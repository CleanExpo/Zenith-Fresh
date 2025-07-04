// src/app/api/competitive/intelligence/content/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
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
        { error: 'Upgrade required for content gap analysis' },
        { status: 403 }
      );
    }

    // Analyze content gaps
    const contentGaps = await competitiveIntelligenceEngine.analyzeContentGaps(
      targetDomain,
      competitors,
      {
        minTraffic: options.minTraffic || 100,
        contentTypes: options.contentTypes || ['blog_post', 'guide', 'tutorial'],
        limit: options.limit || 30
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

    // Store content gaps in database
    await Promise.all(
      contentGaps.slice(0, 50).map(async (gap) => {
        return prisma.contentGap.upsert({
          where: {
            id: `${targetDomain}_${gap.topic}`.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
          },
          update: {
            contentType: gap.contentType.toUpperCase() as any,
            competitorUrl: gap.competitorUrl,
            competitorDomain: gap.competitorDomain,
            estimatedTraffic: gap.estimatedTraffic,
            backlinks: gap.backlinks,
            socialShares: gap.socialShares,
            wordCount: gap.wordCount,
            gapReason: gap.gapReason,
            opportunityScore: gap.opportunityScore,
            priority: gap.priority.toUpperCase() as any,
            suggestedTitle: gap.suggestedTitle,
            suggestedOutline: gap.suggestedOutline,
            targetKeywords: gap.targetKeywords,
            analysisId: analysis.id
          },
          create: {
            targetDomain,
            topic: gap.topic,
            contentType: gap.contentType.toUpperCase() as any,
            competitorUrl: gap.competitorUrl,
            competitorDomain: gap.competitorDomain,
            estimatedTraffic: gap.estimatedTraffic,
            backlinks: gap.backlinks,
            socialShares: gap.socialShares,
            wordCount: gap.wordCount,
            gapReason: gap.gapReason,
            opportunityScore: gap.opportunityScore,
            priority: gap.priority.toUpperCase() as any,
            suggestedTitle: gap.suggestedTitle,
            suggestedOutline: gap.suggestedOutline,
            targetKeywords: gap.targetKeywords,
            analysisId: analysis.id
          }
        });
      })
    );

    // Calculate content gap statistics
    const gapStats = {
      total: contentGaps.length,
      byType: {
        blogPost: contentGaps.filter(g => g.contentType === 'blog_post').length,
        guide: contentGaps.filter(g => g.contentType === 'guide').length,
        tutorial: contentGaps.filter(g => g.contentType === 'tutorial').length,
        caseStudy: contentGaps.filter(g => g.contentType === 'case_study').length,
        tool: contentGaps.filter(g => g.contentType === 'tool').length
      },
      byPriority: {
        urgent: contentGaps.filter(g => g.priority === 'urgent').length,
        high: contentGaps.filter(g => g.priority === 'high').length,
        medium: contentGaps.filter(g => g.priority === 'medium').length,
        low: contentGaps.filter(g => g.priority === 'low').length
      },
      avgOpportunityScore: contentGaps.reduce((sum, g) => sum + g.opportunityScore, 0) / contentGaps.length,
      totalPotentialTraffic: contentGaps.reduce((sum, g) => sum + g.estimatedTraffic, 0),
      totalPotentialBacklinks: contentGaps.reduce((sum, g) => sum + g.backlinks, 0)
    };

    // Identify quick wins (high traffic, low competition)
    const quickWins = contentGaps
      .filter(g => g.estimatedTraffic > 1000 && g.priority === 'high')
      .slice(0, 5);

    // Calculate content production recommendations
    const contentCalendar = contentGaps
      .filter(g => g.priority === 'urgent' || g.priority === 'high')
      .slice(0, 12) // 12 months of content
      .map((gap, index) => ({
        month: index + 1,
        topic: gap.topic,
        contentType: gap.contentType,
        suggestedTitle: gap.suggestedTitle,
        targetKeywords: gap.targetKeywords,
        estimatedImpact: gap.estimatedTraffic
      }));

    // Track API usage
    await prisma.analyticsEvent.create({
      data: {
        event: 'competitive_intelligence_content_gaps',
        userId: session.user.id,
        sessionId: session.user.id,
        properties: {
          targetDomain,
          competitors,
          gapsFound: contentGaps.length,
          teamId
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        targetDomain,
        competitors,
        contentGaps: contentGaps.slice(0, 30), // Limit response size
        summary: gapStats,
        insights: {
          quickWins: quickWins.map(g => ({
            topic: g.topic,
            contentType: g.contentType,
            estimatedTraffic: g.estimatedTraffic,
            competitorExample: g.competitorUrl,
            suggestedTitle: g.suggestedTitle
          })),
          contentCalendar,
          topCompetitor: contentGaps.reduce((acc, gap) => {
            acc[gap.competitorDomain] = (acc[gap.competitorDomain] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        },
        recommendations: {
          immediate: contentGaps
            .filter(g => g.priority === 'urgent')
            .slice(0, 3)
            .map(g => `Create ${g.contentType.replace('_', ' ')} about "${g.topic}" to capture ${g.estimatedTraffic} monthly visitors`),
          shortTerm: contentGaps
            .filter(g => g.priority === 'high')
            .slice(0, 5)
            .map(g => `Develop comprehensive ${g.contentType.replace('_', ' ')} covering "${g.topic}"`),
          longTerm: `Focus on ${Object.entries(gapStats.byType).sort(([,a], [,b]) => b - a)[0][0]} content to compete effectively`
        },
        metadata: {
          analysisDate: new Date().toISOString(),
          analysisId: analysis.id,
          limitApplied: contentGaps.length > 30
        }
      }
    });

  } catch (error) {
    console.error('Content gap analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        message: 'Unable to analyze content gaps. Please try again.'
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
    const contentType = searchParams.get('contentType');
    const priority = searchParams.get('priority');
    const minTraffic = parseInt(searchParams.get('minTraffic') || '0');
    const limit = parseInt(searchParams.get('limit') || '30');

    if (!targetDomain) {
      return NextResponse.json(
        { error: 'Target domain is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = { targetDomain };
    if (analysisId) where.analysisId = analysisId;
    if (contentType) where.contentType = contentType.toUpperCase();
    if (priority) where.priority = priority.toUpperCase();
    if (minTraffic > 0) where.estimatedTraffic = { gte: minTraffic };

    // Get stored content gaps
    const contentGaps = await prisma.contentGap.findMany({
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
    const allGaps = await prisma.contentGap.findMany({
      where: { targetDomain },
      select: {
        contentType: true,
        priority: true,
        opportunityScore: true,
        estimatedTraffic: true,
        competitorDomain: true
      }
    });

    const summary = {
      total: allGaps.length,
      byType: {
        BLOG_POST: allGaps.filter(g => g.contentType === 'BLOG_POST').length,
        GUIDE: allGaps.filter(g => g.contentType === 'GUIDE').length,
        TUTORIAL: allGaps.filter(g => g.contentType === 'TUTORIAL').length,
        CASE_STUDY: allGaps.filter(g => g.contentType === 'CASE_STUDY').length,
        TOOL: allGaps.filter(g => g.contentType === 'TOOL').length
      },
      urgent: allGaps.filter(g => g.priority === 'URGENT').length,
      high: allGaps.filter(g => g.priority === 'HIGH').length,
      avgOpportunityScore: allGaps.reduce((sum, g) => sum + g.opportunityScore, 0) / allGaps.length,
      totalPotentialTraffic: allGaps.reduce((sum, g) => sum + g.estimatedTraffic, 0)
    };

    return NextResponse.json({
      success: true,
      data: {
        targetDomain,
        contentGaps: contentGaps.map(gap => ({
          id: gap.id,
          topic: gap.topic,
          contentType: gap.contentType.toLowerCase(),
          competitorUrl: gap.competitorUrl,
          competitorDomain: gap.competitorDomain,
          estimatedTraffic: gap.estimatedTraffic,
          backlinks: gap.backlinks,
          socialShares: gap.socialShares,
          wordCount: gap.wordCount,
          gapReason: gap.gapReason,
          opportunityScore: gap.opportunityScore,
          priority: gap.priority.toLowerCase(),
          suggestedTitle: gap.suggestedTitle,
          suggestedOutline: gap.suggestedOutline,
          targetKeywords: gap.targetKeywords,
          createdAt: gap.createdAt,
          analysisId: gap.analysisId
        })),
        summary,
        cached: true
      }
    });

  } catch (error) {
    console.error('Get content gaps error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve content gaps' },
      { status: 500 }
    );
  }
}