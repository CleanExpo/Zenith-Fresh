import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/middleware/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
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
    const { projectId } = params;

    // Build query
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
    if (action) where.action = action;

    // Fetch project activity logs
    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        task: true,
        file: true
      },
      take: 100
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Project activity log error:', error);
    return NextResponse.json({ error: 'Failed to fetch project activity logs' }, { status: 500 });
  }
} 