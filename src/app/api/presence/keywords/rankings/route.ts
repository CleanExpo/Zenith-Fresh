import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dataForSEO } from '@/lib/dataforseo';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
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

    // Layer 1: Check Redis cache
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

    // Layer 2: Check database (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRankings = await prisma.keywordRanking.findMany({
      where: {
        clientId: session.user.id,
        keyword: { in: keywords },
        createdAt: { gte: oneDayAgo },
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['keyword'],
    });

    if (recentRankings.length === keywords.length) {
      const formattedData = recentRankings.map(ranking => ({
        keyword: ranking.keyword,
        position: ranking.position,
        volume: ranking.volume,
        difficulty: ranking.difficulty,
        url: '', // Add URL field to schema
        change: 0, // Calculate from historical data
        trend: 'stable' as const,
      }));

      // Store in Redis for 1 hour
      try {
        await redis.setex(cacheKey, 3600, JSON.stringify(formattedData));
      } catch (error) {
        console.error('Redis set error:', error);
      }

      return NextResponse.json({
        data: formattedData,
        source: 'database',
      });
    }

    // Layer 3: Fetch from DataForSEO API
    const freshData = await dataForSEO.getKeywordRankings(keywords, domain, location);

    // Store in database
    await prisma.keywordRanking.createMany({
      data: freshData.map(item => ({
        keyword: item.keyword,
        position: item.position,
        volume: item.volume,
        difficulty: item.difficulty,
        clientId: session.user.id,
      })),
    });

    // Track API usage
    const cost = dataForSEO.calculateCost('serp/google/organic', keywords.length);
    await prisma.apiUsage.create({
      data: {
        provider: 'dataForSEO',
        endpoint: 'serp/google/organic',
        cost: cost,
        requestData: { keywords, domain, location },
        success: true,
        clientId: session.user.id,
      },
    });

    // Store in Redis cache
    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(freshData));
    } catch (error) {
      console.error('Redis set error:', error);
    }

    return NextResponse.json({
      data: freshData,
      source: 'api',
      cost: cost,
    });
  } catch (error) {
    console.error('Rankings API error:', error);
    
    // Try to return cached data on error
    try {
      const { keywords, domain, location } = await request.json();
      const cacheKey = `rankings:${domain}:${keywords.join(',')}:${location || 'us'}`;
      const fallback = await redis.get(cacheKey);
      
      if (fallback) {
        return NextResponse.json({
          data: JSON.parse(fallback),
          source: 'cache',
          warning: 'Showing cached data due to temporary service issues',
        });
      }
    } catch {
      // Ignore fallback errors
    }

    return NextResponse.json(
      { 
        error: 'Service temporarily unavailable',
        message: 'Unable to fetch live ranking data. Please try again later.',
      },
      { status: 503 }
    );
  }
}

// GET endpoint for retrieving historical data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const keyword = searchParams.get('keyword');

    const where: any = {
      clientId: session.user.id,
      createdAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    };

    if (keyword) {
      where.keyword = keyword;
    }

    const rankings = await prisma.keywordRanking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: rankings });
  } catch (error) {
    console.error('Get rankings error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve rankings' },
      { status: 500 }
    );
  }
}
