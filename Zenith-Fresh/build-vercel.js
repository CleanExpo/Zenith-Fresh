#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Vercel-optimized build process...');

// Environment setup for production build
const buildEnv = {
  ...process.env,
  NODE_ENV: 'production',
  NODE_OPTIONS: '--max-old-space-size=8192',
  SKIP_REDIS: 'true', // Bypass Redis for build
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy:5432/dummy',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'build-secret',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://localhost:3000'
};

try {
  // Clean any previous build artifacts
  console.log('🧹 Cleaning build artifacts...');
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'inherit' });
  }
  if (fs.existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'inherit' });
  }

  // Generate Prisma client
  console.log('⚡ Generating Prisma client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit', 
    env: buildEnv 
  });

  // Type check first to catch any real TypeScript errors (excluding test files)
  console.log('🔍 Running TypeScript check...');
  execSync('npx tsc --project tsconfig.build.json --noEmit --skipLibCheck', { 
    stdio: 'inherit', 
    env: buildEnv 
  });

  // Build the application
  console.log('🏗️  Building Next.js application...');
  execSync('npx next build', { 
    stdio: 'inherit', 
    env: buildEnv 
  });

  console.log('✅ Build completed successfully!');
  console.log('📊 Build summary:');
  
  // Show build size information
  if (fs.existsSync('.next')) {
    const buildInfo = execSync('du -sh .next', { encoding: 'utf8', env: buildEnv });
    console.log(`   Build size: ${buildInfo.trim()}`);
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  
  // Provide helpful debugging information
  console.log('\n🔧 Debug information:');
  console.log('- Node version:', process.version);
  console.log('- Environment:', process.env.NODE_ENV);
  console.log('- Working directory:', process.cwd());
  
  // Check for common issues
  if (error.message.includes('typescript')) {
    console.log('\n💡 TypeScript compilation failed. Running diagnostic...');
    try {
      execSync('npx tsc --listFiles --noEmit', { stdio: 'pipe', env: buildEnv });
    } catch (tscError) {
      console.log('TypeScript error details:', tscError.message);
    }
  }
  
  process.exit(1);
}