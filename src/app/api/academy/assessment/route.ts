// src/app/api/academy/assessment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import TrainingAgent from '@/lib/agents/training-agent';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const trainingAgent = new TrainingAgent(userId);
    const assessment = await trainingAgent.performClientAssessment();

    return NextResponse.json({
      success: true,
      assessment
    });

  } catch (error) {
    console.error('TrainingAgent assessment error:', error);
    return NextResponse.json(
      { error: 'Failed to perform client assessment' },
      { status: 500 }
    );
  }
}
