// ===== CONVERSION FUNNEL SYSTEM COMPONENTS =====

// Core Components
export { default as ConversionFunnelDashboard } from './ConversionFunnelDashboard';
export { default as FunnelBuilder } from './FunnelBuilder';
export { default as FunnelTracker, useFunnelTracker } from './FunnelTracker';

// Analysis Components
export { default as DropoffAnalyzer } from './DropoffAnalyzer';
export { default as ConversionOptimizer } from './ConversionOptimizer';
export { default as FunnelMetrics } from './FunnelMetrics';
export { default as CohortFunnelAnalysis } from './CohortFunnelAnalysis';

// Testing & Optimization
export { default as FunnelABTesting } from './FunnelABTesting';

// Types
export type {
  FunnelConfig,
  FunnelWithSteps,
  FunnelMetrics as FunnelMetricsType,
  FunnelStepConfig,
  FunnelGoalConfig,
  OptimizationSuggestion,
  DropoffPoint,
  CohortDefinition,
  FunnelUserJourney,
  FunnelHealthScore,
  TrackFunnelEventRequest,
  TrackFunnelEventResponse,
  CreateFunnelRequest,
  CreateFunnelResponse,
  GetFunnelAnalyticsRequest,
  GetFunnelAnalyticsResponse,
  GetOptimizationSuggestionsRequest,
  GetOptimizationSuggestionsResponse
} from '../../types/funnel';