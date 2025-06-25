'use client';

import React, { useState } from 'react';
import { 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

interface ScanResultsProps {
  scan: any;
  onScanUpdated: (scan: any) => void;
  onRetry: (scanId: string) => void;
}

export default function ScanResults({ scan, onScanUpdated, onRetry }: ScanResultsProps) {
  const [activeSection, setActiveSection] = useState('overview');

  if (!scan) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No scan selected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Start a new scan or select a scan from your history to view results.
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    if (score >= 70) return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    return <XCircleIcon className="h-5 w-5 text-red-500" />;
  };

  const getStatusDisplay = () => {
    switch (scan.status) {
      case 'running':
        return (
          <div className="flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
            Scanning in progress...
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center text-yellow-600">
            <ClockIcon className="h-4 w-4 mr-2" />
            Scan queued
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center text-red-600">
            <XCircleIcon className="h-4 w-4 mr-2" />
            Scan failed
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center text-green-600">
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Scan completed
          </div>
        );
      default:
        return scan.status;
    }
  };

  const sections = [
    { id: 'overview', name: 'Overview' },
    { id: 'performance', name: 'Performance' },
    { id: 'accessibility', name: 'Accessibility' },
    { id: 'seo', name: 'SEO' },
    { id: 'security', name: 'Security' },
    { id: 'alerts', name: 'Alerts' },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{scan.url}</h3>
          <p className="text-sm text-gray-500">Project: {scan.project?.name}</p>
          <p className="text-sm text-gray-500">
            Scanned: {scan.completedAt ? formatDate(scan.completedAt) : formatDate(scan.createdAt)}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusDisplay()}
          {scan.status === 'failed' && (
            <button
              onClick={() => onRetry(scan.id)}
              className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Scores Grid */}
      {scan.status === 'completed' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Performance', score: scan.performanceScore },
            { name: 'Accessibility', score: scan.accessibilityScore },
            { name: 'Best Practices', score: scan.bestPracticesScore },
            { name: 'SEO', score: scan.seoScore },
          ].map((metric) => (
            <div key={metric.name} className="bg-white border rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                {getScoreIcon(metric.score)}
              </div>
              <div className={`text-2xl font-bold mb-1 ${getScoreColor(metric.score).split(' ')[0]}`}>
                {metric.score}
              </div>
              <div className="text-sm text-gray-600">{metric.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* Alerts Summary */}
      {scan.alerts && scan.alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <h4 className="text-sm font-medium text-red-800">
              {scan.alerts.length} Alert{scan.alerts.length > 1 ? 's' : ''} Found
            </h4>
          </div>
          <div className="mt-2 text-sm text-red-700">
            Click on the "Alerts" tab to view detailed information about each issue.
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex space-x-4">
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <EyeIcon className="h-4 w-4 mr-2" />
          View Full Report
        </button>
        <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          Export PDF
        </button>
      </div>
    </div>
  );

  const renderPerformance = () => {
    if (!scan.results?.performance) {
      return <div>Performance data not available</div>;
    }

    const metrics = scan.results.performance.metrics;
    
    return (
      <div className="space-y-6">
        <h4 className="text-lg font-medium text-gray-900">Performance Metrics</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'First Contentful Paint', value: metrics.firstContentfulPaint, unit: 'ms', threshold: 1800 },
            { name: 'Largest Contentful Paint', value: metrics.largestContentfulPaint, unit: 'ms', threshold: 2500 },
            { name: 'First Input Delay', value: metrics.firstInputDelay, unit: 'ms', threshold: 100 },
            { name: 'Cumulative Layout Shift', value: metrics.cumulativeLayoutShift, unit: '', threshold: 0.1 },
            { name: 'Speed Index', value: metrics.speedIndex, unit: 'ms', threshold: 3400 },
            { name: 'Total Blocking Time', value: metrics.totalBlockingTime, unit: 'ms', threshold: 200 },
          ].map((metric) => (
            <div key={metric.name} className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-medium text-gray-900">{metric.name}</h5>
                {metric.value <= metric.threshold ? (
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircleIcon className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="text-lg font-bold text-gray-900">
                {metric.value.toFixed(metric.unit === 'ms' ? 0 : 3)}{metric.unit}
              </div>
              <div className="text-xs text-gray-500">
                Good: ≤ {metric.threshold}{metric.unit}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAlerts = () => {
    if (!scan.alerts || scan.alerts.length === 0) {
      return (
        <div className="text-center py-8">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
          <p className="mt-1 text-sm text-gray-500">
            All metrics are within acceptable thresholds.
          </p>
        </div>
      );
    }

    const groupedAlerts = scan.alerts.reduce((acc: any, alert: any) => {
      if (!acc[alert.severity]) acc[alert.severity] = [];
      acc[alert.severity].push(alert);
      return acc;
    }, {});

    const severityOrder = ['critical', 'high', 'medium', 'low'];
    const severityColors = {
      critical: 'bg-red-100 border-red-300 text-red-800',
      high: 'bg-orange-100 border-orange-300 text-orange-800',
      medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      low: 'bg-blue-100 border-blue-300 text-blue-800',
    };

    return (
      <div className="space-y-6">
        {severityOrder.map((severity) => {
          const alerts = groupedAlerts[severity];
          if (!alerts) return null;

          return (
            <div key={severity}>
              <h4 className="text-lg font-medium text-gray-900 mb-4 capitalize">
                {severity} Issues ({alerts.length})
              </h4>
              <div className="space-y-3">
                {alerts.map((alert: any) => (
                  <div key={alert.id} className={`border rounded-lg p-4 ${severityColors[severity as keyof typeof severityColors]}`}>
                    <h5 className="font-medium mb-2">{alert.title}</h5>
                    <p className="text-sm mb-2">{alert.description}</p>
                    {(alert.currentValue !== null || alert.previousValue !== null) && (
                      <div className="text-xs">
                        {alert.currentValue !== null && (
                          <span>Current: {alert.currentValue}</span>
                        )}
                        {alert.previousValue !== null && (
                          <span className="ml-4">Previous: {alert.previousValue}</span>
                        )}
                        {alert.threshold !== null && (
                          <span className="ml-4">Threshold: {alert.threshold}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === section.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {section.name}
              {section.id === 'alerts' && scan.alerts?.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
                  {scan.alerts.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'performance' && renderPerformance()}
        {activeSection === 'alerts' && renderAlerts()}
        {!['overview', 'performance', 'alerts'].includes(activeSection) && (
          <div className="text-center py-8 text-gray-500">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} analysis coming soon...
          </div>
        )}
      </div>
    </div>
  );
}