'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock, 
  Zap, 
  Database, 
  Globe, 
  Shield,
  TrendingUp,
  Calendar,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  description: string;
  responseTime: number;
  uptime: number;
  lastCheck: Date;
  incidents?: ServiceIncident[];
}

interface ServiceIncident {
  id: string;
  title: string;
  description: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  startTime: Date;
  endTime?: Date;
  updates: IncidentUpdate[];
}

interface IncidentUpdate {
  id: string;
  message: string;
  timestamp: Date;
  status: string;
}

interface SystemMetrics {
  overallStatus: 'operational' | 'degraded' | 'down';
  uptime: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  lastUpdated: Date;
}

const StatusPage = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<ServiceIncident[]>([]);
  const [pastIncidents, setPastIncidents] = useState<ServiceIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchStatusData();
    const interval = setInterval(fetchStatusData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStatusData = async () => {
    try {
      // Mock data - in production, this would fetch from your monitoring API
      const mockSystemMetrics: SystemMetrics = {
        overallStatus: 'operational',
        uptime: 99.97,
        responseTime: 142,
        throughput: 1250,
        errorRate: 0.03,
        lastUpdated: new Date(),
      };

      const mockServices: ServiceStatus[] = [
        {
          id: 'api',
          name: 'API Gateway',
          status: 'operational',
          description: 'Core API services and endpoints',
          responseTime: 98,
          uptime: 99.99,
          lastCheck: new Date(),
        },
        {
          id: 'database',
          name: 'Database',
          status: 'operational',
          description: 'Primary database cluster',
          responseTime: 24,
          uptime: 99.95,
          lastCheck: new Date(),
        },
        {
          id: 'auth',
          name: 'Authentication',
          status: 'operational',
          description: 'User authentication and authorization',
          responseTime: 156,
          uptime: 99.98,
          lastCheck: new Date(),
        },
        {
          id: 'storage',
          name: 'File Storage',
          status: 'degraded',
          description: 'Cloud file storage and CDN',
          responseTime: 890,
          uptime: 99.2,
          lastCheck: new Date(),
        },
        {
          id: 'monitoring',
          name: 'Monitoring',
          status: 'operational',
          description: 'System monitoring and alerting',
          responseTime: 67,
          uptime: 99.94,
          lastCheck: new Date(),
        },
        {
          id: 'ai',
          name: 'AI Services',
          status: 'operational',
          description: 'AI processing and content generation',
          responseTime: 1240,
          uptime: 99.87,
          lastCheck: new Date(),
        },
      ];

      const mockActiveIncidents: ServiceIncident[] = [
        {
          id: 'inc_001',
          title: 'Elevated response times for File Storage',
          description: 'We are investigating elevated response times affecting file upload and download operations.',
          status: 'investigating',
          severity: 'minor',
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          updates: [
            {
              id: 'upd_001',
              message: 'We have identified the root cause and are implementing a fix.',
              timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
              status: 'identified',
            },
            {
              id: 'upd_002',
              message: 'We are investigating reports of slow file storage operations.',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
              status: 'investigating',
            },
          ],
        },
      ];

      const mockPastIncidents: ServiceIncident[] = [
        {
          id: 'inc_002',
          title: 'API Gateway maintenance completed',
          description: 'Scheduled maintenance for API Gateway infrastructure has been completed successfully.',
          status: 'resolved',
          severity: 'minor',
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          endTime: new Date(Date.now() - 22 * 60 * 60 * 1000), // 22 hours ago
          updates: [
            {
              id: 'upd_003',
              message: 'Maintenance completed successfully. All services are operating normally.',
              timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000),
              status: 'resolved',
            },
            {
              id: 'upd_004',
              message: 'Maintenance is in progress. Expected completion in 30 minutes.',
              timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
              status: 'monitoring',
            },
          ],
        },
      ];

      setSystemMetrics(mockSystemMetrics);
      setServices(mockServices);
      setActiveIncidents(mockActiveIncidents);
      setPastIncidents(mockPastIncidents);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch status data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'maintenance':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'down':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'maintenance':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: ServiceIncident['severity']) => {
    switch (severity) {
      case 'minor':
        return 'text-yellow-600 bg-yellow-100';
      case 'major':
        return 'text-orange-600 bg-orange-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const diff = end.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Zenith Platform Status</h1>
              <p className="text-gray-600 mt-2">
                Real-time status and performance metrics for all services
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Clock className="w-4 h-4" />
                Last updated: {formatRelativeTime(lastRefresh)}
              </div>
              <Button 
                onClick={fetchStatusData}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Status */}
        {systemMetrics && (
          <Card className="p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {getStatusIcon(systemMetrics.overallStatus)}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    All Systems Operational
                  </h2>
                  <p className="text-gray-600">
                    All services are running smoothly
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  {systemMetrics.uptime}%
                </div>
                <div className="text-sm text-gray-500">Uptime (30 days)</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{systemMetrics.responseTime}ms</div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{systemMetrics.throughput.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Requests/min</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{systemMetrics.errorRate}%</div>
                <div className="text-sm text-gray-600">Error Rate</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3">
                  <Globe className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">5</div>
                <div className="text-sm text-gray-600">Global Regions</div>
              </div>
            </div>
          </Card>
        )}

        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Active Incidents</h2>
            <div className="space-y-4">
              {activeIncidents.map(incident => (
                <Card key={incident.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(incident.severity)}`}>
                          {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDuration(incident.startTime)} duration
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {incident.title}
                      </h3>
                      <p className="text-gray-600">{incident.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {incident.updates.map(update => (
                      <div key={update.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {update.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatRelativeTime(update.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{update.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Services Status */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Services</h2>
          <div className="grid gap-4">
            {services.map(service => (
              <Card key={service.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(service.status)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {service.name}
                      </h3>
                      <p className="text-gray-600">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        {service.responseTime}ms
                      </div>
                      <div className="text-sm text-gray-500">Response Time</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        {service.uptime}%
                      </div>
                      <div className="text-sm text-gray-500">Uptime</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(service.status)}`}>
                      {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Past Incidents */}
        {pastIncidents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Incidents</h2>
            <div className="space-y-4">
              {pastIncidents.map(incident => (
                <Card key={incident.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-medium text-green-600">Resolved</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(incident.severity)}`}>
                          {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDuration(incident.startTime, incident.endTime)} duration
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {incident.title}
                      </h3>
                      <p className="text-gray-600">{incident.description}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatRelativeTime(incident.startTime)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Subscribe to Updates
              </h3>
              <p className="text-gray-600">
                Get notified about service status changes and planned maintenance.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Subscribe
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                API Status
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StatusPage;