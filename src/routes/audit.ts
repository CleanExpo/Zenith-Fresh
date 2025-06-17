import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { cache } from '../middleware/cache';
import { isAdmin } from '../middleware/roles';

const router = Router();
const prisma = new PrismaClient();

// Get audit logs (admin only)
router.get('/', auth, isAdmin, cache(300), async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      action, 
      entityType, 
      userId,
      page = 1,
      limit = 50
    } = req.query;

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate as string) }),
        ...(endDate && { lte: new Date(endDate as string) })
      };
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (userId) {
      where.userId = userId;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get audit logs for a specific entity
router.get('/entity/:entityType/:entityId', auth, isAdmin, cache(300), async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { startDate, endDate, action } = req.query;

    const where: any = {
      entityType,
      entityId
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

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create audit log (internal use)
export const createAuditLog = async (data: {
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}) => {
  try {
    const log = await prisma.auditLog.create({
      data
    });

    // Emit WebSocket event
    io.to(`admin`).emit('audit:new', log);

    return log;
  } catch (error) {
    console.error('Error creating audit log:', error);
    return null;
  }
};

export default router; 