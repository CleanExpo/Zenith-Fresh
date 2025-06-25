import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { InvitationStatus } from '@prisma/client';

interface RouteParams {
  params: {
    token: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token: params.token },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            avatar: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 },
      );
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      return NextResponse.json(
        { error: 'Invitation is no longer valid' },
        { status: 410 },
      );
    }

    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 },
      );
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        team: invitation.team,
        inviter: invitation.inviter,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
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

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token: params.token },
      include: {
        team: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 },
      );
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      return NextResponse.json(
        { error: 'Invitation is no longer valid' },
        { status: 410 },
      );
    }

    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 },
      );
    }

    // Check if the invitation email matches the user's email
    if (invitation.email !== user.email) {
      return NextResponse.json(
        { error: 'Invitation email does not match your account' },
        { status: 403 },
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: invitation.teamId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      // Update invitation status
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { 
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      return NextResponse.json(
        { error: 'You are already a member of this team' },
        { status: 409 },
      );
    }

    // Accept the invitation
    const result = await prisma.$transaction(async (tx) => {
      // Add user to team
      const member = await tx.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId: user.id,
          role: invitation.role,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      // Update invitation status
      await tx.teamInvitation.update({
        where: { id: invitation.id },
        data: { 
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      // Log activity
      await tx.teamActivity.create({
        data: {
          teamId: invitation.teamId,
          userId: user.id,
          action: 'MEMBER_JOINED',
          details: {
            joinedUser: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
            role: invitation.role,
            viaInvitation: true,
          },
        },
      });

      return member;
    });

    return NextResponse.json({ member: result }, { status: 201 });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token: params.token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 },
      );
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      return NextResponse.json(
        { error: 'Invitation is no longer valid' },
        { status: 410 },
      );
    }

    // Check if the invitation email matches the user's email
    if (invitation.email !== user.email) {
      return NextResponse.json(
        { error: 'Invitation email does not match your account' },
        { status: 403 },
      );
    }

    // Decline the invitation
    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.DECLINED },
    });

    // Log activity
    await prisma.teamActivity.create({
      data: {
        teamId: invitation.teamId,
        userId: user.id,
        action: 'INVITATION_DECLINED',
        details: {
          declinedEmail: user.email,
          role: invitation.role,
        },
      },
    });

    return NextResponse.json({ message: 'Invitation declined' });
  } catch (error) {
    console.error('Error declining invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}