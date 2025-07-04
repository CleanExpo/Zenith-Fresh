'use client';

/**
 * Advanced Enterprise AI Platform - AI Control Center
 * Main dashboard for managing all AI operations and monitoring
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Activity, 
  Shield, 
  FileText, 
  MessageSquare, 
  BarChart3,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Zap,
  Eye,
  Award
} from 'lucide-react';

interface AIMetrics {
  totalModels: number;
  activeModels: number;
  totalProcessing: number;
  successRate: number;
  averageLatency: number;
  costThisMonth: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    gpu: number;
  };
  alerts: Array<{
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: Date;
  }>;
}

interface RecentActivity {
  id: string;
  type: 'model_trained' | 'prediction_made' | 'document_processed' | 'conversation_started' | 'bias_detected' | 'audit_completed';
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
}

export const AIControlCenter: React.FC = () => {
  const [metrics, setMetrics] = useState<AIMetrics>({
    totalModels: 0,
    activeModels: 0,
    totalProcessing: 0,
    successRate: 0,
    averageLatency: 0,
    costThisMonth: 0,
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    uptime: 0,
    resourceUsage: { cpu: 0, memory: 0, gpu: 0 },
    alerts: [],
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      updateMetrics();
      updateSystemHealth();
      updateRecentActivity();
    }, 5000);

    // Initial load
    updateMetrics();
    updateSystemHealth();
    updateRecentActivity();

    return () => clearInterval(interval);
  }, []);

  const updateMetrics = () => {
    setMetrics({
      totalModels: 47,
      activeModels: 23,
      totalProcessing: Math.floor(Math.random() * 1000) + 500,
      successRate: 0.97 + Math.random() * 0.02,
      averageLatency: 120 + Math.random() * 50,
      costThisMonth: 2847.32,
    });
  };

  const updateSystemHealth = () => {
    const cpu = 45 + Math.random() * 30;
    const memory = 60 + Math.random() * 25;
    const gpu = 70 + Math.random() * 20;
    
    let status: SystemHealth['status'] = 'healthy';
    if (cpu > 80 || memory > 85 || gpu > 90) status = 'critical';
    else if (cpu > 70 || memory > 75 || gpu > 80) status = 'warning';

    setSystemHealth({
      status,
      uptime: 99.8 + Math.random() * 0.2,
      resourceUsage: { cpu, memory, gpu },
      alerts: [
        {
          type: 'info',
          message: 'Model training completed successfully',
          timestamp: new Date(Date.now() - Math.random() * 3600000),
        },
        {
          type: 'warning',
          message: 'High GPU utilization detected',
          timestamp: new Date(Date.now() - Math.random() * 7200000),
        },
      ],
    });
  };

  const updateRecentActivity = () => {
    const activities: RecentActivity[] = [
      {
        id: '1',
        type: 'model_trained',
        description: 'Customer sentiment model v2.1 training completed',
        timestamp: new Date(Date.now() - 300000),
        status: 'success',
      },
      {
        id: '2',
        type: 'bias_detected',
        description: 'Bias threshold exceeded in loan approval model',
        timestamp: new Date(Date.now() - 600000),
        status: 'warning',
      },
      {
        id: '3',
        type: 'document_processed',
        description: 'Contract analysis completed for DocuSign integration',
        timestamp: new Date(Date.now() - 900000),
        status: 'success',
      },
      {
        id: '4',
        type: 'conversation_started',
        description: 'New customer support conversation initiated',
        timestamp: new Date(Date.now() - 1200000),
        status: 'success',
      },
      {
        id: '5',
        type: 'audit_completed',
        description: 'GDPR compliance audit finished with 94% score',
        timestamp: new Date(Date.now() - 1800000),
        status: 'success',
      },
    ];

    setRecentActivity(activities);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'critical':
      case 'error':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'model_trained':
        return <Brain className="w-4 h-4" />;
      case 'prediction_made':
        return <TrendingUp className="w-4 h-4" />;
      case 'document_processed':
        return <FileText className="w-4 h-4" />;
      case 'conversation_started':
        return <MessageSquare className="w-4 h-4" />;
      case 'bias_detected':
        return <Shield className="w-4 h-4" />;
      case 'audit_completed':
        return <Award className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Control Center</h1>
          <p className="text-gray-600">Manage and monitor your enterprise AI operations</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* System Health Alert */}
      {systemHealth.status !== 'healthy' && (
        <div className={`p-4 rounded-lg border ${
          systemHealth.status === 'critical' 
            ? 'bg-red-50 border-red-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center">
            <AlertTriangle className={`w-5 h-5 mr-2 ${
              systemHealth.status === 'critical' ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <span className="font-medium">
              System Health: {systemHealth.status === 'critical' ? 'Critical' : 'Warning'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            High resource utilization detected. Consider scaling your infrastructure.
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Models</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalModels}</p>
              <p className="text-xs text-gray-500">{metrics.activeModels} active</p>
            </div>
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Processing Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalProcessing}</p>
              <p className="text-xs text-green-600">+12% from yesterday</p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{(metrics.successRate * 100).toFixed(1)}%</p>
              <p className="text-xs text-green-600">Above target</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Latency</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.averageLatency.toFixed(0)}ms</p>
              <p className="text-xs text-yellow-600">+5ms from last hour</p>
            </div>
            <Zap className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="ethics">Ethics</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">System Health</h3>
                <Badge variant={systemHealth.status === 'healthy' ? 'default' : 'destructive'}>
                  {systemHealth.status}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Uptime</span>
                    <span>{systemHealth.uptime.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${systemHealth.uptime}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU Usage</span>
                    <span>{systemHealth.resourceUsage.cpu.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        systemHealth.resourceUsage.cpu > 80 ? 'bg-red-600' : 
                        systemHealth.resourceUsage.cpu > 70 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${systemHealth.resourceUsage.cpu}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory Usage</span>
                    <span>{systemHealth.resourceUsage.memory.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        systemHealth.resourceUsage.memory > 80 ? 'bg-red-600' : 
                        systemHealth.resourceUsage.memory > 70 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${systemHealth.resourceUsage.memory}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>GPU Usage</span>
                    <span>{systemHealth.resourceUsage.gpu.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        systemHealth.resourceUsage.gpu > 80 ? 'bg-red-600' : 
                        systemHealth.resourceUsage.gpu > 70 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${systemHealth.resourceUsage.gpu}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>
              
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-1 rounded-full ${getStatusColor(activity.status)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <div className={getStatusColor(activity.status)}>
                      {getStatusIcon(activity.status)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Cost and Usage */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Cost & Usage Summary</h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">${metrics.costThisMonth}</p>
                <p className="text-sm text-gray-600">This month</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Brain className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Model Training</p>
                <p className="text-lg font-bold text-blue-600">$1,247</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Inference</p>
                <p className="text-lg font-bold text-green-600">$892</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Document Processing</p>
                <p className="text-lg font-bold text-purple-600">$456</p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <MessageSquare className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Conversations</p>
                <p className="text-lg font-bold text-orange-600">$252</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Model Management</h3>
            <p className="text-gray-600">Model management interface will be implemented here.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline">
                <Brain className="w-4 h-4 mr-2" />
                Train New Model
              </Button>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                View All Models
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Model Registry
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="processing">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Processing Pipeline</h3>
            <p className="text-gray-600">Processing pipeline management interface will be implemented here.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline">
                <Activity className="w-4 h-4 mr-2" />
                View Queue
              </Button>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Document Processing
              </Button>
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Conversation Management
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="ethics">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Ethics & Governance</h3>
            <p className="text-gray-600">Ethics and governance dashboard will be implemented here.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline">
                <Shield className="w-4 h-4 mr-2" />
                Bias Detection
              </Button>
              <Button variant="outline">
                <Award className="w-4 h-4 mr-2" />
                Compliance Audits
              </Button>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Explainability Reports
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Real-time Monitoring</h3>
            <p className="text-gray-600">Comprehensive monitoring dashboard will be implemented here.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline">
                <Activity className="w-4 h-4 mr-2" />
                Performance Metrics
              </Button>
              <Button variant="outline">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Alert Management
              </Button>
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Resource Usage
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Analytics</h3>
            <p className="text-gray-600">Advanced analytics and insights dashboard will be implemented here.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                Usage Trends
              </Button>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                User Analytics
              </Button>
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Business Intelligence
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};