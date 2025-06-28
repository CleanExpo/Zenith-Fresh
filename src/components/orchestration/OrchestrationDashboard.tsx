'use client';

/**
 * Real-time Orchestration Monitoring Dashboard
 * 
 * Comprehensive dashboard for monitoring and managing the
 * 30+ agent orchestration system in real-time.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Cpu, 
  Memory, 
  Network, 
  Database,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Zap,
  Gauge,
  Globe,
  Server,
  MessageSquare,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

// Types
interface SystemMetrics {
  agents: {
    total: number;
    active: number;
    idle: number;
    offline: number;
    averageLoad: number;
  };
  tasks: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    queueSize: number;
  };
  performance: {
    averageTaskDuration: number;
    systemThroughput: number;
    successRate: number;
    resourceUtilization: {
      cpu: number;
      memory: number;
      agents: number;
    };
  };
}

interface AgentStatus {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'busy' | 'error' | 'maintenance' | 'offline';
  currentTasks: number;
  performance: {
    completedTasks: number;
    averageExecutionTime: number;
    successRate: number;
    lastActivity: Date;
  };
  health: {
    cpu: number;
    memory: number;
    uptime: number;
    errors: number;
  };
  location: {
    region: string;
    zone: string;
  };
}

interface TaskInfo {
  id: string;
  type: string;
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedAgent?: string;
  createdAt: Date;
  duration?: number;
  progress?: number;
}

interface CommunicationMetrics {
  connections: {
    total: number;
    active: number;
    websocket: number;
    http: number;
    redis: number;
  };
  channels: {
    total: number;
    active: number;
    averageParticipants: number;
  };
  messages: {
    pending: number;
    totalSent: number;
    totalReceived: number;
    averageLatency: number;
  };
}

interface AlertInfo {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  agentId?: string;
  resolved?: boolean;
}

// Mock data generators
const generateSystemMetrics = (): SystemMetrics => ({
  agents: {
    total: 32,
    active: 28,
    idle: 4,
    offline: 0,
    averageLoad: 73.5
  },
  tasks: {
    total: 1247,
    pending: 15,
    running: 23,
    completed: 1189,
    failed: 20,
    queueSize: 8
  },
  performance: {
    averageTaskDuration: 2847,
    systemThroughput: 12.4,
    successRate: 98.4,
    resourceUtilization: {
      cpu: 67.2,
      memory: 54.8,
      agents: 87.5
    }
  }
});

const generateAgentStatuses = (): AgentStatus[] => {
  const types = ['content', 'analytics', 'monitoring', 'integration', 'security'];
  const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
  const zones = ['a', 'b', 'c'];
  
  return Array.from({ length: 32 }, (_, i) => ({
    id: `agent-${i + 1}`,
    name: `${types[i % types.length]}-agent-${Math.floor(i / types.length) + 1}`,
    type: types[i % types.length],
    status: ['idle', 'busy', 'idle', 'busy', 'idle'][i % 5] as any,
    currentTasks: Math.floor(Math.random() * 5),
    performance: {
      completedTasks: Math.floor(Math.random() * 100) + 50,
      averageExecutionTime: Math.floor(Math.random() * 5000) + 1000,
      successRate: 95 + Math.random() * 5,
      lastActivity: new Date(Date.now() - Math.random() * 300000)
    },
    health: {
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 8192),
      uptime: Math.floor(Math.random() * 86400),
      errors: Math.floor(Math.random() * 5)
    },
    location: {
      region: regions[Math.floor(Math.random() * regions.length)],
      zone: zones[Math.floor(Math.random() * zones.length)]
    }
  }));
};

const generateTasks = (): TaskInfo[] => {
  const types = ['data-processing', 'content-analysis', 'performance-check', 'integration-sync', 'security-scan'];
  const statuses = ['pending', 'running', 'completed', 'failed'] as const;
  const priorities = ['low', 'medium', 'high', 'critical'] as const;
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: `task-${i + 1}`,
    type: types[Math.floor(Math.random() * types.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    assignedAgent: Math.random() > 0.3 ? `agent-${Math.floor(Math.random() * 32) + 1}` : undefined,
    createdAt: new Date(Date.now() - Math.random() * 3600000),
    duration: Math.random() > 0.5 ? Math.floor(Math.random() * 10000) + 1000 : undefined,
    progress: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : undefined
  }));
};

const generateCommunicationMetrics = (): CommunicationMetrics => ({
  connections: {
    total: 32,
    active: 30,
    websocket: 25,
    http: 5,
    redis: 2
  },
  channels: {
    total: 8,
    active: 6,
    averageParticipants: 4.2
  },
  messages: {
    pending: 3,
    totalSent: 15847,
    totalReceived: 15823,
    averageLatency: 23.5
  }
});

const generateAlerts = (): AlertInfo[] => [
  {
    id: 'alert-1',
    type: 'warning',
    message: 'Agent content-agent-2 CPU usage above 90%',
    timestamp: new Date(Date.now() - 120000),
    agentId: 'agent-7'
  },
  {
    id: 'alert-2',
    type: 'info',
    message: 'Auto-scaling triggered: Added 2 new instances',
    timestamp: new Date(Date.now() - 300000)
  },
  {
    id: 'alert-3',
    type: 'error',
    message: 'Task execution failed: security-scan-143',
    timestamp: new Date(Date.now() - 600000),
    resolved: true
  }
];

// Status Badge Component
const StatusBadge: React.FC<{ status: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' }> = ({ 
  status, 
  variant = 'default' 
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
      case 'active':
      case 'busy':
      case 'healthy':
      case 'completed':
        return 'bg-green-500 text-white';
      case 'pending':
      case 'idle':
      case 'assigned':
        return 'bg-blue-500 text-white';
      case 'warning':
      case 'maintenance':
        return 'bg-yellow-500 text-white';
      case 'failed':
      case 'error':
      case 'offline':
      case 'unhealthy':
        return 'bg-red-500 text-white';
      case 'cancelled':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <Badge className={getStatusColor(status)}>
      {status}
    </Badge>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: number | string;
  unit?: string;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
}> = ({ title, value, unit, icon, trend, color = 'text-blue-600' }) => (
  <Card>
    <CardContent className="flex items-center p-6">
      <div className={`mr-4 ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="flex items-center">
          <p className="text-2xl font-bold">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
          </p>
          {trend !== undefined && (
            <div className={`ml-2 flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Agent Grid Component
const AgentGrid: React.FC<{ agents: AgentStatus[] }> = ({ agents }) => {
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'performance' | 'health'>('name');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredAndSortedAgents = useMemo(() => {
    let filtered = agents;
    
    if (filterStatus !== 'all') {
      filtered = agents.filter(agent => agent.status === filterStatus);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'performance':
          return b.performance.successRate - a.performance.successRate;
        case 'health':
          return a.health.errors - b.health.errors;
        default:
          return 0;
      }
    });
  }, [agents, sortBy, filterStatus]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="all">All Status</option>
            <option value="idle">Idle</option>
            <option value="busy">Busy</option>
            <option value="error">Error</option>
            <option value="offline">Offline</option>
          </select>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 border rounded"
          >
            <option value="name">Sort by Name</option>
            <option value="status">Sort by Status</option>
            <option value="performance">Sort by Performance</option>
            <option value="health">Sort by Health</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAndSortedAgents.map(agent => (
          <Card key={agent.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm">{agent.name}</CardTitle>
                  <p className="text-xs text-gray-500">{agent.type}</p>
                </div>
                <StatusBadge status={agent.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Tasks:</span>
                  <span>{agent.currentTasks}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Success Rate:</span>
                  <span>{agent.performance.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>CPU:</span>
                  <span>{agent.health.cpu}%</span>
                </div>
                <Progress value={agent.health.cpu} className="h-1" />
                <div className="flex justify-between text-xs">
                  <span>Memory:</span>
                  <span>{(agent.health.memory / 1024).toFixed(1)}GB</span>
                </div>
                <Progress value={(agent.health.memory / 8192) * 100} className="h-1" />
                <div className="text-xs text-gray-500">
                  {agent.location.region}-{agent.location.zone}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Task List Component
const TaskList: React.FC<{ tasks: TaskInfo[] }> = ({ tasks }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const statusMatch = statusFilter === 'all' || task.status === statusFilter;
      const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
      return statusMatch && priorityMatch;
    });
  }, [tasks, statusFilter, priorityFilter]);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1 border rounded"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select 
          value={priorityFilter} 
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-1 border rounded"
        >
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="space-y-2">
        {filteredTasks.slice(0, 20).map(task => (
          <Card key={task.id} className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <StatusBadge status={task.status} />
                <div>
                  <p className="font-medium text-sm">{task.type}</p>
                  <p className="text-xs text-gray-500">{task.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={task.priority} />
                {task.assignedAgent && (
                  <span className="text-xs text-gray-500">{task.assignedAgent}</span>
                )}
                <span className="text-xs text-gray-500">
                  {task.createdAt.toLocaleTimeString()}
                </span>
              </div>
            </div>
            {task.progress !== undefined && (
              <div className="mt-2">
                <Progress value={task.progress} className="h-1" />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

// Alerts Panel Component
const AlertsPanel: React.FC<{ alerts: AlertInfo[] }> = ({ alerts }) => (
  <div className="space-y-2">
    {alerts.map(alert => (
      <Card key={alert.id} className={`p-3 border-l-4 ${
        alert.type === 'error' ? 'border-l-red-500' :
        alert.type === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
      }`}>
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2">
            {alert.type === 'error' && <XCircle className="w-4 h-4 text-red-500 mt-0.5" />}
            {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />}
            {alert.type === 'info' && <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />}
            <div>
              <p className="text-sm font-medium">{alert.message}</p>
              {alert.agentId && (
                <p className="text-xs text-gray-500">Agent: {alert.agentId}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">{alert.timestamp.toLocaleTimeString()}</p>
            {alert.resolved && (
              <StatusBadge status="resolved" />
            )}
          </div>
        </div>
      </Card>
    ))}
  </div>
);

// Main Dashboard Component
export const OrchestrationDashboard: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>(generateSystemMetrics());
  const [agents, setAgents] = useState<AgentStatus[]>(generateAgentStatuses());
  const [tasks, setTasks] = useState<TaskInfo[]>(generateTasks());
  const [communicationMetrics, setCommunicationMetrics] = useState<CommunicationMetrics>(generateCommunicationMetrics());
  const [alerts, setAlerts] = useState<AlertInfo[]>(generateAlerts());
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Real-time data updates
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      setSystemMetrics(generateSystemMetrics());
      setAgents(generateAgentStatuses());
      setTasks(generateTasks());
      setCommunicationMetrics(generateCommunicationMetrics());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isMonitoring, refreshInterval]);

  const handleRefresh = useCallback(() => {
    setSystemMetrics(generateSystemMetrics());
    setAgents(generateAgentStatuses());
    setTasks(generateTasks());
    setCommunicationMetrics(generateCommunicationMetrics());
    setAlerts(generateAlerts());
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Agent Orchestration Dashboard</h1>
          <p className="text-gray-600">Real-time monitoring and management of 30+ autonomous agents</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={isMonitoring ? "default" : "outline"}
            onClick={() => setIsMonitoring(!isMonitoring)}
            className="flex items-center gap-2 btn-modern"
          >
            {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isMonitoring ? 'Pause' : 'Resume'} Monitoring
          </Button>
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2 btn-modern">
            <RotateCcw className="w-4 h-4" />
            Refresh
          </Button>
          <select 
            value={refreshInterval} 
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-2 border rounded"
          >
            <option value={1000}>1s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
          </select>
        </div>
      </div>

      {/* System Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-stagger">
        <MetricCard
          title="Active Agents"
          value={systemMetrics.agents.active}
          unit={`/ ${systemMetrics.agents.total}`}
          icon={<Users className="w-6 h-6" />}
          trend={2.3}
          color="text-green-600"
        />
        <MetricCard
          title="Running Tasks"
          value={systemMetrics.tasks.running}
          icon={<Activity className="w-6 h-6" />}
          trend={-1.2}
          color="text-blue-600"
        />
        <MetricCard
          title="Throughput"
          value={systemMetrics.performance.systemThroughput.toFixed(1)}
          unit="tasks/min"
          icon={<Zap className="w-6 h-6" />}
          trend={5.7}
          color="text-purple-600"
        />
        <MetricCard
          title="Success Rate"
          value={systemMetrics.performance.successRate.toFixed(1)}
          unit="%"
          icon={<CheckCircle className="w-6 h-6" />}
          trend={0.8}
          color="text-green-600"
        />
      </div>

      {/* Resource Utilization */}
      <Card className="card-elevated glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gradient">
            <Gauge className="w-5 h-5" />
            Resource Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm text-gray-600">
                  {systemMetrics.performance.resourceUtilization.cpu.toFixed(1)}%
                </span>
              </div>
              <Progress value={systemMetrics.performance.resourceUtilization.cpu} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm text-gray-600">
                  {systemMetrics.performance.resourceUtilization.memory.toFixed(1)}%
                </span>
              </div>
              <Progress value={systemMetrics.performance.resourceUtilization.memory} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Agent Utilization</span>
                <span className="text-sm text-gray-600">
                  {systemMetrics.performance.resourceUtilization.agents.toFixed(1)}%
                </span>
              </div>
              <Progress value={systemMetrics.performance.resourceUtilization.agents} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Communication
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alerts ({alerts.filter(a => !a.resolved).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Agent Status Grid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AgentGrid agents={agents} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Task Queue & Execution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList tasks={tasks} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Connections:</span>
                  <span className="font-semibold">{communicationMetrics.connections.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Connections:</span>
                  <span className="font-semibold text-green-600">{communicationMetrics.connections.active}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{communicationMetrics.connections.websocket}</p>
                    <p className="text-xs text-gray-600">WebSocket</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{communicationMetrics.connections.http}</p>
                    <p className="text-xs text-gray-600">HTTP</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{communicationMetrics.connections.redis}</p>
                    <p className="text-xs text-gray-600">Redis</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Message Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Messages Sent:</span>
                  <span className="font-semibold">{communicationMetrics.messages.totalSent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Messages Received:</span>
                  <span className="font-semibold">{communicationMetrics.messages.totalReceived.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Messages:</span>
                  <span className="font-semibold text-yellow-600">{communicationMetrics.messages.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Latency:</span>
                  <span className="font-semibold">{communicationMetrics.messages.averageLatency.toFixed(1)}ms</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Execution Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Tasks:</span>
                  <span className="font-semibold">{systemMetrics.tasks.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="font-semibold text-green-600">{systemMetrics.tasks.completed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className="font-semibold text-red-600">{systemMetrics.tasks.failed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Duration:</span>
                  <span className="font-semibold">{(systemMetrics.performance.averageTaskDuration / 1000).toFixed(1)}s</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Queue Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Queue Size:</span>
                  <span className="font-semibold">{systemMetrics.tasks.queueSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Tasks:</span>
                  <span className="font-semibold text-blue-600">{systemMetrics.tasks.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span>Running Tasks:</span>
                  <span className="font-semibold text-green-600">{systemMetrics.tasks.running}</span>
                </div>
                <Progress 
                  value={(systemMetrics.tasks.running / (systemMetrics.tasks.running + systemMetrics.tasks.pending)) * 100} 
                  className="h-2"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                System Alerts & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AlertsPanel alerts={alerts} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrchestrationDashboard;