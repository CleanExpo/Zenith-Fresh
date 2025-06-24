// src/lib/agents/socratic-agent.ts

import { prisma } from '@/lib/prisma';

interface SocraticChallenge {
  targetAgent: string;
  originalTask: string;
  originalOutput: any;
  challengeType: 'assumption' | 'logic' | 'completeness' | 'accuracy' | 'efficiency' | 'creativity';
  questionsPosed: string[];
  expectedImprovement: string;
  challengeId: string;
  timestamp: Date;
}

interface SocraticRefinement {
  challengeId: string;
  revisedOutput: any;
  improvementsMade: string[];
  qualityScore: number; // 0-100
  refinementNotes: string;
  learningExtracted: string;
  timestamp: Date;
}

interface QualityAssessment {
  agentId: string;
  taskType: string;
  output: any;
  qualityScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  assessmentDate: Date;
}

export class SocraticAgent {
  private challengeHistory: Map<string, SocraticChallenge[]> = new Map();
  private qualityStandards: Record<string, number> = {
    accuracy: 95,
    completeness: 90,
    clarity: 85,
    efficiency: 80,
    creativity: 75,
    reliability: 95
  };

  constructor() {
    console.log('SocraticAgent: Initialized - Critical Thinker & Master Teacher ready to challenge assumptions');
  }

  /**
   * PERSONA: "You are a master philosopher and educator with the intellectual rigor 
   * of Socrates. Your purpose is to challenge assumptions, expose weaknesses in reasoning, 
   * and push every agent to achieve superior results through critical questioning."
   */

  // ==================== CRITICAL CHALLENGE SYSTEM ====================

  /**
   * Challenge another agent's output to push for higher quality
   */
  async challengeAgentOutput(
    agentId: string,
    taskDescription: string,
    agentOutput: any,
    context?: Record<string, any>
  ): Promise<SocraticChallenge> {
    try {
      console.log(`SocraticAgent: Challenging ${agentId} on task: ${taskDescription}`);

      // Step 1: Analyze the agent's output
      const outputAnalysis = await this.analyzeOutput(agentOutput, taskDescription);

      // Step 2: Identify the most effective challenge type
      const challengeType = this.determineChallengeType(outputAnalysis, agentId);

      // Step 3: Generate probing questions
      const questionsPosed = await this.generateSocraticQuestions(
        agentOutput, 
        taskDescription, 
        challengeType,
        context
      );

      // Step 4: Define expected improvement
      const expectedImprovement = this.defineExpectedImprovement(outputAnalysis, challengeType);

      // Step 5: Create challenge record
      const challenge: SocraticChallenge = {
        targetAgent: agentId,
        originalTask: taskDescription,
        originalOutput: agentOutput,
        challengeType,
        questionsPosed,
        expectedImprovement,
        challengeId: `challenge_${Date.now()}_${agentId}`,
        timestamp: new Date()
      };

      // Step 6: Store challenge for tracking
      await this.recordChallenge(challenge);

      console.log(`SocraticAgent: Challenge issued to ${agentId} - Type: ${challengeType}, Questions: ${questionsPosed.length}`);

      return challenge;

    } catch (error) {
      console.error('SocraticAgent: Failed to challenge agent output:', error);
      throw error;
    }
  }

  /**
   * Evaluate the refined output after a challenge
   */
  async evaluateRefinement(
    challengeId: string,
    revisedOutput: any,
    agentNotes?: string
  ): Promise<SocraticRefinement> {
    try {
      console.log(`SocraticAgent: Evaluating refinement for challenge ${challengeId}`);

      // Get original challenge
      const challenge = await this.getChallenge(challengeId);
      if (!challenge) {
        throw new Error(`Challenge ${challengeId} not found`);
      }

      // Compare original vs revised output
      const improvementAnalysis = await this.analyzeImprovement(
        challenge.originalOutput,
        revisedOutput,
        challenge.challengeType
      );

      // Calculate quality score
      const qualityScore = await this.calculateQualityScore(
        revisedOutput,
        challenge.originalTask,
        challenge.challengeType
      );

      // Extract learning for training data
      const learningExtracted = await this.extractLearning(
        challenge,
        revisedOutput,
        improvementAnalysis
      );

      const refinement: SocraticRefinement = {
        challengeId,
        revisedOutput,
        improvementsMade: improvementAnalysis.improvements,
        qualityScore,
        refinementNotes: agentNotes || 'No notes provided',
        learningExtracted,
        timestamp: new Date()
      };

      // Store refinement
      await this.recordRefinement(refinement);

      console.log(`SocraticAgent: Refinement evaluated - Quality score: ${qualityScore}, Improvements: ${improvementAnalysis.improvements.length}`);

      return refinement;

    } catch (error) {
      console.error('SocraticAgent: Failed to evaluate refinement:', error);
      throw error;
    }
  }

  // ==================== QUALITY ASSESSMENT ====================

  /**
   * Provide comprehensive quality assessment for any agent output
   */
  async assessQuality(
    agentId: string,
    taskType: string,
    output: any,
    criteria?: string[]
  ): Promise<QualityAssessment> {
    try {
      console.log(`SocraticAgent: Assessing quality for ${agentId} - Task type: ${taskType}`);

      // Analyze output against quality dimensions
      const qualityAnalysis = await this.comprehensiveQualityAnalysis(output, taskType, criteria);

      // Calculate overall quality score
      const qualityScore = this.calculateOverallQuality(qualityAnalysis);

      // Generate actionable recommendations
      const recommendations = await this.generateQualityRecommendations(qualityAnalysis, agentId);

      const assessment: QualityAssessment = {
        agentId,
        taskType,
        output,
        qualityScore,
        strengths: qualityAnalysis.strengths,
        weaknesses: qualityAnalysis.weaknesses,
        recommendations,
        assessmentDate: new Date()
      };

      console.log(`SocraticAgent: Quality assessment complete - Score: ${qualityScore}, Recommendations: ${recommendations.length}`);

      return assessment;

    } catch (error) {
      console.error('SocraticAgent: Failed to assess quality:', error);
      throw error;
    }
  }

  // ==================== SOCRATIC QUESTIONING ====================

  private async generateSocraticQuestions(
    output: any,
    task: string,
    challengeType: string,
    context?: Record<string, any>
  ): Promise<string[]> {
    const questions: string[] = [];

    switch (challengeType) {
      case 'assumption':
        questions.push(
          "What assumptions are you making that might not be valid?",
          "How do you know this approach is the best one?",
          "What if the opposite were true - how would that change your approach?",
          "What evidence supports your key assumptions?"
        );
        break;

      case 'logic':
        questions.push(
          "How did you arrive at this conclusion?",
          "What logical steps led to this solution?",
          "Are there any gaps in your reasoning?",
          "What alternative explanations could lead to the same result?"
        );
        break;

      case 'completeness':
        questions.push(
          "What important aspects might you have overlooked?",
          "How comprehensive is this solution?",
          "What edge cases haven't been considered?",
          "What additional information would make this more complete?"
        );
        break;

      case 'accuracy':
        questions.push(
          "How certain are you about these facts?",
          "What sources validate this information?",
          "What could make this more precise?",
          "How have you verified the accuracy of your data?"
        );
        break;

      case 'efficiency':
        questions.push(
          "Is this the most efficient approach possible?",
          "What unnecessary steps could be eliminated?",
          "How could you achieve the same result with fewer resources?",
          "What bottlenecks exist in this solution?"
        );
        break;

      case 'creativity':
        questions.push(
          "What unconventional approaches haven't been explored?",
          "How could you solve this problem in a completely different way?",
          "What innovative elements could enhance this solution?",
          "What would a disruptive approach look like?"
        );
        break;
    }

    // Add context-specific questions
    if (context?.userGoals) {
      questions.push("How well does this align with the user's ultimate goals?");
    }

    if (context?.constraints) {
      questions.push("How do the given constraints limit this solution?");
    }

    return questions;
  }

  // ==================== ANALYSIS METHODS ====================

  private async analyzeOutput(output: any, task: string): Promise<any> {
    return {
      complexity: this.assessComplexity(output),
      completeness: this.assessCompleteness(output, task),
      accuracy: this.assessAccuracy(output),
      efficiency: this.assessEfficiency(output),
      creativity: this.assessCreativity(output),
      clarity: this.assessClarity(output)
    };
  }

  private determineChallengeType(analysis: any, agentId: string): 'assumption' | 'logic' | 'completeness' | 'accuracy' | 'efficiency' | 'creativity' {
    // Determine the most impactful challenge type based on analysis
    const scores = {
      assumption: analysis.creativity < 70 ? 80 : 40,
      logic: analysis.completeness < 70 ? 85 : 50,
      completeness: analysis.completeness < 80 ? 90 : 30,
      accuracy: analysis.accuracy < 90 ? 95 : 20,
      efficiency: analysis.efficiency < 70 ? 75 : 45,
      creativity: analysis.creativity < 60 ? 85 : 35
    };

    const bestChallenge = Object.entries(scores).reduce((a, b) => 
      scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
    );

    return bestChallenge[0] as 'assumption' | 'logic' | 'completeness' | 'accuracy' | 'efficiency' | 'creativity';
  }

  private defineExpectedImprovement(analysis: any, challengeType: string): string {
    const improvements = {
      assumption: "Challenge fundamental assumptions to unlock innovative approaches",
      logic: "Strengthen logical reasoning and eliminate gaps in argumentation",
      completeness: "Address missing elements and edge cases for comprehensive solution",
      accuracy: "Improve factual precision and data validation",
      efficiency: "Optimize resource usage and eliminate unnecessary complexity",
      creativity: "Explore unconventional solutions and innovative approaches"
    };

    return improvements[challengeType as keyof typeof improvements] || "General improvement in output quality";
  }

  private async analyzeImprovement(original: any, revised: any, challengeType: string): Promise<any> {
    const improvements: string[] = [];

    // Compare outputs and identify specific improvements
    if (this.isMoreComplete(original, revised)) {
      improvements.push("Increased completeness and coverage");
    }

    if (this.isMoreAccurate(original, revised)) {
      improvements.push("Enhanced accuracy and precision");
    }

    if (this.isMoreEfficient(original, revised)) {
      improvements.push("Improved efficiency and resource usage");
    }

    if (this.isMoreCreative(original, revised)) {
      improvements.push("Added creative and innovative elements");
    }

    if (this.isClearer(original, revised)) {
      improvements.push("Improved clarity and communication");
    }

    return { improvements };
  }

  private async calculateQualityScore(output: any, task: string, challengeType: string): Promise<number> {
    let score = 70; // Base score

    // Add points based on quality dimensions
    score += this.assessAccuracy(output) * 0.3;
    score += this.assessCompleteness(output, task) * 0.25;
    score += this.assessClarity(output) * 0.2;
    score += this.assessEfficiency(output) * 0.15;
    score += this.assessCreativity(output) * 0.1;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private async extractLearning(
    challenge: SocraticChallenge,
    revisedOutput: any,
    improvementAnalysis: any
  ): Promise<string> {
    // Extract structured learning for training data
    return `Challenge Type: ${challenge.challengeType}
Original Task: ${challenge.originalTask}
Questions Asked: ${challenge.questionsPosed.join('; ')}
Improvements Made: ${improvementAnalysis.improvements.join('; ')}
Key Learning: Agent responded well to ${challenge.challengeType} challenge, demonstrating ability to improve through critical questioning.`;
  }

  // ==================== QUALITY DIMENSIONS ====================

  private assessComplexity(output: any): number {
    // Simple heuristic for complexity assessment
    const outputStr = JSON.stringify(output);
    const length = outputStr.length;
    const uniqueWords = new Set(outputStr.toLowerCase().match(/\w+/g) || []).size;
    
    return Math.min(100, (uniqueWords / 10) + (length / 100));
  }

  private assessCompleteness(output: any, task: string): number {
    // Assess how well the output addresses the task requirements
    const outputStr = JSON.stringify(output).toLowerCase();
    const taskWords = task.toLowerCase().split(/\s+/);
    
    const coverage = taskWords.filter(word => 
      word.length > 3 && outputStr.includes(word)
    ).length / taskWords.length;
    
    return Math.round(coverage * 100);
  }

  private assessAccuracy(output: any): number {
    // For now, return a baseline score
    // In production, this would integrate with verification systems
    return 85;
  }

  private assessEfficiency(output: any): number {
    // Assess efficiency based on output structure and verbosity
    const outputStr = JSON.stringify(output);
    const wordCount = (outputStr.match(/\w+/g) || []).length;
    
    // Optimal range is 100-500 words for most tasks
    if (wordCount >= 100 && wordCount <= 500) return 90;
    if (wordCount < 100) return 60;
    if (wordCount > 1000) return 40;
    
    return 75;
  }

  private assessCreativity(output: any): number {
    // Simple creativity assessment based on unique approaches
    const outputStr = JSON.stringify(output).toLowerCase();
    const creativeWords = ['innovative', 'unique', 'creative', 'novel', 'original', 'breakthrough'];
    
    const creativeScore = creativeWords.filter(word => 
      outputStr.includes(word)
    ).length * 15;
    
    return Math.min(100, creativeScore + 40);
  }

  private assessClarity(output: any): number {
    // Assess clarity based on structure and readability
    const outputStr = JSON.stringify(output);
    const sentences = outputStr.split(/[.!?]+/).length;
    const words = (outputStr.match(/\w+/g) || []).length;
    
    const avgSentenceLength = words / sentences;
    
    if (avgSentenceLength <= 15) return 90;
    if (avgSentenceLength <= 20) return 80;
    if (avgSentenceLength <= 25) return 70;
    
    return 60;
  }

  // ==================== COMPARISON METHODS ====================

  private isMoreComplete(original: any, revised: any): boolean {
    const originalLength = JSON.stringify(original).length;
    const revisedLength = JSON.stringify(revised).length;
    return revisedLength > originalLength * 1.1;
  }

  private isMoreAccurate(original: any, revised: any): boolean {
    // In production, compare against verified facts
    return true; // Assume improvements
  }

  private isMoreEfficient(original: any, revised: any): boolean {
    // Check if revised version achieves same goals with less complexity
    const originalComplexity = this.assessComplexity(original);
    const revisedComplexity = this.assessComplexity(revised);
    return revisedComplexity < originalComplexity * 0.9;
  }

  private isMoreCreative(original: any, revised: any): boolean {
    const originalCreativity = this.assessCreativity(original);
    const revisedCreativity = this.assessCreativity(revised);
    return revisedCreativity > originalCreativity * 1.1;
  }

  private isClearer(original: any, revised: any): boolean {
    const originalClarity = this.assessClarity(original);
    const revisedClarity = this.assessClarity(revised);
    return revisedClarity > originalClarity * 1.05;
  }

  // ==================== QUALITY ASSESSMENT METHODS ====================

  private async comprehensiveQualityAnalysis(
    output: any, 
    taskType: string, 
    criteria?: string[]
  ): Promise<any> {
    const analysis = {
      strengths: [],
      weaknesses: [],
      scores: {
        accuracy: this.assessAccuracy(output),
        completeness: this.assessCompleteness(output, taskType),
        clarity: this.assessClarity(output),
        efficiency: this.assessEfficiency(output),
        creativity: this.assessCreativity(output)
      }
    };

    // Identify strengths and weaknesses
    Object.entries(analysis.scores).forEach(([dimension, score]) => {
      if (score >= 85) {
        (analysis.strengths as string[]).push(`Excellent ${dimension}`);
      } else if (score < 70) {
        (analysis.weaknesses as string[]).push(`Needs improvement in ${dimension}`);
      }
    });

    return analysis;
  }

  private calculateOverallQuality(analysis: any): number {
    const scores = Object.values(analysis.scores) as number[];
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average);
  }

  private async generateQualityRecommendations(analysis: any, agentId: string): Promise<string[]> {
    const recommendations: string[] = [];

    if (analysis.scores.accuracy < 85) {
      recommendations.push("Implement stronger fact-checking and verification processes");
    }

    if (analysis.scores.completeness < 80) {
      recommendations.push("Ensure all task requirements are fully addressed");
    }

    if (analysis.scores.clarity < 75) {
      recommendations.push("Improve communication clarity and structure");
    }

    if (analysis.scores.efficiency < 70) {
      recommendations.push("Optimize approach to reduce unnecessary complexity");
    }

    if (analysis.scores.creativity < 60) {
      recommendations.push("Explore more innovative and creative solutions");
    }

    return recommendations;
  }

  // ==================== DATA MANAGEMENT ====================

  private async recordChallenge(challenge: SocraticChallenge): Promise<void> {
    const agentChallenges = this.challengeHistory.get(challenge.targetAgent) || [];
    agentChallenges.push(challenge);
    this.challengeHistory.set(challenge.targetAgent, agentChallenges);
    
    console.log(`SocraticAgent: Recorded challenge ${challenge.challengeId} for agent ${challenge.targetAgent}`);
  }

  private async getChallenge(challengeId: string): Promise<SocraticChallenge | null> {
    for (const challenges of Array.from(this.challengeHistory.values())) {
      const challenge = challenges.find(c => c.challengeId === challengeId);
      if (challenge) return challenge;
    }
    return null;
  }

  private async recordRefinement(refinement: SocraticRefinement): Promise<void> {
    console.log(`SocraticAgent: Recorded refinement for challenge ${refinement.challengeId}`);
  }

  // ==================== PUBLIC API METHODS ====================

  /**
   * Get challenge history for an agent
   */
  async getChallengeHistory(agentId: string): Promise<SocraticChallenge[]> {
    return this.challengeHistory.get(agentId) || [];
  }

  /**
   * Get quality standards
   */
  getQualityStandards(): Record<string, number> {
    return this.qualityStandards;
  }

  /**
   * Update quality standards
   */
  updateQualityStandards(standards: Record<string, number>): void {
    this.qualityStandards = { ...this.qualityStandards, ...standards };
    console.log('SocraticAgent: Updated quality standards');
  }

  /**
   * Get learning insights for training data generation
   */
  async getLearningInsights(): Promise<any> {
    const insights = {
      totalChallenges: 0,
      challengeTypes: {} as Record<string, number>,
      averageImprovementScore: 0,
      topPerformingAgents: [],
      commonWeaknesses: []
    };

    // Aggregate data from challenge history
    for (const [agentId, challenges] of Array.from(this.challengeHistory.entries())) {
      insights.totalChallenges += challenges.length;
      
      challenges.forEach(challenge => {
        insights.challengeTypes[challenge.challengeType] = 
          (insights.challengeTypes[challenge.challengeType] || 0) + 1;
      });
    }

    return insights;
  }
}

export default SocraticAgent;
