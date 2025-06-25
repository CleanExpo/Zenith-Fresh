'use client';

import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon, 
  PlusIcon, 
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ChartBarIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface CustomMetric {
  id: string;
  name: string;
  description: string;
  query: string;
  unit: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  category: string;
  threshold?: {
    warning: number;
    critical: number;
  };
  enabled: boolean;
  currentValue: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  lastUpdated: Date;
  tags: string[];
}

interface MetricDashboard {
  id: string;
  name: string;
  description: string;
  metrics: string[]; // metric IDs
  layout: 'grid' | 'list' | 'charts';
  isDefault: boolean;
}

interface KPI {
  id: string;
  name: string;
  description: string;
  target: number;
  currentValue: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly';
  calculation: string;
  status: 'on-track' | 'at-risk' | 'off-track';
  progress: number;
  lastUpdated: Date;
}

export function CustomMetrics() {
  const [metrics, setMetrics] = useState<CustomMetric[]>([]);
  const [dashboards, setDashboards] = useState<MetricDashboard[]>([]);
  const [kpis, setKPIs] = useState<KPI[]>([]);
  const [activeTab, setActiveTab] = useState<'metrics' | 'dashboards' | 'kpis'>('metrics');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMetric, setEditingMetric] = useState<CustomMetric | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomMetrics = async () => {
      try {
        setLoading(true);
        
        // Generate mock data
        const mockMetrics = generateMockMetrics();
        const mockDashboards = generateMockDashboards();
        const mockKPIs = generateMockKPIs();
        
        setMetrics(mockMetrics);
        setDashboards(mockDashboards);
        setKPIs(mockKPIs);
      } catch (err) {
        console.error('Failed to fetch custom metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomMetrics();
  }, []);

  const generateMockMetrics = (): CustomMetric[] => {
    return [
      {
        id: 'metric-1',
        name: 'User Conversion Rate',
        description: 'Percentage of visitors who complete a desired action',
        query: 'sum(conversions) / sum(visitors) * 100',
        unit: '%',
        type: 'gauge',
        category: 'Business',
        threshold: { warning: 2.0, critical: 1.0 },
        enabled: true,
        currentValue: 3.2,
        trend: 'up',
        change: 12.5,
        lastUpdated: new Date(),
        tags: ['conversion', 'business', 'kpi']
      },
      {
        id: 'metric-2',
        name: 'API Rate Limit Violations',
        description: 'Number of requests that exceeded rate limits',
        query: 'sum(rate_limit_violations)',
        unit: 'requests',
        type: 'counter',
        category: 'Security',
        threshold: { warning: 100, critical: 500 },
        enabled: true,
        currentValue: 45,
        trend: 'down',
        change: -23.1,
        lastUpdated: new Date(),
        tags: ['security', 'rate-limiting', 'api']
      },
      {
        id: 'metric-3',
        name: 'Cache Hit Ratio',
        description: 'Percentage of requests served from cache',
        query: 'sum(cache_hits) / sum(total_requests) * 100',
        unit: '%',
        type: 'gauge',
        category: 'Performance',
        threshold: { warning: 80, critical: 70 },
        enabled: true,
        currentValue: 87.3,
        trend: 'stable',
        change: 1.2,
        lastUpdated: new Date(),
        tags: ['cache', 'performance', 'efficiency']
      },
      {
        id: 'metric-4',
        name: 'Revenue per User',
        description: 'Average revenue generated per active user',
        query: 'sum(revenue) / count(active_users)',
        unit: '$',
        type: 'gauge',
        category: 'Business',
        threshold: { warning: 25, critical: 15 },
        enabled: true,
        currentValue: 42.50,
        trend: 'up',
        change: 8.7,
        lastUpdated: new Date(),
        tags: ['revenue', 'business', 'monetization']
      },
      {
        id: 'metric-5',
        name: 'Database Query Time P99',
        description: '99th percentile of database query execution time',
        query: 'histogram_quantile(0.99, db_query_duration_seconds)',
        unit: 'ms',
        type: 'histogram',
        category: 'Performance',
        threshold: { warning: 100, critical: 200 },
        enabled: false,
        currentValue: 78.2,
        trend: 'down',
        change: -15.3,
        lastUpdated: new Date(),
        tags: ['database', 'performance', 'latency']
      }
    ];
  };

  const generateMockDashboards = (): MetricDashboard[] => {
    return [
      {
        id: 'dash-1',
        name: 'Business KPIs',
        description: 'Key business metrics and performance indicators',
        metrics: ['metric-1', 'metric-4'],
        layout: 'grid',
        isDefault: true
      },
      {
        id: 'dash-2',
        name: 'Performance Overview',
        description: 'Technical performance and system health metrics',
        metrics: ['metric-3', 'metric-5'],
        layout: 'charts',
        isDefault: false
      },
      {
        id: 'dash-3',
        name: 'Security Monitoring',
        description: 'Security-related metrics and alerts',
        metrics: ['metric-2'],
        layout: 'list',
        isDefault: false
      }
    ];
  };

  const generateMockKPIs = (): KPI[] => {
    return [
      {
        id: 'kpi-1',
        name: 'Monthly Active Users',
        description: 'Number of unique users active in the past month',
        target: 10000,
        currentValue: 8750,
        unit: 'users',
        period: 'monthly',
        calculation: 'count(distinct(user_id)) where last_activity > 30 days ago',
        status: 'on-track',
        progress: 87.5,
        lastUpdated: new Date()
      },
      {
        id: 'kpi-2',
        name: 'System Uptime',
        description: 'Percentage of time the system is operational',
        target: 99.9,
        currentValue: 99.95,
        unit: '%',
        period: 'monthly',
        calculation: 'sum(uptime_seconds) / sum(total_seconds) * 100',
        status: 'on-track',
        progress: 100,
        lastUpdated: new Date()
      },
      {
        id: 'kpi-3',
        name: 'Cost per User',
        description: 'Infrastructure cost per active user',
        target: 2.50,
        currentValue: 3.20,
        unit: '$',
        period: 'monthly',
        calculation: 'sum(infrastructure_costs) / count(active_users)',
        status: 'at-risk',
        progress: 78.1,
        lastUpdated: new Date()
      }
    ];
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'counter':
        return <ChartBarIcon className="h-4 w-4" />;
      case 'gauge':
        return <EyeIcon className="h-4 w-4" />;
      case 'histogram':
        return <ChartBarIcon className="h-4 w-4" />;
      case 'summary':
        return <ChartBarIcon className="h-4 w-4" />;
      default:
        return <Cog6ToothIcon className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') {
      return <span className="text-green-500">↗ +{change.toFixed(1)}%</span>;
    } else if (trend === 'down') {
      return <span className="text-red-500">↘ {change.toFixed(1)}%</span>;
    }
    return <span className="text-gray-500">→ {change.toFixed(1)}%</span>;
  };

  const getKPIStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'bg-green-100 text-green-800';
      case 'at-risk':
        return 'bg-yellow-100 text-yellow-800';
      case 'off-track':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const MetricCard = ({ metric }: { metric: CustomMetric }) => (
    <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="p-2 bg-blue-100 rounded-lg">
            {getMetricIcon(metric.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-sm font-medium text-gray-900">{metric.name}</h4>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                metric.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {metric.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">{metric.description}</p>
            
            <div className="flex items-center space-x-4 mb-3">
              <div className="text-2xl font-bold text-gray-900">
                {metric.currentValue.toFixed(2)}
                <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>
              </div>
              {getTrendIcon(metric.trend, metric.change)}
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {metric.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="text-xs text-gray-500">
              Category: {metric.category} • Type: {metric.type}
            </div>
          </div>
        </div>

        <div className="flex space-x-1 ml-4">
          <button
            onClick={() => setEditingMetric(metric)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-red-600">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const KPICard = ({ kpi }: { kpi: KPI }) => (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-medium text-gray-900">{kpi.name}</h4>
          <p className="text-sm text-gray-500">{kpi.description}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getKPIStatusColor(kpi.status)}`}>
          {kpi.status.replace('-', ' ').toUpperCase()}
        </span>
      </div>

      <div className="flex items-end space-x-4 mb-4">
        <div>
          <div className="text-3xl font-bold text-gray-900">
            {kpi.currentValue.toLocaleString()}
            <span className="text-lg text-gray-500 ml-1">{kpi.unit}</span>
          </div>
          <div className="text-sm text-gray-500">
            Target: {kpi.target.toLocaleString()}{kpi.unit}
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{kpi.progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              kpi.progress >= 100 ? 'bg-green-500' :
              kpi.progress >= 80 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, kpi.progress)}%` }}
          ></div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Period: {kpi.period} • Updated: {kpi.lastUpdated.toLocaleString()}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading custom metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'metrics', name: 'Custom Metrics', count: metrics.length },
            { id: 'dashboards', name: 'Dashboards', count: dashboards.length },
            { id: 'kpis', name: 'KPIs', count: kpis.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <span>{tab.name}</span>
              <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Custom Metrics</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Metric
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>

          {metrics.length === 0 && (
            <div className="text-center py-12">
              <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No custom metrics</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first custom metric.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Metric
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dashboards Tab */}
      {activeTab === 'dashboards' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Metric Dashboards</h3>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map((dashboard) => (
              <div key={dashboard.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-lg font-medium text-gray-900">{dashboard.name}</h4>
                      {dashboard.isDefault && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{dashboard.description}</p>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600">
                    {dashboard.metrics.length} metrics • {dashboard.layout} layout
                  </div>
                </div>

                <button className="w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  View Dashboard
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs Tab */}
      {activeTab === 'kpis' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Key Performance Indicators</h3>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create KPI
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi) => (
              <KPICard key={kpi.id} kpi={kpi} />
            ))}
          </div>
        </div>
      )}

      {/* Create Metric Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Custom Metric</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="e.g., User Engagement Rate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Describe what this metric measures..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Query</label>
                <textarea
                  rows={2}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm font-mono"
                  placeholder="sum(metric_name) / count(total)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                    <option value="gauge">Gauge</option>
                    <option value="counter">Counter</option>
                    <option value="histogram">Histogram</option>
                    <option value="summary">Summary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    placeholder="%, ms, count"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                  <option value="Business">Business</option>
                  <option value="Performance">Performance</option>
                  <option value="Security">Security</option>
                  <option value="Infrastructure">Infrastructure</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                Create Metric
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}