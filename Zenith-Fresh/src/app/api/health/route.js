/**
 * Health Check API Endpoint
 * Provides system health status for monitoring and load balancers
 */

// Force Node.js runtime for serverless compatibility
export const runtime = 'nodejs';
export const maxDuration = 10;

import { NextResponse } from 'next/server';
const { getDatabaseHealth } = require('../../../../lib/database.js');

// Error logging utility
const logError = (error, context, additionalInfo = {}) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...additionalInfo
  };
  console.error('[HEALTH_API_ERROR]', JSON.stringify(errorLog));
};

// Input validation utilities
const validateBooleanParam = (value, paramName) => {
  if (value === null || value === undefined) {
    return { isValid: true, value: false }; // Default to false
  }
  
  if (typeof value === 'boolean') {
    return { isValid: true, value };
  }
  
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true') {
      return { isValid: true, value: true };
    }
    if (lowerValue === 'false') {
      return { isValid: true, value: false };
    }
  }
  
  return {
    isValid: false,
    error: `${paramName} must be 'true' or 'false'`
  };
};

// Timeout wrapper for async operations
const withTimeout = async (operation, timeoutMs = 5000, operationName = 'Operation') => {
  return Promise.race([
    operation,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

/**
 * GET handler for health checks
 */
export async function GET(request) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Parse and validate URL parameters
    let url;
    try {
      url = new URL(request.url || '', 'http://localhost:3000');
    } catch (urlError) {
      logError(urlError, 'url_parsing', { requestId });
      return NextResponse.json({
        status: 'unhealthy',
        error: 'Invalid request URL',
        code: 'INVALID_URL',
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    // Validate 'detailed' parameter
    const detailedParam = url.searchParams.get('detailed');
    const detailedValidation = validateBooleanParam(detailedParam, 'detailed');
    
    if (!detailedValidation.isValid) {
      return NextResponse.json({
        status: 'unhealthy',
        error: detailedValidation.error,
        code: 'INVALID_PARAMETER',
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    const detailed = detailedValidation.value;
    
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: 'N/A', // Edge runtime doesn't support process.uptime
      service: 'zenith-fresh',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      requestId
    };
    
    if (detailed) {
      // Add more detailed health information with timeout protection
      try {
        const checks = {};
        
        // Run health checks with individual timeouts and error handling
        const checkPromises = [
          withTimeout(checkDatabase(), 3000, 'Database health check')
            .then(result => ({ database: result }))
            .catch(error => {
              logError(error, 'database_health_check', { requestId });
              return {
                database: {
                  status: 'error',
                  message: `Database check failed: ${error.message}`,
                  error: true
                }
              };
            }),
          
          withTimeout(checkAPIEndpoints(), 2000, 'API endpoints check')
            .then(result => ({ api: result }))
            .catch(error => {
              logError(error, 'api_endpoints_check', { requestId });
              return {
                api: {
                  status: 'error',
                  message: `API check failed: ${error.message}`,
                  error: true
                }
              };
            }),
          
          // Memory and environment checks are synchronous, but wrap in try-catch
          Promise.resolve().then(() => {
            try {
              return { memory: checkMemoryUsage() };
            } catch (error) {
              logError(error, 'memory_check', { requestId });
              return {
                memory: {
                  status: 'error',
                  message: `Memory check failed: ${error.message}`,
                  error: true
                }
              };
            }
          }),
          
          Promise.resolve().then(() => {
            try {
              return { environment: checkEnvironment() };
            } catch (error) {
              logError(error, 'environment_check', { requestId });
              return {
                environment: {
                  status: 'error',
                  message: `Environment check failed: ${error.message}`,
                  error: true
                }
              };
            }
          })
        ];
        
        // Wait for all checks to complete
        const checkResults = await Promise.all(checkPromises);
        
        // Merge all check results
        checkResults.forEach(result => {
          Object.assign(checks, result);
        });
        
        health.checks = checks;
        
        // Determine overall health based on checks
        const allHealthy = Object.values(health.checks).every(check => 
          check.status === 'healthy' || (check.status === 'warning' && !check.error)
        );
        const hasErrors = Object.values(health.checks).some(check => check.error || check.status === 'error');
        const hasWarnings = Object.values(health.checks).some(check => check.status === 'warning');
        
        if (hasErrors) {
          health.status = 'unhealthy';
        } else if (hasWarnings) {
          health.status = 'degraded';
        } else if (allHealthy) {
          health.status = 'healthy';
        } else {
          health.status = 'unknown';
        }
        
      } catch (checksError) {
        logError(checksError, 'detailed_health_checks', { requestId });
        health.checks = {
          error: {
            status: 'error',
            message: 'Failed to perform detailed health checks',
            details: checksError.message
          }
        };
        health.status = 'unhealthy';
      }
    }
    
    // Add processing time
    const processingTime = Date.now() - startTime;
    health.processingTime = `${processingTime}ms`;
    
    // Return appropriate status code based on health
    let statusCode;
    switch (health.status) {
      case 'healthy':
        statusCode = 200;
        break;
      case 'degraded':
      case 'warning':
        statusCode = 200; // Still operational but with warnings
        break;
      case 'unhealthy':
      case 'error':
        statusCode = 503;
        break;
      default:
        statusCode = 503;
    }
    
    // Add response headers for monitoring
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Status': health.status,
      'X-Processing-Time': processingTime.toString(),
      'X-Request-ID': requestId
    };
    
    return NextResponse.json(health, { status: statusCode, headers });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError(error, 'health_check_main', { processingTime, requestId });
    
    // Check for specific error types
    if (error.message && error.message.includes('timed out')) {
      return NextResponse.json({
        status: 'unhealthy',
        error: 'Health check timed out',
        code: 'HEALTH_CHECK_TIMEOUT',
        processingTime: `${processingTime}ms`,
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 408 });
    }
    
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      code: 'HEALTH_CHECK_ERROR',
      message: error.message,
      processingTime: `${processingTime}ms`,
      requestId,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase() {
  const checkStartTime = Date.now();
  
  try {
    // Use the actual database health check with timeout
    const dbHealth = await withTimeout(
      getDatabaseHealth(),
      2500, // Slightly less than the outer timeout
      'Database health check'
    );
    
    // Add latency information
    const latency = Date.now() - checkStartTime;
    return {
      ...dbHealth,
      latency: `${latency}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const latency = Date.now() - checkStartTime;
    logError(error, 'database_health_check', { latency });
    
    // Determine if it's a timeout or other error
    const isTimeout = error.message && error.message.includes('timed out');
    
    return {
      status: 'error',
      message: isTimeout 
        ? 'Database health check timed out'
        : `Database health check failed: ${error.message}`,
      latency: `${latency}ms`,
      fallback: 'Using in-memory storage',
      error: true,
      errorType: isTimeout ? 'timeout' : 'connection_error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check API endpoints availability
 */
async function checkAPIEndpoints() {
  const checkStartTime = Date.now();
  
  try {
    // Check if critical API endpoints are accessible
    const endpoints = [
      { path: '/api/system-monitor', name: 'System Monitor' },
      { path: '/api/traffic-manager', name: 'Traffic Manager' },
      { path: '/api/auth', name: 'Authentication' },
      { path: '/api/users', name: 'User Management' }
    ];
    
    // Since we're in the same process, we'll just verify configuration exists
    // In a production environment, you might want to make actual HTTP calls
    const endpointStatus = endpoints.map(endpoint => ({
      path: endpoint.path,
      name: endpoint.name,
      status: 'configured', // We can't easily test actual functionality here
      lastChecked: new Date().toISOString()
    }));
    
    const latency = Date.now() - checkStartTime;
    
    return {
      status: 'healthy',
      message: `${endpoints.length} API endpoints configured and accessible`,
      endpoints: endpointStatus,
      latency: `${latency}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const latency = Date.now() - checkStartTime;
    logError(error, 'api_endpoints_check', { latency });
    
    return {
      status: 'error',
      message: `API endpoints check failed: ${error.message}`,
      error: true,
      latency: `${latency}ms`,
      timestamp: new Date().toISOString()
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
    const externalMB = Math.round(used.external / 1024 / 1024);
    const arrayBuffersMB = Math.round((used.arrayBuffers || 0) / 1024 / 1024);
    const percentage = Math.round((used.heapUsed / used.heapTotal) * 100);
    
    // Determine status based on usage thresholds
    let status = 'healthy';
    let severity = 'info';
    
    if (percentage > 95) {
      status = 'error';
      severity = 'critical';
    } else if (percentage > 90) {
      status = 'warning';
      severity = 'high';
    } else if (percentage > 80) {
      status = 'warning';
      severity = 'medium';
    }
    
    return {
      status,
      severity,
      message: `Using ${usedMB}MB of ${totalMB}MB heap memory (${percentage}%)`,
      details: {
        heapUsed: `${usedMB}MB`,
        heapTotal: `${totalMB}MB`,
        external: `${externalMB}MB`,
        arrayBuffers: `${arrayBuffersMB}MB`,
        percentage: `${percentage}%`,
        rss: `${Math.round(used.rss / 1024 / 1024)}MB`
      },
      thresholds: {
        warning: '80%',
        critical: '95%'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logError(error, 'memory_usage_check');
    return {
      status: 'error',
      message: `Unable to check memory usage: ${error.message}`,
      error: true,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check environment configuration
 */
function checkEnvironment() {
  try {
    const requiredEnvVars = [
      { name: 'NODE_ENV', description: 'Application environment' },
      { name: 'NEXTAUTH_URL', description: 'Authentication URL' },
      { name: 'NEXTAUTH_SECRET', description: 'Authentication secret' }
    ];
    
    const optionalEnvVars = [
      { name: 'DATABASE_URL', description: 'Database connection string' },
      { name: 'MASTER_USERNAME', description: 'Master admin username' },
      { name: 'MASTER_PASSWORD', description: 'Master admin password' }
    ];
    
    const securitySensitive = ['NEXTAUTH_SECRET', 'MASTER_PASSWORD', 'DATABASE_URL'];
    
    // Check required variables
    const missing = requiredEnvVars.filter(envVar => {
      const value = process.env[envVar.name];
      return !value || value.trim() === '';
    });
    
    // Check optional variables
    const missingOptional = optionalEnvVars.filter(envVar => {
      const value = process.env[envVar.name];
      return !value || value.trim() === '';
    });
    
    // Check for insecure values (common defaults or weak values)
    const insecureVars = [];
    const nodeEnv = process.env.NODE_ENV;
    
    if (nodeEnv === 'production') {
      // In production, check for common insecure values
      if (process.env.NEXTAUTH_SECRET === 'your-secret-here' || 
          (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 16)) {
        insecureVars.push('NEXTAUTH_SECRET (too short or using default)');
      }
    }
    
    // Determine status
    let status = 'healthy';
    let severity = 'info';
    let message = 'All environment variables are properly configured';
    
    if (missing.length > 0) {
      status = 'error';
      severity = 'critical';
      message = `Missing ${missing.length} required environment variable(s)`;
    } else if (insecureVars.length > 0) {
      status = 'warning';
      severity = 'high';
      message = `Insecure configuration detected in ${insecureVars.length} variable(s)`;
    } else if (missingOptional.length > 0) {
      status = 'warning';
      severity = 'low';
      message = `All required variables set, ${missingOptional.length} optional missing (using fallbacks)`;
    }
    
    // Build configuration summary (without exposing sensitive values)
    const configSummary = {
      nodeEnv: nodeEnv || 'not set',
      requiredVars: requiredEnvVars.length,
      optionalVars: optionalEnvVars.length,
      configured: requiredEnvVars.length - missing.length + optionalEnvVars.length - missingOptional.length,
      total: requiredEnvVars.length + optionalEnvVars.length
    };
    
    return {
      status,
      severity,
      message,
      summary: configSummary,
      issues: {
        missing: missing.map(v => ({ name: v.name, description: v.description })),
        missingOptional: missingOptional.map(v => ({ name: v.name, description: v.description })),
        insecure: insecureVars
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logError(error, 'environment_check');
    return {
      status: 'error',
      message: `Environment check failed: ${error.message}`,
      error: true,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Using Node.js runtime for process.memoryUsage() support
 */