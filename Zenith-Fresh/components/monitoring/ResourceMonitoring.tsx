'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  CpuChipIcon, 
  ServerIcon, 
  CircleStackIcon,
  WifiIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ResourceMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
    processes: number;
    status: 'good' | 'warning' | 'critical';
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cached: number;
    buffers: number;
    usagePercent: number;
    status: 'good' | 'warning' | 'critical';
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
    iops: number;
    readSpeed: number;
    writeSpeed: number;
    status: 'good' | 'warning' | 'critical';
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    connections: number;
    bandwidth: number;
    latency: number;
    status: 'good' | 'warning' | 'critical';
  };
  containers?: {
    total: number;
    running: number;
    stopped: number;
    memory: number;
    cpu: number;
  };
}

interface HistoricalData {
  timestamp: number;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

// Circular progress component
function CircularProgress({ 
  value, 
  max = 100, 
  size = 120, 
  strokeWidth = 8, 
  color = '#3B82F6',
  backgroundColor = '#E5E7EB'
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / max) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{value.toFixed(1)}%</div>
          <div className="text-xs text-gray-500">Used</div>
        </div>
      </div>
    </div>
  );
}

// Resource usage chart
function ResourceChart({ data, height = 100 }: { data: HistoricalData[]; height?: number }) {
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

    if (data.length < 2) return;

    const pointWidth = width / (data.length - 1);
    
    // Draw lines for each metric
    const metrics = [
      { key: 'cpu', color: '#EF4444', label: 'CPU' },
      { key: 'memory', color: '#F59E0B', label: 'Memory' },
      { key: 'disk', color: '#10B981', label: 'Disk' },
      { key: 'network', color: '#3B82F6', label: 'Network' }
    ];

    metrics.forEach(metric => {
      ctx.beginPath();
      ctx.strokeStyle = metric.color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      data.forEach((point, index) => {
        const x = index * pointWidth;
        const y = canvasHeight - (point[metric.key as keyof HistoricalData] as number / 100) * canvasHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    });

  }, [data]);

  return (
    <div className="space-y-2">
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={height}
        className="w-full border rounded"
      />
      <div className="flex justify-center space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-0.5 bg-red-500"></div>
          <span>CPU</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-0.5 bg-yellow-500"></div>
          <span>Memory</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-0.5 bg-green-500"></div>
          <span>Disk</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-0.5 bg-blue-500"></div>
          <span>Network</span>
        </div>
      </div>
    </div>
  );
}

export function ResourceMonitoring() {
  const [metrics, setMetrics] = useState<ResourceMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResourceMetrics = async () => {
      try {
        setLoading(true);
        
        // Generate mock resource metrics
        const mockMetrics = generateMockResourceMetrics();
        setMetrics(mockMetrics);
        
        // Update historical data
        const timestamp = Date.now();
        setHistoricalData(prev => {
          const newData = [...prev, {
            timestamp,
            cpu: mockMetrics.cpu.usage,
            memory: mockMetrics.memory.usagePercent,
            disk: mockMetrics.disk.usagePercent,
            network: Math.min(100, (mockMetrics.network.bytesIn + mockMetrics.network.bytesOut) / 1024 / 1024 * 10) // Simplified network usage
          }];
          
          // Keep only last 50 data points
          return newData.slice(-50);
        });
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch resource metrics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchResourceMetrics();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchResourceMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const generateMockResourceMetrics = (): ResourceMetrics => {
    const now = Date.now();
    const hour = new Date(now).getHours();
    
    // Simulate daily patterns
    const baseLoad = 0.3 + (Math.sin((hour / 24) * 2 * Math.PI) + 1) * 0.3;
    
    // CPU metrics
    const cpuUsage = Math.min(95, Math.max(10, baseLoad * 60 + Math.random() * 20));
    const cpuStatus: 'good' | 'warning' | 'critical' = cpuUsage > 85 ? 'critical' : cpuUsage > 70 ? 'warning' : 'good';
    
    // Memory metrics
    const totalMemory = 16384; // 16GB in MB
    const memoryUsage = Math.min(90, Math.max(20, baseLoad * 70 + Math.random() * 15));
    const usedMemory = (memoryUsage / 100) * totalMemory;
    const memoryStatus: 'good' | 'warning' | 'critical' = memoryUsage > 85 ? 'critical' : memoryUsage > 75 ? 'warning' : 'good';
    
    // Disk metrics
    const totalDisk = 500 * 1024; // 500GB in MB
    const diskUsage = Math.min(95, Math.max(30, 45 + Math.random() * 20));
    const diskStatus: 'good' | 'warning' | 'critical' = diskUsage > 90 ? 'critical' : diskUsage > 80 ? 'warning' : 'good';
    
    // Network metrics
    const networkIn = Math.random() * 100 * 1024 * 1024; // MB/s
    const networkOut = Math.random() * 50 * 1024 * 1024; // MB/s
    const networkStatus: 'good' | 'warning' | 'critical' = (networkIn + networkOut) > 500 * 1024 * 1024 ? 'warning' : 'good';

    return {
      cpu: {
        usage: cpuUsage,
        cores: 8,
        loadAverage: [1.2, 1.5, 1.8],
        processes: Math.floor(200 + Math.random() * 100),
        status: cpuStatus
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: totalMemory - usedMemory,
        cached: usedMemory * 0.2,
        buffers: usedMemory * 0.1,
        usagePercent: memoryUsage,
        status: memoryStatus
      },
      disk: {
        total: totalDisk,
        used: (diskUsage / 100) * totalDisk,
        free: totalDisk - (diskUsage / 100) * totalDisk,
        usagePercent: diskUsage,
        iops: Math.floor(Math.random() * 1000 + 500),
        readSpeed: Math.random() * 200,
        writeSpeed: Math.random() * 150,
        status: diskStatus
      },
      network: {
        bytesIn: networkIn,
        bytesOut: networkOut,
        packetsIn: Math.floor(networkIn / 1024),
        packetsOut: Math.floor(networkOut / 1024),
        connections: Math.floor(Math.random() * 500 + 100),
        bandwidth: 1000, // 1Gbps
        latency: Math.random() * 10 + 1,
        status: networkStatus
      },
      containers: {
        total: 12,
        running: 10,
        stopped: 2,
        memory: Math.random() * 30 + 10,
        cpu: Math.random() * 20 + 5
      }
    };
  };

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <ServerIcon className="h-6 w-6 text-red-500" />
          <h3 className="ml-3 text-lg font-medium text-red-800">Error Loading Resource Metrics</h3>
        </div>
        <p className="mt-2 text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resource Overview Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CPU */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CpuChipIcon className="h-6 w-6 text-blue-500" />
                <h3 className="text-lg font-medium text-gray-900">CPU</h3>
              </div>
              {getStatusIcon(metrics.cpu.status)}
            </div>
            <div className="flex items-center justify-center mb-4">
              <CircularProgress 
                value={metrics.cpu.usage} 
                color={metrics.cpu.status === 'critical' ? '#EF4444' : metrics.cpu.status === 'warning' ? '#F59E0B' : '#10B981'}
              />
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Cores:</span>
                <span className="font-medium">{metrics.cpu.cores}</span>
              </div>
              <div className="flex justify-between">
                <span>Processes:</span>
                <span className="font-medium">{metrics.cpu.processes}</span>
              </div>
              <div className="flex justify-between">
                <span>Load Avg:</span>
                <span className="font-medium">{metrics.cpu.loadAverage.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Memory */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CircleStackIcon className="h-6 w-6 text-yellow-500" />
                <h3 className="text-lg font-medium text-gray-900">Memory</h3>
              </div>
              {getStatusIcon(metrics.memory.status)}
            </div>
            <div className="flex items-center justify-center mb-4">
              <CircularProgress 
                value={metrics.memory.usagePercent} 
                color={metrics.memory.status === 'critical' ? '#EF4444' : metrics.memory.status === 'warning' ? '#F59E0B' : '#10B981'}
              />
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-medium">{formatBytes(metrics.memory.total * 1024 * 1024)}</span>
              </div>
              <div className="flex justify-between">
                <span>Used:</span>
                <span className="font-medium">{formatBytes(metrics.memory.used * 1024 * 1024)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cached:</span>
                <span className="font-medium">{formatBytes(metrics.memory.cached * 1024 * 1024)}</span>
              </div>
            </div>
          </div>

          {/* Disk */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <ServerIcon className="h-6 w-6 text-green-500" />
                <h3 className="text-lg font-medium text-gray-900">Disk</h3>
              </div>
              {getStatusIcon(metrics.disk.status)}
            </div>
            <div className="flex items-center justify-center mb-4">
              <CircularProgress 
                value={metrics.disk.usagePercent} 
                color={metrics.disk.status === 'critical' ? '#EF4444' : metrics.disk.status === 'warning' ? '#F59E0B' : '#10B981'}
              />
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-medium">{formatBytes(metrics.disk.total * 1024 * 1024)}</span>
              </div>
              <div className="flex justify-between">
                <span>IOPS:</span>
                <span className="font-medium">{metrics.disk.iops}</span>
              </div>
              <div className="flex justify-between">
                <span>Read/Write:</span>
                <span className="font-medium">{metrics.disk.readSpeed.toFixed(1)}/{metrics.disk.writeSpeed.toFixed(1)} MB/s</span>
              </div>
            </div>
          </div>

          {/* Network */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <WifiIcon className="h-6 w-6 text-purple-500" />
                <h3 className="text-lg font-medium text-gray-900">Network</h3>
              </div>
              {getStatusIcon(metrics.network.status)}
            </div>
            <div className="space-y-3 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Inbound:</span>
                  <span className="font-medium">{formatBytes(metrics.network.bytesIn)}/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Outbound:</span>
                  <span className="font-medium">{formatBytes(metrics.network.bytesOut)}/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Connections:</span>
                  <span className="font-medium">{metrics.network.connections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Latency:</span>
                  <span className="font-medium">{metrics.network.latency.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bandwidth:</span>
                  <span className="font-medium">{metrics.network.bandwidth}Mbps</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Chart */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Resource Usage History</h3>
        </div>
        <div className="p-6">
          {historicalData.length > 0 ? (
            <ResourceChart data={historicalData} height={200} />
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Building History</h3>
                <p className="mt-1 text-sm text-gray-500">Resource usage data will appear here as it&apos;s collected.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Container Stats (if available) */}
      {metrics?.containers && (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Container Resources</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.containers.total}</div>
                <div className="text-sm text-gray-500">Total Containers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.containers.running}</div>
                <div className="text-sm text-gray-500">Running</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{metrics.containers.memory.toFixed(1)}%</div>
                <div className="text-sm text-gray-500">Memory Usage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics.containers.cpu.toFixed(1)}%</div>
                <div className="text-sm text-gray-500">CPU Usage</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Alerts */}
      {metrics && (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Resource Status</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'CPU', status: metrics.cpu.status, value: metrics.cpu.usage, unit: '%', threshold: '85%' },
                { name: 'Memory', status: metrics.memory.status, value: metrics.memory.usagePercent, unit: '%', threshold: '85%' },
                { name: 'Disk', status: metrics.disk.status, value: metrics.disk.usagePercent, unit: '%', threshold: '90%' },
                { name: 'Network', status: metrics.network.status, value: metrics.network.latency, unit: 'ms', threshold: '100ms' }
              ].map((resource) => (
                <div key={resource.name} className={`p-4 rounded-lg border ${
                  resource.status === 'critical' ? 'bg-red-50 border-red-200' :
                  resource.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(resource.status)}
                      <span className="font-medium">{resource.name}</span>
                    </div>
                    <span className={`text-sm font-medium ${getStatusColor(resource.status)}`}>
                      {resource.value.toFixed(1)}{resource.unit}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Threshold: {resource.threshold}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}