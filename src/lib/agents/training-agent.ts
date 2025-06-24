// src/lib/agents/training-agent.ts

interface LearningPath {
  id: string;
  userId: string;
  title: string;
  description: string;
  modules: LearningModule[];
  progress: number;
  estimatedDuration: string;
  personalizedReasons: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface LearningModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessons: Lesson[];
  sourcePlaybook: string;
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  images: string[];
  quiz?: Quiz;
  isCompleted: boolean;
  practicalConnection?: string;
}

interface Quiz {
  questions: QuizQuestion[];
  passingScore: number;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface MasterPlaybook {
  id: string;
  title: string;
  description: string;
  modules: PlaybookModule[];
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  estimatedDuration: string;
  isPublished: boolean;
  createdAt: Date;
}

interface PlaybookModule {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  prerequisites: string[];
  learningObjectives: string[];
}

interface ClientAssessment {
  userId: string;
  zenithHealthScore: number;
  weakSpots: WeakSpot[];
  goals: string[];
  currentSkillLevel: string;
  preferredLearningStyle: string;
  timeAvailable: string;
  businessType: string;
  priority: string;
}

interface WeakSpot {
  area: string;
  score: number;
  impact: 'high' | 'medium' | 'low';
  suggestedModules: string[];
}

export class TrainingAgent {
  private userId: string;
  
  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * PRIMARY DIRECTIVE: Maximize client success and platform adoption through personalized education
   */
  
  // ==================== CLIENT ASSESSMENT ====================
  
  async performClientAssessment(): Promise<ClientAssessment> {
    try {
      // Pull data from AnalystAgent and existing platform data
      const healthScore = await this.getZenithHealthScore();
      const weakSpots = await this.identifyWeakSpots();
      const goals = await this.getUserGoals();
      const profile = await this.getUserProfile();

      const assessment: ClientAssessment = {
        userId: this.userId,
        zenithHealthScore: healthScore,
        weakSpots,
        goals,
        currentSkillLevel: profile.skillLevel || 'beginner',
        preferredLearningStyle: profile.learningStyle || 'visual',
        timeAvailable: profile.timeAvailable || '30min',
        businessType: profile.businessType || 'general',
        priority: this.determinePriority(weakSpots, goals)
      };

      return assessment;
    } catch (error) {
      console.error('TrainingAgent: Client assessment failed:', error);
      throw new Error('Failed to assess client learning needs');
    }
  }

  private async getZenithHealthScore(): Promise<number> {
    // Integration with existing health score system
    const response = await fetch(`/api/analysis/health-score/${this.userId}`);
    const data = await response.json();
    return data.overallScore || 0;
  }

  private async identifyWeakSpots(): Promise<WeakSpot[]> {
    const weakSpots: WeakSpot[] = [];
    
    // Check GMB health
    const gmbHealth = await this.checkGMBHealth();
    if (gmbHealth < 70) {
      weakSpots.push({
        area: 'Google My Business',
        score: gmbHealth,
        impact: 'high',
        suggestedModules: ['gmb-optimization', 'review-management', 'nap-consistency']
      });
    }

    // Check keyword rankings
    const keywordPerformance = await this.checkKeywordPerformance();
    if (keywordPerformance < 60) {
      weakSpots.push({
        area: 'SEO & Keywords',
        score: keywordPerformance,
        impact: 'high',
        suggestedModules: ['keyword-research', 'content-optimization', 'technical-seo']
      });
    }

    // Check content quality
    const contentScore = await this.checkContentQuality();
    if (contentScore < 65) {
      weakSpots.push({
        area: 'Content Quality',
        score: contentScore,
        impact: 'medium',
        suggestedModules: ['eeat-framework', 'content-creation', 'ai-content-optimization']
      });
    }

    return weakSpots;
  }

  private async getUserGoals(): Promise<string[]> {
    // Pull from project hub or user settings
    const response = await fetch(`/api/users/${this.userId}/goals`);
    const data = await response.json();
    return data.goals || ['improve online presence', 'increase local visibility'];
  }

  private async getUserProfile(): Promise<any> {
    const response = await fetch(`/api/users/${this.userId}/profile`);
    return await response.json();
  }

  // ==================== PERSONALIZED LEARNING PATH CREATION ====================

  async createPersonalizedLearningPath(assessment: ClientAssessment): Promise<LearningPath> {
    try {
      const masterPlaybooks = await this.getMasterPlaybooks();
      const selectedModules = await this.selectRelevantModules(assessment, masterPlaybooks);
      const prioritizedModules = this.prioritizeModules(selectedModules, assessment);

      const learningPath: LearningPath = {
        id: `path_${this.userId}_${Date.now()}`,
        userId: this.userId,
        title: `Your Personalized Zenith Mastery Path`,
        description: this.generatePathDescription(assessment),
        modules: prioritizedModules,
        progress: 0,
        estimatedDuration: this.calculateTotalDuration(prioritizedModules),
        personalizedReasons: this.generatePersonalizationReasons(assessment),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveLearningPath(learningPath);
      return learningPath;
    } catch (error) {
      console.error('TrainingAgent: Failed to create learning path:', error);
      throw new Error('Failed to create personalized learning path');
    }
  }

  private async selectRelevantModules(assessment: ClientAssessment, playbooks: MasterPlaybook[]): Promise<LearningModule[]> {
    const selectedModules: LearningModule[] = [];

    // Priority 1: Address critical weak spots
    for (const weakSpot of assessment.weakSpots.filter(ws => ws.impact === 'high')) {
      for (const moduleId of weakSpot.suggestedModules) {
        const learningModule = this.findModuleInPlaybooks(moduleId, playbooks);
        if (learningModule) {
          selectedModules.push({
            ...learningModule,
            priority: 'high',
            isCompleted: false
          });
        }
      }
    }

    // Priority 2: Goal-aligned content
    const goalModules = this.mapGoalsToModules(assessment.goals, playbooks);
    for (const goalModule of goalModules) {
      selectedModules.push({ ...goalModule, priority: 'medium' as const, isCompleted: false });
    }

    // Priority 3: Foundation building if beginner
    if (assessment.currentSkillLevel === 'beginner') {
      const foundationModules = this.getFoundationModules(playbooks);
      for (const foundationModule of foundationModules) {
        selectedModules.push({ ...foundationModule, priority: 'low' as const, isCompleted: false });
      }
    }

    return this.deduplicateModules(selectedModules);
  }

  private generatePathDescription(assessment: ClientAssessment): string {
    const primaryWeakSpot = assessment.weakSpots[0]?.area || 'digital presence';
    const primaryGoal = assessment.goals[0] || 'improve online performance';
    
    return `Based on your Zenith Health Score of ${assessment.zenithHealthScore}% and your goal to ${primaryGoal}, this path focuses on strengthening your ${primaryWeakSpot} while building comprehensive digital marketing expertise.`;
  }

  private generatePersonalizationReasons(assessment: ClientAssessment): string[] {
    const reasons: string[] = [];
    
    if (assessment.zenithHealthScore < 70) {
      reasons.push(`Your current Zenith Health Score is ${assessment.zenithHealthScore}% - we'll focus on quick wins first`);
    }

    for (const weakSpot of assessment.weakSpots.slice(0, 2)) {
      reasons.push(`Your ${weakSpot.area} needs attention (current score: ${weakSpot.score}%)`);
    }

    if (assessment.goals.length > 0) {
      reasons.push(`Aligned with your goal: ${assessment.goals[0]}`);
    }

    return reasons;
  }

  // ==================== CONVERSATIONAL LEARNING INTERFACE ====================

  async handleConversation(message: string, context: any): Promise<string> {
    try {
      const intent = await this.analyzeIntent(message);
      
      switch (intent.type) {
        case 'question':
          return await this.answerQuestion(message, context);
        
        case 'quiz_request':
          return await this.generateQuiz(context.currentLesson);
        
        case 'practical_connection':
          return await this.connectTheoryToPractice(message, context);
        
        case 'clarification':
          return await this.provideClarification(message, context);
        
        default:
          return await this.generateContextualResponse(message, context);
      }
    } catch (error) {
      console.error('TrainingAgent: Conversation handling failed:', error);
      return "I'm having trouble understanding that. Could you rephrase your question?";
    }
  }

  private async answerQuestion(question: string, context: any): Promise<string> {
    // Use LLM to provide contextual answers based on the current lesson
    const prompt = `
      Context: User is learning about ${context.currentLesson?.title}
      Current lesson content: ${context.currentLesson?.content}
      User question: ${question}
      
      Provide a helpful, educational answer that:
      1. Directly addresses their question
      2. References the current lesson content
      3. Suggests practical next steps
      4. Stays within the Zenith platform context
    `;

    return await this.generateLLMResponse(prompt);
  }

  private async connectTheoryToPractice(message: string, context: any): Promise<string> {
    // Check current platform status and suggest immediate actions
    const currentIssues = await this.getCurrentPlatformIssues();
    
    if (currentIssues.length > 0) {
      const relevantIssue = currentIssues.find(issue => 
        this.isIssueRelatedToLesson(issue, context.currentLesson)
      );

      if (relevantIssue) {
        return `Perfect timing! You just learned about ${context.currentLesson?.title}. I noticed you have ${relevantIssue.description} in your Command Center. Would you like me to help you apply what you just learned to fix this issue right now?`;
      }
    }

    return `Great question! Let me show you how to apply this to your specific situation...`;
  }

  private async generateQuiz(lesson: any): Promise<string> {
    const prompt = `
      Based on the lesson: ${lesson?.title}
      Lesson content: ${lesson?.content}
      
      Generate a 3-5 question quiz to test understanding.
      Include multiple choice questions with explanations.
      Focus on practical application of the concepts.
    `;

    return await this.generateLLMResponse(prompt);
  }

  private async provideClarification(message: string, context: any): Promise<string> {
    const prompt = `
      User is asking for clarification: ${message}
      Current lesson context: ${context.currentLesson?.title}
      
      Provide a clear, simple explanation that addresses their confusion.
      Use analogies or examples if helpful.
      Keep it concise but thorough.
    `;

    return await this.generateLLMResponse(prompt);
  }

  private async generateContextualResponse(message: string, context: any): Promise<string> {
    const prompt = `
      User message: ${message}
      Learning context: ${context.currentLesson?.title || 'General Academy'}
      
      Generate a helpful response that:
      1. Acknowledges their input
      2. Provides relevant guidance
      3. Suggests next steps in their learning journey
    `;

    return await this.generateLLMResponse(prompt);
  }

  // ==================== MASTER PLAYBOOK MANAGEMENT ====================

  async createMasterPlaybook(command: string): Promise<MasterPlaybook> {
    try {
      // Parse the admin command
      const topic = this.extractTopicFromCommand(command);
      
      // Design curriculum
      const curriculum = await this.designCurriculum(topic);
      
      // Create playbook structure
      const playbook: MasterPlaybook = {
        id: `playbook_${Date.now()}`,
        title: curriculum.title,
        description: curriculum.description,
        modules: [],
        level: curriculum.level,
        category: curriculum.category,
        estimatedDuration: curriculum.estimatedDuration,
        isPublished: false,
        createdAt: new Date()
      };

      // Generate content for each module
      for (const moduleOutline of curriculum.modules) {
        const courseModule = await this.generateModuleContent(moduleOutline);
        playbook.modules.push(courseModule);
      }

      // Save to approval queue
      await this.saveToApprovalQueue(playbook);
      
      return playbook;
    } catch (error) {
      console.error('TrainingAgent: Failed to create master playbook:', error);
      throw new Error('Failed to create master playbook');
    }
  }

  private async designCurriculum(topic: string): Promise<any> {
    const prompt = `
      Design a comprehensive curriculum for: "${topic}"
      
      Create a detailed course outline with:
      1. Course title and description
      2. Target skill level (beginner/intermediate/advanced)
      3. Course category
      4. Estimated total duration
      5. 4-8 modules, each with:
         - Module title
         - Learning objectives
         - 3-5 lesson topics
         - Prerequisites
      
      Focus on practical, actionable content that can be immediately applied in the Zenith platform.
      
      Return as structured JSON.
    `;

    return await this.generateLLMResponse(prompt);
  }

  // ==================== HELPER METHODS ====================

  private async checkGMBHealth(): Promise<number> {
    try {
      const response = await fetch(`/api/presence/gmb/health?userId=${this.userId}`);
      const data = await response.json();
      return data.overallScore || 0;
    } catch {
      return 0;
    }
  }

  private async checkKeywordPerformance(): Promise<number> {
    try {
      const response = await fetch(`/api/presence/keywords/rankings?userId=${this.userId}`);
      const data = await response.json();
      return data.averageRanking || 0;
    } catch {
      return 0;
    }
  }

  private async checkContentQuality(): Promise<number> {
    // Placeholder for content quality assessment
    return 70;
  }

  private determinePriority(weakSpots: WeakSpot[], goals: string[]): string {
    const highImpactIssues = weakSpots.filter(ws => ws.impact === 'high').length;
    
    if (highImpactIssues >= 2) return 'urgent';
    if (highImpactIssues === 1) return 'high';
    return 'medium';
  }

  private findModuleInPlaybooks(moduleId: string, playbooks: MasterPlaybook[]): LearningModule | null {
    for (const playbook of playbooks) {
      for (const playbookModule of playbook.modules) {
        if (playbookModule.id === moduleId) {
          return {
            id: playbookModule.id,
            title: playbookModule.title,
            description: playbookModule.description,
            duration: '30 mins', // Calculate based on lessons
            lessons: playbookModule.lessons,
            sourcePlaybook: playbook.title,
            isCompleted: false,
            priority: 'medium'
          };
        }
      }
    }
    return null;
  }

  private async getMasterPlaybooks(): Promise<MasterPlaybook[]> {
    try {
      const response = await fetch('/api/academy/playbooks');
      return await response.json();
    } catch {
      return [];
    }
  }

  private mapGoalsToModules(goals: string[], playbooks: MasterPlaybook[]): LearningModule[] {
    // Map user goals to relevant modules
    const moduleMap: { [key: string]: string[] } = {
      'improve online presence': ['brand-building', 'content-strategy'],
      'increase local visibility': ['local-seo', 'gmb-optimization'],
      'generate more leads': ['conversion-optimization', 'lead-generation'],
      'improve seo': ['keyword-research', 'content-optimization', 'technical-seo']
    };

    const relevantModules: LearningModule[] = [];
    
    for (const goal of goals) {
      const moduleIds = moduleMap[goal.toLowerCase()] || [];
      for (const moduleId of moduleIds) {
        const foundModule = this.findModuleInPlaybooks(moduleId, playbooks);
        if (foundModule) relevantModules.push(foundModule);
      }
    }

    return relevantModules;
  }

  private getFoundationModules(playbooks: MasterPlaybook[]): LearningModule[] {
    // Return basic modules for beginners
    const foundationModuleIds = ['zenith-basics', 'dashboard-navigation', 'basic-seo'];
    return foundationModuleIds.map(id => this.findModuleInPlaybooks(id, playbooks)).filter(Boolean) as LearningModule[];
  }

  private deduplicateModules(modules: LearningModule[]): LearningModule[] {
    const seen = new Set();
    return modules.filter(module => {
      if (seen.has(module.id)) return false;
      seen.add(module.id);
      return true;
    });
  }

  private prioritizeModules(modules: LearningModule[], assessment: ClientAssessment): LearningModule[] {
    return modules.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private calculateTotalDuration(modules: LearningModule[]): string {
    // Calculate total estimated duration
    const totalMinutes = modules.reduce((total, module) => {
      const duration = parseInt(module.duration) || 30;
      return total + duration;
    }, 0);

    if (totalMinutes < 60) return `${totalMinutes} minutes`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  private async saveLearningPath(path: LearningPath): Promise<void> {
    await fetch('/api/academy/learning-paths', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(path)
    });
  }

  private async analyzeIntent(message: string): Promise<{ type: string; confidence: number }> {
    // Simple intent analysis - could be enhanced with ML
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'can you explain'];
    const isQuestion = questionWords.some(word => message.toLowerCase().includes(word));
    
    if (message.toLowerCase().includes('quiz') || message.toLowerCase().includes('test')) {
      return { type: 'quiz_request', confidence: 0.9 };
    }
    
    if (isQuestion) {
      return { type: 'question', confidence: 0.8 };
    }
    
    return { type: 'general', confidence: 0.5 };
  }

  private async generateLLMResponse(prompt: string): Promise<string> {
    // Placeholder for LLM integration
    // In production, this would use OpenAI, Claude, or similar
    return "This would be generated by the LLM based on the prompt.";
  }

  private async getCurrentPlatformIssues(): Promise<any[]> {
    try {
      const response = await fetch(`/api/users/${this.userId}/issues`);
      return await response.json();
    } catch {
      return [];
    }
  }

  private isIssueRelatedToLesson(issue: any, lesson: any): boolean {
    // Check if the current issue relates to what they're learning
    const issueKeywords = issue.type.toLowerCase().split(' ');
    const lessonKeywords = lesson?.title.toLowerCase().split(' ') || [];
    
    return issueKeywords.some((keyword: string) => lessonKeywords.includes(keyword));
  }

  private extractTopicFromCommand(command: string): string {
    // Extract topic from admin command like "Create a new Master Playbook on 'Generative Content Creation'"
    const match = command.match(/on ['"](.+?)['"]/) || command.match(/on (.+)$/);
    return match ? match[1] : command;
  }

  private async generateModuleContent(moduleOutline: any): Promise<PlaybookModule> {
    // This would task ContentAgent and MediaAgent to create the actual content
    // For now, return placeholder structure
    return {
      id: `module_${Date.now()}`,
      title: moduleOutline.title,
      description: moduleOutline.description,
      lessons: [], // Would be populated by ContentAgent
      prerequisites: moduleOutline.prerequisites || [],
      learningObjectives: moduleOutline.learningObjectives || []
    };
  }

  private async saveToApprovalQueue(playbook: MasterPlaybook): Promise<void> {
    await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'master_playbook',
        title: `New Master Playbook: ${playbook.title}`,
        description: `Approve publication of new course: ${playbook.description}`,
        data: playbook,
        requestedBy: 'TrainingAgent',
        priority: 'medium'
      })
    });
  }
}

export default TrainingAgent;
