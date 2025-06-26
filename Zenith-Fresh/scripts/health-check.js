#!/usr/bin/env node

/**
 * Comprehensive Health Check System for Zenith Platform
 * Verifies all critical aspects of the application before deployment
 * 
 * This script performs thorough checks on:
 * - Database connectivity and schema integrity
 * - API endpoints functionality
 * - Authentication flow
 * - File permissions and environment setup
 * - Build integrity and dependencies
 * - Security configurations
 * - Performance metrics
 * - External service connections
 */

// Load environment variables first
try {
  require('dotenv').config({ path: '.env' });
  require('dotenv').config({ path: '.env.local' });
  require('dotenv').config({ path: '.env.production' });
} catch (error) {
  // dotenv might not be available or files might not exist
  console.warn('Warning: Could not load dotenv configuration:', error.message);
}

const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');
const crypto = require('crypto');
const util = require('util');

// Convert exec to promise
const execAsync = util.promisify(exec);

// ANSI color codes for beautiful console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Health check results storage
const healthResults = {
  overall: 'unknown',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  checks: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    critical: 0
  },
  recommendations: [],
  errors: [],
  performance: {
    totalTime: 0,
    checkTimes: {}
  }
};

// Critical checks that must pass for deployment
const CRITICAL_CHECKS = [
  'database',
  'authentication',
  'build_integrity',
  'security_config',
  'api_endpoints'
];

// Environment variables that must be present
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

// Optional but recommended environment variables
const RECOMMENDED_ENV_VARS = [
  'REDIS_URL',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'RESEND_API_KEY',
  'OPENAI_API_KEY'
];

/**
 * Utility Functions
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const levelColors = {
    info: colors.cyan,
    success: colors.green,
    warning: colors.yellow,
    error: colors.red,
    critical: colors.magenta
  };
  
  const color = levelColors[level] || colors.white;
  console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`);
}

function logSection(title) {
  const separator = '='.repeat(60);
  console.log(`\n${colors.bright}${colors.blue}${separator}`);
  console.log(`${title.toUpperCase()}`);
  console.log(`${separator}${colors.reset}\n`);
}

function recordResult(checkName, status, details = {}, recommendations = []) {
  const result = {
    status,
    timestamp: new Date().toISOString(),
    details,
    recommendations,
    duration: details.duration || 0
  };
  
  healthResults.checks[checkName] = result;
  healthResults.summary.total++;
  
  if (status === 'pass') {
    healthResults.summary.passed++;
  } else if (status === 'fail') {
    healthResults.summary.failed++;
    if (CRITICAL_CHECKS.includes(checkName)) {
      healthResults.summary.critical++;
    }
  } else if (status === 'warning') {
    healthResults.summary.warnings++;
  }
  
  if (recommendations.length > 0) {
    healthResults.recommendations.push(...recommendations);
  }
  
  return result;
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Health Check Functions
 */

async function checkDatabaseConnectivity() {
  const startTime = Date.now();
  
  try {
    log('Checking database connectivity...', 'info');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }
    
    // Import Prisma dynamically to avoid issues if not available
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test basic connection
    await prisma.$connect();
    log('✓ Database connection established', 'success');
    
    // Test basic query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    log('✓ Database query executed successfully', 'success');
    
    // Check if migrations are up to date
    try {
      await prisma.$queryRaw`SELECT * FROM "_prisma_migrations" LIMIT 1`;
      log('✓ Database migrations table exists', 'success');
    } catch (migrationError) {
      log('⚠ Database migrations may not be applied', 'warning');
    }
    
    // Test critical tables exist
    const criticalTables = ['User', 'Project', 'AuditLog'];
    const tableChecks = [];
    
    for (const table of criticalTables) {
      try {
        await prisma[table.toLowerCase()].findFirst();
        tableChecks.push({ table, status: 'exists' });
        log(`✓ Table ${table} accessible`, 'success');
      } catch (error) {
        tableChecks.push({ table, status: 'error', error: error.message });
        log(`✗ Table ${table} not accessible: ${error.message}`, 'error');
      }
    }
    
    await prisma.$disconnect();
    
    const duration = Date.now() - startTime;
    const details = {
      connectionString: process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'),
      duration,
      tableChecks
    };
    
    const hasTableErrors = tableChecks.some(check => check.status === 'error');
    const status = hasTableErrors ? 'fail' : 'pass';
    const recommendations = hasTableErrors ? [
      'Run database migrations: npx prisma migrate deploy',
      'Verify database schema is up to date'
    ] : [];
    
    return recordResult('database', status, details, recommendations);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`✗ Database connectivity failed: ${error.message}`, 'error');
    
    return recordResult('database', 'fail', {
      error: error.message,
      duration
    }, [
      'Verify DATABASE_URL is correct',
      'Ensure database server is running',
      'Check network connectivity to database'
    ]);
  }
}

async function checkAPIEndpoints() {
  const startTime = Date.now();
  
  try {
    log('Checking API endpoints...', 'info');
    
    const endpoints = [
      { path: '/api/health', method: 'GET', critical: true },
      { path: '/api/auth/providers', method: 'GET', critical: true },
      { path: '/api/projects', method: 'GET', critical: false },
      { path: '/api/website-analyzer/analyze', method: 'POST', critical: false },
      { path: '/api/teams', method: 'GET', critical: false }
    ];
    
    const endpointResults = [];
    
    for (const endpoint of endpoints) {
      try {
        // For now, we'll just check if the file exists since we can't make HTTP requests
        const apiPath = path.join(process.cwd(), 'app', 'api', endpoint.path.slice(5));
        const routeFile = path.join(apiPath, 'route.ts');
        
        if (fs.existsSync(routeFile)) {
          endpointResults.push({
            ...endpoint,
            status: 'exists',
            message: 'Route file exists'
          });
          log(`✓ ${endpoint.method} ${endpoint.path} - Route file exists`, 'success');
        } else {
          endpointResults.push({
            ...endpoint,
            status: 'missing',
            message: 'Route file not found'
          });
          log(`✗ ${endpoint.method} ${endpoint.path} - Route file missing`, 'error');
        }
      } catch (error) {
        endpointResults.push({
          ...endpoint,
          status: 'error',
          error: error.message
        });
        log(`✗ ${endpoint.method} ${endpoint.path} - Error: ${error.message}`, 'error');
      }
    }
    
    const duration = Date.now() - startTime;
    const criticalFailed = endpointResults.some(r => r.critical && r.status !== 'exists');
    const status = criticalFailed ? 'fail' : 'pass';
    
    const recommendations = [];
    if (criticalFailed) {
      recommendations.push('Create missing critical API routes');
      recommendations.push('Verify API route structure matches Next.js app directory conventions');
    }
    
    return recordResult('api_endpoints', status, {
      duration,
      endpoints: endpointResults,
      summary: {
        total: endpointResults.length,
        existing: endpointResults.filter(r => r.status === 'exists').length,
        missing: endpointResults.filter(r => r.status === 'missing').length
      }
    }, recommendations);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`✗ API endpoints check failed: ${error.message}`, 'error');
    
    return recordResult('api_endpoints', 'fail', {
      error: error.message,
      duration
    }, ['Verify Next.js application structure']);
  }
}

async function checkAuthentication() {
  const startTime = Date.now();
  
  try {
    log('Checking authentication configuration...', 'info');
    
    const authChecks = {
      nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthUrl: !!process.env.NEXTAUTH_URL,
      authConfigFile: fs.existsSync(path.join(process.cwd(), 'lib', 'auth.ts')),
      authApiRoute: fs.existsSync(path.join(process.cwd(), 'app', 'api', 'auth', '[...nextauth]', 'route.ts'))
    };
    
    let status = 'pass';
    const recommendations = [];
    
    if (!authChecks.nextAuthSecret) {
      status = 'fail';
      recommendations.push('Set NEXTAUTH_SECRET environment variable');
      log('✗ NEXTAUTH_SECRET not configured', 'error');
    } else {
      log('✓ NEXTAUTH_SECRET configured', 'success');
    }
    
    if (!authChecks.nextAuthUrl) {
      status = 'fail';
      recommendations.push('Set NEXTAUTH_URL environment variable');
      log('✗ NEXTAUTH_URL not configured', 'error');
    } else {
      log('✓ NEXTAUTH_URL configured', 'success');
    }
    
    if (!authChecks.authConfigFile) {
      status = 'fail';
      recommendations.push('Create lib/auth.ts configuration file');
      log('✗ Authentication configuration file missing', 'error');
    } else {
      log('✓ Authentication configuration file exists', 'success');
    }
    
    if (!authChecks.authApiRoute) {
      status = 'fail';
      recommendations.push('Create NextAuth API route');
      log('✗ NextAuth API route missing', 'error');
    } else {
      log('✓ NextAuth API route exists', 'success');
    }
    
    // Check for OAuth providers
    const hasGoogleOAuth = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    if (!hasGoogleOAuth) {
      recommendations.push('Configure Google OAuth for better user experience');
      log('⚠ Google OAuth not configured', 'warning');
    } else {
      log('✓ Google OAuth configured', 'success');
    }
    
    const duration = Date.now() - startTime;
    
    return recordResult('authentication', status, {
      duration,
      checks: authChecks,
      oauthProviders: {
        google: hasGoogleOAuth
      }
    }, recommendations);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`✗ Authentication check failed: ${error.message}`, 'error');
    
    return recordResult('authentication', 'fail', {
      error: error.message,
      duration
    }, ['Review authentication setup documentation']);
  }
}

async function checkEnvironmentVariables() {
  const startTime = Date.now();
  
  try {
    log('Checking environment variables...', 'info');
    
    const envChecks = {
      required: [],
      recommended: [],
      missing: [],
      extra: []
    };
    
    // Check required variables
    for (const envVar of REQUIRED_ENV_VARS) {
      const exists = !!process.env[envVar];
      envChecks.required.push({ name: envVar, exists });
      
      if (exists) {
        log(`✓ ${envVar} configured`, 'success');
      } else {
        log(`✗ ${envVar} missing`, 'error');
        envChecks.missing.push(envVar);
      }
    }
    
    // Check recommended variables
    for (const envVar of RECOMMENDED_ENV_VARS) {
      const exists = !!process.env[envVar];
      envChecks.recommended.push({ name: envVar, exists });
      
      if (exists) {
        log(`✓ ${envVar} configured`, 'success');
      } else {
        log(`⚠ ${envVar} not configured (recommended)`, 'warning');
      }
    }
    
    // Check for .env files
    const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
    const existingEnvFiles = envFiles.filter(file => 
      fs.existsSync(path.join(process.cwd(), file))
    );
    
    log(`Environment files found: ${existingEnvFiles.join(', ') || 'none'}`, 'info');
    
    const duration = Date.now() - startTime;
    const status = envChecks.missing.length > 0 ? 'fail' : 'pass';
    
    const recommendations = [];
    if (envChecks.missing.length > 0) {
      recommendations.push(`Set missing required environment variables: ${envChecks.missing.join(', ')}`);
    }
    
    const missingRecommended = envChecks.recommended.filter(r => !r.exists).map(r => r.name);
    if (missingRecommended.length > 0) {
      recommendations.push(`Consider setting recommended variables: ${missingRecommended.join(', ')}`);
    }
    
    return recordResult('environment_variables', status, {
      duration,
      required: envChecks.required,
      recommended: envChecks.recommended,
      envFiles: existingEnvFiles,
      missingRequired: envChecks.missing.length,
      missingRecommended: missingRecommended.length
    }, recommendations);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`✗ Environment variables check failed: ${error.message}`, 'error');
    
    return recordResult('environment_variables', 'fail', {
      error: error.message,
      duration
    }, ['Review environment configuration']);
  }
}

async function checkBuildIntegrity() {
  const startTime = Date.now();
  
  try {
    log('Checking build integrity...', 'info');
    
    // Check if package.json exists and is valid
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    log('✓ package.json is valid', 'success');
    
    // Check if node_modules exists
    const nodeModulesExists = fs.existsSync(path.join(process.cwd(), 'node_modules'));
    if (!nodeModulesExists) {
      log('✗ node_modules directory not found', 'error');
    } else {
      log('✓ node_modules directory exists', 'success');
    }
    
    // Check if package-lock.json exists
    const lockFileExists = fs.existsSync(path.join(process.cwd(), 'package-lock.json'));
    if (!lockFileExists) {
      log('⚠ package-lock.json not found', 'warning');
    } else {
      log('✓ package-lock.json exists', 'success');
    }
    
    // Try to run TypeScript check
    let typescriptCheck = { success: false, error: null };
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe', timeout: 30000 });
      typescriptCheck.success = true;
      log('✓ TypeScript compilation check passed', 'success');
    } catch (error) {
      typescriptCheck.error = error.message;
      log('✗ TypeScript compilation check failed', 'error');
    }
    
    // Try to run linting
    let lintCheck = { success: false, error: null };
    try {
      execSync('npm run lint', { stdio: 'pipe', timeout: 30000 });
      lintCheck.success = true;
      log('✓ ESLint check passed', 'success');
    } catch (error) {
      lintCheck.error = error.message;
      log('✗ ESLint check failed', 'error');
    }
    
    // Check critical files
    const criticalFiles = [
      'next.config.js',
      'tsconfig.json',
      'tailwind.config.js',
      'prisma/schema.prisma'
    ];
    
    const fileChecks = criticalFiles.map(file => {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      if (exists) {
        log(`✓ ${file} exists`, 'success');
      } else {
        log(`✗ ${file} missing`, 'error');
      }
      return { file, exists };
    });
    
    const duration = Date.now() - startTime;
    
    const criticalIssues = !nodeModulesExists || !typescriptCheck.success || fileChecks.some(f => !f.exists);
    const status = criticalIssues ? 'fail' : 'pass';
    
    const recommendations = [];
    if (!nodeModulesExists) {
      recommendations.push('Run npm install to install dependencies');
    }
    if (!typescriptCheck.success) {
      recommendations.push('Fix TypeScript compilation errors');
    }
    if (!lintCheck.success) {
      recommendations.push('Fix ESLint errors and warnings');
    }
    if (!lockFileExists) {
      recommendations.push('Run npm install to generate package-lock.json');
    }
    
    return recordResult('build_integrity', status, {
      duration,
      packageJson: {
        name: packageJson.name,
        version: packageJson.version,
        dependencies: Object.keys(packageJson.dependencies || {}).length,
        devDependencies: Object.keys(packageJson.devDependencies || {}).length
      },
      nodeModulesExists,
      lockFileExists,
      typescriptCheck,
      lintCheck,
      criticalFiles: fileChecks
    }, recommendations);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`✗ Build integrity check failed: ${error.message}`, 'error');
    
    return recordResult('build_integrity', 'fail', {
      error: error.message,
      duration
    }, ['Verify project setup and dependencies']);
  }
}

async function checkSecurityConfiguration() {
  const startTime = Date.now();
  
  try {
    log('Checking security configuration...', 'info');
    
    const securityChecks = {
      nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      databaseUrlSecurity: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost'),
      httpsOnly: process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.startsWith('https://'),
      corsConfiguration: fs.existsSync(path.join(process.cwd(), 'middleware.ts')),
      securityHeaders: false, // Will check next.config.js
      apiKeyManagement: !!process.env.API_SECRET_KEY,
      sensitiveFileProtection: !fs.existsSync(path.join(process.cwd(), '.env.production'))
    };
    
    // Check next.config.js for security headers
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
      securityChecks.securityHeaders = nextConfigContent.includes('headers') || 
                                      nextConfigContent.includes('helmet') ||
                                      nextConfigContent.includes('X-Frame-Options');
    }
    
    // Check for sensitive files in repository
    const sensitiveFiles = [
      '.env.production',
      '.env.local',
      'private-key.pem',
      'id_rsa',
      '.ssh/id_rsa'
    ];
    
    const exposedFiles = sensitiveFiles.filter(file => 
      fs.existsSync(path.join(process.cwd(), file))
    );
    
    // Security scoring
    let securityScore = 0;
    const totalChecks = Object.keys(securityChecks).length;
    
    for (const [check, passed] of Object.entries(securityChecks)) {
      if (passed) {
        securityScore++;
        log(`✓ ${check.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'success');
      } else {
        log(`✗ ${check.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
      }
    }
    
    const duration = Date.now() - startTime;
    const scorePercentage = (securityScore / totalChecks) * 100;
    const status = scorePercentage >= 70 ? 'pass' : 'fail';
    
    const recommendations = [];
    if (!securityChecks.nextAuthSecret) {
      recommendations.push('Generate strong NEXTAUTH_SECRET');
    }
    if (!securityChecks.httpsOnly && process.env.NODE_ENV === 'production') {
      recommendations.push('Use HTTPS in production environment');
    }
    if (!securityChecks.securityHeaders) {
      recommendations.push('Configure security headers in next.config.js');
    }
    if (exposedFiles.length > 0) {
      recommendations.push(`Remove sensitive files from repository: ${exposedFiles.join(', ')}`);
    }
    
    return recordResult('security_config', status, {
      duration,
      securityScore: Math.round(scorePercentage),
      checks: securityChecks,
      exposedFiles,
      recommendations: recommendations
    }, recommendations);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`✗ Security configuration check failed: ${error.message}`, 'error');
    
    return recordResult('security_config', 'fail', {
      error: error.message,
      duration
    }, ['Review security best practices']);
  }
}

async function checkFilePermissions() {
  const startTime = Date.now();
  
  try {
    log('Checking file permissions...', 'info');
    
    const criticalFiles = [
      { path: 'package.json', shouldBeReadable: true, shouldBeWritable: true },
      { path: 'next.config.js', shouldBeReadable: true, shouldBeWritable: true },
      { path: 'prisma/schema.prisma', shouldBeReadable: true, shouldBeWritable: true },
      { path: '.next', shouldBeReadable: true, shouldBeWritable: true },
      { path: 'node_modules', shouldBeReadable: true, shouldBeWritable: false }
    ];
    
    const permissionChecks = [];
    
    for (const file of criticalFiles) {
      const fullPath = path.join(process.cwd(), file.path);
      
      if (!fs.existsSync(fullPath)) {
        permissionChecks.push({
          ...file,
          status: 'missing',
          message: 'File/directory does not exist'
        });
        continue;
      }
      
      try {
        // Check read permission
        fs.accessSync(fullPath, fs.constants.R_OK);
        const canRead = true;
        
        // Check write permission
        let canWrite = false;
        try {
          fs.accessSync(fullPath, fs.constants.W_OK);
          canWrite = true;
        } catch (e) {
          canWrite = false;
        }
        
        const isCorrect = canRead === file.shouldBeReadable && 
                         (canWrite === file.shouldBeWritable || !file.shouldBeWritable);
        
        permissionChecks.push({
          ...file,
          status: isCorrect ? 'correct' : 'incorrect',
          canRead,
          canWrite,
          message: isCorrect ? 'Permissions correct' : 'Permissions incorrect'
        });
        
        if (isCorrect) {
          log(`✓ ${file.path} permissions correct`, 'success');
        } else {
          log(`✗ ${file.path} permissions incorrect`, 'error');
        }
        
      } catch (error) {
        permissionChecks.push({
          ...file,
          status: 'error',
          error: error.message
        });
        log(`✗ ${file.path} permission check failed: ${error.message}`, 'error');
      }
    }
    
    const duration = Date.now() - startTime;
    const hasErrors = permissionChecks.some(check => 
      check.status === 'error' || check.status === 'incorrect'
    );
    const status = hasErrors ? 'warning' : 'pass';
    
    const recommendations = [];
    if (hasErrors) {
      recommendations.push('Fix file permissions for critical files');
      recommendations.push('Ensure application has proper read/write access');
    }
    
    return recordResult('file_permissions', status, {
      duration,
      checks: permissionChecks,
      summary: {
        total: permissionChecks.length,
        correct: permissionChecks.filter(c => c.status === 'correct').length,
        incorrect: permissionChecks.filter(c => c.status === 'incorrect').length,
        missing: permissionChecks.filter(c => c.status === 'missing').length,
        errors: permissionChecks.filter(c => c.status === 'error').length
      }
    }, recommendations);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`✗ File permissions check failed: ${error.message}`, 'error');
    
    return recordResult('file_permissions', 'fail', {
      error: error.message,
      duration
    }, ['Review file system permissions']);
  }
}

async function checkExternalServices() {
  const startTime = Date.now();
  
  try {
    log('Checking external service connections...', 'info');
    
    const services = {
      redis: {
        configured: !!process.env.REDIS_URL,
        url: process.env.REDIS_URL ? process.env.REDIS_URL.replace(/\/\/[^@]+@/, '//***:***@') : null
      },
      stripe: {
        configured: !!(process.env.STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY),
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ? 
          process.env.STRIPE_PUBLISHABLE_KEY.substring(0, 12) + '...' : null
      },
      resend: {
        configured: !!process.env.RESEND_API_KEY,
        apiKey: process.env.RESEND_API_KEY ? 
          process.env.RESEND_API_KEY.substring(0, 8) + '...' : null
      },
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
        apiKey: process.env.OPENAI_API_KEY ? 
          process.env.OPENAI_API_KEY.substring(0, 8) + '...' : null
      },
      google: {
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        clientId: process.env.GOOGLE_CLIENT_ID ? 
          process.env.GOOGLE_CLIENT_ID.substring(0, 12) + '...' : null
      }
    };
    
    let configuredCount = 0;
    const totalServices = Object.keys(services).length;
    
    for (const [serviceName, service] of Object.entries(services)) {
      if (service.configured) {
        configuredCount++;
        log(`✓ ${serviceName} configured`, 'success');
      } else {
        log(`⚠ ${serviceName} not configured`, 'warning');
      }
    }
    
    const duration = Date.now() - startTime;
    const configurationPercentage = (configuredCount / totalServices) * 100;
    
    // This is warning level since external services are not critical for basic functionality
    const status = configurationPercentage >= 60 ? 'pass' : 'warning';
    
    const recommendations = [];
    if (!services.redis.configured) {
      recommendations.push('Configure Redis for caching and session storage');
    }
    if (!services.stripe.configured) {
      recommendations.push('Configure Stripe for payment processing');
    }
    if (!services.resend.configured) {
      recommendations.push('Configure Resend for email delivery');
    }
    if (!services.openai.configured) {
      recommendations.push('Configure OpenAI for AI features');
    }
    
    return recordResult('external_services', status, {
      duration,
      services,
      configuredCount,
      totalServices,
      configurationPercentage: Math.round(configurationPercentage)
    }, recommendations);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`✗ External services check failed: ${error.message}`, 'error');
    
    return recordResult('external_services', 'fail', {
      error: error.message,
      duration
    }, ['Review external service configurations']);
  }
}

async function checkPerformanceMetrics() {
  const startTime = Date.now();
  
  try {
    log('Checking performance metrics...', 'info');
    
    // Check system resources
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };
    
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();
    
    // Check build size (if .next exists)
    let buildSize = null;
    const nextBuildPath = path.join(process.cwd(), '.next');
    if (fs.existsSync(nextBuildPath)) {
      try {
        const { stdout } = await execAsync(`du -sh "${nextBuildPath}"`);
        buildSize = stdout.trim().split('\t')[0];
        log(`✓ Build size: ${buildSize}`, 'success');
      } catch (error) {
        log('⚠ Could not determine build size', 'warning');
      }
    }
    
    // Check package.json for performance-related packages
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const performancePackages = {
      nextOptimize: !!packageJson.dependencies?.['@next/bundle-analyzer'],
      imageOptimization: !!packageJson.dependencies?.['next-optimized-images'],
      compression: !!packageJson.dependencies?.['compression'],
      lighthouse: !!packageJson.devDependencies?.['@lhci/cli']
    };
    
    // Memory usage assessment
    const memoryStatus = memoryUsageMB.heapUsed < 200 ? 'good' : 
                        memoryUsageMB.heapUsed < 500 ? 'warning' : 'critical';
    
    const duration = Date.now() - startTime;
    
    // Overall performance status
    const status = memoryStatus === 'critical' ? 'warning' : 'pass';
    
    const recommendations = [];
    if (memoryStatus === 'warning' || memoryStatus === 'critical') {
      recommendations.push('Monitor memory usage and optimize if necessary');
    }
    if (!performancePackages.lighthouse) {
      recommendations.push('Add Lighthouse CI for performance monitoring');
    }
    if (!performancePackages.nextOptimize) {
      recommendations.push('Consider adding bundle analyzer for optimization');
    }
    
    return recordResult('performance_metrics', status, {
      duration,
      memory: {
        usage: memoryUsageMB,
        status: memoryStatus
      },
      cpu: cpuUsage,
      uptime: Math.round(uptime),
      buildSize,
      performancePackages,
      nodeVersion: process.version
    }, recommendations);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`✗ Performance metrics check failed: ${error.message}`, 'error');
    
    return recordResult('performance_metrics', 'fail', {
      error: error.message,
      duration
    }, ['Review system performance and optimization']);
  }
}

async function checkDependencySecurity() {
  const startTime = Date.now();
  
  try {
    log('Checking dependency security...', 'info');
    
    let auditResult = null;
    let vulnerabilityCount = 0;
    let hasHighSeverity = false;
    
    try {
      // Run npm audit
      const { stdout, stderr } = await execAsync('npm audit --json', { timeout: 30000 });
      auditResult = JSON.parse(stdout);
      
      if (auditResult.metadata) {
        vulnerabilityCount = auditResult.metadata.vulnerabilities.total || 0;
        hasHighSeverity = (auditResult.metadata.vulnerabilities.high || 0) > 0 ||
                         (auditResult.metadata.vulnerabilities.critical || 0) > 0;
      }
      
      if (vulnerabilityCount === 0) {
        log('✓ No security vulnerabilities found', 'success');
      } else {
        log(`⚠ Found ${vulnerabilityCount} security vulnerabilities`, 'warning');
      }
      
    } catch (error) {
      // npm audit might fail, but we can still check other things
      log('⚠ Could not run npm audit', 'warning');
      auditResult = { error: error.message };
    }
    
    // Check for known problematic packages
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    // Check for outdated Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    const nodeVersionStatus = majorVersion >= 18 ? 'current' : 'outdated';
    
    if (nodeVersionStatus === 'current') {
      log(`✓ Node.js version ${nodeVersion} is current`, 'success');
    } else {
      log(`⚠ Node.js version ${nodeVersion} is outdated`, 'warning');
    }
    
    const duration = Date.now() - startTime;
    
    // Determine status
    let status = 'pass';
    if (hasHighSeverity) {
      status = 'fail';
    } else if (vulnerabilityCount > 0 || nodeVersionStatus === 'outdated') {
      status = 'warning';
    }
    
    const recommendations = [];
    if (hasHighSeverity) {
      recommendations.push('Fix high/critical severity vulnerabilities immediately');
      recommendations.push('Run: npm audit fix');
    } else if (vulnerabilityCount > 0) {
      recommendations.push('Review and fix security vulnerabilities');
    }
    
    if (nodeVersionStatus === 'outdated') {
      recommendations.push('Update to Node.js LTS version (18.x or higher)');
    }
    
    return recordResult('dependency_security', status, {
      duration,
      audit: auditResult,
      vulnerabilityCount,
      hasHighSeverity,
      nodeVersion: {
        current: nodeVersion,
        majorVersion,
        status: nodeVersionStatus
      },
      totalDependencies: Object.keys(allDependencies).length
    }, recommendations);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`✗ Dependency security check failed: ${error.message}`, 'error');
    
    return recordResult('dependency_security', 'fail', {
      error: error.message,
      duration
    }, ['Review dependency security manually']);
  }
}

/**
 * Report Generation
 */
function generateSummaryReport() {
  logSection('Health Check Summary Report');
  
  const { summary } = healthResults;
  const overallStatus = summary.critical > 0 ? 'CRITICAL' :
                       summary.failed > 0 ? 'FAILED' :
                       summary.warnings > 0 ? 'WARNING' : 'HEALTHY';
  
  const statusColor = overallStatus === 'HEALTHY' ? colors.green :
                     overallStatus === 'WARNING' ? colors.yellow :
                     overallStatus === 'FAILED' ? colors.red : colors.magenta;
  
  console.log(`${colors.bright}Overall Status: ${statusColor}${overallStatus}${colors.reset}\n`);
  
  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`  Total Checks: ${summary.total}`);
  console.log(`  ${colors.green}Passed: ${summary.passed}${colors.reset}`);
  console.log(`  ${colors.yellow}Warnings: ${summary.warnings}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${summary.failed}${colors.reset}`);
  console.log(`  ${colors.magenta}Critical: ${summary.critical}${colors.reset}`);
  
  console.log(`\n${colors.bright}Performance:${colors.reset}`);
  console.log(`  Total Time: ${formatDuration(healthResults.performance.totalTime)}`);
  console.log(`  Environment: ${healthResults.environment}`);
  console.log(`  Timestamp: ${healthResults.timestamp}`);
  
  // Show failed checks
  if (summary.failed > 0 || summary.critical > 0) {
    console.log(`\n${colors.bright}${colors.red}Failed Checks:${colors.reset}`);
    for (const [checkName, result] of Object.entries(healthResults.checks)) {
      if (result.status === 'fail') {
        const isCritical = CRITICAL_CHECKS.includes(checkName);
        const criticalMark = isCritical ? `${colors.magenta}[CRITICAL]${colors.reset} ` : '';
        console.log(`  ${criticalMark}${colors.red}✗${colors.reset} ${checkName}: ${result.details.error || 'Failed'}`);
      }
    }
  }
  
  // Show warnings
  if (summary.warnings > 0) {
    console.log(`\n${colors.bright}${colors.yellow}Warnings:${colors.reset}`);
    for (const [checkName, result] of Object.entries(healthResults.checks)) {
      if (result.status === 'warning') {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${checkName}`);
      }
    }
  }
  
  // Show recommendations
  if (healthResults.recommendations.length > 0) {
    console.log(`\n${colors.bright}Recommendations:${colors.reset}`);
    const uniqueRecommendations = [...new Set(healthResults.recommendations)];
    uniqueRecommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  // Deployment readiness
  console.log(`\n${colors.bright}Deployment Readiness:${colors.reset}`);
  if (summary.critical > 0) {
    console.log(`  ${colors.magenta}❌ NOT READY - Critical issues must be resolved${colors.reset}`);
  } else if (summary.failed > 0) {
    console.log(`  ${colors.red}❌ NOT READY - Failed checks must be addressed${colors.reset}`);
  } else if (summary.warnings > 0) {
    console.log(`  ${colors.yellow}⚠ READY WITH WARNINGS - Consider addressing warnings${colors.reset}`);
  } else {
    console.log(`  ${colors.green}✅ READY FOR DEPLOYMENT${colors.reset}`);
  }
  
  return overallStatus;
}

function saveReportToFile() {
  try {
    const reportPath = path.join(process.cwd(), 'health-check-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(healthResults, null, 2));
    log(`Health check report saved to: ${reportPath}`, 'info');
  } catch (error) {
    log(`Failed to save report: ${error.message}`, 'error');
  }
}

/**
 * Main Execution
 */
async function runHealthCheck() {
  const overallStartTime = Date.now();
  
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                 ZENITH PLATFORM HEALTH CHECK                ║');
  console.log('║              Comprehensive Pre-Deployment Audit             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  log(`Starting comprehensive health check for ${process.cwd()}`, 'info');
  log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'info');
  log(`Node.js version: ${process.version}`, 'info');
  
  // Show what environment variables are available
  const availableEnvVars = [...REQUIRED_ENV_VARS, ...RECOMMENDED_ENV_VARS].filter(varName => !!process.env[varName]);
  log(`Available environment variables: ${availableEnvVars.length > 0 ? availableEnvVars.join(', ') : 'none configured'}`, 'info');
  
  // Run all health checks
  const checks = [
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Database Connectivity', fn: checkDatabaseConnectivity },
    { name: 'Authentication', fn: checkAuthentication },
    { name: 'API Endpoints', fn: checkAPIEndpoints },
    { name: 'Build Integrity', fn: checkBuildIntegrity },
    { name: 'Security Configuration', fn: checkSecurityConfiguration },
    { name: 'File Permissions', fn: checkFilePermissions },
    { name: 'External Services', fn: checkExternalServices },
    { name: 'Performance Metrics', fn: checkPerformanceMetrics },
    { name: 'Dependency Security', fn: checkDependencySecurity }
  ];
  
  for (const check of checks) {
    logSection(check.name);
    
    const checkStartTime = Date.now();
    try {
      await check.fn();
    } catch (error) {
      log(`Unexpected error in ${check.name}: ${error.message}`, 'error');
      recordResult(check.name.toLowerCase().replace(/\s+/g, '_'), 'fail', {
        error: error.message,
        duration: Date.now() - checkStartTime
      });
    }
    
    const checkDuration = Date.now() - checkStartTime;
    healthResults.performance.checkTimes[check.name] = checkDuration;
    log(`${check.name} completed in ${formatDuration(checkDuration)}`, 'info');
  }
  
  // Calculate total time
  healthResults.performance.totalTime = Date.now() - overallStartTime;
  
  // Determine overall status
  const { summary } = healthResults;
  healthResults.overall = summary.critical > 0 ? 'critical' :
                         summary.failed > 0 ? 'failed' :
                         summary.warnings > 0 ? 'warning' : 'healthy';
  
  // Generate and display report
  const overallStatus = generateSummaryReport();
  
  // Save report to file
  saveReportToFile();
  
  // Exit with appropriate code
  const exitCode = healthResults.overall === 'critical' || healthResults.overall === 'failed' ? 1 : 0;
  
  console.log(`\n${colors.bright}Health check completed in ${formatDuration(healthResults.performance.totalTime)}${colors.reset}`);
  
  if (exitCode !== 0) {
    console.log(`${colors.red}${colors.bright}⚠ Health check failed - resolve issues before deployment${colors.reset}`);
  } else {
    console.log(`${colors.green}${colors.bright}✅ Health check passed - system ready${colors.reset}`);
  }
  
  process.exit(exitCode);
}

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'error');
  process.exit(1);
});

// Run the health check if this file is executed directly
if (require.main === module) {
  runHealthCheck().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runHealthCheck,
  healthResults,
  checkDatabaseConnectivity,
  checkAPIEndpoints,
  checkAuthentication,
  checkEnvironmentVariables,
  checkBuildIntegrity,
  checkSecurityConfiguration,
  checkFilePermissions,
  checkExternalServices,
  checkPerformanceMetrics,
  checkDependencySecurity
};