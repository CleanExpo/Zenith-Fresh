/**
 * Agent Analytics API Route
 * Retrieve performance analytics for agents
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/monitoring/enhanced-sentry';
import { agentOrchestrator } from '@/lib/agents/agent-orchestrator';

// GET /api/automation/agents/[agentId]/analytics - Get agent analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Parse date range
    let timeframe: { from: Date; to: Date } | undefined;
    if (from && to) {
      timeframe = {
        from: new Date(from),
        to: new Date(to)
      };
    }

    // Check agent access
    const agent = await prisma.aIAgent.findUnique({
      where: { id: params.agentId }
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId: agent.teamId
      }
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get analytics from orchestrator
    const analytics = await agentOrchestrator.getAgentAnalytics(params.agentId, timeframe);

    // Get additional metrics
    const [
      conversationStats,
      dailyStats,
      performanceMetrics,
      costAnalysis
    ] = await Promise.all([
      getConversationStats(params.agentId, timeframe),
      getDailyExecutionStats(params.agentId, timeframe),
      getPerformanceMetrics(params.agentId, timeframe),
      getCostAnalysis(params.agentId, timeframe)
    ]);

    return NextResponse.json({
      ...analytics,
      conversations: conversationStats,
      dailyStats,
      performance: performanceMetrics,
      costs: costAnalysis
    });
  } catch (error) {
    logger.error('Failed to get agent analytics', {
      agentId: params.agentId,
      error: error.message
    });
    return NextResponse.json(
      { error: 'Failed to get agent analytics' },
      { status: 500 }
    );
  }
}

// Helper functions
async function getConversationStats(agentId: string, timeframe?: { from: Date; to: Date }) {
  const whereClause: any = { agentId };
  
  if (timeframe) {
    whereClause.createdAt = {
      gte: timeframe.from,
      lte: timeframe.to
    };
  }

  const [totalConversations, activeConversations, averageMessages] = await Promise.all([
    prisma.agentConversation.count({ where: whereClause }),
    prisma.agentConversation.count({
      where: { ...whereClause, isActive: true }
    }),
    prisma.agentConversation.aggregate({
      where: whereClause,
      _avg: { messageCount: true }
    })
  ]);

  return {
    total: totalConversations,
    active: activeConversations,
    averageMessageCount: averageMessages._avg.messageCount || 0
  };
}

async function getDailyExecutionStats(agentId: string, timeframe?: { from: Date; to: Date }) {
  const whereClause: any = { agentId };
  
  if (timeframe) {
    whereClause.createdAt = {
      gte: timeframe.from,
      lte: timeframe.to
    };
  }

  const dailyStats = await prisma.$queryRaw`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as executions,
      COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as successful,
      AVG(CASE WHEN duration IS NOT NULL THEN duration END) as avg_duration,
      SUM(CASE WHEN tokens IS NOT NULL THEN tokens END) as total_tokens,
      SUM(CASE WHEN cost IS NOT NULL THEN cost END) as total_cost
    FROM agent_executions
    WHERE agent_id = ${agentId}
    ${timeframe ? `AND created_at >= ${timeframe.from.toISOString()} AND created_at <= ${timeframe.to.toISOString()}` : ''}
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) DESC
    LIMIT 30
  `;

  return dailyStats;
}

async function getPerformanceMetrics(agentId: string, timeframe?: { from: Date; to: Date }) {
  const whereClause: any = { agentId };
  
  if (timeframe) {
    whereClause.createdAt = {
      gte: timeframe.from,
      lte: timeframe.to
    };
  }

  const [
    responseTimePercentiles,
    errorRates,
    tokenUsageDistribution
  ] = await Promise.all([
    prisma.$queryRaw`
      SELECT 
        percentile_cont(0.5) WITHIN GROUP (ORDER BY duration) as p50,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY duration) as p95,
        percentile_cont(0.99) WITHIN GROUP (ORDER BY duration) as p99
      FROM agent_executions
      WHERE agent_id = ${agentId} AND duration IS NOT NULL
      ${timeframe ? `AND created_at >= ${timeframe.from.toISOString()} AND created_at <= ${timeframe.to.toISOString()}` : ''}
    `,
    prisma.agentExecution.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true
    }),
    prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN tokens < 1000 THEN 'low'
          WHEN tokens < 5000 THEN 'medium'
          ELSE 'high'
        END as usage_tier,
        COUNT(*) as count
      FROM agent_executions
      WHERE agent_id = ${agentId} AND tokens IS NOT NULL
      ${timeframe ? `AND created_at >= ${timeframe.from.toISOString()} AND created_at <= ${timeframe.to.toISOString()}` : ''}
      GROUP BY usage_tier
    `
  ]);

  return {
    responseTime: responseTimePercentiles[0] || { p50: 0, p95: 0, p99: 0 },
    errorRates: errorRates.reduce((acc, rate) => {
      acc[rate.status] = rate._count;
      return acc;
    }, {} as Record<string, number>),
    tokenUsage: tokenUsageDistribution
  };
}

async function getCostAnalysis(agentId: string, timeframe?: { from: Date; to: Date }) {
  const whereClause: any = { agentId };
  
  if (timeframe) {
    whereClause.createdAt = {
      gte: timeframe.from,
      lte: timeframe.to
    };
  }

  const [totalCosts, dailyCosts, costBreakdown] = await Promise.all([
    prisma.agentExecution.aggregate({
      where: whereClause,
      _sum: { cost: true },
      _avg: { cost: true },
      _count: true
    }),
    prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        SUM(cost) as daily_cost,
        COUNT(*) as executions
      FROM agent_executions
      WHERE agent_id = ${agentId} AND cost IS NOT NULL
      ${timeframe ? `AND created_at >= ${timeframe.from.toISOString()} AND created_at <= ${timeframe.to.toISOString()}` : ''}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) DESC
      LIMIT 30
    `,
    prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN cost < 0.01 THEN 'micro'
          WHEN cost < 0.1 THEN 'small'
          WHEN cost < 1.0 THEN 'medium'
          ELSE 'large'
        END as cost_tier,
        COUNT(*) as count,
        SUM(cost) as total_cost
      FROM agent_executions
      WHERE agent_id = ${agentId} AND cost IS NOT NULL
      ${timeframe ? `AND created_at >= ${timeframe.from.toISOString()} AND created_at <= ${timeframe.to.toISOString()}` : ''}
      GROUP BY cost_tier
    `
  ]);

  return {
    total: totalCosts._sum.cost || 0,
    average: totalCosts._avg.cost || 0,
    executionCount: totalCosts._count,
    daily: dailyCosts,
    breakdown: costBreakdown
  };
}