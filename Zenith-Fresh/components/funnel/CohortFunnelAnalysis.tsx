'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users,
  TrendingUp,
  Filter,
  Plus,
  BarChart3,
  Eye,
  Target,
  Clock,
  DollarSign,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { 
  FunnelWithSteps,
  FunnelMetrics,
  CohortDefinition,
  CohortPerformance
} from '../../types/funnel';

interface CohortFunnelAnalysisProps {
  funnelId: string;
  funnel: FunnelWithSteps;
  metrics: FunnelMetrics;
  dateRange: [Date, Date];
  className?: string;
}

interface CohortSegment {
  id: string;
  name: string;
  description: string;
  criteria: any;
  userCount: number;
  conversionRate: number;
  averageRevenuePerUser: number;
  averageTimeToConvert: number;
  significance?: number;
  isStatisticallySignificant: boolean;
  performance: 'above_average' | 'average' | 'below_average';
}

interface CohortComparison {
  cohortA: CohortSegment;
  cohortB: CohortSegment;
  conversionLift: number;
  revenueLift: number;
  timeDifference: number;
  significance: number;
  recommendation: string;
}

export default function CohortFunnelAnalysis({
  funnelId,
  funnel,
  metrics,
  dateRange,
  className = ''
}: CohortFunnelAnalysisProps) {
  const [cohorts, setCohorts] = useState<CohortSegment[]>([]);
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortCriteria, setNewCohortCriteria] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Predefined cohort definitions
  const predefinedCohorts = [
    {
      name: 'New Users',
      description: 'Users who signed up in the last 30 days',
      criteria: { userAge: 'new', days: 30 }
    },
    {
      name: 'Returning Users',
      description: 'Users with previous sessions',
      criteria: { userType: 'returning' }
    },
    {
      name: 'Mobile Users',
      description: 'Users accessing from mobile devices',
      criteria: { deviceType: 'mobile' }
    },
    {
      name: 'Desktop Users',
      description: 'Users accessing from desktop devices',
      criteria: { deviceType: 'desktop' }
    },
    {
      name: 'Organic Traffic',
      description: 'Users from organic search',
      criteria: { trafficSource: 'organic' }
    },
    {
      name: 'Paid Traffic',
      description: 'Users from paid campaigns',
      criteria: { trafficSource: 'paid' }
    },
    {
      name: 'High-Value Users',
      description: 'Users with previous purchases > $100',
      criteria: { previousPurchaseValue: { min: 100 } }
    },
    {
      name: 'Fast Converters',
      description: 'Users who convert within 1 hour',
      criteria: { conversionTime: { max: 3600 } }
    }
  ];

  useEffect(() => {
    loadCohortAnalysis();
  }, [funnelId, dateRange]);

  const loadCohortAnalysis = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/funnels/${funnelId}/cohort-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange,
          cohorts: predefinedCohorts
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCohorts(data.cohorts || []);
      }
    } catch (error) {
      console.error('Failed to load cohort analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createCustomCohort = async () => {
    if (!newCohortName || !newCohortCriteria) return;

    try {
      const response = await fetch(`/api/funnels/${funnelId}/cohorts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCohortName,
          criteria: JSON.parse(newCohortCriteria),
          dateRange
        })
      });

      if (response.ok) {
        await loadCohortAnalysis();
        setNewCohortName('');
        setNewCohortCriteria('');
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Failed to create custom cohort:', error);
    }
  };

  // Calculate cohort comparisons
  const cohortComparisons = useMemo(() => {
    const comparisons: CohortComparison[] = [];
    
    for (let i = 0; i < cohorts.length; i++) {
      for (let j = i + 1; j < cohorts.length; j++) {
        const cohortA = cohorts[i];
        const cohortB = cohorts[j];
        
        const conversionLift = ((cohortA.conversionRate - cohortB.conversionRate) / cohortB.conversionRate) * 100;
        const revenueLift = ((cohortA.averageRevenuePerUser - cohortB.averageRevenuePerUser) / cohortB.averageRevenuePerUser) * 100;
        const timeDifference = cohortA.averageTimeToConvert - cohortB.averageTimeToConvert;
        
        // Simple significance calculation (would be more sophisticated in production)
        const significance = Math.min(
          Math.abs(conversionLift) / 10, // Normalize to 0-10 scale
          Math.abs(revenueLift) / 20,
          Math.abs(timeDifference) / 1800 // 30 minutes
        );

        let recommendation = '';
        if (Math.abs(conversionLift) > 20) {
          recommendation = `${cohortA.name} converts ${Math.abs(conversionLift).toFixed(1)}% ${conversionLift > 0 ? 'better' : 'worse'} than ${cohortB.name}`;
        } else if (Math.abs(revenueLift) > 30) {
          recommendation = `${cohortA.name} generates ${Math.abs(revenueLift).toFixed(1)}% ${revenueLift > 0 ? 'more' : 'less'} revenue than ${cohortB.name}`;
        } else {
          recommendation = 'No significant performance difference detected';
        }

        comparisons.push({
          cohortA,
          cohortB,
          conversionLift,
          revenueLift,
          timeDifference,
          significance,
          recommendation
        });
      }
    }

    return comparisons.sort((a, b) => Math.abs(b.conversionLift) - Math.abs(a.conversionLift));
  }, [cohorts]);

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'above_average':
        return <Badge className="bg-green-100 text-green-800">Above Average</Badge>;
      case 'below_average':
        return <Badge className="bg-red-100 text-red-800">Below Average</Badge>;
      default:
        return <Badge variant="secondary">Average</Badge>;
    }
  };

  const getSignificanceBadge = (isSignificant: boolean) => {
    return isSignificant ? (
      <Badge className="bg-blue-100 text-blue-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Significant
      </Badge>
    ) : (
      <Badge variant="outline">
        <AlertCircle className="h-3 w-3 mr-1" />
        Not Significant
      </Badge>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cohort Analysis</h2>
          <p className="text-gray-600">
            Compare funnel performance across different user segments
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Cohort
        </Button>
      </div>

      {/* Create Custom Cohort Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Custom Cohort</CardTitle>
            <CardDescription>
              Define your own user segment for analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cohort-name">Cohort Name</Label>
              <Input
                id="cohort-name"
                value={newCohortName}
                onChange={(e) => setNewCohortName(e.target.value)}
                placeholder="e.g., Premium Users"
              />
            </div>
            <div>
              <Label htmlFor="cohort-criteria">Criteria (JSON)</Label>
              <Input
                id="cohort-criteria"
                value={newCohortCriteria}
                onChange={(e) => setNewCohortCriteria(e.target.value)}
                placeholder='{"userTier": "premium", "signupDate": {"after": "2024-01-01"}}'
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={createCustomCohort}>Create Cohort</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="segments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="segments">Cohort Segments</TabsTrigger>
          <TabsTrigger value="comparisons">Comparisons</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="segments" className="space-y-4">
          {/* Cohort Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Cohorts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cohorts.length}</div>
                <p className="text-xs text-gray-500">analyzed segments</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Best Performing</CardTitle>
              </CardHeader>
              <CardContent>
                {cohorts.length > 0 ? (
                  <>
                    <div className="text-lg font-bold text-green-600">
                      {cohorts.reduce((best, cohort) => 
                        cohort.conversionRate > best.conversionRate ? cohort : best
                      ).name}
                    </div>
                    <p className="text-xs text-gray-500">
                      {(cohorts.reduce((best, cohort) => 
                        cohort.conversionRate > best.conversionRate ? cohort : best
                      ).conversionRate * 100).toFixed(1)}% conversion
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-gray-500">No data</div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Significant Differences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cohorts.filter(c => c.isStatisticallySignificant).length}
                </div>
                <p className="text-xs text-gray-500">statistically significant</p>
              </CardContent>
            </Card>
          </div>

          {/* Cohort Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Cohort Performance</CardTitle>
              <CardDescription>
                Detailed performance metrics for each user segment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : cohorts.length > 0 ? (
                <div className="space-y-4">
                  {cohorts.map((cohort) => (
                    <div key={cohort.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{cohort.name}</h4>
                          <p className="text-sm text-gray-600">{cohort.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPerformanceBadge(cohort.performance)}
                          {getSignificanceBadge(cohort.isStatisticallySignificant)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-gray-600">Users</p>
                            <p className="font-semibold">{cohort.userCount.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-gray-600">Conversion Rate</p>
                            <p className="font-semibold text-green-600">
                              {(cohort.conversionRate * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-gray-600">Revenue/User</p>
                            <p className="font-semibold">${cohort.averageRevenuePerUser.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-gray-600">Time to Convert</p>
                            <p className="font-semibold">
                              {Math.round(cohort.averageTimeToConvert / 60)}m
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p>No cohort data available</p>
                  <p className="text-sm">Create custom cohorts or wait for more user data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparisons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Comparisons</CardTitle>
              <CardDescription>
                Side-by-side performance analysis between different segments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cohortComparisons.length > 0 ? (
                <div className="space-y-6">
                  {cohortComparisons.slice(0, 10).map((comparison, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">
                          {comparison.cohortA.name} vs {comparison.cohortB.name}
                        </h4>
                        <Badge variant={comparison.significance > 0.5 ? 'default' : 'secondary'}>
                          {comparison.significance > 0.5 ? 'Significant' : 'Not Significant'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <p className="text-sm text-gray-600">Conversion Difference</p>
                          <p className={`text-lg font-bold ${
                            comparison.conversionLift > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {comparison.conversionLift > 0 ? '+' : ''}{comparison.conversionLift.toFixed(1)}%
                          </p>
                        </div>
                        
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <p className="text-sm text-gray-600">Revenue Difference</p>
                          <p className={`text-lg font-bold ${
                            comparison.revenueLift > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {comparison.revenueLift > 0 ? '+' : ''}{comparison.revenueLift.toFixed(1)}%
                          </p>
                        </div>
                        
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <p className="text-sm text-gray-600">Time Difference</p>
                          <p className={`text-lg font-bold ${
                            comparison.timeDifference < 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {comparison.timeDifference > 0 ? '+' : ''}{Math.round(comparison.timeDifference / 60)}m
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm font-medium text-blue-900">Recommendation</p>
                        <p className="text-sm text-blue-800">{comparison.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                  <p>No comparison data available</p>
                  <p className="text-sm">Need at least 2 cohorts to generate comparisons</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Insights & Recommendations</CardTitle>
              <CardDescription>
                AI-powered insights from your cohort analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Top Performing Cohort */}
                {cohorts.length > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-900">Top Performer</h4>
                    </div>
                    <p className="text-green-800">
                      {cohorts.reduce((best, cohort) => 
                        cohort.conversionRate > best.conversionRate ? cohort : best
                      ).name} is your highest converting segment with{' '}
                      {(cohorts.reduce((best, cohort) => 
                        cohort.conversionRate > best.conversionRate ? cohort : best
                      ).conversionRate * 100).toFixed(1)}% conversion rate. 
                      Consider expanding acquisition efforts for similar users.
                    </p>
                  </div>
                )}

                {/* Optimization Opportunity */}
                {cohortComparisons.length > 0 && cohortComparisons[0].conversionLift > 20 && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="h-5 w-5 text-orange-600" />
                      <h4 className="font-semibold text-orange-900">Optimization Opportunity</h4>
                    </div>
                    <p className="text-orange-800">
                      {cohortComparisons[0].recommendation}. This represents a significant 
                      opportunity to improve overall funnel performance by optimizing 
                      the experience for underperforming segments.
                    </p>
                  </div>
                )}

                {/* Statistical Significance Alert */}
                {cohorts.filter(c => c.isStatisticallySignificant).length < cohorts.length / 2 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <h4 className="font-semibold text-yellow-900">Sample Size Notice</h4>
                    </div>
                    <p className="text-yellow-800">
                      Some cohorts may not have sufficient sample sizes for statistical significance. 
                      Consider collecting more data or combining smaller segments for more reliable insights.
                    </p>
                  </div>
                )}

                {/* General Recommendations */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Action Items</h4>
                  </div>
                  <ul className="text-blue-800 space-y-1 list-disc list-inside">
                    <li>Focus acquisition efforts on high-performing cohorts</li>
                    <li>A/B test optimizations specifically for underperforming segments</li>
                    <li>Analyze behavioral patterns unique to top-converting cohorts</li>
                    <li>Create personalized experiences based on cohort characteristics</li>
                    <li>Monitor cohort performance changes over time</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}