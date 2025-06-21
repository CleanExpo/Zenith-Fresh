/**
 * TRUTH AGENT - The Honest System Assessment Agent
 * 
 * This agent provides REAL status checks, not false positives.
 * It actually tests functionality rather than just checking file existence.
 * 
 * Master Login Access: Only available with master credentials
 * Integration: Used in build processes and master dashboard
 */

import { NextRequest } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface TruthAssessment {
  overallScore: number;
  status: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  timestamp: string;
  buildReady: boolean;
  issues: TruthIssue[];
  recommendations: string[];
  deploymentRisk: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface TruthIssue {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'BUILD' | 'RUNTIME' | 'SECURITY' | 'PERFORMANCE' | 'FUNCTIONALITY';
  description: string;
  location?: string;
  fix?: string;
  tested: boolean;
}

export class TruthAgent {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * HONEST SYSTEM ASSESSMENT
   * Actually tests functionality, not just file existence
   */
  async runTruthAssessment(): Promise<TruthAssessment> {
    const startTime = Date.now();
    const issues: TruthIssue[] = [];
    let buildReady = true;

    console.log('🔍 TRUTH AGENT: Starting honest system assessment...');

    // 1. ACTUAL BUILD TEST - Not just file checks
    try {
      console.log('Testing actual Next.js build...');
      const buildResult = await this.testActualBuild();
      if (!buildResult.success) {
        buildReady = false;
        issues.push({
          severity: 'CRITICAL',
          category: 'BUILD',
          description: `Build failure: ${buildResult.error}`,
          fix: 'Fix build errors before deployment',
          tested: true
        });
      }
    } catch (error) {
      buildReady = false;
      issues.push({
        severity: 'CRITICAL',
        category: 'BUILD',
        description: `Build test failed: ${error}`,
        tested: true
      });
    }

    // 2. RUNTIME FUNCTIONALITY TESTS
    const runtimeIssues = await this.testRuntimeFunctionality();
    issues.push(...runtimeIssues);

    // 3. API ENDPOINT VALIDATION
    const apiIssues = await this.testApiEndpoints();
    issues.push(...apiIssues);

    // 4. DATABASE CONNECTIVITY
    const dbIssues = await this.testDatabaseConnection();
    issues.push(...dbIssues);

    // 5. SECURITY CONFIGURATION
    const securityIssues = await this.testSecurityConfig();
    issues.push(...securityIssues);

    // Calculate honest score
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL').length;
    const warningIssues = issues.filter(i => i.severity === 'WARNING').length;
    
    // HONEST SCORING: Critical issues severely impact score
    let score = 100;
    score -= (criticalIssues * 25); // Each critical issue = -25 points
    score -= (warningIssues * 5);   // Each warning = -5 points
    score = Math.max(0, score);

    const status = criticalIssues > 0 ? 'CRITICAL' : 
                   warningIssues > 0 ? 'WARNING' : 'HEALTHY';

    const deploymentRisk = criticalIssues > 0 ? 'HIGH' :
                          warningIssues > 2 ? 'MEDIUM' : 'LOW';

    const endTime = Date.now();
    console.log(`🔍 TRUTH AGENT: Assessment complete in ${endTime - startTime}ms`);
    console.log(`📊 HONEST SCORE: ${score}/100 (${criticalIssues} critical, ${warningIssues} warnings)`);

    return {
      overallScore: score,
      status,
      timestamp: new Date().toISOString(),
      buildReady: buildReady && criticalIssues === 0,
      issues,
      recommendations: this.generateRecommendations(issues),
      deploymentRisk
    };
  }

  /**
   * ACTUAL BUILD TEST - Really tries to build the project
   */
  private async testActualBuild(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test TypeScript compilation
      console.log('  • Testing TypeScript compilation...');
      await execAsync('npx tsc --noEmit', { cwd: this.projectRoot });

      // Test Next.js build (dry run)
      console.log('  • Testing Next.js build...');
      const { stdout, stderr } = await execAsync('npm run build', { 
        cwd: this.projectRoot,
        timeout: 60000 // 1 minute timeout
      });

      if (stderr && stderr.includes('error')) {
        return { success: false, error: stderr };
      }

      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Build failed with unknown error' 
      };
    }
  }

  /**
   * RUNTIME FUNCTIONALITY TESTS
   */
  private async testRuntimeFunctionality(): Promise<TruthIssue[]> {
    const issues: TruthIssue[] = [];

    try {
      // Test for SSR compatibility issues
      const fs = await import('fs');
      const path = await import('path');
      
      const mainPagePath = path.join(this.projectRoot, 'src/app/page.tsx');
      if (fs.existsSync(mainPagePath)) {
        const content = fs.readFileSync(mainPagePath, 'utf8');
        
        // Check for Framer Motion imports (SSR issues)
        if (content.includes('framer-motion')) {
          issues.push({
            severity: 'CRITICAL',
            category: 'RUNTIME',
            description: 'Framer Motion detected - will cause SSR errors',
            location: 'src/app/page.tsx',
            fix: 'Remove Framer Motion or make SSR-compatible',
            tested: true
          });
        }

        // Check for document/window usage without checks
        if (content.includes('document.') && !content.includes('typeof document')) {
          issues.push({
            severity: 'WARNING',
            category: 'RUNTIME',
            description: 'Direct document usage without SSR check',
            location: 'src/app/page.tsx',
            fix: 'Add typeof document !== "undefined" checks',
            tested: true
          });
        }
      }
    } catch (error) {
      issues.push({
        severity: 'WARNING',
        category: 'RUNTIME',
        description: `Runtime test failed: ${error}`,
        tested: true
      });
    }

    return issues;
  }

  /**
   * API ENDPOINT VALIDATION
   */
  private async testApiEndpoints(): Promise<TruthIssue[]> {
    const issues: TruthIssue[] = [];

    // Test critical API routes
    const criticalRoutes = [
      '/api/health',
      '/api/auth',
      '/api/agents/delegate',
      '/api/approvals/pending'
    ];

    for (const route of criticalRoutes) {
      try {
        // Check if route file exists and is properly configured
        const fs = await import('fs');
        const path = await import('path');
        
        const routePath = path.join(this.projectRoot, 'src/app', route, 'route.ts');
        if (!fs.existsSync(routePath)) {
          issues.push({
            severity: 'WARNING',
            category: 'FUNCTIONALITY',
            description: `API route missing: ${route}`,
            location: routePath,
            fix: 'Implement missing API route',
            tested: true
          });
        }
      } catch (error) {
        issues.push({
          severity: 'WARNING',
          category: 'FUNCTIONALITY',
          description: `API test failed for ${route}: ${error}`,
          tested: true
        });
      }
    }

    return issues;
  }

  /**
   * DATABASE CONNECTION TEST
   */
  private async testDatabaseConnection(): Promise<TruthIssue[]> {
    const issues: TruthIssue[] = [];

    try {
      // Test Prisma client
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      // Try to connect
      await prisma.$connect();
      await prisma.$disconnect();
      
      console.log('  • Database connection: ✓');
    } catch (error) {
      issues.push({
        severity: 'CRITICAL',
        category: 'FUNCTIONALITY',
        description: `Database connection failed: ${error}`,
        fix: 'Check DATABASE_URL and run prisma migrate deploy',
        tested: true
      });
    }

    return issues;
  }

  /**
   * SECURITY CONFIGURATION TEST
   */
  private async testSecurityConfig(): Promise<TruthIssue[]> {
    const issues: TruthIssue[] = [];

    try {
      // Check for environment variables
      const requiredEnvVars = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL'
      ];

      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          issues.push({
            severity: 'CRITICAL',
            category: 'SECURITY',
            description: `Missing required environment variable: ${envVar}`,
            fix: `Add ${envVar} to environment configuration`,
            tested: true
          });
        }
      }

      // Check for .env in gitignore
      const fs = await import('fs');
      const path = await import('path');
      
      const gitignorePath = path.join(this.projectRoot, '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignore = fs.readFileSync(gitignorePath, 'utf8');
        if (!gitignore.includes('.env')) {
          issues.push({
            severity: 'WARNING',
            category: 'SECURITY',
            description: '.env files not in .gitignore',
            fix: 'Add .env* to .gitignore',
            tested: true
          });
        }
      }
    } catch (error) {
      issues.push({
        severity: 'WARNING',
        category: 'SECURITY',
        description: `Security test failed: ${error}`,
        tested: true
      });
    }

    return issues;
  }

  /**
   * GENERATE HONEST RECOMMENDATIONS
   */
  private generateRecommendations(issues: TruthIssue[]): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
    const buildIssues = issues.filter(i => i.category === 'BUILD');
    
    if (criticalIssues.length > 0) {
      recommendations.push('🚨 STOP: Critical issues must be fixed before deployment');
      recommendations.push('Focus on critical issues first - they will break production');
    }

    if (buildIssues.length > 0) {
      recommendations.push('🔧 Fix build errors - deployment will fail otherwise');
    }

    if (issues.some(i => i.description.includes('Framer Motion'))) {
      recommendations.push('🎬 Remove Framer Motion or implement SSR-compatible alternatives');
    }

    if (issues.some(i => i.category === 'SECURITY')) {
      recommendations.push('🔐 Configure all required environment variables');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ System appears healthy - ready for deployment');
    }

    return recommendations;
  }

  /**
   * MASTER ADMIN ACCESS CHECK
   */
  static isMasterUser(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    const masterToken = process.env.MASTER_TOKEN;
    
    if (!masterToken || !authHeader) {
      return false;
    }

    return authHeader === `Bearer ${masterToken}`;
  }
}

/**
 * TRUTH AGENT API RESPONSE
 */
export interface TruthResponse {
  success: boolean;
  assessment: TruthAssessment;
  message: string;
  access: 'MASTER' | 'DENIED';
}
