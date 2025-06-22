import { NextRequest, NextResponse } from 'next/server';
import { TruthAgent, type TruthResponse } from '@/lib/agents/truth-agent';

/**
 * TRUTH AGENT API ENDPOINT
 * 
 * Master Admin Only: Provides honest system assessment
 * No false positives - tests actual functionality
 * 
 * Authentication: Requires MASTER_TOKEN in Authorization header
 * Usage: GET /api/admin/truth-assessment
 */
export async function GET(request: NextRequest): Promise<NextResponse<TruthResponse>> {
  try {
    // Check master admin access
    if (!TruthAgent.isMasterUser(request)) {
      return NextResponse.json({
        success: false,
        assessment: {
          overallScore: 0,
          status: 'CRITICAL' as const,
          timestamp: new Date().toISOString(),
          buildReady: false,
          issues: [{
            severity: 'CRITICAL' as const,
            category: 'SECURITY' as const,
            description: 'Unauthorized access attempt',
            tested: true
          }],
          recommendations: ['Access denied - master credentials required'],
          deploymentRisk: 'HIGH' as const
        },
        message: 'Access denied - master credentials required',
        access: 'DENIED'
      }, { status: 401 });
    }

    console.log('🔍 TRUTH AGENT: Master admin assessment requested');

    // Run honest system assessment
    const truthAgent = new TruthAgent();
    const assessment = await truthAgent.runTruthAssessment();

    return NextResponse.json({
      success: true,
      assessment,
      message: `Truth assessment complete - Score: ${assessment.overallScore}/100`,
      access: 'MASTER'
    });

  } catch (error) {
    console.error('🚨 TRUTH AGENT ERROR:', error);
    
    return NextResponse.json({
      success: false,
      assessment: {
        overallScore: 0,
        status: 'CRITICAL' as const,
        timestamp: new Date().toISOString(),
        buildReady: false,
        issues: [{
          severity: 'CRITICAL' as const,
          category: 'BUILD' as const,
          description: `Truth Agent error: ${error}`,
          tested: true
        }],
        recommendations: ['Fix Truth Agent system error'],
        deploymentRisk: 'HIGH' as const
      },
      message: 'Truth Agent system error',
      access: 'MASTER'
    }, { status: 500 });
  }
}

/**
 * FORCE REBUILD ENDPOINT
 * 
 * Master Admin Only: Forces immediate rebuild assessment
 * POST /api/admin/truth-assessment
 */
export async function POST(request: NextRequest): Promise<NextResponse<TruthResponse>> {
  try {
    // Check master admin access
    if (!TruthAgent.isMasterUser(request)) {
      return NextResponse.json({
        success: false,
        assessment: {
          overallScore: 0,
          status: 'CRITICAL' as const,
          timestamp: new Date().toISOString(),
          buildReady: false,
          issues: [{
            severity: 'CRITICAL' as const,
            category: 'SECURITY' as const,
            description: 'Unauthorized rebuild attempt',
            tested: true
          }],
          recommendations: ['Access denied - master credentials required'],
          deploymentRisk: 'HIGH' as const
        },
        message: 'Access denied - master credentials required',
        access: 'DENIED'
      }, { status: 401 });
    }

    console.log('🔄 TRUTH AGENT: Force rebuild assessment requested');

    // Force fresh assessment
    const truthAgent = new TruthAgent();
    const assessment = await truthAgent.runTruthAssessment();

    // Log honest results
    console.log(`📊 TRUTH AGENT RESULTS:`);
    console.log(`   Score: ${assessment.overallScore}/100`);
    console.log(`   Status: ${assessment.status}`);
    console.log(`   Build Ready: ${assessment.buildReady}`);
    console.log(`   Issues: ${assessment.issues.length}`);
    console.log(`   Risk: ${assessment.deploymentRisk}`);

    return NextResponse.json({
      success: true,
      assessment,
      message: `Force rebuild assessment complete - Score: ${assessment.overallScore}/100`,
      access: 'MASTER'
    });

  } catch (error) {
    console.error('🚨 TRUTH AGENT REBUILD ERROR:', error);
    
    return NextResponse.json({
      success: false,
      assessment: {
        overallScore: 0,
        status: 'CRITICAL' as const,
        timestamp: new Date().toISOString(),
        buildReady: false,
        issues: [{
          severity: 'CRITICAL' as const,
          category: 'BUILD' as const,
          description: `Force rebuild error: ${error}`,
          tested: true
        }],
        recommendations: ['Fix Truth Agent rebuild system'],
        deploymentRisk: 'HIGH' as const
      },
      message: 'Force rebuild system error',
      access: 'MASTER'
    }, { status: 500 });
  }
}
