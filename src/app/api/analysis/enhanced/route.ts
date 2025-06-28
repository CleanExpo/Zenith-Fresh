/**
 * Enhanced Website Analysis API Endpoint
 * Week 2 Feature: AI-powered analysis with advanced insights
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { auth } from '@/lib/auth';
import { enhancedAIAnalyzer } from '@/lib/ai/website-analysis';
import { analytics } from '@/lib/analytics/analytics-enhanced';
import { featureFlagService } from '@/lib/feature-flags';
import { rateLimit } from '@/lib/security/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip ?? 'anonymous';
    const { success } = await rateLimit.check(identifier, 'enhanced-analysis', 5, 60000); // 5 requests per minute
    
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required for enhanced analysis' },
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

    // Parse request body
    const body = await request.json();
    const { url, options = {} } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Track analysis start
    await analytics.trackEvent({
      event: 'enhanced_analysis_started',
      properties: {
        userId: session.user.id,
        url,
        options
      }
    });

    // Fetch page content for analysis
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Zenith Enhanced Website Analyzer 1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();
    
    // Extract metadata
    const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descriptionMatch = content.match(/<meta\s+name="description"\s+content="([^"]*)"[^>]*>/i);
    const keywordsMatch = content.match(/<meta\s+name="keywords"\s+content="([^"]*)"[^>]*>/i);

    const metadata = {
      title: titleMatch ? titleMatch[1].trim() : '',
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      keywords: keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : [],
      pageType: detectPageType(content, url)
    };

    // Prepare analysis request
    const analysisRequest = {
      url,
      content,
      metadata,
      options: {
        analysisType: options.analysisType || 'comprehensive',
        competitorUrls: options.competitorUrls || [],
        industry: options.industry || 'general'
      }
    };

    // Perform enhanced AI analysis
    const analysisResult = await enhancedAIAnalyzer.analyzeWebsite(analysisRequest);

    // Track successful analysis
    await analytics.trackEvent({
      event: 'enhanced_analysis_completed',
      properties: {
        userId: session.user.id,
        url,
        overallScore: analysisResult.overallScore,
        recommendationCount: analysisResult.recommendations.length,
        analysisId: analysisResult.analysisId
      }
    });

    return NextResponse.json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error('Enhanced analysis error:', error);

    // Track error
    try {
      const session = await auth();
      if (session?.user?.id) {
        await analytics.trackEvent({
          event: 'enhanced_analysis_error',
          properties: {
            userId: session.user.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    } catch (trackingError) {
      console.error('Failed to track analysis error:', trackingError);
    }

    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Enhanced analysis failed' 
      },
      { status: 500 }
    );
  }
}

/**
 * Get enhanced analysis history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const url = searchParams.get('url');

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

    // Get analysis history from database
    const { prisma } = await import('@/lib/prisma');
    
    const where = {
      userId: session.user.id,
      ...(url && { url: { contains: url } })
    };

    const [analyses, total] = await Promise.all([
      prisma.websiteAnalysis.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          analysisId: true,
          url: true,
          overallScore: true,
          contentQualityScore: true,
          seoScore: true,
          uxScore: true,
          performanceScore: true,
          recommendationCount: true,
          createdAt: true
        }
      }),
      prisma.websiteAnalysis.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        analyses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get analysis history error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve analysis history' 
      },
      { status: 500 }
    );
  }
}

/**
 * Detect page type based on content and URL
 */
function detectPageType(content: string, url: string): 'homepage' | 'product' | 'blog' | 'landing' | 'other' {
  const urlPath = new URL(url).pathname.toLowerCase();
  
  // Check URL patterns
  if (urlPath === '/' || urlPath === '/home') {
    return 'homepage';
  }
  
  if (urlPath.includes('/product') || urlPath.includes('/shop') || urlPath.includes('/store')) {
    return 'product';
  }
  
  if (urlPath.includes('/blog') || urlPath.includes('/article') || urlPath.includes('/news')) {
    return 'blog';
  }
  
  if (urlPath.includes('/landing') || urlPath.includes('/lp/')) {
    return 'landing';
  }
  
  // Check content patterns
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('add to cart') || contentLower.includes('buy now') || contentLower.includes('price')) {
    return 'product';
  }
  
  if (contentLower.includes('published') || contentLower.includes('author') || contentLower.includes('comments')) {
    return 'blog';
  }
  
  return 'other';
}