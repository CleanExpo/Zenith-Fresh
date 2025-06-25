// src/app/api/intelligence/market/route.ts
// Market Intelligence API - Advanced market analysis and trend prediction

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { marketAnalysisEngine } from '@/lib/intelligence/market-analysis-engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetDomain, industry, timeframe = '2y', options = {} } = body;

    if (!targetDomain) {
      return NextResponse.json(
        { error: 'Target domain is required' },
        { status: 400 }
      );
    }

    // Check team access and subscription
    const teamId = request.headers.get('x-team-id');
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { billing: true }
    });

    if (!team || !['enterprise'].includes(team.subscriptionPlan || '')) {
      return NextResponse.json(
        { error: 'Enterprise subscription required for market intelligence' },
        { status: 403 }
      );
    }

    // Generate comprehensive market intelligence
    const marketIntelligence = await marketAnalysisEngine.generateMarketIntelligenceReport(
      targetDomain,
      industry,
      {
        timeframe,
        includePredictive: options.includePredictive !== false,
        includeCompetitors: options.includeCompetitors || [],
        ...options
      }
    );

    // Track API usage
    await prisma.analyticsEvent.create({
      data: {
        event: 'market_intelligence_generated',
        userId: session.user.id,
        sessionId: session.user.id,
        properties: {
          targetDomain,
          industry: marketIntelligence.industry,
          timeframe,
          teamId,
          analysisDepth: 'comprehensive'
        }
      }
    });

    // Format response data
    const responseData = {
      targetDomain: marketIntelligence.targetDomain,
      industry: marketIntelligence.industry,
      analysisDate: marketIntelligence.analysisDate.toISOString(),
      marketTrends: {
        marketSize: marketIntelligence.marketTrends.marketSize,
        trends: marketIntelligence.marketTrends.trends.map(trend => ({
          trend: trend.trend,
          momentum: trend.momentum,
          impact: trend.impact,
          timelineMonths: trend.timelineMonths,
          confidence: trend.confidence,
          drivingFactors: trend.drivingFactors,
          marketImplications: trend.marketImplications
        })),
        seasonality: marketIntelligence.marketTrends.seasonality,
        demographicShifts: marketIntelligence.marketTrends.demographicShifts
      },
      competitiveLandscape: {
        marketStructure: marketIntelligence.competitiveLandscape.marketStructure,
        concentrationRatio: marketIntelligence.competitiveLandscape.concentrationRatio,
        competitiveIntensity: marketIntelligence.competitiveLandscape.competitiveIntensity,
        marketLeaders: marketIntelligence.competitiveLandscape.marketLeaders.map(leader => ({
          company: leader.company,
          domain: leader.domain,
          marketShare: leader.marketShare,
          competitive_advantages: leader.competitive_advantages,
          vulnerabilities: leader.vulnerabilities,
          recentMoves: leader.recentMoves
        })),
        emergingPlayers: marketIntelligence.competitiveLandscape.emergingPlayers.map(player => ({
          company: player.company,
          domain: player.domain,
          growthRate: player.growthRate,
          disruptionPotential: player.disruptionPotential,
          keyInnovations: player.keyInnovations
        })),
        marketGaps: marketIntelligence.competitiveLandscape.marketGaps
      },
      customerSentiment: {
        overallSentiment: marketIntelligence.customerSentiment.overallSentiment,
        sentimentScore: marketIntelligence.customerSentiment.sentimentScore,
        sentimentTrends: marketIntelligence.customerSentiment.sentimentTrends,
        topicsAnalysis: marketIntelligence.customerSentiment.topicsAnalysis,
        competitorSentiment: marketIntelligence.customerSentiment.competitorSentiment,
        brandPerception: marketIntelligence.customerSentiment.brandPerception
      },
      opportunities: {
        opportunities: marketIntelligence.opportunities.opportunities.map(opp => ({
          id: opp.id,
          title: opp.title,
          category: opp.category,
          marketSize: opp.marketSize,
          growthPotential: opp.growthPotential,
          timeToMarket: opp.timeToMarket,
          investmentRequired: opp.investmentRequired,
          riskLevel: opp.riskLevel,
          competitorActivity: opp.competitorActivity,
          strategicFit: opp.strategicFit,
          description: opp.description,
          keySuccess_factors: opp.keySuccess_factors,
          potentialChallenges: opp.potentialChallenges,
          competitors_pursuing: opp.competitors_pursuing
        })),
        whitespaceAreas: marketIntelligence.opportunities.whitespaceAreas,
        adjacentMarkets: marketIntelligence.opportunities.adjacentMarkets
      },
      threats: marketIntelligence.threats.map(threat => ({
        threat: threat.threat,
        probability: threat.probability,
        impact: threat.impact,
        timeframe: threat.timeframe,
        mitigationStrategies: threat.mitigationStrategies
      })),
      strategicRecommendations: marketIntelligence.strategicRecommendations.map(rec => ({
        priority: rec.priority,
        category: rec.category,
        recommendation: rec.recommendation,
        rationale: rec.rationale,
        requiredInvestment: rec.requiredInvestment,
        expectedROI: rec.expectedROI,
        timeframe: rec.timeframe,
        kpis: rec.kpis
      })),
      alerts: [] // Will be populated from separate alert system
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Market intelligence API error:', error);
    return NextResponse.json(
      { 
        error: 'Market intelligence generation failed',
        message: 'Unable to generate market intelligence. Please try again.'
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
    const domain = searchParams.get('domain');
    const timeframe = searchParams.get('timeframe') || '2y';
    const teamId = request.headers.get('x-team-id');

    if (!domain || !teamId) {
      return NextResponse.json(
        { error: 'Domain and team ID are required' },
        { status: 400 }
      );
    }

    // Get most recent market intelligence report
    const marketIntelligence = await prisma.marketIntelligence.findFirst({
      where: { 
        targetDomain: domain,
        // Could add teamId filter here for security
      },
      orderBy: { analysisDate: 'desc' }
    });

    if (!marketIntelligence) {
      return NextResponse.json(
        { error: 'No market intelligence found for this domain' },
        { status: 404 }
      );
    }

    // Get related alerts
    const alerts = await prisma.monitoringAlert.findMany({
      where: {
        teamId,
        alertType: 'market_shift',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const responseData = {
      ...marketIntelligence,
      analysisDate: marketIntelligence.analysisDate.toISOString(),
      alerts: alerts.map(alert => ({
        id: alert.id,
        type: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        createdAt: alert.createdAt.toISOString(),
        actionRequired: alert.metadata && (alert.metadata as any).actionRequired
      }))
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Get market intelligence error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve market intelligence' },
      { status: 500 }
    );
  }
}