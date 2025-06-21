// src/app/api/analysis/website/[id]/issues/route.ts
// Stream A: Website Health Scoring Engine - Issues API with Freemium Gating
// Following strategic roadmap A2.1 Strategic Information Architecture

import { NextRequest, NextResponse } from 'next/server';
import { analyzeWebsiteHealth } from '@/lib/services/website-analyzer';
import { auth } from '@/lib/auth';

/**
 * GET /api/analysis/website/{id}/issues
 * Get detailed issues (freemium gated)
 * Following strategic roadmap A2.1 freemium gating strategy
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
    
    // Check user tier from headers or database
    const userTier = request.headers.get('x-user-tier') || 'freemium';
    const isPremium = userTier === 'premium' || userTier === 'business';

    try {
      // Decode the URL from base64 ID
      const url = Buffer.from(id, 'base64').toString('utf-8');
      // Validate URL format
      new URL(url);

      // Get full health analysis
      const healthScore = await analyzeWebsiteHealth(url);
      
      // Collect all issues from all pillars
      const allIssues = [
        ...healthScore.pillars.performance.issues,
        ...healthScore.pillars.technicalSEO.issues,
        ...healthScore.pillars.onPageSEO.issues,
        ...healthScore.pillars.security.issues,
        ...healthScore.pillars.accessibility.issues
      ];

      if (isPremium) {
        // Premium users get full detailed issues
        return NextResponse.json({
          success: true,
          data: {
            url: healthScore.url,
            scanId: healthScore.crawlId,
            issues: allIssues,
            summary: {
              total: allIssues.length,
              byPillar: {
                performance: healthScore.pillars.performance.issues.length,
                technicalSEO: healthScore.pillars.technicalSEO.issues.length,
                onPageSEO: healthScore.pillars.onPageSEO.issues.length,
                security: healthScore.pillars.security.issues.length,
                accessibility: healthScore.pillars.accessibility.issues.length
              },
              bySeverity: {
                error: allIssues.filter(i => i.severity === 'error').length,
                warning: allIssues.filter(i => i.severity === 'warning').length,
                notice: allIssues.filter(i => i.severity === 'notice').length
              }
            },
            tier: 'premium',
            lastUpdated: healthScore.lastUpdated
          }
        });
      } else {
        // Freemium users get limited preview following A2.1 strategy:
        // - Show totals only
        // - Show one issue per category
        // - Basic recommendations only
        
        interface LimitedIssue {
          pillar: string;
          severity: string;
          title: string;
          description: string;
          impact: string;
          howToFix: string;
          preview: boolean;
        }
        
        const limitedIssues: LimitedIssue[] = [];
        const pillarCategories = ['performance', 'technicalSEO', 'onPageSEO', 'security', 'accessibility'] as const;
        
        // Show one representative issue per pillar category
        for (const pillar of pillarCategories) {
          const pillarIssues = allIssues.filter(issue => issue.pillar === pillar);
          if (pillarIssues.length > 0) {
            // Show the most severe issue from this pillar
            const mostSevere = pillarIssues.sort((a, b) => {
              const severityOrder = { error: 3, warning: 2, notice: 1 };
              return severityOrder[b.severity] - severityOrder[a.severity];
            })[0];
            
            // Include limited info for freemium
            limitedIssues.push({
              pillar: mostSevere.pillar,
              severity: mostSevere.severity,
              title: mostSevere.title,
              description: mostSevere.description,
              impact: mostSevere.impact,
              howToFix: 'Upgrade to Premium to see detailed fix recommendations',
              preview: true
            });
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            url: healthScore.url,
            scanId: healthScore.crawlId,
            issues: limitedIssues,
            summary: {
              total: allIssues.length,
              showing: limitedIssues.length,
              byPillar: {
                performance: healthScore.pillars.performance.issues.length,
                technicalSEO: healthScore.pillars.technicalSEO.issues.length,
                onPageSEO: healthScore.pillars.onPageSEO.issues.length,
                security: healthScore.pillars.security.issues.length,
                accessibility: healthScore.pillars.accessibility.issues.length
              },
              bySeverity: {
                error: allIssues.filter(i => i.severity === 'error').length,
                warning: allIssues.filter(i => i.severity === 'warning').length,
                notice: allIssues.filter(i => i.severity === 'notice').length
              }
            },
            tier: 'freemium',
            upgradeRequired: true,
            upgradeMessage: `Showing ${limitedIssues.length} of ${allIssues.length} issues. Upgrade to Premium to see all detailed issues and specific fix recommendations.`,
            upgradeUrl: '/pricing',
            lastUpdated: healthScore.lastUpdated
          }
        });
      }

    } catch (urlError) {
      return NextResponse.json(
        { error: 'Invalid URL identifier' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Issues endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve issues',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analysis/website/{id}/issues/export
 * Export issues as PDF report (Premium feature)
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

    // Check user tier - PDF export is premium only
    const userTier = request.headers.get('x-user-tier') || 'freemium';
    const isPremium = userTier === 'premium' || userTier === 'business';

    if (!isPremium) {
      return NextResponse.json(
        { 
          error: 'Premium feature required',
          message: 'PDF export is available for Premium and Business plans only',
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }

    // For MVP, return placeholder response
    // In production, this would generate and return a PDF report
    return NextResponse.json({
      success: true,
      data: {
        message: 'PDF report generation initiated',
        downloadUrl: '/api/reports/download/placeholder-report.pdf',
        status: 'processing'
      }
    });

  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to export report',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
