#!/usr/bin/env node

/**
 * Zenith Platform - Staging Environment Variable Generator
 * Generates secure environment variables for staging deployment
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate secure random string
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Generate staging environment variables
function generateStagingEnvVars() {
  const envVars = {
    // Application URLs
    NEXTAUTH_URL: 'https://staging.zenith.engineer',
    NEXT_PUBLIC_APP_URL: 'https://staging.zenith.engineer',
    NEXT_PUBLIC_API_URL: 'https://staging.zenith.engineer/api',
    CORS_ORIGIN: 'https://staging.zenith.engineer',

    // Environment
    NODE_ENV: 'staging',
    NEXT_PUBLIC_APP_ENV: 'staging',

    // Security Secrets (Generate new ones for staging)
    NEXTAUTH_SECRET: generateSecret(32),
    JWT_SECRET: generateSecret(64),

    // Database (Will be filled from Railway)
    DATABASE_URL: '# TO BE FILLED FROM RAILWAY',
    POSTGRES_PRISMA_URL: '# TO BE FILLED FROM RAILWAY',
    POSTGRES_URL_NON_POOLING: '# TO BE FILLED FROM RAILWAY',
    DIRECT_URL: '# TO BE FILLED FROM RAILWAY',

    // OAuth Providers (Use same as production)
    GOOGLE_CLIENT_ID: '# COPY FROM PRODUCTION',
    GOOGLE_CLIENT_SECRET: '# COPY FROM PRODUCTION',

    // Payment Processing (Stripe Test Mode)
    STRIPE_SECRET_KEY: 'sk_test_# USE STRIPE TEST KEYS',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_# USE STRIPE TEST KEYS',
    STRIPE_WEBHOOK_SECRET: 'whsec_# USE STRIPE TEST WEBHOOK',

    // Redis (Separate staging instance)
    REDIS_URL: 'redis://# STAGING REDIS INSTANCE',

    // Email Service (Test mode)
    RESEND_API_KEY: '# SAME AS PRODUCTION OR TEST KEY',
    EMAIL_FROM: 'staging@zenith.engineer',

    // AI Services (Use with caution - costs money)
    OPENAI_API_KEY: '# COPY FROM PRODUCTION IF NEEDED',
    ANTHROPIC_API_KEY: '# COPY FROM PRODUCTION IF NEEDED',
    GOOGLE_AI_API_KEY: '# COPY FROM PRODUCTION IF NEEDED',

    // Error Tracking (Separate staging project)
    NEXT_PUBLIC_SENTRY_DSN: '# STAGING SENTRY PROJECT DSN',
    SENTRY_ORG: 'zenith-platform',
    SENTRY_PROJECT: 'zenith-staging',

    // Analytics (Separate staging property)
    NEXT_PUBLIC_GA_MEASUREMENT_ID: '# STAGING GA4 PROPERTY',

    // Feature Flags
    FEATURE_FLAGS_ENABLED: 'true',
    NEXT_PUBLIC_FEATURE_ENHANCED_ANALYZER: 'true',
    NEXT_PUBLIC_FEATURE_TEAM_MANAGEMENT: 'true',
    NEXT_PUBLIC_FEATURE_AI_CONTENT_ANALYSIS: 'false',
    NEXT_PUBLIC_FEATURE_COMPETITIVE_INTELLIGENCE: 'false',

    // Staging-specific settings
    STAGING_MODE: 'true',
    DISABLE_PAYMENT_PROCESSING: 'true',
    MOCK_EXTERNAL_APIS: 'false',

    // Security Settings
    FORCE_HTTPS: 'true',
    SECURE_COOKIES: 'true',
  };

  return envVars;
}

// Generate Vercel environment variable commands
function generateVercelCommands(envVars) {
  const commands = [];
  
  commands.push('# Vercel CLI commands to set staging environment variables');
  commands.push('# Run these commands to configure staging environment');
  commands.push('');
  
  Object.entries(envVars).forEach(([key, value]) => {
    if (value.startsWith('#')) {
      commands.push(`# ${key}=${value}`);
    } else {
      commands.push(`vercel env add ${key} staging`);
      commands.push(`# Value: ${value}`);
      commands.push('');
    }
  });
  
  return commands.join('\n');
}

// Generate environment file
function generateEnvFile(envVars) {
  const lines = [];
  
  lines.push('# Zenith Platform - Staging Environment Variables');
  lines.push('# Generated on: ' + new Date().toISOString());
  lines.push('# WARNING: Keep this file secure and never commit it!');
  lines.push('');
  
  Object.entries(envVars).forEach(([key, value]) => {
    lines.push(`${key}=${value}`);
  });
  
  return lines.join('\n');
}

// Main function
function main() {
  console.log('🔧 Generating staging environment variables...');
  
  // Create staging directory if it doesn't exist
  const stagingDir = path.join(__dirname, '../../scripts/staging');
  if (!fs.existsSync(stagingDir)) {
    fs.mkdirSync(stagingDir, { recursive: true });
  }
  
  // Generate environment variables
  const envVars = generateStagingEnvVars();
  
  // Generate files
  const envFile = generateEnvFile(envVars);
  const vercelCommands = generateVercelCommands(envVars);
  
  // Write files
  const envFilePath = path.join(__dirname, '../../.env.staging.template');
  const commandsFilePath = path.join(stagingDir, 'vercel-env-commands.sh');
  
  fs.writeFileSync(envFilePath, envFile);
  fs.writeFileSync(commandsFilePath, vercelCommands);
  
  // Make commands file executable
  fs.chmodSync(commandsFilePath, '755');
  
  console.log('✅ Files generated:');
  console.log(`   - ${envFilePath}`);
  console.log(`   - ${commandsFilePath}`);
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Set up Railway database to get DATABASE_URL');
  console.log('2. Configure OAuth providers for staging domain');
  console.log('3. Set up Stripe test keys');
  console.log('4. Run vercel-env-commands.sh to set Vercel environment variables');
  console.log('');
  console.log('🔐 Generated secrets:');
  console.log(`   NEXTAUTH_SECRET: ${envVars.NEXTAUTH_SECRET}`);
  console.log(`   JWT_SECRET: ${envVars.JWT_SECRET.substring(0, 16)}...`);
  console.log('');
  console.log('⚠️  Keep these secrets secure!');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateStagingEnvVars,
  generateVercelCommands,
  generateEnvFile
};