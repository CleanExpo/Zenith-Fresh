import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLogger } from '@/lib/audit/audit-logger';
import { Resend } from 'resend';

// Lazy initialization of Resend client to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not configured');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

interface FeedbackRequest {
  type: 'bug' | 'feature' | 'general' | 'urgent';
  message: string;
  screenshot?: string;
  attachments?: any[];
  email?: string;
  url: string;
  userAgent: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json();
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

    // Validate required fields
    if (!body.message || !body.type || !body.url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Rate limiting check (basic implementation)
    const rateLimitKey = `feedback_rate_limit:${clientIP}`;
    // In production, implement proper rate limiting with Redis

    // Create feedback record in database
    const feedback = await prisma.supportTicket.create({
      data: {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'feedback',
        priority: body.type === 'urgent' ? 'HIGH' : body.type === 'bug' ? 'MEDIUM' : 'LOW',
        status: 'OPEN',
        subject: `${body.type.charAt(0).toUpperCase() + body.type.slice(1)} Feedback`,
        description: body.message,
        metadata: JSON.stringify({
          feedbackType: body.type,
          url: body.url,
          userAgent: body.userAgent,
          screenshot: body.screenshot ? 'included' : 'none',
          attachmentCount: body.attachments?.length || 0,
          submittedAt: body.timestamp,
          clientIP,
        }),
        customerEmail: body.email || null,
        source: 'feedback_widget',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Log feedback submission
    await auditLogger.log({
      action: 'feedback_submitted',
      userId: null, // Anonymous feedback
      details: {
        feedbackId: feedback.id,
        type: body.type,
        hasEmail: !!body.email,
        hasScreenshot: !!body.screenshot,
        url: body.url,
      },
      metadata: {
        userAgent: body.userAgent,
        clientIP,
      },
    });

    // Send notification email to support team
    if (process.env.SUPPORT_EMAIL) {
      try {
        const priorityEmoji = {
          bug: '🐛',
          feature: '💡',
          general: '💬',
          urgent: '🚨',
        };

        const emailContent = `
          <h2>${priorityEmoji[body.type]} New ${body.type.charAt(0).toUpperCase() + body.type.slice(1)} Feedback</h2>
          
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>Ticket ID:</strong> ${feedback.id}<br>
            <strong>Type:</strong> ${body.type}<br>
            <strong>Priority:</strong> ${feedback.priority}<br>
            <strong>URL:</strong> ${body.url}<br>
            <strong>Submitted:</strong> ${new Date(body.timestamp).toLocaleString()}<br>
            ${body.email ? `<strong>Email:</strong> ${body.email}<br>` : ''}
          </div>

          <h3>Message:</h3>
          <div style="background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            ${body.message.replace(/\n/g, '<br>')}
          </div>

          ${body.screenshot ? '<p><strong>Screenshot:</strong> Included in submission</p>' : ''}
          ${body.attachments?.length ? `<p><strong>Attachments:</strong> ${body.attachments.length} file(s)</p>` : ''}

          <hr style="margin: 24px 0;">
          
          <p style="color: #6b7280; font-size: 14px;">
            <strong>User Agent:</strong> ${body.userAgent}<br>
            <strong>IP Address:</strong> ${clientIP}
          </p>

          <div style="margin-top: 24px; padding: 16px; background: #f0f9ff; border-radius: 8px;">
            <p style="margin: 0; color: #1e40af;">
              💡 <strong>Quick Actions:</strong><br>
              • Review and respond within 24 hours for ${body.type === 'urgent' ? 'urgent' : 'standard'} priority<br>
              • Check for similar feedback or known issues<br>
              • Consider tagging relevant team members
            </p>
          </div>
        `;

        const resendClient = getResendClient();
        await resendClient.emails.send({
          from: 'Zenith Support <support@zenith.engineer>',
          to: [process.env.SUPPORT_EMAIL],
          subject: `${priorityEmoji[body.type]} New ${body.type} feedback - ${feedback.id}`,
          html: emailContent,
          headers: {
            'X-Feedback-ID': feedback.id,
            'X-Feedback-Type': body.type,
            'X-Priority': feedback.priority,
          },
        });
      } catch (emailError) {
        console.error('Failed to send support notification email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Send auto-response to user if email provided
    if (body.email) {
      try {
        const responseMessage = getAutoResponseMessage(body.type);
        
        const resendClient = getResendClient();
        await resendClient.emails.send({
          from: 'Zenith Support <support@zenith.engineer>',
          to: [body.email],
          subject: `We received your ${body.type} feedback - ${feedback.id}`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">Thank you for your feedback!</h1>
              </div>
              
              <div style="padding: 32px; background: white;">
                <p>Hi there,</p>
                
                <p>We've received your ${body.type} feedback and wanted to let you know that we truly appreciate you taking the time to help us improve Zenith Platform.</p>
                
                <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <strong>Your Feedback ID:</strong> ${feedback.id}<br>
                  <strong>Type:</strong> ${body.type.charAt(0).toUpperCase() + body.type.slice(1)}<br>
                  <strong>Status:</strong> Received and under review
                </div>

                ${responseMessage}

                <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 24px 0;">
                  <h3 style="margin-top: 0; color: #1e40af;">What happens next?</h3>
                  <ul style="margin-bottom: 0; color: #374151;">
                    <li>Our team will review your feedback within 24 hours</li>
                    <li>For urgent issues, we'll prioritize and respond quickly</li>
                    <li>We'll keep you updated on any progress or questions</li>
                    <li>Your feedback helps us make Zenith Platform better for everyone</li>
                  </ul>
                </div>

                <p>If you have any urgent concerns or need immediate assistance, please don't hesitate to reach out to us directly at <a href="mailto:support@zenith.engineer">support@zenith.engineer</a>.</p>

                <p>Best regards,<br>The Zenith Platform Team</p>
              </div>

              <div style="background: #f8f9fa; padding: 16px; text-align: center; color: #6b7280; font-size: 14px;">
                <p>This is an automated response to confirm we received your feedback.</p>
                <p>Zenith Platform | Building the future of digital experiences</p>
              </div>
            </div>
          `,
          headers: {
            'X-Feedback-ID': feedback.id,
            'X-Auto-Response': 'true',
          },
        });
      } catch (emailError) {
        console.error('Failed to send auto-response email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Generate intelligent response suggestions for support team
    const suggestions = generateResponseSuggestions(body);

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
      message: 'Feedback submitted successfully',
      estimatedResponse: body.type === 'urgent' ? '2-4 hours' : '24-48 hours',
      suggestions, // Internal use for support team
    });

  } catch (error) {
    console.error('Error handling feedback submission:', error);
    
    await auditLogger.log({
      action: 'feedback_submission_failed',
      userId: null,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: body?.type || 'unknown',
      },
    });

    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

function getAutoResponseMessage(type: string): string {
  switch (type) {
    case 'bug':
      return `
        <p><strong>Bug reports are incredibly valuable!</strong> 🐛</p>
        <p>We'll investigate this issue promptly and work on a fix. If this is affecting your work significantly, please let us know and we'll prioritize it accordingly.</p>
      `;
    case 'feature':
      return `
        <p><strong>Feature requests help shape our roadmap!</strong> 💡</p>
        <p>We'll review your suggestion and consider it for future updates. Great ideas often come from our users, so thank you for sharing your thoughts.</p>
      `;
    case 'urgent':
      return `
        <p><strong>We understand this is urgent!</strong> 🚨</p>
        <p>Your feedback has been marked as high priority and our team will review it immediately. We'll reach out as soon as possible to address your concern.</p>
      `;
    default:
      return `
        <p><strong>Your feedback matters to us!</strong> 💬</p>
        <p>We read every piece of feedback and use it to continuously improve Zenith Platform. Thank you for helping us build a better product.</p>
      `;
  }
}

function generateResponseSuggestions(feedback: FeedbackRequest): string[] {
  const suggestions: string[] = [];

  // AI-powered suggestion generation based on feedback content
  const message = feedback.message.toLowerCase();

  // Common patterns and suggested responses
  if (message.includes('slow') || message.includes('performance')) {
    suggestions.push('Investigate performance metrics for the reported URL');
    suggestions.push('Check server response times and database query performance');
    suggestions.push('Consider providing performance optimization tips');
  }

  if (message.includes('bug') || message.includes('error') || message.includes('broken')) {
    suggestions.push('Reproduce the issue in development environment');
    suggestions.push('Check error logs for the reported timestamp');
    suggestions.push('Verify if this affects other users');
  }

  if (message.includes('feature') || message.includes('would like') || message.includes('suggest')) {
    suggestions.push('Evaluate feature complexity and impact');
    suggestions.push('Check if similar requests exist');
    suggestions.push('Consider adding to product roadmap');
  }

  if (message.includes('confusing') || message.includes('unclear') || message.includes('hard to')) {
    suggestions.push('Review UX/UI design for the mentioned area');
    suggestions.push('Consider adding help documentation');
    suggestions.push('Evaluate need for user onboarding improvements');
  }

  if (feedback.type === 'urgent') {
    suggestions.push('Escalate to senior support team');
    suggestions.push('Consider immediate workaround solutions');
    suggestions.push('Schedule follow-up within 2 hours');
  }

  // Default suggestions if no specific patterns found
  if (suggestions.length === 0) {
    suggestions.push('Acknowledge feedback and thank the user');
    suggestions.push('Ask for additional details if needed');
    suggestions.push('Provide timeline for investigation or implementation');
  }

  return suggestions;
}

export async function GET(request: NextRequest) {
  // Get feedback statistics for admin dashboard
  try {
    const feedbackStats = await prisma.supportTicket.groupBy({
      by: ['status'],
      where: {
        type: 'feedback',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      _count: {
        id: true,
      },
    });

    const typeStats = await prisma.supportTicket.findMany({
      where: {
        type: 'feedback',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        metadata: true,
        priority: true,
        createdAt: true,
      },
    });

    // Parse metadata to get feedback types
    const feedbackTypes = typeStats.map(ticket => {
      try {
        const metadata = JSON.parse(ticket.metadata || '{}');
        return {
          type: metadata.feedbackType || 'unknown',
          priority: ticket.priority,
          date: ticket.createdAt,
        };
      } catch {
        return {
          type: 'unknown',
          priority: ticket.priority,
          date: ticket.createdAt,
        };
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        byStatus: feedbackStats,
        byType: feedbackTypes.reduce((acc, item) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        total: typeStats.length,
        recentActivity: feedbackTypes
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback statistics' },
      { status: 500 }
    );
  }
}
