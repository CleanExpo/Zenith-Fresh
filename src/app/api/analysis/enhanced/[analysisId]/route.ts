/**
 * Get specific enhanced analysis result
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { featureFlagService } from '@/lib/feature-flags';

interface RouteParams {
  params: {
    analysisId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Feature flag check
    const isEnhancedAnalyzerEnabled = featureFlagService.isFeatureEnabled('enhanced_website_analyzer', {
      userId: session.user.id,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date()
    });

    if (!isEnhancedAnalyzerEnabled) {
      return NextResponse.json(
        { error: 'Enhanced Website Analyzer is not available in your plan' },
        { status: 403 }
      );
    }

    const { analysisId } = params;

    // Get analysis from database
    const { prisma } = await import('@/lib/prisma');
    
    const analysis = await prisma.websiteAnalysis.findFirst({
      where: {
        analysisId,
        userId: session.user.id
      }
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Parse the stored analysis data
    const analysisData = typeof analysis.analysisData === 'string' 
      ? JSON.parse(analysis.analysisData)
      : analysis.analysisData;

    return NextResponse.json({
      success: true,
      data: analysisData
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve analysis' 
      },
      { status: 500 }
    );
  }
}

/**
 * Delete specific analysis
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { analysisId } = params;

    // Delete analysis from database
    const { prisma } = await import('@/lib/prisma');
    
    const deletedAnalysis = await prisma.websiteAnalysis.deleteMany({
      where: {
        analysisId,
        userId: session.user.id
      }
    });

    if (deletedAnalysis.count === 0) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Analysis deleted successfully'
    });

  } catch (error) {
    console.error('Delete analysis error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete analysis' 
      },
      { status: 500 }
    );
  }
}