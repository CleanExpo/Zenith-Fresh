'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChartBarIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface PerformanceData {
  timestamp: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

interface EndpointMetrics {
  endpoint: string;
  avgResponseTime: number;
  requests: number;
  errors: number;
  errorRate: number;
  p95: number;
  p99: number;
}

// Advanced chart component
function PerformanceChart({ 
  data, 
  metric, 
  title, 
  color = '#3B82F6', 
  height = 200 
}: { 
  data: PerformanceData[]; 
  metric: keyof PerformanceData; 
  title: string;
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
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = canvasHeight - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight);

    // Prepare data
    const values = data.map(d => d[metric] as number);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Calculate points
    const points = data.map((d, i) => ({
      x: padding + (i / (data.length - 1)) * chartWidth,
      y: padding + chartHeight - ((d[metric] as number - minValue) / valueRange) * chartHeight
    }));

    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw y-axis labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = maxValue - (i / 5) * valueRange;
      const y = padding + (i / 5) * chartHeight;
      ctx.fillText(value.toFixed(1), padding - 5, y + 3);
    }

    // Draw area fill
    if (points.length > 1) {
      ctx.beginPath();
      ctx.fillStyle = color + '20';
      ctx.moveTo(points[0].x, canvasHeight - padding);
      points.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.lineTo(points[points.length - 1].x, canvasHeight - padding);
      ctx.closePath();
      ctx.fill();
    }

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

    // Draw points
    points.forEach(point => {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw title
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 20);

  }, [data, metric, title, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={height + 40}
      className="w-full border rounded-lg bg-white"
    />
  );
}

export function PerformanceCharts() {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [endpointMetrics, setEndpointMetrics] = useState<EndpointMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');
  const [selectedMetric, setSelectedMetric] = useState<keyof PerformanceData>('responseTime');

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        
        // Generate mock performance data
        const mockData = generateMockPerformanceData();
        const mockEndpoints = generateMockEndpointMetrics();
        
        setPerformanceData(mockData);
        setEndpointMetrics(mockEndpoints);
      } catch (err) {
        console.error('Failed to fetch performance data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPerformanceData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const generateMockPerformanceData = (): PerformanceData[] => {
    const data: PerformanceData[] = [];
    const now = Date.now();
    const pointCount = timeRange === '1h' ? 60 : timeRange === '24h' ? 144 : 168;
    const interval = timeRange === '1h' ? 60000 : timeRange === '24h' ? 600000 : 3600000;

    for (let i = pointCount; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const hour = new Date(timestamp).getHours();
      
      // Simulate daily patterns
      const trafficMultiplier = 0.3 + (Math.sin((hour / 24) * 2 * Math.PI) + 1) * 0.7;
      
      const baseResponseTime = 50 + (trafficMultiplier * 100) + (Math.random() * 30);
      const baseThroughput = 100 + (trafficMultiplier * 200) + (Math.random() * 50);
      const baseErrorRate = 0.1 + (trafficMultiplier * 0.5) + (Math.random() * 0.3);

      data.push({
        timestamp,
        responseTime: baseResponseTime,
        throughput: baseThroughput,
        errorRate: baseErrorRate,
        p95ResponseTime: baseResponseTime * 1.5,
        p99ResponseTime: baseResponseTime * 2.2
      });
    }

    return data;
  };

  const generateMockEndpointMetrics = (): EndpointMetrics[] => {
    const endpoints = [
      '/api/monitoring/realtime',
      '/api/monitoring/alerts',
      '/api/health',
      '/api/auth/session',
      '/api/user/profile',
      '/dashboard',
      '/monitoring',
      '/tools/website-analyzer'
    ];

    return endpoints.map(endpoint => {
      const requests = Math.floor(Math.random() * 10000) + 1000;
      const errors = Math.floor(requests * (Math.random() * 0.05)); // 0-5% error rate
      const avgResponseTime = 50 + Math.random() * 200;

      return {
        endpoint,
        avgResponseTime,
        requests,
        errors,
        errorRate: (errors / requests) * 100,
        p95: avgResponseTime * 1.5,
        p99: avgResponseTime * 2.2
      };
    }).sort((a, b) => b.requests - a.requests);
  };

  const getMetricInfo = (metric: keyof PerformanceData) => {
    switch (metric) {
      case 'responseTime':
        return { title: 'Response Time (ms)', color: '#3B82F6', unit: 'ms' };
      case 'throughput':
        return { title: 'Throughput (req/min)', color: '#10B981', unit: 'req/min' };
      case 'errorRate':
        return { title: 'Error Rate (%)', color: '#EF4444', unit: '%' };
      case 'p95ResponseTime':
        return { title: 'P95 Response Time (ms)', color: '#F59E0B', unit: 'ms' };
      case 'p99ResponseTime':
        return { title: 'P99 Response Time (ms)', color: '#EF4444', unit: 'ms' };
      default:
        return { title: 'Metric', color: '#6B7280', unit: '' };
    }
  };

  const calculateTrend = (data: PerformanceData[], metric: keyof PerformanceData) => {
    if (data.length < 2) return { trend: 'stable', change: 0 };
    
    const recent = data.slice(-10).map(d => d[metric] as number);
    const older = data.slice(-20, -10).map(d => d[metric] as number);
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    const trend = Math.abs(change) < 5 ? 'stable' : change > 0 ? 'up' : 'down';
    
    return { trend, change };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading performance charts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="1h">1 Hour</option>
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as keyof PerformanceData)}
              className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="responseTime">Response Time</option>
              <option value="throughput">Throughput</option>
              <option value="errorRate">Error Rate</option>
              <option value="p95ResponseTime">P95 Response Time</option>
              <option value="p99ResponseTime">P99 Response Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {(['responseTime', 'throughput', 'errorRate', 'p95ResponseTime', 'p99ResponseTime'] as const).map((metric) => {
          const metricInfo = getMetricInfo(metric);
          const trend = calculateTrend(performanceData, metric);
          const latestValue = performanceData[performanceData.length - 1]?.[metric] || 0;

          return (
            <div
              key={metric}
              className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
                selectedMetric === metric ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedMetric(metric)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">{metricInfo.title}</h4>
                {trend.trend === 'up' ? (
                  <ArrowTrendingUpIcon className={`h-4 w-4 ${metric === 'errorRate' ? 'text-red-500' : 'text-green-500'}`} />
                ) : trend.trend === 'down' ? (
                  <ArrowTrendingDownIcon className={`h-4 w-4 ${metric === 'errorRate' ? 'text-green-500' : 'text-red-500'}`} />
                ) : (
                  <div className="h-4 w-4" />
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {latestValue.toFixed(metric === 'errorRate' ? 2 : 0)}
                <span className="text-sm text-gray-500 ml-1">{metricInfo.unit}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}% vs previous period
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-lg border p-6">
        <PerformanceChart
          data={performanceData}
          metric={selectedMetric}
          title={getMetricInfo(selectedMetric).title}
          color={getMetricInfo(selectedMetric).color}
          height={300}
        />
      </div>

      {/* Multiple Metrics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Response Time Distribution</h3>
          <div className="space-y-4">
            <PerformanceChart
              data={performanceData}
              metric="responseTime"
              title="Average Response Time"
              color="#3B82F6"
              height={150}
            />
            <PerformanceChart
              data={performanceData}
              metric="p95ResponseTime"
              title="95th Percentile"
              color="#F59E0B"
              height={150}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Error Rate & Throughput</h3>
          <div className="space-y-4">
            <PerformanceChart
              data={performanceData}
              metric="errorRate"
              title="Error Rate (%)"
              color="#EF4444"
              height={150}
            />
            <PerformanceChart
              data={performanceData}
              metric="throughput"
              title="Throughput (req/min)"
              color="#10B981"
              height={150}
            />
          </div>
        </div>
      </div>

      {/* Endpoint Performance Table */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Endpoint Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Response
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P95
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P99
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {endpointMetrics.map((endpoint) => (
                <tr key={endpoint.endpoint} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{endpoint.endpoint}</code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {endpoint.requests.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {endpoint.avgResponseTime.toFixed(0)}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {endpoint.p95.toFixed(0)}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {endpoint.p99.toFixed(0)}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      endpoint.errorRate > 5 ? 'bg-red-100 text-red-800' :
                      endpoint.errorRate > 1 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {endpoint.errorRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {endpoint.avgResponseTime > 500 || endpoint.errorRate > 5 ? (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    ) : endpoint.avgResponseTime > 200 || endpoint.errorRate > 1 ? (
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}