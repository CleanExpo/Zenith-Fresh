import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResults } from '@/types/analyzer';
import { cache } from '@/lib/cache';

// Rate limiting for public API
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests per hour per IP
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    // Check rate limit
    const now = Date.now();
    const userLimit = requestCounts.get(ip);
    
    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= RATE_LIMIT) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          );
        }
        userLimit.count++;
      } else {
        // Reset the count
        requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
      }
    } else {
      requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    }

    const { url } = await request.json();

    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
    }

    // Check cache first
    const cacheKey = `public-analysis:${url}`;
    const cachedResults = cache.get<AnalysisResults>(cacheKey);
    
    if (cachedResults) {
      return NextResponse.json(cachedResults);
    }

    const analysisResults = await analyzeWebsite(url);
    
    // Cache results for 30 minutes for public users
    cache.set(cacheKey, analysisResults, 1800);

    return NextResponse.json(analysisResults);
  } catch (error) {
    console.error('Public website analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze website' },
      { status: 500 }
    );
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function analyzeWebsite(url: string): Promise<AnalysisResults> {
  // Initialize results
  const results: AnalysisResults = {
    url,
    timestamp: new Date().toISOString(),
    scores: {
      performance: 0,
      seo: 0,
      security: 0,
      accessibility: 0,
      overall: 0,
    },
    details: {
      performance: {
        score: 0,
        issues: [],
        suggestions: [],
      },
      seo: {
        score: 0,
        issues: [],
        suggestions: [],
      },
      security: {
        score: 0,
        issues: [],
        suggestions: [],
      },
      accessibility: {
        score: 0,
        issues: [],
        suggestions: [],
      },
    },
    metrics: {
      loadTime: 0,
      pageSize: 0,
      requests: 0,
      domElements: 0,
    },
  };

  try {
    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ZenithAnalyzer/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const startTime = Date.now();

    // Basic performance analysis
    results.metrics.pageSize = new TextEncoder().encode(html).length;
    results.metrics.loadTime = Date.now() - startTime;

    // Count DOM elements (basic)
    const domMatches = html.match(/<[^>]+>/g) || [];
    results.metrics.domElements = domMatches.length;

    // Basic SEO checks
    const hasTitle = /<title[^>]*>.*<\/title>/i.test(html);
    const hasMetaDescription = /<meta[^>]+name=["']description["'][^>]*>/i.test(html);
    const hasH1 = /<h1[^>]*>.*<\/h1>/i.test(html);
    const hasCanonical = /<link[^>]+rel=["']canonical["'][^>]*>/i.test(html);

    // SEO scoring
    let seoScore = 0;
    if (hasTitle) {
      seoScore += 25;
    } else {
      results.details.seo.issues.push('Missing title tag');
    }
    if (hasMetaDescription) {
      seoScore += 25;
    } else {
      results.details.seo.issues.push('Missing meta description');
    }
    if (hasH1) {
      seoScore += 25;
    } else {
      results.details.seo.issues.push('Missing H1 tag');
    }
    if (hasCanonical) {
      seoScore += 25;
    } else {
      results.details.seo.suggestions.push('Consider adding canonical URL');
    }

    results.scores.seo = seoScore;
    results.details.seo.score = seoScore;

    // Basic security checks
    const hasHttps = url.startsWith('https://');
    const hasCSP = response.headers.get('content-security-policy') !== null;
    const hasXFrameOptions = response.headers.get('x-frame-options') !== null;
    const hasXContentType = response.headers.get('x-content-type-options') !== null;

    let securityScore = 0;
    if (hasHttps) {
      securityScore += 40;
    } else {
      results.details.security.issues.push('Not using HTTPS');
    }
    if (hasCSP) {
      securityScore += 20;
    } else {
      results.details.security.suggestions.push('Add Content Security Policy');
    }
    if (hasXFrameOptions) {
      securityScore += 20;
    } else {
      results.details.security.suggestions.push('Add X-Frame-Options header');
    }
    if (hasXContentType) {
      securityScore += 20;
    } else {
      results.details.security.suggestions.push('Add X-Content-Type-Options header');
    }

    results.scores.security = securityScore;
    results.details.security.score = securityScore;

    // Basic accessibility checks
    const hasLangAttr = /<html[^>]+lang=["'][^"']+["'][^>]*>/i.test(html);
    const hasAltTags = /<img[^>]+alt=["'][^"']*["'][^>]*>/i.test(html);
    const hasViewport = /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html);

    let accessibilityScore = 0;
    if (hasLangAttr) {
      accessibilityScore += 35;
    } else {
      results.details.accessibility.issues.push('Missing lang attribute on html tag');
    }
    if (hasAltTags) {
      accessibilityScore += 35;
    } else {
      results.details.accessibility.suggestions.push('Add alt text to images');
    }
    if (hasViewport) {
      accessibilityScore += 30;
    } else {
      results.details.accessibility.issues.push('Missing viewport meta tag');
    }

    results.scores.accessibility = accessibilityScore;
    results.details.accessibility.score = accessibilityScore;

    // Performance scoring based on basic metrics
    let performanceScore = 100;
    if (results.metrics.loadTime > 3000) performanceScore -= 20;
    if (results.metrics.loadTime > 5000) performanceScore -= 20;
    if (results.metrics.pageSize > 3000000) performanceScore -= 20; // 3MB
    if (results.metrics.domElements > 1500) performanceScore -= 20;

    results.scores.performance = Math.max(0, performanceScore);
    results.details.performance.score = results.scores.performance;

    // Calculate overall score
    results.scores.overall = Math.round(
      (results.scores.performance + 
       results.scores.seo + 
       results.scores.security + 
       results.scores.accessibility) / 4
    );

    // Add performance suggestions
    if (results.metrics.loadTime > 3000) {
      results.details.performance.issues.push('Page load time is high');
    }
    if (results.metrics.pageSize > 3000000) {
      results.details.performance.suggestions.push('Optimize page size for better performance');
    }

    return results;
  } catch (error) {
    console.error('Error analyzing website:', error);
    // Return partial results with error indication
    results.error = 'Failed to complete full analysis';
    return results;
  }
}