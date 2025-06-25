import { Resend } from 'resend';
import * as Sentry from '@sentry/nextjs';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  tags?: Array<{
    name: string;
    value: string;
  }>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

const DEFAULT_FROM = process.env.SMTP_FROM || 'noreply@zenith.engineer';

export async function sendEmail(params: EmailParams): Promise<EmailResponse> {
  try {
    // Validate required parameters
    if (!params.to) {
      throw new Error('Recipient email address is required');
    }
    
    if (!params.subject) {
      throw new Error('Email subject is required');
    }
    
    if (!params.html && !params.text) {
      throw new Error('Email content (html or text) is required');
    }

    // Check if Resend is properly configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, email will not be sent');
      return { success: false, error: 'Email service not configured' };
    }

    // Send email using Resend
    const emailPayload: any = {
      from: params.from || DEFAULT_FROM,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
    };

    // Add content (html or text - at least one required)
    if (params.html) emailPayload.html = params.html;
    if (params.text) emailPayload.text = params.text;

    // Add optional fields only if they exist
    if (params.replyTo) emailPayload.replyTo = params.replyTo;
    if (params.cc) emailPayload.cc = Array.isArray(params.cc) ? params.cc : [params.cc];
    if (params.bcc) emailPayload.bcc = Array.isArray(params.bcc) ? params.bcc : [params.bcc];
    if (params.attachments) emailPayload.attachments = params.attachments;
    if (params.tags) emailPayload.tags = params.tags;

    const response = await resend.emails.send(emailPayload);

    if (response.error) {
      throw new Error(`Resend API error: ${response.error.message}`);
    }

    console.log(`Email sent successfully to ${params.to}:`, response.data?.id);
    
    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown email error';
    
    console.error('Failed to send email:', {
      error: errorMessage,
      to: params.to,
      subject: params.subject,
    });

    // Capture error in Sentry
    Sentry.captureException(error as Error, {
      extra: {
        context: 'email-service',
        to: params.to,
        subject: params.subject,
        hasHtml: !!params.html,
        hasText: !!params.text,
      },
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Email templates
export const EmailTemplates = {
  // Welcome email for new users
  welcome: (name: string, loginUrl: string) => ({
    subject: 'Welcome to Zenith Platform!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to Zenith Platform!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for joining Zenith Platform. We're excited to have you on board!</p>
        <p>You can access your dashboard by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Access Dashboard
          </a>
        </div>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The Zenith Team</p>
      </div>
    `,
    text: `Welcome to Zenith Platform!

Hi ${name},

Thank you for joining Zenith Platform. We're excited to have you on board!

Access your dashboard: ${loginUrl}

If you have any questions, feel free to reach out to our support team.

Best regards,
The Zenith Team`,
  }),

  // Team invitation email
  teamInvitation: (inviterName: string, teamName: string, inviteUrl: string) => ({
    subject: `You've been invited to join ${teamName} on Zenith Platform`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Team Invitation</h1>
        <p>Hi there,</p>
        <p>${inviterName} has invited you to join the <strong>${teamName}</strong> team on Zenith Platform.</p>
        <p>Click the button below to accept the invitation and get started:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p>If you don't want to join this team, you can safely ignore this email.</p>
        <p>Best regards,<br>The Zenith Team</p>
      </div>
    `,
    text: `Team Invitation

Hi there,

${inviterName} has invited you to join the ${teamName} team on Zenith Platform.

Accept invitation: ${inviteUrl}

If you don't want to join this team, you can safely ignore this email.

Best regards,
The Zenith Team`,
  }),

  // Password reset email
  passwordReset: (name: string, resetUrl: string) => ({
    subject: 'Reset your Zenith Platform password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Password Reset Request</h1>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password for your Zenith Platform account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, you can safely ignore this email.</p>
        <p>Best regards,<br>The Zenith Team</p>
      </div>
    `,
    text: `Password Reset Request

Hi ${name},

We received a request to reset your password for your Zenith Platform account.

Reset your password: ${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
The Zenith Team`,
  }),

  // Payment successful notification
  paymentSuccess: (name: string, amount: string, planName: string) => ({
    subject: 'Payment Successful - Zenith Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Payment Successful!</h1>
        <p>Hi ${name},</p>
        <p>Your payment of <strong>${amount}</strong> for the <strong>${planName}</strong> plan has been processed successfully.</p>
        <p>Your subscription is now active and you have full access to all features.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Payment Details:</h3>
          <p style="margin: 5px 0;"><strong>Plan:</strong> ${planName}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ${amount}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> Active</p>
        </div>
        <p>Thank you for your continued trust in Zenith Platform!</p>
        <p>Best regards,<br>The Zenith Team</p>
      </div>
    `,
    text: `Payment Successful!

Hi ${name},

Your payment of ${amount} for the ${planName} plan has been processed successfully.

Your subscription is now active and you have full access to all features.

Payment Details:
- Plan: ${planName}
- Amount: ${amount}
- Status: Active

Thank you for your continued trust in Zenith Platform!

Best regards,
The Zenith Team`,
  }),
};

// Helper functions for common email operations
export async function sendWelcomeEmail(to: string, name: string): Promise<EmailResponse> {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
  const template = EmailTemplates.welcome(name, loginUrl);
  
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [{ name: 'type', value: 'welcome' }],
  });
}

export async function sendTeamInvitationEmail(
  to: string,
  inviterName: string,
  teamName: string,
  inviteToken: string,
  customMessage?: string
): Promise<EmailResponse> {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${inviteToken}`;
  const template = EmailTemplates.teamInvitation(inviterName, teamName, inviteUrl);
  
  // Add custom message if provided
  let html = template.html;
  let text = template.text;
  
  if (customMessage) {
    const customMessageHtml = `<div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
      <p style="margin: 0; font-style: italic;">"${customMessage}"</p>
    </div>`;
    
    html = html.replace('<p>Click the button below', `${customMessageHtml}<p>Click the button below`);
    text = text.replace('Accept invitation:', `Personal message: "${customMessage}"\n\nAccept invitation:`);
  }
  
  return sendEmail({
    to,
    subject: template.subject,
    html,
    text,
    tags: [
      { name: 'type', value: 'team-invitation' },
      { name: 'team', value: teamName },
    ],
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetToken: string
): Promise<EmailResponse> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
  const template = EmailTemplates.passwordReset(name, resetUrl);
  
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [{ name: 'type', value: 'password-reset' }],
  });
}

export async function sendPaymentSuccessEmail(
  to: string,
  name: string,
  amount: string,
  planName: string
): Promise<EmailResponse> {
  const template = EmailTemplates.paymentSuccess(name, amount, planName);
  
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'payment-success' },
      { name: 'plan', value: planName },
    ],
  });
}

// Resend API key management functions
export async function createResendApiKey(name: string) {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const response = await resend.apiKeys.create({ name });
    
    if (response.error) {
      throw new Error(`Failed to create API key: ${response.error.message}`);
    }

    return {
      success: true,
      apiKey: response.data,
    };
  } catch (error) {
    console.error('Failed to create Resend API key:', error);
    Sentry.captureException(error as Error, { extra: { context: 'resend-api-key-creation' } });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function listResendApiKeys() {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const response = await resend.apiKeys.list();
    
    if (response.error) {
      throw new Error(`Failed to list API keys: ${response.error.message}`);
    }

    return {
      success: true,
      apiKeys: response.data,
    };
  } catch (error) {
    console.error('Failed to list Resend API keys:', error);
    Sentry.captureException(error as Error, { extra: { context: 'resend-api-key-listing' } });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}