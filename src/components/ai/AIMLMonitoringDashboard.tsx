/**
 * AI/ML Monitoring Dashboard Component
 * 
 * Comprehensive monitoring dashboard for AI/ML pipeline operations,
 * model performance tracking, and intelligent system insights.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterPlot,
  Scatter
} from 'recharts';
import { 
  Activity, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Database,
  Zap,
  Eye,
  Settings,
  RefreshCw,
  Download,
  Filter,
  Search
} from 'lucide-react';

interface DashboardData {
  overview: SystemOverview;
  pipelines: PipelineStatus[];
  models: ModelStatus[];
  performance: PerformanceMetrics;
  drift: DriftMetrics;
  training: TrainingMetrics;
  experiments: ExperimentStatus[];
  alerts: SystemAlert[];
  infrastructure: InfrastructureMetrics;
}

interface SystemOverview {
  totalModels: number;
  activeModels: number;
  traininguJobs: number;
  predictions: number;
  accuracy: number;
  uptime: number;
  throughput: number;
  errorRate: number;
}

interface PipelineStatus {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startTime: Date;
  duration: number;
  throughput: number;
  errorRate: number;
}

interface ModelStatus {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'training' | 'deprecated' | 'failed';
  accuracy: number;
  latency: number;
  predictions: number;
  drift: number;
  lastUpdated: Date;
}

interface PerformanceMetrics {
  latency: MetricTimeSeries[];
  throughput: MetricTimeSeries[];
  accuracy: MetricTimeSeries[];
  errorRate: MetricTimeSeries[];
  resourceUsage: ResourceMetrics;
}

interface MetricTimeSeries {
  timestamp: Date;
  value: number;
  target?: number;
}

interface ResourceMetrics {
  cpu: number;
  memory: number;
  gpu: number;
  disk: number;
  network: number;
}

interface DriftMetrics {
  overall: number;
  features: FeatureDrift[];
  timeline: DriftTimeline[];
  alerts: DriftAlert[];
}

interface FeatureDrift {
  feature: string;
  drift: number;
  threshold: number;
  status: 'normal' | 'warning' | 'critical';
}

interface DriftTimeline {
  timestamp: Date;
  score: number;
  severity: string;
}

interface DriftAlert {
  id: string;
  model: string;
  feature: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  action: string;
}

interface TrainingMetrics {
  activeJobs: number;
  queuedJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageDuration: number;
  successRate: number;
  resourceUtilization: number;
}

interface ExperimentStatus {
  id: string;
  name: string;
  type: 'ab_test' | 'training' | 'validation';
  status: 'running' | 'completed' | 'failed';
  progress: number;
  metric: string;
  current: number;
  target: number;
  confidence: number;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
}

interface InfrastructureMetrics {
  nodes: NodeStatus[];
  containers: ContainerStatus[];
  storage: StorageMetrics;
  network: NetworkMetrics;
}

interface NodeStatus {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  cpu: number;
  memory: number;
  gpu?: number;
  workloads: number;
}

interface ContainerStatus {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'failed';
  cpu: number;
  memory: number;
  restarts: number;
}

interface StorageMetrics {
  total: number;
  used: number;
  available: number;
  iops: number;
}

interface NetworkMetrics {
  bandwidth: number;
  latency: number;
  packets: number;
  errors: number;
}

export function AIMLMonitoringDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/agents/advanced-ai-ml-pipeline?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchData]);

  const handleRefresh = () => {
    fetchData();
  };

  const handleExport = () => {
    // Export dashboard data logic
    console.log('Exporting dashboard data...');
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading AI/ML monitoring dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Dashboard Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>No monitoring data is currently available.</AlertDescription>
      </Alert>
    );
  }

  const statusColors = {
    running: 'bg-green-500',
    completed: 'bg-blue-500',
    failed: 'bg-red-500',
    paused: 'bg-yellow-500',
    active: 'bg-green-500',
    training: 'bg-blue-500',
    deprecated: 'bg-gray-500',
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    unhealthy: 'bg-red-500'
  };

  const severityColors = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI/ML Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive monitoring and analytics for AI/ML pipelines
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.activeModels}</div>
            <p className="text-xs text-muted-foreground">
              of {data.overview.totalModels} total models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predictions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.predictions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.overview.throughput}/sec throughput
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.overview.accuracy * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {data.overview.errorRate < 0.01 ? 'Excellent' : 'Good'} performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.overview.uptime * 100).toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {data.overview.traininguJobs} training jobs active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Banner */}
      {data.alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Alerts</AlertTitle>
          <AlertDescription>
            {data.alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length} critical issues require attention
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="drift">Drift Detection</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Real-time system performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.performance.latency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      name="Latency (ms)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#82ca9d" 
                      strokeDasharray="5 5"
                      name="Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resource Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>Current infrastructure resource usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU</span>
                    <span className="text-sm text-muted-foreground">
                      {data.performance.resourceUsage.cpu}%
                    </span>
                  </div>
                  <Progress value={data.performance.resourceUsage.cpu} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory</span>
                    <span className="text-sm text-muted-foreground">
                      {data.performance.resourceUsage.memory}%
                    </span>
                  </div>
                  <Progress value={data.performance.resourceUsage.memory} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">GPU</span>
                    <span className="text-sm text-muted-foreground">
                      {data.performance.resourceUsage.gpu}%
                    </span>
                  </div>
                  <Progress value={data.performance.resourceUsage.gpu} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage</span>
                    <span className="text-sm text-muted-foreground">
                      {data.performance.resourceUsage.disk}%
                    </span>
                  </div>
                  <Progress value={data.performance.resourceUsage.disk} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Latest system alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={severityColors[alert.severity]}>
                        {alert.severity}
                      </Badge>
                      <span className="font-medium">{alert.title}</span>
                      <span className="text-sm text-muted-foreground">{alert.component}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Status</CardTitle>
              <CardDescription>Overview of all deployed models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.models.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${statusColors[model.status]}`} />
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Version {model.version} • {model.predictions.toLocaleString()} predictions
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Accuracy:</span>{' '}
                        <span className="font-medium">{(model.accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Latency:</span>{' '}
                        <span className="font-medium">{model.latency}ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Drift:</span>{' '}
                        <span className={`font-medium ${model.drift > 0.5 ? 'text-red-600' : 'text-green-600'}`}>
                          {(model.drift * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipelines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Status</CardTitle>
              <CardDescription>Active and recent pipeline executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.pipelines.map((pipeline) => (
                  <div key={pipeline.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${statusColors[pipeline.status]}`} />
                      <div>
                        <div className="font-medium">{pipeline.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {pipeline.type} • Started {pipeline.startTime.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32">
                        <Progress value={pipeline.progress} />
                      </div>
                      <div className="text-sm font-medium">{pipeline.progress}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Training Jobs</CardTitle>
                <CardDescription>Current training job status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {data.training.activeJobs}
                      </div>
                      <div className="text-sm text-muted-foreground">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {data.training.queuedJobs}
                      </div>
                      <div className="text-sm text-muted-foreground">Queued</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {data.training.completedJobs}
                      </div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {data.training.failedJobs}
                      </div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Training Metrics</CardTitle>
                <CardDescription>Training performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Success Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {(data.training.successRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={data.training.successRate * 100} />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg Duration</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(data.training.averageDuration / 60)} min
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Resource Utilization</span>
                    <span className="text-sm text-muted-foreground">
                      {data.training.resourceUtilization}%
                    </span>
                  </div>
                  <Progress value={data.training.resourceUtilization} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Experiments */}
          <Card>
            <CardHeader>
              <CardTitle>Active Experiments</CardTitle>
              <CardDescription>Running A/B tests and experiments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.experiments.map((experiment) => (
                  <div key={experiment.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${statusColors[experiment.status]}`} />
                      <div>
                        <div className="font-medium">{experiment.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {experiment.type} • {experiment.metric}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Current:</span>{' '}
                        <span className="font-medium">{experiment.current.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target:</span>{' '}
                        <span className="font-medium">{experiment.target.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Confidence:</span>{' '}
                        <span className="font-medium">{(experiment.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drift" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Drift Overview</CardTitle>
                <CardDescription>System-wide drift detection status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-yellow-600">
                    {(data.drift.overall * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Drift Score</div>
                  <Progress value={data.drift.overall * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Drift</CardTitle>
                <CardDescription>Drift scores by feature</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.drift.features.slice(0, 5).map((feature) => (
                    <div key={feature.feature} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{feature.feature}</span>
                        <Badge variant="outline" className={severityColors[feature.status === 'normal' ? 'low' : feature.status === 'warning' ? 'medium' : 'high']}>
                          {feature.status}
                        </Badge>
                      </div>
                      <Progress value={(feature.drift / feature.threshold) * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Drift Timeline</CardTitle>
              <CardDescription>Historical drift detection over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.drift.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#ff7300" 
                    name="Drift Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Node Status</CardTitle>
                <CardDescription>Infrastructure node health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.infrastructure.nodes.map((node) => (
                    <div key={node.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${statusColors[node.status]}`} />
                        <div>
                          <div className="font-medium">{node.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {node.workloads} workloads
                          </div>
                        </div>
                      </div>
                      <div className="text-sm space-x-2">
                        <span>CPU: {node.cpu}%</span>
                        <span>Memory: {node.memory}%</span>
                        {node.gpu && <span>GPU: {node.gpu}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage Metrics</CardTitle>
                <CardDescription>Storage utilization and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage Used</span>
                    <span className="text-sm text-muted-foreground">
                      {(data.infrastructure.storage.used / 1024).toFixed(1)} GB / {(data.infrastructure.storage.total / 1024).toFixed(1)} GB
                    </span>
                  </div>
                  <Progress value={(data.infrastructure.storage.used / data.infrastructure.storage.total) * 100} />
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">{data.infrastructure.storage.iops}</div>
                      <div className="text-sm text-muted-foreground">IOPS</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">
                        {(data.infrastructure.storage.available / 1024).toFixed(1)} GB
                      </div>
                      <div className="text-sm text-muted-foreground">Available</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Container Status</CardTitle>
              <CardDescription>Running containers and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.infrastructure.containers.map((container) => (
                  <div key={container.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${statusColors[container.status]}`} />
                      <div>
                        <div className="font-medium">{container.name}</div>
                        <div className="text-sm text-muted-foreground">{container.image}</div>
                      </div>
                    </div>
                    <div className="text-sm space-x-2">
                      <span>CPU: {container.cpu}%</span>
                      <span>Memory: {container.memory}%</span>
                      <span>Restarts: {container.restarts}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}