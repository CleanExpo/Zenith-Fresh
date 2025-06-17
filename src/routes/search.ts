import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { cache } from '../middleware/cache';

const router = Router();
const prisma = new PrismaClient();

// Global search
router.get('/', auth, cache(300), async (req, res) => {
  try {
    const { query, type } = req.query;
    const userId = req.user!.id;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchQuery = query as string;
    const searchType = type as string;

    let results = {};

    // Search projects
    if (!searchType || searchType === 'projects') {
      const projects = await prisma.project.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } }
          ]
        }
      });
      results = { ...results, projects };
    }

    // Search tasks
    if (!searchType || searchType === 'tasks') {
      const tasks = await prisma.task.findMany({
        where: {
          project: { userId },
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } }
          ]
        },
        include: {
          project: true
        }
      });
      results = { ...results, tasks };
    }

    // Search files
    if (!searchType || searchType === 'files') {
      const files = await prisma.file.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { type: { contains: searchQuery, mode: 'insensitive' } }
          ]
        },
        include: {
          project: true
        }
      });
      results = { ...results, files };
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Search within a project
router.get('/project/:projectId', auth, cache(300), async (req, res) => {
  try {
    const { query, type } = req.query;
    const { projectId } = req.params;
    const userId = req.user!.id;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchQuery = query as string;
    const searchType = type as string;

    let results = {};

    // Search tasks in project
    if (!searchType || searchType === 'tasks') {
      const tasks = await prisma.task.findMany({
        where: {
          projectId,
          project: { userId },
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } }
          ]
        }
      });
      results = { ...results, tasks };
    }

    // Search files in project
    if (!searchType || searchType === 'files') {
      const files = await prisma.file.findMany({
        where: {
          projectId,
          userId,
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { type: { contains: searchQuery, mode: 'insensitive' } }
          ]
        }
      });
      results = { ...results, files };
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 