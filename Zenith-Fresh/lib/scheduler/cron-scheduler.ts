import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { addScheduledScanJob } from '../queue';

const prisma = new PrismaClient();

class CronScheduler {
  private static instance: CronScheduler;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  
  public static getInstance(): CronScheduler {
    if (!CronScheduler.instance) {
      CronScheduler.instance = new CronScheduler();
    }
    return CronScheduler.instance;
  }

  async initialize() {
    console.log('Initializing cron scheduler...');
    
    // Load all active scheduled scans from database
    const scheduledScans = await prisma.scheduledScan.findMany({
      where: { isActive: true },
      include: { project: true },
    });

    console.log(`Found ${scheduledScans.length} active scheduled scans`);

    // Schedule each scan
    for (const scheduledScan of scheduledScans) {
      await this.scheduleJob(scheduledScan);
    }

    // Schedule a cleanup job to run daily at 2 AM
    this.scheduleCleanupJob();

    console.log('Cron scheduler initialized successfully');
  }

  async scheduleJob(scheduledScan: any) {
    try {
      // Validate cron expression
      if (!cron.validate(scheduledScan.schedule)) {
        console.error(`Invalid cron expression for scheduled scan ${scheduledScan.id}: ${scheduledScan.schedule}`);
        return;
      }

      // Remove existing task if it exists
      const existingTask = this.scheduledTasks.get(scheduledScan.id);
      if (existingTask) {
        existingTask.stop();
        this.scheduledTasks.delete(scheduledScan.id);
      }

      // Create new scheduled task
      const task = cron.schedule(
        scheduledScan.schedule,
        async () => {
          console.log(`Executing scheduled scan: ${scheduledScan.name} (${scheduledScan.id})`);
          
          try {
            // Add job to queue
            await addScheduledScanJob({ scheduledScanId: scheduledScan.id });
            
            console.log(`Scheduled scan job queued successfully: ${scheduledScan.id}`);
          } catch (error) {
            console.error(`Failed to queue scheduled scan ${scheduledScan.id}:`, error);
          }
        },
        {
          timezone: 'UTC', // Use UTC for consistency
        }
      );

      // Start the task
      task.start();
      
      // Store the task for management
      this.scheduledTasks.set(scheduledScan.id, task);

      // Calculate next run time
      const nextRun = this.getNextRunTime(scheduledScan.schedule);
      if (nextRun) {
        await prisma.scheduledScan.update({
          where: { id: scheduledScan.id },
          data: { nextRun },
        });
      }

      console.log(`Scheduled scan "${scheduledScan.name}" scheduled with cron: ${scheduledScan.schedule}`);
    } catch (error) {
      console.error(`Failed to schedule scan ${scheduledScan.id}:`, error);
    }
  }

  async unscheduleJob(scheduledScanId: string) {
    const task = this.scheduledTasks.get(scheduledScanId);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(scheduledScanId);
      console.log(`Unscheduled scan: ${scheduledScanId}`);
    }
  }

  async updateSchedule(scheduledScanId: string) {
    try {
      const scheduledScan = await prisma.scheduledScan.findUnique({
        where: { id: scheduledScanId },
        include: { project: true },
      });

      if (!scheduledScan) {
        console.error(`Scheduled scan not found: ${scheduledScanId}`);
        return;
      }

      if (scheduledScan.isActive) {
        await this.scheduleJob(scheduledScan);
      } else {
        await this.unscheduleJob(scheduledScanId);
      }
    } catch (error) {
      console.error(`Failed to update schedule for ${scheduledScanId}:`, error);
    }
  }

  private scheduleCleanupJob() {
    // Schedule cleanup job daily at 2 AM UTC
    cron.schedule('0 2 * * *', async () => {
      console.log('Running daily cleanup job...');
      
      try {
        // Clean up old completed scans (keep last 100 per project)
        await this.cleanupOldScans();
        
        // Clean up resolved alerts older than 30 days
        await this.cleanupOldAlerts();
        
        // Update next run times for all scheduled scans
        await this.updateNextRunTimes();
        
        console.log('Daily cleanup job completed');
      } catch (error) {
        console.error('Daily cleanup job failed:', error);
      }
    }, {
      timezone: 'UTC',
    });
  }

  private async cleanupOldScans() {
    const projects = await prisma.project.findMany({
      select: { id: true },
    });

    for (const project of projects) {
      // Get scans to keep (latest 100)
      const scansToKeep = await prisma.websiteScan.findMany({
        where: { 
          projectId: project.id,
          status: 'completed',
        },
        orderBy: { completedAt: 'desc' },
        take: 100,
        select: { id: true },
      });

      const keepIds = scansToKeep.map(scan => scan.id);

      // Delete old scans (keeping alerts via cascade)
      const deleteResult = await prisma.websiteScan.deleteMany({
        where: {
          projectId: project.id,
          status: 'completed',
          id: { notIn: keepIds },
        },
      });

      if (deleteResult.count > 0) {
        console.log(`Cleaned up ${deleteResult.count} old scans for project ${project.id}`);
      }
    }
  }

  private async cleanupOldAlerts() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleteResult = await prisma.scanAlert.deleteMany({
      where: {
        isResolved: true,
        resolvedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    if (deleteResult.count > 0) {
      console.log(`Cleaned up ${deleteResult.count} old resolved alerts`);
    }
  }

  private async updateNextRunTimes() {
    const activeScheduledScans = await prisma.scheduledScan.findMany({
      where: { isActive: true },
    });

    for (const scheduledScan of activeScheduledScans) {
      try {
        const nextRun = this.getNextRunTime(scheduledScan.schedule);
        if (nextRun) {
          await prisma.scheduledScan.update({
            where: { id: scheduledScan.id },
            data: { nextRun },
          });
        }
      } catch (error) {
        console.error(`Failed to update next run time for ${scheduledScan.id}:`, error);
      }
    }
  }

  private getNextRunTime(cronExpression: string): Date | null {
    try {
      if (!cron.validate(cronExpression)) {
        return null;
      }

      // This is a simplified calculation
      // In a production environment, you might want to use a more sophisticated library
      const now = new Date();
      const nextRun = new Date(now.getTime() + 60 * 60 * 1000); // Default to 1 hour from now
      
      // For common patterns, calculate more accurately
      if (cronExpression === '0 9 * * *') {
        // Daily at 9 AM
        nextRun.setHours(9, 0, 0, 0);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      } else if (cronExpression === '0 9 * * 1') {
        // Weekly on Monday at 9 AM
        nextRun.setHours(9, 0, 0, 0);
        const dayOfWeek = nextRun.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
        nextRun.setDate(nextRun.getDate() + daysUntilMonday);
      } else if (cronExpression === '0 9 1 * *') {
        // Monthly on the 1st at 9 AM
        nextRun.setHours(9, 0, 0, 0);
        nextRun.setDate(1);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
      }

      return nextRun;
    } catch (error) {
      console.error(`Failed to calculate next run time for cron: ${cronExpression}`, error);
      return null;
    }
  }

  getScheduledTasks() {
    return Array.from(this.scheduledTasks.keys());
  }

  async shutdown() {
    console.log('Shutting down cron scheduler...');
    
    for (const [id, task] of Array.from(this.scheduledTasks)) {
      task.stop();
    }
    
    this.scheduledTasks.clear();
    console.log('Cron scheduler shut down successfully');
  }
}

export const cronScheduler = CronScheduler.getInstance();