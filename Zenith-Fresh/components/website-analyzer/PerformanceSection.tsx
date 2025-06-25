'use client';

import { PerformanceMetrics } from '@/types/analyzer';
import { Clock, Zap, BarChart3 } from 'lucide-react';

interface PerformanceSectionProps {
  metrics: PerformanceMetrics;
}

export function PerformanceSection({ metrics }: PerformanceSectionProps) {
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getMetricColor = (value: number, thresholds: { good: number; fair: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.fair) return 'text-yellow-600';
    return 'text-red-600';
  };

  const MetricCard = ({ 
    title, 
    value, 
    unit = 'ms', 
    description, 
    thresholds 
  }: { 
    title: string; 
    value: number; 
    unit?: string; 
    description: string;
    thresholds: { good: number; fair: number };
  }) => (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <span className={`text-lg font-bold ${getMetricColor(value, thresholds)}`}>
          {unit === 'ms' ? formatTime(value) : value.toFixed(3)}
        </span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-6">
        <BarChart3 className="w-6 h-6 text-blue-600 mr-3" />
        <h3 className="text-xl font-semibold">Performance Analysis</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Load Time"
          value={metrics.loadTime}
          description="Total time to load the page"
          thresholds={{ good: 1500, fair: 3000 }}
        />
        
        <MetricCard
          title="First Contentful Paint"
          value={metrics.firstContentfulPaint}
          description="Time until first content is rendered"
          thresholds={{ good: 1800, fair: 3000 }}
        />
        
        <MetricCard
          title="Largest Contentful Paint"
          value={metrics.largestContentfulPaint}
          description="Time until largest content element is rendered"
          thresholds={{ good: 2500, fair: 4000 }}
        />
        
        <MetricCard
          title="First Input Delay"
          value={metrics.firstInputDelay}
          description="Time until page becomes interactive"
          thresholds={{ good: 100, fair: 300 }}
        />
        
        <MetricCard
          title="Cumulative Layout Shift"
          value={metrics.cumulativeLayoutShift}
          unit="score"
          description="Measures visual stability"
          thresholds={{ good: 0.1, fair: 0.25 }}
        />
        
        <MetricCard
          title="Time to Interactive"
          value={metrics.timeToInteractive}
          description="Time until page is fully interactive"
          thresholds={{ good: 3800, fair: 7300 }}
        />
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <Zap className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Performance Tips</h4>
            <p className="text-sm text-blue-800">
              Core Web Vitals are key metrics that Google uses for ranking. 
              Focus on optimizing LCP (&lt;2.5s), FID (&lt;100ms), and CLS (&lt;0.1) for better SEO performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}