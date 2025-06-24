import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subscriptionManager } from '@/lib/stripe/subscription-manager';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const teamId = params.id;
  const { returnUrl } = await req.json();

  try {
    const portalSession = await subscriptionManager.createPortalSession(
      teamId, 
      returnUrl || `${process.env.NEXTAUTH_URL}/team/${teamId}/billing`
    );
    
    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}