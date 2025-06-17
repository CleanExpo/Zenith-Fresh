import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]';
import { prisma } from '../../../../../lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.query;
    const { priceId } = req.body;

    const team = await prisma.team.findUnique({
      where: { id: String(id) },
      include: { billing: true },
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a team member
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: String(id),
          userId: session.user.id,
        },
      },
    });

    if (!teamMember || teamMember.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Create or retrieve Stripe customer
    let customerId = team.billing?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        metadata: {
          teamId: team.id,
        },
      });
      customerId = customer.id;

      // Update team billing with Stripe customer ID
      await prisma.teamBilling.upsert({
        where: { teamId: team.id },
        create: {
          teamId: team.id,
          stripeCustomerId: customerId,
        },
        update: {
          stripeCustomerId: customerId,
        },
      });
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/team/${id}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/team/${id}/billing?canceled=true`,
      metadata: {
        teamId: team.id,
      },
    });

    res.status(200).json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 