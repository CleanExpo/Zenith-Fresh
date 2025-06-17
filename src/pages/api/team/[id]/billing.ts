import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const billing = await prisma.teamBilling.findUnique({
        where: { teamId: String(id) },
        include: {
          subscription: true,
          paymentHistory: {
            orderBy: { date: 'desc' },
            take: 10 // Last 10 payments
          }
        }
      });

      if (!billing) {
        return res.status(404).json({ message: 'Billing information not found' });
      }

      res.status(200).json(billing);
    } catch (error) {
      console.error('Error fetching billing:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { autoRenew, paymentMethod } = req.body;

      const updatedBilling = await prisma.teamBilling.update({
        where: { teamId: String(id) },
        data: {
          autoRenew,
          paymentMethod
        }
      });

      res.status(200).json(updatedBilling);
    } catch (error) {
      console.error('Error updating billing:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
} 