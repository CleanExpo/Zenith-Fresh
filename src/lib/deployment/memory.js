/**
 * MongoDB Deployment Memory System
 * 
 * Intelligent deployment tracking, error pattern recognition,
 * and automated problem resolution using MongoDB as the learning database.
 */

const { getCollection, getDatabase } = require('../mongodb.js');
const { ObjectId } = require('mongodb');

/**
 * DeploymentMemory - Core class for deployment intelligence
 */
class DeploymentMemory {
  constructor() {
    this.db = null;
    this.collections = {
      attempts: null,
      solutions: null,
      patterns: null
    };
  }

  /**
   * Initialize the memory system
   */
  async initialize() {
    try {
      this.db = await getDatabase();
      this.collections.attempts = await getCollection('deployment_attempts');
      this.collections.solutions = await getCollection('known_solutions');
      this.collections.patterns = await getCollection('build_patterns');
      
      console.log('🧠 Deployment Memory System initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Deployment Memory:', error);
      throw error;
    }
  }

  /**
   * Log a new deployment attempt
   */
  async logDeploymentAttempt(attemptData) {
    try {
      const attempt = {
        ...attemptData,
        timestamp: new Date(),
        deploymentId: attemptData.deploymentId || this.generateDeploymentId(),
        _id: new ObjectId()
      };

      const result = await this.collections.attempts.insertOne(attempt);
      console.log(`📝 Logged deployment attempt: ${attempt.deploymentId}`);
      
      return {
        ...attempt,
        _id: result.insertedId
      };
    } catch (error) {
      console.error('❌ Failed to log deployment attempt:', error);
      throw error;
    }
  }

  /**
   * Update deployment attempt status
   */
  async updateDeploymentStatus(deploymentId, updates) {
    try {
      const result = await this.collections.attempts.updateOne(
        { deploymentId },
        { 
          $set: {
            ...updates,
            updatedAt: new Date()
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`📊 Updated deployment ${deploymentId} status to ${updates.status}`);
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to update deployment status:', error);
      throw error;
    }
  }

  /**
   * Find similar deployment errors using pattern matching
   */
  async findSimilarErrors(errorPattern, limit = 10) {
    try {
      const regexPattern = new RegExp(errorPattern, 'i');
      
      const similarErrors = await this.collections.attempts.find({
        $or: [
          { 'errors.errorMessage': { $regex: regexPattern } },
          { 'errors.errorPattern': { $regex: regexPattern } }
        ],
        status: { $in: ['success', 'failed'] }
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

      console.log(`🔍 Found ${similarErrors.length} similar errors for pattern: ${errorPattern}`);
      
      return similarErrors;
    } catch (error) {
      console.error('❌ Failed to find similar errors:', error);
      return [];
    }
  }

  /**
   * Get successful solutions for a specific issue
   */
  async getSuccessfulSolutions(issue, errorType = null) {
    try {
      const query = {
        $or: [
          { errorPattern: { $regex: issue, $options: 'i' } },
          { 'solutions.issue': { $regex: issue, $options: 'i' } }
        ]
      };

      if (errorType) {
        query.errorType = errorType;
      }

      const solutions = await this.collections.solutions.find(query)
        .sort({ 'solutions.effectiveness': -1, 'solutions.successRate': -1 })
        .toArray();

      // Flatten and rank solutions
      const rankedSolutions = solutions
        .flatMap(doc => doc.solutions.map(sol => ({
          ...sol,
          parentPattern: doc.errorPattern,
          errorType: doc.errorType,
          framework: doc.framework
        })))
        .filter(sol => sol.effectiveness > 6) // Only high-effectiveness solutions
        .sort((a, b) => {
          // Primary sort: effectiveness
          if (b.effectiveness !== a.effectiveness) {
            return b.effectiveness - a.effectiveness;
          }
          // Secondary sort: success rate
          return b.successRate - a.successRate;
        });

      console.log(`💡 Found ${rankedSolutions.length} successful solutions for: ${issue}`);
      
      return rankedSolutions;
    } catch (error) {
      console.error('❌ Failed to get successful solutions:', error);
      return [];
    }
  }

  /**
   * Analyze build configuration and predict success rate
   */
  async analyzeBuildConfig(buildConfig) {
    try {
      // Create configuration fingerprint
      const fingerprint = this.createConfigFingerprint(buildConfig);
      
      // Find similar configurations
      const similarPatterns = await this.collections.patterns.find({
        $or: [
          { 'configFingerprint.nextjsVersion': fingerprint.nextjsVersion },
          { 'configFingerprint.nodeVersion': fingerprint.nodeVersion }
        ]
      }).toArray();

      // Calculate predicted success rate
      let predictedSuccessRate = 0.5; // Default baseline
      
      if (similarPatterns.length > 0) {
        const totalAttempts = similarPatterns.reduce((sum, p) => sum + p.successCount + p.failureCount, 0);
        const successfulAttempts = similarPatterns.reduce((sum, p) => sum + p.successCount, 0);
        
        if (totalAttempts > 0) {
          predictedSuccessRate = successfulAttempts / totalAttempts;
        }
      }

      // Check for known problematic patterns
      const riskFactors = await this.identifyRiskFactors(buildConfig);
      
      // Adjust prediction based on risk factors
      const adjustedSuccessRate = Math.max(0.1, predictedSuccessRate - (riskFactors.length * 0.1));

      console.log(`📈 Predicted success rate: ${(adjustedSuccessRate * 100).toFixed(1)}%`);
      
      return {
        predictedSuccessRate: adjustedSuccessRate,
        fingerprint,
        riskFactors,
        similarPatterns: similarPatterns.length,
        recommendations: await this.generateRecommendations(riskFactors, buildConfig)
      };
    } catch (error) {
      console.error('❌ Failed to analyze build config:', error);
      return {
        predictedSuccessRate: 0.5,
        riskFactors: [],
        recommendations: []
      };
    }
  }

  /**
   * Learn from deployment outcome and update patterns
   */
  async learnFromOutcome(deploymentId, outcome) {
    try {
      const deployment = await this.collections.attempts.findOne({ deploymentId });
      if (!deployment) {
        throw new Error(`Deployment ${deploymentId} not found`);
      }

      // Update solution effectiveness if solutions were applied
      if (deployment.solutions && deployment.solutions.length > 0) {
        for (const solution of deployment.solutions) {
          await this.updateSolutionEffectiveness(solution, outcome === 'success');
        }
      }

      // Update build patterns
      await this.updateBuildPattern(deployment.buildConfig, outcome === 'success');

      // If this was a failure, extract error patterns for future learning
      if (outcome === 'failed' && deployment.errors) {
        await this.learnFromErrors(deployment.errors);
      }

      console.log(`🎓 Learned from deployment ${deploymentId} outcome: ${outcome}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to learn from outcome:', error);
      return false;
    }
  }

  /**
   * Get deployment statistics and insights
   */
  async getDeploymentInsights(timeframe = 30) {
    try {
      const since = new Date(Date.now() - (timeframe * 24 * 60 * 60 * 1000));
      
      const pipeline = [
        {
          $match: {
            timestamp: { $gte: since },
            status: { $in: ['success', 'failed'] }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgDuration: { $avg: '$duration' },
            avgBuildTime: { $avg: '$buildTime' }
          }
        }
      ];

      const stats = await this.collections.attempts.aggregate(pipeline).toArray();
      
      // Calculate overall metrics
      const totalDeployments = stats.reduce((sum, stat) => sum + stat.count, 0);
      const successfulDeployments = stats.find(s => s._id === 'success')?.count || 0;
      const successRate = totalDeployments > 0 ? successfulDeployments / totalDeployments : 0;

      // Get most common errors
      const commonErrors = await this.getCommonErrors(since);
      
      // Get top solutions
      const topSolutions = await this.getTopSolutions();

      const insights = {
        timeframe,
        totalDeployments,
        successRate,
        avgDeploymentTime: stats.find(s => s._id === 'success')?.avgDuration || 0,
        avgBuildTime: stats.find(s => s._id === 'success')?.avgBuildTime || 0,
        commonErrors,
        topSolutions,
        recommendation: this.generateInsightRecommendations(successRate, commonErrors)
      };

      console.log(`📊 Generated deployment insights for last ${timeframe} days`);
      
      return insights;
    } catch (error) {
      console.error('❌ Failed to get deployment insights:', error);
      return null;
    }
  }

  // Helper methods

  generateDeploymentId() {
    return `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  createConfigFingerprint(buildConfig) {
    return {
      nodeVersion: buildConfig.nodeVersion,
      nextjsVersion: buildConfig.nextjsVersion,
      dependencies: this.extractKeyDependencies(buildConfig.dependencies),
      envVarsCount: buildConfig.environmentVars?.length || 0,
      hasCustomVercelConfig: buildConfig.vercelConfig && Object.keys(buildConfig.vercelConfig).length > 0
    };
  }

  extractKeyDependencies(dependencies = {}) {
    const keyDeps = [
      'next', 'react', 'typescript', 'prisma', '@prisma/client',
      'mongodb', 'redis', 'stripe', 'next-auth'
    ];
    
    return keyDeps.reduce((acc, dep) => {
      if (dependencies[dep]) {
        acc[dep] = dependencies[dep];
      }
      return acc;
    }, {});
  }

  generatePatternKey(fingerprint) {
    // Create a consistent pattern key from fingerprint
    const keyParts = [
      fingerprint.nextjsVersion?.replace(/[^0-9.]/g, '') || 'unknown',
      fingerprint.nodeVersion?.replace(/[^0-9.]/g, '') || 'unknown',
      Object.keys(fingerprint.dependencies || {}).sort().join(',').substring(0, 50),
      fingerprint.envVarsCount || 0
    ];
    
    return `pattern_${keyParts.join('_').replace(/[^a-zA-Z0-9_]/g, '_')}`;
  }

  extractErrorPattern(errorMessage) {
    if (!errorMessage) return '';
    
    // Normalize error message for pattern matching
    return errorMessage
      .replace(/\/[^\/\s]+\/[^\/\s]+/g, '{{path}}') // Replace file paths
      .replace(/line \d+/gi, 'line {{number}}') // Replace line numbers
      .replace(/\d+:\d+/g, '{{position}}') // Replace position indicators
      .replace(/["'][^"']*["']/g, '{{string}}') // Replace quoted strings
      .replace(/\b\d+\b/g, '{{number}}') // Replace standalone numbers
      .trim();
  }

  async identifyRiskFactors(buildConfig) {
    const riskFactors = [];
    
    // Check for known problematic patterns
    if (buildConfig.vercelConfig && Object.keys(buildConfig.vercelConfig).length > 1) {
      riskFactors.push('Complex Vercel configuration');
    }
    
    if (buildConfig.dependencies && Object.keys(buildConfig.dependencies).length > 100) {
      riskFactors.push('High dependency count');
    }
    
    // Check for recent version updates
    const recentVersionPattern = /\^[0-9]+\.[0-9]+\.[0-9]+$/;
    if (buildConfig.dependencies?.next && recentVersionPattern.test(buildConfig.dependencies.next)) {
      const nextVersion = parseFloat(buildConfig.dependencies.next.replace('^', ''));
      if (nextVersion >= 14.0) {
        riskFactors.push('Recent Next.js version - potential breaking changes');
      }
    }
    
    return riskFactors;
  }

  async generateRecommendations(riskFactors, buildConfig) {
    const recommendations = [];
    
    if (riskFactors.includes('Complex Vercel configuration')) {
      recommendations.push('Consider simplifying vercel.json to reduce build complexity');
    }
    
    if (riskFactors.includes('High dependency count')) {
      recommendations.push('Review and remove unused dependencies');
    }
    
    if (!buildConfig.gitCommitHash) {
      recommendations.push('Ensure clean git state before deployment');
    }
    
    return recommendations;
  }

  async updateSolutionEffectiveness(solution, successful) {
    try {
      const query = {
        'solutions.id': solution.id
      };

      const update = {
        $inc: {
          'solutions.$.timesApplied': 1,
          'solutions.$.timesSuccessful': successful ? 1 : 0
        },
        $set: {
          'solutions.$.lastUsed': new Date()
        }
      };

      // Calculate new success rate and effectiveness
      const solutionDoc = await this.collections.solutions.findOne(query);
      if (solutionDoc) {
        const solutionData = solutionDoc.solutions.find(s => s.id === solution.id);
        if (solutionData) {
          const newTimesApplied = solutionData.timesApplied + 1;
          const newTimesSuccessful = solutionData.timesSuccessful + (successful ? 1 : 0);
          const newSuccessRate = newTimesSuccessful / newTimesApplied;
          
          // Effectiveness based on success rate and usage frequency
          const newEffectiveness = Math.min(10, Math.round(
            (newSuccessRate * 8) + 
            (Math.min(newTimesApplied / 10, 1) * 2) // Bonus for proven solutions
          ));

          update.$set['solutions.$.successRate'] = newSuccessRate;
          update.$set['solutions.$.effectiveness'] = newEffectiveness;
        }
      }

      const result = await this.collections.solutions.updateOne(query, update);
      
      if (result.modifiedCount > 0) {
        console.log(`📊 Updated solution ${solution.id} effectiveness: ${successful ? 'success' : 'failure'}`);
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to update solution effectiveness:', error);
      return null;
    }
  }

  async updateBuildPattern(buildConfig, successful) {
    try {
      const fingerprint = this.createConfigFingerprint(buildConfig);
      const pattern = this.generatePatternKey(fingerprint);

      const query = { pattern };
      const update = {
        $inc: {
          successCount: successful ? 1 : 0,
          failureCount: successful ? 0 : 1
        },
        $set: {
          timestamp: new Date(),
          configFingerprint: fingerprint
        },
        $setOnInsert: {
          patternType: 'dependency',
          commonIssues: [],
          recommendedFixes: [],
          optimizations: []
        }
      };

      const result = await this.collections.patterns.updateOne(
        query, 
        update, 
        { upsert: true }
      );

      // Calculate and update success rate
      const patternDoc = await this.collections.patterns.findOne({ pattern });
      if (patternDoc) {
        const totalAttempts = patternDoc.successCount + patternDoc.failureCount;
        const successRate = patternDoc.successCount / totalAttempts;
        
        await this.collections.patterns.updateOne(
          { pattern },
          { $set: { successRate } }
        );
      }

      console.log(`📈 Updated build pattern ${pattern}: ${successful ? 'success' : 'failure'}`);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to update build pattern:', error);
      return null;
    }
  }

  async learnFromErrors(errors) {
    try {
      for (const error of errors) {
        const pattern = this.extractErrorPattern(error.errorMessage);
        
        // Check if we already know about this error pattern
        const existingSolution = await this.collections.solutions.findOne({
          errorPattern: { $regex: pattern, $options: 'i' }
        });

        if (!existingSolution) {
          // Create new error pattern entry
          const newSolution = {
            errorPattern: pattern,
            errorType: error.errorType || 'unknown',
            file: error.file || '**/*',
            framework: 'nextjs',
            commonCauses: [error.errorMessage],
            solutions: [{
              id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              description: `Auto-discovered solution for: ${error.errorMessage.substring(0, 100)}...`,
              code: '',
              commands: [],
              fileChanges: [],
              successRate: 0.1, // Start with low confidence
              effectiveness: 1, // Start with low effectiveness
              timesApplied: 0,
              timesSuccessful: 0,
              averageFixTime: 0,
              automationSafe: false // Require manual review for new patterns
            }],
            preventionSteps: [],
            relatedErrors: [],
            confidence: 0.1, // Low confidence for auto-discovered patterns
            verified: false,
            tags: ['auto-discovered', error.errorType || 'unknown'],
            createdAt: new Date(),
            updatedAt: new Date()
          };

          await this.collections.solutions.insertOne(newSolution);
          console.log(`🧠 Learned new error pattern: ${pattern.substring(0, 50)}...`);
        } else {
          // Update existing pattern with new context
          await this.collections.solutions.updateOne(
            { _id: existingSolution._id },
            {
              $addToSet: {
                commonCauses: error.errorMessage
              },
              $set: {
                updatedAt: new Date()
              }
            }
          );
          console.log(`📝 Updated existing error pattern with new context`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to learn from errors:', error);
      return false;
    }
  }

  async getCommonErrors(since) {
    try {
      const pipeline = [
        {
          $match: {
            timestamp: { $gte: since },
            status: 'failed'
          }
        },
        {
          $unwind: '$errors'
        },
        {
          $group: {
            _id: '$errors.errorPattern',
            count: { $sum: 1 },
            errorType: { $first: '$errors.errorType' },
            lastSeen: { $max: '$timestamp' },
            examples: {
              $push: {
                file: '$errors.file',
                message: '$errors.errorMessage'
              }
            }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            errorPattern: '$_id',
            count: 1,
            errorType: 1,
            lastSeen: 1,
            examples: { $slice: ['$examples', 3] } // Only first 3 examples
          }
        }
      ];

      const commonErrors = await this.collections.attempts.aggregate(pipeline).toArray();
      
      console.log(`📊 Found ${commonErrors.length} common error patterns`);
      
      return commonErrors;
    } catch (error) {
      console.error('❌ Failed to get common errors:', error);
      return [];
    }
  }

  async getTopSolutions() {
    try {
      const pipeline = [
        {
          $unwind: '$solutions'
        },
        {
          $match: {
            'solutions.timesApplied': { $gte: 3 }, // Only solutions with enough data
            'solutions.successRate': { $gte: 0.7 } // Only effective solutions
          }
        },
        {
          $sort: {
            'solutions.effectiveness': -1,
            'solutions.successRate': -1,
            'solutions.timesApplied': -1
          }
        },
        {
          $limit: 10
        },
        {
          $project: {
            solutionId: '$solutions.id',
            description: '$solutions.description',
            effectiveness: '$solutions.effectiveness',
            successRate: '$solutions.successRate',
            timesApplied: '$solutions.timesApplied',
            timesSuccessful: '$solutions.timesSuccessful',
            averageFixTime: '$solutions.averageFixTime',
            errorPattern: '$errorPattern',
            errorType: '$errorType',
            lastUsed: '$solutions.lastUsed'
          }
        }
      ];

      const topSolutions = await this.collections.solutions.aggregate(pipeline).toArray();
      
      console.log(`🏆 Found ${topSolutions.length} top-performing solutions`);
      
      return topSolutions;
    } catch (error) {
      console.error('❌ Failed to get top solutions:', error);
      return [];
    }
  }

  generateInsightRecommendations(successRate, commonErrors) {
    if (successRate < 0.8) {
      return 'Focus on resolving common build issues to improve success rate';
    } else if (successRate > 0.95) {
      return 'Excellent deployment stability - consider advanced optimizations';
    } else {
      return 'Good deployment stability - monitor for patterns and optimize incrementally';
    }
  }
}

/**
 * AutoResolver - Intelligent error pattern matching and resolution
 */
class AutoResolver {
  constructor(deploymentMemory) {
    this.memory = deploymentMemory;
  }

  /**
   * Analyze error and find best solution
   */
  async resolveError(error) {
    try {
      console.log(`🔧 Analyzing error: ${error.errorMessage?.substring(0, 100)}...`);
      
      // Extract error pattern
      const pattern = this.extractErrorPattern(error.errorMessage);
      
      // Find similar errors in memory
      const similarErrors = await this.memory.findSimilarErrors(pattern);
      
      // Get known solutions
      const solutions = await this.memory.getSuccessfulSolutions(pattern, error.errorType);
      
      if (solutions.length === 0) {
        console.log('❓ No known solutions found for this error pattern');
        return null;
      }

      // Select best solution based on effectiveness and confidence
      const bestSolution = this.selectBestSolution(solutions, error);
      
      console.log(`💡 Found solution: ${bestSolution.description}`);
      
      return {
        solution: bestSolution,
        confidence: this.calculateConfidence(bestSolution, similarErrors),
        alternatives: solutions.slice(1, 3), // Top 2 alternatives
        similar: similarErrors.length
      };
    } catch (error) {
      console.error('❌ Failed to resolve error:', error);
      return null;
    }
  }

  /**
   * Apply solution automatically
   */
  async applySolution(solution, context) {
    try {
      console.log(`🔨 Applying solution: ${solution.description}`);
      
      if (!solution.automationSafe) {
        console.log('⚠️ Solution not marked as automation-safe, skipping auto-apply');
        return { success: false, reason: 'Manual intervention required' };
      }

      const results = [];

      // Execute commands if any
      if (solution.commands && solution.commands.length > 0) {
        for (const command of solution.commands) {
          const result = await this.executeCommand(command, context);
          results.push(result);
          
          if (!result.success) {
            return { success: false, reason: `Command failed: ${command}`, results };
          }
        }
      }

      // Apply file changes if any
      if (solution.fileChanges && solution.fileChanges.length > 0) {
        for (const change of solution.fileChanges) {
          const result = await this.applyFileChange(change, context);
          results.push(result);
          
          if (!result.success) {
            return { success: false, reason: `File change failed: ${change.file}`, results };
          }
        }
      }

      console.log('✅ Solution applied successfully');
      
      return { success: true, results };
    } catch (error) {
      console.error('❌ Failed to apply solution:', error);
      return { success: false, reason: error.message };
    }
  }

  // Helper methods

  extractErrorPattern(errorMessage) {
    if (!errorMessage) return '';
    
    // Normalize error message for pattern matching
    return errorMessage
      .replace(/\/[^\/\s]+\/[^\/\s]+/g, '{{path}}') // Replace file paths
      .replace(/line \d+/gi, 'line {{number}}') // Replace line numbers
      .replace(/\d+:\d+/g, '{{position}}') // Replace position indicators
      .replace(/["'][^"']*["']/g, '{{string}}') // Replace quoted strings
      .trim();
  }

  selectBestSolution(solutions, error) {
    // Score solutions based on multiple factors
    return solutions
      .map(solution => ({
        ...solution,
        score: this.scoreSolution(solution, error)
      }))
      .sort((a, b) => b.score - a.score)[0];
  }

  scoreSolution(solution, error) {
    let score = 0;
    
    // Base effectiveness score (40% weight)
    score += solution.effectiveness * 0.4;
    
    // Success rate (30% weight)
    score += solution.successRate * 3;
    
    // Recency bonus (20% weight)
    const daysSinceLastUsed = solution.lastUsed 
      ? (Date.now() - new Date(solution.lastUsed)) / (1000 * 60 * 60 * 24)
      : 365;
    score += Math.max(0, (30 - daysSinceLastUsed) / 30) * 2;
    
    // Automation safety bonus (10% weight)
    if (solution.automationSafe) {
      score += 1;
    }
    
    return score;
  }

  calculateConfidence(solution, similarErrors) {
    let confidence = solution.successRate || 0.5;
    
    // Boost confidence if we have many similar cases
    if (similarErrors.length > 5) {
      confidence += 0.2;
    } else if (similarErrors.length > 2) {
      confidence += 0.1;
    }
    
    // Cap at 0.95 to maintain some uncertainty
    return Math.min(0.95, confidence);
  }

  async executeCommand(command, context) {
    // This would integrate with the actual build system
    // For now, return a mock result
    console.log(`🚀 Executing command: ${command}`);
    return { success: true, command, output: 'Command executed successfully' };
  }

  async applyFileChange(change, context) {
    // This would integrate with the file system
    // For now, return a mock result
    console.log(`📝 Applying file change to: ${change.file}`);
    return { success: true, file: change.file, operation: change.operation };
  }
}

module.exports = { DeploymentMemory, AutoResolver };