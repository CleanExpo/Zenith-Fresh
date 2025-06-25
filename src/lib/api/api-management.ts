import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  scope: string[];
  rateLimit: number;
  rateLimitWindow: number;
  expiresAt?: Date;
  lastUsedAt?: Date;
  active: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RateLimitConfig {
  requests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface ApiUsage {
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class ApiKeyManager {
  static async createApiKey(data: {
    name: string;
    tenantId: string;
    scope: string[];
    rateLimit?: number;
    rateLimitWindow?: number;
    expiresAt?: Date;
  }): Promise<ApiKey> {
    const key = this.generateApiKey();
    const hashedKey = this.hashKey(key);

    const apiKey = await prisma.aPIKey.create({
      data: {
        id: randomUUID(),
        name: data.name,
        key: hashedKey,
        keyPrefix: key.substring(0, 8),
        scope: data.scope,
        rateLimit: data.rateLimit || 1000,
        rateLimitWindow: data.rateLimitWindow || 3600000, // 1 hour
        expiresAt: data.expiresAt,
        tenantId: data.tenantId,
        active: true,
      },
    });

    return {
      ...apiKey,
      key, // Return the actual key only on creation
    };
  }

  static async getApiKey(keyId: string, tenantId: string): Promise<ApiKey | null> {
    const apiKey = await prisma.aPIKey.findFirst({
      where: {
        id: keyId,
        tenantId,
      },
    });

    if (!apiKey) {
      return null;
    }

    return {
      ...apiKey,
      key: `${apiKey.keyPrefix}***`, // Mask the key
    };
  }

  static async listApiKeys(tenantId: string): Promise<ApiKey[]> {
    const apiKeys = await prisma.aPIKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return apiKeys.map(apiKey => ({
      ...apiKey,
      key: `${apiKey.keyPrefix}***`,
    }));
  }

  static async validateApiKey(key: string): Promise<{
    valid: boolean;
    apiKey?: ApiKey;
    error?: string;
  }> {
    const hashedKey = this.hashKey(key);
    
    const apiKey = await prisma.aPIKey.findFirst({
      where: {
        key: hashedKey,
        active: true,
      },
    });

    if (!apiKey) {
      return { valid: false, error: 'Invalid API key' };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false, error: 'API key expired' };
    }

    // Update last used
    await prisma.aPIKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return { valid: true, apiKey };
  }

  static async rotateApiKey(keyId: string, tenantId: string): Promise<string> {
    const apiKey = await prisma.aPIKey.findFirst({
      where: {
        id: keyId,
        tenantId,
      },
    });

    if (!apiKey) {
      throw new Error('API key not found');
    }

    const newKey = this.generateApiKey();
    const hashedKey = this.hashKey(newKey);

    await prisma.aPIKey.update({
      where: { id: keyId },
      data: {
        key: hashedKey,
        keyPrefix: newKey.substring(0, 8),
        updatedAt: new Date(),
      },
    });

    return newKey;
  }

  static async revokeApiKey(keyId: string, tenantId: string): Promise<void> {
    await prisma.aPIKey.update({
      where: {
        id: keyId,
        tenantId,
      },
      data: {
        active: false,
        updatedAt: new Date(),
      },
    });
  }

  private static generateApiKey(): string {
    const prefix = 'sk';
    const randomBytes = require('crypto').randomBytes(32).toString('hex');
    return `${prefix}_${randomBytes}`;
  }

  private static hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
}

export class RateLimiter {
  private static cache = new Map<string, { count: number; resetTime: number }>();

  static async checkRateLimit(
    apiKeyId: string,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const key = `rate_limit:${apiKeyId}`;
    
    // Get current count
    let data = this.cache.get(key);
    
    if (!data || now > data.resetTime) {
      // Reset window
      data = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }

    if (data.count >= config.requests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.resetTime,
      };
    }

    // Increment count
    data.count++;
    this.cache.set(key, data);

    return {
      allowed: true,
      remaining: config.requests - data.count,
      resetTime: data.resetTime,
    };
  }

  static async recordUsage(usage: ApiUsage): Promise<void> {
    await prisma.aPIUsage.create({
      data: {
        id: randomUUID(),
        apiKeyId: usage.apiKeyId,
        endpoint: usage.endpoint,
        method: usage.method,
        statusCode: usage.statusCode,
        responseTime: usage.responseTime,
        timestamp: usage.timestamp,
        ipAddress: usage.ipAddress,
        userAgent: usage.userAgent,
      },
    });
  }

  static async getUsageStats(
    tenantId: string,
    timeframe: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
  }> {
    const now = new Date();
    const startTime = new Date();
    
    switch (timeframe) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '24h':
        startTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        break;
    }

    const apiKeys = await prisma.aPIKey.findMany({
      where: { tenantId },
      select: { id: true },
    });

    const apiKeyIds = apiKeys.map(k => k.id);

    const [totalRequests, successfulRequests, failedRequests, avgResponseTime, topEndpoints] = await Promise.all([
      prisma.aPIUsage.count({
        where: {
          apiKeyId: { in: apiKeyIds },
          timestamp: { gte: startTime },
        },
      }),
      prisma.aPIUsage.count({
        where: {
          apiKeyId: { in: apiKeyIds },
          timestamp: { gte: startTime },
          statusCode: { gte: 200, lt: 400 },
        },
      }),
      prisma.aPIUsage.count({
        where: {
          apiKeyId: { in: apiKeyIds },
          timestamp: { gte: startTime },
          statusCode: { gte: 400 },
        },
      }),
      prisma.aPIUsage.aggregate({
        where: {
          apiKeyId: { in: apiKeyIds },
          timestamp: { gte: startTime },
        },
        _avg: {
          responseTime: true,
        },
      }),
      prisma.aPIUsage.groupBy({
        by: ['endpoint'],
        where: {
          apiKeyId: { in: apiKeyIds },
          timestamp: { gte: startTime },
        },
        _count: {
          endpoint: true,
        },
        orderBy: {
          _count: {
            endpoint: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: avgResponseTime._avg.responseTime || 0,
      topEndpoints: topEndpoints.map(e => ({
        endpoint: e.endpoint,
        count: e._count.endpoint,
      })),
    };
  }
}

// API middleware
export class ApiMiddleware {
  static async authenticateRequest(req: Request): Promise<{
    authenticated: boolean;
    apiKey?: ApiKey;
    error?: string;
  }> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'Missing or invalid Authorization header' };
    }

    const token = authHeader.substring(7);
    const validation = await ApiKeyManager.validateApiKey(token);

    if (!validation.valid) {
      return { authenticated: false, error: validation.error };
    }

    return { authenticated: true, apiKey: validation.apiKey };
  }

  static async enforceRateLimit(apiKey: ApiKey): Promise<{
    allowed: boolean;
    headers: Record<string, string>;
  }> {
    const rateLimit = await RateLimiter.checkRateLimit(apiKey.id, {
      requests: apiKey.rateLimit,
      windowMs: apiKey.rateLimitWindow,
    });

    const headers = {
      'X-RateLimit-Limit': apiKey.rateLimit.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
    };

    return {
      allowed: rateLimit.allowed,
      headers,
    };
  }

  static async checkScope(apiKey: ApiKey, requiredScope: string): Promise<boolean> {
    return apiKey.scope.includes(requiredScope) || apiKey.scope.includes('*');
  }

  static async logRequest(
    apiKey: ApiKey,
    req: Request,
    res: Response,
    responseTime: number
  ): Promise<void> {
    const url = new URL(req.url);
    
    await RateLimiter.recordUsage({
      apiKeyId: apiKey.id,
      endpoint: url.pathname,
      method: req.method,
      statusCode: res.status,
      responseTime,
      timestamp: new Date(),
      ipAddress: req.headers.get('x-forwarded-for') || 
                req.headers.get('x-real-ip') || 
                'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });
  }
}

// SDK generator
export class SdkGenerator {
  static async generateTypeScriptSdk(tenantId: string): Promise<string> {
    const apiKeys = await prisma.aPIKey.findMany({
      where: { tenantId },
      select: { scope: true },
    });

    const allScopes = new Set<string>();
    apiKeys.forEach(key => key.scope.forEach(scope => allScopes.add(scope)));

    return `
// Auto-generated TypeScript SDK
export class ZenithApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.zenith.engineer') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = \`\${this.baseUrl}\${endpoint}\`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(\`API request failed: \${response.statusText}\`);
    }

    return response.json();
  }

  ${Array.from(allScopes).map(scope => this.generateScopeEndpoints(scope)).join('\n')}
}
`;
  }

  private static generateScopeEndpoints(scope: string): string {
    switch (scope) {
      case 'users':
        return `
  // User management
  async getUsers(params?: { limit?: number; offset?: number }) {
    return this.request('/api/users', { method: 'GET' });
  }

  async createUser(data: { email: string; name: string }) {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUser(userId: string) {
    return this.request(\`/api/users/\${userId}\`, { method: 'GET' });
  }

  async updateUser(userId: string, data: { name?: string; email?: string }) {
    return this.request(\`/api/users/\${userId}\`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: string) {
    return this.request(\`/api/users/\${userId}\`, { method: 'DELETE' });
  }`;

      case 'projects':
        return `
  // Project management
  async getProjects(params?: { limit?: number; offset?: number }) {
    return this.request('/api/projects', { method: 'GET' });
  }

  async createProject(data: { name: string; description?: string }) {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProject(projectId: string) {
    return this.request(\`/api/projects/\${projectId}\`, { method: 'GET' });
  }

  async updateProject(projectId: string, data: { name?: string; description?: string }) {
    return this.request(\`/api/projects/\${projectId}\`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(projectId: string) {
    return this.request(\`/api/projects/\${projectId}\`, { method: 'DELETE' });
  }`;

      default:
        return `
  // ${scope} endpoints
  async get${scope.charAt(0).toUpperCase() + scope.slice(1)}() {
    return this.request(\`/api/${scope}\`, { method: 'GET' });
  }`;
    }
  }
}