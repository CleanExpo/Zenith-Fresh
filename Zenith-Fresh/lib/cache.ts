/**
 * Simple in-memory cache with TTL support
 * In production, replace with Redis or similar
 */

interface CacheItem<T> {
  data: T;
  expires: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data: value, expires });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Global cache instance
let cacheInstance: SimpleCache | null = null;

export function getCache(): SimpleCache {
  if (!cacheInstance) {
    cacheInstance = new SimpleCache();
  }
  return cacheInstance;
}

// Cache utilities
export const cache = {
  get: <T>(key: string): T | null => getCache().get<T>(key),
  set: <T>(key: string, value: T, ttlSeconds: number = 3600): void => 
    getCache().set(key, value, ttlSeconds),
  delete: (key: string): boolean => getCache().delete(key),
  has: (key: string): boolean => getCache().has(key),
  clear: (): void => getCache().clear(),
  size: (): number => getCache().size(),
};

export default cache;