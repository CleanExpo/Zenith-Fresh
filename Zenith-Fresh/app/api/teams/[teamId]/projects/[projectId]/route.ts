import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TeamRole } from '@prisma/client';

interface RouteParams {
  params: {
    teamId: string;
    projectId: string;
  };
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

    // Check if user can manage projects (Admin or Member)
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: params.teamId,
          userId: user.id,
        },
      },
    });

    if (!teamMember || teamMember.role === TeamRole.VIEWER) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if the team project exists
    const teamProject = await prisma.teamProject.findUnique({
      where: {
        id: params.projectId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
      },
    });

    if (!teamProject) {
      return NextResponse.json(
        { error: 'Team project not found' },
        { status: 404 },
      );
    }

    if (teamProject.teamId !== params.teamId) {
      return NextResponse.json(
        { error: 'Project does not belong to this team' },
        { status: 400 },
      );
    }

    // Remove project from team
    await prisma.teamProject.delete({
      where: { id: params.projectId },
    });

    // Log activity
    await prisma.teamActivity.create({
      data: {
        teamId: params.teamId,
        userId: user.id,
        action: 'PROJECT_REMOVED',
        details: {
          project: {
            id: teamProject.project.id,
            name: teamProject.project.name,
            url: teamProject.project.url,
          },
          removedBy: user.name || user.email,
        },
      },
    });

    return NextResponse.json({ message: 'Project removed from team' });
  } catch (error) {
    console.error('Error removing project from team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}