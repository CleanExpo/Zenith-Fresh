#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * Validates all required environment variables and configurations for production deployment
 */

const fs = require('fs');
const path = require('path');

// Required environment variables for production
const REQUIRED_PRODUCTION_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'RESEND_API_KEY',
  'REDIS_URL'
];

// Security requirements
const SECURITY_REQUIREMENTS = {
  NEXTAUTH_SECRET: (value) => value && value.length >= 32,
  NEXTAUTH_URL: (value) => value && value.startsWith('https://'),
  DATABASE_URL: (value) => value && !value.includes('localhost'),
  NODE_ENV: (value) => value === 'production'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateEnvironmentVariables() {
  log('\n🔍 Validating Production Environment Variables...', 'cyan');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: []
  };
  
  // Check required variables
  for (const varName of REQUIRED_PRODUCTION_VARS) {
    const value = process.env[varName];
    
    if (!value) {
      results.failed++;
      results.errors.push(`❌ ${varName} is not set`);
      log(`❌ ${varName} is not set`, 'red');
    } else {
      results.passed++;
      log(`✅ ${varName} is configured`, 'green');
    }
  }
  
  // Check security requirements
  log('\n🔒 Validating Security Requirements...', 'cyan');
  
  for (const [varName, validator] of Object.entries(SECURITY_REQUIREMENTS)) {
    const value = process.env[varName];
    
    if (value && validator(value)) {
      log(`✅ ${varName} meets security requirements`, 'green');
    } else if (value) {
      results.warnings++;
      log(`⚠️  ${varName} does not meet security requirements`, 'yellow');
    }
  }
  
  return results;
}

function validateGoogleOAuthSetup() {
  log('\n🔐 Validating Google OAuth Configuration...', 'cyan');
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const nextauthUrl = process.env.NEXTAUTH_URL;
  
  const errors = [];
  
  if (!clientId) {
    errors.push('GOOGLE_CLIENT_ID is not set');
  } else if (!clientId.includes('.apps.googleusercontent.com')) {
    errors.push('GOOGLE_CLIENT_ID format appears invalid');
  } else {
    log('✅ Google Client ID is configured', 'green');
  }
  
  if (!clientSecret) {
    errors.push('GOOGLE_CLIENT_SECRET is not set');
  } else if (clientSecret.length < 20) {
    errors.push('GOOGLE_CLIENT_SECRET appears too short');
  } else {
    log('✅ Google Client Secret is configured', 'green');
  }
  
  if (nextauthUrl) {
    const expectedRedirectUri = `${nextauthUrl}/api/auth/callback/google`;
    log(`📋 Expected Google OAuth Redirect URI: ${expectedRedirectUri}`, 'blue');
    log('   Make sure this is configured in Google Cloud Console', 'blue');
  }
  
  return errors;
}

function validateDatabaseConfiguration() {
  log('\n🗄️  Validating Database Configuration...', 'cyan');
  
  const databaseUrl = process.env.DATABASE_URL;
  const errors = [];
  
  if (!databaseUrl) {
    errors.push('DATABASE_URL is not set');
    return errors;
  }
  
  if (databaseUrl.includes('localhost')) {
    errors.push('DATABASE_URL points to localhost (not suitable for production)');
  }
  
  if (!databaseUrl.startsWith('postgresql://')) {
    errors.push('DATABASE_URL should use PostgreSQL');
  }
  
  if (databaseUrl.includes('password') || databaseUrl.includes('user')) {
    errors.push('DATABASE_URL contains placeholder values');
  }
  
  if (errors.length === 0) {
    log('✅ Database configuration appears valid', 'green');
    log(`📋 Database: ${databaseUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')}`, 'blue');
  }
  
  return errors;
}

function validateFileStructure() {
  log('\n📁 Validating File Structure...', 'cyan');
  
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'lib/auth.ts',
    'app/api/auth/[...nextauth]/route.ts',
    'app/api/auth/providers/route.ts',
    'middleware.ts'
  ];
  
  const errors = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log(`✅ ${file} exists`, 'green');
    } else {
      errors.push(`${file} is missing`);
      log(`❌ ${file} is missing`, 'red');
    }
  }
  
  return errors;
}

function generateProductionChecklist() {
  log('\n📋 Production Deployment Checklist:', 'magenta');
  
  const checklist = [
    '□ Set up Google OAuth redirect URI in Google Cloud Console',
    '□ Configure Vercel environment variables',
    '□ Test authentication flow in staging',
    '□ Verify database migrations are applied',
    '□ Check API endpoints are accessible',
    '□ Test Stripe webhooks if using payments',
    '□ Verify email delivery with Resend',
    '□ Set up monitoring and error tracking',
    '□ Test rate limiting and security headers',
    '□ Perform load testing'
  ];
  
  checklist.forEach(item => {
    log(`  ${item}`, 'blue');
  });
}

function main() {
  log('🚀 Zenith Platform - Production Environment Validation', 'magenta');
  log('=' * 60, 'magenta');
  
  // Load environment variables
  try {
    require('dotenv').config({ path: '.env.production' });
    require('dotenv').config({ path: '.env.local' });
    require('dotenv').config({ path: '.env' });
  } catch (error) {
    log('⚠️  Could not load environment files', 'yellow');
  }
  
  const results = {
    env: validateEnvironmentVariables(),
    oauth: validateGoogleOAuthSetup(),
    database: validateDatabaseConfiguration(),
    files: validateFileStructure()
  };
  
  const totalErrors = results.env.errors.length + 
                     results.oauth.length + 
                     results.database.length + 
                     results.files.length;
  
  const totalWarnings = results.env.warnings;
  
  log('\n📊 Validation Summary:', 'cyan');
  log(`   Passed Checks: ${results.env.passed}`, 'green');
  log(`   Warnings: ${totalWarnings}`, 'yellow');
  log(`   Errors: ${totalErrors}`, totalErrors > 0 ? 'red' : 'green');
  
  if (totalErrors > 0) {
    log('\n❌ Production deployment is NOT ready:', 'red');
    [...results.env.errors, ...results.oauth, ...results.database, ...results.files]
      .forEach(error => log(`   • ${error}`, 'red'));
  } else if (totalWarnings > 0) {
    log('\n⚠️  Production deployment ready with warnings:', 'yellow');
    log('   Consider addressing warnings before deployment', 'yellow');
  } else {
    log('\n✅ Production deployment is READY!', 'green');
  }
  
  generateProductionChecklist();
  
  log('\n🔗 Useful Resources:', 'cyan');
  log('   • Google Cloud Console: https://console.cloud.google.com', 'blue');
  log('   • NextAuth.js Docs: https://next-auth.js.org/configuration/options', 'blue');
  log('   • Vercel Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables', 'blue');
  
  process.exit(totalErrors > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = {
  validateEnvironmentVariables,
  validateGoogleOAuthSetup,
  validateDatabaseConfiguration,
  validateFileStructure
};