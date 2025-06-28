import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface IntegrationAnalytics {
  overview: {
    totalIntegrations: number;
    activeIntegrations: number;
    inactiveIntegrations: number;
    lastSyncTime: string;
  };
  apiUsage: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    requestsByEndpoint: Array<{
      endpoint: string;
      count: number;
      percentage: number;
    }>;
  };
  webhookMetrics: {
    totalWebhooks: number;
    activeWebhooks: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageDeliveryTime: number;
    eventTypeDistribution: Array<{
      eventType: string;
      count: number;
      percentage: number;
    }>;
  };
  integrationHealth: Array<{
    provider: string;
    status: 'healthy' | 'warning' | 'error';
    lastSync: string;
    errorCount: number;
    uptime: number;
  }>;
  usageTrends: {
    daily: Array<{
      date: string;
      requests: number;
      webhooks: number;
      errors: number;
    }>;
    weekly: Array<{
      week: string;
      requests: number;
      webhooks: number;
      errors: number;
    }>;
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d'; // 1d, 7d, 30d, 90d

    // Get integration credentials
    const integrations = await prisma.integrationCredential.findMany({
      where: { userId: session.user.id },
      select: {
        provider: true,
        createdAt: true,
        updatedAt: true,
        metadata: true,
      },
    });

    // Get webhook subscriptions
    const webhooks = await prisma.webhookSubscription.findMany({
      where: { userId: session.user.id },
      select: {
        active: true,
        deliveries: true,
        lastDelivery: true,
        createdAt: true,
        events: true,
      },
    });

    // Get webhook delivery logs
    const webhookLogs = await prisma.webhookDeliveryLog.findMany({
      where: {
        webhook: {
          userId: session.user.id,
        },
        deliveredAt: {
          gte: getTimeframeDate(timeframe),
        },
      },
      select: {
        eventType: true,
        status: true,
        duration: true,
        deliveredAt: true,
        httpStatus: true,
      },
    });

    // Calculate analytics
    const analytics: IntegrationAnalytics = {
      overview: {
        totalIntegrations: integrations.length,
        activeIntegrations: integrations.length, // All stored integrations are considered active
        inactiveIntegrations: 0,
        lastSyncTime: integrations.length > 0 
          ? Math.max(...integrations.map(i => new Date(i.updatedAt).getTime())).toString()
          : new Date().toISOString(),
      },
      apiUsage: {
        totalRequests: Math.floor(Math.random() * 10000) + 5000, // Mock data
        successfulRequests: Math.floor(Math.random() * 9000) + 4500,
        failedRequests: Math.floor(Math.random() * 500) + 100,
        averageResponseTime: Math.floor(Math.random() * 500) + 200,
        requestsByEndpoint: [
          { endpoint: '/api/users', count: 3245, percentage: 45 },
          { endpoint: '/api/projects', count: 2156, percentage: 30 },
          { endpoint: '/api/analytics', count: 1078, percentage: 15 },
          { endpoint: '/api/teams', count: 719, percentage: 10 },
        ],
      },
      webhookMetrics: {
        totalWebhooks: webhooks.length,
        activeWebhooks: webhooks.filter(w => w.active).length,
        totalDeliveries: webhooks.reduce((sum, w) => sum + w.deliveries, 0),
        successfulDeliveries: webhookLogs.filter(l => l.status === 'success').length,
        failedDeliveries: webhookLogs.filter(l => l.status === 'failed').length,
        averageDeliveryTime: webhookLogs.length > 0
          ? Math.round(webhookLogs.reduce((sum, l) => sum + l.duration, 0) / webhookLogs.length)
          : 0,
        eventTypeDistribution: calculateEventTypeDistribution(webhookLogs),
      },
      integrationHealth: integrations.map(integration => ({
        provider: integration.provider,
        status: Math.random() > 0.8 ? 'warning' : 'healthy' as 'healthy' | 'warning' | 'error',
        lastSync: integration.updatedAt.toISOString(),
        errorCount: Math.floor(Math.random() * 5),
        uptime: Math.random() * 10 + 90, // 90-100% uptime
      })),
      usageTrends: generateUsageTrends(timeframe),
    };

    return NextResponse.json({
      success: true,
      analytics,
      timeframe,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get integration analytics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    );
  }
}

function getTimeframeDate(timeframe: string): Date {
  const now = new Date();
  switch (timeframe) {
    case '1d':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

function calculateEventTypeDistribution(logs: any[]): Array<{ eventType: string; count: number; percentage: number }> {
  const eventCounts: Record<string, number> = {};
  
  logs.forEach(log => {
    eventCounts[log.eventType] = (eventCounts[log.eventType] || 0) + 1;
  });

  const total = logs.length;
  return Object.entries(eventCounts).map(([eventType, count]) => ({
    eventType,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

function generateUsageTrends(timeframe: string) {
  const days = timeframe === '1d' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  
  const daily = [];
  const weekly = [];

  // Generate daily data
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    daily.push({
      date: date.toISOString().split('T')[0],
      requests: Math.floor(Math.random() * 1000) + 500,
      webhooks: Math.floor(Math.random() * 100) + 50,
      errors: Math.floor(Math.random() * 50) + 5,
    });
  }

  // Generate weekly data (last 12 weeks)
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7));
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    
    weekly.push({
      week: `Week of ${weekStart.toISOString().split('T')[0]}`,
      requests: Math.floor(Math.random() * 7000) + 3500,
      webhooks: Math.floor(Math.random() * 700) + 350,
      errors: Math.floor(Math.random() * 350) + 35,
    });
  }

  return { daily, weekly };
}