'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  AlertTriangle,
  Eye,
  Target,
  Zap,
  Brain,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Lightbulb,
  Search,
  Star
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  Treemap,
  Sankey,
  FunnelChart,
  Funnel
} from 'recharts';

interface CohortData {
  cohortId: string;
  cohortPeriod: string;
  userCount: number;
  retentionRates: number[];
  revenueByMonth: number[];
  avgLTV: number;
  churnRate: number;
  predictions: {
    futureRetention: number[];
    futureRevenue: number[];
  };
}

interface AnomalyData {
  id: string;
  metric: string;
  value: number;
  expectedValue: number;
  anomalyScore: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
  context: {
    possibleCauses: string[];
    relatedMetrics: string[];
    historicalComparison: number;
  };
}

interface RecommendationData {
  id: string;
  type: 'feature' | 'action' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: number;
  effort: 'low' | 'medium' | 'high';
  category: string;
  targetUsers: number;
  expectedOutcome: {
    metric: string;
    improvement: number;
    timeframe: string;
  };
  implementation: {
    steps: string[];
    resources: string[];
    timeline: string;
  };
}

interface AdvancedInsight {
  id: string;
  type: 'correlation' | 'pattern' | 'trend' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  significance: number;
  data: any;
  visualizationType: 'chart' | 'heatmap' | 'network' | 'funnel';
  actionable: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#ffc658', '#8dd1e1'];

const AdvancedAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'cohorts' | 'anomalies' | 'recommendations' | 'insights'>('cohorts');
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | '1y'>('90d');
  
  // Data state
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([]);
  const [insights, setInsights] = useState<AdvancedInsight[]>([]);

  useEffect(() => {
    loadAdvancedAnalytics();
  }, [timeframe]);

  const loadAdvancedAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCohortAnalysis(),
        loadAnomalyDetection(),
        loadRecommendations(),
        loadAdvancedInsights()
      ]);
    } catch (error) {
      console.error('Error loading advanced analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCohortAnalysis = async () => {
    // Mock cohort data - replace with actual API call
    const cohorts: CohortData[] = Array.from({ length: 12 }, (_, i) => {
      const cohortDate = new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000);
      const baseRetention = 1 - (i * 0.05); // Older cohorts have lower retention
      
      return {
        cohortId: `cohort_${i}`,
        cohortPeriod: cohortDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        userCount: 100 + Math.floor(Math.random() * 200),
        retentionRates: Array.from({ length: 12 }, (_, month) => 
          Math.max(0.1, baseRetention * Math.exp(-month * 0.1) + (Math.random() - 0.5) * 0.1)
        ),
        revenueByMonth: Array.from({ length: 12 }, (_, month) => 
          (1000 + Math.random() * 2000) * Math.exp(-month * 0.05)
        ),
        avgLTV: 1500 + Math.random() * 2000,
        churnRate: 0.05 + Math.random() * 0.1,
        predictions: {
          futureRetention: Array.from({ length: 6 }, (_, month) => 
            Math.max(0.05, baseRetention * Math.exp(-(12 + month) * 0.1))
          ),
          futureRevenue: Array.from({ length: 6 }, (_, month) => 
            (500 + Math.random() * 1000) * Math.exp(-(12 + month) * 0.05)
          )
        }
      };
    });

    setCohortData(cohorts);
  };

  const loadAnomalyDetection = async () => {
    const anomalyList: AnomalyData[] = [
      {
        id: 'revenue_spike_1',
        metric: 'Daily Revenue',
        value: 15420,
        expectedValue: 12300,
        anomalyScore: 2.8,
        severity: 'medium',
        description: 'Revenue 25% higher than expected for this day of week',
        timestamp: new Date('2024-06-26T10:00:00Z'),
        context: {
          possibleCauses: ['Marketing campaign', 'Product launch', 'Seasonal effect'],
          relatedMetrics: ['New signups', 'Conversion rate', 'Average order value'],
          historicalComparison: 1.25
        }
      },
      {
        id: 'usage_drop_1',
        metric: 'API Usage',
        value: 89000,
        expectedValue: 125000,
        anomalyScore: 3.2,
        severity: 'high',
        description: 'API usage 29% below expected levels',
        timestamp: new Date('2024-06-25T14:30:00Z'),
        context: {
          possibleCauses: ['Service outage', 'Client integration issues', 'Weekend effect'],
          relatedMetrics: ['Error rates', 'Response times', 'Active users'],
          historicalComparison: 0.71
        }
      },
      {
        id: 'churn_increase_1',
        metric: 'Churn Rate',
        value: 8.2,
        expectedValue: 5.8,
        anomalyScore: 2.1,
        severity: 'medium',
        description: 'Churn rate increased by 41% compared to baseline',
        timestamp: new Date('2024-06-24T09:15:00Z'),
        context: {
          possibleCauses: ['Competitor pricing', 'Feature changes', 'Support issues'],
          relatedMetrics: ['Customer satisfaction', 'Support tickets', 'Feature usage'],
          historicalComparison: 1.41
        }
      }
    ];

    setAnomalies(anomalyList);
  };

  const loadRecommendations = async () => {
    const recommendationList: RecommendationData[] = [
      {
        id: 'feature_rec_1',
        type: 'feature',
        title: 'Implement Progressive Onboarding',
        description: 'Users who complete 3+ onboarding steps have 2.5x higher retention. Implement progressive disclosure to improve completion rates.',
        confidence: 0.87,
        impact: 85,
        effort: 'medium',
        category: 'User Experience',
        targetUsers: 1200,
        expectedOutcome: {
          metric: 'Retention Rate',
          improvement: 23,
          timeframe: '60 days'
        },
        implementation: {
          steps: [
            'Design progressive onboarding flow',
            'Implement step-by-step guidance',
            'Add progress indicators',
            'Test with user groups',
            'Deploy gradually'
          ],
          resources: ['UX Designer', 'Frontend Developer', 'Product Manager'],
          timeline: '6-8 weeks'
        }
      },
      {
        id: 'action_rec_1',
        type: 'action',
        title: 'Launch Re-engagement Campaign',
        description: 'Target 340 users who showed high initial engagement but have been inactive for 14+ days.',
        confidence: 0.73,
        impact: 65,
        effort: 'low',
        category: 'Marketing',
        targetUsers: 340,
        expectedOutcome: {
          metric: 'Reactivation Rate',
          improvement: 28,
          timeframe: '14 days'
        },
        implementation: {
          steps: [
            'Segment inactive users',
            'Create personalized email templates',
            'Set up automation workflow',
            'Launch campaign',
            'Monitor results'
          ],
          resources: ['Marketing Manager', 'Email Designer'],
          timeline: '2-3 weeks'
        }
      },
      {
        id: 'optimization_rec_1',
        type: 'optimization',
        title: 'Optimize API Response Times',
        description: 'Users experiencing >500ms response times are 40% more likely to churn. Optimize slow endpoints.',
        confidence: 0.92,
        impact: 78,
        effort: 'high',
        category: 'Performance',
        targetUsers: 890,
        expectedOutcome: {
          metric: 'API Response Time',
          improvement: 35,
          timeframe: '30 days'
        },
        implementation: {
          steps: [
            'Identify slow endpoints',
            'Optimize database queries',
            'Implement caching',
            'Add monitoring',
            'Deploy optimizations'
          ],
          resources: ['Backend Developer', 'DevOps Engineer', 'Database Admin'],
          timeline: '8-10 weeks'
        }
      }
    ];

    setRecommendations(recommendationList);
  };

  const loadAdvancedInsights = async () => {
    const insightList: AdvancedInsight[] = [
      {
        id: 'correlation_1',
        type: 'correlation',
        title: 'Team Size vs. Feature Adoption Correlation',
        description: 'Strong positive correlation (r=0.78) between team size and advanced feature adoption rates.',
        confidence: 0.91,
        significance: 0.78,
        data: {
          correlation: 0.78,
          sampleSize: 1240,
          pValue: 0.001
        },
        visualizationType: 'chart',
        actionable: true
      },
      {
        id: 'pattern_1',
        type: 'pattern',
        title: 'Weekly Usage Pattern Discovery',
        description: 'Identified distinct usage patterns: Work-focused (Mon-Fri), Weekend warriors (Sat-Sun), and Always-on users.',
        confidence: 0.84,
        significance: 0.72,
        data: {
          patterns: {
            'Work-focused': 67,
            'Weekend warriors': 18,
            'Always-on': 15
          }
        },
        visualizationType: 'chart',
        actionable: true
      },
      {
        id: 'trend_1',
        type: 'trend',
        title: 'Mobile Usage Growth Trend',
        description: 'Mobile API usage growing 12% month-over-month, indicating shift in user behavior.',
        confidence: 0.89,
        significance: 0.68,
        data: {
          growthRate: 0.12,
          timeSpan: '6 months',
          mobileShare: 0.34
        },
        visualizationType: 'chart',
        actionable: true
      },
      {
        id: 'opportunity_1',
        type: 'opportunity',
        title: 'Enterprise Expansion Opportunity',
        description: 'Users with 10+ team members show 3.2x higher LTV and could benefit from enterprise features.',
        confidence: 0.76,
        significance: 0.85,
        data: {
          ltvMultiplier: 3.2,
          targetUsers: 156,
          potentialRevenue: 234000
        },
        visualizationType: 'funnel',
        actionable: true
      }
    ];

    setInsights(insightList);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600 mt-1">Deep insights, anomaly detection, and AI-powered recommendations</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button onClick={loadAdvancedAnalytics} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'cohorts', label: 'Cohort Analysis', icon: Users },
          { key: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle },
          { key: 'recommendations', label: 'Recommendations', icon: Lightbulb },
          { key: 'insights', label: 'Advanced Insights', icon: Brain }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveView(key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeView === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Cohort Analysis */}
      {activeView === 'cohorts' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Retention Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Cohort</th>
                      <th className="text-center p-2">Size</th>
                      {Array.from({ length: 12 }, (_, i) => (
                        <th key={i} className="text-center p-2">M{i}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.slice(0, 8).map((cohort, index) => (
                      <tr key={cohort.cohortId} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{cohort.cohortPeriod}</td>
                        <td className="text-center p-2">{cohort.userCount}</td>
                        {cohort.retentionRates.map((rate, monthIndex) => (
                          <td key={monthIndex} className="text-center p-2">
                            <div 
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                rate > 0.7 ? 'bg-green-100 text-green-800' :
                                rate > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                                rate > 0.3 ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {formatPercent(rate)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cohort LTV Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cohortData.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cohortPeriod" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Average LTV']} />
                    <Bar dataKey="avgLTV" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Cohort Month</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cohortData[0]?.revenueByMonth.map((revenue, index) => ({
                    month: `M${index}`,
                    revenue
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#00C49F" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Anomaly Detection */}
      {activeView === 'anomalies' && (
        <div className="space-y-6">
          {anomalies.map((anomaly) => (
            <Card key={anomaly.id} className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <div>
                      <CardTitle className="text-lg">{anomaly.metric} Anomaly</CardTitle>
                      <p className="text-gray-600">{anomaly.description}</p>
                    </div>
                  </div>
                  <Badge className={getSeverityColor(anomaly.severity)}>
                    {anomaly.severity} severity
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Anomaly Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Actual Value:</span>
                        <span className="font-medium">{anomaly.value.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Value:</span>
                        <span className="font-medium">{anomaly.expectedValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Anomaly Score:</span>
                        <span className="font-medium">{anomaly.anomalyScore.toFixed(1)}σ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Detected:</span>
                        <span className="font-medium">{anomaly.timestamp.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Possible Causes</h4>
                    <div className="space-y-1">
                      {anomaly.context.possibleCauses.map((cause, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          <span>{cause}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Related Metrics</h4>
                    <div className="space-y-1">
                      {anomaly.context.relatedMetrics.map((metric, index) => (
                        <Badge key={index} variant="outline" className="mr-1 mb-1 text-xs">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3 text-sm">
                      <span className="text-gray-600">Historical Comparison: </span>
                      <span className={`font-medium ${
                        anomaly.context.historicalComparison > 1 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {((anomaly.context.historicalComparison - 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {activeView === 'recommendations' && (
        <div className="space-y-6">
          {recommendations.map((rec) => (
            <Card key={rec.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>{rec.title}</CardTitle>
                      <p className="text-gray-600">{rec.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getEffortColor(rec.effort)}>
                      {rec.effort} effort
                    </Badge>
                    <Badge variant="outline">
                      {rec.confidence > 0.8 ? 'High' : rec.confidence > 0.6 ? 'Medium' : 'Low'} confidence
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Expected Impact</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Impact Score:</span>
                          <span className="font-medium">{rec.impact}/100</span>
                        </div>
                        <Progress value={rec.impact} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Confidence:</span>
                          <span className="font-medium">{formatPercent(rec.confidence)}</span>
                        </div>
                        <Progress value={rec.confidence * 100} className="h-2" />
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm font-medium text-green-800">
                          {rec.expectedOutcome.improvement}% improvement in {rec.expectedOutcome.metric}
                        </div>
                        <div className="text-xs text-green-600">
                          Expected in {rec.expectedOutcome.timeframe}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Implementation Plan</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Timeline:</span>
                        <div className="font-medium">{rec.implementation.timeline}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Required Resources:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.implementation.resources.map((resource, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {resource}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Target Users:</span>
                        <div className="font-medium">{rec.targetUsers.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Implementation Steps</h4>
                    <div className="space-y-2">
                      {rec.implementation.steps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-2 text-sm">
                          <div className="w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                            {index + 1}
                          </div>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Advanced Insights */}
      {activeView === 'insights' && (
        <div className="space-y-6">
          {insights.map((insight) => (
            <Card key={insight.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Brain className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>{insight.title}</CardTitle>
                      <p className="text-gray-600">{insight.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-purple-100 text-purple-800 capitalize">
                      {insight.type}
                    </Badge>
                    {insight.actionable && (
                      <Badge className="bg-green-100 text-green-800">
                        Actionable
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Statistical Metrics</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Confidence:</span>
                          <span className="font-medium">{formatPercent(insight.confidence)}</span>
                        </div>
                        <Progress value={insight.confidence * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Statistical Significance:</span>
                          <span className="font-medium">{formatPercent(insight.significance)}</span>
                        </div>
                        <Progress value={insight.significance * 100} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Key Data Points</h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(insight.data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="font-medium">
                            {typeof value === 'number' 
                              ? key.includes('Rate') || key.includes('Share') 
                                ? formatPercent(value)
                                : key.includes('Revenue') || key.includes('Value')
                                ? formatCurrency(value)
                                : value.toLocaleString()
                              : typeof value === 'object'
                              ? Object.keys(value).length + ' categories'
                              : String(value)
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {insight.type === 'pattern' && insight.data.patterns && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Pattern Distribution</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={Object.entries(insight.data.patterns).map(([name, value]) => ({ name, value }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884D8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;