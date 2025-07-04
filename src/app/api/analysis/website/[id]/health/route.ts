// src/app/api/analysis/website/[id]/health/route.ts
// Stream A: Website Health Scoring Engine - Health Score Retrieval API
// Following strategic roadmap A1.2 API Endpoints

import { NextRequest, NextResponse } from 'next/server';
import { analyzeWebsiteHealth, getWebsiteHealthSummary } from '@/lib/services/website-analyzer';
import { auth } from '@/lib/auth';
import { cache } from '@/lib/redis';

/**
 * GET /api/analysis/website/{id}/health
 * Retrieve health score for a specific URL/scan ID
 * Following strategic roadmap A1.2 requirements
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
    
    // Check if user has premium access
    // For MVP, we'll assume all users are freemium unless specified
    const userTier = request.headers.get('x-user-tier') || 'freemium';
    const isPremium = userTier === 'premium' || userTier === 'business';

    try {
      // Decode the URL from base64 ID (if it's a URL-based lookup)
      let url: string;
      try {
        url = Buffer.from(id, 'base64').toString('utf-8');
        // Validate URL format
        new URL(url);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid URL identifier' },
          { status: 400 }
        );
      }

      if (isPremium) {
        // Premium users get full health analysis
        const healthScore = await analyzeWebsiteHealth(url);
        
        return NextResponse.json({
          success: true,
          data: {
            scanId: healthScore.crawlId,
            url: healthScore.url,
            overall: healthScore.overall,
            pillars: {
              performance: {
                score: healthScore.pillars.performance.score,
                coreWebVitals: healthScore.pillars.performance.coreWebVitals,
                issueCount: healthScore.pillars.performance.issues.length
              },
              technicalSEO: {
                score: healthScore.pillars.technicalSEO.score,
                checks: healthScore.pillars.technicalSEO.checks,
                issueCount: healthScore.pillars.technicalSEO.issues.length
              },
              onPageSEO: {
                score: healthScore.pillars.onPageSEO.score,
                checks: healthScore.pillars.onPageSEO.checks,
                issueCount: healthScore.pillars.onPageSEO.issues.length
              },
              security: {
                score: healthScore.pillars.security.score,
                checks: healthScore.pillars.security.checks,
                issueCount: healthScore.pillars.security.issues.length
              },
              accessibility: {
                score: healthScore.pillars.accessibility.score,
                checks: healthScore.pillars.accessibility.checks,
                issueCount: healthScore.pillars.accessibility.issues.length
              }
            },
            lastUpdated: healthScore.lastUpdated,
            tier: 'premium'
          }
        });
      } else {
        // Freemium users get limited summary following A2.1 strategy
        const summary = await getWebsiteHealthSummary(url);
        
        return NextResponse.json({
          success: true,
          data: {
            url: url,
            overall: summary.overall,
            pillarScores: summary.pillarScores,
            issueCount: summary.issueCount,
            upgradeRequired: summary.upgradeRequired,
            tier: 'freemium',
            upgradeMessage: 'Upgrade to Premium to see detailed analysis, specific issues, and recommendations',
            upgradeUrl: '/pricing'
          }
        });
      }

    } catch (analysisError) {
      console.error('Website analysis error:', analysisError);
      return NextResponse.json(
        { 
          error: 'Failed to analyze website',
          message: analysisError instanceof Error ? analysisError.message : 'Analysis failed'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Health endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve health score',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analysis/website/{id}/health
 * Refresh health score for a specific URL
 */
export async function POST(
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
    
    try {
      // Decode the URL from base64 ID
      const url = Buffer.from(id, 'base64').toString('utf-8');
      // Validate URL format
      new URL(url);

      // Clear cache for this URL to force fresh analysis
      const cacheKey = `website:health:${id}`;
      await cache.del(cacheKey);

      // Perform fresh analysis
      const healthScore = await analyzeWebsiteHealth(url);
      
      return NextResponse.json({
        success: true,
        data: {
          scanId: healthScore.crawlId,
          url: healthScore.url,
          overall: healthScore.overall,
          lastUpdated: healthScore.lastUpdated,
          status: 'refreshed'
        }
      });

    } catch (urlError) {
      return NextResponse.json(
        { error: 'Invalid URL identifier' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Health refresh error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to refresh health score',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
