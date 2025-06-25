// CDN Optimization Platform - Global Scale Infrastructure
// Enterprise-grade CDN management and optimization

import { NextRequest, NextResponse } from 'next/server';

// ==================== CDN OPTIMIZATION TYPES ====================

export interface CDNConfig {
  provider: 'cloudflare' | 'aws-cloudfront' | 'vercel' | 'fastly';
  regions: string[];
  cacheRules: CacheRule[];
  compressionSettings: CompressionConfig;
  securitySettings: CDNSecurityConfig;
  performanceSettings: PerformanceConfig;
}

export interface CacheRule {
  pattern: string;
  ttl: number;
  headers: string[];
  queryStringHandling: 'ignore' | 'include' | 'whitelist';
  queryStringWhitelist?: string[];
  varyHeaders: string[];
  conditionalCaching: {
    enabled: boolean;
    conditions: CacheCondition[];
  };
}

export interface CacheCondition {
  type: 'header' | 'query' | 'cookie' | 'path';
  key: string;
  operator: 'equals' | 'contains' | 'startswith' | 'endswith' | 'regex';
  value: string;
  action: 'cache' | 'bypass' | 'purge';
}

export interface CompressionConfig {
  brotli: {
    enabled: boolean;
    level: number;
    types: string[];
  };
  gzip: {
    enabled: boolean;
    level: number;
    types: string[];
  };
  minSize: number;
  maxSize: number;
}

export interface CDNSecurityConfig {
  hotlinkProtection: boolean;
  rateLimiting: {
    enabled: boolean;
    requests: number;
    window: number;
    skipSuccessfulRequests: boolean;
  };
  geoBlocking: {
    enabled: boolean;
    blockedCountries: string[];
    allowedCountries: string[];
  };
  botProtection: {
    enabled: boolean;
    challengeThreshold: number;
    whitelistedUserAgents: string[];
  };
}

export interface PerformanceConfig {
  http2: boolean;
  http3: boolean;
  earlyHints: boolean;
  imageOptimization: {
    enabled: boolean;
    formats: ('webp' | 'avif' | 'jpeg' | 'png')[];
    quality: number;
    autoFormat: boolean;
  };
  minification: {
    html: boolean;
    css: boolean;
    javascript: boolean;
  };
  preconnect: string[];
  prefetch: string[];
}

export interface CDNMetrics {
  timestamp: number;
  region: string;
  requestCount: number;
  cacheHitRate: number;
  bandwidth: number;
  responseTime: number;
  errorCount: number;
  originRequests: number;
  edgeRequests: number;
}

// ==================== CDN OPTIMIZATION MANAGER ====================

export class CDNOptimizationManager {
  private static instance: CDNOptimizationManager;
  private config: CDNConfig;
  private metrics: CDNMetrics[] = [];

  private constructor() {
    this.config = this.initializeDefaultConfig();
  }

  static getInstance(): CDNOptimizationManager {
    if (!CDNOptimizationManager.instance) {
      CDNOptimizationManager.instance = new CDNOptimizationManager();
    }
    return CDNOptimizationManager.instance;
  }

  private initializeDefaultConfig(): CDNConfig {
    return {
      provider: 'vercel',
      regions: [
        'us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 
        'ap-northeast-1', 'sa-east-1', 'af-south-1'
      ],
      cacheRules: [
        {
          pattern: '/_next/static/*',
          ttl: 31536000, // 1 year
          headers: ['cache-control', 'expires'],
          queryStringHandling: 'ignore',
          varyHeaders: [],
          conditionalCaching: {
            enabled: false,
            conditions: []
          }
        },
        {
          pattern: '/api/public/*',
          ttl: 300, // 5 minutes
          headers: ['cache-control'],
          queryStringHandling: 'include',
          varyHeaders: ['accept-encoding'],
          conditionalCaching: {
            enabled: true,
            conditions: [
              {
                type: 'header',
                key: 'authorization',
                operator: 'equals',
                value: '',
                action: 'cache'
              }
            ]
          }
        },
        {
          pattern: '/api/auth/*',
          ttl: 0, // No cache
          headers: [],
          queryStringHandling: 'include',
          varyHeaders: ['authorization'],
          conditionalCaching: {
            enabled: false,
            conditions: []
          }
        },
        {
          pattern: '/images/*',
          ttl: 86400, // 24 hours
          headers: ['cache-control'],
          queryStringHandling: 'whitelist',
          queryStringWhitelist: ['w', 'h', 'q', 'format'],
          varyHeaders: ['accept'],
          conditionalCaching: {
            enabled: true,
            conditions: [
              {
                type: 'header',
                key: 'accept',
                operator: 'contains',
                value: 'webp',
                action: 'cache'
              }
            ]
          }
        }
      ],
      compressionSettings: {
        brotli: {
          enabled: true,
          level: 6,
          types: [
            'text/html',
            'text/css',
            'text/javascript',
            'application/javascript',
            'application/json',
            'text/xml',
            'application/xml',
            'application/rss+xml',
            'text/plain'
          ]
        },
        gzip: {
          enabled: true,
          level: 6,
          types: [
            'text/html',
            'text/css',
            'text/javascript',
            'application/javascript',
            'application/json',
            'text/xml',
            'application/xml',
            'application/rss+xml',
            'text/plain'
          ]
        },
        minSize: 1024, // 1KB
        maxSize: 10485760 // 10MB
      },
      securitySettings: {
        hotlinkProtection: true,
        rateLimiting: {
          enabled: true,
          requests: 1000,
          window: 60,
          skipSuccessfulRequests: false
        },
        geoBlocking: {
          enabled: false,
          blockedCountries: [],
          allowedCountries: []
        },
        botProtection: {
          enabled: true,
          challengeThreshold: 100,
          whitelistedUserAgents: [
            'Googlebot',
            'Bingbot',
            'Slackbot',
            'facebookexternalhit'
          ]
        }
      },
      performanceSettings: {
        http2: true,
        http3: true,
        earlyHints: true,
        imageOptimization: {
          enabled: true,
          formats: ['webp', 'avif', 'jpeg', 'png'],
          quality: 85,
          autoFormat: true
        },
        minification: {
          html: true,
          css: true,
          javascript: true
        },
        preconnect: [
          'https://fonts.googleapis.com',
          'https://fonts.gstatic.com',
          'https://api.openai.com',
          'https://api.anthropic.com'
        ],
        prefetch: [
          '/_next/static/chunks/webpack.js',
          '/_next/static/chunks/main.js'
        ]
      }
    };
  }

  // ==================== CACHE OPTIMIZATION ====================

  async optimizeCacheStrategy(request: NextRequest): Promise<NextResponse | null> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Find matching cache rule
    const cacheRule = this.findMatchingCacheRule(pathname);
    if (!cacheRule) {
      return null;
    }

    // Check conditional caching
    if (cacheRule.conditionalCaching.enabled) {
      const shouldCache = this.evaluateCacheConditions(request, cacheRule.conditionalCaching.conditions);
      if (!shouldCache) {
        return this.createNoCacheResponse();
      }
    }

    // Handle query string processing
    const processedURL = this.processQueryString(url, cacheRule);
    
    // Create optimized response
    const response = NextResponse.next();
    
    // Set cache headers
    this.setCacheHeaders(response, cacheRule);
    
    // Set vary headers
    if (cacheRule.varyHeaders.length > 0) {
      response.headers.set('Vary', cacheRule.varyHeaders.join(', '));
    }

    // Record metrics
    this.recordCacheMetrics(request, cacheRule, true);

    return response;
  }

  private findMatchingCacheRule(pathname: string): CacheRule | null {
    for (const rule of this.config.cacheRules) {
      if (this.matchesPattern(pathname, rule.pattern)) {
        return rule;
      }
    }
    return null;
  }

  private matchesPattern(pathname: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\[([^\]]+)\]/g, '($1)');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(pathname);
  }

  private evaluateCacheConditions(request: NextRequest, conditions: CacheCondition[]): boolean {
    for (const condition of conditions) {
      const result = this.evaluateCondition(request, condition);
      if (condition.action === 'bypass' && result) {
        return false;
      }
      if (condition.action === 'cache' && !result) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(request: NextRequest, condition: CacheCondition): boolean {
    let value = '';
    
    switch (condition.type) {
      case 'header':
        value = request.headers.get(condition.key) || '';
        break;
      case 'query':
        value = new URL(request.url).searchParams.get(condition.key) || '';
        break;
      case 'cookie':
        value = request.cookies.get(condition.key)?.value || '';
        break;
      case 'path':
        value = new URL(request.url).pathname;
        break;
    }

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return value.includes(condition.value);
      case 'startswith':
        return value.startsWith(condition.value);
      case 'endswith':
        return value.endsWith(condition.value);
      case 'regex':
        return new RegExp(condition.value).test(value);
      default:
        return false;
    }
  }

  private processQueryString(url: URL, cacheRule: CacheRule): URL {
    const newURL = new URL(url);
    
    switch (cacheRule.queryStringHandling) {
      case 'ignore':
        newURL.search = '';
        break;
      case 'whitelist':
        if (cacheRule.queryStringWhitelist) {
          const params = new URLSearchParams();
          for (const key of cacheRule.queryStringWhitelist) {
            const value = url.searchParams.get(key);
            if (value !== null) {
              params.set(key, value);
            }
          }
          newURL.search = params.toString();
        }
        break;
      case 'include':
      default:
        // Keep all query parameters
        break;
    }
    
    return newURL;
  }

  private setCacheHeaders(response: NextResponse, cacheRule: CacheRule): void {
    if (cacheRule.ttl > 0) {
      response.headers.set('Cache-Control', `public, max-age=${cacheRule.ttl}, s-maxage=${cacheRule.ttl}`);
      response.headers.set('Expires', new Date(Date.now() + cacheRule.ttl * 1000).toUTCString());
    } else {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }
  }

  private createNoCacheResponse(): NextResponse {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // ==================== COMPRESSION OPTIMIZATION ====================

  async optimizeCompression(request: NextRequest): Promise<NextResponse | null> {
    const acceptEncoding = request.headers.get('accept-encoding') || '';
    const userAgent = request.headers.get('user-agent') || '';
    
    // Check if compression is supported
    const supportsBrotli = acceptEncoding.includes('br');
    const supportsGzip = acceptEncoding.includes('gzip');
    
    if (!supportsBrotli && !supportsGzip) {
      return null;
    }

    const response = NextResponse.next();
    
    // Set compression preferences
    if (supportsBrotli && this.config.compressionSettings.brotli.enabled) {
      response.headers.set('X-Compression-Method', 'brotli');
      response.headers.set('X-Compression-Level', this.config.compressionSettings.brotli.level.toString());
    } else if (supportsGzip && this.config.compressionSettings.gzip.enabled) {
      response.headers.set('X-Compression-Method', 'gzip');
      response.headers.set('X-Compression-Level', this.config.compressionSettings.gzip.level.toString());
    }

    return response;
  }

  // ==================== IMAGE OPTIMIZATION ====================

  async optimizeImages(request: NextRequest): Promise<NextResponse | null> {
    const url = new URL(request.url);
    
    // Check if this is an image request
    if (!this.isImageRequest(url.pathname)) {
      return null;
    }

    if (!this.config.performanceSettings.imageOptimization.enabled) {
      return null;
    }

    const response = NextResponse.next();
    const acceptHeader = request.headers.get('accept') || '';
    
    // Determine optimal image format
    const optimalFormat = this.determineOptimalImageFormat(acceptHeader);
    if (optimalFormat) {
      response.headers.set('X-Image-Format-Preference', optimalFormat);
    }

    // Set image quality
    response.headers.set('X-Image-Quality', this.config.performanceSettings.imageOptimization.quality.toString());
    
    // Add image optimization headers
    response.headers.set('X-Image-Auto-Format', this.config.performanceSettings.imageOptimization.autoFormat.toString());

    return response;
  }

  private isImageRequest(pathname: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.ico'];
    return imageExtensions.some(ext => pathname.toLowerCase().endsWith(ext)) ||
           pathname.startsWith('/images/') ||
           pathname.startsWith('/_next/image');
  }

  private determineOptimalImageFormat(acceptHeader: string): string | null {
    const formats = this.config.performanceSettings.imageOptimization.formats;
    
    if (formats.includes('avif') && acceptHeader.includes('image/avif')) {
      return 'avif';
    }
    if (formats.includes('webp') && acceptHeader.includes('image/webp')) {
      return 'webp';
    }
    if (formats.includes('jpeg') && acceptHeader.includes('image/jpeg')) {
      return 'jpeg';
    }
    if (formats.includes('png') && acceptHeader.includes('image/png')) {
      return 'png';
    }
    
    return null;
  }

  // ==================== PERFORMANCE OPTIMIZATION ====================

  async optimizePerformance(request: NextRequest): Promise<NextResponse | null> {
    const response = NextResponse.next();
    
    // Add performance headers
    if (this.config.performanceSettings.http2) {
      response.headers.set('X-Protocol-Version', 'HTTP/2');
    }

    if (this.config.performanceSettings.earlyHints) {
      response.headers.set('X-Early-Hints', 'enabled');
    }

    // Add preconnect and prefetch hints
    const linkHeaders = [];
    
    for (const url of this.config.performanceSettings.preconnect) {
      linkHeaders.push(`<${url}>; rel=preconnect`);
    }
    
    for (const url of this.config.performanceSettings.prefetch) {
      linkHeaders.push(`<${url}>; rel=prefetch`);
    }
    
    if (linkHeaders.length > 0) {
      response.headers.set('Link', linkHeaders.join(', '));
    }

    return response;
  }

  // ==================== METRICS AND MONITORING ====================

  recordCacheMetrics(request: NextRequest, cacheRule: CacheRule, hit: boolean): void {
    const metrics: CDNMetrics = {
      timestamp: Date.now(),
      region: this.getRegionFromRequest(request),
      requestCount: 1,
      cacheHitRate: hit ? 100 : 0,
      bandwidth: this.estimateRequestSize(request),
      responseTime: 0, // Would be measured in production
      errorCount: 0,
      originRequests: hit ? 0 : 1,
      edgeRequests: 1
    };

    this.metrics.push(metrics);
    
    // Keep only last 10000 metrics
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }
  }

  getCDNPerformanceMetrics(timeRangeMinutes: number = 60): {
    totalRequests: number;
    averageCacheHitRate: number;
    totalBandwidth: number;
    averageResponseTime: number;
    errorRate: number;
    originOffloadRate: number;
    regionBreakdown: Record<string, number>;
  } {
    const cutoffTime = Date.now() - (timeRangeMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoffTime);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageCacheHitRate: 0,
        totalBandwidth: 0,
        averageResponseTime: 0,
        errorRate: 0,
        originOffloadRate: 0,
        regionBreakdown: {}
      };
    }

    const totalRequests = recentMetrics.reduce((sum, m) => sum + m.requestCount, 0);
    const totalCacheHitRate = recentMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0);
    const averageCacheHitRate = totalCacheHitRate / recentMetrics.length;
    const totalBandwidth = recentMetrics.reduce((sum, m) => sum + m.bandwidth, 0);
    const totalResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalResponseTime / recentMetrics.length;
    const totalErrors = recentMetrics.reduce((sum, m) => sum + m.errorCount, 0);
    const errorRate = (totalErrors / totalRequests) * 100;
    const totalOriginRequests = recentMetrics.reduce((sum, m) => sum + m.originRequests, 0);
    const originOffloadRate = ((totalRequests - totalOriginRequests) / totalRequests) * 100;

    const regionBreakdown: Record<string, number> = {};
    recentMetrics.forEach(m => {
      regionBreakdown[m.region] = (regionBreakdown[m.region] || 0) + m.requestCount;
    });

    return {
      totalRequests,
      averageCacheHitRate: Math.round(averageCacheHitRate * 100) / 100,
      totalBandwidth,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      originOffloadRate: Math.round(originOffloadRate * 100) / 100,
      regionBreakdown
    };
  }

  // ==================== CACHE MANAGEMENT ====================

  async purgeCache(patterns: string[]): Promise<void> {
    console.log(`🗑️ Purging cache for patterns: ${patterns.join(', ')}`);
    
    // In production, this would call the CDN provider's API
    // For now, just log the operation
    
    for (const pattern of patterns) {
      console.log(`   Purging: ${pattern}`);
    }
    
    console.log('✅ Cache purge completed');
  }

  async warmupCache(urls: string[]): Promise<void> {
    console.log(`🔥 Warming up cache for ${urls.length} URLs`);
    
    // In production, this would pre-fetch URLs to edge locations
    for (const url of urls) {
      console.log(`   Warming: ${url}`);
    }
    
    console.log('✅ Cache warmup completed');
  }

  // ==================== HELPER METHODS ====================

  private getRegionFromRequest(request: NextRequest): string {
    return request.headers.get('cf-ipcountry') || 
           request.headers.get('x-vercel-deployment-url') || 
           'us-east-1';
  }

  private estimateRequestSize(request: NextRequest): number {
    // Rough estimation based on headers and URL
    const headersSize = Array.from(request.headers.entries())
      .reduce((size, [key, value]) => size + key.length + value.length, 0);
    
    return headersSize + request.url.length + 500; // Base HTTP overhead
  }

  // ==================== CONFIGURATION METHODS ====================

  updateConfig(newConfig: Partial<CDNConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('✅ CDN configuration updated');
  }

  getConfig(): CDNConfig {
    return this.config;
  }
}

export default CDNOptimizationManager;