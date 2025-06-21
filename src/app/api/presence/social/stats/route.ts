import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Once Phase 1 is merged and OAuth is implemented, fetch real social stats
    // For now, return mock data for Phase 2 testing
    const socialStats = {
      facebook: {
        platform: 'facebook',
        followers: 1234,
        following: 89,
        posts: 156,
        engagement: {
          rate: 5.2,
          likes: 892,
          comments: 234,
          shares: 45
        },
        recentGrowth: 12,
        isConnected: true
      },
      instagram: {
        platform: 'instagram',
        followers: 892,
        following: 123,
        posts: 78,
        engagement: {
          rate: 7.8,
          likes: 1456,
          comments: 345,
          shares: 0
        },
        recentGrowth: 23,
        isConnected: true
      },
      x: {
        platform: 'x',
        followers: 567,
        following: 234,
        posts: 234,
        engagement: {
          rate: 3.4,
          likes: 234,
          comments: 56,
          shares: 12
        },
        recentGrowth: -2,
        isConnected: true
      },
      linkedin: {
        platform: 'linkedin',
        followers: 0,
        following: 0,
        posts: 0,
        engagement: {
          rate: 0,
          likes: 0,
          comments: 0,
          shares: 0
        },
        recentGrowth: 0,
        isConnected: false
      }
    };

    // Calculate total reach
    const totalReach = Object.values(socialStats).reduce(
      (sum, platform) => sum + platform.followers,
      0
    );

    // Calculate average engagement
    const connectedPlatforms = Object.values(socialStats).filter(p => p.isConnected);
    const averageEngagement = connectedPlatforms.length > 0
      ? connectedPlatforms.reduce((sum, p) => sum + p.engagement.rate, 0) / connectedPlatforms.length
      : 0;

    return NextResponse.json({
      platforms: socialStats,
      summary: {
        totalReach,
        averageEngagement: Math.round(averageEngagement * 10) / 10,
        connectedPlatforms: connectedPlatforms.length,
        totalPlatforms: Object.keys(socialStats).length
      }
    });
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
