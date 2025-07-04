import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'info';

    switch (testType) {
      case 'error':
        // Test error tracking
        Sentry.captureException(new Error('Test error for Sentry monitoring'));
        throw new Error('Intentional test error');
        
      case 'message':
        // Test message tracking
        Sentry.captureMessage('Test message from Sentry monitoring', 'info');
        return NextResponse.json({ 
          success: true, 
          message: 'Test message sent to Sentry',
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'configured' : 'missing'
        });
        
      case 'performance':
        // Test performance monitoring
        const transaction = Sentry.startTransaction({
          name: 'test-transaction',
          op: 'test'
        });
        
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 100));
        
        transaction.finish();
        
        return NextResponse.json({ 
          success: true, 
          message: 'Performance monitoring test completed',
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'configured' : 'missing'
        });
        
      default:
        return NextResponse.json({ 
          success: true, 
          message: 'Sentry configuration test',
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'configured' : 'missing',
          availableTests: ['error', 'message', 'performance']
        });
    }
  } catch (error) {
    console.error('Sentry test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test error occurred (this is expected for error test)',
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'configured' : 'missing'
      }, 
      { status: 500 }
    );
  }
}