import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TeamRole } from '@prisma/client';

interface RouteParams {
  params: {
    teamId: string;
    memberId: string;
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const { role } = body;

    if (!role || !Object.values(TeamRole).includes(role)) {
      return NextResponse.json(
        { error: 'Valid role is required' },
        { status: 400 },
      );
    }

    // Check if the target member exists
    const targetMember = await prisma.teamMember.findUnique({
      where: { id: params.memberId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!targetMember || targetMember.teamId !== params.teamId) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 },
      );
    }

    const oldRole = targetMember.role;

    // Update member role
    const updatedMember = await prisma.teamMember.update({
      where: { id: params.memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
      },
    });

    // Log activity
    await prisma.teamActivity.create({
      data: {
        teamId: params.teamId,
        userId: user.id,
        action: 'MEMBER_ROLE_CHANGED',
        details: {
          targetUser: {
            id: targetMember.user.id,
            name: targetMember.user.name,
            email: targetMember.user.email,
          },
          oldRole,
          newRole: role,
          changedBy: user.name || user.email,
        },
      },
    });

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error('Error updating member role:', error);
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

    // Check if the target member exists
    const targetMember = await prisma.teamMember.findUnique({
      where: { id: params.memberId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!targetMember || targetMember.teamId !== params.teamId) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 },
      );
    }

    // Prevent removing the last admin
    const adminCount = await prisma.teamMember.count({
      where: {
        teamId: params.teamId,
        role: TeamRole.ADMIN,
      },
    });

    if (targetMember.role === TeamRole.ADMIN && adminCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove the last admin from the team' },
        { status: 400 },
      );
    }

    // Remove member from team
    await prisma.teamMember.delete({
      where: { id: params.memberId },
    });

    // Log activity
    await prisma.teamActivity.create({
      data: {
        teamId: params.teamId,
        userId: user.id,
        action: 'MEMBER_REMOVED',
        details: {
          removedUser: {
            id: targetMember.user.id,
            name: targetMember.user.name,
            email: targetMember.user.email,
          },
          role: targetMember.role,
          removedBy: user.name || user.email,
        },
      },
    });

    return NextResponse.json({ message: 'Member removed from team' });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}