'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, 
  Bell, 
  Globe, 
  Clock,
  Mail,
  MessageSquare,
  Github,
  Slack
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface TeamSettingsProps {
  teamId: string;
}

interface TeamSettingsData {
  settings: {
    id: string;
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
  };
}

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
  { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
  { value: 'America/Denver', label: 'Mountain Time (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
];

export function TeamSettingsComponent({ teamId }: TeamSettingsProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<TeamSettingsData>({
    queryKey: ['teamSettings', teamId],
    queryFn: () => api.get(`/api/teams/${teamId}/settings`)
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (updates: any) =>
      api.put(`/api/teams/${teamId}/settings`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamSettings', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update settings');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-destructive">Failed to load settings</div>
      </div>
    );
  }

  const { settings } = data;

  const handleTimezoneChange = (timezone: string) => {
    updateSettingsMutation.mutate({ timezone });
  };

  const handleLanguageChange = (language: string) => {
    updateSettingsMutation.mutate({ language });
  };

  const handleNotificationChange = (
    channel: keyof typeof settings.notifications,
    checked: boolean
  ) => {
    updateSettingsMutation.mutate({
      notifications: { ...settings.notifications, [channel]: checked }
    });
  };

  const handleIntegrationChange = (
    integration: keyof typeof settings.integrations,
    checked: boolean
  ) => {
    updateSettingsMutation.mutate({
      integrations: { ...settings.integrations, [integration]: checked }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Team Settings</h2>
        <p className="text-muted-foreground">
          Manage your team's preferences and integrations
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timezone
              </Label>
              <Select value={settings.timezone} onValueChange={handleTimezoneChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Used for scheduling and displaying dates
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Language
              </Label>
              <Select value={settings.language} onValueChange={handleLanguageChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Default language for the team
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <Label>Email Notifications</Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  Receive team updates and alerts via email
                </div>
              </div>
              <Switch
                checked={settings.notifications.email}
                onCheckedChange={(checked) =>
                  handleNotificationChange('email', checked)
                }
                disabled={updateSettingsMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Slack className="h-4 w-4" />
                  <Label>Slack Notifications</Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  Send notifications to connected Slack channels
                </div>
              </div>
              <Switch
                checked={settings.notifications.slack}
                onCheckedChange={(checked) =>
                  handleNotificationChange('slack', checked)
                }
                disabled={updateSettingsMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <Label>Discord Notifications</Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  Send notifications to connected Discord channels
                </div>
              </div>
              <Switch
                checked={settings.notifications.discord}
                onCheckedChange={(checked) =>
                  handleNotificationChange('discord', checked)
                }
                disabled={updateSettingsMutation.isPending}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Slack className="h-4 w-4" />
                  <Label>Slack Integration</Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  Connect your Slack workspace for enhanced collaboration
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.integrations.slack}
                  onCheckedChange={(checked) =>
                    handleIntegrationChange('slack', checked)
                  }
                  disabled={updateSettingsMutation.isPending}
                />
                {settings.integrations.slack && (
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <Label>Discord Integration</Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  Connect your Discord server for team communication
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.integrations.discord}
                  onCheckedChange={(checked) =>
                    handleIntegrationChange('discord', checked)
                  }
                  disabled={updateSettingsMutation.isPending}
                />
                {settings.integrations.discord && (
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  <Label>GitHub Integration</Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  Connect GitHub repositories for project management
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.integrations.github}
                  onCheckedChange={(checked) =>
                    handleIntegrationChange('github', checked)
                  }
                  disabled={updateSettingsMutation.isPending}
                />
                {settings.integrations.github && (
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}