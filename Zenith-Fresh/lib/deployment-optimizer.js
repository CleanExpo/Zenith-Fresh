/**
 * Deployment Optimizer for Zenith-Fresh
 * Prevents repository overload and manages deployment traffic
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class DeploymentOptimizer {
  constructor(options = {}) {
    this.maxRepoSize = options.maxRepoSize || 500 * 1024 * 1024; // 500MB
    this.maxCommitSize = options.maxCommitSize || 50 * 1024 * 1024; // 50MB
    this.trafficThreshold = options.trafficThreshold || 0.8; // 80%
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 30000; // 30 seconds
  }

  /**
   * Check repository health and size
   */
  async checkRepositoryHealth() {
    return new Promise((resolve, reject) => {
      exec('du -sb . --exclude=.git', (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        const sizeBytes = parseInt(stdout.split('\t')[0]);
        const sizeMB = Math.round(sizeBytes / (1024 * 1024));

        const health = {
          sizeBytes,
          sizeMB,
          isHealthy: sizeBytes < this.maxRepoSize,
          warnings: []
        };

        if (sizeBytes > this.maxRepoSize) {
          health.warnings.push(`Repository size (${sizeMB}MB) exceeds limit (${Math.round(this.maxRepoSize / (1024 * 1024))}MB)`);
        }

        // Check for large files
        exec('find . -type f -size +10M ! -path "./.git/*" | head -10', (err, largeFiles) => {
          if (largeFiles.trim()) {
            health.warnings.push('Large files detected');
            health.largeFiles = largeFiles.trim().split('\n');
          }

          resolve(health);
        });
      });
    });
  }

  /**
   * Optimize repository by removing unnecessary files
   */
  async optimizeRepository() {
    const optimizations = [];

    // Remove node_modules if present
    if (fs.existsSync('node_modules')) {
      await this.executeCommand('rm -rf node_modules');
      optimizations.push('Removed node_modules');
    }

    // Remove build artifacts
    const buildDirs = ['.next', 'dist', 'build', '.vercel'];
    for (const dir of buildDirs) {
      if (fs.existsSync(dir)) {
        await this.executeCommand(`rm -rf ${dir}`);
        optimizations.push(`Removed ${dir}`);
      }
    }

    // Clean npm cache
    await this.executeCommand('npm cache clean --force');
    optimizations.push('Cleaned npm cache');

    // Reinstall production dependencies only
    if (fs.existsSync('package.json')) {
      await this.executeCommand('npm ci --omit=dev');
      optimizations.push('Reinstalled production dependencies');
    }

    return optimizations;
  }

  /**
   * Check current system load
   */
  async checkSystemLoad() {
    // Simulate load checking - in production this would check actual metrics
    return new Promise((resolve) => {
      const mockLoad = Math.random();
      resolve({
        cpuLoad: mockLoad,
        memoryUsage: mockLoad * 0.8,
        isOverloaded: mockLoad > this.trafficThreshold
      });
    });
  }

  /**
   * Implement progressive deployment with traffic management
   */
  async progressiveDeployment(deploymentFn) {
    let attempt = 0;
    
    while (attempt < this.retryAttempts) {
      try {
        // Check system load before deployment
        const load = await this.checkSystemLoad();
        
        if (load.isOverloaded) {
          console.log(`⏳ System overloaded (${Math.round(load.cpuLoad * 100)}%), waiting...`);
          await this.delay(this.retryDelay);
          attempt++;
          continue;
        }

        // Proceed with deployment
        console.log(`🚀 Starting deployment attempt ${attempt + 1}`);
        const result = await deploymentFn();
        
        console.log('✅ Deployment successful');
        return result;

      } catch (error) {
        attempt++;
        console.log(`❌ Deployment attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.retryAttempts) {
          console.log(`⏳ Retrying in ${this.retryDelay / 1000} seconds...`);
          await this.delay(this.retryDelay);
        } else {
          throw new Error(`Deployment failed after ${this.retryAttempts} attempts: ${error.message}`);
        }
      }
    }
  }

  /**
   * Monitor post-deployment health
   */
  async monitorDeployment(url, maxChecks = 5) {
    console.log(`📊 Monitoring deployment at ${url}`);
    
    for (let i = 0; i < maxChecks; i++) {
      try {
        const response = await fetch(url);
        const responseTime = Date.now();
        
        if (response.ok) {
          console.log(`✅ Health check ${i + 1}/${maxChecks} passed (${response.status})`);
          
          // Basic performance check
          if (responseTime < 3000) {
            console.log(`⚡ Good response time: ${responseTime}ms`);
          } else {
            console.log(`⚠️ Slow response time: ${responseTime}ms`);
          }
        } else {
          console.log(`⚠️ Health check ${i + 1}/${maxChecks} failed (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ Health check ${i + 1}/${maxChecks} error:`, error.message);
      }
      
      // Wait between checks
      if (i < maxChecks - 1) {
        await this.delay(10000); // 10 seconds
      }
    }
  }

  /**
   * Generate deployment report
   */
  generateReport(health, optimizations, deploymentResult) {
    const report = {
      timestamp: new Date().toISOString(),
      repositoryHealth: health,
      optimizations: optimizations,
      deployment: deploymentResult,
      recommendations: []
    };

    // Add recommendations based on health
    if (health.sizeMB > 400) {
      report.recommendations.push('Consider implementing asset compression');
    }

    if (health.largeFiles && health.largeFiles.length > 0) {
      report.recommendations.push('Review and optimize large files');
    }

    if (!health.isHealthy) {
      report.recommendations.push('Implement more aggressive file cleanup');
    }

    return report;
  }

  /**
   * Utility methods
   */
  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ stdout, stderr });
      });
    });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Main optimization workflow
   */
  async optimize() {
    console.log('🔍 Starting deployment optimization...');
    
    try {
      // Check repository health
      const health = await this.checkRepositoryHealth();
      console.log(`📊 Repository size: ${health.sizeMB}MB`);
      
      let optimizations = [];
      
      // Optimize if needed
      if (!health.isHealthy) {
        console.log('🛠️ Repository needs optimization');
        optimizations = await this.optimizeRepository();
        
        // Recheck health after optimization
        const newHealth = await this.checkRepositoryHealth();
        console.log(`📊 Optimized size: ${newHealth.sizeMB}MB`);
        
        if (!newHealth.isHealthy) {
          throw new Error('Repository still too large after optimization');
        }
      }

      return {
        success: true,
        health,
        optimizations,
        message: 'Repository optimization completed successfully'
      };

    } catch (error) {
      console.error('❌ Optimization failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = DeploymentOptimizer;