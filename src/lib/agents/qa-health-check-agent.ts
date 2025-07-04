// src/lib/agents/qa-health-check-agent.ts
// QA Health Check Agent - Systematic platform analysis and issue detection

import { AgentEnhancementFramework, AgentPersonality } from './agent-enhancement-framework';

export interface HealthCheckResult {
  category: string;
  status: 'critical' | 'warning' | 'info' | 'success';
  issue: string;
  location: string;
  recommendation: string;
  priority: number; // 1-10, 10 being most critical
}

export interface PlatformHealthReport {
  overallHealth: number; // 0-100
  criticalIssues: number;
  warnings: number;
  recommendations: number;
  checks: HealthCheckResult[];
  summary: string;
}

export class QAHealthCheckAgent {
  private agentId = 'qa-health-check-specialist';
  private memory: any;
  private errorPrevention: any;
  private qualitySystem: any;

  constructor() {
    // Initialize enhanced agent capabilities
    this.memory = AgentEnhancementFramework.createMemorySystem(this.agentId);
    this.errorPrevention = AgentEnhancementFramework.createErrorPreventionSystem();
    this.qualitySystem = AgentEnhancementFramework.createQualitySystem(this.getPersonality());
  }

  private getPersonality(): AgentPersonality {
    return {
      id: this.agentId,
      name: 'QAHealthCheckAgent',
      role: 'Quality Assurance & Platform Health Specialist',
      coreTraits: ['meticulous', 'systematic', 'thorough', 'analytical', 'proactive'],
      communicationStyle: {
        tone: 'professional',
        verbosity: 'comprehensive',
        empathy: 'medium',
        assertiveness: 'high',
        personalization: false
      },
      expertise: [
        { domain: 'Quality Assurance', proficiencyLevel: 10, lastUpdated: new Date(), sources: ['Industry Best Practices'], validationMethod: 'continuous_testing' },
        { domain: 'Web Standards', proficiencyLevel: 9, lastUpdated: new Date(), sources: ['W3C', 'MDN'], validationMethod: 'compliance_testing' },
        { domain: 'Performance Optimization', proficiencyLevel: 8, lastUpdated: new Date(), sources: ['Google PageSpeed', 'WebVitals'], validationMethod: 'performance_metrics' },
        { domain: 'Security Analysis', proficiencyLevel: 9, lastUpdated: new Date(), sources: ['OWASP', 'Security Best Practices'], validationMethod: 'vulnerability_scanning' }
      ],
      learningCapabilities: [
        { type: 'pattern_recognition', mechanism: 'issue_pattern_analysis', frequency: 'continuous', retentionStrategy: 'defect_database' },
        { type: 'outcome_analysis', mechanism: 'fix_effectiveness_tracking', frequency: 'daily', retentionStrategy: 'solution_optimization' }
      ],
      qualityControls: [
        { type: 'self_validation', metrics: ['check_coverage', 'false_positive_rate'], thresholds: { 'coverage': 95, 'false_positives': 5 }, improvementActions: ['refine_detection_algorithms'] }
      ],
      collaborationStyle: {
        preferredPartners: ['DeploymentValidatorAgent', 'PerformanceAgent', 'SecurityAgent'],
        communicationProtocols: ['detailed_reports', 'prioritized_recommendations'],
        knowledgeSharing: true,
        conflictResolution: 'evidence_based_discussion'
      },
      adaptationMechanisms: [
        { trigger: 'recurring_false_positive', response: 'refine_detection_logic', learningFromOutcome: true, permanence: 'persistent' },
        { trigger: 'missed_critical_issue', response: 'expand_check_coverage', learningFromOutcome: true, permanence: 'persistent' }
      ]
    };
  }

  async performComprehensiveHealthCheck(projectRoot: string = process.cwd()): Promise<PlatformHealthReport> {
    const checks: HealthCheckResult[] = [];
    
    console.log('🔍 QA Health Check Agent: Initiating comprehensive platform analysis...\n');

    // 1. ROUTING & NAVIGATION ANALYSIS
    console.log('📍 Analyzing routing and navigation...');
    checks.push(...await this.checkRouting(projectRoot));

    // 2. COMPONENT DEPENDENCIES ANALYSIS
    console.log('🧩 Analyzing component dependencies...');
    checks.push(...await this.checkComponentDependencies(projectRoot));

    // 3. API ENDPOINTS HEALTH CHECK
    console.log('🔗 Analyzing API endpoints...');
    checks.push(...await this.checkAPIEndpoints(projectRoot));

    // 4. UI/UX CONSISTENCY CHECK
    console.log('🎨 Analyzing UI/UX consistency...');
    checks.push(...await this.checkUIConsistency(projectRoot));

    // 5. SECURITY & AUTHENTICATION CHECK
    console.log('🔒 Analyzing security and authentication...');
    checks.push(...await this.checkSecurity(projectRoot));

    // 6. PERFORMANCE & OPTIMIZATION CHECK
    console.log('⚡ Analyzing performance and optimization...');
    checks.push(...await this.checkPerformance(projectRoot));

    // 7. ACCESSIBILITY COMPLIANCE CHECK
    console.log('♿ Analyzing accessibility compliance...');
    checks.push(...await this.checkAccessibility(projectRoot));

    // 8. SEO & META DATA CHECK
    console.log('📈 Analyzing SEO and metadata...');
    checks.push(...await this.checkSEO(projectRoot));

    // 9. DATABASE & DATA INTEGRITY CHECK
    console.log('🗄️ Analyzing database and data integrity...');
    checks.push(...await this.checkDataIntegrity(projectRoot));

    // 10. DEPLOYMENT & CONFIGURATION CHECK
    console.log('🚀 Analyzing deployment and configuration...');
    checks.push(...await this.checkDeploymentConfig(projectRoot));

    // Calculate overall health score
    const report = this.generateHealthReport(checks);
    
    // Learn from this health check for future improvements
    this.memory.learnFromOutcome(
      { type: 'health_check', checks: checks.length },
      { criticalIssues: report.criticalIssues, warnings: report.warnings },
      report.overallHealth
    );

    return report;
  }

  private async checkRouting(projectRoot: string): Promise<HealthCheckResult[]> {
    const checks: HealthCheckResult[] = [];
    
    // Check for route file structure
    const appDir = `${projectRoot}/src/app`;
    const routes = [
      { path: '/', file: `${appDir}/page.tsx`, required: true },
      { path: '/dashboard', file: `${appDir}/dashboard/page.tsx`, required: true },
      { path: '/projects', file: `${appDir}/projects/page.tsx`, required: true },
      { path: '/settings', file: `${appDir}/settings/page.tsx`, required: true },
      { path: '/approval-center', file: `${appDir}/(app)/approval-center/page.tsx`, required: true },
      { path: '/contact', file: `${appDir}/(app)/contact/page.tsx`, required: true },
      { path: '/features', file: `${appDir}/(app)/features/page.tsx`, required: true },
      { path: '/pricing', file: `${appDir}/(app)/pricing/page.tsx`, required: true },
      { path: '/terms', file: `${appDir}/terms/page.tsx`, required: true },
      { path: '/privacy', file: `${appDir}/privacy/page.tsx`, required: true },
    ];

    for (const route of routes) {
      try {
        const fs = require('fs');
        if (fs.existsSync(route.file)) {
          checks.push({
            category: 'Routing',
            status: 'success',
            issue: `Route ${route.path} properly configured`,
            location: route.file,
            recommendation: 'Continue monitoring route performance',
            priority: 1
          });
        } else if (route.required) {
          checks.push({
            category: 'Routing',
            status: 'critical',
            issue: `Missing required route: ${route.path}`,
            location: route.file,
            recommendation: `Create missing page component at ${route.file}`,
            priority: 9
          });
        }
      } catch (error) {
        checks.push({
          category: 'Routing',
          status: 'warning',
          issue: `Unable to verify route: ${route.path}`,
          location: route.file,
          recommendation: 'Manually verify route accessibility',
          priority: 5
        });
      }
    }

    // Check for layout files
    const layouts = [
      { file: `${appDir}/layout.tsx`, required: true },
      { file: `${appDir}/(app)/layout.tsx`, required: true },
    ];

    for (const layout of layouts) {
      try {
        const fs = require('fs');
        if (fs.existsSync(layout.file)) {
          checks.push({
            category: 'Routing',
            status: 'success',
            issue: `Layout file properly configured`,
            location: layout.file,
            recommendation: 'Ensure layout includes all necessary providers',
            priority: 2
          });
        } else if (layout.required) {
          checks.push({
            category: 'Routing',
            status: 'critical',
            issue: `Missing required layout file`,
            location: layout.file,
            recommendation: `Create layout file at ${layout.file}`,
            priority: 10
          });
        }
      } catch (error) {
        checks.push({
          category: 'Routing',
          status: 'warning',
          issue: `Unable to verify layout file`,
          location: layout.file,
          recommendation: 'Manually verify layout configuration',
          priority: 6
        });
      }
    }

    return checks;
  }

  private async checkComponentDependencies(projectRoot: string): Promise<HealthCheckResult[]> {
    const checks: HealthCheckResult[] = [];
    
    // Check for essential UI components
    const requiredComponents = [
      { name: 'Button', file: `${projectRoot}/src/components/ui/button.tsx`, critical: true },
      { name: 'Card', file: `${projectRoot}/src/components/ui/card.tsx`, critical: true },
      { name: 'LoadingSpinner', file: `${projectRoot}/src/components/ui/loading-spinner.tsx`, critical: true },
      { name: 'Badge', file: `${projectRoot}/src/components/ui/badge.tsx`, critical: true },
      { name: 'Tabs', file: `${projectRoot}/src/components/ui/tabs.tsx`, critical: true },
    ];

    for (const component of requiredComponents) {
      try {
        const fs = require('fs');
        if (fs.existsSync(component.file)) {
          // Check if component exports are properly structured
          const content = fs.readFileSync(component.file, 'utf-8');
          if (content.includes('export') && content.includes('interface')) {
            checks.push({
              category: 'Components',
              status: 'success',
              issue: `${component.name} component properly implemented`,
              location: component.file,
              recommendation: 'Consider adding more variant options if needed',
              priority: 1
            });
          } else {
            checks.push({
              category: 'Components',
              status: 'warning',
              issue: `${component.name} component may lack proper TypeScript interfaces`,
              location: component.file,
              recommendation: 'Add proper TypeScript interfaces and exports',
              priority: 4
            });
          }
        } else if (component.critical) {
          checks.push({
            category: 'Components',
            status: 'critical',
            issue: `Missing critical UI component: ${component.name}`,
            location: component.file,
            recommendation: `Create ${component.name} component with proper TypeScript interfaces`,
            priority: 8
          });
        }
      } catch (error) {
        checks.push({
          category: 'Components',
          status: 'warning',
          issue: `Unable to verify ${component.name} component`,
          location: component.file,
          recommendation: 'Manually verify component implementation',
          priority: 5
        });
      }
    }

    return checks;
  }

  private async checkAPIEndpoints(projectRoot: string): Promise<HealthCheckResult[]> {
    const checks: HealthCheckResult[] = [];
    
    // Check for essential API endpoints
    const apiEndpoints = [
      { path: '/api/auth', file: `${projectRoot}/src/app/api/auth`, required: true },
      { path: '/api/agents/delegate', file: `${projectRoot}/src/app/api/agents/delegate/route.ts`, required: true },
      { path: '/api/approvals/pending', file: `${projectRoot}/src/app/api/approvals/pending/route.ts`, required: true },
      { path: '/api/presence/gmb/business', file: `${projectRoot}/src/app/api/presence/gmb/business/route.ts`, required: true },
      { path: '/api/analysis/website/scan', file: `${projectRoot}/src/app/api/analysis/website/scan/route.ts`, required: true },
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const fs = require('fs');
        if (fs.existsSync(endpoint.file)) {
          const content = fs.readFileSync(endpoint.file, 'utf-8');
          
          // Check for proper HTTP methods
          const hasMethods = ['GET', 'POST', 'PUT', 'DELETE'].some(method => content.includes(`export async function ${method}`));
          
          if (hasMethods) {
            checks.push({
              category: 'API',
              status: 'success',
              issue: `API endpoint ${endpoint.path} properly implemented`,
              location: endpoint.file,
              recommendation: 'Ensure proper error handling and validation',
              priority: 2
            });
          } else {
            checks.push({
              category: 'API',
              status: 'warning',
              issue: `API endpoint ${endpoint.path} may lack proper HTTP method exports`,
              location: endpoint.file,
              recommendation: 'Add proper GET, POST, etc. method exports',
              priority: 6
            });
          }
        } else if (endpoint.required) {
          checks.push({
            category: 'API',
            status: 'critical',
            issue: `Missing required API endpoint: ${endpoint.path}`,
            location: endpoint.file,
            recommendation: `Create API route at ${endpoint.file}`,
            priority: 9
          });
        }
      } catch (error) {
        checks.push({
          category: 'API',
          status: 'warning',
          issue: `Unable to verify API endpoint: ${endpoint.path}`,
          location: endpoint.file,
          recommendation: 'Manually verify API endpoint functionality',
          priority: 5
        });
      }
    }

    return checks;
  }

  private async checkUIConsistency(projectRoot: string): Promise<HealthCheckResult[]> {
    const checks: HealthCheckResult[] = [];
    
    // Check for global styles
    const globalStyles = `${projectRoot}/src/app/globals.css`;
    try {
      const fs = require('fs');
      if (fs.existsSync(globalStyles)) {
        const content = fs.readFileSync(globalStyles, 'utf-8');
        
        if (content.includes('@tailwind base') && content.includes('@tailwind components')) {
          checks.push({
            category: 'UI/UX',
            status: 'success',
            issue: 'Global styles properly configured with Tailwind CSS',
            location: globalStyles,
            recommendation: 'Consider adding custom CSS variables for brand consistency',
            priority: 2
          });
        } else {
          checks.push({
            category: 'UI/UX',
            status: 'warning',
            issue: 'Global styles may be missing Tailwind CSS directives',
            location: globalStyles,
            recommendation: 'Ensure @tailwind directives are properly included',
            priority: 4
          });
        }
      } else {
        checks.push({
          category: 'UI/UX',
          status: 'critical',
          issue: 'Missing global styles file',
          location: globalStyles,
          recommendation: 'Create globals.css with proper Tailwind configuration',
          priority: 7
        });
      }
    } catch (error) {
      checks.push({
        category: 'UI/UX',
        status: 'warning',
        issue: 'Unable to verify global styles',
        location: globalStyles,
        recommendation: 'Manually verify global styles configuration',
        priority: 5
      });
    }

    // Check Tailwind config
    const tailwindConfig = `${projectRoot}/tailwind.config.js`;
    try {
      const fs = require('fs');
      if (fs.existsSync(tailwindConfig)) {
        checks.push({
          category: 'UI/UX',
          status: 'success',
          issue: 'Tailwind CSS configuration file present',
          location: tailwindConfig,
          recommendation: 'Ensure all component paths are included in content array',
          priority: 2
        });
      } else {
        checks.push({
          category: 'UI/UX',
          status: 'critical',
          issue: 'Missing Tailwind CSS configuration',
          location: tailwindConfig,
          recommendation: 'Create tailwind.config.js with proper content paths',
          priority: 8
        });
      }
    } catch (error) {
      checks.push({
        category: 'UI/UX',
        status: 'warning',
        issue: 'Unable to verify Tailwind configuration',
        location: tailwindConfig,
        recommendation: 'Manually verify Tailwind setup',
        priority: 5
      });
    }

    return checks;
  }

  private async checkSecurity(projectRoot: string): Promise<HealthCheckResult[]> {
    const checks: HealthCheckResult[] = [];
    
    // Check for environment variables
    const envFile = `${projectRoot}/.env`;
    try {
      const fs = require('fs');
      if (fs.existsSync(envFile)) {
        checks.push({
          category: 'Security',
          status: 'info',
          issue: 'Environment variables file present',
          location: envFile,
          recommendation: 'Ensure sensitive variables are not committed to version control',
          priority: 3
        });
      } else {
        checks.push({
          category: 'Security',
          status: 'warning',
          issue: 'No environment variables file found',
          location: envFile,
          recommendation: 'Create .env file for environment-specific configuration',
          priority: 5
        });
      }
    } catch (error) {
      checks.push({
        category: 'Security',
        status: 'warning',
        issue: 'Unable to verify environment variables',
        location: envFile,
        recommendation: 'Manually verify environment configuration',
        priority: 5
      });
    }

    // Check for middleware
    const middleware = `${projectRoot}/src/middleware.ts`;
    try {
      const fs = require('fs');
      if (fs.existsSync(middleware)) {
        const content = fs.readFileSync(middleware, 'utf-8');
        if (content.includes('auth') || content.includes('protected')) {
          checks.push({
            category: 'Security',
            status: 'success',
            issue: 'Authentication middleware properly configured',
            location: middleware,
            recommendation: 'Regularly review and update authentication logic',
            priority: 2
          });
        } else {
          checks.push({
            category: 'Security',
            status: 'warning',
            issue: 'Middleware exists but may lack authentication protection',
            location: middleware,
            recommendation: 'Add proper authentication checks to middleware',
            priority: 6
          });
        }
      } else {
        checks.push({
          category: 'Security',
          status: 'critical',
          issue: 'No authentication middleware found',
          location: middleware,
          recommendation: 'Create middleware.ts with proper authentication protection',
          priority: 9
        });
      }
    } catch (error) {
      checks.push({
        category: 'Security',
        status: 'warning',
        issue: 'Unable to verify authentication middleware',
        location: middleware,
        recommendation: 'Manually verify authentication setup',
        priority: 6
      });
    }

    return checks;
  }

  private async checkPerformance(projectRoot: string): Promise<HealthCheckResult[]> {
    const checks: HealthCheckResult[] = [];
    
    // Check Next.js config
    const nextConfig = `${projectRoot}/next.config.js`;
    try {
      const fs = require('fs');
      if (fs.existsSync(nextConfig)) {
        const content = fs.readFileSync(nextConfig, 'utf-8');
        
        if (content.includes('images') && content.includes('domains')) {
          checks.push({
            category: 'Performance',
            status: 'success',
            issue: 'Next.js configuration includes image optimization',
            location: nextConfig,
            recommendation: 'Consider enabling more performance optimizations',
            priority: 2
          });
        } else {
          checks.push({
            category: 'Performance',
            status: 'info',
            issue: 'Next.js configuration could benefit from image optimization settings',
            location: nextConfig,
            recommendation: 'Add image domains and optimization settings to next.config.js',
            priority: 3
          });
        }
      } else {
        checks.push({
          category: 'Performance',
          status: 'warning',
          issue: 'No Next.js configuration file found',
          location: nextConfig,
          recommendation: 'Create next.config.js with performance optimizations',
          priority: 4
        });
      }
    } catch (error) {
      checks.push({
        category: 'Performance',
        status: 'warning',
        issue: 'Unable to verify Next.js configuration',
        location: nextConfig,
        recommendation: 'Manually verify Next.js setup',
        priority: 4
      });
    }

    return checks;
  }

  private async checkAccessibility(projectRoot: string): Promise<HealthCheckResult[]> {
    const checks: HealthCheckResult[] = [];
    
    // Check for common accessibility patterns in components
    const componentDirs = [`${projectRoot}/src/components`, `${projectRoot}/src/app`];
    
    checks.push({
      category: 'Accessibility',
      status: 'info',
      issue: 'Accessibility check requires manual review of components',
      location: 'src/components/**/*.tsx',
      recommendation: 'Ensure all interactive elements have proper ARIA labels, keyboard navigation, and semantic HTML',
      priority: 4
    });

    return checks;
  }

  private async checkSEO(projectRoot: string): Promise<HealthCheckResult[]> {
    const checks: HealthCheckResult[] = [];
    
    // Check for manifest.json
    const manifest = `${projectRoot}/public/manifest.json`;
    try {
      const fs = require('fs');
      if (fs.existsSync(manifest)) {
        checks.push({
          category: 'SEO',
          status: 'success',
          issue: 'PWA manifest file present',
          location: manifest,
          recommendation: 'Ensure manifest includes all required PWA properties',
          priority: 2
        });
      } else {
        checks.push({
          category: 'SEO',
          status: 'warning',
          issue: 'Missing PWA manifest file',
          location: manifest,
          recommendation: 'Create manifest.json for PWA compatibility and better SEO',
          priority: 4
        });
      }
    } catch (error) {
      checks.push({
        category: 'SEO',
        status: 'warning',
        issue: 'Unable to verify manifest file',
        location: manifest,
        recommendation: 'Manually verify PWA manifest setup',
        priority: 4
      });
    }

    return checks;
  }

  private async checkDataIntegrity(projectRoot: string): Promise<HealthCheckResult[]> {
    const checks: HealthCheckResult[] = [];
    
    // Check Prisma schema
    const prismaSchema = `${projectRoot}/prisma/schema.prisma`;
    try {
      const fs = require('fs');
      if (fs.existsSync(prismaSchema)) {
        const content = fs.readFileSync(prismaSchema, 'utf-8');
        
        if (content.includes('model User') && content.includes('model Mission')) {
          checks.push({
            category: 'Database',
            status: 'success',
            issue: 'Prisma schema includes essential models',
            location: prismaSchema,
            recommendation: 'Ensure all model relationships are properly defined',
            priority: 2
          });
        } else {
          checks.push({
            category: 'Database',
            status: 'warning',
            issue: 'Prisma schema may be missing essential models',
            location: prismaSchema,
            recommendation: 'Add missing User, Mission, and other core models to schema',
            priority: 6
          });
        }
      } else {
        checks.push({
          category: 'Database',
          status: 'critical',
          issue: 'Missing Prisma schema file',
          location: prismaSchema,
          recommendation: 'Create prisma/schema.prisma with proper database models',
          priority: 9
        });
      }
    } catch (error) {
      checks.push({
        category: 'Database',
        status: 'warning',
        issue: 'Unable to verify Prisma schema',
        location: prismaSchema,
        recommendation: 'Manually verify database schema setup',
        priority: 6
      });
    }

    return checks;
  }

  private async checkDeploymentConfig(projectRoot: string): Promise<HealthCheckResult[]> {
    const checks: HealthCheckResult[] = [];
    
    // Check for deployment configuration
    const vercelConfig = `${projectRoot}/vercel.json`;
    try {
      const fs = require('fs');
      if (fs.existsSync(vercelConfig)) {
        checks.push({
          category: 'Deployment',
          status: 'success',
          issue: 'Vercel deployment configuration present',
          location: vercelConfig,
          recommendation: 'Ensure build settings are optimized for production',
          priority: 2
        });
      } else {
        checks.push({
          category: 'Deployment',
          status: 'info',
          issue: 'No Vercel configuration found',
          location: vercelConfig,
          recommendation: 'Consider adding vercel.json for deployment customization',
          priority: 3
        });
      }
    } catch (error) {
      checks.push({
        category: 'Deployment',
        status: 'info',
        issue: 'Unable to verify Vercel configuration',
        location: vercelConfig,
        recommendation: 'Manually verify deployment settings',
        priority: 3
      });
    }

    // Check package.json
    const packageJson = `${projectRoot}/package.json`;
    try {
      const fs = require('fs');
      if (fs.existsSync(packageJson)) {
        const content = fs.readFileSync(packageJson, 'utf-8');
        const pkg = JSON.parse(content);
        
        if (pkg.scripts && pkg.scripts.build && pkg.scripts.dev) {
          checks.push({
            category: 'Deployment',
            status: 'success',
            issue: 'Package.json includes essential build scripts',
            location: packageJson,
            recommendation: 'Consider adding additional deployment scripts if needed',
            priority: 1
          });
        } else {
          checks.push({
            category: 'Deployment',
            status: 'warning',
            issue: 'Package.json may be missing essential build scripts',
            location: packageJson,
            recommendation: 'Add proper build and dev scripts to package.json',
            priority: 5
          });
        }
      } else {
        checks.push({
          category: 'Deployment',
          status: 'critical',
          issue: 'Missing package.json file',
          location: packageJson,
          recommendation: 'Initialize project with npm init and add dependencies',
          priority: 10
        });
      }
    } catch (error) {
      checks.push({
        category: 'Deployment',
        status: 'warning',
        issue: 'Unable to verify package.json',
        location: packageJson,
        recommendation: 'Manually verify package configuration',
        priority: 5
      });
    }

    return checks;
  }

  private generateHealthReport(checks: HealthCheckResult[]): PlatformHealthReport {
    const criticalIssues = checks.filter(c => c.status === 'critical').length;
    const warnings = checks.filter(c => c.status === 'warning').length;
    const recommendations = checks.filter(c => c.status === 'info').length;
    const successes = checks.filter(c => c.status === 'success').length;

    // Calculate overall health score (0-100)
    const totalChecks = checks.length;
    const weightedScore = (successes * 100 + recommendations * 75 + warnings * 25 + criticalIssues * 0) / totalChecks;
    const overallHealth = Math.round(weightedScore);

    // Generate summary
    let summary = '';
    if (overallHealth >= 90) {
      summary = '🟢 EXCELLENT: Platform is in excellent health with minimal issues.';
    } else if (overallHealth >= 75) {
      summary = '🟡 GOOD: Platform is in good health with some minor improvements needed.';
    } else if (overallHealth >= 50) {
      summary = '🟠 FAIR: Platform has moderate issues that should be addressed.';
    } else {
      summary = '🔴 CRITICAL: Platform has serious issues requiring immediate attention.';
    }

    return {
      overallHealth,
      criticalIssues,
      warnings,
      recommendations,
      checks: checks.sort((a, b) => b.priority - a.priority), // Sort by priority
      summary
    };
  }

  generateDetailedReport(report: PlatformHealthReport): string {
    let output = '\n';
    output += '═══════════════════════════════════════════════════════════════\n';
    output += '🔍 QA HEALTH CHECK AGENT - COMPREHENSIVE PLATFORM ANALYSIS\n';
    output += '═══════════════════════════════════════════════════════════════\n\n';
    
    output += `📊 OVERALL HEALTH SCORE: ${report.overallHealth}/100\n`;
    output += `${report.summary}\n\n`;
    
    output += `📈 ISSUE BREAKDOWN:\n`;
    output += `   🔴 Critical Issues: ${report.criticalIssues}\n`;
    output += `   🟡 Warnings: ${report.warnings}\n`;
    output += `   🔵 Recommendations: ${report.recommendations}\n`;
    output += `   🟢 Successful Checks: ${report.checks.filter(c => c.status === 'success').length}\n\n`;
    
    // Group checks by category
    const categories = Array.from(new Set(report.checks.map(c => c.category)));
    
    for (const category of categories) {
      const categoryChecks = report.checks.filter(c => c.category === category);
      output += `🔍 ${category.toUpperCase()} ANALYSIS:\n`;
      output += '─'.repeat(50) + '\n';
      
      for (const check of categoryChecks) {
        const statusIcon = {
          'critical': '🔴',
          'warning': '🟡', 
          'info': '🔵',
          'success': '🟢'
        }[check.status];
        
        output += `${statusIcon} ${check.issue}\n`;
        output += `   📍 Location: ${check.location}\n`;
        output += `   💡 Recommendation: ${check.recommendation}\n`;
        output += `   ⚡ Priority: ${check.priority}/10\n\n`;
      }
    }
    
    output += '═══════════════════════════════════════════════════════════════\n';
    output += '🎯 NEXT STEPS:\n';
    output += '1. Address critical issues immediately\n';
    output += '2. Schedule fixes for warnings based on priority\n';
    output += '3. Implement recommendations for optimization\n';
    output += '4. Re-run health check after fixes\n';
    output += '═══════════════════════════════════════════════════════════════\n';
    
    return output;
  }
}
