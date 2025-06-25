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
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      userId: session.user.id
    };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [feedback, total] = await Promise.all([
      prisma.userFeedback.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset,
        include: {
          votes: {
            select: {
              voteType: true,
              userId: true
            }
          }
        }
      }),
      prisma.userFeedback.count({ where })
    ]);

    return NextResponse.json({
      feedback,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const {
      type,
      category,
      title,
      message,
      rating,
      experience,
      page,
      feature,
      screenshot
    } = body;

    // Validate required fields
    if (!type || (!message?.trim() && !rating)) {
      return NextResponse.json(
        { error: 'Missing required fields: type and message or rating' },
        { status: 400 }
      );
    }

    // Get user agent and IP for analytics
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Determine category based on type if not provided
    let feedbackCategory = category;
    if (!feedbackCategory) {
      switch (type) {
        case 'bug-report':
          feedbackCategory = 'technical';
          break;
        case 'feature-request':
          feedbackCategory = 'feature';
          break;
        case 'nps':
          feedbackCategory = 'satisfaction';
          break;
        default:
          feedbackCategory = 'general';
      }
    }

    // Create feedback record
    const feedback = await prisma.userFeedback.create({
      data: {
        userId: session?.user?.id || null,
        type,
        category: feedbackCategory,
        title: title || null,
        message: message || '',
        rating: rating ? parseInt(rating.toString()) : null,
        experience,
        page,
        feature,
        screenshot,
        userAgent,
        ipAddress,
        status: 'new',
        priority: determinePriority(type, rating)
      }
    });

    // Track this as a user success metric if user is logged in
    if (session?.user?.id) {
      try {
        await prisma.userSuccessMetric.create({
          data: {
            userId: session.user.id,
            metricType: 'engagement',
            metricName: 'feedback-submission',
            value: 1,
            unit: 'count',
            category: 'support',
            milestone: `feedback-${type}`
          }
        });

        // For NPS feedback, also track the score
        if (type === 'nps' && rating !== undefined) {
          await prisma.userSuccessMetric.create({
            data: {
              userId: session.user.id,
              metricType: 'satisfaction',
              metricName: 'nps-score',
              value: rating,
              unit: 'score',
              category: 'satisfaction',
              milestone: 'nps-feedback'
            }
          });

          // Update customer health score
          await updateCustomerHealthScore(session.user.id, rating, experience);
        }
      } catch (error) {
        console.error('Error tracking feedback metrics:', error);
        // Don't fail the main request
      }
    }

    // Send notification to support team for high-priority feedback
    if (feedback.priority === 'high' || type === 'bug-report') {
      try {
        await notifySupportTeam(feedback);
      } catch (error) {
        console.error('Error sending support notification:', error);
        // Don't fail the main request
      }
    }

    return NextResponse.json({ success: true, feedback });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { feedbackId, voteType } = body;

    if (!feedbackId || !voteType || !['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Invalid feedback ID or vote type' },
        { status: 400 }
      );
    }

    // Check if user already voted on this feedback
    const existingVote = await prisma.feedbackVote.findUnique({
      where: {
        feedbackId_userId: {
          feedbackId,
          userId: session.user.id
        }
      }
    });

    if (existingVote) {
      // Update existing vote
      await prisma.feedbackVote.update({
        where: {
          feedbackId_userId: {
            feedbackId,
            userId: session.user.id
          }
        },
        data: {
          voteType
        }
      });
    } else {
      // Create new vote
      await prisma.feedbackVote.create({
        data: {
          feedbackId,
          userId: session.user.id,
          voteType
        }
      });
    }

    // Update feedback upvote count
    const upvotes = await prisma.feedbackVote.count({
      where: {
        feedbackId,
        voteType: 'upvote'
      }
    });

    await prisma.userFeedback.update({
      where: { id: feedbackId },
      data: { upvotes }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error voting on feedback:', error);
    return NextResponse.json(
      { error: 'Failed to vote on feedback' },
      { status: 500 }
    );
  }
}

function determinePriority(type: string, rating?: number): string {
  if (type === 'bug-report') {
    return 'high';
  }
  
  if (type === 'nps' && rating !== undefined) {
    // Detractors (0-6) are high priority
    if (rating <= 6) {
      return 'high';
    }
    // Passives (7-8) are medium priority
    if (rating <= 8) {
      return 'medium';
    }
    // Promoters (9-10) are low priority for follow-up
    return 'low';
  }
  
  return 'medium';
}

async function updateCustomerHealthScore(userId: string, npsScore: number, experience?: string) {
  try {
    // Calculate satisfaction score based on NPS and experience
    let satisfactionScore = Math.round((npsScore / 10) * 100);
    
    if (experience) {
      const experienceBonus = {
        'poor': -20,
        'fair': -10,
        'good': 0,
        'very-good': 10,
        'excellent': 20
      }[experience] || 0;
      
      satisfactionScore = Math.max(0, Math.min(100, satisfactionScore + experienceBonus));
    }

    // Update customer health score
    const healthScore = await prisma.customerHealthScore.upsert({
      where: { userId },
      update: {
        satisfactionScore,
        calculatedAt: new Date()
      },
      create: {
        userId,
        overallScore: 50,
        usageScore: 50,
        engagementScore: 50,
        supportScore: 50,
        satisfactionScore,
        paymentScore: 50
      }
    });

    // Recalculate overall score
    const overallScore = Math.round((
      healthScore.usageScore +
      healthScore.engagementScore +
      healthScore.supportScore +
      satisfactionScore +
      healthScore.paymentScore
    ) / 5);

    // Update risk level
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

    await prisma.customerHealthScore.update({
      where: { userId },
      data: {
        overallScore,
        riskLevel,
        churnProbability,
        calculatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error updating customer health score:', error);
  }
}

async function notifySupportTeam(feedback: any) {
  // This would integrate with your notification system
  // For now, we'll just log it
  console.log('High priority feedback received:', {
    id: feedback.id,
    type: feedback.type,
    priority: feedback.priority,
    userId: feedback.userId
  });
  
  // You could integrate with:
  // - Slack webhook
  // - Email notification
  // - In-app notification system
  // - Support ticket creation
}