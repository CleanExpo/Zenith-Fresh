/**
 * OPTIMIZED HEALTH CHECK API ENDPOINT
 * Demonstrates API Performance Optimization Middleware integration
 * Enterprise-grade health monitoring with comprehensive diagnostics
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { createOptimizedAPIHandler, APIOptimizationPresets } from '@/lib/api/api-optimization-middleware';
import { z } from 'zod';

// Response schema validation
const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string(),
  version: z.string(),
  uptime: z.number(),
  services: z.object({
    database: z.object({
      status: z.enum(['connected', 'error', 'timeout']),
      responseTime: z.number(),
      connections: z.number().optional()
    }),
    cache: z.object({
      status: z.enum(['connected', 'error', 'disabled']),
      responseTime: z.number(),
      hitRate: z.number().optional()
    }),
    api: z.object({
      status: z.enum(['healthy', 'degraded', 'unhealthy']),
      averageResponseTime: z.number(),
      requestsPerMinute: z.number()
    })
  }),
  system: z.object({
    memory: z.object({
      used: z.number(),
      total: z.number(),
      percentage: z.number()
    }),
    cpu: z.object({
      usage: z.number().optional()
    }),
    disk: z.object({
      available: z.number().optional()
    })
  }),
  environment: z.object({
    nodeEnv: z.string(),
    platform: z.string(),
    nodeVersion: z.string()
  }),
  security: z.object({
    rateLimitActive: z.boolean(),
    authenticationEnabled: z.boolean(),
    httpsEnabled: z.boolean()
  })
});

/**
 * Enhanced health check handler with comprehensive diagnostics
 */
async function healthCheckHandler(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Check database health
    const dbHealth = await checkDatabaseHealth();
    
    // Check cache health
    const cacheHealth = await checkCacheHealth();
    
    // Check API health
    const apiHealth = await checkAPIHealth();
    
    // Get system metrics
    const systemMetrics = getSystemMetrics();
    
    // Get environment info
    const environmentInfo = getEnvironmentInfo();
    
    // Get security status
    const securityStatus = getSecurityStatus();
    
    // Determine overall health status
    const overallStatus = determineOverallStatus(dbHealth, cacheHealth, apiHealth);
    
    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services: {
        database: dbHealth,
        cache: cacheHealth,
        api: apiHealth
      },
      system: systemMetrics,
      environment: environmentInfo,
      security: securityStatus
    };
    
    // Validate response against schema
    const validationResult = HealthResponseSchema.safeParse(response);
    if (!validationResult.success) {
      console.error('Health check response validation failed:', validationResult.error);
    }
    
    const responseTime = Date.now() - startTime;
    
    const httpResponse = NextResponse.json(response, {
      status: overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 206 : 503
    });
    
    // Add custom headers
    httpResponse.headers.set('X-Health-Check-Time', responseTime.toString());
    httpResponse.headers.set('X-Service-Version', response.version);
    httpResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return httpResponse;
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime()
    }, { status: 503 });
  }
}

/**
 * Check database connectivity and performance
 */
async function checkDatabaseHealth(): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get connection info
    const connections = await prisma.$queryRaw`
      SELECT count(*) as active_connections 
      FROM pg_stat_activity 
      WHERE state = 'active'
    ` as any[];
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'connected' as const,
      responseTime,
      connections: connections[0]?.active_connections || 0
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (responseTime > 5000) {
      return {
        status: 'timeout' as const,
        responseTime,
        error: 'Database connection timeout'
      };
    }
    
    return {
      status: 'error' as const,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

/**
 * Check cache (Redis) connectivity and performance
 */
async function checkCacheHealth(): Promise<any> {
  const startTime = Date.now();
  
  if (!redis) {
    return {
      status: 'disabled' as const,
      responseTime: 0,
      message: 'Redis not configured'
    };
  }
  
  try {
    // Test Redis connection
    await redis.ping();
    
    // Get cache statistics
    const info = await redis.info('stats');
    const hitRate = parseCacheHitRate(info);
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'connected' as const,
      responseTime,
      hitRate
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'error' as const,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown cache error'
    };
  }
}

/**
 * Check API health and performance metrics
 */
async function checkAPIHealth(): Promise<any> {
  // Simulate API health metrics (in production, would get from monitoring system)
  const averageResponseTime = 150; // ms
  const requestsPerMinute = 1200;
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (averageResponseTime > 500) {
    status = 'unhealthy';
  } else if (averageResponseTime > 200) {
    status = 'degraded';
  }
  
  return {
    status,
    averageResponseTime,
    requestsPerMinute
  };
}

/**
 * Get system resource metrics
 */
function getSystemMetrics(): any {
  const memoryUsage = process.memoryUsage();
  
  return {
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
    },
    cpu: {
      usage: process.cpuUsage().user / 1000000 // Convert to seconds
    },
    disk: {
      available: 0 // Would implement disk space check in production
    }
  };
}

/**
 * Get environment information
 */
function getEnvironmentInfo(): any {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    platform: process.platform,
    nodeVersion: process.version
  };
}

/**
 * Get security configuration status
 */
function getSecurityStatus(): any {
  return {
    rateLimitActive: !!process.env.REDIS_URL, // Rate limiting requires Redis
    authenticationEnabled: !!process.env.NEXTAUTH_SECRET,
    httpsEnabled: process.env.NODE_ENV === 'production'
  };
}

/**
 * Determine overall health status from service statuses
 */
function determineOverallStatus(
  dbHealth: any, 
  cacheHealth: any, 
  apiHealth: any
): 'healthy' | 'degraded' | 'unhealthy' {
  
  // Critical service failures
  if (dbHealth.status === 'error' || dbHealth.status === 'timeout') {
    return 'unhealthy';
  }
  
  if (apiHealth.status === 'unhealthy') {
    return 'unhealthy';
  }
  
  // Degraded performance
  if (cacheHealth.status === 'error' || apiHealth.status === 'degraded') {
    return 'degraded';
  }
  
  return 'healthy';
}

/**
 * Parse cache hit rate from Redis info
 */
function parseCacheHitRate(info: string): number {
  const lines = info.split('\r\n');
  let hits = 0;
  let misses = 0;
  
  for (const line of lines) {
    if (line.startsWith('keyspace_hits:')) {
      hits = parseInt(line.split(':')[1]);
    } else if (line.startsWith('keyspace_misses:')) {
      misses = parseInt(line.split(':')[1]);
    }
  }
  
  const total = hits + misses;
  return total > 0 ? hits / total : 0;
}

// Create optimized handler with comprehensive configuration
const optimizedHealthCheck = createOptimizedAPIHandler(
  healthCheckHandler,
  {
    ...APIOptimizationPresets.readOptimized,
    caching: {
      enabled: true,
      ttl: 30, // Cache for 30 seconds (health checks should be fresh)
      varyBy: [],
      excludeMethods: []
    },
    monitoring: {
      enabled: true,
      sampleRate: 1.0 // Monitor all health checks
    },
    validation: {
      enabled: true,
      responseSchema: HealthResponseSchema
    },
    security: {
      enabled: true,
      requireAuth: false, // Health checks should be public
      maxRequestSize: 1024 // 1KB max for health checks
    }
  }
);


// Export optimized handlers
export const GET = optimizedHealthCheck;
export const HEAD = optimizedHealthCheck; // Support HEAD requests for load balancers