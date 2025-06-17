import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const settings = await prisma.teamSettings.findUnique({
        where: { teamId: String(id) },
        include: {
          notifications: true,
          integrations: true
        }
      });

      if (!settings) {
        return res.status(404).json({ message: 'Settings not found' });
      }

      res.status(200).json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { name, timezone, language, notifications } = req.body;

      const updatedSettings = await prisma.teamSettings.update({
        where: { teamId: String(id) },
        data: {
          name,
          timezone,
          language,
          notifications: {
            update: notifications
          }
        },
        include: {
          notifications: true
        }
      });

      res.status(200).json(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
} 