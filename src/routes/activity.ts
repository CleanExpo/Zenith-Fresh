import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { cache } from '../middleware/cache';

const router = Router();
const prisma = new PrismaClient();

// Get user activity logs
router.get('/', auth, cache(300), async (req, res) => {
  try {
    const { startDate, endDate, action, projectId } = req.query;
    const userId = req.user!.id;

    const where: any = { userId };

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate as string) }),
        ...(endDate && { lte: new Date(endDate as string) })
      };
    }

    if (action) {
      where.action = action;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        project: true,
        task: true,
        file: true
      },
      take: 100
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get project activity logs
router.get('/project/:projectId', auth, cache(300), async (req, res) => {
  try {
    const { startDate, endDate, action } = req.query;
    const { projectId } = req.params;
    const userId = req.user!.id;

    const where: any = {
      userId,
      projectId
    };

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate as string) }),
        ...(endDate && { lte: new Date(endDate as string) })
      };
    }

    if (action) {
      where.action = action;
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        task: true,
        file: true
      },
      take: 100
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create activity log (internal use)
export const createActivityLog = async (data: {
  action: string;
  details?: any;
  userId: string;
  projectId?: string;
  taskId?: string;
  fileId?: string;
  ipAddress?: string;
  userAgent?: string;
}) => {
  try {
    const log = await prisma.activityLog.create({
      data
    });

    // Emit WebSocket event
    io.to(`user:${data.userId}`).emit('activity:new', log);

    return log;
  } catch (error) {
    console.error('Error creating activity log:', error);
    return null;
  }
};

export default router; 