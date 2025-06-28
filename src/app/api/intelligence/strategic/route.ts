// src/app/api/intelligence/strategic/route.ts
// Strategic Recommendations API - AI-powered strategic advice and planning

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { strategicRecommendationsEngine } from '@/lib/intelligence/strategic-recommendations-engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      targetDomain, 
      requestType = 'recommendations',
      intelligence = {},
      options = {} 
    } = body;

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
        { error: 'Enterprise subscription required for strategic recommendations' },
        { status: 403 }
      );
    }

    let result;

    switch (requestType) {
      case 'recommendations':
        result = await strategicRecommendationsEngine.generateStrategicRecommendations(
          targetDomain,
          intelligence,
          {
            focusAreas: options.focusAreas || [],
            planningHorizon: options.planningHorizon || 24,
            budgetConstraints: options.budgetConstraints,
            riskTolerance: options.riskTolerance || 'medium'
          }
        );
        break;

      case 'investment_advice':
        if (!options.totalBudget) {
          return NextResponse.json(
            { error: 'Total budget is required for investment advice' },
            { status: 400 }
          );
        }
        result = await strategicRecommendationsEngine.generateInvestmentAdvice(
          targetDomain,
          options.totalBudget,
          options.timeframe || 24,
          {
            mustHaveAllocations: options.mustHaveAllocations,
            excludeCategories: options.excludeCategories,
            riskProfile: options.riskProfile || 'balanced'
          }
        );
        break;

      case 'competitive_response':
        if (!options.competitorAction) {
          return NextResponse.json(
            { error: 'Competitor action is required for response planning' },
            { status: 400 }
          );
        }
        result = await strategicRecommendationsEngine.generateCompetitiveResponsePlan(
          targetDomain,
          {
            competitor: options.competitorAction.competitor,
            action: options.competitorAction.action,
            detectedAt: new Date(options.competitorAction.detectedAt || Date.now()),
            estimatedImpact: options.competitorAction.estimatedImpact || 0.5,
            urgency: options.competitorAction.urgency || 'medium'
          }
        );
        break;

      case 'market_entry':
        if (!options.targetMarket) {
          return NextResponse.json(
            { error: 'Target market is required for market entry strategy' },
            { status: 400 }
          );
        }
        result = await strategicRecommendationsEngine.generateMarketEntryStrategy(
          targetDomain,
          options.targetMarket,
          {
            timeline: options.timeline || 12,
            budgetRange: options.budgetRange || { min: 100000, max: 1000000 },
            riskTolerance: options.riskTolerance || 'medium',
            strategicGoals: options.strategicGoals || []
          }
        );
        break;

      case 'comprehensive_plan':
        result = await strategicRecommendationsEngine.generateComprehensiveStrategicPlan(
          targetDomain,
          {
            planningHorizon: options.planningHorizon || 36,
            budgetConstraints: options.budgetConstraints,
            strategicPriorities: options.strategicPriorities || [],
            includeMarketEntry: options.includeMarketEntry !== false,
            riskTolerance: options.riskTolerance || 'medium'
          }
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid request type' },
          { status: 400 }
        );
    }

    // Track API usage
    await prisma.analyticsEvent.create({
      data: {
        event: 'strategic_recommendations_generated',
        userId: session.user.id,
        sessionId: session.user.id,
        properties: {
          targetDomain,
          requestType,
          planningHorizon: options.planningHorizon || 24,
          budgetConstraints: options.budgetConstraints || 0,
          teamId
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        requestType,
        generatedAt: new Date().toISOString(),
        planningHorizon: options.planningHorizon || 24,
        riskTolerance: options.riskTolerance || 'medium'
      }
    });

  } catch (error) {
    console.error('Strategic recommendations API error:', error);
    return NextResponse.json(
      { 
        error: 'Strategic recommendations generation failed',
        message: 'Unable to generate strategic recommendations. Please try again.'
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
    const planId = searchParams.get('planId');
    const type = searchParams.get('type') || 'all';
    const teamId = request.headers.get('x-team-id');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    if (planId) {
      // Get specific strategic plan
      const plan = await prisma.strategicPlan.findUnique({
        where: { id: planId }
      });

      if (!plan) {
        return NextResponse.json(
          { error: 'Strategic plan not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...plan,
          generatedAt: plan.generatedAt.toISOString()
        }
      });
    }

    if (domain) {
      // Get latest strategic plan for domain
      const plan = await prisma.strategicPlan.findFirst({
        where: { targetDomain: domain },
        orderBy: { generatedAt: 'desc' }
      });

      if (!plan) {
        return NextResponse.json(
          { error: 'No strategic plan found for this domain' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...plan,
          generatedAt: plan.generatedAt.toISOString()
        }
      });
    }

    // Get all strategic plans for team
    const plans = await prisma.strategicPlan.findMany({
      where: {
        // Add team filtering logic here
      },
      orderBy: { generatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        targetDomain: true,
        industry: true,
        planningHorizon: true,
        generatedAt: true,
        executiveSummary: true
      }
    });

    return NextResponse.json({
      success: true,
      data: plans.map(plan => ({
        ...plan,
        generatedAt: plan.generatedAt.toISOString()
      }))
    });

  } catch (error) {
    console.error('Get strategic recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve strategic recommendations' },
      { status: 500 }
    );
  }
}