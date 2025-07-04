/**
 * Historical Analysis Tracker
 * Week 2 Feature: Track website analysis trends and provide historical insights
 */

import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis';

export interface HistoricalDataPoint {
  timestamp: string;
  overallScore: number;
  contentQualityScore: number;
  seoScore: number;
  uxScore: number;
  performanceScore: number;
  accessibilityScore: number;
  recommendationCount: number;
  issueCount: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
}

export interface TrendAnalysis {
  metric: string;
  trend: 'improving' | 'declining' | 'stable';
  changePercentage: number;
  confidence: number; // 0-1
  timeframe: string;
  insight: string;
  recommendation?: string;
}

export interface HistoricalInsights {
  url: string;
  timeframe: {
    start: string;
    end: string;
  };
  dataPoints: HistoricalDataPoint[];
  trends: TrendAnalysis[];
  milestones: {
    timestamp: string;
    type: 'improvement' | 'decline' | 'major_change';
    description: string;
    impact: number; // Score change
  }[];
  summary: {
    bestScore: { score: number; timestamp: string };
    worstScore: { score: number; timestamp: string };
    averageScore: number;
    volatility: number; // Standard deviation
    totalAnalyses: number;
  };
  predictions?: {
    nextMonth: {
      predictedScore: number;
      confidence: number;
      factors: string[];
    };
  };
}

class HistoricalAnalysisTracker {
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly MIN_DATA_POINTS = 3; // Minimum points for trend analysis

  /**
   * Store analysis result for historical tracking
   */
  async storeAnalysisResult(
    userId: string,
    url: string,
    analysisResult: any
  ): Promise<void> {
    try {
      // Normalize URL for consistent tracking
      const normalizedUrl = this.normalizeUrl(url);
      
      // Calculate individual scores
      const contentQualityScore = (analysisResult.contentQuality.readabilityScore + 
                                 analysisResult.contentQuality.engagementPotential) / 2;
      
      const seoScore = (analysisResult.seoInsights.technicalScore + 
                       analysisResult.seoInsights.contentScore) / 2;
      
      const uxScore = (analysisResult.userExperience.usabilityScore + 
                      analysisResult.userExperience.accessibilityScore + 
                      analysisResult.userExperience.mobileExperience) / 3;
      
      const performanceScore = this.calculatePerformanceScore(analysisResult.performanceInsights);
      
      // Count issues by severity
      const allIssues = [
        ...analysisResult.recommendations
      ];
      
      const issueCount = {
        critical: allIssues.filter(r => r.priority === 'critical').length,
        serious: allIssues.filter(r => r.priority === 'high').length,
        moderate: allIssues.filter(r => r.priority === 'medium').length,
        minor: allIssues.filter(r => r.priority === 'low').length
      };

      // Store in database
      await prisma.websiteAnalysis.create({
        data: {
          userId,
          url: normalizedUrl,
          analysisId: analysisResult.analysisId,
          overallScore: analysisResult.overallScore,
          contentQualityScore: Math.round(contentQualityScore),
          seoScore: Math.round(seoScore),
          uxScore: Math.round(uxScore),
          performanceScore: Math.round(performanceScore),
          accessibilityScore: analysisResult.userExperience.accessibilityScore,
          recommendationCount: analysisResult.recommendations.length,
          issueCount: JSON.stringify(issueCount),
          analysisData: JSON.stringify(analysisResult),
          createdAt: new Date()
        }
      });

      // Invalidate cache for this URL
      await this.invalidateCache(userId, normalizedUrl);

    } catch (error) {
      console.error('Failed to store analysis result for historical tracking:', error);
      // Don't throw - historical tracking shouldn't break the main flow
    }
  }

  /**
   * Get historical insights for a URL
   */
  async getHistoricalInsights(
    userId: string,
    url: string,
    timeframe: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<HistoricalInsights> {
    const normalizedUrl = this.normalizeUrl(url);
    const cacheKey = `historical:${userId}:${normalizedUrl}:${timeframe}`;

    try {
      // Check cache first
      const cached = await cache.get(cacheKey);
      if (cached) {
        return cached as HistoricalInsights;
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Fetch historical data
      const historicalData = await prisma.websiteAnalysis.findMany({
        where: {
          userId,
          url: normalizedUrl,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
        select: {
          createdAt: true,
          overallScore: true,
          contentQualityScore: true,
          seoScore: true,
          uxScore: true,
          performanceScore: true,
          accessibilityScore: true,
          recommendationCount: true,
          issueCount: true
        }
      });

      if (historicalData.length === 0) {
        throw new Error('No historical data found for this URL');
      }

      // Transform data points
      const dataPoints: HistoricalDataPoint[] = historicalData.map(data => ({
        timestamp: data.createdAt.toISOString(),
        overallScore: data.overallScore,
        contentQualityScore: data.contentQualityScore || 0,
        seoScore: data.seoScore || 0,
        uxScore: data.uxScore || 0,
        performanceScore: data.performanceScore || 0,
        accessibilityScore: data.accessibilityScore || 0,
        recommendationCount: data.recommendationCount,
        issueCount: typeof data.issueCount === 'string' 
          ? JSON.parse(data.issueCount)
          : { critical: 0, serious: 0, moderate: 0, minor: 0 }
      }));

      // Analyze trends
      const trends = this.analyzeTrends(dataPoints, timeframe);

      // Identify milestones
      const milestones = this.identifyMilestones(dataPoints);

      // Calculate summary statistics
      const summary = this.calculateSummary(dataPoints);

      // Generate predictions (simple linear regression)
      const predictions = this.generatePredictions(dataPoints);

      const insights: HistoricalInsights = {
        url: normalizedUrl,
        timeframe: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        dataPoints,
        trends,
        milestones,
        summary,
        predictions
      };

      // Cache results
      await cache.set(cacheKey, insights, this.CACHE_TTL);

      return insights;

    } catch (error) {
      console.error('Failed to get historical insights:', error);
      throw error;
    }
  }

  /**
   * Get trend comparison between multiple URLs
   */
  async compareUrlTrends(
    userId: string,
    urls: string[],
    timeframe: '7d' | '30d' | '90d' = '30d'
  ): Promise<{
    comparison: {
      url: string;
      currentScore: number;
      previousScore: number;
      trend: 'improving' | 'declining' | 'stable';
      changePercentage: number;
    }[];
    insights: string[];
  }> {
    try {
      const comparisons = await Promise.all(
        urls.map(async (url) => {
          try {
            const insights = await this.getHistoricalInsights(userId, url, timeframe);
            const dataPoints = insights.dataPoints;
            
            if (dataPoints.length < 2) {
              return {
                url,
                currentScore: dataPoints[0]?.overallScore || 0,
                previousScore: 0,
                trend: 'stable' as const,
                changePercentage: 0
              };
            }

            const currentScore = dataPoints[dataPoints.length - 1].overallScore;
            const previousScore = dataPoints[0].overallScore;
            const changePercentage = previousScore > 0 
              ? ((currentScore - previousScore) / previousScore) * 100 
              : 0;

            let trend: 'improving' | 'declining' | 'stable' = 'stable';
            if (Math.abs(changePercentage) > 5) {
              trend = changePercentage > 0 ? 'improving' : 'declining';
            }

            return {
              url,
              currentScore,
              previousScore,
              trend,
              changePercentage
            };
          } catch (error) {
            console.error(`Failed to get insights for ${url}:`, error);
            return {
              url,
              currentScore: 0,
              previousScore: 0,
              trend: 'stable' as const,
              changePercentage: 0
            };
          }
        })
      );

      // Generate insights based on comparison
      const insights = this.generateComparisonInsights(comparisons);

      return {
        comparison: comparisons,
        insights
      };

    } catch (error) {
      console.error('Failed to compare URL trends:', error);
      throw error;
    }
  }

  /**
   * Get analysis frequency statistics
   */
  async getAnalysisFrequency(
    userId: string,
    timeframe: '30d' | '90d' | '1y' = '30d'
  ): Promise<{
    totalAnalyses: number;
    uniqueUrls: number;
    averagePerDay: number;
    peakDay: { date: string; count: number };
    frequencyByUrl: { url: string; count: number }[];
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const analyses = await prisma.websiteAnalysis.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          url: true,
          createdAt: true
        }
      });

      const totalAnalyses = analyses.length;
      const uniqueUrls = new Set(analyses.map(a => a.url)).size;
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const averagePerDay = totalAnalyses / daysDiff;

      // Group by day to find peak
      const byDay: Record<string, number> = {};
      analyses.forEach(analysis => {
        const day = analysis.createdAt.toISOString().split('T')[0];
        byDay[day] = (byDay[day] || 0) + 1;
      });

      const peakDay = Object.entries(byDay)
        .reduce((max, [date, count]) => count > max.count ? { date, count } : max, 
                { date: '', count: 0 });

      // Group by URL
      const byUrl: Record<string, number> = {};
      analyses.forEach(analysis => {
        byUrl[analysis.url] = (byUrl[analysis.url] || 0) + 1;
      });

      const frequencyByUrl = Object.entries(byUrl)
        .map(([url, count]) => ({ url, count }))
        .sort((a, b) => b.count - a.count);

      return {
        totalAnalyses,
        uniqueUrls,
        averagePerDay,
        peakDay,
        frequencyByUrl
      };

    } catch (error) {
      console.error('Failed to get analysis frequency:', error);
      throw error;
    }
  }

  /**
   * Analyze trends in the data
   */
  private analyzeTrends(dataPoints: HistoricalDataPoint[], timeframe: string): TrendAnalysis[] {
    if (dataPoints.length < this.MIN_DATA_POINTS) {
      return [];
    }

    const trends: TrendAnalysis[] = [];
    const metrics = [
      'overallScore',
      'contentQualityScore',
      'seoScore',
      'uxScore',
      'performanceScore',
      'accessibilityScore'
    ] as const;

    metrics.forEach(metric => {
      const values = dataPoints.map(dp => dp[metric]);
      const trend = this.calculateTrend(values);
      
      trends.push({
        metric,
        trend: trend.direction,
        changePercentage: trend.changePercentage,
        confidence: trend.confidence,
        timeframe,
        insight: this.generateTrendInsight(metric, trend),
        recommendation: this.generateTrendRecommendation(metric, trend)
      });
    });

    return trends;
  }

  /**
   * Calculate trend direction and strength
   */
  private calculateTrend(values: number[]): {
    direction: 'improving' | 'declining' | 'stable';
    changePercentage: number;
    confidence: number;
  } {
    if (values.length < 2) {
      return { direction: 'stable', changePercentage: 0, confidence: 0 };
    }

    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const ssRes = y.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    
    const rSquared = ssTotal > 0 ? 1 - (ssRes / ssTotal) : 0;
    const confidence = Math.max(0, Math.min(1, rSquared));

    // Calculate percentage change
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const changePercentage = firstValue > 0 
      ? ((lastValue - firstValue) / firstValue) * 100 
      : 0;

    // Determine direction based on slope and significance
    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (Math.abs(changePercentage) > 5 && confidence > 0.3) {
      direction = slope > 0 ? 'improving' : 'declining';
    }

    return {
      direction,
      changePercentage,
      confidence
    };
  }

  /**
   * Identify significant milestones in the data
   */
  private identifyMilestones(dataPoints: HistoricalDataPoint[]): HistoricalInsights['milestones'] {
    const milestones: HistoricalInsights['milestones'] = [];

    if (dataPoints.length < 2) return milestones;

    // Find significant score changes (>10 points)
    for (let i = 1; i < dataPoints.length; i++) {
      const current = dataPoints[i];
      const previous = dataPoints[i - 1];
      const scoreDiff = current.overallScore - previous.overallScore;

      if (Math.abs(scoreDiff) >= 10) {
        milestones.push({
          timestamp: current.timestamp,
          type: scoreDiff > 0 ? 'improvement' : 'decline',
          description: scoreDiff > 0 
            ? `Significant improvement of ${scoreDiff} points`
            : `Significant decline of ${Math.abs(scoreDiff)} points`,
          impact: scoreDiff
        });
      }
    }

    // Find major changes (>20 points)
    for (let i = 1; i < dataPoints.length; i++) {
      const current = dataPoints[i];
      const previous = dataPoints[i - 1];
      const scoreDiff = current.overallScore - previous.overallScore;

      if (Math.abs(scoreDiff) >= 20) {
        milestones.push({
          timestamp: current.timestamp,
          type: 'major_change',
          description: `Major score change of ${scoreDiff} points`,
          impact: scoreDiff
        });
      }
    }

    return milestones.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(dataPoints: HistoricalDataPoint[]): HistoricalInsights['summary'] {
    const scores = dataPoints.map(dp => dp.overallScore);
    
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Calculate standard deviation for volatility
    const variance = scores.reduce((sum, score) => 
      sum + Math.pow(score - averageScore, 2), 0) / scores.length;
    const volatility = Math.sqrt(variance);

    const bestIndex = scores.indexOf(bestScore);
    const worstIndex = scores.indexOf(worstScore);

    return {
      bestScore: {
        score: bestScore,
        timestamp: dataPoints[bestIndex].timestamp
      },
      worstScore: {
        score: worstScore,
        timestamp: dataPoints[worstIndex].timestamp
      },
      averageScore: Math.round(averageScore),
      volatility: Math.round(volatility * 100) / 100,
      totalAnalyses: dataPoints.length
    };
  }

  /**
   * Generate simple predictions
   */
  private generatePredictions(dataPoints: HistoricalDataPoint[]): HistoricalInsights['predictions'] {
    if (dataPoints.length < 3) return undefined;

    const scores = dataPoints.map(dp => dp.overallScore);
    const trend = this.calculateTrend(scores);

    // Simple linear extrapolation
    const lastScore = scores[scores.length - 1];
    const monthlyChange = (trend.changePercentage / 100) * lastScore;
    const predictedScore = Math.max(0, Math.min(100, lastScore + monthlyChange));

    const factors = [];
    if (trend.direction === 'improving') {
      factors.push('Consistent improvement trend', 'Recent optimizations showing positive impact');
    } else if (trend.direction === 'declining') {
      factors.push('Declining performance trend', 'Need for immediate optimization efforts');
    } else {
      factors.push('Stable performance', 'Maintaining current optimization level');
    }

    return {
      nextMonth: {
        predictedScore: Math.round(predictedScore),
        confidence: trend.confidence,
        factors
      }
    };
  }

  /**
   * Generate trend insights
   */
  private generateTrendInsight(metric: string, trend: any): string {
    const metricName = metric.replace(/([A-Z])/g, ' $1').toLowerCase();
    
    if (trend.direction === 'improving') {
      return `${metricName} has been improving by ${trend.changePercentage.toFixed(1)}% with ${(trend.confidence * 100).toFixed(0)}% confidence`;
    } else if (trend.direction === 'declining') {
      return `${metricName} has been declining by ${Math.abs(trend.changePercentage).toFixed(1)}% with ${(trend.confidence * 100).toFixed(0)}% confidence`;
    } else {
      return `${metricName} has remained stable with minimal changes`;
    }
  }

  /**
   * Generate trend recommendations
   */
  private generateTrendRecommendation(metric: string, trend: any): string | undefined {
    if (trend.direction === 'declining' && trend.confidence > 0.5) {
      switch (metric) {
        case 'seoScore':
          return 'Focus on technical SEO improvements and content optimization';
        case 'performanceScore':
          return 'Optimize Core Web Vitals and reduce page load times';
        case 'accessibilityScore':
          return 'Implement WCAG guidelines and improve accessibility features';
        case 'uxScore':
          return 'Enhance user interface design and navigation clarity';
        default:
          return `Investigate factors causing ${metric} decline and implement corrective measures`;
      }
    }
    return undefined;
  }

  /**
   * Generate comparison insights
   */
  private generateComparisonInsights(comparisons: any[]): string[] {
    const insights = [];
    
    const improving = comparisons.filter(c => c.trend === 'improving').length;
    const declining = comparisons.filter(c => c.trend === 'declining').length;
    
    if (improving > declining) {
      insights.push(`${improving} out of ${comparisons.length} URLs are showing improvement`);
    } else if (declining > improving) {
      insights.push(`${declining} out of ${comparisons.length} URLs are declining and need attention`);
    }

    const bestPerformer = comparisons.reduce((best, current) => 
      current.currentScore > best.currentScore ? current : best
    );
    
    if (bestPerformer.currentScore > 0) {
      insights.push(`${bestPerformer.url} is your best performing URL with a score of ${bestPerformer.currentScore}`);
    }

    const biggestImprovement = comparisons.reduce((best, current) => 
      current.changePercentage > best.changePercentage ? current : best
    );
    
    if (biggestImprovement.changePercentage > 10) {
      insights.push(`${biggestImprovement.url} showed the biggest improvement with ${biggestImprovement.changePercentage.toFixed(1)}% increase`);
    }

    return insights;
  }

  /**
   * Calculate performance score from performance insights
   */
  private calculatePerformanceScore(performanceInsights: any): number {
    const { lcp, inp, cls } = performanceInsights.coreWebVitalsAnalysis;
    
    const lcpScore = lcp.current <= 2500 ? 100 : lcp.current <= 4000 ? 75 : 50;
    const inpScore = inp.current <= 200 ? 100 : inp.current <= 500 ? 75 : 50;
    const clsScore = cls.current <= 0.1 ? 100 : cls.current <= 0.25 ? 75 : 50;
    
    return Math.round((lcpScore + inpScore + clsScore) / 3);
  }

  /**
   * Normalize URL for consistent tracking
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove trailing slash, hash, and query params for consistency
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname.replace(/\/$/, '')}`;
    } catch {
      return url;
    }
  }

  /**
   * Invalidate cache for a URL
   */
  private async invalidateCache(userId: string, url: string): Promise<void> {
    const timeframes = ['7d', '30d', '90d', '1y'];
    await Promise.all(
      timeframes.map(timeframe => 
        cache.del(`historical:${userId}:${url}:${timeframe}`)
      )
    );
  }
}

export const historicalAnalysisTracker = new HistoricalAnalysisTracker();
export default historicalAnalysisTracker;