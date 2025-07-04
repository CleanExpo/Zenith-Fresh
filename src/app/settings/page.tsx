'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import { 
  User, 
  Bell, 
  Shield, 
  Key,
  CreditCard,
  Settings as SettingsIcon,
  Save
} from 'lucide-react';

interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  theme: 'light' | 'dark' | 'system';
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [teamId, setTeamId] = useState<string>('');
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
    theme: 'system'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
    
    if (session?.user?.id) {
      setTeamId(session.user.id);
      fetchUserPreferences();
    }
  }, [session, status]);

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      
      if (response.ok) {
        // Success feedback could be added here
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user?.id) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon className="w-8 h-8 text-gray-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account preferences, billing, and security settings.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Profile Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      defaultValue={session.user.name || ''}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={session.user.email || ''}
                      className="mt-1"
                      disabled
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    type="text"
                    placeholder="Tell us about yourself"
                    className="mt-1"
                  />
                </div>
                <Button onClick={savePreferences} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Notification Preferences
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => 
                      setPreferences({...preferences, emailNotifications: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => 
                      setPreferences({...preferences, pushNotifications: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-emails">Marketing Emails</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive emails about new features and promotions
                    </p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={preferences.marketingEmails}
                    onCheckedChange={(checked) => 
                      setPreferences({...preferences, marketingEmails: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="security-alerts">Security Alerts</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive alerts about security and account changes
                    </p>
                  </div>
                  <Switch
                    id="security-alerts"
                    checked={preferences.securityAlerts}
                    onCheckedChange={(checked) => 
                      setPreferences({...preferences, securityAlerts: checked})
                    }
                  />
                </div>
                <Button onClick={savePreferences} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Security Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    className="mt-1"
                  />
                </div>
                <Button>
                  <Shield className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Billing & Subscription
                </h3>
              </div>
              
              <BillingDashboard teamId={teamId} />
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                API Keys
              </h3>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your API keys for programmatic access to your data.
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Production API Key</Label>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        sk-...••••••••••••••••••••••••••••••••••••••••••••••••••
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Regenerate
                    </Button>
                  </div>
                </div>
                <Button>
                  <Key className="w-4 h-4 mr-2" />
                  Create New API Key
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}