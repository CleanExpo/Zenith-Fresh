import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const analyticsEventSchema = z.object({
  event: z.string(),
  userId: z.string().optional(),
  sessionId: z.string(),
  timestamp: z.string().transform(str => new Date(str)),
  properties: z.record(z.any()),
  value: z.number().optional(),
  currency: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = analyticsEventSchema.parse(body);

    // Store analytics event in database
    const analyticsEvent = await prisma.analyticsEvent.create({
      data: {
        event: validatedData.event,
        userId: validatedData.userId,
        sessionId: validatedData.sessionId,
        timestamp: validatedData.timestamp,
        properties: validatedData.properties,
        value: validatedData.value,
        currency: validatedData.currency || 'USD',
      },
    });

    // Also log as activity if user is present
    if (validatedData.userId) {
      await prisma.activityLog.create({
        data: {
          action: validatedData.event,
          details: JSON.stringify(validatedData.properties),
          userId: validatedData.userId,
        },
      });
    }

    return NextResponse.json(
      { 
        message: 'Analytics event recorded',
        eventId: analyticsEvent.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Analytics event error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to record analytics event' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const event = searchParams.get('event');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: any = {};
    
    if (userId) where.userId = userId;
    if (event) where.event = event;
    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const events = await prisma.analyticsEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    // Calculate some basic metrics
    const totalEvents = events.length;
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
    const uniqueSessions = new Set(events.map(e => e.sessionId)).size;
    const totalValue = events.reduce((sum, e) => sum + (e.value || 0), 0);

    const metrics = {
      totalEvents,
      uniqueUsers,
      uniqueSessions,
      totalValue,
      averageValuePerEvent: totalEvents > 0 ? totalValue / totalEvents : 0,
    };

    return NextResponse.json({
      events,
      metrics,
      count: totalEvents
    });

  } catch (error) {
    console.error('Analytics query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics events' },
      { status: 500 }
    );
  }
}