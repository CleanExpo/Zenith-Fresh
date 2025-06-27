'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Users, 
  TrendingDown, 
  Clock, 
  DollarSign,
  Mail,
  Phone,
  Gift,
  FileText,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

interface ChurnRiskUser {
  id: string;
  name: string;
  email: string;
  tier: string;
  signupDate: Date;
  lastActivity: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  churnProbability: number;
  timeToChurn: number;
  lifetimeValue: number;
  monthlyRevenue: number;
  usageMetrics: {
    dailyUsage: number;
    projectCount: number;
    apiCalls: number;
    teamSize: number;
  };
  behaviorFactors: {
    engagementScore: number;
    featureAdoption: number;
    supportTickets: number;
    paymentIssues: number;
  };
  recommendedActions: Array<{
    type: 'email' | 'call' | 'discount' | 'feature' | 'support';
    action: string;
    priority: 'high' | 'medium' | 'low';
    impact: number;
  }>;
  predictedOutcome: {
    retentionProbability: number;
    revenueAtRisk: number;
    confidenceLevel: number;
  };
}

interface ChurnTrend {
  date: string;
  churnRate: number;
  predictedChurn: number;
  atRiskUsers: number;
  prevented: number;
}

interface RiskSegment {
  level: string;
  count: number;
  percentage: number;
  totalLTV: number;
  avgTimeToChurn: number;
  color: string;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#DC2626'];

const ChurnRiskAnalyzer: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ChurnRiskUser[]>([]);
  const [trends, setTrends] = useState<ChurnTrend[]>([]);
  const [segments, setSegments] = useState<RiskSegment[]>([]);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('churnProbability');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadChurnData();
  }, []);

  const loadChurnData = async () => {
    setLoading(true);
    try {
      // Simulate API calls
      await Promise.all([
        loadChurnUsers(),
        loadChurnTrends(),
        loadRiskSegments()
      ]);
    } catch (error) {
      console.error('Error loading churn data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChurnUsers = async () => {
    // Mock data - replace with actual API call
    const mockUsers: ChurnRiskUser[] = [
      {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@company.com',
        tier: 'Pro',
        signupDate: new Date('2024-01-15'),
        lastActivity: new Date('2024-06-20'),
        riskLevel: 'critical',
        churnProbability: 87,
        timeToChurn: 5,
        lifetimeValue: 5240,
        monthlyRevenue: 99,
        usageMetrics: {
          dailyUsage: 0.5,
          projectCount: 1,
          apiCalls: 45,
          teamSize: 1
        },
        behaviorFactors: {
          engagementScore: 2.1,
          featureAdoption: 25,
          supportTickets: 3,
          paymentIssues: 1
        },
        recommendedActions: [
          { type: 'call', action: 'Schedule urgent retention call', priority: 'high', impact: 75 },
          { type: 'discount', action: 'Offer 50% discount for 3 months', priority: 'high', impact: 60 },
          { type: 'support', action: 'Provide dedicated support', priority: 'medium', impact: 45 }
        ],
        predictedOutcome: {
          retentionProbability: 35,
          revenueAtRisk: 1188,
          confidenceLevel: 89
        }
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@startup.io',
        tier: 'Enterprise',
        signupDate: new Date('2023-11-10'),
        lastActivity: new Date('2024-06-25'),
        riskLevel: 'high',
        churnProbability: 72,
        timeToChurn: 14,
        lifetimeValue: 12800,
        monthlyRevenue: 299,
        usageMetrics: {
          dailyUsage: 2.3,
          projectCount: 5,
          apiCalls: 234,
          teamSize: 8
        },
        behaviorFactors: {
          engagementScore: 3.8,
          featureAdoption: 45,
          supportTickets: 2,
          paymentIssues: 0
        },
        recommendedActions: [
          { type: 'feature', action: 'Demo advanced features', priority: 'high', impact: 65 },
          { type: 'email', action: 'Send success stories', priority: 'medium', impact: 40 },
          { type: 'call', action: 'Business review meeting', priority: 'medium', impact: 55 }
        ],
        predictedOutcome: {
          retentionProbability: 48,
          revenueAtRisk: 3588,
          confidenceLevel: 82
        }
      },
      {
        id: '3',
        name: 'Mike Davis',
        email: 'mike@techcorp.com',
        tier: 'Pro',
        signupDate: new Date('2024-02-28'),
        lastActivity: new Date('2024-06-26'),
        riskLevel: 'medium',
        churnProbability: 45,
        timeToChurn: 30,
        lifetimeValue: 3200,
        monthlyRevenue: 99,
        usageMetrics: {
          dailyUsage: 4.2,
          projectCount: 3,
          apiCalls: 156,
          teamSize: 3
        },
        behaviorFactors: {
          engagementScore: 6.2,
          featureAdoption: 67,
          supportTickets: 1,
          paymentIssues: 0
        },
        recommendedActions: [
          { type: 'email', action: 'Send usage optimization tips', priority: 'medium', impact: 35 },
          { type: 'feature', action: 'Introduce team collaboration features', priority: 'low', impact: 25 }
        ],
        predictedOutcome: {
          retentionProbability: 72,
          revenueAtRisk: 891,
          confidenceLevel: 76
        }
      }
    ];
    
    setUsers(mockUsers);
  };

  const loadChurnTrends = async () => {
    // Mock trend data
    const mockTrends: ChurnTrend[] = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
      return {
        date: date.toISOString().split('T')[0],
        churnRate: 5 + Math.random() * 3,
        predictedChurn: 5.5 + Math.random() * 2.5,
        atRiskUsers: 15 + Math.floor(Math.random() * 10),
        prevented: Math.floor(Math.random() * 5)
      };
    });
    
    setTrends(mockTrends);
  };

  const loadRiskSegments = async () => {
    setSegments([
      { level: 'Low', count: 1456, percentage: 82.1, totalLTV: 2840000, avgTimeToChurn: 90, color: COLORS[0] },
      { level: 'Medium', count: 234, percentage: 13.2, totalLTV: 468000, avgTimeToChurn: 45, color: COLORS[1] },
      { level: 'High', count: 67, percentage: 3.8, totalLTV: 134000, avgTimeToChurn: 20, color: COLORS[2] },
      { level: 'Critical', count: 16, percentage: 0.9, totalLTV: 32000, avgTimeToChurn: 7, color: COLORS[3] }
    ]);
  };

  const filteredUsers = users.filter(user => {
    const riskMatch = selectedRiskLevel === 'all' || user.riskLevel === selectedRiskLevel;
    const tierMatch = selectedTier === 'all' || user.tier === selectedTier;
    return riskMatch && tierMatch;
  }).sort((a, b) => {
    const aValue = a[sortBy as keyof ChurnRiskUser] as number;
    const bValue = b[sortBy as keyof ChurnRiskUser] as number;
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'discount': return <Gift className="w-4 h-4" />;
      case 'feature': return <FileText className="w-4 h-4" />;
      case 'support': return <Users className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const executeAction = async (userId: string, actionType: string) => {
    console.log(`Executing ${actionType} for user ${userId}`);
    // Implementation would integrate with email service, CRM, etc.
  };

  const exportData = () => {
    const data = filteredUsers.map(user => ({
      name: user.name,
      email: user.email,
      riskLevel: user.riskLevel,
      churnProbability: user.churnProbability,
      timeToChurn: user.timeToChurn,
      lifetimeValue: user.lifetimeValue,
      monthlyRevenue: user.monthlyRevenue
    }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'churn-risk-analysis.csv';
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading churn risk analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Churn Risk Analyzer</h2>
          <p className="text-gray-600 mt-1">Identify and prevent customer churn with AI-powered insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={exportData} variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          <Button onClick={loadChurnData} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Critical Risk</p>
                <p className="text-2xl font-bold">{segments.find(s => s.level === 'Critical')?.count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">High Risk</p>
                <p className="text-2xl font-bold">{segments.find(s => s.level === 'High')?.count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue at Risk</p>
                <p className="text-2xl font-bold">
                  ${(segments.reduce((sum, s) => sum + s.totalLTV, 0) / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Prevented This Month</p>
                <p className="text-2xl font-bold">{trends.reduce((sum, t) => sum + t.prevented, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Churn Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={segments}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="percentage"
                  nameKey="level"
                >
                  {segments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Churn Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="churnRate" stroke="#EF4444" name="Actual Churn Rate" />
                <Line type="monotone" dataKey="predictedChurn" stroke="#F59E0B" name="Predicted Churn" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters & Sorting</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
              <select
                value={selectedRiskLevel}
                onChange={(e) => setSelectedRiskLevel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Tiers</option>
                <option value="Free">Free</option>
                <option value="Pro">Pro</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="churnProbability">Churn Probability</option>
                <option value="timeToChurn">Time to Churn</option>
                <option value="lifetimeValue">Lifetime Value</option>
                <option value="monthlyRevenue">Monthly Revenue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>At-Risk Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <p className="text-gray-600">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{user.tier}</Badge>
                        <Badge className={getRiskColor(user.riskLevel)}>
                          {user.riskLevel} risk
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">{user.churnProbability}%</div>
                    <div className="text-sm text-gray-600">churn probability</div>
                    <div className="flex items-center space-x-1 mt-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{user.timeToChurn} days</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Financial Impact</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lifetime Value:</span>
                        <span className="font-medium">${user.lifetimeValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Revenue:</span>
                        <span className="font-medium">${user.monthlyRevenue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue at Risk:</span>
                        <span className="font-medium text-red-600">
                          ${user.predictedOutcome.revenueAtRisk.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Usage Metrics</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Daily Usage:</span>
                        <span className="font-medium">{user.usageMetrics.dailyUsage}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Projects:</span>
                        <span className="font-medium">{user.usageMetrics.projectCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">API Calls:</span>
                        <span className="font-medium">{user.usageMetrics.apiCalls}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Team Size:</span>
                        <span className="font-medium">{user.usageMetrics.teamSize}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Behavior Indicators</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Engagement Score:</span>
                          <span className="font-medium">{user.behaviorFactors.engagementScore}/10</span>
                        </div>
                        <Progress value={user.behaviorFactors.engagementScore * 10} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Feature Adoption:</span>
                          <span className="font-medium">{user.behaviorFactors.featureAdoption}%</span>
                        </div>
                        <Progress value={user.behaviorFactors.featureAdoption} className="h-1" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Recommended Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.recommendedActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => executeAction(user.id, action.type)}
                        className={`flex items-center space-x-2 ${
                          action.priority === 'high' ? 'border-red-300 text-red-700 hover:bg-red-50' :
                          action.priority === 'medium' ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' :
                          'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {getActionIcon(action.type)}
                        <span>{action.action}</span>
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {action.impact}% impact
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-800">
                      Retention Probability: {user.predictedOutcome.retentionProbability}%
                    </span>
                    <span className="text-blue-600">
                      Confidence: {user.predictedOutcome.confidenceLevel}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChurnRiskAnalyzer;