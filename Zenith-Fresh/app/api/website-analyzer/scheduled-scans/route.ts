import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { cronScheduler } from '@/lib/scheduler/cron-scheduler';
import * as cron from 'node-cron';

const prisma = new PrismaClient();

// Predefined schedule options
const SCHEDULE_PRESETS = {
  daily: '0 9 * * *',        // Daily at 9 AM
  weekly: '0 9 * * 1',       // Weekly on Monday at 9 AM
  monthly: '0 9 1 * *',      // Monthly on 1st at 9 AM
  hourly: '0 * * * *',       // Every hour
} as const;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      projectId, 
      name, 
      schedule, 
      scanConfig = {}, 
      alertThresholds = {} 
    } = body;

    // Validate required fields
    if (!projectId || !name || !schedule) {
      return NextResponse.json(
        { error: 'Project ID, name, and schedule are required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Validate schedule (either preset or custom cron)
    let cronExpression = schedule;
    if (schedule in SCHEDULE_PRESETS) {
      cronExpression = SCHEDULE_PRESETS[schedule as keyof typeof SCHEDULE_PRESETS];
    }

    if (!cron.validate(cronExpression)) {
      return NextResponse.json(
        { error: 'Invalid schedule format' },
        { status: 400 }
      );
    }

    // Create scheduled scan
    const scheduledScan = await prisma.scheduledScan.create({
      data: {
        projectId,
        name,
        schedule: cronExpression,
        scanConfig,
        alertThresholds,
        isActive: true,
      },
      include: {
        project: true,
      },
    });

    // Schedule the job
    await cronScheduler.scheduleJob(scheduledScan);

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'scheduled_scan_created',
        details: {
          scheduledScanId: scheduledScan.id,
          projectId,
          schedule: cronExpression,
        },
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      scheduledScan: {
        id: scheduledScan.id,
        name: scheduledScan.name,
        schedule: scheduledScan.schedule,
        isActive: scheduledScan.isActive,
        nextRun: scheduledScan.nextRun,
        createdAt: scheduledScan.createdAt,
        project: {
          id: scheduledScan.project.id,
          name: scheduledScan.project.name,
          url: scheduledScan.project.url,
        },
      },
    });

  } catch (error) {
    console.error('Create scheduled scan API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const where: any = {
      project: {
        userId: session.user.id,
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const scheduledScans = await prisma.scheduledScan.findMany({
      where,
      include: {
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      scheduledScans,
      presets: Object.keys(SCHEDULE_PRESETS),
    });

  } catch (error) {
    console.error('Get scheduled scans API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      id, 
      name, 
      schedule, 
      isActive, 
      scanConfig, 
      alertThresholds 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Scheduled scan ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingScheduledScan = await prisma.scheduledScan.findFirst({
      where: {
        id,
        project: {
          userId: session.user.id,
        },
      },
    });

    if (!existingScheduledScan) {
      return NextResponse.json(
        { error: 'Scheduled scan not found or access denied' },
        { status: 404 }
      );
    }

    // Validate schedule if provided
    let cronExpression = schedule;
    if (schedule) {
      if (schedule in SCHEDULE_PRESETS) {
        cronExpression = SCHEDULE_PRESETS[schedule as keyof typeof SCHEDULE_PRESETS];
      }

      if (!cron.validate(cronExpression)) {
        return NextResponse.json(
          { error: 'Invalid schedule format' },
          { status: 400 }
        );
      }
    }

    // Update scheduled scan
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (cronExpression !== undefined) updateData.schedule = cronExpression;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (scanConfig !== undefined) updateData.scanConfig = scanConfig;
    if (alertThresholds !== undefined) updateData.alertThresholds = alertThresholds;
    updateData.updatedAt = new Date();

    const updatedScheduledScan = await prisma.scheduledScan.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
      },
    });

    // Update the cron schedule
    await cronScheduler.updateSchedule(id);

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'scheduled_scan_updated',
        details: {
          scheduledScanId: id,
          changes: updateData,
        },
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      scheduledScan: updatedScheduledScan,
    });

  } catch (error) {
    console.error('Update scheduled scan API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Scheduled scan ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const scheduledScan = await prisma.scheduledScan.findFirst({
      where: {
        id,
        project: {
          userId: session.user.id,
        },
      },
    });

    if (!scheduledScan) {
      return NextResponse.json(
        { error: 'Scheduled scan not found or access denied' },
        { status: 404 }
      );
    }

    // Unschedule the job
    await cronScheduler.unscheduleJob(id);

    // Delete the scheduled scan
    await prisma.scheduledScan.delete({
      where: { id },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'scheduled_scan_deleted',
        details: {
          scheduledScanId: id,
          projectId: scheduledScan.projectId,
        },
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Scheduled scan deleted successfully',
    });

  } catch (error) {
    console.error('Delete scheduled scan API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}