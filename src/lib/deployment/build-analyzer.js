/**
 * Build Analyzer - Pre-deployment validation and risk assessment
 * 
 * Analyzes build configuration, dependencies, and code patterns
 * to predict deployment success and identify potential issues before deployment.
 */

import fs from 'fs/promises';
import path from 'path';
import { DeploymentMemory } from './memory.js';

/**
 * BuildAnalyzer - Validates builds before deployment
 */
export class BuildAnalyzer {
  constructor() {
    this.memory = new DeploymentMemory();
    this.projectRoot = process.cwd();
  }

  /**
   * Initialize the analyzer
   */
  async initialize() {
    await this.memory.initialize();
    console.log('🔍 Build Analyzer initialized');
  }

  /**
   * Perform comprehensive pre-deployment analysis
   */
  async analyzeProject() {
    try {
      console.log('🚀 Starting comprehensive project analysis...');
      
      const analysis = {
        timestamp: new Date(),
        buildConfig: await this.extractBuildConfig(),
        dependencyAnalysis: await this.analyzeDependencies(),
        codeQuality: await this.analyzeCodeQuality(),
        riskAssessment: null,
        recommendations: [],
        predictedSuccessRate: 0.5,
        confidence: 0.5
      };

      // Get AI prediction from deployment memory
      const memoryAnalysis = await this.memory.analyzeBuildConfig(analysis.buildConfig);
      analysis.predictedSuccessRate = memoryAnalysis.predictedSuccessRate;
      analysis.riskAssessment = memoryAnalysis.riskFactors;
      analysis.recommendations = memoryAnalysis.recommendations;

      // Combine with static analysis
      const staticRisks = await this.performStaticAnalysis();
      analysis.riskAssessment = [...analysis.riskAssessment, ...staticRisks];

      // Generate final recommendations
      analysis.recommendations = [
        ...analysis.recommendations,
        ...await this.generateRecommendations(analysis)
      ];

      // Calculate overall confidence
      analysis.confidence = this.calculateConfidence(analysis);

      console.log(`📊 Analysis complete. Predicted success rate: ${(analysis.predictedSuccessRate * 100).toFixed(1)}%`);
      
      return analysis;
    } catch (error) {
      console.error('❌ Failed to analyze project:', error);
      throw error;
    }
  }

  /**
   * Extract build configuration from project files
   */
  async extractBuildConfig() {
    try {
      const config = {
        nodeVersion: process.version,
        nextjsVersion: null,
        buildCommand: 'npm run build',
        installCommand: 'npm install',
        environmentVars: [],
        dependencies: {},
        devDependencies: {},
        vercelConfig: {},
        prismaSchema: null,
        gitCommitHash: null,
        gitBranch: null,
        filesChanged: []
      };

      // Read package.json
      try {
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        
        config.dependencies = packageJson.dependencies || {};
        config.devDependencies = packageJson.devDependencies || {};
        config.nextjsVersion = config.dependencies.next || 'unknown';
        
        // Extract custom scripts
        if (packageJson.scripts) {
          config.buildCommand = packageJson.scripts.build || config.buildCommand;
          config.installCommand = packageJson.scripts.install || config.installCommand;
        }
      } catch (error) {
        console.warn('⚠️ Could not read package.json:', error.message);
      }

      // Read vercel.json
      try {
        const vercelJsonPath = path.join(this.projectRoot, 'vercel.json');
        const vercelJson = JSON.parse(await fs.readFile(vercelJsonPath, 'utf8'));
        config.vercelConfig = vercelJson;
      } catch (error) {
        // vercel.json is optional
      }

      // Check for Prisma schema
      try {
        const prismaSchemaPath = path.join(this.projectRoot, 'prisma', 'schema.prisma');
        const prismaSchema = await fs.readFile(prismaSchemaPath, 'utf8');
        config.prismaSchema = this.hashString(prismaSchema);
      } catch (error) {
        // Prisma is optional
      }

      // Get git information (if available)
      try {
        const { execSync } = await import('child_process');
        config.gitCommitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        config.gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        
        // Get changed files
        const changedFiles = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' })
          .split('\n')
          .filter(file => file.trim())
          .slice(0, 20); // Limit to prevent overflow
        config.filesChanged = changedFiles;
      } catch (error) {
        // Git information is optional
      }

      // Extract environment variable names (not values for security)
      try {
        const envPath = path.join(this.projectRoot, '.env');
        const envContent = await fs.readFile(envPath, 'utf8');
        config.environmentVars = envContent
          .split('\n')
          .filter(line => line.includes('=') && !line.startsWith('#'))
          .map(line => line.split('=')[0])
          .slice(0, 50); // Limit for performance
      } catch (error) {
        // .env is optional
      }

      return config;
    } catch (error) {
      console.error('❌ Failed to extract build config:', error);
      throw error;
    }
  }

  /**
   * Analyze dependencies for known issues
   */
  async analyzeDependencies() {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const analysis = {
        totalDependencies: Object.keys(allDeps).length,
        outdatedDependencies: [],
        vulnerabilities: [],
        conflicts: [],
        recommendations: []
      };

      // Check for known problematic versions
      const problematicVersions = {
        'next': ['13.0.0', '13.0.1', '13.0.2'], // Example problematic versions
        'react': ['18.0.0-beta'],
        'typescript': ['5.0.0-beta']
      };

      for (const [dep, version] of Object.entries(allDeps)) {
        if (problematicVersions[dep]) {
          const cleanVersion = version.replace(/[^0-9.]/g, '');
          if (problematicVersions[dep].includes(cleanVersion)) {
            analysis.vulnerabilities.push({
              package: dep,
              version: version,
              issue: 'Known problematic version',
              severity: 'medium'
            });
          }
        }
      }

      // Check for missing peer dependencies
      const peerDepChecks = {
        'react-dom': 'react',
        '@types/react': 'react',
        '@types/node': 'node'
      };

      for (const [dep, peerDep] of Object.entries(peerDepChecks)) {
        if (allDeps[dep] && !allDeps[peerDep] && peerDep !== 'node') {
          analysis.conflicts.push({
            package: dep,
            missing: peerDep,
            issue: 'Missing peer dependency'
          });
        }
      }

      // Performance recommendations
      if (analysis.totalDependencies > 100) {
        analysis.recommendations.push('Consider dependency audit to reduce bundle size');
      }

      if (allDeps['lodash']) {
        analysis.recommendations.push('Consider using lodash-es or individual lodash functions');
      }

      return analysis;
    } catch (error) {
      console.error('❌ Failed to analyze dependencies:', error);
      return {
        totalDependencies: 0,
        outdatedDependencies: [],
        vulnerabilities: [],
        conflicts: [],
        recommendations: []
      };
    }
  }

  /**
   * Analyze code quality and common issues
   */
  async analyzeCodeQuality() {
    try {
      const analysis = {
        fileCount: 0,
        linesOfCode: 0,
        typescript: false,
        issues: [],
        recommendations: []
      };

      // Count TypeScript/JavaScript files
      const srcPath = path.join(this.projectRoot, 'src');
      
      try {
        const files = await this.findFiles(srcPath, ['.ts', '.tsx', '.js', '.jsx']);
        analysis.fileCount = files.length;
        analysis.typescript = files.some(file => file.endsWith('.ts') || file.endsWith('.tsx'));
        
        // Sample a few files for basic analysis
        const sampleFiles = files.slice(0, 10);
        let totalLines = 0;
        
        for (const file of sampleFiles) {
          try {
            const content = await fs.readFile(file, 'utf8');
            const lines = content.split('\n').length;
            totalLines += lines;
            
            // Basic static analysis
            if (content.includes('console.log') && !file.includes('test')) {
              analysis.issues.push({
                file: path.relative(this.projectRoot, file),
                issue: 'Console.log statements found',
                severity: 'low'
              });
            }
            
            if (content.includes('// TODO') || content.includes('// FIXME')) {
              analysis.issues.push({
                file: path.relative(this.projectRoot, file),
                issue: 'TODO/FIXME comments found',
                severity: 'low'
              });
            }
          } catch (fileError) {
            // Skip files that can't be read
          }
        }
        
        analysis.linesOfCode = Math.round((totalLines / sampleFiles.length) * files.length);
      } catch (error) {
        // src directory might not exist
      }

      // Check for common configuration files
      const configFiles = [
        'tsconfig.json',
        'next.config.js',
        'tailwind.config.js',
        'jest.config.js'
      ];

      for (const configFile of configFiles) {
        try {
          await fs.access(path.join(this.projectRoot, configFile));
        } catch (error) {
          if (configFile === 'tsconfig.json' && analysis.typescript) {
            analysis.issues.push({
              file: configFile,
              issue: 'TypeScript project missing tsconfig.json',
              severity: 'high'
            });
          }
        }
      }

      return analysis;
    } catch (error) {
      console.error('❌ Failed to analyze code quality:', error);
      return {
        fileCount: 0,
        linesOfCode: 0,
        typescript: false,
        issues: [],
        recommendations: []
      };
    }
  }

  /**
   * Perform static analysis for known risk patterns
   */
  async performStaticAnalysis() {
    const risks = [];

    // Check for common problematic patterns
    try {
      const vercelJsonPath = path.join(this.projectRoot, 'vercel.json');
      const vercelJson = JSON.parse(await fs.readFile(vercelJsonPath, 'utf8'));
      
      if (Object.keys(vercelJson).length > 5) {
        risks.push('Complex Vercel configuration detected');
      }
      
      if (vercelJson.functions) {
        risks.push('Custom Vercel functions may cause deployment issues');
      }
    } catch (error) {
      // vercel.json might not exist or be empty
    }

    // Check for large asset files
    try {
      const publicPath = path.join(this.projectRoot, 'public');
      const files = await this.findFiles(publicPath, ['.png', '.jpg', '.jpeg', '.gif', '.mp4']);
      
      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          if (stats.size > 5 * 1024 * 1024) { // 5MB
            risks.push(`Large asset file detected: ${path.relative(this.projectRoot, file)}`);
          }
        } catch (error) {
          // Skip files that can't be accessed
        }
      }
    } catch (error) {
      // public directory might not exist
    }

    return risks;
  }

  /**
   * Generate recommendations based on analysis
   */
  async generateRecommendations(analysis) {
    const recommendations = [];

    // Success rate based recommendations
    if (analysis.predictedSuccessRate < 0.7) {
      recommendations.push('High risk deployment - consider staging environment testing');
    }

    if (analysis.dependencyAnalysis.vulnerabilities.length > 0) {
      recommendations.push('Update vulnerable dependencies before deployment');
    }

    if (analysis.dependencyAnalysis.conflicts.length > 0) {
      recommendations.push('Resolve dependency conflicts to prevent build failures');
    }

    if (analysis.codeQuality.issues.length > 5) {
      recommendations.push('Address code quality issues for better maintainability');
    }

    // Performance recommendations
    if (analysis.dependencyAnalysis.totalDependencies > 200) {
      recommendations.push('Consider dependency optimization for faster builds');
    }

    return recommendations;
  }

  /**
   * Calculate overall confidence in the analysis
   */
  calculateConfidence(analysis) {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on data quality
    if (analysis.buildConfig.gitCommitHash) confidence += 0.1;
    if (analysis.buildConfig.dependencies && Object.keys(analysis.buildConfig.dependencies).length > 0) confidence += 0.1;
    if (analysis.codeQuality.typescript) confidence += 0.1;
    if (analysis.dependencyAnalysis.vulnerabilities.length === 0) confidence += 0.1;
    if (analysis.riskAssessment.length === 0) confidence += 0.1;

    // Reduce confidence for high-risk factors
    if (analysis.predictedSuccessRate < 0.5) confidence -= 0.2;
    if (analysis.riskAssessment.length > 3) confidence -= 0.1;

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  // Helper methods

  async findFiles(directory, extensions) {
    const files = [];
    
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subFiles = await this.findFiles(fullPath, extensions);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }
    
    return files;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}

export default BuildAnalyzer;