/**
 * Application monitoring utilities for Zenith Fresh
 */

import { logger } from './logger.js';

class Monitor {
  constructor() {
    this.startTime = Date.now();
    this.metrics = new Map();
    this.alerts = [];
  }

  // Track application metrics
  trackMetric(name, value, tags = {}) {
    const timestamp = Date.now();
    const metric = {
      name,
      value,
      tags,
      timestamp
    };

    // Store recent metrics (last 100 per metric)
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricHistory = this.metrics.get(name);
    metricHistory.push(metric);
    
    // Keep only last 100 entries
    if (metricHistory.length > 100) {
      metricHistory.shift();
    }

    logger.performance(name, value, tags);

    // Check for alerts
    this.checkAlerts(name, value, tags);
  }

  // Track API response times
  trackApiCall(path, method, statusCode, startTime) {
    const duration = Date.now() - startTime;
    
    this.trackMetric('api_response_time', duration, {
      path,
      method,
      statusCode
    });

    this.trackMetric('api_call_count', 1, {
      path,
      method,
      statusCode
    });

    // Track error rates
    if (statusCode >= 400) {
      this.trackMetric('api_error_count', 1, {
        path,
        method,
        statusCode
      });
    }
  }

  // Track user actions
  trackUserAction(action, userId, metadata = {}) {
    this.trackMetric('user_action', 1, {
      action,
      userId,
      ...metadata
    });

    logger.businessEvent(action, { userId, ...metadata });
  }

  // Track authentication events
  trackAuth(event, userId, success = true, metadata = {}) {
    this.trackMetric('auth_event', 1, {
      event,
      userId,
      success,
      ...metadata
    });

    if (!success) {
      this.trackMetric('auth_failure', 1, {
        event,
        userId,
        ...metadata
      });
    }

    logger.authEvent(event, userId, { success, ...metadata });
  }

  // Track security events
  trackSecurity(event, severity = 'medium', metadata = {}) {
    this.trackMetric('security_event', 1, {
      event,
      severity,
      ...metadata
    });

    logger.securityEvent(event, severity, metadata);

    // Add to alerts if high severity
    if (severity === 'high') {
      this.addAlert('security', `Security event: ${event}`, metadata);
    }
  }

  // Add alert
  addAlert(type, message, metadata = {}) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: Date.now(),
      metadata,
      acknowledged: false
    };

    this.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }

    logger.error('Alert triggered', null, alert);
  }

  // Check for alert conditions
  checkAlerts(metricName, value, tags) {
    const thresholds = {
      'api_response_time': { max: 5000, message: 'High API response time' },
      'api_error_count': { max: 10, message: 'High API error rate' },
      'memory_usage': { max: 85, message: 'High memory usage' },
      'auth_failure': { max: 5, message: 'Multiple authentication failures' }
    };

    const threshold = thresholds[metricName];
    if (!threshold) return;

    if (value > threshold.max) {
      this.addAlert('threshold', threshold.message, {
        metric: metricName,
        value,
        threshold: threshold.max,
        tags
      });
    }
  }

  // Get metrics summary
  getMetricsSummary() {
    const summary = {};
    
    for (const [name, history] of this.metrics.entries()) {
      if (history.length === 0) continue;
      
      const values = history.map(m => m.value);
      const recent = history.slice(-10); // Last 10 measurements
      
      summary[name] = {
        count: history.length,
        latest: values[values.length - 1],
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        recent: recent.map(m => ({ value: m.value, timestamp: m.timestamp }))
      };
    }
    
    return summary;
  }

  // Get active alerts
  getActiveAlerts() {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  // Acknowledge alert
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
    }
  }

  // Health check
  getHealthStatus() {
    const uptime = Date.now() - this.startTime;
    const activeAlerts = this.getActiveAlerts();
    const metrics = this.getMetricsSummary();
    
    // Determine overall health
    let status = 'healthy';
    let issues = [];
    
    // Check for critical alerts
    const criticalAlerts = activeAlerts.filter(a => a.type === 'security' || a.type === 'threshold');
    if (criticalAlerts.length > 0) {
      status = 'degraded';
      issues.push(`${criticalAlerts.length} critical alerts`);
    }
    
    // Check API error rates
    const apiErrors = metrics['api_error_count'];
    if (apiErrors && apiErrors.latest > 5) {
      status = 'degraded';
      issues.push('High API error rate');
    }
    
    return {
      status,
      uptime,
      issues,
      alertCount: activeAlerts.length,
      metrics: Object.keys(metrics).length,
      timestamp: Date.now()
    };
  }
}

// Create global monitor instance
export const monitor = new Monitor();

// Convenience functions
export function trackMetric(name, value, tags) {
  monitor.trackMetric(name, value, tags);
}

export function trackApiCall(path, method, statusCode, startTime) {
  monitor.trackApiCall(path, method, statusCode, startTime);
}

export function trackUserAction(action, userId, metadata) {
  monitor.trackUserAction(action, userId, metadata);
}

export function trackAuth(event, userId, success, metadata) {
  monitor.trackAuth(event, userId, success, metadata);
}

export function trackSecurity(event, severity, metadata) {
  monitor.trackSecurity(event, severity, metadata);
}

export default monitor;