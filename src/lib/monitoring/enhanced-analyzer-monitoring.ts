/**
 * Enhanced Website Analyzer Performance Monitoring
 * Week 2 Feature: Advanced monitoring and analytics for the enhanced analyzer
 */

import { analytics } from '@/lib/analytics/analytics-enhanced';

export interface AnalysisPerformanceMetrics {
  analysisId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  url: string;
  analysisType: string;
  success: boolean;
  error?: string;
  metrics: {
    contentAnalysisTime: number;
    seoAnalysisTime: number;
    uxAnalysisTime: number;
    performanceAnalysisTime: number;
    aiProcessingTime: number;
    cacheHit: boolean;
    dataSize: number;
    recommendationCount: number;
    overallScore: number;
  };
  userContext: {
    userId?: string;
    userAgent?: string;
    featureFlags: string[];
    environment: string;
  };
}

export interface AnalysisUsageMetrics {
  timestamp: string;
  event: string;
  properties: {
    analysisId?: string;
    url?: string;
    userId?: string;
    featureUsed?: string;
    duration?: number;
    success?: boolean;
    error?: string;
    [key: string]: any;
  };
}

class EnhancedAnalyzerMonitor {
  private activeAnalyses: Map<string, AnalysisPerformanceMetrics> = new Map();
  private performanceBuffer: AnalysisPerformanceMetrics[] = [];
  private usageBuffer: AnalysisUsageMetrics[] = [];
  private isFlushingMetrics = false;

  /**
   * Start tracking an analysis session
   */
  startAnalysis(
    analysisId: string,
    url: string,
    analysisType: string,
    userContext: AnalysisPerformanceMetrics['userContext']
  ): void {
    const metrics: AnalysisPerformanceMetrics = {
      analysisId,
      startTime: Date.now(),
      url,
      analysisType,
      success: false,
      metrics: {
        contentAnalysisTime: 0,
        seoAnalysisTime: 0,
        uxAnalysisTime: 0,
        performanceAnalysisTime: 0,
        aiProcessingTime: 0,
        cacheHit: false,
        dataSize: 0,
        recommendationCount: 0,
        overallScore: 0
      },
      userContext
    };

    this.activeAnalyses.set(analysisId, metrics);

    // Track analysis start event
    this.trackUsageEvent('enhanced_analysis_started', {
      analysisId,
      url,
      analysisType,
      userId: userContext.userId,
      featureFlags: userContext.featureFlags.join(',')
    });
  }

  /**
   * Record timing for a specific analysis phase
   */
  recordPhaseTime(
    analysisId: string,
    phase: 'content' | 'seo' | 'ux' | 'performance' | 'ai',
    duration: number
  ): void {
    const metrics = this.activeAnalyses.get(analysisId);
    if (!metrics) return;

    switch (phase) {
      case 'content':
        metrics.metrics.contentAnalysisTime = duration;
        break;
      case 'seo':
        metrics.metrics.seoAnalysisTime = duration;
        break;
      case 'ux':
        metrics.metrics.uxAnalysisTime = duration;
        break;
      case 'performance':
        metrics.metrics.performanceAnalysisTime = duration;
        break;
      case 'ai':
        metrics.metrics.aiProcessingTime = duration;
        break;
    }

    // Track phase completion
    this.trackUsageEvent('analysis_phase_completed', {
      analysisId,
      phase,
      duration,
      userId: metrics.userContext.userId
    });
  }

  /**
   * Record cache hit/miss
   */
  recordCacheResult(analysisId: string, cacheHit: boolean): void {
    const metrics = this.activeAnalyses.get(analysisId);
    if (!metrics) return;

    metrics.metrics.cacheHit = cacheHit;

    this.trackUsageEvent('cache_result', {
      analysisId,
      cacheHit,
      userId: metrics.userContext.userId
    });
  }

  /**
   * Record analysis results
   */
  recordAnalysisResults(
    analysisId: string,
    overallScore: number,
    recommendationCount: number,
    dataSize: number
  ): void {
    const metrics = this.activeAnalyses.get(analysisId);
    if (!metrics) return;

    metrics.metrics.overallScore = overallScore;
    metrics.metrics.recommendationCount = recommendationCount;
    metrics.metrics.dataSize = dataSize;

    this.trackUsageEvent('analysis_results_generated', {
      analysisId,
      overallScore,
      recommendationCount,
      dataSize,
      userId: metrics.userContext.userId
    });
  }

  /**
   * Complete analysis tracking
   */
  completeAnalysis(analysisId: string, success: boolean, error?: string): void {
    const metrics = this.activeAnalyses.get(analysisId);
    if (!metrics) return;

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.success = success;
    if (error) metrics.error = error;

    // Add to performance buffer
    this.performanceBuffer.push({ ...metrics });

    // Remove from active analyses
    this.activeAnalyses.delete(analysisId);

    // Track completion event
    this.trackUsageEvent('enhanced_analysis_completed', {
      analysisId,
      duration: metrics.duration,
      success,
      error,
      overallScore: metrics.metrics.overallScore,
      cacheHit: metrics.metrics.cacheHit,
      userId: metrics.userContext.userId
    });

    // Flush metrics if buffer is getting large
    if (this.performanceBuffer.length >= 10) {
      this.flushMetrics();
    }
  }

  /**
   * Track feature usage within the analyzer
   */
  trackFeatureUsage(
    feature: string,
    userId?: string,
    additionalProperties?: Record<string, any>
  ): void {
    this.trackUsageEvent('enhanced_analyzer_feature_used', {
      featureUsed: feature,
      userId,
      ...additionalProperties
    });
  }

  /**
   * Track user interactions
   */
  trackUserInteraction(
    interaction: string,
    analysisId?: string,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    this.trackUsageEvent('enhanced_analyzer_interaction', {
      interaction,
      analysisId,
      userId,
      ...metadata
    });
  }

  /**
   * Track error events
   */
  trackError(
    error: string,
    context: string,
    analysisId?: string,
    userId?: string,
    additionalData?: Record<string, any>
  ): void {
    this.trackUsageEvent('enhanced_analyzer_error', {
      error,
      context,
      analysisId,
      userId,
      ...additionalData
    });

    // For critical errors, flush immediately
    if (context === 'critical') {
      this.flushMetrics();
    }
  }

  /**
   * Get performance summary for a time period
   */
  getPerformanceSummary(startTime: number, endTime: number): {
    totalAnalyses: number;
    successRate: number;
    averageDuration: number;
    cacheHitRate: number;
    averageScore: number;
    errorRate: number;
    topErrors: { error: string; count: number }[];
    performanceBreakdown: {
      content: number;
      seo: number;
      ux: number;
      performance: number;
      ai: number;
    };
  } {
    const relevantMetrics = this.performanceBuffer.filter(
      m => m.startTime >= startTime && m.startTime <= endTime
    );

    if (relevantMetrics.length === 0) {
      return {
        totalAnalyses: 0,
        successRate: 0,
        averageDuration: 0,
        cacheHitRate: 0,
        averageScore: 0,
        errorRate: 0,
        topErrors: [],
        performanceBreakdown: {
          content: 0,
          seo: 0,
          ux: 0,
          performance: 0,
          ai: 0
        }
      };
    }

    const totalAnalyses = relevantMetrics.length;
    const successfulAnalyses = relevantMetrics.filter(m => m.success);
    const successRate = (successfulAnalyses.length / totalAnalyses) * 100;
    
    const averageDuration = relevantMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / totalAnalyses;
    
    const cacheHits = relevantMetrics.filter(m => m.metrics.cacheHit).length;
    const cacheHitRate = (cacheHits / totalAnalyses) * 100;
    
    const averageScore = successfulAnalyses.reduce((sum, m) => sum + m.metrics.overallScore, 0) / successfulAnalyses.length;
    
    const errors = relevantMetrics.filter(m => !m.success);
    const errorRate = (errors.length / totalAnalyses) * 100;
    
    // Count error types
    const errorCounts: Record<string, number> = {};
    errors.forEach(e => {
      if (e.error) {
        errorCounts[e.error] = (errorCounts[e.error] || 0) + 1;
      }
    });
    
    const topErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Performance breakdown
    const performanceBreakdown = {
      content: successfulAnalyses.reduce((sum, m) => sum + m.metrics.contentAnalysisTime, 0) / successfulAnalyses.length,
      seo: successfulAnalyses.reduce((sum, m) => sum + m.metrics.seoAnalysisTime, 0) / successfulAnalyses.length,
      ux: successfulAnalyses.reduce((sum, m) => sum + m.metrics.uxAnalysisTime, 0) / successfulAnalyses.length,
      performance: successfulAnalyses.reduce((sum, m) => sum + m.metrics.performanceAnalysisTime, 0) / successfulAnalyses.length,
      ai: successfulAnalyses.reduce((sum, m) => sum + m.metrics.aiProcessingTime, 0) / successfulAnalyses.length
    };

    return {
      totalAnalyses,
      successRate,
      averageDuration,
      cacheHitRate,
      averageScore,
      errorRate,
      topErrors,
      performanceBreakdown
    };
  }

  /**
   * Get real-time health metrics
   */
  getHealthMetrics(): {
    activeAnalyses: number;
    queuedMetrics: number;
    systemHealth: 'healthy' | 'degraded' | 'critical';
    lastFlushTime?: number;
    averageResponseTime: number;
    errorRate: number;
  } {
    const now = Date.now();
    const recentMetrics = this.performanceBuffer.filter(
      m => m.startTime > now - 300000 // Last 5 minutes
    );

    const averageResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / recentMetrics.length
      : 0;

    const errorRate = recentMetrics.length > 0
      ? (recentMetrics.filter(m => !m.success).length / recentMetrics.length) * 100
      : 0;

    let systemHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (errorRate > 20 || averageResponseTime > 30000) {
      systemHealth = 'critical';
    } else if (errorRate > 10 || averageResponseTime > 15000) {
      systemHealth = 'degraded';
    }

    return {
      activeAnalyses: this.activeAnalyses.size,
      queuedMetrics: this.performanceBuffer.length,
      systemHealth,
      averageResponseTime,
      errorRate
    };
  }

  /**
   * Track usage event
   */
  private trackUsageEvent(event: string, properties: Record<string, any>): void {
    const usageMetric: AnalysisUsageMetrics = {
      timestamp: new Date().toISOString(),
      event,
      properties
    };

    this.usageBuffer.push(usageMetric);

    // Also send to analytics service
    analytics.trackEvent({
      event,
      properties: {
        component: 'enhanced_website_analyzer',
        ...properties
      }
    }).catch(error => {
      console.error('Failed to track analytics event:', error);
    });
  }

  /**
   * Flush metrics to persistent storage
   */
  private async flushMetrics(): Promise<void> {
    if (this.isFlushingMetrics || (this.performanceBuffer.length === 0 && this.usageBuffer.length === 0)) {
      return;
    }

    this.isFlushingMetrics = true;

    try {
      // Send performance metrics
      if (this.performanceBuffer.length > 0) {
        await this.sendPerformanceMetrics([...this.performanceBuffer]);
        this.performanceBuffer.length = 0; // Clear buffer
      }

      // Send usage metrics
      if (this.usageBuffer.length > 0) {
        await this.sendUsageMetrics([...this.usageBuffer]);
        this.usageBuffer.length = 0; // Clear buffer
      }

    } catch (error) {
      console.error('Failed to flush metrics:', error);
      // Don't clear buffers on error - retry later
    } finally {
      this.isFlushingMetrics = false;
    }
  }

  /**
   * Send performance metrics to monitoring service
   */
  private async sendPerformanceMetrics(metrics: AnalysisPerformanceMetrics[]): Promise<void> {
    try {
      // In a real implementation, this would send to a monitoring service like DataDog, New Relic, etc.
      console.log('Sending performance metrics:', {
        count: metrics.length,
        timeRange: {
          start: Math.min(...metrics.map(m => m.startTime)),
          end: Math.max(...metrics.map(m => m.endTime || m.startTime))
        }
      });

      // For now, just log the metrics
      if (process.env.NODE_ENV === 'development') {
        console.table(metrics.map(m => ({
          id: m.analysisId.substring(0, 8),
          duration: m.duration,
          success: m.success,
          score: m.metrics.overallScore,
          cache: m.metrics.cacheHit ? 'HIT' : 'MISS'
        })));
      }

    } catch (error) {
      console.error('Failed to send performance metrics:', error);
      throw error;
    }
  }

  /**
   * Send usage metrics to analytics service
   */
  private async sendUsageMetrics(metrics: AnalysisUsageMetrics[]): Promise<void> {
    try {
      // Batch send to analytics service
      const batchSize = 50;
      for (let i = 0; i < metrics.length; i += batchSize) {
        const batch = metrics.slice(i, i + batchSize);
        
        // Send each event in the batch
        await Promise.all(
          batch.map(metric => 
            analytics.trackEvent({
              event: metric.event,
              properties: {
                ...metric.properties,
                timestamp: metric.timestamp,
                source: 'enhanced_analyzer_monitor'
              }
            })
          )
        );
      }

    } catch (error) {
      console.error('Failed to send usage metrics:', error);
      throw error;
    }
  }

  /**
   * Schedule periodic metric flushing
   */
  startPeriodicFlush(intervalMs: number = 60000): void {
    setInterval(() => {
      this.flushMetrics();
    }, intervalMs);
  }

  /**
   * Get current monitoring statistics
   */
  getMonitoringStats(): {
    totalTrackedAnalyses: number;
    activeAnalyses: number;
    pendingMetrics: number;
    lastFlushTime?: number;
    bufferSizes: {
      performance: number;
      usage: number;
    };
  } {
    return {
      totalTrackedAnalyses: this.performanceBuffer.length,
      activeAnalyses: this.activeAnalyses.size,
      pendingMetrics: this.performanceBuffer.length + this.usageBuffer.length,
      bufferSizes: {
        performance: this.performanceBuffer.length,
        usage: this.usageBuffer.length
      }
    };
  }
}

// Singleton instance
export const enhancedAnalyzerMonitor = new EnhancedAnalyzerMonitor();

// Start periodic flushing in production
if (process.env.NODE_ENV === 'production') {
  enhancedAnalyzerMonitor.startPeriodicFlush(30000); // Flush every 30 seconds in production
} else {
  enhancedAnalyzerMonitor.startPeriodicFlush(60000); // Flush every minute in development
}

export default enhancedAnalyzerMonitor;