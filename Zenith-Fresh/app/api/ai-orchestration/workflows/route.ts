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

    // Get user's AI agents
    const userAgents = await prisma.aIAgent.findMany({
      where: { userId },
      select: { id: true }
    });

    const agentIds = userAgents.map(agent => agent.id);

    // Get workflows for user's agents
    const workflows = await prisma.aIWorkflow.findMany({
      where: {
        agentId: { in: agentIds }
      },
      include: {
        agent: {
          select: { name: true }
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      definition,
      triggerType,
      triggerConfig,
      agentId
    } = body;

    // Validate required fields
    if (!name || !definition || !agentId) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, definition, agentId' 
      }, { status: 400 });
    }

    // Verify agent belongs to user
    const agent = await prisma.aIAgent.findFirst({
      where: { 
        id: agentId,
        userId: session.user.id
      }
    });

    if (!agent) {
      return NextResponse.json({ 
        error: 'Agent not found or unauthorized' 
      }, { status: 404 });
    }

    // Create workflow
    const workflow = await prisma.aIWorkflow.create({
      data: {
        name,
        description,
        definition,
        status: 'draft',
        version: '1.0.0',
        triggerType,
        triggerConfig,
        agentId,
        totalExecutions: 0,
        successfulRuns: 0,
        failedRuns: 0,
        averageRuntime: 0
      }
    });

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    // Verify workflow belongs to user's agent
    const workflow = await prisma.aIWorkflow.findFirst({
      where: { 
        id,
        agent: { userId: session.user.id }
      }
    });

    if (!workflow) {
      return NextResponse.json({ 
        error: 'Workflow not found or unauthorized' 
      }, { status: 404 });
    }

    // Update workflow
    const updatedWorkflow = await prisma.aIWorkflow.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ workflow: updatedWorkflow });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}