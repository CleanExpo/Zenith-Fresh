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

  // Scheduled scan completion notification
  scanCompletion: (
    name: string, 
    scanName: string, 
    url: string, 
    overallScore: number, 
    analysisData: any, 
    dashboardUrl: string
  ) => {
    // Helper functions for scoring
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
            <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">Hi ${name},</p>
            
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

Hi ${name},

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
  },

  // Scheduled scan failure notification
  scanFailure: (name: string, scanName: string, url: string, errorMessage: string, dashboardUrl: string) => ({
    subject: `Website Scan Failed: ${scanName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Website Scan Failed</h1>
          <p style="color: #fecaca; margin: 10px 0 0 0;">Your scheduled scan encountered an error</p>
        </div>
        
        <div style="padding: 30px;">
          <p>Hi ${name},</p>
          <p>We encountered an issue while running your scheduled scan "<strong>${scanName}</strong>" for ${url}.</p>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <h4 style="color: #991b1b; margin: 0 0 10px 0;">Error Details:</h4>
            <p style="color: #7f1d1d; margin: 0; font-family: monospace; font-size: 14px;">${errorMessage}</p>
          </div>
          
          <p>Don't worry - we'll automatically retry the scan at the next scheduled time. If the issue persists, please check your scan settings or contact our support team.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Manage Scheduled Scans
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            If you continue to experience issues, please don't hesitate to reach out to our support team.
          </p>
        </div>
      </div>
    `,
    text: `Website Scan Failed: ${scanName}

Hi ${name},

We encountered an issue while running your scheduled scan "${scanName}" for ${url}.

Error Details: ${errorMessage}

Don't worry - we'll automatically retry the scan at the next scheduled time. If the issue persists, please check your scan settings or contact our support team.

Manage your scheduled scans: ${dashboardUrl}

If you continue to experience issues, please don't hesitate to reach out to our support team.

Best regards,
The Zenith Team`
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

export async function sendScanCompletionEmail(
  to: string,
  name: string,
  scanName: string,
  url: string,
  overallScore: number,
  analysisData: any,
  scanId?: string
): Promise<EmailResponse> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
  const template = EmailTemplates.scanCompletion(name, scanName, url, overallScore, analysisData, dashboardUrl);
  
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'scan-completion' },
      { name: 'scan-id', value: scanId || 'unknown' },
      { name: 'score', value: overallScore.toString() },
    ],
  });
}

export async function sendScanFailureEmail(
  to: string,
  name: string,
  scanName: string,
  url: string,
  errorMessage: string,
  scanId?: string
): Promise<EmailResponse> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
  const template = EmailTemplates.scanFailure(name, scanName, url, errorMessage, dashboardUrl);
  
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [
      { name: 'type', value: 'scan-failure' },
      { name: 'scan-id', value: scanId || 'unknown' },
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