import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redis } from '@/lib/redis';

/**
 * Handles GET requests to retrieve social media statistics for the authenticated user.
 *
 * Attempts to return cached statistics from Redis if available; otherwise, assembles mock social data, computes summary metrics, caches the result, and returns it as JSON. Returns a 401 error if the user is not authenticated, or a 500 error if an unexpected failure occurs.
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = `social:stats:${session.user.id}`;
    
    // Check cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }
    } catch (error) {
      console.error('Redis error:', error);
    }

    // Format data to match dashboard interface
    const socialData = {
      facebook: {
        followers: 1234,
        engagement: 5.2,
        locked: false,
        lastUpdated: new Date().toISOString()
      },
      instagram: {
        followers: 892,
        engagement: 7.8,
        locked: false,
        lastUpdated: new Date().toISOString()
      },
      x: {
        followers: 567,
        engagement: 3.4,
        locked: false,
        lastUpdated: new Date().toISOString()
      },
      linkedin: {
        followers: 0,
        engagement: 0,
        locked: true,
        lastUpdated: null
      }
    };

    // Calculate summary stats
    const connectedPlatforms = Object.values(socialData).filter(p => !p.locked);
    const totalReach = Object.values(socialData).reduce(
      (sum, platform) => sum + platform.followers,
      0
    );
    const averageEngagement = connectedPlatforms.length > 0
      ? connectedPlatforms.reduce((sum, p) => sum + p.engagement, 0) / connectedPlatforms.length
      : 0;

    const responseData = {
      ...socialData,
      summary: {
        totalReach,
        averageEngagement: Math.round(averageEngagement * 10) / 10,
        connectedPlatforms: connectedPlatforms.length,
        totalPlatforms: Object.keys(socialData).length
      },
      cached: false,
      timestamp: new Date().toISOString()
    };

    // Cache for 15 minutes
    try {
      await redis.setex(cacheKey, 900, JSON.stringify(responseData));
    } catch (error) {
      console.error('Redis set error:', error);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Social Stats API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social stats' },
      { status: 500 }
    );
  }
}

// Endpoint to initiate OAuth connection
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform } = await request.json();

    // TODO: Implement OAuth flow for each platform
    // For now, return mock OAuth URL
    const oauthUrls: Record<string, string> = {
      facebook: 'https://facebook.com/oauth/authorize?client_id=mock',
      instagram: 'https://instagram.com/oauth/authorize?client_id=mock',
      x: 'https://x.com/oauth/authorize?client_id=mock',
      linkedin: 'https://linkedin.com/oauth/authorize?client_id=mock'
    };

    if (!oauthUrls[platform]) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      authUrl: oauthUrls[platform],
      platform
    });
  } catch (error) {
    console.error('Social OAuth Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth' },
      { status: 500 }
    );
  }
}
