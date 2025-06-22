// src/lib/agents/readability-optimizer-agent.ts

import { prisma } from '@/lib/prisma';

interface ReadabilityTargets {
  fleschKincaidLevel: number;
  averageSentenceLength: number;
  averageWordsPerSentence: number;
  complexWordsPercentage: number;
  passiveVoicePercentage: number;
  readingTimeMinutes: number;
}

interface ReadabilityAnalysis {
  currentLevel: string;
  fleschScore: number;
  sentenceLength: number;
  wordComplexity: number;
  passiveVoice: number;
  readingTime: number;
  issues: string[];
  improvements: string[];
}

interface OptimizationResult {
  originalContent: string;
  optimizedContent: string;
  beforeAnalysis: ReadabilityAnalysis;
  afterAnalysis: ReadabilityAnalysis;
  optimizationsApplied: string[];
  targetAchieved: boolean;
  confidenceScore: number;
}

export class ReadabilityOptimizerAgent {
  private readabilityTargets: Record<string, ReadabilityTargets> = {
    'Year 5': {
      fleschKincaidLevel: 5,
      averageSentenceLength: 12,
      averageWordsPerSentence: 8,
      complexWordsPercentage: 5,
      passiveVoicePercentage: 5,
      readingTimeMinutes: 3
    },
    'Year 7-9': {
      fleschKincaidLevel: 8,
      averageSentenceLength: 15,
      averageWordsPerSentence: 12,
      complexWordsPercentage: 10,
      passiveVoicePercentage: 10,
      readingTimeMinutes: 5
    },
    'Year 10': {
      fleschKincaidLevel: 10,
      averageSentenceLength: 18,
      averageWordsPerSentence: 15,
      complexWordsPercentage: 15,
      passiveVoicePercentage: 15,
      readingTimeMinutes: 7
    },
    'University': {
      fleschKincaidLevel: 13,
      averageSentenceLength: 22,
      averageWordsPerSentence: 18,
      complexWordsPercentage: 25,
      passiveVoicePercentage: 20,
      readingTimeMinutes: 10
    }
  };

  constructor() {
    console.log('ReadabilityOptimizerAgent: Initialized - Specialist sub-agent for precise readability optimization');
  }

  /**
   * MISSION: Fine-tune final text to precisely match target reading level 
   * for maximum E-E-A-T impact and strategic SEO goals.
   */

  // ==================== CONTENT OPTIMIZATION ====================

  /**
   * Optimize content to match exact target readability level
   */
  async optimizeToTarget(
    content: string,
    targetLevel: string,
    strategicGoals: string[] = []
  ): Promise<OptimizationResult> {
    try {
      console.log(`ReadabilityOptimizerAgent: Optimizing content for ${targetLevel} reading level`);

      // Step 1: Analyze current readability
      const beforeAnalysis = await this.analyzeReadability(content);
      
      // Step 2: Get target parameters
      const targets = this.readabilityTargets[targetLevel];
      if (!targets) {
        throw new Error(`Unknown target level: ${targetLevel}`);
      }

      // Step 3: Determine optimization strategy
      const optimizationPlan = await this.createOptimizationPlan(beforeAnalysis, targets, strategicGoals);

      // Step 4: Apply optimizations systematically
      let optimizedContent = content;
      const appliedOptimizations: string[] = [];

      for (const optimization of optimizationPlan) {
        const result = await this.applyOptimization(optimizedContent, optimization);
        optimizedContent = result.content;
        appliedOptimizations.push(result.description);
      }

      // Step 5: Final analysis and validation
      const afterAnalysis = await this.analyzeReadability(optimizedContent);
      const targetAchieved = this.validateTargetAchievement(afterAnalysis, targets);
      const confidenceScore = this.calculateConfidenceScore(afterAnalysis, targets);

      console.log(`ReadabilityOptimizerAgent: Optimization complete - Target achieved: ${targetAchieved}, Confidence: ${confidenceScore}%`);

      return {
        originalContent: content,
        optimizedContent,
        beforeAnalysis,
        afterAnalysis,
        optimizationsApplied: appliedOptimizations,
        targetAchieved,
        confidenceScore
      };

    } catch (error) {
      console.error('ReadabilityOptimizerAgent: Optimization failed:', error);
      throw error;
    }
  }

  /**
   * Quick readability assessment with recommendations
   */
  async quickAssessment(
    content: string,
    targetLevel: string
  ): Promise<{ currentLevel: string; recommendations: string[]; urgentIssues: string[] }> {
    try {
      const analysis = await this.analyzeReadability(content);
      const targets = this.readabilityTargets[targetLevel];
      
      const recommendations = this.generateRecommendations(analysis, targets);
      const urgentIssues = this.identifyUrgentIssues(analysis, targets);

      return {
        currentLevel: analysis.currentLevel,
        recommendations,
        urgentIssues
      };

    } catch (error) {
      console.error('ReadabilityOptimizerAgent: Quick assessment failed:', error);
      return { currentLevel: 'Unknown', recommendations: [], urgentIssues: ['Assessment failed'] };
    }
  }

  // ==================== READABILITY ANALYSIS ====================

  private async analyzeReadability(content: string): Promise<ReadabilityAnalysis> {
    console.log('ReadabilityOptimizerAgent: Analyzing content readability');

    const words = this.countWords(content);
    const sentences = this.countSentences(content);
    const syllables = this.countSyllables(content);
    const complexWords = this.countComplexWords(content);
    const passiveVoiceCount = this.countPassiveVoice(content);

    // Calculate Flesch-Kincaid Grade Level
    const avgSentenceLength = words / sentences;
    const avgSyllablesPerWord = syllables / words;
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    const gradeLevel = (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59;

    // Calculate other metrics
    const wordComplexity = (complexWords / words) * 100;
    const passiveVoice = (passiveVoiceCount / sentences) * 100;
    const readingTime = Math.ceil(words / 200); // Average reading speed: 200 words/minute

    // Determine current reading level
    const currentLevel = this.determineReadingLevel(gradeLevel);

    // Identify issues and improvements
    const issues = this.identifyReadabilityIssues(avgSentenceLength, wordComplexity, passiveVoice);
    const improvements = this.suggestImprovements(issues);

    return {
      currentLevel,
      fleschScore: Math.round(fleschScore),
      sentenceLength: Math.round(avgSentenceLength * 10) / 10,
      wordComplexity: Math.round(wordComplexity * 10) / 10,
      passiveVoice: Math.round(passiveVoice * 10) / 10,
      readingTime,
      issues,
      improvements
    };
  }

  // ==================== OPTIMIZATION METHODS ====================

  private async createOptimizationPlan(
    analysis: ReadabilityAnalysis,
    targets: ReadabilityTargets,
    strategicGoals: string[]
  ): Promise<string[]> {
    const plan: string[] = [];

    // Sentence length optimization
    if (analysis.sentenceLength > targets.averageSentenceLength) {
      plan.push('shorten_sentences');
    }

    // Word complexity optimization
    if (analysis.wordComplexity > targets.complexWordsPercentage) {
      plan.push('simplify_vocabulary');
    }

    // Passive voice reduction
    if (analysis.passiveVoice > targets.passiveVoicePercentage) {
      plan.push('convert_active_voice');
    }

    // Strategic optimizations based on goals
    if (strategicGoals.includes('seo_optimization')) {
      plan.push('enhance_keyword_density');
    }

    if (strategicGoals.includes('engagement_boost')) {
      plan.push('add_engagement_elements');
    }

    return plan;
  }

  private async applyOptimization(
    content: string,
    optimization: string
  ): Promise<{ content: string; description: string }> {
    switch (optimization) {
      case 'shorten_sentences':
        return {
          content: this.shortenSentences(content),
          description: 'Shortened long sentences for better readability'
        };

      case 'simplify_vocabulary':
        return {
          content: this.simplifyVocabulary(content),
          description: 'Replaced complex words with simpler alternatives'
        };

      case 'convert_active_voice':
        return {
          content: this.convertToActiveVoice(content),
          description: 'Converted passive voice to active voice'
        };

      case 'enhance_keyword_density':
        return {
          content: this.enhanceKeywordDensity(content),
          description: 'Optimized keyword distribution for SEO'
        };

      case 'add_engagement_elements':
        return {
          content: this.addEngagementElements(content),
          description: 'Added engaging elements to maintain reader interest'
        };

      default:
        return { content, description: `Unknown optimization: ${optimization}` };
    }
  }

  // ==================== SPECIFIC OPTIMIZATION TECHNIQUES ====================

  private shortenSentences(content: string): string {
    return content
      // Split at coordinating conjunctions
      .replace(/([^.!?]+),\s+(and|but|or|yet|so)\s+([^.!?]+)/g, '$1. $2 $3')
      // Split at semicolons
      .replace(/([^.!?]+);\s+([^.!?]+)/g, '$1. $2')
      // Split very long sentences at dependent clauses
      .replace(/([^.!?]{50,}),\s+(which|that|who|where|when)\s+([^.!?]+)/g, '$1. This $3')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ');
  }

  private simplifyVocabulary(content: string): string {
    const complexToSimple: Record<string, string> = {
      // Common complex words and their simpler alternatives
      'accommodate': 'fit',
      'accomplish': 'do',
      'accumulate': 'gather',
      'acquire': 'get',
      'adequate': 'enough',
      'adjacent': 'next to',
      'administer': 'give',
      'advantageous': 'helpful',
      'anticipate': 'expect',
      'approximately': 'about',
      'commence': 'start',
      'component': 'part',
      'demonstrate': 'show',
      'eliminate': 'remove',
      'facilitate': 'help',
      'fundamental': 'basic',
      'implement': 'use',
      'indicate': 'show',
      'methodology': 'method',
      'numerous': 'many',
      'objective': 'goal',
      'obtain': 'get',
      'optimum': 'best',
      'participate': 'take part',
      'preliminary': 'first',
      'principal': 'main',
      'procedure': 'method',
      'requirement': 'need',
      'subsequent': 'later',
      'sufficient': 'enough',
      'terminate': 'end',
      'utilize': 'use'
    };

    let simplifiedContent = content;
    Object.entries(complexToSimple).forEach(([complex, simple]) => {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi');
      simplifiedContent = simplifiedContent.replace(regex, simple);
    });

    return simplifiedContent;
  }

  private convertToActiveVoice(content: string): string {
    return content
      // Convert "was [verb]ed by [subject]" to "[subject] [verb]ed"
      .replace(/was\s+(\w+ed)\s+by\s+([^.!?,]+)/g, '$2 $1')
      // Convert "is [verb]ed by [subject]" to "[subject] [verb]s"
      .replace(/is\s+(\w+ed)\s+by\s+([^.!?,]+)/g, '$2 $1s')
      // Convert "has been [verb]ed by [subject]" to "[subject] has [verb]ed"
      .replace(/has\s+been\s+(\w+ed)\s+by\s+([^.!?,]+)/g, '$2 has $1')
      // Convert "will be [verb]ed by [subject]" to "[subject] will [verb]"
      .replace(/will\s+be\s+(\w+ed)\s+by\s+([^.!?,]+)/g, '$2 will $1');
  }

  private enhanceKeywordDensity(content: string): string {
    // This would integrate with SEO strategy to optimize keyword placement
    // For now, return content unchanged
    return content;
  }

  private addEngagementElements(content: string): string {
    // Add transitional phrases and engagement hooks
    return content
      .replace(/\. ([A-Z])/g, '. Moreover, $1')
      .replace(/However,/g, 'But here\'s the thing:')
      .replace(/Therefore,/g, 'So what does this mean?');
  }

  // ==================== ANALYSIS HELPERS ====================

  private countWords(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private countSentences(content: string): number {
    return content.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
  }

  private countSyllables(content: string): number {
    const words: string[] = content.toLowerCase().match(/\b[a-z]+\b/g) || [];
    return words.reduce((total: number, word: string) => {
      // Simplified syllable counting
      const syllables = word.match(/[aeiou]+/g)?.length || 1;
      return total + Math.max(syllables, 1);
    }, 0);
  }

  private countComplexWords(content: string): number {
    const words: string[] = content.toLowerCase().match(/\b[a-z]+\b/g) || [];
    return words.filter((word: string) => {
      // Words with 3+ syllables or 7+ characters are considered complex
      const syllables = word.match(/[aeiou]+/g)?.length || 1;
      return syllables >= 3 || word.length >= 7;
    }).length;
  }

  private countPassiveVoice(content: string): number {
    const passivePatterns = [
      /\b(is|was|are|were|being|been)\s+\w+ed\b/g,
      /\b(is|was|are|were|being|been)\s+\w+en\b/g
    ];

    let count = 0;
    passivePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      count += matches ? matches.length : 0;
    });

    return count;
  }

  private determineReadingLevel(gradeLevel: number): string {
    if (gradeLevel <= 6) return 'Year 5';
    if (gradeLevel <= 9) return 'Year 7-9';
    if (gradeLevel <= 12) return 'Year 10';
    return 'University';
  }

  private identifyReadabilityIssues(
    sentenceLength: number,
    wordComplexity: number,
    passiveVoice: number
  ): string[] {
    const issues: string[] = [];

    if (sentenceLength > 20) issues.push('Sentences are too long');
    if (wordComplexity > 20) issues.push('Too many complex words');
    if (passiveVoice > 15) issues.push('Excessive passive voice');

    return issues;
  }

  private suggestImprovements(issues: string[]): string[] {
    const improvements: string[] = [];

    issues.forEach(issue => {
      switch (issue) {
        case 'Sentences are too long':
          improvements.push('Break long sentences into shorter ones');
          break;
        case 'Too many complex words':
          improvements.push('Replace complex words with simpler alternatives');
          break;
        case 'Excessive passive voice':
          improvements.push('Convert passive voice to active voice');
          break;
      }
    });

    return improvements;
  }

  private generateRecommendations(analysis: ReadabilityAnalysis, targets: ReadabilityTargets): string[] {
    const recommendations: string[] = [];

    if (analysis.sentenceLength > targets.averageSentenceLength) {
      recommendations.push(`Reduce average sentence length from ${analysis.sentenceLength} to ${targets.averageSentenceLength} words`);
    }

    if (analysis.wordComplexity > targets.complexWordsPercentage) {
      recommendations.push(`Reduce complex words from ${analysis.wordComplexity}% to ${targets.complexWordsPercentage}%`);
    }

    if (analysis.passiveVoice > targets.passiveVoicePercentage) {
      recommendations.push(`Reduce passive voice from ${analysis.passiveVoice}% to ${targets.passiveVoicePercentage}%`);
    }

    return recommendations;
  }

  private identifyUrgentIssues(analysis: ReadabilityAnalysis, targets: ReadabilityTargets): string[] {
    const urgentIssues: string[] = [];

    // Issues that significantly impact readability
    if (analysis.sentenceLength > targets.averageSentenceLength * 1.5) {
      urgentIssues.push('CRITICAL: Sentences are far too long for target audience');
    }

    if (analysis.wordComplexity > targets.complexWordsPercentage * 2) {
      urgentIssues.push('CRITICAL: Vocabulary is too complex for target reading level');
    }

    if (analysis.passiveVoice > 30) {
      urgentIssues.push('URGENT: Excessive passive voice hurts readability');
    }

    return urgentIssues;
  }

  private validateTargetAchievement(analysis: ReadabilityAnalysis, targets: ReadabilityTargets): boolean {
    const toleranceMargin = 0.1; // 10% tolerance

    return (
      analysis.sentenceLength <= targets.averageSentenceLength * (1 + toleranceMargin) &&
      analysis.wordComplexity <= targets.complexWordsPercentage * (1 + toleranceMargin) &&
      analysis.passiveVoice <= targets.passiveVoicePercentage * (1 + toleranceMargin)
    );
  }

  private calculateConfidenceScore(analysis: ReadabilityAnalysis, targets: ReadabilityTargets): number {
    let score = 100;

    // Deduct points for each metric that's off target
    const sentenceDeviation = Math.abs(analysis.sentenceLength - targets.averageSentenceLength) / targets.averageSentenceLength;
    const complexityDeviation = Math.abs(analysis.wordComplexity - targets.complexWordsPercentage) / targets.complexWordsPercentage;
    const passiveDeviation = Math.abs(analysis.passiveVoice - targets.passiveVoicePercentage) / targets.passiveVoicePercentage;

    score -= sentenceDeviation * 30;
    score -= complexityDeviation * 30;
    score -= passiveDeviation * 20;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // ==================== PUBLIC API METHODS ====================

  /**
   * Get readability standards for all levels
   */
  getReadabilityStandards(): Record<string, ReadabilityTargets> {
    return this.readabilityTargets;
  }

  /**
   * Batch optimize multiple content pieces
   */
  async batchOptimize(
    contentPieces: { content: string; targetLevel: string; id: string }[]
  ): Promise<{ id: string; result: OptimizationResult }[]> {
    console.log(`ReadabilityOptimizerAgent: Starting batch optimization for ${contentPieces.length} pieces`);

    const results: { id: string; result: OptimizationResult }[] = [];
    for (const piece of contentPieces) {
      try {
        const result = await this.optimizeToTarget(piece.content, piece.targetLevel);
        results.push({ id: piece.id, result });
      } catch (error) {
        console.error(`ReadabilityOptimizerAgent: Failed to optimize content ${piece.id}:`, error);
      }
    }

    return results;
  }
}

export default ReadabilityOptimizerAgent;
