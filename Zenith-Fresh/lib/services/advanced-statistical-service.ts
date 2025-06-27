/**
 * Advanced Statistical Service
 * Multi-variate testing, Bayesian analysis, and holdout group management
 */

import { PrismaClient } from '@prisma/client';
import {
  BayesianResult,
  BanditResult,
  BanditArm,
  SequentialAnalysis,
  HoldoutGroup,
  ContaminationCheck,
  StatisticalError
} from '../../types/ab-testing';

export class AdvancedStatisticalService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Multi-armed bandit analysis with Thompson Sampling
   */
  async performThompsonSampling(
    experimentId: string,
    priorAlpha: number = 1,
    priorBeta: number = 1
  ): Promise<BanditResult> {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id: experimentId },
      include: { variants: true }
    });

    if (!experiment) {
      throw new StatisticalError('Experiment not found');
    }

    const arms: BanditArm[] = experiment.variants.map(variant => {
      // Posterior parameters for Beta distribution
      const alpha = priorAlpha + variant.conversions;
      const beta = priorBeta + (variant.participants - variant.conversions);
      
      // Sample from Beta distribution (Thompson Sampling)
      const sampledValue = this.betaRandom(alpha, beta);
      
      return {
        variantId: variant.id,
        name: variant.name,
        pulls: variant.participants,
        rewards: variant.conversions,
        averageReward: variant.participants > 0 ? variant.conversions / variant.participants : 0,
        confidenceBound: sampledValue,
        regret: 0 // Will be calculated below
      };
    });

    // Calculate regret for each arm
    const optimalReward = Math.max(...arms.map(arm => arm.averageReward));
    arms.forEach(arm => {
      arm.regret = arm.pulls * (optimalReward - arm.averageReward);
    });

    const totalRegret = arms.reduce((sum, arm) => sum + arm.regret, 0);
    const bestArm = arms.reduce((best, current) => 
      current.confidenceBound > best.confidenceBound ? current : best
    );

    return {
      algorithm: 'thompson_sampling',
      totalRegret,
      bestArm: bestArm.variantId,
      arms
    };
  }

  /**
   * Upper Confidence Bound (UCB1) analysis
   */
  async performUCB1Analysis(
    experimentId: string,
    explorationParam: number = Math.sqrt(2)
  ): Promise<BanditResult> {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id: experimentId },
      include: { variants: true }
    });

    if (!experiment) {
      throw new StatisticalError('Experiment not found');
    }

    const totalPulls = experiment.variants.reduce((sum, v) => sum + v.participants, 0);

    const arms: BanditArm[] = experiment.variants.map(variant => {
      const averageReward = variant.participants > 0 ? variant.conversions / variant.participants : 0;
      
      // UCB1 formula: average + c * sqrt(ln(t) / n)
      const confidenceBound = variant.participants > 0
        ? averageReward + explorationParam * Math.sqrt(Math.log(totalPulls) / variant.participants)
        : Infinity; // Unplayed arms get highest priority

      return {
        variantId: variant.id,
        name: variant.name,
        pulls: variant.participants,
        rewards: variant.conversions,
        averageReward,
        confidenceBound,
        regret: 0
      };
    });

    // Calculate regret
    const optimalReward = Math.max(...arms.map(arm => arm.averageReward));
    arms.forEach(arm => {
      arm.regret = arm.pulls * (optimalReward - arm.averageReward);
    });

    const totalRegret = arms.reduce((sum, arm) => sum + arm.regret, 0);
    const bestArm = arms.reduce((best, current) => 
      current.confidenceBound > best.confidenceBound ? current : best
    );

    return {
      algorithm: 'ucb',
      totalRegret,
      bestArm: bestArm.variantId,
      arms
    };
  }

  /**
   * Advanced Bayesian A/B testing with custom priors
   */
  async performAdvancedBayesianTest(
    experimentId: string,
    metric: string,
    priorParams: {
      controlAlpha: number;
      controlBeta: number;
      treatmentAlpha: number;
      treatmentBeta: number;
    },
    credibilityLevel: number = 0.95
  ): Promise<BayesianResult[]> {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id: experimentId },
      include: { variants: true }
    });

    if (!experiment) {
      throw new StatisticalError('Experiment not found');
    }

    const results: BayesianResult[] = [];
    const control = experiment.variants.find(v => v.isControl) || experiment.variants[0];

    for (const variant of experiment.variants) {
      if (variant.id === control.id) continue;

      // Posterior parameters
      const controlPosteriorAlpha = priorParams.controlAlpha + control.conversions;
      const controlPosteriorBeta = priorParams.controlBeta + (control.participants - control.conversions);
      const treatmentPosteriorAlpha = priorParams.treatmentAlpha + variant.conversions;
      const treatmentPosteriorBeta = priorParams.treatmentBeta + (variant.participants - variant.conversions);

      // Monte Carlo simulation for probability of superiority
      const samples = 10000;
      let superiorityCount = 0;
      let expectedLossSum = 0;

      for (let i = 0; i < samples; i++) {
        const controlSample = this.betaRandom(controlPosteriorAlpha, controlPosteriorBeta);
        const treatmentSample = this.betaRandom(treatmentPosteriorAlpha, treatmentPosteriorBeta);
        
        if (treatmentSample > controlSample) {
          superiorityCount++;
        }
        
        expectedLossSum += Math.max(0, controlSample - treatmentSample);
      }

      const probabilityOfSuperiority = superiorityCount / samples;
      const expectedLoss = expectedLossSum / samples;
      
      // Posterior statistics
      const treatmentMean = treatmentPosteriorAlpha / (treatmentPosteriorAlpha + treatmentPosteriorBeta);
      const treatmentVariance = (treatmentPosteriorAlpha * treatmentPosteriorBeta) / 
        ((treatmentPosteriorAlpha + treatmentPosteriorBeta) ** 2 * (treatmentPosteriorAlpha + treatmentPosteriorBeta + 1));

      // Credible interval (using normal approximation for large samples)
      const treatmentStd = Math.sqrt(treatmentVariance);
      const zScore = this.getZCriticalValue((1 - credibilityLevel) / 2);
      const credibleInterval: [number, number] = [
        treatmentMean - zScore * treatmentStd,
        treatmentMean + zScore * treatmentStd
      ];

      results.push({
        posterior: {
          alpha: treatmentPosteriorAlpha,
          beta: treatmentPosteriorBeta,
          mean: treatmentMean,
          variance: treatmentVariance
        },
        credibleInterval,
        probabilityOfSuperiority,
        expectedLoss,
        isSignificant: probabilityOfSuperiority > 0.95 || probabilityOfSuperiority < 0.05
      });
    }

    return results;
  }

  /**
   * Hierarchical Bayesian model for multi-variate testing
   */
  async performHierarchicalBayesianTest(
    experimentId: string,
    hierarchyLevels: string[] = ['user_segment', 'country', 'platform']
  ): Promise<Record<string, BayesianResult[]>> {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        variants: true,
        allocations: {
          include: {
            user: {
              select: { subscription: true, country: true }
            }
          }
        },
        events: true
      }
    });

    if (!experiment) {
      throw new StatisticalError('Experiment not found');
    }

    const hierarchicalResults: Record<string, BayesianResult[]> = {};

    for (const level of hierarchyLevels) {
      const segmentResults: BayesianResult[] = [];
      
      // Group allocations by hierarchy level
      const segments = this.groupAllocationsByLevel(experiment.allocations, level);
      
      for (const [segmentValue, allocations] of Object.entries(segments)) {
        if (allocations.length < 50) continue; // Skip small segments
        
        // Calculate conversion rates for this segment
        const variantStats = this.calculateSegmentStats(allocations, experiment.events);
        
        if (variantStats.size >= 2) {
          const control = Array.from(variantStats.values()).find(s => s.isControl);
          const treatment = Array.from(variantStats.values()).find(s => !s.isControl);
          
          if (control && treatment) {
            const result = await this.performSegmentBayesianTest(control, treatment);
            segmentResults.push(result);
          }
        }
      }
      
      hierarchicalResults[level] = segmentResults;
    }

    return hierarchicalResults;
  }

  /**
   * Holdout group management
   */
  async createHoldoutGroup(
    name: string,
    description: string,
    holdoutPercent: number,
    isGlobal: boolean = false,
    userSegments?: string[],
    exclusionRules?: any
  ): Promise<HoldoutGroup> {
    const holdoutGroup = await this.prisma.holdoutGroup.create({
      data: {
        name,
        description,
        holdoutPercent,
        isGlobalHoldout: isGlobal,
        userSegments,
        exclusionRules
      }
    });

    return holdoutGroup;
  }

  /**
   * Assign users to holdout groups
   */
  async assignToHoldoutGroup(
    holdoutGroupId: string,
    userIds: string[],
    sessionIds: string[] = []
  ): Promise<void> {
    const memberships = [];
    
    for (const userId of userIds) {
      const allocationKey = this.generateAllocationKey(userId);
      const bucketValue = this.generateBucketValue(allocationKey);
      
      memberships.push({
        holdoutGroupId,
        userId,
        allocationKey,
        bucketValue
      });
    }
    
    for (const sessionId of sessionIds) {
      const allocationKey = this.generateAllocationKey(sessionId);
      const bucketValue = this.generateBucketValue(allocationKey);
      
      memberships.push({
        holdoutGroupId,
        sessionId,
        allocationKey,
        bucketValue
      });
    }

    await this.prisma.holdoutMembership.createMany({
      data: memberships
    });
  }

  /**
   * Check for contamination across experiments
   */
  async detectCrossExperimentContamination(
    experimentIds: string[],
    timeWindow: number = 7 // days
  ): Promise<ContaminationCheck[]> {
    const startDate = new Date(Date.now() - timeWindow * 24 * 60 * 60 * 1000);
    
    const contaminations: ContaminationCheck[] = [];
    
    // Get all allocations for the experiments in the time window
    const allocations = await this.prisma.experimentAllocation.findMany({
      where: {
        experimentId: { in: experimentIds },
        createdAt: { gte: startDate }
      },
      include: {
        experiment: { select: { name: true } },
        variant: { select: { name: true } }
      }
    });

    // Group by user/session to find cross-experiment exposure
    const userExperiments = new Map<string, Set<string>>();
    
    for (const allocation of allocations) {
      const key = allocation.userId || allocation.sessionId || allocation.allocationKey;
      if (!userExperiments.has(key)) {
        userExperiments.set(key, new Set());
      }
      userExperiments.get(key)!.add(allocation.experimentId);
    }

    // Detect contamination
    for (const [userKey, experiments] of userExperiments) {
      if (experiments.size > 1) {
        const experimentArray = Array.from(experiments);
        
        for (let i = 0; i < experimentArray.length; i++) {
          for (let j = i + 1; j < experimentArray.length; j++) {
            contaminations.push({
              experimentId: experimentArray[i],
              contaminationType: 'cross_variant_exposure',
              severity: 'medium',
              affectedUsers: 1,
              impactOnResults: 0.1, // Simplified impact calculation
              detectionMethod: 'automated',
              recommendation: `User ${userKey} is exposed to multiple experiments: ${experimentArray.join(', ')}`
            });
          }
        }
      }
    }

    return contaminations;
  }

  /**
   * Sequential probability ratio test (SPRT)
   */
  async performSequentialTest(
    experimentId: string,
    type1Error: number = 0.05,
    type2Error: number = 0.2,
    minimumEffect: number = 0.05
  ): Promise<SequentialAnalysis> {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id: experimentId },
      include: { variants: true }
    });

    if (!experiment) {
      throw new StatisticalError('Experiment not found');
    }

    const control = experiment.variants.find(v => v.isControl) || experiment.variants[0];
    const treatment = experiment.variants.find(v => !v.isControl) || experiment.variants[1];

    if (!control || !treatment) {
      throw new StatisticalError('Need at least 2 variants for sequential testing');
    }

    const controlRate = control.participants > 0 ? control.conversions / control.participants : 0;
    const treatmentRate = treatment.participants > 0 ? treatment.conversions / treatment.participants : 0;

    // SPRT boundaries
    const A = type2Error / (1 - type1Error);
    const B = (1 - type2Error) / type1Error;
    
    // Log likelihood ratio
    const logLR = this.calculateLogLikelihoodRatio(
      control.conversions, control.participants,
      treatment.conversions, treatment.participants,
      controlRate, controlRate + minimumEffect
    );

    let decision: 'continue' | 'stop_for_success' | 'stop_for_futility';
    let shouldStop = false;

    if (logLR >= Math.log(B)) {
      decision = 'stop_for_success';
      shouldStop = true;
    } else if (logLR <= Math.log(A)) {
      decision = 'stop_for_futility';
      shouldStop = true;
    } else {
      decision = 'continue';
    }

    return {
      analysisNumber: 1, // This would be incremented in a real implementation
      informationFraction: Math.min(experiment.totalParticipants / experiment.minimumSampleSize, 1),
      spentAlpha: type1Error,
      remainingAlpha: 0,
      efficacyBoundary: Math.log(B),
      futilityBoundary: Math.log(A),
      shouldStop,
      recommendation: decision
    };
  }

  // Helper methods

  private betaRandom(alpha: number, beta: number): number {
    // Box-Muller + rejection sampling for Beta distribution
    if (alpha < 1 && beta < 1) {
      while (true) {
        const x = Math.pow(Math.random(), 1 / alpha);
        const y = Math.pow(Math.random(), 1 / beta);
        if (x + y <= 1) {
          return x / (x + y);
        }
      }
    }
    
    // For other cases, use gamma ratio method
    const x = this.gammaRandom(alpha);
    const y = this.gammaRandom(beta);
    return x / (x + y);
  }

  private gammaRandom(shape: number): number {
    // Marsaglia and Tsang's algorithm for gamma distribution
    if (shape < 1) {
      return this.gammaRandom(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }
    
    const d = shape - 1/3;
    const c = 1 / Math.sqrt(9 * d);
    
    while (true) {
      let x, v;
      do {
        x = this.normalRandom();
        v = 1 + c * x;
      } while (v <= 0);
      
      v = v * v * v;
      const u = Math.random();
      
      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v;
      }
      
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v;
      }
    }
  }

  private normalRandom(): number {
    // Box-Muller transformation
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private getZCriticalValue(alpha: number): number {
    // Approximate critical values for common alpha levels
    const criticalValues: Record<number, number> = {
      0.001: 3.291,
      0.005: 2.576,
      0.01: 2.326,
      0.025: 1.96,
      0.05: 1.645,
      0.1: 1.282
    };

    return criticalValues[alpha] || 1.96;
  }

  private groupAllocationsByLevel(allocations: any[], level: string): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    for (const allocation of allocations) {
      let groupKey = 'unknown';
      
      switch (level) {
        case 'user_segment':
          groupKey = allocation.userSegment || 'unknown';
          break;
        case 'country':
          groupKey = allocation.country || allocation.user?.country || 'unknown';
          break;
        case 'platform':
          groupKey = allocation.platform || 'unknown';
          break;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(allocation);
    }
    
    return groups;
  }

  private calculateSegmentStats(allocations: any[], events: any[]): Map<string, any> {
    const stats = new Map();
    
    for (const allocation of allocations) {
      const variantId = allocation.variantId;
      if (!stats.has(variantId)) {
        stats.set(variantId, {
          variantId,
          participants: 0,
          conversions: 0,
          isControl: allocation.variant?.isControl || false
        });
      }
      
      const stat = stats.get(variantId);
      stat.participants++;
      
      // Count conversions (simplified - would need proper event matching)
      const userEvents = events.filter(e => 
        e.userId === allocation.userId || e.sessionId === allocation.sessionId
      );
      const hasConversion = userEvents.some(e => e.eventType === 'conversion');
      if (hasConversion) {
        stat.conversions++;
      }
    }
    
    return stats;
  }

  private async performSegmentBayesianTest(control: any, treatment: any): Promise<BayesianResult> {
    const controlAlpha = 1 + control.conversions;
    const controlBeta = 1 + (control.participants - control.conversions);
    const treatmentAlpha = 1 + treatment.conversions;
    const treatmentBeta = 1 + (treatment.participants - treatment.conversions);

    // Monte Carlo simulation
    const samples = 10000;
    let superiorityCount = 0;
    let expectedLossSum = 0;

    for (let i = 0; i < samples; i++) {
      const controlSample = this.betaRandom(controlAlpha, controlBeta);
      const treatmentSample = this.betaRandom(treatmentAlpha, treatmentBeta);
      
      if (treatmentSample > controlSample) {
        superiorityCount++;
      }
      
      expectedLossSum += Math.max(0, controlSample - treatmentSample);
    }

    const treatmentMean = treatmentAlpha / (treatmentAlpha + treatmentBeta);
    const treatmentVariance = (treatmentAlpha * treatmentBeta) / 
      ((treatmentAlpha + treatmentBeta) ** 2 * (treatmentAlpha + treatmentBeta + 1));

    return {
      posterior: {
        alpha: treatmentAlpha,
        beta: treatmentBeta,
        mean: treatmentMean,
        variance: treatmentVariance
      },
      credibleInterval: [treatmentMean - 1.96 * Math.sqrt(treatmentVariance), treatmentMean + 1.96 * Math.sqrt(treatmentVariance)],
      probabilityOfSuperiority: superiorityCount / samples,
      expectedLoss: expectedLossSum / samples,
      isSignificant: (superiorityCount / samples) > 0.95 || (superiorityCount / samples) < 0.05
    };
  }

  private generateAllocationKey(identifier: string): string {
    return require('crypto').createHash('sha256').update(identifier).digest('hex');
  }

  private generateBucketValue(allocationKey: string): number {
    const hash = require('crypto').createHash('md5').update(allocationKey).digest('hex');
    const hexValue = parseInt(hash.substring(0, 8), 16);
    return hexValue / 0xffffffff;
  }

  private calculateLogLikelihoodRatio(
    x1: number, n1: number,
    x2: number, n2: number,
    p0: number, p1: number
  ): number {
    const likelihood0 = this.binomialLikelihood(x1, n1, p0) * this.binomialLikelihood(x2, n2, p0);
    const likelihood1 = this.binomialLikelihood(x1, n1, p1) * this.binomialLikelihood(x2, n2, p1);
    
    return Math.log(likelihood1 / likelihood0);
  }

  private binomialLikelihood(x: number, n: number, p: number): number {
    if (p === 0) return x === 0 ? 1 : 0;
    if (p === 1) return x === n ? 1 : 0;
    return Math.pow(p, x) * Math.pow(1 - p, n - x);
  }
}

export default AdvancedStatisticalService;