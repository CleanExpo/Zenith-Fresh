/**
 * AI Content Analysis API Route
 * Integrates OpenAI GPT-4, Claude 3.5, and Google AI for content analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { aiContentAnalyzer } from '@/lib/ai/content-analyzer';
import { rateLimit } from '@/lib/rate-limit';

// Request schemas
const ContentAnalysisRequestSchema = z.object({
  action: z.enum([
    'analyze_content',
    'generate_gaps',
    'optimize_content',
    'create_brief',
    'predict_performance',
    'generate_calendar'
  ]),
  content: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  industry: z.string().optional(),
  targetAudience: z.string().optional(),
  competitorUrls: z.array(z.string().url()).optional(),
  contentType: z.enum(['blog', 'article', 'webpage', 'product', 'landing']).optional(),
  aiModel: z.enum(['gpt4', 'claude3.5', 'google-ai', 'multi-model']).default('multi-model'),
  analysisDepth: z.enum(['quick', 'standard', 'comprehensive']).default('standard'),
});

// Rate limiting configuration
const rateLimitConfig = {
  'analyze_content': { requests: 20, window: '1h' },
  'generate_gaps': { requests: 10, window: '1h' },
  'optimize_content': { requests: 15, window: '1h' },
  'create_brief': { requests: 25, window: '1h' },
  'predict_performance': { requests: 10, window: '1h' },
  'generate_calendar': { requests: 5, window: '1h' }
};

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validatedData = ContentAnalysisRequestSchema.parse(body);
    const { action, ...analysisData } = validatedData;

    // Rate limiting
    const rateLimitKey = `ai-content-${action}-${session.user.id}`;
    const limit = rateLimitConfig[action];
    
    const rateLimitResult = await rateLimit(rateLimitKey, limit.requests, limit.window);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime,
          remaining: rateLimitResult.remaining
        },
        { status: 429 }
      );
    }

    // Execute AI analysis based on action
    let result;
    const startTime = Date.now();

    switch (action) {
      case 'analyze_content':
        result = await aiContentAnalyzer.analyzeContent({
          content: analysisData.content || '',
          keywords: analysisData.keywords || [],
          industry: analysisData.industry,
          targetAudience: analysisData.targetAudience,
          aiModel: analysisData.aiModel,
          depth: analysisData.analysisDepth
        });
        break;

      case 'generate_gaps':
        result = await aiContentAnalyzer.generateContentGaps({
          keywords: analysisData.keywords || [],
          industry: analysisData.industry || '',
          competitorUrls: analysisData.competitorUrls || [],
          aiModel: analysisData.aiModel
        });
        break;

      case 'optimize_content':
        result = await aiContentAnalyzer.optimizeContent({
          content: analysisData.content || '',
          keywords: analysisData.keywords || [],
          contentType: analysisData.contentType || 'article',
          aiModel: analysisData.aiModel
        });
        break;

      case 'create_brief':
        result = await aiContentAnalyzer.createContentBrief({
          keywords: analysisData.keywords || [],
          industry: analysisData.industry || '',
          targetAudience: analysisData.targetAudience || '',
          contentType: analysisData.contentType || 'article',
          aiModel: analysisData.aiModel
        });
        break;

      case 'predict_performance':
        result = await aiContentAnalyzer.predictPerformance({
          content: analysisData.content || '',
          keywords: analysisData.keywords || [],
          industry: analysisData.industry || '',
          aiModel: analysisData.aiModel
        });
        break;

      case 'generate_calendar':
        result = await aiContentAnalyzer.generateContentCalendar({
          keywords: analysisData.keywords || [],
          industry: analysisData.industry || '',
          targetAudience: analysisData.targetAudience || '',
          aiModel: analysisData.aiModel
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    // Log analytics
    await aiContentAnalyzer.logAnalytics({
      userId: session.user.id,
      action,
      model: analysisData.aiModel,
      processingTime: Date.now() - startTime,
      success: true,
      metadata: {
        contentLength: analysisData.content?.length || 0,
        keywordCount: analysisData.keywords?.length || 0,
        industry: analysisData.industry
      }
    });

    return NextResponse.json({
      success: true,
      action,
      data: result,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      remaining: rateLimitResult.remaining
    });

  } catch (error) {
    console.error('AI Content Analysis API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    // Log error analytics
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        await aiContentAnalyzer.logAnalytics({
          userId: session.user.id,
          action: 'error',
          model: 'unknown',
          processingTime: 0,
          success: false,
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    } catch (logError) {
      console.error('Failed to log error analytics:', logError);
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'AI content analysis failed. Please try again.'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const status = await aiContentAnalyzer.getServiceStatus();
        return NextResponse.json({
          success: true,
          status,
          timestamp: new Date().toISOString()
        });

      case 'analytics':
        const analytics = await aiContentAnalyzer.getUserAnalytics(session.user.id);
        return NextResponse.json({
          success: true,
          analytics,
          timestamp: new Date().toISOString()
        });

      case 'models':
        const models = aiContentAnalyzer.getAvailableModels();
        return NextResponse.json({
          success: true,
          models,
          timestamp: new Date().toISOString()
        });

      case 'limits':
        const limits = await aiContentAnalyzer.getUserLimits(session.user.id);
        return NextResponse.json({
          success: true,
          limits,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('AI Content Analysis GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}