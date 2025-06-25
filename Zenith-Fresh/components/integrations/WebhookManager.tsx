/**
 * Webhook Manager Component
 * Manages webhooks and real-time integrations
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Webhook,
  Zap,
  Globe,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  RefreshCw,
  Settings,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Activity,
  Code,
  Download,
  Filter,
  Search,
  ExternalLink,
  AlertTriangle,
  Info,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Send,
  Database,
  Key,
  Lock
} from 'lucide-react';
import { WebhookEvent } from '@/types/integrations';

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  events: string[];
  active: boolean;
  secret?: string;
  headers: Record<string, string>;
  createdAt: Date;
  lastTriggered?: Date;
  successCount: number;
  failureCount: number;
  retryCount: number;
  timeout: number;
}

// Mock webhook endpoints
const mockWebhooks: WebhookEndpoint[] = [
  {
    id: '1',
    name: 'Slack Notifications',
    url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    method: 'POST',
    events: ['user.created', 'order.completed', 'subscription.updated'],
    active: true,
    secret: 'whsec_1234567890abcdef',
    headers: { 'Content-Type': 'application/json' },
    createdAt: new Date('2024-06-01'),
    lastTriggered: new Date('2024-06-25T10:30:00'),
    successCount: 1456,
    failureCount: 23,
    retryCount: 45,
    timeout: 30000
  },
  {
    id: '2',
    name: 'Analytics Tracking',
    url: 'https://api.analytics.example.com/events',
    method: 'POST',
    events: ['page.viewed', 'button.clicked', 'form.submitted'],
    active: true,
    headers: { 'Authorization': 'Bearer xxx', 'Content-Type': 'application/json' },
    createdAt: new Date('2024-05-15'),
    lastTriggered: new Date('2024-06-25T11:45:00'),
    successCount: 8923,
    failureCount: 12,
    retryCount: 18,
    timeout: 15000
  },
  {
    id: '3',
    name: 'CRM Updates',
    url: 'https://api.crm.example.com/webhooks',
    method: 'POST',
    events: ['contact.updated', 'deal.won', 'deal.lost'],
    active: false,
    secret: 'whsec_abcdef1234567890',
    headers: { 'X-API-Key': 'xxx', 'Content-Type': 'application/json' },
    createdAt: new Date('2024-04-20'),
    lastTriggered: new Date('2024-06-20T14:20:00'),
    successCount: 567,
    failureCount: 8,
    retryCount: 12,
    timeout: 20000
  }
];

// Mock webhook events
const mockEvents: WebhookEvent[] = [
  {
    id: '1',
    integrationId: '1',
    source: 'user-service',
    event: 'user.created',
    payload: { userId: '12345', email: 'john@example.com', plan: 'pro' },
    headers: { 'X-Event-ID': 'evt_123', 'X-Timestamp': '1719318600' },
    timestamp: new Date('2024-06-25T10:30:00'),
    processed: true,
    processingTime: 150
  },
  {
    id: '2',
    integrationId: '2',
    source: 'analytics',
    event: 'page.viewed',
    payload: { page: '/dashboard', userId: '67890', duration: 45000 },
    headers: { 'User-Agent': 'Mozilla/5.0...', 'X-Forwarded-For': '192.168.1.1' },
    timestamp: new Date('2024-06-25T11:45:00'),
    processed: true,
    processingTime: 89
  },
  {
    id: '3',
    integrationId: '3',
    source: 'payment-service',
    event: 'order.completed',
    payload: { orderId: 'ord_456', amount: 99.99, currency: 'USD' },
    headers: { 'X-Signature': 'sha256=...', 'Content-Type': 'application/json' },
    timestamp: new Date('2024-06-25T09:15:00'),
    processed: false,
    error: 'Webhook endpoint returned 500 error'
  }
];

export default function WebhookManager() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(mockWebhooks);
  const [events, setEvents] = useState<WebhookEvent[]>(mockEvents);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [showSecretsDialog, setShowSecretsDialog] = useState(false);
  const [testInProgress, setTestInProgress] = useState<string | null>(null);
  
  const [webhookForm, setWebhookForm] = useState({
    name: '',
    url: '',
    method: 'POST' as 'POST' | 'PUT' | 'PATCH',
    events: [] as string[],
    secret: '',
    timeout: 30000,
    headers: '{"Content-Type": "application/json"}',
    active: true
  });

  const [filters, setFilters] = useState({
    status: 'all',
    event: '',
    search: ''
  });

  // Available webhook events
  const availableEvents = [
    'user.created', 'user.updated', 'user.deleted',
    'order.created', 'order.completed', 'order.cancelled',
    'subscription.created', 'subscription.updated', 'subscription.cancelled',
    'payment.succeeded', 'payment.failed',
    'contact.created', 'contact.updated',
    'deal.won', 'deal.lost',
    'page.viewed', 'button.clicked', 'form.submitted'
  ];

  // Handle webhook creation
  const handleCreateWebhook = useCallback(() => {
    try {
      const headers = JSON.parse(webhookForm.headers);
      const newWebhook: WebhookEndpoint = {
        id: Date.now().toString(),
        name: webhookForm.name,
        url: webhookForm.url,
        method: webhookForm.method,
        events: webhookForm.events,
        active: webhookForm.active,
        secret: webhookForm.secret || undefined,
        headers,
        createdAt: new Date(),
        successCount: 0,
        failureCount: 0,
        retryCount: 0,
        timeout: webhookForm.timeout
      };
      
      setWebhooks(prev => [...prev, newWebhook]);
      setShowAddDialog(false);
      setWebhookForm({
        name: '',
        url: '',
        method: 'POST',
        events: [],
        secret: '',
        timeout: 30000,
        headers: '{"Content-Type": "application/json"}',
        active: true
      });
    } catch (error) {
      alert('Invalid JSON in headers field');
    }
  }, [webhookForm]);

  // Handle webhook toggle
  const handleToggleWebhook = useCallback((id: string) => {
    setWebhooks(prev => 
      prev.map(webhook => 
        webhook.id === id 
          ? { ...webhook, active: !webhook.active }
          : webhook
      )
    );
  }, []);

  // Handle webhook deletion
  const handleDeleteWebhook = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      setWebhooks(prev => prev.filter(webhook => webhook.id !== id));
    }
  }, []);

  // Handle webhook test
  const handleTestWebhook = useCallback(async (id: string) => {
    setTestInProgress(id);
    // Simulate test webhook call
    setTimeout(() => {
      setTestInProgress(null);
      // Update success count
      setWebhooks(prev => 
        prev.map(webhook => 
          webhook.id === id 
            ? { ...webhook, successCount: webhook.successCount + 1, lastTriggered: new Date() }
            : webhook
        )
      );
    }, 2000);
  }, []);

  // Handle event retry
  const handleRetryEvent = useCallback((eventId: string) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === eventId 
          ? { ...event, processed: true, error: undefined, processingTime: 120 }
          : event
      )
    );
  }, []);

  // Copy webhook URL
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    // You might want to show a toast notification here
  }, []);

  // Filter events
  const filteredEvents = events.filter(event => {
    if (filters.status !== 'all') {
      if (filters.status === 'success' && (!event.processed || event.error)) return false;
      if (filters.status === 'failed' && (event.processed && !event.error)) return false;
      if (filters.status === 'pending' && event.processed) return false;
    }
    if (filters.event && !event.event.includes(filters.event)) return false;
    if (filters.search && !event.source.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Webhook Manager</h2>
          <p className="text-gray-600">Manage webhooks and real-time event processing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSecretsDialog(true)} className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Secrets
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Webhook
          </Button>
        </div>
      </div>

      {/* Alert for webhook security */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Always use HTTPS endpoints and webhook secrets for secure event delivery. Monitor failed deliveries regularly.
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="grid gap-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id} className={`${!webhook.active ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Webhook className="h-8 w-8 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">{webhook.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {webhook.method}
                          </code>
                          <span className="text-xs">{webhook.url}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(webhook.url)}
                            className="h-4 w-4 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={webhook.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {webhook.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Switch
                        checked={webhook.active}
                        onCheckedChange={() => handleToggleWebhook(webhook.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Events */}
                    <div>
                      <Label className="text-sm font-medium">Events</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-gray-600">Success</p>
                        <p className="text-lg font-semibold text-green-600">{webhook.successCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Failures</p>
                        <p className="text-lg font-semibold text-red-600">{webhook.failureCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Success Rate</p>
                        <p className="text-lg font-semibold">
                          {webhook.successCount + webhook.failureCount > 0
                            ? ((webhook.successCount / (webhook.successCount + webhook.failureCount)) * 100).toFixed(1)
                            : 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Last Triggered</p>
                        <p className="text-lg font-semibold">
                          {webhook.lastTriggered 
                            ? webhook.lastTriggered.toLocaleDateString()
                            : 'Never'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestWebhook(webhook.id)}
                        disabled={testInProgress === webhook.id || !webhook.active}
                        className="flex items-center gap-2"
                      >
                        {testInProgress === webhook.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Test
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Logs
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {/* Event Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by source..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-48"
                  />
                </div>
                
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Filter by event..."
                  value={filters.event}
                  onChange={(e) => setFilters(prev => ({ ...prev, event: e.target.value }))}
                  className="w-48"
                />

                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-gray-600">
                    {filteredEvents.length} of {events.length} events
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <div className="space-y-2">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                setSelectedEvent(event);
                setShowEventDialog(true);
              }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        event.processed && !event.error ? 'bg-green-500' :
                        event.error ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{event.event}</p>
                          <Badge variant="outline" className="text-xs">
                            {event.source}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {event.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {event.processingTime && (
                        <span className="text-xs text-gray-500">
                          {event.processingTime}ms
                        </span>
                      )}
                      {event.error ? (
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetryEvent(event.id);
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Retry
                          </Button>
                        </div>
                      ) : event.processed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Logs</CardTitle>
              <CardDescription>Monitor webhook delivery attempts and responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Delivery logs will be displayed here</p>
                <p className="text-sm">Track successful deliveries, failures, and retry attempts</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Default Timeout (ms)</Label>
                  <Input type="number" defaultValue="30000" className="mt-2" />
                  <p className="text-sm text-gray-600 mt-1">How long to wait for webhook responses</p>
                </div>

                <div>
                  <Label>Retry Attempts</Label>
                  <Select defaultValue="3">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 attempt</SelectItem>
                      <SelectItem value="3">3 attempts</SelectItem>
                      <SelectItem value="5">5 attempts</SelectItem>
                      <SelectItem value="10">10 attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Retry Backoff</Label>
                    <p className="text-sm text-gray-600">Use exponential backoff for retries</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Log All Events</Label>
                    <p className="text-sm text-gray-600">Store all webhook events for debugging</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Verify SSL Certificates</Label>
                    <p className="text-sm text-gray-600">Verify SSL certificates for webhook URLs</p>
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

      {/* Add Webhook Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Webhook Endpoint</DialogTitle>
            <DialogDescription>
              Configure a new webhook endpoint to receive real-time events
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input 
                  placeholder="Webhook name"
                  value={webhookForm.name}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Method</Label>
                <Select 
                  value={webhookForm.method} 
                  onValueChange={(value: any) => setWebhookForm(prev => ({ ...prev, method: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Endpoint URL</Label>
              <Input 
                placeholder="https://your-domain.com/webhook"
                value={webhookForm.url}
                onChange={(e) => setWebhookForm(prev => ({ ...prev, url: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Events</Label>
              <div className="mt-2 max-h-32 overflow-y-auto border rounded p-3 space-y-2">
                {availableEvents.map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={event}
                      checked={webhookForm.events.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWebhookForm(prev => ({ ...prev, events: [...prev.events, event] }));
                        } else {
                          setWebhookForm(prev => ({ ...prev, events: prev.events.filter(e => e !== event) }));
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor={event} className="text-sm font-medium">{event}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Secret (Optional)</Label>
                <Input 
                  type="password"
                  placeholder="Webhook secret for signature verification"
                  value={webhookForm.secret}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, secret: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Timeout (ms)</Label>
                <Input 
                  type="number"
                  value={webhookForm.timeout}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30000 }))}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Headers (JSON)</Label>
              <Textarea 
                placeholder='{"Content-Type": "application/json"}'
                value={webhookForm.headers}
                onChange={(e) => setWebhookForm(prev => ({ ...prev, headers: e.target.value }))}
                className="mt-2 font-mono text-sm"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch 
                checked={webhookForm.active}
                onCheckedChange={(checked) => setWebhookForm(prev => ({ ...prev, active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWebhook}>
              Create Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Webhook event payload and delivery information
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Event Type</Label>
                  <p className="mt-1 font-mono text-sm bg-gray-100 p-2 rounded">{selectedEvent.event}</p>
                </div>
                <div>
                  <Label>Source</Label>
                  <p className="mt-1 font-mono text-sm bg-gray-100 p-2 rounded">{selectedEvent.source}</p>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <p className="mt-1 font-mono text-sm bg-gray-100 p-2 rounded">{selectedEvent.timestamp.toISOString()}</p>
                </div>
                <div>
                  <Label>Processing Time</Label>
                  <p className="mt-1 font-mono text-sm bg-gray-100 p-2 rounded">
                    {selectedEvent.processingTime ? `${selectedEvent.processingTime}ms` : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedEvent.error && (
                <div>
                  <Label>Error</Label>
                  <p className="mt-1 text-sm bg-red-50 text-red-800 p-2 rounded border border-red-200">
                    {selectedEvent.error}
                  </p>
                </div>
              )}

              <div>
                <Label>Headers</Label>
                <pre className="mt-1 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                  {JSON.stringify(selectedEvent.headers, null, 2)}
                </pre>
              </div>

              <div>
                <Label>Payload</Label>
                <pre className="mt-1 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Close
            </Button>
            {selectedEvent?.error && (
              <Button onClick={() => selectedEvent && handleRetryEvent(selectedEvent.id)}>
                Retry Event
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webhook Secrets Dialog */}
      <Dialog open={showSecretsDialog} onOpenChange={setShowSecretsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Webhook Secrets</DialogTitle>
            <DialogDescription>
              Manage webhook signing secrets for secure event verification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Use these secrets to verify webhook signatures and ensure events are from trusted sources.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              {webhooks.filter(w => w.secret).map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{webhook.name}</p>
                    <p className="text-xs text-gray-600 font-mono">whsec_****</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSecretsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}