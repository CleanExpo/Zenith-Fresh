import * as Sentry from '@sentry/nextjs';

interface SentryContext {
  [key: string]: any;
}

export function captureException(error: Error, context?: SentryContext) {
  // Always capture in production, and also in development if DSN is configured
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context) {
        Object.keys(context).forEach((key) => {
          scope.setContext(key, context[key]);
        });
      }
      Sentry.captureException(error);
    });
  }
  
  // Always log to console for debugging
  console.error('Error:', error, context);
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
  
  console.log(`[${level}]:`, message);
}

export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

export function addBreadcrumb(breadcrumb: { message: string; category?: string; level?: Sentry.SeverityLevel }) {
  Sentry.addBreadcrumb(breadcrumb);
}

// Export simple logger for structured logging
export const logger = {
  info: (message: string, extra?: any) => console.log(message, extra),
  warn: (message: string, extra?: any) => console.warn(message, extra),
  error: (message: string, extra?: any) => console.error(message, extra),
  debug: (message: string, extra?: any) => console.debug(message, extra),
};

// Export Sentry for span instrumentation
export { Sentry };