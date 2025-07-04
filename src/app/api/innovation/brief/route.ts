/**
 * Innovation Brief API - Weekly Intelligence Reports
 * 
 * Manages innovation briefs including generation, retrieval, and sharing.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { auth } from '@/lib/auth';
import { innovationBriefGenerator } from '@/lib/services/innovation-brief-generator';
import { analyticsEngine } from '@/lib/analytics/analytics-enhanced';

/**
 * GET /api/innovation/brief
 * Retrieves innovation briefs with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const briefId = searchParams.get('id');
    const teamId = searchParams.get('teamId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const latest = searchParams.get('latest') === 'true';

    if (briefId) {
      // Get specific brief
      const brief = await innovationBriefGenerator.getLatestBrief(teamId || undefined);
      if (!brief || brief.id !== briefId) {
        return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
      }
      return NextResponse.json(brief);
    }

    if (latest) {
      // Get latest brief
      const brief = await innovationBriefGenerator.getLatestBrief(teamId || undefined);
      if (!brief) {
        return NextResponse.json({ error: 'No briefs found' }, { status: 404 });
      }
      return NextResponse.json(brief);
    }

    // Get brief history
    const briefs = await innovationBriefGenerator.getBriefHistory(teamId || undefined, limit);
    
    const response = {
      briefs: briefs.map(brief => ({
        id: brief.id,
        weekEnding: brief.weekEnding,
        executiveSummary: brief.executiveSummary,
        confidence: brief.confidence,
        metrics: brief.metrics,
        strategicRecommendations: brief.strategicRecommendations?.length || 0,
        threatAssessment: brief.threatAssessment?.length || 0,
        nextActions: brief.nextActions?.length || 0
      })),
      total: briefs.length
    };

    // Track brief access
    await analyticsEngine.trackEvent({
      event: 'innovation_brief_accessed',
      properties: {
        userId: session.user.id,
        teamId,
        briefsCount: briefs.length,
        requestType: latest ? 'latest' : 'history'
      }
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Innovation brief GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve innovation brief' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/innovation/brief
 * Generates a new innovation brief
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      teamId,
      focusAreas = [],
      includeConfidential = false,
      urgentGeneration = false
    } = body;

    console.log('🚀 Generating innovation brief...');

    // Generate brief
    const brief = await innovationBriefGenerator.generateWeeklyBrief({
      teamId,
      focusAreas,
      includeConfidential
    });

    // Track brief generation
    await analyticsEngine.trackEvent({
      event: 'innovation_brief_generated',
      properties: {
        userId: session.user.id,
        teamId,
        briefId: brief.id,
        confidence: brief.confidence,
        focusAreas,
        includeConfidential,
        urgentGeneration,
        keyFindings: {
          technologyTrends: brief.keyFindings.technologyTrends?.length || 0,
          competitorMoves: brief.keyFindings.competitorMoves?.length || 0,
          researchBreakthroughs: brief.keyFindings.researchBreakthroughs?.length || 0
        },
        metrics: brief.metrics
      }
    });

    return NextResponse.json({
      message: 'Innovation brief generated successfully',
      brief: {
        id: brief.id,
        weekEnding: brief.weekEnding,
        confidence: brief.confidence,
        metrics: brief.metrics,
        url: `/innovation/brief/${brief.id}`
      }
    });
  } catch (error) {
    console.error('Innovation brief generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate innovation brief' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/innovation/brief
 * Updates brief settings or triggers regeneration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, briefId, ...data } = body;

    switch (action) {
      case 'regenerate':
        // Regenerate brief with new parameters
        const newBrief = await innovationBriefGenerator.generateWeeklyBrief({
          teamId: data.teamId,
          focusAreas: data.focusAreas,
          includeConfidential: data.includeConfidential
        });
        
        return NextResponse.json({
          message: 'Brief regenerated successfully',
          briefId: newBrief.id
        });

      case 'mark_action_complete':
        // Mark an action item as complete
        await markActionComplete(briefId, data.actionId, session.user.id);
        
        return NextResponse.json({
          message: 'Action marked as complete'
        });

      case 'add_feedback':
        // Add feedback to brief
        await addBriefFeedback(briefId, data.feedback, session.user.id);
        
        return NextResponse.json({
          message: 'Feedback added successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Innovation brief update error:', error);
    return NextResponse.json(
      { error: 'Failed to update brief' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/innovation/brief
 * Archives or deletes innovation briefs
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const briefId = searchParams.get('id');
    const archive = searchParams.get('archive') === 'true';

    if (!briefId) {
      return NextResponse.json(
        { error: 'Brief ID required' },
        { status: 400 }
      );
    }

    if (archive) {
      // Archive brief instead of deleting
      await archiveBrief(briefId, session.user.id);
      return NextResponse.json({ message: 'Brief archived successfully' });
    } else {
      // Soft delete brief
      await deleteBrief(briefId, session.user.id);
      return NextResponse.json({ message: 'Brief deleted successfully' });
    }
  } catch (error) {
    console.error('Innovation brief delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete brief' },
      { status: 500 }
    );
  }
}

// Helper functions

async function markActionComplete(briefId: string, actionId: string, userId: string) {
  try {
    // Implementation would update action status in database
    console.log(`Action ${actionId} marked complete for brief ${briefId} by user ${userId}`);
    
    // Track analytics
    await analyticsEngine.trackEvent({
      event: 'innovation_action_completed',
      properties: {
        briefId,
        actionId,
        userId,
        completedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error marking action complete:', error);
    throw error;
  }
}

async function addBriefFeedback(briefId: string, feedback: string, userId: string) {
  try {
    // Implementation would store feedback in database
    console.log(`Feedback added to brief ${briefId} by user ${userId}: ${feedback}`);
    
    // Track analytics
    await analyticsEngine.trackEvent({
      event: 'innovation_brief_feedback',
      properties: {
        briefId,
        userId,
        feedbackLength: feedback.length,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error adding brief feedback:', error);
    throw error;
  }
}

async function archiveBrief(briefId: string, userId: string) {
  try {
    // Implementation would mark brief as archived
    console.log(`Brief ${briefId} archived by user ${userId}`);
    
    await analyticsEngine.trackEvent({
      event: 'innovation_brief_archived',
      properties: {
        briefId,
        userId,
        archivedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error archiving brief:', error);
    throw error;
  }
}

async function deleteBrief(briefId: string, userId: string) {
  try {
    // Implementation would soft delete brief
    console.log(`Brief ${briefId} deleted by user ${userId}`);
    
    await analyticsEngine.trackEvent({
      event: 'innovation_brief_deleted',
      properties: {
        briefId,
        userId,
        deletedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error deleting brief:', error);
    throw error;
  }
}