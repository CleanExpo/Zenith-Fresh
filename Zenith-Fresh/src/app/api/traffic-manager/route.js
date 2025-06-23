/**
 * Traffic Management API for Zenith-Fresh
 * Prevents system overload and implements progressive traffic handling
 * Note: Uses Node.js runtime for persistent in-memory storage
 */

import { NextResponse } from 'next/server';

// Configuration constants
const SYSTEM_LOAD_THRESHOLD = 0.8; // 80% load threshold
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 100;
const RETRY_AFTER_SECONDS = 30;

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
  // Simulate load checking - in production, integrate with monitoring service
  const now = Date.now();
  
  // Update load based on active connections and time patterns
  const timeFactor = Math.sin((now / 1000) / 3600) * 0.3; // Simulate daily patterns
  const connectionFactor = Math.min(systemMetrics.activeConnections / 1000, 0.7);
  
  systemMetrics.currentLoad = Math.max(0, Math.min(1, connectionFactor + timeFactor + Math.random() * 0.1));
  systemMetrics.lastUpdated = now;
  
  return {
    cpuLoad: systemMetrics.currentLoad,
    memoryUsage: systemMetrics.currentLoad * 0.8,
    activeConnections: systemMetrics.activeConnections,
    isOverloaded: systemMetrics.currentLoad > SYSTEM_LOAD_THRESHOLD
  };
}

/**
 * Rate limiting implementation
 */
function checkRateLimit(clientId) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!requestCounts.has(clientId)) {
    requestCounts.set(clientId, []);
  }
  
  const requests = requestCounts.get(clientId);
  
  // Remove expired requests
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  requestCounts.set(clientId, validRequests);
  
  // Check if limit exceeded
  if (validRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  // Add current request
  validRequests.push(now);
  return true;
}

/**
 * Generate appropriate response for overloaded system
 */
function createOverloadResponse(reason = 'system_overload') {
  const responses = {
    system_overload: {
      message: 'System is currently experiencing high load. Please try again shortly.',
      code: 'SYS_OVERLOAD',
      retryAfter: RETRY_AFTER_SECONDS
    },
    rate_limit: {
      message: 'Rate limit exceeded. Please slow down your requests.',
      code: 'RATE_LIMIT',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    },
    maintenance: {
      message: 'System is under maintenance. Please try again later.',
      code: 'MAINTENANCE',
      retryAfter: 300
    }
  };
  
  const response = responses[reason] || responses.system_overload;
  
  return NextResponse.json({
    error: true,
    ...response,
    timestamp: new Date().toISOString()
  }, {
    status: 503,
    headers: {
      'Retry-After': response.retryAfter.toString(),
      'X-RateLimit-Limit': MAX_REQUESTS_PER_MINUTE.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': (Date.now() + RATE_LIMIT_WINDOW).toString()
    }
  });
}

/**
 * Log request metrics for monitoring
 */
function logRequestMetrics(request, clientId, loadData, allowed = true) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    clientId,
    userAgent: request.headers.get('user-agent'),
    url: request.url,
    method: request.method,
    systemLoad: loadData.cpuLoad,
    activeConnections: loadData.activeConnections,
    requestAllowed: allowed,
    responseType: allowed ? 'success' : 'throttled'
  }));
}

/**
 * GET handler for traffic management status
 */
export async function GET(request) {
  const startTime = Date.now();
  
  try {
    // Get client identifier
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const clientId = `${clientIp}-${userAgent.slice(0, 50)}`;
    
    // Increment active connections
    systemMetrics.activeConnections++;
    
    // Check system load
    const loadData = await checkSystemLoad();
    
    // Check if this is a status check
    const url = new URL(request.url);
    const isStatusCheck = url.searchParams.get('status') === 'true';
    
    if (isStatusCheck) {
      return NextResponse.json({
        status: 'operational',
        systemLoad: loadData,
        rateLimit: {
          limit: MAX_REQUESTS_PER_MINUTE,
          window: RATE_LIMIT_WINDOW,
          threshold: SYSTEM_LOAD_THRESHOLD
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Check rate limiting
    if (!checkRateLimit(clientId)) {
      logRequestMetrics(request, clientId, loadData, false);
      return createOverloadResponse('rate_limit');
    }
    
    // Check system overload
    if (loadData.isOverloaded) {
      // Allow a small percentage of requests even during overload
      const allowanceThreshold = Math.random();
      if (allowanceThreshold > 0.1) { // 10% allowance
        logRequestMetrics(request, clientId, loadData, false);
        return createOverloadResponse('system_overload');
      }
    }
    
    // Process request normally
    logRequestMetrics(request, clientId, loadData, true);
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      message: 'Request processed successfully',
      metrics: {
        processingTime,
        systemLoad: loadData.cpuLoad.toFixed(2),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    }, {
      headers: {
        'X-Processing-Time': processingTime.toString(),
        'X-System-Load': loadData.cpuLoad.toFixed(2),
        'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    });
    
  } catch (error) {
    console.error('Traffic manager error:', error);
    
    // Return graceful fallback
    return NextResponse.json({
      error: true,
      message: 'Traffic management error occurred',
      code: 'TRAFFIC_ERROR',
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
    
  } finally {
    // Decrement active connections
    systemMetrics.activeConnections = Math.max(0, systemMetrics.activeConnections - 1);
  }
}

/**
 * POST handler for simulating traffic
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (body.simulateLoad) {
      systemMetrics.activeConnections += body.connections || 100;
      systemMetrics.currentLoad = Math.min(1, systemMetrics.currentLoad + (body.load || 0.1));
    }
    
    return NextResponse.json({
      success: true,
      message: 'Traffic simulation updated',
      currentMetrics: {
        activeConnections: systemMetrics.activeConnections,
        currentLoad: systemMetrics.currentLoad
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: true,
      message: 'Failed to update traffic simulation'
    }, {
      status: 400
    });
  }
}

/**
 * Using Node.js runtime for persistent in-memory storage with Maps
 */