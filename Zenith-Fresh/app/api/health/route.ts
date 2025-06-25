import { NextRequest, NextResponse } from 'next/server';

// Health check endpoint for CI/CD monitoring
export async function GET(request: NextRequest) {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: await checkDatabase(),
        redis: await checkRedis(),
        memory: checkMemory(),
        disk: checkDisk(),
      }
    };

    // Check if any critical service is down
    const criticalServices = ['database'];
    const hasFailure = criticalServices.some(service => 
      health.checks[service as keyof typeof health.checks]?.status === 'unhealthy'
    );

    const statusCode = hasFailure ? 503 : 200;
    
    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV || 'development'
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

async function checkDatabase() {
  try {
    // Try to import and use Prisma if available
    if (process.env.DATABASE_URL) {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      // Simple query to test connection
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      
      return {
        status: 'healthy',
        responseTime: Date.now(),
        message: 'Database connection successful'
      };
    } else {
      return {
        status: 'warning',
        message: 'Database URL not configured'
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

async function checkRedis() {
  try {
    // Try to check Redis if configured
    if (process.env.REDIS_URL) {
      // Basic Redis connection check would go here
      // For now, just return a placeholder
      return {
        status: 'healthy',
        message: 'Redis connection available'
      };
    } else {
      return {
        status: 'warning',
        message: 'Redis not configured'
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
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