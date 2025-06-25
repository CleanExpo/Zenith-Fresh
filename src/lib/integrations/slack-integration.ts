import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export interface SlackConfig {
  botToken: string;
  signingSecret: string;
  appId: string;
  clientId: string;
  clientSecret: string;
  workspaceId: string;
  workspaceName: string;
}

export interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: any[];
  attachments?: any[];
  thread_ts?: string;
  username?: string;
  icon_emoji?: string;
}

export interface SlackCommand {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
}

export class SlackIntegration {
  private config: SlackConfig;
  private tenantId: string;

  constructor(tenantId: string, config: SlackConfig) {
    this.tenantId = tenantId;
    this.config = config;
  }

  async sendMessage(message: SlackMessage): Promise<boolean> {
    try {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Slack message send error:', error);
      return false;
    }
  }

  async sendProjectNotification(project: any, action: 'created' | 'updated' | 'completed'): Promise<void> {
    const emoji = action === 'created' ? '🆕' : action === 'updated' ? '📝' : '✅';
    const actionText = action === 'created' ? 'created' : action === 'updated' ? 'updated' : 'completed';

    const message: SlackMessage = {
      channel: await this.getNotificationChannel(),
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *Project ${actionText}*\n*${project.name}*\n${project.description || 'No description'}`,
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Project',
            },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${project.id}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Status: ${project.status} | Due: ${project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}`,
            },
          ],
        },
      ],
    };

    await this.sendMessage(message);
  }

  async sendTeamNotification(data: { teamName: string; userName: string; action: 'added' | 'removed' }): Promise<void> {
    const emoji = data.action === 'added' ? '➕' : '➖';
    const actionText = data.action === 'added' ? 'added to' : 'removed from';

    const message: SlackMessage = {
      channel: await this.getNotificationChannel(),
      text: `${emoji} ${data.userName} was ${actionText} team *${data.teamName}*`,
    };

    await this.sendMessage(message);
  }

  async handleSlashCommand(command: SlackCommand): Promise<any> {
    const args = command.text.split(' ');
    const subCommand = args[0]?.toLowerCase();

    switch (subCommand) {
      case 'projects':
        return this.handleProjectsCommand(args.slice(1));
      case 'teams':
        return this.handleTeamsCommand(args.slice(1));
      case 'help':
        return this.handleHelpCommand();
      default:
        return {
          response_type: 'ephemeral',
          text: 'Unknown command. Type `/zenith help` for available commands.',
        };
    }
  }

  private async handleProjectsCommand(args: string[]): Promise<any> {
    const action = args[0]?.toLowerCase();

    switch (action) {
      case 'list':
        const projects = await prisma.project.findMany({
          where: { tenantId: this.tenantId },
          take: 10,
          orderBy: { createdAt: 'desc' },
        });

        if (projects.length === 0) {
          return {
            response_type: 'ephemeral',
            text: 'No projects found.',
          };
        }

        const projectList = projects
          .map(p => `• *${p.name}* - ${p.status} (${p.dueDate ? new Date(p.dueDate).toLocaleDateString() : 'No due date'})`)
          .join('\n');

        return {
          response_type: 'ephemeral',
          text: `Recent projects:\n${projectList}`,
        };

      case 'create':
        const projectName = args.slice(1).join(' ');
        if (!projectName) {
          return {
            response_type: 'ephemeral',
            text: 'Please provide a project name: `/zenith projects create Project Name`',
          };
        }

        // This would typically create a modal for more details
        return {
          response_type: 'ephemeral',
          text: `Project creation for "${projectName}" initiated. Please complete the details in the web app.`,
        };

      default:
        return {
          response_type: 'ephemeral',
          text: 'Available project commands:\n• `/zenith projects list` - List recent projects\n• `/zenith projects create <name>` - Create a new project',
        };
    }
  }

  private async handleTeamsCommand(args: string[]): Promise<any> {
    const teams = await prisma.team.findMany({
      where: { tenantId: this.tenantId },
      include: {
        _count: {
          select: { members: true },
        },
      },
      take: 10,
    });

    if (teams.length === 0) {
      return {
        response_type: 'ephemeral',
        text: 'No teams found.',
      };
    }

    const teamList = teams
      .map(t => `• *${t.name}* - ${t._count.members} members`)
      .join('\n');

    return {
      response_type: 'ephemeral',
      text: `Your teams:\n${teamList}`,
    };
  }

  private handleHelpCommand(): any {
    return {
      response_type: 'ephemeral',
      text: `*Zenith Slack Commands*\n\n` +
            `• \`/zenith projects list\` - List recent projects\n` +
            `• \`/zenith projects create <name>\` - Create a new project\n` +
            `• \`/zenith teams\` - List your teams\n` +
            `• \`/zenith help\` - Show this help message\n\n` +
            `Visit ${process.env.NEXT_PUBLIC_APP_URL} for full functionality.`,
    };
  }

  private async getNotificationChannel(): Promise<string> {
    // Get the configured notification channel for this tenant
    const integration = await prisma.integration.findFirst({
      where: {
        tenantId: this.tenantId,
        provider: 'slack',
        active: true,
      },
    });

    return integration?.settings?.notificationChannel || '#general';
  }

  static async validateSignature(
    body: string,
    signature: string,
    signingSecret: string,
    timestamp: string
  ): Promise<boolean> {
    const basestring = `v0:${timestamp}:${body}`;
    const expectedSignature = 'v0=' + require('crypto')
      .createHmac('sha256', signingSecret)
      .update(basestring)
      .digest('hex');

    return signature === expectedSignature;
  }
}

export class SlackConfigManager {
  static async saveConfig(tenantId: string, config: SlackConfig): Promise<void> {
    await prisma.integration.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider: 'slack',
        },
      },
      update: {
        settings: config,
        active: true,
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        tenantId,
        provider: 'slack',
        settings: config,
        active: true,
      },
    });
  }

  static async getConfig(tenantId: string): Promise<SlackConfig | null> {
    const integration = await prisma.integration.findFirst({
      where: {
        tenantId,
        provider: 'slack',
        active: true,
      },
    });

    return integration?.settings as SlackConfig || null;
  }

  static async revokeAccess(tenantId: string): Promise<void> {
    await prisma.integration.updateMany({
      where: {
        tenantId,
        provider: 'slack',
      },
      data: {
        active: false,
        updatedAt: new Date(),
      },
    });
  }
}

// Slack webhook handler
export async function handleSlackWebhook(body: any, tenantId: string): Promise<any> {
  const { type, event } = body;

  switch (type) {
    case 'event_callback':
      return handleSlackEvent(event, tenantId);
    case 'url_verification':
      return { challenge: body.challenge };
    default:
      return { ok: true };
  }
}

async function handleSlackEvent(event: any, tenantId: string): Promise<any> {
  switch (event.type) {
    case 'message':
      // Handle direct messages to the bot
      if (event.channel_type === 'im' && !event.bot_id) {
        await handleDirectMessage(event, tenantId);
      }
      break;
    case 'app_mention':
      // Handle mentions
      await handleMention(event, tenantId);
      break;
  }

  return { ok: true };
}

async function handleDirectMessage(event: any, tenantId: string): Promise<void> {
  const config = await SlackConfigManager.getConfig(tenantId);
  if (!config) return;

  const slack = new SlackIntegration(tenantId, config);

  // Simple bot responses
  const text = event.text.toLowerCase();
  let response = '';

  if (text.includes('hello') || text.includes('hi')) {
    response = 'Hello! I can help you with your Zenith projects and teams. Try asking about your projects or teams.';
  } else if (text.includes('project')) {
    response = 'You can manage projects at ' + process.env.NEXT_PUBLIC_APP_URL + '/projects';
  } else if (text.includes('help')) {
    response = 'I can help you with:\n• Project updates\n• Team notifications\n• Quick status checks\n\nUse slash commands like `/zenith projects list` for more features.';
  } else {
    response = 'I\'m here to help with your Zenith workspace. Try asking about projects, teams, or type "help" for more options.';
  }

  await slack.sendMessage({
    channel: event.channel,
    text: response,
  });
}

async function handleMention(event: any, tenantId: string): Promise<void> {
  const config = await SlackConfigManager.getConfig(tenantId);
  if (!config) return;

  const slack = new SlackIntegration(tenantId, config);

  await slack.sendMessage({
    channel: event.channel,
    text: `Thanks for mentioning me! Use \`/zenith help\` to see what I can do.`,
    thread_ts: event.ts,
  });
}