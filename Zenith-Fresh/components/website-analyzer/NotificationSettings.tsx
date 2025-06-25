'use client';

import React, { useState, useEffect } from 'react';
import { 
  BellIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/website-analyzer/notifications');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: any) => {
    setSaving(true);
    setError('');
    
    try {
      const response = await fetch('/api/website-analyzer/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
        setSuccess('Notification preferences updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update preferences');
      }
    } catch (error) {
      setError('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async (channel: string) => {
    setTesting(channel);
    setError('');
    
    try {
      const response = await fetch('/api/website-analyzer/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          channel,
        }),
      });

      if (response.ok) {
        setSuccess(`Test notification sent via ${channel}!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to send test ${channel} notification`);
      }
    } catch (error) {
      setError(`Failed to send test ${channel} notification`);
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12">
        <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load preferences</h3>
        <p className="mt-1 text-sm text-gray-500">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
        <p className="text-sm text-gray-600">
          Configure how you want to be notified about scan results and alerts.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          </div>
        </div>
      )}

      {/* Email Notifications */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <EnvelopeIcon className="h-6 w-6 text-blue-500 mr-3" />
            <div>
              <h4 className="text-lg font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-600">Receive alerts and reports via email</p>
            </div>
          </div>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email}
                onChange={(e) => updatePreferences({ email: e.target.checked })}
                className="sr-only peer"
                disabled={saving}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {preferences.email && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={preferences.emailAddress || ''}
                onChange={(e) => updatePreferences({ emailAddress: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email address"
                disabled={saving}
              />
            </div>
            <button
              onClick={() => testNotification('email')}
              disabled={testing === 'email' || !preferences.emailAddress}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {testing === 'email' ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        )}
      </div>

      {/* Slack Notifications */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-500 mr-3" />
            <div>
              <h4 className="text-lg font-medium text-gray-900">Slack Notifications</h4>
              <p className="text-sm text-gray-600">Send alerts to your Slack workspace</p>
            </div>
          </div>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.slack}
                onChange={(e) => updatePreferences({ slack: e.target.checked })}
                className="sr-only peer"
                disabled={saving}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>

        {preferences.slack && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slack Webhook URL
              </label>
              <input
                type="url"
                value={preferences.slackWebhookUrl === '***configured***' ? '' : preferences.slackWebhookUrl || ''}
                onChange={(e) => updatePreferences({ slackWebhookUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://hooks.slack.com/services/..."
                disabled={saving}
              />
              {preferences.slackWebhookUrl === '***configured***' && (
                <p className="mt-1 text-sm text-gray-500">Webhook URL is configured</p>
              )}
            </div>
            <button
              onClick={() => testNotification('slack')}
              disabled={testing === 'slack' || (!preferences.slackWebhookUrl || preferences.slackWebhookUrl === '***configured***')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {testing === 'slack' ? 'Sending...' : 'Send Test Message'}
            </button>
          </div>
        )}
      </div>

      {/* Alert Types */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Alert Types</h4>
        <p className="text-sm text-gray-600 mb-4">
          Choose which types of alerts you want to receive notifications for.
        </p>

        <div className="space-y-3">
          {[
            { key: 'performance_drop', label: 'Performance Degradation', description: 'When performance scores drop significantly' },
            { key: 'accessibility_issue', label: 'Accessibility Issues', description: 'When accessibility problems are detected' },
            { key: 'seo_issue', label: 'SEO Problems', description: 'When SEO scores are poor' },
            { key: 'error_increase', label: 'Error Detection', description: 'When errors are found on the page' },
            { key: 'significant_change', label: 'Significant Changes', description: 'When metrics change by more than 20%' },
          ].map((alertType) => (
            <div key={alertType.key} className="flex items-center justify-between py-2">
              <div>
                <h5 className="text-sm font-medium text-gray-900">{alertType.label}</h5>
                <p className="text-sm text-gray-500">{alertType.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.alertTypes?.[alertType.key] !== false}
                  onChange={(e) => updatePreferences({
                    alertTypes: {
                      ...preferences.alertTypes,
                      [alertType.key]: e.target.checked,
                    }
                  })}
                  className="sr-only peer"
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}