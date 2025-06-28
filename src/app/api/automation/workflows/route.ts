/**
 * Workflows API Route
 * CRUD operations for automation workflows
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/monitoring/enhanced-sentry';
import { validateWorkflow } from '@/lib/automation/workflow-engine';

// Request schemas
const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(['GENERAL', 'MARKETING', 'SALES', 'SUPPORT', 'DEVELOPMENT', 'ANALYTICS', 'INTEGRATION', 'CONTENT', 'FINANCE']).default('GENERAL'),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  variables: z.record(z.any()).default({}),
  config: z.object({
    timeout: z.number().default(300000),
    retryPolicy: z.object({
      maxRetries: z.number().default(3),
      backoffType: z.enum(['fixed', 'exponential']).default('exponential'),
      backoffDelay: z.number().default(1000)
    }).default({}),
    errorHandling: z.enum(['stop', 'continue', 'retry']).default('stop')
  }).default({}),
  isTemplate: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([])
});

const UpdateWorkflowSchema = CreateWorkflowSchema.partial();

// GET /api/automation/workflows - List workflows
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isTemplate = searchParams.get('template') === 'true';
    const isPublic = searchParams.get('public') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    // Build filters
    const where: any = {
      OR: [
        { team: { members: { some: { userId: session.user.id } } } },
        { isPublic: true }
      ]
    };

    if (category) {
      where.category = category;
    }

    if (isTemplate) {
      where.isTemplate = true;
    }

    if (isPublic) {
      where.isPublic = true;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { tags: { hasSome: [search] } }
          ]
        }
      ];
    }

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        include: {
          team: {
            select: { id: true, name: true }
          },
          _count: {
            select: {
              executions: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.workflow.count({ where })
    ]);

    return NextResponse.json({
      workflows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Failed to list workflows', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to list workflows' },
      { status: 500 }
    );
  }
}

// POST /api/automation/workflows - Create workflow
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = CreateWorkflowSchema.parse(data);

    // Get user's team
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
      include: { team: true }
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Validate workflow definition
    const validation = await validateWorkflow({
      nodes: validatedData.nodes,
      edges: validatedData.edges,
      variables: validatedData.variables,
      config: validatedData.config
    });

    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Invalid workflow definition',
        details: validation.errors
      }, { status: 400 });
    }

    // Calculate complexity
    const complexity = validatedData.nodes.length < 5 ? 'SIMPLE' :
                      validatedData.nodes.length < 15 ? 'MEDIUM' :
                      validatedData.nodes.length < 30 ? 'COMPLEX' : 'ENTERPRISE';

    // Create workflow
    const workflow = await prisma.workflow.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        nodes: validatedData.nodes,
        edges: validatedData.edges,
        variables: validatedData.variables,
        config: validatedData.config,
        isTemplate: validatedData.isTemplate,
        isPublic: validatedData.isPublic,
        tags: validatedData.tags,
        complexity: complexity as any,
        teamId: teamMember.teamId,
        createdBy: session.user.id
      },
      include: {
        team: {
          select: { id: true, name: true }
        }
      }
    });

    logger.info('Workflow created', {
      workflowId: workflow.id,
      teamId: teamMember.teamId,
      createdBy: session.user.id,
      complexity
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    logger.error('Failed to create workflow', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}