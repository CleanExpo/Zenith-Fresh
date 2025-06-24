/**
 * Enhanced Sentry Monitoring System
 * 
 * Advanced error tracking, performance monitoring, and autonomous healing integration
 * for the No-BS Production Framework
 */

import * as Sentry from '@sentry/nextjs';
import { redis } from '@/lib/redis';
import { analyticsEngine } from '@/lib/analytics/analytics-enhanced';

interface ErrorContext {
  userId?: string;
  teamId?: string;
  endpoint?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  environment: string;
  release?: string;
  timestamp: Date;
}

interface PerformanceMetrics {
  endpoint: string;
  duration: number;
  statusCode: number;
  method: string;
  userAgent?: string;
  userId?: string;
  timestamp: Date;
}

interface ErrorPattern {
  id: string;
  errorType: string;
  message: string;
  stackTrace: string;
  frequency: number;
  firstSeen: Date;
  lastSeen: Date;
  affectedUsers: Set<string>;
  endpoints: Set<string>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'ignored';
  autonomousHealingCandidate: boolean;
}

interface AlertThresholds {
  errorRate: {
    warning: number; // errors per minute
    critical: number;
  };
  responseTime: {
    warning: number; // milliseconds
    critical: number;
  };
  userImpact: {
    warning: number; // affected users
    critical: number;
  };
}

class EnhancedSentryMonitoring {
  private readonly ERROR_PATTERN_CACHE_TTL = 3600; // 1 hour
  private readonly ALERT_COOLDOWN = 300; // 5 minutes
  private readonly MAX_BREADCRUMBS = 100;
  
  private alertThresholds: AlertThresholds = {
    errorRate: { warning: 10, critical: 50 },
    responseTime: { warning: 2000, critical: 5000 },
    userImpact: { warning: 10, critical: 100 }
  };

  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private lastAlertTime: Map<string, number> = new Map();

  constructor() {
    this.initializeSentry();
    this.setupCustomIntegrations();
    this.startErrorPatternAnalysis();
    console.log('📊 Enhanced Sentry monitoring initialized');
  }

  /**
   * Initialize Sentry with enhanced configuration
   */
  private initializeSentry(): void {
    if (!process.env.SENTRY_DSN) {
      console.warn('⚠️ Sentry DSN not configured, monitoring disabled');
      return;
    }

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      
      // Enhanced sampling for production
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Capture additional context
      beforeSend: (event, hint) => {
        return this.enhanceErrorEvent(event, hint);
      },
      
      beforeSendTransaction: (event) => {
        return this.enhancePerformanceEvent(event);
      },

      // Enhanced integrations
      integrations: [
        new Sentry.Integrations.Http({ 
          tracing: true,
          breadcrumbs: true 
        }),
        new Sentry.Integrations.OnUncaughtException({
          exitEvenIfOtherHandlersAreRegistered: false
        }),
        new Sentry.Integrations.OnUnhandledRejection({
          mode: 'warn'
        }),
        // Use correct Sentry console integration
        new Sentry.Integrations.Console({
          levels: ['error', 'warn']
        })
      ],

      // Enhanced release tracking
      release: process.env.VERCEL_GIT_COMMIT_SHA || undefined,
      
      // Custom tags for better organization
      initialScope: {
        tags: {
          component: 'zenith-platform',
          framework: 'nextjs',
          deployment: process.env.VERCEL_ENV || 'local'
        }
      }
    });
  }

  /**
   * Setup custom integrations and monitoring
   */
  private setupCustomIntegrations(): void {
    // Add custom error boundary
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.captureClientError(event.error, {
          type: 'javascript_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });

      // Capture unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.captureClientError(event.reason, {
          type: 'unhandled_promise_rejection'
        });
      });
    }

    // Setup performance monitoring
    this.setupPerformanceMonitoring();
  }

  /**
   * Enhanced error event processing
   */
  private enhanceErrorEvent(event: Sentry.Event, hint: Sentry.EventHint): Sentry.Event | null {
    // Add custom context
    event.extra = {
      ...event.extra,
      timestamp: new Date().toISOString(),
      platform: 'zenith',
      autonomous_healing: true
    };

    // Add user context if available
    const user = this.getCurrentUser();
    if (user) {
      event.user = {
        id: user.id,
        email: user.email,
        ip_address: '{{auto}}'
      };
    }

    // Classify error for autonomous healing
    if (this.isAutonomousHealingCandidate(event)) {
      event.tags = {
        ...event.tags,
        autonomous_healing_candidate: 'true',
        healing_priority: this.calculateHealingPriority(event)
      };
    }

    return event;
  }

  /**
   * Enhanced performance event processing
   */
  private enhancePerformanceEvent(event: Sentry.Event): Sentry.Event | null {
    // Add performance context
    event.extra = {
      ...event.extra,
      performance_monitoring: true,
      autonomous_analysis: true
    };

    return event;
  }

  /**
   * Capture and analyze errors with enhanced context
   */
  async captureEnhancedError(
    error: Error, 
    context: Partial<ErrorContext> = {}
  ): Promise<string> {
    const enhancedContext: ErrorContext = {
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date(),
      ...context
    };

    // Set Sentry context
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      scope.setContext('error_context', enhancedContext);
      
      if (enhancedContext.userId) {
        scope.setUser({ id: enhancedContext.userId });
      }
      
      if (enhancedContext.endpoint) {
        scope.setTag('endpoint', enhancedContext.endpoint);
      }
    });

    const eventId = Sentry.captureException(error);

    // Analyze for patterns
    await this.analyzeErrorPattern(error, enhancedContext);

    // Track in analytics
    await analyticsEngine.trackEvent({
      event: 'error_captured',
      properties: {
        errorType: error.constructor.name,
        message: error.message,
        endpoint: enhancedContext.endpoint,
        userId: enhancedContext.userId,
        environment: enhancedContext.environment
      }
    });

    return eventId;
  }

  /**
   * Capture performance metrics
   */
  async capturePerformanceMetrics(metrics: PerformanceMetrics): Promise<void> {
    // Send to Sentry as custom metric
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${metrics.method} ${metrics.endpoint}`,
      level: 'info',
      data: {
        duration: metrics.duration,
        statusCode: metrics.statusCode,
        endpoint: metrics.endpoint
      }
    });

    // Check for performance anomalies
    if (metrics.duration > this.alertThresholds.responseTime.warning) {
      await this.handlePerformanceAnomaly(metrics);
    }

    // Store metrics for analysis
    await this.storePerformanceMetrics(metrics);
  }

  /**
   * Client-side error capture
   */
  private captureClientError(error: any, metadata: any = {}): void {
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      scope.setContext('client_error', {
        ...metadata,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      });
    });

    Sentry.captureException(error);
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor API routes
    if (typeof window !== 'undefined') {
      // Override fetch to monitor API calls
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const startTime = Date.now();
        const url = args[0] as string;
        const options = args[1] || {};
        
        try {
          const response = await originalFetch(...args);
          const duration = Date.now() - startTime;
          
          await this.capturePerformanceMetrics({
            endpoint: url,
            duration,
            statusCode: response.status,
            method: options.method || 'GET',
            userAgent: navigator.userAgent,
            timestamp: new Date()
          });
          
          return response;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          await this.captureEnhancedError(error as Error, {
            endpoint: url,
            userAgent: navigator.userAgent
          });
          
          throw error;
        }
      };
    }
  }

  /**
   * Error pattern analysis for autonomous healing
   */
  private async analyzeErrorPattern(error: Error, context: ErrorContext): Promise<void> {
    const patternKey = this.generatePatternKey(error);
    
    let pattern = this.errorPatterns.get(patternKey);
    
    if (!pattern) {
      pattern = {
        id: patternKey,
        errorType: error.constructor.name,
        message: error.message,
        stackTrace: error.stack || '',
        frequency: 1,
        firstSeen: context.timestamp,
        lastSeen: context.timestamp,
        affectedUsers: new Set(context.userId ? [context.userId] : []),
        endpoints: new Set(context.endpoint ? [context.endpoint] : []),
        severity: 'low',
        status: 'active',
        autonomousHealingCandidate: this.isAutonomousHealingCandidate({ exception: { values: [{ type: error.constructor.name, value: error.message }] } })
      };
    } else {
      pattern.frequency++;
      pattern.lastSeen = context.timestamp;
      if (context.userId) pattern.affectedUsers.add(context.userId);
      if (context.endpoint) pattern.endpoints.add(context.endpoint);
      pattern.severity = this.calculateSeverity(pattern);
    }

    this.errorPatterns.set(patternKey, pattern);

    // Check if this pattern requires immediate attention
    if (pattern.severity === 'critical' && pattern.autonomousHealingCandidate) {
      await this.triggerAutonomousHealing(pattern);
    }

    // Store pattern for persistence
    await this.storeErrorPattern(pattern);
  }

  /**
   * Start error pattern analysis background process
   */
  private startErrorPatternAnalysis(): void {
    // Analyze patterns every 5 minutes
    setInterval(async () => {
      try {
        await this.analyzeAllPatterns();
      } catch (error) {
        console.error('Error pattern analysis failed:', error);
      }
    }, 300000); // 5 minutes
  }

  /**
   * Analyze all error patterns for trends
   */
  private async analyzeAllPatterns(): Promise<void> {
    for (const [patternKey, pattern] of this.errorPatterns) {
      // Check for error spikes
      const recentErrorRate = await this.calculateRecentErrorRate(patternKey);
      
      if (recentErrorRate > this.alertThresholds.errorRate.critical) {
        await this.handleCriticalErrorSpike(pattern);
      }
      
      // Check for user impact
      const userImpact = pattern.affectedUsers.size;
      if (userImpact > this.alertThresholds.userImpact.warning) {
        await this.handleHighUserImpact(pattern);
      }
    }
  }

  /**
   * Handle performance anomalies
   */
  private async handlePerformanceAnomaly(metrics: PerformanceMetrics): Promise<void> {
    const severity = metrics.duration > this.alertThresholds.responseTime.critical ? 'critical' : 'warning';
    
    // Create performance alert
    await this.createAlert({
      type: 'performance_anomaly',
      severity,
      message: `Slow response detected: ${metrics.endpoint} took ${metrics.duration}ms`,
      metadata: metrics
    });
  }

  /**
   * Handle critical error spikes
   */
  private async handleCriticalErrorSpike(pattern: ErrorPattern): Promise<void> {
    const alertKey = `error_spike:${pattern.id}`;
    
    // Check alert cooldown
    if (this.isInCooldown(alertKey)) return;
    
    await this.createAlert({
      type: 'error_spike',
      severity: 'critical',
      message: `Critical error spike: ${pattern.errorType} occurred ${pattern.frequency} times`,
      metadata: {
        patternId: pattern.id,
        errorType: pattern.errorType,
        frequency: pattern.frequency,
        affectedUsers: pattern.affectedUsers.size,
        endpoints: Array.from(pattern.endpoints)
      }
    });
    
    this.setAlertCooldown(alertKey);
  }

  /**
   * Handle high user impact scenarios
   */
  private async handleHighUserImpact(pattern: ErrorPattern): Promise<void> {
    const alertKey = `user_impact:${pattern.id}`;
    
    if (this.isInCooldown(alertKey)) return;
    
    await this.createAlert({
      type: 'high_user_impact',
      severity: 'high',
      message: `High user impact: ${pattern.affectedUsers.size} users affected by ${pattern.errorType}`,
      metadata: {
        patternId: pattern.id,
        affectedUsers: pattern.affectedUsers.size,
        errorType: pattern.errorType
      }
    });
    
    this.setAlertCooldown(alertKey);
  }

  /**
   * Trigger autonomous healing for critical patterns
   */
  private async triggerAutonomousHealing(pattern: ErrorPattern): Promise<void> {
    // Create healing mission for PerformanceAgent
    const healingMission = {
      goal: `Fix critical error pattern: ${pattern.errorType}`,
      type: 'autonomous_healing',
      priority: 'critical',
      anomaly: {
        id: pattern.id,
        type: 'error_spike',
        severity: pattern.severity,
        description: `Critical error pattern: ${pattern.message}`,
        occurrenceCount: pattern.frequency,
        firstOccurrence: pattern.firstSeen,
        lastOccurrence: pattern.lastSeen,
        affectedEndpoints: Array.from(pattern.endpoints),
        autoHealingCandidate: pattern.autonomousHealingCandidate
      },
      context: {
        errorPattern: pattern,
        stackTrace: pattern.stackTrace,
        affectedUsers: pattern.affectedUsers.size
      }
    };

    // Store mission for DeveloperAgent pickup
    await redis?.setex(
      `healing_mission:${pattern.id}`,
      3600,
      JSON.stringify(healingMission)
    );

    console.log(`🤖 Triggered autonomous healing for pattern: ${pattern.id}`);
  }

  /**
   * Utility methods
   */
  private generatePatternKey(error: Error): string {
    const errorSignature = `${error.constructor.name}:${error.message}`;
    return Buffer.from(errorSignature).toString('base64').substring(0, 32);
  }

  private isAutonomousHealingCandidate(event: any): boolean {
    // Define criteria for autonomous healing candidates
    const healableErrorTypes = [
      'TypeError',
      'ReferenceError',
      'SyntaxError',
      'ValidationError',
      'NetworkError'
    ];
    
    const errorType = event.exception?.values?.[0]?.type;
    return healableErrorTypes.includes(errorType);
  }

  private calculateHealingPriority(event: Sentry.Event): string {
    const errorType = event.exception?.values?.[0]?.type;
    const criticalTypes = ['ReferenceError', 'TypeError'];
    
    return criticalTypes.includes(errorType) ? 'high' : 'medium';
  }

  private calculateSeverity(pattern: ErrorPattern): 'low' | 'medium' | 'high' | 'critical' {
    if (pattern.frequency > 100 || pattern.affectedUsers.size > 50) return 'critical';
    if (pattern.frequency > 50 || pattern.affectedUsers.size > 20) return 'high';
    if (pattern.frequency > 10 || pattern.affectedUsers.size > 5) return 'medium';
    return 'low';
  }

  private getCurrentUser(): { id: string; email?: string } | null {
    // Get current user from session/auth context
    // Implementation depends on auth system
    return null;
  }

  private async calculateRecentErrorRate(patternKey: string): Promise<number> {
    // Calculate errors per minute for the last 10 minutes
    // Implementation would query Redis/database for recent errors
    return 0;
  }

  private async createAlert(alert: {
    type: string;
    severity: string;
    message: string;
    metadata: any;
  }): Promise<void> {
    console.log(`🚨 Alert: [${alert.severity.toUpperCase()}] ${alert.message}`);
    
    // Store alert
    await redis?.setex(
      `alert:${Date.now()}`,
      86400, // 24 hours
      JSON.stringify({
        ...alert,
        timestamp: new Date().toISOString()
      })
    );
  }

  private isInCooldown(alertKey: string): boolean {
    const lastAlert = this.lastAlertTime.get(alertKey);
    if (!lastAlert) return false;
    
    return (Date.now() - lastAlert) < (this.ALERT_COOLDOWN * 1000);
  }

  private setAlertCooldown(alertKey: string): void {
    this.lastAlertTime.set(alertKey, Date.now());
  }

  private async storeErrorPattern(pattern: ErrorPattern): Promise<void> {
    await redis?.setex(
      `error_pattern:${pattern.id}`,
      this.ERROR_PATTERN_CACHE_TTL,
      JSON.stringify({
        ...pattern,
        affectedUsers: Array.from(pattern.affectedUsers),
        endpoints: Array.from(pattern.endpoints)
      })
    );
  }

  private async storePerformanceMetrics(metrics: PerformanceMetrics): Promise<void> {
    await redis?.setex(
      `perf_metrics:${Date.now()}`,
      3600, // 1 hour
      JSON.stringify(metrics)
    );
  }

  /**
   * Public methods for external access
   */
  async getErrorPatterns(): Promise<ErrorPattern[]> {
    const keys = await redis?.keys('error_pattern:*') || [];
    const patterns = [];

    for (const key of keys) {
      const data = await redis?.get(key);
      if (data) {
        const pattern = JSON.parse(data);
        // Restore Sets
        pattern.affectedUsers = new Set(pattern.affectedUsers);
        pattern.endpoints = new Set(pattern.endpoints);
        patterns.push(pattern);
      }
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  async getAlerts(limit: number = 50): Promise<any[]> {
    const keys = await redis?.keys('alert:*') || [];
    const alerts = [];

    for (const key of keys.slice(0, limit)) {
      const data = await redis?.get(key);
      if (data) {
        alerts.push(JSON.parse(data));
      }
    }

    return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getHealthStatus(): Promise<{
    status: string;
    errorPatterns: number;
    criticalAlerts: number;
    lastActivity: string;
  }> {
    const patterns = await this.getErrorPatterns();
    const alerts = await this.getAlerts(10);
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const criticalPatterns = patterns.filter(p => p.severity === 'critical').length;

    return {
      status: criticalPatterns > 0 || criticalAlerts > 0 ? 'unhealthy' : 'healthy',
      errorPatterns: patterns.length,
      criticalAlerts,
      lastActivity: new Date().toISOString()
    };
  }
}

export const enhancedSentryMonitoring = new EnhancedSentryMonitoring();

// Export types
export type {
  ErrorContext,
  PerformanceMetrics,
  ErrorPattern,
  AlertThresholds
};