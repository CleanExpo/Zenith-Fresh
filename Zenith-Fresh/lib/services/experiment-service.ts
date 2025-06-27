/**
 * Experiment Service
 * Core service for managing A/B test experiments, user allocation, and bucketing
 */

import { PrismaClient, ExperimentStatus, ExperimentType } from '@prisma/client';
import crypto from 'crypto';
import {
  ExperimentConfig,
  ExperimentVariant,
  ExperimentAllocation,
  ExperimentEvent,
  UserContext,
  AllocateUserResponse,
  TrackEventRequest,
  AllocationError,
  ConfigurationError,
  ExperimentError,
  TargetingRules,
  InclusionRules,
  ExclusionRules,
  HoldoutGroup
} from '../../types/ab-testing';

export class ExperimentService {
  private prisma: PrismaClient;
  private hashSalt: string;

  constructor(prisma: PrismaClient, hashSalt: string = process.env.AB_TEST_HASH_SALT || 'zenith-ab-test-salt') {
    this.prisma = prisma;
    this.hashSalt = hashSalt;
  }

  /**
   * Get user allocation for an experiment
   * Returns existing allocation or creates new one if eligible
   */
  async allocateUser(
    experimentId: string,
    userContext: UserContext,
    forceVariant?: string
  ): Promise<AllocateUserResponse> {
    // Get experiment details
    const experiment = await this.prisma.experiment.findUnique({
      where: { id: experimentId },
      include: { variants: true, contaminations: true }
    });

    if (!experiment) {
      throw new AllocationError('Experiment not found', { experimentId });
    }

    if (experiment.status !== ExperimentStatus.RUNNING) {
      throw new AllocationError('Experiment is not running', { 
        experimentId, 
        status: experiment.status 
      });
    }

    // Check if user is already allocated
    const allocationKey = this.generateAllocationKey(userContext);
    const existingAllocation = await this.prisma.experimentAllocation.findUnique({
      where: {
        experimentId_allocationKey: {
          experimentId,
          allocationKey
        }
      },
      include: { variant: true }
    });

    if (existingAllocation) {
      // Update exposure tracking
      await this.prisma.experimentAllocation.update({
        where: { id: existingAllocation.id },
        data: {
          lastExposure: new Date(),
          exposureCount: { increment: 1 }
        }
      });

      return {
        variantName: existingAllocation.variant.name,
        variantId: existingAllocation.variantId,
        allocationId: existingAllocation.id,
        configuration: existingAllocation.variant.configuration as Record<string, any> || {},
        featureFlags: existingAllocation.variant.featureFlags as Record<string, any> || {},
        isNewAllocation: false
      };
    }

    // Check eligibility
    const isEligible = await this.checkUserEligibility(experiment, userContext);
    if (!isEligible.eligible) {
      throw new AllocationError('User not eligible for experiment', {
        experimentId,
        reason: isEligible.reason,
        userContext
      });
    }

    // Check holdout groups
    const isInHoldout = await this.checkHoldoutGroups(userContext);
    if (isInHoldout) {
      throw new AllocationError('User is in holdout group', {
        experimentId,
        userContext
      });
    }

    // Allocate to variant
    const bucketValue = this.generateBucketValue(allocationKey);
    const selectedVariant = forceVariant 
      ? experiment.variants.find(v => v.name === forceVariant)
      : this.selectVariant(experiment.variants, bucketValue, experiment.trafficSplit as Record<string, number>);

    if (!selectedVariant) {
      throw new AllocationError('No variant could be selected', {
        experimentId,
        bucketValue,
        trafficSplit: experiment.trafficSplit,
        forceVariant
      });
    }

    // Create allocation record
    const allocation = await this.prisma.experimentAllocation.create({
      data: {
        experimentId,
        variantId: selectedVariant.id,
        userId: userContext.userId,
        sessionId: userContext.sessionId,
        bucketValue,
        allocationKey,
        userAgent: userContext.userAgent,
        ipAddress: userContext.ipAddress,
        country: userContext.country,
        platform: userContext.platform,
        userSegment: userContext.userSegment,
        metadata: userContext.customProperties
      }
    });

    // Update experiment and variant counters
    await Promise.all([
      this.prisma.experiment.update({
        where: { id: experimentId },
        data: { totalParticipants: { increment: 1 } }
      }),
      this.prisma.experimentVariant.update({
        where: { id: selectedVariant.id },
        data: { 
          participants: { increment: 1 },
          uniqueUsers: { increment: 1 }
        }
      })
    ]);

    return {
      variantName: selectedVariant.name,
      variantId: selectedVariant.id,
      allocationId: allocation.id,
      configuration: selectedVariant.configuration as Record<string, any> || {},
      featureFlags: selectedVariant.featureFlags as Record<string, any> || {},
      isNewAllocation: true
    };
  }

  /**
   * Track an event for an experiment
   */
  async trackEvent(request: TrackEventRequest): Promise<void> {
    const { experimentId, allocationId, eventType, eventValue, eventData, userContext } = request;

    // Verify experiment exists and is running
    const experiment = await this.prisma.experiment.findUnique({
      where: { id: experimentId }
    });

    if (!experiment) {
      throw new ExperimentError('Experiment not found', 'EXPERIMENT_NOT_FOUND', { experimentId });
    }

    let allocation: any = null;
    let variantId: string;

    // Get allocation if provided
    if (allocationId) {
      allocation = await this.prisma.experimentAllocation.findUnique({
        where: { id: allocationId },
        include: { variant: true }
      });

      if (!allocation || allocation.experimentId !== experimentId) {
        throw new ExperimentError('Invalid allocation for experiment', 'INVALID_ALLOCATION', {
          allocationId,
          experimentId
        });
      }

      variantId = allocation.variantId;
    } else if (userContext) {
      // Try to find allocation by user context
      const allocationKey = this.generateAllocationKey(userContext);
      allocation = await this.prisma.experimentAllocation.findUnique({
        where: {
          experimentId_allocationKey: {
            experimentId,
            allocationKey
          }
        }
      });

      if (!allocation) {
        throw new ExperimentError('No allocation found for user', 'NO_ALLOCATION', {
          experimentId,
          userContext
        });
      }

      variantId = allocation.variantId;
    } else {
      throw new ExperimentError('Either allocationId or userContext must be provided', 'MISSING_CONTEXT');
    }

    // Create event record
    await this.prisma.experimentEvent.create({
      data: {
        experimentId,
        variantId,
        allocationId: allocation?.id,
        eventType,
        eventValue,
        eventData,
        userId: userContext?.userId || allocation?.userId,
        sessionId: userContext?.sessionId || allocation?.sessionId,
        page: userContext?.customProperties?.page,
        userAgent: userContext?.userAgent || allocation?.userAgent,
        ipAddress: userContext?.ipAddress || allocation?.ipAddress
      }
    });

    // Update variant metrics for conversion events
    if (eventType === 'conversion' || experiment.primaryMetric === eventType) {
      await this.prisma.experimentVariant.update({
        where: { id: variantId },
        data: {
          conversions: { increment: 1 },
          totalEvents: { increment: 1 }
        }
      });

      // Recalculate conversion rate
      const variant = await this.prisma.experimentVariant.findUnique({
        where: { id: variantId }
      });

      if (variant && variant.participants > 0) {
        const conversionRate = variant.conversions / variant.participants;
        await this.prisma.experimentVariant.update({
          where: { id: variantId },
          data: { conversionRate }
        });
      }
    } else {
      // Just increment total events for other event types
      await this.prisma.experimentVariant.update({
        where: { id: variantId },
        data: { totalEvents: { increment: 1 } }
      });
    }
  }

  /**
   * Check if user is eligible for an experiment
   */
  private async checkUserEligibility(
    experiment: any,
    userContext: UserContext
  ): Promise<{ eligible: boolean; reason?: string }> {
    // Check targeting rules
    if (experiment.targetingRules) {
      const targeting = experiment.targetingRules as TargetingRules;
      
      if (targeting.userSegments && userContext.userSegment) {
        if (!targeting.userSegments.includes(userContext.userSegment)) {
          return { eligible: false, reason: 'User segment not targeted' };
        }
      }

      if (targeting.countries && userContext.country) {
        if (!targeting.countries.includes(userContext.country)) {
          return { eligible: false, reason: 'Country not targeted' };
        }
      }

      if (targeting.platforms && userContext.platform) {
        if (!targeting.platforms.includes(userContext.platform)) {
          return { eligible: false, reason: 'Platform not targeted' };
        }
      }

      // Check custom rules
      if (targeting.customRules) {
        for (const rule of targeting.customRules) {
          if (!this.evaluateCustomRule(rule, userContext)) {
            return { eligible: false, reason: `Custom rule failed: ${rule.field}` };
          }
        }
      }
    }

    // Check inclusion rules
    if (experiment.inclusionRules) {
      const inclusion = experiment.inclusionRules as InclusionRules;

      if (inclusion.minAccountAge && userContext.accountAge !== undefined) {
        if (userContext.accountAge < inclusion.minAccountAge) {
          return { eligible: false, reason: 'Account too new' };
        }
      }

      if (inclusion.hasCompletedOnboarding !== undefined && userContext.hasCompletedOnboarding !== undefined) {
        if (inclusion.hasCompletedOnboarding && !userContext.hasCompletedOnboarding) {
          return { eligible: false, reason: 'Onboarding not completed' };
        }
      }
    }

    // Check exclusion rules
    if (experiment.exclusionRules) {
      const exclusion = experiment.exclusionRules as ExclusionRules;

      if (exclusion.blacklistedUserIds && userContext.userId) {
        if (exclusion.blacklistedUserIds.includes(userContext.userId)) {
          return { eligible: false, reason: 'User is blacklisted' };
        }
      }

      if (exclusion.isEmployee && userContext.customProperties?.isEmployee) {
        return { eligible: false, reason: 'Employee excluded' };
      }

      if (exclusion.isTestUser && userContext.customProperties?.isTestUser) {
        return { eligible: false, reason: 'Test user excluded' };
      }

      // Check if user has opted out of experiments
      if (exclusion.hasOptedOut && userContext.customProperties?.hasOptedOut) {
        return { eligible: false, reason: 'User opted out' };
      }

      // Check if user is in another experiment (if specified)
      if (exclusion.isInOtherExperiment && userContext.userId) {
        const otherAllocations = await this.prisma.experimentAllocation.count({
          where: {
            userId: userContext.userId,
            experiment: {
              status: ExperimentStatus.RUNNING,
              NOT: { id: experiment.id }
            }
          }
        });

        if (otherAllocations > 0) {
          return { eligible: false, reason: 'User in other experiment' };
        }
      }
    }

    return { eligible: true };
  }

  /**
   * Check if user is in any holdout groups
   */
  private async checkHoldoutGroups(userContext: UserContext): Promise<boolean> {
    if (!userContext.userId && !userContext.sessionId) {
      return false;
    }

    const allocationKey = this.generateAllocationKey(userContext);

    const holdoutMembership = await this.prisma.holdoutMembership.findFirst({
      where: {
        allocationKey,
        isActive: true,
        holdoutGroup: { isActive: true }
      }
    });

    return !!holdoutMembership;
  }

  /**
   * Select variant based on traffic split and bucket value
   */
  private selectVariant(
    variants: any[],
    bucketValue: number,
    trafficSplit: Record<string, number>
  ): any | null {
    let cumulativeWeight = 0;

    for (const variant of variants) {
      const weight = trafficSplit[variant.name] || 0;
      cumulativeWeight += weight;

      if (bucketValue <= cumulativeWeight) {
        return variant;
      }
    }

    return null;
  }

  /**
   * Generate consistent allocation key for user
   */
  private generateAllocationKey(userContext: UserContext): string {
    const identifier = userContext.userId || userContext.sessionId || 'anonymous';
    return crypto
      .createHash('sha256')
      .update(`${identifier}:${this.hashSalt}`)
      .digest('hex');
  }

  /**
   * Generate bucket value (0.0 to 1.0) for allocation
   */
  private generateBucketValue(allocationKey: string): number {
    const hash = crypto
      .createHash('md5')
      .update(allocationKey)
      .digest('hex');
    
    // Take first 8 characters and convert to number between 0 and 1
    const hexValue = parseInt(hash.substring(0, 8), 16);
    return hexValue / 0xffffffff;
  }

  /**
   * Evaluate custom targeting rule
   */
  private evaluateCustomRule(rule: any, userContext: UserContext): boolean {
    const value = userContext.customProperties?.[rule.field];
    
    if (value === undefined) {
      return false;
    }

    switch (rule.operator) {
      case 'equals':
        return value === rule.value;
      case 'not_equals':
        return value !== rule.value;
      case 'greater_than':
        return Number(value) > Number(rule.value);
      case 'less_than':
        return Number(value) < Number(rule.value);
      case 'contains':
        return String(value).includes(String(rule.value));
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(value);
      case 'not_in':
        return Array.isArray(rule.value) && !rule.value.includes(value);
      default:
        return false;
    }
  }

  /**
   * Get experiment by ID with all details
   */
  async getExperiment(experimentId: string): Promise<any> {
    return this.prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        variants: true,
        allocations: {
          include: { user: true }
        },
        events: true,
        results: true,
        analyses: true,
        contaminations: true
      }
    });
  }

  /**
   * Get user's current experiment allocations
   */
  async getUserAllocations(userContext: UserContext): Promise<ExperimentAllocation[]> {
    const allocationKey = this.generateAllocationKey(userContext);

    const allocations = await this.prisma.experimentAllocation.findMany({
      where: {
        allocationKey,
        experiment: { status: ExperimentStatus.RUNNING }
      },
      include: {
        experiment: true,
        variant: true
      }
    });

    return allocations;
  }

  /**
   * Force user into specific variant (for testing)
   */
  async forceUserToVariant(
    experimentId: string,
    userContext: UserContext,
    variantName: string
  ): Promise<AllocateUserResponse> {
    return this.allocateUser(experimentId, userContext, variantName);
  }

  /**
   * Remove user from experiment
   */
  async removeUserFromExperiment(
    experimentId: string,
    userContext: UserContext
  ): Promise<void> {
    const allocationKey = this.generateAllocationKey(userContext);

    await this.prisma.experimentAllocation.deleteMany({
      where: {
        experimentId,
        allocationKey
      }
    });
  }

  /**
   * Check for experiment contamination
   */
  async detectContamination(experimentId: string): Promise<any[]> {
    const contaminations = await this.prisma.experimentContamination.findMany({
      where: { experimentId },
      include: { user: true }
    });

    return contaminations;
  }

  /**
   * Report contamination incident
   */
  async reportContamination(
    experimentId: string,
    contaminationType: string,
    affectedUserId?: string,
    sourceVariant?: string,
    targetVariant?: string,
    description?: string
  ): Promise<void> {
    await this.prisma.experimentContamination.create({
      data: {
        experimentId,
        contaminationType,
        affectedUserId,
        sourceVariant,
        targetVariant,
        contaminationDate: new Date(),
        severity: 'medium',
        detectionMethod: 'manual',
        description
      }
    });
  }

  /**
   * Get experiment performance metrics
   */
  async getExperimentMetrics(experimentId: string): Promise<any> {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        variants: true,
        events: true,
        allocations: true
      }
    });

    if (!experiment) {
      throw new ExperimentError('Experiment not found', 'EXPERIMENT_NOT_FOUND', { experimentId });
    }

    const metrics = {
      totalParticipants: experiment.totalParticipants,
      totalEvents: experiment.events.length,
      variantMetrics: experiment.variants.map(variant => ({
        variantId: variant.id,
        name: variant.name,
        participants: variant.participants,
        conversions: variant.conversions,
        conversionRate: variant.conversionRate,
        totalEvents: variant.totalEvents,
        uniqueUsers: variant.uniqueUsers
      })),
      eventTypes: this.aggregateEventTypes(experiment.events),
      dailyParticipants: this.aggregateDailyParticipants(experiment.allocations),
      dailyEvents: this.aggregateDailyEvents(experiment.events)
    };

    return metrics;
  }

  private aggregateEventTypes(events: any[]): Record<string, number> {
    const eventCounts: Record<string, number> = {};
    
    for (const event of events) {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    }

    return eventCounts;
  }

  private aggregateDailyParticipants(allocations: any[]): Record<string, number> {
    const dailyCounts: Record<string, number> = {};
    
    for (const allocation of allocations) {
      const date = allocation.createdAt.toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    }

    return dailyCounts;
  }

  private aggregateDailyEvents(events: any[]): Record<string, number> {
    const dailyCounts: Record<string, number> = {};
    
    for (const event of events) {
      const date = event.timestamp.toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    }

    return dailyCounts;
  }
}

export default ExperimentService;