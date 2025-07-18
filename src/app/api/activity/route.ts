import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/middleware/auth';

const prisma = new PrismaClient();

// GET /api/activity
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const user = await auth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const action = searchParams.get('action');
    const projectId = searchParams.get('projectId');

    // Build query
    const where: any = { userId: user.id };
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) })
      };
    }
    if (action) where.action = action;
    if (projectId) where.projectId = projectId;

    // Fetch activity logs
    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: true,
        task: true,
        file: true
      },
      take: 100
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Activity log error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}

// GET /api/activity/project/[projectId]
export async function GET_PROJECT(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    // Check authentication
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const action = searchParams.get('action');
    const { projectId } = params;

    const where: any = {
      userId: user.id,
      projectId
    };

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) })
      };
    }

    if (action) {
      where.action = action;
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        task: true,
        file: true
      },
      take: 100
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Project activity log error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Helper function to create activity log (internal use)
export async function createActivityLog(data: {
  action: string;
  details?: any;
  userId: string;
  projectId?: string;
  taskId?: string;
  fileId?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const log = await prisma.activityLog.create({
      data
    });

    // Emit WebSocket event
    // Note: WebSocket handling will need to be updated for Next.js
    // io.to(`user:${data.userId}`).emit('activity:new', log);

    return log;
  } catch (error) {
    console.error('Error creating activity log:', error);
    return null;
  }
} 
