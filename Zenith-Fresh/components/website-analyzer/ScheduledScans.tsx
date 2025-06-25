'use client';

import React, { useState } from 'react';
import { 
  ClockIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

interface ScheduledScansProps {
  scheduledScans: any[];
  onScheduledScanCreated: (scheduledScan: any) => void;
  onScheduledScanUpdated: (scheduledScan: any) => void;
  onScheduledScanDeleted: (scheduledScanId: string) => void;
}

export default function ScheduledScans({ 
  scheduledScans, 
  onScheduledScanCreated, 
  onScheduledScanUpdated, 
  onScheduledScanDeleted 
}: ScheduledScansProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingScan, setEditingScan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const schedulePresets = [
    { value: 'daily', label: 'Daily at 9 AM', cron: '0 9 * * *' },
    { value: 'weekly', label: 'Weekly (Monday at 9 AM)', cron: '0 9 * * 1' },
    { value: 'monthly', label: 'Monthly (1st at 9 AM)', cron: '0 9 1 * *' },
    { value: 'custom', label: 'Custom schedule', cron: '' },
  ];

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
    return 'soon';
  };

  const toggleScan = async (scanId: string, isActive: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('/api/website-analyzer/scheduled-scans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: scanId,
          isActive: !isActive,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onScheduledScanUpdated(data.scheduledScan);
      }
    } catch (error) {
      console.error('Failed to toggle scan:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteScan = async (scanId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled scan?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/website-analyzer/scheduled-scans?id=${scanId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onScheduledScanDeleted(scanId);
      }
    } catch (error) {
      console.error('Failed to delete scan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (scheduledScans.length === 0 && !showCreateForm) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled scans</h3>
        <p className="mt-1 text-sm text-gray-500">
          Set up automated scanning to monitor your websites continuously.
        </p>
        <div className="mt-6">
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Scheduled Scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Scheduled Scans</h3>
          <p className="text-sm text-gray-500">
            Automatically scan your websites at regular intervals
          </p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Schedule
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <CreateScheduledScanForm
          schedulePresets={schedulePresets}
          onCancel={() => setShowCreateForm(false)}
          onSuccess={(scan) => {
            onScheduledScanCreated(scan);
            setShowCreateForm(false);
          }}
        />
      )}

      {/* Scheduled Scans List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900">
            Active Schedules ({scheduledScans.filter(s => s.isActive).length})
          </h4>
        </div>
        <div className="divide-y divide-gray-200">
          {scheduledScans.map((scan) => (
            <div key={scan.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${scan.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-gray-900 truncate">
                        {scan.name}
                      </h5>
                      <p className="text-sm text-gray-500 truncate">
                        {scan.project.name} - {scan.project.url}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                    <span>Schedule: {scan.schedule}</span>
                    {scan.nextRun && scan.isActive && (
                      <span>Next run: {formatNextRun(scan.nextRun)}</span>
                    )}
                    {scan.lastRun && (
                      <span>Last run: {new Date(scan.lastRun).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleScan(scan.id, scan.isActive)}
                    disabled={loading}
                    className={`p-2 rounded-md ${
                      scan.isActive
                        ? 'text-orange-600 hover:bg-orange-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
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
                    className="p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-md"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteScan(scan.id)}
                    disabled={loading}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
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
    </div>
  );
}

function CreateScheduledScanForm({ schedulePresets, onCancel, onSuccess }: any) {
  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    schedule: 'daily',
    customCron: '',
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.projectId || !formData.name) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const schedule = formData.schedule === 'custom' ? formData.customCron : formData.schedule;
      
      const response = await fetch('/api/website-analyzer/scheduled-scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: formData.projectId,
          name: formData.name,
          schedule,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess(data.scheduledScan);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create scheduled scan');
      }
    } catch (error) {
      setError('Failed to create scheduled scan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <h4 className="text-lg font-medium text-gray-900 mb-4">Create Scheduled Scan</h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project *
          </label>
          <select
            value={formData.projectId}
            onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a project</option>
            {projects.map((project: any) => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.url}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Schedule
          </label>
          <select
            value={formData.schedule}
            onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {schedulePresets.map((preset: any) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {formData.schedule === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cron Expression
            </label>
            <input
              type="text"
              value={formData.customCron}
              onChange={(e) => setFormData(prev => ({ ...prev, customCron: e.target.value }))}
              placeholder="0 9 * * *"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Format: minute hour day month day-of-week
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
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
            {loading ? 'Creating...' : 'Create Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
}