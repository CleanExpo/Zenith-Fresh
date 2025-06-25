/**
 * Usage Analytics Component
 * Shows detailed usage statistics and trends
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Database, 
  Users, 
  BarChart3,
  Calendar,
  Download,
  AlertTriangle
} from 'lucide-react';

interface UsageData {
  metric: string;
  current: number;
  limit?: number;
  percentage?: number;
  trend: {
    direction: 'up' | 'down' | 'stable';
    value: number;
  };
  history: Array<{
    date: string;
    value: number;
  }>;
}

interface UsageAnalyticsProps {
  teamId: string;
}

export function UsageAnalytics({ teamId }: UsageAnalyticsProps) {
  const [usageData, setUsageData] = useState<Record<string, UsageData>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchUsageData();
  }, [teamId, selectedPeriod]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/billing/usage?period=${selectedPeriod}&teamId=${teamId}`);
      const data = await response.json();
      setUsageData(data.usage || {});
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'api_calls':
        return <Zap className="h-5 w-5 text-blue-500" />;
      case 'storage_gb':
        return <Database className="h-5 w-5 text-green-500" />;
      case 'team_members':
        return <Users className="h-5 w-5 text-purple-500" />;
      default:
        return <BarChart3 className="h-5 w-5 text-gray-500" />;
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'api_calls':
        return 'API Calls';
      case 'storage_gb':
        return 'Storage (GB)';
      case 'team_members':
        return 'Team Members';
      default:
        return metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatValue = (metric: string, value: number) => {
    if (metric === 'storage_gb') {
      return `${value.toFixed(2)} GB`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  const getUsageStatus = (percentage?: number) => {
    if (!percentage) return { color: 'text-gray-500', label: 'No limit' };
    if (percentage >= 90) return { color: 'text-red-600', label: 'Critical' };
    if (percentage >= 75) return { color: 'text-yellow-600', label: 'Warning' };
    return { color: 'text-green-600', label: 'Healthy' };
  };

  const exportUsageData = async () => {
    try {
      const response = await fetch(`/api/billing/usage/export?teamId=${teamId}&period=${selectedPeriod}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `usage-report-${selectedPeriod}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting usage data:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Usage Analytics</h2>
          <p className="text-gray-600">Monitor your feature usage and limits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportUsageData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
        <TabsList>
          <TabsTrigger value="day">Today</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="year">This Year</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="space-y-6">
          {/* Usage Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(usageData).map(([metric, data]) => {
              const status = getUsageStatus(data.percentage);
              
              return (
                <Card key={metric} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getMetricIcon(metric)}
                        <CardTitle className="text-lg">{getMetricLabel(metric)}</CardTitle>
                      </div>
                      <Badge variant={status.color.includes('red') ? 'destructive' : status.color.includes('yellow') ? 'warning' : 'secondary'}>
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Current Usage */}
                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-3xl font-bold">
                            {formatValue(metric, data.current)}
                          </span>
                          {data.limit !== undefined && data.limit !== -1 && (
                            <span className="text-sm text-gray-500">
                              / {formatValue(metric, data.limit)}
                            </span>
                          )}
                        </div>
                        
                        {/* Progress Bar */}
                        {data.percentage !== undefined && data.limit !== -1 && (
                          <div className="space-y-1">
                            <Progress 
                              value={Math.min(data.percentage, 100)} 
                              className="h-2"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{data.percentage.toFixed(0)}% used</span>
                              {data.limit && data.current > data.limit && (
                                <span className="text-red-600 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Over limit
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Trend */}
                      <div className="flex items-center gap-2 text-sm">
                        {getTrendIcon(data.trend.direction)}
                        <span className={
                          data.trend.direction === 'up' ? 'text-green-600' :
                          data.trend.direction === 'down' ? 'text-red-600' :
                          'text-gray-600'
                        }>
                          {data.trend.value}% vs last period
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  {/* Critical usage overlay */}
                  {data.percentage && data.percentage >= 90 && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl">
                      <AlertTriangle className="h-3 w-3" />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Detailed Usage History */}
          <Card>
            <CardHeader>
              <CardTitle>Usage History</CardTitle>
              <CardDescription>
                Track your usage patterns over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(usageData).map(([metric, data]) => (
                  <div key={metric} className="space-y-3">
                    <div className="flex items-center gap-2">
                      {getMetricIcon(metric)}
                      <h4 className="font-medium">{getMetricLabel(metric)}</h4>
                    </div>
                    
                    {/* Simple history visualization */}
                    <div className="grid grid-cols-7 gap-1">
                      {data.history.slice(-7).map((point, index) => {
                        const maxValue = Math.max(...data.history.map(h => h.value));
                        const height = maxValue > 0 ? (point.value / maxValue) * 40 : 0;
                        
                        return (
                          <div key={index} className="flex flex-col items-center">
                            <div 
                              className="bg-blue-500 rounded-t w-full min-h-[2px]"
                              style={{ height: `${height}px` }}
                              title={`${formatValue(metric, point.value)} on ${point.date}`}
                            />
                            <span className="text-xs text-gray-500 mt-1">
                              {new Date(point.date).toLocaleDateString('en', { weekday: 'short' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Usage Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                Optimize your usage and plan selection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(usageData).map(([metric, data]) => {
                  if (!data.percentage || data.percentage < 75) return null;
                  
                  return (
                    <div key={metric} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">
                          {getMetricLabel(metric)} Usage High
                        </h4>
                        <p className="text-sm text-yellow-700">
                          You're using {data.percentage.toFixed(0)}% of your {getMetricLabel(metric).toLowerCase()} limit. 
                          Consider upgrading your plan to avoid service interruption.
                        </p>
                        {data.percentage >= 90 && (
                          <Button size="sm" className="mt-2" variant="outline">
                            Upgrade Plan
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}