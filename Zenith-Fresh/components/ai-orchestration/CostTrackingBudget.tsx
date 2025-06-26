"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Edit,
  Trash,
  Calendar,
  PieChart,
  BarChart3,
  Target,
  CreditCard,
  Wallet,
  Calculator,
  Bell,
  Settings,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CostData {
  agentId: string;
  agentName: string;
  modelId?: string;
  modelName?: string;
  totalCost: number;
  tokenCount: number;
  requestCount: number;
  costPerToken: number;
  costPerRequest: number;
  period: {
    start: Date;
    end: Date;
  };
}

interface Budget {
  id: string;
  name: string;
  totalBudget: number;
  usedBudget: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  periodStart: Date;
  periodEnd: Date;
  warningThreshold: number;
  alertThreshold: number;
  isActive: boolean;
  userId: string;
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CostAlert {
  id: string;
  budgetId: string;
  budgetName: string;
  alertType: 'warning' | 'alert' | 'exceeded';
  currentSpend: number;
  budgetLimit: number;
  percentage: number;
  isResolved: boolean;
  createdAt: Date;
}

interface CostPrediction {
  agentId: string;
  agentName: string;
  currentSpend: number;
  predictedMonthlySpend: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  factors: string[];
}

interface BillingData {
  currentPeriod: {
    start: Date;
    end: Date;
    totalCost: number;
    tokenUsage: number;
    requestCount: number;
  };
  previousPeriod: {
    start: Date;
    end: Date;
    totalCost: number;
    tokenUsage: number;
    requestCount: number;
  };
  yearToDate: {
    totalCost: number;
    tokenUsage: number;
    requestCount: number;
  };
}

export default function CostTrackingBudget() {
  const [costData, setCostData] = useState<CostData[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [predictions, setPredictions] = useState<CostPrediction[]>([]);
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [isCreatingBudget, setIsCreatingBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  useEffect(() => {
    fetchCostData();
    fetchBudgets();
    fetchAlerts();
    fetchPredictions();
    fetchBillingData();
  }, [selectedPeriod]);

  const fetchCostData = async () => {
    try {
      const response = await fetch(`/api/ai-orchestration/costs?period=${selectedPeriod}`);
      const data = await response.json();
      setCostData(data.costs || []);
    } catch (error) {
      console.error('Error fetching cost data:', error);
    }
  };

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/ai-orchestration/budgets');
      const data = await response.json();
      setBudgets(data.budgets || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/ai-orchestration/cost-alerts');
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/ai-orchestration/cost-predictions');
      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const fetchBillingData = async () => {
    try {
      const response = await fetch('/api/ai-orchestration/billing');
      const data = await response.json();
      setBillingData(data.billing);
    } catch (error) {
      console.error('Error fetching billing data:', error);
    }
  };

  const createBudget = async (budgetData: any) => {
    try {
      const response = await fetch('/api/ai-orchestration/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetData)
      });

      if (response.ok) {
        fetchBudgets();
        setIsCreatingBudget(false);
      }
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  const updateBudget = async (budgetId: string, updates: any) => {
    try {
      const response = await fetch(`/api/ai-orchestration/budgets/${budgetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        fetchBudgets();
        setEditingBudget(null);
      }
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const deleteBudget = async (budgetId: string) => {
    try {
      const response = await fetch(`/api/ai-orchestration/budgets/${budgetId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchBudgets();
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/ai-orchestration/cost-alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true })
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const totalCost = costData.reduce((sum, data) => sum + data.totalCost, 0);
  const totalTokens = costData.reduce((sum, data) => sum + data.tokenCount, 0);
  const totalRequests = costData.reduce((sum, data) => sum + data.requestCount, 0);
  const averageCostPerToken = totalTokens > 0 ? totalCost / totalTokens : 0;
  const averageCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;

  const activeAlerts = alerts.filter(alert => !alert.isResolved);
  const criticalAlerts = activeAlerts.filter(alert => alert.alertType === 'exceeded');
  const warningAlerts = activeAlerts.filter(alert => alert.alertType === 'warning');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cost Tracking & Budget Management</h1>
          <p className="text-muted-foreground">Monitor AI costs and manage budgets</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button onClick={() => setIsCreatingBudget(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Budget
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{criticalAlerts.length} budget(s) exceeded!</strong> 
            {' '}Immediate attention required to avoid unexpected charges.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Current {selectedPeriod} period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${averageCostPerToken.toFixed(6)} per token
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${averageCostPerRequest.toFixed(4)} per request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgets.filter(b => b.isActive).length}</div>
            <p className="text-xs text-muted-foreground">
              of {budgets.length} total budgets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts.length} critical
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period Filter */}
      <div className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg border">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Period:</span>
        </div>
        
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => {
          fetchCostData();
          fetchBudgets();
          fetchAlerts();
        }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <CostOverview 
            costData={costData} 
            budgets={budgets} 
            predictions={predictions}
            billingData={billingData}
          />
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <BudgetManagement 
            budgets={budgets} 
            alerts={alerts}
            onEdit={setEditingBudget}
            onDelete={deleteBudget}
            onResolveAlert={resolveAlert}
          />
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <CostBreakdown costData={costData} />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <CostPredictions predictions={predictions} />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <BillingOverview billingData={billingData} />
        </TabsContent>
      </Tabs>

      {/* Create Budget Dialog */}
      <CreateBudgetDialog
        isOpen={isCreatingBudget}
        onClose={() => setIsCreatingBudget(false)}
        onCreate={createBudget}
      />

      {/* Edit Budget Dialog */}
      {editingBudget && (
        <EditBudgetDialog
          budget={editingBudget}
          isOpen={!!editingBudget}
          onClose={() => setEditingBudget(null)}
          onUpdate={updateBudget}
        />
      )}
    </div>
  );
}

function CostOverview({ costData, budgets, predictions, billingData }: {
  costData: CostData[];
  budgets: Budget[];
  predictions: CostPrediction[];
  billingData: BillingData | null;
}) {
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.totalBudget, 0);
  const totalUsed = budgets.reduce((sum, budget) => sum + budget.usedBudget, 0);
  const budgetUtilization = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Cost Trend Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Cost Trends</CardTitle>
          <CardDescription>AI spending over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <BarChart3 className="h-8 w-8 mr-2" />
            Cost trend chart would be rendered here
          </div>
        </CardContent>
      </Card>

      {/* Budget Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Budget</span>
              <span className="text-sm">${totalUsed.toFixed(2)} / ${totalBudget.toFixed(2)}</span>
            </div>
            <Progress value={budgetUtilization} className="h-3" />
            <div className="text-sm text-muted-foreground">
              {budgetUtilization.toFixed(1)}% of total budget used
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Spending Agents */}
      <Card>
        <CardHeader>
          <CardTitle>Top Spending Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {costData
              .sort((a, b) => b.totalCost - a.totalCost)
              .slice(0, 5)
              .map((data, index) => (
                <div key={data.agentId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm">{data.agentName}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">${data.totalCost.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{data.requestCount} requests</div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BudgetManagement({ budgets, alerts, onEdit, onDelete, onResolveAlert }: {
  budgets: Budget[];
  alerts: CostAlert[];
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
  onResolveAlert: (alertId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Active Alerts */}
      {alerts.filter(alert => !alert.isResolved).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Alerts</CardTitle>
            <CardDescription>Budgets requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts
                .filter(alert => !alert.isResolved)
                .map((alert) => (
                  <BudgetAlertCard 
                    key={alert.id} 
                    alert={alert} 
                    onResolve={onResolveAlert} 
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function BudgetCard({ budget, onEdit, onDelete }: {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
}) {
  const utilization = (budget.usedBudget / budget.totalBudget) * 100;
  const isOverBudget = utilization > 100;
  const isNearLimit = utilization > budget.alertThreshold * 100;

  return (
    <Card className={isOverBudget ? 'border-red-500' : isNearLimit ? 'border-yellow-500' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{budget.name}</CardTitle>
          <Badge variant={budget.isActive ? 'default' : 'secondary'}>
            {budget.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <CardDescription className="capitalize">{budget.period} budget</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Budget Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Used: ${budget.usedBudget.toFixed(2)}</span>
              <span>Limit: ${budget.totalBudget.toFixed(2)}</span>
            </div>
            <Progress 
              value={Math.min(utilization, 100)} 
              className={`h-3 ${isOverBudget ? '[&>div]:bg-red-500' : isNearLimit ? '[&>div]:bg-yellow-500' : ''}`}
            />
            <div className="text-sm text-center">
              {utilization.toFixed(1)}% utilized
            </div>
          </div>

          {/* Thresholds */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Warning: {(budget.warningThreshold * 100).toFixed(0)}%</div>
            <div>Alert: {(budget.alertThreshold * 100).toFixed(0)}%</div>
          </div>

          {/* Period Info */}
          <div className="text-xs text-muted-foreground">
            Period: {new Date(budget.periodStart).toLocaleDateString()} - {new Date(budget.periodEnd).toLocaleDateString()}
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(budget)}
              className="flex-1"
            >
              <Edit className="mr-1 h-3 w-3" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(budget.id)}
              className="flex-1"
            >
              <Trash className="mr-1 h-3 w-3" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetAlertCard({ alert, onResolve }: {
  alert: CostAlert;
  onResolve: (alertId: string) => void;
}) {
  const alertTypeColors = {
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    alert: 'text-orange-600 bg-orange-50 border-orange-200',
    exceeded: 'text-red-600 bg-red-50 border-red-200'
  };

  return (
    <div className={`p-3 border rounded-lg ${alertTypeColors[alert.alertType]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{alert.budgetName}</div>
          <div className="text-sm">
            ${alert.currentSpend.toFixed(2)} / ${alert.budgetLimit.toFixed(2)} ({alert.percentage.toFixed(1)}%)
          </div>
          <div className="text-xs">
            {new Date(alert.createdAt).toLocaleString()}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onResolve(alert.id)}
        >
          Resolve
        </Button>
      </div>
    </div>
  );
}

function CostBreakdown({ costData }: { costData: CostData[] }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown by Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {costData.map((data) => (
              <div key={data.agentId} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{data.agentName}</div>
                  <div className="text-sm text-muted-foreground">
                    {data.modelName} • {data.requestCount.toLocaleString()} requests • {data.tokenCount.toLocaleString()} tokens
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${data.totalCost.toFixed(4)}</div>
                  <div className="text-sm text-muted-foreground">
                    ${data.costPerRequest.toFixed(6)}/req
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CostPredictions({ predictions }: { predictions: CostPrediction[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {predictions.map((prediction) => {
        const TrendIcon = prediction.trend === 'increasing' ? TrendingUp : 
                         prediction.trend === 'decreasing' ? TrendingDown : 
                         Target;
        const trendColor = prediction.trend === 'increasing' ? 'text-red-500' : 
                          prediction.trend === 'decreasing' ? 'text-green-500' : 
                          'text-blue-500';

        return (
          <Card key={prediction.agentId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{prediction.agentName}</CardTitle>
                <div className={`flex items-center space-x-1 ${trendColor}`}>
                  <TrendIcon className="h-4 w-4" />
                  <span className="text-sm capitalize">{prediction.trend}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Spend:</span>
                  <span className="font-medium">${prediction.currentSpend.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Predicted Monthly:</span>
                  <span className="font-medium">${prediction.predictedMonthlySpend.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Confidence:</span>
                  <span className="font-medium">{(prediction.confidence * 100).toFixed(1)}%</span>
                </div>

                {prediction.factors.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-1">Key Factors:</div>
                    <div className="flex flex-wrap gap-1">
                      {prediction.factors.map((factor, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function BillingOverview({ billingData }: { billingData: BillingData | null }) {
  if (!billingData) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <CreditCard className="mx-auto h-8 w-8 mb-2" />
            No billing data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const costChange = billingData.currentPeriod.totalCost - billingData.previousPeriod.totalCost;
  const costChangePercent = billingData.previousPeriod.totalCost > 0 
    ? (costChange / billingData.previousPeriod.totalCost) * 100 
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Current Period</CardTitle>
            <CardDescription>
              {new Date(billingData.currentPeriod.start).toLocaleDateString()} - {new Date(billingData.currentPeriod.end).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">${billingData.currentPeriod.totalCost.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">
                {billingData.currentPeriod.tokenUsage.toLocaleString()} tokens
              </div>
              <div className="text-sm text-muted-foreground">
                {billingData.currentPeriod.requestCount.toLocaleString()} requests
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Previous Period</CardTitle>
            <CardDescription>
              {new Date(billingData.previousPeriod.start).toLocaleDateString()} - {new Date(billingData.previousPeriod.end).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">${billingData.previousPeriod.totalCost.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">
                {billingData.previousPeriod.tokenUsage.toLocaleString()} tokens
              </div>
              <div className="text-sm text-muted-foreground">
                {billingData.previousPeriod.requestCount.toLocaleString()} requests
              </div>
              
              <div className={`flex items-center space-x-1 text-sm ${
                costChange > 0 ? 'text-red-500' : costChange < 0 ? 'text-green-500' : 'text-muted-foreground'
              }`}>
                {costChange > 0 ? <TrendingUp className="h-3 w-3" /> : 
                 costChange < 0 ? <TrendingDown className="h-3 w-3" /> : 
                 <Target className="h-3 w-3" />}
                <span>{costChangePercent > 0 ? '+' : ''}{costChangePercent.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Year to Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">${billingData.yearToDate.totalCost.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">
                {billingData.yearToDate.tokenUsage.toLocaleString()} tokens
              </div>
              <div className="text-sm text-muted-foreground">
                {billingData.yearToDate.requestCount.toLocaleString()} requests
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Placeholder dialog components would be fully implemented
function CreateBudgetDialog({ isOpen, onClose, onCreate }: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (budget: any) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Budget</DialogTitle>
          <DialogDescription>Set up a new budget with alerts and thresholds</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">Budget creation form would go here...</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { onCreate({}); onClose(); }}>Create Budget</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditBudgetDialog({ budget, isOpen, onClose, onUpdate }: {
  budget: Budget;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (budgetId: string, updates: any) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>Modify budget settings and thresholds</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">Budget editing form for {budget.name} would go here...</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { onUpdate(budget.id, {}); onClose(); }}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}