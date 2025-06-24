// src/lib/services/competitive-alerts-engine.ts
// Automated Gap Alerts and Competitive Monitoring System

import { PrismaClient } from '@prisma/client';
import { competitiveIntelligenceEngine } from './competitive-intelligence-engine';
import { redis } from '@/lib/redis';

const prisma = new PrismaClient();

export interface CompetitiveAlert {
  id: string;
  type: 'new_competitor' | 'ranking_change' | 'backlink_gain' | 'backlink_loss' | 'content_published' | 'traffic_change' | 'keyword_opportunity' | 'technical_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data: Record<string, any>;
  targetDomain: string;
  teamId: string;
  isRead: boolean;
  isActionable: boolean;
  createdAt: Date;
}

export interface MonitoringConfig {
  teamId: string;
  targetDomain: string;
  competitors: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  alertThreshold: number; // Percentage change to trigger alert
  trackKeywords: boolean;
  trackBacklinks: boolean;
  trackContent: boolean;
  trackTraffic: boolean;
  isActive: boolean;
}

/**
 * Competitive Alerts Engine - Automated monitoring and alerting
 */
export class CompetitiveAlertsEngine {
  private cachePrefix = 'competitive_alerts:';

  /**
   * Set up competitive monitoring for a team/domain
   */
  async setupMonitoring(config: Omit<MonitoringConfig, 'isActive'>): Promise<string> {
    try {
      // Create or update tracking configuration
      const tracking = await prisma.competitorTracking.upsert({
        where: {
          teamId_targetDomain_competitorDomain: {
            teamId: config.teamId,
            targetDomain: config.targetDomain,
            competitorDomain: config.competitors[0] || 'multiple' // Handle multiple competitors
          }
        },
        update: {
          frequency: config.frequency.toUpperCase() as any,
          alertThreshold: config.alertThreshold,
          trackKeywords: config.trackKeywords,
          trackBacklinks: config.trackBacklinks,
          trackContent: config.trackContent,
          trackTraffic: config.trackTraffic,
          isActive: true,
          nextCheck: this.calculateNextCheck(config.frequency)
        },
        create: {
          teamId: config.teamId,
          targetDomain: config.targetDomain,
          competitorDomain: config.competitors[0] || 'multiple',
          frequency: config.frequency.toUpperCase() as any,
          alertThreshold: config.alertThreshold,
          trackKeywords: config.trackKeywords,
          trackBacklinks: config.trackBacklinks,
          trackContent: config.trackContent,
          trackTraffic: config.trackTraffic,
          isActive: true,
          nextCheck: this.calculateNextCheck(config.frequency)
        }
      });

      // Store competitor list in cache for efficiency
      const cacheKey = `${this.cachePrefix}competitors:${config.teamId}:${config.targetDomain}`;
      if (redis) {
        await redis.setex(cacheKey, 86400, JSON.stringify(config.competitors));
      }

      // Schedule initial baseline data collection
      await this.collectBaselineMetrics(config.teamId, config.targetDomain, config.competitors);

      return tracking.id;
    } catch (error) {
      console.error('Error setting up competitive monitoring:', error);
      throw new Error('Failed to setup competitive monitoring');
    }
  }

  /**
   * Process all active monitoring configurations
   */
  async processMonitoringQueue(): Promise<void> {
    try {
      // Get all active tracking configurations that need checking
      const activeTracking = await prisma.competitorTracking.findMany({
        where: {
          isActive: true,
          nextCheck: {
            lte: new Date()
          }
        },
        include: {
          metrics: {
            orderBy: { recordedAt: 'desc' },
            take: 10 // Get recent metrics for comparison
          }
        }
      });

      console.log(`Processing ${activeTracking.length} monitoring configurations`);

      // Process each tracking configuration
      for (const tracking of activeTracking) {
        try {
          await this.processTrackingConfiguration(tracking);
          
          // Update next check time
          await prisma.competitorTracking.update({
            where: { id: tracking.id },
            data: {
              lastChecked: new Date(),
              nextCheck: this.calculateNextCheck(tracking.frequency.toLowerCase() as any)
            }
          });
        } catch (error) {
          console.error(`Error processing tracking ${tracking.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error processing monitoring queue:', error);
    }
  }

  /**
   * Process individual tracking configuration
   */
  private async processTrackingConfiguration(tracking: any): Promise<void> {
    const { teamId, targetDomain, competitorDomain } = tracking;
    
    // Get competitor list from cache or default
    let competitors: string[] = [];
    const cacheKey = `${this.cachePrefix}competitors:${teamId}:${targetDomain}`;
    
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        competitors = JSON.parse(cached);
      }
    }

    if (competitors.length === 0) {
      // Fallback: discover competitors
      const discoveredCompetitors = await competitiveIntelligenceEngine.discoverCompetitors(
        targetDomain,
        { limit: 5 }
      );
      competitors = discoveredCompetitors.map(c => c.domain);
    }

    // Collect current metrics
    const currentMetrics = await this.collectCurrentMetrics(targetDomain, competitors, tracking);
    
    // Compare with previous metrics and generate alerts
    await this.compareMetricsAndGenerateAlerts(tracking, currentMetrics);

    // Store current metrics for future comparison
    await this.storeMetrics(tracking.id, currentMetrics);
  }

  /**
   * Collect current metrics for comparison
   */
  private async collectCurrentMetrics(
    targetDomain: string, 
    competitors: string[], 
    tracking: any
  ): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {};

    try {
      if (tracking.trackKeywords) {
        // Analyze keyword gaps
        const keywordGaps = await competitiveIntelligenceEngine.analyzeKeywordGaps(
          targetDomain,
          competitors,
          { limit: 50 }
        );
        
        metrics.keywords = {
          totalGaps: keywordGaps.length,
          urgentGaps: keywordGaps.filter(k => k.priority === 'urgent').length,
          highGaps: keywordGaps.filter(k => k.priority === 'high').length,
          avgOpportunityScore: keywordGaps.reduce((sum, k) => sum + k.opportunityScore, 0) / keywordGaps.length || 0,
          potentialTraffic: keywordGaps.reduce((sum, k) => sum + (k.searchVolume * 0.1), 0)
        };
      }

      if (tracking.trackBacklinks) {
        // Analyze backlink gaps
        const backlinkGaps = await competitiveIntelligenceEngine.analyzeBacklinkGaps(
          targetDomain,
          competitors,
          { limit: 30 }
        );
        
        metrics.backlinks = {
          totalGaps: backlinkGaps.length,
          highAuthorityGaps: backlinkGaps.filter(b => b.domainAuthority >= 70).length,
          avgLinkValue: backlinkGaps.reduce((sum, b) => sum + b.linkValue, 0) / backlinkGaps.length || 0,
          readyForOutreach: backlinkGaps.filter(b => b.contactEmail && b.outreachDifficulty < 70).length
        };
      }

      if (tracking.trackContent) {
        // Analyze content gaps
        const contentGaps = await competitiveIntelligenceEngine.analyzeContentGaps(
          targetDomain,
          competitors,
          { limit: 20 }
        );
        
        metrics.content = {
          totalGaps: contentGaps.length,
          urgentGaps: contentGaps.filter(c => c.priority === 'urgent').length,
          avgOpportunityScore: contentGaps.reduce((sum, c) => sum + c.opportunityScore, 0) / contentGaps.length || 0,
          potentialTraffic: contentGaps.reduce((sum, c) => sum + c.estimatedTraffic, 0)
        };
      }

      // Add timestamp
      metrics.recordedAt = new Date().toISOString();
      
      return metrics;
    } catch (error) {
      console.error('Error collecting current metrics:', error);
      return { recordedAt: new Date().toISOString() };
    }
  }

  /**
   * Compare metrics and generate alerts for significant changes
   */
  private async compareMetricsAndGenerateAlerts(
    tracking: any, 
    currentMetrics: Record<string, any>
  ): Promise<void> {
    const previousMetrics = tracking.metrics[0]?.metadata;
    if (!previousMetrics) {
      // No previous data to compare
      return;
    }

    const alerts: Omit<CompetitiveAlert, 'id' | 'createdAt'>[] = [];

    // Check keyword changes
    if (currentMetrics.keywords && previousMetrics.keywords) {
      const keywordChanges = this.calculatePercentageChange(
        previousMetrics.keywords.totalGaps,
        currentMetrics.keywords.totalGaps
      );

      if (Math.abs(keywordChanges) >= tracking.alertThreshold) {
        alerts.push({
          type: 'keyword_opportunity',
          severity: Math.abs(keywordChanges) >= 25 ? 'high' : 'medium',
          title: keywordChanges > 0 ? 'New Keyword Opportunities Detected' : 'Keyword Gaps Closed',
          description: `${Math.abs(keywordChanges).toFixed(1)}% ${keywordChanges > 0 ? 'increase' : 'decrease'} in keyword gaps (${currentMetrics.keywords.totalGaps} total)`,
          data: {
            previousGaps: previousMetrics.keywords.totalGaps,
            currentGaps: currentMetrics.keywords.totalGaps,
            changePercent: keywordChanges,
            urgentGaps: currentMetrics.keywords.urgentGaps
          },
          targetDomain: tracking.targetDomain,
          teamId: tracking.teamId,
          isRead: false,
          isActionable: true
        });
      }
    }

    // Check backlink changes
    if (currentMetrics.backlinks && previousMetrics.backlinks) {
      const backlinkChanges = this.calculatePercentageChange(
        previousMetrics.backlinks.totalGaps,
        currentMetrics.backlinks.totalGaps
      );

      if (Math.abs(backlinkChanges) >= tracking.alertThreshold) {
        alerts.push({
          type: 'backlink_gain',
          severity: Math.abs(backlinkChanges) >= 20 ? 'high' : 'medium',
          title: backlinkChanges > 0 ? 'New Backlink Opportunities' : 'Backlink Gaps Closed',
          description: `${Math.abs(backlinkChanges).toFixed(1)}% ${backlinkChanges > 0 ? 'increase' : 'decrease'} in backlink opportunities (${currentMetrics.backlinks.totalGaps} total)`,
          data: {
            previousGaps: previousMetrics.backlinks.totalGaps,
            currentGaps: currentMetrics.backlinks.totalGaps,
            changePercent: backlinkChanges,
            highAuthorityGaps: currentMetrics.backlinks.highAuthorityGaps
          },
          targetDomain: tracking.targetDomain,
          teamId: tracking.teamId,
          isRead: false,
          isActionable: true
        });
      }
    }

    // Check content changes
    if (currentMetrics.content && previousMetrics.content) {
      const contentChanges = this.calculatePercentageChange(
        previousMetrics.content.totalGaps,
        currentMetrics.content.totalGaps
      );

      if (Math.abs(contentChanges) >= tracking.alertThreshold) {
        alerts.push({
          type: 'content_published',
          severity: Math.abs(contentChanges) >= 30 ? 'high' : 'medium',
          title: contentChanges > 0 ? 'New Content Opportunities' : 'Content Gaps Addressed',
          description: `${Math.abs(contentChanges).toFixed(1)}% ${contentChanges > 0 ? 'increase' : 'decrease'} in content gaps (${currentMetrics.content.totalGaps} total)`,
          data: {
            previousGaps: previousMetrics.content.totalGaps,
            currentGaps: currentMetrics.content.totalGaps,
            changePercent: contentChanges,
            urgentGaps: currentMetrics.content.urgentGaps
          },
          targetDomain: tracking.targetDomain,
          teamId: tracking.teamId,
          isRead: false,
          isActionable: true
        });
      }
    }

    // Store alerts in database
    for (const alert of alerts) {
      try {
        // Find the latest analysis for this domain/team
        const analysis = await prisma.competitiveAnalysis.findFirst({
          where: {
            targetDomain: tracking.targetDomain,
            teamId: tracking.teamId
          },
          orderBy: { createdAt: 'desc' }
        });

        if (analysis) {
          await prisma.competitiveAlert.create({
            data: {
              analysisId: analysis.id,
              teamId: alert.teamId,
              alertType: alert.type.toUpperCase() as any,
              severity: alert.severity.toUpperCase() as any,
              title: alert.title,
              description: alert.description,
              data: alert.data,
              isRead: alert.isRead,
              isActionable: alert.isActionable
            }
          });
        }
      } catch (error) {
        console.error('Error storing alert:', error);
      }
    }
  }

  /**
   * Store current metrics for future comparison
   */
  private async storeMetrics(trackingId: string, metrics: Record<string, any>): Promise<void> {
    try {
      // Store keyword metrics
      if (metrics.keywords) {
        await prisma.competitorMetric.create({
          data: {
            trackingId,
            metricType: 'KEYWORD_RANKINGS',
            value: metrics.keywords.totalGaps,
            metadata: metrics.keywords
          }
        });
      }

      // Store backlink metrics
      if (metrics.backlinks) {
        await prisma.competitorMetric.create({
          data: {
            trackingId,
            metricType: 'BACKLINK_COUNT',
            value: metrics.backlinks.totalGaps,
            metadata: metrics.backlinks
          }
        });
      }

      // Store content metrics
      if (metrics.content) {
        await prisma.competitorMetric.create({
          data: {
            trackingId,
            metricType: 'CONTENT_COUNT',
            value: metrics.content.totalGaps,
            metadata: metrics.content
          }
        });
      }
    } catch (error) {
      console.error('Error storing metrics:', error);
    }
  }

  /**
   * Collect baseline metrics for new monitoring setup
   */
  private async collectBaselineMetrics(
    teamId: string,
    targetDomain: string,
    competitors: string[]
  ): Promise<void> {
    try {
      // Find the tracking record
      const tracking = await prisma.competitorTracking.findFirst({
        where: {
          teamId,
          targetDomain,
          isActive: true
        }
      });

      if (!tracking) return;

      // Collect initial metrics
      const baselineMetrics = await this.collectCurrentMetrics(targetDomain, competitors, tracking);
      
      // Store baseline
      await this.storeMetrics(tracking.id, baselineMetrics);
      
      console.log(`Baseline metrics collected for ${targetDomain}`);
    } catch (error) {
      console.error('Error collecting baseline metrics:', error);
    }
  }

  /**
   * Get active alerts for a team
   */
  async getActiveAlerts(teamId: string, limit: number = 10): Promise<CompetitiveAlert[]> {
    try {
      const alerts = await prisma.competitiveAlert.findMany({
        where: {
          teamId,
          isRead: false
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      });

      return alerts.map(alert => ({
        id: alert.id,
        type: alert.alertType.toLowerCase() as any,
        severity: alert.severity.toLowerCase() as any,
        title: alert.title,
        description: alert.description,
        data: alert.data as Record<string, any>,
        targetDomain: '', // Would need to join with analysis
        teamId: alert.teamId,
        isRead: alert.isRead,
        isActionable: alert.isActionable,
        createdAt: alert.createdAt
      }));
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Mark alert as read
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    try {
      await prisma.competitiveAlert.update({
        where: { id: alertId },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  }

  /**
   * Disable monitoring for a domain
   */
  async disableMonitoring(teamId: string, targetDomain: string): Promise<void> {
    try {
      await prisma.competitorTracking.updateMany({
        where: {
          teamId,
          targetDomain
        },
        data: {
          isActive: false
        }
      });
    } catch (error) {
      console.error('Error disabling monitoring:', error);
    }
  }

  // Helper methods
  private calculateNextCheck(frequency: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  private calculatePercentageChange(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
}

// Export singleton instance
export const competitiveAlertsEngine = new CompetitiveAlertsEngine();