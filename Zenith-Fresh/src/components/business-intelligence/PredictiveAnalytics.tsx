'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AdvancedChart } from './charts/AdvancedChart';
import { D3Chart } from './charts/D3Chart';
import { 
  PredictiveModel, 
  Prediction, 
  AnomalyDetection, 
  TimeSeries, 
  DataPoint,
  Insight 
} from '@/types/business-intelligence/analytics';
import { DataProcessor } from '@/lib/business-intelligence/data-processing';

interface PredictiveAnalyticsProps {
  projectId?: string;
  timeRange?: { start: Date; end: Date };
  theme?: 'light' | 'dark';
}

interface ModelTrainingJob {
  id: string;
  modelType: string;
  status: 'queued' | 'training' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  accuracy?: number;
  error?: string;
}

export function PredictiveAnalytics({
  projectId,
  timeRange,
  theme = 'light'
}: PredictiveAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'forecasting' | 'anomalies' | 'insights' | 'models'>('forecasting');
  const [models, setModels] = useState<PredictiveModel[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [trainingJobs, setTrainingJobs] = useState<ModelTrainingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [forecastHorizon, setForecastHorizon] = useState<number>(30);

  // Historical data for forecasting
  const [historicalData, setHistoricalData] = useState<TimeSeries[]>([]);
  const [forecastData, setForecastData] = useState<TimeSeries[]>([]);

  useEffect(() => {
    fetchPredictiveData();
  }, [projectId, timeRange]);

  const fetchPredictiveData = async () => {
    setLoading(true);
    try {
      // Simulate API calls
      await Promise.all([
        fetchModels(),
        fetchPredictions(),
        fetchAnomalies(),
        fetchInsights(),
        fetchHistoricalData()
      ]);
    } catch (error) {
      console.error('Error fetching predictive analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    // Simulate fetching ML models
    const mockModels: PredictiveModel[] = [
      {
        id: 'revenue-forecast',
        name: 'Revenue Forecasting',
        type: 'timeseries',
        target: 'revenue',
        features: ['pageViews', 'uniqueVisitors', 'conversionRate', 'seasonality'],
        accuracy: 0.87,
        status: 'ready',
        lastTrained: new Date(Date.now() - 86400000)
      },
      {
        id: 'churn-prediction',
        name: 'Customer Churn Prediction',
        type: 'classification',
        target: 'willChurn',
        features: ['sessionDuration', 'pageViews', 'lastVisit', 'engagementScore'],
        accuracy: 0.83,
        status: 'ready',
        lastTrained: new Date(Date.now() - 172800000)
      },
      {
        id: 'user-segment',
        name: 'User Segmentation',
        type: 'clustering',
        target: 'userSegment',
        features: ['behavior', 'demographics', 'preferences'],
        accuracy: 0.76,
        status: 'training'
      }
    ];
    setModels(mockModels);
  };

  const fetchPredictions = async () => {
    // Generate mock predictions
    const mockPredictions: Prediction[] = Array.from({ length: 30 }, (_, i) => ({
      modelId: 'revenue-forecast',
      timestamp: new Date(Date.now() + i * 86400000),
      prediction: 50000 + Math.random() * 20000,
      confidence: 0.7 + Math.random() * 0.3,
      factors: [
        { feature: 'seasonality', impact: 0.3 },
        { feature: 'pageViews', impact: 0.25 },
        { feature: 'conversionRate', impact: 0.45 }
      ]
    }));
    setPredictions(mockPredictions);
  };

  const fetchAnomalies = async () => {
    // Generate mock anomalies
    const mockAnomalies: AnomalyDetection[] = [
      {
        id: 'anomaly-1',
        metric: 'conversionRate',
        timestamp: new Date(Date.now() - 3600000),
        actualValue: 0.02,
        expectedValue: 0.045,
        deviation: -0.56,
        severity: 'high',
        type: 'drop'
      },
      {
        id: 'anomaly-2',
        metric: 'pageLoadTime',
        timestamp: new Date(Date.now() - 7200000),
        actualValue: 3500,
        expectedValue: 1200,
        deviation: 1.92,
        severity: 'critical',
        type: 'spike'
      }
    ];
    setAnomalies(mockAnomalies);
  };

  const fetchInsights = async () => {
    // Generate mock insights
    const mockInsights: Insight[] = [
      {
        id: 'insight-1',
        type: 'trend',
        title: 'Mobile Traffic Surge',
        description: 'Mobile traffic has increased by 45% in the last 7 days, significantly above the predicted 15% growth.',
        impact: 'high',
        metric: 'mobileTraffic',
        confidence: 0.92,
        actionable: true,
        suggestedActions: [
          'Optimize mobile user experience',
          'Increase mobile advertising budget',
          'Review mobile conversion funnel'
        ],
        timestamp: new Date()
      },
      {
        id: 'insight-2',
        type: 'correlation',
        title: 'Page Load Time Impact',
        description: 'Every 100ms increase in page load time correlates with a 2.3% decrease in conversion rate.',
        impact: 'medium',
        metric: 'pageLoadTime',
        confidence: 0.85,
        actionable: true,
        suggestedActions: [
          'Implement image optimization',
          'Enable browser caching',
          'Consider CDN implementation'
        ],
        timestamp: new Date(Date.now() - 86400000)
      }
    ];
    setInsights(mockInsights);
  };

  const fetchHistoricalData = async () => {
    // Generate mock historical data
    const now = new Date();
    const historicalPoints = Array.from({ length: 90 }, (_, i) => ({
      timestamp: new Date(now.getTime() - (89 - i) * 86400000),
      value: 40000 + Math.sin(i / 7) * 5000 + Math.random() * 10000
    }));

    const historical: TimeSeries[] = [{
      name: 'Historical Revenue',
      data: historicalPoints,
      type: 'line'
    }];

    // Generate forecast using simple methods
    const forecastPoints = DataProcessor.simpleForecast(historicalPoints, forecastHorizon, 'linear');
    const forecast: TimeSeries[] = [{
      name: 'Forecasted Revenue',
      data: forecastPoints,
      type: 'line',
      color: '#F59E0B'
    }];

    setHistoricalData(historical);
    setForecastData(forecast);
  };

  const trainNewModel = async (modelType: string, target: string, features: string[]) => {
    const jobId = `job-${Date.now()}`;
    const newJob: ModelTrainingJob = {
      id: jobId,
      modelType,
      status: 'queued',
      progress: 0,
      startedAt: new Date()
    };

    setTrainingJobs(prev => [newJob, ...prev]);

    // Simulate training process
    const progressInterval = setInterval(() => {
      setTrainingJobs(prev => prev.map(job => {
        if (job.id === jobId) {
          const newProgress = Math.min(job.progress + Math.random() * 20, 100);
          return {
            ...job,
            status: newProgress < 100 ? 'training' : 'completed',
            progress: newProgress,
            completedAt: newProgress >= 100 ? new Date() : undefined,
            accuracy: newProgress >= 100 ? 0.7 + Math.random() * 0.2 : undefined
          };
        }
        return job;
      }));
    }, 1000);

    setTimeout(() => {
      clearInterval(progressInterval);
    }, 10000);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return '📈';
      case 'anomaly': return '⚠️';
      case 'correlation': return '🔗';
      case 'forecast': return '🔮';
      case 'recommendation': return '💡';
      default: return '📊';
    }
  };

  const getAnomalySeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const combinedForecastData = useMemo(() => {
    return [...historicalData, ...forecastData];
  }, [historicalData, forecastData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading predictive analytics...</span>
      </div>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} px-6 py-4`}>
        <h1 className="text-2xl font-bold">Predictive Analytics & ML Insights</h1>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Advanced forecasting, anomaly detection, and machine learning insights
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'forecasting', name: 'Forecasting', icon: '📈' },
            { id: 'anomalies', name: 'Anomaly Detection', icon: '⚠️' },
            { id: 'insights', name: 'AI Insights', icon: '🧠' },
            { id: 'models', name: 'ML Models', icon: '🤖' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : `border-transparent ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'}`
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="px-6 py-6">
        {/* Forecasting Tab */}
        {activeTab === 'forecasting' && (
          <div className="space-y-6">
            {/* Forecast Controls */}
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Revenue Forecasting</h3>
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Model</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className={`block w-40 rounded-md border ${
                        theme === 'dark' 
                          ? 'border-gray-600 bg-gray-700 text-white' 
                          : 'border-gray-300 bg-white text-gray-900'
                      } px-3 py-2 text-sm`}
                    >
                      <option value="">Select Model</option>
                      {models.filter(m => m.type === 'timeseries').map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Forecast Days</label>
                    <input
                      type="number"
                      value={forecastHorizon}
                      onChange={(e) => setForecastHorizon(parseInt(e.target.value))}
                      min="7"
                      max="365"
                      className={`block w-24 rounded-md border ${
                        theme === 'dark' 
                          ? 'border-gray-600 bg-gray-700 text-white' 
                          : 'border-gray-300 bg-white text-gray-900'
                      } px-3 py-2 text-sm`}
                    />
                  </div>
                </div>
              </div>
              
              <AdvancedChart
                type="line"
                data={combinedForecastData}
                height={400}
                theme={theme}
                yAxisLabel="Revenue ($)"
                showGrid={true}
                showLegend={true}
              />
            </div>

            {/* Forecast Confidence Intervals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border shadow-sm text-center`}>
                <h4 className="text-lg font-semibold mb-2">Conservative</h4>
                <p className="text-3xl font-bold text-blue-600">$1.8M</p>
                <p className="text-sm text-gray-500">95% Confidence</p>
              </div>
              
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border shadow-sm text-center`}>
                <h4 className="text-lg font-semibold mb-2">Expected</h4>
                <p className="text-3xl font-bold text-green-600">$2.1M</p>
                <p className="text-sm text-gray-500">50% Confidence</p>
              </div>
              
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border shadow-sm text-center`}>
                <h4 className="text-lg font-semibold mb-2">Optimistic</h4>
                <p className="text-3xl font-bold text-purple-600">$2.4M</p>
                <p className="text-sm text-gray-500">5% Confidence</p>
              </div>
            </div>
          </div>
        )}

        {/* Anomaly Detection Tab */}
        {activeTab === 'anomalies' && (
          <div className="space-y-6">
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Recent Anomalies</h3>
              <div className="space-y-4">
                {anomalies.map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className={`p-4 rounded-lg border ${
                      theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAnomalySeverityColor(anomaly.severity)}`}>
                            {anomaly.severity.toUpperCase()}
                          </span>
                          <h4 className="font-medium">{anomaly.metric}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {anomaly.type === 'spike' ? '📈' : '📉'} 
                          {anomaly.type === 'spike' ? ' Spike detected' : ' Drop detected'} - 
                          Expected: {anomaly.expectedValue.toLocaleString()}, 
                          Actual: {anomaly.actualValue.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {anomaly.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`rounded-lg p-6 ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                } border shadow-sm`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xl">{getInsightIcon(insight.type)}</span>
                      <h3 className="text-lg font-semibold">{insight.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        insight.impact === 'high' ? 'text-red-600 bg-red-100' :
                        insight.impact === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                        'text-blue-600 bg-blue-100'
                      }`}>
                        {insight.impact.toUpperCase()} IMPACT
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{insight.description}</p>
                    
                    {insight.actionable && insight.suggestedActions && (
                      <div>
                        <h4 className="font-medium mb-2">Suggested Actions:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {insight.suggestedActions.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Confidence</div>
                    <div className="text-2xl font-bold text-green-600">
                      {(insight.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ML Models Tab */}
        {activeTab === 'models' && (
          <div className="space-y-6">
            {/* Model Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`rounded-lg p-6 ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  } border shadow-sm`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{model.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      model.status === 'ready' ? 'text-green-600 bg-green-100' :
                      model.status === 'training' ? 'text-yellow-600 bg-yellow-100' :
                      'text-red-600 bg-red-100'
                    }`}>
                      {model.status.toUpperCase()}
                    </span>
                  </div>
                  
                  {model.accuracy && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Accuracy</span>
                        <span>{(model.accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${model.accuracy * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600">
                    <p><strong>Type:</strong> {model.type}</p>
                    <p><strong>Target:</strong> {model.target}</p>
                    <p><strong>Features:</strong> {model.features.length}</p>
                    {model.lastTrained && (
                      <p><strong>Last Trained:</strong> {model.lastTrained.toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Training Jobs */}
            {trainingJobs.length > 0 && (
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border shadow-sm`}>
                <h3 className="text-lg font-semibold mb-4">Training Jobs</h3>
                <div className="space-y-4">
                  {trainingJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{job.modelType} Model</p>
                        <p className="text-sm text-gray-600">
                          {job.status === 'completed' ? 'Completed' : `${job.progress.toFixed(0)}% complete`}
                        </p>
                      </div>
                      
                      <div className="w-48">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              job.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                      
                      {job.accuracy && (
                        <div className="text-sm">
                          Accuracy: {(job.accuracy * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Train New Model */}
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Train New Model</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => trainNewModel('timeseries', 'revenue', ['pageViews', 'conversionRate'])}
                  className="p-4 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <h4 className="font-medium text-blue-600">Revenue Forecast</h4>
                  <p className="text-sm text-gray-600">Predict future revenue trends</p>
                </button>
                
                <button
                  onClick={() => trainNewModel('classification', 'churn', ['sessionDuration', 'pageViews'])}
                  className="p-4 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <h4 className="font-medium text-green-600">Churn Prediction</h4>
                  <p className="text-sm text-gray-600">Identify at-risk customers</p>
                </button>
                
                <button
                  onClick={() => trainNewModel('clustering', 'segments', ['behavior', 'demographics'])}
                  className="p-4 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <h4 className="font-medium text-purple-600">User Segmentation</h4>
                  <p className="text-sm text-gray-600">Group users by behavior</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}