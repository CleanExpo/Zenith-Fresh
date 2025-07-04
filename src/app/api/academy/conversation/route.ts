// src/app/api/academy/conversation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import TrainingAgent from '@/lib/agents/training-agent';

export async function POST(request: NextRequest) {
  try {
    const { userId, message, context } = await request.json();
    
    if (!userId || !message) {
      return NextResponse.json(
        { error: 'User ID and message are required' },
        { status: 400 }
      );
    }

    const trainingAgent = new TrainingAgent(userId);
    const response = await trainingAgent.handleConversation(message, context || {});

    return NextResponse.json({
      success: true,
      response,
      context,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Training conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to process conversation' },
      { status: 500 }
    );
  }
}
