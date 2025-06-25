import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';
import { WebClient } from '@slack/web-api';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export interface NotificationData {
  scan: any; // WebsiteScan with relations
  alerts: any[]; // ScanAlert[]
  type: 'alert' | 'report';
}

export class NotificationService {
  private static instance: NotificationService;
  
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async sendScanNotification(data: NotificationData) {
    const { scan, alerts, type } = data;
    
    try {
      // Get user notification preferences
      const preferences = await prisma.notificationPreference.findUnique({
        where: { userId: scan.project.userId },
      });

      if (!preferences) {
        console.log(`No notification preferences found for user ${scan.project.userId}`);
        return;
      }

      const notifications = [];

      // Send email notification
      if (preferences.email && preferences.emailAddress) {
        notifications.push(
          this.sendEmailNotification(data, preferences.emailAddress)
        );
      }

      // Send Slack notification
      if (preferences.slack && preferences.slackWebhookUrl) {
        notifications.push(
          this.sendSlackNotification(data, preferences.slackWebhookUrl)
        );
      }

      // Send Discord notification
      if (preferences.discord && preferences.discordWebhookUrl) {
        notifications.push(
          this.sendDiscordNotification(data, preferences.discordWebhookUrl)
        );
      }

      // Send webhook notification
      if (preferences.webhook && preferences.webhookUrl) {
        notifications.push(
          this.sendWebhookNotification(data, preferences.webhookUrl)
        );
      }

      // Wait for all notifications to complete
      const results = await Promise.allSettled(notifications);
      
      // Log notification results
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Notification ${index} failed:`, result.reason);
        }
      });

      return results;

    } catch (error) {
      console.error('Failed to send scan notifications:', error);
      throw error;
    }
  }

  private async sendEmailNotification(data: NotificationData, emailAddress: string) {
    const { scan, alerts, type } = data;
    
    const subject = type === 'alert' 
      ? `🚨 Website Alert: ${scan.project.name}`
      : `📊 Website Report: ${scan.project.name}`;

    const htmlContent = this.generateEmailTemplate(data);

    try {
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@zenith.engineer',
        to: [emailAddress],
        subject,
        html: htmlContent,
      });

      // Log notification in database
      for (const alert of alerts) {
        await prisma.alertNotification.create({
          data: {
            alertId: alert.id,
            channel: 'email',
            status: 'sent',
            sentAt: new Date(),
          },
        });
      }

      return result;
    } catch (error) {
      // Log failed notification
      for (const alert of alerts) {
        await prisma.alertNotification.create({
          data: {
            alertId: alert.id,
            channel: 'email',
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
      throw error;
    }
  }

  private async sendSlackNotification(data: NotificationData, webhookUrl: string) {
    const { scan, alerts, type } = data;
    
    const message = {
      text: type === 'alert' 
        ? `🚨 Website Alert for ${scan.project.name}`
        : `📊 Website Report for ${scan.project.name}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: type === 'alert' ? '🚨 Website Alert' : '📊 Website Report',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Project:* ${scan.project.name}`,
            },
            {
              type: 'mrkdwn',
              text: `*URL:* ${scan.url}`,
            },
            {
              type: 'mrkdwn',
              text: `*Performance Score:* ${scan.performanceScore}/100`,
            },
            {
              type: 'mrkdwn',
              text: `*Scan Time:* ${new Date(scan.completedAt).toLocaleString()}`,
            },
          ],
        },
      ],
    };

    if (alerts.length > 0) {
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Alerts (${alerts.length}):*\n${alerts
            .map(alert => `• ${alert.title}: ${alert.description}`)
            .join('\n')}`,
        },
      });
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.statusText}`);
      }

      // Log successful notifications
      for (const alert of alerts) {
        await prisma.alertNotification.create({
          data: {
            alertId: alert.id,
            channel: 'slack',
            status: 'sent',
            sentAt: new Date(),
          },
        });
      }

      return { success: true };
    } catch (error) {
      // Log failed notifications
      for (const alert of alerts) {
        await prisma.alertNotification.create({
          data: {
            alertId: alert.id,
            channel: 'slack',
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
      throw error;
    }
  }

  private async sendDiscordNotification(data: NotificationData, webhookUrl: string) {
    const { scan, alerts, type } = data;
    
    const embed = {
      title: type === 'alert' ? '🚨 Website Alert' : '📊 Website Report',
      description: `Scan results for ${scan.project.name}`,
      color: type === 'alert' ? 0xff0000 : 0x0099ff,
      fields: [
        {
          name: 'Project',
          value: scan.project.name,
          inline: true,
        },
        {
          name: 'URL',
          value: scan.url,
          inline: true,
        },
        {
          name: 'Performance Score',
          value: `${scan.performanceScore}/100`,
          inline: true,
        },
        {
          name: 'Accessibility Score',
          value: `${scan.accessibilityScore}/100`,
          inline: true,
        },
        {
          name: 'SEO Score',
          value: `${scan.seoScore}/100`,
          inline: true,
        },
        {
          name: 'Scan Time',
          value: new Date(scan.completedAt).toLocaleString(),
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    if (alerts.length > 0) {
      embed.fields.push({
        name: `Alerts (${alerts.length})`,
        value: alerts
          .slice(0, 5) // Limit to 5 alerts to avoid Discord limits
          .map(alert => `• **${alert.title}**: ${alert.description}`)
          .join('\n'),
        inline: false,
      });
    }

    const message = {
      embeds: [embed],
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.statusText}`);
      }

      // Log successful notifications
      for (const alert of alerts) {
        await prisma.alertNotification.create({
          data: {
            alertId: alert.id,
            channel: 'discord',
            status: 'sent',
            sentAt: new Date(),
          },
        });
      }

      return { success: true };
    } catch (error) {
      // Log failed notifications
      for (const alert of alerts) {
        await prisma.alertNotification.create({
          data: {
            alertId: alert.id,
            channel: 'discord',
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
      throw error;
    }
  }

  private async sendWebhookNotification(data: NotificationData, webhookUrl: string) {
    const { scan, alerts, type } = data;
    
    const payload = {
      event: 'website_scan_completed',
      type,
      timestamp: new Date().toISOString(),
      data: {
        scan: {
          id: scan.id,
          projectId: scan.projectId,
          url: scan.url,
          performanceScore: scan.performanceScore,
          accessibilityScore: scan.accessibilityScore,
          bestPracticesScore: scan.bestPracticesScore,
          seoScore: scan.seoScore,
          completedAt: scan.completedAt,
        },
        project: {
          id: scan.project.id,
          name: scan.project.name,
          url: scan.project.url,
        },
        alerts: alerts.map(alert => ({
          id: alert.id,
          type: alert.alertType,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          currentValue: alert.currentValue,
          previousValue: alert.previousValue,
          threshold: alert.threshold,
        })),
      },
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Zenith-WebsiteAnalyzer/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      // Log successful notifications
      for (const alert of alerts) {
        await prisma.alertNotification.create({
          data: {
            alertId: alert.id,
            channel: 'webhook',
            status: 'sent',
            sentAt: new Date(),
          },
        });
      }

      return { success: true };
    } catch (error) {
      // Log failed notifications
      for (const alert of alerts) {
        await prisma.alertNotification.create({
          data: {
            alertId: alert.id,
            channel: 'webhook',
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
      throw error;
    }
  }

  private generateEmailTemplate(data: NotificationData): string {
    const { scan, alerts, type } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website ${type === 'alert' ? 'Alert' : 'Report'}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${type === 'alert' ? '#ff4444' : '#007cba'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .score-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .score-card { background: white; padding: 15px; border-radius: 8px; text-align: center; }
        .score { font-size: 24px; font-weight: bold; color: #007cba; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .alert-high { background: #f8d7da; border-color: #f5c6cb; }
        .button { display: inline-block; background: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${type === 'alert' ? '🚨 Website Alert' : '📊 Website Report'}</h1>
            <p>Scan completed for ${scan.project.name}</p>
        </div>
        
        <div class="content">
            <h2>Scan Summary</h2>
            <p><strong>URL:</strong> ${scan.url}</p>
            <p><strong>Completed:</strong> ${new Date(scan.completedAt).toLocaleString()}</p>
            
            <div class="score-grid">
                <div class="score-card">
                    <div class="score">${scan.performanceScore}</div>
                    <div>Performance</div>
                </div>
                <div class="score-card">
                    <div class="score">${scan.accessibilityScore}</div>
                    <div>Accessibility</div>
                </div>
                <div class="score-card">
                    <div class="score">${scan.bestPracticesScore}</div>
                    <div>Best Practices</div>
                </div>
                <div class="score-card">
                    <div class="score">${scan.seoScore}</div>
                    <div>SEO</div>
                </div>
            </div>
            
            ${alerts.length > 0 ? `
            <h2>Alerts (${alerts.length})</h2>
            ${alerts.map(alert => `
                <div class="alert ${alert.severity === 'high' ? 'alert-high' : ''}">
                    <strong>${alert.title}</strong><br>
                    ${alert.description}
                    ${alert.currentValue ? `<br><small>Current: ${alert.currentValue} | Previous: ${alert.previousValue}</small>` : ''}
                </div>
            `).join('')}
            ` : ''}
            
            <p>
                <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">View Full Report</a>
            </p>
        </div>
    </div>
</body>
</html>
    `;
  }
}

export const notificationService = NotificationService.getInstance();