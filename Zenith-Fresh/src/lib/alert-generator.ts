import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

export interface Alert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  currentValue?: number;
  previousValue?: number;
  threshold?: number;
}

export interface AlertThresholds {
  scoreDropThreshold: number; // Percentage drop that triggers alert
  performanceDegradationThreshold: number; // Milliseconds increase
  coreWebVitalsThreshold: {
    lcp: number; // Seconds
    fid: number; // Milliseconds
    cls: number; // Score
  };
  criticalScoreThreshold: number; // Below this score is critical
}

export class AlertGenerator {
  private defaultThresholds: AlertThresholds = {
    scoreDropThreshold: 10, // 10% drop
    performanceDegradationThreshold: 1000, // 1 second increase
    coreWebVitalsThreshold: {
      lcp: 4.0, // 4 seconds
      fid: 300, // 300ms
      cls: 0.25, // 0.25 score
    },
    criticalScoreThreshold: 50, // Below 50 is critical
  };

  async generateAlerts(
    analysisId: string,
    projectId: string,
    url: string,
    currentResults: any,
    customThresholds?: Partial<AlertThresholds>
  ): Promise<Alert[]> {
    const thresholds = { ...this.defaultThresholds, ...customThresholds };
    const alerts: Alert[] = [];

    try {
      // Get previous analysis for comparison
      const previousAnalysis = await this.getPreviousAnalysis(projectId, url);

      // Check overall score degradation
      if (previousAnalysis) {
        alerts.push(...this.checkScoreDegradation(currentResults, previousAnalysis, thresholds));
        alerts.push(...this.checkPerformanceDegradation(currentResults, previousAnalysis, thresholds));
        alerts.push(...this.checkCoreWebVitalsDegradation(currentResults, previousAnalysis, thresholds));
      }

      // Check absolute thresholds (even without previous data)
      alerts.push(...this.checkAbsoluteThresholds(currentResults, thresholds));

      // Check for improvements (positive alerts)
      if (previousAnalysis) {
        alerts.push(...this.checkImprovements(currentResults, previousAnalysis));
      }

      // Check for new issues
      alerts.push(...this.checkNewIssues(currentResults));

      return alerts;

    } catch (error) {
      console.error('Failed to generate alerts:', error);
      return [];
    }
  }

  private async getPreviousAnalysis(projectId: string, url: string): Promise<any | null> {
    const threeDaysAgo = subDays(new Date(), 3);

    const previousAnalysis = await prisma.websiteAnalysis.findFirst({
      where: {
        projectId,
        url,
        status: 'completed',
        createdAt: {
          gte: threeDaysAgo,
        },
      },
      include: {
        performanceMetrics: true,
        coreWebVitals: true,
        technicalChecks: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: 1, // Skip the current analysis
    });

    return previousAnalysis;
  }

  private checkScoreDegradation(currentResults: any, previousAnalysis: any, thresholds: AlertThresholds): Alert[] {
    const alerts: Alert[] = [];

    const currentScore = currentResults.performance.overallScore;
    const previousScore = previousAnalysis.overallScore;

    if (previousScore && currentScore) {
      const scoreChange = ((currentScore - previousScore) / previousScore) * 100;

      if (scoreChange <= -thresholds.scoreDropThreshold) {
        const severity = scoreChange <= -25 ? 'critical' : scoreChange <= -15 ? 'high' : 'medium';
        
        alerts.push({
          type: 'score_drop',
          severity,
          category: 'performance',
          title: 'Overall Score Degradation',
          description: `Overall performance score dropped by ${Math.abs(Math.round(scoreChange))}% from ${previousScore} to ${currentScore}`,
          currentValue: currentScore,
          previousValue: previousScore,
          threshold: thresholds.scoreDropThreshold,
        });
      }
    }

    return alerts;
  }

  private checkPerformanceDegradation(currentResults: any, previousAnalysis: any, thresholds: AlertThresholds): Alert[] {
    const alerts: Alert[] = [];

    const currentLoadTime = currentResults.performance.pageLoadTime;
    const previousLoadTime = previousAnalysis.performanceMetrics?.pageLoadTime;

    if (previousLoadTime && currentLoadTime) {
      const loadTimeIncrease = currentLoadTime - previousLoadTime;

      if (loadTimeIncrease >= thresholds.performanceDegradationThreshold) {
        const severity = loadTimeIncrease >= 3000 ? 'critical' : loadTimeIncrease >= 2000 ? 'high' : 'medium';
        
        alerts.push({
          type: 'performance_degradation',
          severity,
          category: 'performance',
          title: 'Page Load Time Increase',
          description: `Page load time increased by ${Math.round(loadTimeIncrease)}ms from ${Math.round(previousLoadTime)}ms to ${Math.round(currentLoadTime)}ms`,
          currentValue: currentLoadTime,
          previousValue: previousLoadTime,
          threshold: thresholds.performanceDegradationThreshold,
        });
      }
    }

    return alerts;
  }

  private checkCoreWebVitalsDegradation(currentResults: any, previousAnalysis: any, thresholds: AlertThresholds): Alert[] {
    const alerts: Alert[] = [];

    // Check LCP degradation
    const currentLCP = currentResults.coreWebVitals.lcp;
    const previousLCP = previousAnalysis.coreWebVitals?.largestContentfulPaint;

    if (previousLCP && currentLCP && currentLCP > previousLCP) {
      const lcpIncrease = currentLCP - previousLCP;
      if (lcpIncrease >= 0.5) { // 500ms increase
        alerts.push({
          type: 'cwv_degradation',
          severity: currentLCP > thresholds.coreWebVitalsThreshold.lcp ? 'high' : 'medium',
          category: 'core-web-vitals',
          title: 'Largest Contentful Paint Degradation',
          description: `LCP increased by ${Math.round(lcpIncrease * 1000)}ms from ${Math.round(previousLCP * 1000)}ms to ${Math.round(currentLCP * 1000)}ms`,
          currentValue: currentLCP,
          previousValue: previousLCP,
          threshold: thresholds.coreWebVitalsThreshold.lcp,
        });
      }
    }

    // Check FID degradation
    const currentFID = currentResults.coreWebVitals.fid;
    const previousFID = previousAnalysis.coreWebVitals?.firstInputDelay;

    if (previousFID && currentFID && currentFID > previousFID) {
      const fidIncrease = currentFID - previousFID;
      if (fidIncrease >= 50) { // 50ms increase
        alerts.push({
          type: 'cwv_degradation',
          severity: currentFID > thresholds.coreWebVitalsThreshold.fid ? 'high' : 'medium',
          category: 'core-web-vitals',
          title: 'First Input Delay Degradation',
          description: `FID increased by ${Math.round(fidIncrease)}ms from ${Math.round(previousFID)}ms to ${Math.round(currentFID)}ms`,
          currentValue: currentFID,
          previousValue: previousFID,
          threshold: thresholds.coreWebVitalsThreshold.fid,
        });
      }
    }

    // Check CLS degradation
    const currentCLS = currentResults.coreWebVitals.cls;
    const previousCLS = previousAnalysis.coreWebVitals?.cumulativeLayoutShift;

    if (previousCLS && currentCLS && currentCLS > previousCLS) {
      const clsIncrease = currentCLS - previousCLS;
      if (clsIncrease >= 0.05) { // 0.05 increase
        alerts.push({
          type: 'cwv_degradation',
          severity: currentCLS > thresholds.coreWebVitalsThreshold.cls ? 'high' : 'medium',
          category: 'core-web-vitals',
          title: 'Cumulative Layout Shift Degradation',
          description: `CLS increased by ${Math.round(clsIncrease * 1000) / 1000} from ${Math.round(previousCLS * 1000) / 1000} to ${Math.round(currentCLS * 1000) / 1000}`,
          currentValue: currentCLS,
          previousValue: previousCLS,
          threshold: thresholds.coreWebVitalsThreshold.cls,
        });
      }
    }

    return alerts;
  }

  private checkAbsoluteThresholds(currentResults: any, thresholds: AlertThresholds): Alert[] {
    const alerts: Alert[] = [];

    // Check critical overall score
    const overallScore = currentResults.performance.overallScore;
    if (overallScore < thresholds.criticalScoreThreshold) {
      alerts.push({
        type: 'critical_score',
        severity: 'critical',
        category: 'performance',
        title: 'Critical Performance Score',
        description: `Overall performance score (${overallScore}) is below critical threshold (${thresholds.criticalScoreThreshold})`,
        currentValue: overallScore,
        threshold: thresholds.criticalScoreThreshold,
      });
    }

    // Check Core Web Vitals thresholds
    const lcp = currentResults.coreWebVitals.lcp;
    if (lcp > thresholds.coreWebVitalsThreshold.lcp) {
      alerts.push({
        type: 'cwv_threshold',
        severity: lcp > 6 ? 'critical' : 'high',
        category: 'core-web-vitals',
        title: 'Poor Largest Contentful Paint',
        description: `LCP (${Math.round(lcp * 1000)}ms) exceeds recommended threshold (${thresholds.coreWebVitalsThreshold.lcp * 1000}ms)`,
        currentValue: lcp,
        threshold: thresholds.coreWebVitalsThreshold.lcp,
      });
    }

    const fid = currentResults.coreWebVitals.fid;
    if (fid > thresholds.coreWebVitalsThreshold.fid) {
      alerts.push({
        type: 'cwv_threshold',
        severity: fid > 500 ? 'critical' : 'high',
        category: 'core-web-vitals',
        title: 'Poor First Input Delay',
        description: `FID (${Math.round(fid)}ms) exceeds recommended threshold (${thresholds.coreWebVitalsThreshold.fid}ms)`,
        currentValue: fid,
        threshold: thresholds.coreWebVitalsThreshold.fid,
      });
    }

    const cls = currentResults.coreWebVitals.cls;
    if (cls > thresholds.coreWebVitalsThreshold.cls) {
      alerts.push({
        type: 'cwv_threshold',
        severity: cls > 0.4 ? 'critical' : 'high',
        category: 'core-web-vitals',
        title: 'Poor Cumulative Layout Shift',
        description: `CLS (${Math.round(cls * 1000) / 1000}) exceeds recommended threshold (${thresholds.coreWebVitalsThreshold.cls})`,
        currentValue: cls,
        threshold: thresholds.coreWebVitalsThreshold.cls,
      });
    }

    // Check very slow load times
    const loadTime = currentResults.performance.pageLoadTime;
    if (loadTime > 5000) { // 5 seconds
      alerts.push({
        type: 'slow_loading',
        severity: loadTime > 10000 ? 'critical' : 'high',
        category: 'performance',
        title: 'Very Slow Page Load Time',
        description: `Page load time (${Math.round(loadTime)}ms) is significantly above recommended values`,
        currentValue: loadTime,
        threshold: 5000,
      });
    }

    return alerts;
  }

  private checkImprovements(currentResults: any, previousAnalysis: any): Alert[] {
    const alerts: Alert[] = [];

    const currentScore = currentResults.performance.overallScore;
    const previousScore = previousAnalysis.overallScore;

    if (previousScore && currentScore) {
      const scoreChange = ((currentScore - previousScore) / previousScore) * 100;

      if (scoreChange >= 15) { // 15% improvement
        alerts.push({
          type: 'improvement',
          severity: 'low',
          category: 'performance',
          title: 'Performance Improvement Detected',
          description: `Overall performance score improved by ${Math.round(scoreChange)}% from ${previousScore} to ${currentScore}`,
          currentValue: currentScore,
          previousValue: previousScore,
        });
      }
    }

    // Check Core Web Vitals improvements
    const currentLCP = currentResults.coreWebVitals.lcp;
    const previousLCP = previousAnalysis.coreWebVitals?.largestContentfulPaint;

    if (previousLCP && currentLCP && previousLCP > currentLCP) {
      const improvement = previousLCP - currentLCP;
      if (improvement >= 1.0) { // 1 second improvement
        alerts.push({
          type: 'improvement',
          severity: 'low',
          category: 'core-web-vitals',
          title: 'LCP Improvement',
          description: `Largest Contentful Paint improved by ${Math.round(improvement * 1000)}ms`,
          currentValue: currentLCP,
          previousValue: previousLCP,
        });
      }
    }

    return alerts;
  }

  private checkNewIssues(currentResults: any): Alert[] {
    const alerts: Alert[] = [];

    // Check for accessibility issues
    if (currentResults.technical.accessibilityScore < 70) {
      alerts.push({
        type: 'new_issue',
        severity: currentResults.technical.accessibilityScore < 50 ? 'high' : 'medium',
        category: 'accessibility',
        title: 'Accessibility Issues Detected',
        description: `Accessibility score (${currentResults.technical.accessibilityScore}) indicates potential issues`,
        currentValue: currentResults.technical.accessibilityScore,
        threshold: 70,
      });
    }

    // Check for SEO issues
    if (currentResults.technical.seoScore < 70) {
      alerts.push({
        type: 'new_issue',
        severity: currentResults.technical.seoScore < 50 ? 'high' : 'medium',
        category: 'seo',
        title: 'SEO Issues Detected',
        description: `SEO score (${currentResults.technical.seoScore}) indicates potential optimization opportunities`,
        currentValue: currentResults.technical.seoScore,
        threshold: 70,
      });
    }

    // Check for security issues
    if (currentResults.technical.securityScore < 70) {
      alerts.push({
        type: 'new_issue',
        severity: currentResults.technical.securityScore < 50 ? 'high' : 'medium',
        category: 'security',
        title: 'Security Issues Detected',
        description: `Security score (${currentResults.technical.securityScore}) indicates potential security concerns`,
        currentValue: currentResults.technical.securityScore,
        threshold: 70,
      });
    }

    // Check for missing SSL
    if (!currentResults.technical.hasSSL) {
      alerts.push({
        type: 'new_issue',
        severity: 'critical',
        category: 'security',
        title: 'SSL Certificate Missing',
        description: 'Website is not using HTTPS, which is critical for security and SEO',
      });
    }

    // Check for missing compression
    if (!currentResults.technical.hasGzipCompression && !currentResults.technical.hasBrotliCompression) {
      alerts.push({
        type: 'new_issue',
        severity: 'medium',
        category: 'performance',
        title: 'No Compression Detected',
        description: 'Website is not using Gzip or Brotli compression, which can significantly reduce load times',
      });
    }

    return alerts;
  }

  async getActiveAlerts(projectId: string, url?: string): Promise<any[]> {
    const whereClause: any = {
      websiteAnalysis: {
        projectId,
      },
      isResolved: false,
    };

    if (url) {
      whereClause.websiteAnalysis.url = url;
    }

    return await prisma.analysisAlert.findMany({
      where: whereClause,
      include: {
        websiteAnalysis: {
          select: {
            url: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async resolveAlert(alertId: string): Promise<void> {
    await prisma.analysisAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  async getAlertsSummary(projectId: string): Promise<any> {
    const alerts = await this.getActiveAlerts(projectId);

    const summary = {
      total: alerts.length,
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
      },
      byCategory: alerts.reduce((acc: any, alert) => {
        acc[alert.category] = (acc[alert.category] || 0) + 1;
        return acc;
      }, {}),
      recent: alerts.slice(0, 5), // Most recent 5 alerts
    };

    return summary;
  }
}