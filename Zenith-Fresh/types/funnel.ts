// ===== CONVERSION FUNNEL TYPE DEFINITIONS =====

import { Decimal } from '@prisma/client/runtime/library';

// Core Funnel Types
export interface FunnelBase {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  teamId?: string;
  projectId?: string;
  category?: string;
  isActive: boolean;
  optimizationGoal?: string;
  benchmarkData?: any;
  timeWindow: number;
  attributionWindow: number;
  allowParallelPaths: boolean;
  requireSequential: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FunnelStep {
  id: string;
  funnelId: string;
  stepNumber: number;
  name: string;
  description?: string;
  eventType: string;
  eventCriteria: any;
  isRequired: boolean;
  timeLimit?: number;
  revenueValue?: Decimal;
  createdAt: Date;
  updatedAt: Date;
}

export interface FunnelGoal {
  id: string;
  funnelId: string;
  name: string;
  description?: string;
  targetMetric: string;
  targetValue: Decimal;
  comparisonType: string;
  priority: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FunnelEvent {
  id: string;
  funnelId: string;
  stepId: string;
  userId?: string;
  sessionId: string;
  eventType: string;
  eventData?: any;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  revenueValue?: Decimal;
  properties?: any;
  createdAt: Date;
}

export interface FunnelAnalysis {
  id: string;
  funnelId: string;
  analysisType: string;
  periodStart: Date;
  periodEnd: Date;
  results: any;
  metrics: any;
  generatedBy?: string;
  generatedAt: Date;
}

export interface FunnelOptimization {
  id: string;
  funnelId: string;
  type: string;
  title: string;
  description: string;
  recommendations: any;
  predictedImpact?: Decimal;
  confidenceScore?: Decimal;
  status: string;
  implementedAt?: Date;
  implementedBy?: string;
  actualImpact?: Decimal;
  measurementPeriod?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FunnelCohort {
  id: string;
  name: string;
  description?: string;
  criteria: any;
  isActive: boolean;
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FunnelComparison {
  id: string;
  funnelId: string;
  cohortId: string;
  comparisonType: string;
  periodStart: Date;
  periodEnd: Date;
  results: any;
  significance?: Decimal;
  winnerDetermined: boolean;
  createdAt: Date;
}

// Extended Types with Relations
export interface FunnelWithSteps extends FunnelBase {
  steps: FunnelStep[];
  goals: FunnelGoal[];
  analyses?: FunnelAnalysis[];
  optimizations?: FunnelOptimization[];
}

export interface FunnelStepWithEvents extends FunnelStep {
  events: FunnelEvent[];
}

// Funnel Builder Types
export interface FunnelStepConfig {
  name: string;
  description?: string;
  eventType: FunnelEventType;
  eventCriteria: EventCriteria;
  isRequired?: boolean;
  timeLimit?: number;
  revenueValue?: number;
}

export interface EventCriteria {
  // Page view criteria
  urlPattern?: string;
  urlMatchType?: 'exact' | 'contains' | 'regex' | 'starts_with' | 'ends_with';
  
  // Click criteria
  elementSelector?: string;
  elementText?: string;
  elementAttributes?: Record<string, string>;
  
  // Form criteria
  formSelector?: string;
  formFields?: string[];
  submitAction?: string;
  
  // Custom criteria
  customEventName?: string;
  customProperties?: Record<string, any>;
  
  // Time constraints
  minTimeOnPage?: number;
  maxTimeOnPage?: number;
}

export interface FunnelGoalConfig {
  name: string;
  description?: string;
  targetMetric: FunnelMetricType;
  targetValue: number;
  comparisonType: 'greater_than' | 'less_than' | 'equals';
  priority?: 'low' | 'medium' | 'high';
}

export interface FunnelConfig {
  name: string;
  description?: string;
  category?: FunnelCategory;
  steps: FunnelStepConfig[];
  goals?: FunnelGoalConfig[];
  optimizationGoal?: OptimizationGoal;
  timeWindow?: number;
  attributionWindow?: number;
  allowParallelPaths?: boolean;
  requireSequential?: boolean;
}

// Analytics Types
export interface FunnelMetrics {
  totalUsers: number;
  totalSessions: number;
  overallConversionRate: number;
  averageTimeToConvert: number;
  averageRevenuePerUser: number;
  totalRevenue: number;
  stepConversionRates: StepConversionRate[];
  dropoffPoints: DropoffPoint[];
  topSources: TrafficSource[];
  cohortPerformance: CohortPerformance[];
}

export interface StepConversionRate {
  stepNumber: number;
  stepName: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
  averageTimeOnStep: number;
  revenueGenerated: number;
}

export interface DropoffPoint {
  fromStep: number;
  toStep: number;
  fromStepName: string;
  toStepName: string;
  dropoffCount: number;
  dropoffRate: number;
  potentialRevenueLoss: number;
  commonReasons?: string[];
}

export interface TrafficSource {
  source: string;
  medium?: string;
  campaign?: string;
  users: number;
  sessions: number;
  conversionRate: number;
  revenuePerUser: number;
}

export interface CohortPerformance {
  cohortName: string;
  users: number;
  conversionRate: number;
  averageTimeToConvert: number;
  revenuePerUser: number;
  significance?: number;
}

// Optimization Types
export interface OptimizationSuggestion {
  id: string;
  type: OptimizationType;
  title: string;
  description: string;
  impact: OptimizationImpact;
  effort: OptimizationEffort;
  confidence: number;
  expectedLift: number;
  category: OptimizationCategory;
  implementation: ImplementationDetails;
  testingRecommendation?: TestingRecommendation;
}

export interface ImplementationDetails {
  steps: string[];
  requirements: string[];
  estimatedTimeHours: number;
  technicalComplexity: 'low' | 'medium' | 'high';
  resources: string[];
}

export interface TestingRecommendation {
  testType: 'ab_test' | 'multivariate' | 'sequential';
  sampleSize: number;
  testDuration: number;
  successMetrics: string[];
  riskAssessment: string;
}

// Cohort Analysis Types
export interface CohortDefinition {
  name: string;
  description?: string;
  criteria: CohortCriteria;
}

export interface CohortCriteria {
  userProperties?: Record<string, any>;
  behaviors?: BehaviorCriteria[];
  timeframe?: TimeframeCriteria;
  demographics?: DemographicsCriteria;
  technographics?: TechnographicsCriteria;
}

export interface BehaviorCriteria {
  action: string;
  frequency?: number;
  timeframe?: string;
  properties?: Record<string, any>;
}

export interface TimeframeCriteria {
  startDate?: Date;
  endDate?: Date;
  registrationPeriod?: string;
  activityPeriod?: string;
}

export interface DemographicsCriteria {
  ageRange?: [number, number];
  location?: string[];
  industry?: string[];
  companySize?: string;
}

export interface TechnographicsCriteria {
  browser?: string[];
  device?: string[];
  operatingSystem?: string[];
  referrer?: string[];
}

// API Request/Response Types
export interface CreateFunnelRequest {
  config: FunnelConfig;
}

export interface CreateFunnelResponse {
  funnel: FunnelWithSteps;
  success: boolean;
  message?: string;
}

export interface TrackFunnelEventRequest {
  funnelId: string;
  stepId: string;
  sessionId: string;
  userId?: string;
  eventType: string;
  eventData?: any;
  properties?: any;
  revenueValue?: number;
}

export interface TrackFunnelEventResponse {
  success: boolean;
  eventId: string;
  nextSuggestedStep?: string;
  message?: string;
}

export interface GetFunnelAnalyticsRequest {
  funnelId: string;
  periodStart: Date;
  periodEnd: Date;
  analysisTypes?: FunnelAnalysisType[];
  cohortIds?: string[];
  compareWithPrevious?: boolean;
}

export interface GetFunnelAnalyticsResponse {
  metrics: FunnelMetrics;
  analyses: FunnelAnalysis[];
  comparisons?: FunnelComparison[];
  success: boolean;
}

export interface GetOptimizationSuggestionsRequest {
  funnelId: string;
  analysisTypes?: OptimizationType[];
  minConfidence?: number;
  maxSuggestions?: number;
}

export interface GetOptimizationSuggestionsResponse {
  suggestions: OptimizationSuggestion[];
  summary: OptimizationSummary;
  success: boolean;
}

export interface OptimizationSummary {
  totalSuggestions: number;
  highImpactSuggestions: number;
  quickWins: number;
  estimatedTotalLift: number;
  prioritizedSuggestions: OptimizationSuggestion[];
}

// Enums
export enum FunnelEventType {
  PAGE_VIEW = 'PAGE_VIEW',
  BUTTON_CLICK = 'BUTTON_CLICK',
  FORM_SUBMIT = 'FORM_SUBMIT',
  PURCHASE = 'PURCHASE',
  SIGNUP = 'SIGNUP',
  LOGIN = 'LOGIN',
  CUSTOM = 'CUSTOM'
}

export enum FunnelAnalysisType {
  CONVERSION_RATE = 'CONVERSION_RATE',
  DROPOFF_ANALYSIS = 'DROPOFF_ANALYSIS',
  COHORT_ANALYSIS = 'COHORT_ANALYSIS', 
  TIME_ANALYSIS = 'TIME_ANALYSIS',
  ATTRIBUTION_ANALYSIS = 'ATTRIBUTION_ANALYSIS',
  REVENUE_ANALYSIS = 'REVENUE_ANALYSIS'
}

export enum FunnelCategory {
  SIGNUP = 'signup',
  PURCHASE = 'purchase',
  ACTIVATION = 'activation',
  RETENTION = 'retention',
  REFERRAL = 'referral',
  CUSTOM = 'custom'
}

export enum OptimizationGoal {
  CONVERSION_RATE = 'conversion_rate',
  REVENUE = 'revenue',
  TIME_TO_CONVERT = 'time_to_convert',
  USER_SATISFACTION = 'user_satisfaction'
}

export enum FunnelMetricType {
  CONVERSION_RATE = 'conversion_rate',
  COMPLETION_TIME = 'completion_time',
  REVENUE_PER_USER = 'revenue_per_user',
  STEP_COMPLETION_RATE = 'step_completion_rate',
  SESSION_CONVERSION_RATE = 'session_conversion_rate'
}

export enum OptimizationType {
  COPY_OPTIMIZATION = 'copy_optimization',
  DESIGN_IMPROVEMENT = 'design_improvement',
  FLOW_SIMPLIFICATION = 'flow_simplification',
  TECHNICAL_FIX = 'technical_fix',
  PERSONALIZATION = 'personalization',
  SOCIAL_PROOF = 'social_proof',
  URGENCY_SCARCITY = 'urgency_scarcity',
  FORM_OPTIMIZATION = 'form_optimization'
}

export enum OptimizationImpact {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum OptimizationEffort {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum OptimizationCategory {
  UX_IMPROVEMENT = 'ux_improvement',
  PERFORMANCE = 'performance',
  CONTENT = 'content',
  TECHNICAL = 'technical',
  MARKETING = 'marketing'
}

// Dashboard Component Props
export interface FunnelDashboardProps {
  funnelId: string;
  dateRange?: [Date, Date];
  showComparisons?: boolean;
  showOptimizations?: boolean;
}

export interface FunnelBuilderProps {
  onFunnelCreated: (funnel: FunnelWithSteps) => void;
  initialConfig?: Partial<FunnelConfig>;
  teamId?: string;
  projectId?: string;
}

export interface FunnelVisualizationProps {
  funnel: FunnelWithSteps;
  metrics: FunnelMetrics;
  highlightDropoffs?: boolean;
  showRevenue?: boolean;
  interactive?: boolean;
}

// Utility Types
export type FunnelStepStatus = 'not_started' | 'in_progress' | 'completed' | 'dropped_off';
export type FunnelUserJourney = {
  userId: string;
  sessionId: string;
  steps: {
    stepId: string;
    status: FunnelStepStatus;
    timestamp?: Date;
    timeSpent?: number;
  }[];
  overallStatus: FunnelStepStatus;
  conversionTime?: number;
  revenueGenerated?: number;
};

export type FunnelHealthScore = {
  overall: number;
  conversionRate: number;
  dropoffRate: number;
  timeToConvert: number;
  revenuePerformance: number;
  userExperience: number;
};

// Error Types
export interface FunnelError {
  code: string;
  message: string;
  details?: any;
}

export class FunnelValidationError extends Error {
  constructor(public field: string, message: string) {
    super(`Validation error for ${field}: ${message}`);
    this.name = 'FunnelValidationError';
  }
}

export class FunnelTrackingError extends Error {
  constructor(public eventType: string, message: string) {
    super(`Tracking error for ${eventType}: ${message}`);
    this.name = 'FunnelTrackingError';
  }
}