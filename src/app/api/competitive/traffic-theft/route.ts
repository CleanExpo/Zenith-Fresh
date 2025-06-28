// src/app/api/competitive/traffic-theft/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import TrafficThiefAgent from '@/lib/agents/traffic-thief-agent';

export async function POST(request: NextRequest) {
  try {
    const { competitorUrls, userId } = await request.json();
    
    if (!competitorUrls || !Array.isArray(competitorUrls) || competitorUrls.length === 0) {
      return NextResponse.json(
        { error: 'Competitor URLs array is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const trafficThiefAgent = new TrafficThiefAgent(userId);
    const campaign = await trafficThiefAgent.executeTrafficTheftCampaign(competitorUrls);

    return NextResponse.json({
      success: true,
      campaign,
      message: `Traffic theft campaign created with ${campaign.identifiedOpportunities.length} opportunities`
    });

  } catch (error) {
    console.error('Traffic theft campaign error:', error);
    return NextResponse.json(
      { error: 'Failed to execute traffic theft campaign' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // In production, this would fetch existing campaigns from database
    const campaigns = [
      {
        id: `theft_campaign_${Date.now()}`,
        campaignName: 'Sample Traffic Theft Campaign',
        targetCompetitors: ['ahrefs.com', 'semrush.com'],
        identifiedOpportunities: [],
        estimatedValue: 15600,
        status: 'review',
        createdAt: new Date()
      }
    ];

    return NextResponse.json({
      success: true,
      campaigns
    });

  } catch (error) {
    console.error('Traffic theft campaigns fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch traffic theft campaigns' },
      { status: 500 }
    );
  }
}
