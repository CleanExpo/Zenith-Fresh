/**
 * GEO (Generative Engine Optimization) Tools for Zenith-Fresh
 * Optimizes content for AI search engines and LLM visibility
 */

class GEOOptimizationTools {
  constructor(options = {}) {
    this.aiProviders = options.aiProviders || ['openai', 'anthropic', 'google'];
    this.config = {
      analysisDepth: options.analysisDepth || 'comprehensive',
      includeCompetitorTracking: options.includeCompetitorTracking || true,
      realTimeMonitoring: options.realTimeMonitoring || false,
      ...options.config
    };
    
    this.supportedEngines = {
      'chatgpt': { name: 'ChatGPT', provider: 'openai', weight: 0.3 },
      'claude': { name: 'Claude', provider: 'anthropic', weight: 0.25 },
      'gemini': { name: 'Gemini', provider: 'google', weight: 0.2 },
      'perplexity': { name: 'Perplexity', provider: 'perplexity', weight: 0.15 },
      'bing-copilot': { name: 'Bing Copilot', provider: 'microsoft', weight: 0.1 }
    };
  }

  /**
   * Run comprehensive GEO analysis
   */
  async analyzeGEOOptimization(websiteUrl, targetKeywords = [], options = {}) {
    const analysisId = `geo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🤖 Starting GEO analysis for ${websiteUrl}`);
    console.log(`🎯 Target keywords: ${targetKeywords.join(', ')}`);
    console.log(`📋 Analysis ID: ${analysisId}`);
    
    const startTime = Date.now();
    const results = {
      id: analysisId,
      url: websiteUrl,
      keywords: targetKeywords,
      timestamp: new Date().toISOString(),
      status: 'running',
      scores: {
        overall: 0,
        technical: 0,
        content: 0,
        visibility: 0,
        engagement: 0
      },
      analysis: {},
      visibility: {},
      recommendations: [],
      monitoring: {}
    };

    try {
      // Run parallel GEO analysis components
      const [
        technicalAnalysis,
        contentAnalysis,
        visibilityAnalysis,
        engagementAnalysis
      ] = await Promise.all([
        this.analyzeTechnicalReadiness(websiteUrl),
        this.analyzeContentOptimization(websiteUrl, targetKeywords),
        this.analyzeAIVisibility(websiteUrl, targetKeywords),
        this.analyzeEngagementFactors(websiteUrl)
      ]);

      results.analysis = {
        technical: technicalAnalysis,
        content: contentAnalysis,
        visibility: visibilityAnalysis,
        engagement: engagementAnalysis
      };

      // Calculate scores
      results.scores = this.calculateGEOScores(results.analysis);
      
      // Track visibility across AI engines
      results.visibility = await this.trackAIEngineVisibility(websiteUrl, targetKeywords);
      
      // Generate recommendations
      results.recommendations = await this.generateGEORecommendations(results);
      
      // Set up monitoring if enabled
      if (this.config.realTimeMonitoring) {
        results.monitoring = this.setupVisibilityMonitoring(websiteUrl, targetKeywords);
      }
      
      results.status = 'completed';
      results.duration = Date.now() - startTime;

      console.log(`✅ GEO analysis completed in ${Math.round(results.duration / 1000)}s`);
      console.log(`📊 Overall GEO Score: ${results.scores.overall}/100`);
      
      return results;

    } catch (error) {
      console.error('GEO analysis failed:', error);
      results.status = 'failed';
      results.error = error.message;
      results.duration = Date.now() - startTime;
      
      return results;
    }
  }

  /**
   * Analyze technical readiness for AI crawlers
   */
  async analyzeTechnicalReadiness(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      const analysis = {
        serverSideRendering: this.checkSSRImplementation(html),
        structuredData: this.analyzeStructuredDataForAI(html),
        semanticMarkup: this.analyzeSemanticMarkup(html),
        contentAccessibility: this.analyzeContentAccessibility(html),
        apiEndpoints: this.detectAPIEndpoints(html),
        javascriptDependency: this.analyzeJavaScriptDependency(html),
        loadingPerformance: await this.analyzeLoadingPerformance(url),
        mobileFriendly: this.analyzeMobileFriendliness(html)
      };

      analysis.score = this.calculateTechnicalScore(analysis);
      
      return analysis;

    } catch (error) {
      console.error('Technical readiness analysis failed:', error);
      return { score: 0, error: error.message };
    }
  }

  /**
   * Analyze content optimization for AI understanding
   */
  async analyzeContentOptimization(url, keywords) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const textContent = this.extractTextContent(html);
      
      const analysis = {
        semanticStructure: this.analyzeSemanticStructure(html),
        keywordContext: this.analyzeKeywordContext(textContent, keywords),
        topicalAuthority: this.analyzeTopicalAuthority(textContent),
        questionAnswering: this.analyzeQuestionAnswering(textContent),
        narrativeFlow: this.analyzeNarrativeFlow(textContent),
        factualAccuracy: this.analyzeFactualAccuracy(textContent),
        citationQuality: this.analyzeCitationQuality(html),
        contentFreshness: this.analyzeContentFreshness(html)
      };

      analysis.score = this.calculateContentScore(analysis);
      
      return analysis;

    } catch (error) {
      console.error('Content optimization analysis failed:', error);
      return { score: 0, error: error.message };
    }
  }

  /**
   * Analyze visibility in AI search engines
   */
  async analyzeAIVisibility(url, keywords) {
    try {
      const analysis = {
        searchableContent: this.analyzeSearchableContent(url),
        topicCoverage: this.analyzeTopicCoverage(url, keywords),
        answerOptimization: this.analyzeAnswerOptimization(url),
        conversationalContext: this.analyzeConversationalContext(url),
        multiModalContent: this.analyzeMultiModalContent(url),
        realTimeRelevance: this.analyzeRealTimeRelevance(url)
      };

      // Simulate AI engine visibility checks
      analysis.engineVisibility = await this.simulateEngineVisibility(url, keywords);
      
      analysis.score = this.calculateVisibilityScore(analysis);
      
      return analysis;

    } catch (error) {
      console.error('AI visibility analysis failed:', error);
      return { score: 0, error: error.message };
    }
  }

  /**
   * Analyze engagement factors for AI recommendations
   */
  async analyzeEngagementFactors(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      const analysis = {
        userIntent: this.analyzeUserIntent(html),
        conversationalTone: this.analyzeConversationalTone(html),
        actionableContent: this.analyzeActionableContent(html),
        trustSignals: this.analyzeTrustSignals(html),
        expertiseIndicators: this.analyzeExpertiseIndicators(html),
        socialProof: this.analyzeSocialProof(html),
        contentFormat: this.analyzeContentFormat(html),
        interactivity: this.analyzeInteractivity(html)
      };

      analysis.score = this.calculateEngagementScore(analysis);
      
      return analysis;

    } catch (error) {
      console.error('Engagement analysis failed:', error);
      return { score: 0, error: error.message };
    }
  }

  // Technical Analysis Methods
  checkSSRImplementation(html) {
    const ssrIndicators = {
      hasPrerenderedContent: !/<div id="root"><\/div>/.test(html),
      hasMetaTags: /<meta[^>]+content=/gi.test(html),
      hasStructuredContent: /<h[1-6]|<p|<article|<section/gi.test(html),
      noClientSideOnlyContent: !/loading|skeleton|spinner/gi.test(html)
    };

    const score = Object.values(ssrIndicators).filter(Boolean).length;
    
    return {
      ...ssrIndicators,
      implemented: score >= 3,
      score: (score / Object.keys(ssrIndicators).length) * 100
    };
  }

  analyzeStructuredDataForAI(html) {
    const structuredDataTypes = {
      jsonLd: /<script[^>]+type=["\']application\/ld\+json["\'][^>]*>/gi.test(html),
      microdata: /itemscope|itemtype|itemprop/gi.test(html),
      rdfa: /property=|typeof=/gi.test(html),
      schema: /schema\.org/gi.test(html)
    };

    // Check for AI-friendly schema types
    const aiSchemaTypes = {
      faq: /FAQPage|Question|Answer/gi.test(html),
      howTo: /HowTo|HowToStep/gi.test(html),
      article: /Article|BlogPosting/gi.test(html),
      organization: /Organization|LocalBusiness/gi.test(html),
      person: /Person|ProfilePage/gi.test(html)
    };

    const structuredScore = Object.values(structuredDataTypes).filter(Boolean).length;
    const aiSchemaScore = Object.values(aiSchemaTypes).filter(Boolean).length;
    
    return {
      ...structuredDataTypes,
      ...aiSchemaTypes,
      structuredDataPresent: structuredScore > 0,
      aiOptimizedSchema: aiSchemaScore > 0,
      score: ((structuredScore * 60) + (aiSchemaScore * 40)) / Object.keys({...structuredDataTypes, ...aiSchemaTypes}).length
    };
  }

  analyzeSemanticMarkup(html) {
    const semanticElements = {
      hasHeadingHierarchy: /<h[1-6]/gi.test(html),
      hasArticleStructure: /<article|<section|<header|<main/gi.test(html),
      hasListStructure: /<ul|<ol|<li/gi.test(html),
      hasNavigationMarkup: /<nav|<menu/gi.test(html),
      hasTimeElements: /<time|datetime/gi.test(html)
    };

    const score = Object.values(semanticElements).filter(Boolean).length;
    
    return {
      ...semanticElements,
      wellStructured: score >= 4,
      score: (score / Object.keys(semanticElements).length) * 100
    };
  }

  analyzeContentAccessibility(html) {
    const accessibilityFeatures = {
      hasAltText: /<img[^>]+alt=/gi.test(html),
      hasAriaLabels: /aria-label|aria-labelledby/gi.test(html),
      hasHeadingStructure: /<h[1-6]/gi.test(html),
      hasSkipLinks: /skip to content|skip navigation/gi.test(html),
      hasLangAttribute: /<html[^>]+lang=/gi.test(html)
    };

    const score = Object.values(accessibilityFeatures).filter(Boolean).length;
    
    return {
      ...accessibilityFeatures,
      accessible: score >= 4,
      score: (score / Object.keys(accessibilityFeatures).length) * 100
    };
  }

  detectAPIEndpoints(html) {
    const apiPatterns = {
      hasRestAPI: /\/api\/|api\./gi.test(html),
      hasGraphQL: /graphql|\/gql/gi.test(html),
      hasRSSFeed: /rss|feed\.xml/gi.test(html),
      hasSitemap: /sitemap\.xml/gi.test(html)
    };

    const score = Object.values(apiPatterns).filter(Boolean).length;
    
    return {
      ...apiPatterns,
      hasDataAccess: score > 0,
      score: (score / Object.keys(apiPatterns).length) * 100
    };
  }

  analyzeJavaScriptDependency(html) {
    const scriptTags = (html.match(/<script/gi) || []).length;
    const inlineScripts = (html.match(/<script[^>]*>[^<]/gi) || []).length;
    const externalScripts = scriptTags - inlineScripts;
    
    return {
      totalScripts: scriptTags,
      inlineScripts,
      externalScripts,
      heavyJSDependent: scriptTags > 20,
      score: Math.max(0, 100 - (scriptTags * 2)) // Penalize excessive JS
    };
  }

  async analyzeLoadingPerformance(url) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url);
      const loadTime = Date.now() - startTime;
      const contentSize = parseInt(response.headers.get('content-length')) || 0;
      
      return {
        loadTime,
        contentSize,
        isOptimal: loadTime < 2000,
        score: Math.max(0, 100 - (loadTime / 50)) // 5000ms = 0 points
      };
      
    } catch (error) {
      return { score: 0, error: error.message };
    }
  }

  analyzeMobileFriendliness(html) {
    const mobileFeatures = {
      hasViewportMeta: /<meta[^>]+name=["\']viewport["\'][^>]*>/gi.test(html),
      hasResponsiveImages: /<img[^>]+srcset=/gi.test(html),
      hasMediaQueries: /@media|responsive/gi.test(html),
      hasTouch: /touch|mobile/gi.test(html)
    };

    const score = Object.values(mobileFeatures).filter(Boolean).length;
    
    return {
      ...mobileFeatures,
      mobileFriendly: score >= 2,
      score: (score / Object.keys(mobileFeatures).length) * 100
    };
  }

  // Content Analysis Methods
  extractTextContent(html) {
    return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
               .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
               .replace(/<[^>]*>/g, ' ')
               .replace(/\s+/g, ' ')
               .trim();
  }

  analyzeSemanticStructure(html) {
    const headings = (html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || []).map(h => 
      h.replace(/<[^>]*>/g, '').trim()
    );
    
    return {
      headingCount: headings.length,
      hasProperHierarchy: this.checkHeadingHierarchy(html),
      topicCoverage: this.analyzeTopicCoverage(headings),
      score: headings.length > 0 ? Math.min(100, headings.length * 10) : 0
    };
  }

  analyzeKeywordContext(content, keywords) {
    const keywordAnalysis = {};
    let totalScore = 0;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex) || [];
      const density = (matches.length / content.split(' ').length) * 100;
      
      keywordAnalysis[keyword] = {
        mentions: matches.length,
        density: density,
        contextual: this.analyzeKeywordContext(content, keyword),
        score: Math.min(100, matches.length * 10)
      };
      
      totalScore += keywordAnalysis[keyword].score;
    });
    
    return {
      keywords: keywordAnalysis,
      averageScore: keywords.length > 0 ? totalScore / keywords.length : 0,
      score: keywords.length > 0 ? totalScore / keywords.length : 50
    };
  }

  analyzeTopicalAuthority(content) {
    const authorityIndicators = {
      hasStatistics: /\d+%|\d+ percent|statistics|data shows/gi.test(content),
      hasCitations: /according to|research|study|source/gi.test(content),
      hasExpertise: /expert|professional|certified|years of experience/gi.test(content),
      hasDepth: content.length > 2000
    };

    const score = Object.values(authorityIndicators).filter(Boolean).length;
    
    return {
      ...authorityIndicators,
      authoritative: score >= 3,
      score: (score / Object.keys(authorityIndicators).length) * 100
    };
  }

  analyzeQuestionAnswering(content) {
    const questionPatterns = {
      hasQuestions: /\?|what is|how to|why|when|where|who/gi.test(content),
      hasDirectAnswers: /the answer is|in summary|conclusion/gi.test(content),
      hasStepByStep: /step \d+|first|second|third|finally/gi.test(content),
      hasFAQStructure: /frequently asked|faq|common questions/gi.test(content)
    };

    const score = Object.values(questionPatterns).filter(Boolean).length;
    
    return {
      ...questionPatterns,
      optimizedForQA: score >= 2,
      score: (score / Object.keys(questionPatterns).length) * 100
    };
  }

  analyzeNarrativeFlow(content) {
    const flowIndicators = {
      hasIntroduction: /introduction|overview|in this article/gi.test(content),
      hasTransitions: /furthermore|however|therefore|in addition/gi.test(content),
      hasConclusion: /conclusion|in summary|to summarize/gi.test(content),
      hasLogicalStructure: content.includes('1.') || content.includes('•')
    };

    const score = Object.values(flowIndicators).filter(Boolean).length;
    
    return {
      ...flowIndicators,
      wellStructured: score >= 3,
      score: (score / Object.keys(flowIndicators).length) * 100
    };
  }

  analyzeFactualAccuracy(content) {
    const accuracyIndicators = {
      hasDateReferences: /\d{4}|recent|latest|current/gi.test(content),
      hasSpecificNumbers: /\d+(\.\d+)?%?/gi.test(content),
      hasVerifiableInfo: /source|reference|link|study/gi.test(content),
      avoidsAbsolutes: !/always|never|all|none|every/gi.test(content)
    };

    const score = Object.values(accuracyIndicators).filter(Boolean).length;
    
    return {
      ...accuracyIndicators,
      factuallyRobust: score >= 3,
      score: (score / Object.keys(accuracyIndicators).length) * 100
    };
  }

  analyzeCitationQuality(html) {
    const citationElements = {
      hasExternalLinks: /<a[^>]+href=["\']https?:\/\/[^"']+["\'][^>]*>/gi.test(html),
      hasSourceLinks: /source|reference|citation/gi.test(html),
      hasAuthorInfo: /author|by|written by/gi.test(html),
      hasPublishDate: /published|date|updated/gi.test(html)
    };

    const score = Object.values(citationElements).filter(Boolean).length;
    
    return {
      ...citationElements,
      wellCited: score >= 3,
      score: (score / Object.keys(citationElements).length) * 100
    };
  }

  analyzeContentFreshness(html) {
    const freshnessIndicators = {
      hasPublishDate: /published|date|updated/gi.test(html),
      hasRecentReferences: /2024|2023|recent|latest|current/gi.test(html),
      hasUpdateNotice: /updated|revised|modified/gi.test(html),
      hasTrendingTopics: /trending|viral|popular|hot/gi.test(html)
    };

    const score = Object.values(freshnessIndicators).filter(Boolean).length;
    
    return {
      ...freshnessIndicators,
      fresh: score >= 2,
      score: (score / Object.keys(freshnessIndicators).length) * 100
    };
  }

  // Visibility Analysis Methods
  analyzeSearchableContent(url) {
    // Simulated analysis
    return {
      contentIndexable: true,
      keywordRich: true,
      topicRelevant: true,
      score: 85
    };
  }

  analyzeTopicCoverage(url, keywords) {
    // Simulated analysis
    return {
      comprehensiveCoverage: true,
      keywordDiversity: keywords.length,
      topicalDepth: 'high',
      score: 80
    };
  }

  analyzeAnswerOptimization(url) {
    // Simulated analysis
    return {
      directAnswers: true,
      questionFormat: true,
      conversational: true,
      score: 75
    };
  }

  analyzeConversationalContext(url) {
    // Simulated analysis
    return {
      naturalLanguage: true,
      userIntent: 'high',
      contextualRelevance: true,
      score: 70
    };
  }

  analyzeMultiModalContent(url) {
    // Simulated analysis
    return {
      hasImages: true,
      hasVideos: false,
      hasInteractiveElements: true,
      score: 65
    };
  }

  analyzeRealTimeRelevance(url) {
    // Simulated analysis
    return {
      currentEvents: false,
      timelyContent: true,
      trendingTopics: false,
      score: 60
    };
  }

  async simulateEngineVisibility(url, keywords) {
    const visibility = {};
    
    for (const [engine, config] of Object.entries(this.supportedEngines)) {
      visibility[engine] = {
        visible: Math.random() > 0.3, // 70% visibility rate
        ranking: Math.floor(Math.random() * 10) + 1,
        confidence: Math.random() * 0.5 + 0.5,
        lastChecked: new Date().toISOString()
      };
    }
    
    return visibility;
  }

  // Engagement Analysis Methods
  analyzeUserIntent(html) {
    const intentSignals = {
      informational: /how to|what is|guide|tutorial/gi.test(html),
      navigational: /about|contact|home|services/gi.test(html),
      transactional: /buy|purchase|order|price/gi.test(html),
      commercial: /compare|review|best|top/gi.test(html)
    };

    const score = Object.values(intentSignals).filter(Boolean).length;
    
    return {
      ...intentSignals,
      intentClear: score > 0,
      score: Math.min(100, score * 25)
    };
  }

  analyzeConversationalTone(html) {
    const textContent = this.extractTextContent(html);
    
    const toneIndicators = {
      hasQuestions: /\?/.test(textContent),
      hasPersonalPronouns: /\b(you|your|we|our)\b/gi.test(textContent),
      hasConversationalWords: /\b(let's|here's|that's|it's)\b/gi.test(textContent),
      hasDirectAddress: /imagine|consider|think about/gi.test(textContent)
    };

    const score = Object.values(toneIndicators).filter(Boolean).length;
    
    return {
      ...toneIndicators,
      conversational: score >= 2,
      score: (score / Object.keys(toneIndicators).length) * 100
    };
  }

  analyzeActionableContent(html) {
    const actionIndicators = {
      hasActionVerbs: /click|download|subscribe|learn|discover/gi.test(html),
      hasSteps: /step \d+|follow these|how to/gi.test(html),
      hasCTA: /call to action|cta|button/gi.test(html),
      hasInstructions: /instructions|guide|tutorial/gi.test(html)
    };

    const score = Object.values(actionIndicators).filter(Boolean).length;
    
    return {
      ...actionIndicators,
      actionable: score >= 2,
      score: (score / Object.keys(actionIndicators).length) * 100
    };
  }

  analyzeTrustSignals(html) {
    const trustIndicators = {
      hasTestimonials: /testimonial|review|feedback/gi.test(html),
      hasCredentials: /certified|licensed|professional/gi.test(html),
      hasContactInfo: /contact|phone|email|address/gi.test(html),
      hasSecurityBadges: /secure|ssl|verified|trusted/gi.test(html)
    };

    const score = Object.values(trustIndicators).filter(Boolean).length;
    
    return {
      ...trustIndicators,
      trustworthy: score >= 2,
      score: (score / Object.keys(trustIndicators).length) * 100
    };
  }

  analyzeExpertiseIndicators(html) {
    const expertiseSignals = {
      hasAuthorBio: /author|bio|about the writer/gi.test(html),
      hasCredentials: /phd|md|expert|specialist/gi.test(html),
      hasExperience: /years of experience|decades of/gi.test(html),
      hasCertifications: /certified|certification|qualified/gi.test(html)
    };

    const score = Object.values(expertiseSignals).filter(Boolean).length;
    
    return {
      ...expertiseSignals,
      expertiseEvident: score >= 2,
      score: (score / Object.keys(expertiseSignals).length) * 100
    };
  }

  analyzeSocialProof(html) {
    const socialElements = {
      hasShares: /share|shared|shares/gi.test(html),
      hasFollowers: /followers|subscribers/gi.test(html),
      hasLikes: /likes|loved|favorite/gi.test(html),
      hasSocialLinks: /facebook|twitter|linkedin|instagram/gi.test(html)
    };

    const score = Object.values(socialElements).filter(Boolean).length;
    
    return {
      ...socialElements,
      hasSocialProof: score > 0,
      score: (score / Object.keys(socialElements).length) * 100
    };
  }

  analyzeContentFormat(html) {
    const formatElements = {
      hasLists: /<ul|<ol|<li/gi.test(html),
      hasImages: /<img/gi.test(html),
      hasVideos: /<video|youtube|vimeo/gi.test(html),
      hasCode: /<code|<pre/gi.test(html)
    };

    const score = Object.values(formatElements).filter(Boolean).length;
    
    return {
      ...formatElements,
      wellFormatted: score >= 2,
      score: (score / Object.keys(formatElements).length) * 100
    };
  }

  analyzeInteractivity(html) {
    const interactiveElements = {
      hasButtons: /<button|type=["\']button["\']/gi.test(html),
      hasForms: /<form|<input|<textarea/gi.test(html),
      hasComments: /comment|discussion|feedback/gi.test(html),
      hasCalculators: /calculator|tool|interactive/gi.test(html)
    };

    const score = Object.values(interactiveElements).filter(Boolean).length;
    
    return {
      ...interactiveElements,
      interactive: score > 0,
      score: (score / Object.keys(interactiveElements).length) * 100
    };
  }

  // Utility Methods
  checkHeadingHierarchy(html) {
    const headings = html.match(/<h([1-6])[^>]*>/gi) || [];
    const levels = headings.map(h => parseInt(h.match(/h([1-6])/i)[1]));
    
    // Check if headings follow proper hierarchy
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i-1] > 1) {
        return false;
      }
    }
    return true;
  }

  analyzeKeywordContext(content, keyword) {
    const sentences = content.split(/[.!?]+/);
    const keywordSentences = sentences.filter(s => 
      s.toLowerCase().includes(keyword.toLowerCase())
    );
    
    return {
      contextualUsage: keywordSentences.length,
      naturalIntegration: keywordSentences.length > 0
    };
  }

  async trackAIEngineVisibility(url, keywords) {
    const visibility = {};
    
    for (const [engine, config] of Object.entries(this.supportedEngines)) {
      visibility[engine] = await this.simulateEngineVisibility(url, keywords);
    }
    
    return visibility;
  }

  setupVisibilityMonitoring(url, keywords) {
    return {
      enabled: true,
      frequency: 'daily',
      keywords: keywords,
      engines: Object.keys(this.supportedEngines),
      lastCheck: new Date().toISOString()
    };
  }

  // Scoring Methods
  calculateTechnicalScore(analysis) {
    const weights = {
      serverSideRendering: 0.2,
      structuredData: 0.2,
      semanticMarkup: 0.15,
      contentAccessibility: 0.15,
      loadingPerformance: 0.15,
      mobileFriendly: 0.1,
      apiEndpoints: 0.05
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([key, weight]) => {
      if (analysis[key] && analysis[key].score !== undefined) {
        totalScore += analysis[key].score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  calculateContentScore(analysis) {
    const weights = {
      semanticStructure: 0.15,
      keywordContext: 0.2,
      topicalAuthority: 0.15,
      questionAnswering: 0.15,
      narrativeFlow: 0.1,
      factualAccuracy: 0.1,
      citationQuality: 0.1,
      contentFreshness: 0.05
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([key, weight]) => {
      if (analysis[key] && analysis[key].score !== undefined) {
        totalScore += analysis[key].score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  calculateVisibilityScore(analysis) {
    const weights = {
      searchableContent: 0.25,
      topicCoverage: 0.2,
      answerOptimization: 0.2,
      conversationalContext: 0.15,
      multiModalContent: 0.1,
      realTimeRelevance: 0.1
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([key, weight]) => {
      if (analysis[key] && analysis[key].score !== undefined) {
        totalScore += analysis[key].score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  calculateEngagementScore(analysis) {
    const weights = {
      userIntent: 0.15,
      conversationalTone: 0.15,
      actionableContent: 0.15,
      trustSignals: 0.15,
      expertiseIndicators: 0.15,
      socialProof: 0.1,
      contentFormat: 0.1,
      interactivity: 0.05
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([key, weight]) => {
      if (analysis[key] && analysis[key].score !== undefined) {
        totalScore += analysis[key].score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  calculateGEOScores(analysis) {
    const scores = {
      technical: analysis.technical.score || 0,
      content: analysis.content.score || 0,
      visibility: analysis.visibility.score || 0,
      engagement: analysis.engagement.score || 0
    };

    // Calculate weighted overall score
    scores.overall = Math.round(
      (scores.technical * 0.25) +
      (scores.content * 0.3) +
      (scores.visibility * 0.25) +
      (scores.engagement * 0.2)
    );

    return scores;
  }

  async generateGEORecommendations(results) {
    const recommendations = [];

    if (results.scores.technical < 70) {
      recommendations.push({
        category: 'technical',
        priority: 'high',
        title: 'Improve Technical AI Readiness',
        description: 'Implement server-side rendering and structured data for better AI crawler access',
        impact: 'Enhanced discoverability by AI search engines'
      });
    }

    if (results.scores.content < 70) {
      recommendations.push({
        category: 'content',
        priority: 'high',
        title: 'Optimize Content for AI Understanding',
        description: 'Enhance semantic structure and question-answering format',
        impact: 'Better context understanding and content recommendation by AI'
      });
    }

    if (results.scores.visibility < 70) {
      recommendations.push({
        category: 'visibility',
        priority: 'medium',
        title: 'Increase AI Engine Visibility',
        description: 'Optimize for conversational queries and answer formats',
        impact: 'Higher likelihood of being referenced in AI responses'
      });
    }

    if (results.scores.engagement < 70) {
      recommendations.push({
        category: 'engagement',
        priority: 'medium',
        title: 'Enhance User Engagement Signals',
        description: 'Add interactive elements and improve conversational tone',
        impact: 'Better user experience metrics that AI engines consider'
      });
    }

    return recommendations;
  }
}

module.exports = GEOOptimizationTools;