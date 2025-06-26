import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { performance } from 'perf_hooks';

interface QueryPattern {
  pattern: string;
  frequency: number;
  averageDuration: number;
  percentile95: number;
  percentile99: number;
  samples: QuerySample[];
}

interface QuerySample {
  query: string;
  duration: number;
  rowsAffected: number;
  timestamp: Date;
  lockWaitTime?: number;
  ioTime?: number;
}

interface IndexCandidate {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist' | 'brin';
  estimatedBenefit: number;
  estimatedSize: number;
  reason: string;
  affectedQueries: string[];
}

interface QueryOptimizationSuggestion {
  type: 'index' | 'query_rewrite' | 'schema_change' | 'partition';
  description: string;
  impact: 'high' | 'medium' | 'low';
  implementation: string;
  estimatedImprovement: number;
}

export class QueryAnalyzer {
  private prisma: PrismaClient;
  private redis: Redis;
  private queryPatterns: Map<string, QueryPattern> = new Map();
  private readonly SAMPLE_SIZE = 1000;
  private readonly SLOW_QUERY_THRESHOLD = 100; // ms
  private readonly VERY_SLOW_QUERY_THRESHOLD = 500; // ms

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
  }

  /**
   * Analyze query performance and patterns
   */
  async analyzePerformance(): Promise<{
    patterns: QueryPattern[];
    slowQueries: QuerySample[];
    indexCandidates: IndexCandidate[];
    suggestions: QueryOptimizationSuggestion[];
  }> {
    // Collect query statistics from pg_stat_statements
    const queryStats = await this.collectQueryStatistics();
    
    // Analyze query patterns
    const patterns = await this.identifyQueryPatterns(queryStats);
    
    // Find slow queries
    const slowQueries = await this.identifySlowQueries();
    
    // Generate index candidates
    const indexCandidates = await this.generateIndexCandidates(patterns, slowQueries);
    
    // Generate optimization suggestions
    const suggestions = await this.generateOptimizationSuggestions(patterns, indexCandidates);

    return {
      patterns,
      slowQueries,
      indexCandidates,
      suggestions,
    };
  }

  /**
   * Collect query statistics from PostgreSQL
   */
  private async collectQueryStatistics(): Promise<any[]> {
    try {
      const stats = await this.prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_exec_time as total_time,
          mean_exec_time as mean_time,
          min_exec_time as min_time,
          max_exec_time as max_time,
          stddev_exec_time as stddev_time,
          rows,
          shared_blks_hit,
          shared_blks_read,
          shared_blks_dirtied,
          shared_blks_written,
          temp_blks_read,
          temp_blks_written,
          blk_read_time,
          blk_write_time
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
          AND query NOT LIKE '%COMMIT%'
          AND query NOT LIKE '%BEGIN%'
          AND mean_exec_time > 1
        ORDER BY total_exec_time DESC
        LIMIT 500
      `;
      
      return stats as any[];
    } catch (error) {
      console.error('Error collecting query statistics:', error);
      // Fallback to basic query logging if pg_stat_statements is not available
      return [];
    }
  }

  /**
   * Identify query patterns from statistics
   */
  private async identifyQueryPatterns(stats: any[]): Promise<QueryPattern[]> {
    const patterns = new Map<string, QueryPattern>();

    for (const stat of stats) {
      const pattern = this.extractQueryPattern(stat.query);
      
      if (!patterns.has(pattern)) {
        patterns.set(pattern, {
          pattern,
          frequency: 0,
          averageDuration: 0,
          percentile95: 0,
          percentile99: 0,
          samples: [],
        });
      }

      const patternData = patterns.get(pattern)!;
      patternData.frequency += stat.calls;
      patternData.averageDuration = stat.mean_time;
      
      // Add sample
      if (patternData.samples.length < this.SAMPLE_SIZE) {
        patternData.samples.push({
          query: stat.query,
          duration: stat.mean_time,
          rowsAffected: stat.rows / stat.calls,
          timestamp: new Date(),
          ioTime: stat.blk_read_time + stat.blk_write_time,
        });
      }
    }

    // Calculate percentiles
    for (const pattern of Array.from(patterns.values())) {
      const durations = pattern.samples.map(s => s.duration).sort((a, b) => a - b);
      pattern.percentile95 = durations[Math.floor(durations.length * 0.95)] || pattern.averageDuration;
      pattern.percentile99 = durations[Math.floor(durations.length * 0.99)] || pattern.averageDuration;
    }

    return Array.from(patterns.values())
      .sort((a, b) => b.frequency * b.averageDuration - a.frequency * a.averageDuration);
  }

  /**
   * Extract pattern from SQL query
   */
  private extractQueryPattern(query: string): string {
    // Remove specific values and normalize the query
    return query
      .replace(/\$\d+/g, '?') // Replace parameter placeholders
      .replace(/'\d+'|'\w+'|'[^']*'/g, '?') // Replace string literals
      .replace(/\b\d+\b/g, '?') // Replace numeric literals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .toLowerCase();
  }

  /**
   * Identify slow queries
   */
  private async identifySlowQueries(): Promise<QuerySample[]> {
    const slowQueries: QuerySample[] = [];

    // Get slow queries from Redis cache
    const today = new Date().toISOString().split('T')[0];
    const slowQueryKeys = await this.redis.keys(`slow_queries:*`);
    
    for (const key of slowQueryKeys.slice(-7)) { // Last 7 days
      const queries = await this.redis.lrange(key, 0, -1);
      for (const queryStr of queries) {
        try {
          const query = JSON.parse(queryStr);
          if (query.duration > this.SLOW_QUERY_THRESHOLD) {
            slowQueries.push(query);
          }
        } catch (e) {
          // Skip invalid entries
        }
      }
    }

    // Also check for currently running long queries
    try {
      const activeQueries = await this.prisma.$queryRaw`
        SELECT 
          pid,
          usename,
          application_name,
          client_addr,
          backend_start,
          xact_start,
          query_start,
          state,
          query,
          wait_event_type,
          wait_event,
          EXTRACT(EPOCH FROM (now() - query_start)) * 1000 as duration_ms
        FROM pg_stat_activity
        WHERE state = 'active'
          AND query NOT LIKE '%pg_stat_activity%'
          AND EXTRACT(EPOCH FROM (now() - query_start)) > 1
        ORDER BY duration_ms DESC
      `;

      for (const activeQuery of activeQueries as any[]) {
        if (activeQuery.duration_ms > this.VERY_SLOW_QUERY_THRESHOLD) {
          slowQueries.push({
            query: activeQuery.query,
            duration: activeQuery.duration_ms,
            rowsAffected: 0,
            timestamp: new Date(activeQuery.query_start),
            lockWaitTime: activeQuery.wait_event_type === 'Lock' ? activeQuery.duration_ms : 0,
          });
        }
      }
    } catch (error) {
      console.error('Error checking active queries:', error);
    }

    return slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 100); // Top 100 slow queries
  }

  /**
   * Generate index candidates based on query patterns
   */
  private async generateIndexCandidates(
    patterns: QueryPattern[], 
    slowQueries: QuerySample[]
  ): Promise<IndexCandidate[]> {
    const candidates: IndexCandidate[] = [];
    const existingIndexes = await this.getExistingIndexes();

    // Analyze each pattern for potential indexes
    for (const pattern of patterns) {
      if (pattern.averageDuration > 50 && pattern.frequency > 10) {
        const tables = this.extractTablesFromPattern(pattern.pattern);
        const columns = this.extractColumnsFromPattern(pattern.pattern);

        for (const table of tables) {
          const tableColumns = columns.filter(col => this.isColumnInTable(col, table));
          
          if (tableColumns.length > 0) {
            const indexKey = `${table}:${tableColumns.sort().join(',')}`;
            
            // Check if index already exists
            if (!existingIndexes.has(indexKey)) {
              candidates.push({
                table,
                columns: tableColumns,
                type: this.determineOptimalIndexType(pattern, tableColumns),
                estimatedBenefit: this.estimateIndexBenefit(pattern),
                estimatedSize: await this.estimateIndexSize(table, tableColumns),
                reason: this.generateIndexReason(pattern),
                affectedQueries: pattern.samples.map(s => s.query),
              });
            }
          }
        }
      }
    }

    // Analyze slow queries for missing indexes
    for (const slowQuery of slowQueries) {
      const missingIndexes = await this.analyzeMissingIndexes(slowQuery.query);
      candidates.push(...missingIndexes);
    }

    // Remove duplicates and rank by benefit
    return this.deduplicateAndRankCandidates(candidates);
  }

  /**
   * Get existing indexes
   */
  private async getExistingIndexes(): Promise<Set<string>> {
    const indexes = await this.prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
    `;

    const indexSet = new Set<string>();
    for (const index of indexes as any[]) {
      const columns = this.extractColumnsFromIndexDef(index.indexdef);
      indexSet.add(`${index.tablename}:${columns.join(',')}`);
    }

    return indexSet;
  }

  /**
   * Extract columns from index definition
   */
  private extractColumnsFromIndexDef(indexDef: string): string[] {
    const match = indexDef.match(/\((.*?)\)/);
    if (match) {
      return match[1].split(',').map(col => col.trim().replace(/"/g, ''));
    }
    return [];
  }

  /**
   * Extract tables from query pattern
   */
  private extractTablesFromPattern(pattern: string): string[] {
    const tables: string[] = [];
    
    // Extract from FROM clause
    const fromMatch = pattern.match(/from\s+(\w+)/gi);
    if (fromMatch) {
      tables.push(...fromMatch.map(m => m.replace(/from\s+/i, '')));
    }
    
    // Extract from JOIN clauses
    const joinMatch = pattern.match(/join\s+(\w+)/gi);
    if (joinMatch) {
      tables.push(...joinMatch.map(m => m.replace(/join\s+/i, '')));
    }
    
    // Extract from UPDATE/INSERT/DELETE
    const dmlMatch = pattern.match(/(update|insert\s+into|delete\s+from)\s+(\w+)/i);
    if (dmlMatch) {
      tables.push(dmlMatch[2]);
    }

    return Array.from(new Set(tables));
  }

  /**
   * Extract columns from query pattern
   */
  private extractColumnsFromPattern(pattern: string): string[] {
    const columns: string[] = [];
    
    // Extract from WHERE clause
    const whereMatch = pattern.match(/where\s+(.+?)(?:\s+order\s+by|\s+group\s+by|\s+limit|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1];
      const columnMatches = whereClause.match(/(\w+)\s*[=<>]/g);
      if (columnMatches) {
        columns.push(...columnMatches.map(m => m.replace(/\s*[=<>]/, '')));
      }
    }
    
    // Extract from ORDER BY
    const orderByMatch = pattern.match(/order\s+by\s+(.+?)(?:\s+limit|$)/i);
    if (orderByMatch) {
      const orderColumns = orderByMatch[1].split(',').map(col => col.trim().split(' ')[0]);
      columns.push(...orderColumns);
    }
    
    // Extract from GROUP BY
    const groupByMatch = pattern.match(/group\s+by\s+(.+?)(?:\s+having|\s+order\s+by|\s+limit|$)/i);
    if (groupByMatch) {
      const groupColumns = groupByMatch[1].split(',').map(col => col.trim());
      columns.push(...groupColumns);
    }

    return Array.from(new Set(columns));
  }

  /**
   * Check if column exists in table
   */
  private isColumnInTable(column: string, table: string): boolean {
    // This is a simplified check - in production, you'd query the schema
    // For now, we'll assume common column patterns
    const commonColumns = ['id', 'created_at', 'updated_at', 'user_id', 'project_id', 'team_id'];
    const tableSpecificColumns: Record<string, string[]> = {
      users: ['email', 'name', 'role', 'tier'],
      projects: ['name', 'url', 'user_id'],
      website_analyses: ['project_id', 'url', 'status', 'overall_score'],
      security_events: ['type', 'severity', 'source_ip', 'user_id'],
      // Add more as needed
    };

    return commonColumns.includes(column.toLowerCase()) || 
           (tableSpecificColumns[table]?.includes(column.toLowerCase()) ?? false);
  }

  /**
   * Determine optimal index type
   */
  private determineOptimalIndexType(pattern: QueryPattern, columns: string[]): 'btree' | 'hash' | 'gin' | 'gist' | 'brin' {
    const patternLower = pattern.pattern.toLowerCase();
    
    // BRIN for time-series data
    if (columns.some(col => col.includes('created_at') || col.includes('timestamp')) && 
        pattern.samples.length > 1000) {
      return 'brin';
    }
    
    // GIN for JSON/JSONB columns
    if (columns.some(col => col.includes('json') || col.includes('data') || col.includes('metadata'))) {
      return 'gin';
    }
    
    // Hash for exact equality on single column
    if (columns.length === 1 && patternLower.includes('=') && !patternLower.includes('<') && !patternLower.includes('>')) {
      return 'hash';
    }
    
    // B-tree for everything else (supports ordering and ranges)
    return 'btree';
  }

  /**
   * Estimate index benefit
   */
  private estimateIndexBenefit(pattern: QueryPattern): number {
    // Calculate benefit based on frequency, duration, and improvement potential
    const frequencyScore = Math.log10(pattern.frequency + 1) * 10;
    const durationScore = Math.min(pattern.averageDuration / 10, 100);
    const improvementPotential = pattern.averageDuration > 100 ? 0.7 : 0.5;
    
    return Math.round(frequencyScore * durationScore * improvementPotential);
  }

  /**
   * Estimate index size
   */
  private async estimateIndexSize(table: string, columns: string[]): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          pg_relation_size(${table}::regclass) as table_size,
          reltuples as row_count
        FROM pg_class
        WHERE relname = ${table}
      `;
      
      const { table_size, row_count } = (result as any[])[0] || { table_size: 0, row_count: 0 };
      
      // Rough estimation: index size is about 10-20% of table size per column
      const sizePerColumn = table_size * 0.15;
      return Math.round(sizePerColumn * columns.length);
    } catch (error) {
      // Default estimation
      return 1024 * 1024 * 10; // 10MB default
    }
  }

  /**
   * Generate reason for index recommendation
   */
  private generateIndexReason(pattern: QueryPattern): string {
    const reasons = [];
    
    if (pattern.frequency > 1000) {
      reasons.push(`High frequency query (${pattern.frequency} calls)`);
    }
    
    if (pattern.averageDuration > 200) {
      reasons.push(`Slow average execution time (${Math.round(pattern.averageDuration)}ms)`);
    }
    
    if (pattern.percentile99 > pattern.averageDuration * 2) {
      reasons.push(`High variance in execution time (p99: ${Math.round(pattern.percentile99)}ms)`);
    }
    
    return reasons.join('. ') || 'General performance optimization';
  }

  /**
   * Analyze missing indexes for a specific query
   */
  private async analyzeMissingIndexes(query: string): Promise<IndexCandidate[]> {
    const candidates: IndexCandidate[] = [];
    
    try {
      // Get query execution plan
      const explainResult = await this.prisma.$queryRaw`EXPLAIN (FORMAT JSON) ${query}`;
      const plan = (explainResult as any[])[0]['QUERY PLAN'][0];
      
      // Look for sequential scans on large tables
      const seqScans = this.findSequentialScans(plan);
      
      for (const scan of seqScans) {
        if (scan.rowCount > 1000) {
          candidates.push({
            table: scan.table,
            columns: scan.filterColumns,
            type: 'btree',
            estimatedBenefit: Math.log10(scan.rowCount) * 20,
            estimatedSize: scan.rowCount * 100, // Rough estimate
            reason: `Sequential scan on large table (${scan.rowCount} rows)`,
            affectedQueries: [query],
          });
        }
      }
    } catch (error) {
      // Skip if we can't analyze the query
    }
    
    return candidates;
  }

  /**
   * Find sequential scans in query plan
   */
  private findSequentialScans(plan: any, scans: any[] = []): any[] {
    if (plan['Node Type'] === 'Seq Scan') {
      scans.push({
        table: plan['Relation Name'],
        filterColumns: this.extractFilterColumns(plan['Filter']),
        rowCount: plan['Plan Rows'] || 0,
      });
    }
    
    if (plan['Plans']) {
      for (const subPlan of plan['Plans']) {
        this.findSequentialScans(subPlan, scans);
      }
    }
    
    return scans;
  }

  /**
   * Extract filter columns from plan filter
   */
  private extractFilterColumns(filter: string): string[] {
    if (!filter) return [];
    
    const columns: string[] = [];
    const columnMatches = filter.match(/\((\w+)\s*[=<>]/g);
    if (columnMatches) {
      columns.push(...columnMatches.map(m => m.match(/\((\w+)/)?.[1] || '').filter(Boolean));
    }
    
    return columns;
  }

  /**
   * Deduplicate and rank index candidates
   */
  private deduplicateAndRankCandidates(candidates: IndexCandidate[]): IndexCandidate[] {
    const uniqueCandidates = new Map<string, IndexCandidate>();
    
    for (const candidate of candidates) {
      const key = `${candidate.table}:${candidate.columns.sort().join(',')}`;
      
      if (!uniqueCandidates.has(key) || 
          candidate.estimatedBenefit > uniqueCandidates.get(key)!.estimatedBenefit) {
        uniqueCandidates.set(key, candidate);
      }
    }
    
    return Array.from(uniqueCandidates.values())
      .sort((a, b) => b.estimatedBenefit - a.estimatedBenefit)
      .slice(0, 20); // Top 20 recommendations
  }

  /**
   * Generate optimization suggestions
   */
  private async generateOptimizationSuggestions(
    patterns: QueryPattern[],
    indexCandidates: IndexCandidate[]
  ): Promise<QueryOptimizationSuggestion[]> {
    const suggestions: QueryOptimizationSuggestion[] = [];

    // Index suggestions
    for (const candidate of indexCandidates.slice(0, 5)) {
      suggestions.push({
        type: 'index',
        description: `Create ${candidate.type} index on ${candidate.table}(${candidate.columns.join(', ')})`,
        impact: candidate.estimatedBenefit > 500 ? 'high' : candidate.estimatedBenefit > 200 ? 'medium' : 'low',
        implementation: `CREATE INDEX CONCURRENTLY idx_${candidate.table}_${candidate.columns.join('_')} ON ${candidate.table} USING ${candidate.type} (${candidate.columns.join(', ')});`,
        estimatedImprovement: candidate.estimatedBenefit,
      });
    }

    // Query rewrite suggestions
    for (const pattern of patterns.filter(p => p.averageDuration > 500)) {
      const rewriteSuggestion = this.suggestQueryRewrite(pattern);
      if (rewriteSuggestion) {
        suggestions.push(rewriteSuggestion);
      }
    }

    // Schema change suggestions
    const schemaChanges = await this.suggestSchemaChanges(patterns);
    suggestions.push(...schemaChanges);

    // Partitioning suggestions
    const partitioningSuggestions = await this.suggestPartitioning();
    suggestions.push(...partitioningSuggestions);

    return suggestions.sort((a, b) => b.estimatedImprovement - a.estimatedImprovement);
  }

  /**
   * Suggest query rewrites
   */
  private suggestQueryRewrite(pattern: QueryPattern): QueryOptimizationSuggestion | null {
    const patternLower = pattern.pattern.toLowerCase();
    
    // Check for N+1 query patterns
    if (pattern.frequency > 100 && patternLower.includes('where') && patternLower.includes('id =')) {
      return {
        type: 'query_rewrite',
        description: 'Potential N+1 query pattern detected. Consider using batch loading or joins.',
        impact: 'high',
        implementation: 'Use Prisma\'s include or select with nested relations instead of multiple queries.',
        estimatedImprovement: pattern.frequency * pattern.averageDuration * 0.8,
      };
    }
    
    // Check for missing LIMIT in large table scans
    if (!patternLower.includes('limit') && pattern.samples[0]?.rowsAffected > 1000) {
      return {
        type: 'query_rewrite',
        description: 'Large result set without LIMIT. Consider pagination.',
        impact: 'medium',
        implementation: 'Add LIMIT and OFFSET for pagination, or use cursor-based pagination.',
        estimatedImprovement: pattern.averageDuration * 0.5,
      };
    }
    
    // Check for OR conditions that could be UNION
    if (patternLower.includes(' or ') && pattern.averageDuration > 200) {
      return {
        type: 'query_rewrite',
        description: 'OR conditions might perform better as UNION queries.',
        impact: 'medium',
        implementation: 'Split OR conditions into separate queries with UNION.',
        estimatedImprovement: pattern.averageDuration * 0.3,
      };
    }
    
    return null;
  }

  /**
   * Suggest schema changes
   */
  private async suggestSchemaChanges(patterns: QueryPattern[]): Promise<QueryOptimizationSuggestion[]> {
    const suggestions: QueryOptimizationSuggestion[] = [];
    
    // Check for frequently joined tables
    const joinPatterns = patterns.filter(p => p.pattern.includes('join'));
    const joinFrequency = new Map<string, number>();
    
    for (const pattern of joinPatterns) {
      const tables = this.extractTablesFromPattern(pattern.pattern);
      if (tables.length >= 2) {
        const key = tables.sort().join(':');
        joinFrequency.set(key, (joinFrequency.get(key) || 0) + pattern.frequency);
      }
    }
    
    // Suggest denormalization for very frequent joins
    for (const [tablesPair, frequency] of Array.from(joinFrequency.entries())) {
      if (frequency > 10000) {
        suggestions.push({
          type: 'schema_change',
          description: `Consider denormalizing frequently joined tables: ${tablesPair.replace(':', ' and ')}`,
          impact: 'high',
          implementation: `Add commonly accessed columns from the joined table to reduce join operations.`,
          estimatedImprovement: frequency * 0.1, // Rough estimate
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Suggest table partitioning
   */
  private async suggestPartitioning(): Promise<QueryOptimizationSuggestion[]> {
    const suggestions: QueryOptimizationSuggestion[] = [];
    
    try {
      // Check table sizes
      const largeTables = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
          reltuples::bigint as row_count
        FROM pg_tables
        JOIN pg_class ON relname = tablename
        WHERE schemaname = 'public'
          AND pg_total_relation_size(schemaname||'.'||tablename) > 1073741824 -- 1GB
        ORDER BY size_bytes DESC
      `;
      
      for (const table of largeTables as any[]) {
        // Suggest partitioning for very large tables
        if (table.size_bytes > 10 * 1024 * 1024 * 1024) { // 10GB
          suggestions.push({
            type: 'partition',
            description: `Consider partitioning large table: ${table.tablename} (${table.size})`,
            impact: 'high',
            implementation: `Partition by date (created_at) or another suitable column using declarative partitioning.`,
            estimatedImprovement: Math.log10(table.row_count) * 100,
          });
        }
      }
    } catch (error) {
      console.error('Error checking table sizes:', error);
    }
    
    return suggestions;
  }

  /**
   * Monitor real-time query performance
   */
  async monitorRealTimePerformance(): Promise<{
    activeQueries: any[];
    locks: any[];
    connections: any[];
    recommendations: string[];
  }> {
    const activeQueries = await this.getActiveQueries();
    const locks = await this.getBlockingLocks();
    const connections = await this.getConnectionStats();
    const recommendations = this.generateRealTimeRecommendations(activeQueries, locks, connections);

    return {
      activeQueries,
      locks,
      connections,
      recommendations,
    };
  }

  /**
   * Get currently active queries
   */
  private async getActiveQueries(): Promise<any[]> {
    try {
      return await this.prisma.$queryRaw`
        SELECT 
          pid,
          usename,
          application_name,
          client_addr,
          backend_start,
          xact_start,
          query_start,
          state_change,
          state,
          query,
          wait_event_type,
          wait_event,
          EXTRACT(EPOCH FROM (now() - query_start)) * 1000 as duration_ms,
          EXTRACT(EPOCH FROM (now() - xact_start)) * 1000 as transaction_duration_ms
        FROM pg_stat_activity
        WHERE state != 'idle'
          AND query NOT LIKE '%pg_stat_activity%'
        ORDER BY duration_ms DESC NULLS LAST
      `;
    } catch (error) {
      console.error('Error getting active queries:', error);
      return [];
    }
  }

  /**
   * Get blocking locks
   */
  private async getBlockingLocks(): Promise<any[]> {
    try {
      return await this.prisma.$queryRaw`
        SELECT 
          blocked_locks.pid AS blocked_pid,
          blocked_activity.usename AS blocked_user,
          blocking_locks.pid AS blocking_pid,
          blocking_activity.usename AS blocking_user,
          blocked_activity.query AS blocked_query,
          blocking_activity.query AS blocking_query,
          EXTRACT(EPOCH FROM (now() - blocked_activity.query_start)) * 1000 as blocked_duration_ms
        FROM pg_catalog.pg_locks blocked_locks
        JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
        JOIN pg_catalog.pg_locks blocking_locks 
          ON blocking_locks.locktype = blocked_locks.locktype
          AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
          AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
          AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
          AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
          AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
          AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
          AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
          AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
          AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
          AND blocking_locks.pid != blocked_locks.pid
        JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
        WHERE NOT blocked_locks.granted
      `;
    } catch (error) {
      console.error('Error getting blocking locks:', error);
      return [];
    }
  }

  /**
   * Get connection statistics
   */
  private async getConnectionStats(): Promise<any[]> {
    try {
      return await this.prisma.$queryRaw`
        SELECT 
          datname,
          numbackends as active_connections,
          xact_commit as transactions_committed,
          xact_rollback as transactions_rolled_back,
          blks_read as blocks_read,
          blks_hit as blocks_hit,
          tup_returned as tuples_returned,
          tup_fetched as tuples_fetched,
          tup_inserted as tuples_inserted,
          tup_updated as tuples_updated,
          tup_deleted as tuples_deleted,
          conflicts,
          deadlocks,
          ROUND(100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0), 2) as cache_hit_ratio
        FROM pg_stat_database
        WHERE datname = current_database()
      `;
    } catch (error) {
      console.error('Error getting connection stats:', error);
      return [];
    }
  }

  /**
   * Generate real-time recommendations
   */
  private generateRealTimeRecommendations(
    activeQueries: any[],
    locks: any[],
    connections: any[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for long-running queries
    const longRunning = activeQueries.filter(q => q.duration_ms > 5000);
    if (longRunning.length > 0) {
      recommendations.push(
        `${longRunning.length} queries running for more than 5 seconds. Consider terminating or optimizing them.`
      );
    }

    // Check for lock contention
    if (locks.length > 0) {
      recommendations.push(
        `${locks.length} blocking lock(s) detected. Review and resolve lock contention.`
      );
    }

    // Check connection count
    const connStats = connections[0];
    if (connStats && connStats.active_connections > 50) {
      recommendations.push(
        `High connection count (${connStats.active_connections}). Consider connection pooling or increasing max_connections.`
      );
    }

    // Check cache hit ratio
    if (connStats && connStats.cache_hit_ratio < 90) {
      recommendations.push(
        `Low cache hit ratio (${connStats.cache_hit_ratio}%). Consider increasing shared_buffers or adding indexes.`
      );
    }

    // Check for high rollback rate
    if (connStats && connStats.transactions_rolled_back > connStats.transactions_committed * 0.1) {
      recommendations.push(
        `High rollback rate detected. Review application logic for transaction failures.`
      );
    }

    return recommendations;
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(): Promise<any> {
    const analysis = await this.analyzePerformance();
    const realTimeStats = await this.monitorRealTimePerformance();
    const tableStats = await this.getTableStatistics();
    const indexUsage = await this.getIndexUsageStatistics();

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalPatterns: analysis.patterns.length,
        slowQueriesCount: analysis.slowQueries.length,
        indexRecommendations: analysis.indexCandidates.length,
        optimizationSuggestions: analysis.suggestions.length,
      },
      queryAnalysis: {
        topPatterns: analysis.patterns.slice(0, 10),
        slowestQueries: analysis.slowQueries.slice(0, 10),
      },
      optimization: {
        indexCandidates: analysis.indexCandidates.slice(0, 10),
        suggestions: analysis.suggestions.slice(0, 10),
      },
      realTimeStatus: realTimeStats,
      tableStatistics: tableStats,
      indexUsage: indexUsage,
      recommendations: this.generateOverallRecommendations(analysis, realTimeStats, tableStats, indexUsage),
    };
  }

  /**
   * Get table statistics
   */
  private async getTableStatistics(): Promise<any[]> {
    try {
      return await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_tup_hot_upd as hot_updates,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_tuple_ratio,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze,
          vacuum_count,
          autovacuum_count,
          analyze_count,
          autoanalyze_count
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 20
      `;
    } catch (error) {
      console.error('Error getting table statistics:', error);
      return [];
    }
  }

  /**
   * Get index usage statistics
   */
  private async getIndexUsageStatistics(): Promise<any[]> {
    try {
      return await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
          CASE 
            WHEN idx_scan = 0 THEN 'UNUSED'
            WHEN idx_scan < 10 THEN 'RARELY_USED'
            WHEN idx_scan < 100 THEN 'OCCASIONALLY_USED'
            ELSE 'FREQUENTLY_USED'
          END as usage_category
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
        LIMIT 50
      `;
    } catch (error) {
      console.error('Error getting index usage statistics:', error);
      return [];
    }
  }

  /**
   * Generate overall recommendations
   */
  private generateOverallRecommendations(
    analysis: any,
    realTimeStats: any,
    tableStats: any[],
    indexUsage: any[]
  ): string[] {
    const recommendations: string[] = [];

    // High-priority index recommendations
    const highPriorityIndexes = analysis.indexCandidates.filter((c: IndexCandidate) => c.estimatedBenefit > 500);
    if (highPriorityIndexes.length > 0) {
      recommendations.push(
        `Create ${highPriorityIndexes.length} high-priority indexes to improve query performance by up to ${Math.round(highPriorityIndexes[0].estimatedBenefit)}%.`
      );
    }

    // Unused indexes
    const unusedIndexes = indexUsage.filter(idx => idx.usage_category === 'UNUSED');
    if (unusedIndexes.length > 0) {
      recommendations.push(
        `Remove ${unusedIndexes.length} unused indexes to save storage space and improve write performance.`
      );
    }

    // Vacuum recommendations
    const tablesNeedingVacuum = tableStats.filter(t => t.dead_tuple_ratio > 10);
    if (tablesNeedingVacuum.length > 0) {
      recommendations.push(
        `${tablesNeedingVacuum.length} tables have high dead tuple ratios. Run VACUUM to reclaim space.`
      );
    }

    // Statistics update
    const tablesNeedingAnalyze = tableStats.filter(t => {
      const lastAnalyze = t.last_analyze || t.last_autoanalyze;
      return !lastAnalyze || new Date(lastAnalyze) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    });
    if (tablesNeedingAnalyze.length > 0) {
      recommendations.push(
        `${tablesNeedingAnalyze.length} tables haven't been analyzed in the last week. Update statistics for better query planning.`
      );
    }

    // Connection pooling
    if (realTimeStats.connections[0]?.active_connections > 30) {
      recommendations.push(
        `Implement connection pooling to reduce database connection overhead.`
      );
    }

    return recommendations;
  }
}

// Export factory function
export function createQueryAnalyzer(prisma: PrismaClient, redis: Redis): QueryAnalyzer {
  return new QueryAnalyzer(prisma, redis);
}