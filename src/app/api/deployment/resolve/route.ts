/**
 * Deployment Error Resolution API
 * 
 * Intelligent error resolution using the AutoResolver system
 * with MongoDB-backed pattern recognition and solution application.
 */

import { NextRequest, NextResponse } from 'next/server';
import { DeploymentMemory, AutoResolver } from '@/lib/deployment/memory.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Initialize services
const memory = new DeploymentMemory();
const resolver = new AutoResolver(memory);

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await memory.initialize();
    initialized = true;
  }
}

/**
 * POST /api/deployment/resolve
 * Analyze error and get intelligent resolution suggestions
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
    const { action, error, deploymentId, solutionId, context } = body;

    switch (action) {
      case 'analyze':
        if (!error?.errorMessage) {
          return NextResponse.json(
            { error: 'Error message is required' },
            { status: 400 }
          );
        }

        const resolution = await resolver.resolveError(error);
        
        if (!resolution) {
          return NextResponse.json({
            success: true,
            data: {
              found: false,
              message: 'No known solutions found for this error pattern',
              recommendations: [
                'Check the error logs for more context',
                'Search the documentation for similar issues',
                'Consider manual debugging steps'
              ]
            }
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            found: true,
            solution: resolution.solution,
            confidence: resolution.confidence,
            alternatives: resolution.alternatives,
            similarCases: resolution.similar,
            autoResolvable: resolution.solution.automationSafe && resolution.confidence > 0.8
          }
        });

      case 'apply':
        if (!solutionId) {
          return NextResponse.json(
            { error: 'Solution ID is required' },
            { status: 400 }
          );
        }

        // Get the solution from database
        const solutionDoc = await memory.collections.solutions.findOne({
          'solutions.id': solutionId
        });

        if (!solutionDoc) {
          return NextResponse.json(
            { error: 'Solution not found' },
            { status: 404 }
          );
        }

        const solution = solutionDoc.solutions.find(s => s.id === solutionId);
        if (!solution) {
          return NextResponse.json(
            { error: 'Solution not found in document' },
            { status: 404 }
          );
        }

        // Apply the solution
        const applicationResult = await resolver.applySolution(solution, {
          deploymentId,
          ...context
        });

        // Update solution effectiveness
        if (deploymentId) {
          await memory.updateSolutionEffectiveness(solution, applicationResult.success);
        }

        return NextResponse.json({
          success: true,
          data: {
            applied: applicationResult.success,
            result: applicationResult,
            solutionId,
            message: applicationResult.success 
              ? 'Solution applied successfully' 
              : `Solution failed: ${applicationResult.reason}`
          }
        });

      case 'feedback':
        if (!solutionId || typeof body.effectiveness !== 'number') {
          return NextResponse.json(
            { error: 'Solution ID and effectiveness rating are required' },
            { status: 400 }
          );
        }

        // Update solution effectiveness based on user feedback
        await memory.collections.solutions.updateOne(
          { 'solutions.id': solutionId },
          {
            $set: {
              'solutions.$.userRating': body.effectiveness,
              'solutions.$.lastUsed': new Date()
            },
            $inc: {
              'solutions.$.timesApplied': 1,
              'solutions.$.timesSuccessful': body.successful ? 1 : 0
            }
          }
        );

        return NextResponse.json({
          success: true,
          data: {
            message: 'Feedback recorded successfully',
            solutionId
          }
        });

      case 'learn':
        if (!error?.errorMessage || !body.solution) {
          return NextResponse.json(
            { error: 'Error message and solution are required' },
            { status: 400 }
          );
        }

        // Learn from user-provided solution
        const newSolutionId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const pattern = resolver.extractErrorPattern(error.errorMessage);

        // Check if pattern already exists
        let solutionDocument = await memory.collections.solutions.findOne({
          errorPattern: { $regex: pattern, $options: 'i' }
        });

        if (solutionDocument) {
          // Add solution to existing pattern
          await memory.collections.solutions.updateOne(
            { _id: solutionDocument._id },
            {
              $push: {
                solutions: {
                  id: newSolutionId,
                  description: body.solution.description,
                  code: body.solution.code || '',
                  commands: body.solution.commands || [],
                  fileChanges: body.solution.fileChanges || [],
                  successRate: 0.8, // Start with good confidence for user solutions
                  effectiveness: 7,
                  timesApplied: 1,
                  timesSuccessful: 1,
                  averageFixTime: body.solution.fixTime || 5,
                  automationSafe: body.solution.automationSafe || false,
                  lastUsed: new Date()
                }
              },
              $set: {
                updatedAt: new Date()
              }
            }
          );
        } else {
          // Create new pattern
          solutionDocument = {
            errorPattern: pattern,
            errorType: error.errorType || 'user-reported',
            file: error.file || '**/*',
            framework: 'nextjs',
            commonCauses: [error.errorMessage],
            solutions: [{
              id: newSolutionId,
              description: body.solution.description,
              code: body.solution.code || '',
              commands: body.solution.commands || [],
              fileChanges: body.solution.fileChanges || [],
              successRate: 0.8,
              effectiveness: 7,
              timesApplied: 1,
              timesSuccessful: 1,
              averageFixTime: body.solution.fixTime || 5,
              automationSafe: body.solution.automationSafe || false,
              lastUsed: new Date()
            }],
            preventionSteps: body.solution.preventionSteps || [],
            relatedErrors: [],
            confidence: 0.8,
            verified: false, // User solutions need verification
            tags: ['user-contributed', error.errorType || 'unknown'],
            createdAt: new Date(),
            updatedAt: new Date()
          };

          await memory.collections.solutions.insertOne(solutionDocument);
        }

        return NextResponse.json({
          success: true,
          data: {
            message: 'Solution learned successfully',
            solutionId: newSolutionId,
            pattern
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Deployment resolution API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process resolution request',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/deployment/resolve
 * Get available solutions and patterns
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
    const action = searchParams.get('action');
    const pattern = searchParams.get('pattern');
    const errorType = searchParams.get('errorType');

    switch (action) {
      case 'solutions':
        if (!pattern) {
          return NextResponse.json(
            { error: 'Pattern parameter is required' },
            { status: 400 }
          );
        }

        const solutions = await memory.getSuccessfulSolutions(pattern, errorType);
        
        return NextResponse.json({
          success: true,
          data: {
            pattern,
            solutions: solutions.slice(0, 10), // Limit results
            count: solutions.length
          }
        });

      case 'patterns':
        const patterns = await memory.collections.solutions.find({
          verified: true
        })
        .sort({ 'solutions.effectiveness': -1 })
        .limit(20)
        .toArray();

        return NextResponse.json({
          success: true,
          data: {
            patterns: patterns.map(p => ({
              errorPattern: p.errorPattern,
              errorType: p.errorType,
              framework: p.framework,
              solutionCount: p.solutions.length,
              topEffectiveness: Math.max(...p.solutions.map(s => s.effectiveness)),
              verified: p.verified,
              tags: p.tags
            }))
          }
        });

      case 'statistics':
        const stats = await getResolutionStatistics();
        
        return NextResponse.json({
          success: true,
          data: stats
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Deployment resolution GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get resolution data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Get resolution system statistics
 */
async function getResolutionStatistics() {
  try {
    const totalSolutions = await memory.collections.solutions.countDocuments();
    const verifiedSolutions = await memory.collections.solutions.countDocuments({ verified: true });
    
    // Get effectiveness distribution
    const effectivenessStats = await memory.collections.solutions.aggregate([
      { $unwind: '$solutions' },
      {
        $group: {
          _id: null,
          avgEffectiveness: { $avg: '$solutions.effectiveness' },
          avgSuccessRate: { $avg: '$solutions.successRate' },
          totalApplications: { $sum: '$solutions.timesApplied' },
          totalSuccesses: { $sum: '$solutions.timesSuccessful' }
        }
      }
    ]).toArray();

    const stats = effectivenessStats[0] || {};
    
    return {
      totalPatterns: totalSolutions,
      verifiedPatterns: verifiedSolutions,
      averageEffectiveness: stats.avgEffectiveness || 0,
      averageSuccessRate: stats.avgSuccessRate || 0,
      totalApplications: stats.totalApplications || 0,
      totalSuccesses: stats.totalSuccesses || 0,
      overallSuccessRate: stats.totalApplications > 0 
        ? stats.totalSuccesses / stats.totalApplications 
        : 0
    };
  } catch (error) {
    console.error('❌ Failed to get resolution statistics:', error);
    return {
      totalPatterns: 0,
      verifiedPatterns: 0,
      averageEffectiveness: 0,
      averageSuccessRate: 0,
      totalApplications: 0,
      totalSuccesses: 0,
      overallSuccessRate: 0
    };
  }
}