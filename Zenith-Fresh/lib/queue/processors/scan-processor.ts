import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { websiteScanner } from '../../services/website-scanner';
import { notificationService } from '../../services/notification-service';
import { alertService } from '../../services/alert-service';

const prisma = new PrismaClient();

export interface ScanJobData {
  scanId: string;
  projectId: string;
  url: string;
  scanType: 'manual' | 'scheduled';
  triggeredBy: string;
  options?: {
    device?: 'desktop' | 'mobile';
    includeScreenshot?: boolean;
    timeout?: number;
  };
}

export async function processScanJob(job: Job<ScanJobData>) {
  const { scanId, projectId, url, scanType, triggeredBy, options } = job.data;
  
  try {
    // Update scan status to running
    await prisma.websiteScan.update({
      where: { id: scanId },
      data: { 
        status: 'running',
      },
    });

    job.updateProgress(10);

    // Perform the website scan
    const scanResult = await websiteScanner.scanWebsite(url, options || {});
    
    job.updateProgress(70);

    // Save results to database
    const updatedScan = await prisma.websiteScan.update({
      where: { id: scanId },
      data: {
        status: 'completed',
        results: JSON.parse(JSON.stringify(scanResult)),
        performanceScore: scanResult.performance.score,
        accessibilityScore: scanResult.accessibility.score,
        bestPracticesScore: scanResult.bestPractices.score,
        seoScore: scanResult.seo.score,
        scanDuration: scanResult.technical.loadTime,
        completedAt: new Date(),
      },
      include: {
        project: {
          include: {
            user: true,
          },
        },
      },
    });

    job.updateProgress(85);

    // Check for alerts based on thresholds
    const alerts = await alertService.checkThresholds(scanId, scanResult);
    
    job.updateProgress(95);

    // Send notifications if there are alerts or if it's a scheduled scan
    if (alerts.length > 0 || scanType === 'scheduled') {
      await notificationService.sendScanNotification({
        scan: updatedScan,
        alerts,
        type: alerts.length > 0 ? 'alert' : 'report',
      });
    }

    job.updateProgress(100);

    return {
      scanId,
      status: 'completed',
      performanceScore: scanResult.performance.score,
      alertsGenerated: alerts.length,
    };

  } catch (error) {
    console.error(`Scan job failed for scanId ${scanId}:`, error);
    
    // Update scan status to failed
    await prisma.websiteScan.update({
      where: { id: scanId },
      data: { 
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    }).catch(console.error);

    throw error;
  }
}

export async function processScheduledScanJob(job: Job<{ scheduledScanId: string }>) {
  const { scheduledScanId } = job.data;
  
  try {
    // Get scheduled scan details
    const scheduledScan = await prisma.scheduledScan.findUnique({
      where: { id: scheduledScanId },
      include: {
        project: true,
      },
    });

    if (!scheduledScan || !scheduledScan.isActive) {
      throw new Error('Scheduled scan not found or inactive');
    }

    // Create new scan record
    const newScan = await prisma.websiteScan.create({
      data: {
        projectId: scheduledScan.projectId,
        url: scheduledScan.project.url,
        scanType: 'scheduled',
        status: 'pending',
        triggeredBy: 'schedule',
      },
    });

    // Update scheduled scan last run time
    await prisma.scheduledScan.update({
      where: { id: scheduledScanId },
      data: { lastRun: new Date() },
    });

    // Queue the actual scan job
    const { addScanJob } = await import('../index');
    await addScanJob({
      scanId: newScan.id,
      projectId: scheduledScan.projectId,
      url: scheduledScan.project.url,
      scanType: 'scheduled',
      triggeredBy: 'schedule',
      options: scheduledScan.scanConfig as any || {},
    });

    return {
      scheduledScanId,
      newScanId: newScan.id,
      status: 'queued',
    };

  } catch (error) {
    console.error(`Scheduled scan job failed for scheduledScanId ${scheduledScanId}:`, error);
    throw error;
  }
}