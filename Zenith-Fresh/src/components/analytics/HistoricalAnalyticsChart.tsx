'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

interface TrendData {
  date: string;
  value: number;
}

interface MetricTrend {
  metricName: string;
  url: string;
  data: TrendData[];
  trendDirection: 'improving' | 'declining' | 'stable' | 'volatile';
  trendStrength: number;
  currentValue: number;
  averageValue: number;
  bestValue: number;
  worstValue: number;
}

interface HistoricalAnalyticsChartProps {
  projectId: string;
  url?: string;
  metrics?: string[];
  period?: 'daily' | 'weekly' | 'monthly';
  height?: number;
}

export function HistoricalAnalyticsChart({
  projectId,
  url,
  metrics = ['overall_score'],
  period = 'daily',
  height = 400,
}: HistoricalAnalyticsChartProps) {
  const [trends, setTrends] = useState<MetricTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrends();
  }, [projectId, url, metrics, period]);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams({
        projectId,
        period,
        metrics: metrics.join(','),
      });

      if (url) {
        searchParams.append('url', url);
      }

      const response = await fetch(`/api/trends?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trends');
      }

      const data = await response.json();
      setTrends(data.trends);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trends');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (trends.length === 0) return null;

    const colors = [
      '#3B82F6', // Blue
      '#EF4444', // Red
      '#10B981', // Green
      '#F59E0B', // Amber
      '#8B5CF6', // Purple
      '#F97316', // Orange
      '#06B6D4', // Cyan
      '#84CC16', // Lime
    ];

    const datasets = trends.map((trend, index) => {
      const color = colors[index % colors.length];
      
      return {
        label: formatMetricName(trend.metricName),
        data: trend.data.map(point => ({
          x: point.date,
          y: point.value,
        })),
        borderColor: color,
        backgroundColor: `${color}20`,
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2,
      };
    });

    return {
      datasets,
    };
  };

  const getChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
          },
        },
        title: {
          display: true,
          text: `Performance Trends - ${period.charAt(0).toUpperCase() + period.slice(1)}`,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          callbacks: {
            title: (context: any) => {
              const date = context[0].parsed.x;
              if (period === 'daily') {
                return format(parseISO(date), 'MMM dd, yyyy');
              } else if (period === 'weekly') {
                return `Week of ${format(parseISO(date), 'MMM dd, yyyy')}`;
              } else {
                return format(parseISO(date), 'MMM yyyy');
              }
            },
            label: (context: any) => {
              const value = context.parsed.y;
              const metric = context.dataset.label;
              
              if (metric.includes('Score')) {
                return `${metric}: ${value}/100`;
              } else if (metric.includes('Time')) {
                return `${metric}: ${value}ms`;
              } else if (metric.includes('LCP')) {
                return `${metric}: ${(value * 1000).toFixed(0)}ms`;
              } else if (metric.includes('FID')) {
                return `${metric}: ${value.toFixed(0)}ms`;
              } else if (metric.includes('CLS')) {
                return `${metric}: ${value.toFixed(3)}`;
              }
              
              return `${metric}: ${value}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'time' as const,
          time: {
            unit: period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month',
            displayFormats: {
              day: 'MMM dd',
              week: 'MMM dd',
              month: 'MMM yyyy',
            },
          },
          title: {
            display: true,
            text: 'Date',
          },
        },
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Value',
          },
          ticks: {
            callback: function(value: any) {
              if (metrics.some(m => m.includes('score'))) {
                return `${value}/100`;
              } else if (metrics.some(m => m.includes('time'))) {
                return `${value}ms`;
              }
              return value;
            },
          },
        },
      },
      interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false,
      },
    };
  };

  const formatMetricName = (metricName: string): string => {
    const metricNames: { [key: string]: string } = {
      overall_score: 'Overall Score',
      load_time: 'Load Time',
      lcp: 'LCP',
      fid: 'FID',
      cls: 'CLS',
      performance_score: 'Performance Score',
      cwv_score: 'Core Web Vitals Score',
      security_score: 'Security Score',
      seo_score: 'SEO Score',
      accessibility_score: 'Accessibility Score',
    };

    return metricNames[metricName] || metricName;
  };

  const getTrendIndicator = (trend: MetricTrend) => {
    const { trendDirection, trendStrength } = trend;
    
    const getColor = () => {
      switch (trendDirection) {
        case 'improving':
          return 'text-green-600';
        case 'declining':
          return 'text-red-600';
        case 'stable':
          return 'text-gray-600';
        case 'volatile':
          return 'text-yellow-600';
        default:
          return 'text-gray-600';
      }
    };

    const getIcon = () => {
      switch (trendDirection) {
        case 'improving':
          return '↗️';
        case 'declining':
          return '↘️';
        case 'stable':
          return '➡️';
        case 'volatile':
          return '↕️';
        default:
          return '➡️';
      }
    };

    return (
      <span className={`inline-flex items-center text-sm font-medium ${getColor()}`}>
        <span className="mr-1">{getIcon()}</span>
        {trendDirection.charAt(0).toUpperCase() + trendDirection.slice(1)}
        {trendStrength !== 0 && (
          <span className="ml-1 text-xs">
            ({trendStrength > 0 ? '+' : ''}{(trendStrength * 100).toFixed(1)}%)
          </span>
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading trends...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="text-red-600">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading trends</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trend data available</h3>
          <p className="text-gray-600">Run some website analyses to see historical trends.</p>
        </div>
      </div>
    );
  }

  const chartData = getChartData();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Chart */}
      <div style={{ height: height }}>
        {chartData && <Line data={chartData} options={getChartOptions()} />}
      </div>

      {/* Trend Summary */}
      <div className="mt-6 border-t pt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Trend Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trends.map((trend, index) => (
            <div key={`${trend.metricName}-${index}`} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-sm font-medium text-gray-900">
                  {formatMetricName(trend.metricName)}
                </h5>
                {getTrendIndicator(trend)}
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Current: <span className="font-medium">{trend.currentValue}</span></div>
                <div>Average: <span className="font-medium">{trend.averageValue}</span></div>
                <div>Best: <span className="font-medium text-green-600">{trend.bestValue}</span></div>
                <div>Worst: <span className="font-medium text-red-600">{trend.worstValue}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}