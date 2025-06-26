import { NextRequest, NextResponse } from 'next/server';

// Dynamic import to prevent build-time execution
async function getServiceHelpers() {
  // Only import during runtime, not build time
  if (typeof window !== 'undefined' || process.env.NODE_ENV === 'test') {
    // Client-side or test environment - return mock
    return {
      initializeServices: async () => {},
      getInitializationStatus: () => false,
    };
  }
  
  try {
    const { initializeServices, getInitializationStatus } = await import('@/lib/services/initialize');
    return { initializeServices, getInitializationStatus };
  } catch (error) {
    console.warn('Service initialization not available:', error);
    return {
      initializeServices: async () => {
        throw new Error('Service initialization not available in this environment');
      },
      getInitializationStatus: () => false,
    };
  }
}

export async function POST(request: NextRequest) {
  // Prevent execution during build
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL && !process.env.RAILWAY_ENVIRONMENT) {
    return NextResponse.json({
      success: false,
      error: 'Service initialization not available during build',
      status: 'unavailable',
    }, { status: 503 });
  }

  try {
    const { initializeServices, getInitializationStatus } = await getServiceHelpers();

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
    const { getInitializationStatus } = await getServiceHelpers();
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