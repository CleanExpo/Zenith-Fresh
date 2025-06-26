import { Redis } from 'ioredis';
import { performance } from 'perf_hooks';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  version: number;
  metadata: {
    hits: number;
    lastAccess: number;
    size: number;
    computationTime?: number;
  };
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  serialize?: boolean; // Whether to serialize complex objects
  compress?: boolean; // Whether to compress large values
  priority?: 'low' | 'medium' | 'high'; // Eviction priority
  computationTime?: number; // Time it took to compute this value
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  memoryUsage: number;
  hitRate: number;
  avgResponseTime: number;
  topKeys: Array<{ key: string; hits: number; size: number }>;
}

interface CacheLayer {
  name: string;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  stats(): Promise<Partial<CacheStats>>;
}

/**
 * In-Memory Cache Layer (L1)
 */
class MemoryCache implements CacheLayer {
  public name = 'memory';
  private cache = new Map<string, CacheEntry>();
  private _stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };
  private maxSize: number;
  private maxMemory: number; // in bytes

  constructor(maxSize = 10000, maxMemory = 100 * 1024 * 1024) { // 100MB default
    this.maxSize = maxSize;
    this.maxMemory = maxMemory;
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this._stats.misses++;
      return null;
    }

    const now = Date.now();
    
    // Check if expired
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      this._stats.misses++;
      return null;
    }

    // Update access statistics
    entry.metadata.hits++;
    entry.metadata.lastAccess = now;
    this._stats.hits++;

    return entry.data as T;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const now = Date.now();
    const serialized = options.serialize !== false ? JSON.stringify(value) : value as any;
    const size = this.calculateSize(serialized);

    // Check memory limits
    if (this.shouldEvict(size)) {
      await this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now,
      ttl: options.ttl || 3600, // 1 hour default
      tags: options.tags || [],
      version: 1,
      metadata: {
        hits: 0,
        lastAccess: now,
        size,
        computationTime: options.computationTime,
      },
    };

    this.cache.set(key, entry);
    this._stats.sets++;
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    this._stats.deletes++;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async stats(): Promise<Partial<CacheStats>> {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.metadata.size, 0);

    const topKeys = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        hits: entry.metadata.hits,
        size: entry.metadata.size,
      }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10);

    return {
      ...this.stats,
      size: this.cache.size,
      memoryUsage: totalSize,
      hitRate: this._stats.hits / (this._stats.hits + this._stats.misses) * 100,
      topKeys,
    };
  }

  private calculateSize(value: any): number {
    if (typeof value === 'string') {
      return Buffer.byteLength(value, 'utf8');
    }
    return JSON.stringify(value).length * 2; // Rough estimate
  }

  private shouldEvict(newItemSize: number): boolean {
    const currentMemory = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.metadata.size, 0);
    
    return this.cache.size >= this.maxSize || 
           (currentMemory + newItemSize) > this.maxMemory;
  }

  private async evictLRU(): Promise<void> {
    // Evict least recently used items
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].metadata.lastAccess - b[1].metadata.lastAccess);

    // Remove 10% of entries
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
      }
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Redis Cache Layer (L2)
 */
class RedisCache implements CacheLayer {
  public name = 'redis';
  private redis: Redis;
  private _stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.redis.get(key);
      
      if (!result) {
        this._stats.misses++;
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(result);
      
      // Update access statistics
      entry.metadata.hits++;
      entry.metadata.lastAccess = Date.now();
      
      // Update in Redis (fire and forget)
      this.redis.set(key, JSON.stringify(entry), 'EX', entry.ttl).catch(() => {});
      
      this._stats.hits++;
      return entry.data;
    } catch (error) {
      console.error('Redis cache get error:', error);
      this._stats.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const now = Date.now();
      const ttl = options.ttl || 3600;
      
      const entry: CacheEntry<T> = {
        data: value,
        timestamp: now,
        ttl,
        tags: options.tags || [],
        version: 1,
        metadata: {
          hits: 0,
          lastAccess: now,
          size: JSON.stringify(value).length,
          computationTime: options.computationTime,
        },
      };

      let serialized = JSON.stringify(entry);
      
      // Compress large values
      if (options.compress && serialized.length > 1024) {
        serialized = await this.compress(serialized);
      }

      await this.redis.set(key, serialized, 'EX', ttl);
      
      // Store tags for invalidation
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await this.redis.sadd(`tag:${tag}`, key);
          await this.redis.expire(`tag:${tag}`, ttl);
        }
      }

      this._stats.sets++;
    } catch (error) {
      console.error('Redis cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this._stats.deletes++;
    } catch (error) {
      console.error('Redis cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Redis cache clear error:', error);
    }
  }

  async stats(): Promise<Partial<CacheStats>> {
    try {
      const info = await this.redis.info('memory');
      const memoryUsage = this.parseMemoryInfo(info);
      
      return {
        ...this.stats,
        memoryUsage,
        hitRate: this._stats.hits / (this._stats.hits + this._stats.misses) * 100,
      };
    } catch (error) {
      console.error('Redis stats error:', error);
      return this._stats;
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      const keys = await this.redis.smembers(`tag:${tag}`);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        await this.redis.del(`tag:${tag}`);
      }
    } catch (error) {
      console.error('Redis tag invalidation error:', error);
    }
  }

  private async compress(data: string): Promise<string> {
    // Simple compression placeholder - in production, use zlib
    return data;
  }

  private parseMemoryInfo(info: string): number {
    const lines = info.split('\n');
    const usedMemoryLine = lines.find(line => line.startsWith('used_memory:'));
    return usedMemoryLine ? parseInt(usedMemoryLine.split(':')[1]) : 0;
  }
}

/**
 * Multi-Layer Cache Manager
 */
export class AdvancedCacheManager {
  private layers: CacheLayer[] = [];
  private writeThrough: boolean;
  private writeBack: boolean;
  private metrics: Map<string, number> = new Map();

  constructor(
    redis: Redis,
    options: {
      writeThrough?: boolean;
      writeBack?: boolean;
      memoryCache?: { maxSize?: number; maxMemory?: number };
    } = {}
  ) {
    this.writeThrough = options.writeThrough ?? true;
    this.writeBack = options.writeBack ?? false;

    // Add cache layers (L1: Memory, L2: Redis)
    this.layers.push(new MemoryCache(
      options.memoryCache?.maxSize,
      options.memoryCache?.maxMemory
    ));
    this.layers.push(new RedisCache(redis));
  }

  /**
   * Get value from cache with fallback through layers
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      const value = await layer.get<T>(key);
      
      if (value !== null) {
        // Cache hit - promote to higher layers
        if (i > 0) {
          await this.promoteToUpperLayers(key, value, i);
        }
        
        this.recordMetric('get.hit', performance.now() - startTime);
        return value;
      }
    }
    
    this.recordMetric('get.miss', performance.now() - startTime);
    return null;
  }

  /**
   * Set value in cache across appropriate layers
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const startTime = performance.now();
    
    if (this.writeThrough) {
      // Write to all layers
      await Promise.all(
        this.layers.map(layer => layer.set(key, value, options))
      );
    } else {
      // Write only to first layer
      await this.layers[0].set(key, value, options);
    }
    
    this.recordMetric('set', performance.now() - startTime);
  }

  /**
   * Delete from all layers
   */
  async delete(key: string): Promise<void> {
    await Promise.all(this.layers.map(layer => layer.delete(key)));
  }

  /**
   * Clear all layers
   */
  async clear(): Promise<void> {
    await Promise.all(this.layers.map(layer => layer.clear()));
  }

  /**
   * Invalidate by tag across all layers
   */
  async invalidateByTag(tag: string): Promise<void> {
    await Promise.all(
      this.layers.map(async layer => {
        if ('invalidateByTag' in layer) {
          await (layer as any).invalidateByTag(tag);
        }
      })
    );
  }

  /**
   * Get or set with fallback computation
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    // Compute value
    const startTime = performance.now();
    const value = await factory();
    const computationTime = performance.now() - startTime;

    // Cache the result
    await this.set(key, value, {
      ...options,
      computationTime,
    });

    return value;
  }

  /**
   * Batch operations
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  async mset<T>(entries: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<void> {
    await Promise.all(
      entries.map(({ key, value, options }) => this.set(key, value, options))
    );
  }

  /**
   * Get comprehensive cache statistics
   */
  async getStats(): Promise<{
    layers: Array<{ name: string; stats: Partial<CacheStats> }>;
    overall: {
      totalHits: number;
      totalMisses: number;
      totalSets: number;
      overallHitRate: number;
      avgResponseTime: number;
      memoryUsage: number;
    };
    performance: Record<string, { count: number; avgTime: number }>;
  }> {
    const layerStats = await Promise.all(
      this.layers.map(async layer => ({
        name: layer.name,
        stats: await layer.stats(),
      }))
    );

    const totalHits = layerStats.reduce((sum, layer) => sum + (layer.stats.hits || 0), 0);
    const totalMisses = layerStats.reduce((sum, layer) => sum + (layer.stats.misses || 0), 0);
    const totalSets = layerStats.reduce((sum, layer) => sum + (layer.stats.sets || 0), 0);
    const totalMemory = layerStats.reduce((sum, layer) => sum + (layer.stats.memoryUsage || 0), 0);

    const performance: Record<string, { count: number; avgTime: number }> = {};
    for (const [operation, times] of Array.from(this.metrics.entries())) {
      const count = Math.floor(times / 1000); // Rough count estimation
      const avgTime = count > 0 ? times / count : 0;
      performance[operation] = { count, avgTime };
    }

    return {
      layers: layerStats,
      overall: {
        totalHits,
        totalMisses,
        totalSets,
        overallHitRate: totalHits / (totalHits + totalMisses) * 100,
        avgResponseTime: (this.metrics.get('get.hit') || 0) + (this.metrics.get('get.miss') || 0),
        memoryUsage: totalMemory,
      },
      performance,
    };
  }

  /**
   * Cache warming utilities
   */
  async warmCache(entries: Array<{ key: string; factory: () => Promise<any>; options?: CacheOptions }>): Promise<void> {
    const warming = entries.map(async ({ key, factory, options }) => {
      const exists = await this.get(key);
      if (!exists) {
        const value = await factory();
        await this.set(key, value, options);
      }
    });

    await Promise.all(warming);
  }

  /**
   * Preload related data
   */
  async preload(patterns: string[], factory: (key: string) => Promise<any>): Promise<void> {
    const preloading = patterns.map(async pattern => {
      const value = await factory(pattern);
      await this.set(pattern, value);
    });

    await Promise.all(preloading);
  }

  /**
   * Cache patterns for common use cases
   */

  // User session cache
  async cacheUserSession(userId: string, sessionData: any, ttl = 3600): Promise<void> {
    await this.set(`session:${userId}`, sessionData, {
      ttl,
      tags: ['sessions', `user:${userId}`],
      priority: 'high',
    });
  }

  async getUserSession(userId: string): Promise<any | null> {
    return this.get(`session:${userId}`);
  }

  // API response cache
  async cacheApiResponse(endpoint: string, params: Record<string, any>, response: any, ttl = 300): Promise<void> {
    const key = `api:${endpoint}:${this.hashParams(params)}`;
    await this.set(key, response, {
      ttl,
      tags: ['api', endpoint],
      priority: 'medium',
    });
  }

  async getApiResponse(endpoint: string, params: Record<string, any>): Promise<any | null> {
    const key = `api:${endpoint}:${this.hashParams(params)}`;
    return this.get(key);
  }

  // Database query cache
  async cacheQuery(query: string, params: any[], result: any, ttl = 600): Promise<void> {
    const key = `query:${this.hashQuery(query, params)}`;
    await this.set(key, result, {
      ttl,
      tags: ['queries', this.extractTableFromQuery(query)],
      priority: 'medium',
    });
  }

  async getQuery(query: string, params: any[]): Promise<any | null> {
    const key = `query:${this.hashQuery(query, params)}`;
    return this.get(key);
  }

  // Page/component cache
  async cachePage(path: string, content: string, ttl = 1800): Promise<void> {
    await this.set(`page:${path}`, content, {
      ttl,
      tags: ['pages'],
      priority: 'low',
    });
  }

  async getPage(path: string): Promise<string | null> {
    return this.get(`page:${path}`);
  }

  // Computed data cache (expensive calculations)
  async cacheComputation(key: string, result: any, computationTime: number, ttl = 3600): Promise<void> {
    await this.set(`computation:${key}`, result, {
      ttl,
      tags: ['computations'],
      priority: 'high',
      computationTime,
    });
  }

  async getComputation(key: string): Promise<any | null> {
    return this.get(`computation:${key}`);
  }

  /**
   * Private helper methods
   */
  private async promoteToUpperLayers<T>(key: string, value: T, fromLayer: number): Promise<void> {
    // Promote to all layers above the hit layer
    const promotions = [];
    for (let i = 0; i < fromLayer; i++) {
      promotions.push(this.layers[i].set(key, value));
    }
    await Promise.all(promotions);
  }

  private recordMetric(operation: string, time: number): void {
    const current = this.metrics.get(operation) || 0;
    this.metrics.set(operation, current + time);
  }

  private hashParams(params: Record<string, any>): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
  }

  private hashQuery(query: string, params: any[]): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(query + JSON.stringify(params)).digest('hex');
  }

  private extractTableFromQuery(query: string): string {
    // Simple extraction - in production, use a proper SQL parser
    const match = query.match(/FROM\s+(\w+)/i);
    return match ? match[1].toLowerCase() : 'unknown';
  }

  /**
   * Cache health monitoring
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    layers: Array<{ name: string; status: 'healthy' | 'unhealthy'; latency: number }>;
    recommendations: string[];
  }> {
    const layerHealth = await Promise.all(
      this.layers.map(async layer => {
        const startTime = performance.now();
        try {
          await layer.get('__health_check__');
          const latency = performance.now() - startTime;
          return {
            name: layer.name,
            status: latency < 100 ? ('healthy' as const) : ('unhealthy' as const),
            latency,
          };
        } catch (error) {
          return {
            name: layer.name,
            status: 'unhealthy' as const,
            latency: -1,
          };
        }
      })
    );

    const unhealthyLayers = layerHealth.filter(l => l.status === 'unhealthy');
    const status = unhealthyLayers.length === 0 ? 'healthy' : 
                  unhealthyLayers.length === layerHealth.length ? 'unhealthy' : 'degraded';

    const recommendations: string[] = [];
    const stats = await this.getStats();
    
    if (stats.overall.overallHitRate < 80) {
      recommendations.push('Cache hit rate is below 80%. Consider increasing TTL or warming cache.');
    }
    
    if (stats.overall.avgResponseTime > 50) {
      recommendations.push('Average response time is high. Check network latency and cache size.');
    }
    
    if (stats.overall.memoryUsage > 1024 * 1024 * 1024) { // 1GB
      recommendations.push('High memory usage detected. Consider implementing cache eviction policies.');
    }

    return {
      status,
      layers: layerHealth,
      recommendations,
    };
  }

  /**
   * Smart cache invalidation
   */
  async smartInvalidation(patterns: {
    prefixes?: string[];
    tags?: string[];
    maxAge?: number; // seconds
    byActivity?: boolean; // invalidate least accessed items
  }): Promise<{ invalidated: number; errors: string[] }> {
    let invalidated = 0;
    const errors: string[] = [];

    try {
      // Invalidate by tags
      if (patterns.tags) {
        for (const tag of patterns.tags) {
          await this.invalidateByTag(tag);
          invalidated++;
        }
      }

      // Additional invalidation logic would go here for prefixes, maxAge, etc.

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return { invalidated, errors };
  }
}

/**
 * Cache decorators for easy integration
 */
export function cached(options: CacheOptions & { key?: string } = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cache = (this as any)._cache as AdvancedCacheManager;
      if (!cache) {
        throw new Error('Cache manager not found. Add _cache property to class.');
      }

      const key = options.key || `${target.constructor.name}.${propertyName}:${JSON.stringify(args)}`;
      
      return cache.getOrSet(key, () => method.apply(this, args), options);
    };

    return descriptor;
  };
}

// Export factory function
export function createAdvancedCacheManager(
  redis: Redis,
  options?: any
): AdvancedCacheManager {
  return new AdvancedCacheManager(redis, options);
}