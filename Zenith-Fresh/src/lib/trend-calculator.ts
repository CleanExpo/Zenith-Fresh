import { PrismaClient } from '@prisma/client';
import { subDays, subWeeks, subMonths, format, startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

export interface TrendData {
  date: string;
  value: number;
}

export interface TrendAnalysis {
  direction: 'improving' | 'declining' | 'stable' | 'volatile';
  strength: number; // -1 to 1
  currentValue: number;
  averageValue: number;
  bestValue: number;
  worstValue: number;
  changePercent: number;
}

export class TrendCalculator {
  async updateTrends(projectId: string, url: string, analysisResults: any): Promise<void> {
    const metrics = [
      { name: 'overall_score', value: analysisResults.performance.overallScore },
      { name: 'load_time', value: analysisResults.performance.pageLoadTime },
      { name: 'lcp', value: analysisResults.coreWebVitals.lcp },
      { name: 'fid', value: analysisResults.coreWebVitals.fid },
      { name: 'cls', value: analysisResults.coreWebVitals.cls },
      { name: 'performance_score', value: analysisResults.performance.overallScore },
      { name: 'cwv_score', value: analysisResults.coreWebVitals.overallScore },
      { name: 'security_score', value: analysisResults.technical.securityScore },
      { name: 'seo_score', value: analysisResults.technical.seoScore },
      { name: 'accessibility_score', value: analysisResults.technical.accessibilityScore },
    ];

    for (const metric of metrics) {
      if (metric.value !== null && metric.value !== undefined) {
        await this.updateMetricTrend(projectId, url, metric.name, metric.value);
      }
    }
  }

  async updateMetricTrend(projectId: string, url: string, metricName: string, currentValue: number): Promise<void> {
    try {
      // Get historical data for this metric
      const historicalData = await this.getHistoricalData(projectId, url, metricName);
      
      // Calculate trend periods
      const daily = await this.calculateDailyTrend(historicalData, currentValue);
      const weekly = await this.calculateWeeklyTrend(historicalData, currentValue);
      const monthly = await this.calculateMonthlyTrend(historicalData, currentValue);
      
      // Analyze trend
      const trendAnalysis = this.analyzeTrend(daily);
      
      // Update or create trend record
      await prisma.performanceTrend.upsert({
        where: {
          projectId_url_metricName: {
            projectId,
            url,
            metricName,
          },
        },
        update: {
          daily: daily as any,
          weekly: weekly as any,
          monthly: monthly as any,
          trendDirection: trendAnalysis.direction,
          trendStrength: trendAnalysis.strength,
          currentValue: currentValue,
          averageValue: trendAnalysis.averageValue,
          bestValue: trendAnalysis.bestValue,
          worstValue: trendAnalysis.worstValue,
          lastCalculated: new Date(),
          updatedAt: new Date(),
        },
        create: {
          projectId,
          url,
          metricName,
          daily: daily as any,
          weekly: weekly as any,
          monthly: monthly as any,
          trendDirection: trendAnalysis.direction,
          trendStrength: trendAnalysis.strength,
          currentValue: currentValue,
          averageValue: trendAnalysis.averageValue,
          bestValue: trendAnalysis.bestValue,
          worstValue: trendAnalysis.worstValue,
          lastCalculated: new Date(),
        },
      });

    } catch (error) {
      console.error(`Failed to update trend for ${metricName}:`, error);
      throw error;
    }
  }

  async recalculateTrends(projectId: string, url?: string, forceRecalculate: boolean = false): Promise<{ updated: number; created: number }> {
    let updated = 0;
    let created = 0;

    try {
      // Get all unique URLs for this project if not specified
      const urls = url ? [url] : await this.getProjectUrls(projectId);
      
      // Get all metric names that have data
      const metricNames = await this.getAvailableMetrics(projectId, url);

      for (const projectUrl of urls) {
        for (const metricName of metricNames) {
          try {
            const existingTrend = await prisma.performanceTrend.findUnique({
              where: {
                projectId_url_metricName: {
                  projectId,
                  url: projectUrl,
                  metricName,
                },
              },
            });

            // Skip if trend exists and we're not forcing recalculation
            if (existingTrend && !forceRecalculate) {
              continue;
            }

            const historicalData = await this.getHistoricalData(projectId, projectUrl, metricName);
            
            if (historicalData.length === 0) continue;

            const currentValue = historicalData[0]?.value || 0;
            
            const daily = await this.calculateDailyTrend(historicalData, currentValue);
            const weekly = await this.calculateWeeklyTrend(historicalData, currentValue);
            const monthly = await this.calculateMonthlyTrend(historicalData, currentValue);
            
            const trendAnalysis = this.analyzeTrend(daily);

            if (existingTrend) {
              await prisma.performanceTrend.update({
                where: { id: existingTrend.id },
                data: {
                  daily: daily as any,
                  weekly: weekly as any,
                  monthly: monthly as any,
                  trendDirection: trendAnalysis.direction,
                  trendStrength: trendAnalysis.strength,
                  currentValue: currentValue,
                  averageValue: trendAnalysis.averageValue,
                  bestValue: trendAnalysis.bestValue,
                  worstValue: trendAnalysis.worstValue,
                  lastCalculated: new Date(),
                  updatedAt: new Date(),
                },
              });
              updated++;
            } else {
              await prisma.performanceTrend.create({
                data: {
                  projectId,
                  url: projectUrl,
                  metricName,
                  daily: daily as any,
                  weekly: weekly as any,
                  monthly: monthly as any,
                  trendDirection: trendAnalysis.direction,
                  trendStrength: trendAnalysis.strength,
                  currentValue: currentValue,
                  averageValue: trendAnalysis.averageValue,
                  bestValue: trendAnalysis.bestValue,
                  worstValue: trendAnalysis.worstValue,
                  lastCalculated: new Date(),
                },
              });
              created++;
            }

          } catch (error) {
            console.error(`Failed to process trend for ${projectUrl}/${metricName}:`, error);
          }
        }
      }

      return { updated, created };

    } catch (error) {
      console.error('Failed to recalculate trends:', error);
      throw error;
    }
  }

  private async getHistoricalData(projectId: string, url: string, metricName: string): Promise<Array<{ date: Date; value: number }>> {
    const oneMonthAgo = subMonths(new Date(), 1);

    // Map metric names to database fields
    const metricMapping: { [key: string]: string } = {
      'overall_score': 'overallScore',
      'load_time': 'performanceMetrics.pageLoadTime',
      'lcp': 'coreWebVitals.largestContentfulPaint',
      'fid': 'coreWebVitals.firstInputDelay',
      'cls': 'coreWebVitals.cumulativeLayoutShift',
      'performance_score': 'performanceMetrics.cacheScore', // Simplified
      'cwv_score': 'coreWebVitals.webVitalsScore',
      'security_score': 'technicalChecks.securityScore',
      'seo_score': 'technicalChecks.seoScore',
      'accessibility_score': 'technicalChecks.accessibilityScore',
    };

    const analyses = await prisma.websiteAnalysis.findMany({
      where: {
        projectId,
        url,
        status: 'completed',
        createdAt: {
          gte: oneMonthAgo,
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
    });

    return analyses
      .map(analysis => {
        let value: number | null = null;

        switch (metricName) {
          case 'overall_score':
            value = analysis.overallScore;
            break;
          case 'load_time':
            value = analysis.performanceMetrics?.pageLoadTime || null;
            break;
          case 'lcp':
            value = analysis.coreWebVitals?.largestContentfulPaint || null;
            break;
          case 'fid':
            value = analysis.coreWebVitals?.firstInputDelay || null;
            break;
          case 'cls':
            value = analysis.coreWebVitals?.cumulativeLayoutShift || null;
            break;
          case 'performance_score':
            value = analysis.performanceMetrics?.cacheScore || null;
            break;
          case 'cwv_score':
            value = analysis.coreWebVitals?.webVitalsScore || null;
            break;
          case 'security_score':
            value = analysis.technicalChecks?.securityScore || null;
            break;
          case 'seo_score':
            value = analysis.technicalChecks?.seoScore || null;
            break;
          case 'accessibility_score':
            value = analysis.technicalChecks?.accessibilityScore || null;
            break;
        }

        return value !== null ? { date: analysis.createdAt, value } : null;
      })
      .filter((item): item is { date: Date; value: number } => item !== null);
  }

  private async getProjectUrls(projectId: string): Promise<string[]> {
    const analyses = await prisma.websiteAnalysis.findMany({
      where: { projectId, status: 'completed' },
      select: { url: true },
      distinct: ['url'],
    });

    return analyses.map(a => a.url);
  }

  private async getAvailableMetrics(projectId: string, url?: string): Promise<string[]> {
    // Return all possible metric names
    return [
      'overall_score',
      'load_time',
      'lcp',
      'fid',
      'cls',
      'performance_score',
      'cwv_score',
      'security_score',
      'seo_score',
      'accessibility_score',
    ];
  }

  private async calculateDailyTrend(historicalData: Array<{ date: Date; value: number }>, currentValue: number): Promise<TrendData[]> {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const dailyData: TrendData[] = [];

    // Group data by day
    const dailyGroups = new Map<string, number[]>();

    historicalData.forEach(item => {
      if (item.date >= thirtyDaysAgo) {
        const dayKey = format(item.date, 'yyyy-MM-dd');
        if (!dailyGroups.has(dayKey)) {
          dailyGroups.set(dayKey, []);
        }
        dailyGroups.get(dayKey)!.push(item.value);
      }
    });

    // Calculate daily averages
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayKey = format(date, 'yyyy-MM-dd');
      const dayValues = dailyGroups.get(dayKey) || [];
      
      const value = dayValues.length > 0 
        ? dayValues.reduce((sum, val) => sum + val, 0) / dayValues.length
        : (i === 0 ? currentValue : null);

      if (value !== null) {
        dailyData.push({
          date: dayKey,
          value: Math.round(value * 100) / 100,
        });
      }
    }

    return dailyData;
  }

  private async calculateWeeklyTrend(historicalData: Array<{ date: Date; value: number }>, currentValue: number): Promise<TrendData[]> {
    const twelveWeeksAgo = subWeeks(new Date(), 12);
    const weeklyData: TrendData[] = [];

    // Group data by week
    const weeklyGroups = new Map<string, number[]>();

    historicalData.forEach(item => {
      if (item.date >= twelveWeeksAgo) {
        const weekKey = format(item.date, 'yyyy-ww');
        if (!weeklyGroups.has(weekKey)) {
          weeklyGroups.set(weekKey, []);
        }
        weeklyGroups.get(weekKey)!.push(item.value);
      }
    });

    // Calculate weekly averages
    for (let i = 11; i >= 0; i--) {
      const date = subWeeks(new Date(), i);
      const weekKey = format(date, 'yyyy-ww');
      const weekValues = weeklyGroups.get(weekKey) || [];
      
      const value = weekValues.length > 0 
        ? weekValues.reduce((sum, val) => sum + val, 0) / weekValues.length
        : (i === 0 ? currentValue : null);

      if (value !== null) {
        weeklyData.push({
          date: weekKey,
          value: Math.round(value * 100) / 100,
        });
      }
    }

    return weeklyData;
  }

  private async calculateMonthlyTrend(historicalData: Array<{ date: Date; value: number }>, currentValue: number): Promise<TrendData[]> {
    const twelveMonthsAgo = subMonths(new Date(), 12);
    const monthlyData: TrendData[] = [];

    // Group data by month
    const monthlyGroups = new Map<string, number[]>();

    historicalData.forEach(item => {
      if (item.date >= twelveMonthsAgo) {
        const monthKey = format(item.date, 'yyyy-MM');
        if (!monthlyGroups.has(monthKey)) {
          monthlyGroups.set(monthKey, []);
        }
        monthlyGroups.get(monthKey)!.push(item.value);
      }
    });

    // Calculate monthly averages
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'yyyy-MM');
      const monthValues = monthlyGroups.get(monthKey) || [];
      
      const value = monthValues.length > 0 
        ? monthValues.reduce((sum, val) => sum + val, 0) / monthValues.length
        : (i === 0 ? currentValue : null);

      if (value !== null) {
        monthlyData.push({
          date: monthKey,
          value: Math.round(value * 100) / 100,
        });
      }
    }

    return monthlyData;
  }

  private analyzeTrend(trendData: TrendData[]): TrendAnalysis {
    if (trendData.length === 0) {
      return {
        direction: 'stable',
        strength: 0,
        currentValue: 0,
        averageValue: 0,
        bestValue: 0,
        worstValue: 0,
        changePercent: 0,
      };
    }

    const values = trendData.map(d => d.value);
    const currentValue = values[values.length - 1] || 0;
    const previousValue = values[0] || currentValue;
    
    // Calculate statistics
    const averageValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    const bestValue = Math.max(...values);
    const worstValue = Math.min(...values);
    
    // Calculate trend strength using linear regression
    const trendStrength = this.calculateTrendStrength(values);
    
    // Determine direction
    let direction: TrendAnalysis['direction'];
    const changePercent = previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
    
    if (Math.abs(trendStrength) < 0.1) {
      direction = 'stable';
    } else if (trendStrength > 0.1) {
      direction = 'improving';
    } else if (trendStrength < -0.1) {
      direction = 'declining';
    } else {
      direction = 'volatile';
    }

    return {
      direction,
      strength: Math.round(trendStrength * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      averageValue: Math.round(averageValue * 100) / 100,
      bestValue: Math.round(bestValue * 100) / 100,
      worstValue: Math.round(worstValue * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
    };
  }

  private calculateTrendStrength(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Normalize slope to -1 to 1 range
    const maxValue = Math.max(...values);
    const normalizedSlope = slope / (maxValue / n);
    
    return Math.max(-1, Math.min(1, normalizedSlope));
  }
}