import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exportService } from '@/lib/export/export-service';

/**
 * GET /api/analytics/export/[jobId]
 * 
 * Get export job status and download link
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;

    // Get export job
    const job = await exportService.getExportJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Export job not found' }, { status: 404 });
    }

    // Verify job ownership
    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        type: job.type,
        format: job.format,
        status: job.status,
        fileUrl: job.fileUrl,
        fileSize: job.fileSize,
        error: job.error,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt
      }
    });

  } catch (error) {
    console.error('Export job API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export job' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/export/[jobId]
 * 
 * Cancel or delete an export job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;

    // Get export job to verify ownership
    const job = await prisma.dataExportJob.findUnique({
      where: { id: jobId },
      select: { userId: true, status: true }
    });

    if (!job) {
      return NextResponse.json({ error: 'Export job not found' }, { status: 404 });
    }

    // Verify job ownership
    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete the job (or mark as cancelled if processing)
    if (job.status === 'processing') {
      await prisma.dataExportJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: 'Cancelled by user'
        }
      });
    } else {
      await prisma.dataExportJob.delete({
        where: { id: jobId }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Export job deleted successfully'
    });

  } catch (error) {
    console.error('Export job deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete export job' },
      { status: 500 }
    );
  }
}