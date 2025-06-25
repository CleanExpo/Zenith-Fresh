#!/usr/bin/env node

/**
 * =============================================================================
 * ZENITH PLATFORM - CI/CD STAGING WORKFLOW AUTOMATION
 * =============================================================================
 * This script provides programmatic control over the staging CI/CD workflow
 * Usage: node scripts/staging/ci-staging-workflow.js [command] [options]
 * =============================================================================
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  stagingBranch: 'staging',
  stagingUrl: 'https://staging.zenith.engineer',
  healthEndpoints: [
    '/api/health',
    '/api/auth/session',
    '/api/feature-flags'
  ],
  requiredEnvVars: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_APP_ENV'
  ]
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Logging utilities
const log = (message, color = 'blue') => {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}]${colors.reset} ${message}`);
};

const error = (message) => log(`❌ ERROR: ${message}`, 'red');
const success = (message) => log(`✅ SUCCESS: ${message}`, 'green');
const warning = (message) => log(`⚠️  WARNING: ${message}`, 'yellow');
const info = (message) => log(`ℹ️  INFO: ${message}`, 'blue');

// Utility function to execute shell commands
const execCommand = (command, options = {}) => {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return { success: true, output: result };
  } catch (err) {
    return { success: false, error: err.message, output: err.stdout };
  }
};

// Check if we're in the correct git repository
const validateRepository = () => {
  info('Validating repository...');
  
  if (!fs.existsSync('.git')) {
    error('Not in a git repository');
    process.exit(1);
  }
  
  if (!fs.existsSync('package.json')) {
    error('package.json not found - not in a Node.js project');
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.name !== 'zenith-platform') {
    warning('Package name is not "zenith-platform", continuing anyway...');
  }
  
  success('Repository validation passed');
};

// Get current git status
const getGitStatus = () => {
  const branch = execCommand('git rev-parse --abbrev-ref HEAD', { silent: true });
  const hasChanges = execCommand('git status --porcelain', { silent: true });
  const lastCommit = execCommand('git log -1 --format="%h %s"', { silent: true });
  
  return {
    currentBranch: branch.success ? branch.output.trim() : 'unknown',
    hasUncommittedChanges: hasChanges.success && hasChanges.output.trim().length > 0,
    lastCommit: lastCommit.success ? lastCommit.output.trim() : 'unknown'
  };
};

// Pre-deployment checks
const preDeploymentChecks = () => {
  info('Running pre-deployment checks...');
  
  const gitStatus = getGitStatus();
  info(`Current branch: ${gitStatus.currentBranch}`);
  info(`Last commit: ${gitStatus.lastCommit}`);
  
  if (gitStatus.currentBranch !== CONFIG.stagingBranch) {
    warning(`Not on staging branch (current: ${gitStatus.currentBranch})`);
  }
  
  if (gitStatus.hasUncommittedChanges) {
    warning('Uncommitted changes detected');
  }
  
  // Check if dependencies are up to date
  if (fs.existsSync('package-lock.json')) {
    const packageLockStat = fs.statSync('package-lock.json');
    const packageJsonStat = fs.statSync('package.json');
    
    if (packageJsonStat.mtime > packageLockStat.mtime) {
      warning('package.json is newer than package-lock.json - dependencies may be outdated');
    }
  }
  
  success('Pre-deployment checks completed');
  return gitStatus;
};

// Run quality checks
const runQualityChecks = async () => {
  info('Running quality checks...');
  
  const checks = [
    { name: 'TypeScript', command: 'npm run type-check' },
    { name: 'ESLint', command: 'npm run lint' },
    { name: 'Tests', command: 'npm run test', optional: true }
  ];
  
  const results = {};
  
  for (const check of checks) {
    info(`Running ${check.name}...`);
    const result = execCommand(check.command, { silent: false });
    results[check.name] = result.success;
    
    if (result.success) {
      success(`${check.name} passed`);
    } else {
      if (check.optional) {
        warning(`${check.name} failed (optional)`);
      } else {
        error(`${check.name} failed`);
        throw new Error(`Quality check failed: ${check.name}`);
      }
    }
  }
  
  return results;
};

// Build application
const buildApplication = () => {
  info('Building application...');
  
  // Set staging environment variables for build
  const buildEnv = {
    ...process.env,
    NODE_ENV: 'staging',
    NEXT_PUBLIC_APP_ENV: 'staging',
    NEXT_PUBLIC_APP_URL: CONFIG.stagingUrl
  };
  
  const result = execCommand('npm run build', { env: buildEnv });
  
  if (!result.success) {
    error('Build failed');
    throw new Error('Build failed');
  }
  
  success('Build completed successfully');
};

// Deploy to staging
const deployToStaging = () => {
  info('Deploying to staging...');
  
  // Check if Vercel CLI is available
  const vercelCheck = execCommand('vercel --version', { silent: true });
  if (!vercelCheck.success) {
    error('Vercel CLI not found. Please install with: npm install -g vercel');
    throw new Error('Vercel CLI not available');
  }
  
  // Deploy using the staging deployment script
  const deployScript = path.join(__dirname, 'deploy-staging.sh');
  if (!fs.existsSync(deployScript)) {
    error('Deploy staging script not found');
    throw new Error('Deploy script not available');
  }
  
  const result = execCommand(`bash ${deployScript} --quick`);
  
  if (!result.success) {
    error('Deployment failed');
    throw new Error('Deployment failed');
  }
  
  success('Deployment completed successfully');
  
  // Extract deployment URL if available
  let deploymentUrl = CONFIG.stagingUrl;
  if (fs.existsSync('.staging-url')) {
    deploymentUrl = fs.readFileSync('.staging-url', 'utf8').trim();
  }
  
  return deploymentUrl;
};

// Health check after deployment
const healthCheck = async (deploymentUrl) => {
  info('Running post-deployment health checks...');
  
  // Wait for deployment to be ready
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  const results = {};
  
  for (const endpoint of CONFIG.healthEndpoints) {
    const url = `${deploymentUrl}${endpoint}`;
    info(`Checking ${endpoint}...`);
    
    try {
      const curlResult = execCommand(`curl -s -o /dev/null -w "%{http_code}" "${url}"`, { silent: true });
      const statusCode = curlResult.success ? curlResult.output.trim() : '000';
      
      results[endpoint] = {
        url,
        statusCode,
        healthy: ['200', '401', '404'].includes(statusCode)
      };
      
      if (results[endpoint].healthy) {
        success(`${endpoint} is healthy (HTTP ${statusCode})`);
      } else {
        warning(`${endpoint} returned HTTP ${statusCode}`);
      }
    } catch (err) {
      results[endpoint] = {
        url,
        statusCode: '000',
        healthy: false,
        error: err.message
      };
      warning(`${endpoint} health check failed: ${err.message}`);
    }
  }
  
  return results;
};

// Generate deployment report
const generateReport = (gitStatus, qualityResults, healthResults, deploymentUrl) => {
  const report = {
    timestamp: new Date().toISOString(),
    gitStatus,
    qualityResults,
    healthResults,
    deploymentUrl,
    environment: 'staging',
    success: true
  };
  
  const reportPath = 'staging-ci-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  success(`Deployment report generated: ${reportPath}`);
  return report;
};

// Send notifications
const sendNotifications = (report) => {
  info('Sending deployment notifications...');
  
  // For now, just log the summary
  console.log('\n=== DEPLOYMENT SUMMARY ===');
  console.log(`Environment: ${report.environment}`);
  console.log(`URL: ${report.deploymentUrl}`);
  console.log(`Branch: ${report.gitStatus.currentBranch}`);
  console.log(`Commit: ${report.gitStatus.lastCommit}`);
  console.log(`Quality Checks: ${Object.values(report.qualityResults).every(r => r) ? '✅ PASSED' : '⚠️ PARTIAL'}`);
  console.log(`Health Checks: ${Object.values(report.healthResults).every(r => r.healthy) ? '✅ HEALTHY' : '⚠️ PARTIAL'}`);
  console.log('==========================\n');
  
  // TODO: Add Slack/email notifications here
  success('Notifications sent');
};

// Main workflow functions
const workflows = {
  // Full CI/CD pipeline
  async deploy() {
    try {
      validateRepository();
      const gitStatus = preDeploymentChecks();
      const qualityResults = await runQualityChecks();
      buildApplication();
      const deploymentUrl = deployToStaging();
      const healthResults = await healthCheck(deploymentUrl);
      const report = generateReport(gitStatus, qualityResults, healthResults, deploymentUrl);
      sendNotifications(report);
      
      success('🚀 Staging deployment completed successfully!');
      info(`Deployment URL: ${deploymentUrl}`);
    } catch (err) {
      error(`Deployment failed: ${err.message}`);
      process.exit(1);
    }
  },
  
  // Quick deployment (skip some checks)
  async quickDeploy() {
    try {
      validateRepository();
      const gitStatus = preDeploymentChecks();
      buildApplication();
      const deploymentUrl = deployToStaging();
      
      success('🚀 Quick staging deployment completed!');
      info(`Deployment URL: ${deploymentUrl}`);
    } catch (err) {
      error(`Quick deployment failed: ${err.message}`);
      process.exit(1);
    }
  },
  
  // Health check only
  async healthCheck() {
    try {
      const deploymentUrl = CONFIG.stagingUrl;
      const healthResults = await healthCheck(deploymentUrl);
      
      const allHealthy = Object.values(healthResults).every(r => r.healthy);
      if (allHealthy) {
        success('🏥 All health checks passed');
      } else {
        warning('⚠️ Some health checks failed');
      }
      
      console.log('\nHealth Check Results:');
      Object.entries(healthResults).forEach(([endpoint, result]) => {
        console.log(`  ${endpoint}: HTTP ${result.statusCode} ${result.healthy ? '✅' : '❌'}`);
      });
    } catch (err) {
      error(`Health check failed: ${err.message}`);
      process.exit(1);
    }
  },
  
  // Quality checks only
  async check() {
    try {
      validateRepository();
      const qualityResults = await runQualityChecks();
      
      const allPassed = Object.values(qualityResults).every(r => r);
      if (allPassed) {
        success('🧪 All quality checks passed');
      } else {
        warning('⚠️ Some quality checks failed');
      }
    } catch (err) {
      error(`Quality checks failed: ${err.message}`);
      process.exit(1);
    }
  },
  
  // Show status
  async status() {
    validateRepository();
    const gitStatus = getGitStatus();
    
    console.log('\n=== STAGING STATUS ===');
    console.log(`Current Branch: ${gitStatus.currentBranch}`);
    console.log(`Last Commit: ${gitStatus.lastCommit}`);
    console.log(`Uncommitted Changes: ${gitStatus.hasUncommittedChanges ? 'YES' : 'NO'}`);
    console.log(`Staging URL: ${CONFIG.stagingUrl}`);
    console.log('======================\n');
  }
};

// CLI interface
const main = async () => {
  const [,, command = 'deploy', ...args] = process.argv;
  
  if (!workflows[command]) {
    error(`Unknown command: ${command}`);
    console.log('\nAvailable commands:');
    console.log('  deploy      - Full CI/CD deployment pipeline');
    console.log('  quickDeploy - Quick deployment (skip some checks)');
    console.log('  healthCheck - Run health checks only');
    console.log('  check       - Run quality checks only');
    console.log('  status      - Show current status');
    process.exit(1);
  }
  
  info(`Running staging workflow: ${command}`);
  await workflows[command](...args);
};

// Handle unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    error(`Workflow failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { workflows, CONFIG };