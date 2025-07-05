/**
 * AI Automation Hub Dashboard
 * Main dashboard for workflow automation and AI agents
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  BarChart3, 
  Bot, 
  Workflow, 
  Clock, 
  Zap,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

import { WorkflowBuilderWrapper } from '@/components/automation/WorkflowBuilder';

interface DashboardStats {
  workflows: {
    total: number;
    active: number;
    executions24h: number;
    successRate: number;
  };
  agents: {
    total: number;
    active: number;
    executions24h: number;
    averageResponseTime: number;
  };
  executions: {
    pending: number;
    running: number;
    completed24h: number;
    failed24h: number;
  };
}

export default function AutomationDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [recentWorkflows, setRecentWorkflows] = useState([]);
  const [recentAgents, setRecentAgents] = useState([]);
  const [recentExecutions, setRecentExecutions] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, workflowsRes, agentsRes, executionsRes] = await Promise.all([
        fetch('/api/automation/dashboard/stats'),
        fetch('/api/automation/workflows?limit=5'),
        fetch('/api/automation/agents?limit=5'),
        fetch('/api/automation/executions?limit=10')
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (workflowsRes.ok) {
        const data = await workflowsRes.json();
        setRecentWorkflows(data.workflows || []);
      }
      if (agentsRes.ok) {
        const data = await agentsRes.json();
        setRecentAgents(data.agents || []);
      }
      if (executionsRes.ok) {
        const data = await executionsRes.json();
        setRecentExecutions(data.executions || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Automation Hub</h1>
              <p className="text-sm text-gray-500">Enterprise workflow automation and AI agents</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="agents">AI Agents</TabsTrigger>
            <TabsTrigger value="executions">Executions</TabsTrigger>
            <TabsTrigger value="builder">Builder</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Workflows"
                  value={stats.workflows.total}
                  subtitle={`${stats.workflows.active} active`}
                  icon={Workflow}
                  trend={`${stats.workflows.executions24h} executions today`}
                />
                <StatsCard
                  title="AI Agents"
                  value={stats.agents.total}
                  subtitle={`${stats.agents.active} active`}
                  icon={Bot}
                  trend={`${stats.agents.averageResponseTime}ms avg response`}
                />
                <StatsCard
                  title="Executions"
                  value={stats.executions.completed24h}
                  subtitle="completed today"
                  icon={CheckCircle}
                  trend={`${stats.executions.running} running now`}
                />
                <StatsCard
                  title="Success Rate"
                  value={`${stats.workflows.successRate}%`}
                  subtitle="last 24h"
                  icon={TrendingUp}
                  trend={`${stats.executions.failed24h} failures`}
                />
              </div>
            )}

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Plus className="h-6 w-6 mb-2" />
                  Create Workflow
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Bot className="h-6 w-6 mb-2" />
                  Add AI Agent
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Settings className="h-6 w-6 mb-2" />
                  Manage Templates
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentWorkflows workflows={recentWorkflows} />
              <RecentExecutions executions={recentExecutions} />
            </div>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows">
            <WorkflowsList workflows={recentWorkflows} onRefresh={loadDashboardData} />
          </TabsContent>

          {/* AI Agents Tab */}
          <TabsContent value="agents">
            <AgentsList agents={recentAgents} onRefresh={loadDashboardData} />
          </TabsContent>

          {/* Executions Tab */}
          <TabsContent value="executions">
            <ExecutionsList executions={recentExecutions} onRefresh={loadDashboardData} />
          </TabsContent>

          {/* Builder Tab */}
          <TabsContent value="builder">
            <div className="h-[800px] border border-gray-200 rounded-lg overflow-hidden">
              <WorkflowBuilderWrapper
                onSave={(workflow) => {
                  console.log('Saving workflow:', workflow);
                  // TODO: Implement save functionality
                }}
                onExecute={(workflow) => {
                  console.log('Executing workflow:', workflow);
                  // TODO: Implement execute functionality
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Components
function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  subtitle: string; 
  icon: any; 
  trend: string; 
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <Icon className="h-8 w-8 text-blue-500" />
      </div>
      <div className="mt-4 text-xs text-gray-400">
        {trend}
      </div>
    </Card>
  );
}

function RecentWorkflows({ workflows }: { workflows: any[] }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Workflows</h3>
        <Button variant="ghost" size="sm">View all</Button>
      </div>
      <div className="space-y-3">
        {workflows.length > 0 ? workflows.map((workflow: any) => (
          <div key={workflow.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{workflow.name}</p>
              <p className="text-sm text-gray-500">{workflow.category}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={workflow.isActive ? "default" : "secondary"}>
                {workflow.isActive ? "Active" : "Inactive"}
              </Badge>
              <Button variant="ghost" size="sm">
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )) : (
          <div className="text-center py-8 text-gray-500">
            <Workflow className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No workflows created yet</p>
            <Button variant="outline" size="sm" className="mt-2">
              Create your first workflow
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function RecentExecutions({ executions }: { executions: any[] }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Executions</h3>
        <Button variant="ghost" size="sm">View all</Button>
      </div>
      <div className="space-y-3">
        {executions.length > 0 ? executions.map((execution: any) => (
          <div key={execution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <ExecutionStatusIcon status={execution.status} />
              <div>
                <p className="font-medium text-gray-900">{execution.workflow?.name || 'Unknown'}</p>
                <p className="text-sm text-gray-500">
                  {new Date(execution.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={getStatusVariant(execution.status)}>
                {execution.status}
              </Badge>
              {execution.duration && (
                <p className="text-xs text-gray-500 mt-1">
                  {(execution.duration / 1000).toFixed(1)}s
                </p>
              )}
            </div>
          </div>
        )) : (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No executions yet</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function ExecutionStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'FAILED':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'RUNNING':
      return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
    default:
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'default';
    case 'FAILED':
      return 'destructive';
    case 'RUNNING':
      return 'default';
    default:
      return 'secondary';
  }
}

function WorkflowsList({ workflows, onRefresh }: { workflows: any[]; onRefresh: () => void }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Workflows</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>
      {/* Workflow list implementation */}
      <div className="text-center py-12 text-gray-500">
        <Workflow className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg">Workflow management interface</p>
        <p className="text-sm">This section will show all workflows with filtering and management options</p>
      </div>
    </Card>
  );
}

function AgentsList({ agents, onRefresh }: { agents: any[]; onRefresh: () => void }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">AI Agents</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>
      {/* Agent list implementation */}
      <div className="text-center py-12 text-gray-500">
        <Bot className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg">AI agent management interface</p>
        <p className="text-sm">This section will show all AI agents with configuration options</p>
      </div>
    </Card>
  );
}

function ExecutionsList({ executions, onRefresh }: { executions: any[]; onRefresh: () => void }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Execution History</h2>
        <Button variant="outline" onClick={onRefresh}>
          <Clock className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      {/* Execution list implementation */}
      <div className="text-center py-12 text-gray-500">
        <Zap className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg">Execution monitoring interface</p>
        <p className="text-sm">This section will show detailed execution logs and performance metrics</p>
      </div>
    </Card>
  );
}