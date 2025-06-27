import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMLService } from '@/lib/ml/utils';
import { rateLimit } from '@/lib/security/rate-limiter';

// Rate limiting for insights
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: 'Too many insight requests, please try again later'
});

interface AutoInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'recommendation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number;
  impact: number;
  actionable: boolean;
  actions: Array<{
    type: string;
    description: string;
    effort: 'low' | 'medium' | 'high';
    expectedImpact: number;
  }>;
  data: any;
  timestamp: Date;
  expiresAt?: Date;
  category: string;
}

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await limiter.check(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    const mlService = getMLService();
    
    // Generate automated insights based on current data
    const insights = await generateAutomatedInsights(mlService, {
      type,
      priority,
      category,
      limit
    });

    return NextResponse.json({
      success: true,
      data: insights,
      metadata: {
        total: insights.length,
        filters: { type, priority, category, limit },
        generatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('ML Insights error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error generating insights',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await limiter.check(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      analysisType, 
      dataRange = '30d',
      includeRecommendations = true,
      focusAreas = [],
      parameters = {}
    } = body;

    const mlService = getMLService();
    let insights = [];

    switch (analysisType) {
      case 'revenue_optimization':
        insights = await generateRevenueOptimizationInsights(mlService, parameters);
        break;

      case 'churn_prevention':
        insights = await generateChurnPreventionInsights(mlService, parameters);
        break;

      case 'feature_adoption':
        insights = await generateFeatureAdoptionInsights(mlService, parameters);
        break;

      case 'user_engagement':
        insights = await generateUserEngagementInsights(mlService, parameters);
        break;

      case 'market_opportunity':
        insights = await generateMarketOpportunityInsights(mlService, parameters);
        break;

      case 'operational_efficiency':
        insights = await generateOperationalEfficiencyInsights(mlService, parameters);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown analysis type: ${analysisType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      analysisType,
      data: insights,
      metadata: {
        dataRange,
        includeRecommendations,
        focusAreas,
        generatedAt: new Date().toISOString(),
        requestedBy: session.user.id
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('ML Insights POST error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error generating custom insights',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to generate automated insights
async function generateAutomatedInsights(
  mlService: any,
  filters: { type: string; priority?: string; category?: string; limit: number }
): Promise<AutoInsight[]> {
  const insights: AutoInsight[] = [];

  // Generate various types of insights
  insights.push(...await generateChurnInsights(mlService));
  insights.push(...await generateRevenueInsights(mlService));
  insights.push(...await generateUsageInsights(mlService));
  insights.push(...await generateSegmentInsights(mlService));
  insights.push(...await generateAnomalyInsights(mlService));

  // Apply filters
  let filteredInsights = insights;

  if (filters.type !== 'all') {
    filteredInsights = filteredInsights.filter(insight => insight.type === filters.type);
  }

  if (filters.priority) {
    filteredInsights = filteredInsights.filter(insight => insight.priority === filters.priority);
  }

  if (filters.category) {
    filteredInsights = filteredInsights.filter(insight => insight.category === filters.category);
  }

  // Sort by priority and impact
  filteredInsights.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority] - priorityOrder[a.priority]) || (b.impact - a.impact);
  });

  return filteredInsights.slice(0, filters.limit);
}

async function generateChurnInsights(mlService: any): Promise<AutoInsight[]> {
  const insights: AutoInsight[] = [];

  // Mock high churn risk insight
  insights.push({
    id: 'churn_spike_detected',
    type: 'risk',
    priority: 'high',
    title: 'Elevated Churn Risk Detected',
    description: 'Churn probability has increased by 23% in the last 7 days, affecting 45 high-value users.',
    confidence: 0.87,
    impact: 85,
    actionable: true,
    actions: [
      {
        type: 'retention_campaign',
        description: 'Launch targeted retention email campaign',
        effort: 'medium',
        expectedImpact: 60
      },
      {
        type: 'personal_outreach',
        description: 'Schedule calls with at-risk enterprise users',
        effort: 'high',
        expectedImpact: 80
      }
    ],
    data: {
      affectedUsers: 45,
      potentialRevenueAtRisk: 125000,
      timeframe: '7 days'
    },
    timestamp: new Date(),
    category: 'retention'
  });

  return insights;
}

async function generateRevenueInsights(mlService: any): Promise<AutoInsight[]> {
  const insights: AutoInsight[] = [];

  insights.push({
    id: 'revenue_growth_opportunity',
    type: 'opportunity',
    priority: 'medium',
    title: 'Upselling Opportunity Identified',
    description: '127 users are showing high engagement patterns similar to users who upgraded to premium tier.',
    confidence: 0.76,
    impact: 70,
    actionable: true,
    actions: [
      {
        type: 'upsell_campaign',
        description: 'Create targeted upsell campaign highlighting premium features',
        effort: 'medium',
        expectedImpact: 65
      },
      {
        type: 'feature_demo',
        description: 'Offer personalized demos of premium features',
        effort: 'high',
        expectedImpact: 75
      }
    ],
    data: {
      targetUsers: 127,
      estimatedRevenue: 89000,
      conversionProbability: 0.34
    },
    timestamp: new Date(),
    category: 'revenue'
  });

  return insights;
}

async function generateUsageInsights(mlService: any): Promise<AutoInsight[]> {
  const insights: AutoInsight[] = [];

  insights.push({
    id: 'feature_underutilization',
    type: 'recommendation',
    priority: 'medium',
    title: 'Advanced Analytics Feature Underutilized',
    description: 'Only 23% of premium users are using advanced analytics, despite it being a key selling point.',
    confidence: 0.92,
    impact: 65,
    actionable: true,
    actions: [
      {
        type: 'onboarding_improvement',
        description: 'Add advanced analytics to premium onboarding flow',
        effort: 'medium',
        expectedImpact: 55
      },
      {
        type: 'tutorial_creation',
        description: 'Create video tutorials for advanced analytics',
        effort: 'medium',
        expectedImpact: 50
      }
    ],
    data: {
      currentAdoption: 23,
      targetAdoption: 60,
      affectedUsers: 234
    },
    timestamp: new Date(),
    category: 'engagement'
  });

  return insights;
}

async function generateSegmentInsights(mlService: any): Promise<AutoInsight[]> {
  const insights: AutoInsight[] = [];

  insights.push({
    id: 'emerging_segment_detected',
    type: 'trend',
    priority: 'medium',
    title: 'New User Segment Emerging',
    description: 'A new user segment with high mobile usage and API integration patterns is growing rapidly.',
    confidence: 0.68,
    impact: 75,
    actionable: true,
    actions: [
      {
        type: 'product_development',
        description: 'Enhance mobile experience and API documentation',
        effort: 'high',
        expectedImpact: 70
      },
      {
        type: 'marketing_campaign',
        description: 'Create mobile-focused marketing campaign',
        effort: 'medium',
        expectedImpact: 55
      }
    ],
    data: {
      segmentSize: 156,
      growthRate: 34,
      characteristics: ['Mobile-first', 'API-heavy', 'Developer-focused']
    },
    timestamp: new Date(),
    category: 'growth'
  });

  return insights;
}

async function generateAnomalyInsights(mlService: any): Promise<AutoInsight[]> {
  const insights: AutoInsight[] = [];

  // Get anomalies from ML service
  try {
    const anomalies = await mlService.detectAnomalies();
    
    anomalies.forEach((anomaly: any) => {
      insights.push({
        id: `anomaly_${anomaly.metric}_${Date.now()}`,
        type: 'anomaly',
        priority: anomaly.severity === 'high' ? 'high' : 'medium',
        title: `${anomaly.metric} Anomaly Detected`,
        description: anomaly.description,
        confidence: 0.85,
        impact: anomaly.severity === 'high' ? 80 : 50,
        actionable: true,
        actions: [
          {
            type: 'investigation',
            description: 'Investigate root cause of anomaly',
            effort: 'medium',
            expectedImpact: 40
          }
        ],
        data: {
          metric: anomaly.metric,
          actualValue: anomaly.value,
          expectedValue: anomaly.expectedValue,
          anomalyScore: anomaly.anomalyScore
        },
        timestamp: anomaly.timestamp,
        category: 'monitoring'
      });
    });
  } catch (error) {
    console.error('Error generating anomaly insights:', error);
  }

  return insights;
}

// Specialized insight generators for POST requests
async function generateRevenueOptimizationInsights(mlService: any, parameters: any): Promise<AutoInsight[]> {
  return [
    {
      id: 'pricing_optimization',
      type: 'opportunity',
      priority: 'high',
      title: 'Pricing Tier Optimization Opportunity',
      description: 'Analysis suggests introducing a mid-tier plan could capture 34% more revenue from current free users.',
      confidence: 0.82,
      impact: 90,
      actionable: true,
      actions: [
        {
          type: 'pricing_strategy',
          description: 'Design and test new mid-tier pricing plan',
          effort: 'high',
          expectedImpact: 85
        }
      ],
      data: {
        estimatedRevenue: 145000,
        targetUsers: 890,
        conversionRate: 0.34
      },
      timestamp: new Date(),
      category: 'pricing'
    }
  ];
}

async function generateChurnPreventionInsights(mlService: any, parameters: any): Promise<AutoInsight[]> {
  return [
    {
      id: 'proactive_churn_prevention',
      type: 'recommendation',
      priority: 'high',
      title: 'Proactive Churn Prevention Strategy',
      description: 'Implement early warning system to identify at-risk users 30 days before typical churn.',
      confidence: 0.89,
      impact: 85,
      actionable: true,
      actions: [
        {
          type: 'automation',
          description: 'Set up automated alerts for churn risk indicators',
          effort: 'medium',
          expectedImpact: 70
        }
      ],
      data: {
        potentialSavings: 98000,
        usersAtRisk: 67
      },
      timestamp: new Date(),
      category: 'retention'
    }
  ];
}

async function generateFeatureAdoptionInsights(mlService: any, parameters: any): Promise<AutoInsight[]> {
  return [
    {
      id: 'feature_adoption_correlation',
      type: 'trend',
      priority: 'medium',
      title: 'Feature Adoption Correlation Discovered',
      description: 'Users who adopt team collaboration features are 3.2x more likely to upgrade and have 45% lower churn.',
      confidence: 0.91,
      impact: 75,
      actionable: true,
      actions: [
        {
          type: 'onboarding_optimization',
          description: 'Prioritize team features in user onboarding',
          effort: 'medium',
          expectedImpact: 65
        }
      ],
      data: {
        correlationStrength: 3.2,
        churnReduction: 45,
        upgradeIncrease: 67
      },
      timestamp: new Date(),
      category: 'product'
    }
  ];
}

async function generateUserEngagementInsights(mlService: any, parameters: any): Promise<AutoInsight[]> {
  return [
    {
      id: 'engagement_optimization',
      type: 'opportunity',
      priority: 'medium',
      title: 'Engagement Optimization Opportunity',
      description: 'Users with weekly usage patterns show 2.8x higher lifetime value than sporadic users.',
      confidence: 0.86,
      impact: 70,
      actionable: true,
      actions: [
        {
          type: 'habit_formation',
          description: 'Create weekly engagement campaigns',
          effort: 'medium',
          expectedImpact: 60
        }
      ],
      data: {
        ltvMultiplier: 2.8,
        weeklyUsers: 1450,
        sporadicUsers: 890
      },
      timestamp: new Date(),
      category: 'engagement'
    }
  ];
}

async function generateMarketOpportunityInsights(mlService: any, parameters: any): Promise<AutoInsight[]> {
  return [
    {
      id: 'market_expansion',
      type: 'opportunity',
      priority: 'high',
      title: 'Market Expansion Opportunity',
      description: 'Analysis of user data suggests strong potential in healthcare and fintech verticals.',
      confidence: 0.74,
      impact: 95,
      actionable: true,
      actions: [
        {
          type: 'market_research',
          description: 'Conduct targeted market research in healthcare and fintech',
          effort: 'high',
          expectedImpact: 80
        }
      ],
      data: {
        targetMarkets: ['Healthcare', 'Fintech'],
        estimatedMarketSize: 2500000,
        confidenceLevel: 74
      },
      timestamp: new Date(),
      category: 'growth'
    }
  ];
}

async function generateOperationalEfficiencyInsights(mlService: any, parameters: any): Promise<AutoInsight[]> {
  return [
    {
      id: 'automation_opportunity',
      type: 'recommendation',
      priority: 'medium',
      title: 'Support Automation Opportunity',
      description: '67% of support tickets could be resolved through improved self-service documentation.',
      confidence: 0.79,
      impact: 65,
      actionable: true,
      actions: [
        {
          type: 'documentation_improvement',
          description: 'Create interactive help documentation',
          effort: 'medium',
          expectedImpact: 55
        }
      ],
      data: {
        automationPotential: 67,
        ticketReduction: 234,
        costSavings: 34000
      },
      timestamp: new Date(),
      category: 'operations'
    }
  ];
}