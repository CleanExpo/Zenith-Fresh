import { RedisOperations } from './redis';

interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

export class PerformanceMonitor {
  private static readonly METRICS_KEY_PREFIX = 'perf:';
  private static readonly METRICS_TTL = 3600; // 1 hour
  private static readonly SLOW_REQUEST_THRESHOLD = 200; // 200ms

  /**
   * Start timing a request
   */
  static startTimer(): { stop: () => number } {
    const startTime = process.hrtime.bigint();
    
    return {
      stop: () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
        return duration;
      }
    };
  }

  /**
   * Record a performance metric
   */
  static async recordMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const key = `${this.METRICS_KEY_PREFIX}${metric.endpoint}:${Date.now()}`;
      await RedisOperations.setex(
        key,
        this.METRICS_TTL,
        JSON.stringify(metric)
      );

      // Track slow requests separately
      if (metric.duration > this.SLOW_REQUEST_THRESHOLD) {
        const slowKey = `${this.METRICS_KEY_PREFIX}slow:${metric.endpoint}:${Date.now()}`;
        await RedisOperations.setex(
          slowKey,
          this.METRICS_TTL * 24, // Keep slow request data for 24 hours
          JSON.stringify(metric)
        );
      }

      // Update endpoint statistics
      await this.updateEndpointStats(metric);
    } catch (error) {
      console.error('Failed to record performance metric:', error);
    }
  }

  /**
   * Update aggregate statistics for an endpoint
   */
  private static async updateEndpointStats(metric: PerformanceMetric): Promise<void> {
    const statsKey = `${this.METRICS_KEY_PREFIX}stats:${metric.endpoint}`;
    
    try {
      const existingStats = await RedisOperations.get(statsKey);
      const stats = existingStats ? JSON.parse(existingStats) : {
        count: 0,
        totalDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        errorCount: 0,
        lastUpdated: Date.now()
      };

      stats.count++;
      stats.totalDuration += metric.duration;
      stats.maxDuration = Math.max(stats.maxDuration, metric.duration);
      stats.minDuration = Math.min(stats.minDuration, metric.duration);
      stats.avgDuration = stats.totalDuration / stats.count;
      stats.lastUpdated = Date.now();

      if (metric.statusCode >= 400) {
        stats.errorCount++;
      }

      await RedisOperations.setex(
        statsKey,
        this.METRICS_TTL * 24, // Keep stats for 24 hours
        JSON.stringify(stats)
      );
    } catch (error) {
      console.error('Failed to update endpoint statistics:', error);
    }
  }

  /**
   * Get performance statistics for an endpoint
   */
  static async getEndpointStats(endpoint: string): Promise<any> {
    const statsKey = `${this.METRICS_KEY_PREFIX}stats:${endpoint}`;
    const stats = await RedisOperations.get(statsKey);
    return stats ? JSON.parse(stats) : null;
  }

  /**
   * Get all performance metrics for monitoring
   */
  static async getAllStats(): Promise<Record<string, any>> {
    // This would be more complex in production, using Redis SCAN
    // For now, return a simplified version
    return {
      message: 'Use specific endpoint stats or implement Redis SCAN for all metrics'
    };
  }

  /**
   * Middleware for Next.js API routes
   */
  static middleware() {
    return async (req: Request, context: any) => {
      const timer = this.startTimer();
      const url = new URL(req.url);
      const endpoint = url.pathname;
      const method = req.method;

      try {
        const response = await context.next();
        const duration = timer.stop();

        // Record metric asynchronously (don't block response)
        this.recordMetric({
          endpoint,
          method,
          duration,
          statusCode: response.status,
          timestamp: Date.now(),
          userAgent: req.headers.get('user-agent') || undefined,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
        }).catch(console.error);

        // Add performance headers
        const headers = new Headers(response.headers);
        headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
        headers.set('X-Performance-Status', duration > this.SLOW_REQUEST_THRESHOLD ? 'slow' : 'ok');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      } catch (error) {
        const duration = timer.stop();
        
        // Record error metric
        this.recordMetric({
          endpoint,
          method,
          duration,
          statusCode: 500,
          timestamp: Date.now()
        }).catch(console.error);

        throw error;
      }
    };
  }
}

/**
 * Request timing decorator for individual functions
 */
export function measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function(...args: any[]) {
    const timer = PerformanceMonitor.startTimer();
    const className = target.constructor.name;
    const methodName = `${className}.${propertyKey}`;

    try {
      const result = await originalMethod.apply(this, args);
      const duration = timer.stop();

      if (duration > 100) { // Log slow operations
        console.warn(`Slow operation: ${methodName} took ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = timer.stop();
      console.error(`Error in ${methodName} after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };

  return descriptor;
}