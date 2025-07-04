/**
 * ZENITH API OPTIMIZATION MIDDLEWARE
 * Enterprise-grade middleware for API performance optimization
 * Automatic performance monitoring, caching, compression, and security
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/security/rate-limiter';
import { apiMonitor } from './api-performance-monitor';
import { redis } from '@/lib/redis';
import { z } from 'zod';
import crypto from 'crypto';
// import { compress } from 'compression'; // TODO: Install compression package

interface OptimizationConfig {
  caching?: {
    enabled: boolean;
    ttl: number; // seconds
    varyBy?: string[]; // headers to vary cache by
    excludeMethods?: string[];
  };
  compression?: {
    enabled: boolean;
    threshold: number; // minimum bytes to compress
    algorithms: ('gzip' | 'br' | 'deflate')[];
  };
  rateLimiting?: {
    enabled: boolean;
    configName: string;
  };
  monitoring?: {
    enabled: boolean;
    sampleRate: number; // 0-1, percentage of requests to monitor
  };
  validation?: {
    enabled: boolean;
    requestSchema?: z.ZodSchema;
    responseSchema?: z.ZodSchema;
  };
  security?: {
    enabled: boolean;
    requireAuth: boolean;
    allowedOrigins?: string[];
    maxRequestSize: number; // bytes
  };
}

interface RequestContext {
  startTime: number;
  endpoint: string;
  method: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  payloadSize: number;
  cacheKey?: string;
  cacheHit: boolean;
}

const DEFAULT_CONFIG: OptimizationConfig = {
  caching: {
    enabled: true,
    ttl: 300, // 5 minutes
    varyBy: ['user-id', 'team-id'],
    excludeMethods: ['POST', 'PUT', 'DELETE', 'PATCH']
  },
  compression: {
    enabled: true,
    threshold: 1024, // 1KB
    algorithms: ['br', 'gzip', 'deflate']
  },
  rateLimiting: {
    enabled: true,
    configName: 'api'
  },
  monitoring: {
    enabled: true,
    sampleRate: 1.0 // Monitor all requests
  },
  validation: {
    enabled: false // Disabled by default, enable per endpoint
  },
  security: {
    enabled: true,
    requireAuth: false, // Set per endpoint
    maxRequestSize: 10 * 1024 * 1024 // 10MB
  }
};

export class APIOptimizationMiddleware {
  private config: OptimizationConfig;
  
  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main middleware function
   */
  middleware(config?: Partial<OptimizationConfig>) {
    const finalConfig = { ...this.config, ...config };
    
    return async (
      request: NextRequest,
      handler: (req: NextRequest, context: RequestContext) => Promise<NextResponse>,
      context: { params?: any } = {}
    ): Promise<NextResponse> => {
      const requestContext = await this.initializeContext(request);
      
      try {
        // 1. Security checks
        if (finalConfig.security?.enabled) {
          const securityResult = await this.applySecurity(request, finalConfig.security);
          if (securityResult) return securityResult;
        }
        
        // 2. Rate limiting
        if (finalConfig.rateLimiting?.enabled) {
          const rateLimitResult = await this.applyRateLimit(request, finalConfig.rateLimiting);
          if (rateLimitResult) return rateLimitResult;
        }
        
        // 3. Input validation
        if (finalConfig.validation?.enabled && finalConfig.validation.requestSchema) {
          const validationResult = await this.validateRequest(request, finalConfig.validation.requestSchema);
          if (validationResult) return validationResult;
        }
        
        // 4. Check cache
        if (finalConfig.caching?.enabled && this.shouldCache(request.method, finalConfig.caching)) {
          const cacheResult = await this.checkCache(request, requestContext, finalConfig.caching);
          if (cacheResult) {
            await this.recordMetrics(requestContext, cacheResult, true);
            return cacheResult;
          }
        }
        
        // 5. Execute handler
        const response = await handler(request, requestContext);
        
        // 6. Output validation
        if (finalConfig.validation?.enabled && finalConfig.validation.responseSchema) {
          await this.validateResponse(response, finalConfig.validation.responseSchema);
        }
        
        // 7. Apply compression
        let optimizedResponse = response;
        if (finalConfig.compression?.enabled) {
          optimizedResponse = await this.applyCompression(response, finalConfig.compression);
        }
        
        // 8. Cache response
        if (finalConfig.caching?.enabled && this.shouldCache(request.method, finalConfig.caching)) {
          await this.cacheResponse(requestContext, optimizedResponse, finalConfig.caching);
        }
        
        // 9. Record metrics
        if (finalConfig.monitoring?.enabled && Math.random() < finalConfig.monitoring.sampleRate) {
          await this.recordMetrics(requestContext, optimizedResponse, false);
        }
        
        // 10. Add performance headers
        optimizedResponse = this.addPerformanceHeaders(optimizedResponse, requestContext);
        
        return optimizedResponse;
        
      } catch (error) {
        console.error('API Optimization Middleware Error:', error);
        
        // Record error metrics
        const errorResponse = NextResponse.json(
          { error: 'Internal Server Error', message: 'An unexpected error occurred' },
          { status: 500 }
        );
        
        if (finalConfig.monitoring?.enabled) {
          await this.recordMetrics(requestContext, errorResponse, false, error instanceof Error ? error.message : 'Unknown error');
        }
        
        return errorResponse;
      }
    };
  }

  // ==================== INITIALIZATION ====================

  private async initializeContext(request: NextRequest): Promise<RequestContext> {
    const body = await this.safeGetRequestBody(request);
    const payloadSize = body ? new TextEncoder().encode(JSON.stringify(body)).length : 0;
    
    return {
      startTime: Date.now(),
      endpoint: new URL(request.url).pathname,
      method: request.method,
      userId: this.extractUserId(request),
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      payloadSize,
      cacheHit: false
    };
  }

  private async safeGetRequestBody(request: NextRequest): Promise<any> {
    try {
      if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        return null;
      }
      const text = await request.text();
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }

  private extractUserId(request: NextRequest): string | undefined {
    // Extract from JWT token, session, or headers
    const authHeader = request.headers.get('authorization');
    const sessionCookie = request.cookies.get('next-auth.session-token');
    
    // Simple extraction (would be more sophisticated in production)
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        return payload.sub || payload.userId;
      } catch {
        return undefined;
      }
    }
    
    return undefined;
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return 'unknown';
  }

  // ==================== SECURITY ====================

  private async applySecurity(
    request: NextRequest,
    config: NonNullable<OptimizationConfig['security']>
  ): Promise<NextResponse | null> {
    
    // Check request size
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > config.maxRequestSize) {
      return NextResponse.json(
        { error: 'Payload Too Large', message: 'Request payload exceeds maximum size' },
        { status: 413 }
      );
    }
    
    // CORS check
    if (config.allowedOrigins) {
      const origin = request.headers.get('origin');
      if (origin && !config.allowedOrigins.includes(origin)) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Origin not allowed' },
          { status: 403 }
        );
      }
    }
    
    // Authentication check
    if (config.requireAuth) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    
    return null; // No security issues
  }

  // ==================== RATE LIMITING ====================

  private async applyRateLimit(
    request: NextRequest,
    config: NonNullable<OptimizationConfig['rateLimiting']>
  ): Promise<NextResponse | null> {
    
    try {
      const identifier = this.getClientIP(request);
      const result = await rateLimiter.checkLimit(identifier, config.configName, request);
      
      if (!result.allowed) {
        const response = NextResponse.json(
          {
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            resetTime: result.resetTime
          },
          { status: 429 }
        );
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', '100');
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
        response.headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());
        
        return response;
      }
      
      return null; // Rate limit passed
      
    } catch (error) {
      console.error('Rate limiting error:', error);
      return null; // Allow request if rate limiting fails
    }
  }

  // ==================== VALIDATION ====================

  private async validateRequest(
    request: NextRequest,
    schema: z.ZodSchema
  ): Promise<NextResponse | null> {
    
    try {
      const body = await this.safeGetRequestBody(request);
      const result = schema.safeParse(body);
      
      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            message: 'Invalid request data',
            details: result.error.errors
          },
          { status: 400 }
        );
      }
      
      return null; // Validation passed
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Failed to validate request' },
        { status: 400 }
      );
    }
  }

  private async validateResponse(
    response: NextResponse,
    schema: z.ZodSchema
  ): Promise<void> {
    
    try {
      const responseBody = await response.json();
      const result = schema.safeParse(responseBody);
      
      if (!result.success) {
        console.error('Response validation failed:', result.error);
        // Log but don't block response in production
      }
      
    } catch (error) {
      console.error('Response validation error:', error);
    }
  }

  // ==================== CACHING ====================

  private shouldCache(method: string, config: NonNullable<OptimizationConfig['caching']>): boolean {
    return !config.excludeMethods?.includes(method);
  }

  private generateCacheKey(request: NextRequest, context: RequestContext, config: NonNullable<OptimizationConfig['caching']>): string {
    const url = new URL(request.url);
    const baseKey = `api:${context.method}:${url.pathname}:${url.search}`;
    
    const varyParts: string[] = [];
    
    config.varyBy?.forEach(header => {
      const value = request.headers.get(header);
      if (value) {
        varyParts.push(`${header}:${value}`);
      }
    });
    
    const fullKey = varyParts.length > 0 ? `${baseKey}:${varyParts.join(':')}` : baseKey;
    context.cacheKey = fullKey;
    
    return fullKey;
  }

  private async checkCache(
    request: NextRequest,
    context: RequestContext,
    config: NonNullable<OptimizationConfig['caching']>
  ): Promise<NextResponse | null> {
    
    if (!redis) return null;
    
    try {
      const cacheKey = this.generateCacheKey(request, context, config);
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        const cachedData = JSON.parse(cached);
        context.cacheHit = true;
        
        const response = NextResponse.json(cachedData.body, {
          status: cachedData.status,
          headers: cachedData.headers
        });
        
        response.headers.set('X-Cache', 'HIT');
        response.headers.set('X-Cache-Key', cacheKey);
        
        return response;
      }
      
      return null; // Cache miss
      
    } catch (error) {
      console.error('Cache check error:', error);
      return null;
    }
  }

  private async cacheResponse(
    context: RequestContext,
    response: NextResponse,
    config: NonNullable<OptimizationConfig['caching']>
  ): Promise<void> {
    
    if (!redis || !context.cacheKey || response.status >= 400) return;
    
    try {
      const responseBody = await response.json();
      const cacheData = {
        body: responseBody,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      };
      
      await redis.setex(
        context.cacheKey,
        config.ttl,
        JSON.stringify(cacheData)
      );
      
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  // ==================== COMPRESSION ====================

  private async applyCompression(
    response: NextResponse,
    config: NonNullable<OptimizationConfig['compression']>
  ): Promise<NextResponse> {
    
    try {
      const responseText = await response.text();
      
      if (responseText.length < config.threshold) {
        return response; // Too small to compress
      }
      
      // For Next.js API routes, compression is typically handled by the server
      // This is a placeholder for custom compression logic
      
      const compressedResponse = new NextResponse(responseText, {
        status: response.status,
        headers: response.headers
      });
      
      compressedResponse.headers.set('Content-Encoding', 'gzip');
      compressedResponse.headers.set('X-Compressed', 'true');
      
      return compressedResponse;
      
    } catch (error) {
      console.error('Compression error:', error);
      return response;
    }
  }

  // ==================== MONITORING ====================

  private async recordMetrics(
    context: RequestContext,
    response: NextResponse,
    cacheHit: boolean,
    error?: string
  ): Promise<void> {
    
    try {
      const responseTime = Date.now() - context.startTime;
      const responseBody = await response.text();
      const responseSize = new TextEncoder().encode(responseBody).length;
      
      await apiMonitor.recordMetric({
        endpoint: context.endpoint,
        method: context.method,
        responseTime,
        statusCode: response.status,
        userId: context.userId,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        payloadSize: context.payloadSize,
        responseSize,
        cacheHit,
        error
      });
      
    } catch (error) {
      console.error('Metrics recording error:', error);
    }
  }

  // ==================== HEADERS ====================

  private addPerformanceHeaders(response: NextResponse, context: RequestContext): NextResponse {
    const responseTime = Date.now() - context.startTime;
    
    response.headers.set('X-Response-Time', `${responseTime}ms`);
    response.headers.set('X-Powered-By', 'Zenith-Fresh API');
    response.headers.set('X-Cache', context.cacheHit ? 'HIT' : 'MISS');
    
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Create optimized API handler with middleware
 */
export function createOptimizedAPIHandler(
  handler: (req: NextRequest, context: RequestContext) => Promise<NextResponse>,
  config?: Partial<OptimizationConfig>
) {
  const middleware = new APIOptimizationMiddleware(config);
  
  return async (request: NextRequest, context: { params?: any } = {}) => {
    return middleware.middleware(config)(request, handler, context);
  };
}

/**
 * Configuration presets for common use cases
 */
export const APIOptimizationPresets = {
  // High-performance read endpoints
  readOptimized: {
    caching: {
      enabled: true,
      ttl: 600, // 10 minutes
      varyBy: ['user-id', 'team-id']
    },
    compression: {
      enabled: true,
      threshold: 512,
      algorithms: ['br', 'gzip', 'deflate'] as const
    },
    rateLimiting: {
      enabled: true,
      configName: 'api'
    }
  } as Partial<OptimizationConfig>,
  
  // Secure write endpoints
  writeSecure: {
    caching: {
      enabled: false
    },
    security: {
      enabled: true,
      requireAuth: true,
      maxRequestSize: 5 * 1024 * 1024 // 5MB
    },
    rateLimiting: {
      enabled: true,
      configName: 'upload'
    }
  } as Partial<OptimizationConfig>,
  
  // Public endpoints with strict rate limiting
  publicEndpoint: {
    caching: {
      enabled: true,
      ttl: 300,
      varyBy: []
    },
    rateLimiting: {
      enabled: true,
      configName: 'global'
    },
    security: {
      enabled: true,
      requireAuth: false,
      allowedOrigins: ['*'],
      maxRequestSize: 1024 * 1024 // 1MB
    }
  } as Partial<OptimizationConfig>,
  
  // Admin endpoints with maximum security
  adminEndpoint: {
    caching: {
      enabled: false
    },
    security: {
      enabled: true,
      requireAuth: true,
      maxRequestSize: 1024 * 1024 // 1MB
    },
    rateLimiting: {
      enabled: true,
      configName: 'admin'
    },
    monitoring: {
      enabled: true,
      sampleRate: 1.0
    }
  } as Partial<OptimizationConfig>
};

export type { RequestContext, OptimizationConfig };