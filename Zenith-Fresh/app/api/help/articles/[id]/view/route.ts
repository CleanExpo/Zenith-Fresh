import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = params.id;
    const session = await getServerSession(authOptions);

    // Update article view count
    await prisma.helpArticle.update({
      where: { id: articleId },
      data: {
        viewCount: { increment: 1 },
        lastViewed: new Date()
      }
    });

    // Track this as a user success metric if user is logged in
    if (session?.user?.id) {
      try {
        await prisma.userSuccessMetric.create({
          data: {
            userId: session.user.id,
            metricType: 'engagement',
            metricName: 'help-article-view',
            value: 1,
            unit: 'count',
            category: 'support',
            milestone: 'help-engagement'
          }
        });
      } catch (error) {
        console.error('Error tracking article view metric:', error);
        // Don't fail the main request
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking article view:', error);
    return NextResponse.json(
      { error: 'Failed to track article view' },
      { status: 500 }
    );
  }
}