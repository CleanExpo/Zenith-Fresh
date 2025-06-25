'use client';

import React, { useState, useEffect } from 'react';
import { 
  GlobeAltIcon, 
  PlayIcon, 
  ClockIcon, 
  BellIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

import ScanForm from './ScanForm';
import ScanResults from './ScanResults';
import ScheduledScans from './ScheduledScans';
import NotificationSettings from './NotificationSettings';
import ScanHistory from './ScanHistory';

interface Scan {
  id: string;
  url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  performanceScore?: number;
  accessibilityScore?: number;
  bestPracticesScore?: number;
  seoScore?: number;
  createdAt: string;
  completedAt?: string;
  project: {
    id: string;
    name: string;
  };
  alerts: Array<{
    id: string;
    severity: string;
  }>;
}

interface ScheduledScan {
  id: string;
  name: string;
  schedule: string;
  isActive: boolean;
  nextRun?: string;
  lastRun?: string;
  project: {
    id: string;
    name: string;
    url: string;
  };
}

export default function WebsiteAnalyzerDashboard() {
  const [activeTab, setActiveTab] = useState('scan');
  const [scans, setScans] = useState<Scan[]>([]);
  const [scheduledScans, setScheduledScans] = useState<ScheduledScan[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentScan, setCurrentScan] = useState<Scan | null>(null);

  const tabs = [
    { id: 'scan', name: 'New Scan', icon: PlayIcon },
    { id: 'results', name: 'Results', icon: ChartBarIcon },
    { id: 'scheduled', name: 'Scheduled Scans', icon: ClockIcon },
    { id: 'history', name: 'History', icon: GlobeAltIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
  ];

  useEffect(() => {
    fetchScans();
    fetchScheduledScans();
    
    // Poll for scan updates every 5 seconds
    const interval = setInterval(() => {
      if (currentScan && currentScan.status === 'running') {
        fetchScanDetails(currentScan.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentScan]);

  const fetchScans = async () => {
    try {
      const response = await fetch('/api/website-analyzer/scan');
      if (response.ok) {
        const data = await response.json();
        setScans(data.scans || []);
      }
    } catch (error) {
      console.error('Failed to fetch scans:', error);
    }
  };

  const fetchScheduledScans = async () => {
    try {
      const response = await fetch('/api/website-analyzer/scheduled-scans');
      if (response.ok) {
        const data = await response.json();
        setScheduledScans(data.scheduledScans || []);
      }
    } catch (error) {
      console.error('Failed to fetch scheduled scans:', error);
    }
  };

  const fetchScanDetails = async (scanId: string) => {
    try {
      const response = await fetch(`/api/website-analyzer/scan?scanId=${scanId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.scan) {
          setCurrentScan(data.scan);
          // Update scans list
          setScans(prev => prev.map(scan => 
            scan.id === scanId ? data.scan : scan
          ));
        }
      }
    } catch (error) {
      console.error('Failed to fetch scan details:', error);
    }
  };

  const handleScanStarted = (scan: Scan) => {
    setCurrentScan(scan);
    setScans(prev => [scan, ...prev]);
    setActiveTab('results');
  };

  const handleScanUpdated = (scan: Scan) => {
    setCurrentScan(scan);
    setScans(prev => prev.map(s => s.id === scan.id ? scan : s));
  };

  const handleScheduledScanCreated = (scheduledScan: ScheduledScan) => {
    setScheduledScans(prev => [scheduledScan, ...prev]);
  };

  const handleScheduledScanUpdated = (scheduledScan: ScheduledScan) => {
    setScheduledScans(prev => prev.map(s => s.id === scheduledScan.id ? scheduledScan : s));
  };

  const handleScheduledScanDeleted = (scheduledScanId: string) => {
    setScheduledScans(prev => prev.filter(s => s.id !== scheduledScanId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'running':
        return 'text-blue-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

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

  const recentScans = scans.slice(0, 3);
  const activeAlerts = scans.reduce((count, scan) => count + scan.alerts.length, 0);
  const runningScans = scans.filter(scan => scan.status === 'running').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Website Health Analyzer
        </h1>
        <p className="text-gray-600">
          Monitor your website's performance, accessibility, SEO, and security with automated scanning and alerts.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Scans</p>
              <p className="text-2xl font-bold text-gray-900">{scans.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Running Scans</p>
              <p className="text-2xl font-bold text-gray-900">{runningScans}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{activeAlerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CogIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Scheduled Scans</p>
              <p className="text-2xl font-bold text-gray-900">{scheduledScans.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentScans.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Scans</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentScans.map((scan) => (
              <div key={scan.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(scan.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{scan.url}</p>
                    <p className="text-sm text-gray-500">{scan.project.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {scan.performanceScore && (
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{scan.performanceScore}</p>
                      <p className="text-xs text-gray-500">Performance</p>
                    </div>
                  )}
                  {scan.alerts.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {scan.alerts.length} alert{scan.alerts.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <span className={`text-sm font-medium ${getStatusColor(scan.status)}`}>
                    {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'scan' && (
          <ScanForm 
            onScanStarted={handleScanStarted}
            loading={loading}
            setLoading={setLoading}
          />
        )}

        {activeTab === 'results' && (
          <ScanResults 
            scan={currentScan}
            onScanUpdated={handleScanUpdated}
            onRetry={(scanId) => fetchScanDetails(scanId)}
          />
        )}

        {activeTab === 'scheduled' && (
          <ScheduledScans 
            scheduledScans={scheduledScans}
            onScheduledScanCreated={handleScheduledScanCreated}
            onScheduledScanUpdated={handleScheduledScanUpdated}
            onScheduledScanDeleted={handleScheduledScanDeleted}
          />
        )}

        {activeTab === 'history' && (
          <ScanHistory 
            scans={scans}
            onScanSelected={(scan) => {
              setCurrentScan(scan);
              setActiveTab('results');
            }}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationSettings />
        )}
      </div>
    </div>
  );
}