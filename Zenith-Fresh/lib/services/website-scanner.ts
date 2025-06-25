import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import puppeteer from 'puppeteer-core';
import * as cheerio from 'cheerio';

export interface ScanResult {
  url: string;
  timestamp: string;
  performance: {
    score: number;
    metrics: {
      firstContentfulPaint: number;
      largestContentfulPaint: number;
      firstInputDelay: number;
      cumulativeLayoutShift: number;
      speedIndex: number;
      totalBlockingTime: number;
    };
  };
  accessibility: {
    score: number;
    issues: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      element?: string;
    }>;
  };
  bestPractices: {
    score: number;
    issues: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  };
  seo: {
    score: number;
    issues: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  };
  security: {
    httpsEnabled: boolean;
    mixedContent: boolean;
    vulnerableLibraries: Array<{
      library: string;
      version: string;
      vulnerability: string;
    }>;
  };
  technical: {
    loadTime: number;
    pageSize: number;
    requests: number;
    errors: Array<{
      type: string;
      message: string;
      url?: string;
    }>;
  };
  content: {
    wordCount: number;
    headings: {
      h1: number;
      h2: number;
      h3: number;
    };
    images: {
      total: number;
      missingAlt: number;
    };
    links: {
      internal: number;
      external: number;
      broken: number;
    };
  };
}

export class WebsiteScanner {
  private static instance: WebsiteScanner;
  
  public static getInstance(): WebsiteScanner {
    if (!WebsiteScanner.instance) {
      WebsiteScanner.instance = new WebsiteScanner();
    }
    return WebsiteScanner.instance;
  }

  async scanWebsite(url: string, options: {
    includeScreenshot?: boolean;
    device?: 'desktop' | 'mobile';
    timeout?: number;
  } = {}): Promise<ScanResult> {
    const startTime = Date.now();
    
    try {
      // Validate URL
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid URL protocol. Only HTTP and HTTPS are supported.');
      }

      // Run Lighthouse audit
      const lighthouseResult = await this.runLighthouseAudit(url, options);
      
      // Run custom analysis
      const customAnalysis = await this.runCustomAnalysis(url, options);
      
      // Combine results
      const scanResult: ScanResult = {
        url,
        timestamp: new Date().toISOString(),
        performance: {
          score: Math.round(lighthouseResult.performance.score * 100),
          metrics: lighthouseResult.performance.metrics,
        },
        accessibility: {
          score: Math.round(lighthouseResult.accessibility.score * 100),
          issues: lighthouseResult.accessibility.issues,
        },
        bestPractices: {
          score: Math.round(lighthouseResult.bestPractices.score * 100),
          issues: lighthouseResult.bestPractices.issues,
        },
        seo: {
          score: Math.round(lighthouseResult.seo.score * 100),
          issues: lighthouseResult.seo.issues,
        },
        security: customAnalysis.security,
        technical: {
          ...customAnalysis.technical,
          loadTime: Date.now() - startTime,
        },
        content: customAnalysis.content,
      };

      return scanResult;
    } catch (error) {
      console.error('Website scanning failed:', error);
      throw new Error(`Website scanning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async runLighthouseAudit(url: string, options: any) {
    let chrome;
    try {
      chrome = await chromeLauncher.launch({
        chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
      });

      const lighthouseOptions = {
        logLevel: 'info' as const,
        output: 'json' as const,
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port,
        emulatedFormFactor: options.device === 'mobile' ? 'mobile' : 'desktop',
      };

      const runnerResult = await lighthouse(url, lighthouseOptions);
      const report = runnerResult?.lhr;

      if (!report) {
        throw new Error('Failed to generate Lighthouse report');
      }

      return {
        performance: {
          score: report.categories.performance?.score || 0,
          metrics: {
            firstContentfulPaint: report.audits['first-contentful-paint']?.numericValue || 0,
            largestContentfulPaint: report.audits['largest-contentful-paint']?.numericValue || 0,
            firstInputDelay: report.audits['max-potential-fid']?.numericValue || 0,
            cumulativeLayoutShift: report.audits['cumulative-layout-shift']?.numericValue || 0,
            speedIndex: report.audits['speed-index']?.numericValue || 0,
            totalBlockingTime: report.audits['total-blocking-time']?.numericValue || 0,
          },
        },
        accessibility: {
          score: report.categories.accessibility?.score || 0,
          issues: this.extractLighthouseIssues(report.categories.accessibility?.auditRefs || [], report.audits),
        },
        bestPractices: {
          score: report.categories['best-practices']?.score || 0,
          issues: this.extractLighthouseIssues(report.categories['best-practices']?.auditRefs || [], report.audits),
        },
        seo: {
          score: report.categories.seo?.score || 0,
          issues: this.extractLighthouseIssues(report.categories.seo?.auditRefs || [], report.audits),
        },
      };
    } finally {
      if (chrome) {
        await chrome.kill();
      }
    }
  }

  private extractLighthouseIssues(auditRefs: any[], audits: any) {
    const issues = [];
    
    for (const auditRef of auditRefs) {
      const audit = audits[auditRef.id];
      if (audit && audit.score !== null && audit.score < 1) {
        issues.push({
          type: auditRef.id,
          description: audit.title,
          severity: audit.score < 0.5 ? 'high' : audit.score < 0.8 ? 'medium' : 'low',
        });
      }
    }
    
    return issues;
  }

  private async runCustomAnalysis(url: string, options: any) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      // Set viewport based on device
      if (options.device === 'mobile') {
        await page.setViewport({ width: 375, height: 667 });
      } else {
        await page.setViewport({ width: 1200, height: 800 });
      }

      // Track network requests and errors
      const requests: any[] = [];
      const errors: any[] = [];
      
      page.on('request', (request) => {
        requests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
        });
      });

      page.on('pageerror', (error) => {
        errors.push({
          type: 'javascript',
          message: error.message,
        });
      });

      page.on('requestfailed', (request) => {
        errors.push({
          type: 'network',
          message: `Failed to load: ${request.url()}`,
          url: request.url(),
        });
      });

      // Navigate to the page
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: options.timeout || 30000,
      });

      // Get page content
      const content = await page.content();
      const $ = cheerio.load(content);

      // Analyze content
      const contentAnalysis = {
        wordCount: this.countWords($.text()),
        headings: {
          h1: $('h1').length,
          h2: $('h2').length,
          h3: $('h3').length,
        },
        images: {
          total: $('img').length,
          missingAlt: $('img:not([alt])').length,
        },
        links: {
          internal: $('a[href^="/"], a[href^="' + url + '"]').length,
          external: $('a[href^="http"]:not([href^="' + url + '"])').length,
          broken: 0, // Would need additional checking
        },
      };

      // Security analysis
      const securityAnalysis = {
        httpsEnabled: url.startsWith('https://'),
        mixedContent: content.includes('http://') && url.startsWith('https://'),
        vulnerableLibraries: [], // Would need additional vulnerability scanning
      };

      // Technical metrics
      const performanceMetrics = await page.metrics();
      const technicalAnalysis = {
        pageSize: content.length,
        requests: requests.length,
        errors,
      };

      return {
        security: securityAnalysis,
        technical: technicalAnalysis,
        content: contentAnalysis,
      };
    } finally {
      await browser.close();
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  async validateUrl(url: string): Promise<boolean> {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }
}

export const websiteScanner = WebsiteScanner.getInstance();