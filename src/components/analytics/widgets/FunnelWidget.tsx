'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingDown,
  Users,
  ArrowDown,
  ChevronRight,
  Download
} from 'lucide-react';

interface FunnelWidgetProps {
  config: FunnelConfig;
  data?: any;
  timeRange: string;
  teamId: string;
  widgetId: string;
}

interface FunnelConfig {
  steps?: FunnelStep[];
  showConversionRates?: boolean;
  showDropOffRates?: boolean;
  orientation?: 'vertical' | 'horizontal';
  colors?: string[];
  metric?: string;
  comparison?: boolean;
  target?: number;
}

interface FunnelStep {
  name: string;
  value: number;
  target?: number;
  color?: string;
  description?: string;
}

const defaultColors = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
];

const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
};

export default function FunnelWidget({ config, data, timeRange, teamId, widgetId }: FunnelWidgetProps) {
  const [funnelData, setFunnelData] = useState<FunnelStep[]>(config.steps || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config.steps || config.steps.length === 0) {
      fetchFunnelData();
    }
  }, [config, timeRange, teamId]);

  const fetchFunnelData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        teamId,
        timeRange,
        ...(config.metric && { metric: config.metric })
      });

      const response = await fetch(`/api/analytics/funnel/data?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch funnel data');
      }
      
      const result = await response.json();
      setFunnelData(result.data || []);
    } catch (error) {
      console.error('Error fetching funnel data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Fallback to sample data for development
      generateSampleData();
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = () => {
    const sampleSteps: FunnelStep[] = [
      { name: 'Website Visitors', value: 10000, description: 'Total unique visitors' },
      { name: 'Sign Up Started', value: 1200, description: 'Users who started registration' },
      { name: 'Sign Up Completed', value: 800, description: 'Users who completed registration' },
      { name: 'Trial Started', value: 600, description: 'Users who started free trial' },
      { name: 'Subscription', value: 320, description: 'Users who converted to paid plans' }
    ];
    
    setFunnelData(sampleSteps);
  };

  const handleExport = () => {
    const csvContent = [
      'Step,Value,Conversion Rate,Drop-off Rate',
      ...funnelData.map((step, index) => {
        const conversionRate = index === 0 ? 100 : ((step.value / funnelData[0].value) * 100).toFixed(1);
        const dropOffRate = index === 0 ? 0 : (((funnelData[index - 1].value - step.value) / funnelData[index - 1].value) * 100).toFixed(1);
        return `"${step.name}",${step.value},${conversionRate}%,${dropOffRate}%`;
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funnel-data-${new Date().toISOString().split('T')[0]}.csv`;
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

  if (error || funnelData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <TrendingDown className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">{error || 'No funnel data available'}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchFunnelData}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const colors = config.colors || defaultColors;
  const showConversionRates = config.showConversionRates !== false;
  const showDropOffRates = config.showDropOffRates !== false;
  const orientation = config.orientation || 'vertical';
  
  // Calculate percentages
  const stepsWithMetrics = funnelData.map((step, index) => {
    const conversionRate = index === 0 ? 100 : ((step.value / funnelData[0].value) * 100);
    const dropOffRate = index === 0 ? 0 : (((funnelData[index - 1].value - step.value) / funnelData[index - 1].value) * 100);
    const stepConversionRate = index === 0 ? 100 : ((step.value / funnelData[index - 1].value) * 100);
    
    return {
      ...step,
      conversionRate,
      dropOffRate,
      stepConversionRate,
      color: step.color || colors[index % colors.length]
    };
  });

  const maxValue = Math.max(...funnelData.map(step => step.value));

  if (orientation === 'horizontal') {
    return (
      <div className="h-full flex flex-col">
        {/* Controls */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {funnelData.length} steps
            </Badge>
            <Badge variant="outline" className="text-xs">
              {((stepsWithMetrics[stepsWithMetrics.length - 1]?.conversionRate) || 0).toFixed(1)}% overall conversion
            </Badge>
          </div>
          
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

        {/* Horizontal Funnel */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="space-y-3">
            {stepsWithMetrics.map((step, index) => {
              const widthPercentage = (step.value / maxValue) * 100;
              
              return (
                <div key={index} className="space-y-2">
                  {/* Step Bar */}
                  <div className="relative">
                    <div 
                      className="h-12 rounded-lg flex items-center justify-between px-4 text-white font-medium shadow-sm"
                      style={{ 
                        backgroundColor: step.color,
                        width: `${widthPercentage}%`,
                        minWidth: '200px'
                      }}
                    >
                      <span className="text-sm">{step.name}</span>
                      <span className="text-lg">{formatNumber(step.value)}</span>
                    </div>
                    
                    {/* Target indicator */}
                    {step.target && (
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-yellow-400 opacity-75"
                        style={{
                          left: `${(step.target / maxValue) * 100}%`
                        }}
                        title={`Target: ${formatNumber(step.target)}`}
                      />
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 text-xs text-gray-600 pl-2">
                    {showConversionRates && (
                      <span>
                        {step.conversionRate.toFixed(1)}% overall conversion
                      </span>
                    )}
                    {showDropOffRates && index > 0 && (
                      <span className="text-red-600">
                        {step.dropOffRate.toFixed(1)}% drop-off
                      </span>
                    )}
                    {index > 0 && (
                      <span className="text-green-600">
                        {step.stepConversionRate.toFixed(1)}% step conversion
                      </span>
                    )}
                  </div>

                  {step.description && (
                    <p className="text-xs text-gray-500 pl-2">{step.description}</p>
                  )}

                  {/* Arrow between steps */}
                  {index < stepsWithMetrics.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowDown className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Vertical funnel (default)
  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {funnelData.length} steps
          </Badge>
          <Badge variant="outline" className="text-xs">
            {((stepsWithMetrics[stepsWithMetrics.length - 1]?.conversionRate) || 0).toFixed(1)}% overall conversion
          </Badge>
        </div>
        
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

      {/* Vertical Funnel */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="w-full max-w-md space-y-1">
          {stepsWithMetrics.map((step, index) => {
            const widthPercentage = Math.max((step.value / maxValue) * 100, 20); // Minimum 20% width for visibility
            
            return (
              <div key={index} className="relative">
                {/* Funnel Step */}
                <div 
                  className="mx-auto relative rounded-lg shadow-sm overflow-hidden"
                  style={{
                    width: `${widthPercentage}%`,
                    minWidth: '120px'
                  }}
                >
                  <div 
                    className="h-16 flex items-center justify-center text-white font-medium relative"
                    style={{ backgroundColor: step.color }}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold">{formatNumber(step.value)}</div>
                      <div className="text-xs opacity-90">{step.name}</div>
                    </div>
                    
                    {/* Target indicator */}
                    {step.target && step.value < step.target && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" title={`Target: ${formatNumber(step.target)}`} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="text-center mt-1 space-y-1">
                  {showConversionRates && (
                    <div className="text-xs text-gray-600">
                      {step.conversionRate.toFixed(1)}% of total
                    </div>
                  )}
                  {showDropOffRates && index > 0 && (
                    <div className="text-xs text-red-600">
                      -{step.dropOffRate.toFixed(1)}% drop-off
                    </div>
                  )}
                </div>

                {step.description && (
                  <div className="text-center mt-1">
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                )}

                {/* Connector line */}
                {index < stepsWithMetrics.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className="w-px h-4 bg-gray-300"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="border-t p-3 bg-gray-50">
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">
            Overall Conversion: {((stepsWithMetrics[stepsWithMetrics.length - 1]?.conversionRate) || 0).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {formatNumber(funnelData[0]?.value || 0)} → {formatNumber(funnelData[funnelData.length - 1]?.value || 0)}
          </div>
        </div>
      </div>
    </div>
  );
}