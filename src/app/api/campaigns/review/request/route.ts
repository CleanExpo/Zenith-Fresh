// src/app/api/campaigns/review/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { reviewCampaignAgent, ReviewRequestSchema } from '@/lib/agents/review-campaign-agent';
import { prisma } from '@/lib/prisma';

// Force dynamic for API route
export const dynamic = 'force-dynamic';

// POST /api/campaigns/review/request - Trigger a review request campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = ReviewRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { userId, userEmail, userName, triggerType, contextData } = validationResult.data;

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check cooldown period to prevent spam
    const cooldownPeriod = triggerType === 'FREE_USER' ? 30 : 60; // days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cooldownPeriod);

    const recentCampaign = await prisma.reviewCampaign.findFirst({
      where: {
        userId,
        triggerType,
        createdAt: {
          gte: cutoffDate
        }
      }
    });

    if (recentCampaign) {
      return NextResponse.json(
        { 
          error: 'Cooldown period active',
          message: `Please wait before requesting another review from this user`,
          nextAvailable: new Date(recentCampaign.createdAt.getTime() + (cooldownPeriod * 24 * 60 * 60 * 1000))
        },
        { status: 429 }
      );
    }

    // Create review campaign record
    const campaign = await prisma.reviewCampaign.create({
      data: {
        userId,
        userEmail,
        userName,
        triggerType,
        status: 'PENDING',
        contextData: contextData as any,
        emailSent: false
      }
    });

    // Execute personalized request via ReviewCampaignAgent
    await reviewCampaignAgent.executePersonalizedRequest({
      userId,
      userEmail,
      userName,
      triggerType,
      contextData
    });

    // Update campaign status
    await prisma.reviewCampaign.update({
      where: { id: campaign.id },
      data: { 
        emailSent: true,
        status: 'SENT'
      }
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      message: `Review request sent to ${userName}`,
      triggerType,
      estimatedDelivery: '2-5 minutes'
    });

  } catch (error) {
    console.error('Review campaign request error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process review request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/campaigns/review/request - Get campaign statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const timeframe = searchParams.get('timeframe') || '30'; // days

    const whereClause: any = {};
    
    if (userId) {
      whereClause.userId = userId;
    }

    // Filter by timeframe
    const daysAgo = parseInt(timeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    whereClause.createdAt = {
      gte: cutoffDate
    };

    // Get campaign statistics
    const [totalCampaigns, sentCampaigns, responseCampaigns] = await Promise.all([
      prisma.reviewCampaign.count({ where: whereClause }),
      prisma.reviewCampaign.count({ 
        where: { 
          ...whereClause, 
          emailSent: true 
        } 
      }),
      prisma.reviewCampaign.count({ 
        where: { 
          ...whereClause, 
          status: 'responded' 
        } 
      })
    ]);

    // Get recent campaigns
    const recentCampaigns = await prisma.reviewCampaign.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        userName: true,
        triggerType: true,
        status: true,
        createdAt: true,
        emailSent: true
      }
    });

    // Calculate metrics
    const responseRate = sentCampaigns > 0 ? (responseCampaigns / sentCampaigns) * 100 : 0;
    const deliveryRate = totalCampaigns > 0 ? (sentCampaigns / totalCampaigns) * 100 : 0;

    return NextResponse.json({
      success: true,
      timeframe: `${timeframe} days`,
      statistics: {
        totalCampaigns,
        sentCampaigns,
        responseCampaigns,
        responseRate: Math.round(responseRate * 100) / 100,
        deliveryRate: Math.round(deliveryRate * 100) / 100
      },
      recentCampaigns
    });

  } catch (error) {
    console.error('Review campaign statistics error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch campaign statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
