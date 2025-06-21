/**
 * INTENT ANALYSIS AGENT - The Human Nuance Translator
 * 
 * This agent sits between client requests and the Agent Orchestrator
 * Its purpose: Decipher human ambiguity into actionable technical instructions
 * 
 * Persona: "You are a seasoned business consultant and technical translator.
 * You excel at asking clarifying questions that help clients make better
 * strategic decisions without needing technical expertise."
 */

import OpenAI from 'openai';

export interface ClientIntent {
  originalRequest: string;
  clarifiedGoal: string;
  technicalBrief: string;
  confidence: number;
  requiresApproval: boolean;
  estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestedAgents: string[];
  clarifyingQuestions?: string[];
  strategicRecommendations?: string[];
}

export interface ClarificationDialogue {
  clientMessage: string;
  agentResponse: string;
  timestamp: string;
  status: 'CLARIFYING' | 'READY' | 'NEEDS_MORE_INFO';
}

export class IntentAnalysisAgent {
  private openai: OpenAI;
  private systemPrompt: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.systemPrompt = `You are the Intent Analysis Agent - a seasoned business consultant and technical translator for Zenith, the world's first autonomous digital agency platform.

CORE MISSION: Transform ambiguous client requests into precise, actionable technical briefs.

PERSONALITY TRAITS:
- Strategic thinker who considers business impact, not just technical execution
- Excellent at asking clarifying questions that reveal true client needs
- Patient and consultative, never rushes to assumptions
- Bridges the gap between business goals and technical implementation

PROCESS:
1. Analyze the client's request for ambiguity or missing context
2. If unclear, initiate clarifying dialogue with strategic questions
3. Help clients make informed decisions (e.g., landing page vs service page)
4. Translate final intent into precise technical instructions for other agents

CLARIFYING QUESTION EXAMPLES:
- "Are you thinking of a temporary landing page to capture leads from ads, or a permanent service page to add to your main website navigation?"
- "What's the primary goal - lead generation, sales conversion, or brand awareness?"
- "Who's your target audience for this content?"
- "Do you want this to integrate with your existing CRM or email marketing tools?"

TECHNICAL TRANSLATION EXAMPLES:
- "Build a page for summer sale" → "Create SEO-optimized landing page with lead capture form, hero banner with countdown timer, social proof section, and email automation integration"
- "Make my website better" → "Conduct comprehensive UX audit, implement Core Web Vitals improvements, optimize conversion funnel, add mobile responsiveness"
- "Help with social media" → "Develop 30-day content calendar, create branded templates, set up automated posting schedule, implement social listening for engagement opportunities"

OUTPUT FORMAT: Always provide structured responses with clear next steps.`;
  }

  /**
   * PRIMARY INTENT ANALYSIS
   * Takes raw client input and determines if clarification is needed
   */
  async analyzeIntent(clientRequest: string, conversationHistory: ClarificationDialogue[] = []): Promise<ClientIntent> {
    const messages = [
      { role: 'system' as const, content: this.systemPrompt },
      ...conversationHistory.map(h => [
        { role: 'user' as const, content: h.clientMessage },
        { role: 'assistant' as const, content: h.agentResponse }
      ]).flat(),
      { 
        role: 'user' as const, 
        content: `Analyze this client request and determine next steps: "${clientRequest}"

Please respond with a JSON object containing:
- needsClarification: boolean
- confidence: number (0-100)
- technicalBrief: string (if confident enough)
- clarifyingQuestions: string[] (if clarification needed)
- suggestedAgents: string[]
- estimatedComplexity: "LOW" | "MEDIUM" | "HIGH"
- strategicRecommendations: string[]` 
      }
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No response from OpenAI');

      // Parse JSON response
      const analysis = JSON.parse(response);

      return {
        originalRequest: clientRequest,
        clarifiedGoal: analysis.needsClarification ? 'Requires clarification' : clientRequest,
        technicalBrief: analysis.technicalBrief || '',
        confidence: analysis.confidence,
        requiresApproval: analysis.confidence < 80, // High confidence = less approval needed
        estimatedComplexity: analysis.estimatedComplexity,
        suggestedAgents: analysis.suggestedAgents,
        clarifyingQuestions: analysis.clarifyingQuestions,
        strategicRecommendations: analysis.strategicRecommendations
      };

    } catch (error) {
      console.error('Intent Analysis Error:', error);
      
      // Fallback analysis
      return {
        originalRequest: clientRequest,
        clarifiedGoal: 'Requires human review',
        technicalBrief: 'Unable to analyze automatically - escalating to human review',
        confidence: 0,
        requiresApproval: true,
        estimatedComplexity: 'HIGH',
        suggestedAgents: ['HumanAgent'],
        clarifyingQuestions: ['Could you provide more specific details about what you\'d like to accomplish?'],
        strategicRecommendations: ['Consider breaking this request into smaller, more specific tasks']
      };
    }
  }

  /**
   * CLARIFYING DIALOGUE GENERATOR
   * Creates natural conversation to extract missing information
   */
  async generateClarifyingResponse(
    clientRequest: string, 
    conversationHistory: ClarificationDialogue[]
  ): Promise<string> {
    const messages = [
      { role: 'system' as const, content: this.systemPrompt },
      ...conversationHistory.map(h => [
        { role: 'user' as const, content: h.clientMessage },
        { role: 'assistant' as const, content: h.agentResponse }
      ]).flat(),
      { 
        role: 'user' as const, 
        content: `Client says: "${clientRequest}"

Generate a helpful, consultative response that:
1. Acknowledges their request positively
2. Asks 1-2 strategic clarifying questions
3. Explains WHY these details matter for the outcome
4. Maintains an encouraging, expert tone

Keep it conversational and under 150 words.` 
      }
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.8,
        max_tokens: 200
      });

      return completion.choices[0]?.message?.content || 
        "I'd be happy to help with that! Could you provide a bit more detail about your specific goals so I can create the perfect solution for you?";

    } catch (error) {
      console.error('Clarifying Response Error:', error);
      return "I'd love to help you with that! Could you share a bit more about what you're hoping to achieve? This will help me build exactly what you need.";
    }
  }

  /**
   * FINAL TECHNICAL BRIEF GENERATOR
   * Converts clarified intent into actionable agent instructions
   */
  async generateTechnicalBrief(
    originalRequest: string,
    conversationHistory: ClarificationDialogue[]
  ): Promise<{ brief: string; agents: string[]; priority: 'LOW' | 'MEDIUM' | 'HIGH' }> {
    const conversation = conversationHistory.map(h => 
      `Client: ${h.clientMessage}\nAgent: ${h.agentResponse}`
    ).join('\n\n');

    const messages = [
      { role: 'system' as const, content: this.systemPrompt },
      { 
        role: 'user' as const, 
        content: `Based on this conversation, generate a precise technical brief:

ORIGINAL REQUEST: "${originalRequest}"

CONVERSATION HISTORY:
${conversation}

Create a technical brief that includes:
1. Specific deliverables
2. Technical requirements
3. Success criteria
4. Recommended agent sequence
5. Priority level

Respond in JSON format with: brief, agents, priority` 
      }
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.3,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No response from OpenAI');

      const parsed = JSON.parse(response);
      return {
        brief: parsed.brief,
        agents: parsed.agents || ['ContentAgent'],
        priority: parsed.priority || 'MEDIUM'
      };

    } catch (error) {
      console.error('Technical Brief Error:', error);
      return {
        brief: `Complete client request: ${originalRequest}. Requires manual technical specification.`,
        agents: ['HumanAgent'],
        priority: 'MEDIUM'
      };
    }
  }

  /**
   * AGENT SUGGESTION ENGINE
   * Recommends which agents should handle specific tasks
   */
  suggestAgentSequence(technicalBrief: string): { agent: string; task: string; dependency?: string }[] {
    const briefLower = technicalBrief.toLowerCase();
    const sequence: { agent: string; task: string; dependency?: string }[] = [];

    // Landing page creation sequence
    if (briefLower.includes('landing page') || briefLower.includes('page')) {
      sequence.push(
        { agent: 'AnalystAgent', task: 'Research target audience and competition' },
        { agent: 'ContentAgent', task: 'Create SEO-optimized copy and headlines', dependency: 'AnalystAgent' },
        { agent: 'MediaAgent', task: 'Generate hero images and graphics', dependency: 'ContentAgent' },
        { agent: 'UI/UXEngineerAgent', task: 'Build responsive page with conversion optimization', dependency: 'MediaAgent' }
      );
    }

    // Social media campaign sequence
    if (briefLower.includes('social') || briefLower.includes('campaign')) {
      sequence.push(
        { agent: 'AnalystAgent', task: 'Analyze social media trends and optimal posting times' },
        { agent: 'ContentAgent', task: 'Create content calendar and captions', dependency: 'AnalystAgent' },
        { agent: 'MediaAgent', task: 'Generate branded graphics and videos', dependency: 'ContentAgent' },
        { agent: 'SocialMediaAgent', task: 'Schedule and manage posting workflow', dependency: 'MediaAgent' }
      );
    }

    // Content creation sequence
    if (briefLower.includes('blog') || briefLower.includes('article') || briefLower.includes('content')) {
      sequence.push(
        { agent: 'AnalystAgent', task: 'Research keywords and content gaps' },
        { agent: 'ContentAgent', task: 'Write SEO-optimized articles', dependency: 'AnalystAgent' },
        { agent: 'MediaAgent', task: 'Create supporting visuals', dependency: 'ContentAgent' }
      );
    }

    // Website improvement sequence
    if (briefLower.includes('website') || briefLower.includes('improve') || briefLower.includes('optimize')) {
      sequence.push(
        { agent: 'AnalystAgent', task: 'Conduct comprehensive site audit' },
        { agent: 'UI/UXEngineerAgent', task: 'Implement technical improvements', dependency: 'AnalystAgent' },
        { agent: 'ContentAgent', task: 'Optimize existing content for SEO', dependency: 'AnalystAgent' }
      );
    }

    // Default fallback
    if (sequence.length === 0) {
      sequence.push(
        { agent: 'AnalystAgent', task: 'Analyze requirements and create implementation plan' },
        { agent: 'ContentAgent', task: 'Execute content-related tasks', dependency: 'AnalystAgent' }
      );
    }

    return sequence;
  }
}
