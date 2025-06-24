// src/app/api/competitive/intelligence/backlinks/route.ts
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
        { error: 'Upgrade required for backlink intelligence' },
        { status: 403 }
      );
    }

    // Analyze backlink gaps
    const backlinkGaps = await competitiveIntelligenceEngine.analyzeBacklinkGaps(
      targetDomain,
      competitors,
      {
        minDomainAuthority: options.minDomainAuthority || 30,
        limit: options.limit || 50
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

    // Store backlink gaps in database
    await Promise.all(
      backlinkGaps.slice(0, 100).map(async (gap) => {
        return prisma.backlinkGap.upsert({
          where: {
            id: `${targetDomain}_${gap.linkingDomain}_${gap.linkUrl}`.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
          },
          update: {
            domainAuthority: gap.domainAuthority,
            pageAuthority: gap.pageAuthority,
            linkUrl: gap.linkUrl,
            anchorText: gap.anchorText,
            linkType: gap.linkType.toUpperCase() as any,
            competitorsLinking: gap.competitorsLinking,
            linkValue: gap.linkValue,
            priority: gap.priority.toUpperCase() as any,
            outreachStatus: 'NOT_STARTED',
            contactEmail: gap.contactEmail,
            analysisId: analysis.id
          },
          create: {
            targetDomain,
            linkingDomain: gap.linkingDomain,
            domainAuthority: gap.domainAuthority,
            pageAuthority: gap.pageAuthority,
            linkUrl: gap.linkUrl,
            anchorText: gap.anchorText,
            linkType: gap.linkType.toUpperCase() as any,
            competitorsLinking: gap.competitorsLinking,
            linkValue: gap.linkValue,
            priority: gap.priority.toUpperCase() as any,
            outreachStatus: 'NOT_STARTED',
            contactEmail: gap.contactEmail,
            analysisId: analysis.id
          }
        });
      })
    );

    // Calculate backlink gap statistics
    const gapStats = {
      total: backlinkGaps.length,
      highAuthority: backlinkGaps.filter(g => g.domainAuthority >= 70).length,
      mediumAuthority: backlinkGaps.filter(g => g.domainAuthority >= 50 && g.domainAuthority < 70).length,
      lowAuthority: backlinkGaps.filter(g => g.domainAuthority < 50).length,
      urgent: backlinkGaps.filter(g => g.priority === 'urgent').length,
      high: backlinkGaps.filter(g => g.priority === 'high').length,
      avgLinkValue: backlinkGaps.reduce((sum, g) => sum + g.linkValue, 0) / backlinkGaps.length,
      avgDomainAuthority: backlinkGaps.reduce((sum, g) => sum + g.domainAuthority, 0) / backlinkGaps.length
    };

    // Calculate potential domain authority impact
    const potentialDAIncrease = backlinkGaps
      .filter(g => g.priority === 'urgent' || g.priority === 'high')
      .reduce((sum, g) => sum + (g.domainAuthority * 0.01), 0); // Rough estimate

    // Identify outreach opportunities
    const outreachOpportunities = backlinkGaps
      .filter(g => g.contactEmail && g.outreachDifficulty < 70)
      .slice(0, 10);

    // Track API usage
    await prisma.analyticsEvent.create({
      data: {
        event: 'competitive_intelligence_backlink_gaps',
        userId: session.user.id,
        sessionId: session.user.id,
        properties: {
          targetDomain,
          competitors,
          gapsFound: backlinkGaps.length,
          teamId
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        targetDomain,
        competitors,
        backlinkGaps: backlinkGaps.slice(0, 50), // Limit response size
        summary: {
          ...gapStats,
          potentialDAIncrease: Math.round(potentialDAIncrease * 100) / 100,
          outreachReady: outreachOpportunities.length,
          topOpportunities: backlinkGaps
            .filter(g => g.priority === 'urgent')
            .slice(0, 5)
            .map(g => ({
              linkingDomain: g.linkingDomain,
              domainAuthority: g.domainAuthority,
              linkValue: g.linkValue,
              competitorsLinking: g.competitorsLinking.length
            }))
        },
        outreach: {
          readyForOutreach: outreachOpportunities.length,
          opportunities: outreachOpportunities.map(g => ({
            linkingDomain: g.linkingDomain,
            domainAuthority: g.domainAuthority,
            contactEmail: g.contactEmail,
            outreachDifficulty: g.outreachDifficulty,
            competitorsLinking: g.competitorsLinking
          }))
        },
        metadata: {
          analysisDate: new Date().toISOString(),
          analysisId: analysis.id,
          limitApplied: backlinkGaps.length > 50
        }
      }
    });

  } catch (error) {
    console.error('Backlink gap analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        message: 'Unable to analyze backlink gaps. Please try again.'
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
    const priority = searchParams.get('priority');
    const outreachStatus = searchParams.get('outreachStatus');
    const minDomainAuthority = parseInt(searchParams.get('minDA') || '0');
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
    if (priority) where.priority = priority.toUpperCase();
    if (outreachStatus) where.outreachStatus = outreachStatus.toUpperCase();
    if (minDomainAuthority > 0) where.domainAuthority = { gte: minDomainAuthority };

    // Get stored backlink gaps
    const backlinkGaps = await prisma.backlinkGap.findMany({
      where,
      take: limit,
      orderBy: {
        linkValue: 'desc'
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
    const allGaps = await prisma.backlinkGap.findMany({
      where: { targetDomain },
      select: {
        priority: true,
        linkValue: true,
        domainAuthority: true,
        outreachStatus: true
      }
    });

    const summary = {
      total: allGaps.length,
      highAuthority: allGaps.filter(g => g.domainAuthority >= 70).length,
      mediumAuthority: allGaps.filter(g => g.domainAuthority >= 50 && g.domainAuthority < 70).length,
      urgent: allGaps.filter(g => g.priority === 'URGENT').length,
      high: allGaps.filter(g => g.priority === 'HIGH').length,
      avgLinkValue: allGaps.reduce((sum, g) => sum + g.linkValue, 0) / allGaps.length,
      outreachProgress: {
        notStarted: allGaps.filter(g => g.outreachStatus === 'NOT_STARTED').length,
        contacted: allGaps.filter(g => g.outreachStatus === 'CONTACTED').length,
        responded: allGaps.filter(g => g.outreachStatus === 'RESPONDED').length,
        acquired: allGaps.filter(g => g.outreachStatus === 'LINK_ACQUIRED').length
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        targetDomain,
        backlinkGaps: backlinkGaps.map(gap => ({
          id: gap.id,
          linkingDomain: gap.linkingDomain,
          domainAuthority: gap.domainAuthority,
          pageAuthority: gap.pageAuthority,
          linkUrl: gap.linkUrl,
          anchorText: gap.anchorText,
          linkType: gap.linkType.toLowerCase(),
          competitorsLinking: gap.competitorsLinking,
          linkValue: gap.linkValue,
          priority: gap.priority.toLowerCase(),
          outreachStatus: gap.outreachStatus.toLowerCase(),
          contactEmail: gap.contactEmail,
          lastContactDate: gap.lastContactDate,
          createdAt: gap.createdAt,
          analysisId: gap.analysisId
        })),
        summary,
        cached: true
      }
    });

  } catch (error) {
    console.error('Get backlink gaps error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve backlink gaps' },
      { status: 500 }
    );
  }
}

// PATCH endpoint for updating outreach status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { backlinkGapId, outreachStatus, contactEmail, notes } = body;

    if (!backlinkGapId || !outreachStatus) {
      return NextResponse.json(
        { error: 'Backlink gap ID and outreach status are required' },
        { status: 400 }
      );
    }

    // Update backlink gap outreach status
    const updatedGap = await prisma.backlinkGap.update({
      where: { id: backlinkGapId },
      data: {
        outreachStatus: outreachStatus.toUpperCase(),
        contactEmail: contactEmail || undefined,
        lastContactDate: ['CONTACTED', 'FOLLOW_UP', 'RESPONDED'].includes(outreachStatus.toUpperCase()) 
          ? new Date() 
          : undefined
      }
    });

    // Track outreach activity
    await prisma.analyticsEvent.create({
      data: {
        event: 'backlink_outreach_updated',
        userId: session.user.id,
        sessionId: session.user.id,
        properties: {
          backlinkGapId,
          outreachStatus,
          linkingDomain: updatedGap.linkingDomain
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedGap.id,
        outreachStatus: updatedGap.outreachStatus.toLowerCase(),
        lastContactDate: updatedGap.lastContactDate,
        updatedAt: updatedGap.updatedAt
      }
    });

  } catch (error) {
    console.error('Update backlink gap error:', error);
    return NextResponse.json(
      { error: 'Failed to update outreach status' },
      { status: 500 }
    );
  }
}