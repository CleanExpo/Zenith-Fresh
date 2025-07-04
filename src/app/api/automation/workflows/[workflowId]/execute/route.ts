/**
 * Workflow Execution API Route
 * Execute workflows with parameters
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/monitoring/enhanced-sentry';
import { workflowEngine } from '@/lib/automation/workflow-engine';

// Execution request schema
const ExecuteWorkflowSchema = z.object({
  input: z.record(z.any()).default({}),
  triggeredBy: z.enum(['MANUAL', 'SCHEDULED', 'WEBHOOK', 'EVENT', 'API']).default('MANUAL'),
  options: z.object({
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
    timeout: z.number().optional(),
    retryPolicy: z.object({
      maxRetries: z.number().optional(),
      backoffType: z.enum(['fixed', 'exponential']).optional(),
      backoffDelay: z.number().optional()
    }).optional()
  }).default({})
});

// POST /api/automation/workflows/[workflowId]/execute - Execute workflow
export async function POST(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = ExecuteWorkflowSchema.parse(data);

    // Get workflow and check permissions
    const workflow = await prisma.workflow.findUnique({
      where: { id: params.workflowId },
      include: { team: true }
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (!workflow.isActive) {
      return NextResponse.json({ error: 'Workflow is not active' }, { status: 400 });
    }

    // Check if user can execute this workflow
    const hasAccess = workflow.isPublic || await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId: workflow.teamId
      }
    });

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check team usage limits
    const teamUsage = await checkTeamUsageLimits(workflow.teamId);
    if (!teamUsage.canExecute) {
      return NextResponse.json({
        error: 'Usage limit exceeded',
        details: teamUsage.reason
      }, { status: 429 });
    }

    // Execute workflow
    const executionId = await workflowEngine.executeWorkflow(
      params.workflowId,
      validatedData.input,
      {
        teamId: workflow.teamId,
        userId: session.user.id,
        triggeredBy: validatedData.triggeredBy,
        version: workflow.version
      }
    );

    logger.info('Workflow execution started', {
      workflowId: params.workflowId,
      executionId,
      triggeredBy: validatedData.triggeredBy,
      userId: session.user.id
    });

    // Return execution details
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        workflow: {
          select: { id: true, name: true, category: true }
        }
      }
    });

    return NextResponse.json({
      executionId,
      status: execution?.status,
      workflow: execution?.workflow,
      startedAt: execution?.startedAt,
      estimatedDuration: estimateExecutionDuration(workflow)
    }, { status: 202 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    logger.error('Failed to execute workflow', {
      workflowId: params.workflowId,
      error: error.message
    });
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}

// GET /api/automation/workflows/[workflowId]/execute - Get execution history
export async function GET(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    // Get workflow and check permissions
    const workflow = await prisma.workflow.findUnique({
      where: { id: params.workflowId }
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Check access
    const hasAccess = workflow.isPublic || await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId: workflow.teamId
      }
    });

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build filters
    const where: any = { workflowId: params.workflowId };
    if (status) {
      where.status = status;
    }

    // Get executions
    const [executions, total] = await Promise.all([
      prisma.workflowExecution.findMany({
        where,
        include: {
          _count: {
            select: {
              logs: true,
              nodeExecutions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.workflowExecution.count({ where })
    ]);

    // Get execution statistics
    const stats = await prisma.workflowExecution.groupBy({
      by: ['status'],
      where: { workflowId: params.workflowId },
      _count: true,
      _avg: {
        duration: true
      }
    });

    return NextResponse.json({
      executions,
      stats: stats.reduce((acc, stat) => {
        acc[stat.status] = {
          count: stat._count,
          averageDuration: stat._avg.duration
        };
        return acc;
      }, {} as Record<string, any>),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Failed to get execution history', {
      workflowId: params.workflowId,
      error: error.message
    });
    return NextResponse.json(
      { error: 'Failed to get execution history' },
      { status: 500 }
    );
  }
}

// Helper functions
async function checkTeamUsageLimits(teamId: string): Promise<{
  canExecute: boolean;
  reason?: string;
}> {
  try {
    // Get team subscription
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { subscription: true }
    });

    if (!team) {
      return { canExecute: false, reason: 'Team not found' };
    }

    // Check subscription status
    if (!team.subscription || team.subscription.status !== 'ACTIVE') {
      // Check if within free tier limits
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const executionsThisMonth = await prisma.workflowExecution.count({
        where: {
          teamId,
          createdAt: { gte: currentMonth }
        }
      });

      const FREE_TIER_LIMIT = 100; // 100 executions per month
      if (executionsThisMonth >= FREE_TIER_LIMIT) {
        return {
          canExecute: false,
          reason: `Free tier limit of ${FREE_TIER_LIMIT} executions per month exceeded`
        };
      }
    }

    // Check for active executions limit
    const activeExecutions = await prisma.workflowExecution.count({
      where: {
        teamId,
        status: { in: ['PENDING', 'RUNNING'] }
      }
    });

    const CONCURRENT_LIMIT = team.subscription?.status === 'ACTIVE' ? 50 : 5;
    if (activeExecutions >= CONCURRENT_LIMIT) {
      return {
        canExecute: false,
        reason: `Maximum concurrent executions (${CONCURRENT_LIMIT}) reached`
      };
    }

    return { canExecute: true };
  } catch (error) {
    logger.error('Failed to check usage limits', { teamId, error: error.message });
    return { canExecute: false, reason: 'Failed to check usage limits' };
  }
}

function estimateExecutionDuration(workflow: any): number {
  // Simple estimation based on node count and complexity
  const nodeCount = Array.isArray(workflow.nodes) ? workflow.nodes.length : 0;
  const baseTime = 1000; // 1 second base
  const timePerNode = 500; // 0.5 seconds per node
  
  return baseTime + (nodeCount * timePerNode);
}