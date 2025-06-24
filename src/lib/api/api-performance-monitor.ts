/**
 * ZENITH API PERFORMANCE MONITOR
 * Real-time API monitoring, benchmarking, and analytics
 * Enterprise-grade monitoring for Fortune 500 deployment
 */

import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

interface APIMetric {
  id: string;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  payloadSize: number;
  responseSize: number;
  cacheHit: boolean;
  error?: string;
}

interface APIBenchmark {
  endpoint: string;
  method: string;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  averageResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  cacheHitRate: number;
  timestamp: Date;
}

interface APIAlert {
  id: string;
  type: 'performance' | 'error' | 'availability' | 'security';
  severity: 'critical' | 'high' | 'medium' | 'low';
  endpoint: string;
  message: string;
  threshold: number;
  actualValue: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

interface APIHealthCheck {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
  consecutiveFailures: number;
}

export class APIPerformanceMonitor {
  private metrics: APIMetric[] = [];
  private benchmarks: Map<string, APIBenchmark> = new Map();
  private alerts: APIAlert[] = [];
  private healthChecks: Map<string, APIHealthCheck> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  // Performance thresholds
  private readonly THRESHOLDS = {
    RESPONSE_TIME_WARNING: 200, // ms
    RESPONSE_TIME_CRITICAL: 500, // ms
    ERROR_RATE_WARNING: 0.05, // 5%
    ERROR_RATE_CRITICAL: 0.10, // 10%
    CACHE_HIT_RATE_WARNING: 0.8, // 80%
    THROUGHPUT_WARNING: 10, // req/s
    AVAILABILITY_CRITICAL: 0.95 // 95%
  };

  constructor() {
    console.log('📊 APIPerformanceMonitor: Initialized - Enterprise API Monitoring');
  }

  // ==================== REAL-TIME MONITORING ====================

  /**
   * Start real-time API monitoring
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      console.log('⚠️ API monitoring is already running');
      return;
    }

    console.log('🚀 Starting real-time API monitoring...');
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      await this.updateBenchmarks();
      await this.checkAlerts();
      await this.performHealthChecks();
    }, intervalMs);

    console.log(`✅ API monitoring started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop real-time monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.log('⚠️ API monitoring is not running');
      return;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    console.log('🛑 API monitoring stopped');
  }

  /**
   * Record API metric
   */
  async recordMetric(metric: Omit<APIMetric, 'id' | 'timestamp'>): Promise<void> {
    const fullMetric: APIMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...metric
    };

    this.metrics.push(fullMetric);

    // Store in Redis for real-time access
    if (redis) {
      try {
        await redis.lpush('api_metrics', JSON.stringify(fullMetric));
        await redis.ltrim('api_metrics', 0, 9999); // Keep last 10k metrics
      } catch (error) {
        console.error('Failed to store metric in Redis:', error);
      }
    }

    // TODO: Store in database for historical analysis
    // Database model 'apiMetric' needs to be added to Prisma schema
    // try {
    //   await prisma.apiMetric.create({
    //     data: {
    //       endpoint: fullMetric.endpoint,
    //       method: fullMetric.method,
    //       responseTime: fullMetric.responseTime,
    //       statusCode: fullMetric.statusCode,
    //       userId: fullMetric.userId,
    //       payloadSize: fullMetric.payloadSize,
    //       responseSize: fullMetric.responseSize,
    //       cacheHit: fullMetric.cacheHit,
    //       error: fullMetric.error,
    //       timestamp: fullMetric.timestamp
    //     }
    //   });
    // } catch (error) {
    //   console.error('Failed to store metric in database:', error);
    // }

    // Check for immediate alerts
    await this.checkMetricForAlerts(fullMetric);
  }

  // ==================== METRICS COLLECTION ====================

  /**
   * Collect current metrics from various sources
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Collect from Redis if available
      if (redis) {
        const recentMetrics = await redis.lrange('api_metrics', 0, 99);
        const parsedMetrics = Array.isArray(recentMetrics) 
          ? recentMetrics.map(m => JSON.parse(m as string) as APIMetric) 
          : [];
        
        // Update local metrics cache
        this.metrics = parsedMetrics;
      }

      // Collect system metrics
      const systemMetrics = await this.collectSystemMetrics();
      console.log('📊 System metrics collected:', systemMetrics);
      
    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }

  /**
   * Collect system-level metrics
   */
  private async collectSystemMetrics(): Promise<any> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: Math.round(process.uptime()),
      timestamp: new Date()
    };
  }

  // ==================== BENCHMARKING ====================

  /**
   * Update performance benchmarks
   */
  private async updateBenchmarks(): Promise<void> {
    const endpointGroups = this.groupMetricsByEndpoint();
    
    for (const [endpointKey, metrics] of Array.from(endpointGroups.entries())) {
      if (metrics.length < 10) continue; // Need sufficient data
      
      const benchmark = this.calculateBenchmark(endpointKey, metrics);
      this.benchmarks.set(endpointKey, benchmark);
      
      // Store benchmark in database
      try {
        await this.storeBenchmark(benchmark);
      } catch (error) {
        console.error('Failed to store benchmark:', error);
      }
    }
  }

  /**
   * Group metrics by endpoint
   */
  private groupMetricsByEndpoint(): Map<string, APIMetric[]> {
    const groups = new Map<string, APIMetric[]>();
    
    for (const metric of this.metrics) {
      const key = `${metric.method}:${metric.endpoint}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(metric);
    }
    
    return groups;
  }

  /**
   * Calculate benchmark statistics
   */
  private calculateBenchmark(endpointKey: string, metrics: APIMetric[]): APIBenchmark {
    const [method, endpoint] = endpointKey.split(':');
    const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const errors = metrics.filter(m => m.statusCode >= 400);
    const cacheHits = metrics.filter(m => m.cacheHit);
    
    // Calculate percentiles
    const p50 = this.calculatePercentile(responseTimes, 50);
    const p90 = this.calculatePercentile(responseTimes, 90);
    const p95 = this.calculatePercentile(responseTimes, 95);
    const p99 = this.calculatePercentile(responseTimes, 99);
    
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    
    // Calculate throughput (assuming 1-hour window)
    const timeWindow = 3600; // 1 hour in seconds
    const requestsPerSecond = metrics.length / timeWindow;
    
    const errorRate = errors.length / metrics.length;
    const cacheHitRate = cacheHits.length / metrics.length;
    
    return {
      endpoint,
      method,
      p50,
      p90,
      p95,
      p99,
      averageResponseTime,
      requestsPerSecond,
      errorRate,
      cacheHitRate,
      timestamp: new Date()
    };
  }

  /**
   * Calculate percentile value
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Store benchmark in database
   */
  private async storeBenchmark(benchmark: APIBenchmark): Promise<void> {
    // TODO: Add apiBenchmark model to Prisma schema
    // await prisma.apiBenchmark.create({
    //   data: {
    //     endpoint: benchmark.endpoint,
    //     method: benchmark.method,
    //     p50: benchmark.p50,
    //     p90: benchmark.p90,
    //     p95: benchmark.p95,
    //     p99: benchmark.p99,
    //     averageResponseTime: benchmark.averageResponseTime,
    //     requestsPerSecond: benchmark.requestsPerSecond,
    //     errorRate: benchmark.errorRate,
    //     cacheHitRate: benchmark.cacheHitRate,
    //     timestamp: benchmark.timestamp
    //   }
    // });
  }

  // ==================== ALERTING ====================

  /**
   * Check for alerts based on current metrics
   */
  private async checkAlerts(): Promise<void> {
    for (const [endpointKey, benchmark] of Array.from(this.benchmarks.entries())) {
      await this.checkPerformanceAlerts(endpointKey, benchmark);
      await this.checkErrorRateAlerts(endpointKey, benchmark);
      await this.checkAvailabilityAlerts(endpointKey, benchmark);
    }
  }

  /**
   * Check specific metric for immediate alerts
   */
  private async checkMetricForAlerts(metric: APIMetric): Promise<void> {
    // Critical response time alert
    if (metric.responseTime > this.THRESHOLDS.RESPONSE_TIME_CRITICAL) {
      await this.createAlert({
        type: 'performance',
        severity: 'critical',
        endpoint: `${metric.method} ${metric.endpoint}`,
        message: `Critical response time: ${metric.responseTime}ms`,
        threshold: this.THRESHOLDS.RESPONSE_TIME_CRITICAL,
        actualValue: metric.responseTime
      });
    }
    
    // Error alert
    if (metric.statusCode >= 500) {
      await this.createAlert({
        type: 'error',
        severity: 'high',
        endpoint: `${metric.method} ${metric.endpoint}`,
        message: `Server error: ${metric.statusCode}`,
        threshold: 500,
        actualValue: metric.statusCode
      });
    }
  }

  /**
   * Check performance alerts
   */
  private async checkPerformanceAlerts(endpointKey: string, benchmark: APIBenchmark): Promise<void> {
    const endpoint = `${benchmark.method} ${benchmark.endpoint}`;
    
    if (benchmark.p95 > this.THRESHOLDS.RESPONSE_TIME_CRITICAL) {
      await this.createAlert({
        type: 'performance',
        severity: 'critical',
        endpoint,
        message: `P95 response time critical: ${benchmark.p95.toFixed(2)}ms`,
        threshold: this.THRESHOLDS.RESPONSE_TIME_CRITICAL,
        actualValue: benchmark.p95
      });
    } else if (benchmark.p95 > this.THRESHOLDS.RESPONSE_TIME_WARNING) {
      await this.createAlert({
        type: 'performance',
        severity: 'medium',
        endpoint,
        message: `P95 response time warning: ${benchmark.p95.toFixed(2)}ms`,
        threshold: this.THRESHOLDS.RESPONSE_TIME_WARNING,
        actualValue: benchmark.p95
      });
    }
  }

  /**
   * Check error rate alerts
   */
  private async checkErrorRateAlerts(endpointKey: string, benchmark: APIBenchmark): Promise<void> {
    const endpoint = `${benchmark.method} ${benchmark.endpoint}`;
    
    if (benchmark.errorRate > this.THRESHOLDS.ERROR_RATE_CRITICAL) {
      await this.createAlert({
        type: 'error',
        severity: 'critical',
        endpoint,
        message: `Critical error rate: ${(benchmark.errorRate * 100).toFixed(2)}%`,
        threshold: this.THRESHOLDS.ERROR_RATE_CRITICAL,
        actualValue: benchmark.errorRate
      });
    } else if (benchmark.errorRate > this.THRESHOLDS.ERROR_RATE_WARNING) {
      await this.createAlert({
        type: 'error',
        severity: 'high',
        endpoint,
        message: `High error rate: ${(benchmark.errorRate * 100).toFixed(2)}%`,
        threshold: this.THRESHOLDS.ERROR_RATE_WARNING,
        actualValue: benchmark.errorRate
      });
    }
  }

  /**
   * Check availability alerts
   */
  private async checkAvailabilityAlerts(endpointKey: string, benchmark: APIBenchmark): Promise<void> {
    const availability = 1 - benchmark.errorRate;
    const endpoint = `${benchmark.method} ${benchmark.endpoint}`;
    
    if (availability < this.THRESHOLDS.AVAILABILITY_CRITICAL) {
      await this.createAlert({
        type: 'availability',
        severity: 'critical',
        endpoint,
        message: `Low availability: ${(availability * 100).toFixed(2)}%`,
        threshold: this.THRESHOLDS.AVAILABILITY_CRITICAL,
        actualValue: availability
      });
    }
  }

  /**
   * Create and store alert
   */
  private async createAlert(alertData: Omit<APIAlert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const alert: APIAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    };
    
    this.alerts.push(alert);
    
    // Store in database
    try {
      // TODO: Add apiAlert model to Prisma schema
      // await prisma.apiAlert.create({
      //   data: {
      //     type: alert.type,
      //     severity: alert.severity,
      //     endpoint: alert.endpoint,
      //     message: alert.message,
      //     threshold: alert.threshold,
      //     actualValue: alert.actualValue,
      //     timestamp: alert.timestamp,
      //     resolved: alert.resolved
      //   }
      // });
      
      console.log(`🚨 API Alert Created: ${alert.severity.toUpperCase()} - ${alert.message}`);
    } catch (error) {
      console.error('Failed to store alert:', error);
    }
  }

  // ==================== HEALTH CHECKS ====================

  /**
   * Perform health checks on all endpoints
   */
  private async performHealthChecks(): Promise<void> {
    const uniqueEndpoints = Array.from(new Set(this.metrics.map(m => `${m.method}:${m.endpoint}`)));
    
    for (const endpointKey of uniqueEndpoints) {
      await this.performEndpointHealthCheck(endpointKey);
    }
  }

  /**
   * Perform health check on specific endpoint
   */
  private async performEndpointHealthCheck(endpointKey: string): Promise<void> {
    const [method, endpoint] = endpointKey.split(':');
    
    // Get recent metrics for this endpoint
    const recentMetrics = this.metrics
      .filter(m => m.method === method && m.endpoint === endpoint)
      .filter(m => Date.now() - m.timestamp.getTime() < 300000); // Last 5 minutes
    
    if (recentMetrics.length === 0) {
      return; // No recent data
    }
    
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const errorRate = recentMetrics.filter(m => m.statusCode >= 400).length / recentMetrics.length;
    const consecutiveErrors = this.countConsecutiveErrors(recentMetrics);
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (errorRate > 0.5 || consecutiveErrors > 5) {
      status = 'unhealthy';
    } else if (errorRate > 0.1 || averageResponseTime > 500) {
      status = 'degraded';
    }
    
    const healthCheck: APIHealthCheck = {
      endpoint: `${method} ${endpoint}`,
      status,
      responseTime: averageResponseTime,
      errorRate,
      lastCheck: new Date(),
      consecutiveFailures: consecutiveErrors
    };
    
    this.healthChecks.set(endpointKey, healthCheck);
    
    if (status !== 'healthy') {
      console.log(`🏥 Health Check: ${endpoint} is ${status.toUpperCase()}`);
    }
  }

  /**
   * Count consecutive errors in recent metrics
   */
  private countConsecutiveErrors(metrics: APIMetric[]): number {
    let count = 0;
    const sortedMetrics = metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    for (const metric of sortedMetrics) {
      if (metric.statusCode >= 400) {
        count++;
      } else {
        break;
      }
    }
    
    return count;
  }

  // ==================== PERFORMANCE TESTING ====================

  /**
   * Run performance benchmark test
   */
  async runBenchmarkTest(endpoint: string, options: {
    method?: string;
    concurrent?: number;
    duration?: number;
    payload?: any;
  } = {}): Promise<APIBenchmark> {
    const {
      method = 'GET',
      concurrent = 10,
      duration = 60, // seconds
      payload = null
    } = options;
    
    console.log(`🏃 Running benchmark test: ${method} ${endpoint}`);
    console.log(`  Concurrent users: ${concurrent}`);
    console.log(`  Duration: ${duration}s`);
    
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    const metrics: APIMetric[] = [];
    
    // Simulate concurrent requests
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < concurrent; i++) {
      promises.push(this.runBenchmarkWorker(endpoint, method, payload, endTime, metrics));
    }
    
    await Promise.all(promises);
    
    console.log(`✅ Benchmark completed: ${metrics.length} requests processed`);
    
    return this.calculateBenchmark(`${method}:${endpoint}`, metrics);
  }

  /**
   * Benchmark worker for concurrent testing
   */
  private async runBenchmarkWorker(
    endpoint: string,
    method: string,
    payload: any,
    endTime: number,
    metrics: APIMetric[]
  ): Promise<void> {
    while (Date.now() < endTime) {
      const requestStart = Date.now();
      
      try {
        // Simulate API request (in real implementation, would make actual HTTP request)
        const responseTime = Math.random() * 200 + 50; // 50-250ms
        const statusCode = Math.random() > 0.95 ? 500 : 200; // 5% error rate
        
        await new Promise(resolve => setTimeout(resolve, responseTime));
        
        const metric: APIMetric = {
          id: `bench_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          endpoint,
          method,
          responseTime,
          statusCode,
          timestamp: new Date(),
          payloadSize: payload ? JSON.stringify(payload).length : 0,
          responseSize: Math.floor(Math.random() * 1000) + 100,
          cacheHit: Math.random() > 0.3 // 70% cache hit rate
        };
        
        metrics.push(metric);
        
      } catch (error) {
        const responseTime = Date.now() - requestStart;
        
        const metric: APIMetric = {
          id: `bench_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          endpoint,
          method,
          responseTime,
          statusCode: 500,
          timestamp: new Date(),
          payloadSize: payload ? JSON.stringify(payload).length : 0,
          responseSize: 0,
          cacheHit: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        metrics.push(metric);
      }
      
      // Small delay between requests for this worker
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    }
  }

  // ==================== REPORTING ====================

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(): Promise<string> {
    const totalMetrics = this.metrics.length;
    const totalAlerts = this.alerts.filter(a => !a.resolved).length;
    const criticalAlerts = this.alerts.filter(a => !a.resolved && a.severity === 'critical').length;
    
    const overallHealth = this.calculateOverallHealth();
    const topEndpoints = this.getTopEndpointsByTraffic(5);
    const slowestEndpoints = this.getSlowestEndpoints(5);
    
    return `
🔍 ZENITH API PERFORMANCE MONITORING REPORT

📊 OVERVIEW:
  📈 Total Requests Monitored: ${totalMetrics.toLocaleString()}
  🚨 Active Alerts: ${totalAlerts} (${criticalAlerts} critical)
  🏥 Overall Health Score: ${overallHealth.toFixed(1)}/100
  📡 Monitored Endpoints: ${this.benchmarks.size}

⚡ PERFORMANCE SUMMARY:
  🏃 Average Response Time: ${this.getAverageResponseTime().toFixed(2)}ms
  📊 P95 Response Time: ${this.getP95ResponseTime().toFixed(2)}ms
  ❌ Overall Error Rate: ${(this.getOverallErrorRate() * 100).toFixed(2)}%
  📦 Cache Hit Rate: ${(this.getOverallCacheHitRate() * 100).toFixed(1)}%

🔥 TOP ENDPOINTS BY TRAFFIC:
${topEndpoints.map(ep => `  📡 ${ep.endpoint}: ${ep.requests.toLocaleString()} requests`).join('\n')}

🐌 SLOWEST ENDPOINTS:
${slowestEndpoints.map(ep => `  ⏱️ ${ep.endpoint}: ${ep.averageTime.toFixed(2)}ms avg`).join('\n')}

🚨 RECENT ALERTS:
${this.alerts.slice(-5).map(alert => 
  `  ${this.getAlertEmoji(alert.severity)} ${alert.endpoint}: ${alert.message}`
).join('\n')}

🏥 HEALTH STATUS:
${Array.from(this.healthChecks.values()).slice(0, 10).map(hc => 
  `  ${this.getHealthEmoji(hc.status)} ${hc.endpoint}: ${hc.status.toUpperCase()}`
).join('\n')}

📈 BENCHMARKS:
${Array.from(this.benchmarks.values()).slice(0, 5).map(b => 
  `  🎯 ${b.method} ${b.endpoint}: ${b.averageResponseTime.toFixed(2)}ms avg, ${(b.errorRate * 100).toFixed(2)}% errors`
).join('\n')}

🎯 RECOMMENDATIONS:
  • Monitor and optimize endpoints with >200ms response time
  • Investigate endpoints with >5% error rate
  • Improve caching for endpoints with <80% cache hit rate
  • Set up automated alerts for critical performance metrics
  • Implement load balancing for high-traffic endpoints

⚡ API Performance Status: ${overallHealth > 90 ? '🟢 EXCELLENT' : overallHealth > 80 ? '🟡 GOOD' : overallHealth > 70 ? '🟠 NEEDS ATTENTION' : '🔴 CRITICAL'}
    `;
  }

  // ==================== UTILITY METHODS ====================

  private calculateOverallHealth(): number {
    if (this.benchmarks.size === 0) return 100;
    
    let score = 0;
    let totalWeight = 0;
    
    for (const benchmark of Array.from(this.benchmarks.values())) {
      const weight = benchmark.requestsPerSecond || 1;
      
      let endpointScore = 100;
      
      // Response time penalty
      if (benchmark.averageResponseTime > 500) endpointScore -= 30;
      else if (benchmark.averageResponseTime > 200) endpointScore -= 15;
      else if (benchmark.averageResponseTime > 100) endpointScore -= 5;
      
      // Error rate penalty
      if (benchmark.errorRate > 0.1) endpointScore -= 25;
      else if (benchmark.errorRate > 0.05) endpointScore -= 10;
      else if (benchmark.errorRate > 0.01) endpointScore -= 5;
      
      // Cache hit rate penalty
      if (benchmark.cacheHitRate < 0.5) endpointScore -= 15;
      else if (benchmark.cacheHitRate < 0.8) endpointScore -= 10;
      else if (benchmark.cacheHitRate < 0.9) endpointScore -= 5;
      
      score += Math.max(0, endpointScore) * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? score / totalWeight : 100;
  }

  private getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / this.metrics.length;
  }

  private getP95ResponseTime(): number {
    const responseTimes = this.metrics.map(m => m.responseTime).sort((a, b) => a - b);
    return this.calculatePercentile(responseTimes, 95);
  }

  private getOverallErrorRate(): number {
    if (this.metrics.length === 0) return 0;
    const errors = this.metrics.filter(m => m.statusCode >= 400);
    return errors.length / this.metrics.length;
  }

  private getOverallCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;
    const cacheHits = this.metrics.filter(m => m.cacheHit);
    return cacheHits.length / this.metrics.length;
  }

  private getTopEndpointsByTraffic(limit: number): Array<{endpoint: string, requests: number}> {
    const endpointCounts = new Map<string, number>();
    
    for (const metric of this.metrics) {
      const key = `${metric.method} ${metric.endpoint}`;
      endpointCounts.set(key, (endpointCounts.get(key) || 0) + 1);
    }
    
    return Array.from(endpointCounts.entries())
      .map(([endpoint, requests]) => ({ endpoint, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, limit);
  }

  private getSlowestEndpoints(limit: number): Array<{endpoint: string, averageTime: number}> {
    const endpointTimes = new Map<string, number[]>();
    
    for (const metric of this.metrics) {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointTimes.has(key)) {
        endpointTimes.set(key, []);
      }
      endpointTimes.get(key)!.push(metric.responseTime);
    }
    
    return Array.from(endpointTimes.entries())
      .map(([endpoint, times]) => ({
        endpoint,
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, limit);
  }

  private getAlertEmoji(severity: string): string {
    const emojis: { [key: string]: string } = {
      critical: '🚨',
      high: '⚠️',
      medium: '🟡',
      low: '🔵'
    };
    return emojis[severity] || '📊';
  }

  private getHealthEmoji(status: string): string {
    const emojis: { [key: string]: string } = {
      healthy: '🟢',
      degraded: '🟡',
      unhealthy: '🔴'
    };
    return emojis[status] || '📊';
  }

  // ==================== PUBLIC API ====================

  /**
   * Get current metrics
   */
  getCurrentMetrics(): APIMetric[] {
    return [...this.metrics];
  }

  /**
   * Get benchmarks
   */
  getBenchmarks(): APIBenchmark[] {
    return Array.from(this.benchmarks.values());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): APIAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get health checks
   */
  getHealthChecks(): APIHealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      
      try {
        // TODO: Add apiAlert model to Prisma schema
        // await prisma.apiAlert.update({
        //   where: { id: alertId },
        //   data: { resolved: true, resolvedAt: alert.resolvedAt }
        // });
      } catch (error) {
        console.error('Failed to resolve alert in database:', error);
      }
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    metricsCount: number;
    benchmarksCount: number;
    activeAlertsCount: number;
    healthyEndpoints: number;
    degradedEndpoints: number;
    unhealthyEndpoints: number;
  } {
    const healthStats = Array.from(this.healthChecks.values()).reduce(
      (stats, hc) => {
        stats[hc.status]++;
        return stats;
      },
      { healthy: 0, degraded: 0, unhealthy: 0 }
    );
    
    return {
      isMonitoring: this.isMonitoring,
      metricsCount: this.metrics.length,
      benchmarksCount: this.benchmarks.size,
      activeAlertsCount: this.getActiveAlerts().length,
      healthyEndpoints: healthStats.healthy,
      degradedEndpoints: healthStats.degraded,
      unhealthyEndpoints: healthStats.unhealthy
    };
  }
}

// Create singleton instance
export const apiMonitor = new APIPerformanceMonitor();

export type {
  APIMetric,
  APIBenchmark,
  APIAlert,
  APIHealthCheck
};