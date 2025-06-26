import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * API endpoint for batch error reporting
 */
export async function POST(request: NextRequest) {
  try {
    const { errors } = await request.json();
    
    if (!Array.isArray(errors) || errors.length === 0) {
      return NextResponse.json(
        { error: 'Invalid errors array' },
        { status: 400 }
      );
    }

    // Get user session for context
    const session = await getServerSession(authOptions);
    
    // Process errors in batch
    const auditLogEntries = errors.map(errorData => ({
      action: 'ERROR_OCCURRED',
      details: {
        errorId: errorData.errorId,
        name: errorData.name,
        message: errorData.message,
        stack: errorData.stack,
        componentStack: errorData.componentStack,
        level: errorData.level,
        componentName: errorData.componentName,
        url: errorData.url,
        userAgent: errorData.userAgent,
        buildVersion: errorData.buildVersion,
        environment: errorData.environment,
        additionalContext: errorData.additionalContext
      },
      userId: session?.user?.id || null,
      timestamp: new Date(errorData.timestamp)
    }));

    // Batch insert errors
    await prisma.auditLog.createMany({
      data: auditLogEntries,
      skipDuplicates: true
    });

    // Check for critical error patterns
    const criticalErrors = errors.filter(error => 
      error.level === 'page' || 
      (error.level === 'section' && error.componentName === 'Authentication')
    );

    if (criticalErrors.length > 0) {
      console.error(`BATCH CRITICAL ERRORS: ${criticalErrors.length} critical errors reported`, {
        errors: criticalErrors.map(e => ({
          errorId: e.errorId,
          component: e.componentName,
          message: e.message
        }))
      });

      // Alert for multiple critical errors
      if (process.env.NODE_ENV === 'production' && criticalErrors.length >= 3) {
        await handleCriticalErrorPattern(criticalErrors, session?.user);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: errors.length,
      criticalErrors: criticalErrors.length
    });

  } catch (error) {
    console.error('Failed to process batch error report:', error);
    
    return NextResponse.json(
      { error: 'Failed to process batch error report' },
      { status: 500 }
    );
  }
}

/**
 * Handle critical error patterns that might indicate system issues
 */
async function handleCriticalErrorPattern(errors: any[], user?: any) {
  try {
    const errorSummary = errors.reduce((acc, error) => {
      const key = `${error.componentName || 'Unknown'}: ${error.message}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topErrors = Object.entries(errorSummary)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5);

    // Send alert
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: `🔥 Critical Error Pattern Detected`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Critical Error Pattern Alert*\n\n*Count:* ${errors.length} critical errors in batch\n*User:* ${user?.email || 'Anonymous'}\n*Time:* ${new Date().toISOString()}\n\n*Top Errors:*\n${topErrors.map(([error, count]) => `• ${error} (${count}x)`).join('\n')}`
              }
            }
          ]
        })
      });
    }

  } catch (alertError) {
    console.error('Failed to send critical error pattern alert:', alertError);
  }
}

/**
 * GET endpoint for real-time error monitoring
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

    const url = new URL(request.url);
    const since = url.searchParams.get('since');
    const level = url.searchParams.get('level');
    const component = url.searchParams.get('component');

    // Build query filters
    const where: any = {
      action: 'ERROR_OCCURRED'
    };

    if (since) {
      where.timestamp = {
        gte: new Date(since)
      };
    } else {
      // Default to last hour
      where.timestamp = {
        gte: new Date(Date.now() - 60 * 60 * 1000)
      };
    }

    if (level) {
      where.details = {
        path: ['level'],
        equals: level
      };
    }

    if (component) {
      where.details = {
        path: ['componentName'],
        equals: component
      };
    }

    // Get recent errors
    const errors = await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: 100,
      select: {
        id: true,
        createdAt: true,
        details: true,
        userId: true
      }
    });

    // Format response
    const formattedErrors = errors.map(error => {
      const details = error.details as any;
      return {
        id: error.id,
        timestamp: error.createdAt,
        errorId: details?.errorId,
        level: details?.level,
        component: details?.componentName,
        message: details?.message,
        url: details?.url,
        userId: error.userId
      };
    });

    return NextResponse.json({
      errors: formattedErrors,
      count: errors.length,
      since: since || new Date(Date.now() - 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Failed to get real-time errors:', error);
    
    return NextResponse.json(
      { error: 'Failed to get real-time errors' },
      { status: 500 }
    );
  }
}