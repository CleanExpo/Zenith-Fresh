/**
 * WebFetch - Intelligent web content fetching utility
 * 
 * Provides web scraping capabilities with rate limiting, caching, and error handling.
 */

import { redis } from '@/lib/redis';

interface FetchOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cacheKey?: string;
  cacheTTL?: number;
}

interface FetchResult {
  content: string;
  status: number;
  headers: Record<string, string>;
  url: string;
  cached: boolean;
}

export class WebFetch {
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly DEFAULT_RETRIES = 3;
  private readonly DEFAULT_CACHE_TTL = 3600; // 1 hour
  private readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  ];

  /**
   * Fetch web content with intelligent caching and error handling
   */
  async fetch(url: string, options: FetchOptions = {}): Promise<string> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.DEFAULT_TIMEOUT,
      retries = this.DEFAULT_RETRIES,
      cacheKey,
      cacheTTL = this.DEFAULT_CACHE_TTL
    } = options;

    // Check cache first
    if (cacheKey && redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return cached;
        }
      } catch (error) {
        console.error('Cache retrieval error:', error);
      }
    }

    // Prepare headers with random user agent
    const fetchHeaders = {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      ...headers
    };

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: fetchHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const content = await response.text();

        // Cache successful response
        if (cacheKey && redis) {
          try {
            await redis.setex(cacheKey, cacheTTL, content);
          } catch (error) {
            console.error('Cache storage error:', error);
          }
        }

        return content;
      } catch (error) {
        lastError = error as Error;
        console.error(`Fetch attempt ${attempt}/${retries} failed for ${url}:`, error);

        if (attempt < retries) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw new Error(`Failed to fetch ${url} after ${retries} attempts: ${lastError?.message}`);
  }

  /**
   * Fetch with full result including headers and status
   */
  async fetchWithMetadata(url: string, options: FetchOptions = {}): Promise<FetchResult> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.DEFAULT_TIMEOUT,
      cacheKey,
      cacheTTL = this.DEFAULT_CACHE_TTL
    } = options;

    // Check cache
    if (cacheKey && redis) {
      try {
        const cached = await redis.get(`${cacheKey}:full`);
        if (cached) {
          return { ...JSON.parse(cached), cached: true };
        }
      } catch (error) {
        console.error('Cache retrieval error:', error);
      }
    }

    const fetchHeaders = {
      'User-Agent': this.getRandomUserAgent(),
      ...headers
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: fetchHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const content = await response.text();
      const responseHeaders: Record<string, string> = {};
      
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const result: FetchResult = {
        content,
        status: response.status,
        headers: responseHeaders,
        url: response.url,
        cached: false
      };

      // Cache successful response
      if (response.ok && cacheKey && redis) {
        try {
          await redis.setex(`${cacheKey}:full`, cacheTTL, JSON.stringify(result));
        } catch (error) {
          console.error('Cache storage error:', error);
        }
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Batch fetch multiple URLs with concurrency control
   */
  async fetchBatch(
    urls: string[], 
    options: FetchOptions = {}, 
    concurrency: number = 5
  ): Promise<Map<string, string | Error>> {
    const results = new Map<string, string | Error>();
    const queue = [...urls];
    const inProgress = new Set<Promise<void>>();

    while (queue.length > 0 || inProgress.size > 0) {
      while (inProgress.size < concurrency && queue.length > 0) {
        const url = queue.shift()!;
        
        const promise = this.fetch(url, options)
          .then(content => {
            results.set(url, content);
          })
          .catch(error => {
            results.set(url, error);
          })
          .finally(() => {
            inProgress.delete(promise);
          });

        inProgress.add(promise);
      }

      if (inProgress.size > 0) {
        await Promise.race(inProgress);
      }
    }

    return results;
  }

  /**
   * Fetch and parse JSON
   */
  async fetchJSON<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
    const content = await this.fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    });

    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse JSON from ${url}: ${error}`);
    }
  }

  /**
   * Check if URL is accessible
   */
  async isAccessible(url: string, timeout: number = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract metadata from HTML
   */
  extractMetadata(html: string): Record<string, string> {
    const metadata: Record<string, string> = {};

    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // Extract meta tags
    const metaRegex = /<meta\s+(?:name|property)=["']([^"']+)["']\s+content=["']([^"']+)["']/gi;
    let match;
    
    while ((match = metaRegex.exec(html)) !== null) {
      metadata[match[1]] = match[2];
    }

    // Extract Open Graph tags
    const ogRegex = /<meta\s+property=["']og:([^"']+)["']\s+content=["']([^"']+)["']/gi;
    while ((match = ogRegex.exec(html)) !== null) {
      metadata[`og:${match[1]}`] = match[2];
    }

    return metadata;
  }

  /**
   * Clean HTML content
   */
  cleanHTML(html: string): string {
    // Remove scripts and styles
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, ' ');
    
    // Clean whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Decode HTML entities
    cleaned = this.decodeHTMLEntities(cleaned);
    
    return cleaned;
  }

  // Helper methods

  private getRandomUserAgent(): string {
    return this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private decodeHTMLEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'",
      '&nbsp;': ' '
    };

    return text.replace(/&[^;]+;/g, match => entities[match] || match);
  }

  /**
   * Rate-limited fetch with token bucket algorithm
   */
  private rateLimiter = new Map<string, { tokens: number; lastRefill: number }>();
  
  async fetchRateLimited(
    url: string, 
    options: FetchOptions = {}, 
    rateLimit: { tokensPerSecond: number; burst: number } = { tokensPerSecond: 1, burst: 5 }
  ): Promise<string> {
    const domain = new URL(url).hostname;
    const now = Date.now();
    
    if (!this.rateLimiter.has(domain)) {
      this.rateLimiter.set(domain, { tokens: rateLimit.burst, lastRefill: now });
    }

    const bucket = this.rateLimiter.get(domain)!;
    
    // Refill tokens
    const timePassed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = timePassed * rateLimit.tokensPerSecond;
    bucket.tokens = Math.min(rateLimit.burst, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Wait if no tokens available
    if (bucket.tokens < 1) {
      const waitTime = (1 - bucket.tokens) / rateLimit.tokensPerSecond * 1000;
      await this.delay(waitTime);
      return this.fetchRateLimited(url, options, rateLimit);
    }

    // Consume token and fetch
    bucket.tokens -= 1;
    return this.fetch(url, options);
  }
}

// Export singleton instance
export const webFetch = new WebFetch();