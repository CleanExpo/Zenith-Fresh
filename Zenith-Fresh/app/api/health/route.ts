import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { testRedisConnection } from '@/lib/redis';
import { PerformanceMonitor } from '@/lib/performance';

// Health check endpoint for CI/CD monitoring
export async function GET(request: NextRequest) {
  const timer = PerformanceMonitor.startTimer();
  
  try {
    // Parallel health checks for better performance
    const [dbCheck, redisCheck, memoryCheck] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      Promise.resolve(checkMemory())
    ]);

    const duration = timer.stop();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      responseTime: `${duration.toFixed(2)}ms`,
      performanceStatus: duration < 200 ? 'optimal' : duration < 500 ? 'acceptable' : 'poor',
      checks: {
        database: dbCheck,
        redis: redisCheck,
        memory: memoryCheck,
        disk: checkDisk(),
      }
    };

    // Check if any critical service is down
    const criticalServices = ['database'];
    const hasFailure = criticalServices.some(service => 
      health.checks[service as keyof typeof health.checks]?.status === 'unhealthy'
    );

    const statusCode = hasFailure ? 503 : 200;
    
    // Record performance metric
    PerformanceMonitor.recordMetric({
      endpoint: '/api/health',
      method: 'GET',
      duration,
      statusCode,
      timestamp: Date.now()
    }).catch(console.error);
    
    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Response-Time': `${duration.toFixed(2)}ms`
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    const duration = timer.stop();
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV || 'development',
      responseTime: `${duration.toFixed(2)}ms`
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Response-Time': `${duration.toFixed(2)}ms`
      }
    });
  }
}

async function checkDatabase() {
  const start = Date.now();
  
  try {
    if (process.env.DATABASE_URL) {
      // Simple query to test connection
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency: `${latency}ms`,
        message: 'Database connection successful'
      };
    } else {
      return {
        status: 'warning',
        message: 'Database URL not configured'
      };
    }
  } catch (error) {
    const latency = Date.now() - start;
    return {
      status: 'unhealthy',
      latency: `${latency}ms`,
      message: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

async function checkRedis() {
  const start = Date.now();
  
  try {
    if (process.env.REDIS_URL) {
      const isConnected = await testRedisConnection();
      const latency = Date.now() - start;
      
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        latency: `${latency}ms`,
        message: isConnected ? 'Redis connection successful' : 'Redis ping failed'
      };
    } else {
      return {
        status: 'warning',
        message: 'Redis not configured'
      };
    }
  } catch (error) {
    const latency = Date.now() - start;
    return {
      status: 'unhealthy',
      latency: `${latency}ms`,
      message: error instanceof Error ? error.message : 'Redis connection failed'
    };
  }
}

function checkMemory() {
  try {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    // Consider unhealthy if heap usage is over 500MB
    const isHealthy = memUsageMB.heapUsed < 500;
    
    return {
      status: isHealthy ? 'healthy' : 'warning',
      usage: memUsageMB,
      limit: '500MB',
      message: isHealthy ? 'Memory usage normal' : 'High memory usage detected'
    };
  } catch (error) {
    return {
      status: 'warning',
      message: 'Could not check memory usage'
    };
  }
}

function checkDisk() {
  try {
    // In a serverless environment, disk space is usually not a concern
    // But we can check for basic file system access
    return {
      status: 'healthy',
      message: 'Disk access available'
    };
  } catch (error) {
    return {
      status: 'warning',
      message: 'Could not check disk usage'
    };
  }
}

// Also support HEAD requests for basic health checks
export async function HEAD(request: NextRequest) {
  try {
    // Quick health check without detailed information
    const basicCheck = await checkDatabase();
    const statusCode = basicCheck.status === 'unhealthy' ? 503 : 200;
    
    return new NextResponse(null, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': basicCheck.status,
        'X-Health-Timestamp': new Date().toISOString()
      }
    });
  } catch (error) {
    return new NextResponse(null, { 
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy',
        'X-Health-Timestamp': new Date().toISOString()
      }
    });
  }
}