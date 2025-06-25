"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Activity,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Brain,
  Zap,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Settings,
  Filter,
  Download,
  Eye,
  Cpu,
  Memory,
  Network,
  HardDrive
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PerformanceMetric {
  id: string;
  agentId: string;
  agentName: string;
  modelId?: string;
  modelName?: string;
  metricType: 'latency' | 'quality' | 'cost' | 'throughput' | 'error_rate';
  value: number;
  unit?: string;
  timeWindow: 'minute' | 'hour' | 'day' | 'week' | 'month';
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'p95' | 'p99';
  timestamp: Date;
}

interface PerformanceAlert {
  id: string;
  agentId: string;
  agentName: string;
  alertType: 'latency_spike' | 'error_rate_high' | 'cost_exceeded' | 'quality_drop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

interface AgentPerformance {
  agentId: string;
  agentName: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  uptime: number;
  totalRequests: number;
  successRate: number;
  averageLatency: number;
  errorRate: number;
  costEfficiency: number;
  qualityScore: number;
  throughput: number;
  lastUpdate: Date;
}

interface OptimizationSuggestion {
  id: string;
  agentId: string;
  agentName: string;
  type: 'model_switch' | 'parameter_tune' | 'scaling' | 'caching' | 'routing';
  title: string;
  description: string;
  estimatedImprovement: {
    latency?: number;
    cost?: number;
    quality?: number;
    throughput?: number;
  };
  priority: 'low' | 'medium' | 'high';
  implementationEffort: 'easy' | 'medium' | 'hard';
  potentialSavings: number;
}

const metricTypeInfo = {
  latency: { icon: Clock, label: 'Latency', unit: 'ms', color: 'text-blue-500' },
  quality: { icon: Target, label: 'Quality', unit: '%', color: 'text-green-500' },
  cost: { icon: DollarSign, label: 'Cost', unit: '$', color: 'text-yellow-500' },
  throughput: { icon: Zap, label: 'Throughput', unit: 'req/s', color: 'text-purple-500' },
  error_rate: { icon: AlertTriangle, label: 'Error Rate', unit: '%', color: 'text-red-500' }
};

const severityColors = {
  low: 'text-blue-500 bg-blue-50',
  medium: 'text-yellow-500 bg-yellow-50',
  high: 'text-orange-500 bg-orange-50',
  critical: 'text-red-500 bg-red-50'
};

export default function AIPerformanceMonitoring() {
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [metricType, setMetricType] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedAgent, timeRange, metricType]);

  const fetchPerformanceData = async () => {
    try {
      const [agentsRes, metricsRes, alertsRes, suggestionsRes] = await Promise.all([
        fetch('/api/ai-orchestration/performance/agents'),
        fetch(`/api/ai-orchestration/performance/metrics?agent=${selectedAgent}&timeRange=${timeRange}&type=${metricType}`),
        fetch('/api/ai-orchestration/performance/alerts'),
        fetch('/api/ai-orchestration/performance/suggestions')
      ]);

      const [agentsData, metricsData, alertsData, suggestionsData] = await Promise.all([
        agentsRes.json(),
        metricsRes.json(),
        alertsRes.json(),
        suggestionsRes.json()
      ]);

      setAgents(agentsData.agents || []);
      setMetrics(metricsData.metrics || []);
      setAlerts(alertsData.alerts || []);
      setSuggestions(suggestionsData.suggestions || []);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/ai-orchestration/performance/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true })
      });

      if (response.ok) {
        fetchPerformanceData();
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const applySuggestion = async (suggestionId: string) => {
    try {
      const response = await fetch(`/api/ai-orchestration/performance/suggestions/${suggestionId}/apply`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchPerformanceData();
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
    }
  };

  const healthyAgents = agents.filter(agent => agent.status === 'healthy').length;
  const warningAgents = agents.filter(agent => agent.status === 'warning').length;
  const criticalAgents = agents.filter(agent => agent.status === 'critical').length;
  const averageLatency = agents.length > 0 
    ? agents.reduce((sum, agent) => sum + agent.averageLatency, 0) / agents.length 
    : 0;
  const averageSuccessRate = agents.length > 0 
    ? agents.reduce((sum, agent) => sum + agent.successRate, 0) / agents.length 
    : 0;
  const totalRequests = agents.reduce((sum, agent) => sum + agent.totalRequests, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Performance Monitoring</h1>
          <p className="text-muted-foreground">Monitor and optimize AI agent performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-sm">
            <span>Auto Refresh</span>
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>
          <Button variant="outline" onClick={fetchPerformanceData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Agents</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthyAgents}</div>
            <p className="text-xs text-muted-foreground">
              {((healthyAgents / agents.length) * 100 || 0).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warningAgents}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalAgents}</div>
            <p className="text-xs text-muted-foreground">Immediate action required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageLatency.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">Across all agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageSuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average across agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg border">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agents.map(agent => (
              <SelectItem key={agent.agentId} value={agent.agentId}>
                {agent.agentName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">1 Hour</SelectItem>
            <SelectItem value="24h">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={metricType} onValueChange={setMetricType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Metrics</SelectItem>
            <SelectItem value="latency">Latency</SelectItem>
            <SelectItem value="quality">Quality</SelectItem>
            <SelectItem value="cost">Cost</SelectItem>
            <SelectItem value="throughput">Throughput</SelectItem>
            <SelectItem value="error_rate">Error Rate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewDashboard metrics={metrics} agents={agents} />
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <AgentPerformanceGrid agents={agents} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertsManagement alerts={alerts} onResolve={resolveAlert} />
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <OptimizationSuggestions suggestions={suggestions} onApply={applySuggestion} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewDashboard({ metrics, agents }: {
  metrics: PerformanceMetric[];
  agents: AgentPerformance[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Performance Trends Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Key metrics over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <LineChart className="h-8 w-8 mr-2" />
            Performance chart would be rendered here with a charting library
          </div>
        </CardContent>
      </Card>

      {/* Agent Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Health Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm">Healthy</span>
              </div>
              <span className="text-sm font-medium">
                {agents.filter(a => a.status === 'healthy').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-sm">Warning</span>
              </div>
              <span className="text-sm font-medium">
                {agents.filter(a => a.status === 'warning').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-sm">Critical</span>
              </div>
              <span className="text-sm font-medium">
                {agents.filter(a => a.status === 'critical').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full" />
                <span className="text-sm">Offline</span>
              </div>
              <span className="text-sm font-medium">
                {agents.filter(a => a.status === 'offline').length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Agents */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agents
              .sort((a, b) => b.qualityScore - a.qualityScore)
              .slice(0, 5)
              .map((agent, index) => (
                <div key={agent.agentId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm">{agent.agentName}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{agent.qualityScore.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">{agent.averageLatency}ms</div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AgentPerformanceGrid({ agents }: { agents: AgentPerformance[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <AgentPerformanceCard key={agent.agentId} agent={agent} />
      ))}
    </div>
  );
}

function AgentPerformanceCard({ agent }: { agent: AgentPerformance }) {
  const statusColor = {
    healthy: 'text-green-500 bg-green-50',
    warning: 'text-yellow-500 bg-yellow-50',
    critical: 'text-red-500 bg-red-50',
    offline: 'text-gray-500 bg-gray-50'
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{agent.agentName}</CardTitle>
          <Badge className={statusColor[agent.status]}>
            {agent.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Uptime */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uptime:</span>
            <span className="font-medium">{agent.uptime.toFixed(1)}%</span>
          </div>

          {/* Success Rate */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Success Rate:</span>
              <span className="font-medium">{agent.successRate.toFixed(1)}%</span>
            </div>
            <Progress value={agent.successRate} className="h-2" />
          </div>

          {/* Latency */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Avg Latency:</span>
            <span className="font-medium">{agent.averageLatency}ms</span>
          </div>

          {/* Quality Score */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Quality Score:</span>
              <span className="font-medium">{agent.qualityScore.toFixed(1)}%</span>
            </div>
            <Progress value={agent.qualityScore} className="h-2" />
          </div>

          {/* Requests */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Requests:</span>
            <span className="font-medium">{agent.totalRequests.toLocaleString()}</span>
          </div>

          {/* Error Rate */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Error Rate:</span>
            <span className="font-medium text-red-500">{agent.errorRate.toFixed(2)}%</span>
          </div>

          {/* Last Update */}
          <div className="text-xs text-muted-foreground">
            Last update: {new Date(agent.lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsManagement({ alerts, onResolve }: {
  alerts: PerformanceAlert[];
  onResolve: (alertId: string) => void;
}) {
  const activeAlerts = alerts.filter(alert => !alert.isResolved);
  const resolvedAlerts = alerts.filter(alert => alert.isResolved);

  return (
    <div className="space-y-4">
      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts ({activeAlerts.length})</CardTitle>
          <CardDescription>Alerts requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          {activeAlerts.length > 0 ? (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onResolve={onResolve} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="mx-auto h-8 w-8 mb-2" />
              No active alerts
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolved Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Resolved ({resolvedAlerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {resolvedAlerts.slice(0, 5).map((alert) => (
            <AlertCard key={alert.id} alert={alert} onResolve={onResolve} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AlertCard({ alert, onResolve }: {
  alert: PerformanceAlert;
  onResolve: (alertId: string) => void;
}) {
  return (
    <div className={`p-3 border rounded-lg ${alert.isResolved ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Badge className={severityColors[alert.severity]}>
            {alert.severity}
          </Badge>
          <div>
            <div className="font-medium">{alert.message}</div>
            <div className="text-sm text-muted-foreground">
              {alert.agentName} • {new Date(alert.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
        {!alert.isResolved && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onResolve(alert.id)}
          >
            Resolve
          </Button>
        )}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        Current: {alert.currentValue} • Threshold: {alert.threshold}
      </div>
    </div>
  );
}

function OptimizationSuggestions({ suggestions, onApply }: {
  suggestions: OptimizationSuggestion[];
  onApply: (suggestionId: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {suggestions.map((suggestion) => (
        <Card key={suggestion.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{suggestion.title}</CardTitle>
              <Badge variant={suggestion.priority === 'high' ? 'destructive' : 'outline'}>
                {suggestion.priority} priority
              </Badge>
            </div>
            <CardDescription>{suggestion.agentName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm">{suggestion.description}</p>
              
              {/* Estimated Improvements */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Estimated Improvements:</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {suggestion.estimatedImprovement.latency && (
                    <div>Latency: -{suggestion.estimatedImprovement.latency}%</div>
                  )}
                  {suggestion.estimatedImprovement.cost && (
                    <div>Cost: -{suggestion.estimatedImprovement.cost}%</div>
                  )}
                  {suggestion.estimatedImprovement.quality && (
                    <div>Quality: +{suggestion.estimatedImprovement.quality}%</div>
                  )}
                  {suggestion.estimatedImprovement.throughput && (
                    <div>Throughput: +{suggestion.estimatedImprovement.throughput}%</div>
                  )}
                </div>
              </div>

              {/* Implementation Details */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Implementation:</span>
                <Badge variant="outline">{suggestion.implementationEffort}</Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Potential Savings:</span>
                <span className="font-medium">${suggestion.potentialSavings.toFixed(2)}/month</span>
              </div>

              <Button
                className="w-full"
                onClick={() => onApply(suggestion.id)}
              >
                Apply Suggestion
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}