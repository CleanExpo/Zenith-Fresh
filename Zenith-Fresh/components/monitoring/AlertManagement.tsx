'use client';

import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  InformationCircleIcon,
  EyeIcon,
  XMarkIcon,
  BellIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface Alert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: number;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  resolvedBy?: string;
  resolvedAt?: number;
  metadata?: any;
}

interface AlertSummary {
  total: number;
  active: number;
  critical: number;
  warning: number;
  info: number;
  acknowledged: number;
  resolved: number;
}

export function AlertManagement() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedLevel !== 'all') params.append('level', selectedLevel);
      params.append('limit', '100');
      
      const response = await fetch(`/api/monitoring/alerts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      
      const data = await response.json();
      setAlerts(data.alerts);
      setSummary(data.summary);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [selectedStatus, selectedLevel]);

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <BellIcon className="h-4 w-4 text-red-500" />;
      case 'acknowledged':
        return <EyeIcon className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAlertColor = (level: string, status: string) => {
    if (status === 'resolved') return 'bg-gray-50 border-gray-200';
    
    switch (level) {
      case 'critical':
        return 'bg-red-50 border-red-200 border-l-4 border-l-red-500';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-500';
      case 'info':
        return 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'resolve') => {
    try {
      setActionLoading(alertId);
      
      const response = await fetch('/api/monitoring/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alertId,
          status: action === 'acknowledge' ? 'acknowledged' : 'resolved',
          acknowledgedBy: action === 'acknowledge' ? 'user' : undefined,
          resolvedBy: action === 'resolve' ? 'user' : undefined
        })
      });

      if (!response.ok) throw new Error('Failed to update alert');
      
      // Refresh alerts
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to update alert:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <XCircleIcon className="h-6 w-6 text-red-500" />
          <h3 className="ml-3 text-lg font-medium text-red-800">Error Loading Alerts</h3>
        </div>
        <p className="mt-2 text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{summary.active}</div>
            <div className="text-sm text-red-500">Active</div>
          </div>
          <div className="bg-red-100 rounded-lg border border-red-300 p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{summary.critical}</div>
            <div className="text-sm text-red-600">Critical</div>
          </div>
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.warning}</div>
            <div className="text-sm text-yellow-500">Warning</div>
          </div>
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.info}</div>
            <div className="text-sm text-blue-500">Info</div>
          </div>
          <div className="bg-yellow-100 rounded-lg border border-yellow-300 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700">{summary.acknowledged}</div>
            <div className="text-sm text-yellow-600">Acknowledged</div>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{summary.resolved}</div>
            <div className="text-sm text-green-500">Resolved</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {loading && alerts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading alerts...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedStatus === 'all' ? 'All systems are healthy!' : `No ${selectedStatus} alerts at this time.`}
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getAlertColor(alert.level, alert.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getAlertIcon(alert.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        alert.level === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.level.toUpperCase()}
                      </span>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(alert.status)}
                        <span className="text-xs text-gray-500 capitalize">{alert.status}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-3 w-3" />
                        <span>{formatTimestamp(alert.timestamp)}</span>
                      </div>
                      <div>Source: {alert.source}</div>
                      {alert.acknowledgedBy && (
                        <div className="flex items-center space-x-1">
                          <UserIcon className="h-3 w-3" />
                          <span>Ack: {alert.acknowledgedBy}</span>
                        </div>
                      )}
                      {alert.resolvedBy && (
                        <div className="flex items-center space-x-1">
                          <CheckCircleIcon className="h-3 w-3" />
                          <span>Resolved: {alert.resolvedBy}</span>
                        </div>
                      )}
                    </div>

                    {alert.metadata && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                        <strong>Details:</strong> {JSON.stringify(alert.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {alert.status === 'active' && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                      disabled={actionLoading === alert.id}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      <EyeIcon className="h-3 w-3 mr-1" />
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleAlertAction(alert.id, 'resolve')}
                      disabled={actionLoading === alert.id}
                      className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Resolve
                    </button>
                  </div>
                )}

                {alert.status === 'acknowledged' && (
                  <div className="ml-4">
                    <button
                      onClick={() => handleAlertAction(alert.id, 'resolve')}
                      disabled={actionLoading === alert.id}
                      className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}