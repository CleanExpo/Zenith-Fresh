import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { cache } from '../middleware/cache';
import { createAuditLog } from './audit';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Create API key
router.post('/', auth, async (req, res) => {
  try {
    const { name, scopes, expiresAt } = req.body;
    const userId = req.user!.id;

    const key = crypto.randomBytes(32).toString('hex');
    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key,
        scopes,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userId
      }
    });

    await createAuditLog({
      action: 'create',
      entityType: 'api_key',
      entityId: apiKey.id,
      newValue: { ...apiKey, key: '***' }, // Don't log the actual key
      userId
    });

    // Only return the key once
    res.json({ ...apiKey, key });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's API keys
router.get('/', auth, cache(300), async (req, res) => {
  try {
    const userId = req.user!.id;

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        scopes: true,
        lastUsed: true,
        expiresAt: true,
        createdAt: true
      }
    });

    res.json(apiKeys);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete API key
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await prisma.apiKey.delete({
      where: { id }
    });

    await createAuditLog({
      action: 'delete',
      entityType: 'api_key',
      entityId: id,
      oldValue: { ...apiKey, key: '***' },
      userId
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update API key
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, scopes, expiresAt } = req.body;
    const userId = req.user!.id;

    const oldApiKey = await prisma.apiKey.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!oldApiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: {
        name,
        scopes,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    await createAuditLog({
      action: 'update',
      entityType: 'api_key',
      entityId: id,
      oldValue: { ...oldApiKey, key: '***' },
      newValue: { ...apiKey, key: '***' },
      userId
    });

    res.json(apiKey);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// API key authentication middleware
export const authenticateApiKey = async (req: any, res: any, next: any) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    if (!key || (key.expiresAt && key.expiresAt < new Date())) {
      return res.status(401).json({ error: 'Invalid or expired API key' });
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsed: new Date() }
    });

    // Add user and scopes to request
    req.user = key.user;
    req.apiKeyScopes = key.scopes;

    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Check API key scope middleware
export const requireApiKeyScope = (scopes: string[]) => {
  return (req: any, res: any, next: any) => {
    const hasScope = scopes.every(scope => req.apiKeyScopes.includes(scope));

    if (!hasScope) {
      return res.status(403).json({ error: 'Insufficient API key scopes' });
    }

    next();
  };
};

export default router; 