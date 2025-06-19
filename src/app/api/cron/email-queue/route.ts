import { NextRequest, NextResponse } from 'next/server';
import { CronMonitors } from '@/lib/cron-monitoring';
import { prisma } from '@/lib/prisma';

// This would typically be replaced with your actual email service
interface EmailQueue {
  id: string;
  to: string;
  subject: string;
  body: string;
  attempts: number;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
  scheduledFor?: Date;
}

export async function POST(req: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await CronMonitors.emailQueue.monitor(async () => {
      const processResults = {
        processed: 0,
        sent: 0,
        failed: 0,
        retries: 0,
      };

      // Get pending emails (limit to 100 per batch)
      const pendingEmails = await prisma.emailQueue.findMany({
        where: {
          status: 'pending',
          OR: [
            { scheduledFor: null },
            { scheduledFor: { lte: new Date() } },
          ],
          attempts: { lt: 3 }, // Max 3 attempts
        },
        take: 100,
        orderBy: { createdAt: 'asc' },
      });

      processResults.processed = pendingEmails.length;

      for (const email of pendingEmails) {
        try {
          // Send email using Resend
          const messageId = await sendEmailFromQueue({
            to: email.to,
            subject: email.subject,
            body: email.body,
          });

          // Mark as sent
          await prisma.emailQueue.update({
            where: { id: email.id },
            data: {
              status: 'sent',
              sentAt: new Date(),
              messageId: messageId,
            },
          });

          processResults.sent++;
        } catch (emailError) {
          console.error(`Failed to send email ${email.id}:`, emailError);

          const newAttempts = email.attempts + 1;
          
          if (newAttempts >= 3) {
            // Mark as permanently failed
            await prisma.emailQueue.update({
              where: { id: email.id },
              data: {
                status: 'failed',
                attempts: newAttempts,
                error: emailError instanceof Error ? emailError.message : 'Unknown error',
              },
            });
            processResults.failed++;
          } else {
            // Schedule for retry with exponential backoff
            const retryDelay = Math.pow(2, newAttempts) * 60 * 1000; // 2^attempts minutes
            await prisma.emailQueue.update({
              where: { id: email.id },
              data: {
                attempts: newAttempts,
                scheduledFor: new Date(Date.now() + retryDelay),
                error: emailError instanceof Error ? emailError.message : 'Unknown error',
              },
            });
            processResults.retries++;
          }
        }
      }

      console.log('Email queue processing completed:', processResults);
      return processResults;
    });

    return NextResponse.json({
      status: 'completed',
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('Email queue processing failed:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, {
      status: 500
    });
  }
}

// Email sending function using Resend
async function sendEmailFromQueue({ to, subject, body }: { to: string; subject: string; body: string }) {
  const { sendEmail } = await import('@/lib/email');
  
  const result = await sendEmail({
    to,
    subject,
    html: body,
    tags: [{ name: 'source', value: 'queue' }],
  });
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to send email');
  }
  
  return result.messageId;
}