import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendTeamInvitationEmail } from '@/lib/email';
import { captureException } from '@/lib/sentry';

function generateInviteToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
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

    const { email, role = 'member' } = await request.json();
    const teamId = params.id;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Verify team exists and user has permission
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

    // Check if current user is a member of the team
    const currentUserMember = team.members.find(m => m.user.email === session.user.email);
    if (!currentUserMember) {
      return NextResponse.json({ error: 'You are not a member of this team' }, { status: 403 });
    }

    // Check if user is already a member
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

    // Generate invitation token
    const token = generateInviteToken();

    // Create invitation
    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        email,
        role,
        token,
        invitedBy: currentUserMember.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'pending'
      }
    });

    // Send invitation email using Resend
    const emailResult = await sendTeamInvitationEmail(
      email,
      session.user.name || session.user.email,
      team.name,
      token
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

    return NextResponse.json({ 
      message: 'Invitation sent successfully',
      invitationId: invitation.id,
      emailSent: true
    });
  } catch (error) {
    console.error('Team invitation error:', error);
    captureException(error as Error, {
      context: 'team-invitation',
      extra: {
        teamId: params.id,
        userEmail: (await getServerSession(authOptions))?.user?.email,
      }
    });
    
    return NextResponse.json({ 
      error: 'Failed to send invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 