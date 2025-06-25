/**
 * Integration Monitoring Component
 * Monitors integration health, performance, and error tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Database,
  Globe,
  Shield,
  Users,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Download,
  Settings,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
  WifiOff,
  Server,
  AlertCircle,
  Eye,
  Bell,
  Pause,
  Play
} from 'lucide-react';

interface MonitoringMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  status: 'healthy' | 'warning' | 'critical';
  timestamp: Date;
}

interface IntegrationHealth {
  integrationId: string;
  name: string;
  provider: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  uptime: number;
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
  incidents: number;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  channels: string[];
}

// Mock monitoring data
const mockMetrics: MonitoringMetric[] = [
  {
    id: '1',
    name: 'Total API Calls',
    value: 1250000,
    unit: 'requests',
    trend: 'up',
    change: 12.5,
    status: 'healthy',
    timestamp: new Date()
  },
  {
    id: '2',
    name: 'Average Response Time',
    value: 245,
    unit: 'ms',
    trend: 'down',
    change: -8.2,
    status: 'healthy',
    timestamp: new Date()
  },
  {
    id: '3',
    name: 'Error Rate',
    value: 0.8,
    unit: '%',
    trend: 'up',
    change: 0.3,
    status: 'warning',
    timestamp: new Date()
  },
  {
    id: '4',
    name: 'Active Connections',
    value: 156,
    unit: 'connections',
    trend: 'stable',
    change: 0,
    status: 'healthy',
    timestamp: new Date()
  }
];

const mockIntegrationHealth: IntegrationHealth[] = [
  {
    integrationId: '1',
    name: 'Salesforce CRM',
    provider: 'salesforce',
    status: 'healthy',
    uptime: 99.9,
    responseTime: 180,
    errorRate: 0.2,
    lastChecked: new Date(),
    incidents: 0
  },
  {
    integrationId: '2',
    name: 'HubSpot Marketing',
    provider: 'hubspot',
    status: 'warning',
    uptime: 98.5,
    responseTime: 450,
    errorRate: 1.2,
    lastChecked: new Date(),
    incidents: 2
  },
  {
    integrationId: '3',
    name: 'Google Analytics',
    provider: 'google',
    status: 'critical',
    uptime: 95.2,
    responseTime: 850,
    errorRate: 4.8,
    lastChecked: new Date(),
    incidents: 5
  },
  {
    integrationId: '4',
    name: 'Slack Notifications',
    provider: 'slack',
    status: 'healthy',
    uptime: 99.8,
    responseTime: 120,
    errorRate: 0.1,
    lastChecked: new Date(),
    incidents: 0
  }
];

const mockAlertRules: AlertRule[] = [
  {
    id: '1',
    name: 'High Response Time',
    metric: 'response_time',
    condition: 'greater_than',
    threshold: 1000,
    severity: 'high',
    enabled: true,
    channels: ['email', 'slack']
  },
  {
    id: '2',
    name: 'Error Rate Threshold',
    metric: 'error_rate',
    condition: 'greater_than',
    threshold: 5,
    severity: 'critical',
    enabled: true,
    channels: ['email', 'slack', 'sms']
  },
  {
    id: '3',
    name: 'Low Uptime',
    metric: 'uptime',
    condition: 'less_than',
    threshold: 95,
    severity: 'high',
    enabled: true,
    channels: ['email']
  }
];

export default function IntegrationMonitoring() {
  const [metrics, setMetrics] = useState<MonitoringMetric[]>(mockMetrics);
  const [integrationHealth, setIntegrationHealth] = useState<IntegrationHealth[]>(mockIntegrationHealth);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(mockAlertRules);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      setLastUpdated(new Date());
      // Simulate minor metric changes
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * metric.value * 0.01,
        timestamp: new Date()
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') {
      return <ArrowUpRight className={`h-3 w-3 ${change > 0 ? 'text-green-600' : 'text-red-600'}`} />;
    } else if (trend === 'down') {
      return <ArrowDownRight className={`h-3 w-3 ${change < 0 ? 'text-green-600' : 'text-red-600'}`} />;
    }
    return null;
  };

  const overallSystemHealth = integrationHealth.reduce((acc, integration) => {
    if (integration.status === 'healthy') acc.healthy++;
    else if (integration.status === 'warning') acc.warning++;
    else if (integration.status === 'critical') acc.critical++;
    else acc.offline++;
    return acc;
  }, { healthy: 0, warning: 0, critical: 0, offline: 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Integration Monitoring</h2>
          <p className="text-gray-600">Monitor integration health, performance, and alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            className={isRealTimeEnabled ? 'bg-green-50 border-green-200' : ''}
          >
            {isRealTimeEnabled ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Real-time
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Healthy Integrations</p>
                <p className="text-3xl font-bold">{overallSystemHealth.healthy}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Warning</p>
                <p className="text-3xl font-bold">{overallSystemHealth.warning}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100">Critical</p>
                <p className="text-3xl font-bold">{overallSystemHealth.critical}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-100">Offline</p>
                <p className="text-3xl font-bold">{overallSystemHealth.offline}</p>
              </div>
              <WifiOff className="h-8 w-8 text-gray-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Status */}
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertDescription>
          Last updated: {lastUpdated.toLocaleTimeString()} • 
          Real-time monitoring {isRealTimeEnabled ? 'enabled' : 'paused'} • 
          Monitoring {integrationHealth.length} integrations
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health Status</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric) => (
              <Card key={metric.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                    <Badge className={getStatusColor(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {metric.value.toLocaleString()} {metric.unit}
                      </p>
                      {metric.change !== 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {getTrendIcon(metric.trend, metric.change)}
                          <span className={`text-xs ${
                            metric.change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Math.abs(metric.change)}% vs yesterday
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`w-2 h-2 rounded-full ${
                        metric.status === 'healthy' ? 'bg-green-500' :
                        metric.status === 'warning' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Response time and error rate over the last {selectedTimeRange}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <LineChart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Performance charts will be displayed here</p>
                  <p className="text-sm">Real-time metrics visualization</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardContent className="p-6 text-center">
                <Bell className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                <h3 className="font-semibold mb-2">Configure Alerts</h3>
                <p className="text-sm text-gray-600">Set up monitoring alerts and notifications</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-3 text-green-500" />
                <h3 className="font-semibold mb-2">View Reports</h3>
                <p className="text-sm text-gray-600">Generate detailed monitoring reports</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardContent className="p-6 text-center">
                <Settings className="h-8 w-8 mx-auto mb-3 text-purple-500" />
                <h3 className="font-semibold mb-2">Monitoring Settings</h3>
                <p className="text-sm text-gray-600">Configure monitoring parameters</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4">
            {integrationHealth.map((integration) => (
              <Card key={integration.integrationId}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {integration.provider === 'salesforce' ? '☁️' :
                         integration.provider === 'hubspot' ? '🧡' :
                         integration.provider === 'google' ? '📊' :
                         integration.provider === 'slack' ? '💬' : '🔗'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{integration.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">{integration.provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(integration.status)}>
                        {getStatusIcon(integration.status)}
                        {integration.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Uptime</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold">{integration.uptime}%</p>
                        <Progress value={integration.uptime} className="flex-1" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Response Time</p>
                      <p className="text-lg font-semibold">{integration.responseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Error Rate</p>
                      <p className="text-lg font-semibold">{integration.errorRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Incidents (24h)</p>
                      <p className="text-lg font-semibold">{integration.incidents}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Last checked: {integration.lastChecked.toLocaleTimeString()}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Activity className="h-4 w-4 mr-2" />
                        Logs
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>API Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Average Response Time</span>
                    <span className="font-semibold">245ms</span>
                  </div>
                  <Progress value={25} className="w-full" />
                  
                  <div className="flex justify-between items-center">
                    <span>95th Percentile</span>
                    <span className="font-semibold">890ms</span>
                  </div>
                  <Progress value={89} className="w-full" />
                  
                  <div className="flex justify-between items-center">
                    <span>Error Rate</span>
                    <span className="font-semibold">0.8%</span>
                  </div>
                  <Progress value={0.8} className="w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>CPU Usage</span>
                    <span className="font-semibold">45%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Usage</span>
                    <span className="font-semibold">2.1GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network I/O</span>
                    <span className="font-semibold">156 MB/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Connections</span>
                    <span className="font-semibold">1,234</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Detailed metrics charts will be displayed here</p>
                <p className="text-sm">Custom dashboards and real-time analytics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Alert Rules</h3>
            <Button className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Create Alert Rule
            </Button>
          </div>

          <div className="grid gap-4">
            {alertRules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        rule.severity === 'critical' ? 'bg-red-500' :
                        rule.severity === 'high' ? 'bg-orange-500' :
                        rule.severity === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div>
                        <h4 className="font-semibold">{rule.name}</h4>
                        <p className="text-sm text-gray-600">
                          Trigger when {rule.metric} is {rule.condition.replace('_', ' ')} {rule.threshold}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(rule.severity)}>
                        {rule.severity}
                      </Badge>
                      <Badge variant="outline">
                        {rule.channels.length} channels
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* Toggle rule */}}
                      >
                        {rule.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Incidents</CardTitle>
              <CardDescription>Integration incidents and resolution status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Incident management dashboard will be displayed here</p>
                <p className="text-sm">Track incidents, resolutions, and post-mortems</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}