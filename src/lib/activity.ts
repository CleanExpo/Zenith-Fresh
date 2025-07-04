import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to create activity log (internal use)
export async function createActivityLog(data: {
  action: string;
  details?: any;
  userId: string;
  projectId?: string;
  taskId?: string;
  fileId?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const log = await prisma.activityLog.create({
      data
    });

    // Emit WebSocket event
    // Note: WebSocket handling will need to be updated for Next.js
    // io.to(`user:${data.userId}`).emit('activity:new', log);

    return log;
  } catch (error) {
    console.error('Error creating activity log:', error);
    return null;
  }
}