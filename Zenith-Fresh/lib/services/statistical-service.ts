/**
 * Statistical Analysis Service
 * Advanced statistical calculations for A/B testing with frequentist and Bayesian methods
 */

import {
  FrequentistResult,
  BayesianResult,
  StatisticalTest,
  PowerAnalysis,
  SampleSizeCalculation,
  SequentialAnalysis,
  BanditResult,
  BanditArm,
  StatisticalError,
  ExperimentResult
} from '../../types/ab-testing';

export class StatisticalService {
  private static readonly NORMAL_DISTRIBUTION_TABLE = [
    0.5000, 0.5040, 0.5080, 0.5120, 0.5160, 0.5199, 0.5239, 0.5279, 0.5319, 0.5359,
    0.5398, 0.5438, 0.5478, 0.5517, 0.5557, 0.5596, 0.5636, 0.5675, 0.5714, 0.5753,
    0.5793, 0.5832, 0.5871, 0.5910, 0.5948, 0.5987, 0.6026, 0.6064, 0.6103, 0.6141,
    0.6179, 0.6217, 0.6255, 0.6293, 0.6331, 0.6368, 0.6406, 0.6443, 0.6480, 0.6517,
    0.6554, 0.6591, 0.6628, 0.6664, 0.6700, 0.6736, 0.6772, 0.6808, 0.6844, 0.6879,
    0.6915, 0.6950, 0.6985, 0.7019, 0.7054, 0.7088, 0.7123, 0.7157, 0.7190, 0.7224,
    0.7257, 0.7291, 0.7324, 0.7357, 0.7389, 0.7422, 0.7454, 0.7486, 0.7517, 0.7549,
    0.7580, 0.7611, 0.7642, 0.7673, 0.7704, 0.7734, 0.7764, 0.7794, 0.7823, 0.7852,
    0.7881, 0.7910, 0.7939, 0.7967, 0.7995, 0.8023, 0.8051, 0.8078, 0.8106, 0.8133,
    0.8159, 0.8186, 0.8212, 0.8238, 0.8264, 0.8289, 0.8315, 0.8340, 0.8365, 0.8389,
    0.8413, 0.8438, 0.8461, 0.8485, 0.8508, 0.8531, 0.8554, 0.8577, 0.8599, 0.8621,
    0.8643, 0.8665, 0.8686, 0.8708, 0.8729, 0.8749, 0.8770, 0.8790, 0.8810, 0.8830,
    0.8849, 0.8869, 0.8888, 0.8907, 0.8925, 0.8944, 0.8962, 0.8980, 0.8997, 0.9015,
    0.9032, 0.9049, 0.9066, 0.9082, 0.9099, 0.9115, 0.9131, 0.9147, 0.9162, 0.9177,
    0.9192, 0.9207, 0.9222, 0.9236, 0.9251, 0.9265, 0.9279, 0.9292, 0.9306, 0.9319,
    0.9332, 0.9345, 0.9357, 0.9370, 0.9382, 0.9394, 0.9406, 0.9418, 0.9429, 0.9441,
    0.9452, 0.9463, 0.9474, 0.9484, 0.9495, 0.9505, 0.9515, 0.9525, 0.9535, 0.9545,
    0.9554, 0.9564, 0.9573, 0.9582, 0.9591, 0.9599, 0.9608, 0.9616, 0.9625, 0.9633,
    0.9641, 0.9649, 0.9656, 0.9664, 0.9671, 0.9678, 0.9686, 0.9693, 0.9699, 0.9706,
    0.9713, 0.9719, 0.9726, 0.9732, 0.9738, 0.9744, 0.9750, 0.9756, 0.9761, 0.9767,
    0.9772, 0.9778, 0.9783, 0.9788, 0.9793, 0.9798, 0.9803, 0.9808, 0.9812, 0.9817,
    0.9821, 0.9826, 0.9830, 0.9834, 0.9838, 0.9842, 0.9846, 0.9850, 0.9854, 0.9857,
    0.9861, 0.9864, 0.9868, 0.9871, 0.9875, 0.9878, 0.9881, 0.9884, 0.9887, 0.9890,
    0.9893, 0.9896, 0.9898, 0.9901, 0.9904, 0.9906, 0.9909, 0.9911, 0.9913, 0.9916,
    0.9918, 0.9920, 0.9922, 0.9925, 0.9927, 0.9929, 0.9931, 0.9932, 0.9934, 0.9936,
    0.9938, 0.9940, 0.9941, 0.9943, 0.9945, 0.9946, 0.9948, 0.9949, 0.9951, 0.9952,
    0.9953, 0.9955, 0.9956, 0.9957, 0.9959, 0.9960, 0.9961, 0.9962, 0.9963, 0.9964,
    0.9965, 0.9966, 0.9967, 0.9968, 0.9969, 0.9970, 0.9971, 0.9972, 0.9973, 0.9974,
    0.9974, 0.9975, 0.9976, 0.9977, 0.9977, 0.9978, 0.9979, 0.9979, 0.9980, 0.9981,
    0.9981, 0.9982, 0.9982, 0.9983, 0.9984, 0.9984, 0.9985, 0.9985, 0.9986, 0.9986,
    0.9987, 0.9987, 0.9987, 0.9988, 0.9988, 0.9989, 0.9989, 0.9989, 0.9990, 0.9990
  ];

  /**
   * Perform two-proportion Z-test for A/B testing
   */
  static performZTest(
    controlConversions: number,
    controlSample: number,
    treatmentConversions: number,
    treatmentSample: number,
    confidenceLevel: number = 0.95,
    alternative: 'two_sided' | 'greater' | 'less' = 'two_sided'
  ): FrequentistResult {
    if (controlSample === 0 || treatmentSample === 0) {
      throw new StatisticalError('Sample sizes must be greater than 0');
    }

    const p1 = controlConversions / controlSample;
    const p2 = treatmentConversions / treatmentSample;
    const pPooled = (controlConversions + treatmentConversions) / (controlSample + treatmentSample);
    
    // Standard error for two proportions
    const standardError = Math.sqrt(pPooled * (1 - pPooled) * (1/controlSample + 1/treatmentSample));
    
    if (standardError === 0) {
      throw new StatisticalError('Standard error is zero, cannot perform test');
    }

    // Z-statistic
    const zStatistic = (p2 - p1) / standardError;
    
    // Critical values
    const alpha = 1 - confidenceLevel;
    const criticalValue = alternative === 'two_sided' 
      ? this.getZCriticalValue(alpha / 2)
      : this.getZCriticalValue(alpha);

    // P-value calculation
    let pValue: number;
    if (alternative === 'two_sided') {
      pValue = 2 * (1 - this.normalCDF(Math.abs(zStatistic)));
    } else if (alternative === 'greater') {
      pValue = 1 - this.normalCDF(zStatistic);
    } else {
      pValue = this.normalCDF(zStatistic);
    }

    // Confidence interval for difference in proportions
    const diffStandardError = Math.sqrt((p1 * (1 - p1) / controlSample) + (p2 * (1 - p2) / treatmentSample));
    const margin = this.getZCriticalValue(alpha / 2) * diffStandardError;
    const diff = p2 - p1;
    const confidenceInterval: [number, number] = [diff - margin, diff + margin];

    // Effect size (Cohen's h for proportions)
    const effectSize = 2 * (Math.asin(Math.sqrt(p2)) - Math.asin(Math.sqrt(p1)));

    // Relative lift
    const lift = p1 === 0 ? (p2 > 0 ? Infinity : 0) : ((p2 - p1) / p1) * 100;

    // Statistical significance
    const isSignificant = alternative === 'two_sided' 
      ? Math.abs(zStatistic) > criticalValue
      : (alternative === 'greater' ? zStatistic > criticalValue : zStatistic < -criticalValue);

    return {
      testStatistic: zStatistic,
      pValue,
      criticalValue,
      confidenceInterval,
      effectSize,
      lift,
      isSignificant
    };
  }

  /**
   * Perform Welch's t-test for continuous metrics
   */
  static performTTest(
    controlMean: number,
    controlStd: number,
    controlSample: number,
    treatmentMean: number,
    treatmentStd: number,
    treatmentSample: number,
    confidenceLevel: number = 0.95,
    alternative: 'two_sided' | 'greater' | 'less' = 'two_sided'
  ): FrequentistResult {
    if (controlSample === 0 || treatmentSample === 0) {
      throw new StatisticalError('Sample sizes must be greater than 0');
    }

    if (controlStd === 0 && treatmentStd === 0) {
      throw new StatisticalError('Both standard deviations cannot be zero');
    }

    // Welch's t-test for unequal variances
    const variance1 = (controlStd ** 2) / controlSample;
    const variance2 = (treatmentStd ** 2) / treatmentSample;
    const standardError = Math.sqrt(variance1 + variance2);

    if (standardError === 0) {
      throw new StatisticalError('Standard error is zero, cannot perform test');
    }

    const tStatistic = (treatmentMean - controlMean) / standardError;

    // Degrees of freedom (Welch-Satterthwaite equation)
    const df = Math.floor((variance1 + variance2) ** 2 / (variance1 ** 2 / (controlSample - 1) + variance2 ** 2 / (treatmentSample - 1)));

    // Critical value (approximation)
    const alpha = 1 - confidenceLevel;
    const criticalValue = this.getTCriticalValue(df, alpha / 2);

    // P-value (approximation using normal distribution for large df)
    let pValue: number;
    if (df > 30) {
      if (alternative === 'two_sided') {
        pValue = 2 * (1 - this.normalCDF(Math.abs(tStatistic)));
      } else if (alternative === 'greater') {
        pValue = 1 - this.normalCDF(tStatistic);
      } else {
        pValue = this.normalCDF(tStatistic);
      }
    } else {
      // For small df, use t-distribution approximation
      pValue = 2 * (1 - this.tCDF(Math.abs(tStatistic), df));
    }

    // Confidence interval
    const margin = criticalValue * standardError;
    const diff = treatmentMean - controlMean;
    const confidenceInterval: [number, number] = [diff - margin, diff + margin];

    // Effect size (Cohen's d)
    const pooledStd = Math.sqrt(((controlSample - 1) * controlStd ** 2 + (treatmentSample - 1) * treatmentStd ** 2) / (controlSample + treatmentSample - 2));
    const effectSize = pooledStd === 0 ? 0 : (treatmentMean - controlMean) / pooledStd;

    // Relative lift
    const lift = controlMean === 0 ? (treatmentMean > 0 ? Infinity : 0) : ((treatmentMean - controlMean) / controlMean) * 100;

    const isSignificant = alternative === 'two_sided' 
      ? Math.abs(tStatistic) > criticalValue
      : (alternative === 'greater' ? tStatistic > criticalValue : tStatistic < -criticalValue);

    return {
      testStatistic: tStatistic,
      pValue,
      criticalValue,
      confidenceInterval,
      effectSize,
      lift,
      isSignificant,
      degreesOfFreedom: df
    };
  }

  /**
   * Perform Bayesian A/B test using Beta-Binomial conjugate prior
   */
  static performBayesianTest(
    controlConversions: number,
    controlSample: number,
    treatmentConversions: number,
    treatmentSample: number,
    priorAlpha: number = 1,
    priorBeta: number = 1,
    confidenceLevel: number = 0.95
  ): BayesianResult {
    // Posterior parameters for Beta distribution
    const controlPosteriorAlpha = priorAlpha + controlConversions;
    const controlPosteriorBeta = priorBeta + controlSample - controlConversions;
    const treatmentPosteriorAlpha = priorAlpha + treatmentConversions;
    const treatmentPosteriorBeta = priorBeta + treatmentSample - treatmentConversions;

    // Posterior means
    const controlMean = controlPosteriorAlpha / (controlPosteriorAlpha + controlPosteriorBeta);
    const treatmentMean = treatmentPosteriorAlpha / (treatmentPosteriorAlpha + treatmentPosteriorBeta);

    // Posterior variances
    const controlVariance = (controlPosteriorAlpha * controlPosteriorBeta) / 
      ((controlPosteriorAlpha + controlPosteriorBeta) ** 2 * (controlPosteriorAlpha + controlPosteriorBeta + 1));
    const treatmentVariance = (treatmentPosteriorAlpha * treatmentPosteriorBeta) / 
      ((treatmentPosteriorAlpha + treatmentPosteriorBeta) ** 2 * (treatmentPosteriorAlpha + treatmentPosteriorBeta + 1));

    // Credible interval for treatment (using normal approximation for large samples)
    const alpha = 1 - confidenceLevel;
    const zScore = this.getZCriticalValue(alpha / 2);
    const treatmentStd = Math.sqrt(treatmentVariance);
    const credibleInterval: [number, number] = [
      treatmentMean - zScore * treatmentStd,
      treatmentMean + zScore * treatmentStd
    ];

    // Probability that treatment is better than control (Monte Carlo approximation)
    const probabilityOfSuperiority = this.calculateProbabilityOfSuperiority(
      controlPosteriorAlpha, controlPosteriorBeta,
      treatmentPosteriorAlpha, treatmentPosteriorBeta
    );

    // Expected loss (simplified calculation)
    const expectedLoss = Math.max(0, controlMean - treatmentMean);

    // Statistical significance (if probability > 95% or < 5%)
    const isSignificant = probabilityOfSuperiority > 0.95 || probabilityOfSuperiority < 0.05;

    return {
      posterior: {
        alpha: treatmentPosteriorAlpha,
        beta: treatmentPosteriorBeta,
        mean: treatmentMean,
        variance: treatmentVariance
      },
      credibleInterval,
      probabilityOfSuperiority,
      expectedLoss,
      isSignificant
    };
  }

  /**
   * Calculate required sample size for A/B test
   */
  static calculateSampleSize(
    baselineRate: number,
    minimumDetectableEffect: number,
    significanceLevel: number = 0.05,
    power: number = 0.8,
    isRelativeEffect: boolean = true
  ): SampleSizeCalculation {
    const alpha = significanceLevel;
    const beta = 1 - power;

    // Convert relative effect to absolute if needed
    const absoluteEffect = isRelativeEffect 
      ? baselineRate * minimumDetectableEffect 
      : minimumDetectableEffect;

    const p1 = baselineRate;
    const p2 = baselineRate + absoluteEffect;

    // Z-scores for alpha and beta
    const zAlpha = this.getZCriticalValue(alpha / 2);
    const zBeta = this.getZCriticalValue(beta);

    // Sample size calculation for proportions
    const pPooled = (p1 + p2) / 2;
    const numerator = (zAlpha * Math.sqrt(2 * pPooled * (1 - pPooled)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2;
    const denominator = (p2 - p1) ** 2;

    const sampleSizePerGroup = Math.ceil(numerator / denominator);
    const totalSampleSize = sampleSizePerGroup * 2;

    // Estimate duration based on expected traffic (simplified)
    const estimatedTrafficPerDay = 1000; // This should be configurable
    const expectedDuration = Math.ceil(totalSampleSize / estimatedTrafficPerDay);

    return {
      minimumSampleSize: sampleSizePerGroup,
      expectedDuration,
      trafficRequired: 100, // Assume 100% traffic allocation
      feasibilityScore: this.calculateFeasibilityScore(sampleSizePerGroup, expectedDuration)
    };
  }

  /**
   * Perform power analysis for existing experiment
   */
  static performPowerAnalysis(
    controlConversions: number,
    controlSample: number,
    treatmentConversions: number,
    treatmentSample: number,
    significanceLevel: number = 0.05
  ): PowerAnalysis {
    const p1 = controlConversions / controlSample;
    const p2 = treatmentConversions / treatmentSample;
    const detectedEffect = Math.abs(p2 - p1);

    // Current sample size (minimum of the two groups)
    const currentSampleSize = Math.min(controlSample, treatmentSample);

    // Calculate current power
    const currentPower = this.calculateStatisticalPower(p1, p2, currentSampleSize, significanceLevel);

    // Recommended sample size for 80% power
    const recommendedSampleSize = this.calculateSampleSize(p1, detectedEffect, significanceLevel, 0.8, false).minimumSampleSize;

    return {
      currentSampleSize,
      currentPower,
      recommendedSampleSize,
      daysToReachSample: Math.max(0, Math.ceil((recommendedSampleSize - currentSampleSize) / 100)), // Assume 100 new participants per day
      detectedEffect,
      confidenceLevel: 1 - significanceLevel
    };
  }

  /**
   * Sequential testing with O'Brien-Fleming boundaries
   */
  static performSequentialAnalysis(
    analysisNumber: number,
    totalPlannedAnalyses: number,
    currentZStatistic: number,
    totalPlannedSampleSize: number,
    currentSampleSize: number,
    alpha: number = 0.05
  ): SequentialAnalysis {
    const informationFraction = currentSampleSize / totalPlannedSampleSize;
    
    // O'Brien-Fleming spending function
    const spentAlpha = 2 * (1 - this.normalCDF(this.getZCriticalValue(alpha / 2) / Math.sqrt(informationFraction)));
    const remainingAlpha = alpha - spentAlpha;

    // Efficacy and futility boundaries
    const efficacyBoundary = this.getZCriticalValue(alpha / 2) / Math.sqrt(informationFraction);
    const futilityBoundary = -efficacyBoundary * 0.5; // Conservative futility boundary

    // Decision rules
    const shouldStopForEfficacy = Math.abs(currentZStatistic) >= efficacyBoundary;
    const shouldStopForFutility = Math.abs(currentZStatistic) <= Math.abs(futilityBoundary);

    let recommendation: 'continue' | 'stop_for_success' | 'stop_for_futility';
    let stopReason: 'efficacy' | 'futility' | undefined;

    if (shouldStopForEfficacy) {
      recommendation = 'stop_for_success';
      stopReason = 'efficacy';
    } else if (shouldStopForFutility && analysisNumber > totalPlannedAnalyses / 2) {
      recommendation = 'stop_for_futility';
      stopReason = 'futility';
    } else {
      recommendation = 'continue';
    }

    return {
      analysisNumber,
      informationFraction,
      spentAlpha,
      remainingAlpha,
      efficacyBoundary,
      futilityBoundary,
      shouldStop: shouldStopForEfficacy || shouldStopForFutility,
      stopReason,
      recommendation
    };
  }

  /**
   * Multi-armed bandit analysis
   */
  static performBanditAnalysis(
    arms: BanditArm[],
    algorithm: 'epsilon_greedy' | 'ucb' | 'thompson_sampling' = 'ucb',
    explorationParam: number = 1.0
  ): BanditResult {
    const totalPulls = arms.reduce((sum, arm) => sum + arm.pulls, 0);
    
    // Calculate confidence bounds based on algorithm
    const updatedArms = arms.map(arm => {
      let confidenceBound = 0;

      switch (algorithm) {
        case 'epsilon_greedy':
          confidenceBound = arm.averageReward; // No confidence bound for epsilon-greedy
          break;
        
        case 'ucb':
          if (arm.pulls > 0) {
            confidenceBound = arm.averageReward + explorationParam * Math.sqrt(Math.log(totalPulls) / arm.pulls);
          }
          break;
        
        case 'thompson_sampling':
          // For Thompson Sampling, we'd sample from the posterior, but here we use the mean
          confidenceBound = arm.averageReward;
          break;
      }

      return {
        ...arm,
        confidenceBound
      };
    });

    // Find best arm
    const bestArm = updatedArms.reduce((best, current) => 
      current.averageReward > best.averageReward ? current : best
    );

    // Calculate total regret (simplified)
    const optimalReward = Math.max(...updatedArms.map(arm => arm.averageReward));
    const totalRegret = updatedArms.reduce((regret, arm) => 
      regret + arm.pulls * (optimalReward - arm.averageReward), 0
    );

    return {
      algorithm,
      totalRegret,
      bestArm: bestArm.variantId,
      arms: updatedArms
    };
  }

  // Helper methods for statistical calculations

  private static normalCDF(x: number): number {
    if (x < -3.9) return 0;
    if (x > 3.9) return 1;
    
    const absX = Math.abs(x);
    const index = Math.floor(absX * 100);
    
    if (index >= this.NORMAL_DISTRIBUTION_TABLE.length) {
      return x >= 0 ? 1 : 0;
    }
    
    const probability = this.NORMAL_DISTRIBUTION_TABLE[index];
    return x >= 0 ? probability : 1 - probability;
  }

  private static getZCriticalValue(alpha: number): number {
    // Approximate critical values for common alpha levels
    const criticalValues: Record<number, number> = {
      0.001: 3.291,
      0.005: 2.576,
      0.01: 2.326,
      0.025: 1.96,
      0.05: 1.645,
      0.1: 1.282
    };

    return criticalValues[alpha] || 1.96; // Default to 95% confidence
  }

  private static getTCriticalValue(df: number, alpha: number): number {
    // Simplified t-critical values (use normal approximation for large df)
    if (df > 30) {
      return this.getZCriticalValue(alpha);
    }
    
    // Approximate t-values for small df
    const tTable: Record<number, Record<number, number>> = {
      0.025: {
        1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
        10: 2.228, 15: 2.131, 20: 2.086, 25: 2.060, 30: 2.042
      }
    };

    return tTable[alpha]?.[df] || this.getZCriticalValue(alpha);
  }

  private static tCDF(t: number, df: number): number {
    // Simplified t-distribution CDF (approximation)
    if (df > 30) {
      return this.normalCDF(t);
    }
    
    // For small df, use normal approximation with correction
    const correction = 1 + (t * t) / (4 * df);
    return this.normalCDF(t / Math.sqrt(correction));
  }

  private static calculateProbabilityOfSuperiority(
    alpha1: number, beta1: number,
    alpha2: number, beta2: number,
    samples: number = 10000
  ): number {
    // Monte Carlo simulation to calculate P(treatment > control)
    let successes = 0;

    for (let i = 0; i < samples; i++) {
      const controlSample = this.betaRandom(alpha1, beta1);
      const treatmentSample = this.betaRandom(alpha2, beta2);
      
      if (treatmentSample > controlSample) {
        successes++;
      }
    }

    return successes / samples;
  }

  private static betaRandom(alpha: number, beta: number): number {
    // Simple beta distribution random generator using gamma
    const x = this.gammaRandom(alpha);
    const y = this.gammaRandom(beta);
    return x / (x + y);
  }

  private static gammaRandom(shape: number): number {
    // Simplified gamma distribution random generator
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

  private static normalRandom(): number {
    // Box-Muller transformation
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private static calculateStatisticalPower(
    p1: number,
    p2: number,
    sampleSize: number,
    alpha: number
  ): number {
    const pPooled = (p1 + p2) / 2;
    const standardError = Math.sqrt(pPooled * (1 - pPooled) * (2 / sampleSize));
    const effect = Math.abs(p2 - p1);
    const zAlpha = this.getZCriticalValue(alpha / 2);
    const zBeta = (effect / standardError) - zAlpha;
    return this.normalCDF(zBeta);
  }

  private static calculateFeasibilityScore(
    sampleSize: number,
    duration: number
  ): number {
    // Simple feasibility calculation (0-1 score)
    const maxFeasibleSample = 50000;
    const maxFeasibleDuration = 90; // days
    
    const sampleScore = Math.max(0, 1 - (sampleSize / maxFeasibleSample));
    const durationScore = Math.max(0, 1 - (duration / maxFeasibleDuration));
    
    return (sampleScore + durationScore) / 2;
  }

  /**
   * Detect winner with confidence threshold
   */
  static detectWinner(
    variants: Array<{
      name: string;
      conversions: number;
      participants: number;
    }>,
    confidenceThreshold: number = 0.95,
    minimumSampleSize: number = 100
  ): {
    hasWinner: boolean;
    winner?: string;
    confidence?: number;
    results: FrequentistResult[];
  } {
    // Find control variant (first one or one with highest sample size)
    const control = variants.reduce((max, variant) => 
      variant.participants > max.participants ? variant : max
    );

    const results: FrequentistResult[] = [];
    let bestVariant = control;
    let highestConfidence = 0;

    // Compare each variant against control
    for (const variant of variants) {
      if (variant.name === control.name) continue;
      
      if (variant.participants < minimumSampleSize || control.participants < minimumSampleSize) {
        continue;
      }

      const result = this.performZTest(
        control.conversions,
        control.participants,
        variant.conversions,
        variant.participants,
        confidenceThreshold
      );

      results.push(result);

      // Check if this variant is significantly better
      if (result.isSignificant && result.lift > 0) {
        const confidence = 1 - result.pValue;
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestVariant = variant;
        }
      }
    }

    const hasWinner = highestConfidence >= confidenceThreshold && bestVariant.name !== control.name;

    return {
      hasWinner,
      winner: hasWinner ? bestVariant.name : undefined,
      confidence: hasWinner ? highestConfidence : undefined,
      results
    };
  }
}

export default StatisticalService;