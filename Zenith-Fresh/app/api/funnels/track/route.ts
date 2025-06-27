import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';
import { FunnelService } from '../../../../lib/services/funnel-service';
import { 
  TrackFunnelEventRequest,
  TrackFunnelEventResponse
} from '../../../../types/funnel';

const funnelService = new FunnelService(prisma);

// POST /api/funnels/track - Track funnel event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TrackFunnelEventRequest;

    // Validate required fields
    if (!body.funnelId || !body.stepId || !body.sessionId || !body.eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: funnelId, stepId, sessionId, eventType' },
        { status: 400 }
      );
    }

    // Get session for userId if available (but don't require authentication for tracking)
    let userId = body.userId;
    if (!userId) {
      try {
        const session = await getServerSession(authOptions);
        userId = session?.user?.id;
      } catch {
        // Continue without userId if session check fails
      }
    }

    // Verify funnel and step exist
    const funnel = await funnelService.getFunnel(body.funnelId);
    if (!funnel) {
      return NextResponse.json(
        { error: 'Funnel not found' },
        { status: 404 }
      );
    }

    const step = funnel.steps.find(s => s.id === body.stepId);
    if (!step) {
      return NextResponse.json(
        { error: 'Funnel step not found' },
        { status: 404 }
      );
    }

    // Validate event type matches step configuration
    if (step.eventType !== body.eventType) {
      return NextResponse.json(
        { error: `Event type ${body.eventType} does not match step configuration ${step.eventType}` },
        { status: 400 }
      );
    }

    // Get client IP and user agent for enrichment
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || request.headers.get('referrer');

    // Create enriched event request
    const enrichedRequest: TrackFunnelEventRequest = {
      ...body,
      userId,
      properties: {
        ...body.properties,
        ipAddress: clientIP,
        userAgent,
        referrer,
        timestamp: new Date().toISOString()
      }
    };

    // Track the event
    const eventId = await funnelService.trackEvent(enrichedRequest);

    // Get next suggested step
    let nextSuggestedStep: string | undefined;
    const nextStep = funnel.steps.find(s => s.stepNumber === step.stepNumber + 1);
    if (nextStep) {
      nextSuggestedStep = nextStep.id;
    }

    // Prepare response
    const response: TrackFunnelEventResponse = {
      success: true,
      eventId,
      nextSuggestedStep,
      message: 'Event tracked successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to track funnel event:', error);
    
    const response: TrackFunnelEventResponse = {
      success: false,
      eventId: '',
      message: 'Failed to track event'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// GET /api/funnels/track - Get tracking status/health check
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get('funnelId');
    const sessionId = searchParams.get('sessionId');

    if (!funnelId || !sessionId) {
      return NextResponse.json(
        { error: 'funnelId and sessionId are required' },
        { status: 400 }
      );
    }

    // Get recent events for this session
    const recentEvents = await prisma.funnelEvent.findMany({
      where: {
        funnelId,
        sessionId,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: {
        step: {
          select: {
            stepNumber: true,
            name: true,
            eventType: true
          }
        }
      }
    });

    // Calculate session progress
    const funnel = await funnelService.getFunnel(funnelId);
    if (!funnel) {
      return NextResponse.json(
        { error: 'Funnel not found' },
        { status: 404 }
      );
    }

    const completedSteps = new Set(recentEvents.map(e => e.stepId));
    const currentStep = Math.max(...recentEvents.map(e => e.step.stepNumber), 0);
    const progressPercentage = (completedSteps.size / funnel.steps.length) * 100;

    return NextResponse.json({
      success: true,
      tracking: {
        funnelId,
        sessionId,
        eventCount: recentEvents.length,
        completedSteps: completedSteps.size,
        totalSteps: funnel.steps.length,
        currentStep,
        progressPercentage: Math.round(progressPercentage),
        lastEventTime: recentEvents[0]?.timestamp,
        isActive: recentEvents.length > 0
      },
      recentEvents: recentEvents.map(event => ({
        id: event.id,
        stepName: event.step.name,
        stepNumber: event.step.stepNumber,
        eventType: event.eventType,
        timestamp: event.timestamp,
        revenueValue: event.revenueValue
      }))
    });

  } catch (error) {
    console.error('Failed to get tracking status:', error);
    return NextResponse.json(
      { error: 'Failed to get tracking status' },
      { status: 500 }
    );
  }
}