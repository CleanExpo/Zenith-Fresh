import { NextRequest, NextResponse } from 'next/server';
import { getGmbBusinessInfo } from '@/lib/services/gmb';

/**
 * Handles GET requests to retrieve Google My Business information.
 *
 * Responds with business information, a cached flag, and a timestamp on success. Returns an error message and appropriate HTTP status code if retrieval fails or an exception occurs.
 */
export async function GET(request: NextRequest) {
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
