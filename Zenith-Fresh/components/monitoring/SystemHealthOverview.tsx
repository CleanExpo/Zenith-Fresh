'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ServerIcon,
  CircleStackIcon,
  GlobeAltIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  alerts: Array<{
    level: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: number;
  }>;
}

interface SystemMetrics {
  overview: {
    status: string;
    healthScore: number;
    uptime: string;
    lastUpdate: string;
  };
  traffic: {
    requestsPerMinute: number;
    totalRequests: number;
    errorRate: number;
    activeUsers: number;
  };
  performance: {
    averageResponseTime: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
  alerts: Array<{
    level: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: number;
  }>;
}

interface ServiceHealth {
  database: {
    status: 'healthy' | 'warning' | 'unhealthy';
    responseTime?: number;
    message: string;
  };
  redis: {
    status: 'healthy' | 'warning' | 'unhealthy';
    message: string;
  };
  memory: {
    status: 'healthy' | 'warning' | 'unhealthy';
    usage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    limit: string;
    message: string;
  };
  disk: {
    status: 'healthy' | 'warning' | 'unhealthy';
    message: string;
  };
}

export function SystemHealthOverview() {
  const [healthData, setHealthData] = useState<SystemMetrics | null>(null);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        setLoading(true);
        
        // Fetch system overview metrics
        const [overviewResponse, healthResponse] = await Promise.all([
          fetch('/api/system-monitor?endpoint=overview'),
          fetch('/api/health')
        ]);

        if (overviewResponse.ok) {
          const overviewData = await overviewResponse.json();
          setHealthData(overviewData);
        }

        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          setServiceHealth(healthData.checks);
        }

        setError(null);
      } catch (err) {
        console.error('Failed to fetch health data:', err);
        setError('Failed to load system health data');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'critical':
      case 'unhealthy':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <CheckCircleIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
      case 'unhealthy':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatBytes = (bytes: number) => {
    return `${bytes}MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading system health...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <XCircleIcon className="h-6 w-6 text-red-500" />
          <h3 className="ml-3 text-lg font-medium text-red-800">Error Loading Health Data</h3>
        </div>
        <p className="mt-2 text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall System Status */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`rounded-lg border p-6 ${getStatusColor(healthData.overview.status)}`}>
            <div className="flex items-center">
              {getStatusIcon(healthData.overview.status)}
              <div className="ml-3">
                <p className="text-sm font-medium">Overall Status</p>
                <p className="text-2xl font-semibold capitalize">{healthData.overview.status}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm">Health Score: {healthData.overview.healthScore}/100</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    healthData.overview.healthScore > 80 ? 'bg-green-500' :
                    healthData.overview.healthScore > 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${healthData.overview.healthScore}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <GlobeAltIcon className="h-6 w-6 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-2xl font-semibold">{healthData.overview.uptime}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Current uptime percentage</p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <ServerIcon className="h-6 w-6 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Requests/Min</p>
                <p className="text-2xl font-semibold">{healthData.traffic.requestsPerMinute}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Active request rate</p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <CpuChipIcon className="h-6 w-6 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className="text-2xl font-semibold">{healthData.performance.averageResponseTime}ms</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Average response time</p>
          </div>
        </div>
      )}

      {/* Service Health Status */}
      {serviceHealth && (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Service Health</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Database */}
              <div className="flex items-start space-x-3">
                <CircleStackIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(serviceHealth.database.status)}
                    <p className="text-sm font-medium text-gray-900">Database</p>
                  </div>
                  <p className="text-sm text-gray-500">{serviceHealth.database.message}</p>
                  {serviceHealth.database.responseTime && (
                    <p className="text-xs text-gray-400">Response time: {serviceHealth.database.responseTime}ms</p>
                  )}
                </div>
              </div>

              {/* Redis */}
              <div className="flex items-start space-x-3">
                <ServerIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(serviceHealth.redis.status)}
                    <p className="text-sm font-medium text-gray-900">Redis Cache</p>
                  </div>
                  <p className="text-sm text-gray-500">{serviceHealth.redis.message}</p>
                </div>
              </div>

              {/* Memory */}
              <div className="flex items-start space-x-3">
                <CpuChipIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(serviceHealth.memory.status)}
                    <p className="text-sm font-medium text-gray-900">Memory</p>
                  </div>
                  <p className="text-sm text-gray-500">{serviceHealth.memory.message}</p>
                  <div className="mt-1 text-xs text-gray-400 space-y-1">
                    <div>Heap Used: {formatBytes(serviceHealth.memory.usage.heapUsed)}</div>
                    <div>Heap Total: {formatBytes(serviceHealth.memory.usage.heapTotal)}</div>
                    <div>RSS: {formatBytes(serviceHealth.memory.usage.rss)}</div>
                  </div>
                </div>
              </div>

              {/* Disk */}
              <div className="flex items-start space-x-3">
                <ServerIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(serviceHealth.disk.status)}
                    <p className="text-sm font-medium text-gray-900">Disk Storage</p>
                  </div>
                  <p className="text-sm text-gray-500">{serviceHealth.disk.message}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      {healthData && healthData.alerts && healthData.alerts.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {healthData.alerts.slice(0, 5).map((alert, index) => (
                <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
                  alert.level === 'critical' ? 'bg-red-50 border border-red-200' :
                  alert.level === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  {getStatusIcon(alert.level === 'critical' ? 'critical' : alert.level === 'warning' ? 'warning' : 'healthy')}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Summary */}
      {healthData && (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Performance Summary</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{healthData.performance.cpuUsage}%</p>
                <p className="text-sm text-gray-500">CPU Usage</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{healthData.performance.memoryUsage}%</p>
                <p className="text-sm text-gray-500">Memory Usage</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{healthData.traffic.totalRequests}</p>
                <p className="text-sm text-gray-500">Total Requests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{healthData.traffic.activeUsers}</p>
                <p className="text-sm text-gray-500">Active Users</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}