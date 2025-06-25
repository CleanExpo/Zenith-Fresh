// Global Performance Monitor - Enterprise Scale Infrastructure
// Real-time performance monitoring across all regions and services

// ==================== PERFORMANCE MONITORING TYPES ====================

export interface PerformanceMetric {
  id: string;
  name: string;
  region: string;
  service: string;
  timestamp: number;
  value: number;
  unit: string;
  tags: Record<string, string>;
  threshold: {
    warning: number;
    critical: number;
  };
  status: 'ok' | 'warning' | 'critical';
}

export interface SLATarget {
  metric: string;
  target: number;
  unit: string;
  timeWindow: number; // in seconds
  tolerance: number; // percentage
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  region: string;
  service: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  threshold: number;
  actualValue: number;
  timestamp: number;
  resolvedAt?: number;
  message: string;
  escalationLevel: number;
  notificationsSent: string[];
}

export interface ServiceHealth {
  service: string;
  region: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number; // percentage
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: number;
  errorRate: number;
  availability: number;
  lastCheckTime: number;
  incidents: number;
}

export interface GlobalDashboard {
  overview: {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    totalAlerts: number;
    criticalAlerts: number;
    avgLatency: number;
    totalThroughput: number;
    globalErrorRate: number;
    overallHealth: number;
  };
  regionStatus: Record<string, RegionStatus>;
  serviceStatus: Record<string, ServiceHealth>;
  recentIncidents: PerformanceAlert[];
  slaCompliance: Record<string, number>;
}

export interface RegionStatus {
  region: string;
  status: 'operational' | 'degraded' | 'outage';
  services: number;
  healthyServices: number;
  avgLatency: number;
  throughput: number;
  errorRate: number;
  lastIncidentTime?: number;
  loadLevel: 'low' | 'medium' | 'high' | 'critical';
}

// ==================== GLOBAL PERFORMANCE MONITOR ====================

export class GlobalPerformanceMonitor {
  private static instance: GlobalPerformanceMonitor;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: PerformanceAlert[] = [];
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private slaTargets: Map<string, SLATarget> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeSLATargets();
    this.initializeServiceHealth();
    this.startMonitoring();
  }

  static getInstance(): GlobalPerformanceMonitor {
    if (!GlobalPerformanceMonitor.instance) {
      GlobalPerformanceMonitor.instance = new GlobalPerformanceMonitor();
    }
    return GlobalPerformanceMonitor.instance;
  }

  private initializeSLATargets(): void {
    // Define SLA targets for different metrics
    const targets: SLATarget[] = [
      {
        metric: 'api_latency_p95',
        target: 200,
        unit: 'ms',
        timeWindow: 300, // 5 minutes
        tolerance: 10 // 10% tolerance
      },
      {
        metric: 'api_latency_p99',
        target: 500,
        unit: 'ms',
        timeWindow: 300,
        tolerance: 15
      },
      {
        metric: 'availability',
        target: 99.99,
        unit: '%',
        timeWindow: 3600, // 1 hour
        tolerance: 0.01
      },
      {
        metric: 'error_rate',
        target: 0.1,
        unit: '%',
        timeWindow: 300,
        tolerance: 0.05
      },
      {
        metric: 'throughput',
        target: 1000,
        unit: 'rps',
        timeWindow: 300,
        tolerance: 20
      },
      {
        metric: 'database_latency',
        target: 50,
        unit: 'ms',
        timeWindow: 300,
        tolerance: 25
      },
      {
        metric: 'cache_hit_rate',
        target: 95,
        unit: '%',
        timeWindow: 300,
        tolerance: 5
      },
      {
        metric: 'cpu_utilization',
        target: 70,
        unit: '%',
        timeWindow: 300,
        tolerance: 10
      },
      {
        metric: 'memory_utilization',
        target: 80,
        unit: '%',
        timeWindow: 300,
        tolerance: 10
      }
    ];

    targets.forEach(target => {
      this.slaTargets.set(target.metric, target);
    });

    console.log(`📊 SLA targets initialized: ${this.slaTargets.size} metrics`);
  }

  private initializeServiceHealth(): void {
    const services = [
      'api-gateway',
      'auth-service',
      'user-service',
      'team-service',
      'project-service',
      'analytics-service',
      'ai-service',
      'database-primary',
      'database-replica',
      'redis-cache',
      'file-storage',
      'email-service',
      'webhook-service'
    ];

    const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'];

    for (const service of services) {
      for (const region of regions) {
        const key = `${service}-${region}`;
        this.serviceHealth.set(key, {
          service,
          region,
          status: 'healthy',
          uptime: 99.99,
          latency: {
            p50: 45,
            p95: 120,
            p99: 300
          },
          throughput: Math.random() * 1000 + 500,
          errorRate: Math.random() * 0.5,
          availability: 99.99,
          lastCheckTime: Date.now(),
          incidents: 0
        });
      }
    }

    console.log(`🏥 Service health initialized: ${this.serviceHealth.size} service instances`);
  }

  private startMonitoring(): void {
    // Collect metrics every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.evaluateAlerts();
      this.updateServiceHealth();
    }, 30000);

    console.log('🔍 Global performance monitoring started');
  }

  // ==================== METRICS COLLECTION ====================

  private async collectMetrics(): Promise<void> {
    const timestamp = Date.now();
    const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'];
    const services = Array.from(new Set(Array.from(this.serviceHealth.values()).map(h => h.service)));

    for (const region of regions) {
      for (const service of services) {
        const metrics = await this.generateServiceMetrics(service, region, timestamp);
        
        for (const metric of metrics) {
          const key = `${metric.service}-${metric.region}-${metric.name}`;
          
          if (!this.metrics.has(key)) {
            this.metrics.set(key, []);
          }
          
          const metricHistory = this.metrics.get(key)!;
          metricHistory.push(metric);
          
          // Keep only last 2880 metrics (24 hours at 30-second intervals)
          if (metricHistory.length > 2880) {
            metricHistory.splice(0, metricHistory.length - 2880);
          }
        }
      }
    }
  }

  private async generateServiceMetrics(service: string, region: string, timestamp: number): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];
    const baseId = `${service}-${region}-${timestamp}`;

    // Simulate realistic metrics based on service type and time patterns
    const timeOfDay = new Date(timestamp).getHours();
    const isBusinessHours = timeOfDay >= 9 && timeOfDay <= 17;
    const loadMultiplier = isBusinessHours ? 1.5 : 0.7;

    // API latency metrics
    if (service.includes('service') || service === 'api-gateway') {
      const baseLatency = this.getBaseLatency(service, region);
      
      metrics.push({
        id: `${baseId}-latency-p50`,
        name: 'api_latency_p50',
        region,
        service,
        timestamp,
        value: this.simulateMetric(baseLatency * 0.6, loadMultiplier),
        unit: 'ms',
        tags: { percentile: 'p50' },
        threshold: { warning: 100, critical: 200 },
        status: 'ok'
      });

      metrics.push({
        id: `${baseId}-latency-p95`,
        name: 'api_latency_p95',
        region,
        service,
        timestamp,
        value: this.simulateMetric(baseLatency * 1.2, loadMultiplier),
        unit: 'ms',
        tags: { percentile: 'p95' },
        threshold: { warning: 200, critical: 500 },
        status: 'ok'
      });

      metrics.push({
        id: `${baseId}-latency-p99`,
        name: 'api_latency_p99',
        region,
        service,
        timestamp,
        value: this.simulateMetric(baseLatency * 2.5, loadMultiplier),
        unit: 'ms',
        tags: { percentile: 'p99' },
        threshold: { warning: 500, critical: 1000 },
        status: 'ok'
      });
    }

    // Throughput metrics
    const baseThroughput = this.getBaseThroughput(service, region);
    metrics.push({
      id: `${baseId}-throughput`,
      name: 'throughput',
      region,
      service,
      timestamp,
      value: this.simulateMetric(baseThroughput, loadMultiplier),
      unit: 'rps',
      tags: {},
      threshold: { warning: baseThroughput * 0.5, critical: baseThroughput * 0.2 },
      status: 'ok'
    });

    // Error rate metrics
    const baseErrorRate = this.getBaseErrorRate(service);
    metrics.push({
      id: `${baseId}-error-rate`,
      name: 'error_rate',
      region,
      service,
      timestamp,
      value: this.simulateMetric(baseErrorRate, 1 / loadMultiplier), // Inverse relationship
      unit: '%',
      tags: {},
      threshold: { warning: 1, critical: 5 },
      status: 'ok'
    });

    // Resource utilization metrics
    metrics.push({
      id: `${baseId}-cpu`,
      name: 'cpu_utilization',
      region,
      service,
      timestamp,
      value: this.simulateMetric(50, loadMultiplier),
      unit: '%',
      tags: {},
      threshold: { warning: 70, critical: 90 },
      status: 'ok'
    });

    metrics.push({
      id: `${baseId}-memory`,
      name: 'memory_utilization',
      region,
      service,
      timestamp,
      value: this.simulateMetric(60, loadMultiplier),
      unit: '%',
      tags: {},
      threshold: { warning: 80, critical: 95 },
      status: 'ok'
    });

    // Database-specific metrics
    if (service.includes('database')) {
      metrics.push({
        id: `${baseId}-db-latency`,
        name: 'database_latency',
        region,
        service,
        timestamp,
        value: this.simulateMetric(25, loadMultiplier),
        unit: 'ms',
        tags: {},
        threshold: { warning: 50, critical: 100 },
        status: 'ok'
      });

      metrics.push({
        id: `${baseId}-db-connections`,
        name: 'database_connections',
        region,
        service,
        timestamp,
        value: this.simulateMetric(50, loadMultiplier),
        unit: 'count',
        tags: {},
        threshold: { warning: 80, critical: 95 },
        status: 'ok'
      });
    }

    // Cache-specific metrics
    if (service.includes('redis') || service.includes('cache')) {
      metrics.push({
        id: `${baseId}-cache-hit-rate`,
        name: 'cache_hit_rate',
        region,
        service,
        timestamp,
        value: this.simulateMetric(95, 1 / loadMultiplier),
        unit: '%',
        tags: {},
        threshold: { warning: 90, critical: 80 },
        status: 'ok'
      });

      metrics.push({
        id: `${baseId}-cache-memory`,
        name: 'cache_memory_usage',
        region,
        service,
        timestamp,
        value: this.simulateMetric(70, loadMultiplier),
        unit: '%',
        tags: {},
        threshold: { warning: 85, critical: 95 },
        status: 'ok'
      });
    }

    // Update metric status based on thresholds
    metrics.forEach(metric => {
      if (metric.value >= metric.threshold.critical) {
        metric.status = 'critical';
      } else if (metric.value >= metric.threshold.warning) {
        metric.status = 'warning';
      } else {
        metric.status = 'ok';
      }
    });

    return metrics;
  }

  private getBaseLatency(service: string, region: string): number {
    const serviceLatencies: Record<string, number> = {
      'api-gateway': 80,
      'auth-service': 60,
      'user-service': 70,
      'team-service': 65,
      'project-service': 75,
      'analytics-service': 120,
      'ai-service': 200,
      'webhook-service': 50
    };

    const regionMultipliers: Record<string, number> = {
      'us-east-1': 1.0,
      'us-west-2': 1.1,
      'eu-west-1': 1.2,
      'ap-southeast-1': 1.4,
      'ap-northeast-1': 1.3
    };

    return (serviceLatencies[service] || 100) * (regionMultipliers[region] || 1.0);
  }

  private getBaseThroughput(service: string, region: string): number {
    const serviceThroughputs: Record<string, number> = {
      'api-gateway': 2000,
      'auth-service': 800,
      'user-service': 1200,
      'team-service': 600,
      'project-service': 800,
      'analytics-service': 400,
      'ai-service': 100,
      'database-primary': 1500,
      'database-replica': 2000,
      'redis-cache': 5000,
      'file-storage': 300,
      'email-service': 50,
      'webhook-service': 200
    };

    const regionMultipliers: Record<string, number> = {
      'us-east-1': 1.5,
      'us-west-2': 1.2,
      'eu-west-1': 1.0,
      'ap-southeast-1': 0.8,
      'ap-northeast-1': 0.7
    };

    return (serviceThroughputs[service] || 500) * (regionMultipliers[region] || 1.0);
  }

  private getBaseErrorRate(service: string): number {
    const serviceErrorRates: Record<string, number> = {
      'api-gateway': 0.1,
      'auth-service': 0.05,
      'user-service': 0.08,
      'team-service': 0.06,
      'project-service': 0.07,
      'analytics-service': 0.15,
      'ai-service': 0.3,
      'database-primary': 0.02,
      'database-replica': 0.03,
      'redis-cache': 0.01,
      'file-storage': 0.1,
      'email-service': 0.2,
      'webhook-service': 0.12
    };

    return serviceErrorRates[service] || 0.1;
  }

  private simulateMetric(baseValue: number, multiplier: number): number {
    const variation = 0.8 + (Math.random() * 0.4); // ±20% variation
    return Math.max(0, baseValue * multiplier * variation);
  }

  // ==================== ALERT EVALUATION ====================

  private evaluateAlerts(): void {
    const timestamp = Date.now();
    
    for (const [key, metricHistory] of this.metrics) {
      if (metricHistory.length === 0) continue;
      
      const latestMetric = metricHistory[metricHistory.length - 1];
      
      // Check if metric violates thresholds
      if (latestMetric.status === 'critical' || latestMetric.status === 'warning') {
        const existingAlert = this.alerts.find(a => 
          a.metric === latestMetric.name && 
          a.region === latestMetric.region && 
          a.service === latestMetric.service && 
          a.status === 'active'
        );

        if (!existingAlert) {
          this.createAlert(latestMetric, timestamp);
        } else {
          this.updateAlert(existingAlert, latestMetric, timestamp);
        }
      } else {
        // Resolve any existing alerts for this metric
        const activeAlert = this.alerts.find(a => 
          a.metric === latestMetric.name && 
          a.region === latestMetric.region && 
          a.service === latestMetric.service && 
          a.status === 'active'
        );

        if (activeAlert) {
          this.resolveAlert(activeAlert, timestamp);
        }
      }
    }
  }

  private createAlert(metric: PerformanceMetric, timestamp: number): void {
    const severity = metric.status === 'critical' ? 'critical' : 
                    metric.value >= metric.threshold.critical * 0.8 ? 'high' : 'medium';

    const alert: PerformanceAlert = {
      id: `alert-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      metric: metric.name,
      region: metric.region,
      service: metric.service,
      severity,
      status: 'active',
      threshold: metric.status === 'critical' ? metric.threshold.critical : metric.threshold.warning,
      actualValue: metric.value,
      timestamp,
      message: this.generateAlertMessage(metric),
      escalationLevel: 0,
      notificationsSent: []
    };

    this.alerts.push(alert);
    this.sendAlertNotification(alert);
    
    console.log(`🚨 Alert created: ${alert.severity.toUpperCase()} - ${alert.message}`);
  }

  private updateAlert(alert: PerformanceAlert, metric: PerformanceMetric, timestamp: number): void {
    alert.actualValue = metric.value;
    
    // Escalate if threshold is exceeded for too long
    const alertAge = timestamp - alert.timestamp;
    const escalationThresholds = [300000, 900000, 1800000]; // 5min, 15min, 30min
    
    if (alertAge > escalationThresholds[alert.escalationLevel] && alert.escalationLevel < 3) {
      alert.escalationLevel++;
      alert.severity = this.escalateSeverity(alert.severity);
      this.sendEscalationNotification(alert);
    }
  }

  private resolveAlert(alert: PerformanceAlert, timestamp: number): void {
    alert.status = 'resolved';
    alert.resolvedAt = timestamp;
    
    this.sendResolutionNotification(alert);
    console.log(`✅ Alert resolved: ${alert.metric} in ${alert.region}/${alert.service}`);
  }

  private generateAlertMessage(metric: PerformanceMetric): string {
    const severity = metric.status === 'critical' ? 'CRITICAL' : 'WARNING';
    return `${severity}: ${metric.name} is ${metric.value.toFixed(2)}${metric.unit} in ${metric.region}/${metric.service} (threshold: ${metric.status === 'critical' ? metric.threshold.critical : metric.threshold.warning}${metric.unit})`;
  }

  private escalateSeverity(currentSeverity: string): 'low' | 'medium' | 'high' | 'critical' {
    const escalationMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'low': 'medium',
      'medium': 'high',
      'high': 'critical',
      'critical': 'critical'
    };
    return escalationMap[currentSeverity] || 'medium';
  }

  private sendAlertNotification(alert: PerformanceAlert): void {
    // In production, this would send notifications via email, Slack, PagerDuty, etc.
    const notification = `Alert: ${alert.message}`;
    alert.notificationsSent.push(`email:ops-team@zenith.engineer:${Date.now()}`);
    
    if (alert.severity === 'critical') {
      alert.notificationsSent.push(`pagerduty:critical:${Date.now()}`);
      alert.notificationsSent.push(`slack:alerts:${Date.now()}`);
    }
  }

  private sendEscalationNotification(alert: PerformanceAlert): void {
    const escalationNotification = `ESCALATION (Level ${alert.escalationLevel}): ${alert.message}`;
    alert.notificationsSent.push(`escalation:level-${alert.escalationLevel}:${Date.now()}`);
  }

  private sendResolutionNotification(alert: PerformanceAlert): void {
    const resolutionNotification = `RESOLVED: ${alert.message}`;
    alert.notificationsSent.push(`resolution:${Date.now()}`);
  }

  // ==================== SERVICE HEALTH UPDATE ====================

  private updateServiceHealth(): void {
    for (const [key, health] of this.serviceHealth) {
      const recentMetrics = this.getRecentServiceMetrics(health.service, health.region, 300000); // Last 5 minutes
      
      if (recentMetrics.length > 0) {
        this.calculateServiceHealth(health, recentMetrics);
      }
      
      health.lastCheckTime = Date.now();
    }
  }

  private getRecentServiceMetrics(service: string, region: string, timeWindow: number): PerformanceMetric[] {
    const cutoffTime = Date.now() - timeWindow;
    const recentMetrics: PerformanceMetric[] = [];
    
    for (const [key, metricHistory] of this.metrics) {
      if (key.includes(`${service}-${region}`)) {
        const recent = metricHistory.filter(m => m.timestamp > cutoffTime);
        recentMetrics.push(...recent);
      }
    }
    
    return recentMetrics;
  }

  private calculateServiceHealth(health: ServiceHealth, metrics: PerformanceMetric[]): void {
    // Update latency percentiles
    const latencyMetrics = metrics.filter(m => m.name.includes('latency'));
    if (latencyMetrics.length > 0) {
      const p50Metrics = latencyMetrics.filter(m => m.name.includes('p50'));
      const p95Metrics = latencyMetrics.filter(m => m.name.includes('p95'));
      const p99Metrics = latencyMetrics.filter(m => m.name.includes('p99'));
      
      if (p50Metrics.length > 0) {
        health.latency.p50 = p50Metrics.reduce((sum, m) => sum + m.value, 0) / p50Metrics.length;
      }
      if (p95Metrics.length > 0) {
        health.latency.p95 = p95Metrics.reduce((sum, m) => sum + m.value, 0) / p95Metrics.length;
      }
      if (p99Metrics.length > 0) {
        health.latency.p99 = p99Metrics.reduce((sum, m) => sum + m.value, 0) / p99Metrics.length;
      }
    }

    // Update throughput
    const throughputMetrics = metrics.filter(m => m.name === 'throughput');
    if (throughputMetrics.length > 0) {
      health.throughput = throughputMetrics.reduce((sum, m) => sum + m.value, 0) / throughputMetrics.length;
    }

    // Update error rate
    const errorRateMetrics = metrics.filter(m => m.name === 'error_rate');
    if (errorRateMetrics.length > 0) {
      health.errorRate = errorRateMetrics.reduce((sum, m) => sum + m.value, 0) / errorRateMetrics.length;
    }

    // Calculate availability (inverse of error rate)
    health.availability = Math.max(0, 100 - health.errorRate);

    // Update uptime (simplified calculation)
    const criticalAlerts = this.alerts.filter(a => 
      a.service === health.service && 
      a.region === health.region && 
      a.severity === 'critical' && 
      a.timestamp > Date.now() - 3600000 // Last hour
    );
    
    health.uptime = Math.max(0, 100 - (criticalAlerts.length * 5)); // Each critical alert reduces uptime by 5%

    // Determine overall health status
    if (health.errorRate > 5 || health.latency.p95 > 1000 || health.uptime < 95) {
      health.status = 'unhealthy';
    } else if (health.errorRate > 1 || health.latency.p95 > 500 || health.uptime < 99) {
      health.status = 'degraded';
    } else {
      health.status = 'healthy';
    }

    // Count recent incidents
    health.incidents = this.alerts.filter(a => 
      a.service === health.service && 
      a.region === health.region && 
      a.timestamp > Date.now() - 86400000 // Last 24 hours
    ).length;
  }

  // ==================== SLA COMPLIANCE ====================

  private calculateSLACompliance(): Record<string, number> {
    const compliance: Record<string, number> = {};
    
    for (const [metricName, target] of this.slaTargets) {
      const allMetrics: PerformanceMetric[] = [];
      
      // Collect all metrics for this type
      for (const [key, metricHistory] of this.metrics) {
        if (key.includes(metricName)) {
          const recentMetrics = metricHistory.filter(m => 
            m.timestamp > Date.now() - (target.timeWindow * 1000)
          );
          allMetrics.push(...recentMetrics);
        }
      }
      
      if (allMetrics.length === 0) {
        compliance[metricName] = 100;
        continue;
      }
      
      // Calculate compliance percentage
      let compliantMetrics = 0;
      
      for (const metric of allMetrics) {
        const isCompliant = this.isMetricCompliant(metric, target);
        if (isCompliant) {
          compliantMetrics++;
        }
      }
      
      compliance[metricName] = (compliantMetrics / allMetrics.length) * 100;
    }
    
    return compliance;
  }

  private isMetricCompliant(metric: PerformanceMetric, target: SLATarget): boolean {
    const tolerance = target.target * (target.tolerance / 100);
    
    switch (metric.name) {
      case 'api_latency_p95':
      case 'api_latency_p99':
      case 'database_latency':
        return metric.value <= target.target + tolerance;
      
      case 'availability':
      case 'cache_hit_rate':
        return metric.value >= target.target - tolerance;
      
      case 'error_rate':
        return metric.value <= target.target + tolerance;
      
      case 'throughput':
        return metric.value >= target.target - tolerance;
      
      default:
        return metric.value <= target.target + tolerance;
    }
  }

  // ==================== PUBLIC API ====================

  async getGlobalDashboard(): Promise<GlobalDashboard> {
    const allServices = Array.from(this.serviceHealth.values());
    const healthyServices = allServices.filter(s => s.status === 'healthy').length;
    const degradedServices = allServices.filter(s => s.status === 'degraded').length;
    const unhealthyServices = allServices.filter(s => s.status === 'unhealthy').length;

    const activeAlerts = this.alerts.filter(a => a.status === 'active');
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;

    const avgLatency = allServices.reduce((sum, s) => sum + s.latency.p95, 0) / allServices.length;
    const totalThroughput = allServices.reduce((sum, s) => sum + s.throughput, 0);
    const globalErrorRate = allServices.reduce((sum, s) => sum + s.errorRate, 0) / allServices.length;
    const overallHealth = (healthyServices / allServices.length) * 100;

    // Calculate region status
    const regionStatus: Record<string, RegionStatus> = {};
    const regions = Array.from(new Set(allServices.map(s => s.region)));
    
    for (const region of regions) {
      const regionServices = allServices.filter(s => s.region === region);
      const healthyRegionServices = regionServices.filter(s => s.status === 'healthy').length;
      const avgRegionLatency = regionServices.reduce((sum, s) => sum + s.latency.p95, 0) / regionServices.length;
      const regionThroughput = regionServices.reduce((sum, s) => sum + s.throughput, 0);
      const regionErrorRate = regionServices.reduce((sum, s) => sum + s.errorRate, 0) / regionServices.length;
      
      const recentRegionIncidents = this.alerts.filter(a => 
        a.region === region && 
        a.timestamp > Date.now() - 86400000
      );
      
      let status: 'operational' | 'degraded' | 'outage' = 'operational';
      if (healthyRegionServices / regionServices.length < 0.5) {
        status = 'outage';
      } else if (healthyRegionServices / regionServices.length < 0.8) {
        status = 'degraded';
      }
      
      let loadLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (avgRegionLatency > 500) {
        loadLevel = 'critical';
      } else if (avgRegionLatency > 300) {
        loadLevel = 'high';
      } else if (avgRegionLatency > 150) {
        loadLevel = 'medium';
      }
      
      regionStatus[region] = {
        region,
        status,
        services: regionServices.length,
        healthyServices: healthyRegionServices,
        avgLatency: Math.round(avgRegionLatency),
        throughput: Math.round(regionThroughput),
        errorRate: Math.round(regionErrorRate * 100) / 100,
        lastIncidentTime: recentRegionIncidents.length > 0 ? 
          Math.max(...recentRegionIncidents.map(i => i.timestamp)) : undefined,
        loadLevel
      };
    }

    // Get service status
    const serviceStatus: Record<string, ServiceHealth> = {};
    this.serviceHealth.forEach((health, key) => {
      serviceStatus[key] = { ...health };
    });

    // Get recent incidents
    const recentIncidents = this.alerts
      .filter(a => a.timestamp > Date.now() - 3600000) // Last hour
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    // Calculate SLA compliance
    const slaCompliance = this.calculateSLACompliance();

    return {
      overview: {
        totalServices: allServices.length,
        healthyServices,
        degradedServices,
        unhealthyServices,
        totalAlerts: activeAlerts.length,
        criticalAlerts,
        avgLatency: Math.round(avgLatency),
        totalThroughput: Math.round(totalThroughput),
        globalErrorRate: Math.round(globalErrorRate * 100) / 100,
        overallHealth: Math.round(overallHealth * 100) / 100
      },
      regionStatus,
      serviceStatus,
      recentIncidents,
      slaCompliance
    };
  }

  async getMetricHistory(
    metricName: string,
    service?: string,
    region?: string,
    timeRangeHours: number = 24
  ): Promise<PerformanceMetric[]> {
    const cutoffTime = Date.now() - (timeRangeHours * 60 * 60 * 1000);
    const metrics: PerformanceMetric[] = [];
    
    for (const [key, metricHistory] of this.metrics) {
      const keyParts = key.split('-');
      const keyService = keyParts[0];
      const keyRegion = keyParts[1];
      const keyMetric = keyParts.slice(2).join('-');
      
      if (keyMetric === metricName &&
          (!service || keyService === service) &&
          (!region || keyRegion === region)) {
        
        const recentMetrics = metricHistory.filter(m => m.timestamp > cutoffTime);
        metrics.push(...recentMetrics);
      }
    }
    
    return metrics.sort((a, b) => a.timestamp - b.timestamp);
  }

  async getAlerts(
    region?: string,
    service?: string,
    severity?: string,
    status?: string,
    hours: number = 24
  ): Promise<PerformanceAlert[]> {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    
    return this.alerts
      .filter(alert => {
        if (alert.timestamp < cutoffTime) return false;
        if (region && alert.region !== region) return false;
        if (service && alert.service !== service) return false;
        if (severity && alert.severity !== severity) return false;
        if (status && alert.status !== status) return false;
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && alert.status === 'active') {
      alert.status = 'acknowledged';
      alert.notificationsSent.push(`acknowledged:${acknowledgedBy}:${Date.now()}`);
      console.log(`✅ Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
      return true;
    }
    return false;
  }

  // ==================== CLEANUP ====================

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('🛑 Global performance monitoring stopped');
  }
}

export default GlobalPerformanceMonitor;