import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Once Phase 1 is merged and migrations are run, use prisma.platformReview
    // For now, return mock data for Phase 2 testing
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
    console.error('GMB Reviews API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// Mock endpoint for demo purposes - returns sample data
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
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
