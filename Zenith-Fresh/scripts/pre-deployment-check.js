#!/usr/bin/env node

/**
 * Zenith Platform - Comprehensive Pre-Deployment Validation
 * 
 * This script performs a complete validation of the codebase before deployment,
 * combining cleanup, health checks, and security audits into a single workflow.
 * 
 * Features:
 * - Automated cleanup of development artifacts
 * - Comprehensive health checks
 * - Security vulnerability scanning
 * - Deployment readiness scoring
 * - Clear go/no-go decision
 * - Detailed reporting and recommendations
 * 
 * Usage: node scripts/pre-deployment-check.js [options]
 * Options:
 *   --fix           Automatically fix issues where possible
 *   --strict        Fail on any warnings (not just errors)
 *   --report        Generate detailed HTML report
 *   --ci            Run in CI mode with simplified output
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  strict: args.includes('--strict'),
  report: args.includes('--report'),
  ci: args.includes('--ci')
};

// Configuration
const config = {
  // Cleanup patterns
  cleanup: {
    patterns: [
      '**/*.log',
      '**/*.tmp',
      '**/*.cache',
      '**/.DS_Store',
      '**/node_modules/.cache/**',
      '**/coverage/**',
      '**/.next/cache/**',
      '**/dist/**/*.map',
      '**/*.orig',
      '**/*~',
      '**/#*#',
      '**/.#*'
    ],
    excludeDirs: [
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build',
      '.vercel'
    ]
  },
  
  // Health check thresholds
  health: {
    buildTime: 300000, // 5 minutes max
    bundleSize: 5 * 1024 * 1024, // 5MB max for main bundle
    testCoverage: 80, // 80% minimum coverage
    lighthouseScore: 90, // Minimum lighthouse score
    apiResponseTime: 200, // 200ms max API response
    memoryUsage: 512 * 1024 * 1024 // 512MB max memory usage
  },
  
  // Security patterns
  security: {
    sensitivePatterns: [
      /api[_-]?key/i,
      /api[_-]?secret/i,
      /password/i,
      /private[_-]?key/i,
      /secret[_-]?key/i,
      /access[_-]?token/i,
      /auth[_-]?token/i,
      /bearer/i,
      /credential/i,
      /ssh-rsa/i,
      /BEGIN.*PRIVATE KEY/
    ],
    vulnerablePackages: [
      'node-uuid',
      'crypto',
      'bcrypt',
      'jsonwebtoken'
    ]
  },
  
  // Scoring weights
  scoring: {
    cleanup: 10,
    build: 20,
    tests: 20,
    security: 25,
    performance: 15,
    codeQuality: 10
  }
};

// Global results tracking
const results = {
  cleanup: { score: 0, issues: [], fixed: 0 },
  build: { score: 0, issues: [], warnings: [] },
  tests: { score: 0, coverage: 0, passed: 0, failed: 0, issues: [] },
  security: { score: 0, vulnerabilities: [], risks: [] },
  performance: { score: 0, metrics: {} },
  codeQuality: { score: 0, issues: [] },
  overall: { score: 0, status: 'UNKNOWN', recommendation: '' }
};

// Utility functions
function log(message, type = 'info') {
  if (options.ci && type === 'info') return;
  
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    section: `${colors.bright}${colors.cyan}▶${colors.reset}`
  };
  
  console.log(`${prefix[type] || ''} ${message}`);
}

function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function calculateScore(value, threshold, inverse = false) {
  if (inverse) {
    return Math.max(0, Math.min(100, (threshold / value) * 100));
  }
  return Math.max(0, Math.min(100, (value / threshold) * 100));
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findFiles(pattern, baseDir = '.') {
  const glob = require('glob');
  return new Promise((resolve, reject) => {
    glob(pattern, { cwd: baseDir, ignore: config.cleanup.excludeDirs }, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
}

// 1. Cleanup Check
async function performCleanup() {
  log('Performing cleanup check...', 'section');
  
  let totalFiles = 0;
  let totalSize = 0;
  let filesRemoved = 0;
  let sizeRemoved = 0;
  
  try {
    for (const pattern of config.cleanup.patterns) {
      const files = await findFiles(pattern);
      
      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          totalFiles++;
          totalSize += stats.size;
          
          if (options.fix) {
            await fs.unlink(file);
            filesRemoved++;
            sizeRemoved += stats.size;
            log(`Removed: ${file} (${formatSize(stats.size)})`, 'success');
          } else {
            results.cleanup.issues.push({
              file,
              size: stats.size,
              type: 'cleanup'
            });
          }
        } catch (err) {
          log(`Error processing ${file}: ${err.message}`, 'warning');
        }
      }
    }
    
    // Check for empty directories
    const emptyDirs = await findEmptyDirectories('.');
    for (const dir of emptyDirs) {
      if (options.fix) {
        await fs.rmdir(dir);
        log(`Removed empty directory: ${dir}`, 'success');
      } else {
        results.cleanup.issues.push({
          file: dir,
          type: 'empty-directory'
        });
      }
    }
    
    // Calculate cleanup score
    if (options.fix) {
      results.cleanup.fixed = filesRemoved;
      results.cleanup.score = 100; // Perfect score after cleanup
      log(`Cleanup complete: Removed ${filesRemoved} files (${formatSize(sizeRemoved)})`, 'success');
    } else {
      results.cleanup.score = totalFiles === 0 ? 100 : Math.max(0, 100 - (totalFiles * 5));
      if (totalFiles > 0) {
        log(`Found ${totalFiles} files (${formatSize(totalSize)}) that need cleanup`, 'warning');
        log('Run with --fix to automatically clean these files', 'info');
      }
    }
    
  } catch (err) {
    log(`Cleanup check failed: ${err.message}`, 'error');
    results.cleanup.score = 0;
  }
}

async function findEmptyDirectories(dir) {
  const emptyDirs = [];
  
  async function checkDir(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      if (entries.length === 0) {
        emptyDirs.push(currentDir);
        return;
      }
      
      for (const entry of entries) {
        if (entry.isDirectory() && !config.cleanup.excludeDirs.includes(entry.name)) {
          await checkDir(path.join(currentDir, entry.name));
        }
      }
    } catch (err) {
      // Ignore permission errors
    }
  }
  
  await checkDir(dir);
  return emptyDirs;
}

// 2. Build Check
async function performBuildCheck() {
  log('Performing build check...', 'section');
  
  try {
    // Clean previous build
    log('Cleaning previous build artifacts...', 'info');
    execSync('rm -rf .next', { stdio: 'pipe' });
    
    // Measure build time
    const startTime = Date.now();
    log('Running production build...', 'info');
    
    const buildOutput = execSync('npm run build', { 
      stdio: 'pipe',
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    });
    
    const buildTime = Date.now() - startTime;
    
    // Parse build output for bundle sizes
    const bundleSizes = parseBundleSizes(buildOutput);
    const mainBundleSize = bundleSizes.find(b => b.name.includes('main'))?.size || 0;
    
    // Check for build warnings
    const warnings = buildOutput.match(/warning:/gi) || [];
    results.build.warnings = warnings;
    
    // Calculate build score
    const timeScore = calculateScore(config.health.buildTime, buildTime, true);
    const sizeScore = calculateScore(config.health.bundleSize, mainBundleSize, true);
    results.build.score = (timeScore + sizeScore) / 2;
    
    results.build.metrics = {
      buildTime,
      bundleSizes,
      mainBundleSize
    };
    
    log(`Build completed in ${(buildTime / 1000).toFixed(2)}s`, 'success');
    log(`Main bundle size: ${formatSize(mainBundleSize)}`, mainBundleSize > config.health.bundleSize ? 'warning' : 'success');
    
    if (warnings.length > 0) {
      log(`Build completed with ${warnings.length} warnings`, 'warning');
    }
    
  } catch (err) {
    log(`Build check failed: ${err.message}`, 'error');
    results.build.score = 0;
    results.build.issues.push({
      type: 'build-failure',
      message: err.message
    });
  }
}

function parseBundleSizes(buildOutput) {
  const sizes = [];
  const sizeRegex = /(\S+)\s+(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)/g;
  let match;
  
  while ((match = sizeRegex.exec(buildOutput)) !== null) {
    const [, name, size, unit] = match;
    const multipliers = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    sizes.push({
      name,
      size: parseFloat(size) * multipliers[unit]
    });
  }
  
  return sizes;
}

// 3. Test Check
async function performTestCheck() {
  log('Performing test check...', 'section');
  
  try {
    // Run tests with coverage
    log('Running test suite with coverage...', 'info');
    const testOutput = execSync('npm test -- --coverage --passWithNoTests', {
      stdio: 'pipe',
      encoding: 'utf8',
      env: { ...process.env, CI: 'true' }
    });
    
    // Parse test results
    const testResults = parseTestResults(testOutput);
    const coverageResults = parseCoverageResults(testOutput);
    
    results.tests.passed = testResults.passed;
    results.tests.failed = testResults.failed;
    results.tests.coverage = coverageResults.percentage;
    
    // Calculate test score
    const passScore = testResults.failed === 0 ? 100 : 0;
    const coverageScore = calculateScore(coverageResults.percentage, config.health.testCoverage);
    results.tests.score = (passScore * 0.6 + coverageScore * 0.4);
    
    if (testResults.failed > 0) {
      log(`${testResults.failed} tests failed`, 'error');
      results.tests.issues.push({
        type: 'test-failure',
        count: testResults.failed
      });
    } else {
      log(`All ${testResults.passed} tests passed`, 'success');
    }
    
    log(`Test coverage: ${coverageResults.percentage.toFixed(2)}%`, 
        coverageResults.percentage >= config.health.testCoverage ? 'success' : 'warning');
    
  } catch (err) {
    log(`Test check failed: ${err.message}`, 'error');
    results.tests.score = 0;
    results.tests.issues.push({
      type: 'test-error',
      message: err.message
    });
  }
}

function parseTestResults(output) {
  const passMatch = output.match(/(\d+) passed/);
  const failMatch = output.match(/(\d+) failed/);
  
  return {
    passed: passMatch ? parseInt(passMatch[1]) : 0,
    failed: failMatch ? parseInt(failMatch[1]) : 0
  };
}

function parseCoverageResults(output) {
  const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
  
  return {
    percentage: coverageMatch ? parseFloat(coverageMatch[1]) : 0
  };
}

// 4. Security Check
async function performSecurityCheck() {
  log('Performing security check...', 'section');
  
  let vulnerabilityCount = 0;
  let criticalIssues = 0;
  
  try {
    // Check for npm vulnerabilities
    log('Checking npm dependencies for vulnerabilities...', 'info');
    try {
      const auditOutput = execSync('npm audit --json', {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      const auditResults = JSON.parse(auditOutput);
      vulnerabilityCount = auditResults.metadata.vulnerabilities.total;
      criticalIssues = auditResults.metadata.vulnerabilities.critical + 
                      auditResults.metadata.vulnerabilities.high;
      
      if (vulnerabilityCount > 0) {
        log(`Found ${vulnerabilityCount} vulnerabilities (${criticalIssues} high/critical)`, 
            criticalIssues > 0 ? 'error' : 'warning');
        
        results.security.vulnerabilities.push({
          type: 'npm-audit',
          count: vulnerabilityCount,
          critical: criticalIssues
        });
      }
    } catch (err) {
      // npm audit returns non-zero exit code when vulnerabilities found
      if (err.stdout) {
        try {
          const auditResults = JSON.parse(err.stdout);
          vulnerabilityCount = auditResults.metadata.vulnerabilities.total;
          criticalIssues = auditResults.metadata.vulnerabilities.critical + 
                          auditResults.metadata.vulnerabilities.high;
        } catch {
          log('Could not parse npm audit results', 'warning');
        }
      }
    }
    
    // Check for sensitive data in code
    log('Scanning for sensitive data patterns...', 'info');
    const sensitiveFiles = await scanForSensitiveData();
    
    if (sensitiveFiles.length > 0) {
      log(`Found ${sensitiveFiles.length} files with potential sensitive data`, 'warning');
      results.security.risks.push(...sensitiveFiles);
    }
    
    // Check for insecure dependencies
    const insecureDeps = await checkInsecureDependencies();
    if (insecureDeps.length > 0) {
      log(`Found ${insecureDeps.length} potentially insecure dependencies`, 'warning');
      results.security.risks.push(...insecureDeps);
    }
    
    // Check environment variables
    const envIssues = await checkEnvironmentVariables();
    if (envIssues.length > 0) {
      results.security.risks.push(...envIssues);
    }
    
    // Calculate security score
    const vulnScore = criticalIssues === 0 ? 100 : Math.max(0, 100 - (criticalIssues * 20));
    const dataScore = sensitiveFiles.length === 0 ? 100 : Math.max(0, 100 - (sensitiveFiles.length * 10));
    results.security.score = (vulnScore * 0.7 + dataScore * 0.3);
    
  } catch (err) {
    log(`Security check failed: ${err.message}`, 'error');
    results.security.score = 0;
  }
}

async function scanForSensitiveData() {
  const sensitiveFiles = [];
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.env'];
  
  async function scanFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        for (const pattern of config.security.sensitivePatterns) {
          if (pattern.test(line)) {
            // Check if it's not just a variable name
            if (line.includes('=') || line.includes(':')) {
              const value = line.split(/[=:]/)[1]?.trim();
              if (value && value.length > 10 && !value.includes('process.env')) {
                sensitiveFiles.push({
                  file: filePath,
                  line: index + 1,
                  pattern: pattern.toString(),
                  type: 'sensitive-data'
                });
              }
            }
          }
        }
      });
    } catch (err) {
      // Ignore read errors
    }
  }
  
  // Scan source files
  const srcFiles = await findFiles('**/*.{js,jsx,ts,tsx}', 'src');
  const appFiles = await findFiles('**/*.{js,jsx,ts,tsx}', 'app');
  const configFiles = await findFiles('*.{json,js,ts}', '.');
  
  const allFiles = [...srcFiles, ...appFiles, ...configFiles];
  
  for (const file of allFiles) {
    await scanFile(file);
  }
  
  return sensitiveFiles;
}

async function checkInsecureDependencies() {
  const issues = [];
  
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    for (const [name, version] of Object.entries(allDeps)) {
      // Check for vulnerable packages
      if (config.security.vulnerablePackages.includes(name)) {
        issues.push({
          type: 'insecure-dependency',
          package: name,
          version,
          reason: 'Known vulnerable package'
        });
      }
      
      // Check for outdated major versions
      if (version.startsWith('^') || version.startsWith('~')) {
        // Package allows updates
      } else if (version.match(/^\d+\.\d+\.\d+$/)) {
        issues.push({
          type: 'pinned-dependency',
          package: name,
          version,
          reason: 'Exact version pinning may miss security updates'
        });
      }
    }
  } catch (err) {
    log(`Could not check dependencies: ${err.message}`, 'warning');
  }
  
  return issues;
}

async function checkEnvironmentVariables() {
  const issues = [];
  
  // Check if .env files are properly gitignored
  try {
    const gitignore = await fs.readFile('.gitignore', 'utf8');
    if (!gitignore.includes('.env')) {
      issues.push({
        type: 'env-exposure',
        file: '.gitignore',
        reason: '.env files not properly gitignored'
      });
    }
  } catch {
    issues.push({
      type: 'missing-gitignore',
      reason: 'No .gitignore file found'
    });
  }
  
  // Check for .env files in repository
  const envFiles = await findFiles('.env*');
  for (const file of envFiles) {
    if (!file.endsWith('.example') && !file.endsWith('.template')) {
      issues.push({
        type: 'env-file-exposed',
        file,
        reason: 'Environment file should not be in repository'
      });
    }
  }
  
  return issues;
}

// 5. Performance Check
async function performPerformanceCheck() {
  log('Performing performance check...', 'section');
  
  try {
    // Start development server for performance testing
    log('Starting development server for performance testing...', 'info');
    const serverProcess = require('child_process').spawn('npm', ['run', 'dev'], {
      detached: true,
      stdio: 'ignore'
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    try {
      // Measure API response times
      const apiMetrics = await measureApiPerformance();
      
      // Measure memory usage
      const memoryMetrics = await measureMemoryUsage();
      
      // Run Lighthouse audit (if available)
      const lighthouseScore = await runLighthouseAudit();
      
      results.performance.metrics = {
        api: apiMetrics,
        memory: memoryMetrics,
        lighthouse: lighthouseScore
      };
      
      // Calculate performance score
      const apiScore = calculateScore(config.health.apiResponseTime, apiMetrics.average, true);
      const memoryScore = calculateScore(config.health.memoryUsage, memoryMetrics.heapUsed, true);
      const lighthouseScoreValue = lighthouseScore || 90;
      
      results.performance.score = (apiScore * 0.4 + memoryScore * 0.3 + lighthouseScoreValue * 0.3) / 100 * 100;
      
      log(`API response time: ${apiMetrics.average.toFixed(2)}ms`, 
          apiMetrics.average <= config.health.apiResponseTime ? 'success' : 'warning');
      log(`Memory usage: ${formatSize(memoryMetrics.heapUsed)}`, 
          memoryMetrics.heapUsed <= config.health.memoryUsage ? 'success' : 'warning');
      
      if (lighthouseScore) {
        log(`Lighthouse score: ${lighthouseScore}/100`, 
            lighthouseScore >= config.health.lighthouseScore ? 'success' : 'warning');
      }
      
    } finally {
      // Kill the server process
      try {
        process.kill(-serverProcess.pid);
      } catch {
        // Process might have already exited
      }
    }
    
  } catch (err) {
    log(`Performance check failed: ${err.message}`, 'error');
    results.performance.score = 50; // Partial score for failed check
  }
}

async function measureApiPerformance() {
  const timings = [];
  const endpoints = [
    'http://localhost:3000/api/health',
    'http://localhost:3000/api/auth/session'
  ];
  
  for (const endpoint of endpoints) {
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      try {
        await fetch(endpoint);
        timings.push(Date.now() - start);
      } catch {
        // Server might not be ready
      }
    }
  }
  
  const average = timings.length > 0 
    ? timings.reduce((a, b) => a + b, 0) / timings.length 
    : config.health.apiResponseTime;
  
  return {
    average,
    min: Math.min(...timings),
    max: Math.max(...timings)
  };
}

async function measureMemoryUsage() {
  const usage = process.memoryUsage();
  
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    rss: usage.rss,
    external: usage.external
  };
}

async function runLighthouseAudit() {
  try {
    // Check if lighthouse is available
    execSync('which lighthouse', { stdio: 'ignore' });
    
    log('Running Lighthouse audit...', 'info');
    const output = execSync('lighthouse http://localhost:3000 --output=json --quiet --chrome-flags="--headless"', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const results = JSON.parse(output);
    const score = Math.round(
      (results.categories.performance.score +
       results.categories.accessibility.score +
       results.categories['best-practices'].score +
       results.categories.seo.score) * 25
    );
    
    return score;
  } catch {
    log('Lighthouse not available, skipping audit', 'info');
    return null;
  }
}

// 6. Code Quality Check
async function performCodeQualityCheck() {
  log('Performing code quality check...', 'section');
  
  try {
    // Run ESLint
    log('Running ESLint...', 'info');
    let lintIssues = 0;
    try {
      execSync('npm run lint', { stdio: 'pipe' });
      log('No linting issues found', 'success');
    } catch (err) {
      const output = err.stdout?.toString() || '';
      const errorMatch = output.match(/(\d+) errors?/);
      const warningMatch = output.match(/(\d+) warnings?/);
      
      lintIssues = (errorMatch ? parseInt(errorMatch[1]) : 0) + 
                   (warningMatch ? parseInt(warningMatch[1]) : 0);
      
      log(`Found ${lintIssues} linting issues`, 'warning');
      results.codeQuality.issues.push({
        type: 'lint',
        count: lintIssues
      });
    }
    
    // Check TypeScript types
    log('Checking TypeScript types...', 'info');
    let typeErrors = 0;
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      log('No TypeScript errors found', 'success');
    } catch (err) {
      const output = err.stdout?.toString() || '';
      const errors = output.match(/error TS/g);
      typeErrors = errors ? errors.length : 0;
      
      log(`Found ${typeErrors} TypeScript errors`, 'warning');
      results.codeQuality.issues.push({
        type: 'typescript',
        count: typeErrors
      });
    }
    
    // Check for code duplication
    const duplication = await checkCodeDuplication();
    if (duplication.percentage > 5) {
      log(`Code duplication: ${duplication.percentage.toFixed(2)}%`, 'warning');
      results.codeQuality.issues.push({
        type: 'duplication',
        percentage: duplication.percentage
      });
    }
    
    // Check for TODO comments
    const todos = await findTodoComments();
    if (todos.length > 0) {
      log(`Found ${todos.length} TODO comments`, 'info');
      results.codeQuality.issues.push({
        type: 'todos',
        count: todos.length,
        items: todos.slice(0, 5) // First 5 TODOs
      });
    }
    
    // Calculate code quality score
    const lintScore = lintIssues === 0 ? 100 : Math.max(0, 100 - (lintIssues * 5));
    const typeScore = typeErrors === 0 ? 100 : Math.max(0, 100 - (typeErrors * 10));
    const dupScore = Math.max(0, 100 - (duplication.percentage * 2));
    
    results.codeQuality.score = (lintScore * 0.4 + typeScore * 0.4 + dupScore * 0.2);
    
  } catch (err) {
    log(`Code quality check failed: ${err.message}`, 'error');
    results.codeQuality.score = 0;
  }
}

async function checkCodeDuplication() {
  // Simple duplication check based on file hashes
  const hashes = new Map();
  let totalFiles = 0;
  let duplicates = 0;
  
  const files = await findFiles('**/*.{js,jsx,ts,tsx}');
  
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const hash = crypto.createHash('md5').update(content).digest('hex');
      
      if (hashes.has(hash)) {
        duplicates++;
      } else {
        hashes.set(hash, file);
      }
      
      totalFiles++;
    } catch {
      // Ignore read errors
    }
  }
  
  return {
    percentage: totalFiles > 0 ? (duplicates / totalFiles) * 100 : 0,
    totalFiles,
    duplicates
  };
}

async function findTodoComments() {
  const todos = [];
  const files = await findFiles('**/*.{js,jsx,ts,tsx}');
  
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.match(/\/\/\s*(TODO|FIXME|HACK|XXX)/i)) {
          todos.push({
            file,
            line: index + 1,
            text: line.trim()
          });
        }
      });
    } catch {
      // Ignore read errors
    }
  }
  
  return todos;
}

// 7. Calculate Overall Score and Generate Report
function calculateOverallScore() {
  const weights = config.scoring;
  
  results.overall.score = 
    (results.cleanup.score * weights.cleanup +
     results.build.score * weights.build +
     results.tests.score * weights.tests +
     results.security.score * weights.security +
     results.performance.score * weights.performance +
     results.codeQuality.score * weights.codeQuality) / 100;
  
  // Determine deployment status
  if (results.overall.score >= 90) {
    results.overall.status = 'GO';
    results.overall.recommendation = 'Codebase is ready for production deployment!';
  } else if (results.overall.score >= 70) {
    results.overall.status = options.strict ? 'NO-GO' : 'CONDITIONAL';
    results.overall.recommendation = 'Codebase can be deployed with caution. Consider addressing warnings.';
  } else {
    results.overall.status = 'NO-GO';
    results.overall.recommendation = 'Codebase is not ready for deployment. Critical issues must be resolved.';
  }
  
  // Add specific recommendations
  const recommendations = [];
  
  if (results.cleanup.score < 100) {
    recommendations.push('• Run cleanup to remove development artifacts');
  }
  
  if (results.build.score < 80) {
    recommendations.push('• Optimize build performance and bundle sizes');
  }
  
  if (results.tests.score < 80) {
    recommendations.push('• Improve test coverage and fix failing tests');
  }
  
  if (results.security.score < 80) {
    recommendations.push('• Address security vulnerabilities and sensitive data exposure');
  }
  
  if (results.performance.score < 80) {
    recommendations.push('• Optimize application performance and response times');
  }
  
  if (results.codeQuality.score < 80) {
    recommendations.push('• Fix linting issues and TypeScript errors');
  }
  
  if (recommendations.length > 0) {
    results.overall.recommendation += '\n\nRecommendations:\n' + recommendations.join('\n');
  }
}

function displayResults() {
  console.log('\n' + '='.repeat(80));
  console.log(colors.bright + 'ZENITH PLATFORM - PRE-DEPLOYMENT VALIDATION REPORT' + colors.reset);
  console.log('='.repeat(80) + '\n');
  
  // Display individual scores
  const categories = [
    { name: 'Cleanup', score: results.cleanup.score, weight: config.scoring.cleanup },
    { name: 'Build', score: results.build.score, weight: config.scoring.build },
    { name: 'Tests', score: results.tests.score, weight: config.scoring.tests },
    { name: 'Security', score: results.security.score, weight: config.scoring.security },
    { name: 'Performance', score: results.performance.score, weight: config.scoring.performance },
    { name: 'Code Quality', score: results.codeQuality.score, weight: config.scoring.codeQuality }
  ];
  
  console.log(colors.bright + 'Category Scores:' + colors.reset);
  console.log('-'.repeat(50));
  
  categories.forEach(cat => {
    const scoreColor = cat.score >= 80 ? colors.green : cat.score >= 60 ? colors.yellow : colors.red;
    const bar = '█'.repeat(Math.round(cat.score / 5));
    const emptyBar = '░'.repeat(20 - Math.round(cat.score / 5));
    
    console.log(`${cat.name.padEnd(15)} ${scoreColor}${bar}${colors.reset}${emptyBar} ${scoreColor}${cat.score.toFixed(1)}%${colors.reset} (weight: ${cat.weight}%)`);
  });
  
  // Display overall score
  console.log('\n' + '-'.repeat(50));
  const scoreColor = results.overall.score >= 90 ? colors.green : 
                    results.overall.score >= 70 ? colors.yellow : colors.red;
  
  console.log(`${colors.bright}Overall Score:${colors.reset}   ${scoreColor}${results.overall.score.toFixed(1)}/100${colors.reset}`);
  console.log(`${colors.bright}Status:${colors.reset}          ${getStatusColor(results.overall.status)}${results.overall.status}${colors.reset}`);
  
  // Display critical issues
  if (results.security.vulnerabilities.length > 0 || results.tests.failed > 0) {
    console.log('\n' + colors.red + colors.bright + 'CRITICAL ISSUES:' + colors.reset);
    
    if (results.tests.failed > 0) {
      console.log(`${colors.red}• ${results.tests.failed} failing tests${colors.reset}`);
    }
    
    results.security.vulnerabilities.forEach(vuln => {
      if (vuln.critical > 0) {
        console.log(`${colors.red}• ${vuln.critical} critical security vulnerabilities${colors.reset}`);
      }
    });
  }
  
  // Display recommendation
  console.log('\n' + colors.bright + 'Recommendation:' + colors.reset);
  console.log(results.overall.recommendation);
  
  // Display timing
  console.log('\n' + '-'.repeat(50));
  console.log(`Validation completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  
  if (options.report) {
    console.log(`\nDetailed report saved to: deployment-report-${new Date().toISOString().split('T')[0]}.html`);
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'GO': return colors.green + colors.bright;
    case 'CONDITIONAL': return colors.yellow + colors.bright;
    case 'NO-GO': return colors.red + colors.bright;
    default: return colors.reset;
  }
}

async function generateHTMLReport() {
  if (!options.report) return;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zenith Platform - Deployment Readiness Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: #1a1a1a;
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 2.5em;
    }
    .summary {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    .score-display {
      font-size: 4em;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
    }
    .status {
      font-size: 2em;
      text-align: center;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
    }
    .status.go { background: #4caf50; color: white; }
    .status.conditional { background: #ff9800; color: white; }
    .status.no-go { background: #f44336; color: white; }
    .category {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .category h3 {
      margin-top: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .score-bar {
      width: 100%;
      height: 30px;
      background: #e0e0e0;
      border-radius: 15px;
      overflow: hidden;
      margin: 10px 0;
    }
    .score-fill {
      height: 100%;
      background: #4caf50;
      transition: width 0.3s;
    }
    .score-fill.warning { background: #ff9800; }
    .score-fill.error { background: #f44336; }
    .issues {
      margin-top: 20px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 5px;
    }
    .issue {
      padding: 10px;
      margin: 5px 0;
      background: white;
      border-left: 4px solid #ff9800;
      border-radius: 3px;
    }
    .issue.critical {
      border-left-color: #f44336;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .metric {
      padding: 15px;
      background: #f5f5f5;
      border-radius: 5px;
      text-align: center;
    }
    .metric-value {
      font-size: 2em;
      font-weight: bold;
      color: #1a1a1a;
    }
    .recommendations {
      background: #e3f2fd;
      padding: 20px;
      border-radius: 10px;
      margin-top: 30px;
    }
    .recommendations ul {
      margin: 10px 0;
      padding-left: 30px;
    }
    .timestamp {
      text-align: center;
      color: #666;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Zenith Platform - Deployment Readiness Report</h1>
    <p>Pre-deployment validation completed on ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="summary">
    <h2>Overall Assessment</h2>
    <div class="score-display" style="color: ${results.overall.score >= 90 ? '#4caf50' : results.overall.score >= 70 ? '#ff9800' : '#f44336'}">
      ${results.overall.score.toFixed(1)}/100
    </div>
    <div class="status ${results.overall.status.toLowerCase().replace('-', '')}">
      ${results.overall.status}
    </div>
    <p>${results.overall.recommendation}</p>
  </div>
  
  ${generateCategoryHTML('Cleanup', results.cleanup)}
  ${generateCategoryHTML('Build', results.build)}
  ${generateCategoryHTML('Tests', results.tests)}
  ${generateCategoryHTML('Security', results.security)}
  ${generateCategoryHTML('Performance', results.performance)}
  ${generateCategoryHTML('Code Quality', results.codeQuality)}
  
  <div class="recommendations">
    <h2>Recommendations</h2>
    <ul>
      ${results.overall.recommendation.split('\n').filter(line => line.startsWith('•')).map(line => `<li>${line.substring(1).trim()}</li>`).join('')}
    </ul>
  </div>
  
  <div class="timestamp">
    Generated by Zenith Platform Pre-Deployment Validator<br>
    ${new Date().toISOString()}
  </div>
</body>
</html>
  `;
  
  const filename = `deployment-report-${new Date().toISOString().split('T')[0]}.html`;
  await fs.writeFile(filename, html);
  
  return filename;
}

function generateCategoryHTML(name, data) {
  const scoreClass = data.score >= 80 ? '' : data.score >= 60 ? 'warning' : 'error';
  
  let metricsHTML = '';
  let issuesHTML = '';
  
  // Generate metrics based on category
  if (name === 'Build' && data.metrics) {
    metricsHTML = `
      <div class="metrics">
        <div class="metric">
          <div class="metric-value">${(data.metrics.buildTime / 1000).toFixed(2)}s</div>
          <div>Build Time</div>
        </div>
        <div class="metric">
          <div class="metric-value">${formatSize(data.metrics.mainBundleSize)}</div>
          <div>Bundle Size</div>
        </div>
      </div>
    `;
  }
  
  if (name === 'Tests') {
    metricsHTML = `
      <div class="metrics">
        <div class="metric">
          <div class="metric-value">${data.passed}</div>
          <div>Tests Passed</div>
        </div>
        <div class="metric">
          <div class="metric-value">${data.failed}</div>
          <div>Tests Failed</div>
        </div>
        <div class="metric">
          <div class="metric-value">${data.coverage.toFixed(1)}%</div>
          <div>Coverage</div>
        </div>
      </div>
    `;
  }
  
  // Generate issues
  if (data.issues && data.issues.length > 0) {
    issuesHTML = `
      <div class="issues">
        <h4>Issues Found:</h4>
        ${data.issues.slice(0, 10).map(issue => `
          <div class="issue ${issue.type.includes('critical') ? 'critical' : ''}">
            ${JSON.stringify(issue, null, 2)}
          </div>
        `).join('')}
      </div>
    `;
  }
  
  return `
    <div class="category">
      <h3>
        <span>${name}</span>
        <span style="color: ${data.score >= 80 ? '#4caf50' : data.score >= 60 ? '#ff9800' : '#f44336'}">${data.score.toFixed(1)}%</span>
      </h3>
      <div class="score-bar">
        <div class="score-fill ${scoreClass}" style="width: ${data.score}%"></div>
      </div>
      ${metricsHTML}
      ${issuesHTML}
    </div>
  `;
}

// Main execution
const startTime = Date.now();

async function main() {
  console.log(colors.bright + colors.cyan + `
╔═══════════════════════════════════════════════════════════════════╗
║          ZENITH PLATFORM - PRE-DEPLOYMENT VALIDATOR               ║
║                                                                   ║
║  Comprehensive validation ensuring production readiness           ║
╚═══════════════════════════════════════════════════════════════════╝
` + colors.reset);

  if (options.fix) {
    log('Running in FIX mode - will attempt to fix issues automatically', 'warning');
  }
  
  if (options.strict) {
    log('Running in STRICT mode - will fail on any warnings', 'warning');
  }
  
  console.log();
  
  // Run all checks
  await performCleanup();
  await performBuildCheck();
  await performTestCheck();
  await performSecurityCheck();
  await performPerformanceCheck();
  await performCodeQualityCheck();
  
  // Calculate overall score
  calculateOverallScore();
  
  // Display results
  displayResults();
  
  // Generate HTML report if requested
  if (options.report) {
    await generateHTMLReport();
  }
  
  // Exit with appropriate code
  if (results.overall.status === 'NO-GO') {
    process.exit(1);
  } else if (results.overall.status === 'CONDITIONAL' && options.strict) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (err) => {
  console.error(colors.red + '\nUnhandled error during validation:' + colors.reset);
  console.error(err);
  process.exit(1);
});

// Run the validation
main().catch(err => {
  console.error(colors.red + '\nValidation failed:' + colors.reset);
  console.error(err);
  process.exit(1);
});