'use client';

import { useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ChartBarIcon, UsersIcon, EyeIcon, ClockIcon } from '@heroicons/react/24/outline';

interface DateRange {
  startDate: string;
  endDate: string;
}

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '30daysAgo',
    endDate: 'today',
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'realtime' | 'acquisition' | 'pages'>('overview');

  const { summary, realtime, acquisition, pages, loading, error, refresh } = useAnalytics(
    activeTab === 'overview' ? 'summary' : activeTab,
    activeTab === 'overview' ? dateRange : undefined
  );

  const realtimeData = useAnalytics('realtime');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-red-800 font-medium">Analytics Error</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={refresh}
          className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            value={`${dateRange.startDate},${dateRange.endDate}`}
            onChange={(e) => {
              const [startDate, endDate] = e.target.value.split(',');
              setDateRange({ startDate, endDate });
            }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="7daysAgo,today">Last 7 days</option>
            <option value="30daysAgo,today">Last 30 days</option>
            <option value="90daysAgo,today">Last 90 days</option>
          </select>
          <button
            onClick={refresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalUsers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalSessions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EyeIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Page Views</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalPageViews}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(parseFloat(summary.avgSessionDuration) / 60)}m
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Real-time Widget */}
      {realtimeData.realtime && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Real-time Users</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-2xl font-bold text-gray-900">{realtimeData.activeUsers}</span>
              <span className="text-sm text-gray-500 ml-2">users online</span>
            </div>
            <div className="text-sm text-gray-500">
              {realtimeData.pageViews} page views in last 30 minutes
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'acquisition', name: 'Acquisition' },
            { id: 'pages', name: 'Top Pages' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && summary && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Bounce Rate</span>
                  <span className="font-medium">{Math.round(parseFloat(summary.bounceRate) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Conversions</span>
                  <span className="font-medium">{summary.conversions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Pages per Session</span>
                  <span className="font-medium">
                    {(parseFloat(summary.totalPageViews) / parseFloat(summary.totalSessions)).toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">User Engagement</span>
                    <span className="font-medium">Good</span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Conversion Rate</span>
                    <span className="font-medium">
                      {((parseFloat(summary.conversions) / parseFloat(summary.totalUsers)) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'acquisition' && acquisition && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Acquisition</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Channel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {acquisition.rows?.map((row: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.dimensionValues[0]?.value || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.metricValues[0]?.value || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.metricValues[1]?.value || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.metricValues[2]?.value || '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'pages' && pages && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Pages</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Page
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Page Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bounce Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pages.rows?.slice(0, 10).map((row: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="max-w-xs truncate">
                          {row.dimensionValues[0]?.value || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500 max-w-xs truncate">
                          {row.dimensionValues[1]?.value || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.metricValues[0]?.value || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.round(parseFloat(row.metricValues[1]?.value || '0') / 60)}m
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.round(parseFloat(row.metricValues[2]?.value || '0') * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}