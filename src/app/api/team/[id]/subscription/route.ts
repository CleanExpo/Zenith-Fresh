import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SubscriptionGuard } from '@/lib/subscription-guard';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const teamId = params.id;
  
  try {
    const guard = new SubscriptionGuard(session.user.id, teamId);
    const usageSummary = await guard.getUsageSummary();
    
    // Get additional subscription details from database
    const { prisma } = require('@/lib/prisma');
    const teamBilling = await prisma.teamBilling.findUnique({
      where: { teamId },
      include: {
        paymentMethod: true,
      },
    });

    const response = {
      plan: usageSummary.plan,
      status: teamBilling?.status || 'active',
      usage: usageSummary.usage,
      nextBillingDate: teamBilling?.nextBillingDate?.toISOString(),
      amount: teamBilling?.amount,
      currency: teamBilling?.currency || 'USD',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}