// src/app/api/analysis/website/scheduled/[id]/route.ts
// Individual Scheduled Scan Management API

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

// Helper function to calculate next run time
function calculateNextRun(frequency: string, dayOfWeek?: number, dayOfMonth?: number, timeOfDay?: string, timezone?: string): Date {
  const now = new Date();
  const [hours, minutes] = timeOfDay ? timeOfDay.split(':').map(Number) : [9, 0];
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);
  
  switch (frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
      
    case 'weekly':
      const targetDay = dayOfWeek ?? 1;
      const currentDay = nextRun.getDay();
      let daysUntilNext = (targetDay - currentDay + 7) % 7;
      
      if (daysUntilNext === 0 && nextRun <= now) {
        daysUntilNext = 7;
      }
      
      nextRun.setDate(nextRun.getDate() + daysUntilNext);
      break;
      
    case 'monthly':
      const targetDate = dayOfMonth ?? 1;
      nextRun.setDate(targetDate);
      
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(targetDate);
      }
      break;
  }
  
  return nextRun;
}

/**
 * GET /api/analysis/website/scheduled/[id]
 * Get a specific scheduled scan by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get scheduled scan with recent analyses
    const scheduledScan = await prisma.scheduledScan.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 analyses
          select: {
            id: true,
            analysisId: true,
            overallScore: true,
            createdAt: true,
            url: true
          }
        },
        _count: {
          select: {
            analyses: true
          }
        }
      }
    });

    if (!scheduledScan) {
      return NextResponse.json(
        { error: 'Scheduled scan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: scheduledScan
    });

  } catch (error) {
    console.error('Scheduled scan fetch error:', error);
    
    Sentry.captureException(error as Error, {
      extra: {
        context: 'scheduled-scan-fetch',
        scanId: params.id,
        userId: (await auth())?.user?.id,
      },
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve scheduled scan',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/analysis/website/scheduled/[id]
 * Update a scheduled scan
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Verify ownership
    const existingScan = await prisma.scheduledScan.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingScan) {
      return NextResponse.json(
        { error: 'Scheduled scan not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    // Create update schema with all fields optional
    const updateSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      url: z.string().url().optional(),
      frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
      dayOfWeek: z.number().min(0).max(6).optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
      timeOfDay: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      timezone: z.string().optional(),
      isActive: z.boolean().optional(),
      emailNotifications: z.boolean().optional(),
      notificationEmails: z.array(z.string().email()).optional(),
      scanOptions: z.object({
        includePerformance: z.boolean().default(true),
        includeSEO: z.boolean().default(true),
        includeSecurity: z.boolean().default(true),
        includeAccessibility: z.boolean().default(true)
      }).optional()
    });

    const validatedData = updateSchema.parse(body);

    // Prepare update data
    const updateData: any = { ...validatedData };

    // Recalculate next run time if schedule-related fields changed
    const scheduleChanged = validatedData.frequency || 
                          validatedData.dayOfWeek !== undefined || 
                          validatedData.dayOfMonth !== undefined || 
                          validatedData.timeOfDay || 
                          validatedData.timezone;

    if (scheduleChanged) {
      const frequency = validatedData.frequency || existingScan.frequency;
      const dayOfWeek = validatedData.dayOfWeek !== undefined ? validatedData.dayOfWeek : existingScan.dayOfWeek;
      const dayOfMonth = validatedData.dayOfMonth !== undefined ? validatedData.dayOfMonth : existingScan.dayOfMonth;
      const timeOfDay = validatedData.timeOfDay || existingScan.timeOfDay;
      const timezone = validatedData.timezone || existingScan.timezone;

      // Validate frequency-specific requirements
      if (frequency === 'weekly' && dayOfWeek === null) {
        return NextResponse.json(
          { error: 'dayOfWeek is required for weekly scans' },
          { status: 400 }
        );
      }
      
      if (frequency === 'monthly' && dayOfMonth === null) {
        return NextResponse.json(
          { error: 'dayOfMonth is required for monthly scans' },
          { status: 400 }
        );
      }

      updateData.nextRunAt = calculateNextRun(frequency, dayOfWeek, dayOfMonth, timeOfDay, timezone);
    }

    // Update the scheduled scan
    const updatedScan = await prisma.scheduledScan.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            analyses: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedScan
    });

  } catch (error) {
    console.error('Scheduled scan update error:', error);
    
    Sentry.captureException(error as Error, {
      extra: {
        context: 'scheduled-scan-update',
        scanId: params.id,
        userId: (await auth())?.user?.id,
      },
    });
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update scheduled scan',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analysis/website/scheduled/[id]
 * Delete a scheduled scan
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Verify ownership and delete
    const deletedScan = await prisma.scheduledScan.deleteMany({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (deletedScan.count === 0) {
      return NextResponse.json(
        { error: 'Scheduled scan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Scheduled scan deleted successfully'
    });

  } catch (error) {
    console.error('Scheduled scan deletion error:', error);
    
    Sentry.captureException(error as Error, {
      extra: {
        context: 'scheduled-scan-deletion',
        scanId: params.id,
        userId: (await auth())?.user?.id,
      },
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to delete scheduled scan',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}