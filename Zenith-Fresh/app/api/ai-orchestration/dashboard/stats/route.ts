import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's agents
    const agents = await prisma.aIAgent.findMany({
      where: { userId },
      include: {
        deployments: true,
        conversations: true,
        workflows: true
      }
    });

    // Get available models
    const models = await prisma.aIModel.findMany({
      where: { isAvailable: true }
    });

    // Get workflows
    const workflows = await prisma.aIWorkflow.findMany({
      where: {
        agentId: { in: agents.map(a => a.id) }
      },
      include: {
        executions: {
          where: {
            startedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }
      }
    });

    // Get conversations
    const conversations = await prisma.aIConversation.findMany({
      where: {
        agentId: { in: agents.map(a => a.id) }
      },
      include: {
        messages: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }
      }
    });

    // Get budgets
    const budgets = await prisma.aIBudget.findMany({
      where: { userId }
    });

    // Calculate stats
    const agentStats = {
      total: agents.length,
      active: agents.filter(a => a.status === 'active').length,
      healthy: agents.filter(a => a.successRate > 0.95).length,
      warnings: agents.filter(a => a.successRate <= 0.95 && a.successRate > 0.8).length
    };

    const modelStats = {
      total: models.length,
      active: models.filter(m => m.isAvailable).length,
      providers: new Set(models.map(m => m.provider)).size
    };

    const totalExecutions = workflows.reduce((sum, w) => sum + w.totalExecutions, 0);
    const successfulExecutions = workflows.reduce((sum, w) => sum + w.successfulRuns, 0);
    
    const workflowStats = {
      total: workflows.length,
      active: workflows.filter(w => w.status === 'active').length,
      executions: totalExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0
    };

    const totalMessages = conversations.reduce((sum, c) => sum + c.totalMessages, 0);
    const averageLatency = conversations.length > 0 
      ? conversations.reduce((sum, c) => sum + c.averageLatency, 0) / conversations.length 
      : 0;

    const conversationStats = {
      total: conversations.length,
      active: conversations.filter(c => c.status === 'active').length,
      messages: totalMessages,
      averageLatency: Math.round(averageLatency)
    };

    const totalBudget = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
    const totalUsed = budgets.reduce((sum, b) => sum + b.usedBudget, 0);
    const budgetAlerts = budgets.filter(b => (b.usedBudget / b.totalBudget) > b.alertThreshold);

    const costStats = {
      totalSpend: totalUsed,
      monthlyBudget: totalBudget,
      budgetUtilization: totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0,
      alertsCount: budgetAlerts.length
    };

    const totalInteractions = agents.reduce((sum, a) => sum + a.totalInteractions, 0);
    const totalSuccessful = agents.reduce((sum, a) => sum + (a.totalInteractions * a.successRate), 0);
    const avgResponseTime = agents.length > 0 
      ? agents.reduce((sum, a) => sum + a.averageResponseTime, 0) / agents.length 
      : 0;

    const performanceStats = {
      averageLatency: Math.round(avgResponseTime),
      successRate: totalInteractions > 0 ? (totalSuccessful / totalInteractions) * 100 : 0,
      errorRate: totalInteractions > 0 ? ((totalInteractions - totalSuccessful) / totalInteractions) * 100 : 0,
      throughput: 0 // Would need real-time calculation
    };

    const stats = {
      agents: agentStats,
      models: modelStats,
      workflows: workflowStats,
      conversations: conversationStats,
      costs: costStats,
      performance: performanceStats
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}