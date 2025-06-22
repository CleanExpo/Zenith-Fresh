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

// Mock endpoint for demo purposes - returns sample data
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, this would sync with Google My Business API
    // For now, return mock data
    const mockReviews = [
      {
        id: '1',
        platform: 'GMB',
        platformId: 'gmb_review_1',
        author: 'Sarah Mitchell',
        rating: 5,
        text: 'Excellent service! The team was professional and efficient. Highly recommend!',
        replied: false,
        reviewUrl: 'https://g.page/r/review/1',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        platform: 'GMB',
        platformId: 'gmb_review_2',
        author: 'John Davidson',
        rating: 4,
        text: 'Good experience overall. Quick response time and fair pricing.',
        replied: true,
        reviewUrl: 'https://g.page/r/review/2',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: '3',
        platform: 'GMB',
        platformId: 'gmb_review_3',
        author: 'Emily Chen',
        rating: 5,
        text: 'Amazing! They went above and beyond my expectations.',
        replied: false,
        reviewUrl: 'https://g.page/r/review/3',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      }
    ];

    return NextResponse.json({
      reviews: mockReviews,
      summary: {
        total: mockReviews.length,
        averageRating: 4.7,
        unreplied: 2
      }
    });
  } catch (error) {
    console.error('GMB Reviews Mock Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate mock reviews' },
      { status: 500 }
    );
  }
}
