import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { performance } from 'perf_hooks';

interface QueryMetrics {
  query: string;
  duration: number;
  executedAt: Date;
  parameters?: any;
  rowsReturned?: number;
  explain?: any;
}

interface IndexRecommendation {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  reason: string;
  estimatedImprovement: number;
  priority: 'high' | 'medium' | 'low';
}

interface QueryPlan {
  query: string;
  plan: any;
  cost: number;
  estimatedRows: number;
  actualTime: number;
}

export class DatabaseOptimizer {
  private prisma: PrismaClient;
  private redis: Redis;
  private queryMetrics: Map<string, QueryMetrics[]> = new Map();
  private slowQueryThreshold = 100; // milliseconds

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
    this.setupQueryLogging();
  }

  /**
   * Setup query logging middleware for performance monitoring
   */
  private setupQueryLogging() {
    this.prisma.$use(async (params, next) => {
      const start = performance.now();
      const result = await next(params);
      const duration = performance.now() - start;

      const queryMetric: QueryMetrics = {
        query: `${params.model}.${params.action}`,
        duration,
        executedAt: new Date(),
        parameters: params.args,
        rowsReturned: Array.isArray(result) ? result.length : result ? 1 : 0,
      };

      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        await this.logSlowQuery(queryMetric);
      }

      // Store metrics in memory for analysis
      const queryKey = queryMetric.query;
      if (!this.queryMetrics.has(queryKey)) {
        this.queryMetrics.set(queryKey, []);
      }
      this.queryMetrics.get(queryKey)!.push(queryMetric);

      // Keep only last 1000 metrics per query type
      const metrics = this.queryMetrics.get(queryKey)!;
      if (metrics.length > 1000) {
        metrics.splice(0, metrics.length - 1000);
      }

      return result;
    });
  }

  /**
   * Log slow queries to Redis for analysis
   */
  private async logSlowQuery(metric: QueryMetrics) {
    const slowQueryKey = `slow_queries:${new Date().toISOString().split('T')[0]}`;
    await this.redis.lpush(slowQueryKey, JSON.stringify(metric));
    await this.redis.expire(slowQueryKey, 7 * 24 * 3600); // Keep for 7 days
  }

  /**
   * Analyze query performance and generate optimization recommendations
   */
  async analyzeQueries(): Promise<{
    slowQueries: QueryMetrics[];
    recommendations: IndexRecommendation[];
    queryPlans: QueryPlan[];
    statistics: any;
  }> {
    const slowQueries = await this.getSlowQueries();
    const recommendations = await this.generateIndexRecommendations();
    const queryPlans = await this.analyzeQueryPlans();
    const statistics = this.generateQueryStatistics();

    return {
      slowQueries,
      recommendations,
      queryPlans,
      statistics,
    };
  }

  /**
   * Get slow queries from the last 24 hours
   */
  async getSlowQueries(limit = 100): Promise<QueryMetrics[]> {
    const today = new Date().toISOString().split('T')[0];
    const slowQueryKey = `slow_queries:${today}`;
    
    const slowQueryStrings = await this.redis.lrange(slowQueryKey, 0, limit - 1);
    return slowQueryStrings.map(str => JSON.parse(str));
  }

  /**
   * Generate index recommendations based on query patterns
   */
  async generateIndexRecommendations(): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];

    // Analyze common query patterns and suggest indexes
    const commonPatterns = this.analyzeQueryPatterns();

    for (const pattern of commonPatterns) {
      if (pattern.frequency > 10 && pattern.avgDuration > 50) {
        recommendations.push({
          table: pattern.table,
          columns: pattern.columns,
          type: this.determineIndexType(pattern),
          reason: `High frequency query (${pattern.frequency}x) with slow average time (${pattern.avgDuration}ms)`,
          estimatedImprovement: this.estimateImprovement(pattern),
          priority: pattern.avgDuration > 200 ? 'high' : pattern.avgDuration > 100 ? 'medium' : 'low',
        });
      }
    }

    // Add specific recommendations for the Zenith schema
    recommendations.push(
      ...this.getZenithSpecificRecommendations()
    );

    return recommendations;
  }

  /**
   * Analyze query execution plans
   */
  async analyzeQueryPlans(): Promise<QueryPlan[]> {
    const plans: QueryPlan[] = [];

    // Get common slow queries for analysis
    const slowQueries = Array.from(this.queryMetrics.entries())
      .filter(([_, metrics]) => metrics.some(m => m.duration > this.slowQueryThreshold))
      .slice(0, 10);

    for (const [query, metrics] of slowQueries) {
      try {
        // Generate equivalent SQL for analysis
        const sql = this.generateEquivalentSQL(query, metrics[0].parameters);
        if (sql) {
          const plan = await this.getQueryPlan(sql);
          if (plan) {
            plans.push({
              query,
              plan,
              cost: plan.cost || 0,
              estimatedRows: plan.rows || 0,
              actualTime: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length,
            });
          }
        }
      } catch (error) {
        console.error(`Error analyzing query plan for ${query}:`, error);
      }
    }

    return plans;
  }

  /**
   * Get PostgreSQL query execution plan
   */
  private async getQueryPlan(sql: string): Promise<any> {
    try {
      const result = await this.prisma.$queryRaw`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`;
      return result[0]?.['QUERY PLAN']?.[0];
    } catch (error) {
      console.error('Error getting query plan:', error);
      return null;
    }
  }

  /**
   * Generate equivalent SQL from Prisma query info
   */
  private generateEquivalentSQL(query: string, parameters: any): string | null {
    // This is a simplified mapping - in production, you'd need more sophisticated translation
    const [model, action] = query.split('.');
    
    switch (action) {
      case 'findMany':
        return `SELECT * FROM "${model.toLowerCase()}s" ${this.buildWhereClause(parameters?.where)} LIMIT ${parameters?.take || 100}`;
      case 'findUnique':
        return `SELECT * FROM "${model.toLowerCase()}s" ${this.buildWhereClause(parameters?.where)} LIMIT 1`;
      case 'count':
        return `SELECT COUNT(*) FROM "${model.toLowerCase()}s" ${this.buildWhereClause(parameters?.where)}`;
      default:
        return null;
    }
  }

  /**
   * Build WHERE clause from Prisma parameters
   */
  private buildWhereClause(where: any): string {
    if (!where) return '';
    
    const conditions: string[] = [];
    for (const [key, value] of Object.entries(where)) {
      if (typeof value === 'string' || typeof value === 'number') {
        conditions.push(`"${key}" = '${value}'`);
      }
    }
    
    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  /**
   * Analyze query patterns from metrics
   */
  private analyzeQueryPatterns() {
    const patterns: any[] = [];

    for (const [query, metrics] of this.queryMetrics.entries()) {
      const [model, action] = query.split('.');
      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      
      patterns.push({
        table: model.toLowerCase(),
        query,
        action,
        frequency: metrics.length,
        avgDuration,
        columns: this.inferColumns(metrics),
      });
    }

    return patterns.sort((a, b) => b.frequency * b.avgDuration - a.frequency * a.avgDuration);
  }

  /**
   * Infer columns used in queries from parameters
   */
  private inferColumns(metrics: QueryMetrics[]): string[] {
    const columns = new Set<string>();
    
    for (const metric of metrics) {
      if (metric.parameters?.where) {
        Object.keys(metric.parameters.where).forEach(key => columns.add(key));
      }
      if (metric.parameters?.orderBy) {
        if (typeof metric.parameters.orderBy === 'object') {
          Object.keys(metric.parameters.orderBy).forEach(key => columns.add(key));
        }
      }
    }

    return Array.from(columns);
  }

  /**
   * Determine optimal index type for a query pattern
   */
  private determineIndexType(pattern: any): 'btree' | 'hash' | 'gin' | 'gist' {
    // B-tree for range queries and ordering
    if (pattern.action.includes('range') || pattern.columns.includes('createdAt') || pattern.columns.includes('updatedAt')) {
      return 'btree';
    }
    
    // Hash for equality lookups
    if (pattern.action === 'findUnique' || pattern.columns.includes('id') || pattern.columns.includes('email')) {
      return 'hash';
    }
    
    // GIN for JSON and array operations
    if (pattern.columns.some((col: string) => col.includes('json') || col.includes('array'))) {
      return 'gin';
    }
    
    // Default to B-tree
    return 'btree';
  }

  /**
   * Estimate performance improvement from an index
   */
  private estimateImprovement(pattern: any): number {
    // Simplified estimation based on frequency and current performance
    const baseImprovement = Math.min(pattern.avgDuration * 0.7, 200); // Up to 70% improvement, max 200ms
    const frequencyMultiplier = Math.log10(pattern.frequency + 1);
    
    return Math.round(baseImprovement * frequencyMultiplier);
  }

  /**
   * Get Zenith-specific index recommendations
   */
  private getZenithSpecificRecommendations(): IndexRecommendation[] {
    return [
      {
        table: 'website_analyses',
        columns: ['projectId', 'createdAt', 'status'],
        type: 'btree',
        reason: 'Common query pattern for project analysis history with status filtering',
        estimatedImprovement: 150,
        priority: 'high',
      },
      {
        table: 'performance_metrics',
        columns: ['pageLoadTime', 'timeToFirstByte'],
        type: 'btree',
        reason: 'Performance comparison and trend analysis queries',
        estimatedImprovement: 100,
        priority: 'medium',
      },
      {
        table: 'security_events',
        columns: ['sourceIp', 'createdAt', 'severity'],
        type: 'btree',
        reason: 'Security monitoring and threat analysis',
        estimatedImprovement: 120,
        priority: 'high',
      },
      {
        table: 'audit_logs',
        columns: ['userId', 'createdAt', 'action'],
        type: 'btree',
        reason: 'User activity tracking and compliance reporting',
        estimatedImprovement: 80,
        priority: 'medium',
      },
      {
        table: 'projects',
        columns: ['userId', 'updatedAt'],
        type: 'btree',
        reason: 'User dashboard project listings',
        estimatedImprovement: 60,
        priority: 'low',
      },
      {
        table: 'team_activities',
        columns: ['teamId', 'createdAt'],
        type: 'btree',
        reason: 'Team activity feeds and notifications',
        estimatedImprovement: 70,
        priority: 'medium',
      },
    ];
  }

  /**
   * Generate query statistics
   */
  private generateQueryStatistics() {
    const totalQueries = Array.from(this.queryMetrics.values()).reduce((sum, metrics) => sum + metrics.length, 0);
    const totalDuration = Array.from(this.queryMetrics.values()).reduce(
      (sum, metrics) => sum + metrics.reduce((s, m) => s + m.duration, 0), 0
    );
    
    const slowQueriesCount = Array.from(this.queryMetrics.values()).reduce(
      (sum, metrics) => sum + metrics.filter(m => m.duration > this.slowQueryThreshold).length, 0
    );

    const topQueries = Array.from(this.queryMetrics.entries())
      .map(([query, metrics]) => ({
        query,
        count: metrics.length,
        avgDuration: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length,
        maxDuration: Math.max(...metrics.map(m => m.duration)),
        totalTime: metrics.reduce((sum, m) => sum + m.duration, 0),
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 10);

    return {
      totalQueries,
      averageQueryTime: totalDuration / totalQueries,
      slowQueriesCount,
      slowQueryPercentage: (slowQueriesCount / totalQueries) * 100,
      topQueries,
      queryTypeDistribution: this.getQueryTypeDistribution(),
      hourlyQueryCounts: this.getHourlyQueryCounts(),
    };
  }

  /**
   * Get query type distribution
   */
  private getQueryTypeDistribution() {
    const distribution: Record<string, number> = {};
    
    for (const [query, metrics] of this.queryMetrics.entries()) {
      const action = query.split('.')[1];
      distribution[action] = (distribution[action] || 0) + metrics.length;
    }

    return distribution;
  }

  /**
   * Get hourly query counts for the last 24 hours
   */
  private getHourlyQueryCounts() {
    const now = new Date();
    const hourlyData: Record<string, number> = {};
    
    // Initialize with zeros for last 24 hours
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hour.toISOString().substring(0, 13);
      hourlyData[hourKey] = 0;
    }

    // Count queries by hour
    for (const metrics of this.queryMetrics.values()) {
      for (const metric of metrics) {
        const hourKey = metric.executedAt.toISOString().substring(0, 13);
        if (hourlyData.hasOwnProperty(hourKey)) {
          hourlyData[hourKey]++;
        }
      }
    }

    return hourlyData;
  }

  /**
   * Apply recommended indexes
   */
  async applyIndexRecommendations(recommendations: IndexRecommendation[]): Promise<{
    applied: string[];
    failed: string[];
  }> {
    const applied: string[] = [];
    const failed: string[] = [];

    for (const rec of recommendations.filter(r => r.priority === 'high')) {
      try {
        const indexName = `idx_${rec.table}_${rec.columns.join('_')}`;
        const sql = this.generateIndexSQL(rec.table, rec.columns, rec.type, indexName);
        
        await this.prisma.$executeRawUnsafe(sql);
        applied.push(`${indexName} on ${rec.table}(${rec.columns.join(', ')})`);
      } catch (error) {
        console.error(`Failed to create index for ${rec.table}:`, error);
        failed.push(`${rec.table}(${rec.columns.join(', ')}): ${error.message}`);
      }
    }

    return { applied, failed };
  }

  /**
   * Generate SQL for index creation
   */
  private generateIndexSQL(table: string, columns: string[], type: string, indexName: string): string {
    const columnList = columns.map(col => `"${col}"`).join(', ');
    
    switch (type) {
      case 'hash':
        return `CREATE INDEX CONCURRENTLY "${indexName}" ON "${table}" USING HASH (${columnList})`;
      case 'gin':
        return `CREATE INDEX CONCURRENTLY "${indexName}" ON "${table}" USING GIN (${columnList})`;
      case 'gist':
        return `CREATE INDEX CONCURRENTLY "${indexName}" ON "${table}" USING GIST (${columnList})`;
      default:
        return `CREATE INDEX CONCURRENTLY "${indexName}" ON "${table}" (${columnList})`;
    }
  }

  /**
   * Connection pool optimization
   */
  async optimizeConnectionPool(): Promise<{
    currentConfig: any;
    recommendations: any;
  }> {
    const currentConfig = {
      maxConnections: process.env.DATABASE_MAX_CONNECTIONS || 'default',
      connectionTimeout: process.env.DATABASE_CONNECTION_TIMEOUT || 'default',
      poolSize: process.env.DATABASE_POOL_SIZE || 'default',
    };

    const recommendations = {
      maxConnections: this.calculateOptimalMaxConnections(),
      connectionTimeout: 30000, // 30 seconds
      poolSize: this.calculateOptimalPoolSize(),
      idleTimeout: 300000, // 5 minutes
      statementTimeout: 60000, // 1 minute
    };

    return { currentConfig, recommendations };
  }

  /**
   * Calculate optimal max connections based on system resources
   */
  private calculateOptimalMaxConnections(): number {
    // Rule of thumb: 2-3 connections per CPU core
    const cpuCores = require('os').cpus().length;
    return Math.max(10, cpuCores * 3);
  }

  /**
   * Calculate optimal pool size
   */
  private calculateOptimalPoolSize(): number {
    const totalQueries = Array.from(this.queryMetrics.values()).reduce((sum, metrics) => sum + metrics.length, 0);
    const avgQueriesPerSecond = totalQueries / (24 * 3600); // Assuming 24h worth of data
    
    // Pool size should handle peak load (assume 3x average)
    return Math.max(5, Math.min(50, Math.ceil(avgQueriesPerSecond * 3)));
  }

  /**
   * Clean up old metrics
   */
  async cleanupMetrics(olderThanDays = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    for (const [query, metrics] of this.queryMetrics.entries()) {
      const filteredMetrics = metrics.filter(m => m.executedAt > cutoffDate);
      this.queryMetrics.set(query, filteredMetrics);
    }

    // Clean up Redis slow query logs
    const pipeline = this.redis.pipeline();
    for (let i = olderThanDays; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = `slow_queries:${date.toISOString().split('T')[0]}`;
      pipeline.del(key);
    }
    await pipeline.exec();
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(): Promise<any> {
    const analysis = await this.analyzeQueries();
    const connectionPoolInfo = await this.optimizeConnectionPool();
    
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalQueries: analysis.statistics.totalQueries,
        averageQueryTime: Math.round(analysis.statistics.averageQueryTime * 100) / 100,
        slowQueryPercentage: Math.round(analysis.statistics.slowQueryPercentage * 100) / 100,
        recommendationsCount: analysis.recommendations.length,
        highPriorityRecommendations: analysis.recommendations.filter(r => r.priority === 'high').length,
      },
      performance: {
        slowQueries: analysis.slowQueries.slice(0, 10),
        topQueries: analysis.statistics.topQueries,
        queryTypeDistribution: analysis.statistics.queryTypeDistribution,
      },
      recommendations: {
        indexes: analysis.recommendations,
        connectionPool: connectionPoolInfo.recommendations,
      },
      metrics: {
        hourlyQueryCounts: analysis.statistics.hourlyQueryCounts,
        queryPlans: analysis.queryPlans,
      }
    };
  }
}

// Export utility functions
export async function createDatabaseOptimizer(prisma: PrismaClient, redis: Redis): Promise<DatabaseOptimizer> {
  return new DatabaseOptimizer(prisma, redis);
}

export async function runDatabaseOptimization(): Promise<void> {
  const { PrismaClient } = require('@prisma/client');
  const { Redis } = require('ioredis');
  
  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL);
  
  const optimizer = new DatabaseOptimizer(prisma, redis);
  
  try {
    console.log('🔍 Running database optimization analysis...');
    const report = await optimizer.generatePerformanceReport();
    
    console.log('📊 Performance Report Generated:');
    console.log(`- Total Queries: ${report.summary.totalQueries}`);
    console.log(`- Average Query Time: ${report.summary.averageQueryTime}ms`);
    console.log(`- Slow Query %: ${report.summary.slowQueryPercentage}%`);
    console.log(`- Recommendations: ${report.summary.recommendationsCount}`);
    
    if (report.summary.highPriorityRecommendations > 0) {
      console.log('\n🔧 Applying high-priority index recommendations...');
      const result = await optimizer.applyIndexRecommendations(report.recommendations.indexes);
      console.log(`✅ Applied ${result.applied.length} indexes`);
      if (result.failed.length > 0) {
        console.log(`❌ Failed to apply ${result.failed.length} indexes`);
      }
    }
    
    // Save report to Redis for dashboard
    await redis.setex('db_optimization_report', 3600, JSON.stringify(report));
    
    console.log('✅ Database optimization complete!');
  } catch (error) {
    console.error('❌ Database optimization failed:', error);
  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}