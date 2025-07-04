import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/middleware/auth';

const prisma = new PrismaClient();

// GET /api/activity/project/[projectId]
export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
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