/**
 * A/B Testing Framework Types
 * Comprehensive TypeScript types for the Zenith A/B testing system
 */

import { ExperimentType, ExperimentStatus } from '@prisma/client';

// Core Experiment Types
export interface ExperimentConfig {
  id?: string;
  name: string;
  description?: string;
  hypothesis?: string;
  type: ExperimentType;
  status: ExperimentStatus;
  trafficSplit: Record<string, number>; // e.g., {"A": 0.5, "B": 0.5}
  minimumSampleSize: number;
  minimumRuntime: number; // days
  maxRuntime: number; // days
  confidenceLevel: number; // 0.95 for 95%
  minimumDetectableEffect: number; // 0.05 for 5%
  statisticalPower: number; // 0.8 for 80%
  primaryMetric: string;
  secondaryMetrics?: string[];
  targetingRules?: TargetingRules;
  inclusionRules?: InclusionRules;
  exclusionRules?: ExclusionRules;
  featureFlagKey?: string;
  featureFlagConfig?: Record<string, any>;
}

export interface ExperimentVariant {
  id?: string;
  experimentId: string;
  name: string; // "A", "B", "Control", "Treatment", etc.
  description?: string;
  isControl: boolean;
  configuration?: Record<string, any>;
  featureFlags?: Record<string, any>;
  trafficWeight: number; // 0.0 to 1.0
  participants: number;
  conversions: number;
  conversionRate: number;
  totalEvents: number;
  uniqueUsers: number;
  mean?: number;
  standardDev?: number;
  standardError?: number;
  confidenceInterval?: {
    lower: number;
    upper: number;
  };
}

// User allocation and bucketing
export interface ExperimentAllocation {
  id?: string;
  experimentId: string;
  variantId: string;
  userId?: string;
  sessionId?: string;
  bucketValue: number; // 0.0 to 1.0
  allocationKey: string;
  firstExposure: Date;
  lastExposure: Date;
  exposureCount: number;
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  platform?: string;
  userSegment?: string;
  metadata?: Record<string, any>;
}

// Event tracking
export interface ExperimentEvent {
  id?: string;
  experimentId: string;
  variantId: string;
  allocationId?: string;
  eventType: string; // "conversion", "click", "signup", "purchase"
  eventValue?: number;
  eventData?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  page?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
}

// Statistical results
export interface ExperimentResult {
  id?: string;
  experimentId: string;
  metric: string;
  analysisType: 'frequentist' | 'bayesian';
  isStatisticallySignificant: boolean;
  pValue?: number;
  confidenceLevel: number;
  effectSize?: number;
  controlVariant?: string;
  treatmentVariant?: string;
  controlMean?: number;
  treatmentMean?: number;
  lift?: number;
  liftLowerBound?: number;
  liftUpperBound?: number;
  testStatistic?: number;
  degreesOfFreedom?: number;
  standardError?: number;
  bayesianProbability?: number;
  credibleInterval?: {
    lower: number;
    upper: number;
  };
  sampleSizeControl?: number;
  sampleSizeTreatment?: number;
  achievedPower?: number;
  analysisDate: Date;
  dataStartDate?: Date;
  dataEndDate?: Date;
  notes?: string;
  isRealTime: boolean;
}

// Targeting and segmentation
export interface TargetingRules {
  userSegments?: string[]; // ["free", "paid", "enterprise"]
  countries?: string[]; // ["US", "CA", "GB"]
  platforms?: string[]; // ["web", "mobile", "api"]
  userProperties?: Record<string, any>;
  customRules?: CustomRule[];
}

export interface InclusionRules {
  minAccountAge?: number; // days
  hasCompletedOnboarding?: boolean;
  minUsageDays?: number;
  requiredFeatures?: string[];
  customCriteria?: Record<string, any>;
}

export interface ExclusionRules {
  isTestUser?: boolean;
  isEmployee?: boolean;
  hasOptedOut?: boolean;
  isInOtherExperiment?: boolean;
  blacklistedUserIds?: string[];
  customExclusions?: Record<string, any>;
}

export interface CustomRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

// Statistical analysis types
export interface StatisticalTest {
  testType: 'z_test' | 't_test' | 'chi_square' | 'mann_whitney' | 'bayesian';
  alternative: 'two_sided' | 'greater' | 'less';
  confidenceLevel: number;
  minimumDetectableEffect: number;
  power: number;
}

export interface FrequentistResult {
  testStatistic: number;
  pValue: number;
  criticalValue: number;
  confidenceInterval: [number, number];
  effectSize: number;
  lift: number;
  isSignificant: boolean;
  degreesOfFreedom?: number;
}

export interface BayesianResult {
  posterior: {
    alpha: number;
    beta: number;
    mean: number;
    variance: number;
  };
  credibleInterval: [number, number];
  probabilityOfSuperiority: number;
  expectedLoss: number;
  isSignificant: boolean;
}

// Power analysis and sample size calculation
export interface PowerAnalysis {
  currentSampleSize: number;
  currentPower: number;
  recommendedSampleSize: number;
  daysToReachSample: number;
  detectedEffect: number;
  confidenceLevel: number;
}

export interface SampleSizeCalculation {
  minimumSampleSize: number;
  expectedDuration: number; // days
  trafficRequired: number; // percentage of total traffic
  costEstimate?: number;
  feasibilityScore: number; // 0-1
}

// Sequential testing and early stopping
export interface SequentialAnalysis {
  analysisNumber: number;
  informationFraction: number;
  spentAlpha: number;
  remainingAlpha: number;
  efficacyBoundary: number;
  futilityBoundary: number;
  shouldStop: boolean;
  stopReason?: 'efficacy' | 'futility' | 'harm' | 'external';
  recommendation: 'continue' | 'stop_for_success' | 'stop_for_futility';
}

// Multi-armed bandit types
export interface BanditArm {
  variantId: string;
  name: string;
  pulls: number;
  rewards: number;
  averageReward: number;
  confidenceBound: number;
  regret: number;
}

export interface BanditResult {
  algorithm: 'epsilon_greedy' | 'ucb' | 'thompson_sampling';
  totalRegret: number;
  bestArm: string;
  convergenceIteration?: number;
  arms: BanditArm[];
}

// Holdout groups
export interface HoldoutGroup {
  id: string;
  name: string;
  description?: string;
  holdoutPercent: number;
  isGlobalHoldout: boolean;
  experimentTypes?: ExperimentType[];
  userSegments?: string[];
  exclusionRules?: ExclusionRules;
  totalUsers: number;
  activeUsers: number;
  isActive: boolean;
}

// Contamination detection
export interface ContaminationCheck {
  experimentId: string;
  contaminationType: 'cross_variant_exposure' | 'external_influence' | 'carryover_effect';
  severity: 'low' | 'medium' | 'high';
  affectedUsers: number;
  impactOnResults: number; // 0-1 impact score
  detectionMethod: 'automated' | 'manual';
  recommendation: string;
}

// Dashboard and UI types
export interface ExperimentSummary {
  id: string;
  name: string;
  status: ExperimentStatus;
  type: ExperimentType;
  startDate?: Date;
  endDate?: Date;
  totalParticipants: number;
  primaryMetric: string;
  primaryMetricLift?: number;
  isSignificant?: boolean;
  winningVariant?: string;
  confidence?: number;
  daysRunning?: number;
  progressPercent: number;
}

export interface ExperimentDetails extends ExperimentSummary {
  description?: string;
  hypothesis?: string;
  variants: ExperimentVariant[];
  results: ExperimentResult[];
  targetingRules?: TargetingRules;
  inclusionRules?: InclusionRules;
  exclusionRules?: ExclusionRules;
  powerAnalysis?: PowerAnalysis;
  sequentialAnalysis?: SequentialAnalysis;
  contamination?: ContaminationCheck[];
}

// User context for allocation
export interface UserContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  platform?: 'web' | 'mobile' | 'api';
  userSegment?: string;
  accountAge?: number;
  hasCompletedOnboarding?: boolean;
  subscription?: string;
  customProperties?: Record<string, any>;
}

// Experiment creation wizard types
export interface ExperimentWizardStep {
  step: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isValid: boolean;
  data?: Record<string, any>;
}

export interface ExperimentWizardState {
  currentStep: number;
  totalSteps: number;
  steps: ExperimentWizardStep[];
  experiment: Partial<ExperimentConfig>;
  variants: Partial<ExperimentVariant>[];
  isValid: boolean;
  errors: Record<string, string[]>;
}

// API request/response types
export interface CreateExperimentRequest {
  name: string;
  description?: string;
  hypothesis?: string;
  type: ExperimentType;
  primaryMetric: string;
  secondaryMetrics?: string[];
  variants: Omit<ExperimentVariant, 'id' | 'experimentId' | 'participants' | 'conversions' | 'conversionRate' | 'totalEvents' | 'uniqueUsers'>[];
  trafficSplit: Record<string, number>;
  minimumSampleSize: number;
  minimumRuntime: number;
  maxRuntime: number;
  confidenceLevel: number;
  minimumDetectableEffect: number;
  statisticalPower: number;
  targetingRules?: TargetingRules;
  inclusionRules?: InclusionRules;
  exclusionRules?: ExclusionRules;
  featureFlagKey?: string;
  featureFlagConfig?: Record<string, any>;
}

export interface UpdateExperimentRequest extends Partial<CreateExperimentRequest> {
  id: string;
}

export interface AllocateUserRequest {
  experimentId: string;
  userContext: UserContext;
  forceVariant?: string; // For testing/debugging
}

export interface AllocateUserResponse {
  variantName: string;
  variantId: string;
  allocationId: string;
  configuration?: Record<string, any>;
  featureFlags?: Record<string, any>;
  isNewAllocation: boolean;
}

export interface TrackEventRequest {
  experimentId: string;
  allocationId?: string;
  eventType: string;
  eventValue?: number;
  eventData?: Record<string, any>;
  userContext?: Partial<UserContext>;
}

export interface GetExperimentResultsRequest {
  experimentId: string;
  metric?: string;
  analysisType?: 'frequentist' | 'bayesian';
  includeSegments?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface GetExperimentResultsResponse {
  experiment: ExperimentDetails;
  overallResults: ExperimentResult[];
  variantComparisons: VariantComparison[];
  segmentAnalysis?: SegmentAnalysis[];
  powerAnalysis: PowerAnalysis;
  recommendations: string[];
}

export interface VariantComparison {
  controlVariant: string;
  treatmentVariant: string;
  metric: string;
  result: FrequentistResult | BayesianResult;
  recommendation: 'launch' | 'continue' | 'stop';
  confidence: number;
}

export interface SegmentAnalysis {
  segment: string;
  segmentValue: string;
  participants: number;
  results: ExperimentResult[];
  isSignificant: boolean;
}

// Hook return types
export interface UseExperimentResult {
  variant: string | null;
  isLoading: boolean;
  configuration?: Record<string, any>;
  featureFlags?: Record<string, any>;
  trackEvent: (eventType: string, eventValue?: number, eventData?: Record<string, any>) => Promise<void>;
  isAllocated: boolean;
  allocationId?: string;
  error?: Error;
}

export interface UseExperimentListResult {
  experiments: ExperimentSummary[];
  isLoading: boolean;
  error?: Error;
  refetch: () => Promise<void>;
  createExperiment: (experiment: CreateExperimentRequest) => Promise<ExperimentDetails>;
  updateExperiment: (experiment: UpdateExperimentRequest) => Promise<ExperimentDetails>;
  deleteExperiment: (experimentId: string) => Promise<void>;
}

export interface UseExperimentResultsResult {
  results?: GetExperimentResultsResponse;
  isLoading: boolean;
  error?: Error;
  refetch: () => Promise<void>;
  isSignificant: boolean;
  winningVariant?: string;
  confidence?: number;
  lift?: number;
}

// Configuration types
export interface ABTestingConfig {
  enabled: boolean;
  defaultConfidenceLevel: number;
  defaultMinimumDetectableEffect: number;
  defaultStatisticalPower: number;
  defaultMinimumSampleSize: number;
  defaultMinimumRuntime: number;
  defaultMaxRuntime: number;
  enableSequentialTesting: boolean;
  enableBayesianAnalysis: boolean;
  enableMultivariateTesting: boolean;
  enableHoldoutGroups: boolean;
  enableContaminationDetection: boolean;
  maxActiveExperiments: number;
  allowedMetrics: string[];
  bucketing: {
    algorithm: 'deterministic' | 'random';
    hashSalt: string;
  };
  analytics: {
    provider: 'internal' | 'external';
    batchSize: number;
    flushInterval: number; // milliseconds
  };
}

// Error types
export class ExperimentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ExperimentError';
  }
}

export class AllocationError extends ExperimentError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'ALLOCATION_ERROR', details);
  }
}

export class StatisticalError extends ExperimentError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'STATISTICAL_ERROR', details);
  }
}

export class ConfigurationError extends ExperimentError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CONFIGURATION_ERROR', details);
  }
}