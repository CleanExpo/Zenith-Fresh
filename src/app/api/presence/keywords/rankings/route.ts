import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redis } from '@/lib/redis';

/**
 * Handles GET requests to retrieve demo keyword ranking data for the authenticated user's dashboard.
 *
 * Returns cached ranking data from Redis if available; otherwise, returns a fixed set of demo keyword rankings and caches them for 10 minutes. Responds with 401 if the user is not authenticated, or 500 if an unexpected error occurs.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return current rankings for dashboard
    const cacheKey = `dashboard:keywords:${session.user.id}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }
    } catch (error) {
      console.error('Redis error:', error);
    }

    // Demo data for dashboard - in production this would come from DataForSEO
    const responseData = [
      { keyword: 'best plumber ipswich', position: 3, volume: 480, difficulty: 'Medium', change: 2 },
      { keyword: 'emergency plumber near me', position: 5, volume: 1200, difficulty: 'High', change: -1 },
      { keyword: 'plumbing services', position: 8, volume: 3600, difficulty: 'High', change: 0 },
      { keyword: 'licensed plumber', position: 12, volume: 720, difficulty: 'Medium', change: 3 },
      { keyword: 'drain cleaning service', position: 6, volume: 890, difficulty: 'Low', change: 1 },
      { keyword: 'residential plumber', position: 15, volume: 340, difficulty: 'Low', change: -2 },
      { keyword: 'commercial plumbing', position: 9, volume: 560, difficulty: 'Medium', change: 4 },
      { keyword: 'water heater repair', position: 7, volume: 780, difficulty: 'Medium', change: 1 }
    ];

    // Cache for 10 minutes
    try {
      await redis.setex(cacheKey, 600, JSON.stringify(responseData));
    } catch (error) {
      console.error('Redis set error:', error);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Get rankings error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve rankings' },
      { status: 500 }
    );
  }
}

/**
 * Handles POST requests to generate and return mock keyword ranking data for a given domain and keyword list.
 *
 * Validates the authenticated user session and input parameters, checks Redis cache for existing results, and returns cached data if available. If not cached, generates randomized demo ranking data for each keyword, caches the result for 1 hour, and returns it with a message indicating demo status.
 *
 * Returns a 401 error if the user is not authenticated, a 400 error for missing or invalid input, and a 503 error if an unexpected failure occurs.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keywords, domain, location } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords array is required' },
        { status: 400 }
      );
    }

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Create cache key
    const cacheKey = `rankings:${domain}:${keywords.join(',')}:${location || 'us'}`;

    // Check Redis cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({
          data: JSON.parse(cached),
          source: 'cache',
        });
      }
    } catch (error) {
      console.error('Redis error:', error);
    }

    // For now, return demo data - in production this would integrate with DataForSEO
    const mockData = keywords.map((keyword: string, index: number) => ({
      keyword,
      position: Math.floor(Math.random() * 20) + 1,
      volume: Math.floor(Math.random() * 2000) + 100,
      difficulty: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      url: `https://${domain}/page-${index + 1}`,
      change: Math.floor(Math.random() * 10) - 5,
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
    }));

    // Store in Redis cache for 1 hour
    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(mockData));
    } catch (error) {
      console.error('Redis set error:', error);
    }

    return NextResponse.json({
      data: mockData,
      source: 'api',
      message: 'Demo data - Connect DataForSEO for live rankings'
    });

  } catch (error) {
    console.error('Rankings API error:', error);
    return NextResponse.json(
      { 
        error: 'Service temporarily unavailable',
        message: 'Unable to fetch live ranking data. Please try again later.',
      },
      { status: 503 }
    );
  }
}
