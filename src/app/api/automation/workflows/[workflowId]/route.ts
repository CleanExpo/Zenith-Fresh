/**
 * Individual Workflow API Route
 * CRUD operations for specific workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/monitoring/enhanced-sentry';
import { validateWorkflow } from '@/lib/automation/workflow-engine';

// Update schema
const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.enum(['GENERAL', 'MARKETING', 'SALES', 'SUPPORT', 'DEVELOPMENT', 'ANALYTICS', 'INTEGRATION', 'CONTENT', 'FINANCE']).optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  variables: z.record(z.any()).optional(),
  config: z.object({
    timeout: z.number().optional(),
    retryPolicy: z.object({
      maxRetries: z.number().optional(),
      backoffType: z.enum(['fixed', 'exponential']).optional(),
      backoffDelay: z.number().optional()
    }).optional(),
    errorHandling: z.enum(['stop', 'continue', 'retry']).optional()
  }).optional(),
  isTemplate: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

// GET /api/automation/workflows/[workflowId] - Get workflow
export async function GET(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id: params.workflowId },
      include: {
        team: {
          select: { id: true, name: true }
        },
        executions: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            startedAt: true,
            completedAt: true,
            duration: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        schedules: {
          select: {
            id: true,
            name: true,
            isActive: true,
            nextRunAt: true,
            lastRunAt: true
          }
        },
        triggers: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true
          }
        },
        versions: {
          select: {
            id: true,
            version: true,
            createdAt: true,
            createdBy: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Check access permissions
    const hasAccess = workflow.isPublic || await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId: workflow.teamId
      }
    });

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    logger.error('Failed to get workflow', {
      workflowId: params.workflowId,
      error: error.message
    });
    return NextResponse.json(
      { error: 'Failed to get workflow' },
      { status: 500 }
    );
  }
}

// PUT /api/automation/workflows/[workflowId] - Update workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = UpdateWorkflowSchema.parse(data);

    // Get workflow and check permissions
    const workflow = await prisma.workflow.findUnique({
      where: { id: params.workflowId },
      include: { team: true }
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Check if user can modify this workflow
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId: workflow.teamId
      }
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate workflow definition if nodes/edges are being updated
    if (validatedData.nodes || validatedData.edges) {
      const validation = await validateWorkflow({
        nodes: validatedData.nodes || workflow.nodes as any,
        edges: validatedData.edges || workflow.edges as any,
        variables: validatedData.variables || workflow.variables as any || {},
        config: { ...workflow.config as any, ...validatedData.config }
      });

      if (!validation.isValid) {
        return NextResponse.json({
          error: 'Invalid workflow definition',
          details: validation.errors
        }, { status: 400 });
      }
    }

    // Create new version if nodes or edges changed
    if (validatedData.nodes || validatedData.edges) {
      await prisma.workflowVersion.create({
        data: {
          workflowId: workflow.id,
          version: `${workflow.version}.${Date.now()}`,
          nodes: validatedData.nodes || workflow.nodes,
          edges: validatedData.edges || workflow.edges,
          config: { ...workflow.config as any, ...validatedData.config },
          createdBy: session.user.id
        }
      });
    }

    // Calculate new complexity if nodes changed
    let complexity = workflow.complexity;
    if (validatedData.nodes) {
      const nodeCount = validatedData.nodes.length;
      complexity = nodeCount < 5 ? 'SIMPLE' :
                   nodeCount < 15 ? 'MEDIUM' :
                   nodeCount < 30 ? 'COMPLEX' : 'ENTERPRISE';
    }

    // Update workflow
    const updatedWorkflow = await prisma.workflow.update({
      where: { id: params.workflowId },
      data: {
        ...validatedData,
        complexity: complexity as any,
        updatedBy: session.user.id,
        version: validatedData.nodes || validatedData.edges ? 
          `${workflow.version}.${Date.now()}` : workflow.version
      },
      include: {
        team: {
          select: { id: true, name: true }
        }
      }
    });

    logger.info('Workflow updated', {
      workflowId: params.workflowId,
      updatedBy: session.user.id,
      changes: Object.keys(validatedData)
    });

    return NextResponse.json(updatedWorkflow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    logger.error('Failed to update workflow', {
      workflowId: params.workflowId,
      error: error.message
    });
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

// DELETE /api/automation/workflows/[workflowId] - Delete workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workflow and check permissions
    const workflow = await prisma.workflow.findUnique({
      where: { id: params.workflowId },
      include: { team: true }
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Check if user can delete this workflow
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId: workflow.teamId,
        role: { in: ['ADMIN', 'OWNER'] } // Only admins can delete
      }
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if workflow has active executions
    const activeExecutions = await prisma.workflowExecution.count({
      where: {
        workflowId: params.workflowId,
        status: { in: ['PENDING', 'RUNNING'] }
      }
    });

    if (activeExecutions > 0) {
      return NextResponse.json({
        error: 'Cannot delete workflow with active executions'
      }, { status: 400 });
    }

    // Delete workflow (cascade will handle related records)
    await prisma.workflow.delete({
      where: { id: params.workflowId }
    });

    logger.info('Workflow deleted', {
      workflowId: params.workflowId,
      deletedBy: session.user.id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete workflow', {
      workflowId: params.workflowId,
      error: error.message
    });
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}