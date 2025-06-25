/**
 * Enterprise Integration Dashboard
 * Comprehensive 650+ line dashboard for managing enterprise integrations
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useFeatureFlag } from '@/lib/feature-flags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  BaseIntegration, 
  IntegrationStats, 
  IntegrationEvent, 
  SyncJob,
  IntegrationType,
  IntegrationStatus 
} from '@/types/integrations';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Cloud,
  Database,
  Globe,
  Key,
  Link,
  Mail,
  MessageSquare,
  Plug,
  RefreshCw,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Webhook,
  Zap,
  BarChart3,
  FileText,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  ExternalLink,
  CheckSquare,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';

interface EnterpriseIntegrationDashboardProps {
  teamId?: string;
  userId?: string;
}

interface DashboardFilters {
  type: IntegrationType | 'all';
  status: IntegrationStatus | 'all';
  provider: string;
  search: string;
}

interface DashboardStats {
  totalIntegrations: number;
  activeIntegrations: number;
  errorIntegrations: number;
  totalSyncs: number;
  successRate: number;
  dataPointsSynced: number;
  uptimePercentage: number;
}

// Mock data for development
const mockIntegrations: BaseIntegration[] = [
  {
    id: '1',
    name: 'Salesforce CRM',
    type: 'crm',
    provider: 'salesforce',
    status: 'connected',
    enabled: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-06-20'),
    lastSyncAt: new Date('2024-06-25T08:00:00'),
    nextSyncAt: new Date('2024-06-25T12:00:00'),
    config: {
      authType: 'oauth2',
      credentials: { clientId: 'sf_client_123' },
      endpoints: { api: 'https://api.salesforce.com' },
      scopes: ['read', 'write']
    },
    metadata: {
      version: '1.0',
      description: 'Salesforce CRM integration for contact and deal management',
      category: 'Customer Relationship Management',
      vendor: { name: 'Salesforce', website: 'https://salesforce.com' },
      rateLimits: { requestsPerMinute: 100, requestsPerHour: 5000, requestsPerDay: 100000 },
      tags: ['crm', 'sales', 'contacts']
    },
    settings: {
      syncFrequency: 'hourly',
      retryAttempts: 3,
      timeout: 30000,
      batchSize: 100,
      enableLogging: true,
      enableNotifications: true,
      customMappings: {},
      filters: []
    }
  },
  {
    id: '2',
    name: 'HubSpot Marketing',
    type: 'marketing',
    provider: 'hubspot',
    status: 'connected',
    enabled: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-06-24'),
    lastSyncAt: new Date('2024-06-25T07:30:00'),
    nextSyncAt: new Date('2024-06-25T11:30:00'),
    config: {
      authType: 'oauth2',
      credentials: { clientId: 'hs_client_456' },
      endpoints: { api: 'https://api.hubapi.com' },
      scopes: ['contacts', 'campaigns']
    },
    metadata: {
      version: '2.1',
      description: 'HubSpot marketing automation and lead management',
      category: 'Marketing Automation',
      vendor: { name: 'HubSpot', website: 'https://hubspot.com' },
      rateLimits: { requestsPerMinute: 150, requestsPerHour: 10000, requestsPerDay: 200000 },
      tags: ['marketing', 'automation', 'leads']
    },
    settings: {
      syncFrequency: 'hourly',
      retryAttempts: 3,
      timeout: 30000,
      batchSize: 50,
      enableLogging: true,
      enableNotifications: true,
      customMappings: {},
      filters: []
    }
  },
  {
    id: '3',
    name: 'Google Analytics',
    type: 'analytics',
    provider: 'google',
    status: 'error',
    enabled: false,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-06-23'),
    lastSyncAt: new Date('2024-06-23T15:00:00'),
    config: {
      authType: 'oauth2',
      credentials: { clientId: 'ga_client_789' },
      endpoints: { api: 'https://analyticsreporting.googleapis.com' },
      scopes: ['analytics.readonly']
    },
    metadata: {
      version: '4.0',
      description: 'Google Analytics data integration and reporting',
      category: 'Web Analytics',
      vendor: { name: 'Google', website: 'https://analytics.google.com' },
      rateLimits: { requestsPerMinute: 50, requestsPerHour: 2000, requestsPerDay: 50000 },
      tags: ['analytics', 'web', 'traffic']
    },
    settings: {
      syncFrequency: 'daily',
      retryAttempts: 3,
      timeout: 45000,
      batchSize: 200,
      enableLogging: true,
      enableNotifications: true,
      customMappings: {},
      filters: []
    }
  },
  {
    id: '4',
    name: 'Slack Notifications',
    type: 'webhook',
    provider: 'slack',
    status: 'connected',
    enabled: true,
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-06-25'),
    lastSyncAt: new Date('2024-06-25T09:15:00'),
    config: {
      authType: 'webhook',
      credentials: { webhookUrl: 'https://hooks.slack.com/services/...' },
      endpoints: { webhook: 'https://hooks.slack.com/services/...' }
    },
    metadata: {
      version: '1.5',
      description: 'Slack webhook integration for real-time notifications',
      category: 'Communication',
      vendor: { name: 'Slack', website: 'https://slack.com' },
      rateLimits: { requestsPerMinute: 20, requestsPerHour: 1000, requestsPerDay: 20000 },
      tags: ['notifications', 'chat', 'webhooks']
    },
    settings: {
      syncFrequency: 'realtime',
      retryAttempts: 2,
      timeout: 10000,
      batchSize: 10,
      enableLogging: true,
      enableNotifications: false,
      customMappings: {},
      filters: []
    }
  }
];

const mockEvents: IntegrationEvent[] = [
  {
    id: '1',
    integrationId: '1',
    type: 'sync',
    status: 'success',
    message: 'Successfully synced 150 contacts',
    timestamp: new Date('2024-06-25T08:00:00'),
    duration: 1250,
    details: { recordsProcessed: 150, recordsCreated: 5, recordsUpdated: 145 }
  },
  {
    id: '2',
    integrationId: '2',
    type: 'sync',
    status: 'success',
    message: 'Marketing campaign data synchronized',
    timestamp: new Date('2024-06-25T07:30:00'),
    duration: 980,
    details: { campaigns: 12, contacts: 89 }
  },
  {
    id: '3',
    integrationId: '3',
    type: 'error',
    status: 'error',
    message: 'Authentication failed - token expired',
    timestamp: new Date('2024-06-23T15:00:00'),
    details: { errorCode: 'AUTH_EXPIRED', retryCount: 3 }
  },
  {
    id: '4',
    integrationId: '4',
    type: 'webhook',
    status: 'success',
    message: 'Notification sent to #alerts channel',
    timestamp: new Date('2024-06-25T09:15:00'),
    duration: 150
  }
];

const mockSyncJobs: SyncJob[] = [
  {
    id: '1',
    integrationId: '1',
    type: 'full',
    status: 'completed',
    startedAt: new Date('2024-06-25T08:00:00'),
    completedAt: new Date('2024-06-25T08:02:30'),
    recordsProcessed: 150,
    recordsCreated: 5,
    recordsUpdated: 145,
    recordsSkipped: 0,
    recordsFailed: 0,
    errors: [],
    logs: ['Started full sync', 'Fetching contacts', 'Processing batch 1/3', 'Sync completed successfully']
  },
  {
    id: '2',
    integrationId: '2',
    type: 'incremental',
    status: 'running',
    startedAt: new Date('2024-06-25T10:00:00'),
    recordsProcessed: 45,
    recordsCreated: 2,
    recordsUpdated: 43,
    recordsSkipped: 0,
    recordsFailed: 0,
    errors: [],
    logs: ['Started incremental sync', 'Fetching changes since last sync', 'Processing batch 1/2']
  }
];

export default function EnterpriseIntegrationDashboard({ 
  teamId, 
  userId 
}: EnterpriseIntegrationDashboardProps) {
  const isEnterpriseEnabled = useFeatureFlag('ENTERPRISE_INTEGRATIONS');
  
  // State management
  const [integrations, setIntegrations] = useState<BaseIntegration[]>(mockIntegrations);
  const [events, setEvents] = useState<IntegrationEvent[]>(mockEvents);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>(mockSyncJobs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<BaseIntegration | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    type: 'all',
    status: 'all',
    provider: '',
    search: ''
  });

  // Real-time updates
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Dashboard statistics
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalIntegrations: 0,
    activeIntegrations: 0,
    errorIntegrations: 0,
    totalSyncs: 0,
    successRate: 0,
    dataPointsSynced: 0,
    uptimePercentage: 0
  });

  // Calculate dashboard statistics
  const calculateStats = useCallback(() => {
    const stats: DashboardStats = {
      totalIntegrations: integrations.length,
      activeIntegrations: integrations.filter(i => i.status === 'connected').length,
      errorIntegrations: integrations.filter(i => i.status === 'error').length,
      totalSyncs: syncJobs.length,
      successRate: syncJobs.length > 0 ? 
        (syncJobs.filter(j => j.status === 'completed').length / syncJobs.length) * 100 : 0,
      dataPointsSynced: syncJobs.reduce((sum, job) => sum + job.recordsProcessed, 0),
      uptimePercentage: 99.5 // Mock value
    };
    setDashboardStats(stats);
  }, [integrations, syncJobs]);

  // Filter integrations based on current filters
  const filteredIntegrations = integrations.filter(integration => {
    if (filters.type !== 'all' && integration.type !== filters.type) return false;
    if (filters.status !== 'all' && integration.status !== filters.status) return false;
    if (filters.provider && !integration.provider.toLowerCase().includes(filters.provider.toLowerCase())) return false;
    if (filters.search && !integration.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In production, this would be API calls
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to load integration data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;
    
    const interval = setInterval(() => {
      // Simulate real-time updates
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  // Calculate stats when data changes
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Integration actions
  const handleToggleIntegration = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;

    setIntegrations(prev => 
      prev.map(i => 
        i.id === integrationId 
          ? { ...i, enabled: !i.enabled, updatedAt: new Date() }
          : i
      )
    );
  };

  const handleSyncIntegration = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;

    // Create new sync job
    const newJob: SyncJob = {
      id: Date.now().toString(),
      integrationId,
      type: 'manual',
      status: 'running',
      startedAt: new Date(),
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      recordsFailed: 0,
      errors: [],
      logs: ['Manual sync started']
    };

    setSyncJobs(prev => [newJob, ...prev]);

    // Simulate sync completion
    setTimeout(() => {
      setSyncJobs(prev => 
        prev.map(job => 
          job.id === newJob.id 
            ? {
                ...job,
                status: 'completed',
                completedAt: new Date(),
                recordsProcessed: Math.floor(Math.random() * 100) + 10,
                recordsCreated: Math.floor(Math.random() * 5),
                recordsUpdated: Math.floor(Math.random() * 20),
                logs: [...job.logs, 'Sync completed successfully']
              }
            : job
        )
      );
    }, 3000);
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    if (confirm('Are you sure you want to delete this integration?')) {
      setIntegrations(prev => prev.filter(i => i.id !== integrationId));
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: IntegrationStatus }) => {
    const statusConfig = {
      connected: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Connected' },
      disconnected: { color: 'bg-gray-100 text-gray-800', icon: X, text: 'Disconnected' },
      error: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Error' },
      syncing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw, text: 'Syncing' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  // Type icon component
  const TypeIcon = ({ type }: { type: IntegrationType }) => {
    const icons = {
      crm: Users,
      marketing: Mail,
      analytics: BarChart3,
      social: MessageSquare,
      webhook: Webhook,
      sso: Shield,
      etl: Database
    };
    
    const Icon = icons[type] || Plug;
    return <Icon className="h-4 w-4" />;
  };

  if (!isEnterpriseEnabled) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Enterprise Integrations are not enabled. Please contact your administrator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enterprise Integration Hub</h1>
          <p className="text-gray-600 mt-1">
            Manage all your enterprise integrations in one place
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Integrations</p>
                <p className="text-2xl font-bold">{dashboardStats.totalIntegrations}</p>
              </div>
              <Plug className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Connections</p>
                <p className="text-2xl font-bold text-green-600">{dashboardStats.activeIntegrations}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{dashboardStats.successRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Points Synced</p>
                <p className="text-2xl font-bold">{dashboardStats.dataPointsSynced.toLocaleString()}</p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search integrations..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-64"
              />
            </div>
            
            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as any }))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="crm">CRM</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="webhook">Webhooks</SelectItem>
                <SelectItem value="sso">SSO</SelectItem>
                <SelectItem value="etl">ETL</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="disconnected">Disconnected</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="syncing">Syncing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600">Real-time updates</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                className={realTimeEnabled ? 'bg-green-50 border-green-200' : ''}
              >
                {realTimeEnabled ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="sync-jobs">Sync Jobs</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4">
            {filteredIntegrations.map((integration) => (
              <Card key={integration.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <TypeIcon type={integration.type} />
                        <div>
                          <h3 className="font-semibold text-lg">{integration.name}</h3>
                          <p className="text-sm text-gray-600">{integration.metadata.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <StatusBadge status={integration.status} />
                      <Badge variant="outline">{integration.type}</Badge>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span>Last sync: {integration.lastSyncAt?.toLocaleTimeString()}</span>
                      <span>Next sync: {integration.nextSyncAt?.toLocaleTimeString()}</span>
                      <span>Sync: {integration.settings.syncFrequency}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncIntegration(integration.id)}
                        disabled={integration.status === 'syncing'}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Sync
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedIntegration(integration)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Settings
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleIntegration(integration.id)}
                      >
                        {integration.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteIntegration(integration.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sync Jobs Tab */}
        <TabsContent value="sync-jobs" className="space-y-4">
          <div className="grid gap-4">
            {syncJobs.map((job) => {
              const integration = integrations.find(i => i.id === job.integrationId);
              const duration = job.completedAt && job.startedAt 
                ? Math.round((job.completedAt.getTime() - job.startedAt.getTime()) / 1000)
                : null;

              return (
                <Card key={job.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <TypeIcon type={integration?.type || 'crm'} />
                        <div>
                          <h3 className="font-semibold">{integration?.name} - {job.type} sync</h3>
                          <p className="text-sm text-gray-600">
                            Started: {job.startedAt?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'failed' ? 'bg-red-100 text-red-800' :
                        job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {job.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Processed</p>
                        <p className="text-lg font-semibold">{job.recordsProcessed}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="text-lg font-semibold text-green-600">{job.recordsCreated}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Updated</p>
                        <p className="text-lg font-semibold text-blue-600">{job.recordsUpdated}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="text-lg font-semibold">{duration ? `${duration}s` : 'Running...'}</p>
                      </div>
                    </div>

                    {job.status === 'running' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>Processing...</span>
                        </div>
                        <Progress value={65} className="w-full" />
                      </div>
                    )}

                    {job.logs.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Logs:</p>
                        <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                          {job.logs.map((log, index) => (
                            <div key={index} className="text-gray-700">{log}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="grid gap-2">
            {events.map((event) => {
              const integration = integrations.find(i => i.id === event.integrationId);
              
              return (
                <Card key={event.id} className="hover:bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          event.status === 'success' ? 'bg-green-500' :
                          event.status === 'error' ? 'bg-red-500' :
                          event.status === 'warning' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`} />
                        <div>
                          <p className="font-medium">{event.message}</p>
                          <p className="text-sm text-gray-600">
                            {integration?.name} • {event.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {event.type}
                        </Badge>
                        {event.duration && (
                          <span className="text-xs text-gray-500">{event.duration}ms</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Overall Uptime</span>
                    <span className="font-semibold">{dashboardStats.uptimePercentage}%</span>
                  </div>
                  <Progress value={dashboardStats.uptimePercentage} className="w-full" />
                  
                  <div className="flex justify-between items-center">
                    <span>Success Rate</span>
                    <span className="font-semibold">{dashboardStats.successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={dashboardStats.successRate} className="w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sync Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Syncs</span>
                    <span className="font-semibold">{dashboardStats.totalSyncs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Points Synced</span>
                    <span className="font-semibold">{dashboardStats.dataPointsSynced.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Integrations</span>
                    <span className="font-semibold">{dashboardStats.activeIntegrations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Rate</span>
                    <span className="font-semibold text-red-600">
                      {dashboardStats.errorIntegrations > 0 ? 
                        `${((dashboardStats.errorIntegrations / dashboardStats.totalIntegrations) * 100).toFixed(1)}%` : 
                        '0%'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Integration Types Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['crm', 'marketing', 'analytics', 'webhook'].map(type => {
                  const count = integrations.filter(i => i.type === type).length;
                  const percentage = integrations.length > 0 ? (count / integrations.length) * 100 : 0;
                  
                  return (
                    <div key={type} className="text-center p-4 bg-gray-50 rounded">
                      <TypeIcon type={type as IntegrationType} />
                      <p className="text-sm font-medium mt-2 capitalize">{type}</p>
                      <p className="text-lg font-bold">{count}</p>
                      <p className="text-xs text-gray-600">{percentage.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 py-4">
        Last updated: {lastUpdate.toLocaleString()} •{' '}
        <Button variant="link" className="p-0 h-auto text-sm" onClick={loadData}>
          Refresh data
        </Button>
      </div>
    </div>
  );
}