#!/usr/bin/env node

// Optimized build script for large codebase
const { spawn } = require('child_process');

console.log('🔧 Starting optimized production build...');

// Set Node.js memory limit and optimization flags
process.env.NODE_OPTIONS = '--max-old-space-size=8192 --max-semi-space-size=1024';

// Run Prisma generate first
console.log('📝 Generating Prisma client...');
const prismaGenerate = spawn('npx', ['prisma', 'generate'], {
  stdio: 'inherit',
  env: process.env
});

prismaGenerate.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Prisma generate failed');
    process.exit(1);
  }
  
  console.log('✅ Prisma client generated successfully');
  console.log('🏗️ Building Next.js application...');
  
  // Run Next.js build with optimizations
  const nextBuild = spawn('npx', ['next', 'build'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      // Optimize build performance
      NEXT_PRIVATE_OPTIMIZE_MEMORY: '1',
      NEXT_PRIVATE_CPU_PROF: '0'
    }
  });
  
  nextBuild.on('close', (buildCode) => {
    if (buildCode !== 0) {
      console.error('❌ Next.js build failed');
      process.exit(1);
    }
    
    console.log('🎉 Production build completed successfully!');
    console.log('🚀 Ready for deployment to Vercel');
  });
});