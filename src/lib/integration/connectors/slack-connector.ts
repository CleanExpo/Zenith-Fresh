/**
 * Slack Enterprise Connector
 * 
 * Complete Slack workspace integration with OAuth 2.0 authentication,
 * comprehensive channel/message/user management, and workflow automation.
 */

import { randomBytes } from 'crypto';

export interface SlackConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  signingSecret?: string;
}

export interface SlackCredentials {
  accessToken: string;
  tokenType: string;
  scope: string;
  teamId: string;
  teamName: string;
  userId: string;
  userName: string;
  botUserId?: string;
  expiresAt?: Date;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_private: boolean;
  created: number;
  creator: string;
  is_archived: boolean;
  is_general: boolean;
  unlinked: number;
  name_normalized: string;
  is_shared: boolean;
  is_org_shared: boolean;
  is_member: boolean;
  is_pending_ext_shared: boolean;
  pending_shared: any[];
  context_team_id: string;
  updated: number;
  parent_conversation?: any;
  num_members?: number;
  topic?: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose?: {
    value: string;
    creator: string;
    last_set: number;
  };
}

export interface SlackUser {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  color: string;
  real_name: string;
  tz: string;
  tz_label: string;
  tz_offset: number;
  profile: {
    title: string;
    phone: string;
    skype: string;
    real_name: string;
    real_name_normalized: string;
    display_name: string;
    display_name_normalized: string;
    status_text: string;
    status_emoji: string;
    status_expiration: number;
    avatar_hash: string;
    email?: string;
    first_name: string;
    last_name: string;
    image_24: string;
    image_32: string;
    image_48: string;
    image_72: string;
    image_192: string;
    image_512: string;
    image_1024: string;
    image_original: string;
    fields: any;
  };
  is_admin: boolean;
  is_owner: boolean;
  is_primary_owner: boolean;
  is_restricted: boolean;
  is_ultra_restricted: boolean;
  is_bot: boolean;
  is_stranger: boolean;
  updated: number;
  is_app_user: boolean;
  has_2fa: boolean;
}

export interface SlackMessage {
  type: string;
  subtype?: string;
  ts: string;
  user?: string;
  bot_id?: string;
  username?: string;
  text: string;
  channel?: string;
  thread_ts?: string;
  reply_count?: number;
  replies?: any[];
  subscribed?: boolean;
  last_read?: string;
  unread_count?: number;
  permalink?: string;
  attachments?: SlackAttachment[];
  blocks?: SlackBlock[];
  reactions?: SlackReaction[];
}

export interface SlackAttachment {
  id?: number;
  color?: string;
  fallback?: string;
  pretext?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short: boolean;
  }>;
  image_url?: string;
  thumb_url?: string;
  footer?: string;
  footer_icon?: string;
  ts?: number;
}

export interface SlackBlock {
  type: string;
  block_id?: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: any[];
  accessory?: any;
  fields?: any[];
}

export interface SlackReaction {
  name: string;
  users: string[];
  count: number;
}

export interface SlackFile {
  id: string;
  created: number;
  timestamp: number;
  name: string;
  title: string;
  mimetype: string;
  filetype: string;
  pretty_type: string;
  user: string;
  mode: string;
  editable: boolean;
  is_external: boolean;
  external_type: string;
  external_url?: string;
  username?: string;
  size: number;
  url_private: string;
  url_private_download: string;
  thumb_64?: string;
  thumb_80?: string;
  thumb_360?: string;
  thumb_360_w?: number;
  thumb_360_h?: number;
  thumb_480?: string;
  thumb_480_w?: number;
  thumb_480_h?: number;
  thumb_160?: string;
  permalink: string;
  permalink_public?: string;
  edit_link?: string;
  preview?: string;
  preview_highlight?: string;
  lines?: number;
  lines_more?: number;
  is_public: boolean;
  public_url_shared: boolean;
  display_as_bot: boolean;
  channels?: string[];
  groups?: string[];
  ims?: string[];
  initial_comment?: any;
  num_stars?: number;
  is_starred?: boolean;
  pinned_to?: string[];
  reactions?: SlackReaction[];
  comments_count: number;
}

export class SlackConnector {
  private config: SlackConfig;
  private credentials?: SlackCredentials;
  private baseUrl = 'https://slack.com/api';

  constructor(config: SlackConfig) {
    this.config = config;
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Generate OAuth 2.0 authorization URL
   */
  getAuthorizationUrl(state?: string, userScopes?: string[]): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      scope: this.config.scopes.join(','),
      redirect_uri: this.config.redirectUri,
      state: state || randomBytes(16).toString('hex')
    });

    if (userScopes && userScopes.length > 0) {
      params.set('user_scope', userScopes.join(','));
    }

    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<SlackCredentials> {
    try {
      const response = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri
        })
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Token exchange failed: ${data.error}`);
      }

      this.credentials = {
        accessToken: data.access_token,
        tokenType: data.token_type || 'Bearer',
        scope: data.scope,
        teamId: data.team.id,
        teamName: data.team.name,
        userId: data.authed_user.id,
        userName: data.authed_user.name || data.authed_user.id,
        botUserId: data.bot_user_id
      };

      return this.credentials;
    } catch (error) {
      console.error('Slack token exchange failed:', error);
      throw error;
    }
  }

  /**
   * Set credentials manually
   */
  setCredentials(credentials: SlackCredentials): void {
    this.credentials = credentials;
  }

  // ==================== CHANNELS ====================

  /**
   * Get list of channels
   */
  async getChannels(excludeArchived: boolean = true, types: string = 'public_channel,private_channel'): Promise<SlackChannel[]> {
    const response = await this.apiRequest('GET', '/conversations.list', {
      exclude_archived: excludeArchived,
      types,
      limit: 1000
    });

    return response.channels;
  }

  /**
   * Get channel information
   */
  async getChannel(channelId: string): Promise<SlackChannel> {
    const response = await this.apiRequest('GET', '/conversations.info', {
      channel: channelId
    });

    return response.channel;
  }

  /**
   * Create a new channel
   */
  async createChannel(name: string, isPrivate: boolean = false): Promise<SlackChannel> {
    const response = await this.apiRequest('POST', '/conversations.create', {
      name,
      is_private: isPrivate
    });

    return response.channel;
  }

  /**
   * Archive a channel
   */
  async archiveChannel(channelId: string): Promise<void> {
    await this.apiRequest('POST', '/conversations.archive', {
      channel: channelId
    });
  }

  /**
   * Unarchive a channel
   */
  async unarchiveChannel(channelId: string): Promise<void> {
    await this.apiRequest('POST', '/conversations.unarchive', {
      channel: channelId
    });
  }

  /**
   * Join a channel
   */
  async joinChannel(channelId: string): Promise<SlackChannel> {
    const response = await this.apiRequest('POST', '/conversations.join', {
      channel: channelId
    });

    return response.channel;
  }

  /**
   * Leave a channel
   */
  async leaveChannel(channelId: string): Promise<void> {
    await this.apiRequest('POST', '/conversations.leave', {
      channel: channelId
    });
  }

  /**
   * Invite users to a channel
   */
  async inviteToChannel(channelId: string, userIds: string[]): Promise<SlackChannel> {
    const response = await this.apiRequest('POST', '/conversations.invite', {
      channel: channelId,
      users: userIds.join(',')
    });

    return response.channel;
  }

  /**
   * Remove users from a channel
   */
  async removeFromChannel(channelId: string, userId: string): Promise<void> {
    await this.apiRequest('POST', '/conversations.kick', {
      channel: channelId,
      user: userId
    });
  }

  /**
   * Get channel members
   */
  async getChannelMembers(channelId: string): Promise<string[]> {
    const response = await this.apiRequest('GET', '/conversations.members', {
      channel: channelId,
      limit: 1000
    });

    return response.members;
  }

  // ==================== MESSAGES ====================

  /**
   * Send a message to a channel
   */
  async sendMessage(
    channelId: string,
    text?: string,
    blocks?: SlackBlock[],
    attachments?: SlackAttachment[],
    threadTs?: string
  ): Promise<SlackMessage> {
    const payload: any = {
      channel: channelId
    };

    if (text) payload.text = text;
    if (blocks) payload.blocks = blocks;
    if (attachments) payload.attachments = attachments;
    if (threadTs) payload.thread_ts = threadTs;

    const response = await this.apiRequest('POST', '/chat.postMessage', payload);
    return response.message;
  }

  /**
   * Update a message
   */
  async updateMessage(
    channelId: string,
    ts: string,
    text?: string,
    blocks?: SlackBlock[],
    attachments?: SlackAttachment[]
  ): Promise<SlackMessage> {
    const payload: any = {
      channel: channelId,
      ts
    };

    if (text) payload.text = text;
    if (blocks) payload.blocks = blocks;
    if (attachments) payload.attachments = attachments;

    const response = await this.apiRequest('POST', '/chat.update', payload);
    return response.message;
  }

  /**
   * Delete a message
   */
  async deleteMessage(channelId: string, ts: string): Promise<void> {
    await this.apiRequest('POST', '/chat.delete', {
      channel: channelId,
      ts
    });
  }

  /**
   * Get message history
   */
  async getMessageHistory(
    channelId: string,
    latest?: string,
    oldest?: string,
    inclusive?: boolean,
    limit: number = 100
  ): Promise<SlackMessage[]> {
    const params: any = {
      channel: channelId,
      limit
    };

    if (latest) params.latest = latest;
    if (oldest) params.oldest = oldest;
    if (inclusive !== undefined) params.inclusive = inclusive;

    const response = await this.apiRequest('GET', '/conversations.history', params);
    return response.messages;
  }

  /**
   * Get replies to a thread
   */
  async getThreadReplies(channelId: string, ts: string): Promise<SlackMessage[]> {
    const response = await this.apiRequest('GET', '/conversations.replies', {
      channel: channelId,
      ts
    });

    return response.messages;
  }

  /**
   * Search messages
   */
  async searchMessages(query: string, sort?: string, sortDir?: string, count?: number): Promise<any> {
    const params: any = { query };
    
    if (sort) params.sort = sort;
    if (sortDir) params.sort_dir = sortDir;
    if (count) params.count = count;

    return this.apiRequest('GET', '/search.messages', params);
  }

  // ==================== USERS ====================

  /**
   * Get list of users
   */
  async getUsers(): Promise<SlackUser[]> {
    const response = await this.apiRequest('GET', '/users.list', {
      limit: 1000
    });

    return response.members;
  }

  /**
   * Get user information
   */
  async getUser(userId: string): Promise<SlackUser> {
    const response = await this.apiRequest('GET', '/users.info', {
      user: userId
    });

    return response.user;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<SlackUser> {
    const response = await this.apiRequest('GET', '/users.lookupByEmail', {
      email
    });

    return response.user;
  }

  /**
   * Set user status
   */
  async setUserStatus(statusText: string, statusEmoji?: string, statusExpiration?: number): Promise<void> {
    const profile: any = { status_text: statusText };
    
    if (statusEmoji) profile.status_emoji = statusEmoji;
    if (statusExpiration) profile.status_expiration = statusExpiration;

    await this.apiRequest('POST', '/users.profile.set', { profile });
  }

  // ==================== FILES ====================

  /**
   * Upload a file
   */
  async uploadFile(
    channels: string[],
    content?: string,
    file?: File | Buffer,
    filename?: string,
    filetype?: string,
    title?: string,
    initialComment?: string
  ): Promise<SlackFile> {
    const formData = new FormData();
    
    formData.append('channels', channels.join(','));
    if (content) formData.append('content', content);
    if (file) formData.append('file', file as any, filename);
    if (filename) formData.append('filename', filename);
    if (filetype) formData.append('filetype', filetype);
    if (title) formData.append('title', title);
    if (initialComment) formData.append('initial_comment', initialComment);

    const response = await this.apiRequest('POST', '/files.upload', formData, undefined, false);
    return response.file;
  }

  /**
   * Get file information
   */
  async getFile(fileId: string): Promise<SlackFile> {
    const response = await this.apiRequest('GET', '/files.info', {
      file: fileId
    });

    return response.file;
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.apiRequest('POST', '/files.delete', {
      file: fileId
    });
  }

  /**
   * Share a file to channels
   */
  async shareFile(fileId: string, channels: string[]): Promise<SlackFile> {
    const response = await this.apiRequest('POST', '/files.share', {
      file: fileId,
      channel: channels.join(',')
    });

    return response.file;
  }

  // ==================== REACTIONS ====================

  /**
   * Add reaction to a message
   */
  async addReaction(channelId: string, ts: string, name: string): Promise<void> {
    await this.apiRequest('POST', '/reactions.add', {
      channel: channelId,
      timestamp: ts,
      name
    });
  }

  /**
   * Remove reaction from a message
   */
  async removeReaction(channelId: string, ts: string, name: string): Promise<void> {
    await this.apiRequest('POST', '/reactions.remove', {
      channel: channelId,
      timestamp: ts,
      name
    });
  }

  /**
   * Get reactions for a message
   */
  async getReactions(channelId: string, ts: string): Promise<SlackReaction[]> {
    const response = await this.apiRequest('GET', '/reactions.get', {
      channel: channelId,
      timestamp: ts
    });

    return response.message?.reactions || [];
  }

  // ==================== WORKFLOWS & SHORTCUTS ====================

  /**
   * Create a workflow step response
   */
  async respondToWorkflowStep(workflowStepExecuteId: string, outputs?: Record<string, any>): Promise<void> {
    await this.apiRequest('POST', '/workflows.stepCompleted', {
      workflow_step_execute_id: workflowStepExecuteId,
      outputs
    });
  }

  /**
   * Fail a workflow step
   */
  async failWorkflowStep(workflowStepExecuteId: string, error: { message: string }): Promise<void> {
    await this.apiRequest('POST', '/workflows.stepFailed', {
      workflow_step_execute_id: workflowStepExecuteId,
      error
    });
  }

  // ==================== UTILITIES ====================

  /**
   * Test connection to Slack
   */
  async testConnection(): Promise<{ success: boolean; error?: string; teamInfo?: any }> {
    try {
      const response = await this.apiRequest('GET', '/auth.test');
      
      return {
        success: true,
        teamInfo: {
          teamId: response.team_id,
          team: response.team,
          userId: response.user_id,
          user: response.user,
          botId: response.bot_id,
          url: response.url
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get team information
   */
  async getTeamInfo(): Promise<any> {
    const response = await this.apiRequest('GET', '/team.info');
    return response.team;
  }

  /**
   * Parse Slack webhook signature
   */
  verifyWebhookSignature(requestBody: string, timestamp: string, signature: string): boolean {
    if (!this.config.signingSecret) {
      throw new Error('Signing secret not configured');
    }

    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.config.signingSecret);
    hmac.update(`v0:${timestamp}:${requestBody}`);
    const computedSignature = `v0=${hmac.digest('hex')}`;

    return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(signature)
    );
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest<T = any>(
    method: string,
    endpoint: string,
    data?: any,
    queryParams?: Record<string, string>,
    isJson: boolean = true
  ): Promise<T> {
    if (!this.credentials) {
      throw new Error('No credentials available. Please authenticate first.');
    }

    let url = `${this.baseUrl}${endpoint}`;
    
    if (queryParams && method === 'GET') {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }

    const headers: HeadersInit = {
      'Authorization': `${this.credentials.tokenType} ${this.credentials.accessToken}`
    };

    const config: RequestInit = {
      method,
      headers
    };

    if (data) {
      if (isJson) {
        headers['Content-Type'] = 'application/json; charset=utf-8';
        if (method === 'GET') {
          const params = new URLSearchParams(data);
          url += `?${params.toString()}`;
        } else {
          config.body = JSON.stringify(data);
        }
      } else {
        // For form data (file uploads)
        config.body = data;
      }
    }

    try {
      const response = await fetch(url, config);
      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || `API request failed: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error(`Slack API request failed: ${method} ${url}`, error);
      throw error;
    }
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Send a simple text message
   */
  async sendSimpleMessage(channelId: string, text: string): Promise<SlackMessage> {
    return this.sendMessage(channelId, text);
  }

  /**
   * Send a rich message with blocks
   */
  async sendRichMessage(channelId: string, blocks: SlackBlock[]): Promise<SlackMessage> {
    return this.sendMessage(channelId, undefined, blocks);
  }

  /**
   * Send a direct message to a user
   */
  async sendDirectMessage(userId: string, text: string): Promise<SlackMessage> {
    // Open DM channel first
    const response = await this.apiRequest('POST', '/conversations.open', {
      users: userId
    });

    return this.sendMessage(response.channel.id, text);
  }

  /**
   * Get workspace statistics
   */
  async getWorkspaceStats(): Promise<{
    totalChannels: number;
    totalUsers: number;
    activeUsers: number;
    totalMessages: number;
  }> {
    const [channels, users] = await Promise.all([
      this.getChannels(),
      this.getUsers()
    ]);

    const activeUsers = users.filter(user => !user.deleted && !user.is_bot).length;

    return {
      totalChannels: channels.length,
      totalUsers: users.length,
      activeUsers,
      totalMessages: 0 // Would need to aggregate from message history
    };
  }

  /**
   * Create notification message block
   */
  createNotificationBlock(title: string, message: string, color?: string): SlackBlock[] {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${title}*\n${message}`
        }
      }
    ];
  }

  /**
   * Create action button block
   */
  createActionBlock(text: string, buttonText: string, buttonValue: string, buttonUrl?: string): SlackBlock[] {
    const block: SlackBlock = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text
      }
    };

    if (buttonUrl) {
      block.accessory = {
        type: 'button',
        text: {
          type: 'plain_text',
          text: buttonText
        },
        url: buttonUrl,
        value: buttonValue
      };
    } else {
      block.accessory = {
        type: 'button',
        text: {
          type: 'plain_text',
          text: buttonText
        },
        value: buttonValue,
        action_id: 'button_click'
      };
    }

    return [block];
  }
}

export default SlackConnector;