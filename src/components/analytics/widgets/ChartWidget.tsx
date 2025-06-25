'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity,
  Download,
  Maximize2
} from 'lucide-react';

interface ChartWidgetProps {
  config: ChartConfig;
  data?: any;
  timeRange: string;
  teamId: string;
  widgetId: string;
}

interface ChartConfig {
  chartType: 'line' | 'area' | 'bar' | 'pie' | 'composed';
  metric?: string;
  metrics?: string[];
  timeframe?: string;
  title?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  breakdown?: string;
  comparison?: boolean;
  stacked?: boolean;
}

const defaultColors = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
];

const formatValue = (value: number, metric?: string): string => {
  if (metric?.includes('revenue') || metric?.includes('price')) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
  
  if (metric?.includes('rate') || metric?.includes('percentage')) {
    return `${value.toFixed(1)}%`;
  }
  
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  
  return value.toLocaleString();
};

const CustomTooltip = ({ active, payload, label, metric }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.dataKey}:</span>
            <span className="font-medium text-gray-900">
              {formatValue(entry.value, metric)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ChartWidget({ config, data, timeRange, teamId, widgetId }: ChartWidgetProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChartData();
  }, [config, timeRange, teamId]);

  const fetchChartData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        teamId,
        timeRange,
        chartType: config.chartType,
        ...(config.metric && { metric: config.metric }),
        ...(config.metrics && { metrics: config.metrics.join(',') }),
        ...(config.aggregation && { aggregation: config.aggregation }),
        ...(config.breakdown && { breakdown: config.breakdown })
      });

      const response = await fetch(`/api/analytics/charts/data?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }
      
      const result = await response.json();
      setChartData(result.data || []);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Fallback to sample data for development
      generateSampleData();
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = () => {
    const sampleData = [];
    const now = new Date();
    const days = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dataPoint: any = {
        date: timeRange === '24h' 
          ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
      
      if (config.metric) {
        dataPoint[config.metric] = Math.floor(Math.random() * 1000) + 100;
      }
      
      if (config.metrics) {
        config.metrics.forEach(metric => {
          dataPoint[metric] = Math.floor(Math.random() * 1000) + 100;
        });
      }
      
      sampleData.push(dataPoint);
    }
    
    setChartData(sampleData);
  };

  const handleExport = () => {
    // Export chart data as CSV
    const csvContent = [
      Object.keys(chartData[0] || {}).join(','),
      ...chartData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.title || 'chart'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">{error || 'No chart data available'}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchChartData}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const colors = config.colors || defaultColors;
  const showLegend = config.showLegend !== false;
  const showGrid = config.showGrid !== false;

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (config.chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => formatValue(value, config.metric)}
            />
            <Tooltip content={<CustomTooltip metric={config.metric} />} />
            {showLegend && <Legend />}
            
            {config.metric && (
              <Line
                type="monotone"
                dataKey={config.metric}
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            
            {config.metrics?.map((metric, index) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => formatValue(value, config.metric)}
            />
            <Tooltip content={<CustomTooltip metric={config.metric} />} />
            {showLegend && <Legend />}
            
            {config.metric && (
              <Area
                type="monotone"
                dataKey={config.metric}
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.3}
              />
            )}
            
            {config.metrics?.map((metric, index) => (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                stackId={config.stacked ? "1" : undefined}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => formatValue(value, config.metric)}
            />
            <Tooltip content={<CustomTooltip metric={config.metric} />} />
            {showLegend && <Legend />}
            
            {config.metric && (
              <Bar
                dataKey={config.metric}
                fill={colors[0]}
                radius={[2, 2, 0, 0]}
              />
            )}
            
            {config.metrics?.map((metric, index) => (
              <Bar
                key={metric}
                dataKey={metric}
                fill={colors[index % colors.length]}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        const pieData = chartData.map((item, index) => ({
          name: item.name || item.date,
          value: item[config.metric || 'value'] || Object.values(item)[1],
          fill: colors[index % colors.length]
        }));

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatValue(value as number, config.metric)} />
          </PieChart>
        );

      default:
        return <div>Unsupported chart type: {config.chartType}</div>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chart Controls */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          {config.aggregation && (
            <Badge variant="outline" className="text-xs">
              {config.aggregation.toUpperCase()}
            </Badge>
          )}
          {config.comparison && (
            <Badge variant="outline" className="text-xs">
              Comparison
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="h-6 w-6 p-0"
            title="Export data"
          >
            <Download className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            title="Fullscreen"
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 p-2">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}