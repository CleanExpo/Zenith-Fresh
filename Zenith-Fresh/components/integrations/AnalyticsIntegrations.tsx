/**
 * Analytics Integrations Component
 * Manages Google Analytics, Adobe Analytics, and other analytics platforms
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
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Settings,
  Link,
  Unlink,
  Download,
  Upload,
  Calendar,
  Target,
  PieChart,
  LineChart,
  Activity,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Database,
  Layers,
  Map,
  ShoppingCart,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { AnalyticsMetric, AnalyticsReport } from '@/types/integrations';

interface AnalyticsProvider {
  id: string;
  name: string;
  logo: string;
  description: string;
  features: string[];
  supported: boolean;
  authType: 'oauth2' | 'api_key' | 'service_account';
  color: string;
  category: 'web' | 'mobile' | 'ecommerce' | 'social' | 'business';
}

const analyticsProviders: AnalyticsProvider[] = [
  {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    logo: '📊',
    description: 'Web and app analytics platform',
    features: ['Website Analytics', 'App Analytics', 'E-commerce', 'Custom Events'],
    supported: true,
    authType: 'oauth2',
    color: 'bg-blue-500',
    category: 'web'
  },
  {
    id: 'google-analytics-universal',
    name: 'Universal Analytics',
    logo: '📈',
    description: 'Legacy Google Analytics (sunset July 2024)',
    features: ['Website Analytics', 'Goals', 'Segments', 'Custom Dimensions'],
    supported: false,
    authType: 'oauth2',
    color: 'bg-gray-500',
    category: 'web'
  },
  {
    id: 'adobe-analytics',
    name: 'Adobe Analytics',
    logo: '🔶',
    description: 'Enterprise analytics and customer intelligence',
    features: ['Advanced Segmentation', 'Attribution', 'Predictive Analytics', 'Real-time'],
    supported: true,
    authType: 'api_key',
    color: 'bg-red-500',
    category: 'web'
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    logo: '🎯',
    description: 'Product analytics for user behavior',
    features: ['Event Tracking', 'Funnel Analysis', 'Cohort Analysis', 'A/B Testing'],
    supported: true,
    authType: 'api_key',
    color: 'bg-purple-500',
    category: 'mobile'
  },
  {
    id: 'amplitude',
    name: 'Amplitude',
    logo: '📱',
    description: 'Digital optimization platform',
    features: ['User Analytics', 'Behavioral Cohorts', 'Path Analysis', 'Retention'],
    supported: true,
    authType: 'api_key',
    color: 'bg-indigo-500',
    category: 'mobile'
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    logo: '🔥',
    description: 'Behavior analytics and user feedback',
    features: ['Heatmaps', 'Session Recordings', 'Surveys', 'Feedback'],
    supported: false,
    authType: 'api_key',
    color: 'bg-orange-500',
    category: 'web'
  }
];

// Mock analytics data
const mockMetrics: AnalyticsMetric[] = [
  {
    name: 'Sessions',
    value: 15678,
    dimension: 'Today',
    timestamp: new Date(),
    metadata: { change: '+12%', comparison: 'vs yesterday' }
  },
  {
    name: 'Users',
    value: 12456,
    dimension: 'Today',
    timestamp: new Date(),
    metadata: { change: '+8%', comparison: 'vs yesterday' }
  },
  {
    name: 'Page Views',
    value: 45678,
    dimension: 'Today',
    timestamp: new Date(),
    metadata: { change: '+15%', comparison: 'vs yesterday' }
  },
  {
    name: 'Bounce Rate',
    value: 32.5,
    dimension: 'Today',
    timestamp: new Date(),
    metadata: { change: '-2.3%', comparison: 'vs yesterday' }
  }
];

const mockReports: AnalyticsReport[] = [
  {
    id: '1',
    name: 'Website Performance Dashboard',
    metrics: mockMetrics,
    dimensions: ['Date', 'Source', 'Medium'],
    filters: { source: 'organic' },
    dateRange: {
      start: new Date('2024-06-01'),
      end: new Date('2024-06-30')
    },
    generatedAt: new Date()
  }
];

export default function AnalyticsIntegrations() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [activeConnections, setActiveConnections] = useState<string[]>(['google-analytics', 'mixpanel']);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [configForm, setConfigForm] = useState({
    provider: '',
    accountId: '',
    propertyId: '',
    viewId: '',
    apiKey: '',
    syncFrequency: 'daily',
    enableRealtime: false,
    customEvents: true
  });

  // Handle connection
  const handleConnect = useCallback(async (providerId: string) => {
    const provider = analyticsProviders.find(p => p.id === providerId);
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
        accountId: '',
        propertyId: '',
        viewId: '',
        apiKey: '',
        syncFrequency: 'daily',
        enableRealtime: false,
        customEvents: true
      });
    }
  }, [configForm]);

  const filteredProviders = selectedCategory === 'all' 
    ? analyticsProviders 
    : analyticsProviders.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Integrations</h2>
          <p className="text-gray-600">Connect and manage your analytics and tracking platforms</p>
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
          variant={selectedCategory === 'web' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedCategory('web')}
        >
          Web Analytics
        </Button>
        <Button 
          variant={selectedCategory === 'mobile' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedCategory('mobile')}
        >
          Mobile Analytics
        </Button>
        <Button 
          variant={selectedCategory === 'ecommerce' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedCategory('ecommerce')}
        >
          E-commerce
        </Button>
        <Button 
          variant={selectedCategory === 'business' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedCategory('business')}
        >
          Business Intelligence
        </Button>
      </div>

      {/* Analytics Providers Grid */}
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
                      {provider.id === 'google-analytics-universal' ? 'Deprecated' : 'Coming Soon'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connected Analytics Overview */}
      {activeConnections.length > 0 && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="audiences">Audiences</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                      <p className="text-2xl font-bold">156,789</p>
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                        <p className="text-xs text-green-600">+12% vs last month</p>
                      </div>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Page Views</p>
                      <p className="text-2xl font-bold">456,789</p>
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                        <p className="text-xs text-green-600">+8% vs last month</p>
                      </div>
                    </div>
                    <Eye className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
                      <p className="text-2xl font-bold">32.5%</p>
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowDownRight className="h-3 w-3 text-green-600" />
                        <p className="text-xs text-green-600">-2.3% vs last month</p>
                      </div>
                    </div>
                    <TrendingDown className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                      <p className="text-2xl font-bold">3.8%</p>
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                        <p className="text-xs text-green-600">+0.5% vs last month</p>
                      </div>
                    </div>
                    <Target className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Traffic Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-blue-500" />
                        <span>Organic Search</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">45.2%</span>
                        <Progress value={45.2} className="w-20 mt-1" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>Direct</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">28.7%</span>
                        <Progress value={28.7} className="w-20 mt-1" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4 text-purple-500" />
                        <span>Referral</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">15.8%</span>
                        <Progress value={15.8} className="w-20 mt-1" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        <span>Social</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">10.3%</span>
                        <Progress value={10.3} className="w-20 mt-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Device Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-gray-50 rounded">
                      <Monitor className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-sm font-medium">Desktop</p>
                      <p className="text-lg font-bold">52%</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                      <Smartphone className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="text-sm font-medium">Mobile</p>
                      <p className="text-lg font-bold">42%</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded">
                      <Monitor className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                      <p className="text-sm font-medium">Tablet</p>
                      <p className="text-lg font-bold">6%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Real-time Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">1,234</p>
                    <p className="text-sm text-gray-600">Active Users</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">89</p>
                    <p className="text-sm text-gray-600">Page Views (last 30 min)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">12</p>
                    <p className="text-sm text-gray-600">Conversions (today)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Key Metrics</CardTitle>
                  <div className="flex gap-2">
                    <Select defaultValue="30d">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="1y">Last year</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {mockMetrics.map((metric, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{metric.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {metric.dimension}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold">{metric.value.toLocaleString()}</p>
                      {metric.metadata?.change && (
                        <div className="flex items-center gap-1 mt-1">
                          {metric.metadata.change.startsWith('+') ? (
                            <ArrowUpRight className="h-3 w-3 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-red-600" />
                          )}
                          <span className={`text-xs ${
                            metric.metadata.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {metric.metadata.change} {metric.metadata.comparison}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Metrics */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Custom Metrics</CardTitle>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Metric
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">Lead Generation Rate</h4>
                        <p className="text-sm text-gray-600">Percentage of visitors who become leads</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Custom</Badge>
                    </div>
                    <p className="text-2xl font-bold">4.2%</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">+0.3% vs last month</span>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">Customer Lifetime Value</h4>
                        <p className="text-sm text-gray-600">Average revenue per customer</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Custom</Badge>
                    </div>
                    <p className="text-2xl font-bold">$1,245</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">+$89 vs last month</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Analytics Reports</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Report
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
                  {mockReports.map((report) => (
                    <div key={report.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="h-8 w-8 text-blue-500" />
                          <div>
                            <h4 className="font-semibold">{report.name}</h4>
                            <p className="text-sm text-gray-600">
                              {report.dateRange.start.toLocaleDateString()} - {report.dateRange.end.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {report.metrics.length} metrics
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Dimensions</p>
                          <p className="font-semibold">{report.dimensions.join(', ')}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Generated</p>
                          <p className="font-semibold">{report.generatedAt.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Filters</p>
                          <p className="font-semibold">{Object.keys(report.filters).length} applied</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Status</p>
                          <Badge className="bg-green-100 text-green-800">Ready</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Event Tracking</CardTitle>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Event
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <MousePointer className="h-5 w-5 text-blue-500" />
                        <div>
                          <h4 className="font-semibold">Button Clicks</h4>
                          <p className="text-sm text-gray-600">Track CTA button interactions</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total Events</p>
                        <p className="text-lg font-semibold">12,456</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Unique Users</p>
                        <p className="text-lg font-semibold">8,923</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Conversion Rate</p>
                        <p className="text-lg font-semibold">18.5%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg. Time to Action</p>
                        <p className="text-lg font-semibold">2m 34s</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <Download className="h-5 w-5 text-green-500" />
                        <div>
                          <h4 className="font-semibold">File Downloads</h4>
                          <p className="text-sm text-gray-600">Track PDF and document downloads</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total Downloads</p>
                        <p className="text-lg font-semibold">3,892</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Unique Users</p>
                        <p className="text-lg font-semibold">2,156</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Top File</p>
                        <p className="text-lg font-semibold">product-guide.pdf</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Download Rate</p>
                        <p className="text-lg font-semibold">4.2%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audiences" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Custom Audiences</CardTitle>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Audience
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">High-Value Customers</h4>
                        <p className="text-sm text-gray-600">Users with LTV &gt; $1000</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Size</p>
                        <p className="text-lg font-semibold">2,456 users</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Growth</p>
                        <p className="text-lg font-semibold text-green-600">+12%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg. Session Duration</p>
                        <p className="text-lg font-semibold">8m 45s</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Conversion Rate</p>
                        <p className="text-lg font-semibold">24.5%</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">Mobile Users</h4>
                        <p className="text-sm text-gray-600">Users primarily on mobile devices</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Size</p>
                        <p className="text-lg font-semibold">18,923 users</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Growth</p>
                        <p className="text-lg font-semibold text-green-600">+8%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Bounce Rate</p>
                        <p className="text-lg font-semibold">28.3%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Page Views/Session</p>
                        <p className="text-lg font-semibold">3.2</p>
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
                <CardTitle>Analytics Integration Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Data Collection Frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Real-time Data</Label>
                      <p className="text-sm text-gray-600">Enable real-time analytics tracking</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enhanced E-commerce</Label>
                      <p className="text-sm text-gray-600">Track purchase events and revenue</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Custom Event Tracking</Label>
                      <p className="text-sm text-gray-600">Enable custom event collection</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Data Retention</Label>
                      <p className="text-sm text-gray-600">How long to store analytics data</p>
                    </div>
                    <Select defaultValue="2y">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1y">1 Year</SelectItem>
                        <SelectItem value="2y">2 Years</SelectItem>
                        <SelectItem value="3y">3 Years</SelectItem>
                        <SelectItem value="indefinite">Indefinite</SelectItem>
                      </SelectContent>
                    </Select>
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
            <DialogTitle>Configure Analytics Integration</DialogTitle>
            <DialogDescription>
              Enter your analytics platform credentials to establish connection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Analytics Platform</Label>
              <Select 
                value={configForm.provider} 
                onValueChange={(value) => setConfigForm(prev => ({ ...prev, provider: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {analyticsProviders.filter(p => p.supported && p.authType !== 'oauth2').map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {configForm.provider === 'adobe-analytics' && (
              <>
                <div>
                  <Label>API Key</Label>
                  <Input 
                    type="password" 
                    placeholder="Your Adobe Analytics API key"
                    value={configForm.apiKey}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Report Suite ID</Label>
                  <Input 
                    placeholder="Report suite identifier"
                    value={configForm.propertyId}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, propertyId: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              </>
            )}

            {(configForm.provider === 'mixpanel' || configForm.provider === 'amplitude') && (
              <div>
                <Label>API Key</Label>
                <Input 
                  type="password" 
                  placeholder={`Your ${configForm.provider} API key`}
                  value={configForm.apiKey}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="mt-2"
                />
              </div>
            )}

            <div>
              <Label>Data Collection Frequency</Label>
              <Select 
                value={configForm.syncFrequency} 
                onValueChange={(value) => setConfigForm(prev => ({ ...prev, syncFrequency: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Enable Real-time Data</Label>
              <Switch 
                checked={configForm.enableRealtime}
                onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, enableRealtime: checked }))}
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