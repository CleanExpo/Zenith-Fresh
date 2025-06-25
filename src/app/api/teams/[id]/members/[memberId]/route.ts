import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkMemberPermission, isValidRoleTransition, getAssignableRoles } from '@/lib/team/permissions';
import { AuditLogger, AuditEventType, AuditEntityType } from '@/lib/audit/audit-logger';
import * as Sentry from '@sentry/nextjs';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId, memberId } = params;
    const { role } = await request.json();

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    const hasPermission = await checkMemberPermission(session.user.email, teamId, memberId, 'update_role');
    
    if (!hasPermission.success) {
      return NextResponse.json({ error: hasPermission.error }, { status: hasPermission.status });
    }

    // Get current member info
    const currentMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
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

    if (!currentMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Validate role transition
    if (!isValidRoleTransition(currentMember.role as any, role, hasPermission.role!)) {
      return NextResponse.json({ 
        error: 'Invalid role transition',
        details: `Cannot change from ${currentMember.role} to ${role}`
      }, { status: 400 });
    }

    // Update member role
    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
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
      AuditEventType.UPDATE,
      AuditEntityType.TEAM,
      teamId,
      {
        action: 'member_role_updated',
        memberId,
        memberEmail: currentMember.user.email,
        oldRole: currentMember.role,
        newRole: role
      }
    );

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error('Update member role error:', error);
    Sentry.captureException(error as Error);
    return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId, memberId } = params;

    const hasPermission = await checkMemberPermission(session.user.email, teamId, memberId, 'remove');
    
    if (!hasPermission.success) {
      return NextResponse.json({ error: hasPermission.error }, { status: hasPermission.status });
    }

    // Get member info for audit log
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
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

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Remove member from team
    await prisma.teamMember.delete({
      where: { id: memberId }
    });

    // Log audit event
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    await AuditLogger.logUserAction(
      currentUser?.id || '',
      AuditEventType.DELETE,
      AuditEntityType.TEAM,
      teamId,
      {
        action: 'member_removed',
        memberId,
        memberEmail: member.user.email,
        memberRole: member.role
      }
    );

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    Sentry.captureException(error as Error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}