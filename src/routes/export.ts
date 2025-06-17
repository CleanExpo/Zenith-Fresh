import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { cache } from '../middleware/cache';
import { createObjectCsvWriter } from 'csv-writer';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs/promises';

const router = Router();
const prisma = new PrismaClient();

// Request data export
router.post('/', auth, async (req, res) => {
  try {
    const { type, format, metadata } = req.body;
    const userId = req.user!.id;

    const export_ = await prisma.dataExport.create({
      data: {
        type,
        format,
        status: 'pending',
        userId,
        metadata
      }
    });

    // Start export process in background
    processExport(export_);

    res.json(export_);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get export status
router.get('/:id', auth, cache(60), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const export_ = await prisma.dataExport.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!export_) {
      return res.status(404).json({ error: 'Export not found' });
    }

    res.json(export_);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's exports
router.get('/', auth, cache(300), async (req, res) => {
  try {
    const userId = req.user!.id;
    const { status, type, format } = req.query;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (format) {
      where.format = format;
    }

    const exports = await prisma.dataExport.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(exports);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Background export processing
async function processExport(export_: any) {
  try {
    const { id, type, format, userId, metadata } = export_;
    let data: any[] = [];

    // Fetch data based on type
    switch (type) {
      case 'projects':
        data = await prisma.project.findMany({
          where: { userId },
          include: {
            tasks: true,
            files: true
          }
        });
        break;
      case 'tasks':
        data = await prisma.task.findMany({
          where: { userId },
          include: {
            project: true,
            files: true
          }
        });
        break;
      case 'files':
        data = await prisma.file.findMany({
          where: { userId },
          include: {
            project: true,
            task: true
          }
        });
        break;
      case 'all':
        const [projects, tasks, files] = await Promise.all([
          prisma.project.findMany({ where: { userId } }),
          prisma.task.findMany({ where: { userId } }),
          prisma.file.findMany({ where: { userId } })
        ]);
        data = { projects, tasks, files };
        break;
      default:
        throw new Error('Invalid export type');
    }

    // Generate file based on format
    const exportDir = path.join(__dirname, '../../exports');
    await fs.mkdir(exportDir, { recursive: true });
    const filename = `${id}.${format}`;
    const filepath = path.join(exportDir, filename);

    switch (format) {
      case 'json':
        await fs.writeFile(filepath, JSON.stringify(data, null, 2));
        break;
      case 'csv':
        if (Array.isArray(data)) {
          const parser = new Parser();
          const csv = parser.parse(data);
          await fs.writeFile(filepath, csv);
        } else {
          // Handle nested data
          const csvWriter = createObjectCsvWriter({
            path: filepath,
            header: Object.keys(data).map(key => ({ id: key, title: key }))
          });
          await csvWriter.writeRecords([data]);
        }
        break;
      case 'excel':
        const workbook = new ExcelJS.Workbook();
        if (Array.isArray(data)) {
          const worksheet = workbook.addWorksheet('Data');
          worksheet.columns = Object.keys(data[0]).map(key => ({
            header: key,
            key,
            width: 20
          }));
          worksheet.addRows(data);
        } else {
          // Handle nested data
          Object.entries(data).forEach(([key, value]) => {
            const worksheet = workbook.addWorksheet(key);
            if (Array.isArray(value)) {
              worksheet.columns = Object.keys(value[0]).map(k => ({
                header: k,
                key: k,
                width: 20
              }));
              worksheet.addRows(value);
            }
          });
        }
        await workbook.xlsx.writeFile(filepath);
        break;
      default:
        throw new Error('Invalid export format');
    }

    // Update export status
    await prisma.dataExport.update({
      where: { id },
      data: {
        status: 'completed',
        url: `/exports/${filename}`,
        completedAt: new Date()
      }
    });

    // Emit WebSocket event
    io.to(`user:${userId}`).emit('export:completed', { id, url: `/exports/${filename}` });
  } catch (error) {
    console.error('Export error:', error);
    await prisma.dataExport.update({
      where: { id: export_.id },
      data: {
        status: 'failed',
        error: error.message
      }
    });
  }
}

export default router; 