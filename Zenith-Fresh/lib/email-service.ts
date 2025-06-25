interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

interface EmailData {
  to: string[];
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}

export async function sendEmailWithAttachment(emailData: EmailData): Promise<void> {
  // In production, implement with your preferred email service
  // Examples: SendGrid, AWS SES, Nodemailer with SMTP, etc.
  
  try {
    // For development/demo, we'll simulate email sending
    console.log('📧 Email would be sent:', {
      to: emailData.to,
      subject: emailData.subject,
      attachmentCount: emailData.attachments?.length || 0,
      timestamp: new Date().toISOString(),
    });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production, implement actual email sending:
    /*
    // Example with SendGrid
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: emailData.to,
      from: process.env.FROM_EMAIL,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      attachments: emailData.attachments?.map(att => ({
        content: att.content.toString('base64'),
        filename: att.filename,
        type: att.contentType,
        disposition: 'attachment'
      }))
    };
    
    await sgMail.sendMultiple(msg);
    */

    // Example with AWS SES
    /*
    const AWS = require('aws-sdk');
    const ses = new AWS.SES({ region: process.env.AWS_REGION });
    
    // AWS SES implementation for email with attachments
    // Note: SES requires raw email format for attachments
    */

    // Example with Nodemailer
    /*
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: emailData.to.join(', '),
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      attachments: emailData.attachments,
    });
    */

    console.log('✅ Email sent successfully (simulated)');
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new Error('Failed to send email');
  }
}

export async function sendEmail(to: string[], subject: string, html: string, text?: string): Promise<void> {
  return sendEmailWithAttachment({
    to,
    subject,
    html,
    text: text || '',
  });
}