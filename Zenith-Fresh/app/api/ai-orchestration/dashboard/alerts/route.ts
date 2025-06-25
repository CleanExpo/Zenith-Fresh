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

    // Get user's agents for filtering
    const agents = await prisma.aIAgent.findMany({
      where: { userId },
      select: { id: true }
    });

    const agentIds = agents.map(a => a.id);

    // Simulate alerts based on actual data
    const alerts = [];

    // Check for budget alerts
    const budgets = await prisma.aIBudget.findMany({
      where: { userId }
    });

    for (const budget of budgets) {
      const utilization = budget.totalBudget > 0 ? (budget.usedBudget / budget.totalBudget) : 0;
      
      if (utilization > budget.alertThreshold) {
        alerts.push({
          id: `budget-alert-${budget.id}`,
          type: 'cost',
          severity: utilization > 1 ? 'critical' : 'high',
          title: `Budget Alert: ${budget.name}`,
          description: `Budget utilization at ${(utilization * 100).toFixed(1)}% (${budget.usedBudget.toFixed(2)}/${budget.totalBudget.toFixed(2)})`,
          timestamp: new Date(),
          isResolved: false
        });
      } else if (utilization > budget.warningThreshold) {
        alerts.push({
          id: `budget-warning-${budget.id}`,
          type: 'cost',
          severity: 'medium',
          title: `Budget Warning: ${budget.name}`,
          description: `Budget utilization at ${(utilization * 100).toFixed(1)}% - approaching limit`,
          timestamp: new Date(),
          isResolved: false
        });
      }
    }

    // Check for performance alerts
    const performanceAgents = await prisma.aIAgent.findMany({
      where: { 
        id: { in: agentIds },
        OR: [
          { successRate: { lt: 0.8 } },
          { averageResponseTime: { gt: 5000 } }
        ]
      }
    });

    for (const agent of performanceAgents) {
      if (agent.successRate < 0.5) {
        alerts.push({
          id: `performance-critical-${agent.id}`,
          type: 'performance',
          severity: 'critical',
          title: `Critical Performance Issue: ${agent.name}`,
          description: `Success rate at ${(agent.successRate * 100).toFixed(1)}% - immediate attention required`,
          timestamp: new Date(),
          isResolved: false
        });
      } else if (agent.successRate < 0.8) {
        alerts.push({
          id: `performance-warning-${agent.id}`,
          type: 'performance',
          severity: 'medium',
          title: `Performance Warning: ${agent.name}`,
          description: `Success rate at ${(agent.successRate * 100).toFixed(1)}% - below optimal threshold`,
          timestamp: new Date(),
          isResolved: false
        });
      }

      if (agent.averageResponseTime > 5000) {
        alerts.push({
          id: `latency-warning-${agent.id}`,
          type: 'performance',
          severity: 'medium',
          title: `High Latency: ${agent.name}`,
          description: `Average response time: ${agent.averageResponseTime}ms - consider optimization`,
          timestamp: new Date(),
          isResolved: false
        });
      }
    }

    // Check for capacity alerts (simulated)
    if (agentIds.length > 0) {
      const totalInteractions = await prisma.aIAgent.aggregate({
        where: { id: { in: agentIds } },
        _sum: { totalInteractions: true }
      });

      if ((totalInteractions._sum.totalInteractions || 0) > 100000) {
        alerts.push({
          id: 'capacity-warning',
          type: 'capacity',
          severity: 'medium',
          title: 'High Usage Detected',
          description: `Total interactions: ${totalInteractions._sum.totalInteractions?.toLocaleString()} - consider scaling`,
          timestamp: new Date(),
          isResolved: false
        });
      }
    }

    // Sort alerts by severity and timestamp
    const severityOrder: { [key: string]: number } = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching dashboard alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}