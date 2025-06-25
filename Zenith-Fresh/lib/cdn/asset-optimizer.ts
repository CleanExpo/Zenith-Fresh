import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { Redis } from 'ioredis';
import { performance } from 'perf_hooks';

interface AssetOptimizationConfig {
  images: {
    formats: ('webp' | 'avif' | 'jpeg' | 'png')[];
    quality: number;
    sizes: number[];
    enableLazyLoading: boolean;
    enableBlurPlaceholder: boolean;
  };
  css: {
    minify: boolean;
    autoprefixer: boolean;
    purgeCss: boolean;
    criticalCss: boolean;
  };
  js: {
    minify: boolean;
    treeshaking: boolean;
    codesplitting: boolean;
    preload: boolean;
  };
  cdn: {
    provider: 'cloudflare' | 'aws' | 'vercel' | 'custom';
    domain: string;
    regions: string[];
    cacheControl: string;
    gzip: boolean;
    brotli: boolean;
  };
}

interface AssetMetrics {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  processingTime: number;
  cacheHit: boolean;
  format: string;
  quality: number;
}

interface CDNStats {
  hitRatio: number;
  bandwidth: number;
  requests: number;
  avgResponseTime: number;
  errorRate: number;
  topAssets: Array<{
    path: string;
    requests: number;
    bandwidth: number;
    hitRatio: number;
  }>;
}

export class AssetOptimizer {
  private redis: Redis;
  private config: AssetOptimizationConfig;
  private metrics: Map<string, AssetMetrics[]> = new Map();

  constructor(redis: Redis, config: AssetOptimizationConfig) {
    this.redis = redis;
    this.config = config;
  }

  /**
   * Optimize image assets with multiple formats and sizes
   */
  async optimizeImage(
    buffer: Buffer,
    options: {
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
      quality?: number;
      width?: number;
      height?: number;
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    } = {}
  ): Promise<{
    optimized: Buffer;
    metadata: sharp.Metadata;
    metrics: AssetMetrics;
    variants: Array<{ format: string; size: number; buffer: Buffer }>;
  }> {
    const startTime = performance.now();
    const originalSize = buffer.length;

    // Get image metadata
    const sharpImage = sharp(buffer);
    const metadata = await sharpImage.metadata();

    // Generate cache key
    const cacheKey = this.generateCacheKey('image', buffer, options);
    
    // Check cache first
    const cached = await this.getCachedAsset(cacheKey);
    if (cached) {
      return {
        optimized: cached.buffer,
        metadata,
        metrics: cached.metrics,
        variants: cached.variants || [],
      };
    }

    // Optimize main image
    const format = options.format || this.getBestImageFormat(metadata);
    const quality = options.quality || this.config.images.quality;

    let optimizedImage = sharpImage;

    // Apply transformations
    if (options.width || options.height) {
      optimizedImage = optimizedImage.resize({
        width: options.width,
        height: options.height,
        fit: options.fit || 'cover',
        withoutEnlargement: true,
      });
    }

    // Apply format and quality
    switch (format) {
      case 'webp':
        optimizedImage = optimizedImage.webp({ quality });
        break;
      case 'avif':
        optimizedImage = optimizedImage.avif({ quality });
        break;
      case 'jpeg':
        optimizedImage = optimizedImage.jpeg({ quality, progressive: true });
        break;
      case 'png':
        optimizedImage = optimizedImage.png({ 
          quality,
          compressionLevel: 9,
          adaptiveFiltering: true,
        });
        break;
    }

    const optimizedBuffer = await optimizedImage.toBuffer();
    const processingTime = performance.now() - startTime;

    // Generate variants for responsive images
    const variants = await this.generateImageVariants(buffer, format, quality);

    const metrics: AssetMetrics = {
      originalSize,
      optimizedSize: optimizedBuffer.length,
      compressionRatio: (1 - optimizedBuffer.length / originalSize) * 100,
      processingTime,
      cacheHit: false,
      format,
      quality,
    };

    // Cache the result
    await this.cacheAsset(cacheKey, {
      buffer: optimizedBuffer,
      metrics,
      variants,
    });

    // Store metrics
    this.storeMetrics('image', metrics);

    return {
      optimized: optimizedBuffer,
      metadata,
      metrics,
      variants,
    };
  }

  /**
   * Generate responsive image variants
   */
  private async generateImageVariants(
    buffer: Buffer,
    format: string,
    quality: number
  ): Promise<Array<{ format: string; size: number; buffer: Buffer }>> {
    const variants: Array<{ format: string; size: number; buffer: Buffer }> = [];
    const sharpImage = sharp(buffer);

    for (const size of this.config.images.sizes) {
      try {
        let variantImage = sharpImage.resize(size, null, {
          withoutEnlargement: true,
          fit: 'inside',
        });

        // Apply format
        switch (format) {
          case 'webp':
            variantImage = variantImage.webp({ quality });
            break;
          case 'avif':
            variantImage = variantImage.avif({ quality });
            break;
          case 'jpeg':
            variantImage = variantImage.jpeg({ quality, progressive: true });
            break;
          case 'png':
            variantImage = variantImage.png({ quality });
            break;
        }

        const variantBuffer = await variantImage.toBuffer();
        variants.push({
          format,
          size,
          buffer: variantBuffer,
        });
      } catch (error) {
        console.error(`Error generating variant for size ${size}:`, error);
      }
    }

    return variants;
  }

  /**
   * Optimize CSS assets
   */
  async optimizeCSS(css: string): Promise<{
    optimized: string;
    metrics: AssetMetrics;
    critical?: string;
  }> {
    const startTime = performance.now();
    const originalSize = Buffer.byteLength(css, 'utf8');

    const cacheKey = this.generateCacheKey('css', css);
    const cached = await this.getCachedAsset(cacheKey);
    if (cached) {
      return {
        optimized: cached.content,
        metrics: cached.metrics,
        critical: cached.critical,
      };
    }

    let optimized = css;

    // Minify CSS
    if (this.config.css.minify) {
      optimized = await this.minifyCSS(optimized);
    }

    // Autoprefixer
    if (this.config.css.autoprefixer) {
      optimized = await this.addVendorPrefixes(optimized);
    }

    // PurgeCSS (remove unused styles)
    if (this.config.css.purgeCss) {
      optimized = await this.purgeUnusedCSS(optimized);
    }

    // Extract critical CSS
    let critical: string | undefined;
    if (this.config.css.criticalCss) {
      critical = await this.extractCriticalCSS(optimized);
    }

    const optimizedSize = Buffer.byteLength(optimized, 'utf8');
    const processingTime = performance.now() - startTime;

    const metrics: AssetMetrics = {
      originalSize,
      optimizedSize,
      compressionRatio: (1 - optimizedSize / originalSize) * 100,
      processingTime,
      cacheHit: false,
      format: 'css',
      quality: 100,
    };

    // Cache the result
    await this.cacheAsset(cacheKey, {
      content: optimized,
      metrics,
      critical,
    });

    this.storeMetrics('css', metrics);

    return {
      optimized,
      metrics,
      critical,
    };
  }

  /**
   * Optimize JavaScript assets
   */
  async optimizeJS(js: string): Promise<{
    optimized: string;
    metrics: AssetMetrics;
    chunks?: string[];
  }> {
    const startTime = performance.now();
    const originalSize = Buffer.byteLength(js, 'utf8');

    const cacheKey = this.generateCacheKey('js', js);
    const cached = await this.getCachedAsset(cacheKey);
    if (cached) {
      return {
        optimized: cached.content,
        metrics: cached.metrics,
        chunks: cached.chunks,
      };
    }

    let optimized = js;

    // Minify JavaScript
    if (this.config.js.minify) {
      optimized = await this.minifyJS(optimized);
    }

    // Tree shaking (remove unused code)
    if (this.config.js.treeshaking) {
      optimized = await this.removeUnusedCode(optimized);
    }

    // Code splitting
    let chunks: string[] | undefined;
    if (this.config.js.codesplitting) {
      const splitResult = await this.splitCode(optimized);
      optimized = splitResult.main;
      chunks = splitResult.chunks;
    }

    const optimizedSize = Buffer.byteLength(optimized, 'utf8');
    const processingTime = performance.now() - startTime;

    const metrics: AssetMetrics = {
      originalSize,
      optimizedSize,
      compressionRatio: (1 - optimizedSize / originalSize) * 100,
      processingTime,
      cacheHit: false,
      format: 'js',
      quality: 100,
    };

    // Cache the result
    await this.cacheAsset(cacheKey, {
      content: optimized,
      metrics,
      chunks,
    });

    this.storeMetrics('js', metrics);

    return {
      optimized,
      metrics,
      chunks,
    };
  }

  /**
   * Get best image format based on browser support and image characteristics
   */
  private getBestImageFormat(metadata: sharp.Metadata): 'webp' | 'avif' | 'jpeg' | 'png' {
    // AVIF for better compression (if supported)
    if (this.config.images.formats.includes('avif')) {
      return 'avif';
    }

    // WebP for good compression and wide support
    if (this.config.images.formats.includes('webp')) {
      return 'webp';
    }

    // Keep original format if it's already optimized
    if (metadata.format === 'png' && metadata.channels === 4) {
      return 'png'; // Preserve transparency
    }

    return 'jpeg'; // Default fallback
  }

  /**
   * Generate cache key for assets
   */
  private generateCacheKey(type: string, content: string | Buffer, options?: any): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    
    if (Buffer.isBuffer(content)) {
      hash.update(content);
    } else {
      hash.update(content, 'utf8');
    }
    
    if (options) {
      hash.update(JSON.stringify(options));
    }
    
    return `asset:${type}:${hash.digest('hex').substring(0, 16)}`;
  }

  /**
   * Cache optimized asset
   */
  private async cacheAsset(key: string, data: any): Promise<void> {
    try {
      // Cache for 24 hours
      await this.redis.setex(key, 24 * 3600, JSON.stringify({
        ...data,
        buffer: data.buffer ? data.buffer.toString('base64') : undefined,
      }));
    } catch (error) {
      console.error('Error caching asset:', error);
    }
  }

  /**
   * Get cached asset
   */
  private async getCachedAsset(key: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.buffer) {
          data.buffer = Buffer.from(data.buffer, 'base64');
        }
        data.metrics.cacheHit = true;
        return data;
      }
    } catch (error) {
      console.error('Error getting cached asset:', error);
    }
    return null;
  }

  /**
   * Store optimization metrics
   */
  private storeMetrics(type: string, metrics: AssetMetrics): void {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    
    const typeMetrics = this.metrics.get(type)!;
    typeMetrics.push(metrics);
    
    // Keep only last 1000 metrics
    if (typeMetrics.length > 1000) {
      typeMetrics.splice(0, typeMetrics.length - 1000);
    }
  }

  /**
   * CSS optimization helpers
   */
  private async minifyCSS(css: string): Promise<string> {
    // Simple CSS minification
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
      .replace(/\s*{\s*/g, '{') // Clean braces
      .replace(/;\s*/g, ';') // Clean semicolons
      .trim();
  }

  private async addVendorPrefixes(css: string): Promise<string> {
    // Simplified autoprefixer implementation
    const prefixes: Record<string, string[]> = {
      'transform': ['-webkit-transform', '-moz-transform', '-ms-transform'],
      'transition': ['-webkit-transition', '-moz-transition', '-ms-transition'],
      'border-radius': ['-webkit-border-radius', '-moz-border-radius'],
      'box-shadow': ['-webkit-box-shadow', '-moz-box-shadow'],
      'user-select': ['-webkit-user-select', '-moz-user-select', '-ms-user-select'],
    };

    let prefixed = css;
    for (const [property, vendors] of Object.entries(prefixes)) {
      const regex = new RegExp(`(^|[^-])${property}\\s*:`, 'gm');
      prefixed = prefixed.replace(regex, (match, prefix) => {
        const vendorDeclarations = vendors.map(vendor => 
          match.replace(property, vendor)
        ).join('\n');
        return `${prefix}${vendorDeclarations}\n${match}`;
      });
    }

    return prefixed;
  }

  private async purgeUnusedCSS(css: string): Promise<string> {
    // Simplified CSS purging - in production, use PurgeCSS
    // This is a basic implementation that removes unused utility classes
    const usedClasses = this.extractUsedClasses();
    const lines = css.split('\n');
    
    return lines.filter(line => {
      const classMatch = line.match(/\.([a-zA-Z0-9_-]+)/);
      if (classMatch) {
        return usedClasses.has(classMatch[1]);
      }
      return true; // Keep non-class rules
    }).join('\n');
  }

  private async extractCriticalCSS(css: string): Promise<string> {
    // Extract critical CSS (above-the-fold styles)
    // This is a simplified implementation
    const criticalSelectors = [
      'body', 'html', 'h1', 'h2', 'h3', 'header', 'nav', 'main',
      '.container', '.wrapper', '.header', '.navbar', '.hero'
    ];

    const lines = css.split('\n');
    const critical: string[] = [];
    let inCriticalRule = false;
    let braceCount = 0;

    for (const line of lines) {
      if (criticalSelectors.some(selector => line.includes(selector))) {
        inCriticalRule = true;
      }

      if (inCriticalRule) {
        critical.push(line);
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
        
        if (braceCount === 0) {
          inCriticalRule = false;
        }
      }
    }

    return critical.join('\n');
  }

  /**
   * JavaScript optimization helpers
   */
  private async minifyJS(js: string): Promise<string> {
    // Simple JS minification - in production, use terser or similar
    return js
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/\/\/.*$/gm, '') // Remove single-line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Clean up syntax
      .trim();
  }

  private async removeUnusedCode(js: string): Promise<string> {
    // Simplified tree shaking
    // In production, use webpack tree shaking or rollup
    const usedFunctions = this.extractUsedFunctions(js);
    const lines = js.split('\n');
    
    return lines.filter(line => {
      const functionMatch = line.match(/function\s+(\w+)/);
      if (functionMatch) {
        return usedFunctions.has(functionMatch[1]);
      }
      return true;
    }).join('\n');
  }

  private async splitCode(js: string): Promise<{ main: string; chunks: string[] }> {
    // Simple code splitting implementation
    const chunks: string[] = [];
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*{[^}]*}/g;
    const functions = js.match(functionRegex) || [];
    
    // Move large functions to separate chunks
    const largeFunctions = functions.filter(fn => fn.length > 1000);
    
    let main = js;
    largeFunctions.forEach((fn, index) => {
      chunks.push(fn);
      main = main.replace(fn, `// Function moved to chunk ${index}`);
    });

    return { main, chunks };
  }

  /**
   * Helper methods
   */
  private extractUsedClasses(): Set<string> {
    // In a real implementation, this would scan HTML/JSX files
    // For now, return common utility classes
    return new Set([
      'container', 'row', 'col', 'btn', 'card', 'header', 'footer',
      'navbar', 'sidebar', 'content', 'main', 'wrapper', 'flex',
      'grid', 'text-center', 'text-left', 'text-right', 'hidden',
      'visible', 'block', 'inline', 'relative', 'absolute', 'fixed'
    ]);
  }

  private extractUsedFunctions(js: string): Set<string> {
    const used = new Set<string>();
    const callRegex = /(\w+)\s*\(/g;
    let match;
    
    while ((match = callRegex.exec(js)) !== null) {
      used.add(match[1]);
    }
    
    return used;
  }

  /**
   * Generate performance report
   */
  getOptimizationMetrics(): {
    byType: Record<string, {
      totalProcessed: number;
      averageCompressionRatio: number;
      averageProcessingTime: number;
      cacheHitRate: number;
      totalSavings: number;
    }>;
    overall: {
      totalAssets: number;
      totalOriginalSize: number;
      totalOptimizedSize: number;
      overallCompressionRatio: number;
      totalProcessingTime: number;
    };
  } {
    const byType: Record<string, any> = {};
    let totalAssets = 0;
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    let totalProcessingTime = 0;

    for (const [type, metrics] of this.metrics.entries()) {
      const cacheHits = metrics.filter(m => m.cacheHit).length;
      const totalSavings = metrics.reduce((sum, m) => sum + (m.originalSize - m.optimizedSize), 0);
      
      byType[type] = {
        totalProcessed: metrics.length,
        averageCompressionRatio: metrics.reduce((sum, m) => sum + m.compressionRatio, 0) / metrics.length,
        averageProcessingTime: metrics.reduce((sum, m) => sum + m.processingTime, 0) / metrics.length,
        cacheHitRate: (cacheHits / metrics.length) * 100,
        totalSavings,
      };

      totalAssets += metrics.length;
      totalOriginalSize += metrics.reduce((sum, m) => sum + m.originalSize, 0);
      totalOptimizedSize += metrics.reduce((sum, m) => sum + m.optimizedSize, 0);
      totalProcessingTime += metrics.reduce((sum, m) => sum + m.processingTime, 0);
    }

    return {
      byType,
      overall: {
        totalAssets,
        totalOriginalSize,
        totalOptimizedSize,
        overallCompressionRatio: totalOriginalSize > 0 ? 
          (1 - totalOptimizedSize / totalOriginalSize) * 100 : 0,
        totalProcessingTime,
      },
    };
  }

  /**
   * Clear optimization cache
   */
  async clearCache(): Promise<void> {
    const pattern = 'asset:*';
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    totalSize: number;
    hitRate: number;
  }> {
    const keys = await this.redis.keys('asset:*');
    let totalSize = 0;
    let totalHits = 0;
    let totalRequests = 0;

    for (const type of this.metrics.keys()) {
      const metrics = this.metrics.get(type)!;
      totalRequests += metrics.length;
      totalHits += metrics.filter(m => m.cacheHit).length;
    }

    // Estimate total cache size
    if (keys.length > 0) {
      const sampleKeys = keys.slice(0, Math.min(100, keys.length));
      for (const key of sampleKeys) {
        const data = await this.redis.get(key);
        if (data) {
          totalSize += Buffer.byteLength(data, 'utf8');
        }
      }
      totalSize = Math.round((totalSize / sampleKeys.length) * keys.length);
    }

    return {
      totalKeys: keys.length,
      totalSize,
      hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
    };
  }
}

/**
 * CDN Integration
 */
export class CDNManager {
  private config: AssetOptimizationConfig['cdn'];
  private redis: Redis;

  constructor(config: AssetOptimizationConfig['cdn'], redis: Redis) {
    this.config = config;
    this.redis = redis;
  }

  /**
   * Upload asset to CDN
   */
  async uploadAsset(
    path: string,
    content: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<{ url: string; success: boolean; error?: string }> {
    try {
      switch (this.config.provider) {
        case 'cloudflare':
          return await this.uploadToCloudflare(path, content, contentType, metadata);
        case 'aws':
          return await this.uploadToAWS(path, content, contentType, metadata);
        case 'vercel':
          return await this.uploadToVercel(path, content, contentType, metadata);
        default:
          return await this.uploadToCustomCDN(path, content, contentType, metadata);
      }
    } catch (error) {
      return {
        url: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get CDN statistics
   */
  async getCDNStats(): Promise<CDNStats> {
    // This would integrate with your CDN provider's API
    // For now, return mock data
    return {
      hitRatio: 95.5,
      bandwidth: 1024 * 1024 * 1024, // 1GB
      requests: 100000,
      avgResponseTime: 50,
      errorRate: 0.1,
      topAssets: [
        { path: '/images/hero.webp', requests: 5000, bandwidth: 50 * 1024 * 1024, hitRatio: 98 },
        { path: '/css/main.css', requests: 8000, bandwidth: 2 * 1024 * 1024, hitRatio: 99 },
        { path: '/js/app.js', requests: 7500, bandwidth: 10 * 1024 * 1024, hitRatio: 97 },
      ],
    };
  }

  /**
   * Purge CDN cache
   */
  async purgeCache(paths?: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      switch (this.config.provider) {
        case 'cloudflare':
          return await this.purgeCloudflareCache(paths);
        case 'aws':
          return await this.purgeAWSCache(paths);
        case 'vercel':
          return await this.purgeVercelCache(paths);
        default:
          return await this.purgeCustomCDNCache(paths);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * CDN provider implementations
   */
  private async uploadToCloudflare(
    path: string,
    content: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<{ url: string; success: boolean; error?: string }> {
    // Cloudflare implementation would go here
    const url = `https://${this.config.domain}${path}`;
    return { url, success: true };
  }

  private async uploadToAWS(
    path: string,
    content: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<{ url: string; success: boolean; error?: string }> {
    // AWS S3/CloudFront implementation would go here
    const url = `https://${this.config.domain}${path}`;
    return { url, success: true };
  }

  private async uploadToVercel(
    path: string,
    content: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<{ url: string; success: boolean; error?: string }> {
    // Vercel Edge Network implementation would go here
    const url = `https://${this.config.domain}${path}`;
    return { url, success: true };
  }

  private async uploadToCustomCDN(
    path: string,
    content: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<{ url: string; success: boolean; error?: string }> {
    // Custom CDN implementation would go here
    const url = `https://${this.config.domain}${path}`;
    return { url, success: true };
  }

  private async purgeCloudflareCache(paths?: string[]): Promise<{ success: boolean; error?: string }> {
    // Cloudflare cache purge implementation
    return { success: true };
  }

  private async purgeAWSCache(paths?: string[]): Promise<{ success: boolean; error?: string }> {
    // AWS CloudFront cache purge implementation
    return { success: true };
  }

  private async purgeVercelCache(paths?: string[]): Promise<{ success: boolean; error?: string }> {
    // Vercel cache purge implementation
    return { success: true };
  }

  private async purgeCustomCDNCache(paths?: string[]): Promise<{ success: boolean; error?: string }> {
    // Custom CDN cache purge implementation
    return { success: true };
  }
}

// Export factory functions
export function createAssetOptimizer(redis: Redis, config: AssetOptimizationConfig): AssetOptimizer {
  return new AssetOptimizer(redis, config);
}

export function createCDNManager(config: AssetOptimizationConfig['cdn'], redis: Redis): CDNManager {
  return new CDNManager(config, redis);
}

// Default configuration
export const defaultAssetOptimizationConfig: AssetOptimizationConfig = {
  images: {
    formats: ['avif', 'webp', 'jpeg'],
    quality: 85,
    sizes: [320, 640, 768, 1024, 1200, 1920],
    enableLazyLoading: true,
    enableBlurPlaceholder: true,
  },
  css: {
    minify: true,
    autoprefixer: true,
    purgeCss: true,
    criticalCss: true,
  },
  js: {
    minify: true,
    treeshaking: true,
    codesplitting: true,
    preload: true,
  },
  cdn: {
    provider: 'vercel',
    domain: process.env.CDN_DOMAIN || 'cdn.zenith.engineer',
    regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
    cacheControl: 'public, max-age=31536000, immutable',
    gzip: true,
    brotli: true,
  },
};