import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface UsageStat {
  createdAt: Date;
  body: string;
}

interface FormattedStat {
  date: string;
  requests: number;
  tokens: number;
}

export async function GET(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Get usage statistics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usageStats = await prisma.content.findMany({
      where: {
        project: {
          userId: params.teamId,
        },
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
        body: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate analytics
    const totalRequests = usageStats.length;
    const totalTokens = usageStats.reduce((acc: number, content: UsageStat) => {
      // Rough estimate: 1 token ≈ 4 characters
      return acc + Math.ceil(content.body.length / 4);
    }, 0);

    // Calculate growth rate (comparing last 15 days with previous 15 days)
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const recentRequests = usageStats.filter(
      (stat: UsageStat) => stat.createdAt >= fifteenDaysAgo
    ).length;
    const previousRequests = totalRequests - recentRequests;

    const growthRate = previousRequests
      ? Math.round(((recentRequests - previousRequests) / previousRequests) * 100)
      : 0;

    // Format usage stats for the chart
    const formattedStats = usageStats.reduce((acc: FormattedStat[], stat: UsageStat) => {
      const date = stat.createdAt.toISOString().split('T')[0];
      const existing = acc.find((item: FormattedStat) => item.date === date);

      if (existing) {
        existing.requests += 1;
        existing.tokens += Math.ceil(stat.body.length / 4);
      } else {
        acc.push({
          date,
          requests: 1,
          tokens: Math.ceil(stat.body.length / 4),
        });
      }

      return acc;
    }, []);

    return NextResponse.json({
      totalRequests,
      totalTokens,
      growthRate,
      usageStats: formattedStats,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 