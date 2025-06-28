'use client';

/**
 * AI Agent Orchestration Dashboard Page
 * 
 * Central hub for managing, monitoring, and deploying AI agents across the platform.
 * Integrates with the OrchestrationDashboard and AIMLMonitoringDashboard components.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { OrchestrationDashboard } from '@/components/orchestration/OrchestrationDashboard';
import { AIMLMonitoringDashboard } from '@/components/ai/AIMLMonitoringDashboard';
import { AIInfrastructureIntegration } from '@/components/orchestration/AIInfrastructureIntegration';
import { 
  Cpu, 
  Settings, 
  Activity, 
  Brain, 
  Users, 
  Zap, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Plus,
  BarChart3,
  Globe,
  Layers,
  Workflow
} from 'lucide-react';

interface AgentMetrics {
  totalAgents: number;
  activeAgents: number;
  deployedAgents: number;
  queuedTasks: number;
  completedTasks: number;
  avgPerformance: number;
  systemHealth: number;
}

interface SystemStatus {
  orchestration: 'healthy' | 'warning' | 'critical';
  monitoring: 'healthy' | 'warning' | 'critical';
  deployment: 'healthy' | 'warning' | 'critical';
  analytics: 'healthy' | 'warning' | 'critical';
}

export default function OrchestrationPage() {
  const [metrics, setMetrics] = useState<AgentMetrics>({
    totalAgents: 32,
    activeAgents: 28,
    deployedAgents: 30,
    queuedTasks: 15,
    completedTasks: 1247,
    avgPerformance: 94.2,
    systemHealth: 98.5
  });

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    orchestration: 'healthy',
    monitoring: 'healthy',
    deployment: 'healthy',
    analytics: 'healthy'
  });

  const [selectedTab, setSelectedTab] = useState('overview');
  const [isSystemActive, setIsSystemActive] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        queuedTasks: Math.max(0, prev.queuedTasks + Math.floor(Math.random() * 3) - 1),
        completedTasks: prev.completedTasks + Math.floor(Math.random() * 2),
        avgPerformance: Math.min(100, Math.max(80, prev.avgPerformance + (Math.random() - 0.5) * 2)),
        systemHealth: Math.min(100, Math.max(85, prev.systemHealth + (Math.random() - 0.5) * 1))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agent Orchestration</h1>
          <p className="text-muted-foreground">
            Comprehensive AI agent management, deployment, and monitoring platform
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={isSystemActive ? "default" : "outline"}
            onClick={() => setIsSystemActive(!isSystemActive)}
            className="flex items-center gap-2"
          >
            {isSystemActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isSystemActive ? 'Pause System' : 'Activate System'}
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Deploy Agent
          </Button>
        </div>
      </div>

      {/* System Status Alert */}
      {Object.values(systemStatus).some(status => status !== 'healthy') && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>System Status Alert</AlertTitle>
          <AlertDescription>
            One or more components require attention. Check the monitoring dashboard for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              of {metrics.totalAgents} total agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Queue</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.queuedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.completedTasks.toLocaleString()} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgPerformance.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average efficiency score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.systemHealth.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Overall system status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Components Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Components
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-2">
                <Workflow className="w-4 h-4" />
                <span className="font-medium">Orchestration</span>
              </div>
              <div className={`flex items-center gap-1 ${getStatusColor(systemStatus.orchestration)}`}>
                {getStatusIcon(systemStatus.orchestration)}
                <Badge variant="outline" className={getStatusColor(systemStatus.orchestration)}>
                  {systemStatus.orchestration}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="font-medium">Monitoring</span>
              </div>
              <div className={`flex items-center gap-1 ${getStatusColor(systemStatus.monitoring)}`}>
                {getStatusIcon(systemStatus.monitoring)}
                <Badge variant="outline" className={getStatusColor(systemStatus.monitoring)}>
                  {systemStatus.monitoring}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="font-medium">Deployment</span>
              </div>
              <div className={`flex items-center gap-1 ${getStatusColor(systemStatus.deployment)}`}>
                {getStatusIcon(systemStatus.deployment)}
                <Badge variant="outline" className={getStatusColor(systemStatus.deployment)}>
                  {systemStatus.deployment}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span className="font-medium">Analytics</span>
              </div>
              <div className={`flex items-center gap-1 ${getStatusColor(systemStatus.analytics)}`}>
                {getStatusIcon(systemStatus.analytics)}
                <Badge variant="outline" className={getStatusColor(systemStatus.analytics)}>
                  {systemStatus.analytics}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="orchestration" className="flex items-center gap-2">
            <Workflow className="w-4 h-4" />
            Agent Management
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            AI/ML Monitoring
          </TabsTrigger>
          <TabsTrigger value="deployment" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Deployment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Deploy New Agent
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Agent Configuration
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Performance Analytics
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Zap className="w-4 h-4 mr-2" />
                  Task Automation Setup
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Agent Efficiency</span>
                  <span className="text-sm text-muted-foreground">
                    {metrics.avgPerformance.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Task Completion Rate</span>
                  <span className="text-sm text-muted-foreground">98.4%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">System Uptime</span>
                  <span className="text-sm text-muted-foreground">99.7%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Cost Optimization</span>
                  <span className="text-sm text-green-600">-12.3%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orchestration">
          <OrchestrationDashboard />
        </TabsContent>

        <TabsContent value="monitoring">
          <AIMLMonitoringDashboard />
        </TabsContent>

        <TabsContent value="deployment">
          <Card>
            <CardHeader>
              <CardTitle>Agent Deployment Center</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Agent Marketplace</h3>
                <p className="text-muted-foreground mb-4">
                  Deploy pre-configured AI agents or create custom workflows
                </p>
                <Button className="mr-2">Browse Marketplace</Button>
                <Button variant="outline">Create Custom Agent</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}