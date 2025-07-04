import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkTeamPermission } from '@/lib/team/permissions';
import * as Sentry from '@sentry/nextjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    const hasPermission = await checkTeamPermission(session.user.email, teamId, 'read');
    
    if (!hasPermission.success) {
      return NextResponse.json({ error: hasPermission.error }, { status: hasPermission.status });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d
    const endDate = new Date();
    let startDate = new Date();

    // Calculate start date based on timeframe
    switch (timeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default: // 30d
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get team analytics
    const teamAnalytics = await prisma.teamAnalytics.findUnique({
      where: { teamId },
      include: {
        usageStats: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: {
            date: 'asc'
          }
        }
      }
    });

    // Get team members count and activity
    const [memberCount, projectCount, activeProjects] = await Promise.all([
      prisma.teamMember.count({
        where: { teamId }
      }),
      prisma.project.count({
        where: { teamId }
      }),
      prisma.project.count({
        where: {
          teamId,
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    // Get recent activity
    const recentActivity = await prisma.activityLog.findMany({
      where: {
        project: {
          teamId
        },
        createdAt: {
          gte: startDate
        }
      },
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
      take: 50
    });

    // Calculate member activity
    const memberActivity = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    const memberActivityWithStats = await Promise.all(
      memberActivity.map(async (member) => {
        const activityCount = await prisma.activityLog.count({
          where: {
            userId: member.userId,
            project: {
              teamId
            },
            createdAt: {
              gte: startDate
            }
          }
        });

        const lastActivity = await prisma.activityLog.findFirst({
          where: {
            userId: member.userId,
            project: {
              teamId
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            createdAt: true
          }
        });

        return {
          ...member,
          activityCount,
          lastActivity: lastActivity?.createdAt || member.createdAt
        };
      })
    );

    // Calculate usage trends
    const usageStats = teamAnalytics?.usageStats || [];
    const totalRequests = teamAnalytics?.totalRequests || 0;
    const totalTokens = teamAnalytics?.totalTokens || 0;
    const growthRate = teamAnalytics?.growthRate || 0;

    // Calculate daily averages
    const dailyAverages = {
      requests: usageStats.length > 0 ? Math.round(usageStats.reduce((sum, stat) => sum + stat.requests, 0) / usageStats.length) : 0,
      tokens: usageStats.length > 0 ? Math.round(usageStats.reduce((sum, stat) => sum + stat.tokens, 0) / usageStats.length) : 0
    };

    // Group activity by type
    const activityByType = recentActivity.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate collaboration metrics
    const collaborationMetrics = {
      totalMembers: memberCount,
      activeMembers: memberActivityWithStats.filter(m => 
        new Date(m.lastActivity).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      ).length,
      totalProjects: projectCount,
      activeProjects,
      projectsPerMember: projectCount > 0 && memberCount > 0 ? Math.round((projectCount / memberCount) * 100) / 100 : 0
    };

    return NextResponse.json({
      analytics: {
        totalRequests,
        totalTokens,
        growthRate,
        usageStats: usageStats.map(stat => ({
          date: stat.date.toISOString(),
          requests: stat.requests,
          tokens: stat.tokens
        })),
        dailyAverages,
        collaboration: collaborationMetrics,
        memberActivity: memberActivityWithStats.map(m => ({
          id: m.id,
          user: m.user,
          role: m.role,
          activityCount: m.activityCount,
          lastActivity: m.lastActivity,
          joinedAt: m.createdAt
        })),
        recentActivity: recentActivity.map(activity => ({
          id: activity.id,
          action: activity.action,
          user: activity.user,
          project: activity.project,
          createdAt: activity.createdAt,
          details: activity.details
        })),
        activityByType,
        timeframe
      }
    });
  } catch (error) {
    console.error('Get team analytics error:', error);
    Sentry.captureException(error as Error);
    return NextResponse.json({ error: 'Failed to fetch team analytics' }, { status: 500 });
  }
}