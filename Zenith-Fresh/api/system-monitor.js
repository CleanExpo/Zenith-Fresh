/**
 * System Monitoring API for Zenith-Fresh
 * Provides real-time system health and performance metrics
 */

import { NextResponse } from 'next/server';

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
function updateMetrics() {
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
  
  // Add to history
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
}

/**
 * Calculate request rate (requests per minute)
 */
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
 * API Handler
 */
export default async function handler(request) {
  try {
    const url = new URL(request.url);
    const endpoint = url.searchParams.get('endpoint') || 'overview';
    
    // Update metrics before responding
    updateMetrics();
    
    switch (endpoint) {
      case 'overview':
        return NextResponse.json(getDashboardMetrics());
        
      case 'metrics':
        return NextResponse.json(systemMetrics);
        
      case 'history':
        const hours = parseInt(url.searchParams.get('hours')) || 1;
        const historyData = metricsHistory.slice(-hours * 60);
        return NextResponse.json({
          timeRange: `${hours} hour(s)`,
          dataPoints: historyData.length,
          data: historyData
        });
        
      case 'health':
        const health = getHealthStatus();
        return NextResponse.json(health);
        
      case 'alerts':
        return NextResponse.json({
          alerts: generateAlerts(),
          timestamp: Date.now()
        });
        
      case 'update':
        // Allow external systems to update metrics
        if (request.method === 'POST') {
          const body = await request.json();
          
          if (body.requests) {
            systemMetrics.requests = { ...systemMetrics.requests, ...body.requests };
          }
          
          if (body.performance) {
            systemMetrics.performance = { ...systemMetrics.performance, ...body.performance };
          }
          
          return NextResponse.json({ success: true, message: 'Metrics updated' });
        }
        
        return NextResponse.json({ error: 'POST required for updates' }, { status: 405 });
        
      default:
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('System monitor error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Edge runtime configuration
 */
export const config = {
  runtime: 'edge',
};