import { MLService } from './MLService';
import { PrismaClient } from '@prisma/client';

// ML Service Singleton
let mlServiceInstance: MLService | null = null;

export function getMLService(): MLService {
  if (!mlServiceInstance) {
    const prisma = new PrismaClient();
    mlServiceInstance = new MLService(prisma);
  }
  return mlServiceInstance;
}

// Feature Engineering Utilities
export interface FeatureConfig {
  name: string;
  type: 'numerical' | 'categorical' | 'boolean';
  transformation?: 'log' | 'sqrt' | 'normalize' | 'standardize';
  binning?: { bins: number; min?: number; max?: number };
}

export class FeatureEngine {
  static createFeatureVector(data: Record<string, any>, config: FeatureConfig[]): number[] {
    return config.map(feature => {
      let value = data[feature.name];
      
      if (value === undefined || value === null) {
        return 0; // Handle missing values
      }

      // Type conversions
      if (feature.type === 'boolean') {
        value = value ? 1 : 0;
      } else if (feature.type === 'categorical') {
        // Simple categorical encoding (would need proper one-hot encoding in production)
        value = typeof value === 'string' ? value.charCodeAt(0) % 10 : 0;
      }

      // Transformations
      if (feature.transformation) {
        switch (feature.transformation) {
          case 'log':
            value = Math.log(Math.max(value, 0.001));
            break;
          case 'sqrt':
            value = Math.sqrt(Math.max(value, 0));
            break;
          case 'normalize':
            // This would need min/max values from training data
            value = Math.max(0, Math.min(1, value));
            break;
          case 'standardize':
            // This would need mean/std from training data
            break;
        }
      }

      // Binning
      if (feature.binning) {
        const { bins, min = 0, max = 100 } = feature.binning;
        const binSize = (max - min) / bins;
        value = Math.floor((value - min) / binSize);
      }

      return Number(value) || 0;
    });
  }

  static calculateFeatureImportance(
    features: number[][],
    target: number[],
    featureNames: string[]
  ): Array<{ name: string; importance: number }> {
    return featureNames.map((name, index) => {
      const featureValues = features.map(row => row[index]);
      const correlation = this.calculateCorrelation(featureValues, target);
      return {
        name,
        importance: Math.abs(correlation)
      };
    }).sort((a, b) => b.importance - a.importance);
  }

  private static calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }
}

// Time Series Utilities
export class TimeSeriesAnalyzer {
  static decomposeAdditive(
    data: number[],
    seasonality: number = 12
  ): { trend: number[]; seasonal: number[]; residual: number[] } {
    const trend = this.calculateTrend(data, seasonality);
    const detrended = data.map((value, index) => value - trend[index]);
    const seasonal = this.calculateSeasonal(detrended, seasonality);
    const residual = data.map((value, index) => value - trend[index] - seasonal[index % seasonality]);

    return { trend, seasonal, residual };
  }

  static calculateTrend(data: number[], seasonality: number): number[] {
    const halfSeason = Math.floor(seasonality / 2);
    return data.map((_, index) => {
      const start = Math.max(0, index - halfSeason);
      const end = Math.min(data.length, index + halfSeason + 1);
      const subset = data.slice(start, end);
      return subset.reduce((sum, val) => sum + val, 0) / subset.length;
    });
  }

  static calculateSeasonal(detrended: number[], seasonality: number): number[] {
    const seasonalComponents = Array(seasonality).fill(0);
    const seasonalCounts = Array(seasonality).fill(0);

    detrended.forEach((value, index) => {
      const seasonIndex = index % seasonality;
      seasonalComponents[seasonIndex] += value;
      seasonalCounts[seasonIndex]++;
    });

    return seasonalComponents.map((sum, index) => 
      seasonalCounts[index] > 0 ? sum / seasonalCounts[index] : 0
    );
  }

  static exponentialSmoothing(
    data: number[],
    alpha: number = 0.3,
    beta: number = 0.1,
    gamma: number = 0.1,
    seasonality: number = 12
  ): { smoothed: number[]; forecast: (periods: number) => number[] } {
    if (data.length < seasonality * 2) {
      // Simple exponential smoothing
      let level = data[0];
      const smoothed = [level];

      for (let i = 1; i < data.length; i++) {
        level = alpha * data[i] + (1 - alpha) * level;
        smoothed.push(level);
      }

      return {
        smoothed,
        forecast: (periods: number) => Array(periods).fill(level)
      };
    }

    // Holt-Winters triple exponential smoothing
    let level = data[0];
    let trend = (data[seasonality] - data[0]) / seasonality;
    const seasonal = data.slice(0, seasonality).map((value, index) => value - level);

    const smoothed = [];
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        smoothed.push(level);
        continue;
      }

      const seasonalIndex = (i - seasonality) % seasonality;
      const prevLevel = level;
      const prevTrend = trend;

      level = alpha * (data[i] - seasonal[seasonalIndex]) + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
      seasonal[i % seasonality] = gamma * (data[i] - level) + (1 - gamma) * seasonal[i % seasonality];

      smoothed.push(level + trend + seasonal[i % seasonality]);
    }

    return {
      smoothed,
      forecast: (periods: number) => {
        const forecasts = [];
        for (let i = 0; i < periods; i++) {
          const forecast = level + (i + 1) * trend + seasonal[(data.length + i) % seasonality];
          forecasts.push(forecast);
        }
        return forecasts;
      }
    };
  }

  static detectAnomalies(
    data: number[],
    threshold: number = 2.5
  ): Array<{ index: number; value: number; zscore: number; isAnomaly: boolean }> {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    return data.map((value, index) => {
      const zscore = (value - mean) / stdDev;
      return {
        index,
        value,
        zscore,
        isAnomaly: Math.abs(zscore) > threshold
      };
    });
  }
}

// Statistical Utilities
export class StatUtils {
  static calculatePercentile(data: number[], percentile: number): number {
    const sorted = [...data].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  static calculateConfidenceInterval(
    data: number[],
    confidence: number = 0.95
  ): { lower: number; upper: number; mean: number } {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
    const stdError = Math.sqrt(variance / data.length);
    
    // Using t-distribution approximation
    const tValue = this.getTValue(confidence, data.length - 1);
    const margin = tValue * stdError;
    
    return {
      mean,
      lower: mean - margin,
      upper: mean + margin
    };
  }

  private static getTValue(confidence: number, degreesOfFreedom: number): number {
    // Simplified t-value calculation (would use proper t-table in production)
    const alpha = 1 - confidence;
    if (degreesOfFreedom >= 30) {
      // Use normal approximation for large samples
      if (confidence === 0.95) return 1.96;
      if (confidence === 0.99) return 2.576;
      if (confidence === 0.90) return 1.645;
    }
    
    // Simplified t-values for small samples
    if (confidence === 0.95) {
      if (degreesOfFreedom === 1) return 12.706;
      if (degreesOfFreedom === 2) return 4.303;
      if (degreesOfFreedom <= 5) return 2.571;
      if (degreesOfFreedom <= 10) return 2.228;
      if (degreesOfFreedom <= 20) return 2.086;
      return 2.042;
    }
    
    return 1.96; // Default to normal approximation
  }

  static calculateMAE(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length) {
      throw new Error('Arrays must have the same length');
    }
    
    const errors = actual.map((act, i) => Math.abs(act - predicted[i]));
    return errors.reduce((sum, error) => sum + error, 0) / errors.length;
  }

  static calculateRMSE(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length) {
      throw new Error('Arrays must have the same length');
    }
    
    const squaredErrors = actual.map((act, i) => Math.pow(act - predicted[i], 2));
    const mse = squaredErrors.reduce((sum, error) => sum + error, 0) / squaredErrors.length;
    return Math.sqrt(mse);
  }

  static calculateMAPE(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length) {
      throw new Error('Arrays must have the same length');
    }
    
    const percentageErrors = actual.map((act, i) => {
      if (act === 0) return 0; // Avoid division by zero
      return Math.abs((act - predicted[i]) / act) * 100;
    });
    
    return percentageErrors.reduce((sum, error) => sum + error, 0) / percentageErrors.length;
  }

  static calculateR2(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length) {
      throw new Error('Arrays must have the same length');
    }
    
    const actualMean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
    const totalSumSquares = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    const residualSumSquares = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
    
    return 1 - (residualSumSquares / totalSumSquares);
  }
}

// Validation Utilities
export class ModelValidator {
  static crossValidation(
    data: any[],
    labels: number[],
    trainModel: (trainData: any[], trainLabels: number[]) => any,
    predict: (model: any, testData: any[]) => number[],
    k: number = 5
  ): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    mae: number;
    rmse: number;
  } {
    const foldSize = Math.floor(data.length / k);
    const results = [];

    for (let i = 0; i < k; i++) {
      const testStart = i * foldSize;
      const testEnd = i === k - 1 ? data.length : (i + 1) * foldSize;
      
      const testData = data.slice(testStart, testEnd);
      const testLabels = labels.slice(testStart, testEnd);
      const trainData = [...data.slice(0, testStart), ...data.slice(testEnd)];
      const trainLabels = [...labels.slice(0, testStart), ...labels.slice(testEnd)];

      const model = trainModel(trainData, trainLabels);
      const predictions = predict(model, testData);

      results.push(this.calculateMetrics(testLabels, predictions));
    }

    // Average the results across folds
    return {
      accuracy: results.reduce((sum, r) => sum + r.accuracy, 0) / k,
      precision: results.reduce((sum, r) => sum + r.precision, 0) / k,
      recall: results.reduce((sum, r) => sum + r.recall, 0) / k,
      f1Score: results.reduce((sum, r) => sum + r.f1Score, 0) / k,
      mae: results.reduce((sum, r) => sum + r.mae, 0) / k,
      rmse: results.reduce((sum, r) => sum + r.rmse, 0) / k
    };
  }

  private static calculateMetrics(actual: number[], predicted: number[]) {
    // Convert to binary classification for precision/recall (threshold at 0.5)
    const actualBinary = actual.map(val => val > 0.5 ? 1 : 0);
    const predictedBinary = predicted.map(val => val > 0.5 ? 1 : 0);

    let tp = 0, fp = 0, tn = 0, fn = 0;
    for (let i = 0; i < actual.length; i++) {
      if (actualBinary[i] === 1 && predictedBinary[i] === 1) tp++;
      else if (actualBinary[i] === 0 && predictedBinary[i] === 1) fp++;
      else if (actualBinary[i] === 0 && predictedBinary[i] === 0) tn++;
      else fn++;
    }

    const accuracy = (tp + tn) / (tp + fp + tn + fn);
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    const mae = StatUtils.calculateMAE(actual, predicted);
    const rmse = StatUtils.calculateRMSE(actual, predicted);

    return { accuracy, precision, recall, f1Score, mae, rmse };
  }
}

// Data Processing Utilities
export class DataProcessor {
  static handleMissingValues(
    data: Record<string, any>[],
    strategy: 'mean' | 'median' | 'mode' | 'drop' = 'mean'
  ): Record<string, any>[] {
    if (strategy === 'drop') {
      return data.filter(row => Object.values(row).every(val => val !== null && val !== undefined));
    }

    const processedData = [...data];
    const keys = Object.keys(data[0] || {});

    keys.forEach(key => {
      const values = data.map(row => row[key]).filter(val => val !== null && val !== undefined);
      let fillValue: any;

      switch (strategy) {
        case 'mean':
          fillValue = values.reduce((sum, val) => sum + Number(val), 0) / values.length;
          break;
        case 'median':
          const sorted = values.map(Number).sort((a, b) => a - b);
          fillValue = sorted[Math.floor(sorted.length / 2)];
          break;
        case 'mode':
          const counts = values.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          }, {} as Record<any, number>);
          fillValue = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
          break;
      }

      processedData.forEach(row => {
        if (row[key] === null || row[key] === undefined) {
          row[key] = fillValue;
        }
      });
    });

    return processedData;
  }

  static normalizeData(
    data: number[][],
    method: 'minmax' | 'zscore' = 'zscore'
  ): { normalized: number[][]; params: any } {
    const featureCount = data[0].length;
    const params: any = [];

    for (let i = 0; i < featureCount; i++) {
      const column = data.map(row => row[i]);
      
      if (method === 'minmax') {
        const min = Math.min(...column);
        const max = Math.max(...column);
        params.push({ min, max });
      } else {
        const mean = column.reduce((sum, val) => sum + val, 0) / column.length;
        const variance = column.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / column.length;
        const std = Math.sqrt(variance);
        params.push({ mean, std });
      }
    }

    const normalized = data.map(row => 
      row.map((value, index) => {
        if (method === 'minmax') {
          const { min, max } = params[index];
          return max === min ? 0 : (value - min) / (max - min);
        } else {
          const { mean, std } = params[index];
          return std === 0 ? 0 : (value - mean) / std;
        }
      })
    );

    return { normalized, params };
  }

  static splitTrainTest(
    data: any[],
    testSize: number = 0.2,
    shuffle: boolean = true
  ): { train: any[]; test: any[] } {
    const shuffledData = shuffle ? this.shuffleArray([...data]) : [...data];
    const splitIndex = Math.floor(data.length * (1 - testSize));
    
    return {
      train: shuffledData.slice(0, splitIndex),
      test: shuffledData.slice(splitIndex)
    };
  }

  private static shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// Export convenience functions
export const createMLService = () => getMLService();
export const featureEngine = FeatureEngine;
export const timeSeriesAnalyzer = TimeSeriesAnalyzer;
export const statUtils = StatUtils;
export const modelValidator = ModelValidator;
export const dataProcessor = DataProcessor;