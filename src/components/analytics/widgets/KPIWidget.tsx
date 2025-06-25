'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Activity, 
  Target,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface KPIWidgetProps {
  config: KPIConfig;
  data?: any;
  timeRange: string;
  teamId: string;
  widgetId: string;
}

interface KPIConfig {
  kpis?: KPI[];
  layout?: 'grid' | 'list';
  showTrends?: boolean;
  showComparison?: boolean;
}

interface KPI {
  id: string;
  type: 'kpi';
  title: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
  timeframe?: string;
  format?: 'number' | 'currency' | 'percentage';
  target?: number;
  icon?: string;
  color?: string;
  description?: string;
}

const iconMap = {
  users: Users,
  revenue: DollarSign,
  activity: Activity,
  target: Target,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown
};

const formatValue = (value: number, format: string = 'number'): string => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    
    case 'percentage':
      return `${value.toFixed(1)}%`;
    
    case 'number':
    default:
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
  }
};

const getTrendIcon = (trend: string, change: number) => {
  if (trend === 'up' || change > 0) {
    return <ArrowUp className="w-3 h-3" />;
  } else if (trend === 'down' || change < 0) {
    return <ArrowDown className="w-3 h-3" />;
  }
  return <Minus className="w-3 h-3" />;
};

const getTrendColor = (trend: string, change: number) => {
  if (trend === 'up' || change > 0) {
    return 'text-green-600';
  } else if (trend === 'down' || change < 0) {
    return 'text-red-600';
  }
  return 'text-gray-600';
};

export default function KPIWidget({ config, data, timeRange, teamId, widgetId }: KPIWidgetProps) {
  const [kpis, setKpis] = useState<KPI[]>(config.kpis || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!config.kpis || config.kpis.length === 0) {
      fetchKPIData();
    }
  }, [timeRange, teamId]);

  const fetchKPIData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/kpis?teamId=${teamId}&timeRange=${timeRange}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setKpis(data.kpis || []);
      }
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && kpis.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (kpis.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No KPI data available</p>
        </div>
      </div>
    );
  }

  const layout = config.layout || 'grid';
  const showTrends = config.showTrends !== false;
  const showComparison = config.showComparison !== false;

  if (layout === 'list') {
    return (
      <div className="p-4 space-y-3 h-full overflow-y-auto">
        {kpis.map((kpi) => {
          const IconComponent = iconMap[kpi.icon as keyof typeof iconMap] || Activity;
          const trendColor = getTrendColor(kpi.trend || '', kpi.change || 0);
          
          return (
            <div key={kpi.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.color || 'bg-blue-100'}`}>
                  <IconComponent className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{kpi.title}</h4>
                  {kpi.description && (
                    <p className="text-xs text-gray-500">{kpi.description}</p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {formatValue(kpi.value, kpi.format)}
                </div>
                {showTrends && kpi.change !== undefined && (
                  <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
                    {getTrendIcon(kpi.trend || '', kpi.change)}
                    {Math.abs(kpi.change)}%
                    {kpi.timeframe && (
                      <span className="text-gray-500">({kpi.timeframe})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Grid layout
  const gridCols = kpis.length === 1 ? 'grid-cols-1' : 
                  kpis.length === 2 ? 'grid-cols-2' : 
                  kpis.length === 3 ? 'grid-cols-3' : 
                  'grid-cols-2';

  return (
    <div className={`p-4 grid ${gridCols} gap-4 h-full`}>
      {kpis.map((kpi) => {
        const IconComponent = iconMap[kpi.icon as keyof typeof iconMap] || Activity;
        const trendColor = getTrendColor(kpi.trend || '', kpi.change || 0);
        const targetPercentage = kpi.target ? (kpi.value / kpi.target) * 100 : null;
        
        return (
          <Card key={kpi.id} className="p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-lg ${kpi.color || 'bg-blue-100'}`}>
                <IconComponent className="w-4 h-4 text-blue-600" />
              </div>
              {showTrends && kpi.change !== undefined && (
                <Badge 
                  variant="outline" 
                  className={`${trendColor} border-current`}
                >
                  <span className="flex items-center gap-1">
                    {getTrendIcon(kpi.trend || '', kpi.change)}
                    {Math.abs(kpi.change)}%
                  </span>
                </Badge>
              )}
            </div>
            
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatValue(kpi.value, kpi.format)}
              </div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">
                {kpi.title}
              </h4>
              
              {kpi.description && (
                <p className="text-xs text-gray-500 mb-2">
                  {kpi.description}
                </p>
              )}
              
              {showComparison && kpi.timeframe && (
                <p className="text-xs text-gray-500">
                  vs {kpi.timeframe}
                </p>
              )}
              
              {kpi.target && targetPercentage && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Target Progress</span>
                    <span>{targetPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        targetPercentage >= 100 ? 'bg-green-500' : 
                        targetPercentage >= 75 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(targetPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}