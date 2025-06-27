'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  TestTube,
  Play,
  Pause,
  Stop,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  DollarSign,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Eye,
  Zap,
  Plus
} from 'lucide-react';
import { 
  FunnelWithSteps,
  FunnelMetrics,
  OptimizationSuggestion
} from '../../types/funnel';

interface FunnelABTestingProps {
  funnelId: string;
  funnel: FunnelWithSteps;
  metrics: FunnelMetrics;
  optimizationSuggestions: OptimizationSuggestion[];
  className?: string;
}

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'stopped';
  funnelStepId: string;
  stepName: string;
  variants: ABTestVariant[];
  trafficSplit: number[];
  startDate?: Date;
  endDate?: Date;
  duration: number; // days
  sampleSize: number;
  minDetectableEffect: number;
  significanceLevel: number;
  results?: ABTestResults;
  createdAt: Date;
}

interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  isControl: boolean;
  changes: any; // Specific changes for this variant
  allocation: number; // Percentage of traffic
}

interface ABTestResults {
  totalUsers: number;
  variantResults: VariantResult[];
  winner?: string;
  statisticalSignificance: number;
  confidence: number;
  uplift: number;
  isSignificant: boolean;
  endedEarly?: boolean;
  endReason?: string;
}

interface VariantResult {
  variantId: string;
  variantName: string;
  users: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  revenuePerUser: number;
  averageTimeToConvert: number;
}

export default function FunnelABTesting({
  funnelId,
  funnel,
  metrics,
  optimizationSuggestions,
  className = ''
}: FunnelABTestingProps) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    stepId: '',
    duration: 14,
    trafficSplit: 50,
    minDetectableEffect: 10,
    significanceLevel: 95
  });

  useEffect(() => {
    loadABTests();
  }, [funnelId]);

  const loadABTests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/funnels/${funnelId}/ab-tests`);
      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
      }
    } catch (error) {
      console.error('Failed to load A/B tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createABTest = async () => {
    if (!newTest.name || !newTest.stepId) return;

    try {
      const response = await fetch(`/api/funnels/${funnelId}/ab-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTest.name,
          description: newTest.description,
          stepId: newTest.stepId,
          duration: newTest.duration,
          trafficSplit: [100 - newTest.trafficSplit, newTest.trafficSplit],
          minDetectableEffect: newTest.minDetectableEffect / 100,
          significanceLevel: newTest.significanceLevel / 100
        })
      });

      if (response.ok) {
        await loadABTests();
        setShowCreateForm(false);
        setNewTest({
          name: '',
          description: '',
          stepId: '',
          duration: 14,
          trafficSplit: 50,
          minDetectableEffect: 10,
          significanceLevel: 95
        });
      }
    } catch (error) {
      console.error('Failed to create A/B test:', error);
    }
  };

  const startTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/funnels/${funnelId}/ab-tests/${testId}/start`, {
        method: 'POST'
      });
      if (response.ok) {
        await loadABTests();
      }
    } catch (error) {
      console.error('Failed to start test:', error);
    }
  };

  const stopTest = async (testId: string, reason = 'manually_stopped') => {
    try {
      const response = await fetch(`/api/funnels/${funnelId}/ab-tests/${testId}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (response.ok) {
        await loadABTests();
      }
    } catch (error) {
      console.error('Failed to stop test:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      running: 'default',
      paused: 'secondary',
      completed: 'default',
      stopped: 'destructive'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="h-4 w-4 text-green-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'stopped': return <Stop className="h-4 w-4 text-red-500" />;
      default: return <TestTube className="h-4 w-4 text-gray-500" />;
    }
  };

  const calculateProgress = (test: ABTest) => {
    if (!test.startDate || test.status === 'draft') return 0;
    if (test.status === 'completed' || test.status === 'stopped') return 100;
    
    const elapsed = Date.now() - test.startDate.getTime();
    const total = test.duration * 24 * 60 * 60 * 1000; // days to milliseconds
    return Math.min((elapsed / total) * 100, 100);
  };

  const renderTestCard = (test: ABTest) => {
    const progress = calculateProgress(test);
    const step = funnel.steps.find(s => s.id === test.funnelStepId);

    return (
      <Card 
        key={test.id}
        className={`cursor-pointer transition-all hover:shadow-lg ${
          selectedTest?.id === test.id ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => setSelectedTest(test)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(test.status)}
              <div>
                <CardTitle className="text-lg">{test.name}</CardTitle>
                <CardDescription>
                  Testing {step?.name || 'Unknown Step'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(test.status)}
              {test.results?.isSignificant && (
                <Badge className="bg-green-100 text-green-800">Significant</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">{test.description}</p>
          
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Duration</p>
              <p className="font-medium">{test.duration} days</p>
            </div>
            <div>
              <p className="text-gray-600">Traffic Split</p>
              <p className="font-medium">
                {test.trafficSplit.map(split => `${split}%`).join(' / ')}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Sample Size</p>
              <p className="font-medium">{test.sampleSize.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Min Effect</p>
              <p className="font-medium">{(test.minDetectableEffect * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* Results Preview */}
          {test.results && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {test.results.winner ? 
                    `Winner: ${test.variants.find(v => v.id === test.results?.winner)?.name}` :
                    'No significant winner'
                  }
                </span>
                <span className={`text-sm font-bold ${
                  test.results.uplift > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {test.results.uplift > 0 ? '+' : ''}{test.results.uplift.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {test.status === 'draft' && (
              <Button size="sm" onClick={(e) => { e.stopPropagation(); startTest(test.id); }}>
                <Play className="h-4 w-4 mr-1" />
                Start Test
              </Button>
            )}
            {test.status === 'running' && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => { e.stopPropagation(); stopTest(test.id); }}
              >
                <Stop className="h-4 w-4 mr-1" />
                Stop Test
              </Button>
            )}
            <Button size="sm" variant="outline">
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTestResults = (test: ABTest) => {
    if (!test.results) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Results: {test.name}</CardTitle>
          <CardDescription>
            Statistical analysis of variant performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Results */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-lg font-bold">{test.results.totalUsers.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Uplift</p>
                    <p className={`text-lg font-bold ${
                      test.results.uplift > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {test.results.uplift > 0 ? '+' : ''}{test.results.uplift.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Confidence</p>
                    <p className="text-lg font-bold">{test.results.confidence.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  {test.results.isSignificant ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Significance</p>
                    <p className={`text-lg font-bold ${
                      test.results.isSignificant ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {test.results.isSignificant ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Variant Results */}
          <div>
            <h4 className="font-semibold mb-4">Variant Performance</h4>
            <div className="space-y-4">
              {test.results.variantResults.map((result) => {
                const variant = test.variants.find(v => v.id === result.variantId);
                const isWinner = test.results?.winner === result.variantId;
                
                return (
                  <div 
                    key={result.variantId}
                    className={`p-4 border rounded-lg ${
                      isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h5 className="font-medium">{result.variantName}</h5>
                        {variant?.isControl && <Badge variant="outline">Control</Badge>}
                        {isWinner && <Badge className="bg-green-100 text-green-800">Winner</Badge>}
                      </div>
                      <div className="text-sm text-gray-600">
                        {result.users.toLocaleString()} users
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Conversions</p>
                        <p className="font-semibold">{result.conversions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Conversion Rate</p>
                        <p className="font-semibold text-green-600">
                          {(result.conversionRate * 100).toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Revenue/User</p>
                        <p className="font-semibold">${result.revenuePerUser.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg Time</p>
                        <p className="font-semibold">
                          {Math.round(result.averageTimeToConvert / 60)}m
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Recommendations</h4>
            <div className="text-blue-800 space-y-1">
              {test.results.isSignificant ? (
                <p>✓ The test has reached statistical significance. Consider implementing the winning variant.</p>
              ) : (
                <p>⚠ The test has not reached statistical significance. Consider running longer or increasing sample size.</p>
              )}
              {test.results.uplift > 10 && (
                <p>✓ Significant performance improvement detected. High priority for implementation.</p>
              )}
              {test.results.confidence > 95 && (
                <p>✓ High confidence in results. Safe to implement winning variant.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">A/B Testing</h2>
          <p className="text-gray-600">
            Test funnel optimizations with controlled experiments
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Test
        </Button>
      </div>

      {/* Create Test Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create A/B Test</CardTitle>
            <CardDescription>
              Set up a controlled experiment to test funnel optimizations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test-name">Test Name</Label>
                <Input
                  id="test-name"
                  value={newTest.name}
                  onChange={(e) => setNewTest({...newTest, name: e.target.value})}
                  placeholder="e.g., CTA Button Color Test"
                />
              </div>
              <div>
                <Label htmlFor="test-step">Funnel Step</Label>
                <Select 
                  value={newTest.stepId} 
                  onValueChange={(value) => setNewTest({...newTest, stepId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select step to test" />
                  </SelectTrigger>
                  <SelectContent>
                    {funnel.steps.map((step) => (
                      <SelectItem key={step.id} value={step.id}>
                        {step.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="test-description">Description</Label>
              <Textarea
                id="test-description"
                value={newTest.description}
                onChange={(e) => setNewTest({...newTest, description: e.target.value})}
                placeholder="Describe what you're testing and why..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test-duration">Duration (days)</Label>
                <Input
                  id="test-duration"
                  type="number"
                  value={newTest.duration}
                  onChange={(e) => setNewTest({...newTest, duration: parseInt(e.target.value)})}
                  min="1"
                  max="90"
                />
              </div>
              <div>
                <Label htmlFor="traffic-split">Traffic Split (%)</Label>
                <Input
                  id="traffic-split"
                  type="number"
                  value={newTest.trafficSplit}
                  onChange={(e) => setNewTest({...newTest, trafficSplit: parseInt(e.target.value)})}
                  min="10"
                  max="90"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {100 - newTest.trafficSplit}% Control / {newTest.trafficSplit}% Variant
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-effect">Min Detectable Effect (%)</Label>
                <Input
                  id="min-effect"
                  type="number"
                  value={newTest.minDetectableEffect}
                  onChange={(e) => setNewTest({...newTest, minDetectableEffect: parseInt(e.target.value)})}
                  min="1"
                  max="50"
                />
              </div>
              <div>
                <Label htmlFor="significance">Significance Level (%)</Label>
                <Input
                  id="significance"
                  type="number"
                  value={newTest.significanceLevel}
                  onChange={(e) => setNewTest({...newTest, significanceLevel: parseInt(e.target.value)})}
                  min="80"
                  max="99"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={createABTest}>Create Test</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Tests</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="suggestions">From Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tests.filter(t => ['draft', 'running', 'paused'].includes(t.status)).map(renderTestCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tests.filter(t => ['completed', 'stopped'].includes(t.status)).map(renderTestCard)}
          </div>
          
          {selectedTest && selectedTest.results && renderTestResults(selectedTest)}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Recommendations</CardTitle>
              <CardDescription>
                Create tests based on optimization suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {optimizationSuggestions.filter(s => s.testingRecommendation).length > 0 ? (
                <div className="space-y-4">
                  {optimizationSuggestions
                    .filter(s => s.testingRecommendation)
                    .slice(0, 5)
                    .map((suggestion) => (
                      <div key={suggestion.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{suggestion.title}</h4>
                          <Badge variant="outline">
                            {suggestion.impact} impact
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                        
                        {suggestion.testingRecommendation && (
                          <div className="bg-gray-50 p-3 rounded mb-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Test Type</p>
                                <p className="font-medium">{suggestion.testingRecommendation.testType}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Sample Size</p>
                                <p className="font-medium">{suggestion.testingRecommendation.sampleSize.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Duration</p>
                                <p className="font-medium">{suggestion.testingRecommendation.testDuration} days</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Risk</p>
                                <p className="font-medium">{suggestion.testingRecommendation.riskAssessment}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <Button size="sm">
                          <TestTube className="h-4 w-4 mr-1" />
                          Create Test
                        </Button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TestTube className="h-8 w-8 mx-auto mb-2" />
                  <p>No test recommendations available</p>
                  <p className="text-sm">Generate optimization suggestions first</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}