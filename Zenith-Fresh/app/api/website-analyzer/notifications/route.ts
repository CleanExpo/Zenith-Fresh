import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { notificationService } from '@/lib/services/notification-service';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's notification preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
          email: true,
          slack: false,
          discord: false,
          webhook: false,
          emailAddress: session.user.email,
          alertTypes: {
            performance_drop: true,
            accessibility_issue: true,
            seo_issue: true,
            error_increase: true,
            significant_change: true,
          },
        },
      });
    }

    return NextResponse.json({
      preferences: {
        id: preferences.id,
        email: preferences.email,
        slack: preferences.slack,
        discord: preferences.discord,
        webhook: preferences.webhook,
        emailAddress: preferences.emailAddress,
        slackWebhookUrl: preferences.slackWebhookUrl ? '***configured***' : null,
        discordWebhookUrl: preferences.discordWebhookUrl ? '***configured***' : null,
        webhookUrl: preferences.webhookUrl ? '***configured***' : null,
        alertTypes: preferences.alertTypes,
      },
    });

  } catch (error) {
    console.error('Get notification preferences API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      email,
      slack,
      discord,
      webhook,
      emailAddress,
      slackWebhookUrl,
      discordWebhookUrl,
      webhookUrl,
      alertTypes,
    } = body;

    // Validate email address if email notifications are enabled
    if (email && emailAddress) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailAddress)) {
        return NextResponse.json(
          { error: 'Invalid email address format' },
          { status: 400 }
        );
      }
    }

    // Validate webhook URLs if they're provided
    const validateUrl = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    if (slack && slackWebhookUrl && !validateUrl(slackWebhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid Slack webhook URL' },
        { status: 400 }
      );
    }

    if (discord && discordWebhookUrl && !validateUrl(discordWebhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid Discord webhook URL' },
        { status: 400 }
      );
    }

    if (webhook && webhookUrl && !validateUrl(webhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid webhook URL' },
        { status: 400 }
      );
    }

    // Update or create notification preferences
    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (slack !== undefined) updateData.slack = slack;
    if (discord !== undefined) updateData.discord = discord;
    if (webhook !== undefined) updateData.webhook = webhook;
    if (emailAddress !== undefined) updateData.emailAddress = emailAddress;
    if (slackWebhookUrl !== undefined) updateData.slackWebhookUrl = slackWebhookUrl;
    if (discordWebhookUrl !== undefined) updateData.discordWebhookUrl = discordWebhookUrl;
    if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl;
    if (alertTypes !== undefined) updateData.alertTypes = alertTypes;
    updateData.updatedAt = new Date();

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        ...updateData,
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'notification_preferences_updated',
        details: {
          preferences: {
            email: preferences.email,
            slack: preferences.slack,
            discord: preferences.discord,
            webhook: preferences.webhook,
          },
        },
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      preferences: {
        id: preferences.id,
        email: preferences.email,
        slack: preferences.slack,
        discord: preferences.discord,
        webhook: preferences.webhook,
        emailAddress: preferences.emailAddress,
        slackWebhookUrl: preferences.slackWebhookUrl ? '***configured***' : null,
        discordWebhookUrl: preferences.discordWebhookUrl ? '***configured***' : null,
        webhookUrl: preferences.webhookUrl ? '***configured***' : null,
        alertTypes: preferences.alertTypes,
      },
    });

  } catch (error) {
    console.error('Update notification preferences API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, channel, webhookUrl } = body;

    if (action === 'test') {
      // Test notification functionality
      if (!channel) {
        return NextResponse.json(
          { error: 'Channel is required for test notifications' },
          { status: 400 }
        );
      }

      // Get user preferences to get the webhook URL if not provided
      const preferences = await prisma.notificationPreference.findUnique({
        where: { userId: session.user.id },
      });

      if (!preferences) {
        return NextResponse.json(
          { error: 'Notification preferences not found' },
          { status: 404 }
        );
      }

      // Create a test notification data
      const testData = {
        scan: {
          id: 'test-scan-id',
          project: {
            name: 'Test Project',
            userId: session.user.id,
          },
          url: 'https://example.com',
          performanceScore: 85,
          accessibilityScore: 92,
          bestPracticesScore: 88,
          seoScore: 90,
          completedAt: new Date(),
        },
        alerts: [{
          id: 'test-alert-id',
          title: 'Test Alert',
          description: 'This is a test notification from Zenith Platform',
          severity: 'medium',
          alertType: 'test',
        }],
        type: 'report' as const,
      };

      try {
        let result: any;
        
        switch (channel) {
          case 'email':
            if (!preferences.emailAddress) {
              throw new Error('Email address not configured');
            }
            result = await notificationService.sendEmailNotification(
              testData, 
              preferences.emailAddress
            );
            break;
            
          case 'slack':
            const slackUrl = webhookUrl || preferences.slackWebhookUrl;
            if (!slackUrl) {
              throw new Error('Slack webhook URL not configured');
            }
            result = await notificationService.sendSlackNotification(testData, slackUrl);
            break;
            
          case 'discord':
            const discordUrl = webhookUrl || preferences.discordWebhookUrl;
            if (!discordUrl) {
              throw new Error('Discord webhook URL not configured');
            }
            result = await notificationService.sendDiscordNotification(testData, discordUrl);
            break;
            
          case 'webhook':
            const customWebhookUrl = webhookUrl || preferences.webhookUrl;
            if (!customWebhookUrl) {
              throw new Error('Webhook URL not configured');
            }
            // Ensure the method is available and properly typed
            if (typeof notificationService.sendWebhookNotification !== 'function') {
              throw new Error('Webhook notification method not available');
            }
            result = await notificationService.sendWebhookNotification(testData, customWebhookUrl);
            break;
            
          default:
            throw new Error('Invalid channel type');
        }

        return NextResponse.json({
          success: true,
          message: `Test notification sent successfully via ${channel}`,
          result,
        });

      } catch (error) {
        return NextResponse.json(
          { 
            error: `Test notification failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Notification action API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}