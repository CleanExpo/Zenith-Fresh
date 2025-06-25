/**
 * OAuth Manager Component
 * Manages OAuth flows and third-party service authentication
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Key,
  Globe,
  Users,
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
  ExternalLink,
  Lock,
  Unlock,
  Activity,
  AlertTriangle,
  Zap,
  Database,
  Code
} from 'lucide-react';

interface OAuthApplication {
  id: string;
  name: string;
  provider: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  redirectUris: string[];
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  lastUsed?: Date;
  authorizations: number;
  environment: 'production' | 'staging' | 'development';
}

interface OAuthToken {
  id: string;
  applicationId: string;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scopes: string[];
  createdAt: Date;
  lastRefreshed?: Date;
  status: 'active' | 'expired' | 'revoked';
}

// Mock OAuth applications
const mockApplications: OAuthApplication[] = [
  {
    id: '1',
    name: 'Google Workspace Integration',
    provider: 'google',
    clientId: 'google_client_123456789',
    clientSecret: 'gcs_secret_abcdefghijklmnop',
    scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/drive.readonly'],
    redirectUris: ['https://zenith.engineer/auth/google/callback'],
    status: 'active',
    createdAt: new Date('2024-05-15'),
    lastUsed: new Date('2024-06-25T10:30:00'),
    authorizations: 156,
    environment: 'production'
  },
  {
    id: '2',
    name: 'Microsoft 365 Connector',
    provider: 'microsoft',
    clientId: 'ms_client_987654321',
    clientSecret: 'ms_secret_zyxwvutsrqponmlk',
    scopes: ['User.Read', 'Files.Read', 'Calendars.Read'],
    redirectUris: ['https://zenith.engineer/auth/microsoft/callback'],
    status: 'active',
    createdAt: new Date('2024-04-20'),
    lastUsed: new Date('2024-06-24T15:45:00'),
    authorizations: 89,
    environment: 'production'
  },
  {
    id: '3',
    name: 'Slack Development App',
    provider: 'slack',
    clientId: 'slack_dev_456789123',
    clientSecret: 'slack_secret_mnopqrstuvwxyz',
    scopes: ['chat:write', 'channels:read', 'users:read'],
    redirectUris: ['https://dev.zenith.engineer/auth/slack/callback'],
    status: 'pending',
    createdAt: new Date('2024-06-22'),
    authorizations: 0,
    environment: 'development'
  }
];

// Mock OAuth tokens
const mockTokens: OAuthToken[] = [
  {
    id: '1',
    applicationId: '1',
    userId: 'user_123',
    accessToken: 'goog_access_token_abc123',
    refreshToken: 'goog_refresh_token_def456',
    expiresAt: new Date('2024-06-26T10:30:00'),
    scopes: ['https://www.googleapis.com/auth/userinfo.email'],
    createdAt: new Date('2024-06-25T10:30:00'),
    lastRefreshed: new Date('2024-06-25T10:30:00'),
    status: 'active'
  },
  {
    id: '2',
    applicationId: '2',
    userId: 'user_456',
    accessToken: 'ms_access_token_xyz789',
    refreshToken: 'ms_refresh_token_uvw012',
    expiresAt: new Date('2024-06-25T09:00:00'),
    scopes: ['User.Read', 'Files.Read'],
    createdAt: new Date('2024-06-24T15:45:00'),
    status: 'expired'
  }
];

export default function OAuthManager() {
  const [applications, setApplications] = useState<OAuthApplication[]>(mockApplications);
  const [tokens, setTokens] = useState<OAuthToken[]>(mockTokens);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSecretsDialog, setShowSecretsDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState<OAuthApplication | null>(null);
  const [showSecrets, setShowSecrets] = useState<Set<string>>(new Set());
  
  const [appForm, setAppForm] = useState({
    name: '',
    provider: '',
    clientId: '',
    clientSecret: '',
    scopes: '',
    redirectUris: '',
    environment: 'production' as 'production' | 'staging' | 'development'
  });

  // Handle application creation
  const handleCreateApp = useCallback(() => {
    const newApp: OAuthApplication = {
      id: Date.now().toString(),
      name: appForm.name,
      provider: appForm.provider,
      clientId: appForm.clientId,
      clientSecret: appForm.clientSecret,
      scopes: appForm.scopes.split(',').map(s => s.trim()),
      redirectUris: appForm.redirectUris.split(',').map(s => s.trim()),
      status: 'pending',
      createdAt: new Date(),
      authorizations: 0,
      environment: appForm.environment
    };
    
    setApplications(prev => [...prev, newApp]);
    setShowAddDialog(false);
    setAppForm({
      name: '',
      provider: '',
      clientId: '',
      clientSecret: '',
      scopes: '',
      redirectUris: '',
      environment: 'production'
    });
  }, [appForm]);

  // Handle application status toggle
  const handleToggleApp = useCallback((id: string) => {
    setApplications(prev => 
      prev.map(app => 
        app.id === id 
          ? { ...app, status: app.status === 'active' ? 'inactive' : 'active' }
          : app
      )
    );
  }, []);

  // Handle token refresh
  const handleRefreshToken = useCallback((tokenId: string) => {
    setTokens(prev => 
      prev.map(token => 
        token.id === tokenId 
          ? { 
              ...token, 
              status: 'active',
              expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
              lastRefreshed: new Date()
            }
          : token
      )
    );
  }, []);

  // Handle token revocation
  const handleRevokeToken = useCallback((tokenId: string) => {
    setTokens(prev => 
      prev.map(token => 
        token.id === tokenId 
          ? { ...token, status: 'revoked' }
          : token
      )
    );
  }, []);

  // Toggle secret visibility
  const toggleSecretVisibility = useCallback((appId: string) => {
    setShowSecrets(prev => {
      const next = new Set(prev);
      if (next.has(appId)) {
        next.delete(appId);
      } else {
        next.add(appId);
      }
      return next;
    });
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'revoked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google': return '🔍';
      case 'microsoft': return '🏢';
      case 'slack': return '💬';
      default: return '🔗';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">OAuth Manager</h2>
          <p className="text-gray-600">Manage OAuth applications and user authorizations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSecretsDialog(true)} className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            View Secrets
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Security Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          OAuth credentials are sensitive. Use environment variables and never commit secrets to version control.
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="tokens">Active Tokens</TabsTrigger>
          <TabsTrigger value="flows">OAuth Flows</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          <div className="grid gap-4">
            {applications.map((app) => (
              <Card key={app.id} className={`${app.status === 'inactive' ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getProviderIcon(app.provider)}</div>
                      <div>
                        <CardTitle className="text-lg">{app.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {app.provider}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {app.environment}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(app.status)}>
                        {app.status}
                      </Badge>
                      <Switch
                        checked={app.status === 'active'}
                        onCheckedChange={() => handleToggleApp(app.id)}
                        disabled={app.status === 'pending'}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Client Credentials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Client ID</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                            {app.clientId}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(app.clientId)}
                            className="p-1"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Client Secret</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1">
                            {showSecrets.has(app.id) ? app.clientSecret : '••••••••••••••••'}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSecretVisibility(app.id)}
                            className="p-1"
                          >
                            {showSecrets.has(app.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(app.clientSecret)}
                            className="p-1"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Scopes */}
                    <div>
                      <Label className="text-sm font-medium">Scopes</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {app.scopes.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Redirect URIs */}
                    <div>
                      <Label className="text-sm font-medium">Redirect URIs</Label>
                      <div className="space-y-1 mt-2">
                        {app.redirectUris.map((uri, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1">
                              {uri}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(uri)}
                              className="p-1"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-gray-600">Authorizations</p>
                        <p className="text-lg font-semibold">{app.authorizations}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="text-lg font-semibold">{app.createdAt.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Last Used</p>
                        <p className="text-lg font-semibold">
                          {app.lastUsed ? app.lastUsed.toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Environment</p>
                        <p className="text-lg font-semibold capitalize">{app.environment}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Logs
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Test Flow
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
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

        <TabsContent value="tokens" className="space-y-4">
          <div className="grid gap-4">
            {tokens.map((token) => {
              const app = applications.find(a => a.id === token.applicationId);
              
              return (
                <Card key={token.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getProviderIcon(app?.provider || '')}</div>
                        <div>
                          <h4 className="font-semibold">{app?.name || 'Unknown Application'}</h4>
                          <p className="text-sm text-gray-600">User ID: {token.userId}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(token.status)}>
                        {token.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="font-medium">{token.createdAt.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Expires</p>
                        <p className="font-medium">{token.expiresAt.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Last Refreshed</p>
                        <p className="font-medium">
                          {token.lastRefreshed ? token.lastRefreshed.toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label className="text-sm font-medium">Scopes</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {token.scopes.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {token.status === 'expired' && token.refreshToken && (
                        <Button
                          size="sm"
                          onClick={() => handleRefreshToken(token.id)}
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Refresh Token
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeToken(token.id)}
                        className="text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Revoke
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="flows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>OAuth Flow Configuration</CardTitle>
              <CardDescription>Configure and test OAuth authorization flows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Code className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>OAuth flow testing interface will be implemented here</p>
                <p className="text-sm">Test authorization codes, implicit flows, and PKCE</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require PKCE for public clients</Label>
                    <p className="text-sm text-gray-600">Proof Key for Code Exchange for enhanced security</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Strict redirect URI matching</Label>
                    <p className="text-sm text-gray-600">Exact match required for redirect URIs</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Token rotation</Label>
                    <p className="text-sm text-gray-600">Rotate refresh tokens on each use</p>
                  </div>
                  <Switch />
                </div>

                <div>
                  <Label>Default token expiry</Label>
                  <Select defaultValue="3600">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1800">30 minutes</SelectItem>
                      <SelectItem value="3600">1 hour</SelectItem>
                      <SelectItem value="7200">2 hours</SelectItem>
                      <SelectItem value="86400">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>OAuth audit logs will be displayed here</p>
                  <p className="text-sm">Track authorization attempts, token usage, and security events</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Application Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add OAuth Application</DialogTitle>
            <DialogDescription>
              Register a new OAuth application for third-party integrations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Application Name</Label>
                <Input 
                  placeholder="My Integration App"
                  value={appForm.name}
                  onChange={(e) => setAppForm(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Provider</Label>
                <Select 
                  value={appForm.provider} 
                  onValueChange={(value) => setAppForm(prev => ({ ...prev, provider: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="microsoft">Microsoft</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client ID</Label>
                <Input 
                  placeholder="your_client_id"
                  value={appForm.clientId}
                  onChange={(e) => setAppForm(prev => ({ ...prev, clientId: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Client Secret</Label>
                <Input 
                  type="password"
                  placeholder="your_client_secret"
                  value={appForm.clientSecret}
                  onChange={(e) => setAppForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Scopes (comma-separated)</Label>
              <Input 
                placeholder="read, write, admin"
                value={appForm.scopes}
                onChange={(e) => setAppForm(prev => ({ ...prev, scopes: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Redirect URIs (comma-separated)</Label>
              <Input 
                placeholder="https://your-app.com/auth/callback"
                value={appForm.redirectUris}
                onChange={(e) => setAppForm(prev => ({ ...prev, redirectUris: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Environment</Label>
              <Select 
                value={appForm.environment} 
                onValueChange={(value: any) => setAppForm(prev => ({ ...prev, environment: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateApp}>
              Create Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secrets Dialog */}
      <Dialog open={showSecretsDialog} onOpenChange={setShowSecretsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>OAuth Secrets</DialogTitle>
            <DialogDescription>
              View and manage OAuth application secrets
            </DialogDescription>
          </DialogHeader>
          <Alert className="mb-4">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              These secrets provide access to your OAuth applications. Keep them secure and never share them publicly.
            </AlertDescription>
          </Alert>
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="p-4 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{app.name}</h4>
                  <Badge variant="outline">{app.provider}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-gray-600">Client ID:</span>
                    <code className="flex-1 bg-gray-100 px-2 py-1 rounded">{app.clientId}</code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(app.clientId)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-gray-600">Secret:</span>
                    <code className="flex-1 bg-gray-100 px-2 py-1 rounded">
                      {showSecrets.has(app.id) ? app.clientSecret : '••••••••••••••••'}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => toggleSecretVisibility(app.id)}>
                      {showSecrets.has(app.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(app.clientSecret)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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