import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';
import { FunnelService } from '../../../lib/services/funnel-service';
import { 
  CreateFunnelRequest, 
  CreateFunnelResponse,
  FunnelConfig 
} from '../../../types/funnel';

const funnelService = new FunnelService(prisma);

// GET /api/funnels - List funnels for user/team
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const projectId = searchParams.get('projectId');

    const funnels = await funnelService.getFunnelsByOwner(
      session.user.id,
      teamId || undefined
    );

    return NextResponse.json({
      success: true,
      funnels,
      count: funnels.length
    });

  } catch (error) {
    console.error('Failed to fetch funnels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funnels' },
      { status: 500 }
    );
  }
}

// POST /api/funnels - Create new funnel
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as CreateFunnelRequest & {
      teamId?: string;
      projectId?: string;
    };

    // Validate required fields
    if (!body.config?.name) {
      return NextResponse.json(
        { error: 'Funnel name is required' },
        { status: 400 }
      );
    }

    if (!body.config?.steps || body.config.steps.length === 0) {
      return NextResponse.json(
        { error: 'At least one funnel step is required' },
        { status: 400 }
      );
    }

    // Validate steps
    for (let i = 0; i < body.config.steps.length; i++) {
      const step = body.config.steps[i];
      if (!step.name?.trim()) {
        return NextResponse.json(
          { error: `Step ${i + 1} name is required` },
          { status: 400 }
        );
      }

      if (!step.eventType) {
        return NextResponse.json(
          { error: `Step ${i + 1} event type is required` },
          { status: 400 }
        );
      }

      // Validate event criteria based on type
      if (step.eventType === 'PAGE_VIEW' && !step.eventCriteria?.urlPattern) {
        return NextResponse.json(
          { error: `Step ${i + 1} requires URL pattern for page view events` },
          { status: 400 }
        );
      }

      if (step.eventType === 'BUTTON_CLICK' && !step.eventCriteria?.elementSelector) {
        return NextResponse.json(
          { error: `Step ${i + 1} requires element selector for click events` },
          { status: 400 }
        );
      }
    }

    // Create the funnel
    const funnel = await funnelService.createFunnel(
      body.config,
      session.user.id,
      body.teamId,
      body.projectId
    );

    // Log funnel creation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'FUNNEL_CREATED',
        resource: 'funnel',
        resourceId: funnel.id,
        details: {
          funnelName: funnel.name,
          stepCount: funnel.steps.length,
          category: funnel.category
        }
      }
    });

    const response: CreateFunnelResponse = {
      success: true,
      funnel,
      message: 'Funnel created successfully'
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Failed to create funnel:', error);
    return NextResponse.json(
      { error: 'Failed to create funnel' },
      { status: 500 }
    );
  }
}

// PUT /api/funnels - Update existing funnel
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { funnelId, updates } = body;

    if (!funnelId) {
      return NextResponse.json(
        { error: 'Funnel ID is required' },
        { status: 400 }
      );
    }

    // Check if user owns the funnel
    const existingFunnel = await funnelService.getFunnel(funnelId);
    if (!existingFunnel || existingFunnel.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Funnel not found or access denied' },
        { status: 404 }
      );
    }

    const updatedFunnel = await funnelService.updateFunnel(funnelId, updates);

    // Log funnel update
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'FUNNEL_UPDATED',
        resource: 'funnel',
        resourceId: funnelId,
        details: { updates }
      }
    });

    return NextResponse.json({
      success: true,
      funnel: updatedFunnel
    });

  } catch (error) {
    console.error('Failed to update funnel:', error);
    return NextResponse.json(
      { error: 'Failed to update funnel' },
      { status: 500 }
    );
  }
}

// DELETE /api/funnels - Delete funnel
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get('funnelId');

    if (!funnelId) {
      return NextResponse.json(
        { error: 'Funnel ID is required' },
        { status: 400 }
      );
    }

    // Check if user owns the funnel
    const existingFunnel = await funnelService.getFunnel(funnelId);
    if (!existingFunnel || existingFunnel.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Funnel not found or access denied' },
        { status: 404 }
      );
    }

    await funnelService.deleteFunnel(funnelId);

    // Log funnel deletion
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'FUNNEL_DELETED',
        resource: 'funnel',
        resourceId: funnelId,
        details: { funnelName: existingFunnel.name }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Funnel deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete funnel:', error);
    return NextResponse.json(
      { error: 'Failed to delete funnel' },
      { status: 500 }
    );
  }
}