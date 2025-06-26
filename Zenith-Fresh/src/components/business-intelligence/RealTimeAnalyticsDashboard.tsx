'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AdvancedChart } from './charts/AdvancedChart';
import { TimeSeries, DataPoint, KPI, StreamingMetric } from '@/types/business-intelligence/analytics';
import { DataProcessor } from '@/lib/business-intelligence/data-processing';

interface RealTimeAnalyticsDashboardProps {
  projectId?: string;
  refreshInterval?: number;
  maxDataPoints?: number;
  theme?: 'light' | 'dark';
}

interface ConnectionStatus {
  connected: boolean;
  latency?: number;
  lastUpdate?: Date;
  errorCount: number;
}

export function RealTimeAnalyticsDashboard({
  projectId,
  refreshInterval = 1000,
  maxDataPoints = 100,
  theme = 'light'
}: RealTimeAnalyticsDashboardProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    errorCount: 0
  });
  
  // Real-time data streams
  const [realtimeMetrics, setRealtimeMetrics] = useState<Map<string, DataPoint[]>>(new Map());
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [maxDataPointsState, setMaxDataPoints] = useState(maxDataPoints);
  
  // WebSocket connection
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Data aggregation settings
  const [aggregationWindow, setAggregationWindow] = useState<'1s' | '5s' | '30s' | '1m'>('5s');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'pageViews', 'uniqueVisitors', 'bounceRate', 'avgSessionDuration'
  ]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      disconnectWebSocket();
    };
  }, [projectId]);

  const connectWebSocket = () => {
    try {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}/api/ws/analytics`
        : `ws://localhost:3000/api/ws/analytics`;
      
      wsRef.current = new WebSocket(`${wsUrl}?projectId=${projectId || 'global'}`);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus(prev => ({
          ...prev,
          connected: true,
          errorCount: 0,
          lastUpdate: new Date()
        }));
        
        // Start ping interval
        startPingInterval();
        
        // Subscribe to metrics
        wsRef.current?.send(JSON.stringify({
          type: 'subscribe',
          metrics: selectedMetrics,
          aggregationWindow
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeData(data);
          
          setConnectionStatus(prev => ({
            ...prev,
            lastUpdate: new Date(),
            latency: Date.now() - new Date(data.timestamp).getTime()
          }));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setConnectionStatus(prev => ({
          ...prev,
          connected: false
        }));
        
        stopPingInterval();
        
        // Attempt to reconnect
        scheduleReconnect();
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus(prev => ({
          ...prev,
          errorCount: prev.errorCount + 1
        }));
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      scheduleReconnect();
    }
  };

  const disconnectWebSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    stopPingInterval();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    const delay = Math.min(1000 * Math.pow(2, connectionStatus.errorCount), 30000);
    reconnectTimeoutRef.current = setTimeout(() => {
      connectWebSocket();
    }, delay);
  };

  const startPingInterval = () => {
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  };

  const stopPingInterval = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  const handleRealtimeData = (data: any) => {
    switch (data.type) {
      case 'metrics':
        updateMetrics(data.metrics);
        break;
      case 'kpis':
        setKpis(data.kpis);
        break;
      case 'alert':
        setAlerts(prev => [data.alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
        break;
      case 'pong':
        // Handle ping response
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  };

  const updateMetrics = (metrics: StreamingMetric[]) => {
    setRealtimeMetrics(prev => {
      const updated = new Map(prev);
      
      metrics.forEach(metric => {
        const existing = updated.get(metric.name) || [];
        const newData = [...existing, {
          timestamp: new Date(metric.timestamp),
          value: metric.value,
          metadata: metric.tags
        }].slice(-maxDataPointsState); // Keep only recent data points
        
        updated.set(metric.name, newData);
      });
      
      return updated;
    });
  };

  const timeSeriesData = useMemo(() => {
    return Array.from(realtimeMetrics.entries()).map(([name, data]) => ({
      name: name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      data,
      type: 'line' as const
    }));
  }, [realtimeMetrics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '➡️';
    }
  };

  const formatValue = (value: number, kpi: KPI) => {
    if (kpi.id.includes('rate') || kpi.id.includes('percentage')) {
      return `${value.toFixed(2)}%`;
    }
    if (kpi.id.includes('duration') || kpi.id.includes('time')) {
      return `${(value / 1000).toFixed(2)}s`;
    }
    return value.toLocaleString();
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header with Connection Status */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Real-Time Analytics Dashboard</h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Live data streaming and monitoring
            </p>
          </div>
          
          {/* Connection Status Indicator */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} ${
                isConnected ? 'animate-pulse' : ''
              }`} />
              <span className="text-sm">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {connectionStatus.latency && (
              <div className="text-sm">
                Latency: {connectionStatus.latency}ms
              </div>
            )}
            
            {connectionStatus.lastUpdate && (
              <div className="text-sm">
                Last update: {connectionStatus.lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
        
        {/* Controls */}
        <div className="mt-4 flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium mb-1">Aggregation Window</label>
            <select
              value={aggregationWindow}
              onChange={(e) => setAggregationWindow(e.target.value as any)}
              className={`block w-32 rounded-md border ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              } px-3 py-2 text-sm`}
            >
              <option value="1s">1 second</option>
              <option value="5s">5 seconds</option>
              <option value="30s">30 seconds</option>
              <option value="1m">1 minute</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Max Data Points</label>
            <input
              type="number"
              value={maxDataPointsState}
              onChange={(e) => setMaxDataPoints(parseInt(e.target.value))}
              min="50"
              max="1000"
              step="50"
              className={`block w-32 rounded-md border ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              } px-3 py-2 text-sm`}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 py-6">
        <h2 className="text-lg font-semibold mb-4">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi) => (
            <div
              key={kpi.id}
              className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {kpi.name}
                  </p>
                  <p className={`text-2xl font-bold ${getStatusColor(kpi.status).split(' ')[0]}`}>
                    {formatValue(kpi.value, kpi)}
                  </p>
                  {kpi.changePercentage !== undefined && (
                    <p className={`text-sm ${kpi.changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {getTrendIcon(kpi.trend)} {Math.abs(kpi.changePercentage).toFixed(1)}%
                    </p>
                  )}
                </div>
                
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(kpi.status)}`}>
                  {kpi.status.toUpperCase()}
                </div>
              </div>
              
              {/* Mini sparkline */}
              {kpi.sparkline && kpi.sparkline.length > 0 && (
                <div className="mt-4">
                  <AdvancedChart
                    type="line"
                    data={[{
                      name: kpi.name,
                      data: kpi.sparkline,
                      color: getStatusColor(kpi.status).includes('green') ? '#10B981' : 
                            getStatusColor(kpi.status).includes('red') ? '#EF4444' : '#F59E0B'
                    }]}
                    height={60}
                    showLegend={false}
                    showGrid={false}
                    animations={false}
                    maintainAspectRatio={false}
                    theme={theme}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Real-time Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className={`rounded-lg p-6 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border shadow-sm`}>
            <h3 className="text-lg font-semibold mb-4">Page Views (Real-time)</h3>
            <AdvancedChart
              type="line"
              data={timeSeriesData.filter(ts => ts.name.toLowerCase().includes('page'))}
              height={300}
              realTime={true}
              animations={false}
              theme={theme}
              yAxisLabel="Views"
              showGrid={true}
            />
          </div>
          
          <div className={`rounded-lg p-6 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border shadow-sm`}>
            <h3 className="text-lg font-semibold mb-4">User Engagement</h3>
            <AdvancedChart
              type="area"
              data={timeSeriesData.filter(ts => 
                ts.name.toLowerCase().includes('session') || 
                ts.name.toLowerCase().includes('bounce')
              )}
              height={300}
              realTime={true}
              animations={false}
              theme={theme}
              yAxisLabel="Rate (%)"
              showGrid={true}
            />
          </div>
        </div>

        {/* Alerts Panel */}
        {alerts.length > 0 && (
          <div className={`rounded-lg p-6 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border shadow-sm`}>
            <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md ${
                    alert.severity === 'critical' ? 'bg-red-100 border-red-300' :
                    alert.severity === 'high' ? 'bg-orange-100 border-orange-300' :
                    alert.severity === 'medium' ? 'bg-yellow-100 border-yellow-300' :
                    'bg-blue-100 border-blue-300'
                  } border`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connection Issues Warning */}
        {!isConnected && (
          <div className="rounded-lg p-6 bg-yellow-100 border border-yellow-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Real-time connection lost
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Attempting to reconnect... (Errors: {connectionStatus.errorCount})
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}