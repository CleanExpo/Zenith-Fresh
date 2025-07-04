// src/app/api/competitive/intelligence/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { competitiveAlertsEngine } from '@/lib/services/competitive-alerts-engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get active alerts for a team
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = request.headers.get('x-team-id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeRead = searchParams.get('includeRead') === 'true';
    const severity = searchParams.get('severity');
    const alertType = searchParams.get('type');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    // Build where clause
    const where: any = { teamId };
    if (!includeRead) {
      where.isRead = false;
    }
    if (severity) {
      where.severity = severity.toUpperCase();
    }
    if (alertType) {
      where.alertType = alertType.toUpperCase();
    }

    // Get alerts with analysis info
    const alerts = await prisma.competitiveAlert.findMany({
      where,
      include: {
        analysis: {
          select: {
            targetDomain: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    // Get alert summary stats
    const alertStats = await prisma.competitiveAlert.groupBy({
      by: ['severity', 'alertType'],
      where: { teamId, isRead: false },
      _count: true
    });

    const summary = {
      total: alerts.length,
      unread: alerts.filter(a => !a.isRead).length,
      critical: alertStats.filter(s => s.severity === 'CRITICAL').reduce((sum, s) => sum + s._count, 0),
      high: alertStats.filter(s => s.severity === 'HIGH').reduce((sum, s) => sum + s._count, 0),
      medium: alertStats.filter(s => s.severity === 'MEDIUM').reduce((sum, s) => sum + s._count, 0),
      byType: alertStats.reduce((acc, stat) => {
        acc[stat.alertType.toLowerCase()] = (acc[stat.alertType.toLowerCase()] || 0) + stat._count;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      success: true,
      data: {
        alerts: alerts.map(alert => ({
          id: alert.id,
          type: alert.alertType.toLowerCase(),
          severity: alert.severity.toLowerCase(),
          title: alert.title,
          description: alert.description,
          data: alert.data,
          targetDomain: alert.analysis?.targetDomain,
          isRead: alert.isRead,
          isActionable: alert.isActionable,
          createdAt: alert.createdAt,
          readAt: alert.readAt
        })),
        summary
      }
    });

  } catch (error) {
    console.error('Get competitive alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve alerts' },
      { status: 500 }
    );
  }
}

// Setup competitive monitoring
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      targetDomain, 
      competitors, 
      frequency = 'weekly',
      alertThreshold = 10,
      trackKeywords = true,
      trackBacklinks = true,
      trackContent = true,
      trackTraffic = false
    } = body;

    const teamId = request.headers.get('x-team-id');

    if (!teamId || !targetDomain || !competitors || !Array.isArray(competitors)) {
      return NextResponse.json(
        { error: 'Team ID, target domain, and competitors array are required' },
        { status: 400 }
      );
    }

    // Check team access
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { billing: true }
    });

    if (!team || !['pro', 'enterprise'].includes(team.subscriptionPlan || '')) {
      return NextResponse.json(
        { error: 'Upgrade required for competitive monitoring' },
        { status: 403 }
      );
    }

    // Setup monitoring
    const trackingId = await competitiveAlertsEngine.setupMonitoring({
      teamId,
      targetDomain,
      competitors,
      frequency: frequency as 'daily' | 'weekly' | 'monthly',
      alertThreshold,
      trackKeywords,
      trackBacklinks,
      trackContent,
      trackTraffic
    });

    // Track API usage
    await prisma.analyticsEvent.create({
      data: {
        event: 'competitive_monitoring_setup',
        userId: session.user.id,
        sessionId: session.user.id,
        properties: {
          targetDomain,
          competitors: competitors.length,
          frequency,
          trackingId,
          teamId
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        trackingId,
        targetDomain,
        competitors,
        frequency,
        alertThreshold,
        monitoring: {
          keywords: trackKeywords,
          backlinks: trackBacklinks,
          content: trackContent,
          traffic: trackTraffic
        },
        message: 'Competitive monitoring setup successfully'
      }
    });

  } catch (error) {
    console.error('Setup competitive monitoring error:', error);
    return NextResponse.json(
      { 
        error: 'Setup failed',
        message: 'Unable to setup competitive monitoring. Please try again.'
      },
      { status: 500 }
    );
  }
}

// Mark alert as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alertId, action = 'mark_read' } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    if (action === 'mark_read') {
      await competitiveAlertsEngine.markAlertAsRead(alertId);
      
      return NextResponse.json({
        success: true,
        data: {
          alertId,
          action: 'marked_as_read',
          timestamp: new Date().toISOString()
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Update competitive alert error:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}

// Disable monitoring
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetDomain = searchParams.get('domain');
    const teamId = request.headers.get('x-team-id');

    if (!teamId || !targetDomain) {
      return NextResponse.json(
        { error: 'Team ID and target domain are required' },
        { status: 400 }
      );
    }

    // Disable monitoring
    await competitiveAlertsEngine.disableMonitoring(teamId, targetDomain);

    // Track API usage
    await prisma.analyticsEvent.create({
      data: {
        event: 'competitive_monitoring_disabled',
        userId: session.user.id,
        sessionId: session.user.id,
        properties: {
          targetDomain,
          teamId
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        targetDomain,
        action: 'monitoring_disabled',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Disable competitive monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to disable monitoring' },
      { status: 500 }
    );
  }
}