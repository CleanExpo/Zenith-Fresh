// Edge Computing Platform - Global Scale Infrastructure
// Enterprise-grade edge functions for worldwide performance

import { NextRequest, NextResponse } from 'next/server';

// ==================== EDGE FUNCTION TYPES ====================

export interface EdgeFunctionConfig {
  name: string;
  regions: string[];
  runtime: 'nodejs18.x' | 'nodejs20.x';
  memory: 128 | 256 | 512 | 1024;
  timeout: number;
  environment: Record<string, string>;
  caching: {
    enabled: boolean;
    ttl: number;
    headers: string[];
  };
}

export interface EdgeMetrics {
  requestId: string;
  region: string;
  executionTime: number;
  memoryUsed: number;
  coldStart: boolean;
  cacheHit: boolean;
  responseSize: number;
  statusCode: number;
  timestamp: number;
}

export interface GeoLocationData {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  asn: number;
}

// ==================== EDGE FUNCTION REGISTRY ====================

export class EdgeFunctionRegistry {
  private static instance: EdgeFunctionRegistry;
  private functions: Map<string, EdgeFunctionConfig> = new Map();
  private metrics: EdgeMetrics[] = [];

  private constructor() {}

  static getInstance(): EdgeFunctionRegistry {
    if (!EdgeFunctionRegistry.instance) {
      EdgeFunctionRegistry.instance = new EdgeFunctionRegistry();
    }
    return EdgeFunctionRegistry.instance;
  }

  registerFunction(config: EdgeFunctionConfig): void {
    this.functions.set(config.name, config);
    console.log(`✅ Edge function registered: ${config.name} in ${config.regions.length} regions`);
  }

  getFunction(name: string): EdgeFunctionConfig | undefined {
    return this.functions.get(name);
  }

  getAllFunctions(): EdgeFunctionConfig[] {
    return Array.from(this.functions.values());
  }

  recordMetrics(metrics: EdgeMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only last 10000 metrics to prevent memory issues
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }
  }

  getMetrics(functionName?: string): EdgeMetrics[] {
    if (!functionName) return this.metrics;
    return this.metrics.filter(m => m.requestId.includes(functionName));
  }
}

// ==================== GLOBAL EDGE FUNCTIONS ====================

export class GlobalEdgeFunctions {
  private registry: EdgeFunctionRegistry;
  
  constructor() {
    this.registry = EdgeFunctionRegistry.getInstance();
    this.initializeEdgeFunctions();
  }

  private initializeEdgeFunctions(): void {
    // Authentication edge function
    this.registry.registerFunction({
      name: 'auth-validator',
      regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'],
      runtime: 'nodejs20.x',
      memory: 256,
      timeout: 10,
      environment: {
        JWT_SECRET: process.env.NEXTAUTH_SECRET || '',
        DATABASE_URL: process.env.DATABASE_URL || ''
      },
      caching: {
        enabled: true,
        ttl: 300, // 5 minutes
        headers: ['authorization', 'user-agent']
      }
    });

    // Rate limiting edge function
    this.registry.registerFunction({
      name: 'rate-limiter',
      regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'],
      runtime: 'nodejs20.x',
      memory: 128,
      timeout: 5,
      environment: {
        REDIS_URL: process.env.REDIS_URL || ''
      },
      caching: {
        enabled: false,
        ttl: 0,
        headers: []
      }
    });

    // Geo-routing edge function
    this.registry.registerFunction({
      name: 'geo-router',
      regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'],
      runtime: 'nodejs20.x',
      memory: 128,
      timeout: 3,
      environment: {},
      caching: {
        enabled: true,
        ttl: 3600, // 1 hour
        headers: ['cf-ipcountry', 'x-forwarded-for']
      }
    });

    // Security headers edge function
    this.registry.registerFunction({
      name: 'security-headers',
      regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'],
      runtime: 'nodejs20.x',
      memory: 128,
      timeout: 2,
      environment: {},
      caching: {
        enabled: true,
        ttl: 86400, // 24 hours
        headers: []
      }
    });

    // Content optimization edge function
    this.registry.registerFunction({
      name: 'content-optimizer',
      regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'],
      runtime: 'nodejs20.x',
      memory: 512,
      timeout: 15,
      environment: {},
      caching: {
        enabled: true,
        ttl: 1800, // 30 minutes
        headers: ['accept-encoding', 'accept']
      }
    });

    console.log(`🌍 Edge functions initialized: ${this.registry.getAllFunctions().length} functions`);
  }

  // ==================== AUTHENTICATION EDGE FUNCTION ====================

  async handleAuthentication(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();
    const region = this.getRegionFromRequest(request);
    
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return this.createUnauthorizedResponse(request, startTime, region);
      }

      const token = authHeader.replace('Bearer ', '');
      const isValid = await this.validateJWT(token);
      
      if (!isValid) {
        return this.createUnauthorizedResponse(request, startTime, region);
      }

      // Record metrics
      this.recordFunctionMetrics('auth-validator', request, startTime, region, 200, false);

      return NextResponse.next();

    } catch (error) {
      console.error('Authentication edge function error:', error);
      return this.createErrorResponse(request, startTime, region, 500);
    }
  }

  // ==================== RATE LIMITING EDGE FUNCTION ====================

  async handleRateLimiting(request: NextRequest): Promise<NextResponse | null> {
    const startTime = Date.now();
    const region = this.getRegionFromRequest(request);
    const clientIP = this.getClientIP(request);
    
    try {
      const rateLimitKey = `rate_limit:${clientIP}`;
      const currentRequests = await this.getRateLimitCount(rateLimitKey);
      
      // Default rate limit: 1000 requests per minute
      const rateLimit = 1000;
      const windowSize = 60; // seconds
      
      if (currentRequests >= rateLimit) {
        this.recordFunctionMetrics('rate-limiter', request, startTime, region, 429, false);
        
        return new NextResponse('Rate limit exceeded', {
          status: 429,
          headers: {
            'Retry-After': windowSize.toString(),
            'X-RateLimit-Limit': rateLimit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Math.floor(Date.now() / 1000) + windowSize).toString()
          }
        });
      }

      // Increment rate limit counter
      await this.incrementRateLimitCount(rateLimitKey, windowSize);
      
      this.recordFunctionMetrics('rate-limiter', request, startTime, region, 200, false);
      return null; // Continue processing

    } catch (error) {
      console.error('Rate limiting edge function error:', error);
      return null; // Continue processing on error
    }
  }

  // ==================== GEO-ROUTING EDGE FUNCTION ====================

  async handleGeoRouting(request: NextRequest): Promise<NextResponse | null> {
    const startTime = Date.now();
    const region = this.getRegionFromRequest(request);
    const geoData = this.getGeoLocationData(request);
    
    try {
      // Determine optimal backend region based on user location
      const optimalRegion = this.determineOptimalRegion(geoData);
      
      // Add region headers for backend processing
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('X-User-Region', geoData.region);
      requestHeaders.set('X-User-Country', geoData.country);
      requestHeaders.set('X-Optimal-Backend', optimalRegion);
      requestHeaders.set('X-User-Timezone', geoData.timezone);
      
      this.recordFunctionMetrics('geo-router', request, startTime, region, 200, true);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders
        }
      });

    } catch (error) {
      console.error('Geo-routing edge function error:', error);
      return null; // Continue processing on error
    }
  }

  // ==================== SECURITY HEADERS EDGE FUNCTION ====================

  async handleSecurityHeaders(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();
    const region = this.getRegionFromRequest(request);
    
    try {
      const response = NextResponse.next();
      
      // Add comprehensive security headers
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      
      // Content Security Policy
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.openai.com https://api.anthropic.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ');
      
      response.headers.set('Content-Security-Policy', csp);
      
      // Strict Transport Security (only for HTTPS)
      if (request.url.startsWith('https://')) {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      }
      
      this.recordFunctionMetrics('security-headers', request, startTime, region, 200, true);
      
      return response;

    } catch (error) {
      console.error('Security headers edge function error:', error);
      return NextResponse.next();
    }
  }

  // ==================== CONTENT OPTIMIZATION EDGE FUNCTION ====================

  async handleContentOptimization(request: NextRequest): Promise<NextResponse | null> {
    const startTime = Date.now();
    const region = this.getRegionFromRequest(request);
    const url = new URL(request.url);
    
    try {
      // Skip optimization for API routes
      if (url.pathname.startsWith('/api/')) {
        return null;
      }

      // Check if content can be optimized
      const acceptEncoding = request.headers.get('accept-encoding') || '';
      const userAgent = request.headers.get('user-agent') || '';
      
      // Determine optimal content format
      const supportsWebP = request.headers.get('accept')?.includes('image/webp');
      const supportsBrotli = acceptEncoding.includes('br');
      const supportsGzip = acceptEncoding.includes('gzip');
      
      // Add optimization headers
      const response = NextResponse.next();
      
      if (supportsWebP) {
        response.headers.set('X-Content-Optimization', 'webp-enabled');
      }
      
      if (supportsBrotli) {
        response.headers.set('X-Compression-Preference', 'brotli');
      } else if (supportsGzip) {
        response.headers.set('X-Compression-Preference', 'gzip');
      }
      
      // Add device detection headers
      const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
      response.headers.set('X-Device-Type', isMobile ? 'mobile' : 'desktop');
      
      this.recordFunctionMetrics('content-optimizer', request, startTime, region, 200, true);
      
      return response;

    } catch (error) {
      console.error('Content optimization edge function error:', error);
      return null;
    }
  }

  // ==================== HELPER METHODS ====================

  private getRegionFromRequest(request: NextRequest): string {
    // Try to get region from Vercel Edge Runtime
    const region = request.headers.get('x-vercel-deployment-url') || 
                  request.headers.get('cf-ipcountry') ||
                  'us-east-1';
    return region;
  }

  private getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           request.ip ||
           'unknown';
  }

  private getGeoLocationData(request: NextRequest): GeoLocationData {
    return {
      country: request.headers.get('cf-ipcountry') || 'US',
      region: request.headers.get('cf-region') || 'US-East',
      city: request.headers.get('cf-city') || 'Unknown',
      latitude: parseFloat(request.headers.get('cf-latitude') || '0'),
      longitude: parseFloat(request.headers.get('cf-longitude') || '0'),
      timezone: request.headers.get('cf-timezone') || 'UTC',
      isp: request.headers.get('cf-isp') || 'Unknown',
      asn: parseInt(request.headers.get('cf-asn') || '0')
    };
  }

  private determineOptimalRegion(geoData: GeoLocationData): string {
    // Region mapping based on geographic proximity
    const regionMap: Record<string, string> = {
      'US': 'us-east-1',
      'CA': 'us-east-1',
      'MX': 'us-west-2',
      'BR': 'us-east-1',
      'GB': 'eu-west-1',
      'DE': 'eu-west-1',
      'FR': 'eu-west-1',
      'IT': 'eu-west-1',
      'ES': 'eu-west-1',
      'NL': 'eu-west-1',
      'SG': 'ap-southeast-1',
      'MY': 'ap-southeast-1',
      'TH': 'ap-southeast-1',
      'ID': 'ap-southeast-1',
      'JP': 'ap-northeast-1',
      'KR': 'ap-northeast-1',
      'CN': 'ap-northeast-1',
      'AU': 'ap-southeast-1',
      'IN': 'ap-southeast-1'
    };

    return regionMap[geoData.country] || 'us-east-1';
  }

  private async validateJWT(token: string): Promise<boolean> {
    try {
      // Simple JWT validation - in production, use proper JWT library
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Decode payload
      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  private async getRateLimitCount(key: string): Promise<number> {
    // In production, use Redis or similar
    // For now, use in-memory storage (not suitable for production)
    const storage = (globalThis as any).rateLimitStorage || new Map();
    const data = storage.get(key);
    
    if (!data) return 0;
    
    // Check if window has expired
    if (Date.now() - data.timestamp > 60000) {
      storage.delete(key);
      return 0;
    }
    
    return data.count;
  }

  private async incrementRateLimitCount(key: string, windowSize: number): Promise<void> {
    const storage = (globalThis as any).rateLimitStorage || new Map();
    (globalThis as any).rateLimitStorage = storage;
    
    const data = storage.get(key) || { count: 0, timestamp: Date.now() };
    
    // Reset if window expired
    if (Date.now() - data.timestamp > windowSize * 1000) {
      data.count = 1;
      data.timestamp = Date.now();
    } else {
      data.count++;
    }
    
    storage.set(key, data);
  }

  private createUnauthorizedResponse(request: NextRequest, startTime: number, region: string): NextResponse {
    this.recordFunctionMetrics('auth-validator', request, startTime, region, 401, false);
    
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Bearer realm="api"'
      }
    });
  }

  private createErrorResponse(request: NextRequest, startTime: number, region: string, status: number): NextResponse {
    this.recordFunctionMetrics('auth-validator', request, startTime, region, status, false);
    
    return new NextResponse('Internal Server Error', {
      status
    });
  }

  private recordFunctionMetrics(
    functionName: string,
    request: NextRequest,
    startTime: number,
    region: string,
    statusCode: number,
    cacheHit: boolean
  ): void {
    const metrics: EdgeMetrics = {
      requestId: `${functionName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      region,
      executionTime: Date.now() - startTime,
      memoryUsed: 0, // Would be populated by runtime
      coldStart: false, // Would be determined by runtime
      cacheHit,
      responseSize: 0, // Would be measured
      statusCode,
      timestamp: Date.now()
    };

    this.registry.recordMetrics(metrics);
  }
}

// ==================== EDGE FUNCTION METRICS ====================

export class EdgeFunctionMetrics {
  private registry: EdgeFunctionRegistry;

  constructor() {
    this.registry = EdgeFunctionRegistry.getInstance();
  }

  getPerformanceMetrics(timeRangeMinutes: number = 60): {
    averageExecutionTime: number;
    totalRequests: number;
    errorRate: number;
    cacheHitRate: number;
    regionBreakdown: Record<string, number>;
  } {
    const cutoffTime = Date.now() - (timeRangeMinutes * 60 * 1000);
    const recentMetrics = this.registry.getMetrics().filter(m => m.timestamp > cutoffTime);

    if (recentMetrics.length === 0) {
      return {
        averageExecutionTime: 0,
        totalRequests: 0,
        errorRate: 0,
        cacheHitRate: 0,
        regionBreakdown: {}
      };
    }

    const averageExecutionTime = recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) / recentMetrics.length;
    const totalRequests = recentMetrics.length;
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = (cacheHits / totalRequests) * 100;

    const regionBreakdown: Record<string, number> = {};
    recentMetrics.forEach(m => {
      regionBreakdown[m.region] = (regionBreakdown[m.region] || 0) + 1;
    });

    return {
      averageExecutionTime: Math.round(averageExecutionTime * 100) / 100,
      totalRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      regionBreakdown
    };
  }

  getColdStartMetrics(): {
    coldStartRate: number;
    averageColdStartTime: number;
    coldStartsByRegion: Record<string, number>;
  } {
    const allMetrics = this.registry.getMetrics();
    const coldStarts = allMetrics.filter(m => m.coldStart);

    if (coldStarts.length === 0) {
      return {
        coldStartRate: 0,
        averageColdStartTime: 0,
        coldStartsByRegion: {}
      };
    }

    const coldStartRate = (coldStarts.length / allMetrics.length) * 100;
    const averageColdStartTime = coldStarts.reduce((sum, m) => sum + m.executionTime, 0) / coldStarts.length;

    const coldStartsByRegion: Record<string, number> = {};
    coldStarts.forEach(m => {
      coldStartsByRegion[m.region] = (coldStartsByRegion[m.region] || 0) + 1;
    });

    return {
      coldStartRate: Math.round(coldStartRate * 100) / 100,
      averageColdStartTime: Math.round(averageColdStartTime * 100) / 100,
      coldStartsByRegion
    };
  }
}

export default GlobalEdgeFunctions;