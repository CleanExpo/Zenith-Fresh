import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get user preferences
router.get('/', auth, async (req, res) => {
  try {
    const preferences = await prisma.userPreferences.findUnique({
      where: {
        userId: req.user!.id
      }
    });

    if (!preferences) {
      // Create default preferences if they don't exist
      const defaultPreferences = await prisma.userPreferences.create({
        data: {
          userId: req.user!.id
        }
      });
      return res.json(defaultPreferences);
    }

    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user preferences
router.patch('/', auth, async (req, res) => {
  try {
    const {
      theme,
      language,
      emailNotifications,
      pushNotifications,
      timezone,
      dateFormat,
      timeFormat
    } = req.body;

    const preferences = await prisma.userPreferences.upsert({
      where: {
        userId: req.user!.id
      },
      update: {
        theme,
        language,
        emailNotifications,
        pushNotifications,
        timezone,
        dateFormat,
        timeFormat
      },
      create: {
        userId: req.user!.id,
        theme,
        language,
        emailNotifications,
        pushNotifications,
        timezone,
        dateFormat,
        timeFormat
      }
    });

    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset user preferences to default
router.post('/reset', auth, async (req, res) => {
  try {
    const preferences = await prisma.userPreferences.update({
      where: {
        userId: req.user!.id
      },
      data: {
        theme: 'light',
        language: 'en',
        emailNotifications: true,
        pushNotifications: true,
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h'
      }
    });

    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 