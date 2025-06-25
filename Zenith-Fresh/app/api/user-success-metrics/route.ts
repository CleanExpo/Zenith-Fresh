import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get('metricType');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      userId: session.user.id
    };

    if (metricType) {
      where.metricType = metricType;
    }

    if (category) {
      where.category = category;
    }

    const metrics = await prisma.userSuccessMetric.findMany({
      where,
      orderBy: {
        recordedAt: 'desc'
      },
      take: limit
    });

    // Calculate some aggregated insights
    const insights = {
      totalMetrics: metrics.length,
      averageTimeToValue: 0,
      featureAdoptionRate: 0,
      engagementScore: 0
    };

    // Calculate average time-to-value for completed milestones
    const timeToValueMetrics = metrics.filter(m => m.metricType === 'time-to-value');
    if (timeToValueMetrics.length > 0) {
      insights.averageTimeToValue = timeToValueMetrics.reduce((sum, m) => sum + m.value, 0) / timeToValueMetrics.length;
    }

    // Calculate feature adoption rate
    const featureMetrics = metrics.filter(m => m.metricType === 'feature-adoption');
    if (featureMetrics.length > 0) {
      insights.featureAdoptionRate = featureMetrics.reduce((sum, m) => sum + m.value, 0) / featureMetrics.length;
    }

    // Calculate engagement score
    const engagementMetrics = metrics.filter(m => m.metricType === 'engagement');
    if (engagementMetrics.length > 0) {
      insights.engagementScore = engagementMetrics.reduce((sum, m) => sum + m.value, 0) / engagementMetrics.length;
    }

    return NextResponse.json({
      metrics,
      insights
    });

  } catch (error) {
    console.error('Error fetching user success metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user success metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      metricType,
      metricName,
      value,
      unit,
      category,
      milestone,
      benchmark,
      percentile
    } = body;

    // Validate required fields
    if (!metricType || !metricName || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: metricType, metricName, value' },
        { status: 400 }
      );
    }

    // Create the metric record
    const metric = await prisma.userSuccessMetric.create({
      data: {
        userId: session.user.id,
        metricType,
        metricName,
        value: parseFloat(value.toString()),
        unit,
        category,
        milestone,
        benchmark: benchmark ? parseFloat(benchmark.toString()) : null,
        percentile: percentile ? parseInt(percentile.toString()) : null,
        recordedAt: new Date()
      }
    });

    // Update user onboarding flags if this is a milestone metric
    if (milestone) {
      try {
        const updateData: any = {};
        
        switch (milestone) {
          case 'first-project':
            updateData.hasCreatedProject = true;
            break;
          case 'first-scan':
            updateData.hasRunFirstScan = true;
            break;
          case 'team-invite':
            updateData.hasInvitedTeamMember = true;
            break;
          case 'dashboard-customization':
            updateData.hasCustomizedDashboard = true;
            break;
          case 'notifications-setup':
            updateData.hasSetupNotifications = true;
            break;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.userOnboarding.upsert({
            where: { userId: session.user.id },
            update: updateData,
            create: {
              userId: session.user.id,
              currentStep: 0,
              totalSteps: 5,
              ...updateData
            }
          });
        }
      } catch (error) {
        console.error('Error updating onboarding flags:', error);
        // Don't fail the main request if this fails
      }
    }

    // Update customer health score if relevant
    if (['engagement', 'feature-adoption', 'time-to-value'].includes(metricType)) {
      try {
        await updateCustomerHealthScore(session.user.id, metricType, value);
      } catch (error) {
        console.error('Error updating customer health score:', error);
        // Don't fail the main request if this fails
      }
    }

    return NextResponse.json({ success: true, metric });

  } catch (error) {
    console.error('Error creating user success metric:', error);
    return NextResponse.json(
      { error: 'Failed to create user success metric' },
      { status: 500 }
    );
  }
}

async function updateCustomerHealthScore(userId: string, metricType: string, value: number) {
  // Get or create customer health score
  const healthScore = await prisma.customerHealthScore.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      overallScore: 50,
      usageScore: 50,
      engagementScore: 50,
      supportScore: 50,
      satisfactionScore: 50,
      paymentScore: 50
    }
  });

  // Calculate new scores based on metric type
  let updateData: any = {};

  switch (metricType) {
    case 'engagement':
      // Engagement metrics are typically 0-1, convert to 0-100
      updateData.engagementScore = Math.min(100, Math.max(0, value * 100));
      break;
    case 'feature-adoption':
      // Feature adoption rate, typically 0-1, convert to 0-100
      updateData.usageScore = Math.min(100, Math.max(0, value * 100));
      break;
    case 'time-to-value':
      // Lower time-to-value is better, so invert the score
      // Assuming good time-to-value is under 60 minutes
      const timeScore = Math.max(0, 100 - (value / 60) * 100);
      updateData.usageScore = Math.min(100, timeScore);
      break;
  }

  if (Object.keys(updateData).length > 0) {
    // Calculate new overall score as average of all component scores
    const currentScores = {
      usageScore: updateData.usageScore || healthScore.usageScore,
      engagementScore: updateData.engagementScore || healthScore.engagementScore,
      supportScore: healthScore.supportScore,
      satisfactionScore: healthScore.satisfactionScore,
      paymentScore: healthScore.paymentScore
    };

    const overallScore = Math.round(
      (currentScores.usageScore + 
       currentScores.engagementScore + 
       currentScores.supportScore + 
       currentScores.satisfactionScore + 
       currentScores.paymentScore) / 5
    );

    // Determine risk level based on overall score
    let riskLevel = 'medium';
    let churnProbability = 0.5;

    if (overallScore >= 80) {
      riskLevel = 'low';
      churnProbability = 0.1;
    } else if (overallScore >= 60) {
      riskLevel = 'medium';
      churnProbability = 0.3;
    } else if (overallScore >= 40) {
      riskLevel = 'high';
      churnProbability = 0.7;
    } else {
      riskLevel = 'critical';
      churnProbability = 0.9;
    }

    updateData.overallScore = overallScore;
    updateData.riskLevel = riskLevel;
    updateData.churnProbability = churnProbability;
    updateData.calculatedAt = new Date();

    await prisma.customerHealthScore.update({
      where: { userId },
      data: updateData
    });
  }
}