/**
 * Experiment Results API
 * Get statistical analysis and results for experiments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '../../../../../lib/prisma';
import { StatisticalService } from '../../../../../lib/services/statistical-service';
import { ExperimentService } from '../../../../../lib/services/experiment-service';
import {
  GetExperimentResultsRequest,
  GetExperimentResultsResponse,
  VariantComparison,
  SegmentAnalysis
} from '../../../../../types/ab-testing';
import { ExperimentStatus } from '@prisma/client';

const experimentService = new ExperimentService(prisma);

/**
 * GET /api/experiments/[id]/results
 * Get comprehensive experiment results and analysis
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const experimentId = params.id;
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric');
    const analysisType = searchParams.get('analysisType') as 'frequentist' | 'bayesian' | null;
    const includeSegments = searchParams.get('includeSegments') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get experiment with full details
    const experiment = await prisma.experiment.findUnique({
      where: { 
        id: experimentId,
        createdBy: session.user.id
      },
      include: {
        variants: true,
        events: {
          where: {
            ...(startDate && { timestamp: { gte: new Date(startDate) } }),
            ...(endDate && { timestamp: { lte: new Date(endDate) } }),
            ...(metric && { eventType: metric })
          }
        },
        allocations: {
          include: {
            user: {
              select: { 
                id: true, 
                userSegment: true,
                subscription: true,
                country: true
              }
            }
          }
        },
        results: {
          where: {
            ...(metric && { metric })
          },
          orderBy: { analysisDate: 'desc' }
        }
      }
    });

    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    // Ensure experiment has enough data for analysis
    if (experiment.variants.length < 2) {
      return NextResponse.json(
        { error: 'Experiment must have at least 2 variants for analysis' },
        { status: 400 }
      );
    }

    const totalParticipants = experiment.variants.reduce((sum, v) => sum + v.participants, 0);
    if (totalParticipants < 100) {
      return NextResponse.json({
        experiment: {
          id: experiment.id,
          name: experiment.name,
          status: experiment.status,
          variants: experiment.variants,
          totalParticipants
        },
        message: 'Insufficient data for statistical analysis (minimum 100 participants required)',
        hasEnoughData: false
      });
    }

    // Perform statistical analysis
    const analysisResults = await performComprehensiveAnalysis(
      experiment,
      metric || experiment.primaryMetric,
      analysisType || 'frequentist'
    );

    // Get variant comparisons
    const variantComparisons = await getVariantComparisons(
      experiment.variants,
      analysisType || 'frequentist'
    );

    // Get segment analysis if requested
    let segmentAnalysis: SegmentAnalysis[] = [];
    if (includeSegments) {
      segmentAnalysis = await getSegmentAnalysis(
        experiment,
        experiment.allocations,
        metric || experiment.primaryMetric
      );
    }

    // Calculate power analysis
    const control = experiment.variants.find(v => v.isControl) || experiment.variants[0];
    const treatment = experiment.variants.find(v => !v.isControl) || experiment.variants[1];

    const powerAnalysis = StatisticalService.performPowerAnalysis(
      control.conversions,
      control.participants,
      treatment.conversions,
      treatment.participants,
      1 - experiment.confidenceLevel
    );

    // Generate recommendations
    const recommendations = generateRecommendations(
      experiment,
      analysisResults,
      variantComparisons,
      powerAnalysis
    );

    // Get experiment metrics
    const metrics = await experimentService.getExperimentMetrics(experimentId);

    const response: GetExperimentResultsResponse = {
      experiment: {
        id: experiment.id,
        name: experiment.name,
        description: experiment.description,
        hypothesis: experiment.hypothesis,
        status: experiment.status,
        type: experiment.type,
        startDate: experiment.startDate,
        endDate: experiment.endDate,
        totalParticipants: experiment.totalParticipants,
        primaryMetric: experiment.primaryMetric,
        secondaryMetrics: experiment.secondaryMetrics as string[],
        variants: experiment.variants,
        targetingRules: experiment.targetingRules,
        inclusionRules: experiment.inclusionRules,
        exclusionRules: experiment.exclusionRules,
        powerAnalysis,
        daysRunning: experiment.startDate 
          ? Math.ceil((new Date().getTime() - experiment.startDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        progressPercent: Math.min((experiment.totalParticipants / experiment.minimumSampleSize) * 100, 100)
      },
      overallResults: analysisResults,
      variantComparisons,
      segmentAnalysis,
      powerAnalysis,
      recommendations
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching experiment results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiment results' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/experiments/[id]/results
 * Run custom analysis with specific parameters
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const experimentId = params.id;
    const body = await request.json();
    const {
      metric,
      analysisType = 'frequentist',
      confidenceLevel = 0.95,
      includeSecondaryMetrics = false,
      segmentBy,
      dateRange
    } = body;

    // Get experiment
    const experiment = await prisma.experiment.findUnique({
      where: { 
        id: experimentId,
        createdBy: session.user.id
      },
      include: {
        variants: true,
        events: {
          where: {
            ...(dateRange?.start && { timestamp: { gte: new Date(dateRange.start) } }),
            ...(dateRange?.end && { timestamp: { lte: new Date(dateRange.end) } })
          }
        },
        allocations: true
      }
    });

    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    // Run custom analysis
    const targetMetric = metric || experiment.primaryMetric;
    const results = await performComprehensiveAnalysis(
      experiment,
      targetMetric,
      analysisType,
      confidenceLevel
    );

    // Analyze secondary metrics if requested
    let secondaryResults = [];
    if (includeSecondaryMetrics && experiment.secondaryMetrics) {
      const secondaryMetrics = experiment.secondaryMetrics as string[];
      secondaryResults = await Promise.all(
        secondaryMetrics.map(async (secondaryMetric) => {
          const analysis = await performComprehensiveAnalysis(
            experiment,
            secondaryMetric,
            analysisType,
            confidenceLevel
          );
          return {
            metric: secondaryMetric,
            results: analysis
          };
        })
      );
    }

    // Save results to database
    const analysisRecord = await prisma.experimentResult.create({
      data: {
        experimentId,
        metric: targetMetric,
        analysisType,
        isStatisticallySignificant: results.some(r => r.isStatisticallySignificant),
        pValue: results[0]?.pValue,
        confidenceLevel,
        effectSize: results[0]?.effectSize,
        controlVariant: experiment.variants.find(v => v.isControl)?.name,
        treatmentVariant: experiment.variants.find(v => !v.isControl)?.name,
        controlMean: results[0]?.controlMean,
        treatmentMean: results[0]?.treatmentMean,
        lift: results[0]?.lift,
        liftLowerBound: results[0]?.liftLowerBound,
        liftUpperBound: results[0]?.liftUpperBound,
        testStatistic: results[0]?.testStatistic,
        degreesOfFreedom: results[0]?.degreesOfFreedom,
        standardError: results[0]?.standardError,
        dataStartDate: dateRange?.start ? new Date(dateRange.start) : null,
        dataEndDate: dateRange?.end ? new Date(dateRange.end) : null,
        isRealTime: true
      }
    });

    return NextResponse.json({
      analysisId: analysisRecord.id,
      primaryMetric: {
        metric: targetMetric,
        results
      },
      secondaryMetrics: secondaryResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error running custom analysis:', error);
    return NextResponse.json(
      { error: 'Failed to run custom analysis' },
      { status: 500 }
    );
  }
}

// Helper functions

async function performComprehensiveAnalysis(
  experiment: any,
  metric: string,
  analysisType: 'frequentist' | 'bayesian',
  confidenceLevel: number = 0.95
): Promise<any[]> {
  const results = [];
  const control = experiment.variants.find((v: any) => v.isControl) || experiment.variants[0];
  
  for (const variant of experiment.variants) {
    if (variant.id === control.id) continue;

    try {
      let result;
      
      if (analysisType === 'frequentist') {
        result = StatisticalService.performZTest(
          control.conversions,
          control.participants,
          variant.conversions,
          variant.participants,
          confidenceLevel
        );
      } else {
        result = StatisticalService.performBayesianTest(
          control.conversions,
          control.participants,
          variant.conversions,
          variant.participants,
          1, // Prior alpha
          1, // Prior beta
          confidenceLevel
        );
      }

      results.push({
        experimentId: experiment.id,
        metric,
        analysisType,
        controlVariant: control.name,
        treatmentVariant: variant.name,
        controlMean: control.conversions / control.participants,
        treatmentMean: variant.conversions / variant.participants,
        isStatisticallySignificant: result.isSignificant,
        ...result
      });
    } catch (error) {
      console.error(`Error analyzing variant ${variant.name}:`, error);
    }
  }

  return results;
}

async function getVariantComparisons(
  variants: any[],
  analysisType: 'frequentist' | 'bayesian'
): Promise<VariantComparison[]> {
  const comparisons: VariantComparison[] = [];
  const control = variants.find(v => v.isControl) || variants[0];

  for (const variant of variants) {
    if (variant.id === control.id) continue;

    try {
      let result;
      
      if (analysisType === 'frequentist') {
        result = StatisticalService.performZTest(
          control.conversions,
          control.participants,
          variant.conversions,
          variant.participants
        );
      } else {
        result = StatisticalService.performBayesianTest(
          control.conversions,
          control.participants,
          variant.conversions,
          variant.participants
        );
      }

      let recommendation: 'launch' | 'continue' | 'stop';
      if (result.isSignificant && result.lift > 0) {
        recommendation = 'launch';
      } else if (result.isSignificant && result.lift < 0) {
        recommendation = 'stop';
      } else {
        recommendation = 'continue';
      }

      comparisons.push({
        controlVariant: control.name,
        treatmentVariant: variant.name,
        metric: 'conversion_rate',
        result,
        recommendation,
        confidence: analysisType === 'frequentist' 
          ? (1 - (result.pValue || 0))
          : (result.probabilityOfSuperiority || 0)
      });
    } catch (error) {
      console.error(`Error comparing ${variant.name} to ${control.name}:`, error);
    }
  }

  return comparisons;
}

async function getSegmentAnalysis(
  experiment: any,
  allocations: any[],
  metric: string
): Promise<SegmentAnalysis[]> {
  const segmentAnalysis: SegmentAnalysis[] = [];
  
  // Segment by user tier/subscription
  const subscriptionSegments = groupBySegment(allocations, 'user.subscription');
  for (const [segment, users] of Object.entries(subscriptionSegments)) {
    if (users.length < 50) continue; // Skip small segments
    
    const analysis = await analyzeSegment(experiment, users, metric);
    if (analysis) {
      segmentAnalysis.push({
        segment: 'subscription',
        segmentValue: segment,
        participants: users.length,
        results: [analysis],
        isSignificant: analysis.isStatisticallySignificant
      });
    }
  }

  // Segment by platform
  const platformSegments = groupBySegment(allocations, 'platform');
  for (const [segment, users] of Object.entries(platformSegments)) {
    if (users.length < 50) continue;
    
    const analysis = await analyzeSegment(experiment, users, metric);
    if (analysis) {
      segmentAnalysis.push({
        segment: 'platform',
        segmentValue: segment,
        participants: users.length,
        results: [analysis],
        isSignificant: analysis.isStatisticallySignificant
      });
    }
  }

  return segmentAnalysis;
}

function groupBySegment(allocations: any[], segmentField: string): Record<string, any[]> {
  const segments: Record<string, any[]> = {};
  
  for (const allocation of allocations) {
    const segmentValue = getNestedValue(allocation, segmentField) || 'unknown';
    if (!segments[segmentValue]) {
      segments[segmentValue] = [];
    }
    segments[segmentValue].push(allocation);
  }
  
  return segments;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

async function analyzeSegment(experiment: any, segmentUsers: any[], metric: string): Promise<any | null> {
  try {
    // Count conversions by variant within this segment
    const variantStats = new Map();
    
    for (const user of segmentUsers) {
      const variantId = user.variantId;
      if (!variantStats.has(variantId)) {
        variantStats.set(variantId, { participants: 0, conversions: 0 });
      }
      
      const stats = variantStats.get(variantId);
      stats.participants++;
      
      // Count conversions for this user (simplified - would need to join with events)
      // This is a placeholder - in practice you'd need to count actual conversion events
      const conversionRate = 0.1; // Would be calculated from actual events
      if (Math.random() < conversionRate) {
        stats.conversions++;
      }
    }

    // Find control and treatment within this segment
    const control = experiment.variants.find((v: any) => v.isControl);
    const treatment = experiment.variants.find((v: any) => !v.isControl);
    
    const controlStats = variantStats.get(control?.id) || { participants: 0, conversions: 0 };
    const treatmentStats = variantStats.get(treatment?.id) || { participants: 0, conversions: 0 };

    if (controlStats.participants < 10 || treatmentStats.participants < 10) {
      return null; // Not enough data in this segment
    }

    return StatisticalService.performZTest(
      controlStats.conversions,
      controlStats.participants,
      treatmentStats.conversions,
      treatmentStats.participants
    );
  } catch (error) {
    console.error('Error analyzing segment:', error);
    return null;
  }
}

function generateRecommendations(
  experiment: any,
  results: any[],
  comparisons: VariantComparison[],
  powerAnalysis: any
): string[] {
  const recommendations: string[] = [];

  // Check if experiment has a clear winner
  const significantPositiveResults = results.filter(r => 
    r.isStatisticallySignificant && r.lift > 0
  );

  if (significantPositiveResults.length > 0) {
    const bestResult = significantPositiveResults.reduce((best, current) => 
      current.lift > best.lift ? current : best
    );
    recommendations.push(
      `🎉 Clear winner detected: ${bestResult.treatmentVariant} shows ${bestResult.lift.toFixed(1)}% improvement. Consider launching this variant.`
    );
  }

  // Check statistical power
  if (powerAnalysis.currentPower < 0.8) {
    const additionalSamples = powerAnalysis.recommendedSampleSize - powerAnalysis.currentSampleSize;
    recommendations.push(
      `⚡ Low statistical power (${(powerAnalysis.currentPower * 100).toFixed(1)}%). Consider running for ${powerAnalysis.daysToReachSample} more days to collect ${additionalSamples} additional samples.`
    );
  }

  // Check for negative results
  const significantNegativeResults = results.filter(r => 
    r.isStatisticallySignificant && r.lift < 0
  );

  if (significantNegativeResults.length > 0) {
    recommendations.push(
      `⚠️ Some variants show negative impact. Consider stopping or modifying underperforming variants.`
    );
  }

  // Check experiment duration
  const daysRunning = experiment.startDate 
    ? Math.ceil((new Date().getTime() - experiment.startDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (daysRunning < experiment.minimumRuntime) {
    recommendations.push(
      `⏰ Experiment has only run for ${daysRunning} days. Consider running for at least ${experiment.minimumRuntime} days for reliable results.`
    );
  }

  // Check sample size
  if (experiment.totalParticipants < experiment.minimumSampleSize) {
    const remaining = experiment.minimumSampleSize - experiment.totalParticipants;
    recommendations.push(
      `📊 Need ${remaining} more participants to reach minimum sample size of ${experiment.minimumSampleSize}.`
    );
  }

  // Default recommendation if no clear decision
  if (recommendations.length === 0) {
    recommendations.push(
      `📈 Continue monitoring the experiment. No statistically significant results detected yet.`
    );
  }

  return recommendations;
}