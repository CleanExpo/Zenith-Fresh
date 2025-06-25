// Business Intelligence Analytics Types

export interface TimeRange {
  start: Date;
  end: Date;
  interval?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface DataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface TimeSeries {
  name: string;
  data: DataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area' | 'scatter';
}

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  unit?: string;
  type: 'number' | 'percentage' | 'currency' | 'duration';
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count';
  format?: string;
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  target?: number;
  trend: 'up' | 'down' | 'stable';
  change?: number;
  changePercentage?: number;
  status: 'good' | 'warning' | 'critical';
  sparkline?: DataPoint[];
}

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'map' | 'custom';
  title: string;
  description?: string;
  size: { w: number; h: number };
  position: { x: number; y: number };
  config: Record<string, any>;
  dataSource?: string;
  refreshInterval?: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  filters?: DashboardFilter[];
  layout: 'grid' | 'freeform';
  theme?: 'light' | 'dark' | 'auto';
  isPublic?: boolean;
  tags?: string[];
}

export interface DashboardFilter {
  id: string;
  type: 'date' | 'select' | 'multiselect' | 'range' | 'search';
  field: string;
  label: string;
  defaultValue?: any;
  options?: Array<{ label: string; value: any }>;
}

// Cohort Analysis Types
export interface CohortDefinition {
  id: string;
  name: string;
  criteria: CohortCriteria[];
  timeframe: TimeRange;
}

export interface CohortCriteria {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
}

export interface CohortMetrics {
  cohortId: string;
  cohortName: string;
  size: number;
  retention: RetentionData[];
  revenue?: number;
  avgLifetimeValue?: number;
  churnRate?: number;
}

export interface RetentionData {
  period: number;
  retained: number;
  percentage: number;
}

// A/B Testing Types
export interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: TestVariant[];
  metrics: string[];
  audience?: AudienceSegment;
  startDate?: Date;
  endDate?: Date;
  results?: TestResults;
}

export interface TestVariant {
  id: string;
  name: string;
  description?: string;
  allocation: number; // percentage
  isControl?: boolean;
  changes: Record<string, any>;
}

export interface TestResults {
  winner?: string;
  confidence: number;
  sampleSize: number;
  variants: VariantResults[];
  statisticalSignificance: boolean;
}

export interface VariantResults {
  variantId: string;
  conversions: number;
  conversionRate: number;
  averageValue?: number;
  confidence?: number;
  uplift?: number;
}

export interface AudienceSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria[];
  size?: number;
}

export interface SegmentCriteria {
  type: 'demographic' | 'behavioral' | 'geographic' | 'technographic';
  field: string;
  operator: string;
  value: any;
}

// Predictive Analytics Types
export interface PredictiveModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'timeseries' | 'clustering';
  target: string;
  features: string[];
  accuracy?: number;
  status: 'training' | 'ready' | 'failed';
  lastTrained?: Date;
}

export interface Prediction {
  modelId: string;
  timestamp: Date;
  prediction: any;
  confidence: number;
  factors?: Array<{ feature: string; impact: number }>;
}

export interface AnomalyDetection {
  id: string;
  metric: string;
  timestamp: Date;
  actualValue: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'spike' | 'drop' | 'trend_change' | 'seasonality';
}

// Report Builder Types
export interface Report {
  id: string;
  name: string;
  description?: string;
  sections: ReportSection[];
  schedule?: ReportSchedule;
  format: 'pdf' | 'excel' | 'html' | 'powerpoint';
  recipients?: string[];
  filters?: ReportFilter[];
}

export interface ReportSection {
  id: string;
  type: 'text' | 'chart' | 'table' | 'image' | 'metric';
  title?: string;
  content: any;
  layout?: 'full' | 'half' | 'third';
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string;
  timezone: string;
  enabled: boolean;
}

export interface ReportFilter {
  field: string;
  label: string;
  type: string;
  value?: any;
}

// Data Export Types
export interface ExportConfig {
  format: 'csv' | 'json' | 'excel' | 'parquet';
  fields?: string[];
  filters?: Record<string, any>;
  compression?: boolean;
  encryption?: boolean;
}

// Role-Based Access Control
export interface DataPermission {
  resource: string;
  actions: ('read' | 'write' | 'delete' | 'share')[];
  conditions?: Record<string, any>;
}

export interface DataRole {
  id: string;
  name: string;
  description?: string;
  permissions: DataPermission[];
  dashboards?: string[];
  reports?: string[];
  dataScopes?: string[];
}

// Real-time Analytics
export interface StreamingMetric {
  id: string;
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface StreamingConfig {
  source: string;
  metrics: string[];
  aggregationWindow: number; // seconds
  bufferSize: number;
  filters?: Record<string, any>;
}

// Business Intelligence Insights
export interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'forecast' | 'recommendation';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  metric?: string;
  confidence: number;
  actionable: boolean;
  suggestedActions?: string[];
  relatedData?: any;
  timestamp: Date;
}

export interface InsightRule {
  id: string;
  name: string;
  condition: string;
  threshold?: number;
  action: 'alert' | 'report' | 'dashboard';
  enabled: boolean;
}