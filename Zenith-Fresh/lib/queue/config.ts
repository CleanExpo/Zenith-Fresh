import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq';
import redis from './redis';

export interface QueueConfig {
  connection: any;
  defaultJobOptions: {
    removeOnComplete: number;
    removeOnFail: number;
    attempts: number;
    backoff: {
      type: string;
      delay: number;
    };
  };
}

export const queueConfig: QueueConfig = {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Queue Names
export const QUEUE_NAMES = {
  WEBSITE_SCAN: 'website-scan',
  NOTIFICATION: 'notification',
  SCHEDULED_SCAN: 'scheduled-scan',
} as const;

// Job Types
export const JOB_TYPES = {
  SCAN_WEBSITE: 'scan-website',
  SEND_EMAIL: 'send-email',
  SEND_SLACK: 'send-slack',
  SEND_DISCORD: 'send-discord',
  SEND_WEBHOOK: 'send-webhook',
  PROCESS_SCHEDULED_SCAN: 'process-scheduled-scan',
  CHECK_ALERT_THRESHOLDS: 'check-alert-thresholds',
} as const;

export type JobType = typeof JOB_TYPES[keyof typeof JOB_TYPES];
export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];