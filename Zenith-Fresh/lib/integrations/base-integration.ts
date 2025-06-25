/**
 * Base Integration Service
 * Core functionality for all enterprise integrations
 */

import { BaseIntegration, IntegrationConfig, IntegrationEvent, SyncJob, IntegrationStats } from '@/types/integrations';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export abstract class BaseIntegrationService {
  protected integration: BaseIntegration;
  protected cachePrefix: string;

  constructor(integration: BaseIntegration) {
    this.integration = integration;
    this.cachePrefix = `integration:${integration.id}`;
  }

  /**
   * Test connection to the integration service
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Authenticate with the integration service
   */
  abstract authenticate(): Promise<boolean>;

  /**
   * Refresh authentication tokens
   */
  abstract refreshAuth(): Promise<boolean>;

  /**
   * Perform data synchronization
   */
  abstract sync(type: 'full' | 'incremental' | 'manual'): Promise<SyncJob>;

  /**
   * Handle webhook events
   */
  abstract handleWebhook(payload: any, headers: Record<string, string>): Promise<void>;

  /**
   * Get integration statistics
   */
  async getStats(): Promise<IntegrationStats> {
    const cacheKey = `${this.cachePrefix}:stats`;
    const cached = await this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    const stats = await this.calculateStats();
    await this.setCached(cacheKey, stats, 300); // 5 minutes cache
    
    return stats;
  }

  /**
   * Calculate integration statistics
   */
  protected async calculateStats(): Promise<IntegrationStats> {
    // This would typically query the database for actual stats
    // For now, return mock data structure
    return {
      totalConnections: 1,
      activeConnections: this.integration.status === 'connected' ? 1 : 0,
      errorConnections: this.integration.status === 'error' ? 1 : 0,
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      dataPointsSynced: 0,
      averageSyncTime: 0,
      lastSyncDuration: 0,
      uptimePercentage: 99.9,
    };
  }

  /**
   * Log integration event
   */
  protected async logEvent(
    type: IntegrationEvent['type'],
    status: IntegrationEvent['status'],
    message: string,
    details?: Record<string, any>,
    duration?: number
  ): Promise<void> {
    const event: Omit<IntegrationEvent, 'id'> = {
      integrationId: this.integration.id,
      type,
      status,
      message,
      details,
      timestamp: new Date(),
      duration,
    };

    // Store in database (would use actual prisma call in production)
    console.log(`Integration Event [${type}/${status}]: ${message}`, details);
    
    // Also store in Redis for real-time monitoring
    const eventsKey = `${this.cachePrefix}:events`;
    await redis.lpush(eventsKey, JSON.stringify(event));
    await redis.ltrim(eventsKey, 0, 999); // Keep last 1000 events
    await redis.expire(eventsKey, 86400); // 24 hours
  }

  /**
   * Update integration status
   */
  protected async updateStatus(status: BaseIntegration['status']): Promise<void> {
    this.integration.status = status;
    this.integration.updatedAt = new Date();
    
    // Update in database
    // await prisma.integration.update({
    //   where: { id: this.integration.id },
    //   data: { status, updatedAt: new Date() }
    // });
    
    // Clear stats cache
    await this.clearCached(`${this.cachePrefix}:stats`);
  }

  /**
   * Cache utilities
   */
  protected async getCached(key: string): Promise<any> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  protected async setCached(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  protected async clearCached(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Rate limiting
   */
  protected async checkRateLimit(): Promise<boolean> {
    const rateLimitKey = `${this.cachePrefix}:ratelimit`;
    const current = await redis.incr(rateLimitKey);
    
    if (current === 1) {
      await redis.expire(rateLimitKey, 60); // 1 minute window
    }
    
    return current <= this.integration.metadata.rateLimits.requestsPerMinute;
  }

  /**
   * Error handling with retry logic
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        await this.logEvent(
          'error',
          'warning',
          `Retry attempt ${attempt}/${maxRetries} failed: ${error.message}`,
          { attempt, maxRetries, error: error.message }
        );
        
        await this.sleep(delay * Math.pow(2, attempt - 1)); // Exponential backoff
      }
    }
    
    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate configuration
   */
  protected validateConfig(): void {
    if (!this.integration.config.credentials) {
      throw new Error('Integration credentials not configured');
    }
    
    if (this.integration.config.authType === 'oauth2') {
      if (!this.integration.config.credentials.clientId || !this.integration.config.credentials.clientSecret) {
        throw new Error('OAuth2 requires clientId and clientSecret');
      }
    }
    
    if (this.integration.config.authType === 'api_key') {
      if (!this.integration.config.credentials.apiKey) {
        throw new Error('API Key authentication requires apiKey');
      }
    }
  }

  /**
   * HTTP request wrapper with authentication
   */
  protected async makeRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Check rate limits
    if (!(await this.checkRateLimit())) {
      throw new Error('Rate limit exceeded');
    }

    // Add authentication headers
    const headers = await this.getAuthHeaders();
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Zenith-Enterprise-Hub/1.0',
        ...headers,
        ...options.headers,
      },
    };

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    return response;
  }

  /**
   * Get authentication headers based on auth type
   */
  protected async getAuthHeaders(): Promise<Record<string, string>> {
    const { authType, credentials } = this.integration.config;
    
    switch (authType) {
      case 'oauth2':
        if (!credentials.accessToken) {
          throw new Error('OAuth2 access token not available');
        }
        return {
          'Authorization': `Bearer ${credentials.accessToken}`,
        };
      
      case 'api_key':
        if (!credentials.apiKey) {
          throw new Error('API key not available');
        }
        return {
          'Authorization': `ApiKey ${credentials.apiKey}`,
        };
      
      case 'basic':
        if (!credentials.username || !credentials.password) {
          throw new Error('Basic auth credentials not available');
        }
        const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
        return {
          'Authorization': `Basic ${encoded}`,
        };
      
      default:
        return {};
    }
  }

  /**
   * Data transformation utilities
   */
  protected transformData<T, U>(data: T, mapping: Record<string, string>): U {
    const result: any = {};
    
    for (const [targetField, sourceField] of Object.entries(mapping)) {
      const sourceValue = this.getNestedValue(data, sourceField);
      if (sourceValue !== undefined) {
        this.setNestedValue(result, targetField, sourceValue);
      }
    }
    
    return result as U;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    lastCheck: Date;
    details: Record<string, any>;
  }> {
    const startTime = Date.now();
    
    try {
      const connected = await this.testConnection();
      const duration = Date.now() - startTime;
      
      const result = {
        status: connected ? 'healthy' as const : 'unhealthy' as const,
        lastCheck: new Date(),
        details: {
          connectionTest: connected,
          responseTime: duration,
          integration: {
            id: this.integration.id,
            name: this.integration.name,
            provider: this.integration.provider,
            status: this.integration.status,
          },
        },
      };
      
      await this.logEvent(
        'connection',
        connected ? 'success' : 'error',
        `Health check ${connected ? 'passed' : 'failed'}`,
        result.details,
        duration
      );
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = {
        status: 'unhealthy' as const,
        lastCheck: new Date(),
        details: {
          error: error.message,
          responseTime: duration,
          integration: {
            id: this.integration.id,
            name: this.integration.name,
            provider: this.integration.provider,
            status: this.integration.status,
          },
        },
      };
      
      await this.logEvent(
        'connection',
        'error',
        `Health check failed: ${error.message}`,
        result.details,
        duration
      );
      
      return result;
    }
  }
}