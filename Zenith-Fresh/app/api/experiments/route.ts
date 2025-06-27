/**
 * Experiments API Routes
 * CRUD operations for A/B testing experiments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';
import { ExperimentService } from '../../../lib/services/experiment-service';
import { StatisticalService } from '../../../lib/services/statistical-service';
import {
  CreateExperimentRequest,
  UpdateExperimentRequest,
  ExperimentError,
  ConfigurationError
} from '../../../types/ab-testing';
import { ExperimentStatus, ExperimentType } from '@prisma/client';

const experimentService = new ExperimentService(prisma);

/**
 * GET /api/experiments
 * List all experiments for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ExperimentStatus | null;
    const type = searchParams.get('type') as ExperimentType | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      createdBy: session.user.id
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const [experiments, total] = await Promise.all([
      prisma.experiment.findMany({
        where,
        include: {
          variants: {
            select: {
              id: true,
              name: true,
              participants: true,
              conversions: true,
              conversionRate: true,
              isControl: true
            }
          },
          _count: {
            select: {
              allocations: true,
              events: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.experiment.count({ where })
    ]);

    const experimentsWithMetrics = experiments.map(experiment => {
      // Calculate primary metric and winning variant
      const primaryMetricLift = experiment.variants.length >= 2 
        ? calculateLift(experiment.variants)
        : null;

      const winningVariant = experiment.winningVariant || 
        (experiment.status === ExperimentStatus.COMPLETED ? findWinningVariant(experiment.variants) : null);

      const daysRunning = experiment.startDate 
        ? Math.ceil((new Date().getTime() - experiment.startDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const progressPercent = experiment.totalParticipants / Math.max(experiment.minimumSampleSize, 1) * 100;

      return {
        id: experiment.id,
        name: experiment.name,
        status: experiment.status,
        type: experiment.type,
        startDate: experiment.startDate,
        endDate: experiment.endDate,
        totalParticipants: experiment.totalParticipants,
        primaryMetric: experiment.primaryMetric,
        primaryMetricLift: primaryMetricLift,
        winningVariant,
        confidence: experiment.winnerConfidence,
        daysRunning: experiment.status === ExperimentStatus.RUNNING ? daysRunning : null,
        progressPercent: Math.min(progressPercent, 100),
        variants: experiment.variants.length,
        allocations: experiment._count.allocations,
        events: experiment._count.events
      };
    });

    return NextResponse.json({
      experiments: experimentsWithMetrics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching experiments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/experiments
 * Create a new experiment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateExperimentRequest = await request.json();

    // Validate experiment configuration
    validateExperimentConfig(body);

    // Validate traffic split
    validateTrafficSplit(body.trafficSplit, body.variants);

    // Calculate sample size and power
    const sampleSizeAnalysis = StatisticalService.calculateSampleSize(
      0.1, // Baseline rate - should be configurable
      body.minimumDetectableEffect,
      1 - body.confidenceLevel,
      body.statisticalPower
    );

    // Create experiment
    const experiment = await prisma.experiment.create({
      data: {
        name: body.name,
        description: body.description,
        hypothesis: body.hypothesis,
        type: body.type,
        status: ExperimentStatus.DRAFT,
        trafficSplit: body.trafficSplit,
        minimumSampleSize: Math.max(body.minimumSampleSize, sampleSizeAnalysis.minimumSampleSize),
        minimumRuntime: body.minimumRuntime,
        maxRuntime: body.maxRuntime,
        confidenceLevel: body.confidenceLevel,
        minimumDetectableEffect: body.minimumDetectableEffect,
        statisticalPower: body.statisticalPower,
        primaryMetric: body.primaryMetric,
        secondaryMetrics: body.secondaryMetrics,
        targetingRules: body.targetingRules,
        inclusionRules: body.inclusionRules,
        exclusionRules: body.exclusionRules,
        featureFlagKey: body.featureFlagKey,
        featureFlagConfig: body.featureFlagConfig,
        createdBy: session.user.id
      },
      include: {
        variants: true
      }
    });

    // Create variants
    const variants = await Promise.all(
      body.variants.map((variant, index) =>
        prisma.experimentVariant.create({
          data: {
            experimentId: experiment.id,
            name: variant.name,
            description: variant.description,
            isControl: variant.isControl || index === 0,
            configuration: variant.configuration,
            featureFlags: variant.featureFlags,
            trafficWeight: body.trafficSplit[variant.name] || 0
          }
        })
      )
    );

    return NextResponse.json({
      experiment: {
        ...experiment,
        variants
      },
      sampleSizeAnalysis
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating experiment:', error);
    
    if (error instanceof ConfigurationError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create experiment' },
      { status: 500 }
    );
  }
}

// Helper functions

function validateExperimentConfig(config: CreateExperimentRequest): void {
  if (!config.name || config.name.trim().length === 0) {
    throw new ConfigurationError('Experiment name is required');
  }

  if (!config.primaryMetric || config.primaryMetric.trim().length === 0) {
    throw new ConfigurationError('Primary metric is required');
  }

  if (!config.variants || config.variants.length < 2) {
    throw new ConfigurationError('At least 2 variants are required');
  }

  if (config.variants.length > 10) {
    throw new ConfigurationError('Maximum 10 variants allowed');
  }

  if (config.confidenceLevel < 0.8 || config.confidenceLevel > 0.99) {
    throw new ConfigurationError('Confidence level must be between 0.8 and 0.99');
  }

  if (config.minimumDetectableEffect < 0.01 || config.minimumDetectableEffect > 1) {
    throw new ConfigurationError('Minimum detectable effect must be between 0.01 and 1');
  }

  if (config.statisticalPower < 0.7 || config.statisticalPower > 0.99) {
    throw new ConfigurationError('Statistical power must be between 0.7 and 0.99');
  }

  if (config.minimumSampleSize < 100) {
    throw new ConfigurationError('Minimum sample size must be at least 100');
  }

  if (config.minimumRuntime < 7 || config.minimumRuntime > 365) {
    throw new ConfigurationError('Minimum runtime must be between 7 and 365 days');
  }

  if (config.maxRuntime < config.minimumRuntime) {
    throw new ConfigurationError('Maximum runtime must be greater than minimum runtime');
  }

  // Validate variant names are unique
  const variantNames = config.variants.map(v => v.name);
  const uniqueNames = new Set(variantNames);
  if (uniqueNames.size !== variantNames.length) {
    throw new ConfigurationError('Variant names must be unique');
  }

  // Ensure at least one control variant
  const hasControl = config.variants.some(v => v.isControl);
  if (!hasControl && config.variants.length > 0) {
    config.variants[0].isControl = true; // Auto-assign first variant as control
  }
}

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

  // Check no extra allocations
  for (const splitName of splitNames) {
    if (!variantNames.includes(splitName)) {
      throw new ConfigurationError(`Traffic allocation for unknown variant: ${splitName}`);
    }
  }

  // Check allocations are valid percentages
  const allocations = Object.values(trafficSplit);
  for (const allocation of allocations) {
    if (allocation < 0 || allocation > 1) {
      throw new ConfigurationError('Traffic allocations must be between 0 and 1');
    }
  }

  // Check allocations sum to 1 (allow small floating point errors)
  const total = allocations.reduce((sum, allocation) => sum + allocation, 0);
  if (Math.abs(total - 1) > 0.001) {
    throw new ConfigurationError(`Traffic allocations must sum to 1, got ${total}`);
  }
}

function calculateLift(variants: any[]): number | null {
  if (variants.length < 2) return null;

  const control = variants.find(v => v.isControl) || variants[0];
  const treatment = variants.find(v => !v.isControl) || variants[1];

  if (!control || !treatment || control.participants === 0) return null;

  const controlRate = control.conversions / control.participants;
  const treatmentRate = treatment.conversions / treatment.participants;

  if (controlRate === 0) return treatmentRate > 0 ? Infinity : 0;

  return ((treatmentRate - controlRate) / controlRate) * 100;
}

function findWinningVariant(variants: any[]): string | null {
  if (variants.length < 2) return null;

  const variantData = variants.map(v => ({
    name: v.name,
    conversions: v.conversions,
    participants: v.participants
  }));

  const result = StatisticalService.detectWinner(variantData, 0.95, 100);
  return result.hasWinner ? result.winner! : null;
}