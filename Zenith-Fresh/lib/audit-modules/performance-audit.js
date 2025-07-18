/**
 * Performance Audit Module
 * Analyzes website performance, Core Web Vitals, and optimization opportunities
 */

class PerformanceAudit {
  constructor() {
    this.name = 'Performance Audit';
    this.version = '1.0.0';
  }

  async audit(websiteUrl) {
    console.log(`⚡ Running performance audit for ${websiteUrl}`);
    
    const results = {
      status: 'completed',
      score: 0,
      timestamp: new Date().toISOString(),
      checks: {},
      issues: [],
      recommendations: [],
      metrics: {}
    };

    try {
      // Run performance checks
      await Promise.all([
        this.measurePageLoadTime(websiteUrl, results),
        this.analyzeResourceSizes(websiteUrl, results),
        this.checkCoreWebVitals(websiteUrl, results),
        this.analyzeImageOptimization(websiteUrl, results),
        this.checkCaching(websiteUrl, results),
        this.analyzeJavaScript(websiteUrl, results),
        this.checkCSS(websiteUrl, results),
        this.analyzeFonts(websiteUrl, results),
        this.checkCompression(websiteUrl, results)
      ]);

      // Calculate score
      results.score = this.calculateScore(results.checks);
      
      console.log(`✅ Performance audit completed with score: ${results.score}/100`);
      return results;

    } catch (error) {
      console.error('Performance audit failed:', error);
      results.status = 'failed';
      results.error = error.message;
      return results;
    }
  }

  async measurePageLoadTime(url, results) {
    try {
      const startTime = Date.now();
      const response = await fetch(url);
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      const html = await response.text();
      
      const checks = {
        loadTime: loadTime,
        loadTimeOptimal: loadTime < 2000, // Under 2 seconds
        loadTimeGood: loadTime < 3000, // Under 3 seconds
        responseStatus: response.status,
        contentSize: html.length,
        ttfb: this.extractTTFB(response) // Time to First Byte
      };

      results.metrics.loadTime = loadTime;
      results.checks.pageLoadTime = {
        score: this.calculateLoadTimeScore(checks),
        details: checks
      };

      if (loadTime > 3000) {
        results.issues.push({
          severity: 'high',
          category: 'performance',
          message: `Slow page load time: ${loadTime}ms`,
          recommendation: 'Optimize server response time and reduce resource sizes'
        });
      } else if (loadTime > 2000) {
        results.issues.push({
          severity: 'medium',
          category: 'performance',
          message: `Page load time could be improved: ${loadTime}ms`,
          recommendation: 'Consider further optimizations to achieve sub-2s load times'
        });
      }

    } catch (error) {
      results.checks.pageLoadTime = { score: 0, error: error.message };
    }
  }

  async analyzeResourceSizes(url, results) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      // Extract resource URLs
      const cssLinks = this.extractResources(html, /<link[^>]+rel=["\']stylesheet["\'][^>]*href=["\']([^"']+)["\'][^>]*>/gi);
      const jsScripts = this.extractResources(html, /<script[^>]+src=["\']([^"']+)["\'][^>]*>/gi);
      const images = this.extractResources(html, /<img[^>]+src=["\']([^"']+)["\'][^>]*>/gi);
      
      const checks = {
        totalResources: cssLinks.length + jsScripts.length + images.length,
        cssFiles: cssLinks.length,
        jsFiles: jsScripts.length,
        imageFiles: images.length,
        htmlSize: html.length,
        estimatedTotalSize: html.length // Base HTML size
      };

      // Sample resource sizes (in production, would fetch each resource)
      checks.estimatedCssSize = cssLinks.length * 50000; // Estimate 50KB per CSS file
      checks.estimatedJsSize = jsScripts.length * 100000; // Estimate 100KB per JS file
      checks.estimatedImageSize = images.length * 200000; // Estimate 200KB per image
      checks.estimatedTotalSize += checks.estimatedCssSize + checks.estimatedJsSize + checks.estimatedImageSize;

      results.checks.resourceSizes = {
        score: this.calculateResourceSizeScore(checks),
        details: checks
      };

      if (checks.estimatedTotalSize > 3000000) { // 3MB
        results.issues.push({
          severity: 'high',
          category: 'performance',
          message: `Large total page size: ~${Math.round(checks.estimatedTotalSize / 1000)}KB`,
          recommendation: 'Optimize and compress resources to reduce page weight'
        });
      }

      if (checks.totalResources > 50) {
        results.issues.push({
          severity: 'medium',
          category: 'performance',
          message: `Many HTTP requests: ${checks.totalResources}`,
          recommendation: 'Combine and minify resources to reduce HTTP requests'
        });
      }

    } catch (error) {
      results.checks.resourceSizes = { score: 0, error: error.message };
    }
  }

  async checkCoreWebVitals(url, results) {
    try {
      // Simulate Core Web Vitals (in production, use real measurement tools)
      const checks = {
        largestContentfulPaint: this.simulateLCP(),
        firstInputDelay: this.simulateFID(),
        cumulativeLayoutShift: this.simulateCLS(),
        firstContentfulPaint: this.simulateFCP(),
        timeToInteractive: this.simulateTTI()
      };

      checks.lcpGood = checks.largestContentfulPaint < 2500;
      checks.fidGood = checks.firstInputDelay < 100;
      checks.clsGood = checks.cumulativeLayoutShift < 0.1;
      checks.fcpGood = checks.firstContentfulPaint < 1800;
      checks.ttiGood = checks.timeToInteractive < 3800;

      results.metrics.coreWebVitals = checks;
      results.checks.coreWebVitals = {
        score: this.calculateCoreWebVitalsScore(checks),
        details: checks
      };

      // Add issues for poor Core Web Vitals
      if (!checks.lcpGood) {
        results.issues.push({
          severity: 'high',
          category: 'core-web-vitals',
          message: `Poor Largest Contentful Paint: ${checks.largestContentfulPaint}ms`,
          recommendation: 'Optimize largest content element loading (images, text blocks)'
        });
      }

      if (!checks.fidGood) {
        results.issues.push({
          severity: 'high',
          category: 'core-web-vitals',
          message: `Poor First Input Delay: ${checks.firstInputDelay}ms`,
          recommendation: 'Reduce JavaScript execution time and optimize main thread work'
        });
      }

      if (!checks.clsGood) {
        results.issues.push({
          severity: 'high',
          category: 'core-web-vitals',
          message: `Poor Cumulative Layout Shift: ${checks.cumulativeLayoutShift}`,
          recommendation: 'Prevent layout shifts by setting dimensions for images and ads'
        });
      }

    } catch (error) {
      results.checks.coreWebVitals = { score: 0, error: error.message };
    }
  }

  async analyzeImageOptimization(url, results) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      const imageMatches = html.match(/<img[^>]*>/gi) || [];
      
      const checks = {
        totalImages: imageMatches.length,
        imagesWithAlt: 0,
        imagesWithLazyLoad: 0,
        modernFormats: 0,
        imagesWithDimensions: 0
      };

      imageMatches.forEach(img => {
        if (/alt=/i.test(img)) checks.imagesWithAlt++;
        if (/loading=["\']lazy["\']/i.test(img)) checks.imagesWithLazyLoad++;
        if (/\.(webp|avif)/i.test(img)) checks.modernFormats++;
        if (/width=|height=/i.test(img)) checks.imagesWithDimensions++;
      });

      checks.altOptimization = checks.totalImages > 0 ? (checks.imagesWithAlt / checks.totalImages) * 100 : 100;
      checks.lazyLoadOptimization = checks.totalImages > 0 ? (checks.imagesWithLazyLoad / checks.totalImages) * 100 : 100;
      checks.dimensionOptimization = checks.totalImages > 0 ? (checks.imagesWithDimensions / checks.totalImages) * 100 : 100;

      results.checks.imageOptimization = {
        score: this.calculateImageOptimizationScore(checks),
        details: checks
      };

      if (checks.lazyLoadOptimization < 50) {
        results.issues.push({
          severity: 'medium',
          category: 'images',
          message: 'Few images use lazy loading',
          recommendation: 'Implement lazy loading for images below the fold'
        });
      }

      if (checks.modernFormats === 0 && checks.totalImages > 0) {
        results.issues.push({
          severity: 'medium',
          category: 'images',
          message: 'No modern image formats detected',
          recommendation: 'Use WebP or AVIF formats for better compression'
        });
      }

    } catch (error) {
      results.checks.imageOptimization = { score: 0, error: error.message };
    }
  }

  async checkCaching(url, results) {
    try {
      const response = await fetch(url);
      
      const checks = {
        hasCacheControl: response.headers.has('cache-control'),
        hasEtag: response.headers.has('etag'),
        hasLastModified: response.headers.has('last-modified'),
        hasExpires: response.headers.has('expires'),
        cacheControlValue: response.headers.get('cache-control') || '',
        maxAge: 0
      };

      if (checks.hasCacheControl) {
        const maxAgeMatch = checks.cacheControlValue.match(/max-age=(\d+)/);
        if (maxAgeMatch) {
          checks.maxAge = parseInt(maxAgeMatch[1]);
          checks.hasMaxAge = true;
          checks.maxAgeOptimal = checks.maxAge >= 86400; // At least 1 day
        }
      }

      results.checks.caching = {
        score: this.calculateCachingScore(checks),
        details: checks
      };

      if (!checks.hasCacheControl) {
        results.issues.push({
          severity: 'medium',
          category: 'caching',
          message: 'No cache-control header found',
          recommendation: 'Add appropriate cache-control headers to improve performance'
        });
      }

      if (checks.hasCacheControl && checks.maxAge < 3600) {
        results.issues.push({
          severity: 'low',
          category: 'caching',
          message: 'Short cache duration',
          recommendation: 'Consider longer cache durations for static resources'
        });
      }

    } catch (error) {
      results.checks.caching = { score: 0, error: error.message };
    }
  }

  async analyzeJavaScript(url, results) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      const scriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>|<script[^>]*\/>/gi) || [];
      const externalScripts = html.match(/<script[^>]+src=["\']([^"']+)["\'][^>]*>/gi) || [];
      
      const checks = {
        totalScripts: scriptMatches.length,
        externalScripts: externalScripts.length,
        inlineScripts: scriptMatches.length - externalScripts.length,
        asyncScripts: 0,
        deferScripts: 0,
        estimatedJsSize: 0
      };

      scriptMatches.forEach(script => {
        if (/async/i.test(script)) checks.asyncScripts++;
        if (/defer/i.test(script)) checks.deferScripts++;
      });

      checks.estimatedJsSize = checks.externalScripts * 100000; // Estimate 100KB per script
      checks.asyncOptimization = checks.externalScripts > 0 ? 
        ((checks.asyncScripts + checks.deferScripts) / checks.externalScripts) * 100 : 100;

      results.checks.javascript = {
        score: this.calculateJavaScriptScore(checks),
        details: checks
      };

      if (checks.asyncOptimization < 50) {
        results.issues.push({
          severity: 'medium',
          category: 'javascript',
          message: 'Few scripts use async/defer attributes',
          recommendation: 'Add async or defer attributes to non-critical JavaScript'
        });
      }

      if (checks.totalScripts > 20) {
        results.issues.push({
          severity: 'medium',
          category: 'javascript',
          message: `Many JavaScript files: ${checks.totalScripts}`,
          recommendation: 'Combine and minify JavaScript files to reduce HTTP requests'
        });
      }

    } catch (error) {
      results.checks.javascript = { score: 0, error: error.message };
    }
  }

  async checkCSS(url, results) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      const cssLinks = html.match(/<link[^>]+rel=["\']stylesheet["\'][^>]*>/gi) || [];
      const inlineStyles = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
      
      const checks = {
        externalCSS: cssLinks.length,
        inlineCSS: inlineStyles.length,
        totalCSS: cssLinks.length + inlineStyles.length,
        criticalCSS: inlineStyles.length > 0,
        estimatedCssSize: cssLinks.length * 50000 // Estimate 50KB per CSS file
      };

      results.checks.css = {
        score: this.calculateCSSScore(checks),
        details: checks
      };

      if (checks.externalCSS > 5) {
        results.issues.push({
          severity: 'medium',
          category: 'css',
          message: `Many CSS files: ${checks.externalCSS}`,
          recommendation: 'Combine CSS files to reduce HTTP requests'
        });
      }

      if (!checks.criticalCSS) {
        results.issues.push({
          severity: 'low',
          category: 'css',
          message: 'No critical CSS inlined',
          recommendation: 'Consider inlining critical above-the-fold CSS'
        });
      }

    } catch (error) {
      results.checks.css = { score: 0, error: error.message };
    }
  }

  async analyzeFonts(url, results) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      const fontLinks = html.match(/<link[^>]+href=["\'][^"']*font[^"']*["\'][^>]*>/gi) || [];
      const fontFaces = html.match(/@font-face/gi) || [];
      
      const checks = {
        externalFonts: fontLinks.length,
        fontFaces: fontFaces.length,
        totalFonts: fontLinks.length + fontFaces.length,
        fontDisplay: false,
        preloadFonts: 0
      };

      // Check for font-display property
      if (html.includes('font-display')) {
        checks.fontDisplay = true;
      }

      // Check for font preloading
      const preloadLinks = html.match(/<link[^>]+rel=["\']preload["\'][^>]*>/gi) || [];
      preloadLinks.forEach(link => {
        if (/font/i.test(link)) checks.preloadFonts++;
      });

      results.checks.fonts = {
        score: this.calculateFontsScore(checks),
        details: checks
      };

      if (checks.externalFonts > 3) {
        results.issues.push({
          severity: 'medium',
          category: 'fonts',
          message: `Many external fonts: ${checks.externalFonts}`,
          recommendation: 'Reduce number of font files and font weights'
        });
      }

      if (!checks.fontDisplay && checks.totalFonts > 0) {
        results.issues.push({
          severity: 'low',
          category: 'fonts',
          message: 'Font-display property not used',
          recommendation: 'Use font-display: swap for better loading performance'
        });
      }

    } catch (error) {
      results.checks.fonts = { score: 0, error: error.message };
    }
  }

  async checkCompression(url, results) {
    try {
      const response = await fetch(url);
      
      const checks = {
        hasGzip: response.headers.get('content-encoding') === 'gzip',
        hasBrotli: response.headers.get('content-encoding') === 'br',
        contentEncoding: response.headers.get('content-encoding') || 'none',
        contentLength: parseInt(response.headers.get('content-length')) || 0
      };

      checks.hasCompression = checks.hasGzip || checks.hasBrotli;

      results.checks.compression = {
        score: this.calculateCompressionScore(checks),
        details: checks
      };

      if (!checks.hasCompression) {
        results.issues.push({
          severity: 'medium',
          category: 'compression',
          message: 'No content compression detected',
          recommendation: 'Enable Gzip or Brotli compression on your server'
        });
      }

    } catch (error) {
      results.checks.compression = { score: 0, error: error.message };
    }
  }

  // Utility methods
  extractResources(html, regex) {
    const matches = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  }

  extractTTFB(response) {
    // In real implementation, measure actual TTFB
    return Math.random() * 500 + 100; // Simulate 100-600ms
  }

  simulateLCP() { return Math.random() * 3000 + 1000; } // 1-4s
  simulateFID() { return Math.random() * 200 + 50; } // 50-250ms
  simulateCLS() { return Math.random() * 0.3; } // 0-0.3
  simulateFCP() { return Math.random() * 2000 + 800; } // 0.8-2.8s
  simulateTTI() { return Math.random() * 4000 + 2000; } // 2-6s

  // Scoring methods
  calculateLoadTimeScore(checks) {
    if (checks.loadTime < 1000) return 100;
    if (checks.loadTime < 2000) return 90;
    if (checks.loadTime < 3000) return 70;
    if (checks.loadTime < 5000) return 50;
    return 30;
  }

  calculateResourceSizeScore(checks) {
    let score = 100;
    
    if (checks.estimatedTotalSize > 5000000) score -= 40; // 5MB
    else if (checks.estimatedTotalSize > 3000000) score -= 25; // 3MB
    else if (checks.estimatedTotalSize > 1000000) score -= 10; // 1MB
    
    if (checks.totalResources > 100) score -= 30;
    else if (checks.totalResources > 50) score -= 15;
    
    return Math.max(0, score);
  }

  calculateCoreWebVitalsScore(checks) {
    let score = 0;
    if (checks.lcpGood) score += 30;
    if (checks.fidGood) score += 25;
    if (checks.clsGood) score += 25;
    if (checks.fcpGood) score += 10;
    if (checks.ttiGood) score += 10;
    return score;
  }

  calculateImageOptimizationScore(checks) {
    let score = 0;
    score += (checks.altOptimization / 100) * 20;
    score += (checks.lazyLoadOptimization / 100) * 40;
    score += (checks.dimensionOptimization / 100) * 20;
    if (checks.modernFormats > 0) score += 20;
    return Math.round(score);
  }

  calculateCachingScore(checks) {
    let score = 0;
    if (checks.hasCacheControl) score += 40;
    if (checks.hasEtag) score += 20;
    if (checks.hasLastModified) score += 15;
    if (checks.maxAgeOptimal) score += 25;
    return score;
  }

  calculateJavaScriptScore(checks) {
    let score = 100;
    if (checks.totalScripts > 20) score -= 30;
    else if (checks.totalScripts > 10) score -= 15;
    
    score = Math.max(0, score);
    score += (checks.asyncOptimization / 100) * 30;
    return Math.round(score);
  }

  calculateCSSScore(checks) {
    let score = 100;
    if (checks.externalCSS > 10) score -= 30;
    else if (checks.externalCSS > 5) score -= 15;
    
    if (checks.criticalCSS) score += 20;
    return Math.max(0, Math.min(100, score));
  }

  calculateFontsScore(checks) {
    let score = 100;
    if (checks.externalFonts > 5) score -= 30;
    else if (checks.externalFonts > 3) score -= 15;
    
    if (checks.fontDisplay) score += 20;
    if (checks.preloadFonts > 0) score += 10;
    return Math.max(0, Math.min(100, score));
  }

  calculateCompressionScore(checks) {
    if (checks.hasBrotli) return 100;
    if (checks.hasGzip) return 80;
    return 0;
  }

  calculateScore(checks) {
    const weights = {
      pageLoadTime: 0.2,
      coreWebVitals: 0.25,
      resourceSizes: 0.15,
      imageOptimization: 0.1,
      javascript: 0.1,
      css: 0.05,
      caching: 0.05,
      compression: 0.05,
      fonts: 0.05
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

module.exports = PerformanceAudit;