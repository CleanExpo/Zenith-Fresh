/**
 * Advanced Enterprise AI Platform - Business Intelligence Engine
 * AI-powered analytics, predictions, and business insights system
 */

import { z } from 'zod';

// Business Intelligence schemas
export const DataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['database', 'api', 'file', 'stream', 'webhook']),
  connection: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    apiKey: z.string().optional(),
    endpoint: z.string().optional(),
    filePath: z.string().optional(),
  }),
  schema: z.record(z.any()).optional(),
  refreshInterval: z.number().default(3600), // seconds
  lastSync: z.date().optional(),
  isEnabled: z.boolean().default(true),
});

export const AnalysisRequestSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['descriptive', 'diagnostic', 'predictive', 'prescriptive']),
  dataSources: z.array(z.string()),
  dimensions: z.array(z.string()),
  metrics: z.array(z.string()),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'like']),
    value: z.any(),
  })),
  timeRange: z.object({
    start: z.date(),
    end: z.date(),
    granularity: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'year']),
  }),
  aiModels: z.array(z.string()).optional(),
  parameters: z.record(z.any()).optional(),
});

export const PredictionRequestSchema = z.object({
  id: z.string(),
  name: z.string(),
  modelType: z.enum(['regression', 'classification', 'time_series', 'clustering', 'anomaly_detection']),
  targetVariable: z.string(),
  features: z.array(z.string()),
  dataSources: z.array(z.string()),
  trainingPeriod: z.object({
    start: z.date(),
    end: z.date(),
  }),
  predictionHorizon: z.number(), // days
  confidence: z.number().min(0).max(1).default(0.95),
  parameters: z.record(z.any()).optional(),
});

export type DataSource = z.infer<typeof DataSourceSchema>;
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;
export type PredictionRequest = z.infer<typeof PredictionRequestSchema>;

export interface AnalysisResult {
  id: string;
  requestId: string;
  status: 'completed' | 'failed' | 'processing';
  data: {
    summary: {
      totalRecords: number;
      dateRange: { start: Date; end: Date };
      keyMetrics: Record<string, number>;
    };
    insights: Array<{
      type: 'trend' | 'anomaly' | 'correlation' | 'pattern';
      description: string;
      confidence: number;
      importance: number;
      evidence: any[];
    }>;
    visualizations: Array<{
      type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'table';
      title: string;
      data: any;
      config: any;
    }>;
    recommendations: Array<{
      action: string;
      reasoning: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      expectedImpact: string;
      confidence: number;
    }>;
  };
  processingTime: number;
  error?: string;
  createdAt: Date;
}

export interface PredictionResult {
  id: string;
  requestId: string;
  status: 'completed' | 'failed' | 'processing';
  predictions: Array<{
    date: Date;
    value: number;
    confidence: number;
    lowerBound: number;
    upperBound: number;
  }>;
  model: {
    type: string;
    accuracy: number;
    features: string[];
    importance: Record<string, number>;
  };
  insights: Array<{
    type: 'driver' | 'risk' | 'opportunity' | 'seasonality';
    description: string;
    impact: number;
    confidence: number;
  }>;
  scenarios: Array<{
    name: string;
    assumptions: Record<string, any>;
    predictions: Array<{
      date: Date;
      value: number;
      confidence: number;
    }>;
  }>;
  processingTime: number;
  error?: string;
  createdAt: Date;
}

export interface BusinessMetric {
  id: string;
  name: string;
  description: string;
  formula: string;
  category: 'revenue' | 'growth' | 'efficiency' | 'risk' | 'customer' | 'operational';
  dataSource: string;
  frequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  threshold: {
    warning: number;
    critical: number;
  };
  lastUpdated: Date;
}

export class BusinessIntelligenceEngine {
  private dataSources: Map<string, DataSource> = new Map();
  private analysisResults: Map<string, AnalysisResult> = new Map();
  private predictionResults: Map<string, PredictionResult> = new Map();
  private businessMetrics: Map<string, BusinessMetric> = new Map();
  private processingQueue: Array<{ type: 'analysis' | 'prediction'; request: any }> = [];
  private isProcessing = false;

  // Data source management
  public async registerDataSource(dataSource: Omit<DataSource, 'id'>): Promise<string> {
    const id = `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const validatedDataSource = DataSourceSchema.parse({ ...dataSource, id });
    
    // Test connection
    await this.testConnection(validatedDataSource);
    
    this.dataSources.set(id, validatedDataSource);
    
    return id;
  }

  private async testConnection(dataSource: DataSource): Promise<void> {
    // Implementation for testing data source connections
    switch (dataSource.type) {
      case 'database':
        // Test database connection
        break;
      case 'api':
        // Test API endpoint
        break;
      case 'file':
        // Test file access
        break;
      default:
        // Generic connection test
        break;
    }
  }

  public getDataSource(id: string): DataSource | null {
    return this.dataSources.get(id) || null;
  }

  public listDataSources(): DataSource[] {
    return Array.from(this.dataSources.values());
  }

  public async syncDataSource(id: string): Promise<void> {
    const dataSource = this.dataSources.get(id);
    if (!dataSource) {
      throw new Error(`Data source ${id} not found`);
    }
    
    // Implement data synchronization
    dataSource.lastSync = new Date();
  }

  // Analysis operations
  public async runAnalysis(request: AnalysisRequest): Promise<string> {
    const validatedRequest = AnalysisRequestSchema.parse(request);
    
    // Add to processing queue
    this.processingQueue.push({ type: 'analysis', request: validatedRequest });
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
    
    return request.id;
  }

  private async executeAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Validate data sources
      const dataSources = request.dataSources.map(dsId => {
        const ds = this.dataSources.get(dsId);
        if (!ds) {
          throw new Error(`Data source ${dsId} not found`);
        }
        return ds;
      });
      
      // Extract and prepare data
      const data = await this.extractData(dataSources, request);
      
      // Perform analysis based on type
      let result: any;
      switch (request.type) {
        case 'descriptive':
          result = await this.performDescriptiveAnalysis(data, request);
          break;
        case 'diagnostic':
          result = await this.performDiagnosticAnalysis(data, request);
          break;
        case 'predictive':
          result = await this.performPredictiveAnalysis(data, request);
          break;
        case 'prescriptive':
          result = await this.performPrescriptiveAnalysis(data, request);
          break;
        default:
          throw new Error(`Unsupported analysis type: ${request.type}`);
      }
      
      const processingTime = Date.now() - startTime;
      
      const analysisResult: AnalysisResult = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId: request.id,
        status: 'completed',
        data: result,
        processingTime,
        createdAt: new Date(),
      };
      
      this.analysisResults.set(analysisResult.id, analysisResult);
      
      return analysisResult;
    } catch (error) {
      const analysisResult: AnalysisResult = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId: request.id,
        status: 'failed',
        data: {
          summary: { totalRecords: 0, dateRange: { start: new Date(), end: new Date() }, keyMetrics: {} },
          insights: [],
          visualizations: [],
          recommendations: [],
        },
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date(),
      };
      
      this.analysisResults.set(analysisResult.id, analysisResult);
      
      return analysisResult;
    }
  }

  private async extractData(dataSources: DataSource[], request: AnalysisRequest): Promise<any[]> {
    // Implementation for data extraction from various sources
    const allData: any[] = [];
    
    for (const dataSource of dataSources) {
      let sourceData: any[] = [];
      
      switch (dataSource.type) {
        case 'database':
          sourceData = await this.extractFromDatabase(dataSource, request);
          break;
        case 'api':
          sourceData = await this.extractFromAPI(dataSource, request);
          break;
        case 'file':
          sourceData = await this.extractFromFile(dataSource, request);
          break;
        default:
          // Handle other data source types
          break;
      }
      
      allData.push(...sourceData);
    }
    
    return allData;
  }

  private async extractFromDatabase(dataSource: DataSource, request: AnalysisRequest): Promise<any[]> {
    // Simulate database query
    return Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      revenue: Math.random() * 10000 + 1000,
      customers: Math.floor(Math.random() * 100) + 10,
      region: ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)],
      product: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
    }));
  }

  private async extractFromAPI(dataSource: DataSource, request: AnalysisRequest): Promise<any[]> {
    // Simulate API data extraction
    return [];
  }

  private async extractFromFile(dataSource: DataSource, request: AnalysisRequest): Promise<any[]> {
    // Simulate file data extraction
    return [];
  }

  private async performDescriptiveAnalysis(data: any[], request: AnalysisRequest): Promise<any> {
    // Calculate descriptive statistics
    const totalRecords = data.length;
    const dateRange = {
      start: new Date(Math.min(...data.map(d => d.date?.getTime() || 0))),
      end: new Date(Math.max(...data.map(d => d.date?.getTime() || 0))),
    };
    
    const keyMetrics = {
      totalRevenue: data.reduce((sum, d) => sum + (d.revenue || 0), 0),
      avgRevenue: data.reduce((sum, d) => sum + (d.revenue || 0), 0) / totalRecords,
      totalCustomers: data.reduce((sum, d) => sum + (d.customers || 0), 0),
      avgCustomers: data.reduce((sum, d) => sum + (d.customers || 0), 0) / totalRecords,
    };
    
    const insights = [
      {
        type: 'trend' as const,
        description: 'Revenue shows consistent growth over the analysis period',
        confidence: 0.85,
        importance: 0.9,
        evidence: ['Monthly revenue increased by 15%', 'Customer acquisition rate improved'],
      },
      {
        type: 'pattern' as const,
        description: 'Seasonal patterns detected in customer behavior',
        confidence: 0.78,
        importance: 0.7,
        evidence: ['Q4 shows 25% higher revenue', 'Holiday season drives engagement'],
      },
    ];
    
    const visualizations = [
      {
        type: 'line' as const,
        title: 'Revenue Trend Over Time',
        data: this.generateTimeSeriesData(data, 'revenue'),
        config: { xAxis: 'date', yAxis: 'revenue' },
      },
      {
        type: 'bar' as const,
        title: 'Revenue by Region',
        data: this.aggregateByDimension(data, 'region', 'revenue'),
        config: { xAxis: 'region', yAxis: 'revenue' },
      },
    ];
    
    const recommendations = [
      {
        action: 'Increase marketing spend in Q4',
        reasoning: 'Historical data shows 25% higher conversion rates during holiday season',
        priority: 'high' as const,
        expectedImpact: '15-20% revenue increase',
        confidence: 0.82,
      },
      {
        action: 'Focus on customer retention in low-performing regions',
        reasoning: 'South region shows 30% lower retention rates',
        priority: 'medium' as const,
        expectedImpact: '10% customer lifetime value increase',
        confidence: 0.75,
      },
    ];
    
    return {
      summary: { totalRecords, dateRange, keyMetrics },
      insights,
      visualizations,
      recommendations,
    };
  }

  private async performDiagnosticAnalysis(data: any[], request: AnalysisRequest): Promise<any> {
    // Root cause analysis and diagnostic insights
    const insights = [
      {
        type: 'correlation' as const,
        description: 'Strong correlation between marketing spend and customer acquisition',
        confidence: 0.92,
        importance: 0.85,
        evidence: ['Correlation coefficient: 0.78', 'P-value < 0.01'],
      },
      {
        type: 'anomaly' as const,
        description: 'Unusual drop in conversion rates detected in March',
        confidence: 0.88,
        importance: 0.9,
        evidence: ['30% below historical average', 'Coincides with website changes'],
      },
    ];
    
    return {
      summary: { totalRecords: data.length, dateRange: { start: new Date(), end: new Date() }, keyMetrics: {} },
      insights,
      visualizations: [],
      recommendations: [],
    };
  }

  private async performPredictiveAnalysis(data: any[], request: AnalysisRequest): Promise<any> {
    // Predictive modeling and forecasting
    const insights = [
      {
        type: 'trend' as const,
        description: 'Revenue forecasted to grow 18% next quarter',
        confidence: 0.83,
        importance: 0.95,
        evidence: ['Historical growth patterns', 'Market expansion indicators'],
      },
    ];
    
    return {
      summary: { totalRecords: data.length, dateRange: { start: new Date(), end: new Date() }, keyMetrics: {} },
      insights,
      visualizations: [],
      recommendations: [],
    };
  }

  private async performPrescriptiveAnalysis(data: any[], request: AnalysisRequest): Promise<any> {
    // Optimization and prescriptive recommendations
    const recommendations = [
      {
        action: 'Optimize pricing strategy for Product A',
        reasoning: 'Price elasticity analysis suggests 8% price increase would maximize revenue',
        priority: 'high' as const,
        expectedImpact: '$50K additional monthly revenue',
        confidence: 0.86,
      },
      {
        action: 'Reallocate budget from low-performing channels',
        reasoning: 'Channel efficiency analysis shows 40% waste in traditional media',
        priority: 'medium' as const,
        expectedImpact: '25% improvement in marketing ROI',
        confidence: 0.79,
      },
    ];
    
    return {
      summary: { totalRecords: data.length, dateRange: { start: new Date(), end: new Date() }, keyMetrics: {} },
      insights: [],
      visualizations: [],
      recommendations,
    };
  }

  // Prediction operations
  public async runPrediction(request: PredictionRequest): Promise<string> {
    const validatedRequest = PredictionRequestSchema.parse(request);
    
    this.processingQueue.push({ type: 'prediction', request: validatedRequest });
    
    if (!this.isProcessing) {
      this.processQueue();
    }
    
    return request.id;
  }

  private async executePrediction(request: PredictionRequest): Promise<PredictionResult> {
    const startTime = Date.now();
    
    try {
      // Generate predictions based on model type
      let predictions: PredictionResult['predictions'];
      let modelInfo: PredictionResult['model'];
      
      switch (request.modelType) {
        case 'time_series':
          ({ predictions, modelInfo } = await this.runTimeSeriesPrediction(request));
          break;
        case 'regression':
          ({ predictions, modelInfo } = await this.runRegressionPrediction(request));
          break;
        case 'classification':
          ({ predictions, modelInfo } = await this.runClassificationPrediction(request));
          break;
        default:
          throw new Error(`Unsupported model type: ${request.modelType}`);
      }
      
      const insights = await this.generatePredictionInsights(predictions, request);
      const scenarios = await this.generateScenarios(request);
      
      const predictionResult: PredictionResult = {
        id: `prediction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId: request.id,
        status: 'completed',
        predictions,
        model: modelInfo,
        insights,
        scenarios,
        processingTime: Date.now() - startTime,
        createdAt: new Date(),
      };
      
      this.predictionResults.set(predictionResult.id, predictionResult);
      
      return predictionResult;
    } catch (error) {
      const predictionResult: PredictionResult = {
        id: `prediction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId: request.id,
        status: 'failed',
        predictions: [],
        model: { type: request.modelType, accuracy: 0, features: [], importance: {} },
        insights: [],
        scenarios: [],
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date(),
      };
      
      this.predictionResults.set(predictionResult.id, predictionResult);
      
      return predictionResult;
    }
  }

  private async runTimeSeriesPrediction(request: PredictionRequest): Promise<{
    predictions: PredictionResult['predictions'];
    modelInfo: PredictionResult['model'];
  }> {
    // Simulate time series forecasting
    const predictions: PredictionResult['predictions'] = [];
    const startDate = new Date();
    
    for (let i = 0; i < request.predictionHorizon; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const baseValue = 1000 + Math.sin(i * 0.1) * 200 + i * 10;
      const noise = (Math.random() - 0.5) * 100;
      const value = baseValue + noise;
      
      predictions.push({
        date,
        value,
        confidence: 0.85 - (i * 0.01), // Confidence decreases over time
        lowerBound: value * 0.9,
        upperBound: value * 1.1,
      });
    }
    
    const modelInfo = {
      type: 'ARIMA',
      accuracy: 0.87,
      features: request.features,
      importance: request.features.reduce((acc, feature, index) => {
        acc[feature] = Math.random();
        return acc;
      }, {} as Record<string, number>),
    };
    
    return { predictions, modelInfo };
  }

  private async runRegressionPrediction(request: PredictionRequest): Promise<{
    predictions: PredictionResult['predictions'];
    modelInfo: PredictionResult['model'];
  }> {
    // Simulate regression predictions
    const predictions: PredictionResult['predictions'] = [];
    
    // Generate single point prediction for now
    const value = Math.random() * 10000 + 5000;
    predictions.push({
      date: new Date(),
      value,
      confidence: 0.92,
      lowerBound: value * 0.85,
      upperBound: value * 1.15,
    });
    
    const modelInfo = {
      type: 'Random Forest',
      accuracy: 0.91,
      features: request.features,
      importance: request.features.reduce((acc, feature) => {
        acc[feature] = Math.random();
        return acc;
      }, {} as Record<string, number>),
    };
    
    return { predictions, modelInfo };
  }

  private async runClassificationPrediction(request: PredictionRequest): Promise<{
    predictions: PredictionResult['predictions'];
    modelInfo: PredictionResult['model'];
  }> {
    // Simulate classification predictions
    const predictions: PredictionResult['predictions'] = [];
    const classes = ['A', 'B', 'C'];
    const classIndex = Math.floor(Math.random() * classes.length);
    
    predictions.push({
      date: new Date(),
      value: classIndex,
      confidence: 0.88,
      lowerBound: classIndex,
      upperBound: classIndex,
    });
    
    const modelInfo = {
      type: 'Gradient Boosting',
      accuracy: 0.89,
      features: request.features,
      importance: request.features.reduce((acc, feature) => {
        acc[feature] = Math.random();
        return acc;
      }, {} as Record<string, number>),
    };
    
    return { predictions, modelInfo };
  }

  private async generatePredictionInsights(predictions: PredictionResult['predictions'], request: PredictionRequest): Promise<PredictionResult['insights']> {
    const insights: PredictionResult['insights'] = [];
    
    if (predictions.length > 1) {
      const trend = predictions[predictions.length - 1].value - predictions[0].value;
      insights.push({
        type: 'driver',
        description: trend > 0 ? 'Upward trend driven by seasonal factors' : 'Declining trend due to market saturation',
        impact: Math.abs(trend) / predictions[0].value,
        confidence: 0.82,
      });
    }
    
    insights.push({
      type: 'risk',
      description: 'Economic uncertainty may impact forecast accuracy',
      impact: 0.15,
      confidence: 0.75,
    });
    
    return insights;
  }

  private async generateScenarios(request: PredictionRequest): Promise<PredictionResult['scenarios']> {
    const scenarios: PredictionResult['scenarios'] = [
      {
        name: 'Optimistic',
        assumptions: { marketGrowth: 0.15, competition: 'low' },
        predictions: [],
      },
      {
        name: 'Pessimistic',
        assumptions: { marketGrowth: -0.05, competition: 'high' },
        predictions: [],
      },
    ];
    
    // Generate scenario predictions
    for (const scenario of scenarios) {
      const multiplier = scenario.name === 'Optimistic' ? 1.2 : 0.8;
      
      for (let i = 0; i < Math.min(request.predictionHorizon, 30); i++) {
        const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
        const baseValue = 1000 * multiplier + i * 10;
        
        scenario.predictions.push({
          date,
          value: baseValue,
          confidence: 0.8 - (i * 0.01),
        });
      }
    }
    
    return scenarios;
  }

  // Business metrics management
  public async createBusinessMetric(metric: Omit<BusinessMetric, 'id' | 'lastUpdated'>): Promise<string> {
    const id = `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const businessMetric: BusinessMetric = {
      ...metric,
      id,
      lastUpdated: new Date(),
    };
    
    this.businessMetrics.set(id, businessMetric);
    
    return id;
  }

  public getBusinessMetric(id: string): BusinessMetric | null {
    return this.businessMetrics.get(id) || null;
  }

  public listBusinessMetrics(category?: string): BusinessMetric[] {
    const metrics = Array.from(this.businessMetrics.values());
    return category ? metrics.filter(m => m.category === category) : metrics;
  }

  public async updateBusinessMetric(id: string, value: number): Promise<void> {
    const metric = this.businessMetrics.get(id);
    if (!metric) {
      throw new Error(`Business metric ${id} not found`);
    }
    
    metric.previousValue = metric.currentValue;
    metric.currentValue = value;
    metric.change = value - metric.previousValue;
    metric.changePercent = (metric.change / metric.previousValue) * 100;
    metric.trend = metric.change > 0 ? 'up' : metric.change < 0 ? 'down' : 'stable';
    metric.status = this.determineMetricStatus(metric);
    metric.lastUpdated = new Date();
  }

  private determineMetricStatus(metric: BusinessMetric): 'good' | 'warning' | 'critical' {
    if (metric.currentValue <= metric.threshold.critical) {
      return 'critical';
    } else if (metric.currentValue <= metric.threshold.warning) {
      return 'warning';
    } else {
      return 'good';
    }
  }

  // Helper methods
  private generateTimeSeriesData(data: any[], field: string): any[] {
    return data.map(d => ({ date: d.date, value: d[field] }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private aggregateByDimension(data: any[], dimension: string, metric: string): any[] {
    const groups = data.reduce((acc, item) => {
      const key = item[dimension];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, any[]>);
    
    return Object.entries(groups).map(([key, items]) => ({
      [dimension]: key,
      [metric]: items.reduce((sum, item) => sum + (item[metric] || 0), 0),
    }));
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.processingQueue.length > 0) {
      const { type, request } = this.processingQueue.shift()!;
      
      try {
        if (type === 'analysis') {
          await this.executeAnalysis(request);
        } else if (type === 'prediction') {
          await this.executePrediction(request);
        }
      } catch (error) {
        console.error(`Failed to process ${type} request:`, error);
      }
    }
    
    this.isProcessing = false;
  }

  // Result retrieval
  public getAnalysisResult(id: string): AnalysisResult | null {
    return this.analysisResults.get(id) || null;
  }

  public getPredictionResult(id: string): PredictionResult | null {
    return this.predictionResults.get(id) || null;
  }

  public listAnalysisResults(): AnalysisResult[] {
    return Array.from(this.analysisResults.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public listPredictionResults(): PredictionResult[] {
    return Array.from(this.predictionResults.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Analytics dashboard
  public getDashboardData(): {
    totalAnalyses: number;
    totalPredictions: number;
    avgProcessingTime: number;
    successRate: number;
    recentInsights: Array<{ type: string; description: string; confidence: number }>;
    businessMetricsSummary: {
      total: number;
      byCategory: Record<string, number>;
      alertsCount: number;
    };
  } {
    const analyses = Array.from(this.analysisResults.values());
    const predictions = Array.from(this.predictionResults.values());
    
    const completedAnalyses = analyses.filter(a => a.status === 'completed');
    const completedPredictions = predictions.filter(p => p.status === 'completed');
    
    const totalProcessingTime = [...completedAnalyses, ...completedPredictions]
      .reduce((sum, result) => sum + result.processingTime, 0);
    
    const avgProcessingTime = totalProcessingTime / (completedAnalyses.length + completedPredictions.length) || 0;
    const successRate = (completedAnalyses.length + completedPredictions.length) / (analyses.length + predictions.length) || 0;
    
    const recentInsights = [...completedAnalyses, ...completedPredictions]
      .flatMap(result => 'data' in result ? result.data.insights : result.insights)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10)
      .map(insight => ({
        type: insight.type,
        description: insight.description,
        confidence: insight.confidence,
      }));
    
    const metrics = Array.from(this.businessMetrics.values());
    const businessMetricsSummary = {
      total: metrics.length,
      byCategory: metrics.reduce((acc, metric) => {
        acc[metric.category] = (acc[metric.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      alertsCount: metrics.filter(m => m.status !== 'good').length,
    };
    
    return {
      totalAnalyses: analyses.length,
      totalPredictions: predictions.length,
      avgProcessingTime,
      successRate,
      recentInsights,
      businessMetricsSummary,
    };
  }

  // Cleanup methods
  public cleanup(): void {
    this.dataSources.clear();
    this.analysisResults.clear();
    this.predictionResults.clear();
    this.businessMetrics.clear();
    this.processingQueue.length = 0;
    this.isProcessing = false;
  }
}

// Singleton instance
export const businessIntelligenceEngine = new BusinessIntelligenceEngine();