// Predictive Analytics Components Export Index
export { default as PredictiveAnalyticsDashboard } from './PredictiveAnalyticsDashboard';
export { default as ChurnRiskAnalyzer } from './ChurnRiskAnalyzer';
export { default as RevenueForecasting } from './RevenueForecasting';
export { default as UserSegmentPredictor } from './UserSegmentPredictor';
export { default as ModelPerformanceMonitor } from './ModelPerformanceMonitor';
export { default as AdvancedAnalytics } from './AdvancedAnalytics';

// Re-export ML utilities for easy access
export { getMLService, createMLService } from '@/lib/ml/utils';
export type { 
  PredictionResult, 
  ChurnPrediction, 
  RevenueForecast, 
  LTVPrediction, 
  FeatureAdoptionPrediction, 
  UserSegment,
  ModelPerformance,
  CohortAnalysis,
  AnomalyDetection
} from '@/lib/ml/MLService';