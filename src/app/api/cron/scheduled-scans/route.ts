// src/app/api/cron/scheduled-scans/route.ts
// Cron job for executing scheduled website scans

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeWebsiteHealth } from '@/lib/services/website-analyzer';
import { sendEmail } from '@/lib/email';
import * as Sentry from '@sentry/nextjs';

// Helper function to calculate next run time
function calculateNextRun(frequency: string, dayOfWeek?: number | null, dayOfMonth?: number | null, timeOfDay?: string, timezone?: string): Date {
  const now = new Date();
  const [hours, minutes] = timeOfDay ? timeOfDay.split(':').map(Number) : [9, 0];
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);
  
  switch (frequency) {
    case 'daily':
      nextRun.setDate(nextRun.getDate() + 1);
      break;
      
    case 'weekly':
      const targetDay = dayOfWeek ?? 1;
      const currentDay = nextRun.getDay();
      let daysUntilNext = (targetDay - currentDay + 7) % 7;
      
      if (daysUntilNext === 0) {
        daysUntilNext = 7; // Next week
      }
      
      nextRun.setDate(nextRun.getDate() + daysUntilNext);
      break;
      
    case 'monthly':
      const targetDate = dayOfMonth ?? 1;
      nextRun.setMonth(nextRun.getMonth() + 1);
      nextRun.setDate(targetDate);
      
      // Handle month overflow (e.g., January 31 -> February 28/29)
      if (nextRun.getDate() !== targetDate) {
        nextRun.setDate(0); // Set to last day of previous month
      }
      break;
  }
  
  return nextRun;
}

// Email template for scan completion
function createScanCompletionEmail(
  userName: string,
  scanName: string,
  url: string,
  overallScore: number,
  analysisData: any,
  dashboardUrl: string
) {
  // Calculate score color and status
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#16a34a'; // green
    if (score >= 60) return '#f59e0b'; // yellow  
    return '#dc2626'; // red
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const scoreColor = getScoreColor(overallScore);
  const scoreStatus = getScoreStatus(overallScore);

  return {
    subject: `Website Scan Complete: ${scanName} - ${overallScore}% (${scoreStatus})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Website Scan Complete</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your scheduled scan results are ready</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">Hi ${userName},</p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Your scheduled scan "<strong>${scanName}</strong>" has completed successfully. Here's a summary of your website's health:
          </p>

          <!-- Score Card -->
          <div style="background-color: #f8fafc; border: 2px solid ${scoreColor}; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
            <div style="font-size: 48px; font-weight: bold; color: ${scoreColor}; margin-bottom: 10px;">${overallScore}%</div>
            <div style="font-size: 18px; color: #374151; font-weight: 600;">${scoreStatus}</div>
            <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">Overall Health Score</div>
          </div>

          <!-- URL -->
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">Scanned Website:</div>
            <div style="font-size: 16px; color: #1f2937; font-weight: 500; word-break: break-all;">${url}</div>
          </div>

          <!-- Key Metrics -->
          ${analysisData?.pillars ? `
          <div style="margin: 25px 0;">
            <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Key Performance Areas:</h3>
            <div style="display: grid; gap: 15px;">
              ${Object.entries(analysisData.pillars).map(([key, pillar]: [string, any]) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background-color: #f9fafb; border-radius: 6px;">
                  <span style="font-weight: 500; color: #374151; text-transform: capitalize;">${key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span style="font-weight: bold; color: ${getScoreColor(pillar.score)};">${pillar.score}%</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" 
               style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block; 
                      font-weight: 600;
                      font-size: 16px;">
              View Full Report
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; line-height: 1.5; margin: 20px 0;">
            This scan was automatically generated based on your scheduled scan settings. 
            You can manage your scheduled scans in your dashboard.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            This email was sent by Zenith Platform. 
            <a href="${dashboardUrl}/settings" style="color: #2563eb;">Manage notification preferences</a>
          </p>
        </div>
      </div>
    `,
    text: `Website Scan Complete: ${scanName}

Hi ${userName},

Your scheduled scan "${scanName}" has completed successfully.

Overall Health Score: ${overallScore}% (${scoreStatus})
Website: ${url}

${analysisData?.pillars ? Object.entries(analysisData.pillars).map(([key, pillar]: [string, any]) => 
  `${key.replace(/([A-Z])/g, ' $1').trim()}: ${pillar.score}%`
).join('\n') : ''}

View your full report: ${dashboardUrl}

This scan was automatically generated based on your scheduled scan settings.
You can manage your scheduled scans in your dashboard.

-- 
Zenith Platform
Manage preferences: ${dashboardUrl}/settings`
  };
}

/**
 * POST /api/cron/scheduled-scans
 * Execute pending scheduled scans (called by cron service)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source (cron service)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      );
    }

    const startTime = Date.now();
    console.log('🔄 Starting scheduled scans execution...');

    // Find all scheduled scans that are due to run
    const currentTime = new Date();
    const dueScans = await prisma.scheduledScan.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          lte: currentTime
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        nextRunAt: 'asc'
      }
    });

    console.log(`📋 Found ${dueScans.length} scheduled scans to execute`);

    const results = {
      totalScans: dueScans.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ scanId: string; error: string }>
    };

    // Process each scheduled scan
    for (const scheduledScan of dueScans) {
      try {
        console.log(`🔍 Executing scan: ${scheduledScan.name} (${scheduledScan.url})`);

        // Update run tracking
        await prisma.scheduledScan.update({
          where: { id: scheduledScan.id },
          data: {
            runCount: { increment: 1 },
            lastRunAt: currentTime
          }
        });

        // Execute the website scan with timeout
        const scanResult = await Promise.race([
          analyzeWebsiteHealth(scheduledScan.url),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Scan timeout after 45 seconds')), 45000)
          )
        ]) as any;

        // Save the analysis result
        const websiteAnalysis = await prisma.websiteAnalysis.create({
          data: {
            userId: scheduledScan.userId,
            url: scheduledScan.url,
            analysisId: scanResult.crawlId || `scheduled-${Date.now()}`,
            overallScore: scanResult.overall?.score || 0,
            contentQualityScore: scanResult.pillars?.onPageSEO?.score || null,
            seoScore: scanResult.pillars?.technicalSEO?.score || null,
            uxScore: null, // Not available in current analyzer
            performanceScore: scanResult.pillars?.performance?.score || null,
            accessibilityScore: scanResult.pillars?.accessibility?.score || null,
            recommendationCount: scanResult.pillars ? Object.values(scanResult.pillars).reduce((count, pillar: any) => 
              count + (pillar.recommendations?.length || 0), 0) : 0,
            issueCount: scanResult.pillars ? JSON.stringify(
              Object.fromEntries(
                Object.entries(scanResult.pillars).map(([key, pillar]: [string, any]) => [
                  key, 
                  pillar.issues?.length || 0
                ])
              )
            ) : null,
            analysisData: scanResult,
            scheduledScanId: scheduledScan.id
          }
        });

        // Calculate next run time
        const nextRunAt = calculateNextRun(
          scheduledScan.frequency,
          scheduledScan.dayOfWeek,
          scheduledScan.dayOfMonth,
          scheduledScan.timeOfDay,
          scheduledScan.timezone
        );

        // Update scan success tracking and next run time
        await prisma.scheduledScan.update({
          where: { id: scheduledScan.id },
          data: {
            successCount: { increment: 1 },
            nextRunAt,
            lastError: null // Clear any previous errors
          }
        });

        // Send email notification if enabled
        if (scheduledScan.emailNotifications && scheduledScan.notificationEmails.length > 0) {
          try {
            const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
            const emailTemplate = createScanCompletionEmail(
              scheduledScan.user.name || 'User',
              scheduledScan.name,
              scheduledScan.url,
              scanResult.overall?.score || 0,
              scanResult,
              dashboardUrl
            );

            // Send to all notification emails
            for (const email of scheduledScan.notificationEmails) {
              await sendEmail({
                to: email,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                text: emailTemplate.text,
                tags: [
                  { name: 'type', value: 'scheduled-scan-completion' },
                  { name: 'scan-id', value: scheduledScan.id }
                ]
              });
            }

            console.log(`📧 Email notifications sent for scan: ${scheduledScan.name}`);
          } catch (emailError) {
            console.error('Email notification failed:', emailError);
            // Don't fail the entire scan for email issues
          }
        }

        results.successful++;
        console.log(`✅ Scan completed successfully: ${scheduledScan.name}`);

      } catch (error) {
        console.error(`❌ Scan failed: ${scheduledScan.name}`, error);
        
        // Update failure tracking
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        await prisma.scheduledScan.update({
          where: { id: scheduledScan.id },
          data: {
            failureCount: { increment: 1 },
            lastError: errorMessage,
            // Still calculate next run even on failure
            nextRunAt: calculateNextRun(
              scheduledScan.frequency,
              scheduledScan.dayOfWeek,
              scheduledScan.dayOfMonth,
              scheduledScan.timeOfDay,
              scheduledScan.timezone
            )
          }
        });

        results.failed++;
        results.errors.push({
          scanId: scheduledScan.id,
          error: errorMessage
        });

        // Capture error in Sentry
        Sentry.captureException(error as Error, {
          extra: {
            context: 'scheduled-scan-execution',
            scanId: scheduledScan.id,
            scanName: scheduledScan.name,
            url: scheduledScan.url,
            userId: scheduledScan.userId,
          },
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`🏁 Scheduled scans execution completed in ${duration}ms`);
    console.log(`📊 Results: ${results.successful} successful, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      message: 'Scheduled scans execution completed',
      results,
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Scheduled scans cron job error:', error);
    
    Sentry.captureException(error as Error, {
      extra: {
        context: 'scheduled-scans-cron',
      },
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to execute scheduled scans',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/scheduled-scans
 * Get next scheduled scans (for monitoring/debugging)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      );
    }

    // Get next 10 scheduled scans
    const upcomingScans = await prisma.scheduledScan.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          gte: new Date()
        }
      },
      orderBy: {
        nextRunAt: 'asc'
      },
      take: 10,
      select: {
        id: true,
        name: true,
        url: true,
        frequency: true,
        nextRunAt: true,
        lastRunAt: true,
        runCount: true,
        successCount: true,
        failureCount: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    // Get overdue scans
    const overdueScans = await prisma.scheduledScan.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          lt: new Date()
        }
      },
      orderBy: {
        nextRunAt: 'asc'
      },
      take: 5,
      select: {
        id: true,
        name: true,
        url: true,
        frequency: true,
        nextRunAt: true,
        lastRunAt: true,
        lastError: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        upcoming: upcomingScans,
        overdue: overdueScans,
        stats: {
          totalActive: await prisma.scheduledScan.count({ where: { isActive: true } }),
          totalOverdue: overdueScans.length
        }
      }
    });

  } catch (error) {
    console.error('Scheduled scans status error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get scheduled scans status',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}