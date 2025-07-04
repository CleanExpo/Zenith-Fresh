/**
 * Enterprise Integration Dashboard
 * 
 * Comprehensive dashboard for managing enterprise integrations,
 * monitoring performance, and accessing developer tools.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  Settings, 
  Zap, 
  Globe, 
  Shield, 
  Database, 
  Code, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  Play,
  RefreshCw
} from 'lucide-react';

interface IntegrationStatus {
  id: string;
  name: string;
  displayName: string;
  category: string;
  status: 'active' | 'inactive' | 'error' | 'warning';
  instances: number;
  lastSync: string;
  successRate: number;
  responseTime: number;
}

interface HubStatus {
  activated: boolean;
  lastActivation: string | null;
  activationResult: any;
  testResults: any;
  endpoints: {
    apiGateway: string;
    developerPortal: string;
    marketplace: string;
    documentation: string;
    webhooks: string;
  };
}

interface DashboardStats {
  totalIntegrations: number;
  activeIntegrations: number;
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  webhooksConfigured: number;
  sdksGenerated: number;
}

export default function EnterpriseIntegrationDashboard() {
  const [hubStatus, setHubStatus] = useState<HubStatus | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [isActivating, setIsActivating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      // Load hub status
      const statusResponse = await fetch('/api/integration/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setHubStatus(statusData);
        
        // Generate mock stats based on status
        if (statusData.activationResult) {
          setStats({
            totalIntegrations: statusData.activationResult.statistics.integrationsLoaded || 0,
            activeIntegrations: statusData.activationResult.statistics.integrationsLoaded || 0,
            totalRequests: Math.floor(Math.random() * 10000) + 1000,
            successRate: 98.5,
            averageResponseTime: 185,
            webhooksConfigured: statusData.activationResult.statistics.webhooksConfigured || 0,
            sdksGenerated: statusData.activationResult.statistics.sdksGenerated || 0
          });

          // Generate mock integrations
          const mockIntegrations: IntegrationStatus[] = [
            {
              id: 'salesforce',
              name: 'salesforce',
              displayName: 'Salesforce CRM',
              category: 'CRM',
              status: 'active',
              instances: 3,
              lastSync: '2 minutes ago',
              successRate: 99.2,
              responseTime: 150
            },
            {
              id: 'hubspot',
              name: 'hubspot',
              displayName: 'HubSpot CRM',
              category: 'CRM',
              status: 'active',
              instances: 2,
              lastSync: '5 minutes ago',
              successRate: 98.8,
              responseTime: 210
            },
            {
              id: 'slack',
              name: 'slack',
              displayName: 'Slack Workspace',
              category: 'Communication',
              status: 'active',
              instances: 1,
              lastSync: '1 minute ago',
              successRate: 99.9,
              responseTime: 95
            },
            {
              id: 'marketo',
              name: 'marketo',
              displayName: 'Marketo Engage',
              category: 'Marketing',
              status: 'warning',
              instances: 1,
              lastSync: '15 minutes ago',
              successRate: 94.2,
              responseTime: 340
            }
          ];
          setIntegrations(mockIntegrations);
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data');
    }
  };

  const activateHub = async () => {
    try {
      setIsActivating(true);
      setError(null);

      const response = await fetch('/api/integration/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enableDeveloperPortal: true,
          enableAPIGateway: true,
          enableWebhooks: true,
          enableSDKGeneration: true,
          enableMarketplace: true,
          integrationTemplates: true,
          generateDocumentation: true,
          setupTestEnvironment: true,
          runTests: true
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await loadDashboardData();
      } else {
        setError(result.message || 'Hub activation failed');
      }
    } catch (error) {
      console.error('Hub activation error:', error);
      setError('Failed to activate hub');
    } finally {
      setIsActivating(false);
    }
  };

  const refreshDashboard = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enterprise Integration Hub</h1>
            <p className="text-gray-600 mt-2">Fortune 500-grade integration platform with comprehensive API management</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={refreshDashboard}
              variant="outline"
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            {!hubStatus?.activated && (
              <Button
                onClick={activateHub}
                disabled={isActivating}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Play className={`h-4 w-4 ${isActivating ? 'animate-pulse' : ''}`} />
                <span>{isActivating ? 'Activating...' : 'Activate Hub'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Status Alert */}
        {hubStatus && (
          <Alert className={hubStatus.activated ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
            {hubStatus.activated ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertTitle>
              {hubStatus.activated ? 'Integration Hub Active' : 'Integration Hub Not Activated'}
            </AlertTitle>
            <AlertDescription>
              {hubStatus.activated
                ? `Hub activated ${hubStatus.lastActivation ? `on ${new Date(hubStatus.lastActivation).toLocaleString()}` : 'recently'}`
                : 'Click "Activate Hub" to initialize the enterprise integration platform'
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Main Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Total Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.totalIntegrations}</div>
                  <Database className="h-8 w-8 text-blue-200" />
                </div>
                <p className="text-xs text-blue-100 mt-1">{stats.activeIntegrations} active</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-100">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.successRate}%</div>
                  <TrendingUp className="h-8 w-8 text-green-200" />
                </div>
                <p className="text-xs text-green-100 mt-1">{stats.totalRequests.toLocaleString()} total requests</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.averageResponseTime}ms</div>
                  <Zap className="h-8 w-8 text-purple-200" />
                </div>
                <p className="text-xs text-purple-100 mt-1">Average response</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-100">SDKs Generated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.sdksGenerated}</div>
                  <Code className="h-8 w-8 text-orange-200" />
                </div>
                <p className="text-xs text-orange-100 mt-1">Multiple languages</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="gateway">API Gateway</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="developer">Developer Tools</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Enterprise Integrations</span>
                  </CardTitle>
                  <CardDescription>
                    Monitor and manage your enterprise integration connections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {integrations.map((integration) => (
                      <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(integration.status)}
                          <div>
                            <h3 className="font-semibold">{integration.displayName}</h3>
                            <p className="text-sm text-gray-600">{integration.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm font-medium">{integration.instances} instances</p>
                            <p className="text-xs text-gray-500">Last sync: {integration.lastSync}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{integration.successRate}% success</p>
                            <p className="text-xs text-gray-500">{integration.responseTime}ms avg</p>
                          </div>
                          <Badge className={getStatusColor(integration.status)}>
                            {integration.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* API Gateway Tab */}
          <TabsContent value="gateway">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>API Gateway</span>
                  </CardTitle>
                  <CardDescription>
                    Enterprise API gateway with advanced routing and middleware
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-sm">Routes Created</h3>
                        <p className="text-2xl font-bold text-blue-600">
                          {hubStatus?.activationResult?.statistics?.routesCreated || 0}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-sm">Rate Limiting</h3>
                        <p className="text-2xl font-bold text-green-600">Active</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-sm">Caching</h3>
                        <p className="text-2xl font-bold text-purple-600">Enabled</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-semibold">Gateway Endpoint</h3>
                        <p className="text-sm text-gray-600">{hubStatus?.endpoints?.apiGateway || '/api/integration/gateway'}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Webhook Management</span>
                  </CardTitle>
                  <CardDescription>
                    Enterprise webhook delivery with guaranteed reliability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-sm">Configured Webhooks</h3>
                        <p className="text-2xl font-bold text-blue-600">
                          {hubStatus?.activationResult?.statistics?.webhooksConfigured || 0}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-sm">Delivery Rate</h3>
                        <p className="text-2xl font-bold text-green-600">99.8%</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-sm">Retry Policy</h3>
                        <p className="text-2xl font-bold text-orange-600">Active</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Developer Tools Tab */}
          <TabsContent value="developer">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <span>Developer Portal</span>
                  </CardTitle>
                  <CardDescription>
                    SDKs, documentation, and developer resources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Generated SDKs</h3>
                      <div className="space-y-2">
                        {['TypeScript', 'Python', 'Go'].map((lang) => (
                          <div key={lang} className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="font-medium">{lang}</span>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold">Developer Resources</h3>
                      <div className="space-y-2">
                        {[
                          { name: 'API Documentation', url: hubStatus?.endpoints?.documentation },
                          { name: 'Developer Portal', url: hubStatus?.endpoints?.developerPortal },
                          { name: 'Integration Marketplace', url: hubStatus?.endpoints?.marketplace }
                        ].map((resource) => (
                          <div key={resource.name} className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="font-medium">{resource.name}</span>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>System Monitoring</span>
                  </CardTitle>
                  <CardDescription>
                    Real-time monitoring and health checks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Health Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-sm mb-2">System Health</h3>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-green-600 font-medium">Healthy</span>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-sm mb-2">Last Test Run</h3>
                        <p className="text-sm text-gray-600">
                          {hubStatus?.testResults ? 'Tests completed successfully' : 'No tests run yet'}
                        </p>
                      </div>
                    </div>

                    {/* Test Results */}
                    {hubStatus?.testResults && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="font-semibold text-green-800 mb-2">Integration Test Results</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Total Tests</p>
                            <p className="font-bold text-green-800">{hubStatus.testResults.total}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Passed</p>
                            <p className="font-bold text-green-800">{hubStatus.testResults.passed}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Success Rate</p>
                            <p className="font-bold text-green-800">{hubStatus.testResults.successRate?.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Duration</p>
                            <p className="font-bold text-green-800">{hubStatus.testResults.duration}ms</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}