import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendEmail, sendWelcomeEmail, EmailTemplates } from '@/lib/email';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, to } = await request.json();
    
    if (!to || typeof to !== 'string') {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail(to, 'Test User');
        break;
        
      case 'team-invitation':
        result = await sendEmail({
          to,
          subject: EmailTemplates.teamInvitation('John Doe', 'Test Team', 'https://zenith.engineer/invite?token=test123').subject,
          html: EmailTemplates.teamInvitation('John Doe', 'Test Team', 'https://zenith.engineer/invite?token=test123').html,
          text: EmailTemplates.teamInvitation('John Doe', 'Test Team', 'https://zenith.engineer/invite?token=test123').text,
          tags: [{ name: 'type', value: 'test' }],
        });
        break;
        
      case 'password-reset':
        result = await sendEmail({
          to,
          subject: EmailTemplates.passwordReset('Test User', 'https://zenith.engineer/reset?token=test123').subject,
          html: EmailTemplates.passwordReset('Test User', 'https://zenith.engineer/reset?token=test123').html,
          text: EmailTemplates.passwordReset('Test User', 'https://zenith.engineer/reset?token=test123').text,
          tags: [{ name: 'type', value: 'test' }],
        });
        break;
        
      case 'payment-success':
        result = await sendEmail({
          to,
          subject: EmailTemplates.paymentSuccess('Test User', '$29.99', 'Pro Plan').subject,
          html: EmailTemplates.paymentSuccess('Test User', '$29.99', 'Pro Plan').html,
          text: EmailTemplates.paymentSuccess('Test User', '$29.99', 'Pro Plan').text,
          tags: [{ name: 'type', value: 'test' }],
        });
        break;
        
      case 'basic':
      default:
        result = await sendEmail({
          to,
          subject: 'Test Email from Zenith Platform',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">Test Email</h1>
              <p>This is a test email from Zenith Platform to verify that the Resend email service is working correctly.</p>
              <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
              <p><strong>From:</strong> ${session.user.email}</p>
              <hr style="margin: 20px 0;">
              <p style="color: #666; font-size: 14px;">This email was sent using Resend API integration.</p>
            </div>
          `,
          text: `Test Email from Zenith Platform

This is a test email to verify that the Resend email service is working correctly.

Sent at: ${new Date().toISOString()}
From: ${session.user.email}

This email was sent using Resend API integration.`,
          tags: [
            { name: 'type', value: 'test' },
            { name: 'sender', value: session.user.email },
          ],
        });
        break;
    }

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
      type,
      to,
    });
  } catch (error) {
    console.error('Test email error:', error);
    Sentry.captureException(error as Error, {
      extra: {
        context: 'test-email',
        userEmail: (await getServerSession(authOptions))?.user?.email,
      }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint',
    usage: 'POST with { "type": "basic|welcome|team-invitation|password-reset|payment-success", "to": "email@example.com" }',
    types: [
      'basic - Simple test email',
      'welcome - Welcome email template',
      'team-invitation - Team invitation template',
      'password-reset - Password reset template',
      'payment-success - Payment success template'
    ]
  });
}