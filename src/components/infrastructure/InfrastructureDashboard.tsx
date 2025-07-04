'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

// ==================== TYPES ====================

interface InfrastructureMetrics {
  globalOverview: {
    totalRegions: number;
    activeRegions: number;
    totalInstances: number;
    totalCost: number;
    averageLatency: number;
    globalThroughput: number;
    errorRate: number;
    overallHealth: number;
  };
  regionStatus: Record<string, {
    region: string;
    status: 'operational' | 'degraded' | 'outage';
    instances: number;
    cost: number;
    latency: number;
    throughput: number;
    errorRate: number;
    lastIncident?: number;
  }>;
  scalingMetrics: {
    currentInstances: Record<string, number>;
    totalInstances: number;
    scalingEvents: number;
    efficiency: number;
    autoScalingEnabled: boolean;
  };
  costMetrics: {
    totalCost: number;
    costByRegion: Record<string, number>;
    costByService: Record<string, number>;
    trend: number;
    budgetUtilization: number;
    recommendationsCount: number;
  };
  edgeMetrics: {
    totalRequests: number;
    cacheHitRate: number;
    averageResponseTime: number;
    edgeLocations: number;
    bandwidth: number;
  };
  alerts: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: number;
    region: string;
    service: string;
  }>;
}

// ==================== INFRASTRUCTURE DASHBOARD ====================

export default function InfrastructureDashboard() {
  const [metrics, setMetrics] = useState<InfrastructureMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  useEffect(() => {
    loadMetrics();
    
    const interval = setInterval(() => {
      loadMetrics();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval, timeRange]);

  const loadMetrics = async () => {
    try {
      // Simulate API call - in production, this would call actual monitoring APIs
      const mockMetrics: InfrastructureMetrics = {
        globalOverview: {
          totalRegions: 5,
          activeRegions: 5,
          totalInstances: 47,
          totalCost: 1247.89,
          averageLatency: 89,
          globalThroughput: 12450,
          errorRate: 0.12,
          overallHealth: 98.7
        },
        regionStatus: {
          'us-east-1': {
            region: 'us-east-1',
            status: 'operational',
            instances: 15,
            cost: 456.78,
            latency: 67,
            throughput: 5200,
            errorRate: 0.08
          },
          'us-west-2': {
            region: 'us-west-2',
            status: 'operational',
            instances: 12,
            cost: 378.45,
            latency: 78,
            throughput: 3800,
            errorRate: 0.11
          },
          'eu-west-1': {
            region: 'eu-west-1',
            status: 'degraded',
            instances: 8,
            cost: 234.56,
            latency: 112,
            throughput: 2100,
            errorRate: 0.19,
            lastIncident: Date.now() - 3600000
          },
          'ap-southeast-1': {
            region: 'ap-southeast-1',
            status: 'operational',
            instances: 6,
            cost: 123.45,
            latency: 95,
            throughput: 1150,
            errorRate: 0.14
          },
          'ap-northeast-1': {
            region: 'ap-northeast-1',
            status: 'operational',
            instances: 6,
            cost: 154.65,
            latency: 102,
            throughput: 1200,
            errorRate: 0.16
          }
        },
        scalingMetrics: {
          currentInstances: {
            'us-east-1': 15,
            'us-west-2': 12,
            'eu-west-1': 8,
            'ap-southeast-1': 6,
            'ap-northeast-1': 6
          },
          totalInstances: 47,
          scalingEvents: 8,
          efficiency: 87.3,
          autoScalingEnabled: true
        },
        costMetrics: {
          totalCost: 1247.89,
          costByRegion: {
            'us-east-1': 456.78,
            'us-west-2': 378.45,
            'eu-west-1': 234.56,
            'ap-southeast-1': 123.45,
            'ap-northeast-1': 154.65
          },
          costByService: {
            'compute': 687.23,
            'database': 234.67,
            'storage': 156.78,
            'network': 89.45,
            'cache': 79.76
          },
          trend: 5.7,
          budgetUtilization: 62.4,
          recommendationsCount: 12
        },
        edgeMetrics: {
          totalRequests: 2847392,
          cacheHitRate: 94.7,
          averageResponseTime: 42,
          edgeLocations: 180,
          bandwidth: 12.4 // TB
        },
        alerts: [
          {
            id: '1',
            severity: 'high',
            message: 'High latency detected in eu-west-1',
            timestamp: Date.now() - 1800000,
            region: 'eu-west-1',
            service: 'api-gateway'
          },
          {
            id: '2',
            severity: 'medium',
            message: 'Memory utilization above 80% in us-east-1',
            timestamp: Date.now() - 900000,
            region: 'us-east-1',
            service: 'compute'
          },
          {
            id: '3',
            severity: 'low',
            message: 'Cache hit rate below target in ap-southeast-1',
            timestamp: Date.now() - 600000,
            region: 'ap-southeast-1',
            service: 'redis-cache'
          }
        ]
      };

      setMetrics(mockMetrics);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load infrastructure metrics:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'outage': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Infrastructure Dashboard</h2>
          <p className="text-gray-600">Failed to load infrastructure metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Infrastructure Dashboard</h1>
          <p className="text-gray-600">Global scale infrastructure monitoring and management</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10s refresh</option>
            <option value={30}>30s refresh</option>
            <option value={60}>1m refresh</option>
            <option value={300}>5m refresh</option>
          </select>
        </div>
      </div>

      {/* Global Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overall Health</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.globalOverview.overallHealth}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Global Throughput</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.globalOverview.globalThroughput.toLocaleString()}</p>
              <p className="text-xs text-gray-500">requests/min</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.globalOverview.totalCost)}</p>
              <p className="text-xs text-gray-500">monthly</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Latency</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.globalOverview.averageLatency}ms</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Region Status and Scaling Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Region Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Region Status</h3>
          <div className="space-y-4">
            {Object.values(metrics.regionStatus).map((region) => (
              <div
                key={region.region}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedRegion === region.region ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRegion(selectedRegion === region.region ? null : region.region)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(region.status)}`}>
                      {region.status}
                    </span>
                    <span className="ml-3 font-medium text-gray-900">{region.region}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{region.instances} instances</p>
                    <p className="text-xs text-gray-500">{formatCurrency(region.cost)}/month</p>
                  </div>
                </div>
                
                {selectedRegion === region.region && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Latency:</span>
                        <span className="ml-2 font-medium">{region.latency}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Throughput:</span>
                        <span className="ml-2 font-medium">{region.throughput.toLocaleString()}/min</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Error Rate:</span>
                        <span className="ml-2 font-medium">{region.errorRate}%</span>
                      </div>
                      {region.lastIncident && (
                        <div>
                          <span className="text-gray-600">Last Incident:</span>
                          <span className="ml-2 font-medium">{formatTimeAgo(region.lastIncident)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Auto-Scaling Metrics */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-Scaling Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Auto-Scaling Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                metrics.scalingMetrics.autoScalingEnabled ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
              }`}>
                {metrics.scalingMetrics.autoScalingEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Instances</span>
              <span className="font-medium">{metrics.scalingMetrics.totalInstances}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Scaling Events (24h)</span>
              <span className="font-medium">{metrics.scalingMetrics.scalingEvents}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Efficiency Score</span>
              <span className="font-medium">{metrics.scalingMetrics.efficiency}%</span>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Instances by Region</h4>
              <div className="space-y-2">
                {Object.entries(metrics.scalingMetrics.currentInstances).map(([region, count]) => (
                  <div key={region} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{region}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Cost Optimization and Edge Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Optimization */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Optimization</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Monthly Budget</span>
              <span className="font-medium">{formatCurrency(2000)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Current Spend</span>
              <span className="font-medium">{formatCurrency(metrics.costMetrics.totalCost)}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${metrics.costMetrics.budgetUtilization}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">{metrics.costMetrics.budgetUtilization}% of budget used</div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cost Trend</span>
              <span className={`font-medium ${metrics.costMetrics.trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {metrics.costMetrics.trend > 0 ? '+' : ''}{metrics.costMetrics.trend}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Optimization Recommendations</span>
              <span className="font-medium text-blue-600">{metrics.costMetrics.recommendationsCount}</span>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Cost by Service</h4>
              <div className="space-y-2">
                {Object.entries(metrics.costMetrics.costByService).map(([service, cost]) => (
                  <div key={service} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{service}</span>
                    <span className="text-sm font-medium">{formatCurrency(cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Edge Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Edge Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Requests</span>
              <span className="font-medium">{metrics.edgeMetrics.totalRequests.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cache Hit Rate</span>
              <span className="font-medium text-green-600">{metrics.edgeMetrics.cacheHitRate}%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Avg Response Time</span>
              <span className="font-medium">{metrics.edgeMetrics.averageResponseTime}ms</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Edge Locations</span>
              <span className="font-medium">{metrics.edgeMetrics.edgeLocations}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Bandwidth</span>
              <span className="font-medium">{metrics.edgeMetrics.bandwidth} TB</span>
            </div>

            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${metrics.edgeMetrics.cacheHitRate}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">Cache Hit Rate: {metrics.edgeMetrics.cacheHitRate}%</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
        {metrics.alerts.length === 0 ? (
          <p className="text-gray-500">No recent alerts</p>
        ) : (
          <div className="space-y-3">
            {metrics.alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500">{alert.region} • {alert.service}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{formatTimeAgo(alert.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}