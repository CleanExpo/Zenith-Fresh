'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { FunnelMetrics } from '../../types/funnel';

interface FunnelMetricsProps {
  metrics: FunnelMetrics;
  previousMetrics?: FunnelMetrics;
  className?: string;
}

export default function FunnelMetricsComponent({
  metrics,
  previousMetrics,
  className = ''
}: FunnelMetricsProps) {
  
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, trend: 'neutral' as const };
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change),
      trend: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const
    };
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral', isPositiveGood = true) => {
    if (trend === 'neutral') return 'text-gray-500';
    const isGood = isPositiveGood ? trend === 'up' : trend === 'down';
    return isGood ? 'text-green-600' : 'text-red-600';
  };

  const conversionChange = previousMetrics ? 
    calculateChange(metrics.overallConversionRate, previousMetrics.overallConversionRate) :
    null;

  const usersChange = previousMetrics ?
    calculateChange(metrics.totalUsers, previousMetrics.totalUsers) :
    null;

  const revenueChange = previousMetrics ?
    calculateChange(metrics.averageRevenuePerUser, previousMetrics.averageRevenuePerUser) :
    null;

  const timeChange = previousMetrics ?
    calculateChange(metrics.averageTimeToConvert, previousMetrics.averageTimeToConvert) :
    null;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {/* Total Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
          {usersChange && (
            <div className="flex items-center text-xs mt-1">
              {getTrendIcon(usersChange.trend)}
              <span className={`ml-1 ${getTrendColor(usersChange.trend)}`}>
                {usersChange.percentage.toFixed(1)}% vs previous period
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            entered the funnel
          </p>
        </CardContent>
      </Card>

      {/* Conversion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <Target className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {(metrics.overallConversionRate * 100).toFixed(1)}%
          </div>
          {conversionChange && (
            <div className="flex items-center text-xs mt-1">
              {getTrendIcon(conversionChange.trend)}
              <span className={`ml-1 ${getTrendColor(conversionChange.trend)}`}>
                {conversionChange.percentage.toFixed(1)}% vs previous period
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            overall funnel conversion
          </p>
          <div className="mt-2">
            <Progress value={metrics.overallConversionRate * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Revenue per User */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue per User</CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${metrics.averageRevenuePerUser.toFixed(2)}
          </div>
          {revenueChange && (
            <div className="flex items-center text-xs mt-1">
              {getTrendIcon(revenueChange.trend)}
              <span className={`ml-1 ${getTrendColor(revenueChange.trend)}`}>
                {revenueChange.percentage.toFixed(1)}% vs previous period
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            average per converting user
          </p>
          <div className="mt-2 text-sm text-gray-600">
            Total: ${metrics.totalRevenue.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Time to Convert */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time to Convert</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDuration(metrics.averageTimeToConvert)}
          </div>
          {timeChange && (
            <div className="flex items-center text-xs mt-1">
              {getTrendIcon(timeChange.trend)}
              <span className={`ml-1 ${getTrendColor(timeChange.trend, false)}`}>
                {timeChange.percentage.toFixed(1)}% vs previous period
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            average completion time
          </p>
        </CardContent>
      </Card>

      {/* Step Performance Summary */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Step Performance</CardTitle>
          <CardDescription>Conversion rates by funnel step</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.stepConversionRates.map((step, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{step.stepName}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {step.users.toLocaleString()} users
                      </span>
                      <Badge 
                        variant={step.conversionRate > 0.7 ? 'default' : step.conversionRate > 0.4 ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {(step.conversionRate * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={step.conversionRate * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Traffic Sources */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Traffic Sources</CardTitle>
          <CardDescription>Best converting traffic channels</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.topSources.length > 0 ? (
            <div className="space-y-3">
              {metrics.topSources.slice(0, 5).map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{source.source}</div>
                    <div className="text-xs text-gray-500">
                      {source.medium && `${source.medium} • `}
                      {source.users.toLocaleString()} users
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      {(source.conversionRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      ${source.revenuePerUser.toFixed(2)} RPU
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Activity className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No traffic source data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cohort Performance */}
      {metrics.cohortPerformance.length > 0 && (
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cohort Performance</CardTitle>
            <CardDescription>How different user segments perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.cohortPerformance.map((cohort, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{cohort.cohortName}</h4>
                    <Badge variant="outline" className="text-xs">
                      {cohort.users.toLocaleString()} users
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Conversion Rate</p>
                      <p className="font-semibold text-green-600">
                        {(cohort.conversionRate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Revenue/User</p>
                      <p className="font-semibold">
                        ${cohort.revenuePerUser.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Time to Convert</p>
                      <p className="font-semibold">
                        {formatDuration(cohort.averageTimeToConvert)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Significance</p>
                      <p className="font-semibold">
                        {cohort.significance ? `${(cohort.significance * 100).toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}