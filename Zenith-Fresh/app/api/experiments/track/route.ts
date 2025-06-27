/**
 * Experiment Event Tracking API
 * Track events for A/B testing experiments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';
import { ExperimentService } from '../../../../lib/services/experiment-service';
import {
  TrackEventRequest,
  ExperimentError,
  UserContext
} from '../../../../types/ab-testing';

const experimentService = new ExperimentService(prisma);

/**
 * POST /api/experiments/track
 * Track an event for an experiment
 */
export async function POST(request: NextRequest) {
  try {
    const body: TrackEventRequest = await request.json();
    const { experimentId, allocationId, eventType, eventValue, eventData, userContext } = body;

    // Validate required fields
    if (!experimentId) {
      return NextResponse.json(
        { error: 'Experiment ID is required' },
        { status: 400 }
      );
    }

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    if (!allocationId && !userContext) {
      return NextResponse.json(
        { error: 'Either allocation ID or user context is required' },
        { status: 400 }
      );
    }

    // Enhance user context with session data if available
    const session = await getServerSession(authOptions);
    const enhancedUserContext: UserContext | undefined = userContext ? {
      ...userContext,
      userId: userContext.userId || session?.user?.id,
      userAgent: userContext.userAgent || request.headers.get('user-agent') || undefined,
      ipAddress: userContext.ipAddress || getClientIP(request),
      platform: userContext.platform || 'web',
      customProperties: {
        ...userContext.customProperties,
        page: userContext.customProperties?.page || request.headers.get('referer')
      }
    } : undefined;

    // Track the event
    await experimentService.trackEvent({
      experimentId,
      allocationId,
      eventType,
      eventValue,
      eventData,
      userContext: enhancedUserContext
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking experiment event:', error);

    if (error instanceof ExperimentError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          details: error.details
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/experiments/track?experimentId=[id]&eventType=[type]
 * Get event statistics for an experiment
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get('experimentId');
    const eventType = searchParams.get('eventType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!experimentId) {
      return NextResponse.json(
        { error: 'Experiment ID is required' },
        { status: 400 }
      );
    }

    // Verify user owns the experiment
    const experiment = await prisma.experiment.findUnique({
      where: { 
        id: experimentId,
        createdBy: session.user.id
      }
    });

    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    // Build query filters
    const where: any = {
      experimentId
    };

    if (eventType) {
      where.eventType = eventType;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    // Get event statistics
    const [events, eventCounts, variantStats] = await Promise.all([
      // Recent events
      prisma.experimentEvent.findMany({
        where,
        include: {
          variant: {
            select: { name: true, isControl: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 100
      }),

      // Event type counts
      prisma.experimentEvent.groupBy({
        by: ['eventType'],
        where: { experimentId },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      }),

      // Variant-specific stats
      prisma.experimentEvent.groupBy({
        by: ['variantId', 'eventType'],
        where: { experimentId },
        _count: {
          id: true
        },
        _sum: {
          eventValue: true
        },
        _avg: {
          eventValue: true
        }
      })
    ]);

    // Get variant names
    const variants = await prisma.experimentVariant.findMany({
      where: { experimentId },
      select: { id: true, name: true, isControl: true }
    });

    const variantMap = new Map(variants.map(v => [v.id, v]));

    // Format variant statistics
    const formattedVariantStats = variantStats.map(stat => ({
      variantId: stat.variantId,
      variantName: variantMap.get(stat.variantId)?.name || 'Unknown',
      isControl: variantMap.get(stat.variantId)?.isControl || false,
      eventType: stat.eventType,
      count: stat._count.id,
      totalValue: stat._sum.eventValue || 0,
      averageValue: stat._avg.eventValue || 0
    }));

    // Calculate daily event counts for charting
    const dailyEvents = await prisma.experimentEvent.groupBy({
      by: ['eventType'],
      where: {
        experimentId,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _count: {
        id: true
      }
    });

    // Calculate event funnel if multiple event types
    const eventTypesInOrder = ['page_view', 'click', 'signup', 'conversion', 'purchase'];
    const funnelData = [];

    for (const eventType of eventTypesInOrder) {
      const count = eventCounts.find(ec => ec.eventType === eventType)?._count.id || 0;
      if (count > 0) {
        funnelData.push({
          eventType,
          count,
          percentage: funnelData.length === 0 ? 100 : (count / funnelData[0].count) * 100
        });
      }
    }

    return NextResponse.json({
      events: events.map(event => ({
        id: event.id,
        eventType: event.eventType,
        eventValue: event.eventValue,
        timestamp: event.timestamp,
        variantName: event.variant.name,
        isControl: event.variant.isControl,
        userId: event.userId,
        page: event.page
      })),
      statistics: {
        totalEvents: events.length,
        eventTypes: eventCounts.map(ec => ({
          eventType: ec.eventType,
          count: ec._count.id
        })),
        variantStats: formattedVariantStats,
        dailyEvents,
        funnel: funnelData
      }
    });

  } catch (error) {
    console.error('Error fetching event statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event statistics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/experiments/track/batch
 * Track multiple events in a single request (for better performance)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { events } = body;

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Events array is required' },
        { status: 400 }
      );
    }

    if (events.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 events per batch' },
        { status: 400 }
      );
    }

    // Enhance each event with session data
    const session = await getServerSession(authOptions);
    const enhancedEvents = events.map((event: TrackEventRequest) => ({
      ...event,
      userContext: event.userContext ? {
        ...event.userContext,
        userId: event.userContext.userId || session?.user?.id,
        userAgent: event.userContext.userAgent || request.headers.get('user-agent') || undefined,
        ipAddress: event.userContext.ipAddress || getClientIP(request),
        platform: event.userContext.platform || 'web'
      } : undefined
    }));

    // Track all events
    const results = await Promise.allSettled(
      enhancedEvents.map(event => experimentService.trackEvent(event))
    );

    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      processed: events.length,
      successful,
      failed,
      errors: results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => r.reason.message)
    });

  } catch (error) {
    console.error('Error tracking batch events:', error);
    return NextResponse.json(
      { error: 'Failed to track batch events' },
      { status: 500 }
    );
  }
}

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (clientIP) {
    return clientIP;
  }
  
  return request.ip || 'unknown';
}