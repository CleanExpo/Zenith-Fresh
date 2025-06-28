'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClockIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  PencilIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface ScheduledScan {
  id: string;
  name: string;
  url: string;
  frequency: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay: string;
  timezone: string;
  isActive: boolean;
  emailNotifications: boolean;
  notificationEmails: string[];
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
  successCount: number;
  failureCount: number;
  lastError?: string;
  _count?: {
    analyses: number;
  };
}

interface EnhancedScheduledScansProps {
  className?: string;
}

export default function EnhancedScheduledScans({ className = '' }: EnhancedScheduledScansProps) {
  const [scheduledScans, setScheduledScans] = useState<ScheduledScan[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingScan, setEditingScan] = useState<ScheduledScan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchScheduledScans();
  }, []);

  const fetchScheduledScans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analysis/website/scheduled');
      if (response.ok) {
        const data = await response.json();
        setScheduledScans(data.data.scheduledScans || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch scheduled scans');
      }
    } catch (error) {
      setError('Failed to fetch scheduled scans');
      console.error('Failed to fetch scheduled scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNextRun = (nextRun: string) => {
    const date = new Date(nextRun);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    if (diffMins > 0) return `in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffMins < 0) return 'overdue';
    return 'soon';
  };

  const getFrequencyLabel = (frequency: string, dayOfWeek?: number, dayOfMonth?: number) => {
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Weekly (${days[dayOfWeek || 1]})`;
      case 'monthly':
        return `Monthly (${dayOfMonth || 1}${getOrdinalSuffix(dayOfMonth || 1)})`;
      default:
        return frequency;
    }
  };

  const getOrdinalSuffix = (num: number) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const remainder = num % 100;
    return suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0];
  };

  const toggleScan = async (scanId: string, isActive: boolean) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analysis/website/scheduled/${scanId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !isActive,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setScheduledScans(prev => 
          prev.map(scan => scan.id === scanId ? data.data : scan)
        );
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update scan');
      }
    } catch (error) {
      setError('Failed to update scan');
      console.error('Failed to toggle scan:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteScan = async (scanId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled scan? This will also delete all associated scan history.')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/analysis/website/scheduled/${scanId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setScheduledScans(prev => prev.filter(scan => scan.id !== scanId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete scan');
      }
    } catch (error) {
      setError('Failed to delete scan');
      console.error('Failed to delete scan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanCreated = (newScan: ScheduledScan) => {
    setScheduledScans(prev => [newScan, ...prev]);
    setShowCreateForm(false);
  };

  const handleScanUpdated = (updatedScan: ScheduledScan) => {
    setScheduledScans(prev => 
      prev.map(scan => scan.id === updatedScan.id ? updatedScan : scan)
    );
    setEditingScan(null);
  };

  if (loading && scheduledScans.length === 0) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (scheduledScans.length === 0 && !showCreateForm) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled scans</h3>
        <p className="mt-1 text-sm text-gray-500">
          Set up automated scanning to monitor your websites continuously.
        </p>
        <div className="mt-6">
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Scheduled Scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Scheduled Scans</h3>
          <p className="text-sm text-gray-500">
            Automatically scan your websites at regular intervals
          </p>
        </div>
        {!showCreateForm && !editingScan && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Schedule
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <CreateScheduledScanForm
          onCancel={() => setShowCreateForm(false)}
          onSuccess={handleScanCreated}
          onError={setError}
        />
      )}

      {/* Edit Form */}
      {editingScan && (
        <EditScheduledScanForm
          scan={editingScan}
          onCancel={() => setEditingScan(null)}
          onSuccess={handleScanUpdated}
          onError={setError}
        />
      )}

      {/* Scheduled Scans List */}
      {scheduledScans.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">
              Active Schedules ({scheduledScans.filter(s => s.isActive).length} of {scheduledScans.length})
            </h4>
          </div>
          <div className="divide-y divide-gray-200">
            {scheduledScans.map((scan) => (
              <div key={scan.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        scan.isActive ? 'bg-green-400' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h5 className="text-sm font-medium text-gray-900 truncate">
                            {scan.name}
                          </h5>
                          {scan.emailNotifications && (
                            <BellIcon className="h-4 w-4 text-blue-400" title="Email notifications enabled" />
                          )}
                          {scan.lastError && (
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-400" title={`Last error: ${scan.lastError}`} />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {scan.url}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                      <span>
                        {getFrequencyLabel(scan.frequency, scan.dayOfWeek, scan.dayOfMonth)} at {scan.timeOfDay}
                      </span>
                      {scan.nextRunAt && scan.isActive && (
                        <span className="flex items-center space-x-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>Next: {formatNextRun(scan.nextRunAt)}</span>
                        </span>
                      )}
                      {scan.runCount > 0 && (
                        <span className="flex items-center space-x-1">
                          <CheckCircleIcon className="h-4 w-4 text-green-400" />
                          <span>{scan.successCount}/{scan.runCount} successful</span>
                        </span>
                      )}
                    </div>
                    {scan.lastRunAt && (
                      <div className="mt-1 text-xs text-gray-400">
                        Last run: {new Date(scan.lastRunAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleScan(scan.id, scan.isActive)}
                      disabled={loading}
                      className={`p-2 rounded-md transition-colors ${
                        scan.isActive
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={scan.isActive ? 'Pause' : 'Resume'}
                    >
                      {scan.isActive ? (
                        <PauseIcon className="h-4 w-4" />
                      ) : (
                        <PlayIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingScan(scan)}
                      className="p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-md transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteScan(scan.id)}
                      disabled={loading}
                      className={`p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Create Form Component
function CreateScheduledScanForm({ onCancel, onSuccess, onError }: {
  onCancel: () => void;
  onSuccess: (scan: ScheduledScan) => void;
  onError: (error: string) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    dayOfWeek: 1, // Monday
    dayOfMonth: 1,
    timeOfDay: '09:00',
    timezone: 'UTC',
    emailNotifications: true,
    notificationEmails: [''],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.url.trim()) {
      onError('Please fill in all required fields');
      return;
    }

    // Validate URL
    try {
      new URL(formData.url);
    } catch {
      onError('Please enter a valid URL');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        url: formData.url.trim(),
        name: formData.name.trim(),
        notificationEmails: formData.notificationEmails.filter(email => email.trim()),
        // Only include frequency-specific fields
        ...(formData.frequency === 'weekly' && { dayOfWeek: formData.dayOfWeek }),
        ...(formData.frequency === 'monthly' && { dayOfMonth: formData.dayOfMonth }),
      };

      const response = await fetch('/api/analysis/website/scheduled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess(data.data);
      } else {
        const errorData = await response.json();
        onError(errorData.error || 'Failed to create scheduled scan');
      }
    } catch (error) {
      onError('Failed to create scheduled scan');
    } finally {
      setLoading(false);
    }
  };

  const addEmailField = () => {
    setFormData(prev => ({
      ...prev,
      notificationEmails: [...prev.notificationEmails, '']
    }));
  };

  const removeEmailField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notificationEmails: prev.notificationEmails.filter((_, i) => i !== index)
    }));
  };

  const updateEmailField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      notificationEmails: prev.notificationEmails.map((email, i) => i === index ? value : email)
    }));
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <h4 className="text-lg font-medium text-gray-900 mb-6">Create Scheduled Scan</h4>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scan Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Daily homepage scan"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                frequency: e.target.value as 'daily' | 'weekly' | 'monthly'
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {formData.frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day of Week
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>
          )}

          {formData.frequency === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day of Month
              </label>
              <select
                value={formData.dayOfMonth}
                onChange={(e) => setFormData(prev => ({ ...prev, dayOfMonth: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {[...Array(31)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time
            </label>
            <input
              type="time"
              value={formData.timeOfDay}
              onChange={(e) => setFormData(prev => ({ ...prev, timeOfDay: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="emailNotifications"
              checked={formData.emailNotifications}
              onChange={(e) => setFormData(prev => ({ ...prev, emailNotifications: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
              Send email notifications when scans complete
            </label>
          </div>

          {formData.emailNotifications && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Notification Emails
              </label>
              {formData.notificationEmails.map((email, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmailField(index, e.target.value)}
                    placeholder="email@example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {formData.notificationEmails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmailField(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addEmailField}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add another email
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Edit Form Component (simplified version for brevity)
function EditScheduledScanForm({ scan, onCancel, onSuccess, onError }: {
  scan: ScheduledScan;
  onCancel: () => void;
  onSuccess: (scan: ScheduledScan) => void;
  onError: (error: string) => void;
}) {
  // Similar implementation to CreateScheduledScanForm but pre-populated with scan data
  // For brevity, I'll implement a simplified version
  const [formData, setFormData] = useState({
    name: scan.name,
    isActive: scan.isActive,
    emailNotifications: scan.emailNotifications,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/analysis/website/scheduled/${scan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess(data.data);
      } else {
        const errorData = await response.json();
        onError(errorData.error || 'Failed to update scan');
      }
    } catch (error) {
      onError('Failed to update scan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <h4 className="text-lg font-medium text-gray-900 mb-6">Edit Scheduled Scan</h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scan Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.emailNotifications}
              onChange={(e) => setFormData(prev => ({ ...prev, emailNotifications: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Email Notifications</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
}