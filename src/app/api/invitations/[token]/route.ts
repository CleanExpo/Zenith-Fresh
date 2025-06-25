import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuditLogger, AuditEventType, AuditEntityType } from '@/lib/audit/audit-logger';
import * as Sentry from '@sentry/nextjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Invitation has already been processed',
        status: invitation.status 
      }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Get invitation error:', error);
    Sentry.captureException(error as Error);
    return NextResponse.json({ error: 'Failed to fetch invitation' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = params.token;
    const { action } = await request.json(); // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Invitation has already been processed',
        status: invitation.status 
      }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Verify the invitation is for the current user
    if (invitation.email !== session.user.email) {
      return NextResponse.json({ error: 'Invitation is not for your email address' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'accept') {
      // Check if user is already a member
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          teamId: invitation.teamId,
          userId: user.id
        }
      });

      if (existingMember) {
        // Update invitation status and return success
        await prisma.teamInvitation.update({
          where: { id: invitation.id },
          data: { 
            status: 'accepted',
            acceptedBy: user.id
          }
        });

        return NextResponse.json({ 
          message: 'You are already a member of this team',
          teamId: invitation.teamId 
        });
      }

      // Add user to team
      const member = await prisma.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId: user.id,
          role: invitation.role
        }
      });

      // Update invitation status
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { 
          status: 'accepted',
          acceptedBy: user.id
        }
      });

      // Log audit event
      await AuditLogger.logUserAction(
        user.id,
        AuditEventType.CREATE,
        AuditEntityType.TEAM,
        invitation.teamId,
        {
          action: 'invitation_accepted',
          invitationId: invitation.id,
          role: invitation.role,
          memberId: member.id
        }
      );

      return NextResponse.json({ 
        message: 'Invitation accepted successfully',
        teamId: invitation.teamId,
        role: invitation.role
      });
    } else {
      // Reject invitation
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'rejected' }
      });

      // Log audit event
      await AuditLogger.logUserAction(
        user.id,
        AuditEventType.UPDATE,
        AuditEntityType.TEAM,
        invitation.teamId,
        {
          action: 'invitation_rejected',
          invitationId: invitation.id
        }
      );

      return NextResponse.json({ message: 'Invitation rejected' });
    }
  } catch (error) {
    console.error('Process invitation error:', error);
    Sentry.captureException(error as Error);
    return NextResponse.json({ error: 'Failed to process invitation' }, { status: 500 });
  }
}