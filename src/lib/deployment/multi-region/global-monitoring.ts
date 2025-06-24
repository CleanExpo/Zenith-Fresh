// Global Monitoring and Health Check System for Multi-Region Deployment
// Provides real-time visibility across all regions with intelligent alerting

export interface RegionHealth {
  region: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  metrics: {
    availability: number; // percentage
    latency: number; // p99 in ms
    errorRate: number; // percentage
    throughput: number; // requests per second
    cpuUsage: number; // percentage
    memoryUsage: number; // percentage
  };
  lastCheck: Date;
  incidents: Incident[];
}

export interface Incident {
  id: string;
  type: 'outage' | 'degradation' | 'security' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  region: string;
  startTime: Date;
  endTime?: Date;
  impact: string;
  resolution?: string;
}

export interface GlobalMetrics {
  overallHealth: 'healthy' | 'partial-outage' | 'major-outage';
  availability: number; // weighted average
  activeRegions: number;
  totalRegions: number;
  globalRPS: number; // requests per second
  activeUsers: number;
  dataConsistency: number; // percentage
  replicationLag: Map<string, number>; // region -> lag in ms
}

export interface HealthCheckConfig {
  endpoint: string;
  method: 'GET' | 'POST';
  timeout: number; // ms
  expectedStatus: number;
  expectedResponse?: any;
  headers?: Record<string, string>;
}

export interface AlertConfig {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  duration: number; // seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  regions: string[];
  channels: AlertChannel[];
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'pagerduty' | 'webhook';
  target: string;
  config?: any;
}

export class GlobalMonitoringSystem {
  private regionHealth: Map<string, RegionHealth> = new Map();
  private alerts: Map<string, AlertConfig> = new Map();
  private incidents: Map<string, Incident> = new Map();
  private healthCheckConfigs: Map<string, HealthCheckConfig> = new Map();
  private metricsHistory: Map<string, any[]> = new Map();

  constructor() {
    this.initializeHealthChecks();
    this.configureAlerts();
    this.startMonitoring();
  }

  /**
   * Initialize health check configurations for all regions
   */
  private initializeHealthChecks(): void {
    const regions = [
      'us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1',
      'ap-northeast-1', 'sa-east-1', 'me-south-1', 'af-south-1'
    ];

    regions.forEach(region => {
      this.healthCheckConfigs.set(region, {
        endpoint: `https://${region}-api.zenith.engineer/health`,
        method: 'GET',
        timeout: 5000,
        expectedStatus: 200,
        expectedResponse: { status: 'healthy' },
        headers: {
          'X-Health-Check': 'true',
          'X-Region': region
        }
      });

      // Initialize region health
      this.regionHealth.set(region, {
        region,
        status: 'healthy',
        metrics: {
          availability: 100,
          latency: 0,
          errorRate: 0,
          throughput: 0,
          cpuUsage: 0,
          memoryUsage: 0
        },
        lastCheck: new Date(),
        incidents: []
      });
    });
  }

  /**
   * Configure global alerting rules
   */
  private configureAlerts(): void {
    const alerts: AlertConfig[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: 'errorRate > threshold',
        threshold: 5, // 5%
        duration: 300, // 5 minutes
        severity: 'high',
        regions: ['all'],
        channels: [
          { type: 'slack', target: '#alerts-critical' },
          { type: 'pagerduty', target: 'service-id-123' }
        ]
      },
      {
        id: 'region-down',
        name: 'Region Down',
        condition: 'status === unhealthy',
        threshold: 1,
        duration: 60, // 1 minute
        severity: 'critical',
        regions: ['all'],
        channels: [
          { type: 'pagerduty', target: 'service-id-critical' },
          { type: 'email', target: 'oncall@zenith.engineer' },
          { type: 'slack', target: '#incidents' }
        ]
      },
      {
        id: 'high-latency',
        name: 'High Latency',
        condition: 'latency > threshold',
        threshold: 1000, // 1 second
        duration: 300, // 5 minutes
        severity: 'medium',
        regions: ['all'],
        channels: [
          { type: 'slack', target: '#alerts-performance' }
        ]
      },
      {
        id: 'replication-lag',
        name: 'Database Replication Lag',
        condition: 'replicationLag > threshold',
        threshold: 5000, // 5 seconds
        duration: 180, // 3 minutes
        severity: 'high',
        regions: ['all'],
        channels: [
          { type: 'slack', target: '#alerts-database' },
          { type: 'email', target: 'database-team@zenith.engineer' }
        ]
      },
      {
        id: 'low-availability',
        name: 'Low Availability',
        condition: 'availability < threshold',
        threshold: 99.9, // Below 3 nines
        duration: 600, // 10 minutes
        severity: 'high',
        regions: ['all'],
        channels: [
          { type: 'slack', target: '#alerts-sla' },
          { type: 'email', target: 'management@zenith.engineer' }
        ]
      }
    ];

    alerts.forEach(alert => {
      this.alerts.set(alert.id, alert);
    });
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    // Health checks every 30 seconds
    setInterval(() => this.performHealthChecks(), 30000);

    // Metrics collection every 10 seconds
    setInterval(() => this.collectMetrics(), 10000);

    // Alert evaluation every minute
    setInterval(() => this.evaluateAlerts(), 60000);

    // Incident detection every 30 seconds
    setInterval(() => this.detectIncidents(), 30000);

    console.log('🔍 Global monitoring system started');
  }

  /**
   * Perform health checks across all regions
   */
  private async performHealthChecks(): Promise<void> {
    const healthPromises = Array.from(this.healthCheckConfigs.entries()).map(
      async ([region, config]) => {
        try {
          const startTime = Date.now();
          const response = await this.executeHealthCheck(config);
          const latency = Date.now() - startTime;

          const health = this.regionHealth.get(region)!;
          health.status = response.success ? 'healthy' : 'unhealthy';
          health.metrics.latency = latency;
          health.lastCheck = new Date();

          if (!response.success) {
            this.handleHealthCheckFailure(region, response.error);
          }
        } catch (error) {
          this.handleHealthCheckError(region, error);
        }
      }
    );

    await Promise.all(healthPromises);
  }

  /**
   * Collect detailed metrics from all regions
   */
  private async collectMetrics(): Promise<void> {
    for (const [region, health] of this.regionHealth) {
      try {
        const metrics = await this.fetchRegionMetrics(region);
        
        health.metrics = {
          ...health.metrics,
          ...metrics
        };

        // Store in history for trending
        this.addToMetricsHistory(region, metrics);
      } catch (error) {
        console.error(`Failed to collect metrics for ${region}:`, error);
      }
    }
  }

  /**
   * Evaluate alert conditions
   */
  private async evaluateAlerts(): Promise<void> {
    for (const [alertId, alert] of this.alerts) {
      const triggered = await this.checkAlertCondition(alert);
      
      if (triggered) {
        await this.triggerAlert(alert);
      }
    }
  }

  /**
   * Detect and track incidents
   */
  private async detectIncidents(): Promise<void> {
    for (const [region, health] of this.regionHealth) {
      if (health.status === 'unhealthy' || health.status === 'degraded') {
        const existingIncident = this.findActiveIncident(region);
        
        if (!existingIncident) {
          const incident = this.createIncident(region, health);
          this.incidents.set(incident.id, incident);
          health.incidents.push(incident);
          
          await this.notifyIncident(incident);
        }
      } else {
        // Check if we need to resolve any incidents
        const activeIncident = this.findActiveIncident(region);
        if (activeIncident) {
          await this.resolveIncident(activeIncident);
        }
      }
    }
  }

  /**
   * Get global system metrics
   */
  async getGlobalMetrics(): Promise<GlobalMetrics> {
    const healthyRegions = Array.from(this.regionHealth.values())
      .filter(h => h.status === 'healthy').length;
    
    const totalRegions = this.regionHealth.size;
    
    const weightedAvailability = this.calculateWeightedAvailability();
    const globalRPS = this.calculateGlobalRPS();
    const replicationLag = await this.measureReplicationLag();

    let overallHealth: 'healthy' | 'partial-outage' | 'major-outage' = 'healthy';
    
    if (healthyRegions < totalRegions * 0.5) {
      overallHealth = 'major-outage';
    } else if (healthyRegions < totalRegions) {
      overallHealth = 'partial-outage';
    }

    return {
      overallHealth,
      availability: weightedAvailability,
      activeRegions: healthyRegions,
      totalRegions,
      globalRPS,
      activeUsers: await this.getActiveUserCount(),
      dataConsistency: await this.checkDataConsistency(),
      replicationLag
    };
  }

  /**
   * Get detailed region health status
   */
  getRegionHealth(region: string): RegionHealth | undefined {
    return this.regionHealth.get(region);
  }

  /**
   * Get all active incidents
   */
  getActiveIncidents(): Incident[] {
    return Array.from(this.incidents.values())
      .filter(incident => !incident.endTime);
  }

  /**
   * Generate health report
   */
  async generateHealthReport(): Promise<{
    summary: string;
    globalMetrics: GlobalMetrics;
    regionStatus: Map<string, RegionHealth>;
    activeIncidents: Incident[];
    recommendations: string[];
  }> {
    const globalMetrics = await this.getGlobalMetrics();
    const activeIncidents = this.getActiveIncidents();
    const recommendations = this.generateRecommendations(globalMetrics, activeIncidents);

    const summary = this.generateSummary(globalMetrics, activeIncidents);

    return {
      summary,
      globalMetrics,
      regionStatus: new Map(this.regionHealth),
      activeIncidents,
      recommendations
    };
  }

  // Helper methods
  private async executeHealthCheck(config: HealthCheckConfig): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Simulate health check (in production, would make actual HTTP request)
    const isHealthy = Math.random() > 0.05; // 95% healthy
    
    return {
      success: isHealthy,
      error: isHealthy ? undefined : 'Connection timeout'
    };
  }

  private handleHealthCheckFailure(region: string, error?: string): void {
    console.error(`Health check failed for ${region}: ${error}`);
    
    const health = this.regionHealth.get(region)!;
    health.status = 'unhealthy';
  }

  private handleHealthCheckError(region: string, error: any): void {
    console.error(`Health check error for ${region}:`, error);
    
    const health = this.regionHealth.get(region)!;
    health.status = 'degraded';
  }

  private async fetchRegionMetrics(region: string): Promise<any> {
    // Simulate fetching metrics (in production, would query monitoring system)
    return {
      availability: 99.9 + Math.random() * 0.09,
      errorRate: Math.random() * 2,
      throughput: 1000 + Math.random() * 5000,
      cpuUsage: 20 + Math.random() * 60,
      memoryUsage: 30 + Math.random() * 50
    };
  }

  private addToMetricsHistory(region: string, metrics: any): void {
    if (!this.metricsHistory.has(region)) {
      this.metricsHistory.set(region, []);
    }
    
    const history = this.metricsHistory.get(region)!;
    history.push({
      timestamp: new Date(),
      ...metrics
    });
    
    // Keep only last 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metricsHistory.set(
      region,
      history.filter(m => m.timestamp > cutoff)
    );
  }

  private async checkAlertCondition(alert: AlertConfig): Promise<boolean> {
    // Check if alert condition is met
    for (const [region, health] of this.regionHealth) {
      if (alert.regions.includes('all') || alert.regions.includes(region)) {
        // Evaluate condition based on alert type
        switch (alert.id) {
          case 'high-error-rate':
            if (health.metrics.errorRate > alert.threshold) return true;
            break;
          case 'region-down':
            if (health.status === 'unhealthy') return true;
            break;
          case 'high-latency':
            if (health.metrics.latency > alert.threshold) return true;
            break;
          case 'low-availability':
            if (health.metrics.availability < alert.threshold) return true;
            break;
        }
      }
    }
    
    return false;
  }

  private async triggerAlert(alert: AlertConfig): Promise<void> {
    console.log(`🚨 Alert triggered: ${alert.name}`);
    
    for (const channel of alert.channels) {
      await this.sendAlert(channel, alert);
    }
  }

  private async sendAlert(channel: AlertChannel, alert: AlertConfig): Promise<void> {
    // Simulate sending alert
    console.log(`Sending ${alert.severity} alert to ${channel.type}: ${channel.target}`);
  }

  private findActiveIncident(region: string): Incident | undefined {
    return Array.from(this.incidents.values()).find(
      incident => incident.region === region && !incident.endTime
    );
  }

  private createIncident(region: string, health: RegionHealth): Incident {
    return {
      id: `inc-${Date.now()}-${region}`,
      type: 'outage',
      severity: health.status === 'unhealthy' ? 'critical' : 'high',
      region,
      startTime: new Date(),
      impact: `Region ${region} is experiencing ${health.status} status`
    };
  }

  private async notifyIncident(incident: Incident): Promise<void> {
    console.log(`📢 New incident created: ${incident.id} in ${incident.region}`);
    // Send notifications
  }

  private async resolveIncident(incident: Incident): Promise<void> {
    incident.endTime = new Date();
    incident.resolution = 'Automated recovery';
    console.log(`✅ Incident resolved: ${incident.id}`);
  }

  private calculateWeightedAvailability(): number {
    let totalWeight = 0;
    let weightedSum = 0;
    
    const weights = {
      'us-east-1': 30,
      'us-west-2': 25,
      'eu-west-1': 20,
      'ap-southeast-1': 10,
      'ap-northeast-1': 10,
      'sa-east-1': 3,
      'me-south-1': 1,
      'af-south-1': 1
    };
    
    for (const [region, health] of this.regionHealth) {
      const weight = weights[region as keyof typeof weights] || 1;
      totalWeight += weight;
      weightedSum += health.metrics.availability * weight;
    }
    
    return weightedSum / totalWeight;
  }

  private calculateGlobalRPS(): number {
    return Array.from(this.regionHealth.values())
      .reduce((sum, health) => sum + health.metrics.throughput, 0);
  }

  private async measureReplicationLag(): Promise<Map<string, number>> {
    const lagMap = new Map<string, number>();
    
    // Simulate measuring replication lag
    for (const region of this.regionHealth.keys()) {
      if (region !== 'us-east-1') { // Skip primary
        lagMap.set(region, Math.random() * 1000); // 0-1000ms
      }
    }
    
    return lagMap;
  }

  private async getActiveUserCount(): Promise<number> {
    // Simulate active user count
    return Math.floor(50000 + Math.random() * 50000);
  }

  private async checkDataConsistency(): Promise<number> {
    // Simulate data consistency check
    return 99.5 + Math.random() * 0.5;
  }

  private generateRecommendations(metrics: GlobalMetrics, incidents: Incident[]): string[] {
    const recommendations: string[] = [];
    
    if (metrics.availability < 99.9) {
      recommendations.push('Consider increasing redundancy in affected regions');
    }
    
    if (incidents.length > 2) {
      recommendations.push('Multiple incidents detected - review system architecture');
    }
    
    const highLagRegions = Array.from(metrics.replicationLag.entries())
      .filter(([_, lag]) => lag > 1000);
    
    if (highLagRegions.length > 0) {
      recommendations.push('High replication lag detected - optimize database queries');
    }
    
    return recommendations;
  }

  private generateSummary(metrics: GlobalMetrics, incidents: Incident[]): string {
    const status = metrics.overallHealth === 'healthy' 
      ? '✅ All systems operational'
      : metrics.overallHealth === 'partial-outage'
      ? '⚠️ Partial service disruption'
      : '🔴 Major service outage';
    
    return `${status} | ${metrics.activeRegions}/${metrics.totalRegions} regions active | ${metrics.availability.toFixed(2)}% availability | ${incidents.length} active incidents`;
  }
}

export default GlobalMonitoringSystem;