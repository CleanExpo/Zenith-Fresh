#!/usr/bin/env node

/**
 * Deployment Readiness Check
 * 
 * Comprehensive check of all deployment requirements
 * Usage: node scripts/deployment-readiness.js
 */

const fs = require('fs');
const path = require('path');

function checkDeploymentReadiness() {
  console.log('🚀 DEPLOYMENT READINESS CHECK\n');
  console.log('='.repeat(50));
  
  const results = {
    timestamp: new Date().toISOString(),
    status: 'ready',
    errors: [],
    warnings: [],
    checks: {}
  };

  try {
    // 1. Build System Check
    console.log('\n1. 🏗️  BUILD SYSTEM');
    console.log('-'.repeat(20));
    
    // Check package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log(`   ✅ Package name: ${packageJson.name}`);
      console.log(`   ✅ Version: ${packageJson.version}`);
      
      // Check build script
      if (packageJson.scripts && packageJson.scripts.build) {
        console.log(`   ✅ Build script: ${packageJson.scripts.build}`);
        results.checks.buildScript = true;
      } else {
        console.log('   ❌ Build script missing');
        results.errors.push('Build script not found in package.json');
        results.checks.buildScript = false;
      }
    } else {
      console.log('   ❌ package.json not found');
      results.errors.push('package.json missing');
    }

    // Check next.config.js
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      console.log('   ✅ Next.js config exists');
      results.checks.nextConfig = true;
    } else {
      console.log('   ⚠️  Next.js config not found (using defaults)');
      results.warnings.push('next.config.js not found');
      results.checks.nextConfig = false;
    }

    // 2. Database Configuration
    console.log('\n2. 🗄️  DATABASE CONFIGURATION');
    console.log('-'.repeat(30));
    
    // Check Prisma schema
    const prismaSchemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    if (fs.existsSync(prismaSchemaPath)) {
      console.log('   ✅ Prisma schema exists');
      
      const schemaContent = fs.readFileSync(prismaSchemaPath, 'utf8');
      if (schemaContent.includes('provider = "postgresql"')) {
        console.log('   ✅ PostgreSQL provider configured');
        results.checks.databaseProvider = true;
      } else {
        console.log('   ❌ PostgreSQL provider not configured');
        results.errors.push('Database provider not set to PostgreSQL');
        results.checks.databaseProvider = false;
      }
    } else {
      console.log('   ❌ Prisma schema not found');
      results.errors.push('Prisma schema missing');
    }

    // Check for Prisma Client
    const prismaClientPath = path.join(process.cwd(), 'node_modules', '@prisma', 'client');
    if (fs.existsSync(prismaClientPath)) {
      console.log('   ✅ Prisma Client installed');
      results.checks.prismaClient = true;
    } else {
      console.log('   ⚠️  Prisma Client not generated');
      results.warnings.push('Run "npx prisma generate" before deployment');
      results.checks.prismaClient = false;
    }

    // 3. Authentication System
    console.log('\n3. 🔐 AUTHENTICATION SYSTEM');
    console.log('-'.repeat(30));
    
    // Check auth configuration
    const authConfigPath = path.join(process.cwd(), 'lib', 'auth.ts');
    if (fs.existsSync(authConfigPath)) {
      console.log('   ✅ NextAuth configuration exists');
      
      const authConfig = fs.readFileSync(authConfigPath, 'utf8');
      if (authConfig.includes('GoogleProvider')) {
        console.log('   ✅ Google OAuth provider configured');
        results.checks.googleOAuth = true;
      } else {
        console.log('   ⚠️  Google OAuth not configured');
        results.warnings.push('Google OAuth provider not found');
        results.checks.googleOAuth = false;
      }
      
      if (authConfig.includes('CredentialsProvider')) {
        console.log('   ✅ Credentials provider configured');
        results.checks.credentialsAuth = true;
      } else {
        console.log('   ❌ Credentials provider missing');
        results.errors.push('Credentials provider not configured');
        results.checks.credentialsAuth = false;
      }
    } else {
      console.log('   ❌ NextAuth configuration not found');
      results.errors.push('NextAuth configuration missing');
    }

    // Check auth API route
    const authApiPath = path.join(process.cwd(), 'app', 'api', 'auth', '[...nextauth]', 'route.ts');
    if (fs.existsSync(authApiPath)) {
      console.log('   ✅ NextAuth API route exists');
      results.checks.authApiRoute = true;
    } else {
      console.log('   ❌ NextAuth API route missing');
      results.errors.push('NextAuth API route not found');
      results.checks.authApiRoute = false;
    }

    // 4. Deployment Configuration
    console.log('\n4. 🌐 DEPLOYMENT CONFIGURATION');
    console.log('-'.repeat(35));
    
    // Check Vercel configuration
    const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
    if (fs.existsSync(vercelConfigPath)) {
      console.log('   ✅ Vercel configuration exists');
      
      const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
      if (vercelConfig.functions) {
        console.log('   ✅ Function timeouts configured');
        results.checks.functionTimeouts = true;
      } else {
        console.log('   ⚠️  Function timeouts not configured');
        results.warnings.push('Consider adding function timeout configuration');
        results.checks.functionTimeouts = false;
      }
      
      if (vercelConfig.headers) {
        console.log('   ✅ Security headers configured');
        results.checks.securityHeaders = true;
      } else {
        console.log('   ⚠️  Security headers not configured');
        results.warnings.push('Security headers not configured');
        results.checks.securityHeaders = false;
      }
    } else {
      console.log('   ⚠️  Vercel configuration not found');
      results.warnings.push('vercel.json not found');
    }

    // Check .env.example
    const envExamplePath = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(envExamplePath)) {
      console.log('   ✅ Environment variables template exists');
      
      const envExample = fs.readFileSync(envExamplePath, 'utf8');
      const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
      const missingVars = requiredVars.filter(varName => !envExample.includes(varName));
      
      if (missingVars.length === 0) {
        console.log('   ✅ All required environment variables documented');
        results.checks.envDocumentation = true;
      } else {
        console.log(`   ⚠️  Missing environment variables: ${missingVars.join(', ')}`);
        results.warnings.push(`Missing env vars in .env.example: ${missingVars.join(', ')}`);
        results.checks.envDocumentation = false;
      }
    } else {
      console.log('   ❌ .env.example not found');
      results.errors.push('.env.example file missing');
    }

    // 5. Redis Configuration
    console.log('\n5. 🔴 REDIS CONFIGURATION');
    console.log('-'.repeat(25));
    
    // Check middleware for Redis bypass
    const middlewarePath = path.join(process.cwd(), 'middleware.ts');
    if (fs.existsSync(middlewarePath)) {
      const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
      if (middlewareContent.includes('SKIP_REDIS')) {
        console.log('   ✅ Redis bypass configured for development');
        results.checks.redisBypass = true;
      } else {
        console.log('   ⚠️  Redis bypass not configured');
        results.warnings.push('Redis bypass not implemented');
        results.checks.redisBypass = false;
      }
    }

    // Check Redis configuration
    const redisConfigPath = path.join(process.cwd(), 'lib', 'redis.ts');
    if (fs.existsSync(redisConfigPath)) {
      console.log('   ✅ Redis configuration exists');
      
      const redisConfig = fs.readFileSync(redisConfigPath, 'utf8');
      if (redisConfig.includes('tls:')) {
        console.log('   ✅ TLS configuration for Redis Cloud');
        results.checks.redisTLS = true;
      } else {
        console.log('   ⚠️  TLS configuration missing');
        results.warnings.push('Redis TLS configuration not found');
        results.checks.redisTLS = false;
      }
    } else {
      console.log('   ❌ Redis configuration not found');
      results.errors.push('Redis configuration missing');
    }

    // 6. Core Features
    console.log('\n6. 🎯 CORE FEATURES');
    console.log('-'.repeat(20));
    
    // Check health endpoint
    const healthEndpointPath = path.join(process.cwd(), 'app', 'api', 'health', 'route.ts');
    if (fs.existsSync(healthEndpointPath)) {
      console.log('   ✅ Health endpoint exists');
      results.checks.healthEndpoint = true;
    } else {
      console.log('   ❌ Health endpoint missing');
      results.errors.push('Health endpoint not found');
      results.checks.healthEndpoint = false;
    }

    // Check feature flags
    const featureFlagsPath = path.join(process.cwd(), 'app', 'api', 'feature-flags', 'route.ts');
    if (fs.existsSync(featureFlagsPath)) {
      console.log('   ✅ Feature flags system exists');
      results.checks.featureFlags = true;
    } else {
      console.log('   ⚠️  Feature flags system not found');
      results.warnings.push('Feature flags system missing');
      results.checks.featureFlags = false;
    }

    // Check website analyzer
    const websiteAnalyzerPath = path.join(process.cwd(), 'app', 'api', 'website-analyzer');
    if (fs.existsSync(websiteAnalyzerPath)) {
      console.log('   ✅ Website analyzer API exists');
      results.checks.websiteAnalyzer = true;
    } else {
      console.log('   ❌ Website analyzer API missing');
      results.errors.push('Website analyzer API not found');
      results.checks.websiteAnalyzer = false;
    }

    // 7. Production Readiness
    console.log('\n7. 🏭 PRODUCTION READINESS');
    console.log('-'.repeat(30));
    
    // Check for development-specific files that shouldn't be deployed
    const devFiles = ['.env.local', '.env.development'];
    devFiles.forEach(file => {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        console.log(`   ⚠️  ${file} found (ensure not deployed to production)`);
        results.warnings.push(`${file} present - ensure not deployed`);
      } else {
        console.log(`   ✅ ${file} not present in deployment`);
      }
    });

    // Check TypeScript compilation
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      console.log('   ✅ TypeScript configuration exists');
      results.checks.typescript = true;
    } else {
      console.log('   ❌ TypeScript configuration missing');
      results.errors.push('tsconfig.json not found');
      results.checks.typescript = false;
    }

    // Final Assessment
    console.log('\n' + '='.repeat(50));
    console.log('📊 DEPLOYMENT READINESS SUMMARY');
    console.log('='.repeat(50));

    if (results.errors.length === 0) {
      if (results.warnings.length === 0) {
        console.log('✅ READY FOR DEPLOYMENT - No issues found');
        results.status = 'ready';
      } else {
        console.log('⚠️  READY WITH WARNINGS - Minor issues found');
        results.status = 'ready-with-warnings';
      }
    } else {
      console.log('❌ NOT READY FOR DEPLOYMENT - Critical issues found');
      results.status = 'not-ready';
    }

    if (results.errors.length > 0) {
      console.log('\n🚨 CRITICAL ERRORS:');
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      results.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    // Deployment Instructions
    if (results.status === 'ready' || results.status === 'ready-with-warnings') {
      console.log('\n🚀 DEPLOYMENT INSTRUCTIONS:');
      console.log('   1. Configure environment variables in Vercel dashboard:');
      console.log('      - DATABASE_URL (PostgreSQL connection string)');
      console.log('      - NEXTAUTH_SECRET (secure 32+ character string)');
      console.log('      - NEXTAUTH_URL (https://your-domain.com)');
      console.log('      - REDIS_URL (Redis Cloud connection string) or SKIP_REDIS=true');
      console.log('   2. Connect your domain in Vercel');
      console.log('   3. Push to main branch to trigger deployment');
      console.log('   4. Monitor deployment logs for any issues');
      console.log('   5. Test authentication and core features post-deployment');
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Deployment readiness check completed at ${new Date().toLocaleString()}`);
    
    return results;

  } catch (error) {
    console.error('\n❌ Deployment readiness check failed:');
    console.error(`   Error: ${error.message}`);
    
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Run check if called directly
if (require.main === module) {
  const result = checkDeploymentReadiness();
  
  // Write results to file
  const resultsPath = path.join(process.cwd(), 'deployment-readiness-report.json');
  fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
  console.log(`\n📄 Detailed report saved to: ${resultsPath}`);
  
  if (result.status === 'not-ready' || result.status === 'error') {
    process.exit(1);
  }
}

module.exports = { checkDeploymentReadiness };