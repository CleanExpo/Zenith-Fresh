import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { addScanJob } from '@/lib/queue';
import { websiteScanner } from '@/lib/services/website-scanner';

const prisma = new PrismaClient();

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
    const { url, projectId, scanType = 'manual', options = {} } = body;

    // Validate required fields
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!await websiteScanner.validateUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    let project;

    // If projectId is provided, verify ownership
    if (projectId) {
      project = await prisma.project.findFirst({
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
    } else {
      // Create a temporary project for one-off scans
      project = await prisma.project.create({
        data: {
          name: `Scan for ${new URL(url).hostname}`,
          url,
          description: 'One-time website scan',
          userId: session.user.id,
        },
      });
    }

    // Create scan record
    const scan = await prisma.websiteScan.create({
      data: {
        projectId: project.id,
        url,
        scanType,
        status: 'pending',
        triggeredBy: 'user',
      },
    });

    // Add scan job to queue
    const job = await addScanJob({
      scanId: scan.id,
      projectId: project.id,
      url,
      scanType: scanType as 'manual' | 'scheduled',
      triggeredBy: session.user.id!,
      options,
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'website_scan_initiated',
        details: {
          scanId: scan.id,
          url,
          scanType,
          jobId: job.id,
        },
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      scan: {
        id: scan.id,
        url: scan.url,
        status: scan.status,
        createdAt: scan.createdAt,
      },
      project: {
        id: project.id,
        name: project.name,
      },
      job: {
        id: job.id,
        name: job.name,
      },
    });

  } catch (error) {
    console.error('Scan API error:', error);
    
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
    const scanId = searchParams.get('scanId');
    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (scanId) {
      // Get specific scan
      const scan = await prisma.websiteScan.findFirst({
        where: {
          id: scanId,
          project: {
            userId: session.user.id,
          },
        },
        include: {
          project: true,
          alerts: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!scan) {
        return NextResponse.json(
          { error: 'Scan not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ scan });
    }

    // Get scans for user or project
    const where: any = {
      project: {
        userId: session.user.id,
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const [scans, total] = await Promise.all([
      prisma.websiteScan.findMany({
        where,
        include: {
          project: true,
          alerts: {
            where: { isResolved: false },
            select: { id: true, severity: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.websiteScan.count({ where }),
    ]);

    return NextResponse.json({
      scans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get scans API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}