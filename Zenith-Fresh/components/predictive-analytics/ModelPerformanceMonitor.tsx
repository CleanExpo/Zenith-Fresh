'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Activity,
  BarChart3,
  RefreshCw,
  Download,
  Settings,
  Target,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface ModelMetrics {
  modelType: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Square Error
  r2: number; // R-squared (for regression models)
  auc: number; // Area Under Curve
  lastTrained: Date;
  lastEvaluated: Date;
  dataPoints: number;
  trainingTime: number; // milliseconds
  predictionTime: number; // milliseconds per prediction
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_retraining';
  drift: {
    detected: boolean;
    severity: 'low' | 'medium' | 'high';
    lastDetected?: Date;
  };
  featureImportance: Array<{
    feature: string;
    importance: number;
    stability: number;
  }>;
}

interface PerformanceTrend {
  date: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  dataQuality: number;
  predictionVolume: number;
}

interface ModelComparison {
  modelType: string;
  version: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  deploymentDate: Date;
  isActive: boolean;
}

interface AlertRule {
  id: string;
  metric: string;
  threshold: number;
  condition: 'below' | 'above';
  severity: 'low' | 'medium' | 'high';
  enabled: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const ModelPerformanceMonitor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'comparison' | 'alerts'>('overview');

  // Data state
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics[]>([]);
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>([]);
  const [modelComparisons, setModelComparisons] = useState<ModelComparison[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadMonitoringData();
  }, [selectedModel, timeRange]);

  const loadMonitoringData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadModelMetrics(),
        loadPerformanceTrends(),
        loadModelComparisons(),
        loadAlertRules(),
        loadActiveAlerts()
      ]);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModelMetrics = async () => {
    // Mock data - replace with actual API call
    const mockMetrics: ModelMetrics[] = [
      {
        modelType: 'churn',
        accuracy: 87.3,
        precision: 84.2,
        recall: 89.1,
        f1Score: 86.6,
        mae: 0.127,
        rmse: 0.234,
        r2: 0.78,
        auc: 0.91,
        lastTrained: new Date('2024-06-25T10:30:00Z'),
        lastEvaluated: new Date('2024-06-27T08:15:00Z'),
        dataPoints: 1247,
        trainingTime: 45000,
        predictionTime: 12,
        status: 'good',
        drift: {
          detected: false,
          severity: 'low'
        },
        featureImportance: [
          { feature: 'Account Age', importance: 0.24, stability: 0.89 },
          { feature: 'Usage Frequency', importance: 0.21, stability: 0.92 },
          { feature: 'Support Tickets', importance: 0.18, stability: 0.76 },
          { feature: 'Payment Issues', importance: 0.15, stability: 0.84 },
          { feature: 'Feature Adoption', importance: 0.22, stability: 0.88 }
        ]
      },
      {
        modelType: 'revenue',
        accuracy: 92.1,
        precision: 89.7,
        recall: 93.2,
        f1Score: 91.4,
        mae: 15420,
        rmse: 23150,
        r2: 0.89,
        auc: 0.94,
        lastTrained: new Date('2024-06-24T14:20:00Z'),
        lastEvaluated: new Date('2024-06-27T08:15:00Z'),
        dataPoints: 890,
        trainingTime: 32000,
        predictionTime: 8,
        status: 'excellent',
        drift: {
          detected: false,
          severity: 'low'
        },
        featureImportance: [
          { feature: 'User Count', importance: 0.32, stability: 0.94 },
          { feature: 'Tier Distribution', importance: 0.28, stability: 0.91 },
          { feature: 'Usage Volume', importance: 0.25, stability: 0.87 },
          { feature: 'Seasonality', importance: 0.15, stability: 0.96 }
        ]
      },
      {
        modelType: 'ltv',
        accuracy: 78.9,
        precision: 76.4,
        recall: 81.2,
        f1Score: 78.7,
        mae: 342.50,
        rmse: 567.80,
        r2: 0.72,
        auc: 0.85,
        lastTrained: new Date('2024-06-23T09:45:00Z'),
        lastEvaluated: new Date('2024-06-27T08:15:00Z'),
        dataPoints: 1156,
        trainingTime: 38000,
        predictionTime: 15,
        status: 'fair',
        drift: {
          detected: true,
          severity: 'medium',
          lastDetected: new Date('2024-06-26T12:00:00Z')
        },
        featureImportance: [
          { feature: 'Monthly Revenue', importance: 0.35, stability: 0.82 },
          { feature: 'Engagement Score', importance: 0.28, stability: 0.78 },
          { feature: 'Feature Usage', importance: 0.22, stability: 0.85 },
          { feature: 'Churn Risk', importance: 0.15, stability: 0.91 }
        ]
      },
      {
        modelType: 'feature_adoption',
        accuracy: 83.6,
        precision: 81.9,
        recall: 85.1,
        f1Score: 83.5,
        mae: 0.164,
        rmse: 0.287,
        r2: 0.74,
        auc: 0.88,
        lastTrained: new Date('2024-06-26T16:10:00Z'),
        lastEvaluated: new Date('2024-06-27T08:15:00Z'),
        dataPoints: 2340,
        trainingTime: 28000,
        predictionTime: 9,
        status: 'good',
        drift: {
          detected: false,
          severity: 'low'
        },
        featureImportance: [
          { feature: 'User Tier', importance: 0.31, stability: 0.93 },
          { feature: 'Current Usage', importance: 0.26, stability: 0.88 },
          { feature: 'Time Since Signup', importance: 0.23, stability: 0.91 },
          { feature: 'Similar User Behavior', importance: 0.20, stability: 0.85 }
        ]
      }
    ];

    setModelMetrics(mockMetrics);
  };

  const loadPerformanceTrends = async () => {
    // Mock trend data
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const trends: PerformanceTrend[] = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      trends.push({
        date: date.toISOString().split('T')[0],
        accuracy: 85 + Math.random() * 10,
        precision: 82 + Math.random() * 12,
        recall: 86 + Math.random() * 8,
        f1Score: 84 + Math.random() * 10,
        dataQuality: 90 + Math.random() * 8,
        predictionVolume: 1000 + Math.random() * 500
      });
    }

    setPerformanceTrends(trends);
  };

  const loadModelComparisons = async () => {
    setModelComparisons([
      {
        modelType: 'churn',
        version: 'v2.1',
        metrics: { accuracy: 87.3, precision: 84.2, recall: 89.1, f1Score: 86.6 },
        deploymentDate: new Date('2024-06-25T10:30:00Z'),
        isActive: true
      },
      {
        modelType: 'churn',
        version: 'v2.0',
        metrics: { accuracy: 84.1, precision: 81.5, recall: 86.3, f1Score: 83.8 },
        deploymentDate: new Date('2024-06-18T14:20:00Z'),
        isActive: false
      },
      {
        modelType: 'revenue',
        version: 'v1.3',
        metrics: { accuracy: 92.1, precision: 89.7, recall: 93.2, f1Score: 91.4 },
        deploymentDate: new Date('2024-06-24T14:20:00Z'),
        isActive: true
      }
    ]);
  };

  const loadAlertRules = async () => {
    setAlertRules([
      {
        id: '1',
        metric: 'accuracy',
        threshold: 80,
        condition: 'below',
        severity: 'high',
        enabled: true
      },
      {
        id: '2',
        metric: 'drift_severity',
        threshold: 0.3,
        condition: 'above',
        severity: 'medium',
        enabled: true
      },
      {
        id: '3',
        metric: 'prediction_time',
        threshold: 100,
        condition: 'above',
        severity: 'low',
        enabled: true
      }
    ]);
  };

  const loadActiveAlerts = async () => {
    setActiveAlerts([
      {
        id: '1',
        modelType: 'ltv',
        metric: 'Data Drift',
        severity: 'medium',
        message: 'Medium data drift detected in LTV model',
        timestamp: new Date('2024-06-26T12:00:00Z'),
        status: 'active'
      }
    ]);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadMonitoringData();
    setRefreshing(false);
  };

  const retrainModel = async (modelType: string) => {
    console.log(`Triggering retraining for ${modelType} model`);
    // Implementation would call the training API
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      case 'needs_retraining': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'fair': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'needs_retraining': return <RefreshCw className="w-4 h-4 text-purple-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatMetric = (value: number, type: string) => {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'time':
        return `${value.toFixed(0)}ms`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      default:
        return value.toFixed(3);
    }
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      models: modelMetrics,
      alerts: activeAlerts,
      summary: {
        totalModels: modelMetrics.length,
        averageAccuracy: modelMetrics.reduce((sum, m) => sum + m.accuracy, 0) / modelMetrics.length,
        alertsActive: activeAlerts.length
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model-performance-report.json';
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading model performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Model Performance Monitor</h2>
          <p className="text-gray-600 mt-1">Real-time monitoring and evaluation of ML models</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Models</option>
            <option value="churn">Churn Prediction</option>
            <option value="revenue">Revenue Forecast</option>
            <option value="ltv">LTV Prediction</option>
            <option value="feature_adoption">Feature Adoption</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button onClick={exportReport} variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          <Button 
            onClick={refreshData} 
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      {activeAlerts.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-900">Active Alerts ({activeAlerts.length})</h3>
                <p className="text-sm text-orange-700">
                  {activeAlerts.map(alert => alert.message).join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'trends', label: 'Trends', icon: TrendingUp },
          { key: 'comparison', label: 'Comparison', icon: Target },
          { key: 'alerts', label: 'Alerts', icon: AlertTriangle }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Model Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {modelMetrics.map((model) => (
              <Card key={model.modelType}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium capitalize">
                      {model.modelType} Model
                    </CardTitle>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(model.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{formatMetric(model.accuracy, 'percentage')}</span>
                    <Badge className={getStatusColor(model.status)}>
                      {model.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Precision:</span>
                      <span className="font-medium">{formatMetric(model.precision, 'percentage')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recall:</span>
                      <span className="font-medium">{formatMetric(model.recall, 'percentage')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">F1 Score:</span>
                      <span className="font-medium">{formatMetric(model.f1Score, 'percentage')}</span>
                    </div>
                  </div>

                  {model.drift.detected && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center space-x-1 text-yellow-800 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Data drift detected ({model.drift.severity})</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Last trained:</span>
                      <span>{model.lastTrained.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Data points:</span>
                      <span>{model.dataPoints.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => retrainModel(model.modelType)}
                    className="w-full mt-2"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retrain
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Importance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {modelMetrics.slice(0, 2).map((model) => (
              <Card key={`features-${model.modelType}`}>
                <CardHeader>
                  <CardTitle className="capitalize">{model.modelType} Model - Feature Importance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {model.featureImportance.map((feature, index) => (
                      <div key={feature.feature}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{feature.feature}</span>
                          <div className="flex items-center space-x-2">
                            <span>{(feature.importance * 100).toFixed(1)}%</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                feature.stability > 0.8 ? 'text-green-600' : 
                                feature.stability > 0.6 ? 'text-yellow-600' : 
                                'text-red-600'
                              }`}
                            >
                              {(feature.stability * 100).toFixed(0)}% stable
                            </Badge>
                          </div>
                        </div>
                        <Progress value={feature.importance * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="accuracy" stroke="#0088FE" name="Accuracy" />
                  <Line type="monotone" dataKey="precision" stroke="#00C49F" name="Precision" />
                  <Line type="monotone" dataKey="recall" stroke="#FFBB28" name="Recall" />
                  <Line type="monotone" dataKey="f1Score" stroke="#FF8042" name="F1 Score" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Quality Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="dataQuality" stroke="#8884D8" name="Data Quality" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prediction Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="predictionVolume" fill="#82CA9D" name="Predictions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Version Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelComparisons.map((model, index) => (
                  <div key={`${model.modelType}-${model.version}`} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold capitalize">{model.modelType} {model.version}</h3>
                        {model.isActive && (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">
                        Deployed: {model.deploymentDate.toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">{formatMetric(model.metrics.accuracy, 'percentage')}</div>
                        <div className="text-xs text-gray-600">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{formatMetric(model.metrics.precision, 'percentage')}</div>
                        <div className="text-xs text-gray-600">Precision</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{formatMetric(model.metrics.recall, 'percentage')}</div>
                        <div className="text-xs text-gray-600">Recall</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{formatMetric(model.metrics.f1Score, 'percentage')}</div>
                        <div className="text-xs text-gray-600">F1 Score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Performance Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={modelMetrics.map(model => ({
                  model: model.modelType,
                  Accuracy: model.accuracy,
                  Precision: model.precision,
                  Recall: model.recall,
                  'F1 Score': model.f1Score,
                  AUC: model.auc * 100
                }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="model" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar 
                    name="Performance" 
                    dataKey="Accuracy" 
                    stroke="#0088FE" 
                    fill="#0088FE" 
                    fillOpacity={0.1} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {activeAlerts.length > 0 ? (
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                          <div>
                            <h4 className="font-medium text-orange-900">{alert.metric}</h4>
                            <p className="text-sm text-orange-700">{alert.message}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-orange-100 text-orange-800">
                            {alert.severity}
                          </Badge>
                          <div className="text-xs text-orange-600 mt-1">
                            {alert.timestamp.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
                  <p>No active alerts. All models are performing within acceptable ranges.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertRules.map((rule) => (
                  <div key={rule.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium capitalize">{rule.metric}</h4>
                        <p className="text-sm text-gray-600">
                          Alert when {rule.metric} is {rule.condition} {rule.threshold}
                          {rule.metric.includes('percentage') || rule.metric.includes('rate') ? '%' : ''}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={
                          rule.severity === 'high' ? 'bg-red-100 text-red-800' :
                          rule.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {rule.severity}
                        </Badge>
                        <Badge className={rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ModelPerformanceMonitor;