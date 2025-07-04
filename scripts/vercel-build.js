#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting custom Vercel build process...');

try {
  // Run Prisma generate
  console.log('📦 Generating Prisma client...');
  execSync('prisma generate', { stdio: 'inherit' });
  
  // Run Next.js build
  console.log('🏗️ Building Next.js application...');
  execSync('next build', { stdio: 'inherit' });
  
  // Verify routes-manifest.json exists
  const routesManifestPath = path.join(process.cwd(), '.next', 'routes-manifest.json');
  if (fs.existsSync(routesManifestPath)) {
    console.log('✅ routes-manifest.json found at:', routesManifestPath);
    
    // Copy to multiple locations to help Vercel find it
    const rootPath = path.join(process.cwd(), 'routes-manifest.json');
    const publicPath = path.join(process.cwd(), 'public', 'routes-manifest.json');
    
    fs.copyFileSync(routesManifestPath, rootPath);
    
    // Ensure public directory exists
    if (!fs.existsSync(path.join(process.cwd(), 'public'))) {
      fs.mkdirSync(path.join(process.cwd(), 'public'));
    }
    fs.copyFileSync(routesManifestPath, publicPath);
    
    console.log('📋 Copied routes-manifest.json to root and public directories');
    
    // Create a symlink without space to work around Vercel bug
    try {
      const symlinkPath = path.join(process.cwd(), '.next-fixed');
      if (fs.existsSync(symlinkPath)) {
        fs.rmSync(symlinkPath, { recursive: true, force: true });
      }
      fs.symlinkSync('.next', symlinkPath);
      console.log('🔗 Created .next-fixed symlink');
    } catch (error) {
      console.warn('⚠️ Could not create symlink:', error.message);
    }
  } else {
    console.warn('⚠️ routes-manifest.json not found!');
  }
  
  // List .next directory contents
  console.log('📁 .next directory contents:');
  execSync('ls -la .next/', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}