import { Gauge, Histogram, Registry } from 'prom-client';
import * as Sentry from '@sentry/nextjs';

// Create a registry to register metrics
export const registry = new Registry();

// Active users gauge (can go up and down)
export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
});
registry.registerMetric(activeUsers);

export const incrementActiveUsers = () => {
  activeUsers.inc();
};

export const decrementActiveUsers = () => {
  activeUsers.dec();
};

// Example histogram for request durations
export const requestDuration = new Histogram({
  name: 'request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  buckets: [0.1, 0.5, 1, 2, 5],
});
registry.registerMetric(requestDuration);

export function observeRequestDuration(duration: number) {
  requestDuration.observe(duration);
}

export function reportError(error: Error) {
  Sentry.captureException(error);
}

const httpRequestsTotal = new Histogram({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});
registry.registerMetric(httpRequestsTotal);

const databaseOperations = new Histogram({
  name: 'database_operations_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
});
registry.registerMetric(databaseOperations);

export const getMetrics = async () => {
  try {
    return await registry.metrics();
  } catch (error) {
    reportError(error as Error);
    return '';
  }
};

export const observeHttpRequest = (
  method: string,
  route: string,
  statusCode: number,
  duration: number
) => {
  requestDuration.labels(method, route, statusCode.toString()).observe(duration);
  httpRequestsTotal.labels(method, route, statusCode.toString()).observe(duration);
};

export const observeDatabaseOperation = (
  operation: string,
  table: string,
  duration: number
) => {
  databaseOperations.labels(operation, table).observe(duration);
}; 