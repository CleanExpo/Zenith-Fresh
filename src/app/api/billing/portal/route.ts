/**
 * Customer Portal API
 * Creates Stripe customer portal sessions for self-service billing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { auditLogger } from '@/lib/audit/audit-logger';

// Lazy initialization of Stripe client to avoid build-time errors
let stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
    }
    stripe = new Stripe(apiKey, {
      apiVersion: '2024-06-20',
    });
  }
  return stripe;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { returnUrl } = await request.json();

    if (!returnUrl) {
      return NextResponse.json({ error: 'Return URL is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        teams: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!user || user.teams.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const team = user.teams[0].team;

    if (!team.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 });
    }

    // Create portal session
    const stripeClient = getStripeClient();
    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: team.stripeCustomerId,
      return_url: returnUrl,
    });

    // Store session for audit
    await prisma.customerPortalSession.create({
      data: {
        teamId: team.id,
        stripeSessionId: portalSession.id,
        returnUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    await auditLogger.log({
      action: 'customer_portal_session_created',
      userId: user.id,
      details: {
        teamId: team.id,
        sessionId: portalSession.id,
        returnUrl,
      },
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
