// src/app/api/analysis/website/scan/route.ts
// Stream A: Website Health Scoring Engine - API Implementation
// Following strategic roadmap A1.2 API Endpoints

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeWebsiteHealth } from '@/lib/services/website-analyzer';
import { auth } from '@/lib/auth';

// Request validation schema
const scanRequestSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  options: z.object({
    includePerformance: z.boolean().default(true),
    includeSEO: z.boolean().default(true),
    includeSecurity: z.boolean().default(true),
    includeAccessibility: z.boolean().default(true)
  }).optional()
});

/**
 * POST /api/analysis/website/scan
 * Initiate website health scan following strategic roadmap A1.2
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional for freemium)
    const session = await auth();
    const isAuthenticated = !!session?.user?.id;
    const userTier = isAuthenticated ? 'premium' : 'freemium';

    // Parse and validate request body
    const body = await request.json();
    const validatedData = scanRequestSchema.parse(body);
    
    // Perform website health analysis
    const healthScore = await analyzeWebsiteHealth(validatedData.url);
    
    // Apply freemium gating as per Strategic Roadmap A2.1
    const responseData: any = {
      scanId: healthScore.crawlId,
      url: healthScore.url,
      overall: healthScore.overall, // Full access for freemium
      pillars: {
        performance: healthScore.pillars.performance.score,
        technicalSEO: healthScore.pillars.technicalSEO.score,
        onPageSEO: healthScore.pillars.onPageSEO.score,
        security: healthScore.pillars.security.score,
        accessibility: healthScore.pillars.accessibility.score
      },
      lastUpdated: healthScore.lastUpdated,
      status: 'completed',
      tier: userTier,
      upgradeRequired: !isAuthenticated
    };

    // For freemium users, add conversion touchpoints
    if (!isAuthenticated) {
      responseData.freemiumLimits = {
        healthScore: 'full_access',
        issueCount: 'show_totals_only', 
        issueDetails: 'show_one_per_category',
        recommendations: 'basic_only',
        historicalData: 'premium_only',
        competitorData: 'premium_only'
      };
    }
    
    // Return scan results with freemium gating
    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Website scan error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        },
        { status: 400 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Failed to analyze website',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analysis/website/scan
 * Get scan history for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For MVP, return empty array since we don't store scan history yet
    // In production, this would query the database for user's scan history
    return NextResponse.json({
      success: true,
      data: {
        scans: [],
        total: 0,
        page: 1,
        pageSize: 20
      }
    });

  } catch (error) {
    console.error('Scan history error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve scan history',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
