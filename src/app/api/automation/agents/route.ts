/**
 * AI Agents API Route
 * CRUD operations for automation agents
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/monitoring/enhanced-sentry';
import { agentOrchestrator } from '@/lib/agents/agent-orchestrator';

// Request schemas
const CreateAgentSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['CONTENT_CREATOR', 'DATA_ANALYST', 'RESEARCH_ASSISTANT', 'CUSTOMER_SUPPORT', 'MARKETING_SPECIALIST', 'SALES_ASSISTANT', 'DEVELOPER_HELPER', 'PROJECT_MANAGER', 'CUSTOM']),
  description: z.string().optional(),
  provider: z.enum(['openai', 'anthropic', 'google']),
  model: z.string(),
  systemPrompt: z.string().min(1),
  capabilities: z.array(z.string()).default([]),
  temperature: z.number().min(0).max(1).default(0.7),
  maxTokens: z.number().min(1).max(128000).default(4000),
  avatar: z.string().optional()
});

const UpdateAgentSchema = CreateAgentSchema.partial();

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

// GET /api/automation/agents - List agents
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const provider = searchParams.get('provider');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    // Build filters
    const where: any = {
      team: {
        members: {
          some: { userId: session.user.id }
        }
      }
    };

    if (type) {
      where.type = type;
    }

    if (provider) {
      where.provider = provider;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { capabilities: { hasSome: [search] } }
      ];
    }

    const [agents, total] = await Promise.all([
      prisma.aIAgent.findMany({
        where,
        include: {
          team: {
            select: { id: true, name: true }
          },
          _count: {
            select: {
              executions: true,
              conversations: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.aIAgent.count({ where })
    ]);

    return NextResponse.json({
      agents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Failed to list agents', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to list agents' },
      { status: 500 }
    );
  }
}

// POST /api/automation/agents - Create agent
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = CreateAgentSchema.parse(data);

    // Get user's team
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
      include: { team: true }
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Create agent using orchestrator
    const agentId = await agentOrchestrator.createAgent(
      teamMember.teamId,
      {
        name: validatedData.name,
        type: validatedData.type,
        description: validatedData.description,
        provider: validatedData.provider,
        model: validatedData.model,
        systemPrompt: validatedData.systemPrompt,
        capabilities: validatedData.capabilities,
        temperature: validatedData.temperature,
        maxTokens: validatedData.maxTokens
      },
      session.user.id
    );

    // Get created agent with relations
    const agent = await prisma.aIAgent.findUnique({
      where: { id: agentId },
      include: {
        team: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    logger.error('Failed to create agent', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}

// POST /api/automation/agents/execute - Execute agent task
export async function POST_EXECUTE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = ExecuteAgentSchema.parse(data);

    // Check if agentId is provided in the request
    if (!data.agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    // Execute agent task
    const result = await agentOrchestrator.executeAgent({
      agentId: data.agentId,
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

    logger.error('Failed to execute agent', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to execute agent' },
      { status: 500 }
    );
  }
}