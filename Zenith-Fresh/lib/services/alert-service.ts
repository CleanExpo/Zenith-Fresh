import { PrismaClient } from '@prisma/client';
import { ScanResult } from './website-scanner';

const prisma = new PrismaClient();

export interface AlertThreshold {
  metric: string;
  operator: 'less_than' | 'greater_than' | 'equals' | 'not_equals';
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  thresholds: AlertThreshold[];
  enabled: boolean;
}

export class AlertService {
  private static instance: AlertService;
  
  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  // Default alert rules
  private defaultRules: AlertRule[] = [
    {
      id: 'performance_degradation',
      name: 'Performance Degradation',
      description: 'Alerts when performance scores drop significantly',
      enabled: true,
      thresholds: [
        {
          metric: 'performance_score',
          operator: 'less_than',
          value: 50,
          severity: 'high',
          description: 'Performance score is below 50',
        },
        {
          metric: 'performance_score',
          operator: 'less_than',
          value: 30,
          severity: 'critical',
          description: 'Performance score is critically low (below 30)',
        },
      ],
    },
    {
      id: 'accessibility_issues',
      name: 'Accessibility Issues',
      description: 'Alerts when accessibility scores are poor',
      enabled: true,
      thresholds: [
        {
          metric: 'accessibility_score',
          operator: 'less_than',
          value: 70,
          severity: 'medium',
          description: 'Accessibility score needs improvement',
        },
        {
          metric: 'accessibility_score',
          operator: 'less_than',
          value: 50,
          severity: 'high',
          description: 'Accessibility score is poor',
        },
      ],
    },
    {
      id: 'seo_problems',
      name: 'SEO Problems',
      description: 'Alerts when SEO scores are low',
      enabled: true,
      thresholds: [
        {
          metric: 'seo_score',
          operator: 'less_than',
          value: 80,
          severity: 'medium',
          description: 'SEO score could be improved',
        },
        {
          metric: 'seo_score',
          operator: 'less_than',
          value: 60,
          severity: 'high',
          description: 'SEO score is poor',
        },
      ],
    },
    {
      id: 'load_time_issues',
      name: 'Load Time Issues',
      description: 'Alerts when page load times are slow',
      enabled: true,
      thresholds: [
        {
          metric: 'first_contentful_paint',
          operator: 'greater_than',
          value: 3000,
          severity: 'medium',
          description: 'First Contentful Paint is slower than 3 seconds',
        },
        {
          metric: 'largest_contentful_paint',
          operator: 'greater_than',
          value: 4000,
          severity: 'high',
          description: 'Largest Contentful Paint is slower than 4 seconds',
        },
      ],
    },
    {
      id: 'error_detection',
      name: 'Error Detection',
      description: 'Alerts when errors are detected',
      enabled: true,
      thresholds: [
        {
          metric: 'error_count',
          operator: 'greater_than',
          value: 0,
          severity: 'medium',
          description: 'Errors detected on the page',
        },
        {
          metric: 'error_count',
          operator: 'greater_than',
          value: 5,
          severity: 'high',
          description: 'Multiple errors detected on the page',
        },
      ],
    },
  ];

  async checkThresholds(scanId: string, scanResult: ScanResult, customThresholds?: AlertThreshold[]): Promise<any[]> {
    try {
      // Get the scan record to access project and previous scans
      const scan = await prisma.websiteScan.findUnique({
        where: { id: scanId },
        include: {
          project: {
            include: {
              scheduledScans: true,
            },
          },
        },
      });

      if (!scan) {
        throw new Error('Scan not found');
      }

      // Get previous scan for comparison
      const previousScan = await prisma.websiteScan.findFirst({
        where: {
          projectId: scan.projectId,
          status: 'completed',
          id: { not: scanId },
        },
        orderBy: { completedAt: 'desc' },
      });

      // Use custom thresholds if provided, otherwise use defaults
      const thresholds = customThresholds || this.getDefaultThresholds();
      
      const alerts = [];

      // Check each threshold
      for (const threshold of thresholds) {
        const currentValue = this.extractMetricValue(scanResult, threshold.metric);
        const previousValue = previousScan ? this.extractMetricValue(previousScan.results as any, threshold.metric) : null;

        if (this.evaluateThreshold(currentValue, threshold.operator, threshold.value)) {
          // Create alert
          const alert = await prisma.scanAlert.create({
            data: {
              scanId,
              alertType: this.getAlertTypeFromMetric(threshold.metric),
              severity: threshold.severity,
              title: this.generateAlertTitle(threshold.metric, threshold.severity),
              description: threshold.description || this.generateAlertDescription(threshold.metric, currentValue, threshold.value, threshold.operator),
              currentValue: typeof currentValue === 'number' ? currentValue : null,
              previousValue: typeof previousValue === 'number' ? previousValue : null,
              threshold: threshold.value,
            },
          });

          alerts.push(alert);
        }
      }

      // Check for significant changes from previous scan
      if (previousScan) {
        const changeAlerts = await this.checkForSignificantChanges(scanId, scanResult, previousScan.results as any);
        alerts.push(...changeAlerts);
      }

      return alerts;

    } catch (error) {
      console.error('Error checking alert thresholds:', error);
      throw error;
    }
  }

  private getDefaultThresholds(): AlertThreshold[] {
    return this.defaultRules
      .filter(rule => rule.enabled)
      .flatMap(rule => rule.thresholds);
  }

  private extractMetricValue(scanResult: any, metric: string): number | null {
    const metricPaths: { [key: string]: string } = {
      'performance_score': 'performance.score',
      'accessibility_score': 'accessibility.score',
      'best_practices_score': 'bestPractices.score',
      'seo_score': 'seo.score',
      'first_contentful_paint': 'performance.metrics.firstContentfulPaint',
      'largest_contentful_paint': 'performance.metrics.largestContentfulPaint',
      'first_input_delay': 'performance.metrics.firstInputDelay',
      'cumulative_layout_shift': 'performance.metrics.cumulativeLayoutShift',
      'speed_index': 'performance.metrics.speedIndex',
      'total_blocking_time': 'performance.metrics.totalBlockingTime',
      'load_time': 'technical.loadTime',
      'page_size': 'technical.pageSize',
      'request_count': 'technical.requests',
      'error_count': 'technical.errors.length',
    };

    const path = metricPaths[metric];
    if (!path) return null;

    try {
      const value = path.split('.').reduce((obj, key) => obj?.[key], scanResult);
      return typeof value === 'number' ? value : null;
    } catch {
      return null;
    }
  }

  private evaluateThreshold(value: number | null, operator: string, threshold: number): boolean {
    if (value === null) return false;

    switch (operator) {
      case 'less_than':
        return value < threshold;
      case 'greater_than':
        return value > threshold;
      case 'equals':
        return value === threshold;
      case 'not_equals':
        return value !== threshold;
      default:
        return false;
    }
  }

  private getAlertTypeFromMetric(metric: string): string {
    const typeMap: { [key: string]: string } = {
      'performance_score': 'performance_drop',
      'accessibility_score': 'accessibility_issue',
      'best_practices_score': 'best_practices_issue',
      'seo_score': 'seo_issue',
      'first_contentful_paint': 'performance_drop',
      'largest_contentful_paint': 'performance_drop',
      'first_input_delay': 'performance_drop',
      'cumulative_layout_shift': 'performance_drop',
      'speed_index': 'performance_drop',
      'total_blocking_time': 'performance_drop',
      'load_time': 'performance_drop',
      'page_size': 'size_increase',
      'request_count': 'request_increase',
      'error_count': 'error_increase',
    };

    return typeMap[metric] || 'threshold_breach';
  }

  private generateAlertTitle(metric: string, severity: string): string {
    const titles: { [key: string]: string } = {
      'performance_score': 'Performance Score Alert',
      'accessibility_score': 'Accessibility Issue Detected',
      'best_practices_score': 'Best Practices Violation',
      'seo_score': 'SEO Score Alert',
      'first_contentful_paint': 'Slow First Contentful Paint',
      'largest_contentful_paint': 'Slow Largest Contentful Paint',
      'first_input_delay': 'High First Input Delay',
      'cumulative_layout_shift': 'Layout Shift Detected',
      'speed_index': 'Slow Speed Index',
      'total_blocking_time': 'High Blocking Time',
      'load_time': 'Slow Page Load',
      'page_size': 'Large Page Size',
      'request_count': 'High Request Count',
      'error_count': 'Errors Detected',
    };

    const severityPrefix = severity === 'critical' ? '🚨 Critical: ' : 
                          severity === 'high' ? '⚠️ High: ' : 
                          severity === 'medium' ? '⚡ Medium: ' : '💡 ';

    return severityPrefix + (titles[metric] || 'Threshold Breach');
  }

  private generateAlertDescription(metric: string, currentValue: number | null, threshold: number, operator: string): string {
    const metricNames: { [key: string]: string } = {
      'performance_score': 'Performance score',
      'accessibility_score': 'Accessibility score',
      'best_practices_score': 'Best practices score',
      'seo_score': 'SEO score',
      'first_contentful_paint': 'First Contentful Paint',
      'largest_contentful_paint': 'Largest Contentful Paint',
      'first_input_delay': 'First Input Delay',
      'cumulative_layout_shift': 'Cumulative Layout Shift',
      'speed_index': 'Speed Index',
      'total_blocking_time': 'Total Blocking Time',
      'load_time': 'Load time',
      'page_size': 'Page size',
      'request_count': 'Request count',
      'error_count': 'Error count',
    };

    const metricName = metricNames[metric] || metric;
    const operatorText = operator === 'less_than' ? 'is below' : 
                        operator === 'greater_than' ? 'exceeds' : 
                        operator === 'equals' ? 'equals' : 
                        'does not equal';

    const unit = metric.includes('score') ? '/100' : 
                metric.includes('paint') || metric.includes('delay') || metric.includes('time') ? 'ms' : 
                metric.includes('size') ? 'bytes' : '';

    return `${metricName} ${operatorText} threshold of ${threshold}${unit}. Current value: ${currentValue}${unit}`;
  }

  private async checkForSignificantChanges(scanId: string, currentResult: ScanResult, previousResult: any): Promise<any[]> {
    const alerts = [];
    const significantChangeThreshold = 20; // 20% change is considered significant

    const metricsToCheck = [
      { key: 'performance_score', path: 'performance.score', name: 'Performance Score' },
      { key: 'accessibility_score', path: 'accessibility.score', name: 'Accessibility Score' },
      { key: 'seo_score', path: 'seo.score', name: 'SEO Score' },
    ];

    for (const metric of metricsToCheck) {
      const currentValue = this.extractMetricValue(currentResult, metric.key);
      const previousValue = this.extractMetricValue(previousResult, metric.key);

      if (currentValue !== null && previousValue !== null) {
        const changePercent = Math.abs((currentValue - previousValue) / previousValue) * 100;
        
        if (changePercent >= significantChangeThreshold) {
          const isDecrease = currentValue < previousValue;
          const severity = changePercent >= 50 ? 'high' : 'medium';

          const alert = await prisma.scanAlert.create({
            data: {
              scanId,
              alertType: 'significant_change',
              severity,
              title: `${metric.name} ${isDecrease ? 'Decreased' : 'Increased'} Significantly`,
              description: `${metric.name} ${isDecrease ? 'dropped' : 'improved'} by ${changePercent.toFixed(1)}% (from ${previousValue} to ${currentValue})`,
              currentValue,
              previousValue,
              threshold: significantChangeThreshold,
            },
          });

          alerts.push(alert);
        }
      }
    }

    return alerts;
  }

  async getActiveAlertsForProject(projectId: string): Promise<any[]> {
    return prisma.scanAlert.findMany({
      where: {
        scan: {
          projectId,
        },
        isResolved: false,
      },
      include: {
        scan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async resolveAlert(alertId: string): Promise<void> {
    await prisma.scanAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
  }
}

export const alertService = AlertService.getInstance();