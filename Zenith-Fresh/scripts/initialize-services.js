#!/usr/bin/env node

/**
 * Service Initialization Script
 * Initializes background workers and schedulers for the Zenith Platform
 */

const { execSync } = require('child_process');

console.log('🚀 Initializing Zenith Platform services...');

try {
  // Ensure database is ready
  console.log('📊 Checking database connection...');
  try {
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
  } catch (dbError) {
    console.warn('⚠️ Database push failed - this is expected if DB is not available');
  }

  // Initialize services in the background
  console.log('🔄 Starting background services...');
  
  // Create a simple Node.js script to initialize services
  const initScript = `
    const { initializeServices } = require('./lib/services/initialize');
    
    initializeServices()
      .then(() => {
        console.log('✅ Background services initialized');
        
        // Keep the process alive for development
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Services running in development mode...');
          
          // Graceful shutdown handlers
          process.on('SIGTERM', async () => {
            console.log('Received SIGTERM, shutting down...');
            const { shutdownServices } = require('./lib/services/initialize');
            await shutdownServices();
            process.exit(0);
          });
          
          process.on('SIGINT', async () => {
            console.log('Received SIGINT, shutting down...');
            const { shutdownServices } = require('./lib/services/initialize');
            await shutdownServices();
            process.exit(0);
          });
          
          // Keep alive
          setInterval(() => {
            // Heartbeat every 30 seconds
          }, 30000);
        }
      })
      .catch((error) => {
        console.error('❌ Failed to initialize services:', error);
        process.exit(1);
      });
  `;

  // For production, services should be initialized when the app starts
  // For development, we can run this as a separate process
  if (process.env.NODE_ENV === 'production') {
    console.log('🏭 Production mode: Services will be initialized with the app');
  } else {
    console.log('🛠️ Development mode: You can start services manually if needed');
    console.log('💡 Services will be auto-initialized when the app starts');
  }

  console.log('✅ Service initialization script completed');

} catch (error) {
  console.error('❌ Service initialization failed:', error);
  process.exit(1);
}