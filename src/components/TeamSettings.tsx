import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface TeamSettingsProps {
  teamId: string;
}

interface TeamSettings {
  name: string;
  timezone: string;
  language: string;
  notifications: {
    email: boolean;
    slack: boolean;
    discord: boolean;
  };
  integrations: {
    slack: boolean;
    discord: boolean;
    github: boolean;
  };
}

export function TeamSettings({ teamId }: TeamSettingsProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<TeamSettings>({
    queryKey: ['teamSettings', teamId],
    queryFn: () => api.get(`/api/team/${teamId}/settings`)
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (updates: Partial<TeamSettings>) =>
      api.put(`/api/team/${teamId}/settings`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamSettings', teamId] });
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update settings');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-destructive">Error loading settings</div>
      </div>
    );
  }

  if (!data) return null;

  const handleInputChange = (
    field: keyof TeamSettings,
    value: string | boolean
  ) => {
    updateSettingsMutation.mutate({ [field]: value });
  };

  const handleNotificationChange = (
    channel: keyof TeamSettings['notifications'],
    checked: boolean
  ) => {
    updateSettingsMutation.mutate({
      notifications: { ...data.notifications, [channel]: checked }
    });
  };

  const handleIntegrationChange = (
    integration: keyof TeamSettings['integrations'],
    checked: boolean
  ) => {
    updateSettingsMutation.mutate({
      integrations: { ...data.integrations, [integration]: checked }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={updateSettingsMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={data.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              disabled={updateSettingsMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Input
              id="language"
              value={data.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              disabled={updateSettingsMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Receive notifications via email
              </div>
            </div>
            <Switch
              checked={data.notifications.email}
              onCheckedChange={(checked) =>
                handleNotificationChange('email', checked)
              }
              disabled={updateSettingsMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Slack Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Receive notifications in Slack
              </div>
            </div>
            <Switch
              checked={data.notifications.slack}
              onCheckedChange={(checked) =>
                handleNotificationChange('slack', checked)
              }
              disabled={updateSettingsMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Discord Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Receive notifications in Discord
              </div>
            </div>
            <Switch
              checked={data.notifications.discord}
              onCheckedChange={(checked) =>
                handleNotificationChange('discord', checked)
              }
              disabled={updateSettingsMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Slack Integration</Label>
              <div className="text-sm text-muted-foreground">
                Connect your Slack workspace
              </div>
            </div>
            <Switch
              checked={data.integrations.slack}
              onCheckedChange={(checked) =>
                handleIntegrationChange('slack', checked)
              }
              disabled={updateSettingsMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Discord Integration</Label>
              <div className="text-sm text-muted-foreground">
                Connect your Discord server
              </div>
            </div>
            <Switch
              checked={data.integrations.discord}
              onCheckedChange={(checked) =>
                handleIntegrationChange('discord', checked)
              }
              disabled={updateSettingsMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>GitHub Integration</Label>
              <div className="text-sm text-muted-foreground">
                Connect your GitHub repositories
              </div>
            </div>
            <Switch
              checked={data.integrations.github}
              onCheckedChange={(checked) =>
                handleIntegrationChange('github', checked)
              }
              disabled={updateSettingsMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 