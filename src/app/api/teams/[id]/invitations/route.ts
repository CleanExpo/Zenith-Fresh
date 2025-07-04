import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkTeamPermission } from '@/lib/team/permissions';
import { AuditLogger, AuditEventType, AuditEntityType } from '@/lib/audit/audit-logger';
import { sendTeamInvitationEmail } from '@/lib/email';
import * as Sentry from '@sentry/nextjs';

function generateInviteToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

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

    const invitations = await prisma.teamInvitation.findMany({
      where: { 
        teamId,
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
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Get invitations error:', error);
    Sentry.captureException(error as Error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
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

    const { email, role = 'MEMBER', message } = await request.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Get team info
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if email is already a member
    const existingMember = team.members.find(m => m.user.email === email);
    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400 });
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        teamId,
        email,
        status: 'pending',
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingInvitation) {
      return NextResponse.json({ error: 'Invitation already sent to this email' }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    // Generate invitation token
    const token = generateInviteToken();

    // Create invitation
    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        email,
        role,
        token,
        invitedBy: currentUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'pending'
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Send invitation email
    const emailResult = await sendTeamInvitationEmail(
      email,
      currentUser.name || currentUser.email,
      team.name,
      token,
      message
    );

    if (!emailResult.success) {
      // Delete the invitation if email failed
      await prisma.teamInvitation.delete({
        where: { id: invitation.id }
      });
      
      return NextResponse.json({ 
        error: 'Failed to send invitation email',
        details: emailResult.error 
      }, { status: 500 });
    }

    // Log audit event
    await AuditLogger.logUserAction(
      currentUser.id,
      AuditEventType.CREATE,
      AuditEntityType.TEAM,
      teamId,
      {
        action: 'invitation_sent',
        invitationId: invitation.id,
        invitedEmail: email,
        role,
        message
      }
    );

    return NextResponse.json({ 
      invitation,
      message: 'Invitation sent successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Send invitation error:', error);
    Sentry.captureException(error as Error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}