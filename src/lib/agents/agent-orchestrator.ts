/**
 * AI Agent Orchestrator
 * Multi-model AI agent management and execution system
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/monitoring/enhanced-sentry';
import { z } from 'zod';

// Agent Types and Schemas
export const AgentConfigSchema = z.object({
  model: z.string(),
  provider: z.enum(['openai', 'anthropic', 'google']),
  temperature: z.number().min(0).max(1).default(0.7),
  maxTokens: z.number().min(1).max(128000).default(4000),
  systemPrompt: z.string(),
  capabilities: z.array(z.string()).default([]),
  tools: z.record(z.any()).optional(),
  rateLimits: z.object({
    requestsPerMinute: z.number().default(60),
    tokensPerMinute: z.number().default(100000)
  }).default({})
});

export const AgentExecutionRequestSchema = z.object({
  agentId: z.string(),
  task: z.string(),
  input: z.record(z.any()).default({}),
  context: z.record(z.any()).optional(),
  options: z.object({
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    systemPrompt: z.string().optional(),
    stream: z.boolean().default(false)
  }).default({})
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type AgentExecutionRequest = z.infer<typeof AgentExecutionRequestSchema>;

// Agent Execution Result
export interface AgentExecutionResult {
  success: boolean;
  output: string;
  metadata: {
    model: string;
    provider: string;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    cost: number;
    duration: number;
    finishReason: string;
  };
  error?: string;
}

// Agent Provider Interface
export interface AgentProvider {
  execute(config: AgentConfig, request: AgentExecutionRequest): Promise<AgentExecutionResult>;
  validateConfig(config: AgentConfig): Promise<boolean>;
  getModels(): string[];
  calculateCost(tokens: number, model: string): number;
}

// Main Agent Orchestrator Class
export class AgentOrchestrator {
  private providers: Map<string, AgentProvider> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();

  constructor() {
    this.initializeProviders();
  }

  // Execute agent task
  async executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
    try {
      // Validate request
      const validatedRequest = AgentExecutionRequestSchema.parse(request);

      // Get agent configuration
      const agent = await prisma.aIAgent.findUnique({
        where: { id: validatedRequest.agentId }
      });

      if (!agent) {
        throw new Error(`Agent not found: ${validatedRequest.agentId}`);
      }

      if (!agent.isActive) {
        throw new Error(`Agent is not active: ${validatedRequest.agentId}`);
      }

      // Parse agent configuration
      const config = AgentConfigSchema.parse({
        model: agent.model,
        provider: agent.provider,
        temperature: validatedRequest.options.temperature ?? agent.temperature,
        maxTokens: validatedRequest.options.maxTokens ?? agent.maxTokens,
        systemPrompt: validatedRequest.options.systemPrompt ?? agent.systemPrompt,
        capabilities: agent.capabilities,
        tools: agent.tools,
        rateLimits: {
          requestsPerMinute: 60,
          tokensPerMinute: 100000
        }
      });

      // Check rate limits
      await this.checkRateLimit(agent.id, config.rateLimits);

      // Get provider
      const provider = this.providers.get(config.provider);
      if (!provider) {
        throw new Error(`Provider not found: ${config.provider}`);
      }

      // Create execution record
      const execution = await prisma.agentExecution.create({
        data: {
          agentId: validatedRequest.agentId,
          task: validatedRequest.task,
          input: validatedRequest.input,
          status: 'PENDING'
        }
      });

      try {
        // Update to running
        await prisma.agentExecution.update({
          where: { id: execution.id },
          data: {
            status: 'RUNNING',
            startedAt: new Date()
          }
        });

        // Execute agent task
        const result = await provider.execute(config, validatedRequest);

        // Update execution with results
        await prisma.agentExecution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            duration: result.metadata.duration,
            output: { output: result.output, metadata: result.metadata },
            tokens: result.metadata.tokens.total,
            cost: result.metadata.cost
          }
        });

        // Update agent metrics
        await this.updateAgentMetrics(agent.id, result);

        return result;
      } catch (error) {
        await prisma.agentExecution.update({
          where: { id: execution.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            error: error.message
          }
        });
        throw error;
      }
    } catch (error) {
      logger.error('Agent execution failed', {
        agentId: request.agentId,
        error: error.message
      });
      throw error;
    }
  }

  // Create new agent
  async createAgent(
    teamId: string,
    config: {
      name: string;
      type: string;
      description?: string;
      provider: string;
      model: string;
      systemPrompt: string;
      capabilities?: string[];
      temperature?: number;
      maxTokens?: number;
    },
    createdBy: string
  ): Promise<string> {
    try {
      const agent = await prisma.aIAgent.create({
        data: {
          name: config.name,
          type: config.type as any,
          description: config.description,
          provider: config.provider,
          model: config.model,
          systemPrompt: config.systemPrompt,
          capabilities: config.capabilities || [],
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 4000,
          teamId,
          createdBy,
          config: {}
        }
      });

      logger.info('Agent created', {
        agentId: agent.id,
        teamId,
        provider: config.provider,
        model: config.model
      });

      return agent.id;
    } catch (error) {
      logger.error('Failed to create agent', {
        teamId,
        error: error.message
      });
      throw error;
    }
  }

  // Update agent configuration
  async updateAgent(
    agentId: string,
    updates: Partial<{
      name: string;
      description: string;
      systemPrompt: string;
      temperature: number;
      maxTokens: number;
      capabilities: string[];
      isActive: boolean;
    }>
  ): Promise<void> {
    try {
      await prisma.aIAgent.update({
        where: { id: agentId },
        data: updates
      });

      logger.info('Agent updated', { agentId, updates });
    } catch (error) {
      logger.error('Failed to update agent', {
        agentId,
        error: error.message
      });
      throw error;
    }
  }

  // Get agent analytics
  async getAgentAnalytics(agentId: string, timeframe?: { from: Date; to: Date }) {
    const whereClause: any = { agentId };
    
    if (timeframe) {
      whereClause.createdAt = {
        gte: timeframe.from,
        lte: timeframe.to
      };
    }

    const [executions, totalExecutions, successfulExecutions, averageMetrics] = await Promise.all([
      prisma.agentExecution.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      prisma.agentExecution.count({ where: whereClause }),
      prisma.agentExecution.count({
        where: { ...whereClause, status: 'COMPLETED' }
      }),
      prisma.agentExecution.aggregate({
        where: { ...whereClause, status: 'COMPLETED' },
        _avg: {
          duration: true,
          tokens: true,
          cost: true
        },
        _sum: {
          tokens: true,
          cost: true
        }
      })
    ]);

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions: totalExecutions - successfulExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
      averageDuration: averageMetrics._avg.duration || 0,
      averageTokens: averageMetrics._avg.tokens || 0,
      totalTokens: averageMetrics._sum.tokens || 0,
      totalCost: averageMetrics._sum.cost || 0,
      recentExecutions: executions
    };
  }

  // Initialize providers
  private initializeProviders(): void {
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('anthropic', new AnthropicProvider());
    this.providers.set('google', new GoogleProvider());
  }

  // Check rate limits
  private async checkRateLimit(agentId: string, limits: { requestsPerMinute: number; tokensPerMinute: number }): Promise<void> {
    const key = `agent:${agentId}`;
    
    if (!this.rateLimiters.has(key)) {
      this.rateLimiters.set(key, new RateLimiter(limits.requestsPerMinute, 60000));
    }

    const limiter = this.rateLimiters.get(key)!;
    const allowed = await limiter.checkLimit();
    
    if (!allowed) {
      throw new Error('Rate limit exceeded for agent');
    }
  }

  // Update agent metrics
  private async updateAgentMetrics(agentId: string, result: AgentExecutionResult): Promise<void> {
    await prisma.aIAgent.update({
      where: { id: agentId },
      data: {
        totalInteractions: { increment: 1 },
        averageResponseTime: result.metadata.duration,
        successRate: result.success ? 100 : 0 // Simplified - should be calculated properly
      }
    });
  }
}

// Rate Limiter Implementation
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }
}

// OpenAI Provider Implementation
class OpenAIProvider implements AgentProvider {
  async execute(config: AgentConfig, request: AgentExecutionRequest): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    try {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const prompt = this.buildPrompt(config.systemPrompt, request.task, request.input);

      const response = await openai.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens
      });

      const duration = Date.now() - startTime;
      const tokens = {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0
      };

      return {
        success: true,
        output: response.choices[0]?.message?.content || '',
        metadata: {
          model: config.model,
          provider: 'openai',
          tokens,
          cost: this.calculateCost(tokens.total, config.model),
          duration,
          finishReason: response.choices[0]?.finish_reason || 'unknown'
        }
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        metadata: {
          model: config.model,
          provider: 'openai',
          tokens: { prompt: 0, completion: 0, total: 0 },
          cost: 0,
          duration: Date.now() - startTime,
          finishReason: 'error'
        },
        error: error.message
      };
    }
  }

  async validateConfig(config: AgentConfig): Promise<boolean> {
    const validModels = this.getModels();
    return validModels.includes(config.model);
  }

  getModels(): string[] {
    return [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ];
  }

  calculateCost(tokens: number, model: string): number {
    // OpenAI pricing in cents per 1K tokens
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 3.0, output: 6.0 },
      'gpt-4-turbo': { input: 1.0, output: 3.0 },
      'gpt-3.5-turbo': { input: 0.15, output: 0.2 }
    };

    const rate = pricing[model] || pricing['gpt-4'];
    return (tokens / 1000) * rate.output; // Simplified - assume output tokens
  }

  private buildPrompt(systemPrompt: string, task: string, input: Record<string, any>): string {
    return `Task: ${task}\n\nInput Data:\n${JSON.stringify(input, null, 2)}`;
  }
}

// Anthropic Provider Implementation
class AnthropicProvider implements AgentProvider {
  async execute(config: AgentConfig, request: AgentExecutionRequest): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    try {
      const { Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });

      const prompt = this.buildPrompt(config.systemPrompt, request.task, request.input);

      const response = await anthropic.messages.create({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: config.systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      });

      const duration = Date.now() - startTime;
      const tokens = {
        prompt: response.usage.input_tokens || 0,
        completion: response.usage.output_tokens || 0,
        total: (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0)
      };

      return {
        success: true,
        output: response.content[0]?.text || '',
        metadata: {
          model: config.model,
          provider: 'anthropic',
          tokens,
          cost: this.calculateCost(tokens.total, config.model),
          duration,
          finishReason: response.stop_reason || 'unknown'
        }
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        metadata: {
          model: config.model,
          provider: 'anthropic',
          tokens: { prompt: 0, completion: 0, total: 0 },
          cost: 0,
          duration: Date.now() - startTime,
          finishReason: 'error'
        },
        error: error.message
      };
    }
  }

  async validateConfig(config: AgentConfig): Promise<boolean> {
    const validModels = this.getModels();
    return validModels.includes(config.model);
  }

  getModels(): string[] {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-haiku-20240307',
      'claude-3-opus-20240229'
    ];
  }

  calculateCost(tokens: number, model: string): number {
    // Anthropic pricing in cents per 1K tokens
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-5-sonnet-20241022': { input: 0.3, output: 1.5 },
      'claude-3-haiku-20240307': { input: 0.025, output: 0.125 },
      'claude-3-opus-20240229': { input: 1.5, output: 7.5 }
    };

    const rate = pricing[model] || pricing['claude-3-5-sonnet-20241022'];
    return (tokens / 1000) * rate.output; // Simplified
  }

  private buildPrompt(systemPrompt: string, task: string, input: Record<string, any>): string {
    return `Task: ${task}\n\nInput Data:\n${JSON.stringify(input, null, 2)}`;
  }
}

// Google Provider Implementation (placeholder)
class GoogleProvider implements AgentProvider {
  async execute(config: AgentConfig, request: AgentExecutionRequest): Promise<AgentExecutionResult> {
    throw new Error('Google provider not yet implemented');
  }

  async validateConfig(config: AgentConfig): Promise<boolean> {
    return false;
  }

  getModels(): string[] {
    return ['gemini-pro', 'gemini-pro-vision'];
  }

  calculateCost(tokens: number, model: string): number {
    return 0; // To be implemented
  }
}

// Singleton instance
export const agentOrchestrator = new AgentOrchestrator();