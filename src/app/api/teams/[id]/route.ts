import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { auditLogger } from '@/lib/audit/audit-logger';
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

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        projects: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            _count: {
              select: {
                tasks: true,
                content: true
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          }
        },
        invitations: {
          where: {
            status: 'pending',
            expiresAt: {
              gt: new Date()
            }
          },
          include: {
            inviter: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        analytics: {
          include: {
            usageStats: {
              orderBy: {
                date: 'desc'
              },
              take: 30
            }
          }
        },
        settings: {
          include: {
            notifications: true,
            integrations: true
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get current user's role in team
    const currentUserMember = team.members.find(m => m.user.email === session.user.email);
    
    return NextResponse.json({
      team: {
        ...team,
        role: currentUserMember?.role,
        joinedAt: currentUserMember?.createdAt
      }
    });
  } catch (error) {
    console.error('Get team error:', error);
    Sentry.captureException(error as Error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    const hasPermission = await checkTeamPermission(session.user.email, teamId, 'admin');
    
    if (!hasPermission.success) {
      return NextResponse.json({ error: hasPermission.error }, { status: hasPermission.status });
    }

    const { name, description } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const oldTeam = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true, description: true }
    });

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: name.trim(),
        description: description?.trim() || null
      },
      include: {
        members: {
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
        }
      }
    });

    // Log team update
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    await auditLogger.log({
      action: 'team_updated',
      resource: 'team',
      resourceId: teamId,
      userId: user?.id,
      metadata: {
        oldValues: oldTeam,
        newValues: { name: team.name, description: team.description }
      }
    });

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Update team error:', error);
    Sentry.captureException(error as Error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    const hasPermission = await checkTeamPermission(session.user.email, teamId, 'owner');
    
    if (!hasPermission.success) {
      return NextResponse.json({ error: hasPermission.error }, { status: hasPermission.status });
    }

    // Get team info for audit log
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true, description: true }
    });

    // Delete team (cascade will handle related records)
    await prisma.team.delete({
      where: { id: teamId }
    });

    // Log team deletion
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    await auditLogger.log({
      action: 'team_deleted',
      resource: 'team',
      resourceId: teamId,
      userId: user?.id,
      metadata: {
        teamName: team?.name,
        description: team?.description
      }
    });

    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    Sentry.captureException(error as Error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}