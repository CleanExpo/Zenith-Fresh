'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Zap, 
  TrendingUp, 
  Target, 
  Lightbulb,
  BarChart3,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  ArrowRight,
  Brain,
  Sparkles,
  TestTube,
  Eye,
  ThumbsUp,
  Star,
  Rocket
} from 'lucide-react';
import { 
  OptimizationSuggestion,
  OptimizationType,
  OptimizationImpact,
  OptimizationEffort,
  OptimizationCategory,
  FunnelWithSteps,
  FunnelMetrics,
  DropoffPoint
} from '../../types/funnel';

interface ConversionOptimizerProps {
  funnelId: string;
  funnel: FunnelWithSteps;
  metrics: FunnelMetrics;
  dateRange: [Date, Date];
  className?: string;
}

interface OptimizationScore {
  overall: number;
  impact: number;
  feasibility: number;
  confidence: number;
  urgency: number;
}

interface AIInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'success';
  title: string;
  description: string;
  confidence: number;
  dataPoints: string[];
  recommendation: string;
}

export default function ConversionOptimizer({
  funnelId,
  funnel,
  metrics,
  dateRange,
  className = ''
}: ConversionOptimizerProps) {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<OptimizationSuggestion | null>(null);
  const [filterType, setFilterType] = useState<OptimizationType | 'all'>('all');
  const [filterImpact, setFilterImpact] = useState<OptimizationImpact | 'all'>('all');
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [implementationNotes, setImplementationNotes] = useState('');
  const [isImplementing, setIsImplementing] = useState(false);

  // Load optimization suggestions
  useEffect(() => {
    loadOptimizationSuggestions();
    generateAIInsights();
  }, [funnelId, dateRange]);

  const loadOptimizationSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/funnels/${funnelId}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange,
          minConfidence: 0.3,
          maxSuggestions: 20
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to load optimization suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIInsights = async () => {
    try {
      // Generate AI insights based on funnel data
      const insights: AIInsight[] = [];

      // Low conversion rate insight
      const lowConversionSteps = metrics.stepConversionRates.filter(step => step.conversionRate < 0.3);
      if (lowConversionSteps.length > 0) {
        insights.push({
          id: 'low-conversion',
          type: 'opportunity',
          title: 'Low Conversion Rates Detected',
          description: `${lowConversionSteps.length} steps have conversion rates below 30%`,
          confidence: 0.9,
          dataPoints: lowConversionSteps.map(step => `${step.stepName}: ${(step.conversionRate * 100).toFixed(1)}%`),
          recommendation: 'Focus on optimizing these steps with A/B testing and user experience improvements'
        });
      }

      // High dropoff insight
      const criticalDropoffs = metrics.dropoffPoints.filter(dp => dp.dropoffRate > 0.6);
      if (criticalDropoffs.length > 0) {
        insights.push({
          id: 'critical-dropoffs',
          type: 'warning',
          title: 'Critical Dropoff Points Found',
          description: `${criticalDropoffs.length} transition points have dropoff rates above 60%`,
          confidence: 0.95,
          dataPoints: criticalDropoffs.map(dp => `${dp.fromStepName} → ${dp.toStepName}: ${(dp.dropoffRate * 100).toFixed(1)}%`),
          recommendation: 'Immediate action required to reduce friction at these critical points'
        });
      }

      // Revenue opportunity insight
      const totalRevenueLoss = metrics.dropoffPoints.reduce((sum, dp) => sum + dp.potentialRevenueLoss, 0);
      if (totalRevenueLoss > 5000) {
        insights.push({
          id: 'revenue-opportunity',
          type: 'opportunity',
          title: 'Significant Revenue Recovery Potential',
          description: `Estimated $${totalRevenueLoss.toLocaleString()} in recoverable revenue`,
          confidence: 0.8,
          dataPoints: [`Total potential recovery: $${totalRevenueLoss.toLocaleString()}`],
          recommendation: 'Prioritize optimizations with highest revenue impact for maximum ROI'
        });
      }

      // Successful steps insight
      const highPerformingSteps = metrics.stepConversionRates.filter(step => step.conversionRate > 0.8);
      if (highPerformingSteps.length > 0) {
        insights.push({
          id: 'high-performing',
          type: 'success',
          title: 'High-Performing Steps Identified',
          description: `${highPerformingSteps.length} steps are performing exceptionally well`,
          confidence: 0.9,
          dataPoints: highPerformingSteps.map(step => `${step.stepName}: ${(step.conversionRate * 100).toFixed(1)}%`),
          recommendation: 'Analyze these successful patterns and apply learnings to underperforming steps'
        });
      }

      setAiInsights(insights);
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
    }
  };

  // Calculate optimization score
  const calculateOptimizationScore = (suggestion: OptimizationSuggestion): OptimizationScore => {
    const impactScore = suggestion.impact === 'high' ? 100 : suggestion.impact === 'medium' ? 70 : 40;
    const effortScore = suggestion.effort === 'low' ? 100 : suggestion.effort === 'medium' ? 70 : 40;
    const confidenceScore = suggestion.confidence * 100;
    const urgencyScore = suggestion.expectedLift > 0.3 ? 100 : suggestion.expectedLift > 0.15 ? 70 : 40;
    
    const overall = (impactScore * 0.3 + effortScore * 0.2 + confidenceScore * 0.3 + urgencyScore * 0.2);

    return {
      overall,
      impact: impactScore,
      feasibility: effortScore,
      confidence: confidenceScore,
      urgency: urgencyScore
    };
  };

  // Filter suggestions
  const filteredSuggestions = useMemo(() => {
    return suggestions.filter(suggestion => {
      if (filterType !== 'all' && suggestion.type !== filterType) return false;
      if (filterImpact !== 'all' && suggestion.impact !== filterImpact) return false;
      return true;
    }).sort((a, b) => {
      const scoreA = calculateOptimizationScore(a).overall;
      const scoreB = calculateOptimizationScore(b).overall;
      return scoreB - scoreA;
    });
  }, [suggestions, filterType, filterImpact]);

  const handleImplementSuggestion = async (suggestion: OptimizationSuggestion) => {
    setIsImplementing(true);
    try {
      const response = await fetch(`/api/funnels/${funnelId}/implement-optimization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          notes: implementationNotes,
          implementedBy: 'current-user' // TODO: Get from auth context
        })
      });

      if (response.ok) {
        // Refresh suggestions
        await loadOptimizationSuggestions();
        setSelectedSuggestion(null);
        setImplementationNotes('');
      }
    } catch (error) {
      console.error('Failed to implement optimization:', error);
    } finally {
      setIsImplementing(false);
    }
  };

  const getTypeIcon = (type: OptimizationType) => {
    const icons = {
      [OptimizationType.COPY_OPTIMIZATION]: Lightbulb,
      [OptimizationType.DESIGN_IMPROVEMENT]: Eye,
      [OptimizationType.FLOW_SIMPLIFICATION]: ArrowRight,
      [OptimizationType.TECHNICAL_FIX]: Target,
      [OptimizationType.PERSONALIZATION]: Users,
      [OptimizationType.SOCIAL_PROOF]: ThumbsUp,
      [OptimizationType.URGENCY_SCARCITY]: Clock,
      [OptimizationType.FORM_OPTIMIZATION]: CheckCircle
    };
    return icons[type] || Lightbulb;
  };

  const getImpactColor = (impact: OptimizationImpact) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-blue-600 bg-blue-50';
    }
  };

  const getEffortColor = (effort: OptimizationEffort) => {
    switch (effort) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
    }
  };

  const renderOptimizationCard = (suggestion: OptimizationSuggestion) => {
    const score = calculateOptimizationScore(suggestion);
    const IconComponent = getTypeIcon(suggestion.type);

    return (
      <Card 
        key={suggestion.id}
        className={`cursor-pointer transition-all hover:shadow-lg ${
          selectedSuggestion?.id === suggestion.id ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => setSelectedSuggestion(suggestion)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <IconComponent className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg leading-tight">{suggestion.title}</CardTitle>
                <CardDescription className="mt-1">
                  {suggestion.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Badge variant="outline" className="text-xs">
                {Math.round(score.overall)}% score
              </Badge>
              <Badge className={getImpactColor(suggestion.impact)}>
                {suggestion.impact} impact
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Expected Lift</p>
              <p className="font-semibold text-green-600">
                +{(suggestion.expectedLift * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-gray-600">Confidence</p>
              <p className="font-semibold">
                {(suggestion.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-gray-600">Effort</p>
              <Badge className={getEffortColor(suggestion.effort)} variant="outline">
                {suggestion.effort}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Optimization Score</span>
              <span>{Math.round(score.overall)}%</span>
            </div>
            <Progress value={score.overall} className="h-2" />
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {suggestion.category.replace('_', ' ')}
            </Badge>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <CardTitle>AI Optimization Insights</CardTitle>
              </div>
              <CardDescription>
                AI-powered analysis of your funnel performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiInsights.map((insight) => (
                  <div 
                    key={insight.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      insight.type === 'opportunity' ? 'border-green-500 bg-green-50' :
                      insight.type === 'warning' ? 'border-red-500 bg-red-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                        <p className="text-xs text-gray-700 mt-2 italic">{insight.recommendation}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {(insight.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Rocket className="h-5 w-5 text-blue-600" />
                <span>Quick Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {suggestions.length}
                </div>
                <p className="text-sm text-gray-600">Optimization opportunities</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  +{suggestions.reduce((sum, s) => sum + s.expectedLift, 0).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">Total potential lift</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {suggestions.filter(s => s.impact === 'high').length}
                </div>
                <p className="text-sm text-gray-600">High-impact suggestions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
          <TabsTrigger value="testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="filter-type">Type:</Label>
                  <Select value={filterType} onValueChange={(value) => setFilterType(value as OptimizationType | 'all')}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value={OptimizationType.COPY_OPTIMIZATION}>Copy</SelectItem>
                      <SelectItem value={OptimizationType.DESIGN_IMPROVEMENT}>Design</SelectItem>
                      <SelectItem value={OptimizationType.FLOW_SIMPLIFICATION}>Flow</SelectItem>
                      <SelectItem value={OptimizationType.TECHNICAL_FIX}>Technical</SelectItem>
                      <SelectItem value={OptimizationType.PERSONALIZATION}>Personalization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="filter-impact">Impact:</Label>
                  <Select value={filterImpact} onValueChange={(value) => setFilterImpact(value as OptimizationImpact | 'all')}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggestions Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSuggestions.map(renderOptimizationCard)}
            </div>
          )}

          {/* No suggestions state */}
          {!isLoading && filteredSuggestions.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {suggestions.length === 0 ? 'No Suggestions Available' : 'No Matching Suggestions'}
                </h3>
                <p className="text-gray-600">
                  {suggestions.length === 0 
                    ? 'Your funnel is performing well! Check back later for new optimization opportunities.'
                    : 'Try adjusting your filters to see more suggestions.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="implementation" className="space-y-4">
          {selectedSuggestion ? (
            <Card>
              <CardHeader>
                <CardTitle>Implement Optimization</CardTitle>
                <CardDescription>
                  {selectedSuggestion.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Implementation Steps</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {selectedSuggestion.implementation.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Requirements</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSuggestion.implementation.requirements.map((req, index) => (
                      <Badge key={index} variant="outline">{req}</Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Estimated Time</Label>
                    <p className="text-lg font-semibold">
                      {selectedSuggestion.implementation.estimatedTimeHours} hours
                    </p>
                  </div>
                  <div>
                    <Label>Technical Complexity</Label>
                    <Badge className={
                      selectedSuggestion.implementation.technicalComplexity === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : selectedSuggestion.implementation.technicalComplexity === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }>
                      {selectedSuggestion.implementation.technicalComplexity}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label htmlFor="implementation-notes">Implementation Notes</Label>
                  <Textarea
                    id="implementation-notes"
                    value={implementationNotes}
                    onChange={(e) => setImplementationNotes(e.target.value)}
                    placeholder="Add any notes about the implementation..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setSelectedSuggestion(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleImplementSuggestion(selectedSuggestion)}
                    disabled={isImplementing}
                  >
                    {isImplementing ? 'Implementing...' : 'Mark as Implemented'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Suggestion to Implement
                </h3>
                <p className="text-gray-600">
                  Choose an optimization suggestion from the suggestions tab to see implementation details.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TestTube className="h-5 w-5" />
                <span>A/B Testing Recommendations</span>
              </CardTitle>
              <CardDescription>
                Suggested tests for your optimization ideas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suggestions
                  .filter(s => s.testingRecommendation)
                  .slice(0, 3)
                  .map((suggestion) => (
                    <div key={suggestion.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">{suggestion.title}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Test Type</p>
                          <p className="font-medium">{suggestion.testingRecommendation?.testType}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Sample Size</p>
                          <p className="font-medium">{suggestion.testingRecommendation?.sampleSize.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Duration</p>
                          <p className="font-medium">{suggestion.testingRecommendation?.testDuration} days</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Risk Level</p>
                          <p className="font-medium">{suggestion.testingRecommendation?.riskAssessment}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-1">Success Metrics:</p>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.testingRecommendation?.successMetrics.map((metric, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {metric}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button className="mt-3" size="sm">
                        Create Test
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Results</CardTitle>
              <CardDescription>
                Track the performance of your implemented optimizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>No optimization results yet</p>
                <p className="text-sm">Results will appear here once optimizations are implemented and measured</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}