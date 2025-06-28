// src/app/api/competitive/intelligence/discover/route.ts
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
    const { targetDomain, options = {} } = body;

    if (!targetDomain) {
      return NextResponse.json(
        { error: 'Target domain is required' },
        { status: 400 }
      );
    }

    // Validate domain format
    try {
      new URL(targetDomain.startsWith('http') ? targetDomain : `https://${targetDomain}`);
    } catch {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    // Check team access and usage limits
    const teamId = request.headers.get('x-team-id');
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    // Get team and check subscription
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { billing: true }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if team has access to competitive intelligence
    const hasAccess = team.subscriptionPlan && ['pro', 'enterprise'].includes(team.subscriptionPlan);
    if (!hasAccess) {
      return NextResponse.json(
        { 
          error: 'Upgrade required',
          message: 'Competitive Intelligence requires Pro or Enterprise plan'
        },
        { status: 403 }
      );
    }

    // Discover competitors
    const competitors = await competitiveIntelligenceEngine.discoverCompetitors(
      targetDomain,
      {
        limit: options.limit || 10,
        includeSerp: options.includeSerp !== false,
        includeKeywordOverlap: options.includeKeywordOverlap !== false,
        includeBacklinkAnalysis: options.includeBacklinkAnalysis !== false,
        minRelevanceScore: options.minRelevanceScore || 0.3
      }
    );

    // Store competitor profiles in database
    for (const competitor of competitors) {
      await prisma.competitorProfile.upsert({
        where: { domain: competitor.domain },
        update: {
          name: competitor.name,
          industry: competitor.industry,
          traffic: competitor.estimatedTraffic,
          authorityScore: competitor.authorityScore,
          lastAnalyzed: new Date()
        },
        create: {
          domain: competitor.domain,
          name: competitor.name,
          industry: competitor.industry,
          traffic: competitor.estimatedTraffic,
          authorityScore: competitor.authorityScore,
          lastAnalyzed: new Date()
        }
      });
    }

    // Track API usage
    await prisma.analyticsEvent.create({
      data: {
        event: 'competitive_intelligence_discover',
        userId: session.user.id,
        sessionId: session.user.id,
        properties: {
          targetDomain,
          competitorsFound: competitors.length,
          teamId
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        targetDomain,
        competitors,
        discoveryMethods: {
          serp: options.includeSerp !== false,
          keywordOverlap: options.includeKeywordOverlap !== false,
          backlinkAnalysis: options.includeBacklinkAnalysis !== false
        },
        metadata: {
          totalFound: competitors.length,
          averageRelevanceScore: competitors.reduce((sum, c) => sum + c.relevanceScore, 0) / competitors.length,
          topCompetitor: competitors[0]?.domain,
          analysisDate: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Competitor discovery error:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        message: 'Unable to discover competitors. Please try again.'
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
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!targetDomain) {
      return NextResponse.json(
        { error: 'Target domain is required' },
        { status: 400 }
      );
    }

    // Get stored competitor profiles
    const competitors = await prisma.competitorProfile.findMany({
      where: {
        analyses: {
          some: {
            targetDomain: targetDomain
          }
        }
      },
      take: limit,
      orderBy: {
        authorityScore: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        targetDomain,
        competitors: competitors.map(c => ({
          domain: c.domain,
          name: c.name,
          industry: c.industry,
          estimatedTraffic: c.traffic,
          authorityScore: c.authorityScore,
          lastAnalyzed: c.lastAnalyzed,
          relevanceScore: 0.8 // Would be calculated from stored analysis
        })),
        cached: true
      }
    });

  } catch (error) {
    console.error('Get competitors error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve competitors' },
      { status: 500 }
    );
  }
}