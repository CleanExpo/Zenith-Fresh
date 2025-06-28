import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { googleAnalytics } from '@/lib/google-analytics';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';

    let result;

    switch (type) {
      case 'realtime':
        result = await googleAnalytics.getRealtimeData();
        break;

      case 'summary':
        result = await googleAnalytics.getAnalyticsData(startDate, endDate);
        break;

      case 'acquisition':
        result = await googleAnalytics.getUserAcquisitionData(startDate, endDate);
        break;

      case 'pages':
        result = await googleAnalytics.getTopPagesData(startDate, endDate);
        break;

      case 'accounts':
        result = await googleAnalytics.getAccountSummaries();
        break;

      case 'properties':
        const accountId = searchParams.get('accountId');
        result = await googleAnalytics.listProperties(accountId || undefined);
        break;

      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({
        error: 'Failed to fetch analytics data',
        details: result.error,
      }, { status: 500 });
    }

    return NextResponse.json({
      type,
      ...result,
    });
  } catch (error) {
    console.error('Google Analytics API error:', error);
    Sentry.captureException(error as Error, {
      extra: {
        context: 'google-analytics-api',
        userEmail: (await getServerSession(authOptions))?.user?.email,
      }
    });
    
    return NextResponse.json({
      error: 'Failed to fetch analytics data',
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

    const { action, ...params } = await request.json();

    let result;

    switch (action) {
      case 'create-property':
        const { accountId, propertyName, websiteUrl } = params;
        if (!accountId || !propertyName || !websiteUrl) {
          return NextResponse.json({ 
            error: 'Missing required parameters: accountId, propertyName, websiteUrl' 
          }, { status: 400 });
        }
        result = await googleAnalytics.createProperty(accountId, propertyName, websiteUrl);
        break;

      case 'create-stream':
        const { propertyId, url } = params;
        if (!propertyId || !url) {
          return NextResponse.json({ 
            error: 'Missing required parameters: propertyId, url' 
          }, { status: 400 });
        }
        result = await googleAnalytics.createWebDataStream(propertyId, url);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({
        error: `Failed to ${action}`,
        details: result.error,
      }, { status: 500 });
    }

    return NextResponse.json({
      action,
      ...result,
    });
  } catch (error) {
    console.error('Google Analytics Admin API error:', error);
    Sentry.captureException(error as Error, {
      extra: {
        context: 'google-analytics-admin',
        userEmail: (await getServerSession(authOptions))?.user?.email,
      }
    });
    
    return NextResponse.json({
      error: 'Failed to perform admin action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}