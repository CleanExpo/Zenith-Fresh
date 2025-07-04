// src/app/api/intelligence/predictive/route.ts
// Predictive Analytics API - AI-powered market predictions and competitor forecasting

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { predictiveAnalyticsEngine } from '@/lib/intelligence/predictive-analytics-engine';
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
      industry, 
      competitors = [], 
      forecastHorizon = 24,
      analysisType = 'comprehensive',
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
        { error: 'Enterprise subscription required for predictive analytics' },
        { status: 403 }
      );
    }

    let result;

    switch (analysisType) {
      case 'competitor_moves':
        result = await predictiveAnalyticsEngine.predictCompetitorMoves(competitors, {
          forecastHorizon,
          includeAcquisitions: options.includeAcquisitions !== false,
          includePricing: options.includePricing !== false,
          includeProductLaunches: options.includeProductLaunches !== false,
          confidenceThreshold: options.confidenceThreshold || 0.6
        });
        break;

      case 'market_trends':
        result = await predictiveAnalyticsEngine.predictMarketTrends(industry, {
          forecastHorizon,
          includeDisruption: options.includeDisruption !== false,
          includeTechnology: options.includeTechnology !== false,
          includeRegulatory: options.includeRegulatory !== false
        });
        break;

      case 'customer_behavior':
        result = await predictiveAnalyticsEngine.predictCustomerBehavior(targetDomain, industry, {
          forecastHorizon,
          includeChurnPrediction: options.includeChurnPrediction !== false,
          includeDemandForecasting: options.includeDemandForecasting !== false,
          segmentAnalysis: options.segmentAnalysis !== false
        });
        break;

      case 'revenue_impact':
        const scenarios = options.scenarios || ['conservative', 'likely', 'optimistic', 'disruption'];
        result = await predictiveAnalyticsEngine.generateRevenueImpactModel(targetDomain, scenarios, {
          forecastHorizon,
          includeCompetitorImpact: options.includeCompetitorImpact !== false,
          includeInvestmentRecs: options.includeInvestmentRecs !== false,
          riskAnalysis: options.riskAnalysis !== false
        });
        break;

      case 'comprehensive':
      default:
        result = await predictiveAnalyticsEngine.generatePredictiveIntelligenceReport(
          targetDomain,
          industry,
          competitors,
          {
            forecastHorizon,
            scenarios: options.scenarios,
            includeAll: options.includeAll !== false
          }
        );
        break;
    }

    // Track API usage
    await prisma.analyticsEvent.create({
      data: {
        event: 'predictive_analytics_generated',
        userId: session.user.id,
        sessionId: session.user.id,
        properties: {
          targetDomain,
          industry,
          analysisType,
          forecastHorizon,
          competitorsAnalyzed: competitors.length,
          teamId
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        analysisType,
        forecastHorizon,
        generatedAt: new Date().toISOString(),
        confidence: result.confidenceScore || 0.75,
        modelVersion: '2.1.0'
      }
    });

  } catch (error) {
    console.error('Predictive analytics API error:', error);
    return NextResponse.json(
      { 
        error: 'Predictive analytics generation failed',
        message: 'Unable to generate predictive analytics. Please try again.'
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
    const reportId = searchParams.get('reportId');
    const teamId = request.headers.get('x-team-id');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    let report;

    if (reportId) {
      // Get specific report by ID
      report = await prisma.predictiveReport.findUnique({
        where: { id: reportId }
      });
    } else if (domain) {
      // Get most recent report for domain
      report = await prisma.predictiveReport.findFirst({
        where: { targetDomain: domain },
        orderBy: { generatedAt: 'desc' }
      });
    } else {
      // Get all reports for team
      const reports = await prisma.predictiveReport.findMany({
        where: {
          // Add team filtering logic here
        },
        orderBy: { generatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          targetDomain: true,
          industry: true,
          generatedAt: true,
          forecastHorizon: true,
          confidenceScore: true
        }
      });

      return NextResponse.json({
        success: true,
        data: reports
      });
    }

    if (!report) {
      return NextResponse.json(
        { error: 'Predictive report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...report,
        generatedAt: report.generatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Get predictive analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve predictive analytics' },
      { status: 500 }
    );
  }
}