import { startWorkers } from '../queue';
import { cronScheduler } from '../scheduler/cron-scheduler';

let initialized = false;

export async function initializeServices() {
  if (initialized) {
    console.log('Services already initialized');
    return;
  }

  try {
    console.log('Initializing Zenith Platform services...');

    // Start queue workers
    console.log('Starting queue workers...');
    startWorkers();

    // Initialize cron scheduler
    console.log('Initializing cron scheduler...');
    await cronScheduler.initialize();

    initialized = true;
    console.log('✅ All services initialized successfully');

  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    throw error;
  }
}

export function getInitializationStatus() {
  return initialized;
}

// Graceful shutdown
export async function shutdownServices() {
  if (!initialized) {
    return;
  }

  try {
    console.log('Shutting down services...');

    // Stop queue workers
    const { stopWorkers } = await import('../queue');
    await stopWorkers();

    // Shutdown cron scheduler
    await cronScheduler.shutdown();

    initialized = false;
    console.log('✅ Services shut down successfully');

  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
}