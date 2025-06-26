let initialized = false;

// Dynamic imports to prevent build issues
async function getDependencies() {
  try {
    const [queueModule, schedulerModule] = await Promise.all([
      import('../queue'),
      import('../scheduler/cron-scheduler')
    ]);
    
    return {
      startWorkers: queueModule.startWorkers,
      cronScheduler: schedulerModule.cronScheduler,
    };
  } catch (error) {
    console.warn('Some service dependencies not available:', error);
    return {
      startWorkers: () => {
        console.warn('Queue workers not available in this environment');
      },
      cronScheduler: {
        initialize: async () => {
          console.warn('Cron scheduler not available in this environment');
        },
        shutdown: async () => {},
      },
    };
  }
}

export async function initializeServices() {
  if (initialized) {
    console.log('Services already initialized');
    return;
  }

  try {
    console.log('Initializing Zenith Platform services...');

    const { startWorkers, cronScheduler } = await getDependencies();

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

    const { cronScheduler } = await getDependencies();

    // Stop queue workers
    try {
      const { stopWorkers } = await import('../queue');
      await stopWorkers();
    } catch (error) {
      console.warn('Could not stop queue workers:', error);
    }

    // Shutdown cron scheduler
    await cronScheduler.shutdown();

    initialized = false;
    console.log('✅ Services shut down successfully');

  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
}