import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { articleId, isHelpful, comment, page, element } = body;

    if (!articleId || typeof isHelpful !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: articleId, isHelpful' },
        { status: 400 }
      );
    }

    // Get user agent and IP for analytics
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Create feedback record
    const feedback = await prisma.articleFeedback.create({
      data: {
        articleId,
        userId: session?.user?.id || null,
        isHelpful,
        comment: comment || null,
        userAgent,
        ipAddress
      }
    });

    // Update article helpfulness counters
    const updateData = isHelpful 
      ? { helpfulVotes: { increment: 1 } }
      : { unhelpfulVotes: { increment: 1 } };

    await prisma.helpArticle.update({
      where: { id: articleId },
      data: updateData
    });

    // Track this as a user success metric if user is logged in
    if (session?.user?.id) {
      try {
        await prisma.userSuccessMetric.create({
          data: {
            userId: session.user.id,
            metricType: 'engagement',
            metricName: 'help-article-feedback',
            value: isHelpful ? 1 : 0,
            unit: 'boolean',
            category: 'support',
            milestone: page ? `help-${page}` : 'help-general'
          }
        });
      } catch (error) {
        console.error('Error tracking help feedback metric:', error);
        // Don't fail the main request
      }
    }

    return NextResponse.json({ success: true, feedback });

  } catch (error) {
    console.error('Error submitting help feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}