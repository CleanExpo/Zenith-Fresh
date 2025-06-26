'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Shield, 
  RefreshCw,
  Clock,
  Users,
  Globe,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMetrics, checkSystemHealth } from '@/components/error-boundaries';

interface ErrorStats {
  timeframe: string;
  stats: {
    totalErrors: number;
    recentErrors: number;
    errorRate: number;
    errorsByLevel: Record<string, number>;
    errorsByComponent: Record<string, number>;
    topErrors: Array<{ message: string; count: number }>;
    lastError?: string;
  };
  latestReport?: any;
  lastUpdated: string;
}

interface HealthStatus {
  isHealthy: boolean;
  errorRate: number;
  errorCount: number;
  lastError?: string;
  topErrors: Array<{ message: string; count: number }>;
}

/**
 * Error Monitoring Dashboard
 * 
 * Real-time monitoring dashboard for production error tracking
 */
export function ErrorMonitoringDashboard() {
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadErrorStats();
    updateHealthStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadErrorStats();
      updateHealthStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [timeframe]);

  const loadErrorStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/monitoring/metrics?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setErrorStats(data);
      }
    } catch (error) {
      console.error('Failed to load error stats:', error);
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date());
    }
  };

  const updateHealthStatus = () => {
    try {
      const health = checkSystemHealth();
      setHealthStatus(health);
    } catch (error) {
      console.error('Failed to check system health:', error);
    }
  };

  const handleRefresh = () => {
    loadErrorStats();
    updateHealthStatus();
  };

  if (isLoading && !errorStats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Error Monitoring</h2>
          <div className="animate-spin">
            <RefreshCw className="h-5 w-5" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Error Monitoring Dashboard</h2>
          <p className="text-gray-600">Real-time application health and error tracking</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Status */}
      {healthStatus && (
        <Card className={`border-2 ${healthStatus.isHealthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className={`h-5 w-5 ${healthStatus.isHealthy ? 'text-green-600' : 'text-red-600'}`} />
              <CardTitle className={healthStatus.isHealthy ? 'text-green-800' : 'text-red-800'}>
                System Health: {healthStatus.isHealthy ? 'Healthy' : 'Issues Detected'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Error Rate</p>
                <p className="text-lg font-semibold">
                  {(healthStatus.errorRate * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Errors</p>
                <p className="text-lg font-semibold">{healthStatus.errorCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Error</p>
                <p className="text-sm">
                  {healthStatus.lastError 
                    ? new Date(healthStatus.lastError).toLocaleString()
                    : 'None'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      {errorStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{errorStats.stats.totalErrors}</div>
              <p className="text-xs text-gray-600">
                {errorStats.stats.recentErrors} in last hour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(errorStats.stats.errorRate * 100).toFixed(2)}%
              </div>
              <p className="text-xs text-gray-600">
                Last {timeframe}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Page Errors</CardTitle>
              <Globe className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {errorStats.stats.errorsByLevel.page || 0}
              </div>
              <p className="text-xs text-gray-600">
                Critical page-level errors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Component Errors</CardTitle>
              <Activity className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {errorStats.stats.errorsByLevel.component || 0}
              </div>
              <p className="text-xs text-gray-600">
                Component-level errors
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Breakdown */}
      {errorStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Errors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Top Error Messages</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {errorStats.stats.topErrors.length > 0 ? (
                  errorStats.stats.topErrors.map((error, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={error.message}>
                          {error.message}
                        </p>
                      </div>
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        {error.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No errors in selected timeframe</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Errors by Component */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Errors by Component</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(errorStats.stats.errorsByComponent).length > 0 ? (
                  Object.entries(errorStats.stats.errorsByComponent)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([component, count]) => (
                      <div key={component} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {component || 'Unknown'}
                          </p>
                        </div>
                        <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                          {count}
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 text-sm">No component errors in selected timeframe</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4" />
          <span>Auto-refresh every 30 seconds</span>
        </div>
      </div>
    </div>
  );
}

export default ErrorMonitoringDashboard;