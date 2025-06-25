'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ScatterPlot, Scatter, ComposedChart, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine, Brush, ErrorBar
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Users, Globe, Activity, 
         Calendar, Filter, Download, Share2, Settings, Bell, 
         BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
         MoreVertical, RefreshCw, Zap, Brain } from 'lucide-react';

interface MetricCard {
  id: string;
  title: string;
  value: number | string;
  previousValue?: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  format?: 'number' | 'percentage' | 'currency' | 'time';
  icon: React.ElementType;
  color: string;
  description?: string;
}

interface ChartConfig {
  id: string;
  title: string;
  type: 'line' | 'area' | 'bar' | 'pie' | 'scatter' | 'composed';
  data: any[];
  dataKeys: string[];
  colors?: string[];
  xAxisKey?: string;
  yAxisLabel?: string;
  height?: number;
  showBrush?: boolean;
  showGrid?: boolean;
  showTrend?: boolean;
}

interface BusinessIntelligenceDashboardProps {
  projectId?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  refreshInterval?: number;
}

export function BusinessIntelligenceDashboard({ 
  projectId, 
  timeRange,
  refreshInterval = 30000 
}: BusinessIntelligenceDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'users', 'conversions']);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'fullscreen'>('grid');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Real-time data fetching
  useEffect(() => {
    fetchDashboardData();
    
    if (autoRefresh && refreshInterval) {
      const interval = setInterval(() => {
        fetchDashboardData();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [projectId, timeRange, selectedTimeframe, activeFilters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeframe: selectedTimeframe,
        ...(projectId && { projectId }),
        ...(timeRange?.start && { startDate: timeRange.start.toISOString() }),
        ...(timeRange?.end && { endDate: timeRange.end.toISOString() }),
        ...Object.entries(activeFilters).reduce((acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`/api/business-intelligence?${params}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await response.json();
      setDashboardData(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Metric cards configuration
  const metricCards: MetricCard[] = useMemo(() => {
    if (!dashboardData) return [];
    
    return [
      {
        id: 'total_revenue',
        title: 'Total Revenue',
        value: dashboardData.metrics?.totalRevenue || 0,
        previousValue: dashboardData.metrics?.previousRevenue,
        change: dashboardData.metrics?.revenueGrowth,
        changeType: (dashboardData.metrics?.revenueGrowth || 0) >= 0 ? 'increase' : 'decrease',
        format: 'currency',
        icon: TrendingUp,
        color: 'bg-green-500',
        description: 'Total revenue generated'
      },
      {
        id: 'active_users',
        title: 'Active Users',
        value: dashboardData.metrics?.activeUsers || 0,
        previousValue: dashboardData.metrics?.previousActiveUsers,
        change: dashboardData.metrics?.userGrowth,
        changeType: (dashboardData.metrics?.userGrowth || 0) >= 0 ? 'increase' : 'decrease',
        format: 'number',
        icon: Users,
        color: 'bg-blue-500',
        description: 'Monthly active users'
      },
      {
        id: 'conversion_rate',
        title: 'Conversion Rate',
        value: dashboardData.metrics?.conversionRate || 0,
        previousValue: dashboardData.metrics?.previousConversionRate,
        change: dashboardData.metrics?.conversionGrowth,
        changeType: (dashboardData.metrics?.conversionGrowth || 0) >= 0 ? 'increase' : 'decrease',
        format: 'percentage',
        icon: Target,
        color: 'bg-purple-500',
        description: 'Visitor to customer conversion rate'
      },
      {
        id: 'avg_session_time',
        title: 'Avg Session Time',
        value: dashboardData.metrics?.avgSessionTime || 0,
        previousValue: dashboardData.metrics?.previousSessionTime,
        change: dashboardData.metrics?.sessionTimeGrowth,
        changeType: (dashboardData.metrics?.sessionTimeGrowth || 0) >= 0 ? 'increase' : 'decrease',
        format: 'time',
        icon: Activity,
        color: 'bg-orange-500',
        description: 'Average time spent per session'
      },
      {
        id: 'customer_ltv',
        title: 'Customer LTV',
        value: dashboardData.metrics?.customerLTV || 0,
        previousValue: dashboardData.metrics?.previousLTV,
        change: dashboardData.metrics?.ltvGrowth,
        changeType: (dashboardData.metrics?.ltvGrowth || 0) >= 0 ? 'increase' : 'decrease',
        format: 'currency',
        icon: Globe,
        color: 'bg-indigo-500',
        description: 'Customer lifetime value'
      },
      {
        id: 'churn_rate',
        title: 'Churn Rate',
        value: dashboardData.metrics?.churnRate || 0,
        previousValue: dashboardData.metrics?.previousChurnRate,
        change: dashboardData.metrics?.churnChange,
        changeType: (dashboardData.metrics?.churnChange || 0) <= 0 ? 'increase' : 'decrease',
        format: 'percentage',
        icon: TrendingDown,
        color: 'bg-red-500',
        description: 'Monthly customer churn rate'
      }
    ];
  }, [dashboardData]);

  // Chart configurations
  const chartConfigs: ChartConfig[] = useMemo(() => {
    if (!dashboardData) return [];
    
    return [
      {
        id: 'revenue_trend',
        title: 'Revenue Trend',
        type: 'area',
        data: dashboardData.charts?.revenueTrend || [],
        dataKeys: ['revenue', 'target'],
        colors: ['#10B981', '#EF4444'],
        xAxisKey: 'date',
        yAxisLabel: 'Revenue ($)',
        height: 300,
        showBrush: true,
        showGrid: true,
        showTrend: true
      },
      {
        id: 'user_acquisition',
        title: 'User Acquisition Funnel',
        type: 'bar',
        data: dashboardData.charts?.acquisitionFunnel || [],
        dataKeys: ['visitors', 'leads', 'customers'],
        colors: ['#3B82F6', '#8B5CF6', '#10B981'],
        xAxisKey: 'channel',
        yAxisLabel: 'Count',
        height: 250
      },
      {
        id: 'user_engagement',
        title: 'User Engagement Over Time',
        type: 'line',
        data: dashboardData.charts?.engagementTrend || [],
        dataKeys: ['pageViews', 'sessions', 'interactions'],
        colors: ['#F59E0B', '#EF4444', '#8B5CF6'],
        xAxisKey: 'date',
        yAxisLabel: 'Count',
        height: 300,
        showGrid: true
      },
      {
        id: 'revenue_by_source',
        title: 'Revenue by Source',
        type: 'pie',
        data: dashboardData.charts?.revenueBySource || [],
        dataKeys: ['value'],
        colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
        height: 250
      },
      {
        id: 'cohort_analysis',
        title: 'Cohort Retention Analysis',
        type: 'area',
        data: dashboardData.charts?.cohortRetention || [],
        dataKeys: ['week1', 'week2', 'week4', 'week8', 'week12'],
        colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
        xAxisKey: 'cohort',
        yAxisLabel: 'Retention %',
        height: 300,
        showGrid: true
      },
      {
        id: 'performance_metrics',
        title: 'Performance vs Conversion',
        type: 'scatter',
        data: dashboardData.charts?.performanceCorrelation || [],
        dataKeys: ['conversionRate'],
        colors: ['#8B5CF6'],
        xAxisKey: 'loadTime',
        yAxisLabel: 'Conversion Rate %',
        height: 250
      }
    ];
  }, [dashboardData]);

  const formatValue = (value: number | string, format: string) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'time':
        const minutes = Math.floor(value / 60);
        const seconds = value % 60;
        return `${minutes}m ${seconds}s`;
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(value);
    }
  };

  const getChangeIcon = (changeType: string, change: number) => {
    if (Math.abs(change) < 0.1) return null;
    return changeType === 'increase' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase': return 'text-green-600';
      case 'decrease': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const renderChart = (config: ChartConfig) => {
    const { type, data, dataKeys, colors, xAxisKey, yAxisLabel, height, showBrush, showGrid } = config;
    
    const commonProps = {
      width: '100%',
      height: height || 250,
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart>
              {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
              <XAxis dataKey={xAxisKey} />
              <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors?.[index] || '#8884d8'}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
              {showBrush && <Brush dataKey={xAxisKey} height={30} />}
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart>
              {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
              <XAxis dataKey={xAxisKey} />
              <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {dataKeys.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={colors?.[index] || '#8884d8'}
                  fill={colors?.[index] || '#8884d8'}
                  fillOpacity={0.6}
                />
              ))}
              {showBrush && <Brush dataKey={xAxisKey} height={30} />}
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart>
              {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
              <XAxis dataKey={xAxisKey} />
              <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {dataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors?.[index] || '#8884d8'}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey={dataKeys[0]}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors?.[index % colors.length] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'scatter':
        return (
          <ResponsiveContainer {...commonProps}>
            <ScatterPlot>
              {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
              <XAxis dataKey={xAxisKey} type="number" />
              <YAxis dataKey={dataKeys[0]} label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={data} fill={colors?.[0] || '#8884d8'} />
            </ScatterPlot>
          </ResponsiveContainer>
        );
        
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading business intelligence...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          <h3 className="font-medium">Error loading business intelligence</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Business Intelligence</h1>
                <p className="text-gray-600">Advanced analytics and insights dashboard</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 lg:mt-0 flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <RefreshCw className="w-4 h-4" />
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </button>
              
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              
              <button
                onClick={fetchDashboardData}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatValue(metric.value, metric.format || 'number')}
                  </p>
                  {metric.change !== undefined && (
                    <div className={`flex items-center mt-2 text-sm ${getChangeColor(metric.changeType || 'neutral')}`}>
                      {getChangeIcon(metric.changeType || 'neutral', metric.change)}
                      <span className="ml-1">
                        {Math.abs(metric.change).toFixed(1)}% vs last period
                      </span>
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-lg ${metric.color} bg-opacity-10 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${metric.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartConfigs.map((config) => (
          <div key={config.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-[300px]">
              {renderChart(config)}
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights Panel */}
      {dashboardData?.insights && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.insights.map((insight: any, index: number) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    insight.priority === 'high' ? 'bg-red-500' :
                    insight.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    {insight.recommendation && (
                      <p className="text-sm text-blue-600 mt-2 font-medium">
                        💡 {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}