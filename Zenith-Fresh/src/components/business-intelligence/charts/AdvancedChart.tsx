'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  ScatterController,
  BubbleController,
  PolarAreaController,
  RadialLinearScale,
  ArcElement
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { TimeSeries, DataPoint } from '@/types/business-intelligence/analytics';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  ScatterController,
  BubbleController,
  PolarAreaController,
  RadialLinearScale,
  ArcElement
);

interface AdvancedChartProps {
  type: 'line' | 'bar' | 'area' | 'scatter' | 'bubble' | 'radar' | 'polarArea' | 'doughnut';
  data: TimeSeries[];
  title?: string;
  subtitle?: string;
  height?: number;
  width?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltips?: boolean;
  animations?: boolean;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  theme?: 'light' | 'dark';
  customColors?: string[];
  yAxisLabel?: string;
  xAxisLabel?: string;
  yAxisMin?: number;
  yAxisMax?: number;
  timeFormat?: string;
  tooltipFormat?: (value: number, label?: string) => string;
  onPointClick?: (point: DataPoint, seriesIndex: number, pointIndex: number) => void;
  realTime?: boolean;
  maxDataPoints?: number;
  className?: string;
}

export function AdvancedChart({
  type,
  data,
  title,
  subtitle,
  height = 400,
  width,
  showLegend = true,
  showGrid = true,
  showTooltips = true,
  animations = true,
  responsive = true,
  maintainAspectRatio = false,
  theme = 'light',
  customColors,
  yAxisLabel,
  xAxisLabel,
  yAxisMin,
  yAxisMax,
  timeFormat = 'MMM dd',
  tooltipFormat,
  onPointClick,
  realTime = false,
  maxDataPoints = 1000,
  className = ''
}: AdvancedChartProps) {
  const chartRef = useRef<ChartJS>(null);
  const [chartData, setChartData] = useState<any>(null);

  const defaultColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6366F1'
  ];

  const colors = customColors || defaultColors;

  useEffect(() => {
    if (!data || data.length === 0) return;

    const processedData = data.map((series, index) => {
      let processedSeries = { ...series };
      
      // Limit data points for performance
      if (processedSeries.data.length > maxDataPoints) {
        const step = Math.ceil(processedSeries.data.length / maxDataPoints);
        processedSeries.data = processedSeries.data.filter((_, i) => i % step === 0);
      }

      const color = series.color || colors[index % colors.length];
      
      const baseDataset = {
        label: series.name,
        data: processedSeries.data.map(point => ({
          x: point.timestamp,
          y: point.value,
          ...point.metadata
        })),
        borderColor: color,
        backgroundColor: type === 'area' ? `${color}20` : color,
        tension: type === 'line' || type === 'area' ? 0.4 : 0,
        fill: type === 'area',
        pointRadius: type === 'scatter' ? 6 : 3,
        pointHoverRadius: type === 'scatter' ? 8 : 5,
      };

      // Chart type specific configurations
      switch (type) {
        case 'bubble':
          return {
            ...baseDataset,
            data: processedSeries.data.map(point => ({
              x: point.timestamp,
              y: point.value,
              r: point.metadata?.size || 5
            }))
          };
        
        case 'radar':
        case 'polarArea':
        case 'doughnut':
          return {
            ...baseDataset,
            data: processedSeries.data.map(point => point.value),
            backgroundColor: colors.slice(0, processedSeries.data.length).map(c => `${c}80`),
            borderColor: colors.slice(0, processedSeries.data.length)
          };
        
        default:
          return baseDataset;
      }
    });

    const chartConfig = {
      datasets: processedData,
      labels: type === 'radar' || type === 'polarArea' || type === 'doughnut' 
        ? data[0]?.data.map(point => point.label || point.timestamp.toLocaleDateString()) 
        : undefined
    };

    setChartData(chartConfig);
  }, [data, type, colors, maxDataPoints]);

  const options = {
    responsive,
    maintainAspectRatio,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: theme === 'dark' ? '#E5E7EB' : '#374151'
        }
      },
      tooltip: {
        enabled: showTooltips,
        backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
        titleColor: theme === 'dark' ? '#F9FAFB' : '#111827',
        bodyColor: theme === 'dark' ? '#D1D5DB' : '#374151',
        borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            if (tooltipFormat) {
              return tooltipFormat(context.parsed.y, context.dataset.label);
            }
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        color: theme === 'dark' ? '#F9FAFB' : '#111827',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      subtitle: {
        display: !!subtitle,
        text: subtitle,
        color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
        font: {
          size: 12
        }
      }
    },
    scales: {
      x: (type !== 'radar' && type !== 'polarArea' && type !== 'doughnut') ? {
        type: data[0]?.data[0]?.timestamp ? 'time' : 'category',
        time: {
          displayFormats: {
            hour: 'HH:mm',
            day: 'MMM dd',
            week: 'MMM dd',
            month: 'MMM yyyy'
          },
          tooltipFormat: 'PPP'
        },
        title: {
          display: !!xAxisLabel,
          text: xAxisLabel,
          color: theme === 'dark' ? '#D1D5DB' : '#6B7280'
        },
        grid: {
          display: showGrid,
          color: theme === 'dark' ? '#374151' : '#F3F4F6'
        },
        ticks: {
          color: theme === 'dark' ? '#D1D5DB' : '#6B7280'
        }
      } : undefined,
      y: (type !== 'radar' && type !== 'polarArea' && type !== 'doughnut') ? {
        beginAtZero: true,
        min: yAxisMin,
        max: yAxisMax,
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          color: theme === 'dark' ? '#D1D5DB' : '#6B7280'
        },
        grid: {
          display: showGrid,
          color: theme === 'dark' ? '#374151' : '#F3F4F6'
        },
        ticks: {
          color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
          callback: function(value: any) {
            if (typeof value === 'number') {
              return value.toLocaleString();
            }
            return value;
          }
        }
      } : undefined,
      r: type === 'radar' ? {
        beginAtZero: true,
        grid: {
          color: theme === 'dark' ? '#374151' : '#F3F4F6'
        },
        angleLines: {
          color: theme === 'dark' ? '#374151' : '#F3F4F6'
        },
        ticks: {
          color: theme === 'dark' ? '#D1D5DB' : '#6B7280'
        }
      } : undefined
    },
    animation: animations ? {
      duration: realTime ? 0 : 1000,
      easing: 'easeInOutQuart' as const
    } : false,
    onClick: onPointClick ? (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const element = elements[0];
        const point = data[element.datasetIndex].data[element.index];
        onPointClick(point, element.datasetIndex, element.index);
      }
    } : undefined
  };

  if (!chartData) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ height, width }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <Chart
        ref={chartRef}
        type={type === 'area' ? 'line' : type}
        data={chartData}
        options={options as any}
      />
    </div>
  );
}