'use client';

/**
 * AI Infrastructure Integration Component
 * 
 * Comprehensive integration layer connecting the orchestration system
 * with existing AI infrastructure, models, and enterprise services.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Brain, 
  Database, 
  Zap, 
  Globe, 
  Settings, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  Cpu,
  Network,
  FileText,
  BarChart3,
  Shield,
  Users,
  MessageSquare,
  Eye,
  Layers,
  RefreshCw,
  Link,
  Server
} from 'lucide-react';

interface AIService {
  id: string;
  name: string;
  type: 'model' | 'api' | 'pipeline' | 'storage' | 'compute';
  provider: string;
  status: 'connected' | 'disconnected' | 'error' | 'maintenance';
  version: string;
  endpoint: string;
  capabilities: string[];
  usage: {
    requests: number;
    successRate: number;
    avgLatency: number;
    lastUsed: string;
  };
  resources: {
    cpu: number;
    memory: number;
    cost: number;
  };
  configuration: Record<string, any>;
}

interface ModelIntegration {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'huggingface' | 'custom';
  model: string;
  status: 'active' | 'inactive' | 'training' | 'deploying';
  capabilities: string[];
  performance: {
    accuracy: number;
    latency: number;
    throughput: number;
    cost: number;
  };
  usage: {
    requests: number;
    tokens: number;
    cost: number;
    lastMonth: number;
  };
  configuration: {
    maxTokens: number;
    temperature: number;
    apiKey: string;
    endpoint: string;
  };
}

interface PipelineIntegration {
  id: string;
  name: string;
  type: 'content' | 'analytics' | 'monitoring' | 'security';
  stages: string[];
  status: 'running' | 'stopped' | 'error';
  throughput: number;
  successRate: number;
  avgProcessingTime: number;
  connectedServices: string[];
  lastRun: string;
}

interface IntegrationHealth {
  overall: number;
  services: {
    ai_models: number;
    enterprise_apis: number;
    data_pipelines: number;
    monitoring: number;
  };
  issues: Array<{
    service: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

export function AIInfrastructureIntegration() {
  const [services, setServices] = useState<AIService[]>([]);
  const [models, setModels] = useState<ModelIntegration[]>([]);
  const [pipelines, setPipelines] = useState<PipelineIntegration[]>([]);
  const [health, setHealth] = useState<IntegrationHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data generation
  const generateServices = (): AIService[] => [
    {
      id: 'service-001',
      name: 'OpenAI GPT-4',
      type: 'model',
      provider: 'OpenAI',
      status: 'connected',
      version: '4.0',
      endpoint: 'https://api.openai.com/v1',
      capabilities: ['text-generation', 'completion', 'chat'],
      usage: {
        requests: 15847,
        successRate: 99.2,
        avgLatency: 1250,
        lastUsed: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      resources: {
        cpu: 0,
        memory: 0,
        cost: 847.50
      },
      configuration: {
        maxTokens: 4096,
        temperature: 0.7,
        model: 'gpt-4'
      }
    },
    {
      id: 'service-002',
      name: 'Claude 3.5 Sonnet',
      type: 'model',
      provider: 'Anthropic',
      status: 'connected',
      version: '3.5',
      endpoint: 'https://api.anthropic.com/v1',
      capabilities: ['text-generation', 'analysis', 'reasoning'],
      usage: {
        requests: 8934,
        successRate: 99.8,
        avgLatency: 980,
        lastUsed: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      },
      resources: {
        cpu: 0,
        memory: 0,
        cost: 567.30
      },
      configuration: {
        maxTokens: 8192,
        temperature: 0.5,
        model: 'claude-3-5-sonnet-20241022'
      }
    },
    {
      id: 'service-003',
      name: 'Google AI Platform',
      type: 'api',
      provider: 'Google',
      status: 'connected',
      version: '1.0',
      endpoint: 'https://aiplatform.googleapis.com/v1',
      capabilities: ['analytics', 'prediction', 'monitoring'],
      usage: {
        requests: 5623,
        successRate: 98.7,
        avgLatency: 450,
        lastUsed: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      resources: {
        cpu: 2.5,
        memory: 8192,
        cost: 234.80
      },
      configuration: {
        projectId: 'zenith-platform',
        region: 'us-central1'
      }
    },
    {
      id: 'service-004',
      name: 'Content Processing Pipeline',
      type: 'pipeline',
      provider: 'Internal',
      status: 'connected',
      version: '2.1.0',
      endpoint: 'internal://content-pipeline',
      capabilities: ['content-analysis', 'nlp', 'sentiment'],
      usage: {
        requests: 12456,
        successRate: 97.5,
        avgLatency: 2340,
        lastUsed: new Date(Date.now() - 1 * 60 * 1000).toISOString()
      },
      resources: {
        cpu: 4.0,
        memory: 16384,
        cost: 156.40
      },
      configuration: {
        batchSize: 32,
        timeout: 30000
      }
    },
    {
      id: 'service-005',
      name: 'Vector Database',
      type: 'storage',
      provider: 'Pinecone',
      status: 'connected',
      version: '2.0',
      endpoint: 'https://zenith-12345.svc.us-east1-gcp.pinecone.io',
      capabilities: ['embedding-storage', 'similarity-search', 'indexing'],
      usage: {
        requests: 34567,
        successRate: 99.9,
        avgLatency: 87,
        lastUsed: new Date(Date.now() - 30 * 1000).toISOString()
      },
      resources: {
        cpu: 1.0,
        memory: 4096,
        cost: 89.60
      },
      configuration: {
        dimension: 1536,
        metric: 'cosine',
        pods: 2
      }
    }
  ];

  const generateModels = (): ModelIntegration[] => [
    {
      id: 'model-001',
      name: 'Content Analysis Model',
      provider: 'openai',
      model: 'gpt-4',
      status: 'active',
      capabilities: ['text-analysis', 'sentiment', 'classification'],
      performance: {
        accuracy: 94.2,
        latency: 1250,
        throughput: 850,
        cost: 0.045
      },
      usage: {
        requests: 15847,
        tokens: 2456789,
        cost: 847.50,
        lastMonth: 723.20
      },
      configuration: {
        maxTokens: 4096,
        temperature: 0.7,
        apiKey: 'sk-***************',
        endpoint: 'https://api.openai.com/v1'
      }
    },
    {
      id: 'model-002',
      name: 'Reasoning Assistant',
      provider: 'anthropic',
      model: 'claude-3-5-sonnet',
      status: 'active',
      capabilities: ['reasoning', 'analysis', 'problem-solving'],
      performance: {
        accuracy: 96.8,
        latency: 980,
        throughput: 1200,
        cost: 0.032
      },
      usage: {
        requests: 8934,
        tokens: 1789456,
        cost: 567.30,
        lastMonth: 512.80
      },
      configuration: {
        maxTokens: 8192,
        temperature: 0.5,
        apiKey: 'sk-ant-***************',
        endpoint: 'https://api.anthropic.com/v1'
      }
    },
    {
      id: 'model-003',
      name: 'Analytics Engine',
      provider: 'google',
      model: 'gemini-pro',
      status: 'active',
      capabilities: ['data-analysis', 'prediction', 'visualization'],
      performance: {
        accuracy: 91.5,
        latency: 650,
        throughput: 2000,
        cost: 0.028
      },
      usage: {
        requests: 5623,
        tokens: 945678,
        cost: 234.80,
        lastMonth: 198.45
      },
      configuration: {
        maxTokens: 2048,
        temperature: 0.3,
        apiKey: 'AIza***************',
        endpoint: 'https://generativelanguage.googleapis.com/v1'
      }
    }
  ];

  const generatePipelines = (): PipelineIntegration[] => [
    {
      id: 'pipeline-001',
      name: 'Content Processing Pipeline',
      type: 'content',
      stages: ['ingestion', 'analysis', 'classification', 'storage'],
      status: 'running',
      throughput: 1247,
      successRate: 97.5,
      avgProcessingTime: 2340,
      connectedServices: ['service-001', 'service-004', 'service-005'],
      lastRun: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: 'pipeline-002',
      name: 'Analytics Pipeline',
      type: 'analytics',
      stages: ['data-collection', 'processing', 'analysis', 'reporting'],
      status: 'running',
      throughput: 856,
      successRate: 98.9,
      avgProcessingTime: 1680,
      connectedServices: ['service-003', 'service-005'],
      lastRun: new Date(Date.now() - 2 * 60 * 1000).toISOString()
    },
    {
      id: 'pipeline-003',
      name: 'Monitoring Pipeline',
      type: 'monitoring',
      stages: ['metric-collection', 'anomaly-detection', 'alerting'],
      status: 'running',
      throughput: 5678,
      successRate: 99.2,
      avgProcessingTime: 450,
      connectedServices: ['service-003'],
      lastRun: new Date(Date.now() - 1 * 60 * 1000).toISOString()
    }
  ];

  const generateHealth = (): IntegrationHealth => ({
    overall: 96.7,
    services: {
      ai_models: 98.2,
      enterprise_apis: 97.5,
      data_pipelines: 95.8,
      monitoring: 99.1
    },
    issues: [
      {
        service: 'Content Processing Pipeline',
        severity: 'medium',
        message: 'Processing latency above baseline by 15%',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        service: 'Vector Database',
        severity: 'low',
        message: 'Storage utilization at 78%',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      }
    ]
  });

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      // Simulate API calls to existing infrastructure
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setServices(generateServices());
      setModels(generateModels());
      setPipelines(generatePipelines());
      setHealth(generateHealth());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
      case 'running':
        return 'text-green-600';
      case 'disconnected':
      case 'inactive':
      case 'stopped':
        return 'text-gray-600';
      case 'error':
        return 'text-red-600';
      case 'maintenance':
      case 'training':
      case 'deploying':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
      case 'running':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading AI infrastructure integrations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Infrastructure Integration</h2>
          <p className="text-muted-foreground">
            Connected AI services, models, and processing pipelines
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Overview */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health.overall.toFixed(1)}%</div>
              <Progress value={health.overall} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Models</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health.services.ai_models.toFixed(1)}%</div>
              <Progress value={health.services.ai_models} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">APIs</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health.services.enterprise_apis.toFixed(1)}%</div>
              <Progress value={health.services.enterprise_apis} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipelines</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health.services.data_pipelines.toFixed(1)}%</div>
              <Progress value={health.services.data_pipelines} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monitoring</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health.services.monitoring.toFixed(1)}%</div>
              <Progress value={health.services.monitoring} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Health Issues */}
      {health && health.issues.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Integration Issues</AlertTitle>
          <AlertDescription>
            {health.issues.length} issue(s) detected across AI infrastructure components
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services">AI Services</TabsTrigger>
          <TabsTrigger value="models">ML Models</TabsTrigger>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {services.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{service.provider} • {service.type}</p>
                    </div>
                    <div className={`flex items-center gap-1 ${getStatusColor(service.status)}`}>
                      {getStatusIcon(service.status)}
                      <Badge variant="outline" className={getStatusColor(service.status)}>
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Requests</p>
                      <p className="text-2xl font-bold">{service.usage.requests.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Success Rate</p>
                      <p className="text-2xl font-bold">{service.usage.successRate}%</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Avg Latency</p>
                      <p className="text-lg font-semibold">{service.usage.avgLatency}ms</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Cost</p>
                      <p className="text-lg font-semibold">${service.resources.cost}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Capabilities</p>
                    <div className="flex flex-wrap gap-1">
                      {service.capabilities.map((capability, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Last used: {new Date(service.usage.lastUsed).toLocaleTimeString()}</span>
                    <span>v{service.version}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="space-y-4">
            {models.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{model.provider} • {model.model}</p>
                    </div>
                    <div className={`flex items-center gap-1 ${getStatusColor(model.status)}`}>
                      {getStatusIcon(model.status)}
                      <Badge variant="outline" className={getStatusColor(model.status)}>
                        {model.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Accuracy:</span>
                          <span className="text-sm font-medium">{model.performance.accuracy}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Latency:</span>
                          <span className="text-sm font-medium">{model.performance.latency}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Throughput:</span>
                          <span className="text-sm font-medium">{model.performance.throughput}/min</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Usage</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Requests:</span>
                          <span className="text-sm font-medium">{model.usage.requests.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Tokens:</span>
                          <span className="text-sm font-medium">{(model.usage.tokens / 1000000).toFixed(1)}M</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Cost:</span>
                          <span className="text-sm font-medium">${model.usage.cost}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Capabilities</h4>
                      <div className="flex flex-wrap gap-1">
                        {model.capabilities.map((capability, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pipelines" className="space-y-4">
          <div className="space-y-4">
            {pipelines.map((pipeline) => (
              <Card key={pipeline.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{pipeline.type} pipeline</p>
                    </div>
                    <div className={`flex items-center gap-1 ${getStatusColor(pipeline.status)}`}>
                      {getStatusIcon(pipeline.status)}
                      <Badge variant="outline" className={getStatusColor(pipeline.status)}>
                        {pipeline.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Pipeline Stages</h4>
                        <div className="flex flex-wrap gap-2">
                          {pipeline.stages.map((stage, index) => (
                            <Badge key={index} variant="outline">
                              {stage}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Connected Services</h4>
                        <div className="flex flex-wrap gap-2">
                          {pipeline.connectedServices.map((serviceId, index) => {
                            const service = services.find(s => s.id === serviceId);
                            return (
                              <Badge key={index} variant="secondary">
                                {service?.name || serviceId}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Performance Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Throughput:</span>
                          <span className="text-sm font-medium">{pipeline.throughput}/min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Success Rate:</span>
                          <span className="text-sm font-medium">{pipeline.successRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Avg Processing:</span>
                          <span className="text-sm font-medium">{pipeline.avgProcessingTime}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Last Run:</span>
                          <span className="text-sm font-medium">
                            {new Date(pipeline.lastRun).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">API Endpoints</h4>
                <div className="space-y-3">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{service.name}</span>
                        <p className="text-sm text-muted-foreground">{service.endpoint}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={service.status === 'connected' ? 'default' : 'secondary'}>
                          {service.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Environment Variables</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded">
                    <span className="font-medium">OPENAI_API_KEY</span>
                    <p className="text-sm text-muted-foreground">sk-***************</p>
                  </div>
                  <div className="p-3 border rounded">
                    <span className="font-medium">ANTHROPIC_API_KEY</span>
                    <p className="text-sm text-muted-foreground">sk-ant-***************</p>
                  </div>
                  <div className="p-3 border rounded">
                    <span className="font-medium">GOOGLE_AI_API_KEY</span>
                    <p className="text-sm text-muted-foreground">AIza***************</p>
                  </div>
                  <div className="p-3 border rounded">
                    <span className="font-medium">PINECONE_API_KEY</span>
                    <p className="text-sm text-muted-foreground">************-***************</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}