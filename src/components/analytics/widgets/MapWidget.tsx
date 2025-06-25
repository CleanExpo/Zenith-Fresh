'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download,
  Maximize2,
  MapPin,
  Globe
} from 'lucide-react';

interface MapWidgetProps {
  config: MapConfig;
  data?: any;
  timeRange: string;
  teamId: string;
  widgetId: string;
}

interface MapConfig {
  type?: 'world' | 'country' | 'region';
  metric?: string;
  colorScheme?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
  showValues?: boolean;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  countryCode?: string;
  region?: string;
}

interface MapData {
  location: string;
  locationCode: string;
  value: number;
  percentage?: number;
  coordinates?: [number, number];
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

export default function MapWidget({ config, data, timeRange, teamId, widgetId }: MapWidgetProps) {
  const [mapData, setMapData] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMapData();
  }, [config, timeRange, teamId]);

  const fetchMapData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        teamId,
        timeRange,
        type: config.type || 'world',
        ...(config.metric && { metric: config.metric }),
        ...(config.aggregation && { aggregation: config.aggregation }),
        ...(config.countryCode && { countryCode: config.countryCode }),
        ...(config.region && { region: config.region })
      });

      const response = await fetch(`/api/analytics/map/data?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch map data');
      }
      
      const result = await response.json();
      setMapData(result.data || []);
    } catch (error) {
      console.error('Error fetching map data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Fallback to sample data for development
      generateSampleData();
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = () => {
    const sampleData: MapData[] = [
      { location: 'United States', locationCode: 'US', value: 15420, percentage: 35.2 },
      { location: 'United Kingdom', locationCode: 'GB', value: 8950, percentage: 20.4 },
      { location: 'Germany', locationCode: 'DE', value: 6730, percentage: 15.3 },
      { location: 'Canada', locationCode: 'CA', value: 4210, percentage: 9.6 },
      { location: 'France', locationCode: 'FR', value: 3890, percentage: 8.9 },
      { location: 'Australia', locationCode: 'AU', value: 2450, percentage: 5.6 },
      { location: 'Netherlands', locationCode: 'NL', value: 1650, percentage: 3.8 },
      { location: 'Brazil', locationCode: 'BR', value: 1200, percentage: 2.7 },
      { location: 'Japan', locationCode: 'JP', value: 980, percentage: 2.2 },
      { location: 'India', locationCode: 'IN', value: 750, percentage: 1.7 }
    ];
    
    setMapData(sampleData);
  };

  const handleExport = () => {
    const csvContent = [
      'Location,Code,Value,Percentage',
      ...mapData.map(item => 
        `"${item.location}","${item.locationCode}",${item.value},${item.percentage || 0}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `map-data-${new Date().toISOString().split('T')[0]}.csv`;
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

  if (error || mapData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Globe className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">{error || 'No map data available'}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMapData}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const colorScheme = colorSchemes[config.colorScheme || 'blue'];
  const values = mapData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const totalValue = values.reduce((sum, value) => sum + value, 0);

  // Sort data by value for better visualization
  const sortedData = [...mapData].sort((a, b) => b.value - a.value);

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {config.type === 'world' ? 'World Map' : 
             config.type === 'country' ? 'Country Map' : 'Regional Map'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {mapData.length} locations
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

      {/* Map Visualization */}
      <div className="flex-1 flex">
        {/* Simplified World Map Representation */}
        <div className="flex-1 p-4 relative bg-gray-50">
          <div className="text-center text-gray-500 py-8">
            <Globe className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-sm mb-2">Interactive map visualization</p>
            <p className="text-xs text-gray-400">
              This would contain an interactive world map with color-coded regions
            </p>
          </div>
          
          {/* Placeholder for interactive map */}
          <div className="absolute inset-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Map Component</p>
              <p className="text-xs text-gray-400">
                Integration with mapping library (Leaflet, Google Maps, etc.)
              </p>
            </div>
          </div>
        </div>

        {/* Data Panel */}
        <div className="w-80 border-l bg-white">
          {/* Top Locations */}
          <div className="p-4 border-b">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Top Locations</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sortedData.slice(0, 10).map((item, index) => (
                <div key={item.locationCode} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getColorForValue(item.value, minValue, maxValue, colorScheme)
                      }}
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.location}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.locationCode}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatValue(item.value, config.metric)}
                    </div>
                    {item.percentage && (
                      <div className="text-xs text-gray-500">
                        {item.percentage.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className="p-4 border-b">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Statistics</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total</span>
                <span className="font-medium">{formatValue(totalValue, config.metric)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Locations</span>
                <span className="font-medium">{mapData.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Top Location</span>
                <span className="font-medium">{sortedData[0]?.location}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Average</span>
                <span className="font-medium">
                  {formatValue(totalValue / mapData.length, config.metric)}
                </span>
              </div>
            </div>
          </div>

          {/* Color Legend */}
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{formatValue(minValue, config.metric)}</span>
                <span>{formatValue(maxValue, config.metric)}</span>
              </div>
              <div className="flex h-4 rounded overflow-hidden">
                {colorScheme.map((color, index) => (
                  <div
                    key={index}
                    className="flex-1"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}