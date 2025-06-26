import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PerformanceMonitoringDashboard } from '@/components/monitoring/PerformanceMonitoringDashboard';
import { ErrorMonitoringDashboard } from '@/components/monitoring/ErrorMonitoringDashboard';
import { MetricsErrorBoundary } from '@/components/error-boundaries';

export const metadata: Metadata = {
  title: 'Performance Monitoring - Zenith Platform',
  description: 'Comprehensive performance monitoring and observability dashboard',
};

export default async function MonitoringPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  // Check if user has monitoring access (can be extended with role-based access)
  const hasMonitoringAccess = true; // For now, all authenticated users have access

  if (!hasMonitoringAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">You don't have permission to access the monitoring dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive observability, performance insights, and error tracking for Zenith Platform
          </p>
        </div>
        
        <div className="space-y-8">
          <MetricsErrorBoundary>
            <ErrorMonitoringDashboard />
          </MetricsErrorBoundary>
          
          <MetricsErrorBoundary>
            <PerformanceMonitoringDashboard />
          </MetricsErrorBoundary>
        </div>
      </div>
    </div>
  );
}