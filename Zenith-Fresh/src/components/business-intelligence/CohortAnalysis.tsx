'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AdvancedChart } from './charts/AdvancedChart';
import { D3Chart } from './charts/D3Chart';
import { 
  CohortDefinition, 
  CohortMetrics, 
  RetentionData, 
  TimeSeries 
} from '@/types/business-intelligence/analytics';

interface CohortAnalysisProps {
  projectId?: string;
  timeRange?: { start: Date; end: Date };
  theme?: 'light' | 'dark';
}

interface CohortTableData {
  cohort: string;
  size: number;
  periods: number[];
}

interface UserSegment {
  id: string;
  name: string;
  size: number;
  avgLifetimeValue: number;
  churnRate: number;
  characteristics: string[];
}

interface BehaviorPattern {
  pattern: string;
  frequency: number;
  conversionRate: number;
  value: number;
}

export function CohortAnalysis({
  projectId,
  timeRange,
  theme = 'light'
}: CohortAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'cohorts' | 'retention' | 'segments' | 'behavior'>('cohorts');
  const [cohortMetrics, setCohortMetrics] = useState<CohortMetrics[]>([]);
  const [retentionData, setRetentionData] = useState<CohortTableData[]>([]);
  const [userSegments, setUserSegments] = useState<UserSegment[]>([]);
  const [behaviorPatterns, setBehaviorPatterns] = useState<BehaviorPattern[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter controls
  const [selectedCohortType, setSelectedCohortType] = useState<'acquisition' | 'activation' | 'revenue'>('acquisition');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'weekly' | 'monthly'>('monthly');
  const [selectedMetric, setSelectedMetric] = useState<'retention' | 'revenue' | 'engagement'>('retention');

  useEffect(() => {
    fetchCohortData();
  }, [projectId, timeRange, selectedCohortType, selectedTimeframe]);

  const fetchCohortData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCohortMetrics(),
        fetchRetentionData(),
        fetchUserSegments(),
        fetchBehaviorPatterns()
      ]);
    } catch (error) {
      console.error('Error fetching cohort data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCohortMetrics = async () => {
    // Generate mock cohort metrics
    const mockCohorts: CohortMetrics[] = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      return {
        cohortId: `cohort-${i}`,
        cohortName: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        size: Math.floor(Math.random() * 500) + 100,
        retention: Array.from({ length: 12 }, (_, period) => ({
          period: period + 1,
          retained: Math.floor(Math.random() * 50) + (50 - period * 3),
          percentage: Math.max(5, 100 - period * 8 - Math.random() * 10)
        })),
        revenue: Math.floor(Math.random() * 50000) + 10000,
        avgLifetimeValue: Math.floor(Math.random() * 500) + 100,
        churnRate: Math.random() * 0.3 + 0.1
      };
    });
    setCohortMetrics(mockCohorts);
  };

  const fetchRetentionData = async () => {
    // Generate retention table data
    const mockRetention: CohortTableData[] = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      return {
        cohort: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        size: Math.floor(Math.random() * 500) + 100,
        periods: Array.from({ length: 12 }, (_, period) => 
          Math.max(5, Math.floor(100 - period * 8 - Math.random() * 10))
        )
      };
    });
    setRetentionData(mockRetention);
  };

  const fetchUserSegments = async () => {
    const mockSegments: UserSegment[] = [
      {
        id: 'power-users',
        name: 'Power Users',
        size: 1250,
        avgLifetimeValue: 850,
        churnRate: 0.05,
        characteristics: ['High engagement', 'Multiple features', 'Long sessions']
      },
      {
        id: 'casual-users',
        name: 'Casual Users',
        size: 3500,
        avgLifetimeValue: 320,
        churnRate: 0.25,
        characteristics: ['Moderate engagement', 'Core features', 'Short sessions']
      },
      {
        id: 'trial-users',
        name: 'Trial Users',
        size: 2100,
        avgLifetimeValue: 0,
        churnRate: 0.75,
        characteristics: ['Exploring features', 'Time-limited', 'High drop-off']
      },
      {
        id: 'enterprise-users',
        name: 'Enterprise Users',
        size: 450,
        avgLifetimeValue: 2500,
        churnRate: 0.08,
        characteristics: ['Team features', 'API usage', 'Long-term contracts']
      }
    ];
    setUserSegments(mockSegments);
  };

  const fetchBehaviorPatterns = async () => {
    const mockPatterns: BehaviorPattern[] = [
      {
        pattern: 'Daily Login → Feature Use → Action',
        frequency: 45,
        conversionRate: 78,
        value: 125
      },
      {
        pattern: 'Weekly Report → Dashboard View',
        frequency: 32,
        conversionRate: 65,
        value: 85
      },
      {
        pattern: 'Mobile Check → Quick Action',
        frequency: 28,
        conversionRate: 45,
        value: 35
      },
      {
        pattern: 'Team Invite → Collaboration',
        frequency: 15,
        conversionRate: 89,
        value: 450
      }
    ];
    setBehaviorPatterns(mockPatterns);
  };

  const cohortRetentionChart = useMemo(() => {
    if (cohortMetrics.length === 0) return [];
    
    return cohortMetrics.slice(0, 6).map(cohort => ({
      name: cohort.cohortName,
      data: cohort.retention.map(ret => ({
        timestamp: new Date(2024, ret.period - 1, 1),
        value: ret.percentage
      })),
      type: 'line' as const
    }));
  }, [cohortMetrics]);

  const segmentData = useMemo(() => {
    return {
      nodes: userSegments.map(segment => ({
        id: segment.id,
        name: segment.name,
        value: segment.size
      })),
      links: []
    };
  }, [userSegments]);

  const getCohortCellColor = (value: number) => {
    if (value >= 80) return 'bg-green-100 text-green-800';
    if (value >= 60) return 'bg-yellow-100 text-yellow-800';
    if (value >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading cohort analysis...</span>
      </div>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} px-6 py-4`}>
        <h1 className="text-2xl font-bold">Cohort Analysis & User Behavior</h1>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Analyze user retention, segments, and behavior patterns
        </p>
        
        {/* Controls */}
        <div className="mt-4 flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cohort Type</label>
            <select
              value={selectedCohortType}
              onChange={(e) => setSelectedCohortType(e.target.value as any)}
              className={`block w-32 rounded-md border ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              } px-3 py-2 text-sm`}
            >
              <option value="acquisition">Acquisition</option>
              <option value="activation">Activation</option>
              <option value="revenue">Revenue</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Timeframe</label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className={`block w-24 rounded-md border ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              } px-3 py-2 text-sm`}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className={`block w-32 rounded-md border ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              } px-3 py-2 text-sm`}
            >
              <option value="retention">Retention</option>
              <option value="revenue">Revenue</option>
              <option value="engagement">Engagement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'cohorts', name: 'Cohort Overview', icon: '👥' },
            { id: 'retention', name: 'Retention Table', icon: '📊' },
            { id: 'segments', name: 'User Segments', icon: '🎯' },
            { id: 'behavior', name: 'Behavior Patterns', icon: '🔄' }
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
        {/* Cohort Overview Tab */}
        {activeTab === 'cohorts' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border shadow-sm text-center`}>
                <div className="text-3xl font-bold text-blue-600">
                  {cohortMetrics.reduce((sum, c) => sum + c.size, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Users</div>
              </div>
              
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border shadow-sm text-center`}>
                <div className="text-3xl font-bold text-green-600">
                  {(cohortMetrics.reduce((sum, c) => sum + c.retention[0]?.percentage, 0) / cohortMetrics.length).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Avg Month 1 Retention</div>
              </div>
              
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border shadow-sm text-center`}>
                <div className="text-3xl font-bold text-purple-600">
                  ${(cohortMetrics.reduce((sum, c) => sum + (c.avgLifetimeValue || 0), 0) / cohortMetrics.length).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Avg Lifetime Value</div>
              </div>
              
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border shadow-sm text-center`}>
                <div className="text-3xl font-bold text-orange-600">
                  {(cohortMetrics.reduce((sum, c) => sum + (c.churnRate || 0), 0) / cohortMetrics.length * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Avg Churn Rate</div>
              </div>
            </div>

            {/* Retention Curves */}
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Retention Curves by Cohort</h3>
              <AdvancedChart
                type="line"
                data={cohortRetentionChart}
                height={400}
                theme={theme}
                yAxisLabel="Retention %"
                xAxisLabel="Months"
                showGrid={true}
                showLegend={true}
              />
            </div>

            {/* Cohort Performance Table */}
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Cohort Performance Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}>
                      <th className="px-4 py-2 text-left">Cohort</th>
                      <th className="px-4 py-2 text-center">Size</th>
                      <th className="px-4 py-2 text-center">Month 1</th>
                      <th className="px-4 py-2 text-center">Month 3</th>
                      <th className="px-4 py-2 text-center">Month 6</th>
                      <th className="px-4 py-2 text-center">LTV</th>
                      <th className="px-4 py-2 text-center">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortMetrics.slice(0, 8).map((cohort, index) => (
                      <tr key={index} className={`border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                        <td className="px-4 py-2 font-medium">{cohort.cohortName}</td>
                        <td className="px-4 py-2 text-center">{cohort.size.toLocaleString()}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${getCohortCellColor(cohort.retention[0]?.percentage || 0)}`}>
                            {cohort.retention[0]?.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${getCohortCellColor(cohort.retention[2]?.percentage || 0)}`}>
                            {cohort.retention[2]?.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${getCohortCellColor(cohort.retention[5]?.percentage || 0)}`}>
                            {cohort.retention[5]?.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">${cohort.avgLifetimeValue}</td>
                        <td className="px-4 py-2 text-center">${cohort.revenue?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Retention Table Tab */}
        {activeTab === 'retention' && (
          <div className="space-y-6">
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Retention Heatmap</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-left sticky left-0 bg-gray-100">Cohort</th>
                      <th className="px-2 py-2 text-center">Size</th>
                      {Array.from({ length: 12 }, (_, i) => (
                        <th key={i} className="px-2 py-2 text-center min-w-[60px]">M{i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {retentionData.map((row, index) => (
                      <tr key={index} className={`border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                        <td className="px-2 py-2 font-medium sticky left-0 bg-white">{row.cohort}</td>
                        <td className="px-2 py-2 text-center">{row.size}</td>
                        {row.periods.map((period, periodIndex) => (
                          <td key={periodIndex} className="px-1 py-1 text-center">
                            <div className={`px-1 py-1 rounded text-xs ${getCohortCellColor(period)}`}>
                              {period}%
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex items-center space-x-4 text-xs">
                <span>Retention Rate:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 rounded"></div>
                  <span>&lt; 40%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-100 rounded"></div>
                  <span>40-60%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-100 rounded"></div>
                  <span>60-80%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 rounded"></div>
                  <span>&gt; 80%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Segments Tab */}
        {activeTab === 'segments' && (
          <div className="space-y-6">
            {/* Segment Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {userSegments.map((segment) => (
                <div
                  key={segment.id}
                  className={`rounded-lg p-6 ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  } border shadow-sm`}
                >
                  <h4 className="font-semibold text-lg mb-2">{segment.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium">{segment.size.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>LTV:</span>
                      <span className="font-medium">${segment.avgLifetimeValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Churn:</span>
                      <span className={`font-medium ${
                        segment.churnRate < 0.1 ? 'text-green-600' : 
                        segment.churnRate < 0.3 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(segment.churnRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="text-xs font-medium text-gray-600 mb-2">Characteristics:</h5>
                    <div className="space-y-1">
                      {segment.characteristics.map((char, index) => (
                        <div key={index} className="text-xs bg-gray-100 rounded px-2 py-1">
                          {char}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Segment Comparison Chart */}
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Segment Size Distribution</h3>
              <div className="h-96">
                <D3Chart
                  type="treemap"
                  data={{
                    name: 'User Segments',
                    children: userSegments.map(segment => ({
                      name: segment.name,
                      value: segment.size
                    }))
                  }}
                  width={800}
                  height={400}
                  theme={theme}
                />
              </div>
            </div>
          </div>
        )}

        {/* Behavior Patterns Tab */}
        {activeTab === 'behavior' && (
          <div className="space-y-6">
            {/* Behavior Patterns List */}
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Top Behavior Patterns</h3>
              <div className="space-y-4">
                {behaviorPatterns.map((pattern, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{pattern.pattern}</h4>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>Frequency: {pattern.frequency}%</span>
                          <span>Conversion: {pattern.conversionRate}%</span>
                          <span>Value: ${pattern.value}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                    
                    {/* Pattern visualization bars */}
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs w-20">Frequency</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${pattern.frequency}%` }}
                          />
                        </div>
                        <span className="text-xs w-12">{pattern.frequency}%</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs w-20">Conversion</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${pattern.conversionRate}%` }}
                          />
                        </div>
                        <span className="text-xs w-12">{pattern.conversionRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Journey Flow */}
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">User Journey Flow</h3>
              <div className="h-96">
                <D3Chart
                  type="network"
                  data={{
                    nodes: [
                      { id: 'landing', name: 'Landing Page', value: 1000 },
                      { id: 'signup', name: 'Sign Up', value: 400 },
                      { id: 'onboarding', name: 'Onboarding', value: 350 },
                      { id: 'first-action', name: 'First Action', value: 280 },
                      { id: 'engagement', name: 'Active Use', value: 220 },
                      { id: 'conversion', name: 'Conversion', value: 150 }
                    ],
                    links: [
                      { source: 'landing', target: 'signup', value: 400 },
                      { source: 'signup', target: 'onboarding', value: 350 },
                      { source: 'onboarding', target: 'first-action', value: 280 },
                      { source: 'first-action', target: 'engagement', value: 220 },
                      { source: 'engagement', target: 'conversion', value: 150 }
                    ]
                  }}
                  width={800}
                  height={400}
                  theme={theme}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}