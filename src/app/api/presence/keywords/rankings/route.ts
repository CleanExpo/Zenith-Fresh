import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redis } from '@/lib/redis';

// Live keyword ranking data fetcher
async function getLiveKeywordRankings(userId: string) {
  // In production, this would integrate with DataForSEO, SEMrush, or other SEO APIs
  // For now, return null to indicate no data available until APIs are connected
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return current rankings for dashboard
    const cacheKey = `dashboard:keywords:${session.user.id}`;
    
    try {
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return NextResponse.json(JSON.parse(cached));
        }
      }
    } catch (error) {
      console.error('Redis error:', error);
    }

    // Get live keyword ranking data from DataForSEO or other SEO APIs
    const responseData = await getLiveKeywordRankings(session.user.id);
    
    // If no live data available, return empty state
    if (!responseData || responseData.length === 0) {
      return NextResponse.json({
        error: 'No keyword tracking configured',
        message: 'Please set up keyword tracking to view rankings',
        data: []
      }, { status: 200 });
    }

    // Cache for 10 minutes
    try {
      if (redis) {
        await redis.setex(cacheKey, 600, JSON.stringify(responseData));
      }
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
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return NextResponse.json({
            data: JSON.parse(cached),
            source: 'cache',
          });
        }
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
      if (redis) {
        await redis.setex(cacheKey, 3600, JSON.stringify(mockData));
      }
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
