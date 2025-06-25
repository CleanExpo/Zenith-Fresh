import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { WebsitePerformanceAnalyzer } from '@/lib/website-performance-analyzer';
import { TrendCalculator } from '@/lib/trend-calculator';
import { AlertGenerator } from '@/lib/alert-generator';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, projectId, analysisType = 'full' } = body;

    if (!url || !projectId) {
      return NextResponse.json(
        { error: 'URL and projectId are required' },
        { status: 400 }
      );
    }

    // Validate project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create analysis record
    const analysis = await prisma.websiteAnalysis.create({
      data: {
        projectId,
        url,
        analysisType,
        status: 'running',
      },
    });

    // Start background analysis
    const analyzer = new WebsitePerformanceAnalyzer();
    const startTime = Date.now();

    try {
      // Run comprehensive analysis
      const results = await analyzer.analyzeWebsite(url, {
        includePerformance: true,
        includeCoreWebVitals: true,
        includeTechnicalChecks: true,
        includeAccessibility: true,
        includeSEO: true,
      });

      const duration = Date.now() - startTime;

      // Store performance metrics
      const performanceMetrics = await prisma.performanceMetrics.create({
        data: {
          websiteAnalysisId: analysis.id,
          pageLoadTime: results.performance.pageLoadTime,
          timeToFirstByte: results.performance.timeToFirstByte,
          domContentLoaded: results.performance.domContentLoaded,
          totalPageSize: results.performance.totalPageSize,
          totalRequests: results.performance.totalRequests,
          cssFileCount: results.performance.cssFileCount,
          jsFileCount: results.performance.jsFileCount,
          imageFileCount: results.performance.imageFileCount,
          estimatedCssSize: results.performance.estimatedCssSize,
          estimatedJsSize: results.performance.estimatedJsSize,
          estimatedImageSize: results.performance.estimatedImageSize,
          cacheScore: results.performance.cacheScore,
          compressionScore: results.performance.compressionScore,
          imageOptimizationScore: results.performance.imageOptimizationScore,
          jsOptimizationScore: results.performance.jsOptimizationScore,
          cssOptimizationScore: results.performance.cssOptimizationScore,
          fontOptimizationScore: results.performance.fontOptimizationScore,
        },
      });

      // Store Core Web Vitals
      const coreWebVitals = await prisma.coreWebVitals.create({
        data: {
          websiteAnalysisId: analysis.id,
          largestContentfulPaint: results.coreWebVitals.lcp,
          firstInputDelay: results.coreWebVitals.fid,
          cumulativeLayoutShift: results.coreWebVitals.cls,
          firstContentfulPaint: results.coreWebVitals.fcp,
          timeToInteractive: results.coreWebVitals.tti,
          totalBlockingTime: results.coreWebVitals.tbt,
          speedIndex: results.coreWebVitals.speedIndex,
          lcpStatus: results.coreWebVitals.lcpStatus,
          fidStatus: results.coreWebVitals.fidStatus,
          clsStatus: results.coreWebVitals.clsStatus,
          webVitalsScore: results.coreWebVitals.overallScore,
        },
      });

      // Store technical checks
      const technicalChecks = await prisma.technicalChecks.create({
        data: {
          websiteAnalysisId: analysis.id,
          hasSSL: results.technical.hasSSL,
          hasSecurityHeaders: results.technical.hasSecurityHeaders,
          hasRobotsTxt: results.technical.hasRobotsTxt,
          hasSitemap: results.technical.hasSitemap,
          hasMetaDescription: results.technical.hasMetaDescription,
          hasH1Tag: results.technical.hasH1Tag,
          hasStructuredData: results.technical.hasStructuredData,
          hasCanonicalTag: results.technical.hasCanonicalTag,
          hasGzipCompression: results.technical.hasGzipCompression,
          hasBrotliCompression: results.technical.hasBrotliCompression,
          hasCacheHeaders: results.technical.hasCacheHeaders,
          hasLazyLoading: results.technical.hasLazyLoading,
          hasAltTags: results.technical.hasAltTags,
          hasAriaLabels: results.technical.hasAriaLabels,
          colorContrastPass: results.technical.colorContrastPass,
          isMobileFriendly: results.technical.isMobileFriendly,
          hasViewportMeta: results.technical.hasViewportMeta,
          usesModernImageFormats: results.technical.usesModernImageFormats,
          securityScore: results.technical.securityScore,
          seoScore: results.technical.seoScore,
          accessibilityScore: results.technical.accessibilityScore,
          mobileScore: results.technical.mobileScore,
        },
      });

      // Calculate overall score
      const overallScore = Math.round(
        (results.performance.overallScore * 0.4 +
          results.coreWebVitals.overallScore * 0.3 +
          results.technical.overallScore * 0.3)
      );

      // Update analysis with completion data
      const updatedAnalysis = await prisma.websiteAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: 'completed',
          overallScore,
          completedAt: new Date(),
          duration,
        },
        include: {
          performanceMetrics: true,
          coreWebVitals: true,
          technicalChecks: true,
        },
      });

      // Generate alerts for significant changes
      const alertGenerator = new AlertGenerator();
      const alerts = await alertGenerator.generateAlerts(
        analysis.id,
        projectId,
        url,
        results
      );

      // Store alerts if any
      if (alerts.length > 0) {
        await prisma.analysisAlert.createMany({
          data: alerts.map(alert => ({
            websiteAnalysisId: analysis.id,
            alertType: alert.type,
            severity: alert.severity,
            category: alert.category,
            title: alert.title,
            description: alert.description,
            currentValue: alert.currentValue,
            previousValue: alert.previousValue,
            threshold: alert.threshold,
          })),
        });
      }

      // Update trends
      const trendCalculator = new TrendCalculator();
      await trendCalculator.updateTrends(projectId, url, results);

      return NextResponse.json({
        success: true,
        analysisId: analysis.id,
        overallScore,
        results: updatedAnalysis,
        alerts: alerts.length,
        duration,
      });

    } catch (error) {
      // Update analysis with error status
      await prisma.websiteAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: 'failed',
          duration: Date.now() - startTime,
        },
      });

      throw error;
    }

  } catch (error) {
    console.error('Analysis failed:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const url = searchParams.get('url');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!projectId) {
      return NextResponse.json(
        { error: 'ProjectId is required' },
        { status: 400 }
      );
    }

    // Validate project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const whereClause: any = {
      projectId,
      status: 'completed',
    };

    if (url) {
      whereClause.url = url;
    }

    // Get historical analyses
    const analyses = await prisma.websiteAnalysis.findMany({
      where: whereClause,
      include: {
        performanceMetrics: true,
        coreWebVitals: true,
        technicalChecks: true,
        analysisAlerts: {
          where: { isResolved: false },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get total count
    const totalCount = await prisma.websiteAnalysis.count({
      where: whereClause,
    });

    return NextResponse.json({
      analyses,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });

  } catch (error) {
    console.error('Failed to fetch analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}