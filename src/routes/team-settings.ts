import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { hasRole } from '../middleware/roles';
import { createAuditLog } from './audit';

const router = Router();
const prisma = new PrismaClient();

// Get team settings
router.get('/:teamId', auth, hasRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { teamId } = req.params;

    const settings = await prisma.teamSettings.findUnique({
      where: { teamId }
    });

    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update team settings
router.put('/:teamId', auth, hasRole(['ADMIN']), async (req, res) => {
  try {
    const { teamId } = req.params;
    const { theme, language, timezone, notifications, integrations } = req.body;
    const userId = req.user!.id;

    const settings = await prisma.teamSettings.upsert({
      where: { teamId },
      create: {
        teamId,
        theme,
        language,
        timezone,
        notifications,
        integrations
      },
      update: {
        theme,
        language,
        timezone,
        notifications,
        integrations
      }
    });

    await createAuditLog({
      action: 'update_settings',
      entityType: 'team_settings',
      entityId: settings.id,
      newValue: settings,
      userId
    });

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get team integrations
router.get('/:teamId/integrations', auth, hasRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { teamId } = req.params;

    const integrations = await prisma.teamIntegration.findMany({
      where: { teamId }
    });

    res.json(integrations);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add team integration
router.post('/:teamId/integrations', auth, hasRole(['ADMIN']), async (req, res) => {
  try {
    const { teamId } = req.params;
    const { type, config } = req.body;
    const userId = req.user!.id;

    const integration = await prisma.teamIntegration.create({
      data: {
        teamId,
        type,
        config
      }
    });

    await createAuditLog({
      action: 'add_integration',
      entityType: 'team_integration',
      entityId: integration.id,
      newValue: integration,
      userId
    });

    res.json(integration);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update team integration
router.put('/:teamId/integrations/:integrationId', auth, hasRole(['ADMIN']), async (req, res) => {
  try {
    const { teamId, integrationId } = req.params;
    const { config, status } = req.body;
    const userId = req.user!.id;

    const integration = await prisma.teamIntegration.update({
      where: {
        id: integrationId,
        teamId
      },
      data: {
        config,
        status
      }
    });

    await createAuditLog({
      action: 'update_integration',
      entityType: 'team_integration',
      entityId: integration.id,
      newValue: integration,
      userId
    });

    res.json(integration);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove team integration
router.delete('/:teamId/integrations/:integrationId', auth, hasRole(['ADMIN']), async (req, res) => {
  try {
    const { teamId, integrationId } = req.params;
    const userId = req.user!.id;

    const integration = await prisma.teamIntegration.delete({
      where: {
        id: integrationId,
        teamId
      }
    });

    await createAuditLog({
      action: 'remove_integration',
      entityType: 'team_integration',
      entityId: integration.id,
      oldValue: integration,
      userId
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 