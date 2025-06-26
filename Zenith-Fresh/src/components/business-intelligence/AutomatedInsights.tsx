'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AdvancedChart } from './charts/AdvancedChart';
import { 
  Insight, 
  AnomalyDetection, 
  InsightRule, 
  TimeSeries, 
  DataPoint 
} from '@/types/business-intelligence/analytics';
import { DataProcessor } from '@/lib/business-intelligence/data-processing';

interface AutomatedInsightsProps {
  projectId?: string;
  timeRange?: { start: Date; end: Date };
  theme?: 'light' | 'dark';
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'above' | 'below' | 'change' | 'anomaly';
  threshold: number;
  timeWindow: string;
  isActive: boolean;
  frequency: 'immediate' | 'hourly' | 'daily';
  channels: string[];
}

interface PerformanceAlert {
  id: string;
  type: 'threshold' | 'anomaly' | 'trend' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  expectedValue?: number;
  threshold?: number;
  detectedAt: Date;
  isAcknowledged: boolean;
  suggestedActions: string[];
}

export function AutomatedInsights({
  projectId,
  timeRange,
  theme = 'light'
}: AutomatedInsightsProps) {
  const [activeTab, setActiveTab] = useState<'insights' | 'anomalies' | 'alerts' | 'rules'>('insights');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsightType, setSelectedInsightType] = useState<'all' | 'trend' | 'anomaly' | 'correlation' | 'forecast'>('all');

  // Anomaly detection data
  const [metricsData, setMetricsData] = useState<Map<string, DataPoint[]>>(new Map());

  useEffect(() => {
    fetchInsightsData();
  }, [projectId, timeRange, selectedInsightType]);

  const fetchInsightsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchInsights(),
        fetchAnomalies(),
        fetchAlerts(),
        fetchAlertRules(),
        fetchMetricsData()
      ]);
    } catch (error) {
      console.error('Error fetching insights data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    // Generate mock insights
    const mockInsights: Insight[] = [
      {
        id: 'insight-1',
        type: 'trend',
        title: 'Conversion Rate Steady Decline',
        description: 'Conversion rate has decreased by 15% over the past 2 weeks, from 4.8% to 4.1%. This trend coincides with recent UI changes.',
        impact: 'high',
        confidence: 0.92,
        actionable: true,
        metric: 'conversion_rate',
        suggestedActions: [
          'Revert recent UI changes to test impact',
          'A/B test alternative checkout flow',
          'Analyze user feedback from recent surveys',
          'Review page load times for checkout pages'
        ],
        relatedData: {
          currentValue: 4.1,
          previousValue: 4.8,
          changePercent: -15,
          affectedUsers: 12500
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'insight-2',
        type: 'correlation',
        title: 'Mobile Usage Drives Revenue Growth',
        description: 'Strong positive correlation (r=0.84) between mobile app usage and revenue. Mobile users generate 65% more revenue per session.',
        impact: 'high',
        confidence: 0.89,
        actionable: true,
        metric: 'mobile_revenue',
        suggestedActions: [
          'Increase mobile app marketing budget',
          'Improve mobile user experience',
          'Add mobile-specific features',
          'Send push notifications for re-engagement'
        ],
        relatedData: {
          correlation: 0.84,
          mobileRevenue: 125.50,
          webRevenue: 76.20,
          mobileUsers: 8500
        },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        id: 'insight-3',
        type: 'anomaly',
        title: 'Unusual Spike in API Errors',
        description: 'API error rate jumped to 8.5% from normal 1.2%, affecting user authentication and data sync. Issue started 3 hours ago.',
        impact: 'high',
        confidence: 0.98,
        actionable: true,
        metric: 'api_error_rate',
        suggestedActions: [
          'Investigate recent API deployments',
          'Check database connection pool',
          'Review server resource utilization',
          'Enable emergency fallback systems'
        ],
        relatedData: {
          currentErrorRate: 8.5,
          normalErrorRate: 1.2,
          affectedRequests: 45000,
          duration: '3 hours'
        },
        timestamp: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        id: 'insight-4',
        type: 'forecast',
        title: 'Revenue Target Achievement Unlikely',
        description: 'Based on current trends, monthly revenue target of $2.8M will likely be missed by 12%. Projection: $2.46M.',
        impact: 'medium',
        confidence: 0.78,
        actionable: true,
        metric: 'monthly_revenue',
        suggestedActions: [
          'Launch promotional campaign',
          'Accelerate enterprise sales pipeline',
          'Increase conversion optimization efforts',
          'Consider pricing strategy adjustments'
        ],
        relatedData: {
          targetRevenue: 2800000,
          projectedRevenue: 2460000,
          shortfall: 340000,
          daysRemaining: 8
        },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        id: 'insight-5',
        type: 'recommendation',
        title: 'Optimize Email Campaign Timing',
        description: 'Email campaigns sent on Tuesday at 10 AM show 23% higher open rates and 31% better click-through rates.',
        impact: 'medium',
        confidence: 0.85,
        actionable: true,
        metric: 'email_performance',
        suggestedActions: [
          'Reschedule weekly campaigns to Tuesday 10 AM',
          'A/B test different time slots',
          'Segment by timezone for global audiences',
          'Analyze seasonal timing patterns'
        ],
        relatedData: {
          optimalDay: 'Tuesday',
          optimalTime: '10:00 AM',
          openRateImprovement: 23,
          ctrImprovement: 31
        },
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000)
      }
    ];

    const filteredInsights = selectedInsightType === 'all' 
      ? mockInsights 
      : mockInsights.filter(insight => insight.type === selectedInsightType);

    setInsights(filteredInsights);
  };

  const fetchAnomalies = async () => {
    const mockAnomalies: AnomalyDetection[] = [
      {
        id: 'anomaly-1',
        metric: 'page_load_time',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        actualValue: 3800,
        expectedValue: 1200,
        deviation: 2.17,
        severity: 'critical',
        type: 'spike'
      },
      {
        id: 'anomaly-2',
        metric: 'user_sessions',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        actualValue: 450,
        expectedValue: 850,
        deviation: -0.89,
        severity: 'high',
        type: 'drop'
      },
      {
        id: 'anomaly-3',
        metric: 'bounce_rate',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        actualValue: 0.78,
        expectedValue: 0.45,
        deviation: 1.45,
        severity: 'medium',
        type: 'trend_change'
      }
    ];
    setAnomalies(mockAnomalies);
  };

  const fetchAlerts = async () => {
    const mockAlerts: PerformanceAlert[] = [
      {
        id: 'alert-1',
        type: 'threshold',
        severity: 'critical',
        title: 'Server Response Time Critical',
        description: 'Average response time exceeded 3 seconds threshold',
        metric: 'response_time',
        currentValue: 3450,
        threshold: 3000,
        detectedAt: new Date(Date.now() - 15 * 60 * 1000),
        isAcknowledged: false,
        suggestedActions: [
          'Check server resources',
          'Review database queries',
          'Enable caching',
          'Scale infrastructure'
        ]
      },
      {
        id: 'alert-2',
        type: 'anomaly',
        severity: 'high',
        title: 'Unusual Traffic Pattern Detected',
        description: 'Traffic volume is 300% above normal for this time of day',
        metric: 'traffic_volume',
        currentValue: 12500,
        expectedValue: 4200,
        detectedAt: new Date(Date.now() - 30 * 60 * 1000),
        isAcknowledged: true,
        suggestedActions: [
          'Monitor for DDoS activity',
          'Check for viral content',
          'Verify analytics configuration',
          'Prepare for increased load'
        ]
      }
    ];
    setAlerts(mockAlerts);
  };

  const fetchAlertRules = async () => {
    const mockRules: AlertRule[] = [
      {
        id: 'rule-1',
        name: 'High Response Time',
        metric: 'response_time',
        condition: 'above',
        threshold: 3000,
        timeWindow: '5m',
        isActive: true,
        frequency: 'immediate',
        channels: ['email', 'slack']
      },
      {
        id: 'rule-2',
        name: 'Low Conversion Rate',
        metric: 'conversion_rate',
        condition: 'below',
        threshold: 3.5,
        timeWindow: '1h',
        isActive: true,
        frequency: 'hourly',
        channels: ['email']
      },
      {
        id: 'rule-3',
        name: 'Traffic Anomaly',
        metric: 'traffic_volume',
        condition: 'anomaly',
        threshold: 2.0,
        timeWindow: '15m',
        isActive: false,
        frequency: 'immediate',
        channels: ['slack', 'webhook']
      }
    ];
    setAlertRules(mockRules);
  };

  const fetchMetricsData = async () => {
    // Generate sample time series data for anomaly visualization
    const metrics = ['page_load_time', 'user_sessions', 'bounce_rate', 'conversion_rate'];
    const data = new Map();

    metrics.forEach(metric => {
      const points = Array.from({ length: 144 }, (_, i) => {
        const timestamp = new Date(Date.now() - (143 - i) * 10 * 60 * 1000); // 10-minute intervals
        let baseValue = 100;
        
        // Add different patterns for different metrics
        switch (metric) {
          case 'page_load_time':
            baseValue = 1200 + Math.sin(i / 24) * 200 + Math.random() * 300;
            // Add anomaly spike
            if (i > 135) baseValue *= 3;
            break;
          case 'user_sessions':
            baseValue = 800 + Math.sin(i / 12) * 150 + Math.random() * 100;
            // Add anomaly drop
            if (i > 120 && i < 130) baseValue *= 0.5;
            break;
          case 'bounce_rate':
            baseValue = 0.45 + Math.sin(i / 18) * 0.1 + Math.random() * 0.05;
            // Add trend change
            if (i > 110) baseValue += (i - 110) * 0.01;
            break;
          case 'conversion_rate':
            baseValue = 4.5 + Math.sin(i / 20) * 0.5 + Math.random() * 0.3;
            break;
        }

        return {
          timestamp,
          value: baseValue
        };
      });

      data.set(metric, points);
    });

    setMetricsData(data);
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

  const getInsightImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getAnomalySeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isAcknowledged: true } : alert
    ));
  };

  const toggleAlertRule = (ruleId: string) => {
    setAlertRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const anomalyChartData = useMemo(() => {
    const selectedMetric = 'page_load_time';
    const data = metricsData.get(selectedMetric);
    if (!data) return [];

    return [{
      name: 'Page Load Time',
      data,
      type: 'line' as const,
      color: '#3B82F6'
    }];
  }, [metricsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading automated insights...</span>
      </div>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} px-6 py-4`}>
        <h1 className="text-2xl font-bold">Automated Insights & Anomaly Detection</h1>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          AI-powered insights, anomaly detection, and intelligent alerting
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'insights', name: 'AI Insights', icon: '🧠', count: insights.length },
            { id: 'anomalies', name: 'Anomalies', icon: '⚠️', count: anomalies.length },
            { id: 'alerts', name: 'Alerts', icon: '🔔', count: alerts.filter(a => !a.isAcknowledged).length },
            { id: 'rules', name: 'Alert Rules', icon: '⚙️', count: alertRules.filter(r => r.isActive).length }
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
              {tab.count > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="px-6 py-6">
        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Insight Filters */}
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium mb-1">Filter by Type</label>
                <select
                  value={selectedInsightType}
                  onChange={(e) => setSelectedInsightType(e.target.value as any)}
                  className={`block w-40 rounded-md border ${
                    theme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                  } px-3 py-2 text-sm`}
                >
                  <option value="all">All Types</option>
                  <option value="trend">Trends</option>
                  <option value="anomaly">Anomalies</option>
                  <option value="correlation">Correlations</option>
                  <option value="forecast">Forecasts</option>
                  <option value="recommendation">Recommendations</option>
                </select>
              </div>
            </div>

            {/* Insights List */}
            <div className="space-y-4">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`rounded-lg p-6 border-l-4 ${getInsightImpactColor(insight.impact)} ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  } shadow-sm`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                        <h3 className="text-lg font-semibold">{insight.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getInsightImpactColor(insight.impact)}`}>
                          {insight.impact.toUpperCase()} IMPACT
                        </span>
                        <span className="text-xs text-gray-500">
                          {insight.type.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{insight.description}</p>
                      
                      {insight.actionable && insight.suggestedActions && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">💡 Suggested Actions:</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {insight.suggestedActions.map((action, index) => (
                              <li key={index} className="text-gray-600">{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Related Data */}
                      {insight.relatedData && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Related Data:</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            {Object.entries(insight.relatedData).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-gray-500">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                                <span className="ml-1 font-medium">
                                  {typeof value === 'number' 
                                    ? value.toLocaleString() 
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-500 mb-1">Confidence</div>
                      <div className="text-2xl font-bold text-green-600">
                        {(insight.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {insight.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anomalies Tab */}
        {activeTab === 'anomalies' && (
          <div className="space-y-6">
            {/* Anomaly Chart */}
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Real-time Anomaly Detection</h3>
              <AdvancedChart
                type="line"
                data={anomalyChartData}
                height={300}
                theme={theme}
                yAxisLabel="Response Time (ms)"
                showGrid={true}
                showLegend={false}
              />
              <div className="mt-2 text-sm text-gray-600">
                Red markers indicate detected anomalies. Shaded areas show expected ranges.
              </div>
            </div>

            {/* Anomalies List */}
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Detected Anomalies</h3>
              <div className="space-y-4">
                {anomalies.map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAnomalySeverityColor(anomaly.severity)}`}>
                            {anomaly.severity.toUpperCase()}
                          </span>
                          <h4 className="font-medium">{anomaly.metric.replace(/_/g, ' ').toUpperCase()}</h4>
                          <span className="text-sm text-gray-500">
                            {anomaly.type === 'spike' ? '📈 Spike' : 
                             anomaly.type === 'drop' ? '📉 Drop' : 
                             '📊 Trend Change'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Current:</span>
                            <span className="ml-1 font-medium">{anomaly.actualValue.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Expected:</span>
                            <span className="ml-1 font-medium">{anomaly.expectedValue.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Deviation:</span>
                            <span className={`ml-1 font-medium ${anomaly.deviation > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                              {anomaly.deviation.toFixed(2)}σ
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Detected:</span>
                            <span className="ml-1 font-medium">{anomaly.timestamp.toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Active Alerts</h3>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.isAcknowledged 
                        ? 'border-gray-300 bg-gray-50' 
                        : `border-${getAlertSeverityColor(alert.severity).replace('bg-', '')} ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getAlertSeverityColor(alert.severity)}`} />
                          <h4 className="font-medium">{alert.title}</h4>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {alert.type.toUpperCase()}
                          </span>
                          {alert.isAcknowledged && (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                              ACKNOWLEDGED
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{alert.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Current:</span>
                            <span className="ml-1 font-medium">{alert.currentValue.toLocaleString()}</span>
                          </div>
                          {alert.threshold && (
                            <div>
                              <span className="text-gray-500">Threshold:</span>
                              <span className="ml-1 font-medium">{alert.threshold.toLocaleString()}</span>
                            </div>
                          )}
                          {alert.expectedValue && (
                            <div>
                              <span className="text-gray-500">Expected:</span>
                              <span className="ml-1 font-medium">{alert.expectedValue.toLocaleString()}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">Detected:</span>
                            <span className="ml-1 font-medium">{alert.detectedAt.toLocaleString()}</span>
                          </div>
                        </div>

                        {alert.suggestedActions.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Suggested Actions:</h5>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {alert.suggestedActions.map((action, index) => (
                                <li key={index}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        {!alert.isAcknowledged && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Alert Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Alert Rules Configuration</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                Create New Rule
              </button>
            </div>
            
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}>
                      <th className="px-4 py-2 text-left">Rule Name</th>
                      <th className="px-4 py-2 text-left">Metric</th>
                      <th className="px-4 py-2 text-left">Condition</th>
                      <th className="px-4 py-2 text-left">Threshold</th>
                      <th className="px-4 py-2 text-left">Frequency</th>
                      <th className="px-4 py-2 text-left">Channels</th>
                      <th className="px-4 py-2 text-center">Status</th>
                      <th className="px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertRules.map((rule) => (
                      <tr key={rule.id} className={`border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                        <td className="px-4 py-2 font-medium">{rule.name}</td>
                        <td className="px-4 py-2">{rule.metric.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-2">
                          {rule.condition === 'anomaly' ? 'Anomaly Detection' : 
                           `${rule.condition.charAt(0).toUpperCase()}${rule.condition.slice(1)} ${rule.threshold}`}
                        </td>
                        <td className="px-4 py-2">{rule.threshold.toLocaleString()}</td>
                        <td className="px-4 py-2">{rule.frequency}</td>
                        <td className="px-4 py-2">{rule.channels.join(', ')}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rule.isActive 
                              ? 'text-green-600 bg-green-100' 
                              : 'text-gray-600 bg-gray-100'
                          }`}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => toggleAlertRule(rule.id)}
                            className={`px-2 py-1 rounded text-xs ${
                              rule.isActive 
                                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                            } transition-colors`}
                          >
                            {rule.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}