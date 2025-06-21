// src/app/api/academy/learning-paths/route.ts
import { NextRequest, NextResponse } from 'next/server';
import TrainingAgent from '@/lib/agents/training-agent';

export async function POST(request: NextRequest) {
  try {
    const { userId, assessment } = await request.json();
    
    if (!userId || !assessment) {
      return NextResponse.json(
        { error: 'User ID and assessment are required' },
        { status: 400 }
      );
    }

    const trainingAgent = new TrainingAgent(userId);
    const learningPath = await trainingAgent.createPersonalizedLearningPath(assessment);

    return NextResponse.json({
      success: true,
      learningPath
    });

  } catch (error) {
    console.error('Learning path creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create learning path' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // In production, this would fetch from database
    // For now, return placeholder data
    const learningPaths = [
      {
        id: `path_${userId}_${Date.now()}`,
        userId,
        title: "Your Personalized Zenith Mastery Path",
        description: "Customized learning journey based on your goals and performance",
        progress: 25,
        estimatedDuration: "4h 30m",
        modules: []
      }
    ];

    return NextResponse.json({
      success: true,
      learningPaths
    });

  } catch (error) {
    console.error('Learning paths fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning paths' },
      { status: 500 }
    );
  }
}
