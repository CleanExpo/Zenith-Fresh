'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTab 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle,
  Target,
  Brain,
  Zap,
  Activity,
  Calendar,
  Filter,
  Download,
  Settings,
  RefreshCw,
  Eye,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';

interface PredictionMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  timeframe: string;
}

interface ChurnRiskUser {
  id: string;
  name: string;
  email: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  churnProbability: number;
  timeToChurn: number;
  actions: string[];
  ltv: number;
}

interface RevenueScenario {
  name: string;
  value: number;
  probability: number;
  factors: string[];
}

interface FeatureInsight {
  feature: string;
  adoptionRate: number;
  timeToAdopt: number;
  impact: number;
  recommendation: string;
}

interface UserSegment {
  id: string;
  name: string;
  size: number;
  ltv: number;
  churnRate: number;
  characteristics: string[];
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const PredictiveAnalyticsDashboard: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Data state
  const [metrics, setMetrics] = useState<PredictionMetric[]>([]);
  const [churnRisks, setChurnRisks] = useState<ChurnRiskUser[]>([]);
  const [revenueForecasts, setRevenueForecasts] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<RevenueScenario[]>([]);
  const [featureInsights, setFeatureInsights] = useState<FeatureInsight[]>([]);
  const [userSegments, setUserSegments] = useState<UserSegment[]>([]);
  const [cohortData, setCohortData] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadPredictiveData();
  }, [selectedTimeframe, selectedSegment]);

  const loadPredictiveData = async () => {
    setLoading(true);
    try {
      // Simulate API calls (replace with actual API calls)
      await Promise.all([
        loadMetrics(),
        loadChurnRisks(),
        loadRevenueForecasts(),
        loadFeatureInsights(),
        loadUserSegments(),
        loadCohortData(),
        loadAnomalies()
      ]);
    } catch (error) {
      console.error('Error loading predictive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    // Mock data - replace with actual API call
    setMetrics([
      {
        id: 'churn_rate',
        name: 'Predicted Churn Rate',
        value: 5.2,
        change: -0.8,
        confidence: 87,
        trend: 'down',
        timeframe: '30 days'
      },
      {
        id: 'revenue_forecast',
        name: 'Revenue Forecast',
        value: 125000,
        change: 12.5,
        confidence: 92,
        trend: 'up',
        timeframe: '90 days'
      },
      {
        id: 'avg_ltv',
        name: 'Average LTV',
        value: 2840,
        change: 8.3,
        confidence: 89,
        trend: 'up',
        timeframe: '12 months'
      },
      {
        id: 'feature_adoption',
        name: 'Feature Adoption Rate',
        value: 68,
        change: 15.2,
        confidence: 85,
        trend: 'up',
        timeframe: '60 days'
      }
    ]);
  };

  const loadChurnRisks = async () => {
    // Mock data - replace with actual API call
    setChurnRisks([
      {
        id: '1',
        name: 'John Smith',
        email: 'john@company.com',
        riskLevel: 'critical',
        churnProbability: 85,
        timeToChurn: 7,
        actions: ['Send retention email', 'Schedule call', 'Offer discount'],
        ltv: 5200
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@startup.io',
        riskLevel: 'high',
        churnProbability: 72,
        timeToChurn: 14,
        actions: ['Feature onboarding', 'Usage tips', 'Check-in call'],
        ltv: 3800
      },
      {
        id: '3',
        name: 'Mike Davis',
        email: 'mike@enterprise.com',
        riskLevel: 'medium',
        churnProbability: 45,
        timeToChurn: 30,
        actions: ['Share case studies', 'Product demo'],
        ltv: 12500
      }
    ]);
  };

  const loadRevenueForecasts = async () => {
    // Mock forecast data
    const forecastData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
      predicted: 100000 + Math.random() * 50000,
      conservative: 80000 + Math.random() * 30000,
      optimistic: 120000 + Math.random() * 60000,
      actual: i < 6 ? 95000 + Math.random() * 40000 : null
    }));
    
    setRevenueForecasts(forecastData);

    setScenarios([
      {
        name: 'Conservative',
        value: 1200000,
        probability: 90,
        factors: ['Current retention rates', 'Historical seasonality']
      },
      {
        name: 'Expected',
        value: 1450000,
        probability: 70,
        factors: ['Growth trends', 'Feature adoption', 'Market expansion']
      },
      {
        name: 'Optimistic',
        value: 1750000,
        probability: 40,
        factors: ['All targets hit', 'Premium tier growth', 'New market entry']
      }
    ]);
  };

  const loadFeatureInsights = async () => {
    setFeatureInsights([
      {
        feature: 'Advanced Analytics',
        adoptionRate: 34,
        timeToAdopt: 21,
        impact: 25,
        recommendation: 'Create guided tour for new users'
      },
      {
        feature: 'Team Collaboration',
        adoptionRate: 67,
        timeToAdopt: 14,
        impact: 40,
        recommendation: 'Promote in onboarding flow'
      },
      {
        feature: 'API Integration',
        adoptionRate: 23,
        timeToAdopt: 45,
        impact: 60,
        recommendation: 'Improve documentation and examples'
      },
      {
        feature: 'Custom Dashboards',
        adoptionRate: 45,
        timeToAdopt: 28,
        impact: 35,
        recommendation: 'Add template gallery'
      }
    ]);
  };

  const loadUserSegments = async () => {
    setUserSegments([
      {
        id: 'power_users',
        name: 'Power Users',
        size: 234,
        ltv: 4500,
        churnRate: 2.1,
        characteristics: ['High engagement', 'Multiple projects', 'API usage'],
        color: COLORS[0]
      },
      {
        id: 'standard_users',
        name: 'Standard Users',
        size: 867,
        ltv: 1800,
        churnRate: 5.8,
        characteristics: ['Regular usage', 'Single project', 'Web interface'],
        color: COLORS[1]
      },
      {
        id: 'trial_users',
        name: 'Trial Users',
        size: 445,
        ltv: 0,
        churnRate: 65.2,
        characteristics: ['New users', 'Exploring features', 'No payment'],
        color: COLORS[2]
      },
      {
        id: 'at_risk',
        name: 'At Risk',
        size: 123,
        ltv: 2200,
        churnRate: 45.6,
        characteristics: ['Declining usage', 'Support tickets', 'Payment issues'],
        color: COLORS[3]
      }
    ]);
  };

  const loadCohortData = async () => {
    // Mock cohort retention data
    const cohorts = Array.from({ length: 12 }, (_, i) => {
      const cohortName = new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return {
        cohort: cohortName,
        month0: 100,
        month1: 85 - i * 2,
        month2: 70 - i * 3,
        month3: 60 - i * 3,
        month6: 45 - i * 4,
        month12: 30 - i * 5
      };
    });
    setCohortData(cohorts);
  };

  const loadAnomalies = async () => {
    setAnomalies([
      {
        id: '1',
        metric: 'Revenue',
        severity: 'high',
        description: 'Revenue 23% higher than expected',
        timestamp: new Date(),
        value: 145000,
        expected: 118000
      },
      {
        id: '2',
        metric: 'Churn Rate',
        severity: 'medium',
        description: 'Churn rate increased by 1.2%',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        value: 6.4,
        expected: 5.2
      }
    ]);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadPredictiveData();
    setRefreshing(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading predictive analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Predictive Analytics</h1>
          <p className="text-gray-600 mt-1">AI-powered insights and forecasting</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.id} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.name}
                </CardTitle>
                <div className="flex items-center space-x-1">
                  {metric.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : metric.trend === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : (
                    <Activity className="w-4 h-4 text-gray-600" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">
                  {metric.id === 'revenue_forecast' || metric.id === 'avg_ltv' 
                    ? formatCurrency(metric.value)
                    : metric.id === 'churn_rate' || metric.id === 'feature_adoption'
                    ? formatPercent(metric.value)
                    : metric.value.toLocaleString()
                  }
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={`flex items-center ${
                    metric.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                  <span className="text-gray-500">{metric.confidence}% confidence</span>
                </div>
                <Progress value={metric.confidence} className="h-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTab value="overview">Overview</TabsTab>
          <TabsTab value="churn">Churn Risk</TabsTab>
          <TabsTab value="revenue">Revenue</TabsTab>
          <TabsTab value="features">Features</TabsTab>
          <TabsTab value="segments">Segments</TabsTab>
          <TabsTab value="cohorts">Cohorts</TabsTab>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Anomalies Detection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span>Anomaly Detection</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {anomalies.length > 0 ? (
                  <div className="space-y-3">
                    {anomalies.map((anomaly) => (
                      <div key={anomaly.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={`${
                            anomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
                            anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {anomaly.severity}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {anomaly.timestamp.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{anomaly.description}</p>
                        <div className="text-xs text-gray-600 mt-1">
                          Actual: {anomaly.value} | Expected: {anomaly.expected}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No anomalies detected</p>
                )}
              </CardContent>
            </Card>

            {/* Model Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span>Model Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Churn Prediction</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">87% accuracy</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Revenue Forecast</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">92% accuracy</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">LTV Prediction</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">89% accuracy</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '89%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Feature Adoption</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">85% accuracy</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Churn Risk Tab */}
        <TabsContent value="churn" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-red-600" />
                <span>High-Risk Users</span>
              </CardTitle>
              <CardDescription>
                Users with elevated churn probability requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {churnRisks.map((user) => (
                  <div key={user.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{user.name}</h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getRiskColor(user.riskLevel)}>
                          {user.riskLevel}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          LTV: {formatCurrency(user.ltv)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-sm text-gray-600">Churn Probability</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-600 h-2 rounded-full" 
                              style={{ width: `${user.churnProbability}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{user.churnProbability}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Time to Churn</span>
                        <p className="text-sm font-medium mt-1">{user.timeToChurn} days</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-gray-600">Recommended Actions:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {user.actions.map((action, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Forecast</CardTitle>
                  <CardDescription>12-month revenue prediction with confidence intervals</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={revenueForecasts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line type="monotone" dataKey="actual" stroke="#0088FE" strokeWidth={2} name="Actual" />
                      <Line type="monotone" dataKey="predicted" stroke="#00C49F" strokeWidth={2} name="Predicted" />
                      <Line type="monotone" dataKey="conservative" stroke="#FFBB28" strokeDasharray="5 5" name="Conservative" />
                      <Line type="monotone" dataKey="optimistic" stroke="#FF8042" strokeDasharray="5 5" name="Optimistic" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Scenarios</CardTitle>
                  <CardDescription>Annual revenue projections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scenarios.map((scenario, index) => (
                      <div key={scenario.name} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{scenario.name}</span>
                          <span className="text-sm text-gray-600">{scenario.probability}% likely</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 mb-2">
                          {formatCurrency(scenario.value)}
                        </div>
                        <div className="text-xs text-gray-600">
                          Key factors: {scenario.factors.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                <span>Feature Adoption Insights</span>
              </CardTitle>
              <CardDescription>
                Predictive insights on feature adoption and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featureInsights.map((insight) => (
                  <div key={insight.feature} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium mb-3">{insight.feature}</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Adoption Rate</span>
                        <span className="font-medium">{insight.adoptionRate}%</span>
                      </div>
                      <Progress value={insight.adoptionRate} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg. Time to Adopt</span>
                        <span className="font-medium">{insight.timeToAdopt} days</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Business Impact</span>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < insight.impact / 20 ? 'bg-green-600' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="text-sm text-blue-800">{insight.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Segments Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userSegments}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      dataKey="size"
                      nameKey="name"
                    >
                      {userSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segment Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userSegments.map((segment) => (
                    <div key={segment.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: segment.color }}
                          />
                          <span className="font-medium">{segment.name}</span>
                        </div>
                        <span className="text-sm text-gray-600">{segment.size} users</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Avg. LTV:</span>
                          <span className="font-medium ml-2">{formatCurrency(segment.ltv)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Churn Rate:</span>
                          <span className="font-medium ml-2">{formatPercent(segment.churnRate)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <span className="text-xs text-gray-600">Characteristics:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {segment.characteristics.map((char, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {char}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cohorts Tab */}
        <TabsContent value="cohorts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Retention Analysis</CardTitle>
              <CardDescription>User retention rates by signup cohort</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Cohort</th>
                      <th className="text-center p-2">Month 0</th>
                      <th className="text-center p-2">Month 1</th>
                      <th className="text-center p-2">Month 2</th>
                      <th className="text-center p-2">Month 3</th>
                      <th className="text-center p-2">Month 6</th>
                      <th className="text-center p-2">Month 12</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.map((cohort, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{cohort.cohort}</td>
                        <td className="text-center p-2">
                          <div className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {cohort.month0}%
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <div 
                            className={`px-2 py-1 rounded text-xs ${
                              cohort.month1 > 70 ? 'bg-green-100 text-green-800' :
                              cohort.month1 > 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {cohort.month1}%
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <div 
                            className={`px-2 py-1 rounded text-xs ${
                              cohort.month2 > 60 ? 'bg-green-100 text-green-800' :
                              cohort.month2 > 40 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {cohort.month2}%
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <div 
                            className={`px-2 py-1 rounded text-xs ${
                              cohort.month3 > 50 ? 'bg-green-100 text-green-800' :
                              cohort.month3 > 30 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {cohort.month3}%
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <div 
                            className={`px-2 py-1 rounded text-xs ${
                              cohort.month6 > 40 ? 'bg-green-100 text-green-800' :
                              cohort.month6 > 20 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {cohort.month6}%
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <div 
                            className={`px-2 py-1 rounded text-xs ${
                              cohort.month12 > 30 ? 'bg-green-100 text-green-800' :
                              cohort.month12 > 15 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {cohort.month12}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveAnalyticsDashboard;