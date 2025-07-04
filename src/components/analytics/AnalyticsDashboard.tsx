'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Grid3X3, 
  Plus, 
  Settings, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  Clock,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import DashboardGrid from './DashboardGrid';
import WidgetLibrary from './WidgetLibrary';
import KPIWidget from './widgets/KPIWidget';
import ChartWidget from './widgets/ChartWidget';
import TableWidget from './widgets/TableWidget';
import FunnelWidget from './widgets/FunnelWidget';

interface AnalyticsDashboardProps {
  teamId: string;
  dashboardId?: string;
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  widgets: Widget[];
  layout: GridLayout;
  lastUpdated: string;
}

interface Widget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'funnel' | 'heatmap' | 'map';
  title: string;
  description?: string;
  config: any;
  dataSource: string;
  position: { x: number; y: number; w: number; h: number };
  refreshRate?: number;
  data?: any;
}

interface GridLayout {
  columns: number;
  rowHeight: number;
  margin: [number, number];
}

const defaultKPIs = [
  {
    id: 'total-users',
    type: 'kpi' as const,
    title: 'Total Users',
    value: 12453,
    change: 12.5,
    trend: 'up' as const,
    timeframe: '30 days'
  },
  {
    id: 'revenue',
    type: 'kpi' as const,
    title: 'Revenue',
    value: 89230,
    change: 8.2,
    trend: 'up' as const,
    timeframe: '30 days',
    format: 'currency'
  },
  {
    id: 'conversion-rate',
    type: 'kpi' as const,
    title: 'Conversion Rate',
    value: 3.2,
    change: -0.5,
    trend: 'down' as const,
    timeframe: '30 days',
    format: 'percentage'
  },
  {
    id: 'active-sessions',
    type: 'kpi' as const,
    title: 'Active Sessions',
    value: 847,
    change: 15.3,
    trend: 'up' as const,
    timeframe: 'Real-time'
  }
];

export default function AnalyticsDashboard({ teamId, dashboardId }: AnalyticsDashboardProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [teamId, dashboardId]);

  useEffect(() => {
    if (autoRefresh && dashboard) {
      const interval = setInterval(() => {
        refreshData();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, dashboard]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(
        `/api/analytics/dashboards/${dashboardId || 'default'}?teamId=${teamId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setDashboard(data.dashboard);
      } else {
        // Create default dashboard if none exists
        await createDefaultDashboard();
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultDashboard = async () => {
    const defaultDashboard: Dashboard = {
      id: 'default',
      name: 'Overview Dashboard',
      description: 'Key metrics and insights overview',
      isDefault: true,
      widgets: [
        {
          id: 'kpi-grid',
          type: 'kpi',
          title: 'Key Performance Indicators',
          config: { kpis: defaultKPIs },
          dataSource: 'metrics',
          position: { x: 0, y: 0, w: 12, h: 2 }
        },
        {
          id: 'user-growth',
          type: 'chart',
          title: 'User Growth',
          config: { 
            chartType: 'line',
            metric: 'users',
            timeframe: '30d'
          },
          dataSource: 'metrics',
          position: { x: 0, y: 2, w: 6, h: 4 }
        },
        {
          id: 'revenue-chart',
          type: 'chart',
          title: 'Revenue Trends',
          config: { 
            chartType: 'area',
            metric: 'revenue',
            timeframe: '30d'
          },
          dataSource: 'metrics',
          position: { x: 6, y: 2, w: 6, h: 4 }
        },
        {
          id: 'conversion-funnel',
          type: 'funnel',
          title: 'Conversion Funnel',
          config: {
            steps: [
              { name: 'Visitors', value: 10000 },
              { name: 'Sign Ups', value: 1200 },
              { name: 'Trials', value: 800 },
              { name: 'Customers', value: 320 }
            ]
          },
          dataSource: 'events',
          position: { x: 0, y: 6, w: 8, h: 4 }
        },
        {
          id: 'top-pages',
          type: 'table',
          title: 'Top Pages',
          config: {
            columns: ['Page', 'Views', 'Time on Page'],
            limit: 10
          },
          dataSource: 'events',
          position: { x: 8, y: 6, w: 4, h: 4 }
        }
      ],
      layout: {
        columns: 12,
        rowHeight: 60,
        margin: [16, 16]
      },
      lastUpdated: new Date().toISOString()
    };

    setDashboard(defaultDashboard);
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      // Refresh widget data
      if (dashboard) {
        const updatedWidgets = await Promise.all(
          dashboard.widgets.map(async (widget) => {
            const response = await fetch(
              `/api/analytics/widgets/${widget.id}/data?teamId=${teamId}&timeRange=${timeRange}`
            );
            if (response.ok) {
              const data = await response.json();
              return { ...widget, data: data.data };
            }
            return widget;
          })
        );

        setDashboard({
          ...dashboard,
          widgets: updatedWidgets,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddWidget = (widgetConfig: any) => {
    if (!dashboard) return;

    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      ...widgetConfig,
      position: { x: 0, y: 0, w: 6, h: 4 } // Default position
    };

    setDashboard({
      ...dashboard,
      widgets: [...dashboard.widgets, newWidget],
      lastUpdated: new Date().toISOString()
    });

    setShowWidgetLibrary(false);
  };

  const handleLayoutChange = (layout: any[]) => {
    if (!dashboard) return;

    const updatedWidgets = dashboard.widgets.map(widget => {
      const layoutItem = layout.find(item => item.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        };
      }
      return widget;
    });

    setDashboard({
      ...dashboard,
      widgets: updatedWidgets,
      lastUpdated: new Date().toISOString()
    });
  };

  const saveDashboard = async () => {
    if (!dashboard) return;

    try {
      const response = await fetch(`/api/analytics/dashboards/${dashboard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dashboard,
          teamId
        })
      });

      if (response.ok) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving dashboard:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Dashboard Found</h3>
        <p className="text-gray-600 mb-4">Create your first dashboard to get started</p>
        <Button onClick={createDefaultDashboard}>
          <Plus className="w-4 h-4 mr-2" />
          Create Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dashboard.name}</h1>
          {dashboard.description && (
            <p className="text-gray-600 mt-1">{dashboard.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Last updated: {new Date(dashboard.lastUpdated).toLocaleString()}
            </span>
            {autoRefresh && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                Auto-refresh enabled
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          {/* Auto-refresh Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'text-green-600 border-green-200' : ''}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto-refresh
          </Button>

          {/* Manual Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Edit Mode Toggle */}
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Settings className="w-4 h-4 mr-2" />
            {isEditing ? 'Save' : 'Edit'}
          </Button>

          {/* Add Widget */}
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWidgetLibrary(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Widget
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard Grid */}
      <DashboardGrid
        widgets={dashboard.widgets}
        layout={dashboard.layout}
        isEditing={isEditing}
        onLayoutChange={handleLayoutChange}
        timeRange={timeRange}
        teamId={teamId}
      />

      {/* Widget Library Modal */}
      {showWidgetLibrary && (
        <WidgetLibrary
          onAddWidget={handleAddWidget}
          onClose={() => setShowWidgetLibrary(false)}
          teamId={teamId}
        />
      )}

      {/* Save Changes */}
      {isEditing && (
        <div className="fixed bottom-6 right-6 bg-white shadow-lg rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Unsaved changes</span>
            <Button size="sm" onClick={saveDashboard}>
              Save Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}