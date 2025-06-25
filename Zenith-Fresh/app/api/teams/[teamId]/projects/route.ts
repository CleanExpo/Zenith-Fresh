import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TeamRole } from '@prisma/client';

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

    const teamProjects = await prisma.teamProject.findMany({
      where: { teamId: params.teamId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            url: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        creator: {
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

    return NextResponse.json({ teamProjects });
  } catch (error) {
    console.error('Error fetching team projects:', error);
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

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 },
      );
    }

    // Check if project exists and user owns it
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 },
      );
    }

    if (project.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only add your own projects to the team' },
        { status: 403 },
      );
    }

    // Check if project is already in the team
    const existingTeamProject = await prisma.teamProject.findUnique({
      where: {
        teamId_projectId: {
          teamId: params.teamId,
          projectId,
        },
      },
    });

    if (existingTeamProject) {
      return NextResponse.json(
        { error: 'Project is already in the team' },
        { status: 409 },
      );
    }

    // Add project to team
    const teamProject = await prisma.teamProject.create({
      data: {
        teamId: params.teamId,
        projectId,
        createdBy: user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            url: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        creator: {
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
        action: 'PROJECT_ADDED',
        details: {
          project: {
            id: project.id,
            name: project.name,
            url: project.url,
          },
          addedBy: user.name || user.email,
        },
      },
    });

    return NextResponse.json({ teamProject }, { status: 201 });
  } catch (error) {
    console.error('Error adding project to team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}