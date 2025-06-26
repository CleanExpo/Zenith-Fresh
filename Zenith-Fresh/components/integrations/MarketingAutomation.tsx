/**
 * Marketing Automation Integrations Component
 * Manages Mailchimp, Constant Contact, and other marketing automation platforms
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Mail,
  Send,
  Users,
  TrendingUp,
  BarChart3,
  Target,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Settings,
  Link,
  Unlink,
  Download,
  Upload,
  Eye,
  MousePointer,
  UserPlus,
  UserMinus,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Zap,
  Filter,
  Edit,
  Trash2,
  Play,
  Pause,
  Copy
} from 'lucide-react';
import { MarketingCampaign, MarketingContact } from '@/types/integrations';

interface MarketingProvider {
  id: string;
  name: string;
  logo: string;
  description: string;
  features: string[];
  supported: boolean;
  authType: 'oauth2' | 'api_key';
  color: string;
  category: 'email' | 'automation' | 'social' | 'ads';
}

const marketingProviders: MarketingProvider[] = [
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    logo: '🐵',
    description: 'All-in-one marketing automation platform',
    features: ['Email Campaigns', 'Automation', 'Audience Management', 'Analytics'],
    supported: true,
    authType: 'api_key',
    color: 'bg-yellow-500',
    category: 'email'
  },
  {
    id: 'constant-contact',
    name: 'Constant Contact',
    logo: '📧',
    description: 'Email marketing and automation',
    features: ['Email Marketing', 'Event Marketing', 'Social Media', 'Surveys'],
    supported: true,
    authType: 'oauth2',
    color: 'bg-blue-500',
    category: 'email'
  },
  {
    id: 'campaign-monitor',
    name: 'Campaign Monitor',
    logo: '📊',
    description: 'Beautiful email marketing',
    features: ['Email Design', 'Automation', 'Personalization', 'Analytics'],
    supported: true,
    authType: 'api_key',
    color: 'bg-green-500',
    category: 'email'
  },
  {
    id: 'hubspot-marketing',
    name: 'HubSpot Marketing',
    logo: '🧡',
    description: 'Inbound marketing automation',
    features: ['Email Marketing', 'Lead Nurturing', 'Social Media', 'SEO'],
    supported: true,
    authType: 'oauth2',
    color: 'bg-orange-500',
    category: 'automation'
  },
  {
    id: 'marketo',
    name: 'Marketo',
    logo: '🎯',
    description: 'Marketing automation and engagement',
    features: ['Lead Management', 'Email Marketing', 'Analytics', 'Personalization'],
    supported: false,
    authType: 'oauth2',
    color: 'bg-purple-500',
    category: 'automation'
  },
  {
    id: 'pardot',
    name: 'Pardot',
    logo: '☁️',
    description: 'B2B marketing automation by Salesforce',
    features: ['Lead Generation', 'Email Marketing', 'Lead Scoring', 'ROI Reporting'],
    supported: false,
    authType: 'oauth2',
    color: 'bg-indigo-500',
    category: 'automation'
  }
];

// Mock data
const mockCampaigns: MarketingCampaign[] = [
  {
    id: '1',
    name: 'Summer Product Launch',
    type: 'email',
    status: 'active',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-08-31'),
    budget: 15000,
    metrics: {
      impressions: 125000,
      clicks: 8500,
      conversions: 425,
      cost: 8750,
      ctr: 6.8,
      cpc: 1.03,
      cpa: 20.59
    }
  },
  {
    id: '2',
    name: 'Customer Retention Email Series',
    type: 'email',
    status: 'completed',
    startDate: new Date('2024-05-15'),
    endDate: new Date('2024-06-15'),
    budget: 5000,
    metrics: {
      impressions: 45000,
      clicks: 3200,
      conversions: 180,
      cost: 3400,
      ctr: 7.1,
      cpc: 1.06,
      cpa: 18.89
    }
  }
];

const mockContacts: MarketingContact[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    status: 'subscribed',
    tags: ['customer', 'high-value'],
    customFields: { firstName: 'John', lastName: 'Doe', company: 'Acme Corp' },
    segments: ['Enterprise', 'Technology'],
    engagement: {
      emailsOpened: 15,
      emailsClicked: 8,
      lastActivity: new Date('2024-06-24')
    }
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    status: 'subscribed',
    tags: ['prospect', 'nurture'],
    customFields: { firstName: 'Jane', lastName: 'Smith', company: 'Tech Solutions' },
    segments: ['Mid-Market', 'Software'],
    engagement: {
      emailsOpened: 12,
      emailsClicked: 5,
      lastActivity: new Date('2024-06-23')
    }
  }
];

export default function MarketingAutomation() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [activeConnections, setActiveConnections] = useState<string[]>(['mailchimp', 'hubspot-marketing']);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [configForm, setConfigForm] = useState({
    provider: '',
    apiKey: '',
    subdomain: '',
    syncFrequency: 'hourly',
    enableAutoSync: true,
    trackingEnabled: true
  });

  // Handle connection
  const handleConnect = useCallback(async (providerId: string) => {
    const provider = marketingProviders.find(p => p.id === providerId);
    if (provider?.authType === 'oauth2') {
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
        enableAutoSync: true,
        trackingEnabled: true
      });
    }
  }, [configForm]);

  const filteredProviders = selectedCategory === 'all' 
    ? marketingProviders 
    : marketingProviders.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Marketing Automation</h2>
          <p className="text-gray-600">Connect and manage your marketing automation platforms</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Integration
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2">
        <Button 
          variant={selectedCategory === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All
        </Button>
        <Button 
          variant={selectedCategory === 'email' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedCategory('email')}
        >
          Email Marketing
        </Button>
        <Button 
          variant={selectedCategory === 'automation' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedCategory('automation')}
        >
          Automation
        </Button>
        <Button 
          variant={selectedCategory === 'social' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedCategory('social')}
        >
          Social Media
        </Button>
        <Button 
          variant={selectedCategory === 'ads' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedCategory('ads')}
        >
          Advertising
        </Button>
      </div>

      {/* Marketing Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders.map((provider) => {
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

      {/* Connected Marketing Platforms Overview */}
      {activeConnections.length > 0 && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Subscribers</p>
                      <p className="text-2xl font-bold">28,456</p>
                      <p className="text-xs text-green-600 mt-1">+8% this month</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Open Rate</p>
                      <p className="text-2xl font-bold">24.5%</p>
                      <p className="text-xs text-green-600 mt-1">+2.3% vs industry</p>
                    </div>
                    <Eye className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Click Rate</p>
                      <p className="text-2xl font-bold">6.8%</p>
                      <p className="text-xs text-green-600 mt-1">Above average</p>
                    </div>
                    <MousePointer className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                      <p className="text-2xl font-bold">3.2%</p>
                      <p className="text-xs text-green-600 mt-1">+0.8% this month</p>
                    </div>
                    <Target className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Campaign Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCampaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{campaign.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <Badge variant="outline">{campaign.type}</Badge>
                            <Badge className={
                              campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                              campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {campaign.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Budget</p>
                          <p className="font-semibold">${campaign.budget?.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Impressions</p>
                          <p className="font-semibold">{campaign.metrics.impressions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Clicks</p>
                          <p className="font-semibold">{campaign.metrics.clicks.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">CTR</p>
                          <p className="font-semibold">{campaign.metrics.ctr}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Conversions</p>
                          <p className="font-semibold">{campaign.metrics.conversions}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Active Campaigns</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New Campaign
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCampaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Mail className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{campaign.name}</h4>
                            <p className="text-sm text-gray-600">
                              {campaign.startDate?.toLocaleDateString()} - {campaign.endDate?.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {campaign.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Budget</p>
                          <p className="font-semibold">${campaign.budget?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Spent</p>
                          <p className="font-semibold">${campaign.metrics.cost.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Impressions</p>
                          <p className="font-semibold">{campaign.metrics.impressions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Clicks</p>
                          <p className="font-semibold">{campaign.metrics.clicks.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">CTR</p>
                          <p className="font-semibold">{campaign.metrics.ctr}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Conversions</p>
                          <p className="font-semibold">{campaign.metrics.conversions}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Marketing Contacts</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
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
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Mail className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{contact.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {contact.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Segments: {contact.segments.join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="font-medium">{contact.engagement.emailsOpened} opens</p>
                          <p className="text-gray-600">{contact.engagement.emailsClicked} clicks</p>
                        </div>
                        <Badge className={
                          contact.status === 'subscribed' ? 'bg-green-100 text-green-800' :
                          contact.status === 'unsubscribed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {contact.status}
                        </Badge>
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

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Open Rate</span>
                      <span className="font-semibold">24.5%</span>
                    </div>
                    <Progress value={24.5} className="w-full" />
                    
                    <div className="flex justify-between items-center">
                      <span>Click Rate</span>
                      <span className="font-semibold">6.8%</span>
                    </div>
                    <Progress value={6.8} className="w-full" />
                    
                    <div className="flex justify-between items-center">
                      <span>Bounce Rate</span>
                      <span className="font-semibold">2.1%</span>
                    </div>
                    <Progress value={2.1} className="w-full" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscriber Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>New Subscribers (30d)</span>
                      <span className="font-semibold text-green-600">+2,456</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unsubscribes (30d)</span>
                      <span className="font-semibold text-red-600">-189</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Growth</span>
                      <span className="font-semibold text-green-600">+2,267</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Growth Rate</span>
                      <span className="font-semibold">8.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Device & Client Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <Smartphone className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm font-medium">Mobile</p>
                    <p className="text-lg font-bold">68%</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <Monitor className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm font-medium">Desktop</p>
                    <p className="text-lg font-bold">32%</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <Mail className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <p className="text-sm font-medium">Gmail</p>
                    <p className="text-lg font-bold">45%</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <Globe className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <p className="text-sm font-medium">Outlook</p>
                    <p className="text-lg font-bold">23%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Automation Workflows</CardTitle>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Workflow
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-blue-500" />
                        <div>
                          <h4 className="font-semibold">Welcome Series</h4>
                          <p className="text-sm text-gray-600">New subscriber onboarding sequence</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Enrolled</p>
                        <p className="font-semibold">1,234</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Completed</p>
                        <p className="font-semibold">987</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Open Rate</p>
                        <p className="font-semibold">32.5%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Click Rate</p>
                        <p className="font-semibold">8.2%</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <div>
                          <h4 className="font-semibold">Abandoned Cart Recovery</h4>
                          <p className="text-sm text-gray-600">Re-engage customers who left items in cart</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Triggered</p>
                        <p className="font-semibold">456</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Recovered</p>
                        <p className="font-semibold">123</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Recovery Rate</p>
                        <p className="font-semibold">27%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Revenue</p>
                        <p className="font-semibold">$12,456</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Marketing Integration Settings</CardTitle>
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
                      <Label>Auto-sync Contacts</Label>
                      <p className="text-sm text-gray-600">Automatically sync new contacts to marketing platforms</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Track Email Engagement</Label>
                      <p className="text-sm text-gray-600">Monitor opens, clicks, and other engagement metrics</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>GDPR Compliance</Label>
                      <p className="text-sm text-gray-600">Ensure compliance with GDPR and privacy regulations</p>
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
      )}

      {/* Add Integration Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Marketing Integration</DialogTitle>
            <DialogDescription>
              Enter your marketing platform credentials to establish connection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Marketing Platform</Label>
              <Select 
                value={configForm.provider} 
                onValueChange={(value) => setConfigForm(prev => ({ ...prev, provider: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {marketingProviders.filter(p => p.supported && p.authType === 'api_key').map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {configForm.provider === 'mailchimp' && (
              <div>
                <Label>API Key</Label>
                <Input 
                  type="password" 
                  placeholder="Your Mailchimp API key"
                  value={configForm.apiKey}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="mt-2"
                />
              </div>
            )}

            {configForm.provider === 'campaign-monitor' && (
              <div>
                <Label>API Key</Label>
                <Input 
                  type="password" 
                  placeholder="Your Campaign Monitor API key"
                  value={configForm.apiKey}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="mt-2"
                />
              </div>
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
              <Label>Enable Auto-sync</Label>
              <Switch 
                checked={configForm.enableAutoSync}
                onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, enableAutoSync: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig}>
              Connect Platform
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}