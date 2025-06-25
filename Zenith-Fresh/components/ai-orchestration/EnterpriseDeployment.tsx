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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Server,
  Cloud,
  Shield,
  Zap,
  Globe,
  Lock,
  Users,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Play,
  Pause,
  Square,
  Edit,
  Trash,
  Copy,
  Download,
  Upload,
  Terminal,
  Database,
  Network,
  Cpu,
  HardDrive,
  BarChart3,
  TrendingUp,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Deployment {
  id: string;
  name: string;
  agentId: string;
  agentName: string;
  modelId: string;
  modelName: string;
  environment: 'development' | 'staging' | 'production';
  status: 'deploying' | 'active' | 'inactive' | 'failed' | 'updating';
  endpoint?: string;
  configuration: DeploymentConfiguration;
  
  // Resource allocation
  instanceType: string;
  autoScaling: boolean;
  minInstances: number;
  maxInstances: number;
  currentInstances: number;
  
  // Health and monitoring
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastHealthCheck?: Date;
  uptime: number;
  
  // Performance metrics
  requestsPerSecond: number;
  averageLatency: number;
  errorRate: number;
  
  deployedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface DeploymentConfiguration {
  scaling: {
    enabled: boolean;
    targetCPU: number;
    targetMemory: number;
    scaleUpCooldown: number;
    scaleDownCooldown: number;
  };
  networking: {
    loadBalancer: boolean;
    ssl: boolean;
    customDomain?: string;
    apiRateLimit: number;
  };
  security: {
    authentication: boolean;
    authorization: boolean;
    encryption: boolean;
    ipWhitelist: string[];
  };
  monitoring: {
    logging: boolean;
    metrics: boolean;
    alerts: boolean;
    healthChecks: boolean;
  };
}

interface HealthCheck {
  id: string;
  deploymentId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  errorMessage?: string;
  details?: any;
  checkedAt: Date;
}

interface DeploymentTemplate {
  id: string;
  name: string;
  description: string;
  configuration: DeploymentConfiguration;
  targetEnvironment: string[];
  isDefault: boolean;
}

interface InfrastructureMetrics {
  totalDeployments: number;
  activeDeployments: number;
  totalRequests: number;
  averageLatency: number;
  totalCPU: number;
  totalMemory: number;
  totalStorage: number;
  monthlyCost: number;
}

const environmentColors = {
  development: 'bg-blue-100 text-blue-700',
  staging: 'bg-yellow-100 text-yellow-700',
  production: 'bg-green-100 text-green-700'
};

const statusColors = {
  deploying: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  failed: 'bg-red-100 text-red-700',
  updating: 'bg-yellow-100 text-yellow-700'
};

const healthColors = {
  healthy: 'text-green-600',
  degraded: 'text-yellow-600',
  unhealthy: 'text-red-600',
  unknown: 'text-gray-600'
};

const instanceTypes = [
  { id: 'micro', name: 'Micro', cpu: '1 vCPU', memory: '1 GB', cost: '$10/month' },
  { id: 'small', name: 'Small', cpu: '2 vCPU', memory: '4 GB', cost: '$40/month' },
  { id: 'medium', name: 'Medium', cpu: '4 vCPU', memory: '8 GB', cost: '$120/month' },
  { id: 'large', name: 'Large', cpu: '8 vCPU', memory: '16 GB', cost: '$320/month' },
  { id: 'xlarge', name: 'Extra Large', cpu: '16 vCPU', memory: '32 GB', cost: '$640/month' }
];

export default function EnterpriseDeployment() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [templates, setTemplates] = useState<DeploymentTemplate[]>([]);
  const [metrics, setMetrics] = useState<InfrastructureMetrics>({
    totalDeployments: 0,
    activeDeployments: 0,
    totalRequests: 0,
    averageLatency: 0,
    totalCPU: 0,
    totalMemory: 0,
    totalStorage: 0,
    monthlyCost: 0
  });
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    fetchDeploymentData();
    
    // Set up real-time updates
    const interval = setInterval(fetchDeploymentData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDeploymentData = async () => {
    try {
      const [deploymentsRes, healthRes, templatesRes, metricsRes] = await Promise.all([
        fetch('/api/ai-orchestration/deployments'),
        fetch('/api/ai-orchestration/deployments/health'),
        fetch('/api/ai-orchestration/deployment-templates'),
        fetch('/api/ai-orchestration/infrastructure/metrics')
      ]);

      const [deploymentsData, healthData, templatesData, metricsData] = await Promise.all([
        deploymentsRes.json(),
        healthRes.json(),
        templatesRes.json(),
        metricsRes.json()
      ]);

      setDeployments(deploymentsData.deployments || []);
      setHealthChecks(healthData.healthChecks || []);
      setTemplates(templatesData.templates || []);
      setMetrics(metricsData.metrics || metrics);
    } catch (error) {
      console.error('Error fetching deployment data:', error);
    }
  };

  const createDeployment = async (deploymentData: any) => {
    try {
      setIsDeploying(true);
      const response = await fetch('/api/ai-orchestration/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deploymentData)
      });

      if (response.ok) {
        fetchDeploymentData();
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Error creating deployment:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  const controlDeployment = async (deploymentId: string, action: 'start' | 'stop' | 'restart' | 'scale') => {
    try {
      const response = await fetch(`/api/ai-orchestration/deployments/${deploymentId}/${action}`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchDeploymentData();
      }
    } catch (error) {
      console.error(`Error ${action}ing deployment:`, error);
    }
  };

  const scaleDeployment = async (deploymentId: string, instances: number) => {
    try {
      const response = await fetch(`/api/ai-orchestration/deployments/${deploymentId}/scale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances })
      });

      if (response.ok) {
        fetchDeploymentData();
      }
    } catch (error) {
      console.error('Error scaling deployment:', error);
    }
  };

  const productionDeployments = deployments.filter(d => d.environment === 'production').length;
  const healthyDeployments = deployments.filter(d => d.healthStatus === 'healthy').length;
  const failedDeployments = deployments.filter(d => d.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enterprise AI Deployment</h1>
          <p className="text-muted-foreground">Deploy and manage AI agents at enterprise scale</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Configs
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Deployment
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {failedDeployments > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{failedDeployments} deployment(s) failed</strong> and require attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Infrastructure Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deployments</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDeployments}</div>
            <p className="text-xs text-muted-foreground">
              {productionDeployments} in production
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeDeployments}</div>
            <p className="text-xs text-muted-foreground">
              {healthyDeployments} healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests/s</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.averageLatency}ms avg latency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCPU}%</div>
            <p className="text-xs text-muted-foreground">
              Across all instances
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalMemory}%</div>
            <p className="text-xs text-muted-foreground">
              Memory utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.monthlyCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Infrastructure costs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="deployments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
        </TabsList>

        <TabsContent value="deployments" className="space-y-4">
          <DeploymentManagement 
            deployments={deployments}
            onSelect={setSelectedDeployment}
            onControl={controlDeployment}
            onScale={scaleDeployment}
          />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <DeploymentMonitoring 
            deployments={deployments}
            healthChecks={healthChecks}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <TemplateManagement templates={templates} />
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-4">
          <InfrastructureOverview metrics={metrics} deployments={deployments} />
        </TabsContent>
      </Tabs>

      {/* Create Deployment Dialog */}
      <CreateDeploymentDialog
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onCreate={createDeployment}
        isDeploying={isDeploying}
        templates={templates}
      />

      {/* Deployment Details Dialog */}
      {selectedDeployment && (
        <DeploymentDetailsDialog
          deployment={selectedDeployment}
          isOpen={!!selectedDeployment}
          onClose={() => setSelectedDeployment(null)}
          onControl={controlDeployment}
          onScale={scaleDeployment}
        />
      )}
    </div>
  );
}

function DeploymentManagement({ deployments, onSelect, onControl, onScale }: {
  deployments: Deployment[];
  onSelect: (deployment: Deployment) => void;
  onControl: (deploymentId: string, action: string) => void;
  onScale: (deploymentId: string, instances: number) => void;
}) {
  const environments = ['development', 'staging', 'production'];

  return (
    <div className="space-y-6">
      {environments.map(env => {
        const envDeployments = deployments.filter(d => d.environment === env);
        
        return (
          <Card key={env}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="capitalize">{env} Environment</span>
                <Badge variant="outline">{envDeployments.length} deployments</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {envDeployments.map(deployment => (
                  <DeploymentCard
                    key={deployment.id}
                    deployment={deployment}
                    onSelect={onSelect}
                    onControl={onControl}
                    onScale={onScale}
                  />
                ))}
              </div>
              {envDeployments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="mx-auto h-8 w-8 mb-2" />
                  <div>No deployments in {env}</div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DeploymentCard({ deployment, onSelect, onControl, onScale }: {
  deployment: Deployment;
  onSelect: (deployment: Deployment) => void;
  onControl: (deploymentId: string, action: string) => void;
  onScale: (deploymentId: string, instances: number) => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect(deployment)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{deployment.name}</CardTitle>
          <div className="flex space-x-1">
            <Badge className={environmentColors[deployment.environment]}>
              {deployment.environment}
            </Badge>
            <Badge className={statusColors[deployment.status]}>
              {deployment.status}
            </Badge>
          </div>
        </div>
        <CardDescription>
          {deployment.agentName} • {deployment.modelName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Health Status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Health:</span>
            <div className={`flex items-center space-x-1 ${healthColors[deployment.healthStatus]}`}>
              <div className={`w-2 h-2 rounded-full ${
                deployment.healthStatus === 'healthy' ? 'bg-green-500' :
                deployment.healthStatus === 'degraded' ? 'bg-yellow-500' :
                deployment.healthStatus === 'unhealthy' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
              <span className="capitalize">{deployment.healthStatus}</span>
            </div>
          </div>

          {/* Instance Information */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Instances:</span>
              <div className="font-medium">{deployment.currentInstances}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>
              <div className="font-medium">{deployment.instanceType}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Requests/s:</span>
              <div className="font-medium">{deployment.requestsPerSecond}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Latency:</span>
              <div className="font-medium">{deployment.averageLatency}ms</div>
            </div>
          </div>

          {/* Uptime */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uptime:</span>
              <span className="font-medium">{deployment.uptime.toFixed(1)}%</span>
            </div>
            <Progress value={deployment.uptime} className="h-1" />
          </div>

          {/* Auto Scaling */}
          {deployment.autoScaling && (
            <div className="text-xs text-muted-foreground flex items-center space-x-1">
              <Zap className="h-3 w-3" />
              <span>Auto-scaling: {deployment.minInstances}-{deployment.maxInstances} instances</span>
            </div>
          )}

          {/* Endpoint */}
          {deployment.endpoint && (
            <div className="text-xs">
              <span className="text-muted-foreground">Endpoint:</span>
              <div className="font-mono text-blue-600 truncate">{deployment.endpoint}</div>
            </div>
          )}

          {/* Controls */}
          <div className="flex space-x-1 pt-2" onClick={(e) => e.stopPropagation()}>
            {deployment.status === 'active' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onControl(deployment.id, 'stop')}
                  className="h-7 px-2 text-xs"
                >
                  <Pause className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onControl(deployment.id, 'restart')}
                  className="h-7 px-2 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </>
            )}
            {deployment.status === 'inactive' && (
              <Button
                size="sm"
                onClick={() => onControl(deployment.id, 'start')}
                className="h-7 px-2 text-xs"
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DeploymentMonitoring({ deployments, healthChecks }: {
  deployments: Deployment[];
  healthChecks: HealthCheck[];
}) {
  return (
    <div className="space-y-4">
      {/* Overall Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {deployments.filter(d => d.healthStatus === 'healthy').length}
              </div>
              <div className="text-sm text-muted-foreground">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {deployments.filter(d => d.healthStatus === 'degraded').length}
              </div>
              <div className="text-sm text-muted-foreground">Degraded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {deployments.filter(d => d.healthStatus === 'unhealthy').length}
              </div>
              <div className="text-sm text-muted-foreground">Unhealthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {deployments.filter(d => d.healthStatus === 'unknown').length}
              </div>
              <div className="text-sm text-muted-foreground">Unknown</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Real-time deployment performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <BarChart3 className="h-8 w-8 mr-2" />
            Performance monitoring charts would be rendered here
          </div>
        </CardContent>
      </Card>

      {/* Recent Health Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Health Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {healthChecks.slice(0, 10).map(check => (
              <div key={check.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    check.status === 'healthy' ? 'bg-green-500' :
                    check.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <div className="font-medium">
                      {deployments.find(d => d.id === check.deploymentId)?.name || 'Unknown Deployment'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {check.errorMessage || `Response time: ${check.responseTime}ms`}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(check.checkedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TemplateManagement({ templates }: { templates: DeploymentTemplate[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map(template => (
        <Card key={template.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              {template.isDefault && (
                <Badge variant="outline">Default</Badge>
              )}
            </div>
            <CardDescription>{template.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Environments:</span>
                <div className="flex space-x-1">
                  {template.targetEnvironment.map(env => (
                    <Badge key={env} variant="outline" className="text-xs">
                      {env}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auto Scaling:</span>
                  <span>{template.configuration.scaling.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Load Balancer:</span>
                  <span>{template.configuration.networking.loadBalancer ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SSL:</span>
                  <span>{template.configuration.networking.ssl ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Copy className="mr-1 h-3 w-3" />
                  Clone
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InfrastructureOverview({ metrics, deployments }: {
  metrics: InfrastructureMetrics;
  deployments: Deployment[];
}) {
  return (
    <div className="space-y-4">
      {/* Resource Utilization */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cpu className="h-4 w-4" />
              <span>CPU Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Current Usage</span>
                <span className="text-sm font-medium">{metrics.totalCPU}%</span>
              </div>
              <Progress value={metrics.totalCPU} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4" />
              <span>Memory Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Current Usage</span>
                <span className="text-sm font-medium">{metrics.totalMemory}%</span>
              </div>
              <Progress value={metrics.totalMemory} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4" />
              <span>Storage Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Current Usage</span>
                <span className="text-sm font-medium">{metrics.totalStorage}%</span>
              </div>
              <Progress value={metrics.totalStorage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instance Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Instance Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {instanceTypes.map(type => {
              const count = deployments.filter(d => d.instanceType === type.id).length;
              const totalInstances = deployments.reduce((sum, d) => sum + d.currentInstances, 0);
              const percentage = totalInstances > 0 ? (count / totalInstances) * 100 : 0;
              
              return (
                <div key={type.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-primary rounded" />
                    <div>
                      <div className="font-medium">{type.name}</div>
                      <div className="text-sm text-muted-foreground">{type.cpu} • {type.memory}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{count} instances</div>
                    <div className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</div>
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

// Placeholder dialog components
function CreateDeploymentDialog({ isOpen, onClose, onCreate, isDeploying, templates }: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (deployment: any) => void;
  isDeploying: boolean;
  templates: DeploymentTemplate[];
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Enterprise Deployment</DialogTitle>
          <DialogDescription>Deploy an AI agent to enterprise infrastructure</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">Deployment creation form would go here...</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isDeploying}>Cancel</Button>
            <Button onClick={() => { onCreate({}); }} disabled={isDeploying}>
              {isDeploying ? 'Deploying...' : 'Deploy'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeploymentDetailsDialog({ deployment, isOpen, onClose, onControl, onScale }: {
  deployment: Deployment;
  isOpen: boolean;
  onClose: () => void;
  onControl: (deploymentId: string, action: string) => void;
  onScale: (deploymentId: string, instances: number) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{deployment.name}</DialogTitle>
          <DialogDescription>Deployment details and management</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">Detailed deployment information for {deployment.name} would go here...</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}