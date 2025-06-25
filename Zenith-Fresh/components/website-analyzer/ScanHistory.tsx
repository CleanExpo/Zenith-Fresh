'use client';

import React, { useState } from 'react';
import { 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface ScanHistoryProps {
  scans: any[];
  onScanSelected: (scan: any) => void;
}

export default function ScanHistory({ scans, onScanSelected }: ScanHistoryProps) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'running':
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredScans = scans.filter(scan => {
    if (filter === 'all') return true;
    if (filter === 'alerts') return scan.alerts && scan.alerts.length > 0;
    if (filter === 'completed') return scan.status === 'completed';
    if (filter === 'failed') return scan.status === 'failed';
    return true;
  });

  const sortedScans = [...filteredScans].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'performance':
        aValue = a.performanceScore || 0;
        bValue = b.performanceScore || 0;
        break;
      case 'url':
        aValue = a.url.toLowerCase();
        bValue = b.url.toLowerCase();
        break;
      default:
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (scans.length === 0) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No scan history</h3>
        <p className="mt-1 text-sm text-gray-500">
          Your completed scans will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Scan History</h3>
          <p className="text-sm text-gray-500">
            View and analyze your past website scans
          </p>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FunnelIcon className="h-4 w-4 text-gray-400 mr-2" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All scans ({scans.length})</option>
              <option value="completed">Completed ({scans.filter(s => s.status === 'completed').length})</option>
              <option value="failed">Failed ({scans.filter(s => s.status === 'failed').length})</option>
              <option value="alerts">With alerts ({scans.filter(s => s.alerts?.length > 0).length})</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="date">Date</option>
            <option value="performance">Performance</option>
            <option value="url">URL</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Scans Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Website
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scores
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alerts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedScans.map((scan) => (
              <tr key={scan.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {scan.url}
                    </div>
                    <div className="text-sm text-gray-500">
                      {scan.project?.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(scan.status)}
                    <span className="ml-2 text-sm text-gray-900 capitalize">
                      {scan.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {scan.status === 'completed' ? (
                    <div className="flex space-x-3 text-sm">
                      <span className={`font-medium ${getScoreColor(scan.performanceScore)}`}>
                        P: {scan.performanceScore}
                      </span>
                      <span className={`font-medium ${getScoreColor(scan.accessibilityScore)}`}>
                        A: {scan.accessibilityScore}
                      </span>
                      <span className={`font-medium ${getScoreColor(scan.seoScore)}`}>
                        S: {scan.seoScore}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {scan.alerts && scan.alerts.length > 0 ? (
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm text-red-600">
                        {scan.alerts.length}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(scan.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onScanSelected(scan)}
                    className="flex items-center text-blue-600 hover:text-blue-900"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedScans.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No scans match the current filter.</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {scans.filter(s => s.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {scans.filter(s => s.status === 'failed').length}
          </div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {scans.filter(s => s.alerts?.length > 0).length}
          </div>
          <div className="text-sm text-gray-600">With Alerts</div>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {scans.filter(s => s.status === 'completed').length > 0 
              ? Math.round(scans.filter(s => s.status === 'completed' && s.performanceScore)
                  .reduce((acc, s) => acc + s.performanceScore, 0) / 
                  scans.filter(s => s.status === 'completed' && s.performanceScore).length)
              : 0}
          </div>
          <div className="text-sm text-gray-600">Avg Performance</div>
        </div>
      </div>
    </div>
  );
}