import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';
import { FunnelService } from '../../../../lib/services/funnel-service';

const funnelService = new FunnelService(prisma);

// GET /api/funnels/[id] - Get specific funnel
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const funnelId = params.id;
    const funnel = await funnelService.getFunnel(funnelId);

    if (!funnel) {
      return NextResponse.json(
        { error: 'Funnel not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (funnel.ownerId !== session.user.id) {
      // TODO: Check team membership if teamId is set
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(funnel);

  } catch (error) {
    console.error('Failed to fetch funnel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funnel' },
      { status: 500 }
    );
  }
}

// PUT /api/funnels/[id] - Update specific funnel
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const funnelId = params.id;
    const updates = await request.json();

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

// DELETE /api/funnels/[id] - Delete specific funnel
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const funnelId = params.id;

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