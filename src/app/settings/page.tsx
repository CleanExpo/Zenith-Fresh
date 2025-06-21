'use client';

import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Globe, 
  Bell, 
  CreditCard, 
  Key,
  Shield,
  Palette,
  Save,
  ExternalLink,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');
  const [settings, setSettings] = useState({
    name: 'John Smith',
    email: 'john@example.com',
    businessName: 'Smith Digital Marketing',
    website: 'https://smithdigital.com',
    phone: '+1 (555) 123-4567',
    notifications: {
      reviews: true,
      rankings: true,
      alerts: false,
      weekly: true
    },
    theme: 'dark'
  });

  const handleSave = (category: string) => {
    // Mock save functionality
    console.log(`Saving ${category} settings...`);
    // Show toast notification here
  };

  const integrations = [
    { name: 'Google My Business', status: 'connected', icon: <Globe className="w-5 h-5" />, lastSync: '2 hours ago' },
    { name: 'Facebook Pages', status: 'disconnected', icon: <div className="w-5 h-5 bg-blue-600 rounded" />, lastSync: 'Never' },
    { name: 'Instagram Business', status: 'connected', icon: <div className="w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded" />, lastSync: '1 day ago' },
    { name: 'X (Twitter)', status: 'disconnected', icon: <div className="w-5 h-5 bg-black rounded" />, lastSync: 'Never' },
    { name: 'LinkedIn Company', status: 'pending', icon: <div className="w-5 h-5 bg-blue-700 rounded" />, lastSync: 'Connecting...' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <Card variant="glass" padding="default" rounded="xl" className="backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl border border-white/20">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Account Settings</CardTitle>
                <p className="text-white/70 mt-1">Manage your account preferences and integrations</p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/5 backdrop-blur-xl border border-white/10">
            <TabsTrigger value="account" className="data-[state=active]:bg-white/10">
              <User className="w-4 h-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="business" className="data-[state=active]:bg-white/10">
              <Building2 className="w-4 h-4 mr-2" />
              Business
            </TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-white/10">
              <Globe className="w-4 h-4 mr-2" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-white/10">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-white/10">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-white/10">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card variant="glass-elevated" padding="default" rounded="xl">
                <CardHeader>
                  <CardTitle className="text-white">Personal Information</CardTitle>
                  <p className="text-white/70 text-sm">Update your personal details</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-white/80">Full Name</Label>
                    <Input
                      id="name"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white/80">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <Button 
                    variant="gradient" 
                    size="sm" 
                    onClick={() => handleSave('account')}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              <Card variant="glass-elevated" padding="default" rounded="xl">
                <CardHeader>
                  <CardTitle className="text-white">Account Status</CardTitle>
                  <p className="text-white/70 text-sm">Your current plan and usage</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Current Plan</span>
                    <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                      Business Pro
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">API Calls Used</span>
                    <span className="text-white">847 / 10,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Next Billing</span>
                    <span className="text-white">Jan 15, 2025</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Usage Details
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Business Tab */}
          <TabsContent value="business" className="space-y-6">
            <Card variant="glass-elevated" padding="default" rounded="xl">
              <CardHeader>
                <CardTitle className="text-white">Business Profile</CardTitle>
                <p className="text-white/70 text-sm">Manage your business information</p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="businessName" className="text-white/80">Business Name</Label>
                    <Input
                      id="businessName"
                      value={settings.businessName}
                      onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website" className="text-white/80">Website URL</Label>
                    <Input
                      id="website"
                      value={settings.website}
                      onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-white/80">Phone Number</Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <Card variant="glass" padding="sm" rounded="lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">Business Verification</span>
                    </div>
                    <p className="text-xs text-white/70 mb-3">
                      Verify your business to unlock premium features and increase trust.
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Start Verification
                    </Button>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card variant="glass-elevated" padding="default" rounded="xl">
              <CardHeader>
                <CardTitle className="text-white">Connected Platforms</CardTitle>
                <p className="text-white/70 text-sm">Manage your social media and business platform connections</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {integrations.map((integration) => (
                    <Card key={integration.name} variant="glass" padding="sm" rounded="lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {integration.icon}
                          <div>
                            <h4 className="font-medium text-white">{integration.name}</h4>
                            <p className="text-xs text-white/60">Last sync: {integration.lastSync}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={integration.status === 'connected' ? 'default' : 
                                   integration.status === 'pending' ? 'secondary' : 'outline'}
                            className={
                              integration.status === 'connected' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                              integration.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
                              'bg-red-500/20 text-red-400 border-red-500/50'
                            }
                          >
                            {integration.status}
                          </Badge>
                          <Button 
                            variant={integration.status === 'connected' ? 'outline' : 'gradient-green'} 
                            size="sm"
                          >
                            {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card variant="glass-elevated" padding="default" rounded="xl">
              <CardHeader>
                <CardTitle className="text-white">Notification Preferences</CardTitle>
                <p className="text-white/70 text-sm">Choose what notifications you want to receive</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">New Reviews</Label>
                      <p className="text-sm text-white/60">Get notified when you receive new customer reviews</p>
                    </div>
                    <Switch 
                      checked={settings.notifications.reviews}
                      onCheckedChange={(checked) => 
                        setSettings({ 
                          ...settings, 
                          notifications: { ...settings.notifications, reviews: checked }
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Ranking Changes</Label>
                      <p className="text-sm text-white/60">Alert me when my search rankings change significantly</p>
                    </div>
                    <Switch 
                      checked={settings.notifications.rankings}
                      onCheckedChange={(checked) => 
                        setSettings({ 
                          ...settings, 
                          notifications: { ...settings.notifications, rankings: checked }
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Critical Alerts</Label>
                      <p className="text-sm text-white/60">Important issues that need immediate attention</p>
                    </div>
                    <Switch 
                      checked={settings.notifications.alerts}
                      onCheckedChange={(checked) => 
                        setSettings({ 
                          ...settings, 
                          notifications: { ...settings.notifications, alerts: checked }
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Weekly Summary</Label>
                      <p className="text-sm text-white/60">Weekly performance summary and insights</p>
                    </div>
                    <Switch 
                      checked={settings.notifications.weekly}
                      onCheckedChange={(checked) => 
                        setSettings({ 
                          ...settings, 
                          notifications: { ...settings.notifications, weekly: checked }
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card variant="glass-elevated" padding="default" rounded="xl">
                <CardHeader>
                  <CardTitle className="text-white">Current Plan</CardTitle>
                  <p className="text-white/70 text-sm">Business Pro - $49/month</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-white/80 text-sm">10,000 API calls/month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-white/80 text-sm">Unlimited social connections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-white/80 text-sm">Advanced analytics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-white/80 text-sm">Priority support</span>
                    </div>
                  </div>
                  <Button variant="gradient-cyan" className="w-full">
                    Upgrade to Enterprise
                  </Button>
                </CardContent>
              </Card>

              <Card variant="glass-elevated" padding="default" rounded="xl">
                <CardHeader>
                  <CardTitle className="text-white">Billing History</CardTitle>
                  <p className="text-white/70 text-sm">Recent transactions and invoices</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm">Dec 2024 - Business Pro</p>
                      <p className="text-white/60 text-xs">Paid on Dec 15, 2024</p>
                    </div>
                    <span className="text-white">$49.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm">Nov 2024 - Business Pro</p>
                      <p className="text-white/60 text-xs">Paid on Nov 15, 2024</p>
                    </div>
                    <span className="text-white">$49.00</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    Download All Invoices
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card variant="glass-elevated" padding="default" rounded="xl">
                <CardHeader>
                  <CardTitle className="text-white">API Keys</CardTitle>
                  <p className="text-white/70 text-sm">Manage your API access keys</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Production API Key</Label>
                    <div className="flex gap-2">
                      <Input 
                        value="zk_live_••••••••••••••••••••••••••••••••"
                        readOnly
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <Button variant="outline" size="sm">
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Test API Key</Label>
                    <div className="flex gap-2">
                      <Input 
                        value="zk_test_••••••••••••••••••••••••••••••••"
                        readOnly
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <Button variant="outline" size="sm">
                        Copy
                      </Button>
                    </div>
                  </div>
                  <Button variant="gradient" size="sm" className="w-full">
                    <Key className="w-4 h-4 mr-2" />
                    Generate New Key
                  </Button>
                </CardContent>
              </Card>

              <Card variant="glass-elevated" padding="default" rounded="xl">
                <CardHeader>
                  <CardTitle className="text-white">Security Settings</CardTitle>
                  <p className="text-white/70 text-sm">Protect your account</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="w-4 h-4 mr-2" />
                      Enable Two-Factor Auth
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="w-4 h-4 mr-2" />
                      View Login History
                    </Button>
                  </div>
                  <Card variant="glass" padding="sm" rounded="lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium text-white">Security Tip</span>
                    </div>
                    <p className="text-xs text-white/70">
                      Enable two-factor authentication to add an extra layer of security to your account.
                    </p>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
