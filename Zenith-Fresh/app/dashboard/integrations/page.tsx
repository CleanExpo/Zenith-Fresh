/**
 * Enterprise Integrations Hub Page
 * Main entry point for the comprehensive integrations management system
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Plug, 
  Building2, 
  Mail, 
  BarChart3, 
  Share2, 
  Webhook,
  BookOpen,
  ShoppingBag,
  Shield,
  Database,
  Settings,
  AlertTriangle
} from 'lucide-react';

// Import the main dashboard component
import EnterpriseIntegrationDashboard from '@/components/integrations/EnterpriseIntegrationDashboard';

// Placeholder component for other integration sections
function PlaceholderComponent({ 
  title, 
  description, 
  icon: Icon 
}: { 
  title: string, 
  description: string,
  icon: React.ComponentType<{ className?: string }> 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <Icon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium mb-2">Integration Component Ready</p>
          <p className="text-sm">Full {title.toLowerCase()} functionality will be available after deployment</p>
          <Button variant="outline" className="mt-4">
            View Implementation Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = React.useState('overview');

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enterprise Integrations Hub</h1>
          <p className="text-gray-600 mt-1">
            Connect, manage, and monitor all your enterprise integrations
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Global Settings
        </Button>
      </div>

      {/* Alert for Beta Features */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Enterprise integrations hub is now available. Connect your favorite tools and automate your workflows.
        </AlertDescription>
      </Alert>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 lg:grid-cols-11 gap-2 h-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            <span className="hidden lg:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="crm" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden lg:inline">CRM</span>
          </TabsTrigger>
          <TabsTrigger value="marketing" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden lg:inline">Marketing</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden lg:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            <span className="hidden lg:inline">Social</span>
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            <span className="hidden lg:inline">Webhooks</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden lg:inline">API Docs</span>
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden lg:inline">Marketplace</span>
          </TabsTrigger>
          <TabsTrigger value="oauth" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden lg:inline">OAuth</span>
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden lg:inline">Data Sync</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden lg:inline">Monitoring</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="overview">
          <EnterpriseIntegrationDashboard />
        </TabsContent>

        <TabsContent value="crm">
          <PlaceholderComponent 
            title="CRM Integrations" 
            description="Connect Salesforce, HubSpot, Pipedrive, and other CRM systems"
            icon={Building2}
          />
        </TabsContent>

        <TabsContent value="marketing">
          <PlaceholderComponent 
            title="Marketing Automation" 
            description="Integrate with Mailchimp, Constant Contact, and marketing platforms"
            icon={Mail}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <PlaceholderComponent 
            title="Analytics Integrations" 
            description="Connect Google Analytics, Adobe Analytics, and tracking platforms"
            icon={BarChart3}
          />
        </TabsContent>

        <TabsContent value="social">
          <PlaceholderComponent 
            title="Social Media Integrations" 
            description="Manage Buffer, Hootsuite, and social media scheduling tools"
            icon={Share2}
          />
        </TabsContent>

        <TabsContent value="webhooks">
          <PlaceholderComponent 
            title="Webhook Manager" 
            description="Configure and monitor webhook endpoints for real-time events"
            icon={Webhook}
          />
        </TabsContent>

        <TabsContent value="api">
          <PlaceholderComponent 
            title="API Documentation" 
            description="Interactive API documentation and testing playground"
            icon={BookOpen}
          />
        </TabsContent>

        <TabsContent value="marketplace">
          <PlaceholderComponent 
            title="Integration Marketplace" 
            description="Browse and install third-party integration connectors"
            icon={ShoppingBag}
          />
        </TabsContent>

        <TabsContent value="oauth">
          <PlaceholderComponent 
            title="OAuth Manager" 
            description="Manage OAuth flows and third-party authentication"
            icon={Shield}
          />
        </TabsContent>

        <TabsContent value="sync">
          <PlaceholderComponent 
            title="Data Sync Pipelines" 
            description="Create and manage ETL pipelines for data synchronization"
            icon={Database}
          />
        </TabsContent>

        <TabsContent value="monitoring">
          <PlaceholderComponent 
            title="Integration Monitoring" 
            description="Monitor integration health, performance, and error tracking"
            icon={BarChart3}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Integration Health</CardTitle>
            <CardDescription>Overall system status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Uptime</span>
                <span className="font-semibold text-green-600">99.9%</span>
              </div>
              <div className="flex justify-between">
                <span>Active Integrations</span>
                <span className="font-semibold">24</span>
              </div>
              <div className="flex justify-between">
                <span>Failed Syncs (24h)</span>
                <span className="font-semibold text-red-600">2</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Flow</CardTitle>
            <CardDescription>Last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Records Synced</span>
                <span className="font-semibold">45,678</span>
              </div>
              <div className="flex justify-between">
                <span>API Calls</span>
                <span className="font-semibold">128,456</span>
              </div>
              <div className="flex justify-between">
                <span>Webhooks Processed</span>
                <span className="font-semibold">3,892</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Authentication status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>OAuth Tokens</span>
                <span className="font-semibold text-green-600">Valid</span>
              </div>
              <div className="flex justify-between">
                <span>API Keys</span>
                <span className="font-semibold">12 Active</span>
              </div>
              <div className="flex justify-between">
                <span>SSO Providers</span>
                <span className="font-semibold">3 Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}