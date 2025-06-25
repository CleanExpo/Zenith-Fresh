import { NextRequest, NextResponse } from 'next/server';

// Alert storage - use database in production
interface Alert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: number;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  resolvedBy?: string;
  resolvedAt?: number;
  metadata?: any;
}

let alerts: Alert[] = [];
let alertId = 1;

// Simulate some initial alerts
function initializeAlerts() {
  if (alerts.length === 0) {
    const now = Date.now();
    alerts = [
      {
        id: 'alert-1',
        level: 'warning',
        title: 'High Memory Usage',
        message: 'Memory usage has exceeded 80% for the last 5 minutes',
        source: 'system-monitor',
        timestamp: now - 300000, // 5 minutes ago
        status: 'active',
        metadata: { value: 82, threshold: 80, unit: '%' }
      },
      {
        id: 'alert-2',
        level: 'info',
        title: 'High Traffic Detected',
        message: 'Request rate has increased to 150 req/min',
        source: 'traffic-monitor',
        timestamp: now - 180000, // 3 minutes ago
        status: 'acknowledged',
        acknowledgedBy: 'system',
        metadata: { value: 150, unit: 'req/min' }
      },
      {
        id: 'alert-3',
        level: 'critical',
        title: 'Database Connection Issues',
        message: 'Multiple database connection timeouts detected',
        source: 'database-monitor',
        timestamp: now - 600000, // 10 minutes ago
        status: 'resolved',
        resolvedBy: 'auto-recovery',
        resolvedAt: now - 300000,
        metadata: { timeouts: 5, duration: '2 minutes' }
      }
    ];
  }
}

// Generate dynamic alerts based on system state
function generateDynamicAlerts(): Alert[] {
  const now = Date.now();
  const newAlerts: Alert[] = [];
  
  // Simulate various alert conditions
  if (Math.random() < 0.1) { // 10% chance
    newAlerts.push({
      id: `alert-${alertId++}`,
      level: 'warning',
      title: 'Elevated Response Time',
      message: `Average response time increased to ${(200 + Math.random() * 300).toFixed(0)}ms`,
      source: 'performance-monitor',
      timestamp: now,
      status: 'active',
      metadata: { 
        responseTime: 200 + Math.random() * 300,
        threshold: 200,
        unit: 'ms'
      }
    });
  }
  
  if (Math.random() < 0.05) { // 5% chance
    newAlerts.push({
      id: `alert-${alertId++}`,
      level: 'critical',
      title: 'Error Rate Spike',
      message: `Error rate spiked to ${(Math.random() * 10 + 5).toFixed(2)}%`,
      source: 'error-monitor',
      timestamp: now,
      status: 'active',
      metadata: { 
        errorRate: Math.random() * 10 + 5,
        threshold: 5,
        unit: '%'
      }
    });
  }

  if (Math.random() < 0.03) { // 3% chance
    newAlerts.push({
      id: `alert-${alertId++}`,
      level: 'info',
      title: 'Scheduled Maintenance',
      message: 'Automated backup process started',
      source: 'maintenance-scheduler',
      timestamp: now,
      status: 'active',
      metadata: { type: 'backup', estimatedDuration: '10 minutes' }
    });
  }

  return newAlerts;
}

// Auto-resolve old alerts
function autoResolveAlerts() {
  const now = Date.now();
  const autoResolveAge = 30 * 60 * 1000; // 30 minutes
  
  alerts.forEach(alert => {
    if (
      alert.status === 'active' && 
      alert.level !== 'critical' && 
      now - alert.timestamp > autoResolveAge
    ) {
      alert.status = 'resolved';
      alert.resolvedBy = 'auto-timeout';
      alert.resolvedAt = now;
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    initializeAlerts();
    
    // Generate some dynamic alerts
    const newAlerts = generateDynamicAlerts();
    alerts.push(...newAlerts);
    
    // Auto-resolve old alerts
    autoResolveAlerts();
    
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const level = url.searchParams.get('level');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    // Filter alerts
    let filteredAlerts = alerts;
    
    if (status) {
      filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
    }
    
    if (level) {
      filteredAlerts = filteredAlerts.filter(alert => alert.level === level);
    }
    
    // Sort by timestamp (newest first) and limit
    filteredAlerts = filteredAlerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    // Calculate summary statistics
    const summary = {
      total: alerts.length,
      active: alerts.filter(a => a.status === 'active').length,
      critical: alerts.filter(a => a.level === 'critical' && a.status === 'active').length,
      warning: alerts.filter(a => a.level === 'warning' && a.status === 'active').length,
      info: alerts.filter(a => a.level === 'info' && a.status === 'active').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
      resolved: alerts.filter(a => a.status === 'resolved').length
    };
    
    return NextResponse.json({
      alerts: filteredAlerts,
      summary,
      activeAlerts: summary.active,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Alerts API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch alerts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.message || !body.level) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message, level' },
        { status: 400 }
      );
    }

    const newAlert: Alert = {
      id: `alert-${alertId++}`,
      level: body.level,
      title: body.title,
      message: body.message,
      source: body.source || 'api',
      timestamp: Date.now(),
      status: 'active',
      metadata: body.metadata
    };

    alerts.unshift(newAlert); // Add to beginning
    
    // Keep alerts manageable (last 1000)
    if (alerts.length > 1000) {
      alerts = alerts.slice(0, 1000);
    }

    return NextResponse.json({
      success: true,
      alert: newAlert
    });
  } catch (error) {
    console.error('Create alert error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create alert',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, acknowledgedBy, resolvedBy } = body;
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: id, status' },
        { status: 400 }
      );
    }

    const alert = alerts.find(a => a.id === id);
    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Update alert status
    alert.status = status;
    
    if (status === 'acknowledged' && acknowledgedBy) {
      alert.acknowledgedBy = acknowledgedBy;
    }
    
    if (status === 'resolved') {
      alert.resolvedBy = resolvedBy || 'manual';
      alert.resolvedAt = Date.now();
    }

    return NextResponse.json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('Update alert error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update alert',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}