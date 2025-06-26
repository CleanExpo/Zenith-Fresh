import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PerformanceMonitor } from '@/lib/performance';
import { WebsiteScanCache } from '@/lib/cache';
// Dynamic imports for queue and scanner services

export async function POST(request: NextRequest) {
  const timer = PerformanceMonitor.startTimer();
  
  try {
    // Parallel session check and body parsing for better performance
    const [session, body] = await Promise.all([
      getServerSession(authOptions),
      request.json()
    ]);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { url, projectId, scanType = 'manual', options = {} } = body;

    // Validate required fields
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      const { websiteScanner } = await import('@/lib/services/website-scanner');
      if (!await websiteScanner.validateUrl(url)) {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    } catch (error) {
      // Fallback URL validation
      try {
        new URL(url);
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          throw new Error('Invalid protocol');
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    // Check cache for recent scan results
    if (scanType === 'manual' && !options.forceRefresh) {
      const cachedScan = await WebsiteScanCache.getCachedScan(url, scanType);
      if (cachedScan) {
        const duration = timer.stop();
        console.log(`Cache hit for scan: ${url} (${duration.toFixed(2)}ms)`);
        
        return NextResponse.json({
          success: true,
          cached: true,
          scan: cachedScan.scan,
          project: cachedScan.project,
          responseTime: duration
        });
      }
    }

    let project;

    // If projectId is provided, verify ownership
    if (projectId) {
      project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: session.user.id,
        },
        select: {
          id: true,
          name: true,
          url: true,
          userId: true
        }
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
        select: {
          id: true,
          name: true,
          url: true,
          userId: true
        }
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
    let job;
    try {
      const { addScanJob } = await import('@/lib/queue');
      job = await addScanJob({
        scanId: scan.id,
        projectId: project.id,
        url,
        scanType: scanType as 'manual' | 'scheduled',
        triggeredBy: session.user.id!,
        options,
      });
    } catch (error) {
      console.warn('Queue not available, updating scan status directly:', error);
      // If queue is not available, update scan status
      await prisma.websiteScan.update({
        where: { id: scan.id },
        data: { status: 'queued' },
      });
      
      job = { id: 'direct-scan', name: 'Direct Scan' };
    }

    // Log audit event (do it asynchronously to not block response)
    prisma.auditLog.create({
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
    }).catch(err => console.error('Failed to log audit event:', err));

    const responseData = {
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
    };

    // Cache the scan result asynchronously
    WebsiteScanCache.cacheScan(url, scanType, responseData).catch(err => 
      console.error('Failed to cache scan result:', err)
    );

    const duration = timer.stop();
    
    // Record performance metrics asynchronously
    PerformanceMonitor.recordMetric({
      endpoint: '/api/website-analyzer/scan',
      method: 'POST',
      duration,
      statusCode: 200,
      timestamp: Date.now()
    }).catch(console.error);

    return NextResponse.json({
      ...responseData,
      responseTime: duration
    });

  } catch (error) {
    console.error('Scan API error:', error);
    
    const duration = timer.stop();
    
    // Record error metric
    PerformanceMonitor.recordMetric({
      endpoint: '/api/website-analyzer/scan',
      method: 'POST',
      duration,
      statusCode: 500,
      timestamp: Date.now()
    }).catch(console.error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: duration
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const timer = PerformanceMonitor.startTimer();
  
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Cap limit at 50

    if (scanId) {
      // Get specific scan
      const scan = await prisma.websiteScan.findFirst({
        where: {
          id: scanId,
          project: {
            userId: session.user.id,
          },
        },
        select: {
          id: true,
          url: true,
          status: true,
          scanType: true,
          triggeredBy: true,
          createdAt: true,
          completedAt: true,
          results: true,
          errorMessage: true,
          project: {
            select: {
              id: true,
              name: true,
              url: true
            }
          },
          alerts: {
            select: {
              id: true,
              severity: true,
              title: true,
              description: true,
              isResolved: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10 // Limit alerts to most recent 10
          },
        },
      });

      if (!scan) {
        return NextResponse.json(
          { error: 'Scan not found' },
          { status: 404 }
        );
      }

      const duration = timer.stop();
      
      // Record performance metric
      PerformanceMonitor.recordMetric({
        endpoint: '/api/website-analyzer/scan',
        method: 'GET',
        duration,
        statusCode: 200,
        timestamp: Date.now()
      }).catch(console.error);

      return NextResponse.json({ 
        scan,
        responseTime: duration 
      });
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
        select: {
          id: true,
          url: true,
          status: true,
          scanType: true,
          createdAt: true,
          completedAt: true,
          project: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              alerts: {
                where: { isResolved: false }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.websiteScan.count({ where }),
    ]);

    const duration = timer.stop();
    
    // Record performance metric
    PerformanceMonitor.recordMetric({
      endpoint: '/api/website-analyzer/scan',
      method: 'GET',
      duration,
      statusCode: 200,
      timestamp: Date.now()
    }).catch(console.error);

    return NextResponse.json({
      scans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      responseTime: duration
    });

  } catch (error) {
    console.error('Get scans API error:', error);
    
    const duration = timer.stop();
    
    // Record error metric
    PerformanceMonitor.recordMetric({
      endpoint: '/api/website-analyzer/scan',
      method: 'GET',
      duration,
      statusCode: 500,
      timestamp: Date.now()
    }).catch(console.error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: duration
      },
      { status: 500 }
    );
  }
}