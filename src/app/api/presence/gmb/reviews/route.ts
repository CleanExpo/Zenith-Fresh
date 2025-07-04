import { NextResponse } from 'next/server';
import { getGmbReviews } from '@/lib/services/gmb';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const reviews = await getGmbReviews();
    if ('error' in reviews) {
      return NextResponse.json({ error: reviews.error }, { status: 500 });
    }
    
    // Transform the data to match the expected format
    const transformedReviews = reviews.map((review: any) => ({
      id: review.reviewId,
      platform: 'GMB',
      platformId: review.reviewId,
      author: review.reviewer?.displayName || 'Anonymous',
      rating: review.starRating,
      text: review.comment,
      replied: !!review.reviewReply,
      reviewUrl: review.reviewUrl || '#',
      createdAt: new Date(review.createTime || Date.now())
    }));

    return NextResponse.json({
      reviews: transformedReviews,
      summary: {
        total: transformedReviews.length,
        averageRating: transformedReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / transformedReviews.length || 0,
        unreplied: transformedReviews.filter((r: any) => !r.replied).length
      }
    });
  } catch (error) {
    console.error('Failed to get reviews:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Sync reviews with Google My Business API
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Force refresh reviews from GMB API
    const reviews = await getGmbReviews();
    
    if ('error' in reviews) {
      return NextResponse.json({ 
        error: 'Failed to sync reviews',
        message: reviews.error 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Reviews synced successfully',
      count: reviews.length
    });
  } catch (error) {
    console.error('GMB Reviews Sync Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync reviews' },
      { status: 500 }
    );
  }
}
