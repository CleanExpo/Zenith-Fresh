'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Activity, Zap, Users, Globe, TrendingUp, AlertTriangle, CheckCircle, Clock, Database, Wifi } from 'lucide-react';

interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  changeDirection: 'up' | 'down' | 'stable';
  status: 'healthy' | 'warning' | 'critical';
  timestamp: Date;
}

interface StreamingDataPoint {
  timestamp: Date;
  metric: string;
  value: number;
  metadata?: Record<string, any>;
}

interface AlertConfig {
  metricId: string;
  threshold: number;
  condition: 'greater' | 'less' | 'equal';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RealTimeAnalyticsPipelineProps {
  projectId?: string;
  enableStreamProcessing?: boolean;
  alertConfigs?: AlertConfig[];
  refreshInterval?: number;
  maxDataPoints?: number;
}

export function RealTimeAnalyticsPipeline({
  projectId,
  enableStreamProcessing = true,
  alertConfigs = [],
  refreshInterval = 5000,
  maxDataPoints = 100
}: RealTimeAnalyticsPipelineProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [streamingData, setStreamingData] = useState<Map<string, StreamingDataPoint[]>>(new Map());
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetric[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [processingStats, setProcessingStats] = useState({
    eventsPerSecond: 0,
    totalEvents: 0,
    latency: 0,
    errorRate: 0,
  });
  
  const websocketRef = useRef<WebSocket | null>(null);
  const dataBufferRef = useRef<StreamingDataPoint[]>([]);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedTime = useRef<Date>(new Date());

  // Initialize WebSocket connection for real-time data
  useEffect(() => {
    if (enableStreamProcessing) {
      initializeWebSocket();
    }
    
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [projectId, enableStreamProcessing]);

  // Start data processing pipeline
  useEffect(() => {
    if (enableStreamProcessing) {
      processingIntervalRef.current = setInterval(() => {
        processDataBuffer();
        updateRealTimeMetrics();
        checkAlertConditions();
      }, refreshInterval);
    }
    
    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [refreshInterval, alertConfigs]);

  const initializeWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/websocket/analytics${projectId ? `?projectId=${projectId}` : ''}`;
    
    try {
      websocketRef.current = new WebSocket(wsUrl);
      
      websocketRef.current.onopen = () => {
        setIsConnected(true);
        console.log('Real-time analytics pipeline connected');
      };
      
      websocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as StreamingDataPoint;
          dataBufferRef.current.push({
            ...data,
            timestamp: new Date(data.timestamp)
          });
          
          // Limit buffer size to prevent memory issues
          if (dataBufferRef.current.length > maxDataPoints * 2) {
            dataBufferRef.current = dataBufferRef.current.slice(-maxDataPoints);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      websocketRef.current.onclose = () => {
        setIsConnected(false);
        console.log('Real-time analytics pipeline disconnected');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (enableStreamProcessing) {
            initializeWebSocket();
          }
        }, 3000);
      };
      
      websocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      // Fallback to polling mode
      startPollingMode();
    }
  }, [projectId, enableStreamProcessing, maxDataPoints]);

  const startPollingMode = useCallback(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/analytics/real-time${projectId ? `?projectId=${projectId}` : ''}`);
        if (response.ok) {
          const data = await response.json();
          // Simulate streaming data format
          const streamingPoint: StreamingDataPoint = {
            timestamp: new Date(),
            metric: 'polling_update',
            value: data.totalEvents || 0,
            metadata: data
          };
          dataBufferRef.current.push(streamingPoint);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, refreshInterval);

    return () => clearInterval(pollInterval);
  }, [projectId, refreshInterval]);

  const processDataBuffer = useCallback(() => {
    const buffer = dataBufferRef.current;
    if (buffer.length === 0) return;

    const now = new Date();
    const timeSinceLastProcess = (now.getTime() - lastProcessedTime.current.getTime()) / 1000;
    
    // Calculate processing statistics
    const eventsProcessed = buffer.length;
    const eventsPerSecond = eventsProcessed / Math.max(timeSinceLastProcess, 1);
    
    // Group data by metric
    const groupedData = buffer.reduce((acc, point) => {
      if (!acc.has(point.metric)) {
        acc.set(point.metric, []);
      }
      acc.get(point.metric)!.push(point);
      return acc;
    }, new Map<string, StreamingDataPoint[]>());

    // Update streaming data state
    setStreamingData(prevData => {
      const newData = new Map(prevData);
      
      groupedData.forEach((points, metric) => {
        const existingPoints = newData.get(metric) || [];
        const combinedPoints = [...existingPoints, ...points]
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          .slice(-maxDataPoints); // Keep only recent points
        
        newData.set(metric, combinedPoints);
      });
      
      return newData;
    });

    // Update processing stats
    setProcessingStats(prev => ({
      eventsPerSecond: Math.round(eventsPerSecond * 10) / 10,
      totalEvents: prev.totalEvents + eventsProcessed,
      latency: Math.round(timeSinceLastProcess * 1000), // Convert to ms
      errorRate: prev.errorRate, // Will be updated by error handling
    }));

    // Clear buffer
    dataBufferRef.current = [];
    lastProcessedTime.current = now;
  }, [maxDataPoints]);

  const updateRealTimeMetrics = useCallback(() => {
    const metrics: RealTimeMetric[] = [];
    
    streamingData.forEach((points, metricName) => {
      if (points.length === 0) return;
      
      const latestPoint = points[points.length - 1];
      const previousPoint = points.length > 1 ? points[points.length - 2] : null;
      
      const change = previousPoint 
        ? ((latestPoint.value - previousPoint.value) / previousPoint.value) * 100
        : 0;
      
      const changeDirection = Math.abs(change) < 0.1 ? 'stable' 
        : change > 0 ? 'up' : 'down';
      
      // Determine status based on metric type and change
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (Math.abs(change) > 50) status = 'critical';
      else if (Math.abs(change) > 20) status = 'warning';
      
      metrics.push({
        id: metricName,
        name: formatMetricName(metricName),
        value: latestPoint.value,
        unit: getMetricUnit(metricName),
        change: Math.round(change * 10) / 10,
        changeDirection,
        status,
        timestamp: latestPoint.timestamp,
      });
    });
    
    setRealTimeMetrics(metrics);
  }, [streamingData]);

  const checkAlertConditions = useCallback(() => {
    if (alertConfigs.length === 0) return;
    
    const newAlerts: any[] = [];
    
    realTimeMetrics.forEach(metric => {
      const relevantConfigs = alertConfigs.filter(config => config.metricId === metric.id);
      
      relevantConfigs.forEach(config => {
        let conditionMet = false;
        
        switch (config.condition) {
          case 'greater':
            conditionMet = metric.value > config.threshold;
            break;
          case 'less':
            conditionMet = metric.value < config.threshold;
            break;
          case 'equal':
            conditionMet = Math.abs(metric.value - config.threshold) < 0.01;
            break;
        }
        
        if (conditionMet) {
          newAlerts.push({
            id: `${metric.id}-${config.condition}-${Date.now()}`,
            metricId: metric.id,
            metricName: metric.name,
            severity: config.severity,
            threshold: config.threshold,
            currentValue: metric.value,
            condition: config.condition,
            timestamp: new Date(),
            message: `${metric.name} is ${metric.value}${metric.unit}, which ${config.condition} ${config.threshold}${metric.unit}`,
          });
        }
      });
    });
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts].slice(-50)); // Keep last 50 alerts
    }
  }, [realTimeMetrics, alertConfigs]);

  const formatMetricName = (metricName: string) => {
    return metricName
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getMetricUnit = (metricName: string) => {
    if (metricName.includes('time') || metricName.includes('latency')) return 'ms';
    if (metricName.includes('rate') || metricName.includes('percent')) return '%';
    if (metricName.includes('bytes') || metricName.includes('size')) return 'B';
    if (metricName.includes('count') || metricName.includes('events')) return '';
    return '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return AlertTriangle;
      default: return Activity;
    }
  };

  const renderRealtimeChart = (metricId: string, data: StreamingDataPoint[]) => {
    if (data.length === 0) return null;
    
    const chartData = data.map(point => ({
      time: point.timestamp.toLocaleTimeString(),
      value: point.value,
    }));

    return (
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`gradient-${metricId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2}
              fill={`url(#gradient-${metricId})`}
            />
            <XAxis dataKey="time" hide />
            <YAxis hide />
            <Tooltip
              formatter={(value: any) => [value, 'Value']}
              labelFormatter={(label) => `Time: ${label}`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Status Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Real-Time Analytics Pipeline</h2>
              <p className="text-sm text-gray-600">
                Live data processing and streaming analytics
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <Wifi className="w-4 h-4" />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
        
        {/* Processing Statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Events/sec</p>
                <p className="text-lg font-semibold text-gray-900">
                  {processingStats.eventsPerSecond}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-lg font-semibold text-gray-900">
                  {processingStats.totalEvents.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Latency</p>
                <p className="text-lg font-semibold text-gray-900">
                  {processingStats.latency}ms
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Error Rate</p>
                <p className="text-lg font-semibold text-gray-900">
                  {processingStats.errorRate.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {realTimeMetrics.map((metric) => {
          const StatusIcon = getStatusIcon(metric.status);
          const data = streamingData.get(metric.id) || [];
          
          return (
            <div key={metric.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(metric.status)}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                    <p className="text-sm text-gray-500">
                      Updated {new Date(metric.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                  </span>
                  <span className="text-sm text-gray-600">{metric.unit}</span>
                </div>
                
                {Math.abs(metric.change) > 0.1 && (
                  <div className={`flex items-center space-x-1 mt-1 ${
                    metric.changeDirection === 'up' ? 'text-green-600' : 
                    metric.changeDirection === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    <TrendingUp className={`w-4 h-4 ${
                      metric.changeDirection === 'down' ? 'transform rotate-180' : ''
                    }`} />
                    <span className="text-sm font-medium">
                      {Math.abs(metric.change)}%
                    </span>
                  </div>
                )}
              </div>
              
              {renderRealtimeChart(metric.id, data)}
            </div>
          );
        })}
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
          <div className="space-y-3">
            {alerts.slice(-10).map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{alert.message}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}