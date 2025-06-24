/**
 * Innovation Dashboard API - Strategic Intelligence Dashboard
 * 
 * Provides real-time innovation monitoring dashboard data including
 * technology trends, competitor moves, research insights, and strategic recommendations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { innovationAgent } from '@/lib/agents/innovation-agent';
import { innovationBriefGenerator } from '@/lib/services/innovation-brief-generator';
import { competitorFeatureTracker } from '@/lib/services/competitor-feature-tracker';
import { analyticsEngine } from '@/lib/analytics/analytics-enhanced';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/innovation/dashboard
 * Returns comprehensive innovation dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') as 'week' | 'month' | 'quarter' || 'week';
    const teamId = searchParams.get('teamId') || undefined;

    // Get dashboard data from innovation agent
    const dashboardData = await innovationAgent.getInnovationDashboard(timeframe);
    
    // Get latest innovation brief
    const latestBrief = await innovationBriefGenerator.getLatestBrief(teamId);
    
    // Get competitor feature tracking report
    const competitorReport = await competitorFeatureTracker.getFeatureDetectionReport(timeframe);
    
    // Get innovation alerts
    const alerts = await getInnovationAlerts(teamId, 10);
    
    // Get trending technologies
    const trendingTech = await getTrendingTechnologies(timeframe);
    
    // Get strategic recommendations
    const recommendations = await getStrategicRecommendations(teamId);

    const response = {
      timeframe,
      summary: {
        totalTrends: dashboardData.metrics.totalTrends,
        competitorFeatures: dashboardData.metrics.competitorFeatures,
        researchPapers: dashboardData.metrics.researchPapers,
        criticalAlerts: dashboardData.metrics.criticalAlerts,
        implementedRecommendations: dashboardData.metrics.implementedRecommendations,
        innovationScore: calculateInnovationScore(dashboardData, competitorReport),
        competitiveAdvantage: calculateCompetitiveAdvantage(competitorReport)
      },
      latestBrief: latestBrief ? {
        id: latestBrief.id,
        weekEnding: latestBrief.weekEnding,
        executiveSummary: latestBrief.executiveSummary,
        confidence: latestBrief.confidence,
        keyFindings: latestBrief.keyFindings,
        criticalThreats: latestBrief.threatAssessment?.filter(t => t.impact > 80).length || 0,
        urgentActions: latestBrief.nextActions?.filter(a => a.priority === 'urgent').length || 0
      } : null,
      competitorIntelligence: {
        newFeatures: competitorReport.recentDetections?.slice(0, 5) || [],
        pricingChanges: competitorReport.recentPricingChanges?.slice(0, 3) || [],
        threatLevels: competitorReport.threatLevels || {},
        competitorsTracked: competitorReport.summary?.competitorsTracked || 0
      },
      trendingTechnologies: trendingTech,
      alerts: alerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        createdAt: alert.createdAt,
        requiresAction: alert.requiresAction
      })),
      strategicRecommendations: recommendations.slice(0, 5),
      charts: {
        trendsByCategory: generateTrendCategoryChart(dashboardData),
        competitorActivity: generateCompetitorActivityChart(competitorReport),
        innovationTimeline: generateInnovationTimeline(timeframe),
        threatMatrix: generateThreatMatrix(latestBrief?.threatAssessment || [])
      },
      lastUpdated: new Date()
    };

    // Track dashboard access
    await analyticsEngine.trackEvent({
      event: 'innovation_dashboard_accessed',
      properties: {
        userId: session.user.id,
        teamId,
        timeframe,
        criticalAlerts: response.summary.criticalAlerts,
        newFeatures: response.competitorIntelligence.newFeatures.length
      },
      context: { userAgent: request.headers.get('user-agent') }
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Innovation dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to load innovation dashboard' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/innovation/dashboard/refresh
 * Triggers dashboard data refresh
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { forceRefresh = false, focusAreas = [] } = body;

    // Trigger innovation monitoring pipeline
    if (forceRefresh) {
      await innovationAgent.runMonitoringPipeline();
    }

    // Generate new brief if requested
    if (body.generateBrief) {
      const brief = await innovationBriefGenerator.generateWeeklyBrief({
        teamId: body.teamId,
        focusAreas,
        includeConfidential: body.includeConfidential || false
      });
      
      return NextResponse.json({ 
        message: 'Dashboard refreshed and brief generated',
        briefId: brief.id
      });
    }

    return NextResponse.json({ message: 'Dashboard refresh initiated' });
  } catch (error) {
    console.error('Dashboard refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh dashboard' },
      { status: 500 }
    );
  }
}

// Helper functions

async function getInnovationAlerts(teamId?: string, limit: number = 10) {
  try {
    const alerts = await prisma.innovationAlert.findMany({
      where: teamId ? { teamId } : {},
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    return alerts;
  } catch (error) {
    console.error('Error getting innovation alerts:', error);
    return [];
  }
}

async function getTrendingTechnologies(timeframe: string) {
  try {
    const startDate = new Date();
    switch (timeframe) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
    }

    // Get trending technologies from database
    const trends = await prisma.technologyTrend.findMany({
      where: {
        firstDetected: { gte: startDate }
      },
      orderBy: { relevanceScore: 'desc' },
      take: 10
    });

    return trends.map(trend => ({
      name: trend.name,
      category: trend.category,
      relevanceScore: trend.relevanceScore,
      adoptionRate: trend.adoptionRate,
      impactPotential: trend.impactPotential,
      timeToMainstream: trend.timeToMainstream,
      keyPlayers: trend.keyPlayers
    }));
  } catch (error) {
    console.error('Error getting trending technologies:', error);
    return [];
  }
}

async function getStrategicRecommendations(teamId?: string) {
  try {
    const latestBrief = await innovationBriefGenerator.getLatestBrief(teamId);
    if (!latestBrief) return [];

    return latestBrief.strategicRecommendations?.map(rec => ({
      priority: rec.priority,
      title: rec.title,
      description: rec.description,
      businessJustification: rec.businessJustification,
      timeline: rec.implementation?.timeline,
      expectedOutcome: rec.expectedOutcome,
      confidence: rec.confidence
    })) || [];
  } catch (error) {
    console.error('Error getting strategic recommendations:', error);
    return [];
  }
}

function calculateInnovationScore(dashboardData: any, competitorReport: any): number {
  // Calculate composite innovation score
  const trendScore = Math.min(dashboardData.metrics.totalTrends / 50 * 100, 100);
  const researchScore = Math.min(dashboardData.metrics.researchPapers / 30 * 100, 100);
  const competitorScore = Math.max(100 - (competitorReport.summary?.totalFeatures || 0) * 2, 0);
  const implementationScore = Math.min(dashboardData.metrics.implementedRecommendations * 10, 100);

  return Math.round((trendScore * 0.3 + researchScore * 0.2 + competitorScore * 0.3 + implementationScore * 0.2));
}

function calculateCompetitiveAdvantage(competitorReport: any): number {
  // Calculate competitive advantage score
  const criticalThreats = competitorReport.threatLevels?.critical || 0;
  const highThreats = competitorReport.threatLevels?.high || 0;
  
  const threatPenalty = (criticalThreats * 20) + (highThreats * 10);
  const baseScore = 85; // Assuming strong baseline
  
  return Math.max(baseScore - threatPenalty, 0);
}

function generateTrendCategoryChart(dashboardData: any) {
  // Generate chart data for technology trends by category
  return {
    labels: ['AI', 'Web', 'Mobile', 'Cloud', 'Security', 'Other'],
    datasets: [{
      label: 'Technology Trends',
      data: [12, 8, 6, 10, 4, 5], // Mock data - replace with actual
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)'
      ]
    }]
  };
}

function generateCompetitorActivityChart(competitorReport: any) {
  // Generate chart data for competitor activity over time
  const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  return {
    labels,
    datasets: [{
      label: 'New Features',
      data: [3, 5, 2, 4], // Mock data
      borderColor: 'rgba(255, 99, 132, 1)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)'
    }, {
      label: 'Pricing Changes',
      data: [1, 0, 2, 1], // Mock data
      borderColor: 'rgba(54, 162, 235, 1)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)'
    }]
  };
}

function generateInnovationTimeline(timeframe: string) {
  // Generate timeline data for innovation milestones
  const now = new Date();
  const milestones = [];
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 7));
    
    milestones.push({
      date: date.toISOString().split('T')[0],
      event: `Innovation Milestone ${5-i}`,
      type: 'technology',
      impact: Math.random() > 0.5 ? 'high' : 'medium'
    });
  }
  
  return milestones;
}

function generateThreatMatrix(threats: any[]) {
  // Generate threat matrix for probability vs impact
  return threats.map(threat => ({
    name: threat.threat?.substring(0, 30) + '...',
    probability: threat.probability || 50,
    impact: threat.impact || 50,
    source: threat.source
  }));
}