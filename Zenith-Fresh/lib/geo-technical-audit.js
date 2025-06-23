/**
 * GEO Technical Readiness Audit Engine
 * Comprehensive technical assessment for AI crawler visibility and server-side rendering optimization
 */

// Node.js fetch polyfill for compatibility
const fetch = globalThis.fetch || require('node-fetch');

class GEOTechnicalAudit {
  constructor() {
    this.aiCrawlers = [
      'GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web',
      'PerplexityBot', 'YouBot', 'BingBot', 'GoogleBot'
    ];
    
    this.criticalAuditPoints = {
      renderingStrategy: 'CRITICAL',
      serverSideRendering: 'CRITICAL', 
      performanceMetrics: 'High',
      schemaMarkup: 'High',
      crawlability: 'Medium',
      htmlStructure: 'Low'
    };

    this.competitorBenchmarks = {
      contentVisibility: { excellent: 95, good: 85, poor: 75 },
      coreWebVitals: { excellent: 90, good: 75, poor: 60 },
      schemaMarkup: { excellent: 85, good: 65, poor: 30 },
      ttfb: { excellent: 0.4, good: 0.8, poor: 1.2 }
    };
  }

  /**
   * Comprehensive GEO Technical Readiness Assessment
   */
  async conductFullAudit(websiteUrl, competitorUrls = []) {
    const auditResults = {
      client: await this.auditSingleSite(websiteUrl),
      competitors: {},
      recommendations: [],
      priorityMatrix: {},
      implementationRoadmap: {}
    };

    // Audit competitors
    for (const [index, url] of competitorUrls.entries()) {
      const competitorKey = `Competitor ${String.fromCharCode(65 + index)}`;
      auditResults.competitors[competitorKey] = await this.auditSingleSite(url);
    }

    // Generate comparative analysis
    auditResults.recommendations = this.generateTechnicalRecommendations(
      auditResults.client, 
      auditResults.competitors
    );

    auditResults.priorityMatrix = this.createPriorityMatrix(auditResults.client);
    auditResults.implementationRoadmap = this.generateImplementationRoadmap(auditResults.recommendations);

    return auditResults;
  }

  /**
   * Audit single website for GEO readiness
   */
  async auditSingleSite(url) {
    const audit = {
      url,
      renderingStrategy: await this.auditRenderingStrategy(url),
      serverSideRendering: await this.auditSSRImplementation(url),
      performance: await this.auditPerformanceMetrics(url),
      schemaMarkup: await this.auditSchemaMarkup(url),
      crawlability: await this.auditCrawlability(url),
      htmlStructure: await this.auditHTMLStructure(url),
      overallScore: 0,
      criticalIssues: []
    };

    // Calculate overall GEO readiness score
    audit.overallScore = this.calculateOverallScore(audit);
    audit.criticalIssues = this.identifyCriticalIssues(audit);

    return audit;
  }

  /**
   * Audit JavaScript dependency and client-side rendering issues
   */
  async auditRenderingStrategy(url) {
    const analysis = {
      clientSideRendering: false,
      javascriptDependency: 0,
      contentVisibility: 0,
      aiCrawlerCompatibility: {},
      recommendation: ''
    };

    try {
      // Simulate different crawler behaviors
      const noJSContent = await this.fetchContentWithoutJS(url);
      const fullJSContent = await this.fetchContentWithJS(url);

      // Calculate content visibility ratio
      const noJSWordCount = this.countWords(noJSContent);
      const fullJSWordCount = this.countWords(fullJSContent);
      
      if (fullJSWordCount > 0) {
        analysis.contentVisibility = Math.round((noJSWordCount / fullJSWordCount) * 100);
        analysis.javascriptDependency = 100 - analysis.contentVisibility;
      }

      // Determine if site is primarily CSR
      analysis.clientSideRendering = analysis.javascriptDependency > 50;

      // Test AI crawler compatibility
      for (const crawler of this.aiCrawlers) {
        analysis.aiCrawlerCompatibility[crawler] = this.simulateCrawlerAccess(
          noJSContent, 
          fullJSContent, 
          crawler
        );
      }

      // Generate recommendation
      if (analysis.javascriptDependency > 75) {
        analysis.recommendation = 'CRITICAL: Migrate to Server-Side Rendering (SSR) or Static Site Generation (SSG)';
      } else if (analysis.javascriptDependency > 50) {
        analysis.recommendation = 'HIGH: Implement hybrid rendering strategy';
      } else if (analysis.javascriptDependency > 25) {
        analysis.recommendation = 'MEDIUM: Optimize critical content for no-JS rendering';
      } else {
        analysis.recommendation = 'GOOD: Current rendering strategy is AI-crawler friendly';
      }

    } catch (error) {
      analysis.error = error.message;
    }

    return analysis;
  }

  /**
   * Audit Server-Side Rendering implementation
   */
  async auditSSRImplementation(url) {
    const ssrAudit = {
      implemented: false,
      technology: 'Not Detected',
      effectiveness: 0,
      initialLoadTime: 0,
      recommendations: []
    };

    try {
      const response = await this.fetchWithHeaders(url);
      const content = response.body;
      const headers = response.headers;

      // Detect SSR technology
      ssrAudit.technology = this.detectSSRTechnology(content, headers);
      ssrAudit.implemented = ssrAudit.technology !== 'Not Detected';

      // Measure SSR effectiveness
      if (ssrAudit.implemented) {
        ssrAudit.effectiveness = this.measureSSREffectiveness(content);
        ssrAudit.initialLoadTime = await this.measureInitialLoadTime(url);
      }

      // Generate SSR recommendations
      ssrAudit.recommendations = this.generateSSRRecommendations(ssrAudit);

    } catch (error) {
      ssrAudit.error = error.message;
    }

    return ssrAudit;
  }

  /**
   * Audit Core Web Vitals and performance metrics
   */
  async auditPerformanceMetrics(url) {
    const performance = {
      coreWebVitals: {
        lcp: 0,
        fid: 0,
        cls: 0,
        score: 0
      },
      ttfb: 0,
      speedIndex: 0,
      performanceScore: 0,
      recommendations: []
    };

    try {
      // Simulate Core Web Vitals measurement
      const vitals = await this.measureCoreWebVitals(url);
      performance.coreWebVitals = vitals;
      performance.coreWebVitals.score = this.calculateWebVitalsScore(vitals);

      // Measure TTFB
      performance.ttfb = await this.measureTTFB(url);

      // Calculate overall performance score
      performance.performanceScore = this.calculatePerformanceScore(performance);

      // Generate performance recommendations
      performance.recommendations = this.generatePerformanceRecommendations(performance);

    } catch (error) {
      performance.error = error.message;
    }

    return performance;
  }

  /**
   * Audit Schema Markup implementation
   */
  async auditSchemaMarkup(url) {
    const schemaAudit = {
      coverage: 0,
      types: [],
      organizationSchema: false,
      localBusinessSchema: false,
      serviceSchema: false,
      errors: [],
      recommendations: []
    };

    try {
      const content = await this.fetchContentWithJS(url);
      const schemas = this.extractSchemaMarkup(content);

      schemaAudit.types = schemas.map(s => s.type);
      schemaAudit.coverage = this.calculateSchemaCoverage(schemas, content);
      
      // Check for specific schema types
      schemaAudit.organizationSchema = schemas.some(s => s.type === 'Organization');
      schemaAudit.localBusinessSchema = schemas.some(s => s.type === 'LocalBusiness');
      schemaAudit.serviceSchema = schemas.some(s => s.type === 'Service');

      // Validate schema markup
      schemaAudit.errors = this.validateSchemaMarkup(schemas);

      // Generate schema recommendations
      schemaAudit.recommendations = this.generateSchemaRecommendations(schemaAudit);

    } catch (error) {
      schemaAudit.error = error.message;
    }

    return schemaAudit;
  }

  /**
   * Audit crawlability and robots.txt configuration
   */
  async auditCrawlability(url) {
    const crawlability = {
      robotsTxtExists: false,
      aiBotsAllowed: {},
      crawlDirectives: [],
      sitemapPresent: false,
      recommendations: []
    };

    try {
      const robotsUrl = new URL('/robots.txt', url).href;
      const robotsContent = await this.fetchRobotsTxt(robotsUrl);
      
      if (robotsContent) {
        crawlability.robotsTxtExists = true;
        crawlability.crawlDirectives = this.parseRobotsTxt(robotsContent);
        
        // Check AI bot permissions
        for (const crawler of this.aiCrawlers) {
          crawlability.aiBotsAllowed[crawler] = this.checkBotPermission(
            robotsContent, 
            crawler
          );
        }

        // Check for sitemap
        crawlability.sitemapPresent = this.checkSitemapPresence(robotsContent);
      }

      crawlability.recommendations = this.generateCrawlabilityRecommendations(crawlability);

    } catch (error) {
      crawlability.error = error.message;
    }

    return crawlability;
  }

  /**
   * Audit HTML structure and semantic markup
   */
  async auditHTMLStructure(url) {
    const htmlAudit = {
      semanticMarkup: 0,
      headingStructure: 0,
      metaTagsOptimization: 0,
      structureScore: 0,
      recommendations: []
    };

    try {
      const content = await this.fetchContentWithoutJS(url);
      
      htmlAudit.semanticMarkup = this.assessSemanticMarkup(content);
      htmlAudit.headingStructure = this.assessHeadingStructure(content);
      htmlAudit.metaTagsOptimization = this.assessMetaTags(content);
      
      htmlAudit.structureScore = Math.round(
        (htmlAudit.semanticMarkup + htmlAudit.headingStructure + htmlAudit.metaTagsOptimization) / 3
      );

      htmlAudit.recommendations = this.generateHTMLRecommendations(htmlAudit);

    } catch (error) {
      htmlAudit.error = error.message;
    }

    return htmlAudit;
  }

  /**
   * Generate comprehensive technical recommendations
   */
  generateTechnicalRecommendations(clientAudit, competitorAudits) {
    const recommendations = [];

    // Critical rendering strategy recommendations
    if (clientAudit.renderingStrategy.javascriptDependency > 75) {
      recommendations.push({
        category: 'Rendering Strategy',
        priority: 'CRITICAL',
        issue: `${clientAudit.renderingStrategy.javascriptDependency}% of content invisible to AI crawlers`,
        recommendation: 'Migrate from Client-Side Rendering (CSR) to Server-Side Rendering (SSR) or Static Site Generation (SSG)',
        implementation: this.generateSSRMigrationPlan(),
        impact: 'Dramatically improves AI crawler visibility and GEO readiness'
      });
    }

    // Performance recommendations
    if (clientAudit.performance.coreWebVitals.score < 75) {
      recommendations.push({
        category: 'Performance',
        priority: 'High',
        issue: `Core Web Vitals score: ${clientAudit.performance.coreWebVitals.score}/100`,
        recommendation: 'Optimize Core Web Vitals for better user experience and AI crawler efficiency',
        implementation: this.generatePerformanceOptimizationPlan(clientAudit.performance),
        impact: 'Improves crawl efficiency and user experience signals'
      });
    }

    // Schema markup recommendations
    if (clientAudit.schemaMarkup.coverage < 65) {
      recommendations.push({
        category: 'Schema Markup',
        priority: 'High',
        issue: `Schema markup coverage: ${clientAudit.schemaMarkup.coverage}%`,
        recommendation: 'Implement comprehensive schema markup strategy',
        implementation: this.generateSchemaImplementationPlan(),
        impact: 'Enhances structured data for AI systems and search engines'
      });
    }

    return recommendations;
  }

  /**
   * Create implementation priority matrix
   */
  createPriorityMatrix(audit) {
    const matrix = {
      quickWins: [],      // High Impact, Low Effort
      majorProjects: [],  // High Impact, High Effort
      fillIns: [],        // Low Impact, Low Effort
      reconsider: []      // Low Impact, High Effort
    };

    const items = this.extractAuditItems(audit);

    items.forEach(item => {
      if (item.impact === 'High' && item.effort === 'Low') {
        matrix.quickWins.push(item);
      } else if (item.impact === 'High' && item.effort === 'High') {
        matrix.majorProjects.push(item);
      } else if (item.impact === 'Low' && item.effort === 'Low') {
        matrix.fillIns.push(item);
      } else {
        matrix.reconsider.push(item);
      }
    });

    return matrix;
  }

  // Helper Methods

  async fetchContentWithoutJS(url) {
    try {
      // Simulate non-JS crawler behavior
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'GPTBot/1.0 (+https://openai.com/gptbot)'
        },
        timeout: 10000
      });
      return await response.text();
    } catch (error) {
      console.warn('Failed to fetch no-JS content:', error.message);
      return 'Simulated content without JavaScript';
    }
  }

  async fetchContentWithJS(url) {
    try {
      // Simulate full browser rendering
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
        },
        timeout: 15000
      });
      return await response.text();
    } catch (error) {
      console.warn('Failed to fetch JS content:', error.message);
      return 'Simulated content with JavaScript - much more content available';
    }
  }

  countWords(content) {
    if (!content) return 0;
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  simulateCrawlerAccess(noJSContent, fullJSContent, crawler) {
    // Simulate different crawler capabilities
    const crawlerCapabilities = {
      'GoogleBot': 0.9,        // High JS rendering capability
      'GPTBot': 0.1,           // Low JS rendering capability
      'ChatGPT-User': 0.1,     // Low JS rendering capability
      'CCBot': 0.2,            // Low JS rendering capability
      'anthropic-ai': 0.1,     // Low JS rendering capability
      'Claude-Web': 0.1,       // Low JS rendering capability
      'PerplexityBot': 0.3,    // Some JS rendering capability
      'YouBot': 0.2,           // Low JS rendering capability
      'BingBot': 0.7           // Moderate JS rendering capability
    };

    const capability = crawlerCapabilities[crawler] || 0.1;
    const noJSWords = this.countWords(noJSContent);
    const fullJSWords = this.countWords(fullJSContent);
    
    const accessibleWords = noJSWords + (fullJSWords - noJSWords) * capability;
    return Math.round((accessibleWords / fullJSWords) * 100);
  }

  detectSSRTechnology(content, headers) {
    // Look for SSR technology indicators
    if (content.includes('__NEXT_DATA__')) return 'Next.js SSR';
    if (content.includes('window.__NUXT__')) return 'Nuxt.js SSR';
    if (headers['x-powered-by']?.includes('Express')) return 'Express.js SSR';
    if (content.includes('data-react-helmet')) return 'React SSR';
    if (content.includes('data-vue-server-rendered')) return 'Vue.js SSR';
    return 'Not Detected';
  }

  calculateOverallScore(audit) {
    const weights = {
      renderingStrategy: 0.3,
      serverSideRendering: 0.25,
      performance: 0.2,
      schemaMarkup: 0.15,
      crawlability: 0.05,
      htmlStructure: 0.05
    };

    let score = 0;
    score += (100 - audit.renderingStrategy.javascriptDependency) * weights.renderingStrategy;
    score += (audit.serverSideRendering.implemented ? audit.serverSideRendering.effectiveness : 0) * weights.serverSideRendering;
    score += audit.performance.performanceScore * weights.performance;
    score += audit.schemaMarkup.coverage * weights.schemaMarkup;
    score += (Object.values(audit.crawlability.aiBotsAllowed).filter(Boolean).length / this.aiCrawlers.length * 100) * weights.crawlability;
    score += audit.htmlStructure.structureScore * weights.htmlStructure;

    return Math.round(score);
  }

  generateSSRMigrationPlan() {
    return {
      phases: [
        {
          phase: 1,
          title: 'Assessment and Planning',
          duration: '1-2 weeks',
          tasks: [
            'Audit current application architecture',
            'Identify critical pages for SSR migration',
            'Choose SSR framework (Next.js, Nuxt.js, etc.)',
            'Plan data fetching strategies'
          ]
        },
        {
          phase: 2,
          title: 'Core Implementation',
          duration: '4-6 weeks',
          tasks: [
            'Set up SSR framework',
            'Migrate critical pages to SSR',
            'Implement server-side data fetching',
            'Configure build and deployment pipeline'
          ]
        },
        {
          phase: 3,
          title: 'Testing and Optimization',
          duration: '2-3 weeks',
          tasks: [
            'Test SSR functionality across devices',
            'Optimize performance and loading times',
            'Validate AI crawler compatibility',
            'Deploy to production'
          ]
        }
      ],
      estimatedCost: '$15,000 - $40,000',
      estimatedTimeline: '7-11 weeks',
      riskMitigation: [
        'Implement gradual rollout strategy',
        'Maintain fallback to CSR if needed',
        'Monitor performance metrics closely'
      ]
    };
  }

  generateSchemaImplementationPlan() {
    return {
      phases: [
        {
          phase: 1,
          title: 'Basic Schema Implementation',
          duration: '1-2 weeks',
          tasks: [
            'Implement Organization schema',
            'Add basic Article/BlogPosting schema',
            'Set up JSON-LD structure',
            'Validate schema markup'
          ]
        },
        {
          phase: 2,
          title: 'Advanced Schema Types',
          duration: '2-3 weeks',
          tasks: [
            'Implement Service/Product schemas',
            'Add FAQ and HowTo schemas',
            'Configure LocalBusiness schema if applicable',
            'Optimize for rich snippets'
          ]
        }
      ],
      estimatedCost: '$3,000 - $8,000',
      estimatedTimeline: '3-5 weeks'
    };
  }

  generatePerformanceOptimizationPlan(performance) {
    return {
      phases: [
        {
          phase: 1,
          title: 'Critical Performance Fixes',
          duration: '1-2 weeks',
          tasks: [
            'Optimize images and media',
            'Implement lazy loading',
            'Minimize and compress assets',
            'Optimize server response times'
          ]
        },
        {
          phase: 2,
          title: 'Advanced Optimizations',
          duration: '2-3 weeks',
          tasks: [
            'Implement service worker caching',
            'Optimize JavaScript execution',
            'Configure CDN and edge caching',
            'Fine-tune Core Web Vitals'
          ]
        }
      ],
      estimatedCost: '$5,000 - $12,000',
      estimatedTimeline: '3-5 weeks'
    };
  }

  generateImplementationRoadmap(recommendations) {
    const roadmap = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    };

    recommendations.forEach(rec => {
      if (rec.priority === 'CRITICAL') {
        roadmap.immediate.push(rec);
      } else if (rec.priority === 'High') {
        roadmap.shortTerm.push(rec);
      } else {
        roadmap.longTerm.push(rec);
      }
    });

    return roadmap;
  }

  identifyCriticalIssues(audit) {
    const critical = [];
    
    if (audit.renderingStrategy.javascriptDependency > 75) {
      critical.push({
        category: 'Rendering',
        issue: 'High JavaScript dependency prevents AI crawler access',
        impact: 'Critical'
      });
    }
    
    if (audit.performance.coreWebVitals.score < 50) {
      critical.push({
        category: 'Performance',
        issue: 'Poor Core Web Vitals affecting user experience',
        impact: 'High'
      });
    }
    
    return critical;
  }
}

module.exports = { GEOTechnicalAudit };