// src/app/api/analysis/website/scheduled/route.ts
// Scheduled Website Scans API Implementation

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

// Request validation schema for creating/updating scheduled scans
const scheduledScanSchema = z.object({
  name: z.string().min(1, 'Scan name is required').max(100, 'Name must be less than 100 characters'),
  url: z.string().url('Please provide a valid URL'),
  frequency: z.enum(['daily', 'weekly', 'monthly'], {
    errorMap: () => ({ message: 'Frequency must be daily, weekly, or monthly' })
  }),
  dayOfWeek: z.number().min(0).max(6).optional(), // 0 = Sunday, 6 = Saturday
  dayOfMonth: z.number().min(1).max(31).optional(), // 1-31
  timeOfDay: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  timezone: z.string().default('UTC'),
  emailNotifications: z.boolean().default(true),
  notificationEmails: z.array(z.string().email()).optional(),
  scanOptions: z.object({
    includePerformance: z.boolean().default(true),
    includeSEO: z.boolean().default(true),
    includeSecurity: z.boolean().default(true),
    includeAccessibility: z.boolean().default(true)
  }).optional()
});

// Helper function to calculate next run time
function calculateNextRun(frequency: string, dayOfWeek?: number, dayOfMonth?: number, timeOfDay?: string, timezone?: string): Date {
  const now = new Date();
  const [hours, minutes] = timeOfDay ? timeOfDay.split(':').map(Number) : [9, 0]; // Default to 9:00 AM
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);
  
  switch (frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
      
    case 'weekly':
      const targetDay = dayOfWeek ?? 1; // Default to Monday
      const currentDay = nextRun.getDay();
      let daysUntilNext = (targetDay - currentDay + 7) % 7;
      
      if (daysUntilNext === 0 && nextRun <= now) {
        daysUntilNext = 7; // Next week
      }
      
      nextRun.setDate(nextRun.getDate() + daysUntilNext);
      break;
      
    case 'monthly':
      const targetDate = dayOfMonth ?? 1; // Default to 1st of month
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
 * POST /api/analysis/website/scheduled
 * Create a new scheduled scan
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = scheduledScanSchema.parse(body);
    
    // Validate frequency-specific fields
    if (validatedData.frequency === 'weekly' && validatedData.dayOfWeek === undefined) {
      return NextResponse.json(
        { error: 'dayOfWeek is required for weekly scans (0-6, where 0=Sunday)' },
        { status: 400 }
      );
    }
    
    if (validatedData.frequency === 'monthly' && validatedData.dayOfMonth === undefined) {
      return NextResponse.json(
        { error: 'dayOfMonth is required for monthly scans (1-31)' },
        { status: 400 }
      );
    }

    // Calculate next run time
    const nextRunAt = calculateNextRun(
      validatedData.frequency,
      validatedData.dayOfWeek,
      validatedData.dayOfMonth,
      validatedData.timeOfDay,
      validatedData.timezone
    );

    // Set notification emails (default to user's email if none provided)
    const notificationEmails = validatedData.notificationEmails?.length 
      ? validatedData.notificationEmails 
      : [session.user.email!];

    // Create scheduled scan in database
    const scheduledScan = await prisma.scheduledScan.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        url: validatedData.url,
        frequency: validatedData.frequency,
        dayOfWeek: validatedData.dayOfWeek,
        dayOfMonth: validatedData.dayOfMonth,
        timeOfDay: validatedData.timeOfDay,
        timezone: validatedData.timezone,
        emailNotifications: validatedData.emailNotifications,
        notificationEmails,
        scanOptions: validatedData.scanOptions || {},
        nextRunAt,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: scheduledScan
    });

  } catch (error) {
    console.error('Scheduled scan creation error:', error);
    
    // Capture error in Sentry
    Sentry.captureException(error as Error, {
      extra: {
        context: 'scheduled-scan-creation',
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
    
    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Failed to create scheduled scan',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analysis/website/scheduled
 * Get all scheduled scans for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);
    const isActive = searchParams.get('isActive');
    
    // Build where clause
    const where: any = {
      userId: session.user.id
    };
    
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    // Get scheduled scans with pagination
    const [scheduledScans, total] = await Promise.all([
      prisma.scheduledScan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: {
              analyses: true
            }
          }
        }
      }),
      prisma.scheduledScan.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        scheduledScans,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });

  } catch (error) {
    console.error('Scheduled scans fetch error:', error);
    
    Sentry.captureException(error as Error, {
      extra: {
        context: 'scheduled-scans-fetch',
        userId: (await auth())?.user?.id,
      },
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve scheduled scans',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}