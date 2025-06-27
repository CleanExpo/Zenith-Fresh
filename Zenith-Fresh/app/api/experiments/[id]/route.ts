/**
 * Individual Experiment API Routes
 * Get, update, and delete specific experiments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';
import { ExperimentService } from '../../../../lib/services/experiment-service';
import { StatisticalService } from '../../../../lib/services/statistical-service';
import {
  UpdateExperimentRequest,
  ExperimentError,
  ConfigurationError
} from '../../../../types/ab-testing';
import { ExperimentStatus } from '@prisma/client';

const experimentService = new ExperimentService(prisma);

/**
 * GET /api/experiments/[id]
 * Get experiment details with full analysis
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

    // Get experiment with all related data
    const experiment = await prisma.experiment.findUnique({
      where: { 
        id: experimentId,
        createdBy: session.user.id
      },
      include: {
        variants: {
          orderBy: { isControl: 'desc' }
        },
        allocations: {
          include: {
            user: {
              select: { id: true, email: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 100 // Limit for performance
        },
        events: {
          orderBy: { timestamp: 'desc' },
          take: 100 // Limit for performance
        },
        results: {
          orderBy: { analysisDate: 'desc' }
        },
        analyses: {
          orderBy: { analysisNumber: 'desc' }
        },
        contaminations: {
          include: {
            user: {
              select: { id: true, email: true, name: true }
            }
          }
        }
      }
    });

    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    // Calculate current statistics if experiment is running
    let statisticalResults = null;
    let powerAnalysis = null;
    let winnerAnalysis = null;

    if (experiment.status === ExperimentStatus.RUNNING && experiment.variants.length >= 2) {
      try {
        // Perform statistical analysis
        const control = experiment.variants.find(v => v.isControl) || experiment.variants[0];
        const treatment = experiment.variants.find(v => !v.isControl) || experiment.variants[1];

        if (control.participants >= 100 && treatment.participants >= 100) {
          statisticalResults = StatisticalService.performZTest(
            control.conversions,
            control.participants,
            treatment.conversions,
            treatment.participants,
            experiment.confidenceLevel
          );

          powerAnalysis = StatisticalService.performPowerAnalysis(
            control.conversions,
            control.participants,
            treatment.conversions,
            treatment.participants,
            1 - experiment.confidenceLevel
          );

          // Check for winner
          const variantData = experiment.variants.map(v => ({
            name: v.name,
            conversions: v.conversions,
            participants: v.participants
          }));

          winnerAnalysis = StatisticalService.detectWinner(
            variantData,
            experiment.confidenceLevel,
            experiment.minimumSampleSize
          );
        }
      } catch (error) {
        console.error('Error calculating statistics:', error);
        // Continue without statistical results
      }
    }

    // Get experiment metrics
    const metrics = await experimentService.getExperimentMetrics(experimentId);

    // Calculate progress
    const progressPercent = (experiment.totalParticipants / experiment.minimumSampleSize) * 100;
    const daysRunning = experiment.startDate 
      ? Math.ceil((new Date().getTime() - experiment.startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const response = {
      experiment: {
        ...experiment,
        progressPercent: Math.min(progressPercent, 100),
        daysRunning: experiment.status === ExperimentStatus.RUNNING ? daysRunning : null,
        isEligibleForAnalysis: experiment.variants.every(v => v.participants >= 100)
      },
      metrics,
      analysis: {
        statistical: statisticalResults,
        power: powerAnalysis,
        winner: winnerAnalysis
      },
      summary: {
        totalParticipants: experiment.totalParticipants,
        totalEvents: metrics.totalEvents,
        variantCount: experiment.variants.length,
        isSignificant: statisticalResults?.isSignificant || false,
        primaryMetricLift: calculatePrimaryMetricLift(experiment.variants),
        conversionRates: experiment.variants.map(v => ({
          variantName: v.name,
          conversionRate: v.conversionRate,
          participants: v.participants,
          conversions: v.conversions
        }))
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching experiment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiment' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/experiments/[id]
 * Update experiment configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const experimentId = params.id;
    const body: UpdateExperimentRequest = await request.json();

    // Check if experiment exists and user owns it
    const existingExperiment = await prisma.experiment.findUnique({
      where: { 
        id: experimentId,
        createdBy: session.user.id
      },
      include: { variants: true }
    });

    if (!existingExperiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    // Check if experiment can be modified
    if (existingExperiment.status === ExperimentStatus.RUNNING) {
      // Only allow certain fields to be updated while running
      const allowedFields = ['description', 'endDate', 'maxRuntime'];
      const updatingRestrictedFields = Object.keys(body).some(
        key => !allowedFields.includes(key)
      );

      if (updatingRestrictedFields) {
        throw new ConfigurationError(
          'Cannot modify experiment configuration while running. Only description, endDate, and maxRuntime can be updated.'
        );
      }
    }

    if (existingExperiment.status === ExperimentStatus.COMPLETED) {
      throw new ConfigurationError('Cannot modify completed experiments');
    }

    // Validate updates
    if (body.trafficSplit && body.variants) {
      validateTrafficSplit(body.trafficSplit, body.variants);
    }

    // Update experiment
    const updateData: any = {};
    
    // Only include provided fields
    const allowedUpdateFields = [
      'name', 'description', 'hypothesis', 'primaryMetric', 'secondaryMetrics',
      'trafficSplit', 'minimumSampleSize', 'minimumRuntime', 'maxRuntime',
      'confidenceLevel', 'minimumDetectableEffect', 'statisticalPower',
      'targetingRules', 'inclusionRules', 'exclusionRules',
      'featureFlagKey', 'featureFlagConfig', 'endDate'
    ];

    for (const field of allowedUpdateFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const experiment = await prisma.experiment.update({
      where: { id: experimentId },
      data: updateData,
      include: { variants: true }
    });

    // Update variants if provided
    if (body.variants && existingExperiment.status !== ExperimentStatus.RUNNING) {
      // Delete existing variants
      await prisma.experimentVariant.deleteMany({
        where: { experimentId }
      });

      // Create new variants
      await Promise.all(
        body.variants.map(variant =>
          prisma.experimentVariant.create({
            data: {
              experimentId,
              name: variant.name,
              description: variant.description,
              isControl: variant.isControl,
              configuration: variant.configuration,
              featureFlags: variant.featureFlags,
              trafficWeight: body.trafficSplit?.[variant.name] || 0
            }
          })
        )
      );
    }

    // Get updated experiment with variants
    const updatedExperiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: { variants: true }
    });

    return NextResponse.json({ experiment: updatedExperiment });

  } catch (error) {
    console.error('Error updating experiment:', error);
    
    if (error instanceof ConfigurationError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update experiment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/experiments/[id]
 * Delete experiment (only if not running)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const experimentId = params.id;

    // Check if experiment exists and user owns it
    const experiment = await prisma.experiment.findUnique({
      where: { 
        id: experimentId,
        createdBy: session.user.id
      }
    });

    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    // Check if experiment can be deleted
    if (experiment.status === ExperimentStatus.RUNNING) {
      return NextResponse.json(
        { error: 'Cannot delete running experiment. Stop the experiment first.' },
        { status: 400 }
      );
    }

    // Archive instead of hard delete to preserve data integrity
    await prisma.experiment.update({
      where: { id: experimentId },
      data: { 
        status: ExperimentStatus.ARCHIVED,
        archivedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting experiment:', error);
    return NextResponse.json(
      { error: 'Failed to delete experiment' },
      { status: 500 }
    );
  }
}

// Helper functions

function validateTrafficSplit(
  trafficSplit: Record<string, number>,
  variants: Array<{ name: string }>
): void {
  const variantNames = variants.map(v => v.name);
  const splitNames = Object.keys(trafficSplit);

  // Check all variants have traffic allocation
  for (const variantName of variantNames) {
    if (!(variantName in trafficSplit)) {
      throw new ConfigurationError(`Missing traffic allocation for variant: ${variantName}`);
    }
  }

  // Check allocations are valid percentages
  const allocations = Object.values(trafficSplit);
  for (const allocation of allocations) {
    if (allocation < 0 || allocation > 1) {
      throw new ConfigurationError('Traffic allocations must be between 0 and 1');
    }
  }

  // Check allocations sum to 1
  const total = allocations.reduce((sum, allocation) => sum + allocation, 0);
  if (Math.abs(total - 1) > 0.001) {
    throw new ConfigurationError(`Traffic allocations must sum to 1, got ${total}`);
  }
}

function calculatePrimaryMetricLift(variants: any[]): number | null {
  if (variants.length < 2) return null;

  const control = variants.find(v => v.isControl) || variants[0];
  const treatment = variants.find(v => !v.isControl) || variants[1];

  if (!control || !treatment || control.participants === 0) return null;

  const controlRate = control.conversions / control.participants;
  const treatmentRate = treatment.conversions / treatment.participants;

  if (controlRate === 0) return treatmentRate > 0 ? Infinity : 0;

  return ((treatmentRate - controlRate) / controlRate) * 100;
}