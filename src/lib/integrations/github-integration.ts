import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { createHmac } from 'crypto';

export interface GitHubConfig {
  appId: string;
  privateKey: string;
  webhookSecret: string;
  installationId: string;
  repositoryId?: string;
  repositoryName?: string;
  organizationId?: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: Array<{ name: string; color: string }>;
  assignees: Array<{ login: string; avatar_url: string }>;
  milestone?: { title: string; due_on: string };
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  draft: boolean;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
  assignees: Array<{ login: string; avatar_url: string }>;
  reviewers: Array<{ login: string; avatar_url: string }>;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface GitHubWebhookEvent {
  action: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
  };
  sender: {
    login: string;
    avatar_url: string;
  };
  issue?: GitHubIssue;
  pull_request?: GitHubPullRequest;
  installation?: {
    id: number;
  };
}

export class GitHubIntegration {
  private config: GitHubConfig;
  private tenantId: string;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(tenantId: string, config: GitHubConfig) {
    this.tenantId = tenantId;
    this.config = config;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Generate JWT for GitHub App authentication
    const jwt = this.generateJWT();

    // Get installation access token
    const response = await fetch(`https://api.github.com/app/installations/${this.config.installationId}/access_tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get GitHub access token');
    }

    const tokenData = await response.json();
    this.accessToken = tokenData.token;
    this.tokenExpiry = new Date(tokenData.expires_at);

    return this.accessToken;
  }

  private generateJWT(): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60, // Issued 60 seconds in the past to allow for clock drift
      exp: now + 600, // Expires in 10 minutes
      iss: this.config.appId,
    };

    // In production, use a proper JWT library with RS256
    const jose = require('jose');
    const privateKey = jose.importPKCS8(this.config.privateKey, 'RS256');
    return new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256' })
      .sign(privateKey);
  }

  async createIssue(data: {
    title: string;
    body: string;
    labels?: string[];
    assignees?: string[];
    milestone?: number;
  }): Promise<GitHubIssue> {
    const token = await this.getAccessToken();

    const response = await fetch(`https://api.github.com/repos/${this.config.repositoryName}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create GitHub issue');
    }

    return response.json();
  }

  async updateIssue(issueNumber: number, data: {
    title?: string;
    body?: string;
    state?: 'open' | 'closed';
    labels?: string[];
    assignees?: string[];
  }): Promise<GitHubIssue> {
    const token = await this.getAccessToken();

    const response = await fetch(`https://api.github.com/repos/${this.config.repositoryName}/issues/${issueNumber}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update GitHub issue');
    }

    return response.json();
  }

  async createPullRequest(data: {
    title: string;
    body: string;
    head: string;
    base: string;
    draft?: boolean;
  }): Promise<GitHubPullRequest> {
    const token = await this.getAccessToken();

    const response = await fetch(`https://api.github.com/repos/${this.config.repositoryName}/pulls`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create GitHub pull request');
    }

    return response.json();
  }

  async syncProjectWithIssues(projectId: string): Promise<void> {
    const token = await this.getAccessToken();

    // Get project tasks
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: { assignedTo: true },
    });

    for (const task of tasks) {
      if (!task.githubIssueNumber) {
        // Create GitHub issue for task
        const issue = await this.createIssue({
          title: task.title,
          body: task.description || 'Task created from Zenith project',
          labels: task.priority ? [task.priority.toLowerCase()] : [],
          assignees: task.assignedTo ? [task.assignedTo.email] : [],
        });

        // Update task with GitHub issue number
        await prisma.task.update({
          where: { id: task.id },
          data: { githubIssueNumber: issue.number },
        });
      }
    }
  }

  async handleWebhookEvent(event: GitHubWebhookEvent): Promise<void> {
    switch (event.action) {
      case 'opened':
        if (event.issue) {
          await this.handleIssueOpened(event.issue);
        } else if (event.pull_request) {
          await this.handlePullRequestOpened(event.pull_request);
        }
        break;

      case 'closed':
        if (event.issue) {
          await this.handleIssueClosed(event.issue);
        } else if (event.pull_request) {
          await this.handlePullRequestClosed(event.pull_request);
        }
        break;

      case 'assigned':
        if (event.issue) {
          await this.handleIssueAssigned(event.issue);
        }
        break;

      case 'synchronize':
        if (event.pull_request) {
          await this.handlePullRequestSynchronized(event.pull_request);
        }
        break;
    }
  }

  private async handleIssueOpened(issue: GitHubIssue): Promise<void> {
    // Create task from GitHub issue
    const project = await this.findProjectForRepository();
    if (!project) return;

    await prisma.task.create({
      data: {
        id: randomUUID(),
        title: issue.title,
        description: issue.body,
        projectId: project.id,
        status: 'todo',
        priority: this.extractPriorityFromLabels(issue.labels),
        githubIssueNumber: issue.number,
        createdAt: new Date(issue.created_at),
      },
    });
  }

  private async handleIssueClosed(issue: GitHubIssue): Promise<void> {
    // Update corresponding task
    await prisma.task.updateMany({
      where: { githubIssueNumber: issue.number },
      data: { status: 'done' },
    });
  }

  private async handleIssueAssigned(issue: GitHubIssue): Promise<void> {
    if (issue.assignees.length === 0) return;

    const assigneeEmail = await this.getUserEmailByGitHubLogin(issue.assignees[0].login);
    if (!assigneeEmail) return;

    const user = await prisma.user.findUnique({
      where: { email: assigneeEmail },
    });

    if (user) {
      await prisma.task.updateMany({
        where: { githubIssueNumber: issue.number },
        data: { assignedToId: user.id },
      });
    }
  }

  private async handlePullRequestOpened(pr: GitHubPullRequest): Promise<void> {
    // Notify team about new pull request
    const project = await this.findProjectForRepository();
    if (!project) return;

    // Send notification to project team
    await this.notifyTeamAboutPullRequest(project, pr, 'opened');
  }

  private async handlePullRequestClosed(pr: GitHubPullRequest): Promise<void> {
    const project = await this.findProjectForRepository();
    if (!project) return;

    const action = pr.state === 'merged' ? 'merged' : 'closed';
    await this.notifyTeamAboutPullRequest(project, pr, action);
  }

  private async handlePullRequestSynchronized(pr: GitHubPullRequest): Promise<void> {
    // Handle PR updates - could trigger CI/CD or notifications
    console.log(`Pull request #${pr.number} synchronized`);
  }

  private async findProjectForRepository(): Promise<any> {
    const integration = await prisma.integration.findFirst({
      where: {
        tenantId: this.tenantId,
        provider: 'github',
        active: true,
      },
    });

    if (!integration?.settings?.projectId) return null;

    return prisma.project.findUnique({
      where: { id: integration.settings.projectId },
      include: { team: { include: { members: { include: { user: true } } } } },
    });
  }

  private extractPriorityFromLabels(labels: Array<{ name: string }>): string {
    const priorityLabels = ['high', 'medium', 'low', 'critical'];
    for (const label of labels) {
      if (priorityLabels.includes(label.name.toLowerCase())) {
        return label.name.toLowerCase();
      }
    }
    return 'medium';
  }

  private async getUserEmailByGitHubLogin(login: string): Promise<string | null> {
    // In practice, you'd maintain a mapping of GitHub usernames to email addresses
    // This could be stored in the database or fetched from GitHub API
    const mapping = await prisma.gitHubUserMapping.findUnique({
      where: { githubLogin: login },
    });

    return mapping?.email || null;
  }

  private async notifyTeamAboutPullRequest(project: any, pr: GitHubPullRequest, action: string): Promise<void> {
    if (!project.team?.members) return;

    const notification = {
      type: 'github_pr',
      title: `Pull Request ${action}`,
      message: `PR #${pr.number}: ${pr.title}`,
      url: pr.html_url,
      data: { pr, action },
    };

    // Send notifications to team members
    for (const member of project.team.members) {
      await prisma.notification.create({
        data: {
          id: randomUUID(),
          userId: member.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          url: notification.url,
          data: notification.data,
        },
      });
    }
  }
}

export class GitHubConfigManager {
  static async saveConfig(tenantId: string, config: GitHubConfig): Promise<void> {
    await prisma.integration.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider: 'github',
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
        provider: 'github',
        settings: config,
        active: true,
      },
    });
  }

  static async getConfig(tenantId: string): Promise<GitHubConfig | null> {
    const integration = await prisma.integration.findFirst({
      where: {
        tenantId,
        provider: 'github',
        active: true,
      },
    });

    return integration?.settings as GitHubConfig || null;
  }

  static async linkProject(tenantId: string, projectId: string): Promise<void> {
    await prisma.integration.updateMany({
      where: {
        tenantId,
        provider: 'github',
      },
      data: {
        settings: {
          projectId,
        },
      },
    });
  }

  static async createUserMapping(githubLogin: string, email: string): Promise<void> {
    await prisma.gitHubUserMapping.upsert({
      where: { githubLogin },
      update: { email },
      create: {
        id: randomUUID(),
        githubLogin,
        email,
      },
    });
  }
}

// GitHub webhook handler
export async function handleGitHubWebhook(
  body: string,
  signature: string,
  tenantId: string
): Promise<{ status: number; message: string }> {
  try {
    const config = await GitHubConfigManager.getConfig(tenantId);
    if (!config) {
      return { status: 404, message: 'GitHub integration not configured' };
    }

    // Validate webhook signature
    const expectedSignature = 'sha256=' + createHmac('sha256', config.webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return { status: 401, message: 'Invalid signature' };
    }

    const event: GitHubWebhookEvent = JSON.parse(body);
    const github = new GitHubIntegration(tenantId, config);
    
    await github.handleWebhookEvent(event);

    return { status: 200, message: 'Webhook processed successfully' };
  } catch (error) {
    console.error('GitHub webhook error:', error);
    return { status: 500, message: 'Internal server error' };
  }
}

// GitHub App setup utilities
export class GitHubAppSetup {
  static generateWebhookUrl(tenantId: string): string {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github/${tenantId}`;
  }

  static getRequiredPermissions(): Record<string, string> {
    return {
      issues: 'write',
      pull_requests: 'write',
      contents: 'read',
      metadata: 'read',
      members: 'read',
    };
  }

  static getRequiredEvents(): string[] {
    return [
      'issues',
      'pull_request',
      'issue_comment',
      'pull_request_review',
      'push',
      'repository',
    ];
  }

  static generateAppManifest(appName: string): any {
    return {
      name: appName,
      url: process.env.NEXT_PUBLIC_APP_URL,
      hook_attributes: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`,
      },
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/integrations/github/callback`,
      description: 'Zenith project management integration for GitHub',
      public: false,
      default_permissions: this.getRequiredPermissions(),
      default_events: this.getRequiredEvents(),
    };
  }
}