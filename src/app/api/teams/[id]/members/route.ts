import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkTeamPermission, checkMemberPermission } from '@/lib/team/permissions';
import { AuditLogger, AuditEventType, AuditEntityType } from '@/lib/audit/audit-logger';
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

    const members = await prisma.teamMember.findMany({
      where: { teamId },
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
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, etc.
        { createdAt: 'asc' }
      ]
    });

    const membersWithActivity = await Promise.all(
      members.map(async (member) => {
        // Get recent activity
        const recentActivity = await prisma.activityLog.findMany({
          where: {
            userId: member.userId,
            projectId: { in: await prisma.project.findMany({
              where: { teamId },
              select: { id: true }
            }).then(projects => projects.map(p => p.id)) }
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            action: true,
            createdAt: true
          }
        });

        return {
          ...member,
          recentActivity,
          lastActive: recentActivity[0]?.createdAt || member.createdAt
        };
      })
    );

    return NextResponse.json({ members: membersWithActivity });
  } catch (error) {
    console.error('Get team members error:', error);
    Sentry.captureException(error as Error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}

export async function POST(
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

    const { email, role = 'MEMBER' } = await request.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id
      }
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400 });
    }

    // Add user to team
    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId: user.id,
        role
      },
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
      }
    });

    // Log audit event
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    await AuditLogger.logUserAction(
      currentUser?.id || '',
      AuditEventType.CREATE,
      AuditEntityType.TEAM,
      teamId,
      {
        action: 'member_added',
        memberEmail: email,
        memberRole: role,
        memberId: member.id
      }
    );

    return NextResponse.json({ 
      member: {
        ...member,
        recentActivity: [],
        lastActive: member.createdAt
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Add team member error:', error);
    Sentry.captureException(error as Error);
    return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 });
  }
}