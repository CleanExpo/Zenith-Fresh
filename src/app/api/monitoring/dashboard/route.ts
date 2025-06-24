/**
 * ZENITH MONITORING DASHBOARD API
 * Real-time monitoring dashboard endpoints for enterprise observability
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitoringAgent } from '@/lib/agents/advanced-monitoring-observability-agent';
import { apiMonitor } from '@/lib/api/api-performance-monitor';
import { securityMonitor } from '@/lib/security/security-monitor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const timeRange = searchParams.get('timeRange') || '1h';

    switch (type) {
      case 'overview':
        return NextResponse.json(await getOverviewData());
      
      case 'performance':
        return NextResponse.json(await getPerformanceData(timeRange));
      
      case 'security':
        return NextResponse.json(await getSecurityData(timeRange));
      
      case 'infrastructure':
        return NextResponse.json(await getInfrastructureData(timeRange));
      
      case 'business':
        return NextResponse.json(await getBusinessData(timeRange));
      
      case 'incidents':
        return NextResponse.json(await getIncidentsData());
      
      case 'sla':
        return NextResponse.json(await getSLAData());
      
      default:
        return NextResponse.json(
          { error: 'Invalid dashboard type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

async function getOverviewData() {
  const monitoringStatus = monitoringAgent.getStatus();
  const apiStatus = apiMonitor.getMonitoringStatus();
  const securityMetrics = securityMonitor.getSecurityMetrics();
  const incidents = monitoringAgent.getIncidents();
  const slaTargets = monitoringAgent.getSLATargets();

  // Calculate overall health score
  const healthScore = calculateHealthScore(apiStatus, securityMetrics, incidents, slaTargets);

  return {
    timestamp: new Date().toISOString(),
    overview: {
      healthScore,
      status: monitoringStatus.isActive ? 'active' : 'inactive',
      totalMetrics: apiStatus.metricsCount,
      activeIncidents: incidents.filter(i => i.status !== 'closed').length,
      criticalIncidents: incidents.filter(i => i.severity === 'critical' && i.status !== 'closed').length,
    },
    systemHealth: {
      healthyEndpoints: apiStatus.healthyEndpoints,
      degradedEndpoints: apiStatus.degradedEndpoints,
      unhealthyEndpoints: apiStatus.unhealthyEndpoints,
      totalEndpoints: apiStatus.healthyEndpoints + apiStatus.degradedEndpoints + apiStatus.unhealthyEndpoints,
    },
    security: {
      eventsLast24h: securityMetrics.totalEvents,
      criticalEvents: securityMetrics.eventsBySeverity.CRITICAL,
      highEvents: securityMetrics.eventsBySeverity.HIGH,
      topThreats: securityMetrics.topAttackers.slice(0, 5),
    },
    sla: {
      targets: slaTargets.length,
      healthy: slaTargets.filter(s => s.status === 'healthy').length,
      warning: slaTargets.filter(s => s.status === 'warning').length,
      critical: slaTargets.filter(s => s.status === 'critical').length,
    }
  };
}

async function getPerformanceData(timeRange: string) {
  const apiMetrics = apiMonitor.getCurrentMetrics();
  const benchmarks = apiMonitor.getBenchmarks();
  const healthChecks = apiMonitor.getHealthChecks();
  
  // Filter metrics by time range
  const filteredMetrics = filterByTimeRange(apiMetrics, timeRange);
  
  // Calculate performance statistics
  const avgResponseTime = filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0) / filteredMetrics.length || 0;
  const p95ResponseTime = calculatePercentile(filteredMetrics.map(m => m.responseTime), 95);
  const errorRate = filteredMetrics.filter(m => m.statusCode >= 400).length / filteredMetrics.length || 0;
  const throughput = filteredMetrics.length / getTimeRangeHours(timeRange);

  return {
    timestamp: new Date().toISOString(),
    timeRange,
    summary: {
      avgResponseTime: Math.round(avgResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimals
      throughput: Math.round(throughput),
      totalRequests: filteredMetrics.length,
    },
    trends: {
      responseTime: generateTimeSeries(filteredMetrics, 'responseTime', timeRange),
      errorRate: generateErrorRateSeries(filteredMetrics, timeRange),
      throughput: generateThroughputSeries(filteredMetrics, timeRange),
    },
    topEndpoints: getTopEndpoints(filteredMetrics, 10),
    slowestEndpoints: getSlowestEndpoints(filteredMetrics, 10),
    healthChecks: healthChecks.map(hc => ({
      endpoint: hc.endpoint,
      status: hc.status,
      responseTime: Math.round(hc.responseTime),
      errorRate: Math.round(hc.errorRate * 10000) / 100,
      lastCheck: hc.lastCheck,
    })),
    benchmarks: benchmarks.slice(0, 20).map(b => ({
      endpoint: `${b.method} ${b.endpoint}`,
      avgResponseTime: Math.round(b.averageResponseTime),
      p95: Math.round(b.p95),
      errorRate: Math.round(b.errorRate * 10000) / 100,
      throughput: Math.round(b.requestsPerSecond * 100) / 100,
    })),
  };
}

async function getSecurityData(timeRange: string) {
  const securityMetrics = securityMonitor.getSecurityMetrics();
  const recentAlerts = securityMonitor.getRecentAlerts(50);
  
  return {
    timestamp: new Date().toISOString(),
    timeRange,
    summary: {
      totalEvents: securityMetrics.totalEvents,
      criticalEvents: securityMetrics.eventsBySeverity.CRITICAL,
      highEvents: securityMetrics.eventsBySeverity.HIGH,
      mediumEvents: securityMetrics.eventsBySeverity.MEDIUM,
      lowEvents: securityMetrics.eventsBySeverity.LOW,
    },
    eventTypes: Object.entries(securityMetrics.eventsByType).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / securityMetrics.totalEvents) * 10000) / 100,
    })),
    topAttackers: securityMetrics.topAttackers.slice(0, 10).map(attacker => ({
      ip: attacker.ip,
      count: attacker.count,
      threat: securityMonitor.getThreatIntelligence(attacker.ip),
    })),
    topTargets: securityMetrics.topTargets.slice(0, 10),
    recentAlerts: recentAlerts.slice(0, 20).map(alert => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      ip: alert.ip,
      timestamp: alert.timestamp,
      status: alert.status,
      details: alert.details,
    })),
    threatIntelligence: securityMonitor.getThreatsAboveLevel('SUSPICIOUS').slice(0, 20),
  };
}

async function getInfrastructureData(timeRange: string) {
  // Get current system metrics
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const uptime = process.uptime();

  return {
    timestamp: new Date().toISOString(),
    timeRange,
    system: {
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        usage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000),
        system: Math.round(cpuUsage.system / 1000),
      },
      uptime: Math.round(uptime),
      nodeVersion: process.version,
      platform: process.platform,
    },
    database: {
      status: 'connected', // Simplified - would check actual DB status
      connections: 1, // Would get actual connection count
    },
    cache: {
      status: 'connected', // Would check Redis status
      memory: 0, // Would get actual Redis memory usage
    },
    alerts: [
      // Would include infrastructure alerts
    ],
  };
}

async function getBusinessData(timeRange: string) {
  // Get business metrics from monitoring agent
  const businessMetrics = monitoringAgent.getBusinessMetrics(undefined, getTimeRangeFilter(timeRange));
  
  // Group by category
  const metricsByCategory = businessMetrics.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, typeof businessMetrics>);

  return {
    timestamp: new Date().toISOString(),
    timeRange,
    summary: {
      totalMetrics: businessMetrics.length,
      categories: Object.keys(metricsByCategory).length,
    },
    categories: Object.entries(metricsByCategory).map(([category, metrics]) => ({
      name: category,
      count: metrics.length,
      latestValue: metrics[0]?.value || 0,
      trend: calculateTrend(metrics),
    })),
    recentMetrics: businessMetrics.slice(0, 50).map(metric => ({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      category: metric.category,
      timestamp: metric.timestamp,
      status: getMetricStatus(metric),
    })),
  };
}

async function getIncidentsData() {
  const incidents = monitoringAgent.getIncidents();
  
  return {
    timestamp: new Date().toISOString(),
    summary: {
      total: incidents.length,
      open: incidents.filter(i => i.status === 'open').length,
      investigating: incidents.filter(i => i.status === 'investigating').length,
      resolved: incidents.filter(i => i.status === 'resolved').length,
      closed: incidents.filter(i => i.status === 'closed').length,
    },
    bySeverity: {
      critical: incidents.filter(i => i.severity === 'critical').length,
      high: incidents.filter(i => i.severity === 'high').length,
      medium: incidents.filter(i => i.severity === 'medium').length,
      low: incidents.filter(i => i.severity === 'low').length,
    },
    byCategory: incidents.reduce((acc, incident) => {
      acc[incident.category] = (acc[incident.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    recentIncidents: incidents.slice(0, 20).map(incident => ({
      id: incident.id,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
      category: incident.category,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt,
      resolvedAt: incident.resolvedAt,
      affectedServices: incident.affectedServices,
      timelineCount: incident.timeline.length,
    })),
  };
}

async function getSLAData() {
  const slaTargets = monitoringAgent.getSLATargets();
  
  return {
    timestamp: new Date().toISOString(),
    summary: {
      total: slaTargets.length,
      healthy: slaTargets.filter(s => s.status === 'healthy').length,
      warning: slaTargets.filter(s => s.status === 'warning').length,
      critical: slaTargets.filter(s => s.status === 'critical').length,
      unknown: slaTargets.filter(s => s.status === 'unknown').length,
    },
    targets: slaTargets.map(sla => ({
      id: sla.id,
      name: sla.name,
      description: sla.description,
      target: sla.target,
      unit: sla.unit,
      period: sla.period,
      category: sla.category,
      currentValue: sla.currentValue,
      status: sla.status,
      compliance: sla.currentValue ? (sla.currentValue / sla.target) * 100 : 0,
      thresholds: sla.thresholds,
    })),
  };
}

// Helper functions
function calculateHealthScore(apiStatus: any, securityMetrics: any, incidents: any[], slaTargets: any[]): number {
  let score = 100;
  
  // API health impact
  if (apiStatus.unhealthyEndpoints > 0) score -= 30;
  else if (apiStatus.degradedEndpoints > 0) score -= 15;
  
  // Security impact
  if (securityMetrics.eventsBySeverity.CRITICAL > 0) score -= 25;
  else if (securityMetrics.eventsBySeverity.HIGH > 0) score -= 15;
  
  // Incidents impact
  const activeIncidents = incidents.filter(i => i.status !== 'closed');
  const criticalIncidents = activeIncidents.filter(i => i.severity === 'critical').length;
  const highIncidents = activeIncidents.filter(i => i.severity === 'high').length;
  score -= (criticalIncidents * 20) + (highIncidents * 10);
  
  // SLA compliance impact
  const healthySLAs = slaTargets.filter(s => s.status === 'healthy').length;
  const slaCompliance = slaTargets.length > 0 ? healthySLAs / slaTargets.length : 1;
  score *= slaCompliance;
  
  return Math.max(0, Math.round(score));
}

function filterByTimeRange(metrics: any[], timeRange: string): any[] {
  const now = new Date();
  const hours = getTimeRangeHours(timeRange);
  const cutoff = new Date(now.getTime() - (hours * 60 * 60 * 1000));
  
  return metrics.filter(m => new Date(m.timestamp) >= cutoff);
}

function getTimeRangeHours(timeRange: string): number {
  const ranges: Record<string, number> = {
    '15m': 0.25,
    '1h': 1,
    '6h': 6,
    '24h': 24,
    '7d': 168,
    '30d': 720,
  };
  return ranges[timeRange] || 1;
}

function getTimeRangeFilter(timeRange: string): { start: Date; end: Date } {
  const now = new Date();
  const hours = getTimeRangeHours(timeRange);
  const start = new Date(now.getTime() - (hours * 60 * 60 * 1000));
  
  return { start, end: now };
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  const sorted = values.sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  
  if (lower === upper) {
    return sorted[lower];
  }
  
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function generateTimeSeries(metrics: any[], field: string, timeRange: string): any[] {
  const buckets = Math.min(50, Math.max(10, metrics.length / 10));
  const bucketSize = Math.max(1, Math.floor(metrics.length / buckets));
  const series = [];
  
  for (let i = 0; i < metrics.length; i += bucketSize) {
    const bucket = metrics.slice(i, i + bucketSize);
    const avg = bucket.reduce((sum, m) => sum + m[field], 0) / bucket.length;
    const timestamp = bucket[0]?.timestamp || new Date();
    
    series.push({
      timestamp,
      value: Math.round(avg * 100) / 100,
    });
  }
  
  return series;
}

function generateErrorRateSeries(metrics: any[], timeRange: string): any[] {
  const buckets = Math.min(50, Math.max(10, metrics.length / 10));
  const bucketSize = Math.max(1, Math.floor(metrics.length / buckets));
  const series = [];
  
  for (let i = 0; i < metrics.length; i += bucketSize) {
    const bucket = metrics.slice(i, i + bucketSize);
    const errors = bucket.filter(m => m.statusCode >= 400).length;
    const errorRate = errors / bucket.length;
    const timestamp = bucket[0]?.timestamp || new Date();
    
    series.push({
      timestamp,
      value: Math.round(errorRate * 10000) / 100, // Percentage
    });
  }
  
  return series;
}

function generateThroughputSeries(metrics: any[], timeRange: string): any[] {
  const buckets = Math.min(50, Math.max(10, metrics.length / 10));
  const bucketSize = Math.max(1, Math.floor(metrics.length / buckets));
  const series = [];
  
  for (let i = 0; i < metrics.length; i += bucketSize) {
    const bucket = metrics.slice(i, i + bucketSize);
    const timestamp = bucket[0]?.timestamp || new Date();
    
    series.push({
      timestamp,
      value: bucket.length, // Requests in this bucket
    });
  }
  
  return series;
}

function getTopEndpoints(metrics: any[], limit: number): any[] {
  const endpointCounts = metrics.reduce((acc, metric) => {
    const key = `${metric.method} ${metric.endpoint}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(endpointCounts)
    .map(([endpoint, count]) => ({ endpoint, count: count as number }))
    .sort((a, b) => (b.count as number) - (a.count as number))
    .slice(0, limit);
}

function getSlowestEndpoints(metrics: any[], limit: number): any[] {
  const endpointTimes = metrics.reduce((acc, metric) => {
    const key = `${metric.method} ${metric.endpoint}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(metric.responseTime);
    return acc;
  }, {} as Record<string, number[]>);
  
  return Object.entries(endpointTimes)
    .map(([endpoint, times]) => ({
      endpoint,
      avgResponseTime: (times as number[]).reduce((sum, time) => sum + time, 0) / (times as number[]).length,
      count: (times as number[]).length,
    }))
    .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
    .slice(0, limit);
}

function calculateTrend(metrics: any[]): 'up' | 'down' | 'stable' {
  if (metrics.length < 2) return 'stable';
  
  const recent = metrics.slice(0, Math.ceil(metrics.length / 2));
  const older = metrics.slice(Math.ceil(metrics.length / 2));
  
  const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
  const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;
  
  const change = (recentAvg - olderAvg) / olderAvg;
  
  if (change > 0.05) return 'up';
  if (change < -0.05) return 'down';
  return 'stable';
}

function getMetricStatus(metric: any): 'healthy' | 'warning' | 'critical' {
  if (!metric.threshold) return 'healthy';
  
  if (metric.value >= metric.threshold.critical) return 'critical';
  if (metric.value >= metric.threshold.warning) return 'warning';
  return 'healthy';
}