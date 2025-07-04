import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
  };
}

export const initializeWebSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = (socket as any).handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      (socket as AuthenticatedSocket).user = {
        id: decoded.id,
        email: decoded.email
      };
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log('Client connected:', authSocket.user?.email);

    // Join project room
    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    // Leave project room
    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // Project updates
    socket.on('project:update', async (data: { projectId: string, update: any }) => {
      io.to(`project:${data.projectId}`).emit('project:updated', data.update);
    });

    // Task updates
    socket.on('task:update', async (data: { projectId: string, taskId: string, update: any }) => {
      io.to(`project:${data.projectId}`).emit('task:updated', {
        taskId: data.taskId,
        update: data.update
      });
    });

    // File updates
    socket.on('file:update', async (data: { projectId: string, fileId: string, update: any }) => {
      io.to(`project:${data.projectId}`).emit('file:updated', {
        fileId: data.fileId,
        update: data.update
      });
    });

    // Analytics updates
    socket.on('analytics:update', async (data: { projectId: string, metrics: any }) => {
      io.to(`project:${data.projectId}`).emit('analytics:updated', data.metrics);
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log('Client disconnected:', authSocket.user?.email);
    });
  });

  return io;
}; 