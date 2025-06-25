'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Users,
  Heart,
  CheckCircle,
  AlertTriangle,
  Activity,
  Calendar,
  Award,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface UserSuccessMetric {
  id: string;
  metricType: string;
  metricName: string;
  value: number;
  unit: string;
  category: string;
  milestone?: string;
  benchmark?: number;
  percentile?: number;
  recordedAt: string;
}

interface CustomerHealthScore {
  overallScore: number;
  usageScore: number;
  engagementScore: number;
  supportScore: number;
  satisfactionScore: number;
  paymentScore: number;
  riskLevel: string;
  churnProbability: number;
  lastActive?: string;
  daysInactive: number;
  loginFrequency: number;
  totalTickets: number;
  openTickets: number;
  accountValue: number;
  daysSinceSignup: number;
}

interface UserSuccessDashboardProps {
  userId?: string;
  showHealthScore?: boolean;
  showMetrics?: boolean;
  showMilestones?: boolean;
  className?: string;
}

export function UserSuccessDashboard({
  userId,
  showHealthScore = true,
  showMetrics = true,
  showMilestones = true,
  className = ''
}: UserSuccessDashboardProps) {
  const [metrics, setMetrics] = useState<UserSuccessMetric[]>([]);
  const [healthScore, setHealthScore] = useState<CustomerHealthScore | null>(null);
  const [insights, setInsights] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [metricsResponse, healthResponse] = await Promise.all([
        fetch('/api/user-success-metrics?limit=100'),
        fetch('/api/customer-health-score')
      ]);

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.metrics || []);
        setInsights(metricsData.insights || {});
      }

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthScore(healthData.healthScore);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateEngagementTrend = () => {
    const engagementMetrics = metrics.filter(m => m.metricType === 'engagement');
    if (engagementMetrics.length < 2) return null;

    const recent = engagementMetrics.slice(0, 7);
    const previous = engagementMetrics.slice(7, 14);

    const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
    const previousAvg = previous.reduce((sum, m) => sum + m.value, 0) / previous.length;

    return ((recentAvg - previousAvg) / previousAvg) * 100;
  };

  const getMilestones = () => {
    return metrics
      .filter(m => m.milestone)
      .reduce((acc, m) => {
        if (!acc[m.milestone!]) {
          acc[m.milestone!] = {
            name: m.milestone!,
            completed: true,
            completedAt: m.recordedAt,
            category: m.category
          };
        }
        return acc;
      }, {} as Record<string, any>);
  };

  const engagementTrend = calculateEngagementTrend();
  const milestones = getMilestones();

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Health Score Overview */}
      {showHealthScore && healthScore && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Overall Health Score */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span>Customer Health</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${getScoreColor(healthScore.overallScore)}`}>
                  {healthScore.overallScore}
                </div>
                <div className="text-sm text-gray-600 mb-4">Overall Score</div>
                <Badge className={getRiskLevelColor(healthScore.riskLevel)}>
                  {healthScore.riskLevel.toUpperCase()} RISK
                </Badge>
                <div className="mt-4 text-xs text-gray-500">
                  {Math.round((1 - healthScore.churnProbability) * 100)}% retention probability
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Score Breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Health Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Usage', score: healthScore.usageScore, icon: Activity },
                  { label: 'Engagement', score: healthScore.engagementScore, icon: Zap },
                  { label: 'Support', score: healthScore.supportScore, icon: Users },
                  { label: 'Satisfaction', score: healthScore.satisfactionScore, icon: Heart },
                  { label: 'Payment', score: healthScore.paymentScore, icon: CheckCircle }
                ].map((item) => (
                  <div key={item.label} className="flex items-center space-x-3">
                    <item.icon className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className={`text-sm font-semibold ${getScoreColor(item.score)}`}>
                          {item.score}
                        </span>
                      </div>
                      <Progress value={item.score} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Key Metrics */}
      {showMetrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Time to Value */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg. Time to Value</p>
                    <p className="text-2xl font-bold">
                      {Math.round(insights.averageTimeToValue || 0)} min
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
                {insights.averageTimeToValue < 30 && (
                  <div className="mt-2 flex items-center text-green-600 text-sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Excellent
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feature Adoption */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Feature Adoption</p>
                    <p className="text-2xl font-bold">
                      {Math.round(insights.featureAdoptionRate * 100 || 0)}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
                {insights.featureAdoptionRate > 0.7 && (
                  <div className="mt-2 flex items-center text-green-600 text-sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    High adoption
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Engagement Score */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Engagement</p>
                    <p className="text-2xl font-bold">
                      {Math.round(insights.engagementScore * 100 || 0)}%
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
                {engagementTrend !== null && (
                  <div className={`mt-2 flex items-center text-sm ${
                    engagementTrend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {engagementTrend > 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(engagementTrend).toFixed(1)}% vs last week
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Days */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Days Since Signup</p>
                    <p className="text-2xl font-bold">
                      {healthScore?.daysSinceSignup || 0}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-500" />
                </div>
                {healthScore && healthScore.daysInactive === 0 && (
                  <div className="mt-2 flex items-center text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Active today
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Milestones and Activity */}
      {showMilestones && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span>Achieved Milestones</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.values(milestones).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No milestones achieved yet</p>
                    <p className="text-sm">Complete onboarding to unlock achievements</p>
                  </div>
                ) : (
                  Object.values(milestones).map((milestone: any) => (
                    <div key={milestone.name} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <div className="font-medium text-green-900">
                          {milestone.name.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </div>
                        <div className="text-sm text-green-700">
                          Completed {new Date(milestone.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {milestone.category}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.slice(0, 8).map((metric) => (
                  <div key={metric.id} className="flex items-center space-x-3 py-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {metric.metricName.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(metric.recordedAt).toLocaleDateString()} • {metric.category}
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {metric.value} {metric.unit}
                    </div>
                  </div>
                ))}
                
                {metrics.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action Items */}
      {healthScore && healthScore.riskLevel !== 'low' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                <span>Recommended Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {healthScore.daysInactive > 7 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                    <div>
                      <div className="font-medium text-orange-900">Re-engage with the platform</div>
                      <div className="text-sm text-orange-700">
                        You haven't been active for {healthScore.daysInactive} days
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Start Tour
                    </Button>
                  </div>
                )}
                
                {healthScore.usageScore < 50 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                    <div>
                      <div className="font-medium text-orange-900">Explore more features</div>
                      <div className="text-sm text-orange-700">
                        Try advanced features to get more value
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Learn More
                    </Button>
                  </div>
                )}
                
                {healthScore.openTickets > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                    <div>
                      <div className="font-medium text-orange-900">Resolve open issues</div>
                      <div className="text-sm text-orange-700">
                        You have {healthScore.openTickets} open support ticket(s)
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Tickets
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}