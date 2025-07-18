/**
 * Technical Audit Module
 * Analyzes technical SEO, site structure, and code quality
 */

class TechnicalAudit {
  constructor() {
    this.name = 'Technical Audit';
    this.version = '1.0.0';
  }

  async audit(websiteUrl) {
    console.log(`🔧 Running technical audit for ${websiteUrl}`);
    
    const results = {
      status: 'completed',
      score: 0,
      timestamp: new Date().toISOString(),
      checks: {},
      issues: [],
      recommendations: []
    };

    try {
      // Run technical checks
      await Promise.all([
        this.checkMetaTags(websiteUrl, results),
        this.checkStructuredData(websiteUrl, results),
        this.checkSitemap(websiteUrl, results),
        this.checkRobotsTxt(websiteUrl, results),
        this.checkHTMLValidation(websiteUrl, results),
        this.checkInternalLinking(websiteUrl, results),
        this.checkCrawlability(websiteUrl, results),
        this.checkCanonicals(websiteUrl, results)
      ]);

      // Calculate score
      results.score = this.calculateScore(results.checks);
      
      console.log(`✅ Technical audit completed with score: ${results.score}/100`);
      return results;

    } catch (error) {
      console.error('Technical audit failed:', error);
      results.status = 'failed';
      results.error = error.message;
      return results;
    }
  }

  async checkMetaTags(url, results) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      const checks = {
        hasTitle: /<title[^>]*>([^<]+)<\/title>/i.test(html),
        hasMetaDescription: /<meta[^>]+name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i.test(html),
        hasViewport: /<meta[^>]+name=["\']viewport["\'][^>]*>/i.test(html),
        hasCharset: /<meta[^>]+charset=["\']?([^"'\s>]+)["\']?[^>]*>/i.test(html),
        hasOgTags: /<meta[^>]+property=["\']og:[^"']+["\'][^>]*>/i.test(html),
        hasTwitterCards: /<meta[^>]+name=["\']twitter:[^"']+["\'][^>]*>/i.test(html)
      };

      // Extract title and description for analysis
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descMatch = html.match(/<meta[^>]+name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i);
      
      if (titleMatch) {
        const title = titleMatch[1].trim();
        checks.titleLength = title.length;
        checks.titleOptimal = title.length >= 30 && title.length <= 60;
      }

      if (descMatch) {
        const description = descMatch[1].trim();
        checks.descriptionLength = description.length;
        checks.descriptionOptimal = description.length >= 120 && description.length <= 160;
      }

      results.checks.metaTags = {
        score: this.calculateMetaScore(checks),
        details: checks
      };

      // Add issues
      if (!checks.hasTitle) {
        results.issues.push({
          severity: 'critical',
          category: 'meta-tags',
          message: 'Missing title tag',
          recommendation: 'Add a descriptive title tag to improve SEO'
        });
      }

      if (!checks.hasMetaDescription) {
        results.issues.push({
          severity: 'high',
          category: 'meta-tags',
          message: 'Missing meta description',
          recommendation: 'Add a compelling meta description to improve click-through rates'
        });
      }

      if (!checks.titleOptimal && checks.hasTitle) {
        results.issues.push({
          severity: 'medium',
          category: 'meta-tags',
          message: `Title length (${checks.titleLength}) not optimal`,
          recommendation: 'Keep title between 30-60 characters for best SEO results'
        });
      }

    } catch (error) {
      results.checks.metaTags = { score: 0, error: error.message };
    }
  }

  async checkStructuredData(url, results) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      const checks = {
        hasJsonLd: /<script[^>]+type=["\']application\/ld\+json["\'][^>]*>/i.test(html),
        hasMicrodata: /itemscope|itemtype|itemprop/i.test(html),
        hasRDFa: /property=|typeof=/i.test(html)
      };

      // Extract and validate JSON-LD
      const jsonLdMatches = html.match(/<script[^>]+type=["\']application\/ld\+json["\'][^>]*>([\s\S]*?)<\/script>/gi);
      
      if (jsonLdMatches) {
        checks.jsonLdValid = true;
        checks.jsonLdCount = jsonLdMatches.length;
        
        try {
          jsonLdMatches.forEach(match => {
            const content = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
            JSON.parse(content);
          });
        } catch (e) {
          checks.jsonLdValid = false;
          results.issues.push({
            severity: 'medium',
            category: 'structured-data',
            message: 'Invalid JSON-LD structure detected',
            recommendation: 'Fix JSON-LD syntax errors'
          });
        }
      }

      results.checks.structuredData = {
        score: this.calculateStructuredDataScore(checks),
        details: checks
      };

      if (!checks.hasJsonLd && !checks.hasMicrodata && !checks.hasRDFa) {
        results.issues.push({
          severity: 'medium',
          category: 'structured-data',
          message: 'No structured data found',
          recommendation: 'Implement JSON-LD structured data for better search visibility'
        });
      }

    } catch (error) {
      results.checks.structuredData = { score: 0, error: error.message };
    }
  }

  async checkSitemap(url, results) {
    try {
      const baseUrl = new URL(url).origin;
      const sitemapUrls = [
        `${baseUrl}/sitemap.xml`,
        `${baseUrl}/sitemap_index.xml`,
        `${baseUrl}/sitemap.txt`
      ];

      const checks = {
        hasSitemap: false,
        sitemapAccessible: false,
        sitemapValid: false,
        sitemapUrl: null
      };

      for (const sitemapUrl of sitemapUrls) {
        try {
          const response = await fetch(sitemapUrl);
          if (response.ok) {
            checks.hasSitemap = true;
            checks.sitemapAccessible = true;
            checks.sitemapUrl = sitemapUrl;
            
            const content = await response.text();
            checks.sitemapValid = content.includes('<urlset') || content.includes('<sitemapindex') || content.includes('http');
            break;
          }
        } catch (e) {
          // Continue to next sitemap URL
        }
      }

      results.checks.sitemap = {
        score: this.calculateSitemapScore(checks),
        details: checks
      };

      if (!checks.hasSitemap) {
        results.issues.push({
          severity: 'medium',
          category: 'sitemap',
          message: 'No sitemap found',
          recommendation: 'Create and submit an XML sitemap to help search engines crawl your site'
        });
      }

    } catch (error) {
      results.checks.sitemap = { score: 0, error: error.message };
    }
  }

  async checkRobotsTxt(url, results) {
    try {
      const baseUrl = new URL(url).origin;
      const robotsUrl = `${baseUrl}/robots.txt`;
      
      const checks = {
        hasRobotsTxt: false,
        robotsAccessible: false,
        hasSitemapReference: false,
        hasDisallowRules: false
      };

      try {
        const response = await fetch(robotsUrl);
        if (response.ok) {
          checks.hasRobotsTxt = true;
          checks.robotsAccessible = true;
          
          const content = await response.text();
          checks.hasSitemapReference = /sitemap:/i.test(content);
          checks.hasDisallowRules = /disallow:/i.test(content);
        }
      } catch (e) {
        // robots.txt not accessible
      }

      results.checks.robotsTxt = {
        score: this.calculateRobotsScore(checks),
        details: checks
      };

      if (!checks.hasRobotsTxt) {
        results.issues.push({
          severity: 'low',
          category: 'robots',
          message: 'No robots.txt found',
          recommendation: 'Create a robots.txt file to guide search engine crawling'
        });
      }

    } catch (error) {
      results.checks.robotsTxt = { score: 0, error: error.message };
    }
  }

  async checkHTMLValidation(url, results) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      const checks = {
        hasDoctype: /<!doctype html>/i.test(html),
        hasLangAttribute: /<html[^>]+lang=/i.test(html),
        hasCharsetDeclaration: /<meta[^>]+charset=/i.test(html),
        hasViewportMeta: /<meta[^>]+name=["\']viewport["\']/i.test(html),
        wellFormedHTML: true // Simplified check
      };

      // Basic HTML structure validation
      const htmlTagMatch = html.match(/<html[^>]*>/i);
      const headTagMatch = html.match(/<head[^>]*>/i);
      const bodyTagMatch = html.match(/<body[^>]*>/i);
      
      checks.hasHtmlTag = !!htmlTagMatch;
      checks.hasHeadTag = !!headTagMatch;
      checks.hasBodyTag = !!bodyTagMatch;

      results.checks.htmlValidation = {
        score: this.calculateHTMLScore(checks),
        details: checks
      };

      if (!checks.hasDoctype) {
        results.issues.push({
          severity: 'medium',
          category: 'html-validation',
          message: 'Missing HTML5 doctype declaration',
          recommendation: 'Add <!DOCTYPE html> at the beginning of your HTML document'
        });
      }

      if (!checks.hasLangAttribute) {
        results.issues.push({
          severity: 'medium',
          category: 'html-validation',
          message: 'Missing lang attribute on html element',
          recommendation: 'Add lang attribute to html element for accessibility and SEO'
        });
      }

    } catch (error) {
      results.checks.htmlValidation = { score: 0, error: error.message };
    }
  }

  async checkInternalLinking(url, results) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      const baseUrl = new URL(url).origin;
      const linkMatches = html.match(/<a[^>]+href=["\']([^"']+)["\'][^>]*>/gi) || [];
      
      const checks = {
        totalLinks: linkMatches.length,
        internalLinks: 0,
        externalLinks: 0,
        noFollowLinks: 0,
        brokenLinks: 0 // Would need additional checking
      };

      linkMatches.forEach(link => {
        const hrefMatch = link.match(/href=["\']([^"']+)["\']/i);
        if (hrefMatch) {
          const href = hrefMatch[1];
          
          if (href.startsWith(baseUrl) || href.startsWith('/') || !href.includes('://')) {
            checks.internalLinks++;
          } else {
            checks.externalLinks++;
          }
          
          if (/rel=["\'][^"']*nofollow[^"']*["\']/i.test(link)) {
            checks.noFollowLinks++;
          }
        }
      });

      checks.internalLinkRatio = checks.totalLinks > 0 
        ? (checks.internalLinks / checks.totalLinks) * 100 
        : 0;

      results.checks.internalLinking = {
        score: this.calculateLinkingScore(checks),
        details: checks
      };

      if (checks.internalLinks < 3) {
        results.issues.push({
          severity: 'medium',
          category: 'internal-linking',
          message: 'Few internal links found',
          recommendation: 'Add more internal links to improve site navigation and SEO'
        });
      }

    } catch (error) {
      results.checks.internalLinking = { score: 0, error: error.message };
    }
  }

  async checkCrawlability(url, results) {
    try {
      const response = await fetch(url);
      
      const checks = {
        httpStatus: response.status,
        isAccessible: response.ok,
        hasXRobotsTag: response.headers.has('x-robots-tag'),
        responseTime: 0 // Would measure actual response time
      };

      if (checks.hasXRobotsTag) {
        checks.xRobotsContent = response.headers.get('x-robots-tag');
        checks.allowsIndexing = !checks.xRobotsContent.includes('noindex');
      } else {
        checks.allowsIndexing = true;
      }

      const html = await response.text();
      
      // Check for meta robots
      const metaRobotsMatch = html.match(/<meta[^>]+name=["\']robots["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i);
      if (metaRobotsMatch) {
        checks.hasMetaRobots = true;
        checks.metaRobotsContent = metaRobotsMatch[1];
        checks.allowsIndexing = checks.allowsIndexing && !metaRobotsMatch[1].includes('noindex');
      }

      results.checks.crawlability = {
        score: this.calculateCrawlabilityScore(checks),
        details: checks
      };

      if (!checks.isAccessible) {
        results.issues.push({
          severity: 'critical',
          category: 'crawlability',
          message: `Page returns HTTP ${checks.httpStatus}`,
          recommendation: 'Fix server issues to ensure page is accessible to search engines'
        });
      }

      if (!checks.allowsIndexing) {
        results.issues.push({
          severity: 'high',
          category: 'crawlability',
          message: 'Page blocks search engine indexing',
          recommendation: 'Review robots meta tag or X-Robots-Tag header if indexing is desired'
        });
      }

    } catch (error) {
      results.checks.crawlability = { score: 0, error: error.message };
    }
  }

  async checkCanonicals(url, results) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      const canonicalMatch = html.match(/<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"']+)["\'][^>]*>/i);
      
      const checks = {
        hasCanonical: !!canonicalMatch,
        canonicalUrl: canonicalMatch ? canonicalMatch[1] : null,
        selfReferencing: false,
        canonicalAccessible: false
      };

      if (checks.hasCanonical) {
        const canonicalUrl = new URL(checks.canonicalUrl, url);
        const currentUrl = new URL(url);
        
        checks.selfReferencing = canonicalUrl.href === currentUrl.href;
        
        // Check if canonical URL is accessible
        try {
          const canonicalResponse = await fetch(canonicalUrl.href);
          checks.canonicalAccessible = canonicalResponse.ok;
        } catch (e) {
          checks.canonicalAccessible = false;
        }
      }

      results.checks.canonicals = {
        score: this.calculateCanonicalsScore(checks),
        details: checks
      };

      if (!checks.hasCanonical) {
        results.issues.push({
          severity: 'low',
          category: 'canonicals',
          message: 'No canonical URL specified',
          recommendation: 'Add canonical link to prevent duplicate content issues'
        });
      }

      if (checks.hasCanonical && !checks.canonicalAccessible) {
        results.issues.push({
          severity: 'medium',
          category: 'canonicals',
          message: 'Canonical URL is not accessible',
          recommendation: 'Ensure canonical URL returns a valid response'
        });
      }

    } catch (error) {
      results.checks.canonicals = { score: 0, error: error.message };
    }
  }

  // Scoring methods
  calculateMetaScore(checks) {
    let score = 0;
    if (checks.hasTitle) score += 30;
    if (checks.hasMetaDescription) score += 25;
    if (checks.titleOptimal) score += 15;
    if (checks.descriptionOptimal) score += 15;
    if (checks.hasViewport) score += 5;
    if (checks.hasCharset) score += 5;
    if (checks.hasOgTags) score += 3;
    if (checks.hasTwitterCards) score += 2;
    return Math.min(100, score);
  }

  calculateStructuredDataScore(checks) {
    let score = 0;
    if (checks.hasJsonLd) score += 60;
    if (checks.jsonLdValid) score += 30;
    if (checks.hasMicrodata) score += 5;
    if (checks.hasRDFa) score += 5;
    return Math.min(100, score);
  }

  calculateSitemapScore(checks) {
    let score = 0;
    if (checks.hasSitemap) score += 50;
    if (checks.sitemapAccessible) score += 30;
    if (checks.sitemapValid) score += 20;
    return Math.min(100, score);
  }

  calculateRobotsScore(checks) {
    let score = 0;
    if (checks.hasRobotsTxt) score += 40;
    if (checks.robotsAccessible) score += 30;
    if (checks.hasSitemapReference) score += 20;
    if (checks.hasDisallowRules) score += 10;
    return Math.min(100, score);
  }

  calculateHTMLScore(checks) {
    let score = 0;
    if (checks.hasDoctype) score += 20;
    if (checks.hasLangAttribute) score += 20;
    if (checks.hasCharsetDeclaration) score += 15;
    if (checks.hasViewportMeta) score += 15;
    if (checks.hasHtmlTag) score += 10;
    if (checks.hasHeadTag) score += 10;
    if (checks.hasBodyTag) score += 10;
    return Math.min(100, score);
  }

  calculateLinkingScore(checks) {
    let score = 0;
    if (checks.internalLinks > 0) score += 30;
    if (checks.internalLinks > 5) score += 20;
    if (checks.internalLinkRatio > 50) score += 20;
    if (checks.totalLinks > 0) score += 15;
    if (checks.externalLinks > 0) score += 15;
    return Math.min(100, score);
  }

  calculateCrawlabilityScore(checks) {
    let score = 0;
    if (checks.isAccessible) score += 50;
    if (checks.allowsIndexing) score += 30;
    if (checks.httpStatus === 200) score += 20;
    return Math.min(100, score);
  }

  calculateCanonicalsScore(checks) {
    let score = 0;
    if (checks.hasCanonical) score += 50;
    if (checks.selfReferencing) score += 25;
    if (checks.canonicalAccessible) score += 25;
    return Math.min(100, score);
  }

  calculateScore(checks) {
    const weights = {
      metaTags: 0.25,
      structuredData: 0.15,
      sitemap: 0.1,
      robotsTxt: 0.05,
      htmlValidation: 0.15,
      internalLinking: 0.1,
      crawlability: 0.15,
      canonicals: 0.05
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([check, weight]) => {
      if (checks[check] && checks[check].score !== undefined) {
        totalScore += checks[check].score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }
}

module.exports = TechnicalAudit;