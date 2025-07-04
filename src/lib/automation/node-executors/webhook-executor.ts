/**
 * Webhook Node Executor
 * Handles webhook calls within workflows
 */

import { NodeExecutor, WorkflowNode, ExecutionContext, NodeMetadata } from '../workflow-engine';
import { logger } from '@/lib/monitoring/enhanced-sentry';

interface WebhookConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  payload?: any;
  secret?: string;
  timeout?: number;
}

export class WebhookExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    try {
      const config = node.config as WebhookConfig;
      
      logger.info('Webhook node executed', {
        nodeId: node.id,
        executionId: context.executionId,
        url: config.url
      });

      const result = await this.sendWebhook(config, context);

      return {
        success: true,
        statusCode: result.status,
        response: result.data,
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Webhook execution failed', {
        nodeId: node.id,
        executionId: context.executionId,
        error: error.message
      });
      throw error;
    }
  }

  private async sendWebhook(config: WebhookConfig, context: ExecutionContext): Promise<any> {
    const url = this.interpolateString(config.url, context);
    const method = config.method || 'POST';
    const headers = this.interpolateHeaders(config.headers || {}, context);
    const payload = this.interpolateValue(config.payload || {}, context);

    // Add webhook signature if secret is provided
    if (config.secret) {
      const signature = await this.generateSignature(JSON.stringify(payload), config.secret);
      headers['X-Webhook-Signature'] = signature;
    }

    const requestConfig: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Zenith-Automation-Hub/1.0',
        ...headers
      },
      signal: AbortSignal.timeout(config.timeout || 30000)
    };

    if (payload && method !== 'GET') {
      requestConfig.body = JSON.stringify(payload);
    }

    const response = await fetch(url, requestConfig);
    
    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData
    };
  }

  private async generateSignature(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    return `sha256=${Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;
  }

  private interpolateString(template: string, context: ExecutionContext): string {
    if (typeof template !== 'string') return String(template);
    
    let result = template;
    const variables = { ...context.variables, ...context.nodeOutputs };
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  private interpolateHeaders(
    headers: Record<string, string>,
    context: ExecutionContext
  ): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      result[key] = this.interpolateString(value, context);
    }

    return result;
  }

  private interpolateValue(value: any, context: ExecutionContext): any {
    if (typeof value === 'string') {
      return this.interpolateString(value, context);
    } else if (typeof value === 'object' && value !== null) {
      const result: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.interpolateValue(val, context);
      }
      return result;
    }
    return value;
  }

  async validate(node: WorkflowNode): Promise<boolean> {
    const config = node.config as WebhookConfig;
    
    if (!config.url) {
      throw new Error('Webhook URL is required');
    }

    try {
      new URL(config.url);
    } catch {
      throw new Error('Invalid webhook URL format');
    }

    return true;
  }

  getMetadata(): NodeMetadata {
    return {
      category: 'Integration',
      description: 'Send webhook notifications to external services',
      inputs: [
        {
          name: 'data',
          type: 'object',
          required: false,
          description: 'Data to include in webhook payload'
        }
      ],
      outputs: [
        {
          name: 'statusCode',
          type: 'number',
          description: 'HTTP response status code'
        },
        {
          name: 'response',
          type: 'any',
          description: 'Response from webhook endpoint'
        },
        {
          name: 'sentAt',
          type: 'string',
          description: 'ISO timestamp when webhook was sent'
        }
      ],
      config: [
        {
          name: 'url',
          type: 'string',
          required: true,
          description: 'Webhook endpoint URL'
        },
        {
          name: 'method',
          type: 'select',
          required: false,
          description: 'HTTP method',
          defaultValue: 'POST'
        },
        {
          name: 'headers',
          type: 'object',
          required: false,
          description: 'Custom headers',
          defaultValue: {}
        },
        {
          name: 'payload',
          type: 'object',
          required: false,
          description: 'Webhook payload data',
          defaultValue: {}
        },
        {
          name: 'secret',
          type: 'string',
          required: false,
          description: 'Webhook secret for signature generation'
        }
      ]
    };
  }
}