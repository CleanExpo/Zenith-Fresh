const { execSync } = require('child_process');

console.log('🔧 Starting optimized production build...');

try {
  // Generate Prisma client
  console.log('📝 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit', env: { ...process.env } });
  console.log('✅ Prisma client generated successfully');

  // Build Next.js application with increased memory
  console.log('🏗️ Building Next.js application...');
  execSync('npx next build', { 
    stdio: 'inherit', 
    env: { 
      ...process.env, 
      NODE_OPTIONS: '--max-old-space-size=4096',
      NODE_ENV: 'production'
    }
  });
  console.log('✅ Build completed successfully!');

} catch (error) {
  console.error('❌ Build failed with error:', error.message);
  if (error.stdout) console.error('STDOUT:', error.stdout.toString());
  if (error.stderr) console.error('STDERR:', error.stderr.toString());
  process.exit(1);
}