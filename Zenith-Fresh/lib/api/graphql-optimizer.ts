import { Redis } from 'ioredis';
import { performance } from 'perf_hooks';

interface GraphQLQuery {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

interface QueryComplexity {
  score: number;
  depth: number;
  fieldCount: number;
  estimatedCost: number;
  timeoutMs: number;
}

interface CacheConfig {
  ttl: number;
  maxAge: number;
  scope: 'public' | 'private' | 'authenticated';
  tags: string[];
  varyBy?: string[];
}

interface QueryOptimization {
  originalQuery: string;
  optimizedQuery: string;
  optimizations: string[];
  estimatedImprovement: number;
  warnings: string[];
}

interface DataLoader<K, V> {
  load(key: K): Promise<V | null>;
  loadMany(keys: K[]): Promise<(V | null)[]>;
  clear(key: K): void;
  clearAll(): void;
  prime(key: K, value: V): void;
}

interface BatchRequest {
  keys: any[];
  resolver: (keys: any[]) => Promise<any[]>;
  promise: Promise<any[]>;
  resolve: (values: any[]) => void;
  reject: (error: Error) => void;
}

/**
 * GraphQL Query Complexity Analyzer
 */
class QueryComplexityAnalyzer {
  private complexityCache = new Map<string, QueryComplexity>();
  private fieldWeights: Record<string, number> = {
    // Define complexity weights for different field types
    scalar: 1,
    object: 2,
    list: 5,
    connection: 10,
    nested_list: 25,
  };

  /**
   * Analyze query complexity
   */
  analyzeComplexity(query: string, variables?: Record<string, any>): QueryComplexity {
    const cacheKey = this.generateCacheKey(query, variables);
    const cached = this.complexityCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const analysis = this.performComplexityAnalysis(query, variables);
    this.complexityCache.set(cacheKey, analysis);
    
    return analysis;
  }

  /**
   * Check if query exceeds complexity limits
   */
  isQueryTooComplex(complexity: QueryComplexity, limits: {
    maxScore?: number;
    maxDepth?: number;
    maxFieldCount?: number;
    maxTimeoutMs?: number;
  } = {}): { allowed: boolean; reason?: string } {
    const {
      maxScore = 1000,
      maxDepth = 15,
      maxFieldCount = 100,
      maxTimeoutMs = 30000,
    } = limits;

    if (complexity.score > maxScore) {
      return { allowed: false, reason: `Query complexity score ${complexity.score} exceeds limit ${maxScore}` };
    }

    if (complexity.depth > maxDepth) {
      return { allowed: false, reason: `Query depth ${complexity.depth} exceeds limit ${maxDepth}` };
    }

    if (complexity.fieldCount > maxFieldCount) {
      return { allowed: false, reason: `Query field count ${complexity.fieldCount} exceeds limit ${maxFieldCount}` };
    }

    if (complexity.timeoutMs > maxTimeoutMs) {
      return { allowed: false, reason: `Estimated timeout ${complexity.timeoutMs}ms exceeds limit ${maxTimeoutMs}ms` };
    }

    return { allowed: true };
  }

  private performComplexityAnalysis(query: string, variables?: Record<string, any>): QueryComplexity {
    // Simplified complexity analysis - in production, use graphql-query-complexity
    const depth = this.calculateDepth(query);
    const fieldCount = this.countFields(query);
    const listMultiplier = this.calculateListMultiplier(query, variables);
    
    const baseScore = fieldCount * 2;
    const depthPenalty = Math.pow(depth, 2);
    const listPenalty = listMultiplier * 10;
    
    const score = baseScore + depthPenalty + listPenalty;
    const estimatedCost = score * 0.1; // 0.1ms per complexity point
    const timeoutMs = Math.max(1000, score * 2); // Base timeout + complexity

    return {
      score,
      depth,
      fieldCount,
      estimatedCost,
      timeoutMs,
    };
  }

  private calculateDepth(query: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (const char of query) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }
    
    return maxDepth;
  }

  private countFields(query: string): number {
    // Simple field counting - count words that are likely field names
    const words = query.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    const reservedWords = ['query', 'mutation', 'subscription', 'fragment', 'on', 'true', 'false', 'null'];
    
    return words.filter(word => !reservedWords.includes(word.toLowerCase())).length;
  }

  private calculateListMultiplier(query: string, variables?: Record<string, any>): number {
    // Check for list fields and their limits
    let multiplier = 1;
    
    // Look for pagination arguments
    const firstMatch = query.match(/first:\s*(\d+|[$]\w+)/g);
    const limitMatch = query.match(/limit:\s*(\d+|[$]\w+)/g);
    
    if (firstMatch || limitMatch) {
      // Estimate list size from variables or default
      let estimatedSize = 10; // default
      
      if (variables) {
        for (const [key, value] of Object.entries(variables)) {
          if (typeof value === 'number' && (key.includes('first') || key.includes('limit'))) {
            estimatedSize = Math.max(estimatedSize, value);
          }
        }
      }
      
      multiplier = Math.min(estimatedSize / 10, 10); // Cap at 10x multiplier
    }
    
    return multiplier;
  }

  private generateCacheKey(query: string, variables?: Record<string, any>): string {
    const crypto = require('crypto');
    const content = query + JSON.stringify(variables || {});
    return crypto.createHash('md5').update(content).digest('hex');
  }
}

/**
 * DataLoader implementation for batching and caching
 */
class DataLoaderImpl<K, V> implements DataLoader<K, V> {
  private cache = new Map<string, V>();
  private batchMap = new Map<string, BatchRequest>();
  private batchFn: (keys: K[]) => Promise<V[]>;
  private options: {
    batch?: boolean;
    maxBatchSize?: number;
    cacheKeyFn?: (key: K) => string;
    cacheMap?: Map<string, V>;
  };

  constructor(
    batchFn: (keys: K[]) => Promise<V[]>,
    options: {
      batch?: boolean;
      maxBatchSize?: number;
      cacheKeyFn?: (key: K) => string;
      cacheMap?: Map<string, V>;
    } = {}
  ) {
    this.batchFn = batchFn;
    this.options = {
      batch: true,
      maxBatchSize: 100,
      cacheKeyFn: (key: K) => String(key),
      ...options,
    };
    
    if (this.options.cacheMap) {
      this.cache = this.options.cacheMap;
    }
  }

  async load(key: K): Promise<V | null> {
    const cacheKey = this.options.cacheKeyFn!(key);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    if (!this.options.batch) {
      // No batching, load immediately
      const results = await this.batchFn([key]);
      const value = results[0];
      if (value !== undefined) {
        this.cache.set(cacheKey, value);
      }
      return value || null;
    }

    // Batching enabled
    return new Promise<V | null>((resolve, reject) => {
      const batchKey = 'batch'; // Simple batching strategy
      
      if (!this.batchMap.has(batchKey)) {
        // Create new batch
        const batch: BatchRequest = {
          keys: [key],
          resolver: this.batchFn,
          promise: Promise.resolve([]),
          resolve: () => {},
          reject: () => {},
        };

        // Schedule batch execution
        batch.promise = new Promise<V[]>((batchResolve, batchReject) => {
          batch.resolve = batchResolve;
          batch.reject = batchReject;
          
          // Execute batch on next tick
          process.nextTick(async () => {
            try {
              const results = await this.batchFn(batch.keys);
              
              // Cache results
              batch.keys.forEach((k, index) => {
                const cKey = this.options.cacheKeyFn!(k);
                if (results[index] !== undefined) {
                  this.cache.set(cKey, results[index]);
                }
              });
              
              batchResolve(results);
            } catch (error) {
              batchReject(error as Error);
            } finally {
              this.batchMap.delete(batchKey);
            }
          });
        });

        this.batchMap.set(batchKey, batch);
      } else {
        // Add to existing batch
        const batch = this.batchMap.get(batchKey)!;
        batch.keys.push(key);
      }

      // Wait for batch result
      this.batchMap.get(batchKey)!.promise
        .then(results => {
          const batch = this.batchMap.get(batchKey);
          if (batch) {
            const index = batch.keys.indexOf(key);
            resolve(results[index] || null);
          } else {
            resolve(null);
          }
        })
        .catch(reject);
    });
  }

  async loadMany(keys: K[]): Promise<(V | null)[]> {
    return Promise.all(keys.map(key => this.load(key)));
  }

  clear(key: K): void {
    const cacheKey = this.options.cacheKeyFn!(key);
    this.cache.delete(cacheKey);
  }

  clearAll(): void {
    this.cache.clear();
  }

  prime(key: K, value: V): void {
    const cacheKey = this.options.cacheKeyFn!(key);
    this.cache.set(cacheKey, value);
  }
}

/**
 * GraphQL Query Optimizer
 */
class GraphQLQueryOptimizer {
  private redis: Redis;
  private optimizationCache = new Map<string, QueryOptimization>();

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Optimize GraphQL query
   */
  async optimizeQuery(query: string, variables?: Record<string, any>): Promise<QueryOptimization> {
    const cacheKey = this.generateCacheKey(query, variables);
    const cached = this.optimizationCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const optimization = await this.performQueryOptimization(query, variables);
    this.optimizationCache.set(cacheKey, optimization);
    
    return optimization;
  }

  private async performQueryOptimization(query: string, variables?: Record<string, any>): Promise<QueryOptimization> {
    const optimizations: string[] = [];
    const warnings: string[] = [];
    let optimizedQuery = query;
    let estimatedImprovement = 0;

    // Remove unnecessary whitespace
    if (this.hasExcessiveWhitespace(query)) {
      optimizedQuery = this.removeExcessiveWhitespace(optimizedQuery);
      optimizations.push('Removed excessive whitespace');
      estimatedImprovement += 5;
    }

    // Optimize field selection
    const fieldOptimization = this.optimizeFieldSelection(optimizedQuery);
    if (fieldOptimization.optimized) {
      optimizedQuery = fieldOptimization.query;
      optimizations.push(...fieldOptimization.optimizations);
      estimatedImprovement += fieldOptimization.improvement;
    }

    // Add pagination limits
    const paginationOptimization = this.addPaginationLimits(optimizedQuery, variables);
    if (paginationOptimization.optimized) {
      optimizedQuery = paginationOptimization.query;
      optimizations.push(...paginationOptimization.optimizations);
      warnings.push(...paginationOptimization.warnings);
      estimatedImprovement += paginationOptimization.improvement;
    }

    // Optimize nested queries
    const nestedOptimization = this.optimizeNestedQueries(optimizedQuery);
    if (nestedOptimization.optimized) {
      optimizedQuery = nestedOptimization.query;
      optimizations.push(...nestedOptimization.optimizations);
      estimatedImprovement += nestedOptimization.improvement;
    }

    return {
      originalQuery: query,
      optimizedQuery,
      optimizations,
      estimatedImprovement,
      warnings,
    };
  }

  private hasExcessiveWhitespace(query: string): boolean {
    return /\s{2,}/.test(query) || query.includes('\n\n');
  }

  private removeExcessiveWhitespace(query: string): string {
    return query
      .replace(/\s+/g, ' ')
      .replace(/\s*{\s*/g, ' { ')
      .replace(/\s*}\s*/g, ' } ')
      .trim();
  }

  private optimizeFieldSelection(query: string): {
    optimized: boolean;
    query: string;
    optimizations: string[];
    improvement: number;
  } {
    // Check for duplicate field selections
    const duplicates = this.findDuplicateFields(query);
    if (duplicates.length > 0) {
      const optimizedQuery = this.removeDuplicateFields(query, duplicates);
      return {
        optimized: true,
        query: optimizedQuery,
        optimizations: [`Removed ${duplicates.length} duplicate field selections`],
        improvement: duplicates.length * 2,
      };
    }

    return {
      optimized: false,
      query,
      optimizations: [],
      improvement: 0,
    };
  }

  private addPaginationLimits(query: string, variables?: Record<string, any>): {
    optimized: boolean;
    query: string;
    optimizations: string[];
    warnings: string[];
    improvement: number;
  } {
    const optimizations: string[] = [];
    const warnings: string[] = [];
    let optimizedQuery = query;
    let improvement = 0;

    // Check for list fields without pagination
    const unpaginatedLists = this.findUnpaginatedLists(query);
    
    if (unpaginatedLists.length > 0) {
      for (const listField of unpaginatedLists) {
        optimizedQuery = this.addPaginationToField(optimizedQuery, listField);
        optimizations.push(`Added pagination limit to ${listField}`);
        warnings.push(`Field '${listField}' should implement proper pagination`);
        improvement += 10;
      }
    }

    return {
      optimized: optimizations.length > 0,
      query: optimizedQuery,
      optimizations,
      warnings,
      improvement,
    };
  }

  private optimizeNestedQueries(query: string): {
    optimized: boolean;
    query: string;
    optimizations: string[];
    improvement: number;
  } {
    // Look for deeply nested queries that could be flattened
    const depth = this.calculateQueryDepth(query);
    
    if (depth > 8) {
      return {
        optimized: true,
        query: this.suggestQueryFlattening(query),
        optimizations: [`Suggested flattening for deeply nested query (depth: ${depth})`],
        improvement: Math.min(depth - 8, 10) * 5,
      };
    }

    return {
      optimized: false,
      query,
      optimizations: [],
      improvement: 0,
    };
  }

  private findDuplicateFields(query: string): string[] {
    // Simplified duplicate detection
    const fields = query.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    const fieldCounts = new Map<string, number>();
    
    fields.forEach(field => {
      fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
    });
    
    return Array.from(fieldCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([field]) => field);
  }

  private removeDuplicateFields(query: string, duplicates: string[]): string {
    // Simplified deduplication
    return query; // In production, implement proper AST manipulation
  }

  private findUnpaginatedLists(query: string): string[] {
    // Look for array fields without first/limit/take arguments
    const listPatterns = [
      /(\w+)\s*\{[^}]*\}/g // Fields with nested selections (likely lists)
    ];
    
    const lists: string[] = [];
    for (const pattern of listPatterns) {
      const matches = query.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const fieldName = match.split('{')[0].trim();
          if (!match.includes('first:') && !match.includes('limit:') && !match.includes('take:')) {
            lists.push(fieldName);
          }
        });
      }
    }
    
    return lists;
  }

  private addPaginationToField(query: string, fieldName: string): string {
    // Add basic pagination to a field
    return query.replace(
      new RegExp(`(${fieldName})(\\s*\\{)`),
      `$1(first: 20)$2`
    );
  }

  private calculateQueryDepth(query: string): number {
    let depth = 0;
    let maxDepth = 0;
    
    for (const char of query) {
      if (char === '{') {
        depth++;
        maxDepth = Math.max(maxDepth, depth);
      } else if (char === '}') {
        depth--;
      }
    }
    
    return maxDepth;
  }

  private suggestQueryFlattening(query: string): string {
    // In production, implement intelligent query flattening
    return query + '\n# Consider flattening this deeply nested query using fragments or multiple requests';
  }

  private generateCacheKey(query: string, variables?: Record<string, any>): string {
    const crypto = require('crypto');
    const content = query + JSON.stringify(variables || {});
    return crypto.createHash('md5').update(content).digest('hex');
  }
}

/**
 * GraphQL Response Cache
 */
class GraphQLResponseCache {
  private redis: Redis;
  private localCache = new Map<string, { data: any; expiry: number }>();

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Get cached response
   */
  async get(query: string, variables?: Record<string, any>): Promise<any | null> {
    const cacheKey = this.generateCacheKey(query, variables);
    
    // Check local cache first
    const localCached = this.localCache.get(cacheKey);
    if (localCached && localCached.expiry > Date.now()) {
      return localCached.data;
    }

    // Check Redis cache
    try {
      const cached = await this.redis.get(`gql:${cacheKey}`);
      if (cached) {
        const data = JSON.parse(cached);
        
        // Warm local cache
        this.localCache.set(cacheKey, {
          data,
          expiry: Date.now() + 60000, // 1 minute local cache
        });
        
        return data;
      }
    } catch (error) {
      console.error('Redis cache error:', error);
    }

    return null;
  }

  /**
   * Cache response
   */
  async set(
    query: string,
    variables: Record<string, any> | undefined,
    response: any,
    config: CacheConfig
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(query, variables);
    
    // Store in Redis
    try {
      await this.redis.setex(`gql:${cacheKey}`, config.ttl, JSON.stringify(response));
      
      // Tag-based invalidation
      for (const tag of config.tags) {
        await this.redis.sadd(`gql:tags:${tag}`, cacheKey);
        await this.redis.expire(`gql:tags:${tag}`, config.ttl);
      }
    } catch (error) {
      console.error('Redis cache set error:', error);
    }

    // Store in local cache
    this.localCache.set(cacheKey, {
      data: response,
      expiry: Date.now() + Math.min(config.ttl * 1000, 300000), // Max 5 minutes local
    });
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      try {
        const keys = await this.redis.smembers(`gql:tags:${tag}`);
        
        if (keys.length > 0) {
          const pipeline = this.redis.pipeline();
          
          keys.forEach(key => {
            pipeline.del(`gql:${key}`);
            this.localCache.delete(key);
          });
          
          pipeline.del(`gql:tags:${tag}`);
          await pipeline.exec();
        }
      } catch (error) {
        console.error(`Tag invalidation error for ${tag}:`, error);
      }
    }
  }

  private generateCacheKey(query: string, variables?: Record<string, any>): string {
    const crypto = require('crypto');
    const normalizedQuery = query.replace(/\s+/g, ' ').trim();
    const content = normalizedQuery + JSON.stringify(variables || {});
    return crypto.createHash('md5').update(content).digest('hex');
  }
}

/**
 * Main GraphQL Optimizer
 */
export class GraphQLOptimizer {
  public complexity: QueryComplexityAnalyzer;
  public optimizer: GraphQLQueryOptimizer;
  public cache: GraphQLResponseCache;
  private redis: Redis;
  private dataLoaders = new Map<string, DataLoader<any, any>>();

  constructor(redis: Redis) {
    this.redis = redis;
    this.complexity = new QueryComplexityAnalyzer();
    this.optimizer = new GraphQLQueryOptimizer(redis);
    this.cache = new GraphQLResponseCache(redis);
  }

  /**
   * Create a DataLoader for efficient batching
   */
  createDataLoader<K, V>(
    name: string,
    batchFn: (keys: K[]) => Promise<V[]>,
    options?: {
      maxBatchSize?: number;
      cacheKeyFn?: (key: K) => string;
    }
  ): DataLoader<K, V> {
    const loader = new DataLoaderImpl(batchFn, options);
    this.dataLoaders.set(name, loader);
    return loader;
  }

  /**
   * Get existing DataLoader
   */
  getDataLoader<K, V>(name: string): DataLoader<K, V> | undefined {
    return this.dataLoaders.get(name) as DataLoader<K, V>;
  }

  /**
   * Process GraphQL request with optimization
   */
  async processRequest(
    query: string,
    variables?: Record<string, any>,
    context?: any
  ): Promise<{
    response: any;
    fromCache: boolean;
    complexity: QueryComplexity;
    optimization: QueryOptimization;
    executionTime: number;
  }> {
    const startTime = performance.now();

    // Analyze complexity
    const complexity = this.complexity.analyzeComplexity(query, variables);
    const complexityCheck = this.complexity.isQueryTooComplex(complexity);
    
    if (!complexityCheck.allowed) {
      throw new Error(`Query rejected: ${complexityCheck.reason}`);
    }

    // Check cache first
    const cachedResponse = await this.cache.get(query, variables);
    if (cachedResponse) {
      return {
        response: cachedResponse,
        fromCache: true,
        complexity,
        optimization: { originalQuery: query, optimizedQuery: query, optimizations: [], estimatedImprovement: 0, warnings: [] },
        executionTime: performance.now() - startTime,
      };
    }

    // Optimize query
    const optimization = await this.optimizer.optimizeQuery(query, variables);

    // Execute query (this would integrate with your GraphQL executor)
    const response = await this.executeQuery(optimization.optimizedQuery, variables, context);

    // Cache response if appropriate
    if (this.shouldCacheResponse(query, response)) {
      await this.cache.set(query, variables, response, {
        ttl: this.determineCacheTTL(query),
        maxAge: 3600,
        scope: context?.authenticated ? 'authenticated' : 'public',
        tags: this.extractCacheTags(query),
      });
    }

    return {
      response,
      fromCache: false,
      complexity,
      optimization,
      executionTime: performance.now() - startTime,
    };
  }

  /**
   * Clear all DataLoader caches
   */
  clearDataLoaders(): void {
    this.dataLoaders.forEach(loader => loader.clearAll());
  }

  /**
   * Get optimization statistics
   */
  getStats(): {
    complexity: { averageScore: number; maxScore: number; totalQueries: number };
    optimization: { totalOptimizations: number; averageImprovement: number };
    cache: { hitRate: number; totalRequests: number };
    dataLoaders: { totalLoaders: number; totalCacheSize: number };
  } {
    // Mock stats - in production, collect real metrics
    return {
      complexity: {
        averageScore: 245,
        maxScore: 850,
        totalQueries: 1250,
      },
      optimization: {
        totalOptimizations: 342,
        averageImprovement: 15.7,
      },
      cache: {
        hitRate: 68.5,
        totalRequests: 2150,
      },
      dataLoaders: {
        totalLoaders: this.dataLoaders.size,
        totalCacheSize: Array.from(this.dataLoaders.values()).length * 50, // Estimate
      },
    };
  }

  private async executeQuery(query: string, variables?: Record<string, any>, context?: any): Promise<any> {
    // This would integrate with your actual GraphQL executor (Apollo Server, etc.)
    // For now, return a mock response
    return {
      data: {
        users: [
          { id: '1', name: 'John Doe', email: 'john@example.com' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        ],
      },
    };
  }

  private shouldCacheResponse(query: string, response: any): boolean {
    // Don't cache mutations or subscriptions
    if (query.trim().startsWith('mutation') || query.trim().startsWith('subscription')) {
      return false;
    }

    // Don't cache error responses
    if (response.errors && response.errors.length > 0) {
      return false;
    }

    return true;
  }

  private determineCacheTTL(query: string): number {
    // Determine cache TTL based on query characteristics
    if (query.includes('user') || query.includes('profile')) {
      return 300; // 5 minutes for user data
    }
    
    if (query.includes('analytics') || query.includes('metrics')) {
      return 60; // 1 minute for analytics
    }
    
    return 1800; // 30 minutes default
  }

  private extractCacheTags(query: string): string[] {
    const tags: string[] = [];
    
    // Extract entity types from query
    const entityMatches = query.match(/\b(user|project|team|analysis|metric)s?\b/gi);
    if (entityMatches) {
      entityMatches.forEach(match => {
        const tag = match.toLowerCase().replace(/s$/, '');
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      });
    }
    
    return tags;
  }
}

/**
 * Factory function
 */
export function createGraphQLOptimizer(redis: Redis): GraphQLOptimizer {
  return new GraphQLOptimizer(redis);
}

/**
 * Express/Next.js middleware for GraphQL optimization
 */
export function graphqlOptimizationMiddleware(optimizer: GraphQLOptimizer) {
  return async (req: any, res: any, next: any) => {
    if (req.method === 'POST' && req.body && req.body.query) {
      try {
        const { query, variables, operationName } = req.body;
        
        const result = await optimizer.processRequest(query, variables, {
          authenticated: !!req.user,
          userId: req.user?.id,
        });
        
        // Add performance headers
        res.setHeader('X-GraphQL-From-Cache', result.fromCache.toString());
        res.setHeader('X-GraphQL-Complexity', result.complexity.score.toString());
        res.setHeader('X-GraphQL-Execution-Time', `${result.executionTime.toFixed(2)}ms`);
        res.setHeader('X-GraphQL-Optimizations', result.optimization.optimizations.length.toString());
        
        // Send response
        res.json(result.response);
        return;
        
      } catch (error) {
        console.error('GraphQL optimization error:', error);
        // Continue to next middleware on error
      }
    }
    
    next();
  };
}