/**
 * Deployment Intelligence API
 * 
 * Provides intelligent deployment insights, monitoring, and analysis
 * through the MongoDB memory system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { DeploymentMemory } from '@/lib/deployment/memory.js';
import { BuildAnalyzer } from '@/lib/deployment/build-analyzer.js';
import { BuildMonitor } from '@/lib/deployment/monitor.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Initialize services
const memory = new DeploymentMemory();
const analyzer = new BuildAnalyzer();
const monitor = new BuildMonitor();

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await memory.initialize();
    await analyzer.initialize();
    await monitor.initialize();
    initialized = true;
  }
}

/**
 * GET /api/deployment/intelligence
 * Get deployment insights, statistics, and recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await ensureInitialized();

    const { searchParams } = new URL(request.url);
    const timeframe = parseInt(searchParams.get('timeframe') || '30');
    const action = searchParams.get('action');

    switch (action) {
      case 'insights':
        const insights = await memory.getDeploymentInsights(timeframe);
        return NextResponse.json({
          success: true,
          data: insights
        });

      case 'active':
        const activeDeployments = monitor.getActiveDeployments();
        return NextResponse.json({
          success: true,
          data: {
            active: activeDeployments,
            count: activeDeployments.length
          }
        });

      case 'analyze':
        const analysis = await analyzer.analyzeProject();
        return NextResponse.json({
          success: true,
          data: analysis
        });

      case 'patterns':
        const commonErrors = await memory.getCommonErrors(
          new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000)
        );
        const topSolutions = await memory.getTopSolutions();
        
        return NextResponse.json({
          success: true,
          data: {
            commonErrors,
            topSolutions,
            timeframe
          }
        });

      case 'monitoring':
        const monitoringInsights = await monitor.getInsights(timeframe);
        return NextResponse.json({
          success: true,
          data: monitoringInsights
        });

      default:
        // Default: return overview
        const overview = await getDeploymentOverview(timeframe);
        return NextResponse.json({
          success: true,
          data: overview
        });
    }
  } catch (error) {
    console.error('❌ Deployment intelligence API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get deployment intelligence',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deployment/intelligence
 * Start deployment monitoring or report events
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await ensureInitialized();

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'start-monitoring':
        const monitoring = await monitor.startDeploymentMonitoring({
          environment: data.environment || 'production',
          projectName: data.projectName || 'zenith-platform',
          triggeredBy: session.user.email || 'unknown'
        });
        
        return NextResponse.json({
          success: true,
          data: monitoring
        });

      case 'report-error':
        if (!data.deploymentId || !data.error) {
          return NextResponse.json(
            { error: 'deploymentId and error are required' },
            { status: 400 }
          );
        }
        
        const errorResult = await monitor.reportError(data.deploymentId, data.error);
        
        return NextResponse.json({
          success: true,
          data: errorResult
        });

      case 'update-phase':
        if (!data.deploymentId || !data.phase) {
          return NextResponse.json(
            { error: 'deploymentId and phase are required' },
            { status: 400 }
          );
        }
        
        const phaseResult = await monitor.updatePhase(
          data.deploymentId, 
          data.phase, 
          data.phaseData || {}
        );
        
        return NextResponse.json({
          success: true,
          data: { updated: phaseResult }
        });

      case 'complete-deployment':
        if (!data.deploymentId || !data.outcome) {
          return NextResponse.json(
            { error: 'deploymentId and outcome are required' },
            { status: 400 }
          );
        }
        
        const completionResult = await monitor.completeDeployment(
          data.deploymentId, 
          data.outcome, 
          data.metrics || {}
        );
        
        return NextResponse.json({
          success: true,
          data: { completed: completionResult }
        });

      case 'log-deployment':
        const deployment = await memory.logDeploymentAttempt({
          ...data,
          triggeredBy: session.user.email || 'unknown',
          timestamp: new Date()
        });
        
        return NextResponse.json({
          success: true,
          data: deployment
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Deployment intelligence POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process deployment action',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * GET deployment overview with key metrics
 */
async function getDeploymentOverview(timeframe: number) {
  try {
    const since = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
    
    // Get basic insights
    const insights = await memory.getDeploymentInsights(timeframe);
    
    // Get recent deployments
    const recentDeployments = await memory.collections.attempts.find({
      timestamp: { $gte: since }
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .toArray();

    // Get prediction accuracy
    const predictionsWithOutcome = await memory.collections.attempts.find({
      timestamp: { $gte: since },
      predictionAccuracy: { $exists: true }
    }).toArray();

    const avgPredictionAccuracy = predictionsWithOutcome.length > 0
      ? predictionsWithOutcome.reduce((sum, dep) => sum + dep.predictionAccuracy, 0) / predictionsWithOutcome.length
      : 0;

    // Get active monitoring
    const activeDeployments = monitor.getActiveDeployments();

    return {
      timeframe,
      overview: {
        totalDeployments: insights?.totalDeployments || 0,
        successRate: insights?.successRate || 0,
        avgDeploymentTime: insights?.avgDeploymentTime || 0,
        predictionAccuracy: avgPredictionAccuracy,
        activeDeployments: activeDeployments.length
      },
      recentDeployments: recentDeployments.map(dep => ({
        deploymentId: dep.deploymentId,
        status: dep.status,
        timestamp: dep.timestamp,
        duration: dep.duration,
        errors: dep.errors?.length || 0,
        environment: dep.environment,
        predictedSuccessRate: dep.predictedSuccessRate
      })),
      commonErrors: insights?.commonErrors?.slice(0, 5) || [],
      topSolutions: insights?.topSolutions?.slice(0, 5) || [],
      recommendation: insights?.recommendation || 'No recommendations available'
    };
  } catch (error) {
    console.error('❌ Failed to get deployment overview:', error);
    throw error;
  }
}