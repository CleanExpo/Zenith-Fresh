import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SubscriptionGuard } from '@/lib/subscription-guard';
import { SubscriptionLimits } from '@/lib/subscription-plans';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const teamId = params.id;
  
  try {
    const { feature, currentUsage } = await req.json();
    
    if (!feature || !isValidFeature(feature)) {
      return NextResponse.json(
        { error: 'Invalid feature specified' },
        { status: 400 }
      );
    }

    const guard = new SubscriptionGuard(session.user.id, teamId);
    const result = await guard.checkUsageLimit(
      feature as keyof SubscriptionLimits,
      currentUsage
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return NextResponse.json(
      { error: 'Failed to check usage limit' },
      { status: 500 }
    );
  }
}

function isValidFeature(feature: string): feature is keyof SubscriptionLimits {
  const validFeatures: (keyof SubscriptionLimits)[] = [
    'projects',
    'teamMembers',
    'apiCalls',
    'storage',
    'aiAgents',
    'emailCampaigns',
    'reviewCampaigns',
    'seoAnalyses',
    'partnerProgram',
    'customIntegrations',
    'prioritySupport',
    'whiteLabel',
  ];
  
  return validFeatures.includes(feature as keyof SubscriptionLimits);
}