import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all files
router.get('/', auth, async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      where: { userId: req.user!.id },
      include: {
        project: true
      }
    });

    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get files by project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      where: {
        projectId: req.params.projectId,
        userId: req.user!.id
      },
      include: {
        project: true
      }
    });

    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single file
router.get('/:id', auth, async (req, res) => {
  try {
    const file = await prisma.file.findUnique({
      where: {
        id: req.params.id,
        userId: req.user!.id
      },
      include: {
        project: true
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create file
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, size, url, projectId } = req.body;

    const file = await prisma.file.create({
      data: {
        name,
        type,
        size,
        url,
        userId: req.user!.id,
        projectId
      }
    });

    res.status(201).json(file);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete file
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.file.delete({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 