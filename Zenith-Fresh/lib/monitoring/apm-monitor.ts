import { Redis } from 'ioredis';
import { performance, PerformanceObserver } from 'perf_hooks';
import { NextRequest, NextResponse } from 'next/server';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  labels: Record<string, string>;
  metadata?: Record<string, any>;
}

interface TransactionTrace {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'success' | 'error' | 'timeout';
  type: 'http' | 'database' | 'cache' | 'external' | 'compute';
  spans: Span[];
  error?: string;
  metadata: Record<string, any>;
}

interface Span {
  id: string;
  parentId?: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: string;
  status: 'success' | 'error';
  tags: Record<string, string>;
  logs: Array<{ timestamp: number; message: string; level: string }>;
}

interface APMAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'performance' | 'error' | 'availability' | 'anomaly';
  message: string;
  timestamp: number;
  metric: string;
  threshold: number;
  actualValue: number;
  resolved: boolean;
  resolvedAt?: number;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    used: number;
    free: number;
    total: number;
    usage: number;
  };
  disk: {
    used: number;
    free: number;
    total: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
}

interface ApplicationMetrics {
  requests: {
    total: number;
    success: number;
    errors: number;
    rate: number;
    errorRate: number;
  };
  responseTime: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
  };
  database: {
    connections: number;
    activeQueries: number;
    queryTime: number;
    cacheHitRate: number;
  };
  cache: {
    hitRate: number;
    evictions: number;
    memory: number;
  };
}

interface CustomMetric {
  name: string;
  value: number;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  labels?: Record<string, string>;
}

/**
 * Performance Tracer for distributed tracing
 */
class PerformanceTracer {
  private activeSpans = new Map<string, Span>();
  private traces = new Map<string, TransactionTrace>();
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Start a new transaction trace
   */
  startTrace(name: string, type: TransactionTrace['type'] = 'http'): string {
    const traceId = this.generateId();
    const trace: TransactionTrace = {
      id: traceId,
      name,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      status: 'success',
      type,
      spans: [],
      metadata: {},
    };

    this.traces.set(traceId, trace);
    return traceId;
  }

  /**
   * Start a new span within a trace
   */
  startSpan(traceId: string, name: string, type: string, parentSpanId?: string): string {
    const spanId = this.generateId();
    const span: Span = {
      id: spanId,
      parentId: parentSpanId,
      name,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      type,
      status: 'success',
      tags: {},
      logs: [],
    };

    this.activeSpans.set(spanId, span);
    
    const trace = this.traces.get(traceId);
    if (trace) {
      trace.spans.push(span);
    }

    return spanId;
  }

  /**
   * Finish a span
   */
  finishSpan(spanId: string, status: 'success' | 'error' = 'success', error?: string): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.endTime = performance.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    if (error) {
      span.logs.push({
        timestamp: performance.now(),
        message: error,
        level: 'error',
      });
    }

    this.activeSpans.delete(spanId);
  }

  /**
   * Finish a trace
   */
  async finishTrace(traceId: string, status: 'success' | 'error' | 'timeout' = 'success', error?: string): Promise<void> {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    trace.endTime = performance.now();
    trace.duration = trace.endTime - trace.startTime;
    trace.status = status;
    trace.error = error;

    // Store trace in Redis for analysis
    await this.storeTrace(trace);
    this.traces.delete(traceId);
  }

  /**
   * Add tags to a span
   */
  addSpanTags(spanId: string, tags: Record<string, string>): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.tags = { ...span.tags, ...tags };
    }
  }

  /**
   * Add log to a span
   */
  addSpanLog(spanId: string, message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: performance.now(),
        message,
        level,
      });
    }
  }

  private async storeTrace(trace: TransactionTrace): Promise<void> {
    try {
      const key = `trace:${trace.id}`;
      await this.redis.setex(key, 24 * 3600, JSON.stringify(trace)); // Keep for 24 hours
      
      // Store in a sorted set for querying
      await this.redis.zadd('traces', trace.startTime, trace.id);
      
      // Keep only last 10000 traces
      await this.redis.zremrangebyrank('traces', 0, -10001);
    } catch (error) {
      console.error('Failed to store trace:', error);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Get traces by time range or filter
   */
  async getTraces(options: {
    limit?: number;
    status?: TransactionTrace['status'];
    type?: TransactionTrace['type'];
    minDuration?: number;
    since?: number;
  } = {}): Promise<TransactionTrace[]> {
    try {
      const { limit = 100, since = Date.now() - 3600000 } = options; // Last hour by default
      
      const traceIds = await this.redis.zrangebyscore('traces', since, '+inf', 'LIMIT', 0, limit);
      const traces: TransactionTrace[] = [];
      
      for (const traceId of traceIds) {
        const traceData = await this.redis.get(`trace:${traceId}`);
        if (traceData) {
          const trace = JSON.parse(traceData) as TransactionTrace;
          
          // Apply filters
          if (options.status && trace.status !== options.status) continue;
          if (options.type && trace.type !== options.type) continue;
          if (options.minDuration && trace.duration < options.minDuration) continue;
          
          traces.push(trace);
        }
      }
      
      return traces;
    } catch (error) {
      console.error('Failed to get traces:', error);
      return [];
    }
  }
}

/**
 * Metrics Collector
 */
class MetricsCollector {
  private metrics = new Map<string, PerformanceMetric[]>();
  private customMetrics = new Map<string, CustomMetric>();
  private redis: Redis;
  private performanceObserver: PerformanceObserver;

  constructor(redis: Redis) {
    this.redis = redis;
    this.initializePerformanceObserver();
    this.startSystemMetricsCollection();
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, labels: Record<string, string> = {}, unit = ''): void {
    const metric: PerformanceMetric = {
      id: this.generateId(),
      name,
      value,
      unit,
      timestamp: Date.now(),
      labels,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricArray = this.metrics.get(name)!;
    metricArray.push(metric);

    // Keep only last 1000 metrics per name
    if (metricArray.length > 1000) {
      metricArray.splice(0, metricArray.length - 1000);
    }

    // Store in Redis for aggregation
    this.storeMetricInRedis(metric);
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value = 1, labels: Record<string, string> = {}): void {
    const existing = this.customMetrics.get(name);
    if (existing && existing.type === 'counter') {
      existing.value += value;
    } else {
      this.customMetrics.set(name, {
        name,
        value,
        type: 'counter',
        help: `Counter metric: ${name}`,
        labels,
      });
    }
    
    this.recordMetric(name, value, labels);
  }

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    this.customMetrics.set(name, {
      name,
      value,
      type: 'gauge',
      help: `Gauge metric: ${name}`,
      labels,
    });
    
    this.recordMetric(name, value, labels);
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    // Simple histogram implementation - in production, use proper histogram buckets
    this.recordMetric(`${name}_sum`, value, labels);
    this.recordMetric(`${name}_count`, 1, labels);
    this.recordMetric(`${name}_bucket`, value, { ...labels, le: '+Inf' });
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(timeWindow = 3600000): Record<string, {
    current: number;
    avg: number;
    min: number;
    max: number;
    count: number;
  }> {
    const summary: Record<string, any> = {};
    const now = Date.now();
    const since = now - timeWindow;

    for (const [name, metricArray] of this.metrics.entries()) {
      const recentMetrics = metricArray.filter(m => m.timestamp >= since);
      
      if (recentMetrics.length > 0) {
        const values = recentMetrics.map(m => m.value);
        summary[name] = {
          current: values[values.length - 1],
          avg: values.reduce((sum, v) => sum + v, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
    }

    return summary;
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics(): Promise<SystemMetrics> {
    const os = require('os');
    
    return {
      cpu: {
        usage: await this.getCPUUsage(),
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
      },
      memory: {
        used: os.totalmem() - os.freemem(),
        free: os.freemem(),
        total: os.totalmem(),
        usage: (os.totalmem() - os.freemem()) / os.totalmem() * 100,
      },
      disk: await this.getDiskMetrics(),
      network: await this.getNetworkMetrics(),
    };
  }

  private initializePerformanceObserver(): void {
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      for (const entry of entries) {
        this.recordMetric(`perf_${entry.entryType}`, entry.duration, {
          name: entry.name,
          type: entry.entryType,
        }, 'ms');
      }
    });

    this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
  }

  private startSystemMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(async () => {
      try {
        const metrics = await this.collectSystemMetrics();
        
        this.setGauge('system_cpu_usage', metrics.cpu.usage);
        this.setGauge('system_memory_usage', metrics.memory.usage);
        this.setGauge('system_disk_usage', metrics.disk.usage);
        this.setGauge('system_load_average_1m', metrics.cpu.loadAverage[0]);
        
      } catch (error) {
        console.error('Failed to collect system metrics:', error);
      }
    }, 30000);
  }

  private async getCPUUsage(): Promise<number> {
    // Simple CPU usage calculation
    const os = require('os');
    const cpus = os.cpus();
    
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    }
    
    return 100 - (totalIdle / totalTick * 100);
  }

  private async getDiskMetrics(): Promise<SystemMetrics['disk']> {
    // Mock implementation - in production, use fs.statSync
    return {
      used: 50 * 1024 * 1024 * 1024, // 50GB
      free: 50 * 1024 * 1024 * 1024, // 50GB  
      total: 100 * 1024 * 1024 * 1024, // 100GB
      usage: 50,
    };
  }

  private async getNetworkMetrics(): Promise<SystemMetrics['network']> {
    // Mock implementation - in production, read from /proc/net/dev
    return {
      bytesIn: 1024 * 1024,
      bytesOut: 512 * 1024,
      packetsIn: 1000,
      packetsOut: 800,
    };
  }

  private async storeMetricInRedis(metric: PerformanceMetric): Promise<void> {
    try {
      // Store in time series format
      const key = `metrics:${metric.name}`;
      await this.redis.zadd(key, metric.timestamp, JSON.stringify(metric));
      
      // Keep only last 24 hours of data
      const cutoff = Date.now() - 24 * 3600 * 1000;
      await this.redis.zremrangebyscore(key, '-inf', cutoff);
    } catch (error) {
      console.error('Failed to store metric in Redis:', error);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

/**
 * Alert Manager
 */
class AlertManager {
  private alerts = new Map<string, APMAlert>();
  private rules = new Map<string, {
    metric: string;
    condition: 'gt' | 'lt' | 'eq';
    threshold: number;
    duration: number; // milliseconds
    severity: APMAlert['severity'];
  }>();
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
    this.initializeDefaultRules();
    this.startAlertEvaluation();
  }

  /**
   * Add alert rule
   */
  addRule(name: string, rule: {
    metric: string;
    condition: 'gt' | 'lt' | 'eq';
    threshold: number;
    duration: number;
    severity: APMAlert['severity'];
  }): void {
    this.rules.set(name, rule);
  }

  /**
   * Remove alert rule
   */
  removeRule(name: string): void {
    this.rules.delete(name);
  }

  /**
   * Trigger alert
   */
  async triggerAlert(alert: Omit<APMAlert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const alertId = this.generateId();
    const fullAlert: APMAlert = {
      ...alert,
      id: alertId,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.set(alertId, fullAlert);
    
    // Store in Redis
    await this.redis.hset('alerts', alertId, JSON.stringify(fullAlert));
    
    // Send notification
    await this.sendNotification(fullAlert);
    
    console.warn(`Alert triggered: ${fullAlert.message} (${fullAlert.severity})`);
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      
      await this.redis.hset('alerts', alertId, JSON.stringify(alert));
      console.info(`Alert resolved: ${alert.message}`);
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): APMAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get alert history
   */
  async getAlertHistory(limit = 100): Promise<APMAlert[]> {
    try {
      const alertData = await this.redis.hgetall('alerts');
      const alerts = Object.values(alertData)
        .map(data => JSON.parse(data) as APMAlert)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
      
      return alerts;
    } catch (error) {
      console.error('Failed to get alert history:', error);
      return [];
    }
  }

  private initializeDefaultRules(): void {
    this.addRule('high_response_time', {
      metric: 'response_time_p95',
      condition: 'gt',
      threshold: 2000, // 2 seconds
      duration: 300000, // 5 minutes
      severity: 'high',
    });

    this.addRule('high_error_rate', {
      metric: 'error_rate',
      condition: 'gt',
      threshold: 5, // 5%
      duration: 180000, // 3 minutes
      severity: 'critical',
    });

    this.addRule('high_cpu_usage', {
      metric: 'system_cpu_usage',
      condition: 'gt',
      threshold: 80, // 80%
      duration: 600000, // 10 minutes
      severity: 'medium',
    });

    this.addRule('high_memory_usage', {
      metric: 'system_memory_usage',
      condition: 'gt',
      threshold: 90, // 90%
      duration: 300000, // 5 minutes
      severity: 'high',
    });
  }

  private startAlertEvaluation(): void {
    // Evaluate alerts every minute
    setInterval(async () => {
      await this.evaluateRules();
    }, 60000);
  }

  private async evaluateRules(): Promise<void> {
    // This would integrate with the metrics collector to evaluate rules
    // For now, we'll skip the actual implementation
  }

  private async sendNotification(alert: APMAlert): Promise<void> {
    // Integration with notification services (email, Slack, PagerDuty, etc.)
    console.log(`📢 Alert Notification: ${alert.message}`);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

/**
 * Main APM Monitor Class
 */
export class APMMonitor {
  public tracer: PerformanceTracer;
  public metrics: MetricsCollector;
  public alerts: AlertManager;
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
    this.tracer = new PerformanceTracer(redis);
    this.metrics = new MetricsCollector(redis);
    this.alerts = new AlertManager(redis);
  }

  /**
   * Middleware for automatic instrumentation
   */
  middleware() {
    return async (req: NextRequest) => {
      const startTime = performance.now();
      const traceId = this.tracer.startTrace(`${req.method} ${req.nextUrl.pathname}`, 'http');
      const spanId = this.tracer.startSpan(traceId, `HTTP ${req.method}`, 'http');

      // Add request metadata
      this.tracer.addSpanTags(spanId, {
        'http.method': req.method,
        'http.url': req.nextUrl.href,
        'http.user_agent': req.headers.get('user-agent') || '',
        'http.remote_addr': req.ip || '',
      });

      try {
        // Continue to next middleware/handler
        const response = NextResponse.next();
        
        const duration = performance.now() - startTime;
        
        // Record metrics
        this.metrics.recordHistogram('http_request_duration_ms', duration, {
          method: req.method,
          path: req.nextUrl.pathname,
          status: response.status.toString(),
        });

        this.metrics.incrementCounter('http_requests_total', 1, {
          method: req.method,
          status: response.status.toString(),
        });

        // Finish tracing
        const status = response.status >= 400 ? 'error' : 'success';
        this.tracer.addSpanTags(spanId, {
          'http.status_code': response.status.toString(),
        });

        this.tracer.finishSpan(spanId, status);
        this.tracer.finishTrace(traceId, status);

        return response;

      } catch (error) {
        const duration = performance.now() - startTime;
        
        // Record error metrics
        this.metrics.incrementCounter('http_errors_total', 1, {
          method: req.method,
          error: error instanceof Error ? error.name : 'unknown',
        });

        // Finish tracing with error
        this.tracer.addSpanLog(spanId, error instanceof Error ? error.message : 'Unknown error', 'error');
        this.tracer.finishSpan(spanId, 'error', error instanceof Error ? error.message : 'Unknown error');
        this.tracer.finishTrace(traceId, 'error', error instanceof Error ? error.message : 'Unknown error');

        throw error;
      }
    };
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(): Promise<{
    systemMetrics: SystemMetrics;
    applicationMetrics: ApplicationMetrics;
    recentTraces: TransactionTrace[];
    activeAlerts: APMAlert[];
    performanceSummary: Record<string, any>;
  }> {
    const [
      systemMetrics,
      recentTraces,
      activeAlerts,
      performanceSummary,
    ] = await Promise.all([
      this.metrics.collectSystemMetrics(),
      this.tracer.getTraces({ limit: 50 }),
      this.alerts.getActiveAlerts(),
      this.metrics.getMetricsSummary(),
    ]);

    // Calculate application metrics from traces and performance data
    const applicationMetrics = this.calculateApplicationMetrics(recentTraces, performanceSummary);

    return {
      systemMetrics,
      applicationMetrics,
      recentTraces,
      activeAlerts,
      performanceSummary,
    };
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail';
      duration: number;
      output?: string;
    }>;
    uptime: number;
  }> {
    const startTime = performance.now();
    const checks = await Promise.all([
      this.checkRedisHealth(),
      this.checkDatabaseHealth(),
      this.checkAPIHealth(),
      this.checkMemoryHealth(),
    ]);

    const failedChecks = checks.filter(check => check.status === 'fail');
    const status = failedChecks.length === 0 ? 'healthy' : 
                  failedChecks.length <= 1 ? 'degraded' : 'unhealthy';

    return {
      status,
      checks,
      uptime: process.uptime() * 1000,
    };
  }

  private calculateApplicationMetrics(traces: TransactionTrace[], performanceSummary: Record<string, any>): ApplicationMetrics {
    const httpTraces = traces.filter(t => t.type === 'http');
    const totalRequests = httpTraces.length;
    const successfulRequests = httpTraces.filter(t => t.status === 'success').length;
    const errorRequests = totalRequests - successfulRequests;

    const responseTimes = httpTraces.map(t => t.duration);
    responseTimes.sort((a, b) => a - b);

    return {
      requests: {
        total: totalRequests,
        success: successfulRequests,
        errors: errorRequests,
        rate: totalRequests / 60, // per minute
        errorRate: totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0,
      },
      responseTime: {
        avg: responseTimes.length > 0 ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length : 0,
        p50: responseTimes[Math.floor(responseTimes.length * 0.5)] || 0,
        p95: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
        p99: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
        max: Math.max(...responseTimes, 0),
      },
      database: {
        connections: performanceSummary.db_connections?.current || 0,
        activeQueries: performanceSummary.db_active_queries?.current || 0,
        queryTime: performanceSummary.db_query_time?.avg || 0,
        cacheHitRate: performanceSummary.cache_hit_rate?.current || 0,
      },
      cache: {
        hitRate: performanceSummary.cache_hit_rate?.current || 0,
        evictions: performanceSummary.cache_evictions?.current || 0,
        memory: performanceSummary.cache_memory?.current || 0,
      },
    };
  }

  private async checkRedisHealth(): Promise<{ name: string; status: 'pass' | 'fail'; duration: number; output?: string }> {
    const startTime = performance.now();
    try {
      await this.redis.ping();
      return {
        name: 'redis',
        status: 'pass',
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        name: 'redis',
        status: 'fail',
        duration: performance.now() - startTime,
        output: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkDatabaseHealth(): Promise<{ name: string; status: 'pass' | 'fail'; duration: number; output?: string }> {
    const startTime = performance.now();
    try {
      // Mock database health check
      return {
        name: 'database',
        status: 'pass',
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'fail',
        duration: performance.now() - startTime,
        output: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkAPIHealth(): Promise<{ name: string; status: 'pass' | 'fail'; duration: number; output?: string }> {
    const startTime = performance.now();
    try {
      // Mock API health check
      return {
        name: 'api',
        status: 'pass',
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        name: 'api',
        status: 'fail',
        duration: performance.now() - startTime,
        output: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkMemoryHealth(): Promise<{ name: string; status: 'pass' | 'fail'; duration: number; output?: string }> {
    const startTime = performance.now();
    try {
      const usage = process.memoryUsage();
      const memoryUsage = (usage.heapUsed / usage.heapTotal) * 100;
      
      return {
        name: 'memory',
        status: memoryUsage < 90 ? 'pass' : 'fail',
        duration: performance.now() - startTime,
        output: `Memory usage: ${memoryUsage.toFixed(1)}%`,
      };
    } catch (error) {
      return {
        name: 'memory',
        status: 'fail',
        duration: performance.now() - startTime,
        output: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Factory function
 */
export function createAPMMonitor(redis: Redis): APMMonitor {
  return new APMMonitor(redis);
}

/**
 * Decorator for automatic method tracing
 */
export function traced(name?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const traceName = name || `${target.constructor.name}.${propertyName}`;
    
    descriptor.value = async function (...args: any[]) {
      const apm = (this as any)._apm as APMMonitor;
      if (!apm) {
        return method.apply(this, args);
      }

      const traceId = apm.tracer.startTrace(traceName, 'compute');
      const spanId = apm.tracer.startSpan(traceId, traceName, 'function');
      
      try {
        const result = await method.apply(this, args);
        apm.tracer.finishSpan(spanId, 'success');
        apm.tracer.finishTrace(traceId, 'success');
        return result;
      } catch (error) {
        apm.tracer.finishSpan(spanId, 'error', error instanceof Error ? error.message : 'Unknown error');
        apm.tracer.finishTrace(traceId, 'error', error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    };

    return descriptor;
  };
}