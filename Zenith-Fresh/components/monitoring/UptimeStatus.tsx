'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  ServerIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

interface UptimeData {
  timestamp: number;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  region: string;
}

interface ServiceStatus {
  service: string;
  status: 'operational' | 'degraded' | 'outage';
  uptime: number;
  lastIncident?: Date;
  avgResponseTime: number;
  regions: {
    [key: string]: {
      status: 'up' | 'down' | 'degraded';
      responseTime: number;
      lastCheck: Date;
    };
  };
}

interface UptimeStats {
  overall: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  incidents: number;
  avgResponseTime: number;
}

// Uptime visualization component
function UptimeHeatmap({ data, days = 90 }: { data: UptimeData[]; days?: number }) {
  const now = new Date();
  const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  
  // Group data by day
  const dayData: { [key: string]: UptimeData[] } = {};
  data.forEach(item => {
    const day = new Date(item.timestamp).toDateString();
    if (!dayData[day]) dayData[day] = [];
    dayData[day].push(item);
  });

  // Generate day blocks
  const dayBlocks = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
    const dayKey = date.toDateString();
    const dayStatus = getDayStatus(dayData[dayKey] || []);
    
    dayBlocks.push({
      date,
      status: dayStatus,
      data: dayData[dayKey] || []
    });
  }

  function getDayStatus(dayItems: UptimeData[]): 'up' | 'down' | 'degraded' | 'no-data' {
    if (dayItems.length === 0) return 'no-data';
    
    const downCount = dayItems.filter(item => item.status === 'down').length;
    const degradedCount = dayItems.filter(item => item.status === 'degraded').length;
    
    if (downCount > 0) return 'down';
    if (degradedCount > dayItems.length * 0.1) return 'degraded'; // >10% degraded
    return 'up';
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'up': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-200';
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Past {days} days (hover for details)
      </div>
      <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 lg:grid-cols-30 gap-1">
        {dayBlocks.map((block, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-sm cursor-pointer ${getStatusColor(block.status)} hover:ring-2 hover:ring-gray-400 transition-all`}
            title={`${block.date.toLocaleDateString()}: ${block.status} (${block.data.length} checks)`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{startDate.toLocaleDateString()}</span>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-sm"></div>
            <span>Up</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-sm"></div>
            <span>Degraded</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-sm"></div>
            <span>Down</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-200 rounded-sm"></div>
            <span>No data</span>
          </div>
        </div>
        <span>{now.toLocaleDateString()}</span>
      </div>
    </div>
  );
}

export function UptimeStatus() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [uptimeData, setUptimeData] = useState<UptimeData[]>([]);
  const [uptimeStats, setUptimeStats] = useState<UptimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>('main-website');

  useEffect(() => {
    const fetchUptimeData = async () => {
      try {
        setLoading(true);
        
        // Generate mock uptime data
        const mockServices = generateMockServices();
        const mockUptimeData = generateMockUptimeData();
        const mockStats = calculateUptimeStats(mockUptimeData);
        
        setServices(mockServices);
        setUptimeData(mockUptimeData);
        setUptimeStats(mockStats);
      } catch (err) {
        console.error('Failed to fetch uptime data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUptimeData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchUptimeData, 60000);
    return () => clearInterval(interval);
  }, []);

  const generateMockServices = (): ServiceStatus[] => {
    const regions = ['us-east-1', 'us-west-1', 'eu-west-1', 'ap-southeast-1'];
    
    return [
      {
        service: 'main-website',
        status: 'operational',
        uptime: 99.98,
        avgResponseTime: 245,
        regions: regions.reduce((acc, region) => ({
          ...acc,
          [region]: {
            status: Math.random() > 0.05 ? 'up' : 'degraded',
            responseTime: 200 + Math.random() * 100,
            lastCheck: new Date()
          }
        }), {})
      },
      {
        service: 'api-gateway',
        status: 'operational',
        uptime: 99.95,
        avgResponseTime: 180,
        regions: regions.reduce((acc, region) => ({
          ...acc,
          [region]: {
            status: Math.random() > 0.03 ? 'up' : 'degraded',
            responseTime: 150 + Math.random() * 80,
            lastCheck: new Date()
          }
        }), {})
      },
      {
        service: 'database',
        status: 'operational',
        uptime: 99.99,
        avgResponseTime: 25,
        regions: regions.reduce((acc, region) => ({
          ...acc,
          [region]: {
            status: 'up',
            responseTime: 20 + Math.random() * 15,
            lastCheck: new Date()
          }
        }), {})
      },
      {
        service: 'cdn',
        status: 'degraded',
        uptime: 98.5,
        lastIncident: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        avgResponseTime: 450,
        regions: regions.reduce((acc, region) => ({
          ...acc,
          [region]: {
            status: Math.random() > 0.2 ? 'up' : 'degraded',
            responseTime: 300 + Math.random() * 300,
            lastCheck: new Date()
          }
        }), {})
      },
      {
        service: 'monitoring',
        status: 'operational',
        uptime: 99.97,
        avgResponseTime: 120,
        regions: regions.reduce((acc, region) => ({
          ...acc,
          [region]: {
            status: 'up',
            responseTime: 100 + Math.random() * 50,
            lastCheck: new Date()
          }
        }), {})
      }
    ];
  };

  const generateMockUptimeData = (): UptimeData[] => {
    const data: UptimeData[] = [];
    const now = Date.now();
    const days = 90;
    const checksPerDay = 24 * 4; // Every 15 minutes
    
    for (let day = days; day >= 0; day--) {
      for (let check = 0; check < checksPerDay; check++) {
        const timestamp = now - (day * 24 * 60 * 60 * 1000) + (check * 15 * 60 * 1000);
        
        // Simulate occasional outages and degraded performance
        let status: 'up' | 'down' | 'degraded' = 'up';
        let responseTime = 200 + Math.random() * 100;
        
        if (Math.random() < 0.001) { // 0.1% downtime
          status = 'down';
          responseTime = 0;
        } else if (Math.random() < 0.02) { // 2% degraded performance
          status = 'degraded';
          responseTime = 500 + Math.random() * 1000;
        }
        
        data.push({
          timestamp,
          status,
          responseTime,
          region: 'us-east-1'
        });
      }
    }
    
    return data;
  };

  const calculateUptimeStats = (data: UptimeData[]): UptimeStats => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    const totalChecks = data.length;
    const upChecks = data.filter(d => d.status === 'up').length;
    
    const todayData = data.filter(d => d.timestamp > now - dayMs);
    const todayUp = todayData.filter(d => d.status === 'up').length;
    
    const weekData = data.filter(d => d.timestamp > now - (7 * dayMs));
    const weekUp = weekData.filter(d => d.status === 'up').length;
    
    const monthData = data.filter(d => d.timestamp > now - (30 * dayMs));
    const monthUp = monthData.filter(d => d.status === 'up').length;
    
    const incidents = data.filter(d => d.status === 'down').length;
    
    const responseTimes = data.filter(d => d.status !== 'down').map(d => d.responseTime);
    const avgResponseTime = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;
    
    return {
      overall: (upChecks / totalChecks) * 100,
      today: todayData.length > 0 ? (todayUp / todayData.length) * 100 : 100,
      thisWeek: weekData.length > 0 ? (weekUp / weekData.length) * 100 : 100,
      thisMonth: monthData.length > 0 ? (monthUp / monthData.length) * 100 : 100,
      incidents,
      avgResponseTime
    };
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'main-website':
        return <GlobeAltIcon className="h-5 w-5" />;
      case 'api-gateway':
        return <ServerIcon className="h-5 w-5" />;
      case 'database':
        return <ServerIcon className="h-5 w-5" />;
      case 'cdn':
        return <SignalIcon className="h-5 w-5" />;
      case 'monitoring':
        return <ClockIcon className="h-5 w-5" />;
      default:
        return <ServerIcon className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'outage':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
      case 'up':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'outage':
      case 'down':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading uptime data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      {uptimeStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{uptimeStats.overall.toFixed(2)}%</div>
            <div className="text-sm text-gray-500">Overall Uptime</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{uptimeStats.today.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Today</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{uptimeStats.thisWeek.toFixed(2)}%</div>
            <div className="text-sm text-gray-500">This Week</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{uptimeStats.thisMonth.toFixed(2)}%</div>
            <div className="text-sm text-gray-500">This Month</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{uptimeStats.incidents}</div>
            <div className="text-sm text-gray-500">Incidents</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{Math.round(uptimeStats.avgResponseTime)}ms</div>
            <div className="text-sm text-gray-500">Avg Response</div>
          </div>
        </div>
      )}

      {/* Service Status */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Service Status</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.service} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getServiceIcon(service.service)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900 capitalize">
                        {service.service.replace('-', ' ')}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {service.uptime.toFixed(2)}% uptime • {Math.round(service.avgResponseTime)}ms avg response
                      {service.lastIncident && (
                        <span className="ml-2">
                          • Last incident: {service.lastIncident.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {Object.entries(service.regions).map(([region, data]) => (
                    <div
                      key={region}
                      className="flex items-center space-x-1 text-xs"
                      title={`${region}: ${data.status} (${Math.round(data.responseTime)}ms)`}
                    >
                      {getStatusIcon(data.status)}
                      <span className="text-gray-500">{region}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Uptime History */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Uptime History</h3>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              {services.map((service) => (
                <option key={service.service} value={service.service}>
                  {service.service.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-6">
          <UptimeHeatmap data={uptimeData} days={90} />
        </div>
      </div>

      {/* Incident Timeline */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Incidents</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Mock incidents */}
            <div className="border-l-4 border-red-500 pl-4">
              <div className="flex items-center space-x-2">
                <XCircleIcon className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-gray-900">CDN Degraded Performance</span>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Increased response times detected across multiple regions. Investigating with CDN provider.
              </p>
              <div className="text-xs text-gray-500 mt-1">
                Duration: 45 minutes • Affected: CDN service
              </div>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900">API Gateway Slowdown</span>
                <span className="text-xs text-gray-500">1 day ago</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                API response times increased due to high traffic volume during peak hours.
              </p>
              <div className="text-xs text-gray-500 mt-1">
                Duration: 20 minutes • Affected: API Gateway
              </div>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-gray-900">Scheduled Maintenance</span>
                <span className="text-xs text-gray-500">3 days ago</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Scheduled database maintenance completed successfully with no service interruption.
              </p>
              <div className="text-xs text-gray-500 mt-1">
                Duration: 30 minutes • Affected: None
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}