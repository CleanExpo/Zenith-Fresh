/**
 * Error Boundaries Export Module
 * 
 * Centralized exports for all error boundary components
 */

// Base error boundary
export { BaseErrorBoundary } from './BaseErrorBoundary';

// Provider
export { ErrorBoundaryProvider } from './ErrorBoundaryProvider';

// Specialized error boundaries
export { 
  DashboardErrorBoundary,
  AnalyticsErrorBoundary,
  MetricsErrorBoundary,
  ChartErrorBoundary
} from './DashboardErrorBoundary';

export {
  WebsiteAnalyzerErrorBoundary,
  ScanFormErrorBoundary,
  AnalysisResultsErrorBoundary,
  ReportGenerationErrorBoundary,
  PerformanceAnalysisErrorBoundary
} from './WebsiteAnalyzerErrorBoundary';

export {
  AuthErrorBoundary,
  SignInErrorBoundary,
  SignUpErrorBoundary,
  SessionErrorBoundary,
  OAuthErrorBoundary
} from './AuthErrorBoundary';

export {
  TeamsErrorBoundary,
  TeamListErrorBoundary,
  TeamDetailsErrorBoundary,
  TeamMembersErrorBoundary,
  TeamSettingsErrorBoundary,
  TeamInvitationsErrorBoundary
} from './TeamsErrorBoundary';

// Re-export error tracking utilities
export {
  initializeErrorTracking,
  trackError,
  getErrorMetrics,
  checkSystemHealth
} from '@/lib/monitoring/errorTracking';