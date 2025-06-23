/**
 * Structured logging system for Zenith Fresh
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor(context = 'app') {
    this.context = context;
    this.level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG');
  }

  shouldLog(level) {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.level];
  }

  formatLog(level, message, data = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      data,
      environment: process.env.NODE_ENV || 'development',
      ...(process.env.VERCEL && { vercel: true })
    };
  }

  error(message, error = null, data = {}) {
    if (!this.shouldLog('ERROR')) return;
    
    const logEntry = this.formatLog('ERROR', message, {
      ...data,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    });
    
    console.error(JSON.stringify(logEntry));
    
    // In production, could send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService('error', logEntry);
    }
  }

  warn(message, data = {}) {
    if (!this.shouldLog('WARN')) return;
    
    const logEntry = this.formatLog('WARN', message, data);
    console.warn(JSON.stringify(logEntry));
  }

  info(message, data = {}) {
    if (!this.shouldLog('INFO')) return;
    
    const logEntry = this.formatLog('INFO', message, data);
    console.log(JSON.stringify(logEntry));
  }

  debug(message, data = {}) {
    if (!this.shouldLog('DEBUG')) return;
    
    const logEntry = this.formatLog('DEBUG', message, data);
    console.debug(JSON.stringify(logEntry));
  }

  // API request logging
  apiRequest(method, path, statusCode, duration, data = {}) {
    this.info('API Request', {
      type: 'api_request',
      method,
      path,
      statusCode,
      duration,
      ...data
    });
  }

  // Authentication events
  authEvent(event, userId, data = {}) {
    this.info('Authentication Event', {
      type: 'auth_event',
      event,
      userId,
      ...data
    });
  }

  // Security events
  securityEvent(event, severity, data = {}) {
    const logMethod = severity === 'high' ? 'error' : 'warn';
    this[logMethod]('Security Event', {
      type: 'security_event',
      event,
      severity,
      ...data
    });
  }

  // Performance metrics
  performance(metric, value, data = {}) {
    this.info('Performance Metric', {
      type: 'performance',
      metric,
      value,
      ...data
    });
  }

  // Business events
  businessEvent(event, data = {}) {
    this.info('Business Event', {
      type: 'business_event',
      event,
      ...data
    });
  }

  sendToExternalService(level, logEntry) {
    // Placeholder for external logging service integration
    // Could integrate with Sentry, LogRocket, DataDog, etc.
    try {
      // Example: Send to webhook endpoint
      if (process.env.LOG_WEBHOOK_URL) {
        fetch(process.env.LOG_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        }).catch(error => {
          console.error('Failed to send log to external service:', error);
        });
      }
    } catch (error) {
      console.error('External logging failed:', error);
    }
  }
}

// Create logger instances for different contexts
export const logger = new Logger('app');
export const apiLogger = new Logger('api');
export const authLogger = new Logger('auth');
export const securityLogger = new Logger('security');

// Convenience function to create loggers with custom context
export function createLogger(context) {
  return new Logger(context);
}

export default logger;