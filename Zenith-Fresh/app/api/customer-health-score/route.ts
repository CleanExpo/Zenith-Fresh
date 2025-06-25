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

    const healthScore = await prisma.customerHealthScore.findUnique({
      where: {
        userId: session.user.id
      },
      include: {
        interventions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    });

    if (!healthScore) {
      // Create initial health score if it doesn't exist
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { createdAt: true }
      });

      const daysSinceSignup = user 
        ? Math.floor((new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const newHealthScore = await prisma.customerHealthScore.create({
        data: {
          userId: session.user.id,
          overallScore: 50,
          usageScore: 50,
          engagementScore: 50,
          supportScore: 50,
          satisfactionScore: 50,
          paymentScore: 50,
          riskLevel: 'medium',
          churnProbability: 0.5,
          daysSinceSignup,
          daysInactive: 0,
          loginFrequency: 0,
          totalTickets: 0,
          openTickets: 0,
          accountValue: 0
        },
        include: {
          interventions: true
        }
      });

      return NextResponse.json({ healthScore: newHealthScore });
    }

    return NextResponse.json({ healthScore });

  } catch (error) {
    console.error('Error fetching customer health score:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer health score' },
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

    // Recalculate health score based on current user data
    const updatedScore = await calculateHealthScore(session.user.id);

    return NextResponse.json({ healthScore: updatedScore });

  } catch (error) {
    console.error('Error updating customer health score:', error);
    return NextResponse.json(
      { error: 'Failed to update customer health score' },
      { status: 500 }
    );
  }
}

async function calculateHealthScore(userId: string) {
  try {
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        createdAt: true,
        tier: true,
        auditLogs: {
          where: {
            action: 'login'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 30
        }
      }
    });

    if (!user) throw new Error('User not found');

    // Calculate basic metrics
    const daysSinceSignup = Math.floor(
      (new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const lastLogin = user.auditLogs[0]?.createdAt;
    const daysInactive = lastLogin 
      ? Math.floor((new Date().getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
      : daysSinceSignup;

    const loginFrequency = user.auditLogs.length / Math.max(daysSinceSignup, 1) * 7; // Logins per week

    // Get success metrics
    const successMetrics = await prisma.userSuccessMetric.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 100
    });

    // Get support tickets
    const supportTickets = await prisma.supportTicket.findMany({
      where: { userId },
      select: {
        status: true,
        priority: true,
        satisfactionRating: true,
        createdAt: true,
        resolvedAt: true
      }
    });

    // Get feedback/NPS data
    const npsResponses = await prisma.nPSResponse.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get subscription data (if available)
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    // Calculate component scores
    const usageScore = calculateUsageScore(successMetrics, daysSinceSignup, loginFrequency);
    const engagementScore = calculateEngagementScore(successMetrics, daysInactive);
    const supportScore = calculateSupportScore(supportTickets);
    const satisfactionScore = calculateSatisfactionScore(npsResponses);
    const paymentScore = calculatePaymentScore(subscriptions, user.tier);

    // Calculate overall score
    const overallScore = Math.round((
      usageScore + engagementScore + supportScore + satisfactionScore + paymentScore
    ) / 5);

    // Determine risk level and churn probability
    const { riskLevel, churnProbability } = calculateRiskLevel(
      overallScore,
      daysInactive,
      supportTickets.filter(t => t.status === 'open').length,
      satisfactionScore
    );

    // Update or create health score
    const healthScore = await prisma.customerHealthScore.upsert({
      where: { userId },
      update: {
        overallScore,
        usageScore,
        engagementScore,
        supportScore,
        satisfactionScore,
        paymentScore,
        riskLevel,
        churnProbability,
        lastActive: lastLogin,
        daysInactive,
        loginFrequency,
        totalTickets: supportTickets.length,
        openTickets: supportTickets.filter(t => t.status === 'open').length,
        accountValue: calculateAccountValue(subscriptions),
        daysSinceSignup,
        calculatedAt: new Date()
      },
      create: {
        userId,
        overallScore,
        usageScore,
        engagementScore,
        supportScore,
        satisfactionScore,
        paymentScore,
        riskLevel,
        churnProbability,
        lastActive: lastLogin,
        daysInactive,
        loginFrequency,
        totalTickets: supportTickets.length,
        openTickets: supportTickets.filter(t => t.status === 'open').length,
        accountValue: calculateAccountValue(subscriptions),
        daysSinceSignup
      },
      include: {
        interventions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    // Create intervention if risk is high
    if (riskLevel === 'high' || riskLevel === 'critical') {
      await createInterventionIfNeeded(healthScore.id, riskLevel, overallScore);
    }

    return healthScore;

  } catch (error) {
    console.error('Error calculating health score:', error);
    throw error;
  }
}

function calculateUsageScore(metrics: any[], daysSinceSignup: number, loginFrequency: number): number {
  const featureUsageMetrics = metrics.filter(m => m.metricType === 'feature-adoption');
  const timeToValueMetrics = metrics.filter(m => m.metricType === 'time-to-value');
  
  let score = 50; // Base score

  // Login frequency (0-30 points)
  if (loginFrequency >= 5) score += 30;
  else if (loginFrequency >= 3) score += 20;
  else if (loginFrequency >= 1) score += 10;

  // Feature adoption (0-40 points)
  if (featureUsageMetrics.length >= 5) score += 40;
  else if (featureUsageMetrics.length >= 3) score += 25;
  else if (featureUsageMetrics.length >= 1) score += 10;

  // Time to value (0-30 points)
  if (timeToValueMetrics.length > 0) {
    const avgTimeToValue = timeToValueMetrics.reduce((sum, m) => sum + m.value, 0) / timeToValueMetrics.length;
    if (avgTimeToValue <= 10) score += 30; // 10 minutes or less
    else if (avgTimeToValue <= 30) score += 20;
    else if (avgTimeToValue <= 60) score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

function calculateEngagementScore(metrics: any[], daysInactive: number): number {
  const engagementMetrics = metrics.filter(m => m.metricType === 'engagement');
  
  let score = 50; // Base score

  // Days inactive penalty
  if (daysInactive === 0) score += 30;
  else if (daysInactive <= 3) score += 20;
  else if (daysInactive <= 7) score += 10;
  else if (daysInactive <= 14) score -= 10;
  else if (daysInactive <= 30) score -= 30;
  else score -= 50;

  // Recent engagement activity
  const recentEngagement = engagementMetrics.filter(m => {
    const metricDate = new Date(m.recordedAt);
    const daysSince = (Date.now() - metricDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  });

  if (recentEngagement.length >= 10) score += 20;
  else if (recentEngagement.length >= 5) score += 10;
  else if (recentEngagement.length >= 1) score += 5;

  return Math.min(100, Math.max(0, score));
}

function calculateSupportScore(tickets: any[]): number {
  let score = 100; // Start high, deduct for issues

  const openTickets = tickets.filter(t => t.status === 'open');
  const criticalTickets = tickets.filter(t => t.priority === 'critical' || t.priority === 'urgent');
  
  // Deduct for open tickets
  score -= openTickets.length * 15;
  
  // Deduct more for critical tickets
  score -= criticalTickets.length * 10;
  
  // Deduct for high ticket volume
  if (tickets.length > 10) score -= 20;
  else if (tickets.length > 5) score -= 10;

  // Bonus for good satisfaction ratings
  const ratedTickets = tickets.filter(t => t.satisfactionRating);
  if (ratedTickets.length > 0) {
    const avgRating = ratedTickets.reduce((sum, t) => sum + t.satisfactionRating, 0) / ratedTickets.length;
    if (avgRating >= 4) score += 10;
    else if (avgRating >= 3) score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

function calculateSatisfactionScore(npsResponses: any[]): number {
  if (npsResponses.length === 0) return 50; // Neutral if no data

  const avgNPS = npsResponses.reduce((sum, r) => sum + r.score, 0) / npsResponses.length;
  
  // Convert NPS (0-10) to percentage (0-100)
  let score = (avgNPS / 10) * 100;

  // Bonus for recent positive feedback
  const recentPositive = npsResponses.filter(r => {
    const daysSince = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30 && r.score >= 9;
  });

  if (recentPositive.length > 0) score += 10;

  return Math.min(100, Math.max(0, score));
}

function calculatePaymentScore(subscriptions: any[], tier: string): number {
  let score = 50; // Base score

  if (subscriptions.length === 0) {
    // Free tier
    if (tier === 'free') score = 30;
    return score;
  }

  const activeSubscription = subscriptions.find(s => s.status === 'active');
  if (!activeSubscription) {
    score = 20; // Past due or canceled
    return score;
  }

  // Active subscription bonus
  score += 30;

  // Plan tier bonus
  switch (activeSubscription.plan?.tier) {
    case 'ENTERPRISE':
      score += 20;
      break;
    case 'BUSINESS':
      score += 15;
      break;
    case 'PROFESSIONAL':
      score += 10;
      break;
    case 'STARTER':
      score += 5;
      break;
  }

  return Math.min(100, score);
}

function calculateAccountValue(subscriptions: any[]): number {
  if (subscriptions.length === 0) return 0;
  
  const activeSubscription = subscriptions.find(s => s.status === 'active');
  if (!activeSubscription?.plan) return 0;

  // Return monthly value (convert annual to monthly if needed)
  const amount = activeSubscription.plan.amount / 100; // Convert from cents
  return activeSubscription.plan.billingInterval === 'YEARLY' ? amount / 12 : amount;
}

function calculateRiskLevel(
  overallScore: number, 
  daysInactive: number, 
  openTickets: number,
  satisfactionScore: number
): { riskLevel: string; churnProbability: number } {
  let churnProbability = 0.5;
  let riskLevel = 'medium';

  // Base churn probability on overall score
  churnProbability = 1 - (overallScore / 100);

  // Adjust for specific risk factors
  if (daysInactive > 30) churnProbability += 0.3;
  else if (daysInactive > 14) churnProbability += 0.2;
  else if (daysInactive > 7) churnProbability += 0.1;

  if (openTickets > 3) churnProbability += 0.2;
  else if (openTickets > 1) churnProbability += 0.1;

  if (satisfactionScore < 30) churnProbability += 0.3;
  else if (satisfactionScore < 50) churnProbability += 0.1;

  // Cap probability
  churnProbability = Math.min(0.95, Math.max(0.05, churnProbability));

  // Determine risk level
  if (churnProbability >= 0.8) riskLevel = 'critical';
  else if (churnProbability >= 0.6) riskLevel = 'high';
  else if (churnProbability >= 0.4) riskLevel = 'medium';
  else riskLevel = 'low';

  return { riskLevel, churnProbability };
}

async function createInterventionIfNeeded(healthScoreId: string, riskLevel: string, overallScore: number) {
  // Check if there's already a recent intervention
  const recentIntervention = await prisma.customerIntervention.findFirst({
    where: {
      healthScoreId,
      status: { not: 'completed' },
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    }
  });

  if (recentIntervention) return; // Don't create duplicate interventions

  let interventionType = 'email';
  let title = 'Customer Health Check-in';
  let description = 'Automated check-in due to health score decline.';

  if (riskLevel === 'critical') {
    interventionType = 'call';
    title = 'Urgent: Customer Retention Call';
    description = 'Critical health score requires immediate personal outreach.';
  } else if (riskLevel === 'high') {
    interventionType = 'meeting';
    title = 'Customer Success Meeting';
    description = 'Schedule meeting to address concerns and improve experience.';
  }

  await prisma.customerIntervention.create({
    data: {
      healthScoreId,
      type: interventionType,
      status: 'planned',
      priority: riskLevel === 'critical' ? 'urgent' : 'high',
      title,
      description,
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    }
  });
}