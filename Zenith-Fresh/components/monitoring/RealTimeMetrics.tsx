'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  SignalIcon, 
  ClockIcon, 
  CpuChipIcon, 
  ServerIcon,
  ChartBarIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface RealTimeMetric {
  timestamp: number;
  value: number;
  label: string;
}

interface MetricData {
  current: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
}

interface RealTimeData {
  responseTime: MetricData;
  throughput: MetricData;
  errorRate: MetricData;
  cpuUsage: MetricData;
  memoryUsage: MetricData;
  activeConnections: MetricData;
}

// Simple line chart component
function MiniChart({ data, color = '#3B82F6', height = 60 }: { 
  data: RealTimeMetric[]; 
  color?: string; 
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight);

    // Find min/max values for scaling
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Calculate points
    const points = data.map((d, i) => ({
      x: (i / (data.length - 1)) * width,
      y: canvasHeight - ((d.value - minValue) / valueRange) * canvasHeight
    }));

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    points.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });

    ctx.stroke();

    // Draw fill area
    ctx.beginPath();
    ctx.fillStyle = color + '20';
    points.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, canvasHeight);
        ctx.lineTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.lineTo(points[points.length - 1].x, canvasHeight);
    ctx.closePath();
    ctx.fill();

  }, [data, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={200} 
      height={height}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
}

export function RealTimeMetrics() {
  const [metrics, setMetrics] = useState<RealTimeData | null>(null);
  const [historicalData, setHistoricalData] = useState<{
    [key: string]: RealTimeMetric[];
  }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/monitoring/realtime');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        
        const data = await response.json();
        setMetrics(data.metrics);
        
        // Update historical data
        const timestamp = Date.now();
        setHistoricalData(prev => {
          const newData = { ...prev };
          
          Object.entries(data.metrics).forEach(([key, metric]: [string, any]) => {
            if (!newData[key]) newData[key] = [];
            newData[key].push({
              timestamp,
              value: metric.current,
              label: key
            });
            
            // Keep only last 50 data points
            if (newData[key].length > 50) {
              newData[key] = newData[key].slice(-50);
            }
          });
          
          return newData;
        });
        
        setIsConnected(true);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch real-time metrics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsConnected(false);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Set up real-time updates every 5 seconds
    const interval = setInterval(fetchMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') {
      return <span className="text-red-500">↗ +{change.toFixed(1)}%</span>;
    } else if (trend === 'down') {
      return <span className="text-green-500">↘ -{Math.abs(change).toFixed(1)}%</span>;
    }
    return <span className="text-gray-500">→ {change.toFixed(1)}%</span>;
  };

  const getChartColor = (status: string) => {
    switch (status) {
      case 'good':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'critical':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <SignalIcon className="h-6 w-6 text-red-500" />
          <h3 className="ml-3 text-lg font-medium text-red-800">Connection Error</h3>
        </div>
        <p className="mt-2 text-red-600">{error}</p>
        <p className="mt-2 text-sm text-red-500">
          Unable to connect to real-time metrics stream. Please check your connection and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium text-gray-700">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="text-sm text-gray-500">
            • Updates every 5 seconds
          </span>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {!metrics ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading real-time metrics...</span>
        </div>
      ) : (
        <>
          {/* Key Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Response Time */}
            <div className={`rounded-lg border p-6 ${getStatusColor(metrics.responseTime.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-gray-600" />
                  <span className="ml-2 text-sm font-medium">Response Time</span>
                </div>
                {getTrendIcon(metrics.responseTime.trend, metrics.responseTime.change)}
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold">
                  {metrics.responseTime.current.toFixed(0)}{metrics.responseTime.unit}
                </div>
                <div className="mt-3 h-12">
                  <MiniChart 
                    data={historicalData.responseTime || []} 
                    color={getChartColor(metrics.responseTime.status)}
                    height={48}
                  />
                </div>
              </div>
            </div>

            {/* Throughput */}
            <div className={`rounded-lg border p-6 ${getStatusColor(metrics.throughput.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BoltIcon className="h-5 w-5 text-gray-600" />
                  <span className="ml-2 text-sm font-medium">Throughput</span>
                </div>
                {getTrendIcon(metrics.throughput.trend, metrics.throughput.change)}
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold">
                  {metrics.throughput.current.toFixed(0)}{metrics.throughput.unit}
                </div>
                <div className="mt-3 h-12">
                  <MiniChart 
                    data={historicalData.throughput || []} 
                    color={getChartColor(metrics.throughput.status)}
                    height={48}
                  />
                </div>
              </div>
            </div>

            {/* Error Rate */}
            <div className={`rounded-lg border p-6 ${getStatusColor(metrics.errorRate.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-gray-600" />
                  <span className="ml-2 text-sm font-medium">Error Rate</span>
                </div>
                {getTrendIcon(metrics.errorRate.trend, metrics.errorRate.change)}
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold">
                  {metrics.errorRate.current.toFixed(2)}{metrics.errorRate.unit}
                </div>
                <div className="mt-3 h-12">
                  <MiniChart 
                    data={historicalData.errorRate || []} 
                    color={getChartColor(metrics.errorRate.status)}
                    height={48}
                  />
                </div>
              </div>
            </div>

            {/* CPU Usage */}
            <div className={`rounded-lg border p-6 ${getStatusColor(metrics.cpuUsage.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CpuChipIcon className="h-5 w-5 text-gray-600" />
                  <span className="ml-2 text-sm font-medium">CPU Usage</span>
                </div>
                {getTrendIcon(metrics.cpuUsage.trend, metrics.cpuUsage.change)}
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold">
                  {metrics.cpuUsage.current.toFixed(1)}{metrics.cpuUsage.unit}
                </div>
                <div className="mt-3 h-12">
                  <MiniChart 
                    data={historicalData.cpuUsage || []} 
                    color={getChartColor(metrics.cpuUsage.status)}
                    height={48}
                  />
                </div>
              </div>
            </div>

            {/* Memory Usage */}
            <div className={`rounded-lg border p-6 ${getStatusColor(metrics.memoryUsage.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ServerIcon className="h-5 w-5 text-gray-600" />
                  <span className="ml-2 text-sm font-medium">Memory Usage</span>
                </div>
                {getTrendIcon(metrics.memoryUsage.trend, metrics.memoryUsage.change)}
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold">
                  {metrics.memoryUsage.current.toFixed(1)}{metrics.memoryUsage.unit}
                </div>
                <div className="mt-3 h-12">
                  <MiniChart 
                    data={historicalData.memoryUsage || []} 
                    color={getChartColor(metrics.memoryUsage.status)}
                    height={48}
                  />
                </div>
              </div>
            </div>

            {/* Active Connections */}
            <div className={`rounded-lg border p-6 ${getStatusColor(metrics.activeConnections.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <SignalIcon className="h-5 w-5 text-gray-600" />
                  <span className="ml-2 text-sm font-medium">Active Connections</span>
                </div>
                {getTrendIcon(metrics.activeConnections.trend, metrics.activeConnections.change)}
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold">
                  {metrics.activeConnections.current.toFixed(0)}{metrics.activeConnections.unit}
                </div>
                <div className="mt-3 h-12">
                  <MiniChart 
                    data={historicalData.activeConnections || []} 
                    color={getChartColor(metrics.activeConnections.status)}
                    height={48}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Performance Thresholds */}
          <div className="bg-white rounded-lg border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Performance Thresholds</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="text-sm font-medium">Good: &lt;200ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600"></span>
                    <span className="text-sm font-medium text-yellow-600">Warning: 200-500ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600"></span>
                    <span className="text-sm font-medium text-red-600">Critical: &gt;500ms</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className="text-sm font-medium">Good: &lt;1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600"></span>
                    <span className="text-sm font-medium text-yellow-600">Warning: 1-5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600"></span>
                    <span className="text-sm font-medium text-red-600">Critical: &gt;5%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">CPU Usage</span>
                    <span className="text-sm font-medium">Good: &lt;70%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600"></span>
                    <span className="text-sm font-medium text-yellow-600">Warning: 70-85%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600"></span>
                    <span className="text-sm font-medium text-red-600">Critical: &gt;85%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}