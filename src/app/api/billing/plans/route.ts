/**
 * Pricing Plans API
 * Manages subscription plans and pricing
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const plans = await prisma.pricingPlan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        price: 'asc',
      },
    });

    // Transform the data for frontend consumption
    const formattedPlans = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      features: plan.features,
      limits: plan.limits,
      stripePriceId: plan.stripePriceId,
      isPopular: plan.metadata?.isPopular || false,
    }));

    // Add free plan if not in database
    const freePlan = {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      price: 0,
      currency: 'usd',
      interval: 'month',
      features: [
        '5 website scans per day',
        'Basic health score',
        'Email support',
        'Community access',
      ],
      limits: {
        websiteScans: 5,
        teamMembers: 1,
        apiCalls: 100,
        storageGb: 1,
      },
      stripePriceId: null,
      isPopular: false,
    };

    return NextResponse.json([freePlan, ...formattedPlans]);
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      description,
      price,
      currency = 'usd',
      interval = 'month',
      features,
      limits,
      stripePriceId,
      metadata,
    } = await request.json();

    if (!name || !description || price === undefined) {
      return NextResponse.json(
        { error: 'Name, description, and price are required' },
        { status: 400 }
      );
    }

    const plan = await prisma.pricingPlan.create({
      data: {
        name,
        description,
        price,
        currency,
        interval,
        features: features || [],
        limits: limits || {},
        stripePriceId,
        metadata: metadata || {},
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating pricing plan:', error);
    return NextResponse.json(
      { error: 'Failed to create pricing plan' },
      { status: 500 }
    );
  }
}