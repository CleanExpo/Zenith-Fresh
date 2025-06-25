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
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { SystemHealthOverview } from './SystemHealthOverview';
import { RealTimeMetrics } from './RealTimeMetrics';
import { AlertManagement } from './AlertManagement';
import { PerformanceCharts } from './PerformanceCharts';
import { UserActivityTracker } from './UserActivityTracker';
import { ResourceMonitoring } from './ResourceMonitoring';
import { UptimeStatus } from './UptimeStatus';
import { OptimizationRecommendations } from './OptimizationRecommendations';
import { CustomMetrics } from './CustomMetrics';
import { CapacityPlanning } from './CapacityPlanning';

interface TabConfig {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  badge?: string;
}

export function PerformanceMonitoringDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [alertCount, setAlertCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Auto-refresh mechanism
  const refreshData = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Fetch alert count for badge
      const alertResponse = await fetch('/api/monitoring/alerts');
      if (alertResponse.ok) {
        const alertData = await alertResponse.json();
        setAlertCount(alertData.activeAlerts || 0);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh monitoring data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    // Initial load
    refreshData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    
    return () => clearInterval(interval);
  }, [refreshData]);

  const tabs: TabConfig[] = [
    {
      id: 'overview',
      name: 'System Health',
      icon: CheckCircleIcon,
      component: SystemHealthOverview
    },
    {
      id: 'realtime',
      name: 'Real-time Metrics',
      icon: SignalIcon,
      component: RealTimeMetrics
    },
    {
      id: 'alerts',
      name: 'Alerts',
      icon: ExclamationTriangleIcon,
      component: AlertManagement,
      badge: alertCount > 0 ? alertCount.toString() : undefined
    },
    {
      id: 'performance',
      name: 'Performance',
      icon: ChartBarIcon,
      component: PerformanceCharts
    },
    {
      id: 'users',
      name: 'User Activity',
      icon: EyeIcon,
      component: UserActivityTracker
    },
    {
      id: 'resources',
      name: 'Resources',
      icon: CpuChipIcon,
      component: ResourceMonitoring
    },
    {
      id: 'uptime',
      name: 'Uptime',
      icon: ClockIcon,
      component: UptimeStatus
    },
    {
      id: 'optimization',
      name: 'Optimization',
      icon: BoltIcon,
      component: OptimizationRecommendations
    },
    {
      id: 'custom',
      name: 'Custom Metrics',
      icon: Cog6ToothIcon,
      component: CustomMetrics
    },
    {
      id: 'capacity',
      name: 'Capacity Planning',
      icon: ServerStackIcon,
      component: CapacityPlanning
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || SystemHealthOverview;

  return (
    <div className="space-y-6">
      {/* Header with refresh status */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Monitoring Dashboard</h2>
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
          </div>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
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

        {/* Tab Content */}
        <div className="p-6">
          <React.Suspense 
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading monitoring data...</span>
              </div>
            }
          >
            <ActiveComponent />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}