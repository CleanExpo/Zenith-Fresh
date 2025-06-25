import { Queue, Worker, Job } from 'bullmq';
import { queueConfig, QUEUE_NAMES, JOB_TYPES } from './config';
import { processScanJob, processScheduledScanJob, ScanJobData } from './processors/scan-processor';
import { processNotificationJob } from './processors/notification-processor';

// Create queues
export const websiteScanQueue = new Queue(QUEUE_NAMES.WEBSITE_SCAN, queueConfig);
export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, queueConfig);
export const scheduledScanQueue = new Queue(QUEUE_NAMES.SCHEDULED_SCAN, queueConfig);

// Workers
let scanWorker: Worker | null = null;
let notificationWorker: Worker | null = null;
let scheduledScanWorker: Worker | null = null;

export function startWorkers() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Starting queue workers...');
  }

  // Website scan worker
  scanWorker = new Worker(
    QUEUE_NAMES.WEBSITE_SCAN,
    async (job: Job<ScanJobData>) => {
      console.log(`Processing scan job ${job.id} for URL: ${job.data.url}`);
      return processScanJob(job);
    },
    {
      ...queueConfig,
      concurrency: 2, // Process up to 2 scans simultaneously
    }
  );

  // Notification worker
  notificationWorker = new Worker(
    QUEUE_NAMES.NOTIFICATION,
    async (job: Job) => {
      console.log(`Processing notification job ${job.id}`);
      return processNotificationJob(job);
    },
    {
      ...queueConfig,
      concurrency: 5, // Process up to 5 notifications simultaneously
    }
  );

  // Scheduled scan worker
  scheduledScanWorker = new Worker(
    QUEUE_NAMES.SCHEDULED_SCAN,
    async (job: Job<{ scheduledScanId: string }>) => {
      console.log(`Processing scheduled scan job ${job.id}`);
      return processScheduledScanJob(job);
    },
    {
      ...queueConfig,
      concurrency: 1, // Process one scheduled scan at a time
    }
  );

  // Error handling for workers
  [scanWorker, notificationWorker, scheduledScanWorker].forEach((worker, index) => {
    const workerNames = ['scan', 'notification', 'scheduledScan'];
    
    worker.on('completed', (job, result) => {
      console.log(`${workerNames[index]} job ${job.id} completed:`, result);
    });

    worker.on('failed', (job, err) => {
      console.error(`${workerNames[index]} job ${job?.id} failed:`, err);
    });

    worker.on('error', (err) => {
      console.error(`${workerNames[index]} worker error:`, err);
    });
  });

  console.log('Queue workers started successfully');
}

export function stopWorkers() {
  console.log('Stopping queue workers...');
  
  const workers = [scanWorker, notificationWorker, scheduledScanWorker];
  const promises = workers.map(worker => worker?.close());
  
  return Promise.all(promises);
}

// Job creation functions
export async function addScanJob(data: ScanJobData, options?: {
  delay?: number;
  priority?: number;
  attempts?: number;
}) {
  return websiteScanQueue.add(JOB_TYPES.SCAN_WEBSITE, data, {
    ...queueConfig.defaultJobOptions,
    ...options,
  });
}

export async function addNotificationJob(data: any, options?: {
  delay?: number;
  priority?: number;
  attempts?: number;
}) {
  return notificationQueue.add(JOB_TYPES.SEND_EMAIL, data, {
    ...queueConfig.defaultJobOptions,
    ...options,
  });
}

export async function addScheduledScanJob(data: { scheduledScanId: string }, options?: {
  delay?: number;
  priority?: number;
  attempts?: number;
}) {
  return scheduledScanQueue.add(JOB_TYPES.PROCESS_SCHEDULED_SCAN, data, {
    ...queueConfig.defaultJobOptions,
    ...options,
  });
}

// Queue management functions
export async function getQueueStatus() {
  const [scanStats, notificationStats, scheduledStats] = await Promise.all([
    websiteScanQueue.getJobCounts(),
    notificationQueue.getJobCounts(),
    scheduledScanQueue.getJobCounts(),
  ]);

  return {
    websiteScan: scanStats,
    notification: notificationStats,
    scheduledScan: scheduledStats,
  };
}

export async function getActiveJobs() {
  const [scanJobs, notificationJobs, scheduledJobs] = await Promise.all([
    websiteScanQueue.getActive(),
    notificationQueue.getActive(),
    scheduledScanQueue.getActive(),
  ]);

  return {
    websiteScan: scanJobs,
    notification: notificationJobs,
    scheduledScan: scheduledJobs,
  };
}

export async function getFailedJobs() {
  const [scanJobs, notificationJobs, scheduledJobs] = await Promise.all([
    websiteScanQueue.getFailed(),
    notificationQueue.getFailed(),
    scheduledScanQueue.getFailed(),
  ]);

  return {
    websiteScan: scanJobs,
    notification: notificationJobs,
    scheduledScan: scheduledJobs,
  };
}

export async function retryFailedJobs(queueName: string) {
  const queue = queueName === 'websiteScan' ? websiteScanQueue :
                queueName === 'notification' ? notificationQueue :
                queueName === 'scheduledScan' ? scheduledScanQueue : null;

  if (!queue) {
    throw new Error('Invalid queue name');
  }

  const failedJobs = await queue.getFailed();
  const retryPromises = failedJobs.map(job => job.retry());
  
  return Promise.all(retryPromises);
}

export async function clearQueue(queueName: string) {
  const queue = queueName === 'websiteScan' ? websiteScanQueue :
                queueName === 'notification' ? notificationQueue :
                queueName === 'scheduledScan' ? scheduledScanQueue : null;

  if (!queue) {
    throw new Error('Invalid queue name');
  }

  await queue.drain();
  await queue.clean(0, 1000);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await stopWorkers();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await stopWorkers();
  process.exit(0);
});