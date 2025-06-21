// src/app/api/campaigns/review/transform/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { reviewCampaignAgent, TestimonialExtractionSchema } from '@/lib/agents/review-campaign-agent';
import { prisma } from '@/lib/prisma';

// Force dynamic for API route
export const dynamic = 'force-dynamic';

const ReviewTransformRequestSchema = z.object({
  reviewText: z.string().min(10),
  rating: z.number().min(1).max(5),
  authorName: z.string().min(1),
  authorTitle: z.string().optional(),
  authorCompany: z.string().optional(),
  campaignId: z.string().optional()
});

// POST /api/campaigns/review/transform - Transform a review into marketing assets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = ReviewTransformRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { reviewText, rating, authorName, authorTitle, authorCompany, campaignId } = validationResult.data;

    // Create a review record for tracking
    const reviewRecord = await prisma.testimonialAsset.create({
      data: {
        campaignId: campaignId || 'direct-review',
        quote: reviewText.substring(0, 200), // Truncate for initial storage
        authorName,
        authorTitle: authorTitle || 'Customer',
        authorCompany,
        designStyle: 'futuristic',
        brandColors: ['#3B82F6', '#8B5CF6', '#06B6D4'],
        status: 'PENDING'
      }
    });

    // Transform review via ReviewCampaignAgent
    const testimonialData = {
      reviewId: reviewRecord.id,
      reviewText,
      rating,
      authorName,
      authorTitle,
      authorCompany
    };

    await reviewCampaignAgent.processNewReview(testimonialData);

    // Extract impactful quote (simplified version)
    const sentences = reviewText.split('.').filter(s => s.trim().length > 20);
    const impactfulQuote = sentences[0]?.trim() + '.' || reviewText.substring(0, 100) + '...';

    // Update testimonial asset with processed quote
    await prisma.testimonialAsset.update({
      where: { id: reviewRecord.id },
      data: {
        quote: impactfulQuote,
        status: rating >= 4 ? 'COMPLETED' : 'FAILED'
      }
    });

    // Create social proof campaign if review meets quality threshold
    let socialCampaignId = null;
    if (rating >= 4 && impactfulQuote.length >= 50) {
      const socialCampaign = await prisma.socialProofCampaign.create({
        data: {
          reviewCampaignId: campaignId || 'direct-review',
          testimonialAssetId: reviewRecord.id,
          platforms: ['twitter', 'linkedin', 'instagram'],
          content: {
            twitter: `"${impactfulQuote}" - ${authorName}, ${authorTitle || 'Customer'}${authorCompany ? ` at ${authorCompany}` : ''} #ZenithSuccess #DigitalTransformation`,
            linkedin: `We're thrilled to share this feedback from ${authorName}${authorCompany ? ` at ${authorCompany}` : ''}:\n\n"${impactfulQuote}"\n\nThank you for trusting Zenith with your digital transformation journey!`,
            instagram: `Another amazing success story! 🚀\n\n"${impactfulQuote}"\n\n- ${authorName}${authorCompany ? `, ${authorCompany}` : ''}\n\n#ZenithSuccess #DigitalAgency #AIAgents`
          },
          status: 'PENDING'
        }
      });
      socialCampaignId = socialCampaign.id;
    }

    return NextResponse.json({
      success: true,
      message: 'Review successfully transformed into marketing assets',
      data: {
        testimonialAssetId: reviewRecord.id,
        socialCampaignId,
        impactfulQuote,
        qualityScore: rating,
        transformationStatus: rating >= 4 ? 'completed' : 'below_threshold',
        marketingAssets: {
          testimonialGraphic: rating >= 4 ? 'scheduled_for_creation' : 'not_eligible',
          socialMediaPosts: socialCampaignId ? 'created' : 'not_eligible',
          websiteWidget: rating >= 4 ? 'eligible' : 'not_eligible'
        }
      }
    });

  } catch (error) {
    console.error('Review transformation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to transform review',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/campaigns/review/transform - Get transformation statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30'; // days

    // Filter by timeframe
    const daysAgo = parseInt(timeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    const whereClause = {
      createdAt: {
        gte: cutoffDate
      }
    };

    // Get transformation statistics
    const [
      totalTestimonials,
      completedTestimonials,
      socialCampaigns,
      pendingAssets
    ] = await Promise.all([
      prisma.testimonialAsset.count({ where: whereClause }),
      prisma.testimonialAsset.count({ 
        where: { 
          ...whereClause, 
          status: 'COMPLETED' 
        } 
      }),
      prisma.socialProofCampaign.count({ where: whereClause }),
      prisma.testimonialAsset.count({ 
        where: { 
          ...whereClause, 
          status: 'PENDING' 
        } 
      })
    ]);

    // Get recent testimonials
    const recentTestimonials = await prisma.testimonialAsset.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        quote: true,
        authorName: true,
        authorCompany: true,
        status: true,
        createdAt: true
      }
    });

    // Calculate metrics
    const transformationRate = totalTestimonials > 0 ? (completedTestimonials / totalTestimonials) * 100 : 0;
    const socialConversionRate = completedTestimonials > 0 ? (socialCampaigns / completedTestimonials) * 100 : 0;

    return NextResponse.json({
      success: true,
      timeframe: `${timeframe} days`,
      statistics: {
        totalTestimonials,
        completedTestimonials,
        socialCampaigns,
        pendingAssets,
        transformationRate: Math.round(transformationRate * 100) / 100,
        socialConversionRate: Math.round(socialConversionRate * 100) / 100
      },
      recentTestimonials
    });

  } catch (error) {
    console.error('Transformation statistics error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch transformation statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
