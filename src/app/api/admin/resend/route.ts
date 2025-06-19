import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createResendApiKey, listResendApiKeys } from '@/lib/email';
import { captureException } from '@/lib/sentry';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you might want to add admin role check here)
    // For now, we'll allow any authenticated user to list API keys

    const result = await listResendApiKeys();
    
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Failed to list API keys',
        details: result.error 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      apiKeys: result.apiKeys,
    });
  } catch (error) {
    console.error('List Resend API keys error:', error);
    captureException(error as Error, {
      context: 'resend-api-keys-list',
      extra: {
        userEmail: (await getServerSession(authOptions))?.user?.email,
      }
    });
    
    return NextResponse.json({ 
      error: 'Failed to list API keys',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 });
    }

    // Check if user is admin (you might want to add admin role check here)
    // For now, we'll allow any authenticated user to create API keys

    const result = await createResendApiKey(name);
    
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Failed to create API key',
        details: result.error 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      apiKey: result.apiKey,
      message: 'API key created successfully'
    });
  } catch (error) {
    console.error('Create Resend API key error:', error);
    captureException(error as Error, {
      context: 'resend-api-key-creation',
      extra: {
        userEmail: (await getServerSession(authOptions))?.user?.email,
      }
    });
    
    return NextResponse.json({ 
      error: 'Failed to create API key',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}