// src/app/api/analysis/competitive/[id]/route.ts
// Stream C: Competitive Intelligence Platform - C1.2 Competitive Analysis API
// Following strategic roadmap competitive intelligence requirements

import { NextRequest, NextResponse } from 'next/server';
import { performCompetitiveAnalysis } from '@/lib/services/competitive-analyzer';
import { auth } from '@/lib/auth';

/**
 * GET /api/analysis/competitive/{id}
 * Get competitive analysis (premium feature only)
 * Following strategic roadmap C1.2 premium gating strategy
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
    
    // Check user tier - competitive analysis is premium only
    const userTier = request.headers.get('x-user-tier') || 'freemium';
    const isPremium = userTier === 'premium' || userTier === 'business';

    if (!isPremium) {
      return NextResponse.json(
        { 
          error: 'Premium feature required',
          message: 'Competitive analysis is available for Premium and Business plans only',
          preview: {
            competitors: ['competitor1.com', 'competitor2.com', 'competitor3.com'],
            marketPosition: 'Ranking: Hidden - Upgrade to see full analysis',
            opportunities: 'Multiple improvement opportunities identified'
          },
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }

    try {
      // Decode the URL from base64 ID
      const url = Buffer.from(id, 'base64').toString('utf-8');
      // Validate URL format
      new URL(url);

      // Perform competitive analysis
      const analysis = await performCompetitiveAnalysis(url);

      return NextResponse.json({
        success: true,
        data: {
          url: analysis.targetUrl,
          targetScore: analysis.targetScore,
          industry: analysis.industry,
          marketPosition: analysis.marketPosition,
          competitors: analysis.competitors.map(competitor => ({
            url: competitor.url,
            name: new URL(competitor.url).hostname.replace('www.', ''),
            healthScore: competitor.healthScore,
            pillars: competitor.pillars,
            loadTime: competitor.loadTime,
            mobileScore: competitor.mobileScore,
            marketShare: competitor.marketShare,
            trafficEstimate: competitor.trafficEstimate,
            lastAnalyzed: competitor.lastAnalyzed
          })),
          opportunities: analysis.opportunities,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          recommendations: analysis.recommendations,
          benchmarkData: analysis.benchmarkData,
          tier: 'premium',
          analysisDate: new Date().toISOString()
        }
      });

    } catch (urlError) {
      return NextResponse.json(
        { error: 'Invalid URL identifier' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Competitive analysis API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve competitive analysis',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analysis/competitive/{id}/compare
 * Compare specific metrics with competitors (premium feature)
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

    // Check user tier - competitive comparison is premium only
    const userTier = request.headers.get('x-user-tier') || 'freemium';
    const isPremium = userTier === 'premium' || userTier === 'business';

    if (!isPremium) {
      return NextResponse.json(
        { 
          error: 'Premium feature required',
          message: 'Competitive comparison is available for Premium and Business plans only',
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { metric } = body;

    if (!metric || !['performance', 'seo', 'security', 'accessibility'].includes(metric)) {
      return NextResponse.json(
        { error: 'Valid metric required (performance, seo, security, accessibility)' },
        { status: 400 }
      );
    }

    try {
      // Decode the URL from base64 ID
      const url = Buffer.from(id, 'base64').toString('utf-8');
      // Validate URL format
      new URL(url);

      // Get competitive comparison for specific metric
      const { getCompetitorComparison } = await import('@/lib/services/competitive-analyzer');
      const comparison = await getCompetitorComparison(url, metric);

      return NextResponse.json({
        success: true,
        data: {
          metric,
          url,
          target: comparison.target,
          competitors: comparison.competitors,
          benchmarks: {
            average: comparison.average,
            best: comparison.best,
            yourPosition: comparison.competitors.findIndex(c => c.score <= comparison.target) + 1
          },
          insights: {
            aboveAverage: comparison.target > comparison.average,
            gapToBest: comparison.best - comparison.target,
            improvementPotential: Math.max(0, comparison.best - comparison.target)
          },
          tier: 'premium',
          analysisDate: new Date().toISOString()
        }
      });

    } catch (urlError) {
      return NextResponse.json(
        { error: 'Invalid URL identifier' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Competitive comparison API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform competitive comparison',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
