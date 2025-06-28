/**
 * Competitor Tracking API - Feature Detection and Monitoring
 * 
 * Manages competitor tracking setup, feature detection, and competitive intelligence.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { auth } from '@/lib/auth';
import { competitorFeatureTracker } from '@/lib/services/competitor-feature-tracker';
import { analyticsEngine } from '@/lib/analytics/analytics-enhanced';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/innovation/competitors
 * Retrieves competitor tracking data and insights
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const competitorId = searchParams.get('competitorId');
    const timeframe = searchParams.get('timeframe') as 'week' | 'month' | 'quarter' || 'week';
    const teamId = searchParams.get('teamId');

    switch (action) {
      case 'report':
        // Get feature detection report
        const report = await competitorFeatureTracker.getFeatureDetectionReport(timeframe);
        
        return NextResponse.json({
          timeframe,
          summary: report.summary,
          featuresByCategory: report.featuresByCategory,
          threatLevels: report.threatLevels,
          recentDetections: report.recentDetections,
          recentPricingChanges: report.recentPricingChanges,
          recommendations: report.recommendations
        });

      case 'profiles':
        // Get tracked competitor profiles
        const profiles = await getCompetitorProfiles(teamId);
        return NextResponse.json({ profiles });

      case 'detections':
        // Get recent feature detections
        const detections = await getRecentDetections(competitorId, timeframe);
        return NextResponse.json({ detections });

      case 'alerts':
        // Get competitor alerts
        const alerts = await getCompetitorAlerts(teamId, 20);
        return NextResponse.json({ alerts });

      case 'comparison':
        // Get competitor comparison data
        const comparison = await getCompetitorComparison(competitorId);
        return NextResponse.json({ comparison });

      default:
        // Get overview data
        const overview = await getCompetitorOverview(teamId, timeframe);
        return NextResponse.json(overview);
    }
  } catch (error) {
    console.error('Competitor tracking GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve competitor data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/innovation/competitors
 * Sets up new competitor tracking or triggers monitoring
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'setup':
        // Setup new competitor tracking
        const competitorId = await competitorFeatureTracker.setupCompetitorTracking({
          name: data.name,
          domain: data.domain,
          category: data.category,
          productsTracked: data.productsTracked || [],
          trackingUrls: data.trackingUrls,
          checkFrequency: data.checkFrequency || 'daily'
        });

        await analyticsEngine.trackEvent({
          event: 'competitor_tracking_setup',
          properties: {
            userId: session.user.id,
            competitorId,
            competitorName: data.name,
            category: data.category,
            checkFrequency: data.checkFrequency
          }
        });

        return NextResponse.json({
          message: 'Competitor tracking setup successfully',
          competitorId
        });

      case 'monitor':
        // Trigger competitor monitoring
        const features = await competitorFeatureTracker.monitorCompetitors();
        
        return NextResponse.json({
          message: 'Competitor monitoring completed',
          featuresDetected: features.length,
          features: features.slice(0, 10) // Return first 10
        });

      case 'analyze':
        // Analyze specific competitor
        if (!data.competitorId) {
          return NextResponse.json(
            { error: 'Competitor ID required' },
            { status: 400 }
          );
        }

        const analysis = await analyzeCompetitor(data.competitorId);
        return NextResponse.json({ analysis });

      case 'bulk_setup':
        // Setup multiple competitors
        const results = await setupMultipleCompetitors(data.competitors);
        return NextResponse.json({
          message: 'Bulk competitor setup completed',
          results
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Competitor tracking POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process competitor request' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/innovation/competitors
 * Updates competitor tracking settings or marks alerts as read
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, competitorId, ...data } = body;

    switch (action) {
      case 'update_tracking':
        // Update competitor tracking settings
        await updateCompetitorTracking(competitorId, data);
        
        return NextResponse.json({
          message: 'Competitor tracking updated successfully'
        });

      case 'mark_alert_read':
        // Mark competitor alert as read
        await markAlertAsRead(data.alertId, session.user.id);
        
        return NextResponse.json({
          message: 'Alert marked as read'
        });

      case 'update_threat_level':
        // Update threat level for detected feature
        await updateThreatLevel(data.featureId, data.threatLevel, session.user.id);
        
        return NextResponse.json({
          message: 'Threat level updated'
        });

      case 'add_response_plan':
        // Add response plan for competitor feature
        await addResponsePlan(data.featureId, data.responsePlan, session.user.id);
        
        return NextResponse.json({
          message: 'Response plan added'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Competitor tracking PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update competitor data' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/innovation/competitors
 * Removes competitor tracking or archives data
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const competitorId = searchParams.get('competitorId');
    const action = searchParams.get('action') || 'disable';

    if (!competitorId) {
      return NextResponse.json(
        { error: 'Competitor ID required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'disable':
        // Disable competitor tracking
        await disableCompetitorTracking(competitorId, session.user.id);
        
        return NextResponse.json({
          message: 'Competitor tracking disabled'
        });

      case 'archive':
        // Archive competitor data
        await archiveCompetitorData(competitorId, session.user.id);
        
        return NextResponse.json({
          message: 'Competitor data archived'
        });

      case 'remove':
        // Completely remove competitor
        await removeCompetitor(competitorId, session.user.id);
        
        return NextResponse.json({
          message: 'Competitor removed successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Competitor tracking DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove competitor data' },
      { status: 500 }
    );
  }
}

// Helper functions

async function getCompetitorProfiles(teamId?: string) {
  try {
    const profiles = await prisma.competitorProfile.findMany({
      where: {
        isActive: true,
        ...(teamId && { teamId })
      },
      orderBy: { name: 'asc' }
    });

    return profiles.map(profile => ({
      id: profile.id,
      name: profile.name,
      domain: profile.domain,
      category: profile.category,
      productsTracked: profile.productsTracked,
      checkFrequency: profile.checkFrequency,
      lastChecked: profile.lastChecked,
      featuresDetected: 0, // Would be calculated from related data
      threatLevel: 'medium' // Would be calculated
    }));
  } catch (error) {
    console.error('Error getting competitor profiles:', error);
    return [];
  }
}

async function getRecentDetections(competitorId?: string, timeframe: string = 'week') {
  try {
    const startDate = new Date();
    switch (timeframe) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
    }

    const detections = await prisma.featureDetection.findMany({
      where: {
        detectedDate: { gte: startDate },
        ...(competitorId && { competitorId })
      },
      include: {
        competitor: true
      },
      orderBy: { detectedDate: 'desc' },
      take: 50
    });

    return detections.map(detection => ({
      id: detection.id,
      competitor: detection.competitor.name,
      featureName: detection.featureName,
      category: detection.category,
      description: detection.description,
      detectedDate: detection.detectedDate,
      threatLevel: detection.marketAnalysis?.threatLevel || 'medium',
      responseStatus: 'pending' // Would be tracked separately
    }));
  } catch (error) {
    console.error('Error getting recent detections:', error);
    return [];
  }
}

async function getCompetitorAlerts(teamId?: string, limit: number = 20) {
  try {
    const alerts = await prisma.competitorAlert.findMany({
      where: {
        isRead: false,
        ...(teamId && { teamId })
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    return alerts.map(alert => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      competitor: alert.competitor,
      title: alert.title,
      description: alert.description,
      recommendedAction: alert.recommendedAction,
      createdAt: alert.createdAt,
      isRead: alert.isRead
    }));
  } catch (error) {
    console.error('Error getting competitor alerts:', error);
    return [];
  }
}

async function getCompetitorComparison(competitorId?: string) {
  try {
    if (!competitorId) {
      return { error: 'Competitor ID required' };
    }

    // Get competitor profile
    const competitor = await prisma.competitorProfile.findUnique({
      where: { id: competitorId }
    });

    if (!competitor) {
      return { error: 'Competitor not found' };
    }

    // Get recent snapshots for comparison
    const snapshots = await prisma.competitorSnapshot.findMany({
      where: { competitorId },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    // Calculate metrics
    const totalFeatures = snapshots[0]?.featureCount || 0;
    const featureGrowth = snapshots.length > 1 
      ? ((snapshots[0]?.featureCount || 0) - (snapshots[1]?.featureCount || 0))
      : 0;

    return {
      competitor: {
        name: competitor.name,
        domain: competitor.domain,
        category: competitor.category
      },
      metrics: {
        totalFeatures,
        featureGrowth,
        pricingChanges: 0, // Would be calculated from pricing changes
        marketPosition: 'strong', // Would be assessed
        innovationScore: 75 // Would be calculated
      },
      recentActivity: snapshots.slice(0, 3).map(snapshot => ({
        date: snapshot.timestamp,
        changes: snapshot.changes,
        featuresAdded: snapshot.changes?.newFeatures?.length || 0,
        featuresRemoved: snapshot.changes?.removedFeatures?.length || 0
      }))
    };
  } catch (error) {
    console.error('Error getting competitor comparison:', error);
    return { error: 'Failed to load comparison data' };
  }
}

async function getCompetitorOverview(teamId?: string, timeframe: string = 'week') {
  try {
    const startDate = new Date();
    switch (timeframe) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
    }

    // Get summary metrics
    const [totalCompetitors, recentFeatures, recentPricingChanges, unreadAlerts] = await Promise.all([
      prisma.competitorProfile.count({
        where: { 
          isActive: true,
          ...(teamId && { teamId })
        }
      }),
      prisma.featureDetection.count({
        where: {
          detectedDate: { gte: startDate }
        }
      }),
      prisma.pricingChange.count({
        where: {
          detectedDate: { gte: startDate }
        }
      }),
      prisma.competitorAlert.count({
        where: {
          isRead: false,
          ...(teamId && { teamId })
        }
      })
    ]);

    return {
      summary: {
        totalCompetitors,
        recentFeatures,
        recentPricingChanges,
        unreadAlerts,
        threatLevel: calculateOverallThreatLevel(recentFeatures, recentPricingChanges)
      },
      timeframe
    };
  } catch (error) {
    console.error('Error getting competitor overview:', error);
    return {
      summary: {
        totalCompetitors: 0,
        recentFeatures: 0,
        recentPricingChanges: 0,
        unreadAlerts: 0,
        threatLevel: 'low'
      },
      timeframe
    };
  }
}

async function analyzeCompetitor(competitorId: string) {
  // Implementation would perform deep analysis of competitor
  return {
    competitorId,
    analysisDate: new Date(),
    strengths: ['Strong market presence', 'Rapid feature development'],
    weaknesses: ['Limited AI capabilities', 'High pricing'],
    opportunities: ['Partnership potential', 'Technology gaps'],
    threats: ['Aggressive pricing', 'Market expansion'],
    recommendations: ['Monitor pricing strategy', 'Accelerate AI features']
  };
}

async function setupMultipleCompetitors(competitors: any[]) {
  const results = [];
  
  for (const competitor of competitors) {
    try {
      const competitorId = await competitorFeatureTracker.setupCompetitorTracking(competitor);
      results.push({ 
        name: competitor.name, 
        status: 'success', 
        competitorId 
      });
    } catch (error) {
      results.push({ 
        name: competitor.name, 
        status: 'error', 
        error: error.message 
      });
    }
  }
  
  return results;
}

async function updateCompetitorTracking(competitorId: string, data: any) {
  try {
    await prisma.competitorProfile.update({
      where: { id: competitorId },
      data: {
        checkFrequency: data.checkFrequency,
        trackingUrls: data.trackingUrls,
        productsTracked: data.productsTracked
      }
    });
  } catch (error) {
    console.error('Error updating competitor tracking:', error);
    throw error;
  }
}

async function markAlertAsRead(alertId: string, userId: string) {
  try {
    await prisma.competitorAlert.update({
      where: { id: alertId },
      data: {
        isRead: true,
        readAt: new Date(),
        readBy: userId
      }
    });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    throw error;
  }
}

async function updateThreatLevel(featureId: string, threatLevel: string, userId: string) {
  try {
    // Implementation would update threat level in feature detection
    console.log(`Threat level updated for feature ${featureId} to ${threatLevel} by ${userId}`);
  } catch (error) {
    console.error('Error updating threat level:', error);
    throw error;
  }
}

async function addResponsePlan(featureId: string, responsePlan: string, userId: string) {
  try {
    // Implementation would store response plan
    console.log(`Response plan added for feature ${featureId} by ${userId}: ${responsePlan}`);
  } catch (error) {
    console.error('Error adding response plan:', error);
    throw error;
  }
}

async function disableCompetitorTracking(competitorId: string, userId: string) {
  try {
    await prisma.competitorProfile.update({
      where: { id: competitorId },
      data: { isActive: false }
    });
  } catch (error) {
    console.error('Error disabling competitor tracking:', error);
    throw error;
  }
}

async function archiveCompetitorData(competitorId: string, userId: string) {
  try {
    // Implementation would archive competitor data
    console.log(`Competitor data archived for ${competitorId} by ${userId}`);
  } catch (error) {
    console.error('Error archiving competitor data:', error);
    throw error;
  }
}

async function removeCompetitor(competitorId: string, userId: string) {
  try {
    // Implementation would soft delete competitor
    console.log(`Competitor ${competitorId} removed by ${userId}`);
  } catch (error) {
    console.error('Error removing competitor:', error);
    throw error;
  }
}

function calculateOverallThreatLevel(recentFeatures: number, recentPricingChanges: number): string {
  const totalActivity = recentFeatures + (recentPricingChanges * 2);
  
  if (totalActivity >= 10) return 'high';
  if (totalActivity >= 5) return 'medium';
  return 'low';
}