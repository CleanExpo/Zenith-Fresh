import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { TrendCalculator } from '@/lib/trend-calculator';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const url = searchParams.get('url');
    const period = searchParams.get('period') || 'daily'; // daily, weekly, monthly
    const metrics = searchParams.get('metrics')?.split(',') || ['overall_score'];

    if (!projectId) {
      return NextResponse.json(
        { error: 'ProjectId is required' },
        { status: 400 }
      );
    }

    // Validate project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const whereClause: any = {
      projectId,
    };

    if (url) {
      whereClause.url = url;
    }

    if (metrics.length > 0) {
      whereClause.metricName = {
        in: metrics,
      };
    }

    // Get performance trends
    const trends = await prisma.performanceTrend.findMany({
      where: whereClause,
      orderBy: { lastCalculated: 'desc' },
    });

    // Format trend data for visualization
    const trendData = trends.map(trend => {
      const periodData = trend[period as keyof typeof trend] as any;
      return {
        metricName: trend.metricName,
        url: trend.url,
        data: periodData || [],
        trendDirection: trend.trendDirection,
        trendStrength: trend.trendStrength,
        currentValue: trend.currentValue,
        averageValue: trend.averageValue,
        bestValue: trend.bestValue,
        worstValue: trend.worstValue,
        lastCalculated: trend.lastCalculated,
      };
    });

    return NextResponse.json({
      trends: trendData,
      period,
      metrics,
    });

  } catch (error) {
    console.error('Failed to fetch trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, url, forceRecalculate = false } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'ProjectId is required' },
        { status: 400 }
      );
    }

    // Validate project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const trendCalculator = new TrendCalculator();
    const result = await trendCalculator.recalculateTrends(
      projectId,
      url,
      forceRecalculate
    );

    return NextResponse.json({
      success: true,
      updated: result.updated,
      created: result.created,
      message: `Updated ${result.updated} trends, created ${result.created} new trends`,
    });

  } catch (error) {
    console.error('Failed to recalculate trends:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate trends' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}