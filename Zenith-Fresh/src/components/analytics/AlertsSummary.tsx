'use client';

import React, { useState, useEffect } from 'react';

interface Alert {
  id: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  currentValue?: number;
  previousValue?: number;
  threshold?: number;
  isResolved: boolean;
  createdAt: string;
  websiteAnalysis: {
    url: string;
    createdAt: string;
  };
}

interface AlertsSummary {
  total: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  recent: Alert[];
}

interface AlertsSummaryProps {
  projectId: string;
  url?: string;
}

export function AlertsSummary({ projectId, url }: AlertsSummaryProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    severity: '',
    category: '',
    resolved: 'false',
  });

  useEffect(() => {
    fetchAlerts();
  }, [projectId, url, filter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      // For this example, we'll simulate the API call
      // In a real implementation, you'd have an alerts API endpoint
      const response = await fetch(`/api/analytics?projectId=${projectId}${url ? `&url=${url}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const data = await response.json();
      
      // Simulate alerts data based on analytics
      const simulatedAlerts = generateSimulatedAlerts(data.analytics);
      setAlerts(simulatedAlerts);
      setSummary(calculateSummary(simulatedAlerts));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const generateSimulatedAlerts = (analytics: any): Alert[] => {
    if (!analytics) return [];

    const alerts: Alert[] = [];
    const baseDate = new Date();

    // Generate alerts based on analytics data
    if (analytics.averageScore < 50) {
      alerts.push({
        id: '1',
        alertType: 'critical_score',
        severity: 'critical',
        category: 'performance',
        title: 'Critical Performance Score',
        description: `Overall performance score (${analytics.averageScore}) is critically low`,
        currentValue: analytics.averageScore,
        threshold: 50,
        isResolved: false,
        createdAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        websiteAnalysis: {
          url: url || 'https://example.com',
          createdAt: new Date().toISOString(),
        },
      });
    }

    if (analytics.performanceTrends.loadTime.average > 3000) {
      alerts.push({
        id: '2',
        alertType: 'slow_loading',
        severity: 'high',
        category: 'performance',
        title: 'Slow Page Load Time',
        description: `Average load time (${analytics.performanceTrends.loadTime.average}ms) exceeds recommended threshold`,
        currentValue: analytics.performanceTrends.loadTime.average,
        threshold: 3000,
        isResolved: false,
        createdAt: new Date(baseDate.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        websiteAnalysis: {
          url: url || 'https://example.com',
          createdAt: new Date().toISOString(),
        },
      });
    }

    if (analytics.performanceTrends.coreWebVitals.lcp > 2500) {
      alerts.push({
        id: '3',
        alertType: 'cwv_threshold',
        severity: 'high',
        category: 'core-web-vitals',
        title: 'Poor Largest Contentful Paint',
        description: `LCP (${analytics.performanceTrends.coreWebVitals.lcp}ms) exceeds recommended threshold`,
        currentValue: analytics.performanceTrends.coreWebVitals.lcp,
        threshold: 2500,
        isResolved: false,
        createdAt: new Date(baseDate.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        websiteAnalysis: {
          url: url || 'https://example.com',
          createdAt: new Date().toISOString(),
        },
      });
    }

    if (analytics.performanceTrends.scores.accessibility < 70) {
      alerts.push({
        id: '4',
        alertType: 'new_issue',
        severity: 'medium',
        category: 'accessibility',
        title: 'Accessibility Issues Detected',
        description: `Accessibility score (${analytics.performanceTrends.scores.accessibility}) indicates potential issues`,
        currentValue: analytics.performanceTrends.scores.accessibility,
        threshold: 70,
        isResolved: false,
        createdAt: new Date(baseDate.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        websiteAnalysis: {
          url: url || 'https://example.com',
          createdAt: new Date().toISOString(),
        },
      });
    }

    if (analytics.performanceTrends.scores.seo < 70) {
      alerts.push({
        id: '5',
        alertType: 'new_issue',
        severity: 'medium',
        category: 'seo',
        title: 'SEO Issues Detected',
        description: `SEO score (${analytics.performanceTrends.scores.seo}) indicates optimization opportunities`,
        currentValue: analytics.performanceTrends.scores.seo,
        threshold: 70,
        isResolved: false,
        createdAt: new Date(baseDate.getTime() - 10 * 60 * 60 * 1000).toISOString(),
        websiteAnalysis: {
          url: url || 'https://example.com',
          createdAt: new Date().toISOString(),
        },
      });
    }

    return alerts.filter(alert => {
      if (filter.severity && alert.severity !== filter.severity) return false;
      if (filter.category && alert.category !== filter.category) return false;
      if (filter.resolved === 'true' && !alert.isResolved) return false;
      if (filter.resolved === 'false' && alert.isResolved) return false;
      return true;
    });
  };

  const calculateSummary = (alertsData: Alert[]): AlertsSummary => {
    const bySeverity = alertsData.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = alertsData.reduce((acc, alert) => {
      acc[alert.category] = (acc[alert.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: alertsData.length,
      bySeverity,
      byCategory,
      recent: alertsData.slice(0, 5),
    };
  };

  const resolveAlert = async (alertId: string) => {
    try {
      // In a real implementation, this would call an API to resolve the alert
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isResolved: true } : alert
      ));
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100';
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'security':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'accessibility':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'seo':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.898-.833-2.664 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading alerts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          <h3 className="font-medium">Error loading alerts</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={filter.severity}
              onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filter.category}
              onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="performance">Performance</option>
              <option value="security">Security</option>
              <option value="accessibility">Accessibility</option>
              <option value="seo">SEO</option>
              <option value="core-web-vitals">Core Web Vitals</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter.resolved}
              onChange={(e) => setFilter(prev => ({ ...prev, resolved: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="false">Active</option>
              <option value="true">Resolved</option>
              <option value="">All</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(summary.bySeverity).map(([severity, count]) => (
            <div key={severity} className="bg-white border rounded-lg p-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  severity === 'critical' ? 'bg-red-500' :
                  severity === 'high' ? 'bg-red-400' :
                  severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-500 capitalize">{severity}</p>
                  <p className="text-lg font-semibold text-gray-900">{count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerts List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Active Alerts ({alerts.length})
          </h3>
        </div>
        
        {alerts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-green-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-600">Your website is performing well with no active alerts.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 p-1 rounded ${getSeverityColor(alert.severity)}`}>
                      {getCategoryIcon(alert.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-2 space-x-4">
                        <span>URL: {alert.websiteAnalysis.url}</span>
                        <span>{formatTimeAgo(alert.createdAt)}</span>
                        {alert.currentValue && (
                          <span>Current: {alert.currentValue}</span>
                        )}
                        {alert.threshold && (
                          <span>Threshold: {alert.threshold}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {!alert.isResolved && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}