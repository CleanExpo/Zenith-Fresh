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

  generateExperienceRecommendations(signals) {
    const recommendations = [];
    
    if (signals.length < 3) {
      recommendations.push('Add more experiential content like case studies and testimonials');
    }
    
    if (!signals.some(s => /case study/i.test(s))) {
      recommendations.push('Create detailed case studies showcasing client results');
    }
    
    return recommendations;
  }

  calculateEEATScore(eeatAnalysis) {
    const scores = [
      eeatAnalysis.expertise.score || 0,
      eeatAnalysis.experience.score || 0,
      eeatAnalysis.authoritativeness.score || 0,
      eeatAnalysis.trustworthiness.score || 0
    ];
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  identifyEEATGaps(eeatAnalysis) {
    const gaps = [];
    const threshold = 70;
    
    Object.entries(eeatAnalysis).forEach(([key, analysis]) => {
      if (analysis.score && analysis.score < threshold) {
        gaps.push({
          category: key,
          score: analysis.score,
          gap: threshold - analysis.score,
          severity: analysis.score < 50 ? 'critical' : 'high'
        });
      }
    });
    
    return gaps;
  }

  generateEEATRecommendations(eeatAnalysis) {
    const recommendations = [];
    
    if (eeatAnalysis.expertise.score < 70) {
      recommendations.push({
        category: 'Expertise',
        priority: 'high',
        action: 'Enhance author credentials and technical content depth',
        impact: 'Improved search engine trust signals'
      });
    }
    
    if (eeatAnalysis.experience.score < 70) {
      recommendations.push({
        category: 'Experience',
        priority: 'high',
        action: 'Add more first-person experiences and case studies',
        impact: 'Better user engagement and trust building'
      });
    }
    
    return recommendations;
  }

  calculateNarrativeScore(narrativeAnalysis) {
    const weights = {
      brandNarrative: 0.2,
      toneOfVoice: 0.15,
      brandArchetype: 0.15,
      visualHierarchy: 0.2,
      userJourney: 0.15,
      ctaEffectiveness: 0.15
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(weights).forEach(([key, weight]) => {
      const analysis = narrativeAnalysis[key];
      if (analysis && (analysis.score !== undefined || analysis.confidence !== undefined)) {
        const score = analysis.score || analysis.confidence || analysis.overallScore || 50;
        totalScore += score * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  generateNarrativeRecommendations(narrativeAnalysis) {
    const recommendations = [];
    
    if (narrativeAnalysis.brandNarrative.confidence < 70) {
      recommendations.push({
        category: 'Brand Narrative',
        priority: 'high',
        action: 'Clarify core story elements and brand messaging',
        impact: 'Stronger brand identity and user connection'
      });
    }
    
    if (narrativeAnalysis.userJourney.journeyScore < 70) {
      recommendations.push({
        category: 'User Journey',
        priority: 'medium',
        action: 'Optimize user flow and conversion paths',
        impact: 'Improved conversion rates and user experience'
      });
    }
    
    return recommendations;
  }

  async analyzeCompetitor(competitor) {
    // Simplified competitor analysis
    return {
      eeatAnalysis: { overallEEATScore: 75 },
      geoAnalysis: { overallScore: 70 },
      narrativeAnalysis: { overallNarrativeScore: 80 }
    };
  }

  groupRecommendationsByPillar(recommendations) {
    const grouped = {};
    
    Object.keys(this.strategicPillars).forEach(pillar => {
      grouped[pillar] = [];
    });
    
    recommendations.forEach(rec => {
      // Categorize recommendations by strategic pillar
      if (rec.category && rec.category.includes('E-E-A-T') || rec.category === 'Expertise' || rec.category === 'Experience') {
        grouped['E-E-A-T Compliance'].push(rec);
      } else if (rec.category && (rec.category.includes('Technical') || rec.category.includes('GEO'))) {
        grouped['GEO Readiness'].push(rec);
      } else if (rec.category && (rec.category.includes('Narrative') || rec.category.includes('Brand'))) {
        grouped['Narrative Consistency'].push(rec);
      }
    });
    
    return grouped;
  }

  generateCompetitiveDifferentiation(clientAnalysis, competitorAnalyses) {
    const recommendations = [];
    
    // Find areas where client outperforms competitors
    const strengths = this.identifyCompetitiveStrengths(clientAnalysis, competitorAnalyses);
    
    strengths.forEach(strength => {
      recommendations.push({
        category: 'Competitive Advantage',
        priority: 'medium',
        action: `Leverage ${strength.area} strength in marketing and positioning`,
        impact: 'Competitive differentiation and market positioning'
      });
    });
    
    return recommendations;
  }

  identifyCompetitiveStrengths(clientAnalysis, competitorAnalyses) {
    const strengths = [];
    const areas = ['eeatAnalysis', 'geoAnalysis', 'narrativeAnalysis'];
    
    areas.forEach(area => {
      const clientScore = clientAnalysis[area].overallEEATScore || clientAnalysis[area].overallScore || clientAnalysis[area].overallNarrativeScore;
      const competitorScores = Object.values(competitorAnalyses)
        .map(comp => comp[area]?.overallEEATScore || comp[area]?.overallScore || comp[area]?.overallNarrativeScore || 0);
      
      const avgCompetitorScore = competitorScores.reduce((sum, score) => sum + score, 0) / competitorScores.length;
      
      if (clientScore > avgCompetitorScore + 10) {
        strengths.push({
          area,
          advantage: clientScore - avgCompetitorScore
        });
      }
    });
    
    return strengths;
  }

  estimatePhaseDuration(items) {
    const totalComplexity = items.reduce((sum, item) => sum + (item.effortScore || 3), 0);
    const weeks = Math.ceil(totalComplexity / 2);
    return `${weeks} weeks`;
  }

  estimateResourceRequirements(items) {
    const resources = new Set();
    items.forEach(item => {
      if (item.category?.includes('Technical')) {
        resources.add('Development team');
      }
      if (item.category?.includes('Content') || item.category?.includes('Narrative')) {
        resources.add('Content team');
      }
      if (item.category?.includes('Design')) {
        resources.add('Design team');
      }
    });
    
    return Array.from(resources);
  }

  calculatePhaseROI(items) {
    const totalROI = items.reduce((sum, item) => sum + (item.roi || 5), 0);
    return Math.round(totalROI / items.length);
  }

  generateOverallAssessment(clientAnalysis) {
    const overallScore = clientAnalysis.overallScore;
    
    if (overallScore >= 80) {
      return 'Strong digital presence with minor optimization opportunities';
    } else if (overallScore >= 60) {
      return 'Good foundation with significant improvement potential';
    } else {
      return 'Critical optimization needed across multiple areas';
    }
  }

  extractCriticalFindings(analysis) {
    const findings = [];
    
    // Extract critical issues from each analysis module
    if (analysis.client.eeatAnalysis.criticalGaps?.length > 0) {
      findings.push(`E-E-A-T compliance needs attention: ${analysis.client.eeatAnalysis.criticalGaps.length} critical gaps identified`);
    }
    
    if (analysis.client.geoAnalysis.criticalIssues?.length > 0) {
      findings.push(`GEO readiness requires improvement: ${analysis.client.geoAnalysis.criticalIssues.length} critical technical issues`);
    }
    
    return findings;
  }

  assessCompetitivePosition(clientAnalysis, competitorAnalyses) {
    const competitorCount = Object.keys(competitorAnalyses).length;
    const clientScore = clientAnalysis.overallScore;
    
    const competitorScores = Object.values(competitorAnalyses)
      .map(comp => comp.eeatAnalysis?.overallEEATScore || comp.geoAnalysis?.overallScore || comp.narrativeAnalysis?.overallNarrativeScore || 50);
    
    const betterThan = competitorScores.filter(score => clientScore > score).length;
    const position = betterThan + 1;
    
    return {
      position,
      totalCompetitors: competitorCount,
      percentile: Math.round((betterThan / competitorCount) * 100)
    };
  }

  extractTopPriorities(prioritizationMatrix) {
    const priorities = [];
    
    // Extract top items from quick wins and major projects
    if (prioritizationMatrix.quadrant1?.items?.length > 0) {
      priorities.push(...prioritizationMatrix.quadrant1.items.slice(0, 3));
    }
    
    if (prioritizationMatrix.quadrant2?.items?.length > 0) {
      priorities.push(...prioritizationMatrix.quadrant2.items.slice(0, 2));
    }
    
    return priorities.slice(0, 5); // Top 5 priorities
  }

  calculateExpectedImpact(implementationRoadmap) {
    const phases = Object.values(implementationRoadmap);
    const totalROI = phases.reduce((sum, phase) => sum + (phase.expectedROI || 0), 0);
    
    return {
      totalROI: Math.round(totalROI / phases.length),
      timeframe: '6-12 months',
      confidence: 'High'
    };
  }

  generateInvestmentRecommendation(analysis) {
    const clientScore = analysis.client.overallScore;
    
    if (clientScore < 50) {
      return {
        level: 'High',
        rationale: 'Significant gaps require comprehensive digital transformation',
        priority: 'Critical'
      };
    } else if (clientScore < 70) {
      return {
        level: 'Medium',
        rationale: 'Good foundation with targeted improvements needed',
        priority: 'High'
      };
    } else {
      return {
        level: 'Low',
        rationale: 'Strong position with optimization opportunities',
        priority: 'Medium'
      };
    }
  }
}

module.exports = { SaaSOrchestrationEngine };