import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export interface TeamsConfig {
  appId: string;
  appPassword: string;
  tenantId: string;
  servicePrincipalId: string;
  webhookUrl?: string;
}

export interface TeamsMessage {
  type: 'message';
  attachments?: TeamsAttachment[];
  text?: string;
  summary?: string;
  themeColor?: string;
}

export interface TeamsAttachment {
  contentType: 'application/vnd.microsoft.card.adaptive' | 'application/vnd.microsoft.card.hero';
  content: any;
}

export interface TeamsActivity {
  type: 'message' | 'invoke';
  id: string;
  timestamp: string;
  serviceUrl: string;
  channelId: string;
  from: {
    id: string;
    name: string;
  };
  conversation: {
    id: string;
    name?: string;
    isGroup?: boolean;
  };
  text?: string;
  value?: any;
}

export class TeamsIntegration {
  private config: TeamsConfig;
  private tenantId: string;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(tenantId: string, config: TeamsConfig) {
    this.tenantId = tenantId;
    this.config = config;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch(`https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.appId,
        client_secret: this.config.appPassword,
        scope: 'https://graph.microsoft.com/.default',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get Teams access token');
    }

    const tokenData = await response.json();
    this.accessToken = tokenData.access_token;
    this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in * 1000) - 60000); // 1 minute buffer

    return this.accessToken;
  }

  async sendMessage(conversationId: string, message: TeamsMessage): Promise<boolean> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`https://graph.microsoft.com/v1.0/chats/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: {
            contentType: 'html',
            content: message.text || 'Notification from Zenith',
          },
          attachments: message.attachments,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Teams message send error:', error);
      return false;
    }
  }

  async sendProjectNotification(project: any, action: 'created' | 'updated' | 'completed'): Promise<void> {
    const emoji = action === 'created' ? '🆕' : action === 'updated' ? '📝' : '✅';
    const actionText = action === 'created' ? 'created' : action === 'updated' ? 'updated' : 'completed';

    const adaptiveCard = {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'TextBlock',
          text: `${emoji} Project ${actionText}`,
          weight: 'Bolder',
          size: 'Medium',
        },
        {
          type: 'TextBlock',
          text: project.name,
          weight: 'Bolder',
        },
        {
          type: 'TextBlock',
          text: project.description || 'No description',
          wrap: true,
        },
        {
          type: 'FactSet',
          facts: [
            {
              title: 'Status',
              value: project.status,
            },
            {
              title: 'Due Date',
              value: project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set',
            },
            {
              title: 'Team',
              value: project.team?.name || 'No team assigned',
            },
          ],
        },
      ],
      actions: [
        {
          type: 'Action.OpenUrl',
          title: 'View Project',
          url: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${project.id}`,
        },
      ],
    };

    const message: TeamsMessage = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: adaptiveCard,
        },
      ],
    };

    const conversationId = await this.getNotificationConversation();
    if (conversationId) {
      await this.sendMessage(conversationId, message);
    }
  }

  async sendTeamNotification(data: { teamName: string; userName: string; action: 'added' | 'removed' }): Promise<void> {
    const emoji = data.action === 'added' ? '➕' : '➖';
    const actionText = data.action === 'added' ? 'added to' : 'removed from';

    const adaptiveCard = {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'TextBlock',
          text: `${emoji} Team Update`,
          weight: 'Bolder',
          size: 'Medium',
        },
        {
          type: 'TextBlock',
          text: `${data.userName} was ${actionText} team **${data.teamName}**`,
          wrap: true,
        },
      ],
    };

    const message: TeamsMessage = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: adaptiveCard,
        },
      ],
    };

    const conversationId = await this.getNotificationConversation();
    if (conversationId) {
      await this.sendMessage(conversationId, message);
    }
  }

  async handleBotActivity(activity: TeamsActivity): Promise<any> {
    switch (activity.type) {
      case 'message':
        return this.handleMessage(activity);
      case 'invoke':
        return this.handleInvoke(activity);
      default:
        return { status: 200 };
    }
  }

  private async handleMessage(activity: TeamsActivity): Promise<any> {
    const text = activity.text?.toLowerCase() || '';
    let responseText = '';

    if (text.includes('hello') || text.includes('hi')) {
      responseText = 'Hello! I can help you with your Zenith projects and teams. Try asking about your projects or type "help" for more options.';
    } else if (text.includes('project')) {
      const projects = await prisma.project.findMany({
        where: { tenantId: this.tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      if (projects.length === 0) {
        responseText = 'No projects found.';
      } else {
        const projectList = projects
          .map(p => `• **${p.name}** - ${p.status}`)
          .join('\n');
        responseText = `Recent projects:\n${projectList}`;
      }
    } else if (text.includes('team')) {
      const teams = await prisma.team.findMany({
        where: { tenantId: this.tenantId },
        include: {
          _count: {
            select: { members: true },
          },
        },
        take: 5,
      });

      if (teams.length === 0) {
        responseText = 'No teams found.';
      } else {
        const teamList = teams
          .map(t => `• **${t.name}** - ${t._count.members} members`)
          .join('\n');
        responseText = `Your teams:\n${teamList}`;
      }
    } else if (text.includes('help')) {
      responseText = `I can help you with:\n• Project updates and status\n• Team notifications\n• Quick overviews\n\nTry asking about "projects" or "teams".`;
    } else {
      responseText = 'I\'m here to help with your Zenith workspace. Try asking about projects, teams, or type "help" for more options.';
    }

    return {
      type: 'message',
      text: responseText,
    };
  }

  private async handleInvoke(activity: TeamsActivity): Promise<any> {
    // Handle adaptive card actions and other invokes
    return { status: 200 };
  }

  private async getNotificationConversation(): Promise<string | null> {
    const integration = await prisma.integration.findFirst({
      where: {
        tenantId: this.tenantId,
        provider: 'teams',
        active: true,
      },
    });

    return integration?.settings?.conversationId || null;
  }

  async createConversation(users: string[]): Promise<string> {
    const token = await this.getAccessToken();

    const response = await fetch('https://graph.microsoft.com/v1.0/chats', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatType: 'group',
        members: users.map(userId => ({
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          'user@odata.bind': `https://graph.microsoft.com/v1.0/users/${userId}`,
          roles: ['owner'],
        })),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create Teams conversation');
    }

    const conversation = await response.json();
    return conversation.id;
  }

  async installApp(conversationId: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`https://graph.microsoft.com/v1.0/chats/${conversationId}/installedApps`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'teamsApp@odata.bind': `https://graph.microsoft.com/v1.0/appCatalogs/teamsApps/${this.config.appId}`,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Teams app install error:', error);
      return false;
    }
  }
}

export class TeamsConfigManager {
  static async saveConfig(tenantId: string, config: TeamsConfig): Promise<void> {
    await prisma.integration.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider: 'teams',
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
        provider: 'teams',
        settings: config,
        active: true,
      },
    });
  }

  static async getConfig(tenantId: string): Promise<TeamsConfig | null> {
    const integration = await prisma.integration.findFirst({
      where: {
        tenantId,
        provider: 'teams',
        active: true,
      },
    });

    return integration?.settings as TeamsConfig || null;
  }

  static async revokeAccess(tenantId: string): Promise<void> {
    await prisma.integration.updateMany({
      where: {
        tenantId,
        provider: 'teams',
      },
      data: {
        active: false,
        updatedAt: new Date(),
      },
    });
  }
}

// Teams webhook handler
export async function handleTeamsWebhook(body: any, tenantId: string): Promise<any> {
  const config = await TeamsConfigManager.getConfig(tenantId);
  if (!config) {
    return { status: 404, message: 'Teams integration not configured' };
  }

  const teams = new TeamsIntegration(tenantId, config);
  return teams.handleBotActivity(body);
}

// Teams manifest generator
export function generateTeamsManifest(appId: string, appName: string, baseUrl: string) {
  return {
    $schema: 'https://developer.microsoft.com/en-us/json-schemas/teams/v1.14/MicrosoftTeams.schema.json',
    manifestVersion: '1.14',
    version: '1.0.0',
    id: appId,
    packageName: 'com.zenith.teamsapp',
    developer: {
      name: 'Zenith',
      websiteUrl: baseUrl,
      privacyUrl: `${baseUrl}/privacy`,
      termsOfUseUrl: `${baseUrl}/terms`,
    },
    icons: {
      color: `${baseUrl}/teams-icon-color.png`,
      outline: `${baseUrl}/teams-icon-outline.png`,
    },
    name: {
      short: appName,
      full: `${appName} - Project Management`,
    },
    description: {
      short: 'Zenith project management integration for Microsoft Teams',
      full: 'Stay updated with your Zenith projects and collaborate with your team directly from Microsoft Teams.',
    },
    accentColor: '#6366F1',
    bots: [
      {
        botId: appId,
        scopes: ['personal', 'team', 'groupchat'],
        supportsFiles: false,
        isNotificationOnly: false,
        commandLists: [
          {
            scopes: ['personal', 'team', 'groupchat'],
            commands: [
              {
                title: 'Help',
                description: 'Show available commands',
              },
              {
                title: 'Projects',
                description: 'List recent projects',
              },
              {
                title: 'Teams',
                description: 'List your teams',
              },
            ],
          },
        ],
      },
    ],
    permissions: ['identity', 'messageTeamMembers'],
    validDomains: [new URL(baseUrl).hostname],
  };
}