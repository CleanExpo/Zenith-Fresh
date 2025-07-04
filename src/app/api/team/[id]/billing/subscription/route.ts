import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subscriptionManager } from '@/lib/stripe/subscription-manager';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const teamId = params.id;

  try {
    const usage = await subscriptionManager.getSubscriptionUsage(teamId);
    return NextResponse.json(usage);
  } catch (error) {
    console.error('Error getting subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const teamId = params.id;
  const { action, priceId, subscriptionId } = await req.json();

  try {
    switch (action) {
      case 'create':
        const subscription = await subscriptionManager.createSubscription(teamId, priceId, {
          trialDays: 14
        });
        return NextResponse.json({ subscription });

      case 'update':
        const updatedSubscription = await subscriptionManager.updateSubscription(
          subscriptionId,
          priceId
        );
        return NextResponse.json({ subscription: updatedSubscription });

      case 'cancel':
        const canceledSubscription = await subscriptionManager.cancelSubscription(
          subscriptionId,
          { cancelAtPeriodEnd: true }
        );
        return NextResponse.json({ subscription: canceledSubscription });

      case 'resume':
        const resumedSubscription = await subscriptionManager.resumeSubscription(subscriptionId);
        return NextResponse.json({ subscription: resumedSubscription });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error managing subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}