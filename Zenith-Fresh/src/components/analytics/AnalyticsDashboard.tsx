'use client';

import React, { useState, useEffect } from 'react';
import { HistoricalAnalyticsChart } from './HistoricalAnalyticsChart';
import { ComparisonView } from './ComparisonView';
import { ExportData } from './ExportData';
import { AlertsSummary } from './AlertsSummary';

interface AnalyticsStats {
  totalAnalyses: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number;
    good: number;
    needsWork: number;
    poor: number;
  };
  performanceTrends: {
    loadTime: {
      average: number;
      trend: 'improving' | 'declining' | 'stable';
    };
    coreWebVitals: {
      lcp: number;
      fid: number;
      cls: number;
    };
    scores: {
      performance: number;
      accessibility: number;
      seo: number;
      security: number;
    };
  };
  alerts: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  timeframe: {
    earliest: string;
    latest: string;
  };
}

interface AnalyticsDashboardProps {
  projectId: string;
  url?: string;
}

export function AnalyticsDashboard({ projectId, url }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['overall_score', 'load_time', 'lcp']);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'comparison' | 'alerts'>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [projectId, url, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams({ projectId });
      
      if (url) searchParams.append('url', url);
      if (dateRange.start) searchParams.append('startDate', dateRange.start);
      if (dateRange.end) searchParams.append('endDate', dateRange.end);

      const response = await fetch(`/api/analytics?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    if (score >= 50) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <span className="text-green-600">↗️</span>;
      case 'declining':
        return <span className="text-red-600">↘️</span>;
      default:
        return <span className="text-gray-600">➡️</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          <h3 className="font-medium">Error loading analytics</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
        <p className="text-gray-600">Run some website analyses to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            <p className="text-gray-600 mt-1">
              Performance insights and trends for {url || 'all URLs'}
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex space-x-4">
            <ExportData projectId={projectId} url={url} />
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'trends', name: 'Trends' },
              { id: 'comparison', name: 'Comparison' },
              { id: 'alerts', name: 'Alerts' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.name}
                {tab.id === 'alerts' && analytics.alerts.total > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 text-xs font-medium px-2 py-1 rounded-full">
                    {analytics.alerts.total}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getScoreBgColor(analytics.averageScore)}`}>
                        <span className={`text-sm font-bold ${getScoreColor(analytics.averageScore)}`}>
                          {Math.round(analytics.averageScore)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Average Score</p>
                      <p className={`text-2xl font-semibold ${getScoreColor(analytics.averageScore)}`}>
                        {analytics.averageScore}/100
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{analytics.totalAnalyses}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Analyses</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics.totalAnalyses}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-600">
                          {Math.round(analytics.performanceTrends.loadTime.average)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Avg Load Time</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {analytics.performanceTrends.loadTime.average}ms
                        {getTrendIcon(analytics.performanceTrends.loadTime.trend)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        analytics.alerts.total === 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <span className={`text-sm font-bold ${
                          analytics.alerts.total === 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {analytics.alerts.total}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Active Alerts</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics.alerts.total}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Distribution */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Score Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analytics.scoreDistribution).map(([category, count]) => (
                    <div key={category} className="text-center">
                      <div className={`text-3xl font-bold ${
                        category === 'excellent' ? 'text-green-600' :
                        category === 'good' ? 'text-blue-600' :
                        category === 'needsWork' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {count}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {category === 'needsWork' ? 'Needs Work' : category}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Core Web Vitals Summary */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Core Web Vitals Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.performanceTrends.coreWebVitals.lcp}ms
                    </div>
                    <div className="text-sm text-gray-500">Largest Contentful Paint</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.performanceTrends.coreWebVitals.fid}ms
                    </div>
                    <div className="text-sm text-gray-500">First Input Delay</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics.performanceTrends.coreWebVitals.cls}
                    </div>
                    <div className="text-sm text-gray-500">Cumulative Layout Shift</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metrics</label>
                  <select
                    multiple
                    value={selectedMetrics}
                    onChange={(e) => setSelectedMetrics(Array.from(e.target.selectedOptions, option => option.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="overall_score">Overall Score</option>
                    <option value="load_time">Load Time</option>
                    <option value="lcp">LCP</option>
                    <option value="fid">FID</option>
                    <option value="cls">CLS</option>
                    <option value="performance_score">Performance Score</option>
                    <option value="accessibility_score">Accessibility Score</option>
                    <option value="seo_score">SEO Score</option>
                    <option value="security_score">Security Score</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as any)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Chart */}
              <HistoricalAnalyticsChart
                projectId={projectId}
                url={url}
                metrics={selectedMetrics}
                period={selectedPeriod}
                height={500}
              />
            </div>
          )}

          {/* Comparison Tab */}
          {activeTab === 'comparison' && (
            <ComparisonView projectId={projectId} url={url} />
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <AlertsSummary projectId={projectId} url={url} />
          )}
        </div>
      </div>
    </div>
  );
}