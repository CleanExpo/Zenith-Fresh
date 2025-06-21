import { NextResponse } from 'next/server';
import { getGmbBusinessInfo } from '@/lib/services/gmb';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const businessInfo = await getGmbBusinessInfo();
    
    if (businessInfo.error) {
      return NextResponse.json(
        { error: businessInfo.error, cached: businessInfo.cached },
        { status: 400 }
      );
    }

    return NextResponse.json({
      businessInfo,
      cached: businessInfo.cached || false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('GMB Business API Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch business info',
        businessInfo: null,
        cached: false 
      },
      { status: 500 }
    );
  }
}
