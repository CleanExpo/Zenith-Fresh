/**
 * System Monitoring API for Zenith-Fresh
 * Provides real-time system health and performance metrics
 */

// Force Node.js runtime for serverless compatibility
export const runtime = 'nodejs';
export const maxDuration = 10;

import { NextResponse } from 'next/server';
const { metricsOperations } = require('../../../../lib/database.js');

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
  console.error('[SYSTEM_MONITOR_API_ERROR]', JSON.stringify(errorLog));
};

// Input validation utilities
const validateEndpoint = (endpoint) => {
  const validEndpoints = ['overview', 'metrics', 'history', 'health', 'alerts'];
  
  if (!endpoint) {
    return { isValid: true, value: 'overview' }; // Default
  }
  
  if (typeof endpoint !== 'string') {
    return {
      isValid: false,
      error: 'Endpoint parameter must be a string'
    };
  }
  
  if (!validEndpoints.includes(endpoint)) {
    return {
      isValid: false,
      error: `Invalid endpoint. Allowed values: ${validEndpoints.join(', ')}`
    };
  }
  
  return { isValid: true, value: endpoint };
};

const validateHours = (hoursParam) => {
  if (!hoursParam) {
    return { isValid: true, value: 1 }; // Default
  }
  
  const hours = parseInt(hoursParam, 10);
  
  if (isNaN(hours)) {
    return {
      isValid: false,
      error: 'Hours parameter must be a valid number'
    };
  }
  
  if (hours < 1 || hours > 168) { // Max 1 week
    return {
      isValid: false,
      error: 'Hours parameter must be between 1 and 168 (1 week)'
    };
  }
  
  return { isValid: true, value: hours };
};

const validateMetricsUpdate = (body) => {
  const errors = [];
  
  if (!body || typeof body !== 'object') {
    errors.push('Request body must be an object');
    return errors;
  }
  
  if (body.requests && typeof body.requests !== 'object') {
    errors.push('Requests data must be an object');
  } else if (body.requests) {
    const { total, successful, failed, rate } = body.requests;
    
    if (total !== undefined && (!Number.isInteger(total) || total < 0)) {
      errors.push('Total requests must be a non-negative integer');
    }
    
    if (successful !== undefined && (!Number.isInteger(successful) || successful < 0)) {
      errors.push('Successful requests must be a non-negative integer');
    }
    
    if (failed !== undefined && (!Number.isInteger(failed) || failed < 0)) {
      errors.push('Failed requests must be a non-negative integer');
    }
    
    if (rate !== undefined && (typeof rate !== 'number' || rate < 0)) {
      errors.push('Request rate must be a non-negative number');
    }
  }
  
  if (body.performance && typeof body.performance !== 'object') {
    errors.push('Performance data must be an object');
  } else if (body.performance) {
    const { averageResponseTime, slowQueries, errorRate } = body.performance;
    
    if (averageResponseTime !== undefined && (typeof averageResponseTime !== 'number' || averageResponseTime < 0)) {
      errors.push('Average response time must be a non-negative number');
    }
    
    if (slowQueries !== undefined && (!Number.isInteger(slowQueries) || slowQueries < 0)) {
      errors.push('Slow queries must be a non-negative integer');
    }
    
    if (errorRate !== undefined && (typeof errorRate !== 'number' || errorRate < 0 || errorRate > 100)) {
      errors.push('Error rate must be a number between 0 and 100');
    }
  }
  
  return errors;
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

// TODO: SERVERLESS ISSUE - Replace with Redis/Database storage
// This in-memory storage will be lost between serverless executions
// Recommended: Use Redis for real-time metrics, database for persistence
// System metrics storage (use external DB in production)
let systemMetrics = {
  timestamp: Date.now(),
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    rate: 0
  },
  performance: {
    averageResponseTime: 0,
    slowQueries: 0,
    errorRate: 0
  },
  resources: {
    memoryUsage: 0,
    cpuLoad: 0,
    activeConnections: 0
  },
  traffic: {
    currentLoad: 0,
    peakLoad: 0,
    throttledRequests: 0
  }
};

// TODO: SERVERLESS ISSUE - Replace with time-series database
// This array will be empty on each serverless execution
// Recommended: Use InfluxDB, TimescaleDB, or Redis with time-based keys
// Historical data (last 24 hours)
const metricsHistory = [];
const MAX_HISTORY_ENTRIES = 1440; // 24 hours * 60 minutes

/**
 * Simulate system resource monitoring
 */
function getSystemResources() {
  // In production, integrate with actual monitoring tools
  const now = Date.now();
  const hour = new Date(now).getHours();
  
  // Simulate daily traffic patterns
  const baseCpu = 0.2 + (Math.sin((hour / 24) * 2 * Math.PI) + 1) * 0.3;
  const baseMemory = 0.3 + (Math.sin(((hour + 6) / 24) * 2 * Math.PI) + 1) * 0.2;
  
  return {
    cpuLoad: Math.min(1, baseCpu + (Math.random() * 0.2)),
    memoryUsage: Math.min(1, baseMemory + (Math.random() * 0.15)),
    activeConnections: Math.floor(50 + (Math.sin((hour / 24) * 2 * Math.PI) + 1) * 200),
    diskUsage: 0.4 + (Math.random() * 0.1),
    networkIO: Math.random() * 100 // MB/s
  };
}

/**
 * Calculate performance metrics
 */
function calculatePerformanceMetrics() {
  const total = systemMetrics.requests.total;
  const failed = systemMetrics.requests.failed;
  
  return {
    errorRate: total > 0 ? (failed / total) * 100 : 0,
    successRate: total > 0 ? ((total - failed) / total) * 100 : 100,
    availability: systemMetrics.performance.errorRate < 1 ? 99.9 : 95.0
  };
}

/**
 * Update system metrics
 */
async function updateMetrics() {
  try {
    const resources = getSystemResources();
    const performance = calculatePerformanceMetrics();
    const now = Date.now();
    
    // Update current metrics
    systemMetrics = {
      timestamp: now,
      requests: {
        ...systemMetrics.requests,
        rate: calculateRequestRate()
      },
      performance: {
        ...systemMetrics.performance,
        errorRate: performance.errorRate,
        availability: performance.availability
      },
      resources: {
        memoryUsage: resources.memoryUsage,
        cpuLoad: resources.cpuLoad,
        activeConnections: resources.activeConnections,
        diskUsage: resources.diskUsage,
        networkIO: resources.networkIO
      },
      traffic: {
        ...systemMetrics.traffic,
        currentLoad: (resources.cpuLoad + resources.memoryUsage) / 2
      }
    };
    
    // Store metrics in database with fallback to in-memory
    try {
      await withTimeout(
        metricsOperations.storeMetrics(systemMetrics),
        3000,
        'Database metrics storage'
      );
    } catch (error) {
      logError(error, 'database_metrics_storage');
      console.log('Failed to store metrics in database, using in-memory fallback:', error.message);
      
      try {
        // Add to in-memory history as fallback
        metricsHistory.push({
          timestamp: now,
          cpuLoad: resources.cpuLoad,
          memoryUsage: resources.memoryUsage,
          requestRate: systemMetrics.requests.rate,
          errorRate: performance.errorRate
        });
        
        // Maintain history size
        if (metricsHistory.length > MAX_HISTORY_ENTRIES) {
          metricsHistory.shift();
        }
      } catch (memoryError) {
        logError(memoryError, 'in_memory_metrics_storage');
        // Continue without storing history if both fail
      }
    }
  } catch (error) {
    logError(error, 'update_metrics');
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Calculate request rate (requests per minute)
 */
// TODO: SERVERLESS ISSUE - Request rate calculation depends on persistent history
// This will always return 0 in serverless due to empty metricsHistory
// Recommended: Calculate rate from database/Redis time-series data
function calculateRequestRate() {
  const recentHistory = metricsHistory.slice(-10); // Last 10 minutes
  if (recentHistory.length < 2) return 0;
  
  const timeDiff = (Date.now() - recentHistory[0].timestamp) / 1000 / 60; // minutes
  const requestDiff = systemMetrics.requests.total - (recentHistory[0].total || 0);
  
  return timeDiff > 0 ? Math.round(requestDiff / timeDiff) : 0;
}

/**
 * Generate system health status
 */
function getHealthStatus() {
  const { cpuLoad, memoryUsage } = systemMetrics.resources;
  const { errorRate } = systemMetrics.performance;
  const { currentLoad } = systemMetrics.traffic;
  
  // Health scoring
  let healthScore = 100;
  
  if (cpuLoad > 0.8) healthScore -= 30;
  else if (cpuLoad > 0.6) healthScore -= 15;
  
  if (memoryUsage > 0.8) healthScore -= 25;
  else if (memoryUsage > 0.6) healthScore -= 10;
  
  if (errorRate > 5) healthScore -= 20;
  else if (errorRate > 1) healthScore -= 10;
  
  if (currentLoad > 0.8) healthScore -= 15;
  
  // Determine status
  let status = 'healthy';
  if (healthScore < 50) status = 'critical';
  else if (healthScore < 70) status = 'warning';
  else if (healthScore < 90) status = 'degraded';
  
  return {
    status,
    score: Math.max(0, healthScore),
    alerts: generateAlerts()
  };
}

/**
 * Generate system alerts
 */
function generateAlerts() {
  const alerts = [];
  const { cpuLoad, memoryUsage, activeConnections } = systemMetrics.resources;
  const { errorRate } = systemMetrics.performance;
  
  if (cpuLoad > 0.8) {
    alerts.push({
      level: 'critical',
      message: `High CPU load: ${Math.round(cpuLoad * 100)}%`,
      timestamp: Date.now()
    });
  }
  
  if (memoryUsage > 0.8) {
    alerts.push({
      level: 'critical',
      message: `High memory usage: ${Math.round(memoryUsage * 100)}%`,
      timestamp: Date.now()
    });
  }
  
  if (errorRate > 5) {
    alerts.push({
      level: 'warning',
      message: `High error rate: ${errorRate.toFixed(2)}%`,
      timestamp: Date.now()
    });
  }
  
  if (activeConnections > 1000) {
    alerts.push({
      level: 'info',
      message: `High traffic: ${activeConnections} active connections`,
      timestamp: Date.now()
    });
  }
  
  return alerts;
}

/**
 * Get dashboard metrics
 */
function getDashboardMetrics() {
  const health = getHealthStatus();
  
  return {
    overview: {
      status: health.status,
      healthScore: health.score,
      uptime: '99.9%', // Calculate from actual uptime
      lastUpdate: new Date(systemMetrics.timestamp).toISOString()
    },
    traffic: {
      requestsPerMinute: systemMetrics.requests.rate,
      totalRequests: systemMetrics.requests.total,
      errorRate: systemMetrics.performance.errorRate,
      activeUsers: systemMetrics.resources.activeConnections
    },
    performance: {
      averageResponseTime: systemMetrics.performance.averageResponseTime,
      cpuUsage: Math.round(systemMetrics.resources.cpuLoad * 100),
      memoryUsage: Math.round(systemMetrics.resources.memoryUsage * 100),
      diskUsage: Math.round(systemMetrics.resources.diskUsage * 100)
    },
    alerts: health.alerts
  };
}

/**
 * GET handler for system monitoring
 */
export async function GET(request) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Parse and validate URL
    let url;
    try {
      url = new URL(request.url);
    } catch (urlError) {
      logError(urlError, 'url_parsing', { requestId });
      return NextResponse.json({
        error: 'Invalid request URL',
        code: 'INVALID_URL',
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    // Validate endpoint parameter
    const endpointParam = url.searchParams.get('endpoint');
    const endpointValidation = validateEndpoint(endpointParam);
    
    if (!endpointValidation.isValid) {
      return NextResponse.json({
        error: endpointValidation.error,
        code: 'INVALID_ENDPOINT',
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    const endpoint = endpointValidation.value;
    
    // Update metrics before responding with timeout protection
    try {
      await withTimeout(
        updateMetrics(),
        4000,
        'Metrics update'
      );
    } catch (updateError) {
      logError(updateError, 'metrics_update', { endpoint, requestId });
      // Continue with stale metrics rather than failing completely
      console.warn('Using potentially stale metrics due to update failure');
    }
    
    switch (endpoint) {
      case 'overview':
        try {
          const dashboardMetrics = getDashboardMetrics();
          return NextResponse.json({
            ...dashboardMetrics,
            requestId,
            processingTime: `${Date.now() - startTime}ms`
          });
        } catch (overviewError) {
          logError(overviewError, 'dashboard_metrics', { requestId });
          return NextResponse.json({
            error: 'Failed to generate dashboard metrics',
            code: 'DASHBOARD_ERROR',
            requestId,
            timestamp: new Date().toISOString()
          }, { status: 500 });
        }
        
      case 'metrics':
        try {
          return NextResponse.json({
            ...systemMetrics,
            requestId,
            processingTime: `${Date.now() - startTime}ms`
          });
        } catch (metricsError) {
          logError(metricsError, 'system_metrics', { requestId });
          return NextResponse.json({
            error: 'Failed to retrieve system metrics',
            code: 'METRICS_ERROR',
            requestId,
            timestamp: new Date().toISOString()
          }, { status: 500 });
        }
        
      case 'history':
        // Validate hours parameter
        const hoursParam = url.searchParams.get('hours');
        const hoursValidation = validateHours(hoursParam);
        
        if (!hoursValidation.isValid) {
          return NextResponse.json({
            error: hoursValidation.error,
            code: 'INVALID_HOURS',
            requestId,
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        const hours = hoursValidation.value;
        
        // Try to get history from database first, fallback to in-memory
        try {
          const dbHistory = await withTimeout(
            metricsOperations.getMetricsHistory(hours),
            5000,
            'Database history retrieval'
          );
          return NextResponse.json({
            ...dbHistory,
            requestId,
            processingTime: `${Date.now() - startTime}ms`
          });
        } catch (dbError) {
          logError(dbError, 'database_history_retrieval', { hours, requestId });
          console.log('Database history retrieval failed, using in-memory fallback:', dbError.message);
          
          try {
            const historyData = metricsHistory.slice(-hours * 60);
            return NextResponse.json({
              timeRange: `${hours} hour(s)`,
              dataPoints: historyData.length,
              data: historyData,
              source: 'memory_fallback',
              requestId,
              processingTime: `${Date.now() - startTime}ms`,
              timestamp: new Date().toISOString()
            });
          } catch (memoryError) {
            logError(memoryError, 'memory_history_retrieval', { hours, requestId });
            return NextResponse.json({
              error: 'Failed to retrieve metrics history from both database and memory',
              code: 'HISTORY_ERROR',
              requestId,
              timestamp: new Date().toISOString()
            }, { status: 500 });
          }
        }
        
      case 'health':
        try {
          const health = getHealthStatus();
          return NextResponse.json({
            ...health,
            requestId,
            processingTime: `${Date.now() - startTime}ms`
          });
        } catch (healthError) {
          logError(healthError, 'health_status', { requestId });
          return NextResponse.json({
            error: 'Failed to get health status',
            code: 'HEALTH_ERROR',
            requestId,
            timestamp: new Date().toISOString()
          }, { status: 500 });
        }
        
      case 'alerts':
        try {
          const alerts = generateAlerts();
          return NextResponse.json({
            alerts,
            timestamp: Date.now(),
            requestId,
            processingTime: `${Date.now() - startTime}ms`
          });
        } catch (alertsError) {
          logError(alertsError, 'generate_alerts', { requestId });
          return NextResponse.json({
            error: 'Failed to generate alerts',
            code: 'ALERTS_ERROR',
            requestId,
            timestamp: new Date().toISOString()
          }, { status: 500 });
        }
        
      default:
        return NextResponse.json({
          error: `Invalid endpoint: ${endpoint}`,
          code: 'INVALID_ENDPOINT',
          requestId,
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError(error, 'system_monitor_get', { processingTime, requestId });
    
    // Check for specific error types
    if (error.message && error.message.includes('timed out')) {
      return NextResponse.json({
        error: 'Request timed out',
        code: 'REQUEST_TIMEOUT',
        processingTime: `${processingTime}ms`,
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 408 });
    }
    
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: error.message,
      processingTime: `${processingTime}ms`,
      requestId,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST handler for updating metrics
 */
export async function POST(request) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Parse request body with timeout
    let body;
    try {
      const text = await withTimeout(
        request.text(),
        10000,
        'Request body parsing'
      );
      
      if (!text || text.trim() === '') {
        return NextResponse.json({
          success: false,
          error: 'Request body is empty',
          code: 'EMPTY_BODY',
          requestId
        }, { status: 400 });
      }
      
      body = JSON.parse(text);
      
    } catch (parseError) {
      logError(parseError, 'json_parsing', { requestId });
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON format',
        code: 'JSON_PARSE_ERROR',
        requestId
      }, { status: 400 });
    }
    
    // Validate metrics update data
    const validationErrors = validateMetricsUpdate(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
        code: 'VALIDATION_ERROR',
        requestId
      }, { status: 400 });
    }
    
    // Update metrics with error handling
    try {
      if (body.requests) {
        systemMetrics.requests = { ...systemMetrics.requests, ...body.requests };
        console.log(`[SYSTEM_MONITOR] Updated requests metrics: ${JSON.stringify(body.requests)}`);
      }
      
      if (body.performance) {
        systemMetrics.performance = { ...systemMetrics.performance, ...body.performance };
        console.log(`[SYSTEM_MONITOR] Updated performance metrics: ${JSON.stringify(body.performance)}`);
      }
      
      // Update timestamp
      systemMetrics.timestamp = Date.now();
      
      const processingTime = Date.now() - startTime;
      
      return NextResponse.json({
        success: true,
        message: 'Metrics updated successfully',
        updated: {
          requests: !!body.requests,
          performance: !!body.performance
        },
        processingTime: `${processingTime}ms`,
        requestId
      });
      
    } catch (updateError) {
      logError(updateError, 'metrics_update', { body, requestId });
      return NextResponse.json({
        success: false,
        error: 'Failed to update metrics',
        code: 'UPDATE_ERROR',
        requestId
      }, { status: 500 });
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError(error, 'system_monitor_post', { processingTime, requestId });
    
    // Check for specific error types
    if (error.message && error.message.includes('timed out')) {
      return NextResponse.json({
        success: false,
        error: 'Request timed out',
        code: 'REQUEST_TIMEOUT',
        processingTime: `${processingTime}ms`,
        requestId
      }, { status: 408 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: error.message,
      processingTime: `${processingTime}ms`,
      requestId
    }, { status: 500 });
  }
}

/**
 * Using Node.js runtime for persistent in-memory storage with Maps and arrays
 */