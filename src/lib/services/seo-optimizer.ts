// src/lib/services/seo-optimizer.ts

interface SEOAnalysis {
  score: number;
  recommendations: SEORecommendation[];
  keywordDensity: Record<string, number>;
  metaTagsAnalysis: MetaTagsAnalysis;
  contentStructureAnalysis: ContentStructureAnalysis;
  technicalSEOIssues: TechnicalSEOIssue[];
}

interface SEORecommendation {
  type: 'critical' | 'important' | 'minor';
  category: 'keywords' | 'content' | 'technical' | 'meta' | 'structure';
  issue: string;
  recommendation: string;
  impact: number; // 1-10 scale
}

interface MetaTagsAnalysis {
  title: {
    length: number;
    hasKeyword: boolean;
    isOptimal: boolean;
    suggestions: string[];
  };
  description: {
    length: number;
    hasKeyword: boolean;
    isOptimal: boolean;
    suggestions: string[];
  };
  missing: string[];
  duplicate: string[];
}

interface ContentStructureAnalysis {
  headingStructure: HeadingAnalysis[];
  wordCount: number;
  readabilityScore: number;
  keywordDistribution: KeywordDistribution[];
  internalLinks: number;
  externalLinks: number;
}

interface HeadingAnalysis {
  level: number;
  text: string;
  hasKeyword: boolean;
  position: number;
}

interface KeywordDistribution {
  keyword: string;
  count: number;
  density: number;
  positions: number[];
  isOptimal: boolean;
}

interface TechnicalSEOIssue {
  type: 'performance' | 'accessibility' | 'mobile' | 'crawling';
  severity: 'low' | 'medium' | 'high' | 'critical';
  issue: string;
  fix: string;
}

export class SEOOptimizer {
  private targetKeywordDensity = { min: 1.0, max: 3.0 }; // Percentage
  private optimalTitleLength = { min: 30, max: 60 };
  private optimalDescriptionLength = { min: 120, max: 160 };
  private minWordCount = 300;

  constructor() {
    console.log('SEOOptimizer: Advanced SEO analysis and optimization system initialized');
  }

  /**
   * Comprehensive SEO analysis of content
   */
  async analyzeContent(
    content: string,
    title: string,
    metaDescription: string,
    targetKeywords: string[],
    url?: string
  ): Promise<SEOAnalysis> {
    try {
      console.log('SEOOptimizer: Starting comprehensive SEO analysis');

      // Keyword density analysis
      const keywordDensity = this.analyzeKeywordDensity(content, targetKeywords);

      // Meta tags analysis
      const metaTagsAnalysis = this.analyzeMetaTags(title, metaDescription, targetKeywords);

      // Content structure analysis
      const contentStructureAnalysis = this.analyzeContentStructure(content, targetKeywords);

      // Technical SEO issues
      const technicalSEOIssues = await this.identifyTechnicalIssues(content, url);

      // Generate recommendations
      const recommendations = this.generateSEORecommendations(
        keywordDensity,
        metaTagsAnalysis,
        contentStructureAnalysis,
        technicalSEOIssues
      );

      // Calculate overall SEO score
      const score = this.calculateSEOScore(
        keywordDensity,
        metaTagsAnalysis,
        contentStructureAnalysis,
        technicalSEOIssues
      );

      console.log(`SEOOptimizer: Analysis complete - SEO Score: ${score}/100`);

      return {
        score,
        recommendations,
        keywordDensity,
        metaTagsAnalysis,
        contentStructureAnalysis,
        technicalSEOIssues
      };

    } catch (error) {
      console.error('SEOOptimizer: Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Optimize content for better SEO performance
   */
  async optimizeContent(
    content: string,
    title: string,
    metaDescription: string,
    targetKeywords: string[]
  ): Promise<{
    optimizedContent: string;
    optimizedTitle: string;
    optimizedMetaDescription: string;
    optimizationReport: string[];
  }> {
    try {
      console.log('SEOOptimizer: Starting content optimization');

      const optimizationReport: string[] = [];

      // Optimize title
      const optimizedTitle = this.optimizeTitle(title, targetKeywords);
      if (optimizedTitle !== title) {
        optimizationReport.push('Title optimized for better keyword targeting');
      }

      // Optimize meta description
      const optimizedMetaDescription = this.optimizeMetaDescription(metaDescription, targetKeywords);
      if (optimizedMetaDescription !== metaDescription) {
        optimizationReport.push('Meta description optimized for length and keywords');
      }

      // Optimize content structure
      let optimizedContent = content;

      // Add/optimize headings
      optimizedContent = this.optimizeHeadings(optimizedContent, targetKeywords);
      optimizationReport.push('Headings optimized with target keywords');

      // Optimize keyword density
      optimizedContent = this.optimizeKeywordDensity(optimizedContent, targetKeywords);
      optimizationReport.push('Keyword density optimized for better ranking');

      // Add internal linking opportunities
      optimizedContent = this.addInternalLinkingSuggestions(optimizedContent);
      optimizationReport.push('Internal linking opportunities identified');

      // Improve readability
      optimizedContent = this.improveReadability(optimizedContent);
      optimizationReport.push('Content readability improved');

      // Add schema markup suggestions
      const schemaMarkup = this.generateSchemaMarkup(content, title, targetKeywords);
      optimizationReport.push('Schema markup generated for better search understanding');

      console.log(`SEOOptimizer: Content optimization complete - ${optimizationReport.length} improvements applied`);

      return {
        optimizedContent,
        optimizedTitle,
        optimizedMetaDescription,
        optimizationReport
      };

    } catch (error) {
      console.error('SEOOptimizer: Content optimization failed:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive meta tags for content
   */
  generateComprehensiveMetaTags(
    title: string,
    description: string,
    keywords: string[],
    contentType: 'article' | 'website' | 'product' | 'service',
    additionalData?: Record<string, any>
  ): Record<string, string> {
    const metaTags: Record<string, string> = {
      // Basic SEO
      'title': title,
      'description': description,
      'keywords': keywords.join(', '),
      'robots': 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      'googlebot': 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      'canonical': additionalData?.url || '',

      // Open Graph
      'og:type': contentType === 'article' ? 'article' : 'website',
      'og:title': title,
      'og:description': description,
      'og:url': additionalData?.url || '',
      'og:site_name': additionalData?.siteName || 'Zenith Platform',
      'og:locale': additionalData?.locale || 'en_US',

      // Twitter Cards
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:site': additionalData?.twitterHandle || '@ZenithPlatform',
      'twitter:creator': additionalData?.authorTwitter || '@ZenithPlatform',

      // Additional SEO
      'author': additionalData?.author || 'Zenith Team',
      'publisher': additionalData?.publisher || 'Zenith Platform',
      'language': additionalData?.language || 'en',
      'geo.region': additionalData?.region || '',
      'geo.placename': additionalData?.location || '',
    };

    // Content-type specific tags
    if (contentType === 'article') {
      metaTags['article:author'] = additionalData?.author || 'Zenith Team';
      metaTags['article:publisher'] = additionalData?.publisher || 'Zenith Platform';
      metaTags['article:published_time'] = additionalData?.publishedTime || new Date().toISOString();
      metaTags['article:modified_time'] = additionalData?.modifiedTime || new Date().toISOString();
      metaTags['article:section'] = additionalData?.category || 'Technology';
      if (additionalData?.tags) {
        metaTags['article:tag'] = additionalData.tags.join(', ');
      }
    }

    // Add image tags if provided
    if (additionalData?.image) {
      metaTags['og:image'] = additionalData.image;
      metaTags['og:image:alt'] = additionalData.imageAlt || title;
      metaTags['twitter:image'] = additionalData.image;
      metaTags['twitter:image:alt'] = additionalData.imageAlt || title;
    }

    // Add video tags if provided
    if (additionalData?.video) {
      metaTags['og:video'] = additionalData.video;
      metaTags['og:video:type'] = additionalData.videoType || 'video/mp4';
    }

    // Remove empty values
    Object.keys(metaTags).forEach(key => {
      if (!metaTags[key]) {
        delete metaTags[key];
      }
    });

    return metaTags;
  }

  /**
   * Generate structured data (Schema.org) markup
   */
  generateSchemaMarkup(
    content: string,
    title: string,
    keywords: string[],
    contentType: 'Article' | 'BlogPosting' | 'WebPage' | 'Product' | 'Service' = 'Article'
  ): object {
    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': contentType,
      'headline': title,
      'description': content.substring(0, 160),
      'keywords': keywords.join(', '),
      'datePublished': new Date().toISOString(),
      'dateModified': new Date().toISOString(),
      'author': {
        '@type': 'Organization',
        'name': 'Zenith Platform',
        'url': 'https://zenith.engineer'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'Zenith Platform',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://zenith.engineer/logo.png'
        }
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': 'https://zenith.engineer'
      }
    };

    // Add content-specific schema
    if (contentType === 'Article' || contentType === 'BlogPosting') {
      return {
        ...baseSchema,
        'wordCount': content.split(/\s+/).length,
        'articleSection': 'Technology',
        'inLanguage': 'en-US'
      };
    }

    return baseSchema;
  }

  // ==================== PRIVATE ANALYSIS METHODS ====================

  private analyzeKeywordDensity(content: string, targetKeywords: string[]): Record<string, number> {
    const wordCount = content.split(/\s+/).length;
    const keywordDensity: Record<string, number> = {};

    targetKeywords.forEach(keyword => {
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = content.match(regex) || [];
      keywordDensity[keyword] = (matches.length / wordCount) * 100;
    });

    return keywordDensity;
  }

  private analyzeMetaTags(
    title: string,
    metaDescription: string,
    targetKeywords: string[]
  ): MetaTagsAnalysis {
    const primaryKeyword = targetKeywords[0]?.toLowerCase() || '';

    const titleAnalysis = {
      length: title.length,
      hasKeyword: title.toLowerCase().includes(primaryKeyword),
      isOptimal: title.length >= this.optimalTitleLength.min && title.length <= this.optimalTitleLength.max,
      suggestions: [] as string[]
    };

    if (!titleAnalysis.isOptimal) {
      if (title.length < this.optimalTitleLength.min) {
        titleAnalysis.suggestions.push(`Title too short (${title.length} chars). Aim for ${this.optimalTitleLength.min}-${this.optimalTitleLength.max} characters.`);
      } else {
        titleAnalysis.suggestions.push(`Title too long (${title.length} chars). Aim for ${this.optimalTitleLength.min}-${this.optimalTitleLength.max} characters.`);
      }
    }

    if (!titleAnalysis.hasKeyword) {
      titleAnalysis.suggestions.push(`Include primary keyword "${primaryKeyword}" in title.`);
    }

    const descriptionAnalysis = {
      length: metaDescription.length,
      hasKeyword: metaDescription.toLowerCase().includes(primaryKeyword),
      isOptimal: metaDescription.length >= this.optimalDescriptionLength.min && metaDescription.length <= this.optimalDescriptionLength.max,
      suggestions: [] as string[]
    };

    if (!descriptionAnalysis.isOptimal) {
      if (metaDescription.length < this.optimalDescriptionLength.min) {
        descriptionAnalysis.suggestions.push(`Meta description too short (${metaDescription.length} chars). Aim for ${this.optimalDescriptionLength.min}-${this.optimalDescriptionLength.max} characters.`);
      } else {
        descriptionAnalysis.suggestions.push(`Meta description too long (${metaDescription.length} chars). Aim for ${this.optimalDescriptionLength.min}-${this.optimalDescriptionLength.max} characters.`);
      }
    }

    if (!descriptionAnalysis.hasKeyword) {
      descriptionAnalysis.suggestions.push(`Include primary keyword "${primaryKeyword}" in meta description.`);
    }

    return {
      title: titleAnalysis,
      description: descriptionAnalysis,
      missing: [],
      duplicate: []
    };
  }

  private analyzeContentStructure(content: string, targetKeywords: string[]): ContentStructureAnalysis {
    const wordCount = content.split(/\s+/).length;
    const headingStructure = this.extractHeadings(content, targetKeywords);
    const keywordDistribution = this.analyzeKeywordDistribution(content, targetKeywords);
    
    return {
      headingStructure,
      wordCount,
      readabilityScore: this.calculateReadabilityScore(content),
      keywordDistribution,
      internalLinks: (content.match(/\[.*?\]\(\/.*?\)/g) || []).length,
      externalLinks: (content.match(/\[.*?\]\(https?:\/\/.*?\)/g) || []).length
    };
  }

  private extractHeadings(content: string, targetKeywords: string[]): HeadingAnalysis[] {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: HeadingAnalysis[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const hasKeyword = targetKeywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );

      headings.push({
        level,
        text,
        hasKeyword,
        position: match.index
      });
    }

    return headings;
  }

  private analyzeKeywordDistribution(content: string, targetKeywords: string[]): KeywordDistribution[] {
    const words = content.split(/\s+/);
    const totalWords = words.length;

    return targetKeywords.map(keyword => {
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = [...content.matchAll(regex)];
      const count = matches.length;
      const density = (count / totalWords) * 100;
      const positions = matches.map(match => match.index || 0);

      return {
        keyword,
        count,
        density,
        positions,
        isOptimal: density >= this.targetKeywordDensity.min && density <= this.targetKeywordDensity.max
      };
    });
  }

  private async identifyTechnicalIssues(content: string, url?: string): Promise<TechnicalSEOIssue[]> {
    const issues: TechnicalSEOIssue[] = [];

    // Check content length
    if (content.split(/\s+/).length < this.minWordCount) {
      issues.push({
        type: 'crawling',
        severity: 'medium',
        issue: `Content too short (${content.split(/\s+/).length} words)`,
        fix: `Increase content length to at least ${this.minWordCount} words for better SEO`
      });
    }

    // Check for images without alt text
    const images = content.match(/!\[.*?\]\(.*?\)/g) || [];
    const imagesWithoutAlt = images.filter(img => !img.includes('![') || img.includes('![]'));
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        type: 'accessibility',
        severity: 'medium',
        issue: `${imagesWithoutAlt.length} images without alt text`,
        fix: 'Add descriptive alt text to all images for accessibility and SEO'
      });
    }

    // Check for broken internal links (placeholder)
    const internalLinks = content.match(/\[.*?\]\(\/.*?\)/g) || [];
    // In real implementation, validate these links
    if (internalLinks.length === 0) {
      issues.push({
        type: 'crawling',
        severity: 'low',
        issue: 'No internal links found',
        fix: 'Add relevant internal links to improve site structure and SEO'
      });
    }

    return issues;
  }

  private generateSEORecommendations(
    keywordDensity: Record<string, number>,
    metaTagsAnalysis: MetaTagsAnalysis,
    contentStructure: ContentStructureAnalysis,
    technicalIssues: TechnicalSEOIssue[]
  ): SEORecommendation[] {
    const recommendations: SEORecommendation[] = [];

    // Keyword density recommendations
    Object.entries(keywordDensity).forEach(([keyword, density]) => {
      if (density < this.targetKeywordDensity.min) {
        recommendations.push({
          type: 'important',
          category: 'keywords',
          issue: `Low keyword density for "${keyword}" (${density.toFixed(1)}%)`,
          recommendation: `Increase usage of "${keyword}" to ${this.targetKeywordDensity.min}-${this.targetKeywordDensity.max}%`,
          impact: 8
        });
      } else if (density > this.targetKeywordDensity.max) {
        recommendations.push({
          type: 'critical',
          category: 'keywords',
          issue: `Keyword stuffing detected for "${keyword}" (${density.toFixed(1)}%)`,
          recommendation: `Reduce usage of "${keyword}" to avoid penalties`,
          impact: 9
        });
      }
    });

    // Meta tags recommendations
    metaTagsAnalysis.title.suggestions.forEach(suggestion => {
      recommendations.push({
        type: 'critical',
        category: 'meta',
        issue: 'Title tag optimization needed',
        recommendation: suggestion,
        impact: 10
      });
    });

    metaTagsAnalysis.description.suggestions.forEach(suggestion => {
      recommendations.push({
        type: 'important',
        category: 'meta',
        issue: 'Meta description optimization needed',
        recommendation: suggestion,
        impact: 7
      });
    });

    // Content structure recommendations
    if (contentStructure.headingStructure.length === 0) {
      recommendations.push({
        type: 'critical',
        category: 'structure',
        issue: 'No headings found',
        recommendation: 'Add H1, H2, and H3 headings to structure content properly',
        impact: 9
      });
    }

    const h1Count = contentStructure.headingStructure.filter(h => h.level === 1).length;
    if (h1Count === 0) {
      recommendations.push({
        type: 'critical',
        category: 'structure',
        issue: 'No H1 heading found',
        recommendation: 'Add exactly one H1 heading as the main page title',
        impact: 10
      });
    } else if (h1Count > 1) {
      recommendations.push({
        type: 'important',
        category: 'structure',
        issue: `Multiple H1 headings found (${h1Count})`,
        recommendation: 'Use only one H1 heading per page',
        impact: 7
      });
    }

    // Technical SEO recommendations
    technicalIssues.forEach(issue => {
      recommendations.push({
        type: issue.severity === 'critical' ? 'critical' : issue.severity === 'high' ? 'important' : 'minor',
        category: 'technical',
        issue: issue.issue,
        recommendation: issue.fix,
        impact: issue.severity === 'critical' ? 10 : issue.severity === 'high' ? 8 : issue.severity === 'medium' ? 6 : 4
      });
    });

    return recommendations.sort((a, b) => b.impact - a.impact);
  }

  private calculateSEOScore(
    keywordDensity: Record<string, number>,
    metaTagsAnalysis: MetaTagsAnalysis,
    contentStructure: ContentStructureAnalysis,
    technicalIssues: TechnicalSEOIssue[]
  ): number {
    let score = 100;

    // Keyword density scoring (30% of total)
    let keywordScore = 0;
    const keywordCount = Object.keys(keywordDensity).length;
    Object.values(keywordDensity).forEach(density => {
      if (density >= this.targetKeywordDensity.min && density <= this.targetKeywordDensity.max) {
        keywordScore += 30 / keywordCount;
      } else if (density < this.targetKeywordDensity.min) {
        keywordScore += (15 / keywordCount) * (density / this.targetKeywordDensity.min);
      } else {
        keywordScore += (10 / keywordCount); // Penalty for over-optimization
      }
    });

    // Meta tags scoring (25% of total)
    let metaScore = 0;
    if (metaTagsAnalysis.title.isOptimal) metaScore += 15;
    if (metaTagsAnalysis.title.hasKeyword) metaScore += 5;
    if (metaTagsAnalysis.description.isOptimal) metaScore += 3;
    if (metaTagsAnalysis.description.hasKeyword) metaScore += 2;

    // Content structure scoring (25% of total)
    let structureScore = 0;
    const h1Count = contentStructure.headingStructure.filter(h => h.level === 1).length;
    if (h1Count === 1) structureScore += 10;
    if (contentStructure.headingStructure.length > 1) structureScore += 5;
    if (contentStructure.wordCount >= this.minWordCount) structureScore += 5;
    if (contentStructure.internalLinks > 0) structureScore += 3;
    if (contentStructure.readabilityScore > 60) structureScore += 2;

    // Technical issues penalty (20% of total)
    let technicalPenalty = 0;
    technicalIssues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          technicalPenalty += 10;
          break;
        case 'high':
          technicalPenalty += 6;
          break;
        case 'medium':
          technicalPenalty += 3;
          break;
        case 'low':
          technicalPenalty += 1;
          break;
      }
    });

    const finalScore = Math.max(0, keywordScore + metaScore + structureScore - technicalPenalty);
    return Math.round(finalScore);
  }

  private calculateReadabilityScore(content: string): number {
    const sentences = content.split(/[.!?]+/).length - 1;
    const words = content.split(/\s+/).length;
    const syllables = this.countSyllables(content);

    if (sentences === 0 || words === 0) return 0;

    const avgSentenceLength = words / sentences;
    const avgSyllablesPerWord = syllables / words;

    // Flesch Reading Ease Score
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(text: string): number {
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiou]+/g, 'a')
      .length;
  }

  // ==================== OPTIMIZATION METHODS ====================

  private optimizeTitle(title: string, targetKeywords: string[]): string {
    const primaryKeyword = targetKeywords[0];
    let optimizedTitle = title;

    // Ensure primary keyword is included
    if (primaryKeyword && !title.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      optimizedTitle = `${primaryKeyword}: ${title}`;
    }

    // Ensure optimal length
    if (optimizedTitle.length > this.optimalTitleLength.max) {
      optimizedTitle = optimizedTitle.substring(0, this.optimalTitleLength.max - 3) + '...';
    } else if (optimizedTitle.length < this.optimalTitleLength.min) {
      optimizedTitle += ` - Complete Guide 2024`;
    }

    return optimizedTitle;
  }

  private optimizeMetaDescription(description: string, targetKeywords: string[]): string {
    const primaryKeyword = targetKeywords[0];
    let optimizedDescription = description;

    // Ensure primary keyword is included
    if (primaryKeyword && !description.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      optimizedDescription = `Learn about ${primaryKeyword}. ${description}`;
    }

    // Ensure optimal length
    if (optimizedDescription.length > this.optimalDescriptionLength.max) {
      optimizedDescription = optimizedDescription.substring(0, this.optimalDescriptionLength.max - 3) + '...';
    } else if (optimizedDescription.length < this.optimalDescriptionLength.min) {
      optimizedDescription += ` Get started today with our comprehensive guide.`;
    }

    return optimizedDescription;
  }

  private optimizeHeadings(content: string, targetKeywords: string[]): string {
    // Add H1 if missing
    if (!content.match(/^#\s+/m)) {
      const primaryKeyword = targetKeywords[0];
      content = `# The Complete Guide to ${primaryKeyword}\n\n${content}`;
    }

    // Optimize existing headings to include keywords where appropriate
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let keywordIndex = 0;
    
    return content.replace(headingRegex, (match, hashes, text) => {
      const keyword = targetKeywords[keywordIndex % targetKeywords.length];
      if (keyword && !text.toLowerCase().includes(keyword.toLowerCase()) && hashes.length <= 3) {
        keywordIndex++;
        return `${hashes} ${text}: ${keyword} Guide`;
      }
      return match;
    });
  }

  private optimizeKeywordDensity(content: string, targetKeywords: string[]): string {
    let optimizedContent = content;
    
    targetKeywords.forEach(keyword => {
      const currentDensity = this.analyzeKeywordDensity(content, [keyword])[keyword];
      
      if (currentDensity < this.targetKeywordDensity.min) {
        // Add keyword naturally in a few places
        const sentences = optimizedContent.split('. ');
        const targetAdditions = Math.ceil((this.targetKeywordDensity.min - currentDensity) * sentences.length / 100);
        
        for (let i = 0; i < Math.min(targetAdditions, 3); i++) {
          const randomIndex = Math.floor(Math.random() * sentences.length);
          if (!sentences[randomIndex].toLowerCase().includes(keyword.toLowerCase())) {
            sentences[randomIndex] += ` This ${keyword} approach`;
          }
        }
        
        optimizedContent = sentences.join('. ');
      }
    });

    return optimizedContent;
  }

  private addInternalLinkingSuggestions(content: string): string {
    // Add placeholder internal links
    const linkOpportunities = [
      'related guide',
      'comprehensive tutorial',
      'detailed analysis',
      'best practices',
      'complete overview'
    ];

    let optimizedContent = content;
    linkOpportunities.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'i');
      if (optimizedContent.match(regex) && !optimizedContent.includes(`[${phrase}]`)) {
        optimizedContent = optimizedContent.replace(regex, `[${phrase}](/guides/${phrase.replace(/\s+/g, '-')})`);
      }
    });

    return optimizedContent;
  }

  private improveReadability(content: string): string {
    // Break up long sentences
    let improvedContent = content.replace(/([^.!?]{80,}),\s+/g, '$1. ');
    
    // Replace complex words with simpler alternatives
    const simplifications: Record<string, string> = {
      'utilize': 'use',
      'facilitate': 'help',
      'demonstrate': 'show',
      'implement': 'put in place',
      'methodology': 'method',
      'subsequently': 'then',
      'furthermore': 'also',
      'nevertheless': 'however',
      'approximately': 'about'
    };

    Object.entries(simplifications).forEach(([complex, simple]) => {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi');
      improvedContent = improvedContent.replace(regex, simple);
    });

    return improvedContent;
  }
}

export default SEOOptimizer;