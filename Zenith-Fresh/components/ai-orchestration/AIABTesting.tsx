"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  TestTube,
  Play,
  Pause,
  Square,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Users,
  Trophy,
  AlertCircle,
  CheckCircle,
  Plus,
  Edit,
  Copy,
  Archive,
  Download,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ABTest {
  id: string;
  name: string;
  description?: string;
  agentId: string;
  agentName: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  testType: 'response_quality' | 'latency' | 'cost_effectiveness' | 'user_satisfaction';
  
  // Test configuration
  trafficSplit: number; // 0-1, percentage for variant A
  minimumSamples: number;
  confidenceLevel: number;
  
  // Variants
  variants: ABTestVariant[];
  
  // Results
  winningVariant?: 'A' | 'B' | 'inconclusive';
  confidenceScore?: number;
  
  // Timeline
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ABTestVariant {
  id: string;
  name: 'A' | 'B';
  modelId: string;
  modelName: string;
  configuration?: any;
  
  // Performance metrics
  totalRequests: number;
  averageLatency: number;
  averageQuality: number;
  averageCost: number;
  userSatisfaction: number;
  
  // Statistical data
  samples: number;
  conversionRate?: number;
  standardError?: number;
}

interface ABTestResult {
  id: string;
  abTestId: string;
  variantName: 'A' | 'B';
  metric: 'latency' | 'quality' | 'cost' | 'satisfaction';
  value: number;
  timestamp: Date;
}

interface TestStatistics {
  significance: number;
  pValue: number;
  effect: number;
  improvement: number;
  reliability: 'high' | 'medium' | 'low';
}

const testTypes = {
  response_quality: { 
    label: 'Response Quality', 
    icon: Target, 
    description: 'Compare response quality scores',
    metric: 'quality'
  },
  latency: { 
    label: 'Response Speed', 
    icon: Clock, 
    description: 'Compare response latency',
    metric: 'latency'
  },
  cost_effectiveness: { 
    label: 'Cost Efficiency', 
    icon: TrendingUp, 
    description: 'Compare cost per response',
    metric: 'cost'
  },
  user_satisfaction: { 
    label: 'User Satisfaction', 
    icon: Users, 
    description: 'Compare user satisfaction ratings',
    metric: 'satisfaction'
  }
};

export default function AIABTesting() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [testResults, setTestResults] = useState<ABTestResult[]>([]);
  const [statistics, setStatistics] = useState<TestStatistics | null>(null);

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    if (selectedTest) {
      fetchTestResults(selectedTest.id);
      calculateStatistics(selectedTest);
    }
  }, [selectedTest]);

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/ai-orchestration/ab-tests');
      const data = await response.json();
      setTests(data.tests || []);
    } catch (error) {
      console.error('Error fetching A/B tests:', error);
    }
  };

  const fetchTestResults = async (testId: string) => {
    try {
      const response = await fetch(`/api/ai-orchestration/ab-tests/${testId}/results`);
      const data = await response.json();
      setTestResults(data.results || []);
    } catch (error) {
      console.error('Error fetching test results:', error);
    }
  };

  const calculateStatistics = async (test: ABTest) => {
    try {
      const response = await fetch(`/api/ai-orchestration/ab-tests/${test.id}/statistics`);
      const data = await response.json();
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Error calculating statistics:', error);
    }
  };

  const createTest = async (testData: any) => {
    try {
      const response = await fetch('/api/ai-orchestration/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        fetchTests();
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Error creating test:', error);
    }
  };

  const controlTest = async (testId: string, action: 'start' | 'pause' | 'stop') => {
    try {
      const response = await fetch(`/api/ai-orchestration/ab-tests/${testId}/${action}`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchTests();
        if (selectedTest?.id === testId) {
          const updatedTest = tests.find(t => t.id === testId);
          if (updatedTest) setSelectedTest(updatedTest);
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing test:`, error);
    }
  };

  const runningTests = tests.filter(test => test.status === 'running').length;
  const completedTests = tests.filter(test => test.status === 'completed').length;
  const totalSamples = tests.reduce((sum, test) => 
    sum + test.variants.reduce((vSum, variant) => vSum + variant.samples, 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI A/B Testing</h1>
          <p className="text-muted-foreground">Test and optimize AI model performance</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New A/B Test
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Tests</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSamples.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Tests List */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>A/B Tests</CardTitle>
              <CardDescription>Select a test to view details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tests.map((test) => (
                  <TestCard
                    key={test.id}
                    test={test}
                    isSelected={selectedTest?.id === test.id}
                    onSelect={setSelectedTest}
                    onControl={controlTest}
                  />
                ))}
                {tests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <TestTube className="mx-auto h-8 w-8 mb-2" />
                    <div>No A/B tests yet</div>
                    <div className="text-sm">Create your first test to get started</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Details */}
        <div className="md:col-span-2">
          {selectedTest ? (
            <TestDetails 
              test={selectedTest} 
              results={testResults}
              statistics={statistics}
              onControl={controlTest}
            />
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="text-center text-muted-foreground">
                  <TestTube className="mx-auto h-12 w-12 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No test selected</h3>
                  <p>Choose an A/B test from the sidebar to view detailed results and analytics</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Test Dialog */}
      <CreateTestDialog
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onCreate={createTest}
      />
    </div>
  );
}

function TestCard({ test, isSelected, onSelect, onControl }: {
  test: ABTest;
  isSelected: boolean;
  onSelect: (test: ABTest) => void;
  onControl: (testId: string, action: 'start' | 'pause' | 'stop') => void;
}) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    running: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700'
  };

  const TestTypeIcon = testTypes[test.testType].icon;

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect(test)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TestTypeIcon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">{test.name}</CardTitle>
          </div>
          <Badge className={statusColors[test.status]}>
            {test.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            {testTypes[test.testType].label}
          </div>
          
          {test.status === 'running' && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Samples</span>
                <span>
                  {test.variants.reduce((sum, v) => sum + v.samples, 0)} / {test.minimumSamples}
                </span>
              </div>
              <Progress 
                value={(test.variants.reduce((sum, v) => sum + v.samples, 0) / test.minimumSamples) * 100} 
                className="h-1" 
              />
            </div>
          )}

          {test.winningVariant && (
            <div className="flex items-center space-x-1 text-xs">
              <Trophy className="h-3 w-3 text-yellow-500" />
              <span>Winner: Variant {test.winningVariant}</span>
            </div>
          )}

          <div className="flex space-x-1 pt-1">
            {test.status === 'draft' && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onControl(test.id, 'start');
                }}
                className="h-6 px-2 text-xs"
              >
                Start
              </Button>
            )}
            {test.status === 'running' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onControl(test.id, 'pause');
                  }}
                  className="h-6 px-2 text-xs"
                >
                  Pause
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onControl(test.id, 'stop');
                  }}
                  className="h-6 px-2 text-xs"
                >
                  Stop
                </Button>
              </>
            )}
            {test.status === 'paused' && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onControl(test.id, 'start');
                }}
                className="h-6 px-2 text-xs"
              >
                Resume
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TestDetails({ test, results, statistics, onControl }: {
  test: ABTest;
  results: ABTestResult[];
  statistics: TestStatistics | null;
  onControl: (testId: string, action: 'start' | 'pause' | 'stop') => void;
}) {
  const variantA = test.variants.find(v => v.name === 'A');
  const variantB = test.variants.find(v => v.name === 'B');
  
  const totalSamples = test.variants.reduce((sum, v) => sum + v.samples, 0);
  const progress = (totalSamples / test.minimumSamples) * 100;

  return (
    <div className="space-y-4">
      {/* Test Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{test.name}</CardTitle>
              <CardDescription>{test.description}</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={test.status === 'running' ? 'default' : 'secondary'}>
                {test.status}
              </Badge>
              {test.winningVariant && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Trophy className="h-3 w-3" />
                  <span>Variant {test.winningVariant} Wins</span>
                </Badge>
              )}
            </div>
          </div>
          
          {/* Test Progress */}
          {test.status === 'running' && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Test Progress</span>
                <span>{totalSamples} / {test.minimumSamples} samples</span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {Math.min(progress, 100).toFixed(1)}% complete
              </div>
            </div>
          )}
          
          {/* Test Controls */}
          <div className="flex space-x-2 mt-4">
            {test.status === 'running' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onControl(test.id, 'pause')}
                >
                  <Pause className="mr-1 h-3 w-3" />
                  Pause
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onControl(test.id, 'stop')}
                >
                  <Square className="mr-1 h-3 w-3" />
                  Stop
                </Button>
              </>
            )}
            {test.status === 'paused' && (
              <Button
                size="sm"
                onClick={() => onControl(test.id, 'start')}
              >
                <Play className="mr-1 h-3 w-3" />
                Resume
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Variant Comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        {variantA && (
          <VariantCard 
            variant={variantA} 
            testType={test.testType}
            isWinner={test.winningVariant === 'A'}
          />
        )}
        {variantB && (
          <VariantCard 
            variant={variantB} 
            testType={test.testType}
            isWinner={test.winningVariant === 'B'}
          />
        )}
      </div>

      {/* Statistical Analysis */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle>Statistical Analysis</CardTitle>
            <CardDescription>Confidence and significance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{(statistics.significance * 100).toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Statistical Significance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.pValue.toFixed(4)}</div>
                <div className="text-sm text-muted-foreground">P-Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.improvement > 0 ? '+' : ''}{statistics.improvement.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Improvement</div>
              </div>
              <div className="text-center">
                <Badge variant={
                  statistics.reliability === 'high' ? 'default' : 
                  statistics.reliability === 'medium' ? 'secondary' : 'destructive'
                }>
                  {statistics.reliability} reliability
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">Result Quality</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <BarChart3 className="h-8 w-8 mr-2" />
            Results chart would be rendered here with actual data
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VariantCard({ variant, testType, isWinner }: {
  variant: ABTestVariant;
  testType: string;
  isWinner: boolean;
}) {
  const metrics = {
    latency: { value: variant.averageLatency, unit: 'ms', format: (v: number) => `${v.toFixed(0)}ms` },
    quality: { value: variant.averageQuality * 100, unit: '%', format: (v: number) => `${v.toFixed(1)}%` },
    cost: { value: variant.averageCost, unit: '$', format: (v: number) => `$${v.toFixed(4)}` },
    satisfaction: { value: variant.userSatisfaction * 100, unit: '%', format: (v: number) => `${v.toFixed(1)}%` }
  };

  const primaryMetric = testTypes[testType]?.metric || 'quality';
  const metricData = metrics[primaryMetric];

  return (
    <Card className={isWinner ? 'ring-2 ring-green-500' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle>Variant {variant.name}</CardTitle>
            {isWinner && (
              <Badge className="bg-green-100 text-green-700">
                <Trophy className="w-3 h-3 mr-1" />
                Winner
              </Badge>
            )}
          </div>
          <Badge variant="outline">{variant.modelName}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Primary Metric */}
          <div className="text-center p-3 bg-muted/50 rounded">
            <div className="text-2xl font-bold">{metricData.format(metricData.value)}</div>
            <div className="text-sm text-muted-foreground capitalize">
              {testTypes[testType]?.label}
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Requests:</span>
              <div className="font-medium">{variant.totalRequests.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Samples:</span>
              <div className="font-medium">{variant.samples.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Latency:</span>
              <div className="font-medium">{variant.averageLatency.toFixed(0)}ms</div>
            </div>
            <div>
              <span className="text-muted-foreground">Cost:</span>
              <div className="font-medium">${variant.averageCost.toFixed(4)}</div>
            </div>
          </div>

          {/* Quality Score */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Quality Score</span>
              <span>{(variant.averageQuality * 100).toFixed(1)}%</span>
            </div>
            <Progress value={variant.averageQuality * 100} className="h-2" />
          </div>

          {/* User Satisfaction */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">User Satisfaction</span>
              <span>{(variant.userSatisfaction * 100).toFixed(1)}%</span>
            </div>
            <Progress value={variant.userSatisfaction * 100} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateTestDialog({ isOpen, onClose, onCreate }: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (test: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    testType: 'response_quality',
    trafficSplit: 50,
    minimumSamples: 1000,
    confidenceLevel: 95,
    variantAModel: '',
    variantBModel: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create A/B Test</DialogTitle>
          <DialogDescription>
            Set up a new A/B test to compare AI model performance
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Test Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Response Quality Test"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="testType">Test Type</Label>
              <Select
                value={formData.testType}
                onValueChange={(value) => setFormData({ ...formData, testType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(testTypes).map(([key, type]) => (
                    <SelectItem key={key} value={key}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you're testing..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Traffic Split (% to Variant A)</Label>
              <Slider
                value={[formData.trafficSplit]}
                onValueChange={([value]) => setFormData({ ...formData, trafficSplit: value })}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="text-sm text-muted-foreground">
                Variant A: {formData.trafficSplit}% | Variant B: {100 - formData.trafficSplit}%
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimumSamples">Minimum Samples</Label>
              <Input
                id="minimumSamples"
                type="number"
                value={formData.minimumSamples}
                onChange={(e) => setFormData({ ...formData, minimumSamples: parseInt(e.target.value) })}
                min={100}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="variantAModel">Variant A Model</Label>
              <Select
                value={formData.variantAModel}
                onValueChange={(value) => setFormData({ ...formData, variantAModel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variantBModel">Variant B Model</Label>
              <Select
                value={formData.variantBModel}
                onValueChange={(value) => setFormData({ ...formData, variantBModel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Test
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}