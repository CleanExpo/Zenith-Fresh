// src/app/api/intelligence/dashboard/route.ts
// Intelligence Dashboard API - Comprehensive dashboard data aggregation

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { marketAnalysisEngine } from '@/lib/intelligence/market-analysis-engine';
import { predictiveAnalyticsEngine } from '@/lib/intelligence/predictive-analytics-engine';
import { strategicRecommendationsEngine } from '@/lib/intelligence/strategic-recommendations-engine';
import { competitiveIntelligenceEngine } from '@/lib/services/competitive-intelligence-engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const timeframe = searchParams.get('timeframe') || '30d';
    const dashboardType = searchParams.get('type') || 'executive';

    const teamId = request.headers.get('x-team-id');
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    // Check team access and subscription
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { billing: true }
    });

    if (!team || !['enterprise'].includes(team.subscriptionPlan || '')) {
      return NextResponse.json(
        { error: 'Enterprise subscription required for intelligence dashboard' },
        { status: 403 }
      );
    }

    let dashboardData;

    switch (dashboardType) {
      case 'executive':
        dashboardData = await generateExecutiveDashboard(domain, teamId, timeframe);
        break;
      case 'competitive':
        dashboardData = await generateCompetitiveDashboard(domain, teamId, timeframe);
        break;
      case 'market':
        dashboardData = await generateMarketDashboard(domain, teamId, timeframe);
        break;
      case 'predictive':
        dashboardData = await generatePredictiveDashboard(domain, teamId, timeframe);
        break;
      case 'overview':
      default:
        dashboardData = await generateOverviewDashboard(domain, teamId, timeframe);
        break;
    }

    // Track dashboard access
    await prisma.analyticsEvent.create({
      data: {
        event: 'intelligence_dashboard_accessed',
        userId: session.user.id,
        sessionId: session.user.id,
        properties: {
          domain,
          dashboardType,
          timeframe,
          teamId
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: dashboardData,
      metadata: {
        dashboardType,
        timeframe,
        generatedAt: new Date().toISOString(),
        domain
      }
    });

  } catch (error) {
    console.error('Intelligence dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to load intelligence dashboard' },
      { status: 500 }
    );
  }
}

// Executive Dashboard - High-level strategic overview
async function generateExecutiveDashboard(domain: string | null, teamId: string, timeframe: string) {
  try {
    // Get recent intelligence data
    const [
      recentAlerts,
      activeWorkflows,
      strategicPlans,
      marketIntelligence,
      competitiveReports
    ] = await Promise.all([
      getRecentAlerts(teamId, timeframe),
      getActiveWorkflows(teamId),
      getRecentStrategicPlans(teamId),
      getRecentMarketIntelligence(domain, teamId),
      getRecentCompetitiveReports(domain, teamId)
    ]);

    // Calculate key metrics
    const keyMetrics = {
      totalAlerts: recentAlerts.critical + recentAlerts.high + recentAlerts.medium + recentAlerts.low,
      criticalAlerts: recentAlerts.critical,
      activeWorkflows: activeWorkflows.active,
      intelligenceReports: marketIntelligence.length + competitiveReports.length,
      marketOpportunities: marketIntelligence.reduce((sum, report) => 
        sum + (report.opportunities?.opportunities?.length || 0), 0),
      threatLevel: calculateOverallThreatLevel(recentAlerts),
      competitivePosition: calculateCompetitivePosition(competitiveReports),
      recommendationsPending: strategicPlans.reduce((sum, plan) => 
        sum + (plan.strategicRecommendations?.length || 0), 0)
    };

    // Recent activity timeline
    const activityTimeline = await generateActivityTimeline(teamId, timeframe);

    // Top priorities
    const topPriorities = await getTopPriorities(strategicPlans, recentAlerts);

    return {
      keyMetrics,
      recentAlerts: await formatAlertsForDashboard(recentAlerts),
      activityTimeline,
      topPriorities,
      workflowStatus: activeWorkflows,
      marketInsights: await formatMarketInsights(marketIntelligence),
      competitiveUpdates: await formatCompetitiveUpdates(competitiveReports),
      performanceIndicators: await calculatePerformanceIndicators(teamId, timeframe)
    };
  } catch (error) {
    console.error('Executive dashboard generation error:', error);
    throw error;
  }
}

// Competitive Dashboard - Competitive intelligence focus
async function generateCompetitiveDashboard(domain: string | null, teamId: string, timeframe: string) {
  try {
    const [
      competitiveReports,
      competitorMovements,
      marketPosition,
      competitiveAlerts,
      predictiveInsights
    ] = await Promise.all([
      getRecentCompetitiveReports(domain, teamId),
      getCompetitorMovements(domain, teamId, timeframe),
      getCurrentMarketPosition(domain, teamId),
      getCompetitiveAlerts(teamId, timeframe),
      getCompetitivePredictions(domain, teamId)
    ]);

    return {
      competitiveOverview: {
        totalCompetitors: competitorMovements.length,
        activeThreats: competitiveAlerts.filter(a => a.severity === 'high' || a.severity === 'critical').length,
        marketPosition: marketPosition.rank || 0,
        competitiveScore: marketPosition.score || 0
      },
      competitorMovements,
      marketPosition,
      competitiveAlerts: competitiveAlerts.slice(0, 10),
      threatAnalysis: await analyzeThreatLevels(competitiveAlerts),
      opportunityGaps: await identifyOpportunityGaps(competitiveReports),
      predictiveInsights: predictiveInsights.slice(0, 5),
      competitiveTimeline: await generateCompetitiveTimeline(domain, teamId, timeframe),
      responseRecommendations: await generateResponseRecommendations(competitorMovements)
    };
  } catch (error) {
    console.error('Competitive dashboard generation error:', error);
    throw error;
  }
}

// Market Dashboard - Market analysis and trends
async function generateMarketDashboard(domain: string | null, teamId: string, timeframe: string) {
  try {
    const [
      marketIntelligence,
      trendAnalysis,
      opportunityAnalysis,
      marketAlerts,
      industryInsights
    ] = await Promise.all([
      getRecentMarketIntelligence(domain, teamId),
      getTrendAnalysis(domain, teamId, timeframe),
      getOpportunityAnalysis(domain, teamId),
      getMarketAlerts(teamId, timeframe),
      getIndustryInsights(domain, teamId)
    ]);

    return {
      marketOverview: {
        marketSize: trendAnalysis.currentSize || 0,
        growthRate: trendAnalysis.growthRate || 0,
        opportunityCount: opportunityAnalysis.length,
        trendMomentum: calculateTrendMomentum(trendAnalysis)
      },
      trendAnalysis,
      marketOpportunities: opportunityAnalysis.slice(0, 10),
      seasonalityData: await getSeasonalityData(domain, teamId),
      marketAlerts: marketAlerts.slice(0, 8),
      industryInsights,
      demandForecasting: await getDemandForecasting(domain, teamId),
      marketSegmentation: await getMarketSegmentation(domain, teamId),
      competitiveLandscape: await getCompetitiveLandscapeData(domain, teamId)
    };
  } catch (error) {
    console.error('Market dashboard generation error:', error);
    throw error;
  }
}

// Predictive Dashboard - AI predictions and forecasts
async function generatePredictiveDashboard(domain: string | null, teamId: string, timeframe: string) {
  try {
    const [
      predictiveReports,
      competitorPredictions,
      marketForecasts,
      revenuePredictions,
      riskAssessments
    ] = await Promise.all([
      getPredictiveReports(domain, teamId),
      getCompetitorPredictions(domain, teamId),
      getMarketForecasts(domain, teamId),
      getRevenuePredictions(domain, teamId),
      getRiskAssessments(domain, teamId)
    ]);

    return {
      predictiveOverview: {
        predictionAccuracy: calculatePredictionAccuracy(predictiveReports),
        forecastHorizon: 24, // months
        confidenceScore: calculateOverallConfidence(predictiveReports),
        activeScenarios: revenuePredictions.scenarios?.length || 0
      },
      competitorPredictions: competitorPredictions.slice(0, 8),
      marketForecasts,
      revenuePredictions,
      riskAssessments: riskAssessments.slice(0, 6),
      scenarioAnalysis: await getScenarioAnalysis(domain, teamId),
      predictiveAlerts: await getPredictiveAlerts(teamId, timeframe),
      modelPerformance: await getModelPerformanceMetrics(teamId),
      forecastingAccuracy: await getForecastingAccuracy(teamId, timeframe)
    };
  } catch (error) {
    console.error('Predictive dashboard generation error:', error);
    throw error;
  }
}

// Overview Dashboard - Comprehensive summary
async function generateOverviewDashboard(domain: string | null, teamId: string, timeframe: string) {
  try {
    const [
      executiveData,
      competitiveData,
      marketData,
      predictiveData
    ] = await Promise.all([
      generateExecutiveDashboard(domain, teamId, timeframe),
      generateCompetitiveDashboard(domain, teamId, timeframe),
      generateMarketDashboard(domain, teamId, timeframe),
      generatePredictiveDashboard(domain, teamId, timeframe)
    ]);

    return {
      summary: {
        totalAlerts: executiveData.keyMetrics.totalAlerts,
        activeWorkflows: executiveData.keyMetrics.activeWorkflows,
        marketOpportunities: marketData.marketOverview.opportunityCount,
        competitiveThreats: competitiveData.competitiveOverview.activeThreats,
        predictionAccuracy: predictiveData.predictiveOverview.predictionAccuracy,
        overallHealth: calculateOverallHealth([
          executiveData,
          competitiveData,
          marketData,
          predictiveData
        ])
      },
      recentHighlights: [
        ...executiveData.topPriorities.slice(0, 2),
        ...competitiveData.competitiveAlerts.slice(0, 2),
        ...marketData.marketAlerts.slice(0, 2)
      ],
      keyInsights: await generateKeyInsights([
        executiveData,
        competitiveData,
        marketData,
        predictiveData
      ]),
      actionItems: await generateActionItems([
        executiveData,
        competitiveData,
        marketData,
        predictiveData
      ]),
      performanceTrends: await getPerformanceTrends(teamId, timeframe)
    };
  } catch (error) {
    console.error('Overview dashboard generation error:', error);
    throw error;
  }
}

// Helper functions for data aggregation
async function getRecentAlerts(teamId: string, timeframe: string) {
  const timeframeDays = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const since = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);

  const alerts = await prisma.monitoringAlert.groupBy({
    by: ['severity'],
    where: {
      teamId,
      createdAt: { gte: since }
    },
    _count: true
  });

  return {
    critical: alerts.find(a => a.severity === 'critical')?._count || 0,
    high: alerts.find(a => a.severity === 'high')?._count || 0,
    medium: alerts.find(a => a.severity === 'medium')?._count || 0,
    low: alerts.find(a => a.severity === 'low')?._count || 0
  };
}

async function getActiveWorkflows(teamId: string) {
  const workflows = await prisma.automationWorkflow.groupBy({
    by: ['isActive'],
    where: { teamId },
    _count: true
  });

  return {
    active: workflows.find(w => w.isActive)?._count || 0,
    inactive: workflows.find(w => !w.isActive)?._count || 0,
    total: workflows.reduce((sum, w) => sum + w._count, 0)
  };
}

async function getRecentStrategicPlans(teamId: string) {
  return await prisma.strategicPlan.findMany({
    where: {
      // Add team filtering logic
    },
    orderBy: { generatedAt: 'desc' },
    take: 5
  });
}

async function getRecentMarketIntelligence(domain: string | null, teamId: string) {
  const where: any = {};
  if (domain) where.targetDomain = domain;
  
  return await prisma.marketIntelligence.findMany({
    where,
    orderBy: { analysisDate: 'desc' },
    take: 3
  });
}

async function getRecentCompetitiveReports(domain: string | null, teamId: string) {
  const where: any = { teamId };
  if (domain) where.targetDomain = domain;
  
  return await prisma.competitiveReport.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 3
  });
}

// Additional helper functions would be implemented here...
// These are simplified implementations for the core functionality

function calculateOverallThreatLevel(alerts: any): 'low' | 'medium' | 'high' | 'critical' {
  if (alerts.critical > 0) return 'critical';
  if (alerts.high > 2) return 'high';
  if (alerts.medium > 5) return 'medium';
  return 'low';
}

function calculateCompetitivePosition(reports: any[]): number {
  return reports.length > 0 ? 75 : 50; // Simplified calculation
}

async function generateActivityTimeline(teamId: string, timeframe: string) {
  return [
    {
      timestamp: new Date().toISOString(),
      type: 'alert',
      title: 'New competitive threat detected',
      description: 'Competitor launched new product feature'
    }
  ];
}

async function getTopPriorities(plans: any[], alerts: any) {
  return [
    {
      priority: 'critical',
      title: 'Respond to competitive threat',
      description: 'Immediate action required',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}

// Placeholder implementations for other helper functions
async function formatAlertsForDashboard(alerts: any) { return alerts; }
async function formatMarketInsights(intelligence: any[]) { return intelligence; }
async function formatCompetitiveUpdates(reports: any[]) { return reports; }
async function calculatePerformanceIndicators(teamId: string, timeframe: string) { return {}; }
async function getCompetitorMovements(domain: string | null, teamId: string, timeframe: string) { return []; }
async function getCurrentMarketPosition(domain: string | null, teamId: string) { return { rank: 1, score: 85 }; }
async function getCompetitiveAlerts(teamId: string, timeframe: string) { return []; }
async function getCompetitivePredictions(domain: string | null, teamId: string) { return []; }
async function analyzeThreatLevels(alerts: any[]) { return {}; }
async function identifyOpportunityGaps(reports: any[]) { return []; }
async function generateCompetitiveTimeline(domain: string | null, teamId: string, timeframe: string) { return []; }
async function generateResponseRecommendations(movements: any[]) { return []; }
async function getTrendAnalysis(domain: string | null, teamId: string, timeframe: string) { return { currentSize: 1000000, growthRate: 15 }; }
async function getOpportunityAnalysis(domain: string | null, teamId: string) { return []; }
async function getMarketAlerts(teamId: string, timeframe: string) { return []; }
async function getIndustryInsights(domain: string | null, teamId: string) { return []; }
function calculateTrendMomentum(analysis: any): 'up' | 'down' | 'stable' { return 'up'; }
async function getSeasonalityData(domain: string | null, teamId: string) { return []; }
async function getDemandForecasting(domain: string | null, teamId: string) { return []; }
async function getMarketSegmentation(domain: string | null, teamId: string) { return []; }
async function getCompetitiveLandscapeData(domain: string | null, teamId: string) { return {}; }
async function getPredictiveReports(domain: string | null, teamId: string) { return []; }
async function getCompetitorPredictions(domain: string | null, teamId: string) { return []; }
async function getMarketForecasts(domain: string | null, teamId: string) { return []; }
async function getRevenuePredictions(domain: string | null, teamId: string) { return { scenarios: [] }; }
async function getRiskAssessments(domain: string | null, teamId: string) { return []; }
function calculatePredictionAccuracy(reports: any[]): number { return 78; }
function calculateOverallConfidence(reports: any[]): number { return 82; }
async function getScenarioAnalysis(domain: string | null, teamId: string) { return []; }
async function getPredictiveAlerts(teamId: string, timeframe: string) { return []; }
async function getModelPerformanceMetrics(teamId: string) { return {}; }
async function getForecastingAccuracy(teamId: string, timeframe: string) { return {}; }
function calculateOverallHealth(dashboards: any[]): number { return 85; }
async function generateKeyInsights(dashboards: any[]) { return []; }
async function generateActionItems(dashboards: any[]) { return []; }
async function getPerformanceTrends(teamId: string, timeframe: string) { return []; }