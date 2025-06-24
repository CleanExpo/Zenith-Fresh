/**
 * ZENITH MONITORING MIDDLEWARE
 * Automatic instrumentation for requests, traces, and performance monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { performance } from 'perf_hooks';
import { monitoringAgent } from '@/lib/agents/advanced-monitoring-observability-agent';
import { apiMonitor } from '@/lib/api/api-performance-monitor';
import { securityMonitor } from '@/lib/security/security-monitor';
import { observeHttpRequest } from '@/lib/monitoring';

interface RequestContext {
  traceId: string;
  spanId: string;
  startTime: number;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ip: string;
  path: string;
  method: string;
}

interface MonitoringOptions {
  enableDistributedTracing: boolean;
  enablePerformanceMonitoring: boolean;
  enableSecurityMonitoring: boolean;
  enableUserExperienceTracking: boolean;
  enableBusinessMetrics: boolean;
  excludePaths: string[];
  sensitiveHeaders: string[];
}

export class MonitoringMiddleware {
  private options: MonitoringOptions;
  private activeRequests = new Map<string, RequestContext>();

  constructor(options: Partial<MonitoringOptions> = {}) {
    this.options = {
      enableDistributedTracing: true,
      enablePerformanceMonitoring: true,
      enableSecurityMonitoring: true,
      enableUserExperienceTracking: true,
      enableBusinessMetrics: true,
      excludePaths: ['/favicon.ico', '/robots.txt', '/health', '/metrics'],
      sensitiveHeaders: ['authorization', 'cookie', 'x-api-key'],
      ...options
    };
  }

  /**
   * Main middleware function
   */
  async middleware(request: NextRequest): Promise<NextResponse> {
    const startTime = performance.now();
    const requestId = this.generateRequestId();
    
    // Extract request information
    const context = this.extractRequestContext(request, requestId, startTime);
    
    // Skip monitoring for excluded paths
    if (this.shouldSkipMonitoring(context.path)) {
      return NextResponse.next();
    }

    // Store active request context
    this.activeRequests.set(requestId, context);

    try {
      // Start distributed trace if enabled
      let span;
      if (this.options.enableDistributedTracing) {
        span = this.startRequestTrace(context);
      }

      // Security monitoring
      if (this.options.enableSecurityMonitoring) {
        this.performSecurityChecks(request, context);
      }

      // Process the request
      const response = NextResponse.next();

      // Add monitoring headers
      this.addMonitoringHeaders(response, context, span);

      // Schedule post-request monitoring (async)
      this.schedulePostRequestMonitoring(requestId, response, span);

      return response;

    } catch (error) {
      // Handle errors and record them
      this.handleRequestError(context, error);
      throw error;
    }
  }

  /**
   * Extract request context information
   */
  private extractRequestContext(request: NextRequest, requestId: string, startTime: number): RequestContext {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    const ip = this.extractClientIP(request);
    
    return {
      traceId: this.extractTraceId(request) || this.generateTraceId(),
      spanId: requestId,
      startTime,
      userId: this.extractUserId(request),
      sessionId: this.extractSessionId(request),
      userAgent,
      ip,
      path: url.pathname,
      method: request.method
    };
  }

  /**
   * Start distributed trace for request
   */
  private startRequestTrace(context: RequestContext) {
    const span = monitoringAgent.startTrace(
      `${context.method} ${context.path}`,
      'zenith-api'
    );

    // Add request tags
    monitoringAgent.addSpanTags(span, {
      'http.method': context.method,
      'http.url': context.path,
      'http.user_agent': context.userAgent,
      'user.id': context.userId,
      'session.id': context.sessionId,
      'client.ip': context.ip,
      'request.id': context.spanId
    });

    return span;
  }

  /**
   * Perform security checks on incoming request
   */
  private performSecurityChecks(request: NextRequest, context: RequestContext): void {
    const url = new URL(request.url);
    const queryString = url.search;
    const userAgent = context.userAgent;

    // Check for common attack patterns
    this.checkSQLInjection(queryString, context);
    this.checkXSSAttempts(queryString, context);
    this.checkDirectoryTraversal(context.path, context);
    this.checkSuspiciousUserAgent(userAgent, context);
    this.checkRateLimiting(context);
  }

  /**
   * Check for SQL injection attempts
   */
  private checkSQLInjection(queryString: string, context: RequestContext): void {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE)\b)/i,
      /((\%27)|(\')|(\-\-)|(\%23)|(#))/i,
      /(((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;)))/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(queryString)) {
        securityMonitor.recordSecurityEvent({
          type: 'SQL_INJECTION_ATTEMPT',
          severity: 'HIGH',
          source: 'MonitoringMiddleware',
          ip: context.ip,
          userAgent: context.userAgent,
          userId: context.userId,
          endpoint: context.path,
          details: {
            queryString,
            pattern: pattern.toString(),
            timestamp: new Date().toISOString()
          }
        });
        break;
      }
    }
  }

  /**
   * Check for XSS attempts
   */
  private checkXSSAttempts(queryString: string, context: RequestContext): void {
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(queryString)) {
        securityMonitor.recordSecurityEvent({
          type: 'XSS_ATTEMPT',
          severity: 'HIGH',
          source: 'MonitoringMiddleware',
          ip: context.ip,
          userAgent: context.userAgent,
          userId: context.userId,
          endpoint: context.path,
          details: {
            queryString,
            pattern: pattern.toString(),
            timestamp: new Date().toISOString()
          }
        });
        break;
      }
    }
  }

  /**
   * Check for directory traversal attempts
   */
  private checkDirectoryTraversal(path: string, context: RequestContext): void {
    const traversalPatterns = [
      /\.\.\//g,
      /\.\.\\/g,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi
    ];

    for (const pattern of traversalPatterns) {
      if (pattern.test(path)) {
        securityMonitor.recordSecurityEvent({
          type: 'DIRECTORY_TRAVERSAL_ATTEMPT',
          severity: 'MEDIUM',
          source: 'MonitoringMiddleware',
          ip: context.ip,
          userAgent: context.userAgent,
          userId: context.userId,
          endpoint: context.path,
          details: {
            path,
            pattern: pattern.toString(),
            timestamp: new Date().toISOString()
          }
        });
        break;
      }
    }
  }

  /**
   * Check for suspicious user agents
   */
  private checkSuspiciousUserAgent(userAgent: string, context: RequestContext): void {
    const suspiciousPatterns = [
      /sqlmap/i,
      /nmap/i,
      /nikto/i,
      /dirb/i,
      /masscan/i,
      /gobuster/i,
      /burp/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(userAgent)) {
        securityMonitor.recordSecurityEvent({
          type: 'SECURITY_SCAN_DETECTED',
          severity: 'MEDIUM',
          source: 'MonitoringMiddleware',
          ip: context.ip,
          userAgent: context.userAgent,
          userId: context.userId,
          endpoint: context.path,
          details: {
            userAgent,
            scannerType: pattern.toString(),
            timestamp: new Date().toISOString()
          }
        });
        break;
      }
    }
  }

  /**
   * Check rate limiting
   */
  private checkRateLimiting(context: RequestContext): void {
    // This would integrate with a rate limiting system
    // For now, we'll record suspicious activity patterns
    const recentRequests = Array.from(this.activeRequests.values())
      .filter(req => req.ip === context.ip && Date.now() - req.startTime < 60000);

    if (recentRequests.length > 100) {
      securityMonitor.recordSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'MEDIUM',
        source: 'MonitoringMiddleware',
        ip: context.ip,
        userAgent: context.userAgent,
        userId: context.userId,
        endpoint: context.path,
        details: {
          requestCount: recentRequests.length,
          timeWindow: '1 minute',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Add monitoring headers to response
   */
  private addMonitoringHeaders(response: NextResponse, context: RequestContext, span?: any): void {
    response.headers.set('x-trace-id', context.traceId);
    response.headers.set('x-request-id', context.spanId);
    
    if (span) {
      response.headers.set('x-span-id', span.spanId);
    }
  }

  /**
   * Schedule post-request monitoring
   */
  private schedulePostRequestMonitoring(requestId: string, response: NextResponse, span?: any): void {
    // Use setTimeout to avoid blocking the response
    setTimeout(async () => {
      try {
        await this.performPostRequestMonitoring(requestId, response, span);
      } catch (error) {
        console.error('Post-request monitoring error:', error);
      }
    }, 0);
  }

  /**
   * Perform monitoring after request completion
   */
  private async performPostRequestMonitoring(requestId: string, response: NextResponse, span?: any): Promise<void> {
    const context = this.activeRequests.get(requestId);
    if (!context) return;

    const endTime = performance.now();
    const duration = endTime - context.startTime;
    const statusCode = response.status;

    try {
      // Record API performance metrics
      if (this.options.enablePerformanceMonitoring) {
        await this.recordPerformanceMetrics(context, duration, statusCode, response);
      }

      // Finish distributed trace
      if (this.options.enableDistributedTracing && span) {
        this.finishTrace(span, statusCode, duration);
      }

      // Record business metrics
      if (this.options.enableBusinessMetrics) {
        this.recordBusinessMetrics(context, statusCode, duration);
      }

      // User experience tracking
      if (this.options.enableUserExperienceTracking && context.userId) {
        this.trackUserExperience(context, duration, statusCode);
      }

    } finally {
      // Clean up
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Record performance metrics
   */
  private async recordPerformanceMetrics(
    context: RequestContext, 
    duration: number, 
    statusCode: number, 
    response: NextResponse
  ): Promise<void> {
    // Record in API monitor
    await apiMonitor.recordMetric({
      endpoint: context.path,
      method: context.method,
      responseTime: duration,
      statusCode,
      userId: context.userId,
      userAgent: context.userAgent,
      ipAddress: context.ip,
      payloadSize: this.estimateRequestSize(context),
      responseSize: this.estimateResponseSize(response),
      cacheHit: this.detectCacheHit(response),
    });

    // Record in Prometheus metrics
    observeHttpRequest(context.method, context.path, statusCode, duration);
  }

  /**
   * Finish distributed trace
   */
  private finishTrace(span: any, statusCode: number, duration: number): void {
    // Add response tags
    monitoringAgent.addSpanTags(span, {
      'http.status_code': statusCode,
      'response.time_ms': duration
    });

    // Log response details
    monitoringAgent.addSpanLog(span, 'info', {
      event: 'response',
      statusCode,
      duration: `${duration.toFixed(2)}ms`
    });

    // Finish the span
    const error = statusCode >= 400 ? new Error(`HTTP ${statusCode}`) : undefined;
    monitoringAgent.finishSpan(span, error);
  }

  /**
   * Record business metrics
   */
  private recordBusinessMetrics(context: RequestContext, statusCode: number, duration: number): void {
    // API request count
    monitoringAgent.recordBusinessMetric({
      name: 'api_requests_total',
      value: 1,
      unit: 'count',
      category: 'api',
      dimensions: {
        method: context.method,
        endpoint: context.path,
        statusCode,
        success: statusCode < 400
      }
    });

    // Response time metric
    monitoringAgent.recordBusinessMetric({
      name: 'api_response_time',
      value: duration,
      unit: 'ms',
      category: 'performance',
      dimensions: {
        method: context.method,
        endpoint: context.path
      },
      threshold: {
        warning: 500,
        critical: 1000
      }
    });

    // Error rate tracking
    if (statusCode >= 400) {
      monitoringAgent.recordBusinessMetric({
        name: 'api_errors_total',
        value: 1,
        unit: 'count',
        category: 'reliability',
        dimensions: {
          method: context.method,
          endpoint: context.path,
          statusCode,
          errorType: statusCode >= 500 ? 'server_error' : 'client_error'
        }
      });
    }
  }

  /**
   * Track user experience
   */
  private trackUserExperience(context: RequestContext, duration: number, statusCode: number): void {
    // This would be enhanced with real user experience data
    if (context.method === 'GET' && statusCode === 200) {
      monitoringAgent.recordBusinessMetric({
        name: 'user_page_load_time',
        value: duration,
        unit: 'ms',
        category: 'user_experience',
        dimensions: {
          userId: context.userId,
          page: context.path,
          userAgent: context.userAgent
        },
        threshold: {
          warning: 2000,
          critical: 5000
        }
      });
    }
  }

  /**
   * Handle request errors
   */
  private handleRequestError(context: RequestContext, error: any): void {
    console.error('Request error:', error);

    // Record security event for potential attacks
    securityMonitor.recordSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'MEDIUM',
      source: 'MonitoringMiddleware',
      ip: context.ip,
      userAgent: context.userAgent,
      userId: context.userId,
      endpoint: context.path,
      details: {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Helper methods
  private shouldSkipMonitoring(path: string): boolean {
    return this.options.excludePaths.some(excludePath => 
      path.startsWith(excludePath) || path === excludePath
    );
  }

  private extractClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const remoteAddr = request.headers.get('remote-addr');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return realIP || remoteAddr || 'unknown';
  }

  private extractTraceId(request: NextRequest): string | null {
    return request.headers.get('x-trace-id');
  }

  private extractUserId(request: NextRequest): string | undefined {
    // Extract from JWT token or session
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        // In a real implementation, decode the JWT token
        // For now, return undefined
        return undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private extractSessionId(request: NextRequest): string | undefined {
    // Extract from cookies
    const cookies = request.headers.get('cookie');
    if (cookies) {
      const sessionMatch = cookies.match(/sessionId=([^;]+)/);
      return sessionMatch?.[1];
    }
    return undefined;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private estimateRequestSize(context: RequestContext): number {
    // Estimate based on headers and URL
    return context.path.length + (context.userAgent?.length || 0) + 500; // Rough estimate
  }

  private estimateResponseSize(response: NextResponse): number {
    // In a real implementation, measure actual response size
    return 1000; // Placeholder
  }

  private detectCacheHit(response: NextResponse): boolean {
    const cacheHeader = response.headers.get('cache-control');
    const etag = response.headers.get('etag');
    return !!(cacheHeader && etag);
  }
}

// Export singleton instance
export const monitoringMiddleware = new MonitoringMiddleware();

// Export convenience function
export const createMonitoringMiddleware = (options?: Partial<MonitoringOptions>) => {
  return new MonitoringMiddleware(options);
};

export default monitoringMiddleware;