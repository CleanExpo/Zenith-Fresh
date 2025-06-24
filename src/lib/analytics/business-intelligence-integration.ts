/**
 * Business Intelligence Integration
 * 
 * Connects the Business Intelligence & Analytics Agent with the Zenith platform,
 * providing seamless integration with existing analytics infrastructure.
 */

import { businessIntelligenceAgent } from '@/lib/agents/business-intelligence-analytics-agent';
import { analyticsEngine } from '@/lib/analytics/analytics-enhanced';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

export class BusinessIntelligenceIntegration {
  private static instance: BusinessIntelligenceIntegration;
  private analyticsInterval: NodeJS.Timeout | null = null;
  private readonly ANALYTICS_INTERVAL = 300000; // 5 minutes

  private constructor() {}

  static getInstance(): BusinessIntelligenceIntegration {
    if (!BusinessIntelligenceIntegration.instance) {
      BusinessIntelligenceIntegration.instance = new BusinessIntelligenceIntegration();
    }
    return BusinessIntelligenceIntegration.instance;
  }

  /**
   * Initialize business intelligence monitoring
   */
  async initialize(): Promise<void> {
    console.log('🧠 Initializing Business Intelligence Integration...');

    try {
      // Run initial analysis
      await this.runAnalysis();

      // Set up periodic analysis
      this.analyticsInterval = setInterval(async () => {
        await this.runAnalysis();
      }, this.ANALYTICS_INTERVAL);

      // Set up real-time event listeners
      await this.setupEventListeners();

      console.log('✅ Business Intelligence Integration initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Business Intelligence Integration:', error);
      throw error;
    }
  }

  /**
   * Run comprehensive business analysis
   */
  private async runAnalysis(): Promise<void> {
    try {
      const results = await businessIntelligenceAgent.executeAnalysis();
      
      // Store results in cache for API access
      if (redis) {
        await redis.setex(
          'bi:latest:analysis',
          600, // 10 minutes
          JSON.stringify(results)
        );
      }

      // Process alerts
      if (results.alerts.length > 0) {
        await this.processAlerts(results.alerts);
      }

      // Track analysis execution
      await analyticsEngine.trackEvent({
        event: 'business_intelligence_analysis',
        properties: {
          category: 'business_intelligence',
          action: 'analysis_completed',
          label: 'automated',
          value: results.insights.length
        }
      });
    } catch (error) {
      console.error('Error running business analysis:', error);
    }
  }

  /**
   * Set up real-time event listeners
   */
  private async setupEventListeners(): Promise<void> {
    // TODO: Implement event listeners when analytics engine supports them
    // Revenue event listener
    // analyticsEngine.on('revenue:transaction', async (data: any) => {
    //   await this.handleRevenueEvent(data);
    // });

    // Customer event listener
    // analyticsEngine.on('customer:activity', async (data: any) => {
    //   await this.handleCustomerEvent(data);
    // });

    // System event listener
    // analyticsEngine.on('system:performance', async (data: any) => {
    //   await this.handleSystemEvent(data);
    // });
  }

  /**
   * Handle revenue-related events
   */
  private async handleRevenueEvent(data: any): Promise<void> {
    // Update revenue metrics in real-time
    const cacheKey = 'bi:metrics:revenue:realtime';
    const current = redis ? await redis.get(cacheKey) : null;
    
    const metrics = current ? JSON.parse(current) : { total: 0, count: 0 };
    metrics.total += data.amount;
    metrics.count += 1;
    
    if (redis) {
      await redis.setex(cacheKey, 3600, JSON.stringify(metrics));
    }
  }

  /**
   * Handle customer-related events
   */
  private async handleCustomerEvent(data: any): Promise<void> {
    // Update customer engagement metrics
    const cacheKey = `bi:customer:${data.userId}:activity`;
    if (redis) {
      await redis.zadd(cacheKey, Date.now(), JSON.stringify(data));
      await redis.expire(cacheKey, 86400); // 24 hours
    }
  }

  /**
   * Handle system performance events
   */
  private async handleSystemEvent(data: any): Promise<void> {
    // Monitor for anomalies
    if (data.responseTime > 1000 || data.errorRate > 0.05) {
      await this.createSystemAlert({
        type: 'performance',
        severity: data.errorRate > 0.1 ? 'high' : 'medium',
        message: `System performance degradation detected`,
        data
      });
    }
  }

  /**
   * Process and distribute alerts
   */
  private async processAlerts(alerts: any[]): Promise<void> {
    for (const alert of alerts) {
      // Store alert in database
      await prisma.auditLog.create({
        data: {
          userId: 'system',
          action: 'bi_alert',
          entityType: alert.metric || 'system',
          metadata: alert
        }
      });

      // Send high-severity alerts to notification system
      if (alert.severity === 'high') {
        await this.sendAlertNotification(alert);
      }
    }
  }

  /**
   * Create system alert
   */
  private async createSystemAlert(alert: any): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'system_alert',
        entityType: 'performance',
        metadata: alert
      }
    });
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: any): Promise<void> {
    // Integration with notification system
    console.log(`🚨 High-severity alert: ${alert.message}`);
    // In production, this would send emails, Slack messages, etc.
  }

  /**
   * Get latest analysis results
   */
  async getLatestAnalysis(): Promise<any> {
    const cached = redis ? await redis.get('bi:latest:analysis') : null;
    if (cached) {
      return JSON.parse(cached);
    }

    // Run analysis if no cached results
    const results = await businessIntelligenceAgent.executeAnalysis();
    if (redis) {
      await redis.setex(
        'bi:latest:analysis',
        600,
        JSON.stringify(results)
      );
    }

    return results;
  }

  /**
   * Get specific dashboard data
   */
  async getDashboard(dashboardId: string): Promise<any> {
    const analysis = await this.getLatestAnalysis();
    return analysis.dashboards.find((d: any) => d.id === dashboardId);
  }

  /**
   * Get business insights
   */
  async getInsights(filter?: { type?: string; impact?: string }): Promise<any[]> {
    const analysis = await this.getLatestAnalysis();
    let insights = analysis.insights;

    if (filter?.type) {
      insights = insights.filter((i: any) => i.type === filter.type);
    }

    if (filter?.impact) {
      insights = insights.filter((i: any) => i.impact === filter.impact);
    }

    return insights;
  }

  /**
   * Execute custom analytics query
   */
  async executeQuery(query: {
    metrics: string[];
    dimensions?: string[];
    filters?: any;
    timeRange?: { start: Date; end: Date };
  }): Promise<any> {
    // TODO: Implement custom analytics query when analytics engine supports it
    // For now, return mock data based on the query
    const results = {
      data: [],
      summary: analyticsEngine.getSummary(),
      timeRange: query.timeRange,
      metrics: query.metrics
    };

    return results;
  }

  /**
   * Generate custom report
   */
  async generateReport(config: {
    type: 'executive' | 'operational' | 'financial' | 'custom';
    format: 'json' | 'pdf' | 'excel';
    recipients?: string[];
  }): Promise<any> {
    const reports = await businessIntelligenceAgent.generateAutomatedReports();
    
    let report;
    switch (config.type) {
      case 'executive':
        report = reports.executiveReport;
        break;
      case 'operational':
        report = reports.operationalReport;
        break;
      case 'financial':
        report = reports.financialReport;
        break;
      default:
        report = await this.createCustomReport(config);
    }

    // Format report based on requested format
    if (config.format === 'pdf') {
      // In production, use PDF generation library
      report = { ...report, format: 'pdf' };
    } else if (config.format === 'excel') {
      // In production, use Excel generation library
      report = { ...report, format: 'excel' };
    }

    // Send to recipients if specified
    if (config.recipients && config.recipients.length > 0) {
      await this.distributeReport(report, config.recipients);
    }

    return report;
  }

  /**
   * Create custom report
   */
  private async createCustomReport(config: any): Promise<any> {
    const analysis = await this.getLatestAnalysis();
    
    return {
      title: 'Custom Business Intelligence Report',
      date: new Date(),
      data: analysis,
      config
    };
  }

  /**
   * Distribute report to recipients
   */
  private async distributeReport(report: any, recipients: string[]): Promise<void> {
    // In production, this would send emails with reports
    console.log(`📧 Distributing report to ${recipients.length} recipients`);
  }

  /**
   * Shutdown business intelligence monitoring
   */
  async shutdown(): Promise<void> {
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
      this.analyticsInterval = null;
    }
    
    console.log('🛑 Business Intelligence Integration shut down');
  }
}

// Export singleton instance
export const biIntegration = BusinessIntelligenceIntegration.getInstance();

// API helper functions
export const businessIntelligence = {
  /**
   * Get latest comprehensive analysis
   */
  getAnalysis: () => biIntegration.getLatestAnalysis(),

  /**
   * Get specific dashboard
   */
  getDashboard: (dashboardId: string) => biIntegration.getDashboard(dashboardId),

  /**
   * Get business insights
   */
  getInsights: (filter?: { type?: string; impact?: string }) => 
    biIntegration.getInsights(filter),

  /**
   * Execute custom query
   */
  query: (query: any) => biIntegration.executeQuery(query),

  /**
   * Generate report
   */
  generateReport: (config: any) => biIntegration.generateReport(config),

  /**
   * Initialize monitoring
   */
  initialize: () => biIntegration.initialize(),

  /**
   * Shutdown monitoring
   */
  shutdown: () => biIntegration.shutdown()
};