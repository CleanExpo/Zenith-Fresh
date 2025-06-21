'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GmbAccountSelector from '@/components/gmb/AccountSelector';
import { Settings, Building2, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-gray-600 mt-2">Manage your account settings and integrations</p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Connected Services
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Connect and manage your third-party service integrations.
            </p>
            
            {/* GMB Account Selector */}
            <GmbAccountSelector />
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </h2>
            <p className="text-sm text-gray-600">
              Configure how and when you receive notifications.
            </p>
            {/* Add notification settings here */}
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Settings
            </h2>
            <p className="text-sm text-gray-600">
              Manage your account security and privacy settings.
            </p>
            {/* Add security settings here */}
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Preferences
            </h2>
            <p className="text-sm text-gray-600">
              Customize your experience with personalization options.
            </p>
            {/* Add preference settings here */}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
