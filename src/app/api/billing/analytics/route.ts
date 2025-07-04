/**
 * Revenue Analytics API
 * Provides revenue insights for business intelligence
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access (you might want to implement proper role checking)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get revenue metrics
    const revenueMetrics = await prisma.revenueMetric.findMany({
      where: {
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Get subscription stats
    const totalSubscriptions = await prisma.subscription.count({
      where: {
        status: {
          in: ['ACTIVE', 'TRIALING'],
        },
      },
    });

    const trialingSubscriptions = await prisma.subscription.count({
      where: {
        status: 'TRIALING',
      },
    });

    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
      },
    });

    const pastDueSubscriptions = await prisma.subscription.count({
      where: {
        status: 'PAST_DUE',
      },
    });

    // Get plan distribution
    const planDistribution = await prisma.subscription.groupBy({
      by: ['planId'],
      where: {
        status: {
          in: ['ACTIVE', 'TRIALING'],
        },
      },
      _count: {
        id: true,
      },
    });

    // Calculate current MRR
    const activeSubs = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        team: true,
      },
    });

    let currentMrr = 0;
    const planPrices: Record<string, number> = {};

    // Get plan prices
    const plans = await prisma.pricingPlan.findMany();
    plans.forEach(plan => {
      planPrices[plan.id] = plan.price;
    });

    activeSubs.forEach(sub => {
      currentMrr += planPrices[sub.planId] || 0;
    });

    // Get recent invoices
    const recentInvoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        subscription: {
          include: {
            team: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Calculate churn rate
    const churnedThisMonth = await prisma.subscription.count({
      where: {
        status: 'CANCELED',
        endedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    const totalAtMonthStart = await prisma.subscription.count({
      where: {
        createdAt: {
          lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
        status: {
          not: 'CANCELED',
        },
      },
    });

    const churnRate = totalAtMonthStart > 0 ? (churnedThisMonth / totalAtMonthStart) * 100 : 0;

    // Get growth metrics
    const lastMetric = revenueMetrics[revenueMetrics.length - 1];
    const previousMetric = revenueMetrics[revenueMetrics.length - 2];

    const mrrGrowth = lastMetric && previousMetric 
      ? ((lastMetric.mrr - previousMetric.mrr) / previousMetric.mrr) * 100 
      : 0;

    // Calculate customer lifetime value (simplified)
    const averageRevenue = activeSubs.length > 0 ? currentMrr / activeSubs.length : 0;
    const averageChurnRate = churnRate > 0 ? churnRate / 100 : 0.05; // Default 5% if no data
    const customerLifetimeValue = averageChurnRate > 0 ? averageRevenue / averageChurnRate : 0;

    return NextResponse.json({
      overview: {
        currentMrr,
        currentArr: currentMrr * 12,
        mrrGrowth,
        churnRate,
        customerLifetimeValue,
        totalCustomers: totalSubscriptions,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        trialing: trialingSubscriptions,
        pastDue: pastDueSubscriptions,
      },
      planDistribution,
      revenueMetrics: revenueMetrics.map(metric => ({
        date: metric.date,
        mrr: metric.mrr,
        arr: metric.arr,
        newMrr: metric.newMrr,
        churnedMrr: metric.churnedMrr,
        expansionMrr: metric.expansionMrr,
        activeSubscriptions: metric.activeSubscriptions,
        newSubscriptions: metric.newSubscriptions,
        churnedSubscriptions: metric.churnedSubscriptions,
      })),
      recentInvoices: recentInvoices.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        total: invoice.total,
        createdAt: invoice.createdAt,
        teamName: invoice.subscription.team.name,
      })),
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}