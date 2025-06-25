'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AdvancedChart } from './charts/AdvancedChart';
import { D3Chart } from './charts/D3Chart';
import { KPI, TimeSeries, DataPoint } from '@/types/business-intelligence/analytics';

interface ExecutiveDashboardProps {
  projectId?: string;
  timeRange?: { start: Date; end: Date };
  theme?: 'light' | 'dark';
}

interface ExecutiveMetrics {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    forecast: number;
  };
  customers: {
    total: number;
    new: number;
    churn: number;
    retention: number;
  };
  business: {
    arr: number; // Annual Recurring Revenue
    mrr: number; // Monthly Recurring Revenue
    ltv: number; // Lifetime Value
    cac: number; // Customer Acquisition Cost
  };
  operations: {
    activeUsers: number;
    engagement: number;
    satisfaction: number;
    nps: number; // Net Promoter Score
  };
}

interface StrategicGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  deadline: Date;
  status: 'on-track' | 'at-risk' | 'behind' | 'completed';
  owner: string;
  category: 'revenue' | 'growth' | 'operational' | 'strategic';
}

interface MarketSegment {
  name: string;
  revenue: number;
  growth: number;
  customers: number;
}

export function ExecutiveDashboard({
  projectId,
  timeRange,
  theme = 'light'
}: ExecutiveDashboardProps) {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [goals, setGoals] = useState<StrategicGoal[]>([]);
  const [marketSegments, setMarketSegments] = useState<MarketSegment[]>([]);
  const [revenueData, setRevenueData] = useState<TimeSeries[]>([]);
  const [growthData, setGrowthData] = useState<TimeSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30d' | '90d' | '1y'>('90d');

  useEffect(() => {
    fetchExecutiveData();
  }, [projectId, timeRange, selectedTimeframe]);

  const fetchExecutiveData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMetrics(),
        fetchStrategicGoals(),
        fetchMarketSegments(),
        fetchTimeSeriesData()
      ]);
    } catch (error) {
      console.error('Error fetching executive dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    // Generate mock executive metrics
    const mockMetrics: ExecutiveMetrics = {
      revenue: {
        current: 2850000,
        previous: 2650000,
        growth: 7.5,
        forecast: 3200000
      },
      customers: {
        total: 12450,
        new: 850,
        churn: 125,
        retention: 94.2
      },
      business: {
        arr: 34200000,
        mrr: 2850000,
        ltv: 2750,
        cac: 485
      },
      operations: {
        activeUsers: 8920,
        engagement: 78.5,
        satisfaction: 4.2,
        nps: 42
      }
    };
    setMetrics(mockMetrics);
  };

  const fetchStrategicGoals = async () => {
    const mockGoals: StrategicGoal[] = [
      {
        id: 'goal-1',
        title: 'Reach $50M ARR',
        description: 'Achieve $50 million in Annual Recurring Revenue by end of fiscal year',
        target: 50000000,
        current: 34200000,
        deadline: new Date('2024-12-31'),
        status: 'on-track',
        owner: 'CEO',
        category: 'revenue'
      },
      {
        id: 'goal-2',
        title: 'Expand to 25K Customers',
        description: 'Grow customer base to 25,000 active customers',
        target: 25000,
        current: 12450,
        deadline: new Date('2024-12-31'),
        status: 'at-risk',
        owner: 'VP Growth',
        category: 'growth'
      },
      {
        id: 'goal-3',
        title: 'Improve NPS to 60+',
        description: 'Increase Net Promoter Score to above 60',
        target: 60,
        current: 42,
        deadline: new Date('2024-06-30'),
        status: 'behind',
        owner: 'VP Product',
        category: 'operational'
      },
      {
        id: 'goal-4',
        title: 'Launch Enterprise Platform',
        description: 'Successfully launch and onboard first enterprise customers',
        target: 100,
        current: 85,
        deadline: new Date('2024-09-30'),
        status: 'on-track',
        owner: 'CTO',
        category: 'strategic'
      }
    ];
    setGoals(mockGoals);
  };

  const fetchMarketSegments = async () => {
    const mockSegments: MarketSegment[] = [
      { name: 'Enterprise', revenue: 15600000, growth: 45.2, customers: 450 },
      { name: 'Mid-Market', revenue: 12800000, growth: 28.7, customers: 2850 },
      { name: 'SMB', revenue: 5800000, growth: 15.3, customers: 9150 }
    ];
    setMarketSegments(mockSegments);
  };

  const fetchTimeSeriesData = async () => {
    const days = selectedTimeframe === '30d' ? 30 : selectedTimeframe === '90d' ? 90 : 365;
    
    // Generate revenue time series
    const revenuePoints = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const baseRevenue = 95000;
      const trend = i * 500; // Positive growth trend
      const noise = (Math.random() - 0.5) * 10000;
      return {
        timestamp: date,
        value: baseRevenue + trend + noise
      };
    });

    const revenueSeries: TimeSeries[] = [{
      name: 'Daily Revenue',
      data: revenuePoints,
      type: 'line',
      color: '#10B981'
    }];

    // Generate customer growth data
    const customerPoints = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const baseCustomers = 12000 - (days - i) * 5;
      const dailyGrowth = Math.floor(Math.random() * 20) + 5;
      return {
        timestamp: date,
        value: baseCustomers + i * 5 + dailyGrowth
      };
    });

    const growthSeries: TimeSeries[] = [
      {
        name: 'Total Customers',
        data: customerPoints,
        type: 'line',
        color: '#3B82F6'
      },
      {
        name: 'New Customers',
        data: Array.from({ length: days }, (_, i) => ({
          timestamp: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000),
          value: Math.floor(Math.random() * 20) + 15
        })),
        type: 'bar',
        color: '#F59E0B'
      }
    ];

    setRevenueData(revenueSeries);
    setGrowthData(growthSeries);
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'on-track': return 'text-blue-600 bg-blue-100';
      case 'at-risk': return 'text-yellow-600 bg-yellow-100';
      case 'behind': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGoalProgress = (goal: StrategicGoal) => {
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const kpiCards = useMemo(() => {
    if (!metrics) return [];

    return [
      {
        title: 'Monthly Recurring Revenue',
        value: formatCurrency(metrics.revenue.current),
        change: metrics.revenue.growth,
        icon: '💰',
        trend: 'up' as const,
        subtitle: `Target: ${formatCurrency(metrics.revenue.forecast)}`
      },
      {
        title: 'Annual Recurring Revenue',
        value: formatCurrency(metrics.business.arr),
        change: 32.5,
        icon: '📈',
        trend: 'up' as const,
        subtitle: 'YoY Growth'
      },
      {
        title: 'Total Customers',
        value: metrics.customers.total.toLocaleString(),
        change: ((metrics.customers.new - metrics.customers.churn) / metrics.customers.total * 100),
        icon: '👥',
        trend: 'up' as const,
        subtitle: `+${metrics.customers.new} new this month`
      },
      {
        title: 'Customer Retention',
        value: `${metrics.customers.retention}%`,
        change: 2.1,
        icon: '🔒',
        trend: 'up' as const,
        subtitle: 'Monthly retention rate'
      },
      {
        title: 'Customer Lifetime Value',
        value: formatCurrency(metrics.business.ltv),
        change: 15.8,
        icon: '⭐',
        trend: 'up' as const,
        subtitle: `CAC: ${formatCurrency(metrics.business.cac)}`
      },
      {
        title: 'Net Promoter Score',
        value: metrics.operations.nps.toString(),
        change: 8.2,
        icon: '😊',
        trend: 'up' as const,
        subtitle: `Satisfaction: ${metrics.operations.satisfaction}/5`
      },
      {
        title: 'Active Users',
        value: metrics.operations.activeUsers.toLocaleString(),
        change: 12.3,
        icon: '🚀',
        trend: 'up' as const,
        subtitle: `${metrics.operations.engagement}% engaged`
      },
      {
        title: 'LTV:CAC Ratio',
        value: `${(metrics.business.ltv / metrics.business.cac).toFixed(1)}:1`,
        change: 18.5,
        icon: '⚖️',
        trend: 'up' as const,
        subtitle: 'Healthy ratio > 3:1'
      }
    ];
  }, [metrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading executive dashboard...</span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} px-6 py-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Executive Dashboard</h1>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Strategic insights and key performance indicators
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className={`block w-24 rounded-md border ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              } px-3 py-2 text-sm`}
            >
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
              <option value="1y">1 Year</option>
            </select>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Last updated</div>
              <div className="text-sm font-medium">{new Date().toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((kpi, index) => (
            <div
              key={index}
              className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{kpi.icon}</span>
                    <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {kpi.title}
                    </h3>
                  </div>
                  <div className="text-3xl font-bold mb-1">{kpi.value}</div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${
                      kpi.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {kpi.change >= 0 ? '↗️' : '↘️'} {Math.abs(kpi.change).toFixed(1)}%
                    </span>
                    {kpi.subtitle && (
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {kpi.subtitle}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Strategic Goals */}
        <div className={`rounded-xl p-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border shadow-sm`}>
          <h2 className="text-xl font-bold mb-6">Strategic Goals & Objectives</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{goal.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGoalStatusColor(goal.status)}`}>
                    {goal.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                
                <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {goal.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{getGoalProgress(goal).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        goal.status === 'completed' ? 'bg-green-600' :
                        goal.status === 'on-track' ? 'bg-blue-600' :
                        goal.status === 'at-risk' ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${getGoalProgress(goal)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Current: {typeof goal.current === 'number' && goal.current > 1000000 
                      ? formatCurrency(goal.current) 
                      : goal.current.toLocaleString()}</span>
                    <span>Target: {typeof goal.target === 'number' && goal.target > 1000000 
                      ? formatCurrency(goal.target) 
                      : goal.target.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Owner: {goal.owner}</span>
                    <span>Due: {goal.deadline.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue & Growth Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border shadow-sm`}>
            <h2 className="text-xl font-bold mb-4">Revenue Trend</h2>
            <AdvancedChart
              type="area"
              data={revenueData}
              height={350}
              theme={theme}
              yAxisLabel="Revenue ($)"
              showGrid={true}
              showLegend={false}
            />
          </div>
          
          <div className={`rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border shadow-sm`}>
            <h2 className="text-xl font-bold mb-4">Customer Growth</h2>
            <AdvancedChart
              type="line"
              data={growthData}
              height={350}
              theme={theme}
              yAxisLabel="Customers"
              showGrid={true}
              showLegend={true}
            />
          </div>
        </div>

        {/* Market Segments & Business Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border shadow-sm`}>
            <h2 className="text-xl font-bold mb-4">Revenue by Market Segment</h2>
            <div className="space-y-4">
              {marketSegments.map((segment, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{segment.name}</span>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(segment.revenue)}</div>
                      <div className={`text-sm ${segment.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {segment.growth >= 0 ? '+' : ''}{segment.growth}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      style={{ 
                        width: `${(segment.revenue / Math.max(...marketSegments.map(s => s.revenue))) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    {segment.customers.toLocaleString()} customers
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className={`rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border shadow-sm`}>
            <h2 className="text-xl font-bold mb-4">Business Health Score</h2>
            {metrics && (
              <div className="space-y-6">
                {/* Overall Health Score */}
                <div className="text-center">
                  <div className="text-6xl font-bold text-green-600 mb-2">92</div>
                  <div className="text-lg font-medium">Excellent Health</div>
                  <div className="text-sm text-gray-500">Based on 12 key metrics</div>
                </div>
                
                {/* Health Categories */}
                <div className="space-y-4">
                  {[
                    { name: 'Financial Health', score: 95, color: 'bg-green-500' },
                    { name: 'Growth Health', score: 88, color: 'bg-blue-500' },
                    { name: 'Customer Health', score: 92, color: 'bg-purple-500' },
                    { name: 'Operational Health', score: 89, color: 'bg-orange-500' }
                  ].map((category, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{category.name}</span>
                        <span className="font-medium">{category.score}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${category.color} h-2 rounded-full`}
                          style={{ width: `${category.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Executive Summary */}
        <div className={`rounded-xl p-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border shadow-sm`}>
          <h2 className="text-xl font-bold mb-4">Executive Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-green-600 mb-2">🎯 Achievements</h3>
              <ul className="text-sm space-y-1">
                <li>• ARR growth of 32.5% YoY</li>
                <li>• Customer retention at 94.2%</li>
                <li>• Healthy LTV:CAC ratio of 5.7:1</li>
                <li>• Strong NPS improvement (+8.2)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-yellow-600 mb-2">⚠️ Areas of Focus</h3>
              <ul className="text-sm space-y-1">
                <li>• Customer acquisition velocity</li>
                <li>• Enterprise segment expansion</li>
                <li>• Product feature adoption</li>
                <li>• Market share in SMB</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-blue-600 mb-2">🚀 Opportunities</h3>
              <ul className="text-sm space-y-1">
                <li>• International market expansion</li>
                <li>• AI/ML feature development</li>
                <li>• Strategic partnerships</li>
                <li>• Enterprise platform launch</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}