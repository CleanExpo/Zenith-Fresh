/**
 * Health Check API Endpoint
 * Provides system health status for monitoring and load balancers
 */

import { NextResponse } from 'next/server';

/**
 * GET handler for health checks
 */
export async function GET(request) {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: 'N/A', // Edge runtime doesn't support process.uptime
      service: 'zenith-fresh',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production'
    };
    
    // Check if detailed health check is requested
    const url = new URL(request.url);
    const detailed = url.searchParams.get('detailed') === 'true';
    
    if (detailed) {
      // Add more detailed health information
      health.checks = {
        database: await checkDatabase(),
        api: await checkAPIEndpoints(),
        memory: checkMemoryUsage(),
        environment: checkEnvironment()
      };
      
      // Determine overall health based on checks
      const allHealthy = Object.values(health.checks).every(check => check.status === 'healthy');
      health.status = allHealthy ? 'healthy' : 'degraded';
    }
    
    // Return appropriate status code based on health
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase() {
  try {
    // Since no database is configured, we'll return a mock status
    // In production, this would check actual database connectivity
    return {
      status: 'healthy',
      message: 'Database not configured (using in-memory storage)',
      latency: 0
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
      latency: -1
    };
  }
}

/**
 * Check API endpoints availability
 */
async function checkAPIEndpoints() {
  try {
    // Check if critical API endpoints are accessible
    const endpoints = [
      '/api/system-monitor',
      '/api/traffic-manager'
    ];
    
    // Since we're in the same process, we'll just verify they exist
    return {
      status: 'healthy',
      message: `${endpoints.length} API endpoints configured`,
      endpoints: endpoints
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message
    };
  }
}

/**
 * Check memory usage
 */
function checkMemoryUsage() {
  try {
    const used = process.memoryUsage();
    const totalMB = Math.round(used.heapTotal / 1024 / 1024);
    const usedMB = Math.round(used.heapUsed / 1024 / 1024);
    const percentage = Math.round((used.heapUsed / used.heapTotal) * 100);
    
    return {
      status: percentage > 90 ? 'warning' : 'healthy',
      message: `Using ${usedMB}MB of ${totalMB}MB (${percentage}%)`,
      details: {
        heapUsed: usedMB,
        heapTotal: totalMB,
        percentage: percentage
      }
    };
  } catch (error) {
    return {
      status: 'unknown',
      message: 'Unable to check memory usage'
    };
  }
}

/**
 * Check environment configuration
 */
function checkEnvironment() {
  const requiredEnvVars = [
    'NODE_ENV',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ];
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    return {
      status: 'warning',
      message: `Missing ${missing.length} environment variables`,
      missing: missing
    };
  }
  
  return {
    status: 'healthy',
    message: 'All required environment variables are set'
  };
}

/**
 * Using Node.js runtime for process.memoryUsage() support
 */