import { Counter, Histogram, Registry } from 'prom-client';
import { captureException } from './sentry';

// Create a registry to register metrics
const register = new Registry();

// Define metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const activeUsers = new Counter({
  name: 'active_users_total',
  help: 'Total number of active users',
});

const databaseOperations = new Histogram({
  name: 'database_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeUsers);
register.registerMetric(databaseOperations);

// Export metrics
export const getMetrics = async () => {
  try {
    return await register.metrics();
  } catch (error) {
    captureException(error as Error, { context: 'metrics-collection' });
    return '';
  }
};

// Helper functions for metrics
export const recordHttpRequest = (
  method: string,
  route: string,
  statusCode: number,
  duration: number
) => {
  httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration);
  httpRequestsTotal.labels(method, route, statusCode.toString()).inc();
};

export const recordDatabaseOperation = (
  operation: string,
  table: string,
  duration: number
) => {
  databaseOperations.labels(operation, table).observe(duration);
};

export const incrementActiveUsers = () => {
  activeUsers.inc();
};

export const decrementActiveUsers = () => {
  activeUsers.dec();
}; 