'use client';

import React, { ReactNode } from 'react';
import { BaseErrorBoundary } from './BaseErrorBoundary';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardErrorBoundaryProps {
  children: ReactNode;
  section?: 'overview' | 'analytics' | 'metrics' | 'charts';
}

/**
 * Dashboard Error Boundary
 * 
 * Specialized error boundary for dashboard components with
 * dashboard-specific fallback UI and error handling
 */
export function DashboardErrorBoundary({ children, section }: DashboardErrorBoundaryProps) {
  const sectionName = section ? `Dashboard ${section}` : 'Dashboard';

  const dashboardFallback = (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-blue-800">{sectionName} Unavailable</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-blue-700">
            We&apos;re having trouble loading your dashboard data. This might be due to:
          </p>
          <ul className="text-blue-700 text-sm space-y-1 ml-4">
            <li>• Temporary network connectivity issues</li>
            <li>• High server load affecting data retrieval</li>
            <li>• A temporary service interruption</li>
          </ul>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Refresh Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <BaseErrorBoundary
      name={sectionName}
      level="section"
      fallback={dashboardFallback}
      enableRetry={true}
      enableReporting={true}
      onError={(error, errorInfo, errorId) => {
        // Dashboard-specific error handling
        console.error(`Dashboard Error (${section}):`, {
          error,
          errorInfo,
          errorId,
          section,
          timestamp: new Date().toISOString()
        });

        // Track dashboard errors for analytics
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dashboard-error', {
            detail: { section, errorId, error: error.message }
          }));
        }
      }}
    >
      {children}
    </BaseErrorBoundary>
  );
}

/**
 * Analytics Section Error Boundary
 * 
 * Specialized for analytics components with data-loading fallbacks
 */
export function AnalyticsErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <DashboardErrorBoundary section="analytics">
      {children}
    </DashboardErrorBoundary>
  );
}

/**
 * Metrics Error Boundary
 * 
 * For real-time metrics and monitoring components
 */
export function MetricsErrorBoundary({ children }: { children: ReactNode }) {
  const metricsFallback = (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center space-x-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-gray-500" />
        <span className="text-gray-700 font-medium">Metrics Unavailable</span>
      </div>
      <p className="text-gray-600 text-sm">
        Real-time metrics are temporarily unavailable. Historical data may still be accessible.
      </p>
    </div>
  );

  return (
    <BaseErrorBoundary
      name="Metrics"
      level="component"
      fallback={metricsFallback}
      enableRetry={true}
      enableReporting={true}
    >
      {children}
    </BaseErrorBoundary>
  );
}

/**
 * Chart Error Boundary
 * 
 * For chart and visualization components
 */
export function ChartErrorBoundary({ children, chartType }: { children: ReactNode; chartType?: string }) {
  const chartFallback = (
    <div className="border border-gray-200 rounded-lg p-8 bg-gray-50 text-center">
      <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
      <p className="text-gray-600 font-medium">Chart Unavailable</p>
      <p className="text-gray-500 text-sm mt-1">
        {chartType ? `${chartType} chart` : 'Chart'} failed to render
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => window.location.reload()}
      >
        Reload Chart
      </Button>
    </div>
  );

  return (
    <BaseErrorBoundary
      name={`Chart${chartType ? ` (${chartType})` : ''}`}
      level="component"
      fallback={chartFallback}
      enableRetry={true}
      enableReporting={true}
    >
      {children}
    </BaseErrorBoundary>
  );
}

export default DashboardErrorBoundary;