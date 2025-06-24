// src/middleware/performance.ts - Performance Monitoring Middleware

import { NextRequest, NextResponse } from 'next/server';

interface PerformanceMetrics {
  path: string;
  method: string;
  responseTime: number;
  timestamp: number;
  userAgent?: string;
  ip?: string;
  cacheHit?: boolean;
  errorRate?: number;
}

interface PerformanceBudget {
  route: string;
  maxResponseTime: number; // milliseconds
  maxMemoryUsage?: number; // MB
  warningThreshold: number; // percentage of max
}

// Performance budgets for different route types
const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  { route: '/api/auth/*', maxResponseTime: 500, warningThreshold: 80 },
  { route: '/api/analytics/*', maxResponseTime: 1000, warningThreshold: 85 },
  { route: '/api/agents/*', maxResponseTime: 2000, warningThreshold: 90 },
  { route: '/api/*', maxResponseTime: 800, warningThreshold: 80 },
  { route: '/*', maxResponseTime: 3000, warningThreshold: 85 }
];

// In-memory performance tracking (in production, use Redis/Database)
const performanceMetrics: PerformanceMetrics[] = [];
const alertedRoutes = new Set<string>();

// Performance monitoring cache
const responseCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function createPerformanceMiddleware() {
  return async function performanceMiddleware(
    request: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = performance.now();
    const path = request.nextUrl.pathname;
    const method = request.method;
    
    // Check if response is cacheable and cached
    const cacheKey = `${method}:${path}:${request.nextUrl.search}`;
    const cached = getCachedResponse(cacheKey);
    
    if (cached) {
      // Return cached response with performance headers
      const response = new NextResponse(cached.data);
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Response-Time', '1ms');
      
      recordMetrics({
        path,
        method,
        responseTime: 1,
        timestamp: Date.now(),
        userAgent: request.headers.get('user-agent') || undefined,
        ip: getClientIP(request),
        cacheHit: true
      });
      
      return response;
    }

    let response: NextResponse;
    let error: Error | null = null;

    try {
      // Execute the request
      response = await next();
    } catch (err) {
      error = err as Error;
      response = new NextResponse('Internal Server Error', { status: 500 });
    }

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    // Add performance headers
    response.headers.set('X-Response-Time', `${responseTime.toFixed(2)}ms`);
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('X-Powered-By', 'Zenith-Performance-Engine');

    // Record performance metrics
    const metrics: PerformanceMetrics = {
      path,
      method,
      responseTime,
      timestamp: Date.now(),
      userAgent: request.headers.get('user-agent') || undefined,
      ip: getClientIP(request),
      cacheHit: false,
      errorRate: error ? 1 : 0
    };

    recordMetrics(metrics);

    // Check performance budgets and alert if needed
    await checkPerformanceBudgets(metrics);

    // Cache successful GET responses
    if (method === 'GET' && response.status === 200 && isCacheable(path)) {
      setCachedResponse(cacheKey, await response.clone().text(), getCacheTTL(path));
    }

    // Add server timing for browser dev tools
    response.headers.set(
      'Server-Timing',
      `total;dur=${responseTime.toFixed(2)};desc="Total Response Time"`
    );

    return response;
  };
}

function recordMetrics(metrics: PerformanceMetrics): void {
  performanceMetrics.push(metrics);
  
  // Keep only last 1000 metrics in memory
  if (performanceMetrics.length > 1000) {
    performanceMetrics.splice(0, 100);
  }

  // Log slow requests
  if (metrics.responseTime > 1000) {
    console.warn(`🐌 Slow request detected: ${metrics.method} ${metrics.path} - ${metrics.responseTime.toFixed(2)}ms`);
  }

  // Log errors
  if (metrics.errorRate && metrics.errorRate > 0) {
    console.error(`❌ Error in request: ${metrics.method} ${metrics.path}`);
  }
}

async function checkPerformanceBudgets(metrics: PerformanceMetrics): Promise<void> {
  const budget = findMatchingBudget(metrics.path);
  
  if (!budget) return;

  const budgetExceeded = metrics.responseTime > budget.maxResponseTime;
  const warningThreshold = budget.maxResponseTime * (budget.warningThreshold / 100);
  const nearBudget = metrics.responseTime > warningThreshold;

  if (budgetExceeded) {
    const alertKey = `${metrics.path}:exceeded`;
    
    if (!alertedRoutes.has(alertKey)) {
      console.error(`🚨 PERFORMANCE BUDGET EXCEEDED: ${metrics.path}
        Response Time: ${metrics.responseTime.toFixed(2)}ms
        Budget: ${budget.maxResponseTime}ms
        Overage: ${(metrics.responseTime - budget.maxResponseTime).toFixed(2)}ms`);
      
      alertedRoutes.add(alertKey);
      
      // Remove alert after 5 minutes to allow re-alerting
      setTimeout(() => alertedRoutes.delete(alertKey), 5 * 60 * 1000);
    }
  } else if (nearBudget) {
    const warningKey = `${metrics.path}:warning`;
    
    if (!alertedRoutes.has(warningKey)) {
      console.warn(`⚠️ PERFORMANCE WARNING: ${metrics.path}
        Response Time: ${metrics.responseTime.toFixed(2)}ms
        Budget: ${budget.maxResponseTime}ms
        Warning Threshold: ${warningThreshold.toFixed(2)}ms`);
      
      alertedRoutes.add(warningKey);
      
      // Remove warning after 10 minutes
      setTimeout(() => alertedRoutes.delete(warningKey), 10 * 60 * 1000);
    }
  }
}

function findMatchingBudget(path: string): PerformanceBudget | null {
  // Find the most specific matching budget
  for (const budget of PERFORMANCE_BUDGETS) {
    const pattern = budget.route.replace('*', '.*');
    const regex = new RegExp(`^${pattern}$`);
    
    if (regex.test(path)) {
      return budget;
    }
  }
  
  return null;
}

function isCacheable(path: string): boolean {
  // Define which paths can be cached
  const cacheablePatterns = [
    '/api/analytics/*',
    '/api/health',
    '/api/system-monitor'
  ];
  
  // Don't cache authentication or mutation endpoints
  const nonCacheablePatterns = [
    '/api/auth/*',
    '/api/user/*',
    '/api/team/*'
  ];
  
  for (const pattern of nonCacheablePatterns) {
    const regex = new RegExp(`^${pattern.replace('*', '.*')}$`);
    if (regex.test(path)) return false;
  }
  
  for (const pattern of cacheablePatterns) {
    const regex = new RegExp(`^${pattern.replace('*', '.*')}$`);
    if (regex.test(path)) return true;
  }
  
  return false;
}

function getCacheTTL(path: string): number {
  // Return cache TTL in milliseconds based on path
  if (path.startsWith('/api/analytics')) return 5 * 60 * 1000; // 5 minutes
  if (path === '/api/health') return 30 * 1000; // 30 seconds
  if (path === '/api/system-monitor') return 60 * 1000; // 1 minute
  
  return 60 * 1000; // Default 1 minute
}

function getCachedResponse(key: string): any {
  const cached = responseCache.get(key);
  
  if (!cached) return null;
  
  const now = Date.now();
  if (now > cached.timestamp + cached.ttl) {
    responseCache.delete(key);
    return null;
  }
  
  return cached;
}

function setCachedResponse(key: string, data: any, ttl: number): void {
  responseCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
  
  // Clean up old cache entries periodically
  if (responseCache.size > 1000) {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    responseCache.forEach((entry, cacheKey) => {
      if (now > entry.timestamp + entry.ttl) {
        keysToDelete.push(cacheKey);
      }
    });
    
    keysToDelete.forEach(key => responseCache.delete(key));
  }
}

function getClientIP(request: NextRequest): string {
  // Get client IP from various headers (considering proxies)
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  return xRealIP || remoteAddr || 'unknown';
}

// Export performance analytics functions
export function getPerformanceAnalytics() {
  const now = Date.now();
  const last24Hours = now - (24 * 60 * 60 * 1000);
  const recentMetrics = performanceMetrics.filter(m => m.timestamp > last24Hours);

  if (recentMetrics.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      errorRate: 0,
      cacheHitRate: 0,
      slowestEndpoints: []
    };
  }

  const responseTimes = recentMetrics.map(m => m.responseTime).sort((a, b) => a - b);
  const p95Index = Math.ceil(responseTimes.length * 0.95) - 1;
  
  const errorCount = recentMetrics.filter(m => m.errorRate && m.errorRate > 0).length;
  const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
  
  // Group by endpoint for slowest analysis
  const endpointGroups = recentMetrics.reduce((acc, metric) => {
    const key = `${metric.method} ${metric.path}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(metric.responseTime);
    return acc;
  }, {} as Record<string, number[]>);

  const slowestEndpoints = Object.entries(endpointGroups)
    .map(([endpoint, times]) => ({
      endpoint,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      maxTime: Math.max(...times),
      requestCount: times.length
    }))
    .sort((a, b) => b.averageTime - a.averageTime)
    .slice(0, 10);

  return {
    totalRequests: recentMetrics.length,
    averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    p95ResponseTime: responseTimes[p95Index] || 0,
    errorRate: (errorCount / recentMetrics.length) * 100,
    cacheHitRate: (cacheHits / recentMetrics.length) * 100,
    slowestEndpoints
  };
}

export function clearPerformanceMetrics(): void {
  performanceMetrics.length = 0;
  responseCache.clear();
  alertedRoutes.clear();
}

export { performanceMetrics };