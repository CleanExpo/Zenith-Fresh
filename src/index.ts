import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import path from 'path';

// Import routes
import userRoutes from './routes/user';
import projectRoutes from './routes/project';
import taskRoutes from './routes/task';
import fileRoutes from './routes/file';
import analyticsRoutes from './routes/analytics';
import searchRoutes from './routes/search';
import notificationRoutes from './routes/notification';
import preferencesRoutes from './routes/preferences';
import activityRoutes from './routes/activity';
import auditRoutes from './routes/audit';
import exportRoutes from './routes/export';
import teamRoutes from './routes/team';
import apiKeyRoutes from './routes/api-keys';
import teamAnalyticsRoutes from './routes/team-analytics';
import teamBillingRoutes from './routes/team-billing';
import teamSettingsRoutes from './routes/team-settings';

// Import middleware
import { trackApiUsage } from './middleware/analytics';
import { apiLimiter, authLimiter, analyticsLimiter } from './middleware/rate-limit';
import { cache, invalidateCache } from './middleware/cache';
import { upload, handleUploadError } from './middleware/upload';

// Import WebSocket
import { initializeWebSocket } from './websocket';

// Import utilities
import { collectSystemMetrics } from './utils/metrics';

// Import Swagger
import { swaggerSpec, swaggerUi } from './docs/swagger';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const prisma = new PrismaClient();

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket
const io = initializeWebSocket(httpServer);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(trackApiUsage);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/analytics', analyticsLimiter);

// Routes with caching
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/team-analytics', teamAnalyticsRoutes);
app.use('/api/team-billing', teamBillingRoutes);
app.use('/api/team-settings', teamSettingsRoutes);

// Cache frequently accessed routes
app.get('/api/projects', cache(300), projectRoutes); // Cache for 5 minutes
app.get('/api/tasks/project/:projectId', cache(300), taskRoutes); // Cache for 5 minutes
app.get('/api/analytics/metrics', cache(60), analyticsRoutes); // Cache for 1 minute
app.get('/api/search', cache(300), searchRoutes); // Cache for 5 minutes
app.get('/api/activity', cache(300), activityRoutes); // Cache for 5 minutes
app.get('/api/audit', cache(300), auditRoutes); // Cache for 5 minutes
app.get('/api/teams', cache(300), teamRoutes); // Cache for 5 minutes
app.get('/api/team-analytics/:teamId', cache(300), teamAnalyticsRoutes); // Cache for 5 minutes
app.get('/api/team-settings/:teamId', cache(300), teamSettingsRoutes); // Cache for 5 minutes

// Serve exported files
app.use('/exports', express.static(path.join(__dirname, '../exports')));

// File upload error handling
app.use(handleUploadError);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
  
  // Collect system metrics every 5 minutes
  setInterval(collectSystemMetrics, 5 * 60 * 1000);
  
  // Initial metrics collection
  collectSystemMetrics();
}); 