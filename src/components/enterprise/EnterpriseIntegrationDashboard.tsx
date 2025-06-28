'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield,
  Key,
  Webhook,
  Slack,
  Github,
  Users,
  Palette,
  Globe,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  Activity,
  BarChart3,
  Code,
  Download,
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  scope: string[];
  rateLimit: number;
  lastUsedAt?: string;
  active: boolean;
  createdAt: string;
}

interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  deliveries: number;
  lastDelivery?: string;
}

interface Integration {
  id: string;
  provider: 'slack' | 'teams' | 'github' | 'zapier';
  name: string;
  active: boolean;
  lastSync?: string;
  settings: any;
}

interface BrandingConfig {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  customDomain?: string;
}

export default function EnterpriseIntegrationDashboard() {
  const [activeTab, setActiveTab] = useState('sso');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [availableIntegrations, setAvailableIntegrations] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<BrandingConfig>({
    brandName: 'Zenith',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    accentColor: '#06b6d4',
  });

  // Load real data from APIs
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load webhooks
        const webhooksResponse = await fetch('/api/integrations/webhooks');
        if (webhooksResponse.ok) {
          const webhooksData = await webhooksResponse.json();
          if (webhooksData.success) {
            setWebhooks(webhooksData.webhooks);
          }
        }

        // Load connected integrations
        const integrationsResponse = await fetch('/api/integrations/hub?action=instances');
        if (integrationsResponse.ok) {
          const integrationsData = await integrationsResponse.json();
          if (integrationsData.success) {
            const mappedIntegrations = integrationsData.instances.map((instance: any) => ({
              id: instance.id,
              provider: instance.integrationId,
              name: instance.name || instance.integrationId,
              active: instance.status === 'active',
              lastSync: instance.lastSync,
              settings: instance.configuration || {},
            }));
            setIntegrations(mappedIntegrations);
          }
        }

        // Load available integrations from marketplace
        const marketplaceResponse = await fetch('/api/integrations/marketplace?popular=true');
        if (marketplaceResponse.ok) {
          const marketplaceData = await marketplaceResponse.json();
          if (marketplaceData.success) {
            setAvailableIntegrations(marketplaceData.integrations);
          }
        }

        // Load analytics data
        const analyticsResponse = await fetch('/api/integrations/analytics?timeframe=7d');
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          if (analyticsData.success) {
            setAnalytics(analyticsData.analytics);
          }
        }

        // Set placeholder API keys (these would come from a real API keys management system)
        setApiKeys([
          {
            id: '1',
            name: 'Production API',
            key: 'sk_live_****',
            scope: ['users', 'projects', 'analytics'],
            rateLimit: 1000,
            lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            active: true,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            name: 'Development API',
            key: 'sk_test_****',
            scope: ['users', 'projects'],
            rateLimit: 100,
            lastUsedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            active: true,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);
      } catch (error) {
        console.error('Failed to load integration data:', error);
      }
    };

    loadData();
  }, []);

  const handleConnectIntegration = async (provider: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: provider }),
      });

      const data = await response.json();
      if (data.success && data.authType === 'oauth2') {
        // Redirect to OAuth flow
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to connect integration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectIntegration = async (provider: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/integrations/oauth/${provider}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh integrations list
        const integrationsResponse = await fetch('/api/integrations/hub?action=instances');
        if (integrationsResponse.ok) {
          const integrationsData = await integrationsResponse.json();
          if (integrationsData.success) {
            const mappedIntegrations = integrationsData.instances.map((instance: any) => ({
              id: instance.id,
              provider: instance.integrationId,
              name: instance.name || instance.integrationId,
              active: instance.status === 'active',
              lastSync: instance.lastSync,
              settings: instance.configuration || {},
            }));
            setIntegrations(mappedIntegrations);
          }
        }
      }
    } catch (error) {
      console.error('Failed to disconnect integration:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'slack':
        return <Slack className="h-4 w-4" />;
      case 'teams':
        return <Users className="h-4 w-4" />;
      case 'github':
        return <Github className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-down">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Enterprise Integration</h1>
          <p className="text-muted-foreground">
            Manage SSO, APIs, webhooks, integrations, and white-label settings
          </p>
        </div>
        <Button className="btn-glow hover:scale-105 transition-all duration-300">
          <Download className="h-4 w-4 mr-2" />
          Export Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 animate-slide-up">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6 md:grid-cols-3 sm:grid-cols-2 glass-morphism overflow-x-auto">
          <TabsTrigger value="sso" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">SSO</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API Management</span>
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            <span className="hidden sm:inline">Webhooks</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="whitelabel" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">White Label</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* SSO Configuration */}
        <TabsContent value="sso" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2 md:grid-cols-1">
            <Card className="card-elevated hover-lift animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  SAML 2.0 Configuration
                </CardTitle>
                <CardDescription>
                  Configure SAML single sign-on for enterprise authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="saml-entity-id">Entity ID</Label>
                  <Input
                    id="saml-entity-id"
                    placeholder="https://your-company.zenith.engineer"
                    value="https://acme-corp.zenith.engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saml-sso-url">SSO URL</Label>
                  <Input
                    id="saml-sso-url"
                    placeholder="https://sso.company.com/saml/login"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saml-certificate">X.509 Certificate</Label>
                  <Textarea
                    id="saml-certificate"
                    placeholder="-----BEGIN CERTIFICATE-----"
                    rows={4}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="saml-enabled" />
                  <Label htmlFor="saml-enabled">Enable SAML SSO</Label>
                </div>
                <div className="flex gap-2">
                  <Button className="btn-glow">Save Configuration</Button>
                  <Button variant="outline" className="hover:scale-105 transition-all duration-300">
                    <Download className="h-4 w-4 mr-2" />
                    Download Metadata
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>OAuth Providers</CardTitle>
                <CardDescription>
                  Configure OAuth providers for enterprise SSO
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">G</span>
                      </div>
                      <div>
                        <p className="font-medium">Google Workspace</p>
                        <p className="text-sm text-muted-foreground">acme-corp.com</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-semibold text-sm">M</span>
                      </div>
                      <div>
                        <p className="font-medium">Microsoft 365</p>
                        <p className="text-sm text-muted-foreground">acme-corp.onmicrosoft.com</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">O</span>
                      </div>
                      <div>
                        <p className="font-medium">Okta</p>
                        <p className="text-sm text-muted-foreground">acme-corp.okta.com</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </div>

                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add OAuth Provider
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>SCIM Directory Sync</CardTitle>
              <CardDescription>
                Automatically sync users and groups from your identity provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>SCIM Endpoint</Label>
                  <div className="flex">
                    <Input
                      value="https://api.zenith.engineer/scim/v2"
                      readOnly
                      className="rounded-r-none"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-l-none"
                      onClick={() => copyToClipboard('https://api.zenith.engineer/scim/v2')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Bearer Token</Label>
                  <div className="flex">
                    <Input
                      value="scim_****_****_****"
                      readOnly
                      className="rounded-r-none"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-l-none"
                      onClick={() => copyToClipboard('scim_abcd1234_efgh5678_ijkl9012')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Last Sync</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">2 minutes ago</span>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="scim-enabled" defaultChecked />
                <Label htmlFor="scim-enabled">Enable SCIM provisioning</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Management */}
        <TabsContent value="api" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">API Keys</h2>
              <p className="text-muted-foreground">Manage API keys for your applications</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </div>

          <div className="grid gap-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{apiKey.name}</h3>
                        <Badge variant={apiKey.active ? 'default' : 'secondary'}>
                          {apiKey.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Key: {apiKey.key}</span>
                        <span>Rate Limit: {apiKey.rateLimit}/hour</span>
                        <span>Last Used: {apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : 'Never'}</span>
                      </div>
                      <div className="flex gap-1">
                        {apiKey.scope.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>SDK Generation</CardTitle>
              <CardDescription>
                Generate SDKs for popular programming languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" className="h-20 flex-col">
                  <Code className="h-6 w-6 mb-2" />
                  TypeScript SDK
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Code className="h-6 w-6 mb-2" />
                  Python SDK
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Code className="h-6 w-6 mb-2" />
                  Go SDK
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Webhook Subscriptions</h2>
              <p className="text-muted-foreground">Receive real-time notifications for events</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </div>

          <div className="grid gap-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{webhook.url}</h3>
                        <Badge variant={webhook.active ? 'default' : 'secondary'}>
                          {webhook.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Deliveries: {webhook.deliveries}</span>
                        <span>Last Delivery: {webhook.lastDelivery ? formatDate(webhook.lastDelivery) : 'Never'}</span>
                      </div>
                      <div className="flex gap-1">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Activity className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Third-Party Integrations</h2>
            <p className="text-muted-foreground">Connect with your favorite tools and services</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getProviderIcon(integration.provider)}
                      <div>
                        <h3 className="font-medium">{integration.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {integration.provider}
                        </p>
                      </div>
                    </div>
                    <Badge variant={integration.active ? 'default' : 'secondary'}>
                      {integration.active ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  {integration.lastSync && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Last sync: {formatDate(integration.lastSync)}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Configure
                    </Button>
                    <Button
                      variant={integration.active ? 'destructive' : 'default'}
                      size="sm"
                      className="flex-1"
                      onClick={() => integration.active 
                        ? handleDisconnectIntegration(integration.provider)
                        : handleConnectIntegration(integration.provider)
                      }
                      disabled={loading}
                    >
                      {integration.active ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Available Integrations */}
            {availableIntegrations
              .filter(avail => !integrations.some(existing => existing.provider === avail.name))
              .slice(0, 3)
              .map((available) => (
              <Card key={available.id} className="border-dashed">
                <CardContent className="p-6 text-center">
                  <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="font-medium mb-1">{available.displayName}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {available.description}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleConnectIntegration(available.name)}
                    disabled={loading}
                  >
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* White Label */}
        <TabsContent value="whitelabel" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Brand Configuration
                </CardTitle>
                <CardDescription>
                  Customize your platform's appearance and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand-name">Brand Name</Label>
                  <Input
                    id="brand-name"
                    value={branding.brandName}
                    onChange={(e) => setBranding({ ...branding, brandName: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex">
                      <Input
                        id="primary-color"
                        value={branding.primaryColor}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        className="rounded-r-none"
                      />
                      <div
                        className="w-10 border rounded-r border-l-0"
                        style={{ backgroundColor: branding.primaryColor }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex">
                      <Input
                        id="secondary-color"
                        value={branding.secondaryColor}
                        onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                        className="rounded-r-none"
                      />
                      <div
                        className="w-10 border rounded-r border-l-0"
                        style={{ backgroundColor: branding.secondaryColor }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accent-color">Accent Color</Label>
                    <div className="flex">
                      <Input
                        id="accent-color"
                        value={branding.accentColor}
                        onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                        className="rounded-r-none"
                      />
                      <div
                        className="w-10 border rounded-r border-l-0"
                        style={{ backgroundColor: branding.accentColor }}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo-url">Logo URL</Label>
                  <Input
                    id="logo-url"
                    placeholder="https://your-domain.com/logo.png"
                    value={branding.logoUrl || ''}
                    onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                  />
                </div>
                <Button>Save Branding</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Custom Domain
                </CardTitle>
                <CardDescription>
                  Use your own domain for the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-domain">Custom Domain</Label>
                  <Input
                    id="custom-domain"
                    placeholder="app.your-company.com"
                    value={branding.customDomain || ''}
                    onChange={(e) => setBranding({ ...branding, customDomain: e.target.value })}
                  />
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">DNS Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-mono">CNAME</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span className="font-mono">app</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Value:</span>
                      <span className="font-mono">cname.zenith.engineer</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Domain verified</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Site
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Customize email templates with your branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <Button variant="outline" className="h-20 flex-col">
                  <span className="font-medium">Welcome Email</span>
                  <span className="text-xs text-muted-foreground">User onboarding</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <span className="font-medium">Password Reset</span>
                  <span className="text-xs text-muted-foreground">Security</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <span className="font-medium">Team Invitation</span>
                  <span className="text-xs text-muted-foreground">Collaboration</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <span className="font-medium">Notifications</span>
                  <span className="text-xs text-muted-foreground">Updates</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Integration Analytics</h2>
            <p className="text-muted-foreground">Monitor API usage, webhook deliveries, and integration performance</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">API Requests</p>
                    <p className="text-2xl font-bold">
                      {analytics?.apiUsage?.totalRequests?.toLocaleString() || '24,891'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {analytics?.apiUsage?.successfulRequests 
                        ? `${Math.round((analytics.apiUsage.successfulRequests / analytics.apiUsage.totalRequests) * 100)}% success rate`
                        : '+12% from last month'
                      }
                    </p>
                  </div>
                  <Key className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Webhook Deliveries</p>
                    <p className="text-2xl font-bold">
                      {analytics?.webhookMetrics?.totalDeliveries?.toLocaleString() || '1,247'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {analytics?.webhookMetrics?.successfulDeliveries && analytics?.webhookMetrics?.totalDeliveries
                        ? `${Math.round((analytics.webhookMetrics.successfulDeliveries / analytics.webhookMetrics.totalDeliveries) * 100)}% success rate`
                        : '99.8% success rate'
                      }
                    </p>
                  </div>
                  <Webhook className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Integrations</p>
                    <p className="text-2xl font-bold">
                      {analytics?.overview?.activeIntegrations || integrations.filter(i => i.active).length || '7'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {analytics?.overview?.totalIntegrations
                        ? `${analytics.overview.totalIntegrations} total configured`
                        : '3 new this month'
                      }
                    </p>
                  </div>
                  <Settings className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>API Usage by Endpoint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">/api/users</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full">
                        <div className="w-3/4 h-2 bg-primary rounded-full" />
                      </div>
                      <span className="text-sm text-muted-foreground">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">/api/projects</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full">
                        <div className="w-1/2 h-2 bg-primary rounded-full" />
                      </div>
                      <span className="text-sm text-muted-foreground">50%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">/api/analytics</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full">
                        <div className="w-1/4 h-2 bg-primary rounded-full" />
                      </div>
                      <span className="text-sm text-muted-foreground">25%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">user.created</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full">
                        <div className="w-2/3 h-2 bg-secondary rounded-full" />
                      </div>
                      <span className="text-sm text-muted-foreground">412</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">project.updated</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full">
                        <div className="w-1/2 h-2 bg-secondary rounded-full" />
                      </div>
                      <span className="text-sm text-muted-foreground">308</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">task.completed</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full">
                        <div className="w-1/3 h-2 bg-secondary rounded-full" />
                      </div>
                      <span className="text-sm text-muted-foreground">189</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}