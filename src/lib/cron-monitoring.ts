import * as Sentry from '@sentry/nextjs';

export interface CronJobConfig {
  monitorSlug: string;
  schedule: {
    type: 'crontab' | 'interval';
    value: string;
  };
  checkinMargin?: number; // minutes
  maxRuntime?: number; // minutes
  timezone?: string;
}

export class CronMonitor {
  private config: CronJobConfig;

  constructor(config: CronJobConfig) {
    this.config = config;
  }

  /**
   * Start monitoring a cron job
   * @returns checkInId for completing the monitor
   */
  start(): string | undefined {
    try {
      const checkInId = Sentry.captureCheckIn(
        {
          monitorSlug: this.config.monitorSlug,
          status: 'in_progress',
        },
        {
          schedule: this.config.schedule,
          checkinMargin: this.config.checkinMargin || 1,
          maxRuntime: this.config.maxRuntime || 5,
          timezone: this.config.timezone || 'UTC',
        }
      );
      
      console.log(`Cron monitor started: ${this.config.monitorSlug}`);
      return checkInId;
    } catch (error) {
      console.error('Failed to start cron monitor:', error);
      return undefined;
    }
  }

  /**
   * Mark cron job as successful
   */
  success(checkInId: string): void {
    try {
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: this.config.monitorSlug,
        status: 'ok',
      });
      
      console.log(`Cron monitor completed successfully: ${this.config.monitorSlug}`);
    } catch (error) {
      console.error('Failed to mark cron monitor as successful:', error);
    }
  }

  /**
   * Mark cron job as failed
   */
  failure(checkInId: string, error?: Error): void {
    try {
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: this.config.monitorSlug,
        status: 'error',
      });

      if (error) {
        Sentry.captureException(error, {
          tags: { cronJob: this.config.monitorSlug },
        });
      }
      
      console.error(`Cron monitor failed: ${this.config.monitorSlug}`, error);
    } catch (sentryError) {
      console.error('Failed to mark cron monitor as failed:', sentryError);
    }
  }

  /**
   * Wrapper function to monitor a cron job execution
   */
  async monitor<T>(fn: () => Promise<T>): Promise<T> {
    const checkInId = this.start();
    
    try {
      const result = await fn();
      
      if (checkInId) {
        this.success(checkInId);
      }
      
      return result;
    } catch (error) {
      if (checkInId) {
        this.failure(checkInId, error as Error);
      }
      throw error;
    }
  }
}

// Predefined cron monitors for common tasks
export const CronMonitors = {
  // Database cleanup - runs daily at 2 AM
  databaseCleanup: new CronMonitor({
    monitorSlug: 'database-cleanup',
    schedule: {
      type: 'crontab',
      value: '0 2 * * *', // Daily at 2 AM
    },
    checkinMargin: 5,
    maxRuntime: 30,
    timezone: 'UTC',
  }),

  // Email queue processing - runs every 5 minutes
  emailQueue: new CronMonitor({
    monitorSlug: 'email-queue-processor',
    schedule: {
      type: 'crontab',
      value: '*/5 * * * *', // Every 5 minutes
    },
    checkinMargin: 2,
    maxRuntime: 3,
    timezone: 'UTC',
  }),

  // Analytics aggregation - runs hourly
  analyticsAggregation: new CronMonitor({
    monitorSlug: 'analytics-aggregation',
    schedule: {
      type: 'crontab',
      value: '0 * * * *', // Every hour
    },
    checkinMargin: 5,
    maxRuntime: 10,
    timezone: 'UTC',
  }),

  // Backup creation - runs daily at 3 AM
  backupCreation: new CronMonitor({
    monitorSlug: 'backup-creation',
    schedule: {
      type: 'crontab',
      value: '0 3 * * *', // Daily at 3 AM
    },
    checkinMargin: 10,
    maxRuntime: 60,
    timezone: 'UTC',
  }),

  // Health check - runs every minute
  healthCheck: new CronMonitor({
    monitorSlug: 'health-check',
    schedule: {
      type: 'crontab',
      value: '* * * * *', // Every minute
    },
    checkinMargin: 1,
    maxRuntime: 1,
    timezone: 'UTC',
  }),

  // User cleanup - runs weekly on Sunday at 1 AM
  userCleanup: new CronMonitor({
    monitorSlug: 'user-cleanup',
    schedule: {
      type: 'crontab',
      value: '0 1 * * 0', // Weekly on Sunday at 1 AM
    },
    checkinMargin: 30,
    maxRuntime: 120,
    timezone: 'UTC',
  }),
};

// Utility function to create custom cron monitor
export function createCronMonitor(config: CronJobConfig): CronMonitor {
  return new CronMonitor(config);
}

// Example usage function
export async function exampleCronJob() {
  await CronMonitors.healthCheck.monitor(async () => {
    // Your cron job logic here
    console.log('Performing health check...');
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate potential failure
    if (Math.random() < 0.1) {
      throw new Error('Health check failed');
    }
    
    console.log('Health check completed successfully');
  });
}