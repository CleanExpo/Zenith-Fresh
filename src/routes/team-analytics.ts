import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { cache } from '../middleware/cache';
import { hasRole } from '../middleware/roles';

const router = Router();
const prisma = new PrismaClient();

// Get team analytics
router.get('/:teamId', auth, hasRole(['ADMIN', 'MANAGER']), cache(300), async (req, res) => {
  try {
    const { teamId } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = { teamId };

    if (startDate || endDate) {
      where.date = {
        ...(startDate && { gte: new Date(startDate as string) }),
        ...(endDate && { lte: new Date(endDate as string) })
      };
    }

    const analytics = await prisma.teamAnalytics.findMany({
      where,
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate summary metrics
    const summary = {
      totalProjects: await prisma.project.count({ where: { teamId } }),
      totalMembers: await prisma.teamMember.count({ where: { teamId } }),
      activeUsers: await prisma.user.count({
        where: {
          teams: {
            some: {
              teamId,
              lastActive: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          }
        }
      }),
      totalTasks: await prisma.task.count({
        where: {
          project: {
            teamId
          }
        }
      }),
      completedTasks: await prisma.task.count({
        where: {
          project: {
            teamId
          },
          status: 'completed'
        }
      })
    };

    res.json({
      analytics,
      summary
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get team activity timeline
router.get('/:teamId/timeline', auth, hasRole(['ADMIN', 'MANAGER']), cache(300), async (req, res) => {
  try {
    const { teamId } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = {
      project: {
        teamId
      }
    };

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate as string) }),
        ...(endDate && { lte: new Date(endDate as string) })
      };
    }

    const activities = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get team member performance
router.get('/:teamId/members/performance', auth, hasRole(['ADMIN', 'MANAGER']), cache(300), async (req, res) => {
  try {
    const { teamId } = req.params;
    const { startDate, endDate } = req.query;

    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const performance = await Promise.all(
      members.map(async (member) => {
        const where: any = {
          userId: member.userId,
          project: {
            teamId
          }
        };

        if (startDate || endDate) {
          where.createdAt = {
            ...(startDate && { gte: new Date(startDate as string) }),
            ...(endDate && { lte: new Date(endDate as string) })
          };
        }

        const [tasks, completedTasks, activities] = await Promise.all([
          prisma.task.count({ where }),
          prisma.task.count({
            where: {
              ...where,
              status: 'completed'
            }
          }),
          prisma.activityLog.count({
            where: {
              userId: member.userId,
              project: {
                teamId
              }
            }
          })
        ]);

        return {
          member: member.user,
          metrics: {
            totalTasks: tasks,
            completedTasks,
            completionRate: tasks > 0 ? (completedTasks / tasks) * 100 : 0,
            activityCount: activities
          }
        };
      })
    );

    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Record team analytics (internal use)
export const recordTeamAnalytics = async (teamId: string) => {
  try {
    const metrics = {
      activeUsers: await prisma.user.count({
        where: {
          teams: {
            some: {
              teamId,
              lastActive: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            }
          }
        }
      }),
      projectCount: await prisma.project.count({ where: { teamId } }),
      taskCount: await prisma.task.count({
        where: {
          project: {
            teamId
          }
        }
      }),
      completedTaskCount: await prisma.task.count({
        where: {
          project: {
            teamId
          },
          status: 'completed'
        }
      }),
      memberCount: await prisma.teamMember.count({ where: { teamId } })
    };

    await prisma.teamAnalytics.create({
      data: {
        teamId,
        metrics
      }
    });
  } catch (error) {
    console.error('Error recording team analytics:', error);
  }
};

export default router; 