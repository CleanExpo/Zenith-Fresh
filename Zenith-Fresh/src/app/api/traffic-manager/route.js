/**
 * Traffic Management API for Zenith-Fresh
 * Prevents system overload and implements progressive traffic handling
 * Note: Uses Node.js runtime for persistent in-memory storage
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
  console.error('[TRAFFIC_MANAGER_API_ERROR]', JSON.stringify(errorLog));
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

const validateTrafficSimulation = (body) => {
  const errors = [];
  
  if (!body || typeof body !== 'object') {
    errors.push('Request body must be an object');
    return errors;
  }
  
  if (body.simulateLoad !== undefined && typeof body.simulateLoad !== 'boolean') {
    errors.push('simulateLoad must be a boolean');
  }
  
  if (body.connections !== undefined) {
    if (!Number.isInteger(body.connections) || body.connections < 0 || body.connections > 10000) {
      errors.push('connections must be an integer between 0 and 10000');
    }
  }
  
  if (body.load !== undefined) {
    if (typeof body.load !== 'number' || body.load < 0 || body.load > 1) {
      errors.push('load must be a number between 0 and 1');
    }
  }
  
  return errors;
};

const validateClientId = (clientId) => {
  if (!clientId || typeof clientId !== 'string') {
    return false;
  }
  
  // Basic validation - client ID should be reasonable length
  if (clientId.length > 200) {
    return false;
  }
  
  return true;
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

// Configuration constants
const SYSTEM_LOAD_THRESHOLD = 0.8; // 80% load threshold
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 100;
const RETRY_AFTER_SECONDS = 30;

// TODO: SERVERLESS ISSUE - Replace with Redis for rate limiting
// requestCounts Map will be empty on each serverless execution
// systemMetrics object will reset, breaking load tracking
// Recommended: Use Redis with TTL for rate limits, atomic operations for metrics
// In-memory store for edge (use external DB in production)
const requestCounts = new Map();
const systemMetrics = {
  currentLoad: 0,
  lastUpdated: Date.now(),
  activeConnections: 0
};

/**
 * Check current system load
 */
async function checkSystemLoad() {
  try {
    // Simulate load checking - in production, integrate with monitoring service
    const now = Date.now();
    
    // Validate that systemMetrics is in a good state
    if (!systemMetrics || typeof systemMetrics.activeConnections !== 'number') {
      throw new Error('System metrics are in an invalid state');
    }
    
    // Update load based on active connections and time patterns
    const timeFactor = Math.sin((now / 1000) / 3600) * 0.3; // Simulate daily patterns
    const connectionFactor = Math.min(systemMetrics.activeConnections / 1000, 0.7);
    
    systemMetrics.currentLoad = Math.max(0, Math.min(1, connectionFactor + timeFactor + Math.random() * 0.1));
    systemMetrics.lastUpdated = now;
    
    return {
      cpuLoad: systemMetrics.currentLoad,
      memoryUsage: systemMetrics.currentLoad * 0.8,
      activeConnections: systemMetrics.activeConnections,
      isOverloaded: systemMetrics.currentLoad > SYSTEM_LOAD_THRESHOLD,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logError(error, 'system_load_check');
    
    // Return safe defaults if system load check fails
    return {
      cpuLoad: 0.5,
      memoryUsage: 0.4,
      activeConnections: 0,
      isOverloaded: false,
      error: true,
      message: 'System load check failed, using defaults',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Rate limiting implementation
 */
function checkRateLimit(clientId) {
  try {
    // Validate client ID
    if (!validateClientId(clientId)) {
      throw new Error('Invalid client ID for rate limiting');
    }
    
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    if (!requestCounts.has(clientId)) {
      requestCounts.set(clientId, []);
    }
    
    const requests = requestCounts.get(clientId);
    
    // Validate that requests is an array
    if (!Array.isArray(requests)) {
      logError(new Error('Request counts corrupted'), 'rate_limit_check', { clientId });
      requestCounts.set(clientId, []);
      return true; // Allow request if data is corrupted
    }
    
    // Remove expired requests
    const validRequests = requests.filter(timestamp => 
      typeof timestamp === 'number' && timestamp > windowStart
    );
    requestCounts.set(clientId, validRequests);
    
    // TODO: SERVERLESS ISSUE - Memory cleanup logic won't work in serverless
    // The Map will be empty on each execution, making this cleanup unnecessary
    // Recommended: Use Redis TTL for automatic cleanup
    // Clean up old entries periodically to prevent memory leaks
    if (requestCounts.size > 10000) {
      // Remove entries that haven't been accessed recently
      const cutoffTime = now - (RATE_LIMIT_WINDOW * 10);
      for (const [id, timestamps] of requestCounts.entries()) {
        if (timestamps.length === 0 || Math.max(...timestamps) < cutoffTime) {
          requestCounts.delete(id);
        }
      }
    }
    
    // Check if limit exceeded
    if (validRequests.length >= MAX_REQUESTS_PER_MINUTE) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    return true;
  } catch (error) {
    logError(error, 'rate_limit_check', { clientId });
    // On error, allow the request to prevent blocking legitimate traffic
    return true;
  }
}

/**
 * Generate appropriate response for overloaded system
 */
function createOverloadResponse(reason = 'system_overload', requestId = null) {
  try {
    const responses = {
      system_overload: {
        message: 'System is currently experiencing high load. Please try again shortly.',
        code: 'SYS_OVERLOAD',
        retryAfter: RETRY_AFTER_SECONDS,
        severity: 'medium'
      },
      rate_limit: {
        message: 'Rate limit exceeded. Please slow down your requests.',
        code: 'RATE_LIMIT',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000),
        severity: 'low'
      },
      maintenance: {
        message: 'System is under maintenance. Please try again later.',
        code: 'MAINTENANCE',
        retryAfter: 300,
        severity: 'high'
      }
    };
    
    const response = responses[reason] || responses.system_overload;
    
    // Calculate rate limit reset time
    const rateLimitReset = Date.now() + RATE_LIMIT_WINDOW;
    
    return NextResponse.json({
      error: true,
      ...response,
      requestId: requestId || 'unknown',
      timestamp: new Date().toISOString(),
      advice: reason === 'rate_limit' 
        ? 'Consider implementing exponential backoff in your client'
        : 'Monitor system status and retry when load decreases'
    }, {
      status: 503,
      headers: {
        'Retry-After': response.retryAfter.toString(),
        'X-RateLimit-Limit': MAX_REQUESTS_PER_MINUTE.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitReset.toString(),
        'X-Request-ID': requestId || 'unknown',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    logError(error, 'create_overload_response', { reason, requestId });
    
    // Fallback response if even the error response fails
    return NextResponse.json({
      error: true,
      message: 'Service temporarily unavailable',
      code: 'SERVICE_ERROR',
      requestId: requestId || 'unknown',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

/**
 * Log request metrics for monitoring
 */
async function logRequestMetrics(request, clientId, loadData, allowed = true, requestId = null) {
  try {
    // Validate inputs
    if (!request || !clientId || !loadData) {
      throw new Error('Missing required parameters for request logging');
    }
    
    const requestData = {
      timestamp: new Date().toISOString(),
      clientId: clientId.substring(0, 100), // Limit length for storage
      userAgent: request.headers.get('user-agent')?.substring(0, 200) || 'unknown',
      url: request.url?.substring(0, 500) || 'unknown',
      method: request.method || 'unknown',
      systemLoad: typeof loadData.cpuLoad === 'number' ? loadData.cpuLoad : -1,
      activeConnections: typeof loadData.activeConnections === 'number' ? loadData.activeConnections : -1,
      requestAllowed: Boolean(allowed),
      responseType: allowed ? 'success' : 'throttled',
      requestId: requestId || 'unknown'
    };

    // Try to log to database first, fallback to console
    try {
      await withTimeout(
        metricsOperations.logRequest(requestData),
        2000,
        'Database request logging'
      );
    } catch (dbError) {
      logError(dbError, 'database_request_logging', { clientId, requestId });
      console.log('Database request logging failed, using console fallback:', dbError.message);
      console.log('Request logged (console fallback):', JSON.stringify(requestData));
    }
  } catch (error) {
    logError(error, 'request_metrics_logging', { clientId, requestId });
    // Don't throw error to avoid affecting request processing
  }
}

/**
 * GET handler for traffic management status
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
        error: true,
        message: 'Invalid request URL',
        code: 'INVALID_URL',
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    // Get and validate client identifier
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const clientId = `${clientIp}-${userAgent.slice(0, 50)}`;
    
    if (!validateClientId(clientId)) {
      logError(new Error('Invalid client ID generated'), 'client_id_validation', { clientIp, requestId });
      return NextResponse.json({
        error: true,
        message: 'Unable to identify client',
        code: 'INVALID_CLIENT',
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    // Safely increment active connections
    try {
      systemMetrics.activeConnections = Math.max(0, (systemMetrics.activeConnections || 0) + 1);
    } catch (metricsError) {
      logError(metricsError, 'metrics_increment', { clientId, requestId });
      systemMetrics.activeConnections = 1; // Reset to safe value
    }
    
    // Check system load with timeout
    let loadData;
    try {
      loadData = await withTimeout(
        checkSystemLoad(),
        3000,
        'System load check'
      );
    } catch (loadError) {
      logError(loadError, 'system_load_check', { clientId, requestId });
      // Use safe defaults if load check fails
      loadData = {
        cpuLoad: 0.5,
        memoryUsage: 0.4,
        activeConnections: systemMetrics.activeConnections || 0,
        isOverloaded: false,
        error: true,
        message: 'Load check failed'
      };
    }
    
    // Validate status parameter
    const statusParam = url.searchParams.get('status');
    const statusValidation = validateBooleanParam(statusParam, 'status');
    
    if (!statusValidation.isValid) {
      await logRequestMetrics(request, clientId, loadData, false, requestId);
      return NextResponse.json({
        error: true,
        message: statusValidation.error,
        code: 'INVALID_PARAMETER',
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    const isStatusCheck = statusValidation.value;
    
    if (isStatusCheck) {
      await logRequestMetrics(request, clientId, loadData, true, requestId);
      const processingTime = Date.now() - startTime;
      
      return NextResponse.json({
        status: loadData.error ? 'degraded' : 'operational',
        systemLoad: loadData,
        rateLimit: {
          limit: MAX_REQUESTS_PER_MINUTE,
          window: RATE_LIMIT_WINDOW,
          threshold: SYSTEM_LOAD_THRESHOLD
        },
        processingTime: `${processingTime}ms`,
        requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check rate limiting
    let rateLimitPassed = false;
    try {
      rateLimitPassed = checkRateLimit(clientId);
    } catch (rateLimitError) {
      logError(rateLimitError, 'rate_limit_check', { clientId, requestId });
      // On error, allow request to avoid blocking legitimate traffic
      rateLimitPassed = true;
    }
    
    if (!rateLimitPassed) {
      await logRequestMetrics(request, clientId, loadData, false, requestId);
      return createOverloadResponse('rate_limit', requestId);
    }
    
    // Check system overload
    if (loadData.isOverloaded && !loadData.error) {
      // Allow a small percentage of requests even during overload
      const allowanceThreshold = Math.random();
      if (allowanceThreshold > 0.1) { // 10% allowance
        await logRequestMetrics(request, clientId, loadData, false, requestId);
        return createOverloadResponse('system_overload', requestId);
      }
    }
    
    // Process request normally
    await logRequestMetrics(request, clientId, loadData, true, requestId);
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      message: 'Request processed successfully',
      metrics: {
        processingTime: `${processingTime}ms`,
        systemLoad: typeof loadData.cpuLoad === 'number' ? loadData.cpuLoad.toFixed(2) : 'unknown',
        requestId: requestId
      },
      requestId
    }, {
      headers: {
        'X-Processing-Time': processingTime.toString(),
        'X-System-Load': typeof loadData.cpuLoad === 'number' ? loadData.cpuLoad.toFixed(2) : 'unknown',
        'X-Request-ID': requestId,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError(error, 'traffic_manager_get', { processingTime, requestId });
    
    // Check for specific error types
    if (error.message && error.message.includes('timed out')) {
      return NextResponse.json({
        error: true,
        message: 'Traffic management request timed out',
        code: 'REQUEST_TIMEOUT',
        processingTime: `${processingTime}ms`,
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 408 });
    }
    
    // Return graceful fallback
    return NextResponse.json({
      error: true,
      message: 'Traffic management error occurred',
      code: 'TRAFFIC_ERROR',
      processingTime: `${processingTime}ms`,
      requestId,
      timestamp: new Date().toISOString()
    }, { status: 500 });
    
  } finally {
    // Safely decrement active connections
    try {
      systemMetrics.activeConnections = Math.max(0, (systemMetrics.activeConnections || 1) - 1);
    } catch (finallyError) {
      logError(finallyError, 'traffic_manager_finally', { requestId });
      systemMetrics.activeConnections = 0; // Reset to safe value
    }
  }
}

/**
 * POST handler for simulating traffic
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
    
    // Validate traffic simulation data
    const validationErrors = validateTrafficSimulation(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
        code: 'VALIDATION_ERROR',
        requestId
      }, { status: 400 });
    }
    
    // Apply traffic simulation with safety checks
    try {
      if (body.simulateLoad) {
        const connectionsToAdd = Math.max(0, Math.min(10000, body.connections || 100));
        const loadToAdd = Math.max(0, Math.min(1, body.load || 0.1));
        
        // Safely update metrics
        systemMetrics.activeConnections = Math.max(0, 
          Math.min(50000, (systemMetrics.activeConnections || 0) + connectionsToAdd)
        );
        
        systemMetrics.currentLoad = Math.max(0, 
          Math.min(1, (systemMetrics.currentLoad || 0) + loadToAdd)
        );
        
        systemMetrics.lastUpdated = Date.now();
        
        console.log(`[TRAFFIC_MANAGER] Simulation applied: +${connectionsToAdd} connections, +${loadToAdd} load`);
      }
      
      const processingTime = Date.now() - startTime;
      
      return NextResponse.json({
        success: true,
        message: 'Traffic simulation updated successfully',
        applied: {
          simulateLoad: Boolean(body.simulateLoad),
          connectionsAdded: body.simulateLoad ? (body.connections || 100) : 0,
          loadAdded: body.simulateLoad ? (body.load || 0.1) : 0
        },
        currentMetrics: {
          activeConnections: systemMetrics.activeConnections,
          currentLoad: systemMetrics.currentLoad,
          lastUpdated: systemMetrics.lastUpdated
        },
        processingTime: `${processingTime}ms`,
        requestId
      });
      
    } catch (updateError) {
      logError(updateError, 'traffic_simulation_update', { body, requestId });
      return NextResponse.json({
        success: false,
        error: 'Failed to apply traffic simulation',
        code: 'SIMULATION_ERROR',
        requestId
      }, { status: 500 });
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError(error, 'traffic_manager_post', { processingTime, requestId });
    
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
      error: 'Failed to update traffic simulation',
      code: 'INTERNAL_ERROR',
      message: error.message,
      processingTime: `${processingTime}ms`,
      requestId
    }, { status: 500 });
  }
}

/**
 * Using Node.js runtime for persistent in-memory storage with Maps
 */