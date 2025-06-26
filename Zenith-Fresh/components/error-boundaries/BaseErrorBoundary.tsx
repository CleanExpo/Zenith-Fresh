'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  showDetails: boolean;
}

interface BaseErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  level?: 'page' | 'section' | 'component';
  name?: string;
  enableReporting?: boolean;
  enableRetry?: boolean;
  showDetails?: boolean;
}

interface FallbackUIProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  level: 'page' | 'section' | 'component';
  name?: string;
  onRetry: () => void;
  enableRetry: boolean;
  showDetails: boolean;
  onToggleDetails: () => void;
  onReportError: () => void;
}

/**
 * Base Error Boundary Component
 * 
 * Provides comprehensive error handling with:
 * - Automatic error logging and reporting
 * - Graceful fallback UI based on error level
 * - Error retry mechanisms
 * - Production error tracking
 * - User-friendly error messages
 */
export class BaseErrorBoundary extends Component<BaseErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: BaseErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: props.showDetails ?? false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, enableReporting = true, name } = this.props;
    const { errorId } = this.state;

    this.setState({ errorInfo });

    // Log error details
    console.error(`Error Boundary (${name || 'Unknown'}):`, {
      error,
      errorInfo,
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    });

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo, errorId);
    }

    // Report to monitoring service in production
    if (enableReporting && typeof window !== 'undefined') {
      this.reportError(error, errorInfo, errorId);
    }
  }

  private async reportError(error: Error, errorInfo: ErrorInfo, errorId: string) {
    try {
      // Report to internal error tracking API
      await fetch('/api/monitoring/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          errorId,
          name: error.name,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          level: this.props.level || 'component',
          componentName: this.props.name,
          url: window.location.href,
          userAgent: window.navigator.userAgent,
          userId: this.getUserId(),
          sessionId: this.getSessionId()
        })
      });

      // Report to external monitoring services (Sentry, etc.)
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry.captureException(error, { extra: { errorInfo, errorId } });
        console.log('Error reported to monitoring service:', errorId);
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  private getUserId(): string | null {
    try {
      if (typeof window !== 'undefined') {
        // Try to get user ID from session storage or local storage
        return sessionStorage.getItem('userId') || localStorage.getItem('userId');
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  }

  private getSessionId(): string | null {
    try {
      if (typeof window !== 'undefined') {
        return sessionStorage.getItem('sessionId');
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false
    });
  };

  private handleToggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  private handleReportError = async () => {
    const { error, errorInfo, errorId } = this.state;
    if (error && errorInfo) {
      await this.reportError(error, errorInfo, errorId);
      // Show success feedback
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('error-reported', { detail: { errorId } });
        window.dispatchEvent(event);
      }
    }
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <FallbackUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          level={this.props.level || 'component'}
          name={this.props.name}
          onRetry={this.handleRetry}
          enableRetry={this.props.enableRetry ?? true}
          showDetails={this.state.showDetails}
          onToggleDetails={this.handleToggleDetails}
          onReportError={this.handleReportError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Fallback UI Component
 * 
 * Renders appropriate error UI based on error level
 */
function FallbackUI({
  error,
  errorInfo,
  errorId,
  level,
  name,
  onRetry,
  enableRetry,
  showDetails,
  onToggleDetails,
  onReportError
}: FallbackUIProps) {
  const isDevMode = process.env.NODE_ENV === 'development';

  // Page-level error (most severe)
  if (level === 'page') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-red-800">Page Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-700 text-center">
                We&apos;re sorry, but something went wrong loading this page.
              </p>
              
              <div className="flex flex-col space-y-2">
                {enableRetry && (
                  <Button onClick={onRetry} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}
                <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {(isDevMode || showDetails) && (
                <ErrorDetails
                  error={error}
                  errorInfo={errorInfo}
                  errorId={errorId}
                  showDetails={showDetails}
                  onToggleDetails={onToggleDetails}
                  onReportError={onReportError}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Section-level error
  if (level === 'section') {
    return (
      <Card className="border-orange-200 bg-orange-50 my-4">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-orange-800 font-medium mb-2">
                {name ? `${name} Error` : 'Section Error'}
              </h3>
              <p className="text-orange-700 text-sm mb-4">
                This section encountered an error and couldn&apos;t load properly.
              </p>
              
              {enableRetry && (
                <Button variant="outline" size="sm" onClick={onRetry} className="mr-2">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Retry
                </Button>
              )}

              {(isDevMode || showDetails) && (
                <ErrorDetails
                  error={error}
                  errorInfo={errorInfo}
                  errorId={errorId}
                  showDetails={showDetails}
                  onToggleDetails={onToggleDetails}
                  onReportError={onReportError}
                  compact
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Component-level error (least severe)
  return (
    <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 my-2">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-4 h-4 text-yellow-600" />
        <span className="text-yellow-800 text-sm font-medium">
          {name ? `${name} failed to load` : 'Component error'}
        </span>
        {enableRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="ml-auto">
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
      </div>

      {(isDevMode || showDetails) && (
        <ErrorDetails
          error={error}
          errorInfo={errorInfo}
          errorId={errorId}
          showDetails={showDetails}
          onToggleDetails={onToggleDetails}
          onReportError={onReportError}
          compact
        />
      )}
    </div>
  );
}

/**
 * Error Details Component
 * 
 * Shows detailed error information (dev mode or when requested)
 */
interface ErrorDetailsProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  showDetails: boolean;
  onToggleDetails: () => void;
  onReportError: () => void;
  compact?: boolean;
}

function ErrorDetails({
  error,
  errorInfo,
  errorId,
  showDetails,
  onToggleDetails,
  onReportError,
  compact
}: ErrorDetailsProps) {
  return (
    <div className={`${compact ? 'mt-2' : 'mt-4'} border-t pt-3`}>
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleDetails}
          className="text-xs"
        >
          {showDetails ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReportError}
          className="text-xs"
        >
          <Bug className="w-3 h-3 mr-1" />
          Report
        </Button>
      </div>

      {showDetails && (
        <div className="space-y-2 text-xs">
          <div>
            <strong>Error ID:</strong> {errorId}
          </div>
          {error && (
            <div>
              <strong>Message:</strong> {error.message}
            </div>
          )}
          {error?.stack && (
            <details className="bg-gray-100 p-2 rounded">
              <summary className="cursor-pointer font-medium">Stack Trace</summary>
              <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">
                {error.stack}
              </pre>
            </details>
          )}
          {errorInfo?.componentStack && (
            <details className="bg-gray-100 p-2 rounded">
              <summary className="cursor-pointer font-medium">Component Stack</summary>
              <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">
                {errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default BaseErrorBoundary;