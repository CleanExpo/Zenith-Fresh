/**
 * Subscription Plans API Routes
 * Handle plan creation, updates, and retrieval
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tierFilter = searchParams.get('tier');
    const activeOnly = searchParams.get('active') === 'true';

    const where: any = {};
    
    if (tierFilter) {
      where.tier = tierFilter.toUpperCase();
    }
    
    if (activeOnly) {
      where.isActive = true;
    }

    const plans = await prisma.plan.findMany({
      where,
      orderBy: { amount: 'asc' }
    });

    return NextResponse.json({
      success: true,
      plans
    });

  } catch (error) {
    console.error('Failed to fetch plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      tier,
      billingInterval,
      amount,
      currency = 'usd',
      maxProjects,
      maxTeamMembers,
      maxAPIRequests,
      maxMonitoringChecks,
      features,
      meteringEnabled = false,
      usageType,
      unitAmount,
      customPricing = false,
      requiresApproval = false,
      isPopular = false
    } = body;

    // Validate required fields
    if (!name || !tier || !billingInterval || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Stripe product
    const stripeProduct = await stripe.products.create({
      name,
      description,
      metadata: {
        tier,
        planType: 'subscription'
      }
    });

    // Create Stripe price
    const stripePriceData: any = {
      product: stripeProduct.id,
      unit_amount: amount,
      currency,
      metadata: {
        tier,
        usageType: usageType || ''
      }
    };

    if (billingInterval === 'ONE_TIME') {
      // One-time payment
      stripePriceData.billing_scheme = 'per_unit';
    } else {
      // Recurring payment
      stripePriceData.recurring = {
        interval: billingInterval.toLowerCase().replace('ly', '')
      };

      if (meteringEnabled && usageType) {
        stripePriceData.recurring.usage_type = 'metered';
        stripePriceData.billing_scheme = 'tiered';
        stripePriceData.tiers_mode = 'graduated';
        
        // Add basic tiered pricing structure
        stripePriceData.tiers = [
          {
            up_to: 'inf',
            unit_amount: unitAmount || amount
          }
        ];
      }
    }

    const stripePrice = await stripe.prices.create(stripePriceData);

    // Create plan in database
    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        stripePriceId: stripePrice.id,
        stripeProductId: stripeProduct.id,
        tier,
        billingInterval,
        amount,
        currency,
        features,
        maxProjects,
        maxTeamMembers,
        maxAPIRequests,
        maxMonitoringChecks,
        meteringEnabled,
        usageType,
        unitAmount,
        customPricing,
        requiresApproval,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      plan
    });

  } catch (error) {
    console.error('Failed to create plan:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { planId, ...updates } = body;

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Update plan in database
    const plan = await prisma.plan.update({
      where: { id: planId },
      data: updates
    });

    // Update Stripe product if needed
    if (updates.name || updates.description) {
      await stripe.products.update(plan.stripeProductId, {
        name: updates.name || plan.name,
        description: updates.description || plan.description
      });
    }

    return NextResponse.json({
      success: true,
      plan
    });

  } catch (error) {
    console.error('Failed to update plan:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}