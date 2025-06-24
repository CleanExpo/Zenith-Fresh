import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redis } from '@/lib/redis';

// Live social media data fetcher
async function getLiveSocialMediaData(userId: string) {
  // In production, this would integrate with actual social media APIs
  // For now, return null to indicate no data available until APIs are connected
  return null;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = `social:stats:${session.user.id}`;
    
    // Check cache first
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

    // Get live social media data - no mock data in production
    const socialData = await getLiveSocialMediaData(session.user.id);
    
    // Fallback structure if no data connected
    if (!socialData || Object.keys(socialData).length === 0) {
      return NextResponse.json({
        error: 'No social media accounts connected',
        message: 'Please connect your social media accounts to view analytics',
        platforms: {
          facebook: { locked: true, requiresAuth: true },
          instagram: { locked: true, requiresAuth: true },
          x: { locked: true, requiresAuth: true },
          linkedin: { locked: true, requiresAuth: true }
        }
      }, { status: 200 });
    }

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
      if (redis) {
        await redis.setex(cacheKey, 900, JSON.stringify(responseData));
      }
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
