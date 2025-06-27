'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  Clock, 
  DollarSign,
  BarChart3,
  Filter,
  Download,
  Zap,
  Target,
  ArrowDown,
  ArrowRight
} from 'lucide-react';
import { 
  FunnelMetrics,
  DropoffPoint,
  FunnelUserJourney,
  FunnelWithSteps
} from '../../types/funnel';

interface DropoffAnalyzerProps {
  funnelId: string;
  funnel: FunnelWithSteps;
  metrics: FunnelMetrics;
  dateRange: [Date, Date];
  onOptimizationRequest?: (dropoffPoint: DropoffPoint) => void;
  className?: string;
}

interface DropoffInsight {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  potentialImprovement: number;
  effort: 'low' | 'medium' | 'high';
  dropoffPoint?: DropoffPoint;
}

interface DropoffSegment {
  name: string;
  criteria: string;
  dropoffRate: number;
  userCount: number;
  commonReasons: string[];
}

export default function DropoffAnalyzer({
  funnelId,
  funnel,
  metrics,
  dateRange,
  onOptimizationRequest,
  className = ''
}: DropoffAnalyzerProps) {
  const [selectedDropoff, setSelectedDropoff] = useState<DropoffPoint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detailedAnalysis, setDetailedAnalysis] = useState<any>(null);
  const [insights, setInsights] = useState<DropoffInsight[]>([]);
  const [segments, setSegments] = useState<DropoffSegment[]>([]);

  // Calculate insights from dropoff data
  const calculatedInsights = useMemo(() => {
    const dropoffInsights: DropoffInsight[] = [];

    // Analyze each dropoff point
    metrics.dropoffPoints.forEach((dropoff, index) => {
      const severity = dropoff.dropoffRate > 0.7 ? 'critical' : dropoff.dropoffRate > 0.4 ? 'warning' : 'info';
      const impact = dropoff.dropoffRate > 0.7 ? 'high' : dropoff.dropoffRate > 0.4 ? 'medium' : 'low';

      dropoffInsights.push({
        id: `dropoff-${dropoff.fromStep}-${dropoff.toStep}`,
        type: severity,
        title: `High dropout between ${dropoff.fromStepName} and ${dropoff.toStepName}`,
        description: `${(dropoff.dropoffRate * 100).toFixed(1)}% of users (${dropoff.dropoffCount.toLocaleString()}) drop off at this point`,
        impact,
        recommendation: getDropoffRecommendation(dropoff, funnel),
        potentialImprovement: dropoff.dropoffRate * 0.3, // Assume 30% improvement possible
        effort: getImplementationEffort(dropoff),
        dropoffPoint: dropoff
      });
    });

    // Find the biggest opportunity
    const biggestDropoff = metrics.dropoffPoints.reduce((max, current) =>
      current.dropoffCount > max.dropoffCount ? current : max,
      metrics.dropoffPoints[0]
    );

    if (biggestDropoff) {
      dropoffInsights.push({
        id: 'biggest-opportunity',
        type: 'critical',
        title: 'Biggest Conversion Opportunity',
        description: `Fixing the ${biggestDropoff.fromStepName} → ${biggestDropoff.toStepName} dropoff could recover ${biggestDropoff.dropoffCount.toLocaleString()} users`,
        impact: 'high',
        recommendation: 'Prioritize optimizing this step for maximum impact',
        potentialImprovement: biggestDropoff.dropoffRate * 0.4,
        effort: 'medium'
      });
    }

    // Revenue impact analysis
    const totalRevenueLoss = metrics.dropoffPoints.reduce((sum, dp) => sum + dp.potentialRevenueLoss, 0);
    if (totalRevenueLoss > 1000) {
      dropoffInsights.push({
        id: 'revenue-impact',
        type: 'critical',
        title: 'Significant Revenue Impact',
        description: `Dropoffs are causing an estimated $${totalRevenueLoss.toLocaleString()} in lost revenue`,
        impact: 'high',
        recommendation: 'Focus on revenue-generating step optimizations first',
        potentialImprovement: totalRevenueLoss * 0.25, // 25% recovery
        effort: 'medium'
      });
    }

    return dropoffInsights;
  }, [metrics.dropoffPoints, funnel]);

  useEffect(() => {
    setInsights(calculatedInsights);
  }, [calculatedInsights]);

  const loadDetailedAnalysis = async (dropoffPoint: DropoffPoint) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/funnels/${funnelId}/dropoff-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromStep: dropoffPoint.fromStep,
          toStep: dropoffPoint.toStep,
          dateRange
        })
      });

      if (response.ok) {
        const analysis = await response.json();
        setDetailedAnalysis(analysis);
        
        // Generate segments from analysis
        setSegments(analysis.segments || []);
      }
    } catch (error) {
      console.error('Failed to load detailed analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDropoffRecommendation = (dropoff: DropoffPoint, funnel: FunnelWithSteps): string => {
    const fromStep = funnel.steps.find(s => s.stepNumber === dropoff.fromStep);
    const toStep = funnel.steps.find(s => s.stepNumber === dropoff.toStep);

    if (!fromStep || !toStep) return 'Analyze user behavior and simplify the transition';

    switch (toStep.eventType) {
      case 'FORM_SUBMIT':
        return 'Simplify form fields, add progress indicators, or implement autosave';
      case 'BUTTON_CLICK':
        return 'Improve button visibility, add urgency, or A/B test different CTAs';
      case 'PAGE_VIEW':
        return 'Optimize page load speed, improve navigation, or add progress indicators';
      case 'PURCHASE':
        return 'Reduce checkout steps, add payment options, or address security concerns';
      default:
        return 'Analyze user recordings and feedback to identify friction points';
    }
  };

  const getImplementationEffort = (dropoff: DropoffPoint): 'low' | 'medium' | 'high' => {
    if (dropoff.dropoffRate > 0.7) return 'high'; // Major restructuring needed
    if (dropoff.dropoffRate > 0.4) return 'medium'; // Moderate changes
    return 'low'; // Minor optimizations
  };

  const getSeverityColor = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getImpactBadge = (impact: 'high' | 'medium' | 'low') => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;
    
    return <Badge variant={variants[impact]}>{impact.toUpperCase()}</Badge>;
  };

  const handleDropoffSelect = (dropoff: DropoffPoint) => {
    setSelectedDropoff(dropoff);
    loadDetailedAnalysis(dropoff);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dropoffs</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.dropoffPoints.reduce((sum, dp) => sum + dp.dropoffCount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              users lost in funnel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Dropoff Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(metrics.dropoffPoints.reduce((sum, dp) => sum + dp.dropoffRate, 0) / Math.max(metrics.dropoffPoints.length, 1) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">
              across all steps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${metrics.dropoffPoints.reduce((sum, dp) => sum + dp.potentialRevenueLoss, 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              potential lost revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Points</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.dropoffPoints.filter(dp => dp.dropoffRate > 0.5).length}
            </div>
            <p className="text-xs text-gray-500">
              steps need urgent attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dropoffs">Dropoff Points</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="segments">User Segments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Funnel Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Dropoff Visualization</CardTitle>
              <CardDescription>
                Visual representation of user dropoffs through the funnel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnel.steps.map((step, index) => {
                  const stepMetric = metrics.stepConversionRates.find(m => m.stepNumber === step.stepNumber);
                  const dropoff = metrics.dropoffPoints.find(dp => dp.fromStep === step.stepNumber);
                  const userCount = stepMetric?.users || 0;
                  const nextStepUsers = metrics.stepConversionRates.find(m => m.stepNumber === step.stepNumber + 1)?.users || 0;
                  const dropoffRate = dropoff?.dropoffRate || 0;

                  return (
                    <div key={step.id} className="relative">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{step.name}</h4>
                              <p className="text-sm text-gray-600">
                                {userCount.toLocaleString()} users
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">
                                {((userCount / metrics.totalUsers) * 100).toFixed(1)}%
                              </div>
                              <p className="text-xs text-gray-500">of total users</p>
                            </div>
                          </div>
                          <Progress 
                            value={(userCount / metrics.totalUsers) * 100} 
                            className="h-3"
                          />
                        </div>
                      </div>

                      {/* Dropoff Section */}
                      {dropoff && index < funnel.steps.length - 1 && (
                        <div className="mt-2 ml-4">
                          <div 
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                              dropoffRate > 0.5 
                                ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                                : dropoffRate > 0.3 
                                ? 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                            onClick={() => handleDropoffSelect(dropoff)}
                          >
                            <div className="flex items-center space-x-3">
                              <ArrowDown className={`h-4 w-4 ${
                                dropoffRate > 0.5 ? 'text-red-500' : 
                                dropoffRate > 0.3 ? 'text-orange-500' : 'text-gray-500'
                              }`} />
                              <div>
                                <p className="font-medium text-sm">
                                  {dropoff.dropoffCount.toLocaleString()} users dropped off
                                </p>
                                <p className="text-xs text-gray-600">
                                  {(dropoffRate * 100).toFixed(1)}% dropoff rate
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-red-600">
                                -${dropoff.potentialRevenueLoss.toLocaleString()}
                              </div>
                              <p className="text-xs text-gray-500">potential loss</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Arrow to next step */}
                      {index < funnel.steps.length - 1 && (
                        <div className="flex justify-center my-2">
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dropoffs" className="space-y-4">
          {/* Detailed Dropoff Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Dropoff Points Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of where and why users drop off
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.dropoffPoints.map((dropoff, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedDropoff === dropoff 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleDropoffSelect(dropoff)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Badge variant={dropoff.dropoffRate > 0.5 ? 'destructive' : dropoff.dropoffRate > 0.3 ? 'default' : 'secondary'}>
                            {(dropoff.dropoffRate * 100).toFixed(1)}% dropoff
                          </Badge>
                          <h4 className="font-medium">
                            {dropoff.fromStepName} → {dropoff.toStepName}
                          </h4>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Users Lost</p>
                            <p className="font-medium">{dropoff.dropoffCount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Revenue Impact</p>
                            <p className="font-medium text-red-600">
                              ${dropoff.potentialRevenueLoss.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Severity</p>
                            <p className="font-medium">
                              {dropoff.dropoffRate > 0.5 ? 'Critical' : dropoff.dropoffRate > 0.3 ? 'High' : 'Medium'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOptimizationRequest?.(dropoff);
                        }}
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Optimize
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis Panel */}
          {selectedDropoff && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Detailed Analysis: {selectedDropoff.fromStepName} → {selectedDropoff.toStepName}
                </CardTitle>
                <CardDescription>
                  Deep dive into this dropoff point
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : detailedAnalysis ? (
                  <div className="space-y-4">
                    {/* Add detailed analysis content here */}
                    <p>Detailed analysis data would be displayed here</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select a dropoff point to see detailed analysis
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* Actionable Insights */}
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id} className={`border-l-4 ${getSeverityColor(insight.type)}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      {getImpactBadge(insight.impact)}
                    </div>
                    <Badge variant="outline">
                      {insight.effort} effort
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-700">{insight.description}</p>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Recommendation</p>
                    <p className="text-sm text-blue-800">{insight.recommendation}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Potential improvement: +{(insight.potentialImprovement * 100).toFixed(1)}%
                    </span>
                    <div className="flex space-x-2">
                      {insight.dropoffPoint && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOptimizationRequest?.(insight.dropoffPoint!)}
                        >
                          <Target className="h-4 w-4 mr-1" />
                          Create Optimization
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {insights.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No critical insights found</p>
                  <p className="text-sm text-gray-500">Your funnel is performing well!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          {/* User Segments Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Dropoff by User Segments</CardTitle>
              <CardDescription>
                How different user groups perform in the funnel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {segments.length > 0 ? (
                <div className="space-y-4">
                  {segments.map((segment, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{segment.name}</h4>
                        <Badge variant={segment.dropoffRate > 0.5 ? 'destructive' : 'default'}>
                          {(segment.dropoffRate * 100).toFixed(1)}% dropoff
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Criteria</p>
                          <p className="font-medium">{segment.criteria}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Affected Users</p>
                          <p className="font-medium">{segment.userCount.toLocaleString()}</p>
                        </div>
                      </div>
                      {segment.commonReasons.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-1">Common Exit Reasons:</p>
                          <div className="flex flex-wrap gap-1">
                            {segment.commonReasons.map((reason, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p>No segment data available</p>
                  <p className="text-sm">Segment analysis requires more user data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}