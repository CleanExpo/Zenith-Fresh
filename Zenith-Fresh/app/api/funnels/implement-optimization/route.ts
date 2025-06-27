import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';
import { FunnelService } from '../../../../lib/services/funnel-service';

const funnelService = new FunnelService(prisma);

// POST /api/funnels/implement-optimization - Mark optimization as implemented
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { funnelId, suggestionId, notes, status } = body;

    if (!funnelId || !suggestionId) {
      return NextResponse.json(
        { error: 'funnelId and suggestionId are required' },
        { status: 400 }
      );
    }

    // Check if user has access to the funnel
    const funnel = await funnelService.getFunnel(funnelId);
    if (!funnel || funnel.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Funnel not found or access denied' },
        { status: 404 }
      );
    }

    // Create or update optimization record
    const optimization = await prisma.funnelOptimization.upsert({
      where: {
        id: suggestionId
      },
      update: {
        status: status || 'implemented',
        implementedAt: new Date(),
        implementedBy: session.user.id,
        description: notes || 'Optimization implemented via dashboard'
      },
      create: {
        id: suggestionId,
        funnelId,
        type: 'manual_change',
        title: 'Manual Optimization Implementation',
        description: notes || 'Optimization implemented via dashboard',
        recommendations: { notes },
        status: status || 'implemented',
        implementedAt: new Date(),
        implementedBy: session.user.id
      }
    });

    // Log optimization implementation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'FUNNEL_OPTIMIZATION_IMPLEMENTED',
        resource: 'funnel',
        resourceId: funnelId,
        details: {
          optimizationId: optimization.id,
          status: optimization.status,
          notes
        }
      }
    });

    return NextResponse.json({
      success: true,
      optimization,
      message: 'Optimization marked as implemented'
    });

  } catch (error) {
    console.error('Failed to implement optimization:', error);
    return NextResponse.json(
      { error: 'Failed to implement optimization' },
      { status: 500 }
    );
  }
}

// PUT /api/funnels/implement-optimization - Update optimization status
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { optimizationId, status, notes, actualImpact, measurementPeriod } = body;

    if (!optimizationId || !status) {
      return NextResponse.json(
        { error: 'optimizationId and status are required' },
        { status: 400 }
      );
    }

    // Get existing optimization
    const existingOptimization = await prisma.funnelOptimization.findUnique({
      where: { id: optimizationId },
      include: { funnel: true }
    });

    if (!existingOptimization) {
      return NextResponse.json(
        { error: 'Optimization not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the funnel
    if (existingOptimization.funnel.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update optimization
    const optimization = await prisma.funnelOptimization.update({
      where: { id: optimizationId },
      data: {
        status,
        actualImpact: actualImpact !== undefined ? actualImpact : undefined,
        measurementPeriod: measurementPeriod !== undefined ? measurementPeriod : undefined,
        description: notes ? `${existingOptimization.description}\n\nUpdate: ${notes}` : undefined
      }
    });

    // Log optimization update
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'FUNNEL_OPTIMIZATION_UPDATED',
        resource: 'funnel',
        resourceId: existingOptimization.funnelId,
        details: {
          optimizationId,
          previousStatus: existingOptimization.status,
          newStatus: status,
          actualImpact,
          measurementPeriod,
          notes
        }
      }
    });

    return NextResponse.json({
      success: true,
      optimization,
      message: 'Optimization updated successfully'
    });

  } catch (error) {
    console.error('Failed to update optimization:', error);
    return NextResponse.json(
      { error: 'Failed to update optimization' },
      { status: 500 }
    );
  }
}

// GET /api/funnels/implement-optimization - Get optimization implementation history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get('funnelId');
    const implementedBy = searchParams.get('implementedBy');

    if (!funnelId) {
      return NextResponse.json(
        { error: 'funnelId is required' },
        { status: 400 }
      );
    }

    // Check if user has access to the funnel
    const funnel = await funnelService.getFunnel(funnelId);
    if (!funnel || funnel.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Funnel not found or access denied' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: any = { funnelId };
    if (implementedBy) where.implementedBy = implementedBy;

    // Get implementation history
    const implementations = await prisma.funnelOptimization.findMany({
      where,
      orderBy: { implementedAt: 'desc' },
      include: {
        funnel: {
          select: {
            name: true
          }
        }
      }
    });

    // Get statistics
    const stats = await prisma.funnelOptimization.aggregate({
      where: { funnelId, status: 'implemented' },
      _count: { id: true },
      _avg: { actualImpact: true },
      _sum: { actualImpact: true }
    });

    return NextResponse.json({
      success: true,
      implementations,
      stats: {
        totalImplementations: stats._count.id,
        averageImpact: stats._avg.actualImpact,
        totalImpact: stats._sum.actualImpact
      }
    });

  } catch (error) {
    console.error('Failed to get implementation history:', error);
    return NextResponse.json(
      { error: 'Failed to get implementation history' },
      { status: 500 }
    );
  }
}