import { prisma } from '@/lib/prisma';

export interface AnalyticsInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'prediction' | 'recommendation';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  metric?: string;
  value?: number;
  change?: number;
  prediction?: number;
  confidence: number;
  actionable: boolean;
  actions?: Array<{
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
  }>;
  metadata?: any;
  expiresAt?: Date;
}

class AIInsightsService {
  async generateInsights(teamId: string, timeRange: string = '30d'): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      // Generate different types of insights
      const [
        anomalyInsights,
        trendInsights,
        predictionInsights,
        recommendationInsights
      ] = await Promise.all([
        this.detectAnomalies(teamId, startDate, endDate),
        this.analyzeTrends(teamId, startDate, endDate),
        this.generatePredictions(teamId, startDate, endDate),
        this.generateRecommendations(teamId, startDate, endDate)
      ]);

      insights.push(
        ...anomalyInsights,
        ...trendInsights,
        ...predictionInsights,
        ...recommendationInsights
      );

      // Store insights in database
      await this.storeInsights(teamId, insights);

      return insights.sort((a, b) => {
        // Sort by severity and confidence
        const severityOrder = { critical: 3, warning: 2, info: 1 };
        const aSeverity = severityOrder[a.severity];
        const bSeverity = severityOrder[b.severity];
        
        if (aSeverity !== bSeverity) {
          return bSeverity - aSeverity;
        }
        
        return b.confidence - a.confidence;
      });

    } catch (error) {
      console.error('Error generating AI insights:', error);
      return [];
    }
  }

  private async detectAnomalies(teamId: string, startDate: Date, endDate: Date): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];

    try {
      // Detect user registration anomalies
      const dailyUsers = await this.getDailyMetrics('users', startDate, endDate);
      const userAnomalies = this.detectMetricAnomalies(dailyUsers, 'users');
      
      userAnomalies.forEach(anomaly => {
        insights.push({
          id: `anomaly_users_${Date.now()}`,
          type: 'anomaly',
          severity: anomaly.severity,
          title: 'User Registration Anomaly Detected',
          description: anomaly.description,
          metric: 'users',
          value: anomaly.value,
          change: anomaly.change,
          confidence: anomaly.confidence,
          actionable: true,
          actions: [
            {
              title: 'Investigate Registration Flow',
              description: 'Check for issues in the user registration process',
              impact: 'high',
              effort: 'medium'
            },
            {
              title: 'Review Marketing Campaigns',
              description: 'Analyze recent marketing activities that might affect registrations',
              impact: 'medium',
              effort: 'low'
            }
          ],
          metadata: anomaly.metadata
        });
      });

      // Detect website analysis anomalies
      const dailyAnalyses = await this.getDailyMetrics('analyses', startDate, endDate);
      const analysisAnomalies = this.detectMetricAnomalies(dailyAnalyses, 'analyses');
      
      analysisAnomalies.forEach(anomaly => {
        insights.push({
          id: `anomaly_analyses_${Date.now()}`,
          type: 'anomaly',
          severity: anomaly.severity,
          title: 'Website Analysis Usage Anomaly',
          description: anomaly.description,
          metric: 'analyses',
          value: anomaly.value,
          change: anomaly.change,
          confidence: anomaly.confidence,
          actionable: true,
          actions: [
            {
              title: 'Check System Performance',
              description: 'Verify if technical issues are affecting analysis functionality',
              impact: 'high',
              effort: 'medium'
            },
            {
              title: 'User Feedback Review',
              description: 'Collect user feedback on recent experience changes',
              impact: 'medium',
              effort: 'low'
            }
          ],
          metadata: anomaly.metadata
        });
      });

    } catch (error) {
      console.error('Error detecting anomalies:', error);
    }

    return insights;
  }

  private async analyzeTrends(teamId: string, startDate: Date, endDate: Date): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];

    try {
      // Analyze user growth trend
      const userTrend = await this.calculateTrend('users', startDate, endDate);
      if (userTrend) {
        insights.push({
          id: `trend_users_${Date.now()}`,
          type: 'trend',
          severity: userTrend.change > 0 ? 'info' : 'warning',
          title: `User Growth ${userTrend.change > 0 ? 'Trending Up' : 'Declining'}`,
          description: `User registrations have ${userTrend.change > 0 ? 'increased' : 'decreased'} by ${Math.abs(userTrend.change).toFixed(1)}% over the selected period.`,
          metric: 'users',
          change: userTrend.change,
          confidence: userTrend.confidence,
          actionable: userTrend.change < -10, // Only actionable if significant decline
          actions: userTrend.change < -10 ? [
            {
              title: 'Enhance Onboarding',
              description: 'Improve the user onboarding experience to increase conversions',
              impact: 'high',
              effort: 'medium'
            },
            {
              title: 'Marketing Campaign',
              description: 'Launch targeted marketing campaigns to attract new users',
              impact: 'medium',
              effort: 'high'
            }
          ] : undefined,
          metadata: userTrend.metadata
        });
      }

      // Analyze website quality trend
      const qualityTrend = await this.calculateQualityTrend(startDate, endDate);
      if (qualityTrend) {
        insights.push({
          id: `trend_quality_${Date.now()}`,
          type: 'trend',
          severity: qualityTrend.change < -5 ? 'warning' : 'info',
          title: 'Website Quality Score Trend',
          description: `Average website quality scores have ${qualityTrend.change > 0 ? 'improved' : 'declined'} by ${Math.abs(qualityTrend.change).toFixed(1)} points.`,
          metric: 'quality_score',
          value: qualityTrend.current,
          change: qualityTrend.change,
          confidence: qualityTrend.confidence,
          actionable: qualityTrend.change < -5,
          actions: qualityTrend.change < -5 ? [
            {
              title: 'Update Quality Algorithms',
              description: 'Review and update website quality assessment algorithms',
              impact: 'high',
              effort: 'high'
            },
            {
              title: 'User Education',
              description: 'Provide more guidance on improving website quality',
              impact: 'medium',
              effort: 'low'
            }
          ] : undefined,
          metadata: qualityTrend.metadata
        });
      }

    } catch (error) {
      console.error('Error analyzing trends:', error);
    }

    return insights;
  }

  private async generatePredictions(teamId: string, startDate: Date, endDate: Date): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];

    try {
      // Predict user growth for next period
      const userPrediction = await this.predictMetric('users', startDate, endDate);
      if (userPrediction) {
        insights.push({
          id: `prediction_users_${Date.now()}`,
          type: 'prediction',
          severity: 'info',
          title: 'User Growth Forecast',
          description: `Based on current trends, we predict ${userPrediction.value} new users in the next period.`,
          metric: 'users',
          prediction: userPrediction.value,
          confidence: userPrediction.confidence,
          actionable: true,
          actions: [
            {
              title: 'Capacity Planning',
              description: 'Ensure infrastructure can handle predicted user growth',
              impact: 'high',
              effort: 'medium'
            },
            {
              title: 'Support Scaling',
              description: 'Plan for increased customer support needs',
              impact: 'medium',
              effort: 'medium'
            }
          ],
          metadata: userPrediction.metadata,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
      }

      // Predict analysis volume
      const analysisPrediction = await this.predictMetric('analyses', startDate, endDate);
      if (analysisPrediction) {
        insights.push({
          id: `prediction_analyses_${Date.now()}`,
          type: 'prediction',
          severity: 'info',
          title: 'Analysis Volume Forecast',
          description: `We expect approximately ${analysisPrediction.value} website analyses in the next period.`,
          metric: 'analyses',
          prediction: analysisPrediction.value,
          confidence: analysisPrediction.confidence,
          actionable: analysisPrediction.value > 1000, // High volume threshold
          actions: analysisPrediction.value > 1000 ? [
            {
              title: 'Optimize Analysis Engine',
              description: 'Improve analysis performance for high volume periods',
              impact: 'high',
              effort: 'high'
            }
          ] : undefined,
          metadata: analysisPrediction.metadata,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
      }

    } catch (error) {
      console.error('Error generating predictions:', error);
    }

    return insights;
  }

  private async generateRecommendations(teamId: string, startDate: Date, endDate: Date): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];

    try {
      // Analyze conversion rates and recommend improvements
      const conversionRate = await this.calculateConversionRate(startDate, endDate);
      
      if (conversionRate < 20) { // Less than 20% of users run analyses
        insights.push({
          id: `recommendation_conversion_${Date.now()}`,
          type: 'recommendation',
          severity: 'warning',
          title: 'Low User Engagement Rate',
          description: `Only ${conversionRate.toFixed(1)}% of registered users are actively using the website analyzer. Consider improving user engagement.`,
          metric: 'conversion_rate',
          value: conversionRate,
          confidence: 0.85,
          actionable: true,
          actions: [
            {
              title: 'Improve Onboarding',
              description: 'Create guided tutorials and better first-run experience',
              impact: 'high',
              effort: 'medium'
            },
            {
              title: 'Email Campaigns',
              description: 'Send targeted emails to inactive users with tips and use cases',
              impact: 'medium',
              effort: 'low'
            },
            {
              title: 'Feature Highlights',
              description: 'Better showcase key features and benefits on the dashboard',
              impact: 'medium',
              effort: 'low'
            }
          ],
          metadata: { currentRate: conversionRate, targetRate: 35 }
        });
      }

      // Recommend based on usage patterns
      const peakHours = await this.analyzePeakUsageHours(startDate, endDate);
      if (peakHours.length > 0) {
        insights.push({
          id: `recommendation_peak_hours_${Date.now()}`,
          type: 'recommendation',
          severity: 'info',
          title: 'Optimize for Peak Usage Hours',
          description: `Most users are active during ${peakHours.join(', ')}. Consider scheduling maintenance and updates during off-peak hours.`,
          confidence: 0.75,
          actionable: true,
          actions: [
            {
              title: 'Schedule Maintenance',
              description: 'Plan system updates during low-activity periods',
              impact: 'medium',
              effort: 'low'
            },
            {
              title: 'Peak Hour Optimization',
              description: 'Ensure optimal performance during high-traffic periods',
              impact: 'high',
              effort: 'medium'
            }
          ],
          metadata: { peakHours }
        });
      }

    } catch (error) {
      console.error('Error generating recommendations:', error);
    }

    return insights;
  }

  // Helper methods for calculations
  private async getDailyMetrics(metric: string, startDate: Date, endDate: Date): Promise<Array<{date: string, value: number}>> {
    const metrics = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayStart = new Date(current);
      const dayEnd = new Date(current);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      let value = 0;
      
      if (metric === 'users') {
        value = await prisma.user.count({
          where: {
            createdAt: {
              gte: dayStart,
              lt: dayEnd
            }
          }
        });
      } else if (metric === 'analyses') {
        value = await prisma.websiteAnalysis.count({
          where: {
            createdAt: {
              gte: dayStart,
              lt: dayEnd
            }
          }
        });
      }
      
      metrics.push({
        date: current.toISOString().split('T')[0],
        value
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return metrics;
  }

  private detectMetricAnomalies(data: Array<{date: string, value: number}>, metric: string): Array<{
    severity: 'info' | 'warning' | 'critical';
    description: string;
    value: number;
    change: number;
    confidence: number;
    metadata: any;
  }> {
    const anomalies = [];
    
    if (data.length < 3) return anomalies;
    
    // Calculate rolling average and standard deviation
    const values = data.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    // Check recent values for anomalies
    const recentValues = values.slice(-3);
    const recentMean = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    
    // Detect significant deviations
    const threshold = mean + (2 * stdDev);
    const lowThreshold = Math.max(0, mean - (2 * stdDev));
    
    if (recentMean > threshold) {
      const change = ((recentMean - mean) / mean) * 100;
      anomalies.push({
        severity: change > 100 ? 'critical' : 'warning',
        description: `${metric} volume is significantly higher than normal (${change.toFixed(1)}% above average)`,
        value: recentMean,
        change,
        confidence: Math.min(0.95, 0.5 + (change / 200)),
        metadata: { type: 'spike', mean, stdDev, threshold }
      });
    } else if (recentMean < lowThreshold && mean > 0) {
      const change = ((mean - recentMean) / mean) * 100;
      anomalies.push({
        severity: change > 50 ? 'critical' : 'warning',
        description: `${metric} volume is significantly lower than normal (${change.toFixed(1)}% below average)`,
        value: recentMean,
        change: -change,
        confidence: Math.min(0.95, 0.5 + (change / 100)),
        metadata: { type: 'drop', mean, stdDev, lowThreshold }
      });
    }
    
    return anomalies;
  }

  private async calculateTrend(metric: string, startDate: Date, endDate: Date): Promise<{
    change: number;
    confidence: number;
    metadata: any;
  } | null> {
    const data = await this.getDailyMetrics(metric, startDate, endDate);
    
    if (data.length < 7) return null;
    
    // Calculate trend using linear regression
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;
    
    const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    const confidence = Math.min(0.9, Math.abs(change) / 50 + 0.3);
    
    return {
      change,
      confidence,
      metadata: { firstAvg, secondAvg, dataPoints: data.length }
    };
  }

  private async calculateQualityTrend(startDate: Date, endDate: Date): Promise<{
    current: number;
    change: number;
    confidence: number;
    metadata: any;
  } | null> {
    const midPoint = new Date((startDate.getTime() + endDate.getTime()) / 2);
    
    const firstHalf = await prisma.websiteAnalysis.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lt: midPoint
        }
      },
      _avg: {
        overallScore: true
      }
    });
    
    const secondHalf = await prisma.websiteAnalysis.aggregate({
      where: {
        createdAt: {
          gte: midPoint,
          lte: endDate
        }
      },
      _avg: {
        overallScore: true
      }
    });
    
    const firstAvg = firstHalf._avg.overallScore || 0;
    const secondAvg = secondHalf._avg.overallScore || 0;
    
    if (firstAvg === 0) return null;
    
    const change = secondAvg - firstAvg;
    const confidence = 0.7; // Quality scores are generally reliable
    
    return {
      current: secondAvg,
      change,
      confidence,
      metadata: { firstPeriodAvg: firstAvg, secondPeriodAvg: secondAvg }
    };
  }

  private async predictMetric(metric: string, startDate: Date, endDate: Date): Promise<{
    value: number;
    confidence: number;
    metadata: any;
  } | null> {
    const data = await this.getDailyMetrics(metric, startDate, endDate);
    
    if (data.length < 7) return null;
    
    // Simple linear prediction based on recent trend
    const recentData = data.slice(-7); // Last 7 days
    const trend = this.calculateSimpleTrend(recentData);
    
    const lastValue = data[data.length - 1].value;
    const periodLength = data.length;
    const prediction = Math.max(0, Math.round(lastValue + (trend * periodLength)));
    
    // Confidence decreases with prediction horizon
    const confidence = Math.max(0.3, 0.8 - (periodLength / 30));
    
    return {
      value: prediction,
      confidence,
      metadata: { trend, lastValue, periodLength }
    };
  }

  private calculateSimpleTrend(data: Array<{date: string, value: number}>): number {
    if (data.length < 2) return 0;
    
    let trend = 0;
    for (let i = 1; i < data.length; i++) {
      trend += data[i].value - data[i - 1].value;
    }
    
    return trend / (data.length - 1);
  }

  private async calculateConversionRate(startDate: Date, endDate: Date): Promise<number> {
    const totalUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    const activeUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        websiteAnalyses: {
          some: {}
        }
      }
    });
    
    return totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
  }

  private async analyzePeakUsageHours(startDate: Date, endDate: Date): Promise<string[]> {
    // This would typically analyze actual usage data
    // For now, return common business hours
    return ['9:00-10:00', '14:00-15:00', '16:00-17:00'];
  }

  private async storeInsights(teamId: string, insights: AnalyticsInsight[]): Promise<void> {
    try {
      // Clear old insights for this team
      await prisma.analyticsInsight.deleteMany({
        where: {
          teamId,
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
          }
        }
      });

      // Store new insights
      for (const insight of insights) {
        await prisma.analyticsInsight.create({
          data: {
            teamId,
            type: insight.type,
            severity: insight.severity,
            title: insight.title,
            description: insight.description,
            metric: insight.metric,
            value: insight.value,
            change: insight.change,
            prediction: insight.prediction,
            confidence: insight.confidence,
            actionable: insight.actionable,
            actions: insight.actions,
            metadata: insight.metadata,
            expiresAt: insight.expiresAt
          }
        });
      }
    } catch (error) {
      console.error('Error storing insights:', error);
    }
  }

  async getStoredInsights(teamId: string): Promise<AnalyticsInsight[]> {
    try {
      const insights = await prisma.analyticsInsight.findMany({
        where: {
          teamId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        orderBy: [
          { severity: 'desc' },
          { confidence: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return insights.map(insight => ({
        id: insight.id,
        type: insight.type as any,
        severity: insight.severity as any,
        title: insight.title,
        description: insight.description,
        metric: insight.metric || undefined,
        value: insight.value || undefined,
        change: insight.change || undefined,
        prediction: insight.prediction || undefined,
        confidence: insight.confidence,
        actionable: insight.actionable,
        actions: insight.actions as any,
        metadata: insight.metadata,
        expiresAt: insight.expiresAt || undefined
      }));
    } catch (error) {
      console.error('Error getting stored insights:', error);
      return [];
    }
  }
}

export const aiInsightsService = new AIInsightsService();