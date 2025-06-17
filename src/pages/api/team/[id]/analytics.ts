import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const analytics = await prisma.teamAnalytics.findUnique({
        where: { teamId: String(id) },
        include: {
          usageStats: {
            orderBy: { date: 'desc' },
            take: 30 // Last 30 days
          }
        }
      });

      if (!analytics) {
        return res.status(404).json({ message: 'Analytics not found' });
      }

      res.status(200).json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
} 