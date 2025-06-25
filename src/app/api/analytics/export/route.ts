import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exportService, ExportConfig } from '@/lib/export/export-service';
import { z } from 'zod';

const ExportRequestSchema = z.object({
  teamId: z.string(),
  type: z.enum(['dashboard', 'report', 'raw_data']),
  format: z.enum(['pdf', 'excel', 'csv', 'json']),
  data: z.any(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  includeCharts: z.boolean().default(true),
  includeMetadata: z.boolean().default(true),
  branding: z.object({
    companyName: z.string().optional(),
    colors: z.object({
      primary: z.string(),
      secondary: z.string()
    }).optional()
  }).optional()
});

/**
 * POST /api/analytics/export
 * 
 * Create a new export job
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const exportRequest = ExportRequestSchema.parse(body);

    // Verify team access
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: exportRequest.teamId,
        userId: session.user.id
      }
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create export configuration
    const config: ExportConfig = {
      type: exportRequest.type,
      format: exportRequest.format,
      data: exportRequest.data,
      title: exportRequest.title,
      subtitle: exportRequest.subtitle,
      includeCharts: exportRequest.includeCharts,
      includeMetadata: exportRequest.includeMetadata,
      branding: exportRequest.branding
    };

    // Create export job
    const jobId = await exportService.createExportJob(
      session.user.id,
      exportRequest.teamId,
      config
    );

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Export job created successfully'
    });

  } catch (error) {
    console.error('Export API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create export job' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/export
 * 
 * Get export jobs for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    // Verify team access if teamId is provided
    if (teamId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: session.user.id
        }
      });

      if (!teamMember) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get export jobs
    const jobs = await exportService.getExportJobs(session.user.id, teamId || undefined);

    return NextResponse.json({
      success: true,
      jobs
    });

  } catch (error) {
    console.error('Export jobs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export jobs' },
      { status: 500 }
    );
  }
}