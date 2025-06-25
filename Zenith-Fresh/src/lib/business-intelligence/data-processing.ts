// Business Intelligence Data Processing Utilities

import { DataPoint, TimeSeries, TimeRange, MetricDefinition } from '@/types/business-intelligence/analytics';

export class DataProcessor {
  // Aggregate time series data
  static aggregateTimeSeries(
    data: DataPoint[],
    interval: 'hour' | 'day' | 'week' | 'month',
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count'
  ): DataPoint[] {
    const grouped = new Map<string, DataPoint[]>();
    
    data.forEach(point => {
      const key = this.getTimeKey(point.timestamp, interval);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(point);
    });

    return Array.from(grouped.entries()).map(([key, points]) => {
      const timestamp = new Date(key);
      let value: number;
      
      switch (aggregation) {
        case 'sum':
          value = points.reduce((sum, p) => sum + p.value, 0);
          break;
        case 'avg':
          value = points.reduce((sum, p) => sum + p.value, 0) / points.length;
          break;
        case 'min':
          value = Math.min(...points.map(p => p.value));
          break;
        case 'max':
          value = Math.max(...points.map(p => p.value));
          break;
        case 'count':
          value = points.length;
          break;
      }
      
      return { timestamp, value };
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Get time key for grouping
  private static getTimeKey(date: Date, interval: string): string {
    const d = new Date(date);
    switch (interval) {
      case 'hour':
        d.setMinutes(0, 0, 0);
        break;
      case 'day':
        d.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        d.setHours(0, 0, 0, 0);
        break;
      case 'month':
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        break;
    }
    return d.toISOString();
  }

  // Calculate moving average
  static movingAverage(data: DataPoint[], window: number): DataPoint[] {
    return data.map((point, index) => {
      const start = Math.max(0, index - window + 1);
      const windowData = data.slice(start, index + 1);
      const avg = windowData.reduce((sum, p) => sum + p.value, 0) / windowData.length;
      
      return {
        timestamp: point.timestamp,
        value: avg,
        metadata: { ...point.metadata, originalValue: point.value }
      };
    });
  }

  // Calculate trend
  static calculateTrend(data: DataPoint[]): 'up' | 'down' | 'stable' {
    if (data.length < 2) return 'stable';
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (Math.abs(change) < 0.05) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  // Calculate growth rate
  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  // Fill missing data points
  static fillMissingDataPoints(
    data: DataPoint[],
    timeRange: TimeRange,
    interval: 'hour' | 'day' | 'week' | 'month',
    fillMethod: 'zero' | 'forward' | 'interpolate' = 'zero'
  ): DataPoint[] {
    const filledData: DataPoint[] = [];
    const dataMap = new Map(data.map(p => [p.timestamp.getTime(), p]));
    
    let current = new Date(timeRange.start);
    let lastValue = 0;
    
    while (current <= timeRange.end) {
      const existing = dataMap.get(current.getTime());
      
      if (existing) {
        filledData.push(existing);
        lastValue = existing.value;
      } else {
        let value: number;
        
        switch (fillMethod) {
          case 'zero':
            value = 0;
            break;
          case 'forward':
            value = lastValue;
            break;
          case 'interpolate':
            // Simple linear interpolation
            const prevPoint = filledData[filledData.length - 1];
            const nextPoint = data.find(p => p.timestamp > current);
            
            if (prevPoint && nextPoint) {
              const ratio = (current.getTime() - prevPoint.timestamp.getTime()) /
                          (nextPoint.timestamp.getTime() - prevPoint.timestamp.getTime());
              value = prevPoint.value + (nextPoint.value - prevPoint.value) * ratio;
            } else {
              value = lastValue;
            }
            break;
        }
        
        filledData.push({
          timestamp: new Date(current),
          value,
          metadata: { filled: true }
        });
      }
      
      // Increment current date
      switch (interval) {
        case 'hour':
          current.setHours(current.getHours() + 1);
          break;
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }
    
    return filledData;
  }

  // Detect anomalies using statistical methods
  static detectAnomalies(
    data: DataPoint[],
    method: 'zscore' | 'iqr' | 'isolation' = 'zscore',
    threshold: number = 3
  ): Array<{ point: DataPoint; score: number }> {
    const anomalies: Array<{ point: DataPoint; score: number }> = [];
    
    if (method === 'zscore') {
      const values = data.map(p => p.value);
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
      );
      
      data.forEach(point => {
        const zScore = Math.abs((point.value - mean) / stdDev);
        if (zScore > threshold) {
          anomalies.push({ point, score: zScore });
        }
      });
    } else if (method === 'iqr') {
      const values = data.map(p => p.value).sort((a, b) => a - b);
      const q1 = values[Math.floor(values.length * 0.25)];
      const q3 = values[Math.floor(values.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - threshold * iqr;
      const upperBound = q3 + threshold * iqr;
      
      data.forEach(point => {
        if (point.value < lowerBound || point.value > upperBound) {
          const score = Math.max(
            Math.abs(point.value - lowerBound) / iqr,
            Math.abs(point.value - upperBound) / iqr
          );
          anomalies.push({ point, score });
        }
      });
    }
    
    return anomalies;
  }

  // Calculate correlation between two time series
  static calculateCorrelation(series1: DataPoint[], series2: DataPoint[]): number {
    if (series1.length !== series2.length) {
      throw new Error('Series must have the same length');
    }
    
    const n = series1.length;
    const values1 = series1.map(p => p.value);
    const values2 = series2.map(p => p.value);
    
    const mean1 = values1.reduce((sum, v) => sum + v, 0) / n;
    const mean2 = values2.reduce((sum, v) => sum + v, 0) / n;
    
    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;
    
    for (let i = 0; i < n; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }
    
    return numerator / Math.sqrt(denominator1 * denominator2);
  }

  // Forecast using simple methods
  static simpleForecast(
    data: DataPoint[],
    periods: number,
    method: 'linear' | 'exponential' | 'moving_average' = 'linear'
  ): DataPoint[] {
    const forecast: DataPoint[] = [];
    const lastDate = data[data.length - 1].timestamp;
    const interval = data.length > 1 
      ? data[1].timestamp.getTime() - data[0].timestamp.getTime()
      : 86400000; // Default to 1 day
    
    if (method === 'linear') {
      // Simple linear regression
      const n = data.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const y = data.map(p => p.value);
      
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      for (let i = 0; i < periods; i++) {
        const forecastX = n + i;
        const forecastValue = slope * forecastX + intercept;
        const forecastDate = new Date(lastDate.getTime() + (i + 1) * interval);
        
        forecast.push({
          timestamp: forecastDate,
          value: Math.max(0, forecastValue),
          metadata: { forecast: true, method: 'linear' }
        });
      }
    } else if (method === 'moving_average') {
      const windowSize = Math.min(7, Math.floor(data.length / 3));
      const lastValues = data.slice(-windowSize).map(p => p.value);
      const avg = lastValues.reduce((sum, v) => sum + v, 0) / lastValues.length;
      
      for (let i = 0; i < periods; i++) {
        const forecastDate = new Date(lastDate.getTime() + (i + 1) * interval);
        forecast.push({
          timestamp: forecastDate,
          value: avg,
          metadata: { forecast: true, method: 'moving_average' }
        });
      }
    }
    
    return forecast;
  }

  // Calculate percentiles
  static calculatePercentiles(values: number[], percentiles: number[]): Map<number, number> {
    const sorted = [...values].sort((a, b) => a - b);
    const result = new Map<number, number>();
    
    percentiles.forEach(p => {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      result.set(p, sorted[Math.max(0, index)]);
    });
    
    return result;
  }

  // Format metric value based on type
  static formatMetricValue(value: number, metric: MetricDefinition): string {
    switch (metric.type) {
      case 'percentage':
        return `${(value * 100).toFixed(2)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'duration':
        if (value < 1000) return `${value}ms`;
        if (value < 60000) return `${(value / 1000).toFixed(1)}s`;
        if (value < 3600000) return `${(value / 60000).toFixed(1)}m`;
        return `${(value / 3600000).toFixed(1)}h`;
      default:
        return new Intl.NumberFormat('en-US').format(value);
    }
  }
}