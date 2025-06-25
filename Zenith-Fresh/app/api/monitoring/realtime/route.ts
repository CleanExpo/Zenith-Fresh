import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demonstration - use Redis or DB in production
let previousMetrics: any = null;
let metricsHistory: any[] = [];

interface MetricData {
  current: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
}

// Simulate realistic performance metrics
function generateRealtimeMetrics(): any {
  const now = Date.now();
  const hour = new Date(now).getHours();
  
  // Simulate daily patterns
  const trafficMultiplier = 0.3 + (Math.sin((hour / 24) * 2 * Math.PI) + 1) * 0.7;
  const loadMultiplier = 0.2 + (Math.sin(((hour + 6) / 24) * 2 * Math.PI) + 1) * 0.4;
  
  // Base metrics with some randomness
  const baseResponseTime = 50 + (trafficMultiplier * 100) + (Math.random() * 50);
  const baseThroughput = 100 + (trafficMultiplier * 200) + (Math.random() * 50);
  const baseErrorRate = 0.1 + (loadMultiplier * 2) + (Math.random() * 0.5);
  const baseCpuUsage = 20 + (loadMultiplier * 40) + (Math.random() * 20);
  const baseMemoryUsage = 30 + (loadMultiplier * 30) + (Math.random() * 15);
  const baseConnections = Math.floor(50 + (trafficMultiplier * 300) + (Math.random() * 100));

  const current = {
    responseTime: baseResponseTime,
    throughput: baseThroughput,
    errorRate: baseErrorRate,
    cpuUsage: baseCpuUsage,
    memoryUsage: baseMemoryUsage,
    activeConnections: baseConnections
  };

  // Calculate trends and changes
  const calculateMetric = (
    currentValue: number, 
    previousValue: number | undefined,
    unit: string,
    thresholds: { warning: number; critical: number; inverse?: boolean }
  ): MetricData => {
    const change = previousValue ? ((currentValue - previousValue) / previousValue) * 100 : 0;
    const trend = Math.abs(change) < 2 ? 'stable' : change > 0 ? 'up' : 'down';
    
    let status: 'good' | 'warning' | 'critical';
    if (thresholds.inverse) {
      // For metrics where lower is better (like error rate, response time)
      if (currentValue >= thresholds.critical) status = 'critical';
      else if (currentValue >= thresholds.warning) status = 'warning';
      else status = 'good';
    } else {
      // For metrics where higher might be concerning (like CPU, memory)
      if (currentValue >= thresholds.critical) status = 'critical';
      else if (currentValue >= thresholds.warning) status = 'warning';
      else status = 'good';
    }

    return {
      current: currentValue,
      trend,
      change,
      unit,
      status
    };
  };

  const metrics = {
    responseTime: calculateMetric(
      current.responseTime,
      previousMetrics?.responseTime,
      'ms',
      { warning: 200, critical: 500, inverse: true }
    ),
    throughput: calculateMetric(
      current.throughput,
      previousMetrics?.throughput,
      ' req/min',
      { warning: 1000, critical: 2000 }
    ),
    errorRate: calculateMetric(
      current.errorRate,
      previousMetrics?.errorRate,
      '%',
      { warning: 1, critical: 5, inverse: true }
    ),
    cpuUsage: calculateMetric(
      current.cpuUsage,
      previousMetrics?.cpuUsage,
      '%',
      { warning: 70, critical: 85 }
    ),
    memoryUsage: calculateMetric(
      current.memoryUsage,
      previousMetrics?.memoryUsage,
      '%',
      { warning: 80, critical: 90 }
    ),
    activeConnections: calculateMetric(
      current.activeConnections,
      previousMetrics?.activeConnections,
      '',
      { warning: 500, critical: 1000 }
    )
  };

  // Store current metrics for next comparison
  previousMetrics = current;

  // Add to history (keep last 100 entries)
  metricsHistory.push({
    timestamp: now,
    ...current
  });
  
  if (metricsHistory.length > 100) {
    metricsHistory = metricsHistory.slice(-100);
  }

  return {
    timestamp: now,
    metrics,
    history: metricsHistory.slice(-20) // Return last 20 for charting
  };
}

export async function GET(request: NextRequest) {
  try {
    const data = generateRealtimeMetrics();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Real-time metrics error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch real-time metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST endpoint to receive metrics from external sources
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate incoming metrics
    if (!body.metrics) {
      return NextResponse.json(
        { error: 'No metrics provided' },
        { status: 400 }
      );
    }

    // Process and store the metrics
    const timestamp = Date.now();
    metricsHistory.push({
      timestamp,
      ...body.metrics,
      source: 'external'
    });

    // Keep history size manageable
    if (metricsHistory.length > 1000) {
      metricsHistory = metricsHistory.slice(-1000);
    }

    return NextResponse.json({
      success: true,
      message: 'Metrics received',
      timestamp
    });
  } catch (error) {
    console.error('Error processing metrics:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}