'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download,
  Maximize2,
  Thermometer
} from 'lucide-react';

interface HeatmapWidgetProps {
  config: HeatmapConfig;
  data?: any;
  timeRange: string;
  teamId: string;
  widgetId: string;
}

interface HeatmapConfig {
  type?: 'calendar' | 'matrix' | 'time';
  metric?: string;
  xAxis?: string;
  yAxis?: string;
  colorScheme?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
  showValues?: boolean;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  dateFormat?: string;
}

interface HeatmapData {
  x: string | number;
  y: string | number;
  value: number;
  label?: string;
}

const colorSchemes = {
  blue: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8'],
  green: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80', '#22C55E', '#16A34A', '#15803D'],
  red: ['#FEF2F2', '#FEE2E2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#B91C1C'],
  purple: ['#FAF5FF', '#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC', '#A855F7', '#9333EA', '#7C3AED'],
  orange: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FDBA74', '#FB923C', '#F97316', '#EA580C', '#C2410C']
};

const getColorForValue = (value: number, min: number, max: number, scheme: string[]): string => {
  if (max === min) return scheme[0];
  
  const normalized = (value - min) / (max - min);
  const index = Math.floor(normalized * (scheme.length - 1));
  return scheme[Math.min(index, scheme.length - 1)];
};

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

export default function HeatmapWidget({ config, data, timeRange, teamId, widgetId }: HeatmapWidgetProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHeatmapData();
  }, [config, timeRange, teamId]);

  const fetchHeatmapData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        teamId,
        timeRange,
        type: config.type || 'matrix',
        ...(config.metric && { metric: config.metric }),
        ...(config.xAxis && { xAxis: config.xAxis }),
        ...(config.yAxis && { yAxis: config.yAxis }),
        ...(config.aggregation && { aggregation: config.aggregation })
      });

      const response = await fetch(`/api/analytics/heatmap/data?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch heatmap data');
      }
      
      const result = await response.json();
      setHeatmapData(result.data || []);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Fallback to sample data for development
      generateSampleData();
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = () => {
    const sampleData: HeatmapData[] = [];
    
    if (config.type === 'calendar') {
      // Generate calendar heatmap data (like GitHub contributions)
      const now = new Date();
      for (let i = 0; i < 365; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        sampleData.push({
          x: date.toISOString().split('T')[0],
          y: 0,
          value: Math.floor(Math.random() * 20),
          label: date.toLocaleDateString()
        });
      }
    } else if (config.type === 'time') {
      // Generate time-based heatmap (hour x day of week)
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          sampleData.push({
            x: hour,
            y: day,
            value: Math.floor(Math.random() * 100),
            label: `${days[day]} ${hour}:00`
          });
        }
      }
    } else {
      // Generate matrix heatmap data
      const xLabels = ['Desktop', 'Mobile', 'Tablet'];
      const yLabels = ['Organic', 'Direct', 'Social', 'Email', 'Paid'];
      
      for (let x = 0; x < xLabels.length; x++) {
        for (let y = 0; y < yLabels.length; y++) {
          sampleData.push({
            x: xLabels[x],
            y: yLabels[y],
            value: Math.floor(Math.random() * 1000) + 50,
            label: `${xLabels[x]} - ${yLabels[y]}`
          });
        }
      }
    }
    
    setHeatmapData(sampleData);
  };

  const handleExport = () => {
    const csvContent = [
      'X,Y,Value,Label',
      ...heatmapData.map(item => 
        `"${item.x}","${item.y}",${item.value},"${item.label || ''}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heatmap-data-${new Date().toISOString().split('T')[0]}.csv`;
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

  if (error || heatmapData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Thermometer className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">{error || 'No heatmap data available'}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchHeatmapData}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const colorScheme = colorSchemes[config.colorScheme || 'blue'];
  const values = heatmapData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const showValues = config.showValues !== false;

  if (config.type === 'calendar') {
    return (
      <div className="h-full flex flex-col">
        {/* Controls */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Calendar Heatmap
            </Badge>
            <Badge variant="outline" className="text-xs">
              {heatmapData.length} days
            </Badge>
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

        {/* Calendar Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-53 gap-1 text-xs">
            {heatmapData.map((item, index) => (
              <div
                key={index}
                className="w-3 h-3 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: getColorForValue(item.value, minValue, maxValue, colorScheme)
                }}
                title={`${item.label}: ${formatValue(item.value, config.metric)}`}
              />
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              {colorScheme.map((color, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    );
  }

  if (config.type === 'time') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="h-full flex flex-col">
        {/* Controls */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Time Heatmap
            </Badge>
            <Badge variant="outline" className="text-xs">
              24h × 7d
            </Badge>
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
          </div>
        </div>

        {/* Time Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-25 gap-1 text-xs">
            {/* Header row */}
            <div></div>
            {hours.map(hour => (
              <div key={hour} className="text-center text-gray-500">
                {hour % 6 === 0 ? hour : ''}
              </div>
            ))}
            
            {/* Data rows */}
            {days.map((day, dayIndex) => (
              <React.Fragment key={day}>
                <div className="text-right text-gray-500 pr-2">{day}</div>
                {hours.map(hour => {
                  const dataPoint = heatmapData.find(d => d.x === hour && d.y === dayIndex);
                  const value = dataPoint?.value || 0;
                  
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="aspect-square rounded-sm cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
                      style={{
                        backgroundColor: getColorForValue(value, minValue, maxValue, colorScheme)
                      }}
                      title={`${day} ${hour}:00 - ${formatValue(value, config.metric)}`}
                    >
                      {showValues && value > 0 && (
                        <span className="text-[10px] font-medium text-white">
                          {value}
                        </span>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Matrix heatmap (default)
  const xLabels = [...new Set(heatmapData.map(d => d.x))];
  const yLabels = [...new Set(heatmapData.map(d => d.y))];

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Matrix Heatmap
          </Badge>
          <Badge variant="outline" className="text-xs">
            {xLabels.length} × {yLabels.length}
          </Badge>
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
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="space-y-1">
          {/* Header row */}
          <div className="grid gap-1 text-xs text-gray-500 text-center" style={{ gridTemplateColumns: `100px repeat(${xLabels.length}, 1fr)` }}>
            <div></div>
            {xLabels.map(label => (
              <div key={label} className="truncate">{label}</div>
            ))}
          </div>
          
          {/* Data rows */}
          {yLabels.map(yLabel => (
            <div key={yLabel} className="grid gap-1 items-center" style={{ gridTemplateColumns: `100px repeat(${xLabels.length}, 1fr)` }}>
              <div className="text-xs text-gray-500 text-right pr-2 truncate">{yLabel}</div>
              {xLabels.map(xLabel => {
                const dataPoint = heatmapData.find(d => d.x === xLabel && d.y === yLabel);
                const value = dataPoint?.value || 0;
                
                return (
                  <div
                    key={`${xLabel}-${yLabel}`}
                    className="aspect-square rounded-sm cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center min-h-[40px]"
                    style={{
                      backgroundColor: getColorForValue(value, minValue, maxValue, colorScheme)
                    }}
                    title={`${xLabel} - ${yLabel}: ${formatValue(value, config.metric)}`}
                  >
                    {showValues && (
                      <span className="text-xs font-medium text-white">
                        {formatValue(value, config.metric)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
          <span>{formatValue(minValue, config.metric)}</span>
          <div className="flex gap-1">
            {colorScheme.map((color, index) => (
              <div
                key={index}
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span>{formatValue(maxValue, config.metric)}</span>
        </div>
      </div>
    </div>
  );
}