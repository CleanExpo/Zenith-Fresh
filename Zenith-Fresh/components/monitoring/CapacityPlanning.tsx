'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ServerStackIcon, 
  ChartBarIcon, 
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ClockIcon,
  CpuChipIcon,
  CircleStackIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

interface CapacityMetric {
  resource: string;
  current: number;
  capacity: number;
  utilization: number;
  trend: number; // % change per week
  projectedFullDate?: Date;
  recommendedAction: string;
  status: 'healthy' | 'warning' | 'critical';
  unit: string;
}

interface ScalingRecommendation {
  id: string;
  type: 'scale-up' | 'scale-out' | 'optimize' | 'migrate';
  priority: 'high' | 'medium' | 'low';
  resource: string;
  title: string;
  description: string;
  currentState: string;
  recommendedState: string;
  estimatedCost: string;
  timeframe: string;
  impact: string;
  urgency: string;
}

interface ForecastData {
  timestamp: number;
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  users: number;
}

interface GrowthProjection {
  metric: string;
  currentValue: number;
  projectedValue30d: number;
  projectedValue90d: number;
  projectedValue365d: number;
  growthRate: number;
  confidence: number;
  unit: string;
}

// Forecast chart component
function ForecastChart({ data, height = 300 }: { data: ForecastData[]; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const canvasHeight = canvas.height;
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = canvasHeight - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight);

    const now = Date.now();
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);

    // Separate historical and forecast data
    const historicalData = data.filter(d => d.timestamp <= now);
    const forecastData = data.filter(d => d.timestamp > now);

    // Draw background
    ctx.fillStyle = '#F9FAFB';
    ctx.fillRect(padding, padding, chartWidth, chartHeight);

    // Draw grid
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = padding + (i / 10) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw forecast boundary
    const forecastStartX = padding + (historicalData.length / data.length) * chartWidth;
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(forecastStartX, padding);
    ctx.lineTo(forecastStartX, canvasHeight - padding);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw forecast region
    ctx.fillStyle = '#FEF3C7';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(forecastStartX, padding, chartWidth - (forecastStartX - padding), chartHeight);
    ctx.globalAlpha = 1;

    // Draw metrics
    const metrics = ['cpu', 'memory', 'storage'];
    const colors = ['#EF4444', '#F59E0B', '#10B981'];

    metrics.forEach((metric, metricIndex) => {
      const color = colors[metricIndex];
      
      // Draw historical data
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      historicalData.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((point[metric as keyof ForecastData] as number / 100) * chartHeight);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw forecast data (dashed)
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      
      [...historicalData.slice(-1), ...forecastData].forEach((point, index) => {
        const totalIndex = historicalData.length - 1 + index;
        const x = padding + (totalIndex / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((point[metric as keyof ForecastData] as number / 100) * chartHeight);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw legend
    ctx.font = '12px system-ui';
    ctx.textAlign = 'left';
    metrics.forEach((metric, index) => {
      const color = colors[index];
      const y = 20 + index * 20;
      
      ctx.fillStyle = color;
      ctx.fillRect(width - 150, y, 12, 3);
      
      ctx.fillStyle = '#374151';
      ctx.fillText(metric.toUpperCase(), width - 130, y + 8);
    });

    // Labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Historical', forecastStartX / 2 + padding / 2, canvasHeight - 10);
    ctx.fillText('Forecast', forecastStartX + (chartWidth - (forecastStartX - padding)) / 2, canvasHeight - 10);

  }, [data]);

  return (
    <canvas 
      ref={canvasRef} 
      width={800} 
      height={height}
      className="w-full border rounded-lg bg-white"
    />
  );
}

export function CapacityPlanning() {
  const [capacityMetrics, setCapacityMetrics] = useState<CapacityMetric[]>([]);
  const [recommendations, setRecommendations] = useState<ScalingRecommendation[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [growthProjections, setGrowthProjections] = useState<GrowthProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('90d');

  useEffect(() => {
    const fetchCapacityData = async () => {
      try {
        setLoading(true);
        
        // Generate mock data
        const mockCapacity = generateMockCapacityMetrics();
        const mockRecommendations = generateMockRecommendations();
        const mockForecast = generateMockForecastData();
        const mockProjections = generateMockGrowthProjections();
        
        setCapacityMetrics(mockCapacity);
        setRecommendations(mockRecommendations);
        setForecastData(mockForecast);
        setGrowthProjections(mockProjections);
      } catch (err) {
        console.error('Failed to fetch capacity planning data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCapacityData();
  }, [selectedTimeframe]);

  const generateMockCapacityMetrics = (): CapacityMetric[] => {
    return [
      {
        resource: 'CPU',
        current: 68,
        capacity: 100,
        utilization: 68,
        trend: 8.5,
        projectedFullDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        recommendedAction: 'Scale out with 2 additional instances',
        status: 'warning',
        unit: '%'
      },
      {
        resource: 'Memory',
        current: 85,
        capacity: 100,
        utilization: 85,
        trend: 12.3,
        projectedFullDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        recommendedAction: 'Upgrade to instances with more RAM',
        status: 'critical',
        unit: '%'
      },
      {
        resource: 'Storage',
        current: 450,
        capacity: 500,
        utilization: 90,
        trend: 15.8,
        projectedFullDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        recommendedAction: 'Add 200GB additional storage',
        status: 'critical',
        unit: 'GB'
      },
      {
        resource: 'Network Bandwidth',
        current: 45,
        capacity: 100,
        utilization: 45,
        trend: 3.2,
        recommendedAction: 'Monitor growth, no action needed',
        status: 'healthy',
        unit: '%'
      },
      {
        resource: 'Database Connections',
        current: 180,
        capacity: 200,
        utilization: 90,
        trend: 5.7,
        projectedFullDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        recommendedAction: 'Implement connection pooling',
        status: 'warning',
        unit: 'connections'
      }
    ];
  };

  const generateMockRecommendations = (): ScalingRecommendation[] => {
    return [
      {
        id: 'rec-1',
        type: 'scale-out',
        priority: 'high',
        resource: 'Application Servers',
        title: 'Scale Out Application Tier',
        description: 'Add 2 additional application server instances to handle increasing load',
        currentState: '3 instances @ 2 vCPU, 4GB RAM',
        recommendedState: '5 instances @ 2 vCPU, 4GB RAM',
        estimatedCost: '+$240/month',
        timeframe: '1-2 weeks',
        impact: '40% more capacity, improved response times',
        urgency: 'Needed before peak traffic season'
      },
      {
        id: 'rec-2',
        type: 'scale-up',
        priority: 'high',
        resource: 'Database Server',
        title: 'Upgrade Database Instance',
        description: 'Increase database server memory to handle larger working sets',
        currentState: '1 instance @ 4 vCPU, 16GB RAM',
        recommendedState: '1 instance @ 4 vCPU, 32GB RAM',
        estimatedCost: '+$180/month',
        timeframe: '3-5 days',
        impact: '50% better query performance',
        urgency: 'Critical for data processing workloads'
      },
      {
        id: 'rec-3',
        type: 'optimize',
        priority: 'medium',
        resource: 'Cache Layer',
        title: 'Implement Redis Clustering',
        description: 'Set up Redis cluster for improved cache performance and availability',
        currentState: 'Single Redis instance, 2GB',
        recommendedState: 'Redis cluster, 3 nodes, 2GB each',
        estimatedCost: '+$90/month',
        timeframe: '1-2 weeks',
        impact: '3x cache throughput, improved availability',
        urgency: 'Recommended for better user experience'
      },
      {
        id: 'rec-4',
        type: 'migrate',
        priority: 'low',
        resource: 'Storage',
        title: 'Migrate to SSD Storage',
        description: 'Upgrade storage to SSD for better I/O performance',
        currentState: 'HDD storage, 500GB',
        recommendedState: 'SSD storage, 500GB',
        estimatedCost: '+$50/month',
        timeframe: '2-3 days',
        impact: '5x faster disk I/O',
        urgency: 'Nice to have for performance'
      }
    ];
  };

  const generateMockForecastData = (): ForecastData[] => {
    const data: ForecastData[] = [];
    const now = Date.now();
    const daysBack = 30;
    const daysForward = parseInt(selectedTimeframe.replace('d', ''));
    
    // Historical data (last 30 days)
    for (let i = daysBack; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000);
      const dayFactor = (daysBack - i) / daysBack;
      
      data.push({
        timestamp,
        cpu: 40 + dayFactor * 25 + Math.random() * 10,
        memory: 50 + dayFactor * 30 + Math.random() * 8,
        storage: 60 + dayFactor * 25 + Math.random() * 5,
        network: 30 + dayFactor * 15 + Math.random() * 10,
        users: 1000 + dayFactor * 2000 + Math.random() * 200
      });
    }
    
    // Forecast data
    for (let i = 1; i <= daysForward; i++) {
      const timestamp = now + (i * 24 * 60 * 60 * 1000);
      const growthFactor = 1 + (i / daysForward) * 0.5; // 50% growth over period
      const lastData = data[data.length - 1];
      
      data.push({
        timestamp,
        cpu: Math.min(95, lastData.cpu * (1 + 0.002 * i) + Math.random() * 5),
        memory: Math.min(98, lastData.memory * (1 + 0.003 * i) + Math.random() * 3),
        storage: Math.min(100, lastData.storage * (1 + 0.001 * i) + Math.random() * 2),
        network: Math.min(90, lastData.network * (1 + 0.0015 * i) + Math.random() * 5),
        users: lastData.users * (1 + 0.01 * i) + Math.random() * 100
      });
    }
    
    return data;
  };

  const generateMockGrowthProjections = (): GrowthProjection[] => {
    return [
      {
        metric: 'Active Users',
        currentValue: 8750,
        projectedValue30d: 9500,
        projectedValue90d: 11200,
        projectedValue365d: 15600,
        growthRate: 8.5,
        confidence: 85,
        unit: 'users'
      },
      {
        metric: 'Data Storage',
        currentValue: 450,
        projectedValue30d: 485,
        projectedValue90d: 580,
        projectedValue365d: 920,
        growthRate: 15.8,
        confidence: 78,
        unit: 'GB'
      },
      {
        metric: 'API Requests',
        currentValue: 2.4,
        projectedValue30d: 2.8,
        projectedValue90d: 3.6,
        projectedValue365d: 6.2,
        growthRate: 23.5,
        confidence: 92,
        unit: 'M/day'
      },
      {
        metric: 'Infrastructure Cost',
        currentValue: 1250,
        projectedValue30d: 1380,
        projectedValue90d: 1720,
        projectedValue365d: 2890,
        growthRate: 18.2,
        confidence: 82,
        unit: '$/month'
      }
    ];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scale-up':
        return <ArrowUpIcon className="h-4 w-4" />;
      case 'scale-out':
        return <ServerStackIcon className="h-4 w-4" />;
      case 'optimize':
        return <LightBulbIcon className="h-4 w-4" />;
      case 'migrate':
        return <ArrowDownIcon className="h-4 w-4" />;
      default:
        return <CpuChipIcon className="h-4 w-4" />;
    }
  };

  const formatProjectionChange = (current: number, projected: number) => {
    const change = ((projected - current) / current) * 100;
    return {
      value: change,
      formatted: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Analyzing capacity requirements...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Capacity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {capacityMetrics.map((metric) => (
          <div key={metric.resource} className={`rounded-lg border p-6 ${getStatusColor(metric.status)}`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium">{metric.resource}</h4>
              <CpuChipIcon className="h-6 w-6" />
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Utilization</span>
                <span className="font-medium">{metric.utilization}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    metric.utilization > 90 ? 'bg-red-500' :
                    metric.utilization > 75 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${metric.utilization}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Current:</span>
                <span className="font-medium">{metric.current}{metric.unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Capacity:</span>
                <span className="font-medium">{metric.capacity}{metric.unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Growth Trend:</span>
                <span className={`font-medium ${metric.trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {metric.trend > 0 ? '+' : ''}{metric.trend}%/week
                </span>
              </div>
              {metric.projectedFullDate && (
                <div className="flex justify-between">
                  <span>Projected Full:</span>
                  <span className="font-medium text-red-600">
                    {metric.projectedFullDate.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-white bg-opacity-50 rounded text-sm">
              <strong>Recommendation:</strong> {metric.recommendedAction}
            </div>
          </div>
        ))}
      </div>

      {/* Capacity Forecast */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Capacity Forecast</h3>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
              <option value="180d">6 Months</option>
              <option value="365d">1 Year</option>
            </select>
          </div>
        </div>
        <div className="p-6">
          <ForecastChart data={forecastData} height={300} />
        </div>
      </div>

      {/* Growth Projections */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Growth Projections</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {growthProjections.map((projection) => (
              <div key={projection.metric} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-900">{projection.metric}</h4>
                  <span className="text-sm text-gray-500">{projection.confidence}% confidence</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current</span>
                    <span className="text-lg font-semibold">
                      {projection.currentValue.toLocaleString()} {projection.unit}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>30 days:</span>
                      <div className="text-right">
                        <div className="font-medium">{projection.projectedValue30d.toLocaleString()} {projection.unit}</div>
                        <div className={`text-xs ${
                          formatProjectionChange(projection.currentValue, projection.projectedValue30d).value > 0 
                            ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatProjectionChange(projection.currentValue, projection.projectedValue30d).formatted}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>90 days:</span>
                      <div className="text-right">
                        <div className="font-medium">{projection.projectedValue90d.toLocaleString()} {projection.unit}</div>
                        <div className={`text-xs ${
                          formatProjectionChange(projection.currentValue, projection.projectedValue90d).value > 0 
                            ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatProjectionChange(projection.currentValue, projection.projectedValue90d).formatted}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>1 year:</span>
                      <div className="text-right">
                        <div className="font-medium">{projection.projectedValue365d.toLocaleString()} {projection.unit}</div>
                        <div className={`text-xs ${
                          formatProjectionChange(projection.currentValue, projection.projectedValue365d).value > 0 
                            ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatProjectionChange(projection.currentValue, projection.projectedValue365d).formatted}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Growth Rate: {projection.growthRate}% annually
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scaling Recommendations */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Scaling Recommendations</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getTypeIcon(rec.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{rec.title}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                          {rec.priority.toUpperCase()}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                          {rec.type.replace('-', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{rec.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Current State</div>
                          <div className="text-sm text-gray-600">{rec.currentState}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Recommended State</div>
                          <div className="text-sm text-gray-600">{rec.recommendedState}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-700">Cost Impact</div>
                          <div className="text-gray-600">{rec.estimatedCost}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-700">Timeframe</div>
                          <div className="text-gray-600">{rec.timeframe}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-700">Impact</div>
                          <div className="text-gray-600">{rec.impact}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-700">Urgency</div>
                          <div className="text-gray-600">{rec.urgency}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-6">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                      Implement
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium">
                      More Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}