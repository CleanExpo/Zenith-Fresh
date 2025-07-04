/**
 * Individual Agent API Route
 * CRUD operations for specific agents
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/monitoring/enhanced-sentry';
import { agentOrchestrator } from '@/lib/agents/agent-orchestrator';

// Update schema
const UpdateAgentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  systemPrompt: z.string().min(1).optional(),
  capabilities: z.array(z.string()).optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().min(1).max(128000).optional(),
  isActive: z.boolean().optional(),
  avatar: z.string().optional()
});

const ExecuteAgentSchema = z.object({
  task: z.string().min(1),
  input: z.record(z.any()).default({}),
  context: z.record(z.any()).optional(),
  options: z.object({
    temperature: z.number().min(0).max(1).optional(),
    maxTokens: z.number().min(1).max(128000).optional(),
    systemPrompt: z.string().optional(),
    stream: z.boolean().default(false)
  }).default({})
});

// GET /api/automation/agents/[agentId] - Get agent
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agent = await prisma.aIAgent.findUnique({
      where: { id: params.agentId },
      include: {
        team: {
          select: { id: true, name: true }
        },
        executions: {
          select: {
            id: true,
            task: true,
            status: true,
            createdAt: true,
            startedAt: true,
            completedAt: true,
            duration: true,
            tokens: true,
            cost: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        conversations: {
          select: {
            id: true,
            title: true,
            messageCount: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { updatedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check access permissions
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId: agent.teamId
      }
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    logger.error('Failed to get agent', {
      agentId: params.agentId,
      error: error.message
    });
    return NextResponse.json(
      { error: 'Failed to get agent' },
      { status: 500 }
    );
  }
}

// PUT /api/automation/agents/[agentId] - Update agent
export async function PUT(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = UpdateAgentSchema.parse(data);

    // Get agent and check permissions
    const agent = await prisma.aIAgent.findUnique({
      where: { id: params.agentId }
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check if user can modify this agent
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId: agent.teamId
      }
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update agent using orchestrator
    await agentOrchestrator.updateAgent(params.agentId, validatedData);

    // Get updated agent
    const updatedAgent = await prisma.aIAgent.findUnique({
      where: { id: params.agentId },
      include: {
        team: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(updatedAgent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    logger.error('Failed to update agent', {
      agentId: params.agentId,
      error: error.message
    });
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

// DELETE /api/automation/agents/[agentId] - Delete agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent and check permissions
    const agent = await prisma.aIAgent.findUnique({
      where: { id: params.agentId }
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check if user can delete this agent
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId: agent.teamId,
        role: { in: ['ADMIN', 'OWNER'] } // Only admins can delete
      }
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if agent has active executions
    const activeExecutions = await prisma.agentExecution.count({
      where: {
        agentId: params.agentId,
        status: { in: ['PENDING', 'RUNNING'] }
      }
    });

    if (activeExecutions > 0) {
      return NextResponse.json({
        error: 'Cannot delete agent with active executions'
      }, { status: 400 });
    }

    // Delete agent (cascade will handle related records)
    await prisma.aIAgent.delete({
      where: { id: params.agentId }
    });

    logger.info('Agent deleted', {
      agentId: params.agentId,
      deletedBy: session.user.id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete agent', {
      agentId: params.agentId,
      error: error.message
    });
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}

// POST /api/automation/agents/[agentId]/execute - Execute agent task
export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = ExecuteAgentSchema.parse(data);

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

    // Execute agent task
    const result = await agentOrchestrator.executeAgent({
      agentId: params.agentId,
      task: validatedData.task,
      input: validatedData.input,
      context: validatedData.context,
      options: validatedData.options
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    logger.error('Failed to execute agent', {
      agentId: params.agentId,
      error: error.message
    });
    return NextResponse.json(
      { error: 'Failed to execute agent' },
      { status: 500 }
    );
  }
}