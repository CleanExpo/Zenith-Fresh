import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
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

// Project-specific activity logs should be in /api/activity/project/[projectId]/route.ts 
