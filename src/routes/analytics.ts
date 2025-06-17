import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { admin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Track user activity
router.post('/track', auth, async (req, res) => {
  try {
    const { type, action, metadata, projectId } = req.body;

    const analytics = await prisma.analytics.create({
      data: {
        type,
        action,
        metadata,
        userId: req.user!.id,
        projectId
      }
    });

    res.status(201).json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user activity
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const analytics = await prisma.analytics.findMany({
      where: {
        userId: req.params.userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get project activity
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const analytics = await prisma.analytics.findMany({
      where: {
        projectId: req.params.projectId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Track system metrics (admin only)
router.post('/metrics', admin, async (req, res) => {
  try {
    const { type, value, metadata } = req.body;

    const metrics = await prisma.systemMetrics.create({
      data: {
        type,
        value,
        metadata
      }
    });

    res.status(201).json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get system metrics (admin only)
router.get('/metrics', admin, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    const metrics = await prisma.systemMetrics.findMany({
      where: {
        type: type as string,
        timestamp: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100
    });

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 