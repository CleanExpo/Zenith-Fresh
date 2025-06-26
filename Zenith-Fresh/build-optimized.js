const { execSync } = require('child_process');

console.log('🔧 Starting optimized production build...');

try {
  // Generate Prisma client
  console.log('📝 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully');

  // Build Next.js application with increased memory
  console.log('🏗️ Building Next.js application...');
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
  execSync('npx next build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}