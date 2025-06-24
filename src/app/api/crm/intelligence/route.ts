/**
 * CRM Sales Intelligence API
 * 
 * Provides sales analytics, forecasting, and performance insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { crmAgent } from '@/lib/agents/crm-agent';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const period = searchParams.get('period') || '30d';
    const ownerId = searchParams.get('owner_id');

    switch (type) {
      case 'overview':
        const intelligence = await crmAgent.generateSalesIntelligence();
        const overview = await getSalesOverview(period);
        
        return NextResponse.json({
          success: true,
          data: {
            ...intelligence,
            overview,
            period,
            generatedAt: new Date().toISOString()
          }
        });

      case 'forecast':
        const forecast = await getSalesForecast(period);
        
        return NextResponse.json({
          success: true,
          data: forecast
        });

      case 'performance':
        const performance = await getPerformanceMetrics(period, ownerId);
        
        return NextResponse.json({
          success: true,
          data: performance
        });

      case 'pipeline':
        const pipeline = await getPipelineAnalysis();
        
        return NextResponse.json({
          success: true,
          data: pipeline
        });

      case 'opportunities':
        const opportunities = await crmAgent.identifyUpsellOpportunities();
        const recommendations = await getRecommendations();
        
        return NextResponse.json({
          success: true,
          data: {
            upsellOpportunities: opportunities,
            recommendations,
            totalPotential: opportunities.reduce((sum, opp) => sum + opp.potential, 0)
          }
        });

      case 'trends':
        const trends = await getSalesTrends(period);
        
        return NextResponse.json({
          success: true,
          data: trends
        });

      default:
        // Return comprehensive intelligence report
        const fullIntelligence = await crmAgent.generateSalesIntelligence();
        const fullOverview = await getSalesOverview(period);
        const fullForecast = await getSalesForecast(period);
        const fullPerformance = await getPerformanceMetrics(period);
        
        return NextResponse.json({
          success: true,
          data: {
            intelligence: fullIntelligence,
            overview: fullOverview,
            forecast: fullForecast,
            performance: fullPerformance,
            period,
            generatedAt: new Date().toISOString()
          }
        });
    }

  } catch (error) {
    console.error('CRM intelligence GET API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch sales intelligence',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, dealId, forecastData, reportConfig } = body;

    switch (action) {
      case 'update_forecast':
        if (!forecastData) {
          return NextResponse.json(
            { success: false, error: 'Forecast data is required' },
            { status: 400 }
          );
        }

        const updatedForecast = await updateSalesForecast(forecastData);
        
        return NextResponse.json({
          success: true,
          data: updatedForecast,
          message: 'Sales forecast updated successfully'
        });

      case 'create_deal':
        if (!dealId) {
          return NextResponse.json(
            { success: false, error: 'Deal data is required' },
            { status: 400 }
          );
        }

        const dealResult = await crmAgent.createDeal(dealId);
        
        return NextResponse.json({
          success: dealResult.success,
          data: dealResult.dealId ? { dealId: dealResult.dealId } : null,
          message: dealResult.success ? 'Deal created successfully' : dealResult.error
        });

      case 'generate_report':
        if (!reportConfig) {
          return NextResponse.json(
            { success: false, error: 'Report configuration is required' },
            { status: 400 }
          );
        }

        const report = await generateCustomReport(reportConfig);
        
        return NextResponse.json({
          success: true,
          data: report,
          message: 'Report generated successfully'
        });

      case 'refresh_intelligence':
        // Refresh all intelligence data
        const refreshedIntelligence = await crmAgent.generateSalesIntelligence();
        
        return NextResponse.json({
          success: true,
          data: refreshedIntelligence,
          message: 'Sales intelligence refreshed successfully',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('CRM intelligence POST API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process intelligence request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ==================== HELPER FUNCTIONS ====================

async function getSalesOverview(period: string) {
  // Mock data - in production this would analyze actual deal data
  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  
  return {
    revenue: {
      current: 247500,
      previous: 198000,
      growth: 0.25,
      target: 300000,
      targetProgress: 0.825
    },
    deals: {
      won: 15,
      lost: 8,
      inProgress: 23,
      winRate: 0.652,
      averageSize: 16500,
      totalValue: 892000
    },
    pipeline: {
      totalValue: 1234500,
      qualifiedValue: 856700,
      weightedValue: 543200,
      averageCycle: 34.5, // days
      velocity: 23400 // revenue per day
    },
    team: {
      topPerformer: 'Sarah Chen',
      teamQuotaAttainment: 0.87,
      activitiesThisPeriod: 456,
      meetingsScheduled: 67
    }
  };
}

async function getSalesForecast(period: string) {
  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  
  // Generate forecast data points
  const forecastPoints = [];
  const baseRevenue = 50000;
  
  for (let i = 0; i <= periodDays; i += Math.floor(periodDays / 10)) {
    const growth = 1 + (i / periodDays) * 0.3; // 30% growth over period
    const variance = 0.9 + Math.random() * 0.2; // ±10% variance
    
    forecastPoints.push({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      predicted: Math.round(baseRevenue * growth * variance),
      conservative: Math.round(baseRevenue * growth * variance * 0.8),
      optimistic: Math.round(baseRevenue * growth * variance * 1.2),
      confidence: 0.95 - (i / periodDays) * 0.2 // Confidence decreases over time
    });
  }

  return {
    summary: {
      totalPredicted: forecastPoints[forecastPoints.length - 1].predicted * periodDays / 30,
      confidence: 0.87,
      growthRate: 0.23,
      achievementLikelihood: 0.78
    },
    timeline: forecastPoints,
    factors: [
      { factor: 'Seasonal trends', impact: 0.15, direction: 'positive' },
      { factor: 'Pipeline health', impact: 0.25, direction: 'positive' },
      { factor: 'Market conditions', impact: 0.08, direction: 'neutral' },
      { factor: 'Team capacity', impact: 0.12, direction: 'positive' }
    ],
    scenarios: {
      worstCase: forecastPoints[forecastPoints.length - 1].conservative,
      bestCase: forecastPoints[forecastPoints.length - 1].optimistic,
      mostLikely: forecastPoints[forecastPoints.length - 1].predicted
    }
  };
}

async function getPerformanceMetrics(period: string, ownerId?: string | null) {
  return {
    individual: ownerId ? {
      ownerId,
      name: 'Sarah Chen',
      revenue: 89500,
      deals: { won: 6, lost: 2, inProgress: 8 },
      activities: 145,
      quotaAttainment: 0.95,
      ranking: 1,
      strengths: ['Enterprise deals', 'Technical sales'],
      improvements: ['Follow-up timing', 'Proposal quality']
    } : null,
    team: [
      {
        ownerId: 'owner_1',
        name: 'Sarah Chen',
        revenue: 89500,
        deals: 16,
        winRate: 0.75,
        quotaAttainment: 0.95,
        activities: 145
      },
      {
        ownerId: 'owner_2',
        name: 'Marcus Johnson',
        revenue: 67200,
        deals: 12,
        winRate: 0.67,
        quotaAttainment: 0.78,
        activities: 132
      },
      {
        ownerId: 'owner_3',
        name: 'Lisa Wong',
        revenue: 54800,
        deals: 10,
        winRate: 0.71,
        quotaAttainment: 0.69,
        activities: 118
      }
    ],
    benchmarks: {
      averageWinRate: 0.68,
      averageCycleTime: 35.2,
      averageDealSize: 15800,
      topPerformerWinRate: 0.75,
      industryAverage: {
        winRate: 0.62,
        cycleTime: 42.1,
        dealSize: 14200
      }
    }
  };
}

async function getPipelineAnalysis() {
  return {
    stages: {
      prospecting: {
        count: 34,
        value: 445000,
        averageTime: 8.5,
        conversionRate: 0.42,
        velocity: 52400
      },
      qualification: {
        count: 23,
        value: 378000,
        averageTime: 12.3,
        conversionRate: 0.61,
        velocity: 30700
      },
      proposal: {
        count: 15,
        value: 287000,
        averageTime: 18.7,
        conversionRate: 0.73,
        velocity: 15300
      },
      negotiation: {
        count: 8,
        value: 156000,
        averageTime: 9.2,
        conversionRate: 0.85,
        velocity: 17000
      },
      closing: {
        count: 4,
        value: 89000,
        averageTime: 5.1,
        conversionRate: 0.92,
        velocity: 17400
      }
    },
    health: {
      score: 78,
      trends: {
        velocity: 0.12, // 12% increase
        conversion: -0.03, // 3% decrease
        stagnation: 0.15 // 15% of deals stagnant
      },
      bottlenecks: [
        {
          stage: 'qualification',
          issue: 'Extended qualification time',
          impact: 'high',
          recommendation: 'Implement qualification framework'
        },
        {
          stage: 'proposal',
          issue: 'Low conversion rate',
          impact: 'medium',
          recommendation: 'Improve proposal templates'
        }
      ]
    },
    forecast: {
      next30Days: 234000,
      next60Days: 445000,
      next90Days: 687000,
      confidence: 0.83
    }
  };
}

async function getRecommendations() {
  return [
    {
      id: 'rec_1',
      type: 'process_improvement',
      priority: 'high',
      title: 'Implement Lead Scoring Automation',
      description: 'Automate lead scoring to prioritize high-value prospects and improve conversion rates.',
      impact: {
        revenue: 45000,
        efficiency: 0.25,
        timeline: '30 days'
      },
      actionItems: [
        'Set up automated lead scoring rules',
        'Train team on new qualification criteria',
        'Monitor and adjust scoring thresholds'
      ]
    },
    {
      id: 'rec_2',
      type: 'training',
      priority: 'medium',
      title: 'Enterprise Sales Training',
      description: 'Provide specialized training for handling enterprise-level deals and stakeholders.',
      impact: {
        revenue: 78000,
        efficiency: 0.15,
        timeline: '60 days'
      },
      actionItems: [
        'Enroll team in enterprise sales course',
        'Develop internal case studies',
        'Create enterprise playbook'
      ]
    },
    {
      id: 'rec_3',
      type: 'technology',
      priority: 'medium',
      title: 'Sales Enablement Platform',
      description: 'Implement comprehensive sales enablement tools to streamline workflows.',
      impact: {
        revenue: 32000,
        efficiency: 0.35,
        timeline: '45 days'
      },
      actionItems: [
        'Evaluate sales enablement platforms',
        'Configure automated workflows',
        'Integrate with existing CRM'
      ]
    }
  ];
}

async function getSalesTrends(period: string) {
  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  
  // Generate trend data
  const trendPoints = [];
  for (let i = 0; i < periodDays; i += Math.max(1, Math.floor(periodDays / 20))) {
    const baseValue = 1000 + Math.sin(i / 10) * 200 + i * 15;
    trendPoints.push({
      date: new Date(Date.now() - (periodDays - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue: Math.round(baseValue + Math.random() * 200),
      deals: Math.round(baseValue / 200 + Math.random() * 3),
      activities: Math.round(baseValue / 50 + Math.random() * 10)
    });
  }

  return {
    revenue: {
      data: trendPoints.map(p => ({ date: p.date, value: p.revenue })),
      growth: 0.23,
      trend: 'increasing',
      seasonality: 'Q4 peak expected'
    },
    deals: {
      data: trendPoints.map(p => ({ date: p.date, value: p.deals })),
      growth: 0.18,
      trend: 'increasing',
      pattern: 'Steady growth with weekly peaks'
    },
    activities: {
      data: trendPoints.map(p => ({ date: p.date, value: p.activities })),
      growth: 0.12,
      trend: 'stable',
      efficiency: 'Increasing activity-to-deal ratio'
    },
    insights: [
      {
        type: 'positive',
        message: 'Revenue growth accelerating in the last 2 weeks',
        confidence: 0.87
      },
      {
        type: 'neutral',
        message: 'Deal velocity consistent with seasonal patterns',
        confidence: 0.92
      },
      {
        type: 'opportunity',
        message: 'Activity levels could be optimized for better conversion',
        confidence: 0.74
      }
    ]
  };
}

async function updateSalesForecast(forecastData: any) {
  // Mock implementation - in production this would update forecast models
  console.log('📊 Updating sales forecast with new data');
  
  return {
    updated: true,
    newPrediction: forecastData.prediction || 285000,
    confidence: forecastData.confidence || 0.85,
    factors: forecastData.factors || [],
    updatedAt: new Date().toISOString()
  };
}

async function generateCustomReport(reportConfig: any) {
  // Mock implementation - in production this would generate actual reports
  console.log('📋 Generating custom sales report');
  
  return {
    reportId: `report_${Date.now()}`,
    type: reportConfig.type || 'performance',
    period: reportConfig.period || '30d',
    format: reportConfig.format || 'json',
    data: {
      summary: 'Custom report data would be here',
      metrics: {},
      charts: []
    },
    generatedAt: new Date().toISOString(),
    downloadUrl: `/api/reports/${Date.now()}.pdf`
  };
}