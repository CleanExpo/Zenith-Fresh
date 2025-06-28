import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be less than 100 characters'),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'in_progress', 'completed', 'on_hold', 'cancelled']).default('draft'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        status: validatedData.status,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { name: true, email: true }
        },
        _count: {
          select: {
            tasks: true,
            files: true,
            members: true
          }
        }
      }
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        action: 'create_project',
        details: JSON.stringify({
          projectId: project.id,
          projectName: project.name,
          status: project.status
        }),
        userId: session.user.id,
        projectId: project.id,
      }
    });

    // Create a notification
    await prisma.notification.create({
      data: {
        type: 'project_created',
        message: `Project "${project.name}" has been created successfully`,
        userId: session.user.id,
        projectId: project.id,
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const teamId = searchParams.get('teamId');
    const search = searchParams.get('search');

    const whereClause: any = {
      OR: [
        { userId: session.user.id },
        { members: { some: { userId: session.user.id } } }
      ]
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (teamId && teamId !== 'all') {
      if (teamId === 'personal') {
        whereClause.teamId = null;
      } else {
        whereClause.teamId = teamId;
      }
    }

    if (search) {
      whereClause.OR = [
        ...whereClause.OR,
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, email: true }
        },
        tasks: {
          select: { id: true, status: true }
        },
        files: {
          select: { id: true }
        },
        members: {
          include: {
            user: {
              select: { name: true, email: true, image: true }
            }
          }
        },
        team: {
          select: { name: true }
        },
        _count: {
          select: {
            tasks: true,
            files: true,
            members: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const projectsWithProgress = projects.map(project => ({
      ...project,
      completedTasks: project.tasks.filter(task => task.status === 'DONE').length,
      totalTasks: project.tasks.length,
      progress: project.tasks.length > 0 
        ? Math.round((project.tasks.filter(task => task.status === 'DONE').length / project.tasks.length) * 100)
        : 0
    }));

    return NextResponse.json(projectsWithProgress);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
