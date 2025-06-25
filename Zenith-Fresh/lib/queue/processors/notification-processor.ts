import { Job } from 'bullmq';
import { notificationService } from '../../services/notification-service';

export interface EmailJobData {
  type: 'email';
  to: string;
  subject: string;
  html: string;
  alertId?: string;
}

export interface SlackJobData {
  type: 'slack';
  webhookUrl: string;
  message: any;
  alertId?: string;
}

export interface DiscordJobData {
  type: 'discord';
  webhookUrl: string;
  message: any;
  alertId?: string;
}

export interface WebhookJobData {
  type: 'webhook';
  url: string;
  payload: any;
  alertId?: string;
}

export type NotificationJobData = EmailJobData | SlackJobData | DiscordJobData | WebhookJobData;

export async function processNotificationJob(job: Job<NotificationJobData>) {
  const { data } = job;
  
  try {
    switch (data.type) {
      case 'email':
        return await processEmailNotification(data);
      case 'slack':
        return await processSlackNotification(data);
      case 'discord':
        return await processDiscordNotification(data);
      case 'webhook':
        return await processWebhookNotification(data);
      default:
        throw new Error(`Unknown notification type: ${(data as any).type}`);
    }
  } catch (error) {
    console.error(`Notification job failed for type ${data.type}:`, error);
    throw error;
  }
}

async function processEmailNotification(data: EmailJobData) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@zenith.engineer',
      to: [data.to],
      subject: data.subject,
      html: data.html,
    });

    return {
      success: true,
      messageId: result.data?.id,
      to: data.to,
    };
  } catch (error) {
    throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function processSlackNotification(data: SlackJobData) {
  try {
    const response = await fetch(data.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data.message),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      status: response.status,
    };
  } catch (error) {
    throw new Error(`Slack notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function processDiscordNotification(data: DiscordJobData) {
  try {
    const response = await fetch(data.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data.message),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      status: response.status,
    };
  } catch (error) {
    throw new Error(`Discord notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function processWebhookNotification(data: WebhookJobData) {
  try {
    const response = await fetch(data.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Zenith-WebsiteAnalyzer/1.0',
      },
      body: JSON.stringify(data.payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      status: response.status,
      url: data.url,
    };
  } catch (error) {
    throw new Error(`Webhook notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}