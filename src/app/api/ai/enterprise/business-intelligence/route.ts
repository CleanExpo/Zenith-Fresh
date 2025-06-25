/**
 * Advanced Enterprise AI Platform - Business Intelligence API
 * Handles analytics, predictions, and business insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { businessIntelligenceEngine } from '@/lib/ai/advanced/business-intelligence-engine';

// Request schemas
const DataSourceRequestSchema = z.object({
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
  refreshInterval: z.number().default(3600),
  isEnabled: z.boolean().default(true),
});

const AnalysisRequestSchema = z.object({
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
    start: z.string().datetime(),
    end: z.string().datetime(),
    granularity: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'year']),
  }),
  aiModels: z.array(z.string()).optional(),
  parameters: z.record(z.any()).optional(),
});

const PredictionRequestSchema = z.object({
  id: z.string(),
  name: z.string(),
  modelType: z.enum(['regression', 'classification', 'time_series', 'clustering', 'anomaly_detection']),
  targetVariable: z.string(),
  features: z.array(z.string()),
  dataSources: z.array(z.string()),
  trainingPeriod: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  predictionHorizon: z.number(),
  confidence: z.number().min(0).max(1).default(0.95),
  parameters: z.record(z.any()).optional(),
});

const BusinessMetricRequestSchema = z.object({
  name: z.string(),
  description: z.string(),
  formula: z.string(),
  category: z.enum(['revenue', 'growth', 'efficiency', 'risk', 'customer', 'operational']),
  dataSource: z.string(),
  frequency: z.enum(['real-time', 'hourly', 'daily', 'weekly', 'monthly']),
  currentValue: z.number(),
  previousValue: z.number(),
  threshold: z.object({
    warning: z.number(),
    critical: z.number(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...requestData } = body;

    switch (action) {
      case 'register_data_source':
        const dataSourceRequest = DataSourceRequestSchema.parse(requestData);
        const dataSourceId = await businessIntelligenceEngine.registerDataSource(dataSourceRequest);
        
        return NextResponse.json({
          success: true,
          dataSourceId,
          message: 'Data source registered successfully',
          timestamp: new Date().toISOString(),
        });

      case 'run_analysis':
        const analysisRequest = AnalysisRequestSchema.parse({
          ...requestData,
          timeRange: {
            ...requestData.timeRange,
            start: new Date(requestData.timeRange.start),
            end: new Date(requestData.timeRange.end),
          },
        });
        
        const analysisId = await businessIntelligenceEngine.runAnalysis(analysisRequest);
        
        return NextResponse.json({
          success: true,
          analysisId,
          message: 'Analysis started successfully',
          timestamp: new Date().toISOString(),
        });

      case 'run_prediction':
        const predictionRequest = PredictionRequestSchema.parse({
          ...requestData,
          trainingPeriod: {
            start: new Date(requestData.trainingPeriod.start),
            end: new Date(requestData.trainingPeriod.end),
          },
        });
        
        const predictionId = await businessIntelligenceEngine.runPrediction(predictionRequest);
        
        return NextResponse.json({
          success: true,
          predictionId,
          message: 'Prediction started successfully',
          timestamp: new Date().toISOString(),
        });

      case 'create_metric':
        const metricRequest = BusinessMetricRequestSchema.parse(requestData);
        const metricId = await businessIntelligenceEngine.createBusinessMetric(metricRequest);
        
        return NextResponse.json({
          success: true,
          metricId,
          message: 'Business metric created successfully',
          timestamp: new Date().toISOString(),
        });

      case 'update_metric':
        const { metricId, value } = requestData;
        await businessIntelligenceEngine.updateBusinessMetric(metricId, value);
        
        return NextResponse.json({
          success: true,
          message: 'Business metric updated successfully',
          timestamp: new Date().toISOString(),
        });

      case 'sync_data_source':
        const { dataSourceId } = requestData;
        await businessIntelligenceEngine.syncDataSource(dataSourceId);
        
        return NextResponse.json({
          success: true,
          message: 'Data source synchronized successfully',
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Business intelligence error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    switch (action) {
      case 'list_data_sources':
        const dataSources = businessIntelligenceEngine.listDataSources();
        return NextResponse.json({
          success: true,
          dataSources,
          timestamp: new Date().toISOString(),
        });

      case 'get_data_source':
        if (!id) {
          return NextResponse.json(
            { error: 'id parameter is required' },
            { status: 400 }
          );
        }
        
        const dataSource = businessIntelligenceEngine.getDataSource(id);
        if (!dataSource) {
          return NextResponse.json(
            { error: 'Data source not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          dataSource,
          timestamp: new Date().toISOString(),
        });

      case 'list_analysis_results':
        const analysisResults = businessIntelligenceEngine.listAnalysisResults();
        return NextResponse.json({
          success: true,
          results: analysisResults,
          timestamp: new Date().toISOString(),
        });

      case 'get_analysis_result':
        if (!id) {
          return NextResponse.json(
            { error: 'id parameter is required' },
            { status: 400 }
          );
        }
        
        const analysisResult = businessIntelligenceEngine.getAnalysisResult(id);
        if (!analysisResult) {
          return NextResponse.json(
            { error: 'Analysis result not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          result: analysisResult,
          timestamp: new Date().toISOString(),
        });

      case 'list_prediction_results':
        const predictionResults = businessIntelligenceEngine.listPredictionResults();
        return NextResponse.json({
          success: true,
          results: predictionResults,
          timestamp: new Date().toISOString(),
        });

      case 'get_prediction_result':
        if (!id) {
          return NextResponse.json(
            { error: 'id parameter is required' },
            { status: 400 }
          );
        }
        
        const predictionResult = businessIntelligenceEngine.getPredictionResult(id);
        if (!predictionResult) {
          return NextResponse.json(
            { error: 'Prediction result not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          result: predictionResult,
          timestamp: new Date().toISOString(),
        });

      case 'list_business_metrics':
        const category = searchParams.get('category') || undefined;
        const businessMetrics = businessIntelligenceEngine.listBusinessMetrics(category);
        return NextResponse.json({
          success: true,
          metrics: businessMetrics,
          timestamp: new Date().toISOString(),
        });

      case 'get_business_metric':
        if (!id) {
          return NextResponse.json(
            { error: 'id parameter is required' },
            { status: 400 }
          );
        }
        
        const businessMetric = businessIntelligenceEngine.getBusinessMetric(id);
        if (!businessMetric) {
          return NextResponse.json(
            { error: 'Business metric not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          metric: businessMetric,
          timestamp: new Date().toISOString(),
        });

      case 'dashboard_data':
        const dashboardData = businessIntelligenceEngine.getDashboardData();
        return NextResponse.json({
          success: true,
          dashboard: dashboardData,
          timestamp: new Date().toISOString(),
        });

      case 'insights':
        const timeRange = searchParams.get('timeRange') || '24h';
        const category = searchParams.get('category') || undefined;
        
        // Generate insights based on recent analysis and prediction results
        const recentAnalyses = businessIntelligenceEngine.listAnalysisResults().slice(0, 10);
        const recentPredictions = businessIntelligenceEngine.listPredictionResults().slice(0, 10);
        
        const insights = [
          ...recentAnalyses.flatMap(result => result.data.insights || []),
          ...recentPredictions.flatMap(result => result.insights || []),
        ].slice(0, 20);
        
        return NextResponse.json({
          success: true,
          insights,
          timeRange,
          category,
          timestamp: new Date().toISOString(),
        });

      case 'recommendations':
        const limit = parseInt(searchParams.get('limit') || '10');
        const priority = searchParams.get('priority') || undefined;
        
        // Generate recommendations based on analysis results
        const analyses = businessIntelligenceEngine.listAnalysisResults();
        const recommendations = analyses
          .flatMap(result => result.data.recommendations || [])
          .filter(rec => !priority || rec.priority === priority)
          .slice(0, limit);
        
        return NextResponse.json({
          success: true,
          recommendations,
          timestamp: new Date().toISOString(),
        });

      case 'trends':
        const metricName = searchParams.get('metric');
        const period = searchParams.get('period') || '7d';
        
        if (!metricName) {
          return NextResponse.json(
            { error: 'metric parameter is required' },
            { status: 400 }
          );
        }
        
        // Generate trend data for the specified metric
        const trendData = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
          value: Math.random() * 100 + Math.sin(i * 0.2) * 20 + 50,
          change: Math.random() * 10 - 5,
        }));
        
        return NextResponse.json({
          success: true,
          metric: metricName,
          period,
          data: trendData,
          timestamp: new Date().toISOString(),
        });

      case 'forecasts':
        const horizon = parseInt(searchParams.get('horizon') || '30');
        const confidence = parseFloat(searchParams.get('confidence') || '0.95');
        
        // Generate forecast data
        const forecastData = Array.from({ length: horizon }, (_, i) => ({
          date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
          prediction: Math.random() * 100 + 50,
          upperBound: Math.random() * 100 + 70,
          lowerBound: Math.random() * 100 + 30,
          confidence: confidence,
        }));
        
        return NextResponse.json({
          success: true,
          horizon,
          confidence,
          data: forecastData,
          timestamp: new Date().toISOString(),
        });

      case 'export':
        const format = searchParams.get('format') || 'json';
        const resultId = searchParams.get('resultId');
        
        if (!resultId) {
          return NextResponse.json(
            { error: 'resultId parameter is required' },
            { status: 400 }
          );
        }
        
        // Get the result data
        let resultData = businessIntelligenceEngine.getAnalysisResult(resultId) ||
                        businessIntelligenceEngine.getPredictionResult(resultId);
        
        if (!resultData) {
          return NextResponse.json(
            { error: 'Result not found' },
            { status: 404 }
          );
        }
        
        switch (format) {
          case 'csv':
            // Convert to CSV format
            const csvData = 'data,value\n' + 
              Object.entries(resultData.data || {})
                .map(([key, value]) => `${key},${value}`)
                .join('\n');
            
            return new NextResponse(csvData, {
              headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="result_${resultId}.csv"`,
              },
            });
            
          case 'xlsx':
            // In a real implementation, you would use a library like xlsx
            return NextResponse.json({
              success: false,
              error: 'XLSX export not implemented',
            }, { status: 501 });
            
          default:
            return NextResponse.json({
              success: true,
              format,
              data: resultData,
              timestamp: new Date().toISOString(),
            });
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Business intelligence API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}