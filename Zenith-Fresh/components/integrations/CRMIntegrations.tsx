/**
 * CRM Integrations Component
 * Manages Salesforce, HubSpot, Pipedrive, and other CRM integrations
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Building2,
  Users,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  Globe,
  Shield,
  RefreshCw,
  Settings,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  Link,
  Unlink,
  Activity,
  TrendingUp,
  UserCheck,
  Building,
  Target,
  Clock
} from 'lucide-react';
import { BaseIntegration, CRMContact, CRMDeal, CRMCompany } from '@/types/integrations';

interface CRMProvider {
  id: string;
  name: string;
  logo: string;
  description: string;
  features: string[];
  supported: boolean;
  authType: 'oauth2' | 'api_key';
  color: string;
}

const crmProviders: CRMProvider[] = [
  {
    id: 'salesforce',
    name: 'Salesforce',
    logo: '☁️',
    description: 'The world\'s #1 CRM platform',
    features: ['Contacts', 'Leads', 'Opportunities', 'Accounts', 'Custom Objects'],
    supported: true,
    authType: 'oauth2',
    color: 'bg-blue-500'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    logo: '🧡',
    description: 'Inbound marketing, sales, and service software',
    features: ['Contacts', 'Companies', 'Deals', 'Tickets', 'Marketing'],
    supported: true,
    authType: 'oauth2',
    color: 'bg-orange-500'
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    logo: '🎯',
    description: 'Sales CRM and pipeline management',
    features: ['Contacts', 'Deals', 'Activities', 'Products', 'Organizations'],
    supported: true,
    authType: 'api_key',
    color: 'bg-green-500'
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    logo: '📊',
    description: 'Complete customer relationship management',
    features: ['Leads', 'Accounts', 'Contacts', 'Potentials', 'Activities'],
    supported: false,
    authType: 'oauth2',
    color: 'bg-red-500'
  },
  {
    id: 'dynamics',
    name: 'Microsoft Dynamics 365',
    logo: '🔷',
    description: 'Intelligent business applications',
    features: ['Accounts', 'Contacts', 'Leads', 'Opportunities', 'Cases'],
    supported: false,
    authType: 'oauth2',
    color: 'bg-indigo-500'
  }
];

// Mock data
const mockContacts: CRMContact[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    company: 'Acme Corp',
    title: 'CEO',
    phone: '+1 555-0123',
    customFields: { source: 'Website', industry: 'Technology' },
    tags: ['vip', 'decision-maker'],
    lastActivity: new Date('2024-06-24'),
    leadScore: 95,
    lifecycle: 'customer'
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    company: 'Tech Solutions',
    title: 'CTO',
    phone: '+1 555-0124',
    customFields: { source: 'Referral', industry: 'Software' },
    tags: ['technical', 'influencer'],
    lastActivity: new Date('2024-06-25'),
    leadScore: 88,
    lifecycle: 'opportunity'
  }
];

const mockDeals: CRMDeal[] = [
  {
    id: '1',
    name: 'Enterprise License - Acme Corp',
    value: 150000,
    currency: 'USD',
    stage: 'Negotiation',
    probability: 75,
    contactId: '1',
    companyId: '1',
    expectedCloseDate: new Date('2024-07-15'),
    customFields: { competitor: 'None', budget_approved: true }
  },
  {
    id: '2',
    name: 'Professional Services - Tech Solutions',
    value: 50000,
    currency: 'USD',
    stage: 'Proposal',
    probability: 60,
    contactId: '2',
    companyId: '2',
    expectedCloseDate: new Date('2024-08-01'),
    customFields: { services_type: 'Implementation', duration: '3 months' }
  }
];

export default function CRMIntegrations() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [activeConnections, setActiveConnections] = useState<string[]>(['salesforce', 'hubspot']);
  const [configForm, setConfigForm] = useState({
    provider: '',
    apiKey: '',
    subdomain: '',
    syncFrequency: 'hourly',
    enableBidirectional: true,
    fieldMapping: 'default'
  });

  // Handle CRM connection
  const handleConnect = useCallback(async (providerId: string) => {
    if (crmProviders.find(p => p.id === providerId)?.authType === 'oauth2') {
      // Simulate OAuth flow
      window.open(`/api/integrations/oauth/${providerId}`, '_blank', 'width=600,height=700');
    } else {
      setSelectedProvider(providerId);
      setShowAddDialog(true);
    }
  }, []);

  // Handle disconnection
  const handleDisconnect = useCallback(async (providerId: string) => {
    if (confirm(`Are you sure you want to disconnect ${providerId}?`)) {
      setActiveConnections(prev => prev.filter(id => id !== providerId));
    }
  }, []);

  // Handle sync
  const handleSync = useCallback(async (providerId: string) => {
    setSyncInProgress(true);
    // Simulate sync process
    setTimeout(() => {
      setSyncInProgress(false);
    }, 3000);
  }, []);

  // Save configuration
  const handleSaveConfig = useCallback(() => {
    if (configForm.provider) {
      setActiveConnections(prev => [...prev, configForm.provider]);
      setShowAddDialog(false);
      setConfigForm({
        provider: '',
        apiKey: '',
        subdomain: '',
        syncFrequency: 'hourly',
        enableBidirectional: true,
        fieldMapping: 'default'
      });
    }
  }, [configForm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">CRM Integrations</h2>
          <p className="text-gray-600">Connect and manage your customer relationship management systems</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add CRM
        </Button>
      </div>

      {/* CRM Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {crmProviders.map((provider) => {
          const isConnected = activeConnections.includes(provider.id);
          
          return (
            <Card key={provider.id} className={`relative ${!provider.supported ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${provider.color} flex items-center justify-center text-2xl`}>
                      {provider.logo}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                  </div>
                  {isConnected && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {provider.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  
                  {provider.supported ? (
                    <div className="flex gap-2">
                      {!isConnected ? (
                        <Button 
                          onClick={() => handleConnect(provider.id)}
                          className="flex-1"
                        >
                          <Link className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={() => handleSync(provider.id)}
                            disabled={syncInProgress}
                            className="flex-1"
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${syncInProgress ? 'animate-spin' : ''}`} />
                            Sync
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleDisconnect(provider.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ) : (
                    <Button variant="outline" disabled className="w-full">
                      Coming Soon
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connected CRMs Overview */}
      {activeConnections.length > 0 && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="sync">Sync History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                      <p className="text-2xl font-bold">12,456</p>
                      <p className="text-xs text-green-600 mt-1">+12% this month</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Deals</p>
                      <p className="text-2xl font-bold">89</p>
                      <p className="text-xs text-green-600 mt-1">$2.4M pipeline</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Win Rate</p>
                      <p className="text-2xl font-bold">68%</p>
                      <p className="text-xs text-green-600 mt-1">+5% vs last quarter</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Deal Size</p>
                      <p className="text-2xl font-bold">$45K</p>
                      <p className="text-xs text-gray-600 mt-1">30 day average</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent CRM Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">New contact added: Sarah Johnson</p>
                      <p className="text-sm text-gray-600">Salesforce • 2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium">Deal updated: Enterprise License - Won</p>
                      <p className="text-sm text-gray-600">HubSpot • 15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <UserCheck className="h-5 w-5 text-purple-500" />
                    <div className="flex-1">
                      <p className="font-medium">Lead converted to opportunity</p>
                      <p className="text-sm text-gray-600">Salesforce • 1 hour ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Synced Contacts</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                          <p className="text-sm text-gray-600">{contact.title} at {contact.company}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">Lead Score: {contact.leadScore}</p>
                          <Badge variant="outline" className="mt-1">{contact.lifecycle}</Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deal Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockDeals.map((deal) => (
                    <div key={deal.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{deal.name}</h4>
                          <p className="text-sm text-gray-600">Expected close: {deal.expectedCloseDate?.toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">${deal.value.toLocaleString()}</p>
                          <Badge className="mt-1">{deal.stage}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Probability: {deal.probability}%</span>
                          <span>•</span>
                          <span>Weighted: ${(deal.value * deal.probability / 100).toLocaleString()}</span>
                        </div>
                        <Progress value={deal.probability} className="w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sync History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Salesforce sync completed</p>
                        <p className="text-sm text-gray-600">150 contacts, 45 deals synced</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">HubSpot sync completed</p>
                        <p className="text-sm text-gray-600">89 contacts, 23 companies synced</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">4 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium">Pipedrive sync failed</p>
                        <p className="text-sm text-gray-600">API rate limit exceeded</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">6 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>CRM Integration Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Default Sync Frequency</Label>
                    <Select defaultValue="hourly">
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Bidirectional Sync</Label>
                      <p className="text-sm text-gray-600">Sync changes from CRM back to Zenith</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Duplicate Detection</Label>
                      <p className="text-sm text-gray-600">Automatically merge duplicate records</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Field Mapping</Label>
                      <p className="text-sm text-gray-600">Customize how fields are mapped between systems</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button className="w-full">Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Add CRM Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure CRM Integration</DialogTitle>
            <DialogDescription>
              Enter your CRM credentials to establish connection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>CRM Provider</Label>
              <Select 
                value={configForm.provider} 
                onValueChange={(value) => setConfigForm(prev => ({ ...prev, provider: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a CRM" />
                </SelectTrigger>
                <SelectContent>
                  {crmProviders.filter(p => p.supported && p.authType === 'api_key').map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {configForm.provider === 'pipedrive' && (
              <>
                <div>
                  <Label>API Token</Label>
                  <Input 
                    type="password" 
                    placeholder="Your Pipedrive API token"
                    value={configForm.apiKey}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Company Domain</Label>
                  <Input 
                    placeholder="yourcompany.pipedrive.com"
                    value={configForm.subdomain}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, subdomain: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              </>
            )}

            <div>
              <Label>Sync Frequency</Label>
              <Select 
                value={configForm.syncFrequency} 
                onValueChange={(value) => setConfigForm(prev => ({ ...prev, syncFrequency: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Enable Bidirectional Sync</Label>
              <Switch 
                checked={configForm.enableBidirectional}
                onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, enableBidirectional: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig}>
              Connect CRM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}