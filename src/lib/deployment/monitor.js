/**
 * Real-time Build Monitor - Pattern analysis and intelligent monitoring
 * 
 * Monitors deployments in real-time, analyzes patterns, and provides
 * intelligent insights and automatic resolution attempts.
 */

import { DeploymentMemory, AutoResolver } from './memory.js';
import { BuildAnalyzer } from './build-analyzer.js';

/**
 * BuildMonitor - Real-time deployment monitoring and pattern analysis
 */
export class BuildMonitor {
  constructor() {
    this.memory = new DeploymentMemory();
    this.resolver = new AutoResolver(this.memory);
    this.analyzer = new BuildAnalyzer();
    this.activeDeployments = new Map();
    this.monitoringActive = false;
  }

  /**
   * Initialize the monitoring system
   */
  async initialize() {
    await this.memory.initialize();
    await this.analyzer.initialize();
    console.log('📡 Build Monitor initialized');
  }

  /**
   * Start monitoring a deployment
   */
  async startDeploymentMonitoring(deploymentConfig) {
    try {
      const deploymentId = this.memory.generateDeploymentId();
      
      console.log(`🚀 Starting deployment monitoring: ${deploymentId}`);
      
      // Pre-deployment analysis
      const analysis = await this.analyzer.analyzeProject();
      
      // Create deployment record
      const deployment = {
        deploymentId,
        startTime: new Date(),
        status: 'in-progress',
        phase: 1,
        environment: deploymentConfig.environment || 'production',
        projectName: deploymentConfig.projectName || 'unknown',
        buildConfig: analysis.buildConfig,
        predictedSuccessRate: analysis.predictedSuccessRate,
        errors: [],
        solutions: [],
        logs: []
      };

      // Log initial deployment attempt
      await this.memory.logDeploymentAttempt(deployment);
      
      // Store in active deployments
      this.activeDeployments.set(deploymentId, deployment);
      
      console.log(`📊 Pre-deployment analysis complete. Success prediction: ${(analysis.predictedSuccessRate * 100).toFixed(1)}%`);
      
      return {
        deploymentId,
        analysis,
        recommendations: analysis.recommendations,
        riskFactors: analysis.riskAssessment
      };
    } catch (error) {
      console.error('❌ Failed to start deployment monitoring:', error);
      throw error;
    }
  }

  /**
   * Report deployment error for analysis and resolution
   */
  async reportError(deploymentId, error) {
    try {
      const deployment = this.activeDeployments.get(deploymentId);
      if (!deployment) {
        console.warn(`⚠️ Deployment ${deploymentId} not found in active monitoring`);
        return null;
      }

      console.log(`🚨 Error reported for deployment ${deploymentId}: ${error.errorMessage?.substring(0, 100)}...`);
      
      // Add error to deployment record
      deployment.errors.push({
        ...error,
        timestamp: new Date(),
        phase: deployment.phase
      });

      // Attempt automatic resolution
      const resolution = await this.resolver.resolveError(error);
      
      let result = {
        deploymentId,
        error,
        resolution,
        autoResolved: false
      };

      if (resolution && resolution.confidence > 0.8) {
        console.log(`🔧 High confidence solution found. Attempting auto-resolution...`);
        
        const applicationResult = await this.resolver.applySolution(
          resolution.solution, 
          { deploymentId, buildConfig: deployment.buildConfig }
        );
        
        if (applicationResult.success) {
          console.log('✅ Auto-resolution successful');
          deployment.solutions.push({
            ...resolution.solution,
            appliedAutomatically: true,
            result: applicationResult,
            timestamp: new Date()
          });
          result.autoResolved = true;
        } else {
          console.log('❌ Auto-resolution failed:', applicationResult.reason);
          result.autoResolutionError = applicationResult.reason;
        }
      }

      // Update deployment record
      await this.memory.updateDeploymentStatus(deploymentId, {
        errors: deployment.errors,
        solutions: deployment.solutions,
        phase: deployment.phase
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to report error:', error);
      return null;
    }
  }

  /**
   * Update deployment phase
   */
  async updatePhase(deploymentId, phase, phaseData = {}) {
    try {
      const deployment = this.activeDeployments.get(deploymentId);
      if (!deployment) {
        console.warn(`⚠️ Deployment ${deploymentId} not found`);
        return false;
      }

      deployment.phase = phase;
      
      const phaseNames = {
        1: 'Pre-build validation',
        2: 'Dependency installation',
        3: 'Build process',
        4: 'Deployment upload',
        5: 'Environment configuration',
        6: 'Health checks',
        7: 'Live traffic routing'
      };

      console.log(`📈 Deployment ${deploymentId} phase ${phase}: ${phaseNames[phase] || 'Unknown'}`);
      
      // Update in memory
      await this.memory.updateDeploymentStatus(deploymentId, {
        phase,
        ...phaseData
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to update deployment phase:', error);
      return false;
    }
  }

  /**
   * Complete deployment monitoring
   */
  async completeDeployment(deploymentId, outcome, metrics = {}) {
    try {
      const deployment = this.activeDeployments.get(deploymentId);
      if (!deployment) {
        console.warn(`⚠️ Deployment ${deploymentId} not found`);
        return false;
      }

      const endTime = new Date();
      const duration = Math.round((endTime - deployment.startTime) / 1000);
      
      console.log(`🏁 Deployment ${deploymentId} completed: ${outcome} (${duration}s)`);
      
      // Update final status
      deployment.status = outcome;
      deployment.duration = duration;
      deployment.buildTime = metrics.buildTime || 0;
      deployment.deployTime = metrics.deployTime || 0;

      // Calculate prediction accuracy
      const actualSuccess = outcome === 'success';
      const predicted = deployment.predictedSuccessRate > 0.5;
      deployment.predictionAccuracy = predicted === actualSuccess ? 1 : 0;

      // Final update
      await this.memory.updateDeploymentStatus(deploymentId, {
        status: outcome,
        duration,
        buildTime: deployment.buildTime,
        deployTime: deployment.deployTime,
        predictionAccuracy: deployment.predictionAccuracy,
        actualOutcome: outcome
      });

      // Learn from this deployment
      await this.memory.learnFromOutcome(deploymentId, outcome);

      // Remove from active monitoring
      this.activeDeployments.delete(deploymentId);

      // Generate insights if this was a failure
      if (outcome === 'failed') {
        await this.generateFailureInsights(deploymentId);
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to complete deployment monitoring:', error);
      return false;
    }
  }

  /**
   * Generate insights from deployment failure
   */
  async generateFailureInsights(deploymentId) {
    try {
      console.log(`🔍 Generating failure insights for deployment ${deploymentId}`);
      
      // Find similar failures
      const deployment = await this.memory.collections.attempts.findOne({ deploymentId });
      if (!deployment || !deployment.errors.length) {
        return null;
      }

      const insights = {
        deploymentId,
        patterns: [],
        recommendations: [],
        preventionSteps: []
      };

      // Analyze each error
      for (const error of deployment.errors) {
        const pattern = this.resolver.extractErrorPattern(error.errorMessage);
        const similarErrors = await this.memory.findSimilarErrors(pattern, 20);
        
        if (similarErrors.length > 3) {
          insights.patterns.push({
            pattern,
            occurrences: similarErrors.length,
            commonality: 'frequent',
            errorType: error.errorType
          });
        }
      }

      // Generate recommendations based on patterns
      if (insights.patterns.length > 0) {
        insights.recommendations.push('Consider implementing pre-deployment checks for common error patterns');
        insights.preventionSteps.push('Add automated testing for frequent failure scenarios');
      }

      // Check if this failure could have been predicted
      if (deployment.predictedSuccessRate > 0.7 && deployment.errors.length > 0) {
        insights.recommendations.push('Improve prediction model - high confidence prediction was incorrect');
      }

      console.log(`💡 Generated ${insights.recommendations.length} recommendations for failure prevention`);
      
      return insights;
    } catch (error) {
      console.error('❌ Failed to generate failure insights:', error);
      return null;
    }
  }

  /**
   * Get real-time deployment status
   */
  getDeploymentStatus(deploymentId) {
    const deployment = this.activeDeployments.get(deploymentId);
    if (!deployment) {
      return null;
    }

    return {
      deploymentId,
      status: deployment.status,
      phase: deployment.phase,
      startTime: deployment.startTime,
      duration: Math.round((new Date() - deployment.startTime) / 1000),
      errors: deployment.errors.length,
      solutions: deployment.solutions.length,
      predictedSuccessRate: deployment.predictedSuccessRate
    };
  }

  /**
   * Get active deployments summary
   */
  getActiveDeployments() {
    return Array.from(this.activeDeployments.values()).map(deployment => ({
      deploymentId: deployment.deploymentId,
      status: deployment.status,
      phase: deployment.phase,
      environment: deployment.environment,
      startTime: deployment.startTime,
      duration: Math.round((new Date() - deployment.startTime) / 1000),
      errors: deployment.errors.length
    }));
  }

  /**
   * Get deployment insights and analytics
   */
  async getInsights(timeframe = 7) {
    try {
      const insights = await this.memory.getDeploymentInsights(timeframe);
      
      if (!insights) {
        return null;
      }

      // Add monitoring-specific insights
      insights.activeDeployments = this.activeDeployments.size;
      insights.monitoringMetrics = {
        averagePhaseTime: await this.calculateAveragePhaseTime(),
        autoResolutionRate: await this.calculateAutoResolutionRate(),
        predictionAccuracy: await this.calculatePredictionAccuracy()
      };

      return insights;
    } catch (error) {
      console.error('❌ Failed to get insights:', error);
      return null;
    }
  }

  // Helper methods

  async calculateAveragePhaseTime() {
    // Calculate average time spent in each phase
    const recentDeployments = await this.memory.collections.attempts.find({
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      status: 'success'
    }).limit(50).toArray();

    if (recentDeployments.length === 0) return {};

    const phaseTimes = {};
    recentDeployments.forEach(deployment => {
      if (deployment.buildTime) {
        phaseTimes.build = (phaseTimes.build || 0) + deployment.buildTime;
      }
      if (deployment.deployTime) {
        phaseTimes.deploy = (phaseTimes.deploy || 0) + deployment.deployTime;
      }
    });

    Object.keys(phaseTimes).forEach(phase => {
      phaseTimes[phase] = Math.round(phaseTimes[phase] / recentDeployments.length);
    });

    return phaseTimes;
  }

  async calculateAutoResolutionRate() {
    const recentDeployments = await this.memory.collections.attempts.find({
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      'solutions.appliedAutomatically': true
    }).count();

    const totalWithErrors = await this.memory.collections.attempts.find({
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      errors: { $exists: true, $ne: [] }
    }).count();

    return totalWithErrors > 0 ? recentDeployments / totalWithErrors : 0;
  }

  async calculatePredictionAccuracy() {
    const recentDeployments = await this.memory.collections.attempts.find({
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      predictionAccuracy: { $exists: true }
    }).toArray();

    if (recentDeployments.length === 0) return 0;

    const totalAccuracy = recentDeployments.reduce((sum, dep) => sum + dep.predictionAccuracy, 0);
    return totalAccuracy / recentDeployments.length;
  }
}

export default BuildMonitor;