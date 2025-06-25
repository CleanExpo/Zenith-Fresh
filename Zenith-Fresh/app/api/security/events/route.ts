import { NextRequest, NextResponse } from 'next/server';
import { getSecurityEvents } from '@/lib/security/audit-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const severityParam = searchParams.get('severity');
    const typeParam = searchParams.get('type');
    
    const filters = {
      severity: severityParam && severityParam !== 'ALL' ? severityParam : undefined,
      type: typeParam && typeParam !== 'ALL' ? typeParam : undefined,
      timeRange: searchParams.get('timeRange') || '24h',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };
    
    // Convert time range to dates
    const now = new Date();
    let startDate: Date;
    
    switch (filters.timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    // Get security events
    const events = await getSecurityEvents({
      ...filters,
      startDate,
      endDate: now,
    });
    
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error getting security events:', error);
    return NextResponse.json(
      { error: 'Failed to get security events' },
      { status: 500 }
    );
  }
}