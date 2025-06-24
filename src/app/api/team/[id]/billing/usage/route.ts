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
  const { searchParams } = new URL(req.url);
  const feature = searchParams.get('feature');

  try {
    if (feature) {
      const canAccess = await subscriptionManager.canAccessFeature(teamId, feature);
      return NextResponse.json({ canAccess, feature });
    } else {
      const usage = await subscriptionManager.getSubscriptionUsage(teamId);
      return NextResponse.json(usage);
    }
  } catch (error) {
    console.error('Error getting usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}