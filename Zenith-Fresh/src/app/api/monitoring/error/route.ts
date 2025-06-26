import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * API endpoint for error reporting from error boundaries
 */
export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    
    // Get user session for context
    const session = await getServerSession(authOptions);
    
    // Validate required fields
    const {
      errorId,
      name,
      message,
      stack,
      componentStack,
      timestamp,
      level,
      componentName,
      url,
      userAgent
    } = errorData;

    if (!errorId || !message) {
      return NextResponse.json(
        { error: 'Missing required error fields' },
        { status: 400 }
      );
    }

    // Store error in database
    await prisma.auditLog.create({
      data: {
        action: 'ERROR_OCCURRED',
        details: {
          errorId,
          name,
          message,
          stack,
          componentStack,
          level,
          componentName,
          url,
          userAgent,
          buildVersion: errorData.buildVersion,
          environment: errorData.environment,
          additionalContext: errorData.additionalContext
        },
        userId: session?.user?.id || null,
        createdAt: new Date(timestamp)
      }
    });

    // Log critical errors immediately
    if (level === 'page' || level === 'section') {
      console.error(`CRITICAL ERROR [${level}]:`, {
        errorId,
        name,
        message,
        componentName,
        userId: session?.user?.id,
        url
      });
    }

    // Alert mechanisms for production
    if (process.env.NODE_ENV === 'production') {
      await handleProductionAlert(errorData, session?.user);
    }

    return NextResponse.json({ 
      success: true, 
      errorId 
    });

  } catch (error) {
    console.error('Failed to process error report:', error);
    
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

/**
 * Handle production alerts for critical errors
 */
async function handleProductionAlert(errorData: any, user?: any) {
  const { level, name, message, componentName, url } = errorData;
  
  // Only alert for critical errors
  if (level !== 'page' && level !== 'section') {
    return;
  }

  try {
    // Send to monitoring service (Slack, PagerDuty, etc.)
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: `🚨 Production Error Alert`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Production Error Detected*\n\n*Level:* ${level}\n*Component:* ${componentName || 'Unknown'}\n*Error:* ${name}\n*Message:* ${message}\n*URL:* ${url}\n*User:* ${user?.email || 'Anonymous'}\n*Time:* ${new Date().toISOString()}`
              }
            }
          ]
        })
      });
    }

    // Email alerts for critical errors
    if (process.env.ALERT_EMAIL && level === 'page') {
      // Implementation would depend on email service
      console.log('Critical error email alert would be sent');
    }

  } catch (alertError) {
    console.error('Failed to send production alert:', alertError);
  }
}

/**
 * GET endpoint for error statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    // In a real implementation, you'd check user roles
    const isAdmin = session.user.email === 'zenithfresh25@gmail.com';
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '24h';
    
    // Calculate time range
    const now = new Date();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const timeRange = timeRanges[timeframe as keyof typeof timeRanges] || timeRanges['24h'];
    const startTime = new Date(now.getTime() - timeRange);

    // Get error statistics
    const errors = await prisma.auditLog.findMany({
      where: {
        action: 'ERROR_OCCURRED',
        createdAt: {
          gte: startTime
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1000 // Limit for performance
    });

    // Process statistics
    const stats = {
      totalErrors: errors.length,
      errorsByLevel: {} as Record<string, number>,
      errorsByComponent: {} as Record<string, number>,
      errorsByHour: {} as Record<string, number>,
      topErrors: {} as Record<string, number>,
      recentErrors: errors.slice(0, 10).map(error => ({
        id: error.id,
        timestamp: error.createdAt,
        level: (error.details as any)?.level,
        component: (error.details as any)?.componentName,
        message: (error.details as any)?.message,
        userId: error.userId
      }))
    };

    // Aggregate data
    errors.forEach(error => {
      const details = error.details as any;
      const level = details?.level || 'unknown';
      const component = details?.componentName || 'unknown';
      const message = details?.message || 'unknown';
      const hour = error.createdAt.toISOString().substring(0, 13); // YYYY-MM-DDTHH

      stats.errorsByLevel[level] = (stats.errorsByLevel[level] || 0) + 1;
      stats.errorsByComponent[component] = (stats.errorsByComponent[component] || 0) + 1;
      stats.errorsByHour[hour] = (stats.errorsByHour[hour] || 0) + 1;
      stats.topErrors[message] = (stats.topErrors[message] || 0) + 1;
    });

    // Sort top errors
    const sortedTopErrors = Object.entries(stats.topErrors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    return NextResponse.json({
      timeframe,
      stats: {
        ...stats,
        topErrors: sortedTopErrors
      }
    });

  } catch (error) {
    console.error('Failed to get error statistics:', error);
    
    return NextResponse.json(
      { error: 'Failed to get error statistics' },
      { status: 500 }
    );
  }
}