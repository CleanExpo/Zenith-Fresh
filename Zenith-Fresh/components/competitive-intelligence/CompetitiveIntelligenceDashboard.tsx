'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  ServerStackIcon,
  SignalIcon,
  BoltIcon,
  EyeIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  DocumentChartBarIcon,
  BellIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  UserGroupIcon,
  TrophyIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

// Import sub-components
import { CompetitorOverview } from './CompetitorOverview';
import { FeatureComparison } from './FeatureComparison';

interface TabConfig {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  badge?: string;
  description: string;
}

interface CompetitiveDashboardProps {
  projectId?: string;
}

export function CompetitiveIntelligenceDashboard({ projectId }: CompetitiveDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [alertCount, setAlertCount] = useState(0);
  const [competitorCount, setCompetitorCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Auto-refresh mechanism for real-time data
  const refreshData = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Fetch alert count and competitor count for badges
      const [alertResponse, competitorResponse] = await Promise.all([
        fetch('/api/competitive-intelligence/alerts'),
        fetch(`/api/competitive-intelligence/competitors${projectId ? `?projectId=${projectId}` : ''}`)
      ]);

      if (alertResponse.ok) {
        const alertData = await alertResponse.json();
        setAlertCount(alertData.unreadAlerts || 0);
      }

      if (competitorResponse.ok) {
        const competitorData = await competitorResponse.json();
        setCompetitorCount(competitorData.total || 0);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh competitive intelligence data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, projectId]);

  useEffect(() => {
    // Initial load
    refreshData();
    
    // Set up auto-refresh every 5 minutes for competitive data
    const interval = setInterval(refreshData, 300000);
    
    return () => clearInterval(interval);
  }, [refreshData]);

  const tabs: TabConfig[] = [
    {
      id: 'overview',
      name: 'Overview',
      icon: TrophyIcon,
      component: CompetitorOverview,
      description: 'High-level competitive landscape overview',
      badge: competitorCount > 0 ? competitorCount.toString() : undefined
    },
    {
      id: 'features',
      name: 'Feature Comparison',
      icon: CheckCircleIcon,
      component: FeatureComparison,
      description: 'Compare features across competitors'
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || CompetitorOverview;
  const activeTabInfo = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Header with refresh status and summary stats */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <TrophyIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Competitive Intelligence</h1>
              <p className="text-gray-600">Monitor competitors and analyze market positioning</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Last updated:</span>
              <span className="font-medium">{lastUpdate.toLocaleTimeString()}</span>
              {isRefreshing && (
                <div className="flex items-center space-x-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span className="text-blue-600">Refreshing...</span>
                </div>
              )}
            </div>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Competitors</p>
                <p className="text-2xl font-semibold text-blue-900">{competitorCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BellIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Active Alerts</p>
                <p className="text-2xl font-semibold text-red-900">{alertCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Market Position</p>
                <p className="text-lg font-semibold text-green-900">Analyzing...</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Reports Generated</p>
                <p className="text-2xl font-semibold text-purple-900">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors relative`}
                  title={tab.description}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                  {tab.badge && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Header */}
        {activeTabInfo && (
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center space-x-3">
              <activeTabInfo.icon className="h-5 w-5 text-gray-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{activeTabInfo.name}</h2>
                <p className="text-sm text-gray-600">{activeTabInfo.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6">
          <React.Suspense 
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading competitive intelligence data...</span>
              </div>
            }
          >
            <ActiveComponent projectId={projectId} {...(ActiveComponent === CompetitorOverview ? {} : { onRefresh: refreshData })} />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}