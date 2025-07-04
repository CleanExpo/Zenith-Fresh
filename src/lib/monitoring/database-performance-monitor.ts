/**
 * Database Performance Monitoring System
 * 
 * Advanced monitoring for Prisma/PostgreSQL performance with autonomous optimization
 * Part of the No-BS Production Framework
 */

import { PrismaClient } from '@prisma/client';
import { redis } from '@/lib/redis';
import { enhancedSentryMonitoring } from './enhanced-sentry';
import { analyticsEngine } from '@/lib/analytics/analytics-enhanced';

interface QueryMetrics {
  id: string;
  query: string;
  model: string;
  operation: string;
  duration: number;
  timestamp: Date;
  params?: any;
  userId?: string;
  endpoint?: string;
  resultCount?: number;
  errorMessage?: string;
}

interface SlowQueryAlert {
  id: string;
  query: string;
  duration: number;
  threshold: number;
  frequency: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  suggestedOptimizations: string[];
  severity: 'warning' | 'critical';
}

interface DatabaseHealthMetrics {
  timestamp: Date;
  activeConnections: number;
  maxConnections: number;
  connectionPoolUtilization: number;
  avgQueryDuration: number;
  slowQueries: number;
  errorRate: number;
  transactionCount: number;
  cacheHitRate: number;
  indexUsage: number;
}

interface PerformanceThresholds {
  slowQueryWarning: number; // milliseconds
  slowQueryCritical: number;
  connectionUtilizationWarning: number; // percentage
  connectionUtilizationCritical: number;
  errorRateWarning: number; // percentage
  errorRateCritical: number;
}

class DatabasePerformanceMonitor {
  private readonly METRICS_RETENTION_HOURS = 24;
  private readonly SLOW_QUERY_CACHE_TTL = 3600; // 1 hour
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute
  
  private thresholds: PerformanceThresholds = {
    slowQueryWarning: 1000, // 1 second
    slowQueryCritical: 5000, // 5 seconds
    connectionUtilizationWarning: 70, // 70%
    connectionUtilizationCritical: 90, // 90%
    errorRateWarning: 1, // 1%
    errorRateCritical: 5 // 5%
  };

  private queryCache: Map<string, QueryMetrics[]> = new Map();
  private slowQueryPatterns: Map<string, SlowQueryAlert> = new Map();
  private prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient;
    this.initializeMonitoring();
    this.startHealthMonitoring();
    console.log('🗃️ Database performance monitoring initialized');
  }

  /**
   * Initialize Prisma middleware for query monitoring
   */
  private initializeMonitoring(): void {
    this.prismaClient.$use(async (params, next) => {
      const startTime = Date.now();
      const queryId = this.generateQueryId(params);
      
      try {
        const result = await next(params);
        const duration = Date.now() - startTime;
        
        // Record successful query metrics
        await this.recordQueryMetrics({
          id: queryId,
          query: this.buildQueryString(params),
          model: params.model || 'unknown',
          operation: params.action,
          duration,
          timestamp: new Date(),
          params: this.sanitizeParams(params.args),
          resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0)
        });
        
        // Check for slow queries
        if (duration > this.thresholds.slowQueryWarning) {
          await this.handleSlowQuery(queryId, params, duration);
        }
        
        return result;
        
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Record failed query metrics
        await this.recordQueryMetrics({
          id: queryId,
          query: this.buildQueryString(params),
          model: params.model || 'unknown',
          operation: params.action,
          duration,
          timestamp: new Date(),
          params: this.sanitizeParams(params.args),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Report error to Sentry
        await enhancedSentryMonitoring.captureEnhancedError(error as Error, {
          endpoint: 'database',
          environment: process.env.NODE_ENV || 'development'
        });
        
        throw error;
      }
    });
  }

  /**
   * Record query metrics for analysis
   */
  private async recordQueryMetrics(metrics: QueryMetrics): Promise<void> {
    // Store in Redis for real-time analysis
    await redis?.setex(
      `db_query:${metrics.id}`,
      this.METRICS_RETENTION_HOURS * 3600,
      JSON.stringify(metrics)
    );
    
    // Add to cache for pattern analysis
    const queryPattern = this.extractQueryPattern(metrics.query);
    if (!this.queryCache.has(queryPattern)) {
      this.queryCache.set(queryPattern, []);
    }
    
    const queries = this.queryCache.get(queryPattern)!;
    queries.push(metrics);
    
    // Keep only recent queries (last 1000 per pattern)
    if (queries.length > 1000) {
      queries.splice(0, queries.length - 1000);
    }
    
    // Track in analytics
    await analyticsEngine.trackEvent({
      event: 'database_query',
      properties: {
        model: metrics.model,
        operation: metrics.operation,
        duration: metrics.duration,
        success: !metrics.errorMessage,
        resultCount: metrics.resultCount || 0
      }
    });
  }

  /**
   * Handle slow query detection and optimization
   */
  private async handleSlowQuery(
    queryId: string, 
    params: any, 
    duration: number
  ): Promise<void> {
    const query = this.buildQueryString(params);
    const patternKey = this.extractQueryPattern(query);
    
    let alert = this.slowQueryPatterns.get(patternKey);
    
    if (!alert) {
      alert = {
        id: patternKey,
        query,
        duration,
        threshold: this.thresholds.slowQueryWarning,
        frequency: 1,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        suggestedOptimizations: this.generateOptimizationSuggestions(params),
        severity: duration > this.thresholds.slowQueryCritical ? 'critical' : 'warning'
      };
    } else {
      alert.frequency++;
      alert.lastOccurrence = new Date();
      alert.duration = Math.max(alert.duration, duration); // Track worst case
      alert.severity = duration > this.thresholds.slowQueryCritical ? 'critical' : 'warning';
    }
    
    this.slowQueryPatterns.set(patternKey, alert);
    
    // Store alert
    await redis?.setex(
      `slow_query:${patternKey}`,
      this.SLOW_QUERY_CACHE_TTL,
      JSON.stringify(alert)
    );
    
    // Log slow query
    console.warn(`🐌 Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
    
    // Create autonomous optimization mission for critical queries
    if (alert.severity === 'critical' && alert.frequency >= 5) {
      await this.triggerAutonomousOptimization(alert);
    }
  }

  /**
   * Generate optimization suggestions for slow queries
   */
  private generateOptimizationSuggestions(params: any): string[] {
    const suggestions: string[] = [];
    
    // Basic optimization suggestions based on query type
    switch (params.action) {
      case 'findMany':
        suggestions.push('Consider adding database indexes for WHERE clauses');
        suggestions.push('Use cursor-based pagination instead of offset');
        suggestions.push('Add select fields to reduce data transfer');
        if (params.args?.include) {
          suggestions.push('Consider using separate queries instead of complex includes');
        }
        break;
        
      case 'findFirst':
      case 'findUnique':
        suggestions.push('Ensure query uses indexed fields');
        suggestions.push('Consider adding composite indexes for multi-field queries');
        break;
        
      case 'create':
      case 'createMany':
        suggestions.push('Use batch operations for multiple records');
        suggestions.push('Consider using upsert for conditional creation');
        break;
        
      case 'update':
      case 'updateMany':
        suggestions.push('Ensure WHERE clause uses indexed fields');
        suggestions.push('Consider breaking large updates into smaller batches');
        break;
        
      case 'delete':
      case 'deleteMany':
        suggestions.push('Ensure WHERE clause uses indexed fields');
        suggestions.push('Consider soft deletes for large datasets');
        break;
    }
    
    // Generic suggestions
    suggestions.push('Review query execution plan');
    suggestions.push('Consider adding Redis caching for frequently accessed data');
    
    return suggestions;
  }

  /**
   * Start continuous health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      try {
        await this.collectHealthMetrics();
      } catch (error) {
        console.error('Database health monitoring failed:', error);
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Collect comprehensive database health metrics
   */
  private async collectHealthMetrics(): Promise<DatabaseHealthMetrics> {
    const timestamp = new Date();
    
    // Get connection pool info (simulated for Prisma)
    const connectionInfo = await this.getConnectionInfo();
    
    // Get recent query metrics
    const recentQueries = await this.getRecentQueryMetrics(300000); // Last 5 minutes
    
    const totalQueries = recentQueries.length;
    const slowQueries = recentQueries.filter(q => q.duration > this.thresholds.slowQueryWarning).length;
    const errorQueries = recentQueries.filter(q => q.errorMessage).length;
    
    const avgDuration = totalQueries > 0 
      ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / totalQueries 
      : 0;
    
    const errorRate = totalQueries > 0 ? (errorQueries / totalQueries) * 100 : 0;
    
    const healthMetrics: DatabaseHealthMetrics = {
      timestamp,
      activeConnections: connectionInfo.active,
      maxConnections: connectionInfo.max,
      connectionPoolUtilization: (connectionInfo.active / connectionInfo.max) * 100,
      avgQueryDuration: Math.round(avgDuration),
      slowQueries,
      errorRate: Math.round(errorRate * 100) / 100,
      transactionCount: await this.getTransactionCount(),
      cacheHitRate: await this.getCacheHitRate(),
      indexUsage: await this.getIndexUsageStats()
    };
    
    // Store health metrics
    await redis?.setex(
      `db_health:${timestamp.getTime()}`,
      this.METRICS_RETENTION_HOURS * 3600,
      JSON.stringify(healthMetrics)
    );
    
    // Check for health alerts
    await this.checkHealthAlerts(healthMetrics);
    
    return healthMetrics;
  }

  /**
   * Check for health-related alerts
   */
  private async checkHealthAlerts(metrics: DatabaseHealthMetrics): Promise<void> {
    // Connection utilization alert
    if (metrics.connectionPoolUtilization > this.thresholds.connectionUtilizationCritical) {
      await this.createHealthAlert('critical', 'High connection pool utilization', {
        utilization: metrics.connectionPoolUtilization,
        activeConnections: metrics.activeConnections,
        maxConnections: metrics.maxConnections
      });
    } else if (metrics.connectionPoolUtilization > this.thresholds.connectionUtilizationWarning) {
      await this.createHealthAlert('warning', 'Elevated connection pool utilization', {
        utilization: metrics.connectionPoolUtilization
      });
    }
    
    // Error rate alert
    if (metrics.errorRate > this.thresholds.errorRateCritical) {
      await this.createHealthAlert('critical', 'High database error rate', {
        errorRate: metrics.errorRate
      });
    } else if (metrics.errorRate > this.thresholds.errorRateWarning) {
      await this.createHealthAlert('warning', 'Elevated database error rate', {
        errorRate: metrics.errorRate
      });
    }
    
    // Slow query alert
    if (metrics.slowQueries > 10) {
      await this.createHealthAlert('warning', 'High number of slow queries', {
        slowQueries: metrics.slowQueries,
        avgDuration: metrics.avgQueryDuration
      });
    }
  }

  /**
   * Trigger autonomous database optimization
   */
  private async triggerAutonomousOptimization(alert: SlowQueryAlert): Promise<void> {
    const optimizationMission = {
      goal: `Optimize slow database query: ${alert.query.substring(0, 100)}...`,
      type: 'database_optimization',
      priority: alert.severity === 'critical' ? 'critical' : 'high',
      anomaly: {
        id: alert.id,
        type: 'slow_query',
        severity: alert.severity,
        description: `Slow query detected: ${alert.frequency} occurrences, max duration ${alert.duration}ms`,
        query: alert.query,
        duration: alert.duration,
        frequency: alert.frequency,
        suggestedOptimizations: alert.suggestedOptimizations
      },
      context: {
        queryPattern: alert.query,
        optimizations: alert.suggestedOptimizations,
        performance: {
          duration: alert.duration,
          frequency: alert.frequency,
          threshold: alert.threshold
        }
      }
    };

    // Store mission for autonomous optimization
    await redis?.setex(
      `optimization_mission:${alert.id}`,
      3600,
      JSON.stringify(optimizationMission)
    );

    console.log(`🔧 Triggered autonomous optimization for query: ${alert.id}`);
  }

  /**
   * Utility methods
   */
  private generateQueryId(params: any): string {
    const signature = `${params.model}.${params.action}.${JSON.stringify(params.args)}`;
    return Buffer.from(signature).toString('base64').substring(0, 16);
  }

  private buildQueryString(params: any): string {
    return `${params.model}.${params.action}(${JSON.stringify(params.args)})`;
  }

  private extractQueryPattern(query: string): string {
    // Remove specific values to identify query patterns
    return query
      .replace(/"[^"]*"/g, '"?"')  // Replace string values
      .replace(/\d+/g, '?')        // Replace numbers
      .replace(/\s+/g, ' ')        // Normalize whitespace
      .trim();
  }

  private sanitizeParams(args: any): any {
    if (!args) return args;
    
    // Remove sensitive data from params
    const sanitized = { ...args };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'hash'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  private async getConnectionInfo(): Promise<{ active: number; max: number }> {
    // Simulate connection pool info (Prisma doesn't expose this directly)
    return {
      active: Math.floor(Math.random() * 10) + 1,
      max: 20
    };
  }

  private async getRecentQueryMetrics(timeWindowMs: number): Promise<QueryMetrics[]> {
    const keys = await redis?.keys('db_query:*') || [];
    const cutoffTime = Date.now() - timeWindowMs;
    const recentQueries: QueryMetrics[] = [];
    
    for (const key of keys) {
      const data = await redis?.get(key);
      if (data) {
        const query = JSON.parse(data);
        if (new Date(query.timestamp).getTime() > cutoffTime) {
          recentQueries.push(query);
        }
      }
    }
    
    return recentQueries;
  }

  private async getTransactionCount(): Promise<number> {
    // Simulate transaction count
    return Math.floor(Math.random() * 100) + 50;
  }

  private async getCacheHitRate(): Promise<number> {
    // Simulate cache hit rate
    return Math.floor(Math.random() * 20) + 80; // 80-100%
  }

  private async getIndexUsageStats(): Promise<number> {
    // Simulate index usage percentage
    return Math.floor(Math.random() * 30) + 70; // 70-100%
  }

  private async createHealthAlert(severity: string, message: string, metadata: any): Promise<void> {
    console.log(`🚨 Database ${severity}: ${message}`, metadata);
    
    await redis?.setex(
      `db_alert:${Date.now()}`,
      86400, // 24 hours
      JSON.stringify({
        type: 'database_health',
        severity,
        message,
        metadata,
        timestamp: new Date().toISOString()
      })
    );
  }

  /**
   * Public methods for external access
   */
  async getSlowQueries(): Promise<SlowQueryAlert[]> {
    const keys = await redis?.keys('slow_query:*') || [];
    const alerts = [];

    for (const key of keys) {
      const data = await redis?.get(key);
      if (data) {
        alerts.push(JSON.parse(data));
      }
    }

    return alerts.sort((a, b) => b.duration - a.duration);
  }

  async getHealthMetrics(hours: number = 1): Promise<DatabaseHealthMetrics[]> {
    const cutoffTime = Date.now() - (hours * 3600 * 1000);
    const keys = await redis?.keys('db_health:*') || [];
    const metrics = [];

    for (const key of keys) {
      const timestamp = parseInt(key.split(':')[1]);
      if (timestamp > cutoffTime) {
        const data = await redis?.get(key);
        if (data) {
          metrics.push(JSON.parse(data));
        }
      }
    }

    return metrics.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getQueryAnalytics(timeWindowMs: number = 3600000): Promise<{
    totalQueries: number;
    avgDuration: number;
    slowQueries: number;
    errorRate: number;
    topSlowQueries: QueryMetrics[];
  }> {
    const queries = await this.getRecentQueryMetrics(timeWindowMs);
    const slowQueries = queries.filter(q => q.duration > this.thresholds.slowQueryWarning);
    const errorQueries = queries.filter(q => q.errorMessage);
    
    const avgDuration = queries.length > 0 
      ? queries.reduce((sum, q) => sum + q.duration, 0) / queries.length 
      : 0;
    
    const topSlowQueries = [...queries]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalQueries: queries.length,
      avgDuration: Math.round(avgDuration),
      slowQueries: slowQueries.length,
      errorRate: queries.length > 0 ? (errorQueries.length / queries.length) * 100 : 0,
      topSlowQueries
    };
  }

  async getDatabaseHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: DatabaseHealthMetrics | null;
    alerts: number;
    slowQueries: number;
  }> {
    const recentMetrics = await this.getHealthMetrics(0.1); // Last 6 minutes
    const latestMetrics = recentMetrics[recentMetrics.length - 1] || null;
    const slowQueries = await this.getSlowQueries();
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (latestMetrics) {
      if (latestMetrics.connectionPoolUtilization > this.thresholds.connectionUtilizationCritical ||
          latestMetrics.errorRate > this.thresholds.errorRateCritical) {
        status = 'critical';
      } else if (latestMetrics.connectionPoolUtilization > this.thresholds.connectionUtilizationWarning ||
                 latestMetrics.errorRate > this.thresholds.errorRateWarning ||
                 latestMetrics.slowQueries > 5) {
        status = 'warning';
      }
    }
    
    const alertKeys = await redis?.keys('db_alert:*') || [];
    
    return {
      status,
      metrics: latestMetrics,
      alerts: alertKeys.length,
      slowQueries: slowQueries.length
    };
  }
}

// Export singleton instance factory
let dbMonitorInstance: DatabasePerformanceMonitor | null = null;

export function createDatabaseMonitor(prismaClient: PrismaClient): DatabasePerformanceMonitor {
  if (!dbMonitorInstance) {
    dbMonitorInstance = new DatabasePerformanceMonitor(prismaClient);
  }
  return dbMonitorInstance;
}

export { DatabasePerformanceMonitor };

// Export types
export type {
  QueryMetrics,
  SlowQueryAlert,
  DatabaseHealthMetrics,
  PerformanceThresholds
};