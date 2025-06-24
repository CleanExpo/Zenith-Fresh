/**
 * Enhanced Application Performance Monitoring (APM) System
 * Comprehensive monitoring, alerting, and incident response
 */

import * as Sentry from '@sentry/nextjs';
import { auditLogger } from '@/lib/audit/audit-logger';
import { redis } from '@/lib/redis';

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  source: string;
  tags: Record<string, string>;
  threshold?: {
    warning: number;
    critical: number;
  };
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  timestamp: Date;
  details?: any;
  error?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  service: string;
  createdAt: Date;
  resolvedAt?: Date;
  affectedUsers?: number;
  rootCause?: string;
  resolution?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'ne';
  threshold: number;
  duration: number; // in minutes
  severity: 'warning' | 'critical';
  channels: string[]; // email, slack, webhook
  enabled: boolean;
}

class EnhancedAPMSystem {
  private static instance: EnhancedAPMSystem;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  private incidents: Map<string, Incident> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private alertStates: Map<string, { triggered: boolean; since: Date }> = new Map();

  private constructor() {
    this.initializeDefaultAlertRules();
    this.startHealthCheckMonitoring();
    this.startMetricCollection();
  }

  static getInstance(): EnhancedAPMSystem {
    if (!EnhancedAPMSystem.instance) {
      EnhancedAPMSystem.instance = new EnhancedAPMSystem();
    }
    return EnhancedAPMSystem.instance;
  }

  // ==================== PERFORMANCE METRICS ====================

  async recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<void> {
    const fullMetric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...metric,
    };

    // Store in memory for recent access
    const metricHistory = this.metrics.get(metric.name) || [];
    metricHistory.push(fullMetric);
    
    // Keep only last 1000 metrics per type
    if (metricHistory.length > 1000) {
      metricHistory.shift();
    }
    this.metrics.set(metric.name, metricHistory);

    // Store in Redis for persistence
    if (redis) {
      await redis.zadd(
        `apm:metrics:${metric.name}`,
        fullMetric.timestamp.getTime(),
        JSON.stringify(fullMetric)
      );

      // Expire old metrics (keep 7 days)
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      await redis.zremrangebyscore(`apm:metrics:${metric.name}`, 0, weekAgo);
    }

    // Check alert rules
    await this.checkAlertRules(fullMetric);

    // Send to Sentry for additional monitoring
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${metric.name}: ${metric.value} ${metric.unit}`,
      level: 'info',
      data: {
        metric: metric.name,
        value: metric.value,
        source: metric.source,
        tags: metric.tags,
      },
    });
  }

  async getMetrics(
    metricName: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<PerformanceMetric[]> {
    if (redis && timeRange) {
      const results = await redis.zrangebyscore(
        `apm:metrics:${metricName}`,
        timeRange.start.getTime(),
        timeRange.end.getTime()
      );
      
      return results.map(result => JSON.parse(result));
    }

    // Fallback to in-memory metrics
    const metrics = this.metrics.get(metricName) || [];
    if (!timeRange) return metrics;

    return metrics.filter(
      metric => 
        metric.timestamp >= timeRange.start && 
        metric.timestamp <= timeRange.end
    );
  }

  async getMetricSummary(metricName: string, duration: number = 60): Promise<{
    current: number;
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    const since = new Date(Date.now() - duration * 60 * 1000);
    const metrics = await this.getMetrics(metricName, { start: since, end: new Date() });
    
    if (metrics.length === 0) {
      return {
        current: 0,
        average: 0,
        min: 0,
        max: 0,
        p95: 0,
        p99: 0,
        trend: 'stable',
      };
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const current = metrics[metrics.length - 1].value;
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = values[0];
    const max = values[values.length - 1];
    const p95 = values[Math.floor(values.length * 0.95)];
    const p99 = values[Math.floor(values.length * 0.99)];

    // Calculate trend
    const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2));
    const secondHalf = metrics.slice(Math.floor(metrics.length / 2));
    const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    if (changePercent > 5) trend = 'up';
    else if (changePercent < -5) trend = 'down';

    return { current, average, min, max, p95, p99, trend };
  }

  // ==================== HEALTH CHECKS ====================

  async performHealthCheck(service: string, checkFn: () => Promise<any>): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        checkFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 30000)
        ),
      ]);

      const healthCheck: HealthCheckResult = {
        service,
        status: 'healthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        details: result,
      };

      this.healthChecks.set(service, healthCheck);
      
      // Store in Redis
      if (redis) {
        await redis.setex(
          `apm:health:${service}`,
          300, // 5 minutes
          JSON.stringify(healthCheck)
        );
      }

      await this.recordMetric({
        name: 'health_check_response_time',
        value: healthCheck.responseTime,
        unit: 'ms',
        source: 'health_monitor',
        tags: { service },
      });

      return healthCheck;
    } catch (error) {
      const healthCheck: HealthCheckResult = {
        service,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.healthChecks.set(service, healthCheck);
      
      if (redis) {
        await redis.setex(
          `apm:health:${service}`,
          300,
          JSON.stringify(healthCheck)
        );
      }

      // Create incident for unhealthy service
      await this.createIncident({
        title: `Service Health Check Failed: ${service}`,
        description: `Health check for ${service} failed: ${healthCheck.error}`,
        severity: 'high',
        service,
      });

      return healthCheck;
    }
  }

  async getSystemHealth(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: HealthCheckResult[];
    uptime: number;
    lastCheck: Date;
  }> {
    const services = Array.from(this.healthChecks.values());
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) overall = 'unhealthy';
    else if (degradedCount > 0) overall = 'degraded';

    // Calculate uptime (simplified)
    const uptimeStart = await this.getUptimeStart();
    const uptime = Date.now() - uptimeStart.getTime();

    return {
      overall,
      services,
      uptime,
      lastCheck: new Date(),
    };
  }

  // ==================== INCIDENT MANAGEMENT ====================

  async createIncident(incident: Omit<Incident, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const incidentId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullIncident: Incident = {
      id: incidentId,
      status: 'open',
      createdAt: new Date(),
      ...incident,
    };

    this.incidents.set(incidentId, fullIncident);

    // Store in Redis
    if (redis) {
      await redis.setex(
        `apm:incident:${incidentId}`,
        86400, // 24 hours
        JSON.stringify(fullIncident)
      );
    }

    // Log incident creation
    await auditLogger.log({
      action: 'incident_created',
      details: {
        incidentId,
        title: incident.title,
        severity: incident.severity,
        service: incident.service,
      },
    });

    // Send notifications
    await this.sendIncidentNotification(fullIncident, 'created');

    // Auto-escalate critical incidents
    if (incident.severity === 'critical') {
      await this.escalateIncident(incidentId);
    }

    return incidentId;
  }

  async updateIncident(
    incidentId: string,
    update: Partial<Pick<Incident, 'status' | 'description' | 'rootCause' | 'resolution'>>
  ): Promise<void> {
    const incident = this.incidents.get(incidentId);
    if (!incident) throw new Error('Incident not found');

    const updatedIncident = { ...incident, ...update };
    
    if (update.status === 'resolved' && !incident.resolvedAt) {
      updatedIncident.resolvedAt = new Date();
    }

    this.incidents.set(incidentId, updatedIncident);

    if (redis) {
      await redis.setex(
        `apm:incident:${incidentId}`,
        86400,
        JSON.stringify(updatedIncident)
      );
    }

    await auditLogger.log({
      action: 'incident_updated',
      details: {
        incidentId,
        changes: update,
        status: updatedIncident.status,
      },
    });

    await this.sendIncidentNotification(updatedIncident, 'updated');
  }

  async getActiveIncidents(): Promise<Incident[]> {
    return Array.from(this.incidents.values())
      .filter(incident => ['open', 'investigating'].includes(incident.status))
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  // ==================== ALERT MANAGEMENT ====================

  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<string> {
    const ruleId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullRule: AlertRule = { id: ruleId, ...rule };
    
    this.alertRules.set(ruleId, fullRule);
    
    if (redis) {
      await redis.setex(
        `apm:alert_rule:${ruleId}`,
        86400 * 30, // 30 days
        JSON.stringify(fullRule)
      );
    }

    return ruleId;
  }

  private async checkAlertRules(metric: PerformanceMetric): Promise<void> {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled || rule.metric !== metric.name) continue;

      const shouldTrigger = this.evaluateAlertCondition(metric.value, rule);
      const alertState = this.alertStates.get(ruleId) || { triggered: false, since: new Date() };

      if (shouldTrigger && !alertState.triggered) {
        // Check if condition persists for the specified duration
        const durationMs = rule.duration * 60 * 1000;
        if (Date.now() - alertState.since.getTime() >= durationMs) {
          await this.triggerAlert(rule, metric);
          this.alertStates.set(ruleId, { triggered: true, since: new Date() });
        }
      } else if (!shouldTrigger && alertState.triggered) {
        await this.resolveAlert(rule, metric);
        this.alertStates.set(ruleId, { triggered: false, since: new Date() });
      } else if (shouldTrigger && !alertState.triggered) {
        this.alertStates.set(ruleId, { triggered: false, since: alertState.since });
      }
    }
  }

  private evaluateAlertCondition(value: number, rule: AlertRule): boolean {
    switch (rule.condition) {
      case 'gt': return value > rule.threshold;
      case 'lt': return value < rule.threshold;
      case 'eq': return value === rule.threshold;
      case 'ne': return value !== rule.threshold;
      default: return false;
    }
  }

  private async triggerAlert(rule: AlertRule, metric: PerformanceMetric): Promise<void> {
    const message = `Alert: ${rule.name} - ${metric.name} is ${metric.value} ${metric.unit}`;
    
    await auditLogger.log({
      action: 'alert_triggered',
      details: {
        ruleId: rule.id,
        ruleName: rule.name,
        metric: metric.name,
        value: metric.value,
        threshold: rule.threshold,
        severity: rule.severity,
      },
    });

    // Send notifications based on configured channels
    for (const channel of rule.channels) {
      await this.sendAlertNotification(channel, rule, metric, 'triggered');
    }

    // Create incident for critical alerts
    if (rule.severity === 'critical') {
      await this.createIncident({
        title: `Critical Alert: ${rule.name}`,
        description: message,
        severity: 'critical',
        service: metric.source,
      });
    }
  }

  private async resolveAlert(rule: AlertRule, metric: PerformanceMetric): Promise<void> {
    await auditLogger.log({
      action: 'alert_resolved',
      details: {
        ruleId: rule.id,
        ruleName: rule.name,
        metric: metric.name,
        value: metric.value,
      },
    });

    for (const channel of rule.channels) {
      await this.sendAlertNotification(channel, rule, metric, 'resolved');
    }
  }

  // ==================== NOTIFICATION SYSTEM ====================

  private async sendIncidentNotification(incident: Incident, action: 'created' | 'updated'): Promise<void> {
    const subject = `Incident ${action.toUpperCase()}: ${incident.title}`;
    const message = `
      Incident ID: ${incident.id}
      Service: ${incident.service}
      Severity: ${incident.severity}
      Status: ${incident.status}
      
      Description: ${incident.description}
      
      ${incident.rootCause ? `Root Cause: ${incident.rootCause}` : ''}
      ${incident.resolution ? `Resolution: ${incident.resolution}` : ''}
      
      Created: ${incident.createdAt.toISOString()}
      ${incident.resolvedAt ? `Resolved: ${incident.resolvedAt.toISOString()}` : ''}
    `;

    // Send to configured notification channels
    await this.sendNotification('incident', subject, message);
  }

  private async sendAlertNotification(
    channel: string,
    rule: AlertRule,
    metric: PerformanceMetric,
    action: 'triggered' | 'resolved'
  ): Promise<void> {
    const subject = `Alert ${action.toUpperCase()}: ${rule.name}`;
    const message = `
      Alert Rule: ${rule.name}
      Metric: ${metric.name}
      Current Value: ${metric.value} ${metric.unit}
      Threshold: ${rule.threshold} ${metric.unit}
      Severity: ${rule.severity}
      Source: ${metric.source}
      
      Time: ${metric.timestamp.toISOString()}
    `;

    await this.sendNotification(channel, subject, message);
  }

  private async sendNotification(type: string, subject: string, message: string): Promise<void> {
    try {
      // Email notification
      if (process.env.ALERT_EMAIL) {
        // Would integrate with email service (Resend, SendGrid, etc.)
        console.log(`Email notification: ${subject}`);
      }

      // Slack notification
      if (process.env.SLACK_WEBHOOK_URL) {
        // Would integrate with Slack webhook
        console.log(`Slack notification: ${subject}`);
      }

      // Webhook notification
      if (process.env.WEBHOOK_URL) {
        // Would send to custom webhook
        console.log(`Webhook notification: ${subject}`);
      }

      // PagerDuty integration for critical incidents
      if (type === 'incident' && process.env.PAGERDUTY_KEY) {
        // Would integrate with PagerDuty API
        console.log(`PagerDuty notification: ${subject}`);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // ==================== AUTOMATED MONITORING ====================

  private initializeDefaultAlertRules(): void {
    const defaultRules: Omit<AlertRule, 'id'>[] = [
      {
        name: 'High API Response Time',
        metric: 'api_response_time',
        condition: 'gt',
        threshold: 2000, // 2 seconds
        duration: 5, // 5 minutes
        severity: 'warning',
        channels: ['email'],
        enabled: true,
      },
      {
        name: 'Critical API Response Time',
        metric: 'api_response_time',
        condition: 'gt',
        threshold: 5000, // 5 seconds
        duration: 2, // 2 minutes
        severity: 'critical',
        channels: ['email', 'slack', 'pagerduty'],
        enabled: true,
      },
      {
        name: 'High Error Rate',
        metric: 'error_rate',
        condition: 'gt',
        threshold: 5, // 5%
        duration: 3, // 3 minutes
        severity: 'critical',
        channels: ['email', 'slack'],
        enabled: true,
      },
      {
        name: 'Low Database Connection Pool',
        metric: 'db_connections_available',
        condition: 'lt',
        threshold: 5,
        duration: 1, // 1 minute
        severity: 'warning',
        channels: ['email'],
        enabled: true,
      },
      {
        name: 'High Memory Usage',
        metric: 'memory_usage_percent',
        condition: 'gt',
        threshold: 85, // 85%
        duration: 5, // 5 minutes
        severity: 'warning',
        channels: ['email'],
        enabled: true,
      },
      {
        name: 'Critical Memory Usage',
        metric: 'memory_usage_percent',
        condition: 'gt',
        threshold: 95, // 95%
        duration: 2, // 2 minutes
        severity: 'critical',
        channels: ['email', 'slack', 'pagerduty'],
        enabled: true,
      },
    ];

    defaultRules.forEach(rule => {
      this.createAlertRule(rule);
    });
  }

  private async startHealthCheckMonitoring(): Promise<void> {
    const healthChecks = [
      {
        name: 'database',
        check: async () => {
          // Would check database connectivity
          return { status: 'connected', latency: Math.random() * 50 };
        },
      },
      {
        name: 'redis',
        check: async () => {
          // Would check Redis connectivity
          return { status: 'connected', latency: Math.random() * 10 };
        },
      },
      {
        name: 'external_api',
        check: async () => {
          // Would check external API dependencies
          return { status: 'available', latency: Math.random() * 200 };
        },
      },
    ];

    // Run health checks every 2 minutes
    setInterval(async () => {
      for (const healthCheck of healthChecks) {
        await this.performHealthCheck(healthCheck.name, healthCheck.check);
      }
    }, 2 * 60 * 1000);
  }

  private async startMetricCollection(): Promise<void> {
    // Collect system metrics every minute
    setInterval(async () => {
      try {
        // Memory usage
        const memUsage = process.memoryUsage();
        await this.recordMetric({
          name: 'memory_usage_mb',
          value: memUsage.heapUsed / 1024 / 1024,
          unit: 'MB',
          source: 'system',
          tags: { type: 'heap_used' },
        });

        // CPU usage (simplified)
        const cpuUsage = process.cpuUsage();
        await this.recordMetric({
          name: 'cpu_usage_percent',
          value: (cpuUsage.user + cpuUsage.system) / 10000, // Simplified calculation
          unit: '%',
          source: 'system',
          tags: { type: 'total' },
        });

        // Event loop lag
        const start = process.hrtime.bigint();
        setImmediate(() => {
          const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
          this.recordMetric({
            name: 'event_loop_lag',
            value: lag,
            unit: 'ms',
            source: 'system',
            tags: { type: 'lag' },
          });
        });
      } catch (error) {
        console.error('Error collecting system metrics:', error);
      }
    }, 60 * 1000);
  }

  private async escalateIncident(incidentId: string): Promise<void> {
    // Auto-escalation logic for critical incidents
    await auditLogger.log({
      action: 'incident_escalated',
      details: { incidentId, reason: 'critical_severity' },
    });
  }

  private async getUptimeStart(): Promise<Date> {
    // In production, this would track actual service start time
    const uptimeKey = 'apm:uptime_start';
    if (redis) {
      const stored = await redis.get(uptimeKey);
      if (stored) return new Date(stored);
      
      const now = new Date();
      await redis.set(uptimeKey, now.toISOString());
      return now;
    }
    
    return new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago
  }

  // ==================== REPORTING ====================

  async generatePerformanceReport(timeRange: { start: Date; end: Date }): Promise<{
    summary: any;
    metrics: any;
    incidents: Incident[];
    uptime: number;
    sla: number;
  }> {
    const incidents = Array.from(this.incidents.values())
      .filter(i => i.createdAt >= timeRange.start && i.createdAt <= timeRange.end);

    const downtime = incidents
      .filter(i => i.severity === 'critical' && i.resolvedAt)
      .reduce((total, i) => {
        const duration = i.resolvedAt!.getTime() - i.createdAt.getTime();
        return total + duration;
      }, 0);

    const totalTime = timeRange.end.getTime() - timeRange.start.getTime();
    const uptime = ((totalTime - downtime) / totalTime) * 100;
    const sla = uptime >= 99.9 ? 100 : uptime;

    return {
      summary: {
        totalIncidents: incidents.length,
        criticalIncidents: incidents.filter(i => i.severity === 'critical').length,
        averageResolutionTime: this.calculateAverageResolutionTime(incidents),
        uptime,
        sla,
      },
      metrics: await this.getMetricSummaries(timeRange),
      incidents,
      uptime,
      sla,
    };
  }

  private calculateAverageResolutionTime(incidents: Incident[]): number {
    const resolved = incidents.filter(i => i.resolvedAt);
    if (resolved.length === 0) return 0;

    const totalTime = resolved.reduce((sum, i) => {
      return sum + (i.resolvedAt!.getTime() - i.createdAt.getTime());
    }, 0);

    return totalTime / resolved.length;
  }

  private async getMetricSummaries(timeRange: { start: Date; end: Date }): Promise<any> {
    const metricNames = Array.from(this.metrics.keys());
    const summaries: any = {};

    for (const metricName of metricNames) {
      summaries[metricName] = await this.getMetricSummary(metricName, 
        (timeRange.end.getTime() - timeRange.start.getTime()) / (60 * 1000)
      );
    }

    return summaries;
  }
}

export const enhancedAPM = EnhancedAPMSystem.getInstance();