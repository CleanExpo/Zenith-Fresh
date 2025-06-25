import { NextRequest, NextResponse } from 'next/server';
import { initializeServices, getInitializationStatus } from '@/lib/services/initialize';

export async function POST(request: NextRequest) {
  try {
    // Check if services are already initialized
    if (getInitializationStatus()) {
      return NextResponse.json({
        success: true,
        message: 'Services already initialized',
        status: 'already_running',
      });
    }

    // Initialize services
    await initializeServices();

    return NextResponse.json({
      success: true,
      message: 'Services initialized successfully',
      status: 'initialized',
    });

  } catch (error) {
    console.error('Service initialization failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize services',
      message: error instanceof Error ? error.message : 'Unknown error',
      status: 'failed',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = getInitializationStatus();
    
    return NextResponse.json({
      initialized: status,
      status: status ? 'running' : 'stopped',
    });

  } catch (error) {
    console.error('Failed to get service status:', error);
    
    return NextResponse.json({
      initialized: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}