import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const model = await prisma.aIModel.findUnique({
      where: { id: params.id },
      include: {
        deployments: {
          include: {
            agent: true
          }
        },
        performanceMetrics: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          orderBy: { timestamp: 'desc' },
          take: 100
        }
      }
    });

    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    return NextResponse.json({ model });
  } catch (error) {
    console.error('Error fetching AI model:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const allowedFields = [
      'name', 'version', 'capabilities', 'contextLength', 
      'costPer1kTokens', 'isAvailable', 'configuration'
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const model = await prisma.aIModel.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({ model });
  } catch (error) {
    console.error('Error updating AI model:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if model is in use
    const deploymentsCount = await prisma.aIDeployment.count({
      where: { modelId: params.id }
    });

    if (deploymentsCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete model that is currently in use by deployments' 
      }, { status: 409 });
    }

    await prisma.aIModel.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting AI model:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}