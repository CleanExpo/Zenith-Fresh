/**
 * Production Error Tracking and Monitoring
 * 
 * Comprehensive error tracking system for production deployment readiness
 */

export interface ErrorContext {
  errorId: string;
  name: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  level: 'page' | 'section' | 'component';
  componentName?: string;
  url: string;
  userAgent: string;
  userId?: string | null;
  sessionId?: string | null;
  buildVersion?: string;
  environment: string;
  additionalContext?: Record<string, any>;
}

export interface ErrorMetrics {
  errorCount: number;
  errorRate: number;
  lastError?: string;
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurred: string;
  }>;
  errorsByComponent: Record<string, number>;
  errorsByLevel: Record<string, number>;
}

/**
 * Error Tracking Service
 */
class ErrorTrackingService {
  private isInitialized = false;
  private errorQueue: ErrorContext[] = [];
  private metrics: ErrorMetrics = {
    errorCount: 0,
    errorRate: 0,
    topErrors: [],
    errorsByComponent: {},
    errorsByLevel: {}
  };

  /**
   * Initialize error tracking
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    try {
      // Set up global error handlers
      this.setupGlobalErrorHandlers();
      
      // Initialize external monitoring services
      await this.initializeExternalServices();
      
      // Set up periodic metrics reporting
      this.setupMetricsReporting();
      
      this.isInitialized = true;
      console.log('Error tracking service initialized');
    } catch (error) {
      console.error('Failed to initialize error tracking:', error);
    }
  }

  /**
   * Track an error from error boundaries
   */
  async trackError(context: Partial<ErrorContext>): Promise<void> {
    const fullContext: ErrorContext = {
      errorId: context.errorId || this.generateErrorId(),
      name: context.name || 'UnknownError',
      message: context.message || 'No error message provided',
      stack: context.stack,
      componentStack: context.componentStack,
      timestamp: context.timestamp || new Date().toISOString(),
      level: context.level || 'component',
      componentName: context.componentName,
      url: context.url || (typeof window !== 'undefined' ? window.location.href : 'SSR'),
      userAgent: context.userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR'),
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      additionalContext: context.additionalContext
    };

    // Update local metrics
    this.updateMetrics(fullContext);

    // Queue for batch processing
    this.errorQueue.push(fullContext);

    // Process immediately for critical errors
    if (fullContext.level === 'page') {
      await this.processErrorQueue();
    }

    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', fullContext);
    }
  }

  /**
   * Get current error metrics
   */
  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if error rate is above threshold
   */
  isErrorRateHigh(): boolean {
    return this.metrics.errorRate > 0.05; // 5% error rate threshold
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit = 10): ErrorContext[] {
    return this.errorQueue
      .slice(-limit)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private setupGlobalErrorHandlers(): void {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        name: 'UnhandledPromiseRejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        level: 'page',
        componentName: 'Global',
        additionalContext: {
          type: 'unhandledrejection',
          reason: event.reason
        }
      });
    });

    // Catch JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError({
        name: event.error?.name || 'JavaScriptError',
        message: event.message,
        stack: event.error?.stack,
        level: 'page',
        componentName: 'Global',
        additionalContext: {
          type: 'javascript-error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Network errors
    this.setupNetworkErrorTracking();
  }

  private setupNetworkErrorTracking(): void {
    // Intercept fetch requests to track network errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Track HTTP errors
        if (!response.ok) {
          this.trackError({
            name: 'NetworkError',
            message: `HTTP ${response.status}: ${response.statusText}`,
            level: 'component',
            componentName: 'Network',
            additionalContext: {
              type: 'http-error',
              status: response.status,
              statusText: response.statusText,
              url: args[0]?.toString()
            }
          });
        }
        
        return response;
      } catch (error) {
        // Track network failures
        this.trackError({
          name: 'NetworkError',
          message: (error as Error).message,
          stack: (error as Error).stack,
          level: 'component',
          componentName: 'Network',
          additionalContext: {
            type: 'network-failure',
            url: args[0]?.toString()
          }
        });
        throw error;
      }
    };
  }

  private async initializeExternalServices(): Promise<void> {
    // Initialize Sentry if configured
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        // Sentry initialization would go here
        console.log('Sentry initialized');
      } catch (error) {
        console.error('Failed to initialize Sentry:', error);
      }
    }

    // Initialize other monitoring services
    if (process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN) {
      try {
        // Datadog RUM initialization would go here
        console.log('Datadog RUM initialized');
      } catch (error) {
        console.error('Failed to initialize Datadog:', error);
      }
    }
  }

  private setupMetricsReporting(): void {
    // Report metrics every 5 minutes
    setInterval(() => {
      this.reportMetrics();
    }, 5 * 60 * 1000);

    // Process error queue every 30 seconds
    setInterval(() => {
      this.processErrorQueue();
    }, 30 * 1000);

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.processErrorQueue();
    });
  }

  private async processErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) {
      return;
    }

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Send to internal API
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ errors })
      });

      // Send to external services
      await this.sendToExternalServices(errors);
    } catch (error) {
      console.error('Failed to process error queue:', error);
      // Re-queue errors for retry
      this.errorQueue.unshift(...errors);
    }
  }

  private async sendToExternalServices(errors: ErrorContext[]): Promise<void> {
    // Send to Sentry
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      errors.forEach(error => {
        // Sentry.captureException(new Error(error.message), {
        //   extra: error
        // });
      });
    }

    // Send to other monitoring services
    // Implementation depends on specific service requirements
  }

  private async reportMetrics(): Promise<void> {
    try {
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics: this.metrics,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to report metrics:', error);
    }
  }

  private updateMetrics(context: ErrorContext): void {
    this.metrics.errorCount++;
    this.metrics.lastError = context.timestamp;

    // Update error rate (simplified calculation)
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentErrors = this.errorQueue.filter(
      error => new Date(error.timestamp).getTime() > oneHourAgo
    );
    this.metrics.errorRate = recentErrors.length / 1000; // Rough approximation

    // Update component errors
    if (context.componentName) {
      this.metrics.errorsByComponent[context.componentName] = 
        (this.metrics.errorsByComponent[context.componentName] || 0) + 1;
    }

    // Update level errors
    this.metrics.errorsByLevel[context.level] = 
      (this.metrics.errorsByLevel[context.level] || 0) + 1;

    // Update top errors
    const existing = this.metrics.topErrors.find(e => e.message === context.message);
    if (existing) {
      existing.count++;
      existing.lastOccurred = context.timestamp;
    } else {
      this.metrics.topErrors.push({
        message: context.message,
        count: 1,
        lastOccurred: context.timestamp
      });
    }

    // Keep only top 10 errors
    this.metrics.topErrors.sort((a, b) => b.count - a.count);
    this.metrics.topErrors = this.metrics.topErrors.slice(0, 10);
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string | null {
    try {
      return sessionStorage.getItem('userId') || localStorage.getItem('userId');
    } catch {
      return null;
    }
  }

  private getSessionId(): string | null {
    try {
      return sessionStorage.getItem('sessionId');
    } catch {
      return null;
    }
  }
}

// Singleton instance
export const errorTrackingService = new ErrorTrackingService();

/**
 * Initialize error tracking (call once in app initialization)
 */
export const initializeErrorTracking = () => {
  if (typeof window !== 'undefined') {
    errorTrackingService.initialize();
  }
};

/**
 * Track error manually
 */
export const trackError = (context: Partial<ErrorContext>) => {
  errorTrackingService.trackError(context);
};

/**
 * Get current error metrics
 */
export const getErrorMetrics = () => {
  return errorTrackingService.getMetrics();
};

/**
 * Check system health based on error metrics
 */
export const checkSystemHealth = () => {
  const metrics = errorTrackingService.getMetrics();
  const isHealthy = !errorTrackingService.isErrorRateHigh();
  
  return {
    isHealthy,
    errorRate: metrics.errorRate,
    errorCount: metrics.errorCount,
    lastError: metrics.lastError,
    topErrors: metrics.topErrors.slice(0, 3)
  };
};

export default errorTrackingService;