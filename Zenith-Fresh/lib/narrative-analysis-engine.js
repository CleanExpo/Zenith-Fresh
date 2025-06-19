/**
 * Module III: Narrative & Visual Experience Analysis Engine
 * AI-driven system for analyzing brand narrative, visual hierarchy, and user journey effectiveness
 */

class NarrativeAnalysisEngine {
  constructor() {
    this.brandArchetypes = [
      'The Innocent', 'The Explorer', 'The Sage', 'The Hero', 
      'The Outlaw', 'The Magician', 'The Regular Guy', 'The Lover',
      'The Jester', 'The Caregiver', 'The Creator', 'The Ruler'
    ];
    
    this.narrativeElements = {
      hero: 'Who is positioned as the protagonist',
      problem: 'Core pain point or challenge addressed',
      solution: 'How product/service serves as the guide',
      transformation: 'Promised outcome or better future'
    };
  }

  /**
   * Core Story Element Identification
   * Analyzes key pages to identify fundamental narrative components
   */
  async extractCoreStoryElements(pageContent) {
    const analysis = {
      hero: this.identifyHero(pageContent),
      problem: this.extractProblem(pageContent),
      solution: this.identifySolution(pageContent),
      transformation: this.findTransformation(pageContent),
      confidence: 0
    };

    // Calculate confidence score based on clarity of elements
    const elementsFound = Object.values(analysis).filter(val => val && val !== 'Unclear').length;
    analysis.confidence = (elementsFound / 4) * 100;

    return analysis;
  }

  /**
   * Tone of Voice Analysis
   * Analyzes linguistic patterns and vocabulary consistency
   */
  analyzeToneOfVoice(content) {
    const sentences = content.match(/[^\.!?]+[\.!?]+/g) || [];
    
    const metrics = {
      avgSentenceLength: this.calculateAvgSentenceLength(sentences),
      formalityScore: this.calculateFormality(content),
      emotionalTone: this.detectEmotionalTone(content),
      jargonLevel: this.assessJargonLevel(content),
      personalityTraits: this.identifyPersonalityTraits(content)
    };

    return {
      primaryTone: this.classifyTone(metrics),
      consistency: this.calculateToneConsistency(metrics),
      recommendations: this.generateToneRecommendations(metrics),
      metrics
    };
  }

  /**
   * Brand Archetype Classification
   * Uses content analysis to classify brand archetype
   */
  classifyBrandArchetype(websiteContent) {
    const archetypeScores = {};
    
    // Initialize scores
    this.brandArchetypes.forEach(archetype => {
      archetypeScores[archetype] = 0;
    });

    // Analyze content for archetype indicators
    const indicators = this.extractArchetypeIndicators(websiteContent);
    
    // Score each archetype based on content indicators
    Object.keys(indicators).forEach(indicator => {
      const relevantArchetypes = this.getArchetypesForIndicator(indicator);
      relevantArchetypes.forEach(archetype => {
        archetypeScores[archetype] += indicators[indicator] * this.getIndicatorWeight(indicator);
      });
    });

    // Find dominant archetype
    const dominantArchetype = Object.keys(archetypeScores).reduce((a, b) => 
      archetypeScores[a] > archetypeScores[b] ? a : b
    );

    return {
      dominant: dominantArchetype,
      confidence: archetypeScores[dominantArchetype],
      allScores: archetypeScores,
      recommendations: this.generateArchetypeRecommendations(dominantArchetype, archetypeScores)
    };
  }

  /**
   * Visual Hierarchy & Storytelling Audit
   * Analyzes page design effectiveness in supporting narrative
   */
  auditVisualHierarchy(pageData) {
    const audit = {
      sizeScale: this.analyzeSizeHierarchy(pageData.elements),
      colorContrast: this.analyzeColorUsage(pageData.colors),
      whitespace: this.analyzeWhitespace(pageData.layout),
      placement: this.analyzePlacement(pageData.elements),
      mediaAuthenticity: this.analyzeMediaAuthenticity(pageData.images)
    };

    // Calculate overall effectiveness score
    const scores = Object.values(audit).map(item => item.score);
    const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return {
      overallScore,
      details: audit,
      criticalIssues: this.identifyCriticalDesignIssues(audit),
      recommendations: this.generateDesignRecommendations(audit)
    };
  }

  /**
   * User Journey & CTA Effectiveness Mapping
   * Maps user journeys and analyzes CTA effectiveness
   */
  mapUserJourney(journeyData) {
    const journeyAnalysis = {
      narrativeConsistency: this.analyzeNarrativeConsistency(journeyData.touchpoints),
      emotionalArc: this.analyzeEmotionalArc(journeyData.touchpoints),
      ctaEffectiveness: this.analyzeCTAEffectiveness(journeyData.ctas),
      conversionPath: this.analyzeConversionPath(journeyData.path)
    };

    return {
      journeyScore: this.calculateJourneyScore(journeyAnalysis),
      analysis: journeyAnalysis,
      optimizations: this.generateJourneyOptimizations(journeyAnalysis)
    };
  }

  /**
   * CTA Effectiveness Audit
   * Detailed analysis of call-to-action elements
   */
  auditCTAEffectiveness(ctas) {
    return ctas.map(cta => {
      const analysis = {
        copyAnalysis: this.analyzeCTACopy(cta.text),
        designAnalysis: this.analyzeCTADesign(cta.design),
        placementAnalysis: this.analyzeCTAPlacement(cta.placement),
        psychologyAnalysis: this.analyzeCTAPsychology(cta)
      };

      const overallScore = this.calculateCTAScore(analysis);
      
      return {
        id: cta.id,
        text: cta.text,
        score: overallScore,
        analysis,
        recommendations: this.generateCTARecommendations(analysis)
      };
    });
  }

  /**
   * Generate Brand Narrative & Visual Consistency Matrix
   * Creates comprehensive comparison matrix for client vs competitors
   */
  generateConsistencyMatrix(clientData, competitorData) {
    const elements = [
      'brandArchetype',
      'toneOfVoice', 
      'coreMessageClarity',
      'heroJourneyStructure',
      'colorPaletteConsistency',
      'visualHierarchyEffectiveness',
      'imageAuthenticity'
    ];

    const matrix = {
      client: {},
      competitors: {},
      gaps: {},
      opportunities: []
    };

    // Analyze client across all pages
    elements.forEach(element => {
      matrix.client[element] = this.analyzeElementConsistency(clientData, element);
    });

    // Analyze competitors
    Object.keys(competitorData).forEach(competitor => {
      matrix.competitors[competitor] = {};
      elements.forEach(element => {
        matrix.competitors[competitor][element] = this.analyzeElementConsistency(
          competitorData[competitor], 
          element
        );
      });
    });

    // Identify gaps and opportunities
    matrix.gaps = this.identifyNarrativeGaps(matrix.client, matrix.competitors);
    matrix.opportunities = this.identifyNarrativeOpportunities(matrix.gaps);

    return matrix;
  }

  // Helper Methods
  identifyHero(content) {
    const heroPatterns = [
      /\b(?:you|your|customer|client|business)\b/gi,
      /\b(?:we help|we assist|we support)\b/gi,
      /\b(?:transform|achieve|succeed|grow)\b/gi
    ];

    let heroScore = 0;
    heroPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) heroScore += matches.length;
    });

    if (heroScore > 10) return 'Customer-Centric';
    if (heroScore > 5) return 'Business-Focused';
    return 'Unclear';
  }

  extractProblem(content) {
    const problemPatterns = [
      /\b(?:challenge|problem|issue|struggle|difficulty)\b/gi,
      /\b(?:frustrat|pain|hurt|cost|waste)\b/gi,
      /\b(?:without|lack|missing|need)\b/gi
    ];

    const problems = [];
    problemPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) problems.push(...matches);
    });

    return problems.length > 5 ? 'Problem Clearly Identified' : 'Problem Unclear';
  }

  identifySolution(content) {
    const solutionPatterns = [
      /\b(?:solution|solve|fix|resolve|address)\b/gi,
      /\b(?:software|platform|service|tool|system)\b/gi,
      /\b(?:helps|enables|allows|provides)\b/gi
    ];

    let solutionScore = 0;
    solutionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) solutionScore += matches.length;
    });

    if (solutionScore > 8) return 'Clear Solution Presented';
    if (solutionScore > 3) return 'Solution Mentioned';
    return 'Solution Unclear';
  }

  findTransformation(content) {
    const transformationPatterns = [
      /\b(?:result|outcome|benefit|advantage|improvement)\b/gi,
      /\b(?:increase|grow|boost|enhance|optimize)\b/gi,
      /\b(?:success|achieve|accomplish|reach)\b/gi
    ];

    let transformationScore = 0;
    transformationPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) transformationScore += matches.length;
    });

    if (transformationScore > 6) return 'Clear Transformation Promise';
    if (transformationScore > 2) return 'Transformation Implied';
    return 'Transformation Unclear';
  }

  calculateAvgSentenceLength(sentences) {
    if (!sentences.length) return 0;
    const totalWords = sentences.reduce((sum, sentence) => {
      return sum + sentence.split(/\s+/).length;
    }, 0);
    return totalWords / sentences.length;
  }

  calculateFormality(content) {
    const formalWords = [
      'furthermore', 'consequently', 'therefore', 'moreover', 'additionally',
      'subsequently', 'nevertheless', 'however', 'accordingly', 'thus'
    ];
    
    const informalWords = [
      'yeah', 'okay', 'cool', 'awesome', 'super', 'really', 'pretty',
      'kinda', 'sorta', 'basically', 'actually', 'totally'
    ];

    const words = content.toLowerCase().split(/\s+/);
    let formalCount = 0;
    let informalCount = 0;

    words.forEach(word => {
      if (formalWords.includes(word)) formalCount++;
      if (informalWords.includes(word)) informalCount++;
    });

    // Return formality score (0-100, where 100 is most formal)
    if (formalCount + informalCount === 0) return 50; // neutral
    return (formalCount / (formalCount + informalCount)) * 100;
  }

  detectEmotionalTone(content) {
    const emotionalWords = {
      excitement: ['amazing', 'incredible', 'fantastic', 'awesome', 'thrilled'],
      trust: ['reliable', 'secure', 'proven', 'trusted', 'guaranteed'],
      urgency: ['now', 'immediate', 'urgent', 'limited', 'today'],
      empathy: ['understand', 'feel', 'care', 'support', 'help']
    };

    const toneScores = {};
    Object.keys(emotionalWords).forEach(tone => {
      toneScores[tone] = 0;
      emotionalWords[tone].forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) toneScores[tone] += matches.length;
      });
    });

    return Object.keys(toneScores).reduce((a, b) => 
      toneScores[a] > toneScores[b] ? a : b
    );
  }

  assessJargonLevel(content) {
    // Count technical terms, industry buzzwords, etc.
    const jargonPatterns = [
      /\b(?:optimize|leverage|synergy|paradigm|ecosystem)\b/gi,
      /\b(?:scalable|robust|innovative|cutting-edge|next-generation)\b/gi,
      /\b(?:streamline|maximize|enhance|facilitate|utilize)\b/gi
    ];

    let jargonCount = 0;
    jargonPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) jargonCount += matches.length;
    });

    const words = content.split(/\s+/).length;
    return (jargonCount / words) * 100; // Percentage of jargon
  }

  classifyTone(metrics) {
    if (metrics.formalityScore > 70) return 'Formal, Corporate';
    if (metrics.formalityScore < 30) return 'Casual, Conversational';
    if (metrics.jargonLevel > 5) return 'Technical, Expert';
    if (metrics.emotionalTone === 'excitement') return 'Enthusiastic, Energetic';
    if (metrics.emotionalTone === 'trust') return 'Professional, Trustworthy';
    if (metrics.emotionalTone === 'empathy') return 'Caring, Supportive';
    return 'Neutral, Balanced';
  }

  // Additional helper methods would continue here...
  // For brevity, including key method signatures

  generateToneRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.formalityScore > 80) {
      recommendations.push('Consider adopting a more conversational tone to improve relatability');
    }
    
    if (metrics.jargonLevel > 8) {
      recommendations.push('Reduce technical jargon to improve accessibility for broader audience');
    }
    
    return recommendations;
  }

  generateArchetypeRecommendations(dominant, scores) {
    // Implementation for archetype-specific recommendations
    return [`Strengthen ${dominant} archetype messaging`, 'Maintain consistency across all touchpoints'];
  }

  calculateJourneyScore(analysis) {
    // Calculate composite score from journey analysis
    return (analysis.narrativeConsistency + analysis.emotionalArc + analysis.ctaEffectiveness) / 3;
  }
}

module.exports = { NarrativeAnalysisEngine };