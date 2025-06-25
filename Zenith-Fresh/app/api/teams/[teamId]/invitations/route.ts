import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TeamRole, InvitationStatus } from '@prisma/client';
import crypto from 'crypto';

interface RouteParams {
  params: {
    teamId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is a member of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: params.teamId,
          userId: user.id,
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const invitations = await prisma.teamInvitation.findMany({
      where: { teamId: params.teamId },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error fetching team invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is an admin of the team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: params.teamId,
          userId: user.id,
        },
      },
    });

    if (!teamMember || teamMember.role !== TeamRole.ADMIN) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role = TeamRole.MEMBER } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      );
    }

    // Get team details
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      select: { name: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const existingMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: params.teamId,
            userId: existingUser.id,
          },
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { error: 'User is already a team member' },
          { status: 409 },
        );
      }
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.teamInvitation.findUnique({
      where: {
        teamId_email: {
          teamId: params.teamId,
          email,
        },
      },
    });

    if (existingInvitation && existingInvitation.status === InvitationStatus.PENDING) {
      return NextResponse.json(
        { error: 'Invitation already sent' },
        { status: 409 },
      );
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create or update invitation
    const invitation = await prisma.teamInvitation.upsert({
      where: {
        teamId_email: {
          teamId: params.teamId,
          email,
        },
      },
      update: {
        role,
        token,
        status: InvitationStatus.PENDING,
        expiresAt,
        invitedBy: user.id,
        createdAt: new Date(),
      },
      create: {
        teamId: params.teamId,
        email,
        role,
        token,
        status: InvitationStatus.PENDING,
        expiresAt,
        invitedBy: user.id,
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await prisma.teamActivity.create({
      data: {
        teamId: params.teamId,
        userId: user.id,
        action: 'INVITATION_SENT',
        details: {
          invitedEmail: email,
          role,
          invitedBy: user.name || user.email,
        },
      },
    });

    // TODO: Send email invitation
    // This would typically integrate with your email service
    // For now, we'll just return the invitation token for testing

    return NextResponse.json({ 
      invitation: {
        ...invitation,
        // In production, don't return the token for security
        ...(process.env.NODE_ENV === 'development' && { token }),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating team invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}