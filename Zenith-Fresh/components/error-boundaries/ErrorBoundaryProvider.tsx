'use client';

import React, { ReactNode, useEffect } from 'react';
import { BaseErrorBoundary } from './BaseErrorBoundary';
import { initializeErrorTracking } from '@/lib/monitoring/errorTracking';

interface ErrorBoundaryProviderProps {
  children: ReactNode;
}

/**
 * Error Boundary Provider
 * 
 * Root-level error boundary that wraps the entire application
 * and initializes error tracking
 */
export function ErrorBoundaryProvider({ children }: ErrorBoundaryProviderProps) {
  useEffect(() => {
    // Initialize error tracking on client side
    initializeErrorTracking();
  }, []);

  return (
    <BaseErrorBoundary
      name="Application Root"
      level="page"
      enableRetry={true}
      enableReporting={true}
      onError={(error, errorInfo, errorId) => {
        // Root-level error handling
        console.error('APPLICATION ERROR:', {
          errorId,
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        });

        // Dispatch custom event for application monitoring
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('app-error', {
            detail: { 
              errorId, 
              error: error.message,
              level: 'application',
              timestamp: new Date().toISOString()
            }
          }));
        }
      }}
    >
      {children}
    </BaseErrorBoundary>
  );
}

export default ErrorBoundaryProvider;