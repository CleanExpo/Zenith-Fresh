import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AIModelRegistry } from '@/lib/ai/model-integration';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all models
    const models = await prisma.aIModel.findMany({
      orderBy: [
        { provider: 'asc' },
        { name: 'asc' }
      ]
    });

    // Calculate stats
    const stats = {
      totalModels: models.length,
      activeModels: models.filter(m => m.isAvailable).length,
      providersCount: new Set(models.map(m => m.provider)).size,
      totalCost: models.reduce((sum, m) => sum + (m.costPer1kTokens || 0), 0),
      averageLatency: models.length > 0 ? 
        Math.round(models.reduce((sum, m) => sum + m.averageLatency, 0) / models.length) : 0,
      reliability: models.length > 0 ? 
        models.reduce((sum, m) => sum + m.reliability, 0) / models.length : 0
    };

    return NextResponse.json({ models, stats });
  } catch (error) {
    console.error('Error fetching AI models:', error);
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
      provider,
      modelId,
      version,
      capabilities,
      contextLength,
      costPer1kTokens,
      apiKey
    } = body;

    // Validate required fields
    if (!name || !provider || !modelId) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, provider, modelId' 
      }, { status: 400 });
    }

    // Check if model already exists
    const existingModel = await prisma.aIModel.findUnique({
      where: { 
        provider_modelId: { 
          provider, 
          modelId 
        } 
      }
    });

    if (existingModel) {
      return NextResponse.json({ 
        error: 'Model with this provider and modelId already exists' 
      }, { status: 409 });
    }

    // Create the model
    const model = await prisma.aIModel.create({
      data: {
        name,
        provider,
        modelId,
        version,
        capabilities: capabilities || [],
        contextLength: contextLength || 4096,
        costPer1kTokens: costPer1kTokens || 0,
        configuration: apiKey ? { apiKey } : {},
        isAvailable: true,
        averageLatency: 0,
        reliability: 0,
        qualityScore: 0
      }
    });

    return NextResponse.json({ model });
  } catch (error) {
    console.error('Error creating AI model:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('id');

    if (!modelId) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
    }

    // Check if model is in use
    const deploymentsCount = await prisma.aIDeployment.count({
      where: { modelId }
    });

    if (deploymentsCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete model that is currently in use by deployments' 
      }, { status: 409 });
    }

    await prisma.aIModel.delete({
      where: { id: modelId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting AI model:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}