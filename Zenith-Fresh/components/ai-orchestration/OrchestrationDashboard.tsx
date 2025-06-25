"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bot,
  Brain,
  Activity,
  DollarSign,
  MessageSquare,
  Workflow,
  Route,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Zap,
  Shield,
  BarChart3,
  Users,
  Server
} from 'lucide-react';
import { motion } from 'framer-motion';

// Import all the orchestration components
import AIModelManagement from './AIModelManagement';
import WorkflowOrchestration from './WorkflowOrchestration';
import TaskAutomation from './TaskAutomation';
import ConversationManagement from './ConversationManagement';
import AIPerformanceMonitoring from './AIPerformanceMonitoring';
import CostTrackingBudget from './CostTrackingBudget';
import AIABTesting from './AIABTesting';
import AIGovernanceCompliance from './AIGovernanceCompliance';
import EnterpriseDeployment from './EnterpriseDeployment';

interface DashboardStats {
  agents: {
    total: number;
    active: number;
    healthy: number;
    warnings: number;
  };
  models: {
    total: number;
    active: number;
    providers: number;
  };
  workflows: {
    total: number;
    active: number;
    executions: number;
    successRate: number;
  };
  conversations: {
    total: number;
    active: number;
    messages: number;
    averageLatency: number;
  };
  costs: {
    totalSpend: number;
    monthlyBudget: number;
    budgetUtilization: number;
    alertsCount: number;
  };
  performance: {
    averageLatency: number;
    successRate: number;
    errorRate: number;
    throughput: number;
  };
}

interface SystemAlert {
  id: string;
  type: 'performance' | 'cost' | 'security' | 'capacity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  isResolved: boolean;
}

export default function OrchestrationDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    agents: { total: 0, active: 0, healthy: 0, warnings: 0 },
    models: { total: 0, active: 0, providers: 0 },
    workflows: { total: 0, active: 0, executions: 0, successRate: 0 },
    conversations: { total: 0, active: 0, messages: 0, averageLatency: 0 },
    costs: { totalSpend: 0, monthlyBudget: 0, budgetUtilization: 0, alertsCount: 0 },
    performance: { averageLatency: 0, successRate: 0, errorRate: 0, throughput: 0 }
  });
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, alertsResponse] = await Promise.all([
        fetch('/api/ai-orchestration/dashboard/stats'),
        fetch('/api/ai-orchestration/dashboard/alerts')
      ]);

      const statsData = await statsResponse.json();
      const alertsData = await alertsResponse.json();

      setStats(statsData.stats || stats);
      setAlerts(alertsData.alerts || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/ai-orchestration/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true })
      });

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const criticalAlerts = alerts.filter(alert => !alert.isResolved && alert.severity === 'critical');
  const highAlerts = alerts.filter(alert => !alert.isResolved && alert.severity === 'high');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agent Orchestration</h1>
          <p className="text-muted-foreground">
            Comprehensive AI model management and workflow orchestration platform
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>System Healthy</span>
          </Badge>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{criticalAlerts.length} critical alert(s)</strong> require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewDashboard 
            stats={stats} 
            alerts={alerts.filter(alert => !alert.isResolved)}
            onResolveAlert={resolveAlert}
          />
        </TabsContent>

        <TabsContent value="models">
          <AIModelManagement />
        </TabsContent>

        <TabsContent value="workflows">
          <WorkflowOrchestration />
        </TabsContent>

        <TabsContent value="automation">
          <TaskAutomation />
        </TabsContent>

        <TabsContent value="conversations">
          <ConversationManagement />
        </TabsContent>

        <TabsContent value="monitoring">
          <AIPerformanceMonitoring />
        </TabsContent>

        <TabsContent value="costs">
          <CostTrackingBudget />
        </TabsContent>

        <TabsContent value="testing">
          <AIABTesting />
        </TabsContent>

        <TabsContent value="governance">
          <AIGovernanceCompliance />
        </TabsContent>

        <TabsContent value="deployment">
          <EnterpriseDeployment />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewDashboard({ stats, alerts, onResolveAlert }: {
  stats: DashboardStats;
  alerts: SystemAlert[];
  onResolveAlert: (alertId: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Agents Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agents.active}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>of {stats.agents.total} total</span>
              <Badge variant={stats.agents.warnings > 0 ? "destructive" : "default"} className="text-xs">
                {stats.agents.healthy} healthy
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Models Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.models.active}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>{stats.models.providers} providers</span>
              <span>•</span>
              <span>{stats.models.total} total</span>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.performance.averageLatency}ms</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>{stats.performance.successRate.toFixed(1)}% success</span>
              <span>•</span>
              <span>{stats.performance.throughput} req/s</span>
            </div>
          </CardContent>
        </Card>

        {/* Costs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.costs.totalSpend.toFixed(0)}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>{stats.costs.budgetUtilization.toFixed(1)}% of budget</span>
              {stats.costs.alertsCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.costs.alertsCount} alerts
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.workflows.active}</div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                {stats.workflows.executions.toLocaleString()} executions
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.workflows.successRate.toFixed(1)}% success rate
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversations.active}</div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                {stats.conversations.messages.toLocaleString()} messages
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.conversations.averageLatency}ms avg latency
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                {stats.performance.errorRate.toFixed(2)}% error rate
              </div>
              <div className="text-xs text-muted-foreground">
                All systems operational
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Overview and Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Real-time status of all AI orchestration components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatusIndicator 
                label="AI Models" 
                status="healthy" 
                details={`${stats.models.active}/${stats.models.total} active`}
              />
              <StatusIndicator 
                label="Agents" 
                status={stats.agents.warnings > 0 ? "warning" : "healthy"} 
                details={`${stats.agents.healthy} healthy, ${stats.agents.warnings} warnings`}
              />
              <StatusIndicator 
                label="Workflows" 
                status="healthy" 
                details={`${stats.workflows.active} active workflows`}
              />
              <StatusIndicator 
                label="Performance" 
                status={stats.performance.errorRate > 5 ? "warning" : "healthy"} 
                details={`${stats.performance.averageLatency}ms latency, ${stats.performance.errorRate.toFixed(1)}% errors`}
              />
              <StatusIndicator 
                label="Budget" 
                status={stats.costs.budgetUtilization > 90 ? "critical" : stats.costs.budgetUtilization > 75 ? "warning" : "healthy"} 
                details={`${stats.costs.budgetUtilization.toFixed(1)}% of monthly budget used`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>
              {alerts.length > 0 ? `${alerts.length} active alerts` : 'No active alerts'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <AlertCard 
                    key={alert.id} 
                    alert={alert} 
                    onResolve={onResolveAlert} 
                  />
                ))}
                {alerts.length > 5 && (
                  <div className="text-sm text-muted-foreground text-center pt-2">
                    And {alerts.length - 5} more alerts...
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="mx-auto h-8 w-8 mb-2 text-green-500" />
                <div>No active alerts</div>
                <div className="text-sm">All systems operating normally</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common orchestration tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Button variant="outline" className="h-16 flex flex-col space-y-1">
              <Bot className="h-5 w-5" />
              <span className="text-sm">Deploy Agent</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col space-y-1">
              <Workflow className="h-5 w-5" />
              <span className="text-sm">Create Workflow</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col space-y-1">
              <Route className="h-5 w-5" />
              <span className="text-sm">Setup Routing</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col space-y-1">
              <BarChart3 className="h-5 w-5" />
              <span className="text-sm">View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusIndicator({ label, status, details }: {
  label: string;
  status: 'healthy' | 'warning' | 'critical';
  details: string;
}) {
  const statusConfig = {
    healthy: { color: 'bg-green-500', textColor: 'text-green-700', icon: CheckCircle },
    warning: { color: 'bg-yellow-500', textColor: 'text-yellow-700', icon: AlertTriangle },
    critical: { color: 'bg-red-500', textColor: 'text-red-700', icon: AlertTriangle }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${config.color}`} />
        <div>
          <div className="font-medium">{label}</div>
          <div className="text-sm text-muted-foreground">{details}</div>
        </div>
      </div>
      <Icon className={`h-4 w-4 ${config.textColor}`} />
    </div>
  );
}

function AlertCard({ alert, onResolve }: {
  alert: SystemAlert;
  onResolve: (alertId: string) => void;
}) {
  const severityColors = {
    low: 'border-blue-200 bg-blue-50',
    medium: 'border-yellow-200 bg-yellow-50',
    high: 'border-orange-200 bg-orange-50',
    critical: 'border-red-200 bg-red-50'
  };

  const severityTextColors = {
    low: 'text-blue-800',
    medium: 'text-yellow-800',
    high: 'text-orange-800',
    critical: 'text-red-800'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 border rounded-lg ${severityColors[alert.severity]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`font-medium ${severityTextColors[alert.severity]}`}>
            {alert.title}
          </div>
          <div className={`text-sm ${severityTextColors[alert.severity]} opacity-80`}>
            {alert.description}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(alert.timestamp).toLocaleString()}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="capitalize">
            {alert.severity}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onResolve(alert.id)}
          >
            Resolve
          </Button>
        </div>
      </div>
    </motion.div>
  );
}