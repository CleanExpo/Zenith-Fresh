/**
 * SaaS Orchestration Engine
 * Main orchestrator that combines E-E-A-T, GEO, and Narrative analysis into unified recommendations
 */

const { NarrativeAnalysisEngine } = require('./narrative-analysis-engine');
const { AuthorExpertiseEngine } = require('./author-expertise-engine');
const { GEOTechnicalAudit } = require('./geo-technical-audit');

class SaaSOrchestrationEngine {
  constructor() {
    this.narrativeEngine = new NarrativeAnalysisEngine();
    this.expertiseEngine = new AuthorExpertiseEngine();
    this.geoAudit = new GEOTechnicalAudit();
    
    this.strategicPillars = {
      'E-E-A-T Compliance': ['expertise', 'experience', 'authoritativeness', 'trustworthiness'],
      'GEO Readiness': ['technical', 'rendering', 'schema', 'crawlability'],
      'Narrative Consistency': ['brand', 'story', 'visual', 'journey']
    };
  }

  /**
   * Comprehensive SaaS Analysis - Main Entry Point
   */
  async conductComprehensiveAnalysis(clientData, competitorData = []) {
    const analysis = {
      client: {
        url: clientData.url,
        eeatAnalysis: {},
        geoAnalysis: {},
        narrativeAnalysis: {},
        overallScore: 0
      },
      competitors: {},
      strategicRecommendations: [],
      prioritizationMatrix: {},
      implementationRoadmap: {},
      executiveSummary: {}
    };

    try {
      // Module I: E-E-A-T Analysis (including author expertise)
      analysis.client.eeatAnalysis = await this.conductEEATAnalysis(clientData);
      
      // Module II: GEO Technical Readiness
      analysis.client.geoAnalysis = await this.geoAudit.conductFullAudit(
        clientData.url, 
        competitorData.map(c => c.url)
      );
      
      // Module III: Narrative & Visual Experience
      analysis.client.narrativeAnalysis = await this.conductNarrativeAnalysis(clientData);

      // Analyze competitors
      for (const [index, competitor] of competitorData.entries()) {
        const competitorKey = `Competitor ${String.fromCharCode(65 + index)}`;
        analysis.competitors[competitorKey] = await this.analyzeCompetitor(competitor);
      }

      // Generate unified strategic recommendations
      analysis.strategicRecommendations = this.generateUnifiedRecommendations(
        analysis.client,
        analysis.competitors
      );

      // Create prioritization matrix
      analysis.prioritizationMatrix = this.createPrioritizationMatrix(
        analysis.strategicRecommendations
      );

      // Generate implementation roadmap
      analysis.implementationRoadmap = this.generateImplementationRoadmap(
        analysis.prioritizationMatrix
      );

      // Create executive summary
      analysis.executiveSummary = this.generateExecutiveSummary(analysis);

      // Calculate overall score
      analysis.client.overallScore = this.calculateOverallScore(analysis.client);

    } catch (error) {
      analysis.error = error.message;
    }

    return analysis;
  }

  /**
   * Module I: E-E-A-T Analysis
   */
  async conductEEATAnalysis(clientData) {
    const eeatAnalysis = {
      expertise: await this.analyzeExpertise(clientData),
      experience: await this.analyzeExperience(clientData),
      authoritativeness: await this.analyzeAuthoritativeness(clientData),
      trustworthiness: await this.analyzeTrustworthiness(clientData),
      overallEEATScore: 0,
      criticalGaps: [],
      recommendations: []
    };

    // Calculate overall E-E-A-T score
    eeatAnalysis.overallEEATScore = this.calculateEEATScore(eeatAnalysis);
    
    // Identify critical gaps
    eeatAnalysis.criticalGaps = this.identifyEEATGaps(eeatAnalysis);
    
    // Generate E-E-A-T recommendations
    eeatAnalysis.recommendations = this.generateEEATRecommendations(eeatAnalysis);

    return eeatAnalysis;
  }

  /**
   * Module III: Narrative Analysis
   */
  async conductNarrativeAnalysis(clientData) {
    const narrativeAnalysis = {
      brandNarrative: await this.narrativeEngine.extractCoreStoryElements(clientData.content),
      toneOfVoice: this.narrativeEngine.analyzeToneOfVoice(clientData.content),
      brandArchetype: this.narrativeEngine.classifyBrandArchetype(clientData.content),
      visualHierarchy: this.narrativeEngine.auditVisualHierarchy(clientData.pageData),
      userJourney: this.narrativeEngine.mapUserJourney(clientData.journeyData),
      ctaEffectiveness: this.narrativeEngine.auditCTAEffectiveness(clientData.ctas || []),
      overallNarrativeScore: 0,
      recommendations: []
    };

    // Calculate overall narrative score
    narrativeAnalysis.overallNarrativeScore = this.calculateNarrativeScore(narrativeAnalysis);
    
    // Generate narrative recommendations
    narrativeAnalysis.recommendations = this.generateNarrativeRecommendations(narrativeAnalysis);

    return narrativeAnalysis;
  }

  /**
   * Generate Unified Strategic Recommendations
   */
  generateUnifiedRecommendations(clientAnalysis, competitorAnalyses) {
    const recommendations = [];

    // Combine recommendations from all modules
    const allRecommendations = [
      ...clientAnalysis.eeatAnalysis.recommendations,
      ...clientAnalysis.geoAnalysis.recommendations,
      ...clientAnalysis.narrativeAnalysis.recommendations
    ];

    // Group by strategic pillar
    const groupedRecommendations = this.groupRecommendationsByPillar(allRecommendations);

    // Create integrated recommendations that serve multiple pillars
    Object.keys(groupedRecommendations).forEach(pillar => {
      const pillarRecommendations = groupedRecommendations[pillar];
      
      // Look for cross-pillar synergies
      const integratedRecs = this.findCrossPillarSynergies(
        pillarRecommendations,
        groupedRecommendations
      );

      recommendations.push(...integratedRecs);
    });

    // Add competitive differentiation recommendations
    const competitiveRecs = this.generateCompetitiveDifferentiation(
      clientAnalysis,
      competitorAnalyses
    );
    recommendations.push(...competitiveRecs);

    return recommendations;
  }

  /**
   * Create 2x2 Prioritization Matrix
   */
  createPrioritizationMatrix(recommendations) {
    const matrix = {
      quadrant1: { title: 'Quick Wins', items: [] },      // High Impact, Low Effort
      quadrant2: { title: 'Major Projects', items: [] },  // High Impact, High Effort  
      quadrant3: { title: 'Fill-Ins', items: [] },        // Low Impact, Low Effort
      quadrant4: { title: 'Reconsider', items: [] }       // Low Impact, High Effort
    };

    recommendations.forEach(rec => {
      const impact = this.calculateImpactScore(rec);
      const effort = this.calculateEffortScore(rec);
      
      const enrichedRec = {
        ...rec,
        impactScore: impact,
        effortScore: effort,
        roi: this.calculateROI(impact, effort)
      };

      if (impact >= 7 && effort <= 4) {
        matrix.quadrant1.items.push(enrichedRec);
      } else if (impact >= 7 && effort > 4) {
        matrix.quadrant2.items.push(enrichedRec);
      } else if (impact < 7 && effort <= 4) {
        matrix.quadrant3.items.push(enrichedRec);
      } else {
        matrix.quadrant4.items.push(enrichedRec);
      }
    });

    // Sort each quadrant by ROI
    Object.keys(matrix).forEach(quadrant => {
      matrix[quadrant].items.sort((a, b) => b.roi - a.roi);
    });

    return matrix;
  }

  /**
   * Generate Implementation Roadmap
   */
  generateImplementationRoadmap(prioritizationMatrix) {
    const roadmap = {
      phase1: { title: 'Quick Wins (0-4 weeks)', items: [] },
      phase2: { title: 'Foundation Building (1-3 months)', items: [] },
      phase3: { title: 'Major Initiatives (3-6 months)', items: [] },
      phase4: { title: 'Long-term Optimization (6+ months)', items: [] }
    };

    // Phase 1: All Quick Wins
    roadmap.phase1.items = prioritizationMatrix.quadrant1.items.slice(0, 5);

    // Phase 2: High-impact, medium-effort items + remaining quick wins
    roadmap.phase2.items = [
      ...prioritizationMatrix.quadrant1.items.slice(5),
      ...prioritizationMatrix.quadrant2.items.filter(item => item.effortScore <= 6)
    ];

    // Phase 3: Major projects
    roadmap.phase3.items = prioritizationMatrix.quadrant2.items.filter(
      item => item.effortScore > 6
    );

    // Phase 4: Fill-ins and optimization
    roadmap.phase4.items = prioritizationMatrix.quadrant3.items;

    // Add timeline and resource estimates
    Object.keys(roadmap).forEach(phase => {
      roadmap[phase].estimatedDuration = this.estimatePhaseDuration(roadmap[phase].items);
      roadmap[phase].resourceRequirements = this.estimateResourceRequirements(roadmap[phase].items);
      roadmap[phase].expectedROI = this.calculatePhaseROI(roadmap[phase].items);
    });

    return roadmap;
  }

  /**
   * Generate Executive Summary
   */
  generateExecutiveSummary(analysis) {
    const summary = {
      overallAssessment: this.generateOverallAssessment(analysis.client),
      criticalFindings: this.extractCriticalFindings(analysis),
      competitivePosition: this.assessCompetitivePosition(analysis.client, analysis.competitors),
      topPriorities: this.extractTopPriorities(analysis.prioritizationMatrix),
      expectedImpact: this.calculateExpectedImpact(analysis.implementationRoadmap),
      investmentRecommendation: this.generateInvestmentRecommendation(analysis)
    };

    return summary;
  }

  /**
   * Example of Cross-Pillar Synergy Identification
   */
  findCrossPillarSynergies(pillarRecommendations, allGroupedRecommendations) {
    const synergisticRecommendations = [];

    // Example: Video case studies serve multiple pillars
    const hasContentNeed = pillarRecommendations.some(r => r.category === 'Content');
    const hasExpertiseNeed = allGroupedRecommendations['E-E-A-T Compliance']?.some(r => r.type === 'expertise');
    const hasNarrativeNeed = allGroupedRecommendations['Narrative Consistency']?.some(r => r.type === 'storytelling');

    if (hasContentNeed && hasExpertiseNeed && hasNarrativeNeed) {
      synergisticRecommendations.push({
        title: 'Create In-Depth Video Case Studies',
        description: 'Single initiative addressing multiple strategic goals',
        category: 'Integrated Content Strategy',
        impact: 'High',
        effort: 'Medium',
        pillarsAddressed: ['E-E-A-T Compliance', 'GEO Readiness', 'Narrative Consistency'],
        benefits: [
          'Showcases genuine Experience through original client data',
          'Demonstrates Expertise via detailed technical analysis',
          'Provides rich content for VideoObject schema markup',
          'Creates compelling transformation narrative',
          'Builds emotional connection and trust'
        ],
        implementation: {
          timeline: '6-8 weeks',
          resources: 'Content team, video production, technical authors',
          cost: '$8,000 - $15,000'
        }
      });
    }

    return synergisticRecommendations;
  }

  // Helper Methods

  async analyzeExpertise(clientData) {
    if (clientData.authors) {
      return await this.expertiseEngine.analyzeAuthorExpertise(clientData.authors);
    }
    return { score: 0, message: 'No author data provided' };
  }

  async analyzeExperience(clientData) {
    // Analyze experiential content, case studies, testimonials
    const experienceSignals = this.extractExperienceSignals(clientData.content);
    return {
      score: experienceSignals.length * 10,
      signals: experienceSignals,
      recommendations: this.generateExperienceRecommendations(experienceSignals)
    };
  }

  async analyzeAuthoritativeness(clientData) {
    // Analyze backlinks, mentions, citations
    return {
      score: 75, // Placeholder
      backlinks: clientData.backlinks || 0,
      recommendations: ['Build more authoritative backlinks', 'Increase industry citations']
    };
  }

  async analyzeTrustworthiness(clientData) {
    // Analyze trust signals: reviews, security, transparency
    return {
      score: 70, // Placeholder  
      trustSignals: ['SSL certificate', 'Privacy policy', 'Contact information'],
      recommendations: ['Add customer testimonials', 'Display security badges']
    };
  }

  calculateImpactScore(recommendation) {
    // Calculate impact based on strategic alignment and potential benefit
    let score = 5; // Base score
    
    if (recommendation.category === 'Rendering Strategy') score += 3;
    if (recommendation.priority === 'CRITICAL') score += 2;
    if (recommendation.pillarsAddressed?.length > 1) score += 2;
    
    return Math.min(score, 10);
  }

  calculateEffortScore(recommendation) {
    // Calculate effort based on complexity and resources required
    let score = 3; // Base score
    
    if (recommendation.implementation?.timeline?.includes('month')) score += 3;
    if (recommendation.implementation?.cost?.includes('40,000')) score += 4;
    if (recommendation.category === 'Technical Implementation') score += 2;
    
    return Math.min(score, 10);
  }

  calculateROI(impact, effort) {
    return (impact / effort) * 10;
  }

  calculateOverallScore(clientAnalysis) {
    const weights = {
      eeat: 0.4,
      geo: 0.35,
      narrative: 0.25
    };

    return Math.round(
      clientAnalysis.eeatAnalysis.overallEEATScore * weights.eeat +
      clientAnalysis.geoAnalysis.overallScore * weights.geo +
      clientAnalysis.narrativeAnalysis.overallNarrativeScore * weights.narrative
    );
  }

  extractExperienceSignals(content) {
    const signals = [];
    const experiencePatterns = [
      /case study/gi,
      /client testimonial/gi,
      /our experience/gi,
      /we worked with/gi,
      /real results/gi
    ];

    experiencePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) signals.push(...matches);
    });

    return signals;
  }
}

module.exports = { SaaSOrchestrationEngine };