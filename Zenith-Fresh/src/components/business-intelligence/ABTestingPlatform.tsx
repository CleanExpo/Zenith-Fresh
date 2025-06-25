'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AdvancedChart } from './charts/AdvancedChart';
import { 
  ABTest, 
  TestVariant, 
  TestResults, 
  VariantResults, 
  AudienceSegment 
} from '@/types/business-intelligence/analytics';

interface ABTestingPlatformProps {
  projectId?: string;
  theme?: 'light' | 'dark';
}

interface StatisticalSignificance {
  pValue: number;
  confidence: number;
  isSignificant: boolean;
  requiredSampleSize: number;
  powerAnalysis: number;
}

interface TestMetrics {
  conversions: number;
  conversionRate: number;
  visitors: number;
  revenue?: number;
  averageOrderValue?: number;
  bounceRate?: number;
  timeOnPage?: number;
}

export function ABTestingPlatform({
  projectId,
  theme = 'light'
}: ABTestingPlatformProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tests' | 'create' | 'analysis'>('overview');
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Test creation form
  const [newTest, setNewTest] = useState<Partial<ABTest>>({
    name: '',
    description: '',
    status: 'draft',
    variants: [
      { id: 'control', name: 'Control', allocation: 50, isControl: true, changes: {} },
      { id: 'variant-a', name: 'Variant A', allocation: 50, isControl: false, changes: {} }
    ],
    metrics: ['conversion_rate'],
    audience: undefined
  });

  useEffect(() => {
    fetchTests();
  }, [projectId]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      // Generate mock A/B tests
      const mockTests: ABTest[] = [
        {
          id: 'test-1',
          name: 'Homepage CTA Button Color',
          description: 'Testing blue vs green call-to-action button',
          status: 'running',
          variants: [
            { id: 'control', name: 'Blue Button', allocation: 50, isControl: true, changes: { buttonColor: 'blue' } },
            { id: 'variant-a', name: 'Green Button', allocation: 50, isControl: false, changes: { buttonColor: 'green' } }
          ],
          metrics: ['conversion_rate', 'click_through_rate'],
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          results: {
            winner: undefined,
            confidence: 0.85,
            sampleSize: 2450,
            variants: [
              { variantId: 'control', conversions: 122, conversionRate: 9.8, averageValue: 85.20, confidence: 0.95 },
              { variantId: 'variant-a', conversions: 158, conversionRate: 12.7, averageValue: 88.45, confidence: 0.95, uplift: 29.6 }
            ],
            statisticalSignificance: true
          }
        },
        {
          id: 'test-2',
          name: 'Pricing Page Layout',
          description: 'Comparing single column vs three column pricing layout',
          status: 'completed',
          variants: [
            { id: 'control', name: 'Single Column', allocation: 50, isControl: true, changes: { layout: 'single' } },
            { id: 'variant-a', name: 'Three Columns', allocation: 50, isControl: false, changes: { layout: 'triple' } }
          ],
          metrics: ['conversion_rate', 'time_on_page'],
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          results: {
            winner: 'variant-a',
            confidence: 0.99,
            sampleSize: 5240,
            variants: [
              { variantId: 'control', conversions: 234, conversionRate: 8.9, averageValue: 125.30, confidence: 0.99 },
              { variantId: 'variant-a', conversions: 312, conversionRate: 11.8, averageValue: 135.80, confidence: 0.99, uplift: 32.6 }
            ],
            statisticalSignificance: true
          }
        },
        {
          id: 'test-3',
          name: 'Email Subject Line',
          description: 'Testing question vs statement subject lines',
          status: 'draft',
          variants: [
            { id: 'control', name: 'Statement', allocation: 50, isControl: true, changes: { subjectType: 'statement' } },
            { id: 'variant-a', name: 'Question', allocation: 50, isControl: false, changes: { subjectType: 'question' } }
          ],
          metrics: ['open_rate', 'click_rate']
        }
      ];
      setTests(mockTests);
      if (mockTests.length > 0) {
        setSelectedTest(mockTests[0]);
      }
    } catch (error) {
      console.error('Error fetching A/B tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatisticalSignificance = (variantA: VariantResults, variantB: VariantResults): StatisticalSignificance => {
    const n1 = variantA.conversions + (1000 - variantA.conversions); // Mock total visitors
    const n2 = variantB.conversions + (1000 - variantB.conversions);
    const x1 = variantA.conversions;
    const x2 = variantB.conversions;
    
    const p1 = x1 / n1;
    const p2 = x2 / n2;
    const pooledP = (x1 + x2) / (n1 + n2);
    
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    const zScore = Math.abs((p1 - p2) / se);
    
    // Simplified p-value calculation
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
    const confidence = 1 - pValue;
    
    return {
      pValue,
      confidence,
      isSignificant: pValue < 0.05,
      requiredSampleSize: Math.ceil(((1.96 + 1.28) ** 2 * 2 * pooledP * (1 - pooledP)) / ((p2 - p1) ** 2)),
      powerAnalysis: 0.8
    };
  };

  // Simplified normal CDF approximation
  const normalCDF = (x: number): number => {
    return 0.5 * (1 + erf(x / Math.sqrt(2)));
  };

  const erf = (x: number): number => {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  };

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const createNewTest = async () => {
    const test: ABTest = {
      id: `test-${Date.now()}`,
      name: newTest.name || 'Untitled Test',
      description: newTest.description || '',
      status: 'draft',
      variants: newTest.variants || [],
      metrics: newTest.metrics || [],
      audience: newTest.audience
    };
    
    setTests(prev => [test, ...prev]);
    setNewTest({
      name: '',
      description: '',
      status: 'draft',
      variants: [
        { id: 'control', name: 'Control', allocation: 50, isControl: true, changes: {} },
        { id: 'variant-a', name: 'Variant A', allocation: 50, isControl: false, changes: {} }
      ],
      metrics: ['conversion_rate']
    });
    setActiveTab('tests');
  };

  const conversionData = useMemo(() => {
    if (!selectedTest?.results) return [];
    
    return selectedTest.results.variants.map(variant => ({
      name: selectedTest.variants.find(v => v.id === variant.variantId)?.name || variant.variantId,
      data: [
        { timestamp: new Date(), value: variant.conversionRate }
      ]
    }));
  }, [selectedTest]);

  const revenueData = useMemo(() => {
    if (!selectedTest?.results) return [];
    
    // Generate time series data for revenue
    return selectedTest.results.variants.map(variant => {
      const baseRevenue = variant.averageValue || 100;
      return {
        name: selectedTest.variants.find(v => v.id === variant.variantId)?.name || variant.variantId,
        data: Array.from({ length: 7 }, (_, i) => ({
          timestamp: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
          value: baseRevenue * (variant.conversions / 7) * (1 + (Math.random() - 0.5) * 0.2)
        }))
      };
    });
  }, [selectedTest]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading A/B testing platform...</span>
      </div>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} px-6 py-4`}>
        <h1 className="text-2xl font-bold">A/B Testing Platform</h1>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Design, run, and analyze experiments with statistical significance
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'tests', name: 'Tests', icon: '🧪' },
            { id: 'create', name: 'Create Test', icon: '➕' },
            { id: 'analysis', name: 'Analysis', icon: '📈' }
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border shadow-sm text-center`}>
                <div className="text-3xl font-bold text-blue-600">{tests.length}</div>
                <div className="text-sm text-gray-600 mt-1">Total Tests</div>
              </div>
              
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border shadow-sm text-center`}>
                <div className="text-3xl font-bold text-green-600">
                  {tests.filter(t => t.status === 'running').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Running</div>
              </div>
              
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border shadow-sm text-center`}>
                <div className="text-3xl font-bold text-purple-600">
                  {tests.filter(t => t.results?.statisticalSignificance).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Significant Results</div>
              </div>
              
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border shadow-sm text-center`}>
                <div className="text-3xl font-bold text-orange-600">
                  {tests.filter(t => t.results?.winner).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">With Winners</div>
              </div>
            </div>

            {/* Recent Test Results */}
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Recent Test Results</h3>
              <div className="space-y-4">
                {tests.filter(t => t.results).slice(0, 3).map((test) => (
                  <div
                    key={test.id}
                    className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{test.name}</h4>
                        <p className="text-sm text-gray-600">{test.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTestStatusColor(test.status)}`}>
                            {test.status.toUpperCase()}
                          </span>
                          {test.results && (
                            <>
                              <span className="text-sm">
                                Confidence: {(test.results.confidence * 100).toFixed(1)}%
                              </span>
                              <span className="text-sm">
                                Sample: {test.results.sampleSize.toLocaleString()}
                              </span>
                              {test.results.winner && (
                                <span className="text-sm text-green-600">
                                  Winner: {test.variants.find(v => v.id === test.results?.winner)?.name}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      {test.results && (
                        <div className="text-right">
                          {test.results.variants.map((variant, index) => (
                            <div key={variant.variantId} className="text-sm">
                              <span className="font-medium">
                                {test.variants.find(v => v.id === variant.variantId)?.name}:
                              </span>
                              <span className={`ml-1 ${
                                index === 0 ? 'text-blue-600' : variant.uplift && variant.uplift > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {variant.conversionRate.toFixed(2)}%
                                {variant.uplift && (
                                  <span className="ml-1">
                                    ({variant.uplift > 0 ? '+' : ''}{variant.uplift.toFixed(1)}%)
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">All Tests</h3>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Create New Test
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className={`rounded-lg p-6 ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  } border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                    selectedTest?.id === test.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedTest(test)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium">{test.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTestStatusColor(test.status)}`}>
                          {test.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{test.description}</p>
                      
                      <div className="flex items-center space-x-6 mt-3 text-sm">
                        <span>Variants: {test.variants.length}</span>
                        <span>Metrics: {test.metrics.join(', ')}</span>
                        {test.startDate && (
                          <span>Started: {test.startDate.toLocaleDateString()}</span>
                        )}
                        {test.results && (
                          <span>Sample: {test.results.sampleSize.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    
                    {test.results && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {test.results.winner ? '🏆' : '⏱️'}
                        </div>
                        <div className="text-sm">
                          {(test.results.confidence * 100).toFixed(1)}% confidence
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Test Tab */}
        {activeTab === 'create' && (
          <div className="space-y-6 max-w-2xl">
            <h3 className="text-lg font-semibold">Create New A/B Test</h3>
            
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm space-y-4`}>
              <div>
                <label className="block text-sm font-medium mb-1">Test Name</label>
                <input
                  type="text"
                  value={newTest.name}
                  onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full rounded border ${
                    theme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white'
                  } px-3 py-2`}
                  placeholder="e.g., Homepage Button Color Test"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newTest.description}
                  onChange={(e) => setNewTest(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full rounded border ${
                    theme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white'
                  } px-3 py-2`}
                  rows={3}
                  placeholder="Describe what you're testing and why"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Metrics to Track</label>
                <div className="grid grid-cols-2 gap-2">
                  {['conversion_rate', 'click_through_rate', 'bounce_rate', 'time_on_page', 'revenue_per_visitor', 'signup_rate'].map((metric) => (
                    <label key={metric} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newTest.metrics?.includes(metric)}
                        onChange={(e) => {
                          const updatedMetrics = e.target.checked
                            ? [...(newTest.metrics || []), metric]
                            : newTest.metrics?.filter(m => m !== metric) || [];
                          setNewTest(prev => ({ ...prev, metrics: updatedMetrics }));
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Variants</label>
                <div className="space-y-3">
                  {newTest.variants?.map((variant, index) => (
                    <div key={variant.id} className={`p-3 border rounded ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => {
                            const updatedVariants = [...(newTest.variants || [])];
                            updatedVariants[index] = { ...variant, name: e.target.value };
                            setNewTest(prev => ({ ...prev, variants: updatedVariants }));
                          }}
                          className={`flex-1 rounded border ${
                            theme === 'dark' 
                              ? 'border-gray-600 bg-gray-700 text-white' 
                              : 'border-gray-300 bg-white'
                          } px-3 py-1 text-sm`}
                          placeholder="Variant name"
                        />
                        <input
                          type="number"
                          value={variant.allocation}
                          onChange={(e) => {
                            const updatedVariants = [...(newTest.variants || [])];
                            updatedVariants[index] = { ...variant, allocation: parseInt(e.target.value) };
                            setNewTest(prev => ({ ...prev, variants: updatedVariants }));
                          }}
                          className={`w-20 rounded border ${
                            theme === 'dark' 
                              ? 'border-gray-600 bg-gray-700 text-white' 
                              : 'border-gray-300 bg-white'
                          } px-2 py-1 text-sm`}
                          min="0"
                          max="100"
                        />
                        <span className="text-sm">%</span>
                        {variant.isControl && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Control</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={createNewTest}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Create Test
                </button>
                <button
                  onClick={() => setActiveTab('tests')}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && selectedTest && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Test Analysis: {selectedTest.name}</h3>
              <select
                value={selectedTest.id}
                onChange={(e) => setSelectedTest(tests.find(t => t.id === e.target.value) || null)}
                className={`block w-64 rounded-md border ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                } px-3 py-2 text-sm`}
              >
                {tests.map(test => (
                  <option key={test.id} value={test.id}>{test.name}</option>
                ))}
              </select>
            </div>
            
            {selectedTest.results ? (
              <>
                {/* Statistical Significance */}
                <div className={`rounded-lg p-6 ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                } border shadow-sm`}>
                  <h4 className="text-lg font-semibold mb-4">Statistical Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${
                        selectedTest.results.statisticalSignificance ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedTest.results.statisticalSignificance ? '✓' : '✗'}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {selectedTest.results.statisticalSignificance ? 'Statistically Significant' : 'Not Significant'}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {(selectedTest.results.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Confidence Level</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {selectedTest.results.sampleSize.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Sample Size</div>
                    </div>
                  </div>
                </div>

                {/* Variant Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {selectedTest.results.variants.map((variant) => {
                    const variantInfo = selectedTest.variants.find(v => v.id === variant.variantId);
                    return (
                      <div
                        key={variant.variantId}
                        className={`rounded-lg p-6 ${
                          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        } border shadow-sm ${
                          selectedTest.results?.winner === variant.variantId ? 'ring-2 ring-green-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold">{variantInfo?.name}</h4>
                          {selectedTest.results?.winner === variant.variantId && (
                            <span className="text-2xl">🏆</span>
                          )}
                          {variantInfo?.isControl && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Control</span>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Conversions:</span>
                            <span className="font-medium">{variant.conversions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Conversion Rate:</span>
                            <span className="font-medium">{variant.conversionRate.toFixed(2)}%</span>
                          </div>
                          {variant.averageValue && (
                            <div className="flex justify-between">
                              <span>Avg Value:</span>
                              <span className="font-medium">${variant.averageValue.toFixed(2)}</span>
                            </div>
                          )}
                          {variant.uplift !== undefined && (
                            <div className="flex justify-between">
                              <span>Uplift:</span>
                              <span className={`font-medium ${
                                variant.uplift > 0 ? 'text-green-600' : variant.uplift < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {variant.uplift > 0 ? '+' : ''}{variant.uplift.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Performance Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className={`rounded-lg p-6 ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  } border shadow-sm`}>
                    <h4 className="text-lg font-semibold mb-4">Conversion Rate Comparison</h4>
                    <AdvancedChart
                      type="bar"
                      data={conversionData}
                      height={300}
                      theme={theme}
                      yAxisLabel="Conversion Rate (%)"
                      showLegend={false}
                    />
                  </div>
                  
                  <div className={`rounded-lg p-6 ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  } border shadow-sm`}>
                    <h4 className="text-lg font-semibold mb-4">Revenue Over Time</h4>
                    <AdvancedChart
                      type="line"
                      data={revenueData}
                      height={300}
                      theme={theme}
                      yAxisLabel="Revenue ($)"
                      showGrid={true}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border shadow-sm text-center`}>
                <h4 className="text-lg font-semibold mb-2">No Results Yet</h4>
                <p className="text-gray-600">
                  This test {selectedTest.status === 'draft' ? 'hasn\'t been started' : 'is still collecting data'}.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}