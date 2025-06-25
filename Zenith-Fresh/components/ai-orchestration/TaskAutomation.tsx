"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Edit, 
  Trash, 
  Settings, 
  Clock,
  Route,
  Brain,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  Filter,
  Target,
  Shuffle,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  triggerType: 'time' | 'event' | 'condition' | 'webhook';
  triggerConfig: any;
  actions: AutomationAction[];
  routingRules: RoutingRule[];
  priority: number;
  executionCount: number;
  successRate: number;
  lastExecuted?: Date;
  createdAt: Date;
}

interface AutomationAction {
  id: string;
  type: 'model_call' | 'webhook' | 'notification' | 'data_transform' | 'route_task';
  config: any;
  order: number;
}

interface RoutingRule {
  id: string;
  condition: string;
  targetAgent?: string;
  targetModel?: string;
  priority: number;
  loadBalancing: 'round_robin' | 'least_load' | 'performance' | 'cost';
}

interface TaskRoute {
  id: string;
  name: string;
  description: string;
  conditions: string[];
  targets: {
    agentId: string;
    modelId: string;
    weight: number;
    maxConcurrency: number;
  }[];
  strategy: 'failover' | 'load_balance' | 'conditional' | 'a_b_test';
  isActive: boolean;
  metrics: {
    totalRouted: number;
    averageLatency: number;
    successRate: number;
    costPerTask: number;
  };
}

const triggerTypes = {
  time: { icon: Clock, label: 'Scheduled', color: 'bg-blue-500' },
  event: { icon: Zap, label: 'Event-based', color: 'bg-yellow-500' },
  condition: { icon: Filter, label: 'Conditional', color: 'bg-purple-500' },
  webhook: { icon: Target, label: 'Webhook', color: 'bg-green-500' }
};

const actionTypes = {
  model_call: { icon: Brain, label: 'AI Model Call' },
  webhook: { icon: Target, label: 'Webhook' },
  notification: { icon: AlertCircle, label: 'Notification' },
  data_transform: { icon: Shuffle, label: 'Data Transform' },
  route_task: { icon: Route, label: 'Route Task' }
};

export default function TaskAutomation() {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [taskRoutes, setTaskRoutes] = useState<TaskRoute[]>([]);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<TaskRoute | null>(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [activeTab, setActiveTab] = useState('automation');

  useEffect(() => {
    fetchAutomationData();
  }, []);

  const fetchAutomationData = async () => {
    try {
      const [rulesResponse, routesResponse] = await Promise.all([
        fetch('/api/ai-orchestration/automation/rules'),
        fetch('/api/ai-orchestration/automation/routes')
      ]);
      
      const rulesData = await rulesResponse.json();
      const routesData = await routesResponse.json();
      
      setAutomationRules(rulesData.rules || []);
      setTaskRoutes(routesData.routes || []);
    } catch (error) {
      console.error('Error fetching automation data:', error);
    }
  };

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/ai-orchestration/automation/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      
      if (response.ok) {
        fetchAutomationData();
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const executeRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/ai-orchestration/automation/rules/${ruleId}/execute`, {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchAutomationData();
      }
    } catch (error) {
      console.error('Error executing rule:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Automation & Routing</h1>
          <p className="text-muted-foreground">Automate AI tasks and intelligently route requests</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsCreatingRoute(true)}
          >
            <Route className="mr-2 h-4 w-4" />
            New Route
          </Button>
          <Button onClick={() => setIsCreatingRule(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Rule
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automationRules.filter(rule => rule.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {automationRules.length} total rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Routes</CardTitle>
            <Route className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskRoutes.length}</div>
            <p className="text-xs text-muted-foreground">
              routing configurations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automationRules.reduce((sum, rule) => sum + rule.executionCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              automation runs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automationRules.length > 0 
                ? (automationRules.reduce((sum, rule) => sum + rule.successRate, 0) / automationRules.length).toFixed(1)
                : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              average success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="automation">Automation Rules</TabsTrigger>
          <TabsTrigger value="routing">Intelligent Routing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {automationRules.map((rule) => (
              <AutomationRuleCard
                key={rule.id}
                rule={rule}
                onToggle={toggleRule}
                onExecute={executeRule}
                onEdit={setSelectedRule}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="routing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {taskRoutes.map((route) => (
              <TaskRouteCard
                key={route.id}
                route={route}
                onEdit={setSelectedRoute}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard 
            rules={automationRules} 
            routes={taskRoutes} 
          />
        </TabsContent>
      </Tabs>

      {/* Create Rule Dialog */}
      <CreateRuleDialog
        isOpen={isCreatingRule}
        onClose={() => setIsCreatingRule(false)}
        onSave={fetchAutomationData}
      />

      {/* Create Route Dialog */}
      <CreateRouteDialog
        isOpen={isCreatingRoute}
        onClose={() => setIsCreatingRoute(false)}
        onSave={fetchAutomationData}
      />

      {/* Edit Rule Dialog */}
      {selectedRule && (
        <EditRuleDialog
          rule={selectedRule}
          isOpen={!!selectedRule}
          onClose={() => setSelectedRule(null)}
          onSave={fetchAutomationData}
        />
      )}

      {/* Edit Route Dialog */}
      {selectedRoute && (
        <EditRouteDialog
          route={selectedRoute}
          isOpen={!!selectedRoute}
          onClose={() => setSelectedRoute(null)}
          onSave={fetchAutomationData}
        />
      )}
    </div>
  );
}

function AutomationRuleCard({ rule, onToggle, onExecute, onEdit }: {
  rule: AutomationRule;
  onToggle: (id: string, active: boolean) => void;
  onExecute: (id: string) => void;
  onEdit: (rule: AutomationRule) => void;
}) {
  const TriggerIcon = triggerTypes[rule.triggerType].icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-1 rounded ${triggerTypes[rule.triggerType].color} text-white`}>
              <TriggerIcon className="h-3 w-3" />
            </div>
            <CardTitle className="text-lg">{rule.name}</CardTitle>
          </div>
          <Switch
            checked={rule.isActive}
            onCheckedChange={(checked) => onToggle(rule.id, checked)}
          />
        </div>
        <CardDescription>{rule.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Trigger Info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Trigger:</span>
            <Badge variant="outline">
              {triggerTypes[rule.triggerType].label}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Actions:</span>
            <span className="font-medium">{rule.actions.length}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Executions:</span>
              <div className="font-medium">{rule.executionCount}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Success Rate:</span>
              <div className="font-medium">{rule.successRate.toFixed(1)}%</div>
            </div>
          </div>

          {/* Last Executed */}
          {rule.lastExecuted && (
            <div className="text-sm text-muted-foreground">
              Last run: {new Date(rule.lastExecuted).toLocaleDateString()}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(rule)}
              className="flex-1"
            >
              <Edit className="mr-1 h-3 w-3" />
              Edit
            </Button>
            <Button
              size="sm"
              onClick={() => onExecute(rule.id)}
              className="flex-1"
            >
              <Play className="mr-1 h-3 w-3" />
              Run
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskRouteCard({ route, onEdit }: {
  route: TaskRoute;
  onEdit: (route: TaskRoute) => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{route.name}</CardTitle>
          <Badge variant={route.isActive ? 'default' : 'secondary'}>
            {route.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <CardDescription>{route.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Strategy */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Strategy:</span>
            <Badge variant="outline" className="capitalize">
              {route.strategy.replace('_', ' ')}
            </Badge>
          </div>

          {/* Targets */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Targets:</span>
            <span className="font-medium">{route.targets.length}</span>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Routed:</span>
              <div className="font-medium">{route.metrics.totalRouted}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Latency:</span>
              <div className="font-medium">{route.metrics.averageLatency}ms</div>
            </div>
            <div>
              <span className="text-muted-foreground">Success:</span>
              <div className="font-medium">{route.metrics.successRate.toFixed(1)}%</div>
            </div>
            <div>
              <span className="text-muted-foreground">Cost:</span>
              <div className="font-medium">${route.metrics.costPerTask.toFixed(3)}</div>
            </div>
          </div>

          {/* Actions */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(route)}
            className="w-full"
          >
            <Edit className="mr-1 h-3 w-3" />
            Configure Route
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsDashboard({ rules, routes }: {
  rules: AutomationRule[];
  routes: TaskRoute[];
}) {
  const totalExecutions = rules.reduce((sum, rule) => sum + rule.executionCount, 0);
  const totalRouted = routes.reduce((sum, route) => sum + route.metrics.totalRouted, 0);
  const avgSuccessRate = rules.length > 0 
    ? rules.reduce((sum, rule) => sum + rule.successRate, 0) / rules.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Execution Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalExecutions}</div>
            <p className="text-muted-foreground">Total automation executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Routing Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalRouted}</div>
            <p className="text-muted-foreground">Tasks routed intelligently</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgSuccessRate.toFixed(1)}%</div>
            <p className="text-muted-foreground">Average success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance breakdown by rule type */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Trigger Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(triggerTypes).map(([type, config]) => {
              const typeRules = rules.filter(rule => rule.triggerType === type);
              const typeExecutions = typeRules.reduce((sum, rule) => sum + rule.executionCount, 0);
              const typeSuccessRate = typeRules.length > 0
                ? typeRules.reduce((sum, rule) => sum + rule.successRate, 0) / typeRules.length
                : 0;

              return (
                <div key={type} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded ${config.color} text-white`}>
                      <config.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{config.label}</div>
                      <div className="text-sm text-muted-foreground">{typeRules.length} rules</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{typeExecutions} executions</div>
                    <div className="text-sm text-muted-foreground">{typeSuccessRate.toFixed(1)}% success</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder dialog components - these would be fully implemented
function CreateRuleDialog({ isOpen, onClose, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Automation Rule</DialogTitle>
          <DialogDescription>
            Set up a new automation rule with triggers and actions
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">Rule creation interface would go here...</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { onSave(); onClose(); }}>Create Rule</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateRouteDialog({ isOpen, onClose, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Task Route</DialogTitle>
          <DialogDescription>
            Configure intelligent routing for AI tasks
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">Route creation interface would go here...</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { onSave(); onClose(); }}>Create Route</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditRuleDialog({ rule, isOpen, onClose, onSave }: {
  rule: AutomationRule;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Automation Rule</DialogTitle>
          <DialogDescription>
            Modify the automation rule configuration
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">Rule editing interface for {rule.name} would go here...</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { onSave(); onClose(); }}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditRouteDialog({ route, isOpen, onClose, onSave }: {
  route: TaskRoute;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Task Route</DialogTitle>
          <DialogDescription>
            Modify the routing configuration
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">Route editing interface for {route.name} would go here...</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { onSave(); onClose(); }}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}