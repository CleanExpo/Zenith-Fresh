import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { IntentAnalysisAgent, type ClientIntent, type ClarificationDialogue } from '@/lib/agents/intent-analysis-agent';

/**
 * INTENT ANALYSIS API ENDPOINT
 * 
 * The critical translation layer between human requests and agent execution
 * Converts ambiguous client goals into precise technical instructions
 * 
 * Features:
 * - Initial intent analysis with confidence scoring
 * - Clarifying dialogue generation
 * - Technical brief creation
 * - Agent sequence recommendations
 */

// Validation schemas
const AnalyzeIntentSchema = z.object({
  clientRequest: z.string().min(1, 'Client request is required'),
  conversationHistory: z.array(z.object({
    clientMessage: z.string(),
    agentResponse: z.string(),
    timestamp: z.string(),
    status: z.enum(['CLARIFYING', 'READY', 'NEEDS_MORE_INFO'])
  })).optional().default([])
});

const ClarifyRequestSchema = z.object({
  clientRequest: z.string().min(1, 'Client request is required'),
  conversationHistory: z.array(z.object({
    clientMessage: z.string(),
    agentResponse: z.string(),
    timestamp: z.string(),
    status: z.enum(['CLARIFYING', 'READY', 'NEEDS_MORE_INFO'])
  })).optional().default([])
});

const GenerateBriefSchema = z.object({
  originalRequest: z.string().min(1, 'Original request is required'),
  conversationHistory: z.array(z.object({
    clientMessage: z.string(),
    agentResponse: z.string(),
    timestamp: z.string(),
    status: z.enum(['CLARIFYING', 'READY', 'NEEDS_MORE_INFO'])
  })).min(1, 'Conversation history required for brief generation')
});

/**
 * POST /api/agents/intent-analysis - Primary intent analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const intentAgent = new IntentAnalysisAgent();

    switch (action) {
      case 'analyze': {
        const { clientRequest, conversationHistory } = AnalyzeIntentSchema.parse(body);
        
        console.log('🧠 INTENT ANALYSIS: Analyzing client request:', clientRequest);
        
        const analysis = await intentAgent.analyzeIntent(clientRequest, conversationHistory);
        
        return NextResponse.json({
          success: true,
          analysis,
          message: `Intent analyzed with ${analysis.confidence}% confidence`,
          timestamp: new Date().toISOString()
        });
      }

      case 'clarify': {
        const { clientRequest, conversationHistory } = ClarifyRequestSchema.parse(body);
        
        console.log('💬 INTENT ANALYSIS: Generating clarifying response');
        
        const clarifyingResponse = await intentAgent.generateClarifyingResponse(
          clientRequest, 
          conversationHistory
        );
        
        return NextResponse.json({
          success: true,
          response: clarifyingResponse,
          message: 'Clarifying response generated',
          timestamp: new Date().toISOString()
        });
      }

      case 'generate-brief': {
        const { originalRequest, conversationHistory } = GenerateBriefSchema.parse(body);
        
        console.log('📋 INTENT ANALYSIS: Generating technical brief');
        
        const technicalBrief = await intentAgent.generateTechnicalBrief(
          originalRequest,
          conversationHistory
        );

        // Generate agent sequence
        const agentSequence = intentAgent.suggestAgentSequence(technicalBrief.brief);
        
        return NextResponse.json({
          success: true,
          technicalBrief,
          agentSequence,
          message: 'Technical brief generated successfully',
          timestamp: new Date().toISOString()
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: analyze, clarify, or generate-brief'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('🚨 INTENT ANALYSIS ERROR:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Intent analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/agents/intent-analysis - Get agent capabilities
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    agent: 'IntentAnalysisAgent',
    version: '1.0.0',
    capabilities: {
      analyze: 'Analyze client requests for clarity and confidence',
      clarify: 'Generate clarifying questions and responses',
      generateBrief: 'Convert clarified intent into technical specifications',
      suggestAgents: 'Recommend agent sequences for task execution'
    },
    supportedActions: ['analyze', 'clarify', 'generate-brief'],
    exampleUsage: {
      analyze: {
        action: 'analyze',
        clientRequest: 'Build a page for my summer sale',
        conversationHistory: []
      },
      clarify: {
        action: 'clarify',
        clientRequest: 'Make it better',
        conversationHistory: []
      },
      generateBrief: {
        action: 'generate-brief',
        originalRequest: 'Build a landing page',
        conversationHistory: [
          {
            clientMessage: 'Build a landing page',
            agentResponse: 'What\'s the primary goal - lead generation or sales?',
            timestamp: new Date().toISOString(),
            status: 'CLARIFYING'
          },
          {
            clientMessage: 'Lead generation for my email list',
            agentResponse: 'Perfect! I\'ll create a conversion-optimized landing page.',
            timestamp: new Date().toISOString(),
            status: 'READY'
          }
        ]
      }
    },
    message: 'Intent Analysis Agent ready for human-to-technical translation'
  });
}
