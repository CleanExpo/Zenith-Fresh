/**
 * Data Sync Pipelines Component
 * Manages ETL pipelines and data synchronization workflows
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Database,
  ArrowRight,
  Play,
  Pause,
  Square,
  RefreshCw,
  Plus,
  Settings,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingUp,
  BarChart3,
  Filter,
  MapPin,
  Zap,
  Globe,
  Activity,
  Calendar,
  Download,
  Upload,
  FileText,
  Code
} from 'lucide-react';
import { ETLPipeline, ETLTransformation } from '@/types/integrations';

// Mock ETL pipelines
const mockPipelines: ETLPipeline[] = [
  {
    id: '1',
    name: 'Salesforce to Analytics Warehouse',
    description: 'Daily sync of contacts and deals from Salesforce to analytics database',
    sourceIntegrationId: 'salesforce_1',
    targetIntegrationId: 'analytics_db_1',
    transformations: [
      {
        id: '1',
        type: 'map',
        config: { 
          mappings: { 
            'firstName': 'first_name', 
            'lastName': 'last_name',
            'Email': 'email_address'
          }
        },
        order: 1
      },
      {
        id: '2',
        type: 'filter',
        config: { 
          condition: 'status == "Active"'
        },
        order: 2
      }
    ],
    schedule: {
      type: 'cron',
      expression: '0 2 * * *' // Daily at 2 AM
    },
    status: 'active',
    lastRun: {
      startedAt: new Date('2024-06-25T02:00:00'),
      completedAt: new Date('2024-06-25T02:15:00'),
      recordsProcessed: 15678,
      status: 'success'
    }
  },
  {
    id: '2',
    name: 'HubSpot Lead Enrichment',
    description: 'Real-time enrichment of new leads with external data sources',
    sourceIntegrationId: 'hubspot_1',
    targetIntegrationId: 'crm_db_1',
    transformations: [
      {
        id: '3',
        type: 'custom',
        config: { 
          script: 'enrichment_script.js',
          apiEndpoint: 'https://api.enrichment.com/v1/enrich'
        },
        order: 1
      }
    ],
    schedule: {
      type: 'interval',
      expression: '*/5 * * * *' // Every 5 minutes
    },
    status: 'active',
    lastRun: {
      startedAt: new Date('2024-06-25T11:45:00'),
      completedAt: new Date('2024-06-25T11:47:00'),
      recordsProcessed: 23,
      status: 'success'
    }
  },
  {
    id: '3',
    name: 'Analytics Data Aggregation',
    description: 'Hourly aggregation of event data for reporting dashboard',
    sourceIntegrationId: 'events_db_1',
    targetIntegrationId: 'analytics_db_1',
    transformations: [
      {
        id: '4',
        type: 'aggregate',
        config: { 
          groupBy: ['date', 'event_type'],
          aggregations: {
            count: 'COUNT(*)',
            unique_users: 'COUNT(DISTINCT user_id)'
          }
        },
        order: 1
      }
    ],
    schedule: {
      type: 'cron',
      expression: '0 * * * *' // Every hour
    },
    status: 'error',
    lastRun: {
      startedAt: new Date('2024-06-25T11:00:00'),
      completedAt: new Date('2024-06-25T11:02:00'),
      recordsProcessed: 0,
      status: 'error',
      error: 'Connection timeout to source database'
    }
  }
];

const transformationTypes = [
  { value: 'map', label: 'Field Mapping', description: 'Map source fields to target fields' },
  { value: 'filter', label: 'Data Filter', description: 'Filter records based on conditions' },
  { value: 'aggregate', label: 'Aggregation', description: 'Group and aggregate data' },
  { value: 'join', label: 'Data Join', description: 'Join data from multiple sources' },
  { value: 'custom', label: 'Custom Script', description: 'Custom transformation logic' }
];

export default function DataSyncPipelines() {
  const [pipelines, setPipelines] = useState<ETLPipeline[]>(mockPipelines);
  const [selectedPipeline, setSelectedPipeline] = useState<ETLPipeline | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [runningPipelines, setRunningPipelines] = useState<Set<string>>(new Set());
  
  const [pipelineForm, setPipelineForm] = useState({
    name: '',
    description: '',
    sourceIntegrationId: '',
    targetIntegrationId: '',
    scheduleType: 'cron' as 'cron' | 'interval',
    scheduleExpression: '',
    transformations: [] as ETLTransformation[]
  });

  // Handle pipeline creation
  const handleCreatePipeline = useCallback(() => {
    const newPipeline: ETLPipeline = {
      id: Date.now().toString(),
      name: pipelineForm.name,
      description: pipelineForm.description,
      sourceIntegrationId: pipelineForm.sourceIntegrationId,
      targetIntegrationId: pipelineForm.targetIntegrationId,
      transformations: pipelineForm.transformations,
      schedule: {
        type: pipelineForm.scheduleType,
        expression: pipelineForm.scheduleExpression
      },
      status: 'active'
    };
    
    setPipelines(prev => [...prev, newPipeline]);
    setShowCreateDialog(false);
    setPipelineForm({
      name: '',
      description: '',
      sourceIntegrationId: '',
      targetIntegrationId: '',
      scheduleType: 'cron',
      scheduleExpression: '',
      transformations: []
    });
  }, [pipelineForm]);

  // Handle pipeline execution
  const handleRunPipeline = useCallback(async (pipelineId: string) => {
    setRunningPipelines(prev => new Set([...Array.from(prev), pipelineId]));
    
    // Simulate pipeline execution
    setTimeout(() => {
      setPipelines(prev => 
        prev.map(pipeline => 
          pipeline.id === pipelineId 
            ? {
                ...pipeline,
                lastRun: {
                  startedAt: new Date(),
                  completedAt: new Date(Date.now() + 30000),
                  recordsProcessed: Math.floor(Math.random() * 1000) + 100,
                  status: 'success'
                }
              }
            : pipeline
        )
      );
      setRunningPipelines(prev => {
        const next = new Set(prev);
        next.delete(pipelineId);
        return next;
      });
    }, 3000);
  }, []);

  // Handle pipeline pause/resume
  const handleTogglePipeline = useCallback((pipelineId: string) => {
    setPipelines(prev => 
      prev.map(pipeline => 
        pipeline.id === pipelineId 
          ? { 
              ...pipeline, 
              status: pipeline.status === 'active' ? 'paused' : 'active'
            }
          : pipeline
      )
    );
  }, []);

  // Handle pipeline deletion
  const handleDeletePipeline = useCallback((pipelineId: string) => {
    if (confirm('Are you sure you want to delete this pipeline?')) {
      setPipelines(prev => prev.filter(p => p.id !== pipelineId));
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Data Sync Pipelines</h2>
          <p className="text-gray-600">Manage ETL pipelines and data synchronization workflows</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Pipeline Analytics
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Pipeline
          </Button>
        </div>
      </div>

      {/* Pipeline Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pipelines</p>
                <p className="text-2xl font-bold">{pipelines.length}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Pipelines</p>
                <p className="text-2xl font-bold text-green-600">
                  {pipelines.filter(p => p.status === 'active').length}
                </p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Records Processed (24h)</p>
                <p className="text-2xl font-bold">1.2M</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">98.5%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pipelines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="runs">Pipeline Runs</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines" className="space-y-4">
          <div className="grid gap-4">
            {pipelines.map((pipeline) => {
              const isRunning = runningPipelines.has(pipeline.id);
              
              return (
                <Card key={pipeline.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                          <Badge className={getStatusColor(pipeline.status)}>
                            {pipeline.status}
                          </Badge>
                        </div>
                        <CardDescription className="mt-1">
                          {pipeline.description}
                        </CardDescription>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>Schedule: {pipeline.schedule.expression}</span>
                          <span>•</span>
                          <span>{pipeline.transformations.length} transformations</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={pipeline.status === 'active'}
                          onCheckedChange={() => handleTogglePipeline(pipeline.id)}
                          disabled={isRunning}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Pipeline Flow Visualization */}
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Database className="h-5 w-5 text-blue-500" />
                          <span className="text-sm font-medium">Source</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1">
                            {pipeline.transformations.map((_, index) => (
                              <div key={index} className="w-6 h-6 bg-purple-100 border-2 border-white rounded-full flex items-center justify-center">
                                <span className="text-xs text-purple-600">{index + 1}</span>
                              </div>
                            ))}
                          </div>
                          <span className="text-sm font-medium">Transform</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <div className="flex items-center gap-2">
                          <Database className="h-5 w-5 text-green-500" />
                          <span className="text-sm font-medium">Target</span>
                        </div>
                      </div>

                      {/* Last Run Information */}
                      {pipeline.lastRun && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                          <div>
                            <p className="text-sm text-gray-600">Last Run</p>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(pipeline.lastRun.status)}
                              <span className="font-medium">
                                {pipeline.lastRun.startedAt.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Duration</p>
                            <p className="font-medium">
                              {pipeline.lastRun.completedAt && 
                                Math.round((pipeline.lastRun.completedAt.getTime() - pipeline.lastRun.startedAt.getTime()) / 1000)
                              }s
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Records Processed</p>
                            <p className="font-medium">{pipeline.lastRun.recordsProcessed.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(pipeline.lastRun.status)}
                              <span className="font-medium capitalize">{pipeline.lastRun.status}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {pipeline.lastRun?.error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                          <strong>Error:</strong> {pipeline.lastRun.error}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          size="sm"
                          onClick={() => handleRunPipeline(pipeline.id)}
                          disabled={isRunning || pipeline.status !== 'active'}
                          className="flex items-center gap-2"
                        >
                          {isRunning ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          {isRunning ? 'Running...' : 'Run Now'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPipeline(pipeline);
                            setShowEditDialog(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Logs
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Configure
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePipeline(pipeline.id)}
                          className="text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Execution History</CardTitle>
              <CardDescription>View detailed logs and metrics for pipeline runs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Pipeline execution history will be displayed here</p>
                <p className="text-sm">Track performance, errors, and data processing metrics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Average Processing Time</span>
                    <span className="font-semibold">2m 34s</span>
                  </div>
                  <Progress value={75} className="w-full" />
                  
                  <div className="flex justify-between items-center">
                    <span>Data Throughput</span>
                    <span className="font-semibold">1.2K records/min</span>
                  </div>
                  <Progress value={60} className="w-full" />
                  
                  <div className="flex justify-between items-center">
                    <span>Success Rate</span>
                    <span className="font-semibold">98.5%</span>
                  </div>
                  <Progress value={98.5} className="w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>CPU Usage</span>
                    <span className="font-semibold">45%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Usage</span>
                    <span className="font-semibold">2.1GB / 8GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Connections</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Queue Depth</span>
                    <span className="font-semibold">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Default Retry Attempts</Label>
                  <Select defaultValue="3">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 attempt</SelectItem>
                      <SelectItem value="3">3 attempts</SelectItem>
                      <SelectItem value="5">5 attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Pipeline Monitoring</Label>
                    <p className="text-sm text-gray-600">Monitor pipeline performance and health</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-restart Failed Pipelines</Label>
                    <p className="text-sm text-gray-600">Automatically retry failed pipeline runs</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Data Quality Checks</Label>
                    <p className="text-sm text-gray-600">Validate data quality during processing</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full">Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Pipeline Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Data Pipeline</DialogTitle>
            <DialogDescription>
              Configure a new ETL pipeline for data synchronization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pipeline Name</Label>
              <Input 
                placeholder="My Data Pipeline"
                value={pipelineForm.name}
                onChange={(e) => setPipelineForm(prev => ({ ...prev, name: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea 
                placeholder="Describe what this pipeline does..."
                value={pipelineForm.description}
                onChange={(e) => setPipelineForm(prev => ({ ...prev, description: e.target.value }))}
                className="mt-2"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Source Integration</Label>
                <Select 
                  value={pipelineForm.sourceIntegrationId} 
                  onValueChange={(value) => setPipelineForm(prev => ({ ...prev, sourceIntegrationId: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salesforce_1">Salesforce CRM</SelectItem>
                    <SelectItem value="hubspot_1">HubSpot</SelectItem>
                    <SelectItem value="events_db_1">Events Database</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Integration</Label>
                <Select 
                  value={pipelineForm.targetIntegrationId} 
                  onValueChange={(value) => setPipelineForm(prev => ({ ...prev, targetIntegrationId: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analytics_db_1">Analytics Database</SelectItem>
                    <SelectItem value="crm_db_1">CRM Database</SelectItem>
                    <SelectItem value="warehouse_1">Data Warehouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Schedule Type</Label>
                <Select 
                  value={pipelineForm.scheduleType} 
                  onValueChange={(value: any) => setPipelineForm(prev => ({ ...prev, scheduleType: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cron">Cron Schedule</SelectItem>
                    <SelectItem value="interval">Interval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Schedule Expression</Label>
                <Input 
                  placeholder={pipelineForm.scheduleType === 'cron' ? '0 2 * * *' : '*/30 * * * *'}
                  value={pipelineForm.scheduleExpression}
                  onChange={(e) => setPipelineForm(prev => ({ ...prev, scheduleExpression: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePipeline}>
              Create Pipeline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}