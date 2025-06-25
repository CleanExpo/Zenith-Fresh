import { NextRequest, NextResponse } from 'next/server';
import { exportSecurityEvents } from '@/lib/security/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Parse filters from request body
    const filters = {
      severity: body.severity !== 'ALL' ? body.severity : undefined,
      type: body.type !== 'ALL' ? body.type : undefined,
      timeRange: body.timeRange || '24h',
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
    
    // Export security events as CSV
    const csvData = await exportSecurityEvents({
      ...filters,
      startDate,
      endDate: now,
    });
    
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="security-events-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting security events:', error);
    return NextResponse.json(
      { error: 'Failed to export security events' },
      { status: 500 }
    );
  }
}