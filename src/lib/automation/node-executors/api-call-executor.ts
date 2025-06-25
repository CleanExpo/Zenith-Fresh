/**
 * API Call Node Executor
 * Handles HTTP API calls within workflows
 */

import { NodeExecutor, WorkflowNode, ExecutionContext, NodeMetadata } from '../workflow-engine';
import { logger } from '@/lib/monitoring/enhanced-sentry';

interface APICallConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  auth?: {
    type: 'bearer' | 'basic' | 'api_key';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    headerName?: string;
  };
}

export class APICallExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    try {
      const config = node.config as APICallConfig;
      
      logger.info('API call node executed', {
        nodeId: node.id,
        executionId: context.executionId,
        method: config.method,
        url: config.url
      });

      const result = await this.makeAPICall(config, context);

      return {
        success: true,
        statusCode: result.status,
        data: result.data,
        headers: result.headers,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('API call execution failed', {
        nodeId: node.id,
        executionId: context.executionId,
        error: error.message
      });
      throw error;
    }
  }

  private async makeAPICall(config: APICallConfig, context: ExecutionContext): Promise<any> {
    const url = this.interpolateString(config.url, context);
    const headers = this.interpolateHeaders(config.headers || {}, context);
    const body = this.interpolateValue(config.body, context);

    // Add authentication
    if (config.auth) {
      this.addAuthentication(headers, config.auth, context);
    }

    const requestConfig: RequestInit = {
      method: config.method,
      headers,
      signal: AbortSignal.timeout(config.timeout || 30000)
    };

    if (body && config.method !== 'GET') {
      requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    let lastError: Error | null = null;
    const maxRetries = config.retries || 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, requestConfig);
        
        let responseData;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData
        };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    throw lastError;
  }

  private addAuthentication(
    headers: Record<string, string>,
    auth: NonNullable<APICallConfig['auth']>,
    context: ExecutionContext
  ): void {
    switch (auth.type) {
      case 'bearer':
        if (auth.token) {
          headers['Authorization'] = `Bearer ${this.interpolateString(auth.token, context)}`;
        }
        break;
      
      case 'basic':
        if (auth.username && auth.password) {
          const credentials = Buffer.from(
            `${this.interpolateString(auth.username, context)}:${this.interpolateString(auth.password, context)}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
      
      case 'api_key':
        if (auth.apiKey && auth.headerName) {
          headers[auth.headerName] = this.interpolateString(auth.apiKey, context);
        }
        break;
    }
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
    const config = node.config as APICallConfig;
    
    if (!config.url) {
      throw new Error('API URL is required');
    }

    if (!config.method) {
      throw new Error('HTTP method is required');
    }

    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    if (!validMethods.includes(config.method)) {
      throw new Error(`Invalid HTTP method: ${config.method}`);
    }

    return true;
  }

  getMetadata(): NodeMetadata {
    return {
      category: 'Integration',
      description: 'Make HTTP API calls to external services',
      inputs: [
        {
          name: 'data',
          type: 'object',
          required: false,
          description: 'Data to include in the API call'
        }
      ],
      outputs: [
        {
          name: 'statusCode',
          type: 'number',
          description: 'HTTP response status code'
        },
        {
          name: 'data',
          type: 'any',
          description: 'Response data from the API'
        },
        {
          name: 'headers',
          type: 'object',
          description: 'Response headers'
        }
      ],
      config: [
        {
          name: 'url',
          type: 'string',
          required: true,
          description: 'API endpoint URL'
        },
        {
          name: 'method',
          type: 'select',
          required: true,
          description: 'HTTP method',
          defaultValue: 'GET'
        },
        {
          name: 'headers',
          type: 'object',
          required: false,
          description: 'Request headers',
          defaultValue: {}
        },
        {
          name: 'body',
          type: 'object',
          required: false,
          description: 'Request body data'
        },
        {
          name: 'timeout',
          type: 'number',
          required: false,
          description: 'Request timeout in milliseconds',
          defaultValue: 30000
        }
      ]
    };
  }
}