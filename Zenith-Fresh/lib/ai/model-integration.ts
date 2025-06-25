import { prisma } from '@/lib/prisma';

export interface AIModelConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'local' | 'custom';
  modelId: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  [key: string]: any;
}

export interface AIResponse {
  content: string;
  tokenCount: number;
  latency: number;
  cost: number;
  model: string;
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export class AIModelIntegration {
  private config: AIModelConfig;
  private startTime: number = 0;

  constructor(config: AIModelConfig) {
    this.config = config;
  }

  async generateResponse(
    messages: AIMessage[],
    options?: Partial<AIModelConfig>
  ): Promise<AIResponse> {
    this.startTime = Date.now();
    const mergedConfig = { ...this.config, ...options };

    try {
      switch (mergedConfig.provider) {
        case 'openai':
          return await this.callOpenAI(messages, mergedConfig);
        case 'anthropic':
          return await this.callAnthropic(messages, mergedConfig);
        case 'google':
          return await this.callGoogle(messages, mergedConfig);
        case 'local':
          return await this.callLocal(messages, mergedConfig);
        case 'custom':
          return await this.callCustom(messages, mergedConfig);
        default:
          throw new Error(`Unsupported provider: ${mergedConfig.provider}`);
      }
    } catch (error) {
      console.error('AI model integration error:', error);
      throw error;
    }
  }

  private async callOpenAI(messages: AIMessage[], config: AIModelConfig): Promise<AIResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey || process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          ...(msg.functionCall && { function_call: msg.functionCall })
        })),
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1000,
        top_p: config.topP || 1,
        frequency_penalty: config.frequencyPenalty || 0,
        presence_penalty: config.presencePenalty || 0,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const latency = Date.now() - this.startTime;
    
    return {
      content: data.choices[0]?.message?.content || '',
      tokenCount: data.usage?.total_tokens || 0,
      latency,
      cost: this.calculateOpenAICost(data.usage, config.modelId),
      model: config.modelId,
      finishReason: data.choices[0]?.finish_reason || 'unknown',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }

  private async callAnthropic(messages: AIMessage[], config: AIModelConfig): Promise<AIResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey || process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.modelId,
        max_tokens: config.maxTokens || 1000,
        temperature: config.temperature || 0.7,
        top_p: config.topP || 1,
        messages: messages.filter(msg => msg.role !== 'system').map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        })),
        system: config.systemPrompt || messages.find(msg => msg.role === 'system')?.content,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const latency = Date.now() - this.startTime;
    
    return {
      content: data.content?.[0]?.text || '',
      tokenCount: data.usage?.input_tokens + data.usage?.output_tokens || 0,
      latency,
      cost: this.calculateAnthropicCost(data.usage, config.modelId),
      model: config.modelId,
      finishReason: data.stop_reason || 'unknown',
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    };
  }

  private async callGoogle(messages: AIMessage[], config: AIModelConfig): Promise<AIResponse> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.modelId}:generateContent?key=${config.apiKey || process.env.GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          temperature: config.temperature || 0.7,
          topP: config.topP || 1,
          maxOutputTokens: config.maxTokens || 1000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google AI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const latency = Date.now() - this.startTime;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokenCount = this.estimateTokenCount(content);
    
    return {
      content,
      tokenCount,
      latency,
      cost: this.calculateGoogleCost(tokenCount, config.modelId),
      model: config.modelId,
      finishReason: data.candidates?.[0]?.finishReason || 'unknown',
      usage: {
        promptTokens: 0, // Google doesn't provide detailed token usage
        completionTokens: tokenCount,
        totalTokens: tokenCount,
      },
    };
  }

  private async callLocal(messages: AIMessage[], config: AIModelConfig): Promise<AIResponse> {
    const baseUrl = config.baseUrl || 'http://localhost:11434';
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        options: {
          temperature: config.temperature || 0.7,
          top_p: config.topP || 1,
          num_ctx: config.maxTokens || 2048,
        },
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Local model API error: ${response.statusText}`);
    }

    const data = await response.json();
    const latency = Date.now() - this.startTime;
    const content = data.message?.content || '';
    const tokenCount = this.estimateTokenCount(content);
    
    return {
      content,
      tokenCount,
      latency,
      cost: 0, // Local models have no cost
      model: config.modelId,
      finishReason: data.done ? 'stop' : 'unknown',
      usage: {
        promptTokens: 0,
        completionTokens: tokenCount,
        totalTokens: tokenCount,
      },
    };
  }

  private async callCustom(messages: AIMessage[], config: AIModelConfig): Promise<AIResponse> {
    if (!config.baseUrl) {
      throw new Error('Custom provider requires baseUrl');
    }

    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
      },
      body: JSON.stringify({
        model: config.modelId,
        messages,
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1000,
        ...config,
      }),
    });

    if (!response.ok) {
      throw new Error(`Custom provider API error: ${response.statusText}`);
    }

    const data = await response.json();
    const latency = Date.now() - this.startTime;
    
    return {
      content: data.content || data.message?.content || '',
      tokenCount: data.tokenCount || this.estimateTokenCount(data.content || ''),
      latency,
      cost: data.cost || 0,
      model: config.modelId,
      finishReason: data.finishReason || 'unknown',
      usage: data.usage || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }

  private calculateOpenAICost(usage: any, model: string): number {
    const costPer1kTokens = this.getOpenAICostPer1kTokens(model);
    return ((usage?.total_tokens || 0) / 1000) * costPer1kTokens;
  }

  private calculateAnthropicCost(usage: any, model: string): number {
    const costPer1kTokens = this.getAnthropicCostPer1kTokens(model);
    return ((usage?.input_tokens + usage?.output_tokens || 0) / 1000) * costPer1kTokens;
  }

  private calculateGoogleCost(tokens: number, model: string): number {
    const costPer1kTokens = this.getGoogleCostPer1kTokens(model);
    return (tokens / 1000) * costPer1kTokens;
  }

  private getOpenAICostPer1kTokens(model: string): number {
    const costs: Record<string, number> = {
      'gpt-4': 0.03,
      'gpt-4-32k': 0.06,
      'gpt-4-turbo': 0.01,
      'gpt-4o': 0.005,
      'gpt-3.5-turbo': 0.002,
      'gpt-3.5-turbo-16k': 0.004,
    };
    return costs[model] || 0.002;
  }

  private getAnthropicCostPer1kTokens(model: string): number {
    const costs: Record<string, number> = {
      'claude-3-opus-20240229': 0.015,
      'claude-3-sonnet-20240229': 0.003,
      'claude-3-haiku-20240307': 0.00025,
      'claude-3-5-sonnet-20241022': 0.003,
    };
    return costs[model] || 0.003;
  }

  private getGoogleCostPer1kTokens(model: string): number {
    const costs: Record<string, number> = {
      'gemini-1.5-pro': 0.0035,
      'gemini-1.5-flash': 0.000075,
      'gemini-pro': 0.0005,
    };
    return costs[model] || 0.0005;
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }
}

// Model registry and management
export class AIModelRegistry {
  static async getAvailableModels(): Promise<any[]> {
    try {
      return await prisma.aIModel.findMany({
        where: { isAvailable: true },
        orderBy: [
          { provider: 'asc' },
          { name: 'asc' }
        ]
      });
    } catch (error) {
      console.error('Error fetching available models:', error);
      return [];
    }
  }

  static async getModel(modelId: string): Promise<any | null> {
    try {
      return await prisma.aIModel.findUnique({
        where: { id: modelId }
      });
    } catch (error) {
      console.error('Error fetching model:', error);
      return null;
    }
  }

  static async updateModelMetrics(modelId: string, metrics: {
    averageLatency?: number;
    reliability?: number;
    qualityScore?: number;
  }): Promise<void> {
    try {
      await prisma.aIModel.update({
        where: { id: modelId },
        data: {
          averageLatency: metrics.averageLatency,
          reliability: metrics.reliability,
          qualityScore: metrics.qualityScore,
          updatedAt: new Date(),
        }
      });
    } catch (error) {
      console.error('Error updating model metrics:', error);
    }
  }

  static async createModel(modelData: {
    name: string;
    provider: string;
    modelId: string;
    version?: string;
    capabilities: string[];
    contextLength?: number;
    costPer1kTokens?: number;
    configuration?: any;
  }): Promise<any> {
    try {
      return await prisma.aIModel.create({
        data: {
          name: modelData.name,
          provider: modelData.provider,
          modelId: modelData.modelId,
          version: modelData.version,
          capabilities: modelData.capabilities,
          contextLength: modelData.contextLength || 4096,
          costPer1kTokens: modelData.costPer1kTokens || 0,
          configuration: modelData.configuration,
        }
      });
    } catch (error) {
      console.error('Error creating model:', error);
      throw error;
    }
  }
}

// Model selection and optimization
export class AIModelSelector {
  static async selectOptimalModel(criteria: {
    task: 'conversation' | 'analysis' | 'code' | 'reasoning';
    maxLatency?: number;
    maxCost?: number;
    minQuality?: number;
    capabilities?: string[];
    contextLength?: number;
  }): Promise<any | null> {
    try {
      const models = await prisma.aIModel.findMany({
        where: {
          isAvailable: true,
          ...(criteria.capabilities && {
            capabilities: { hasEvery: criteria.capabilities }
          }),
          ...(criteria.contextLength && {
            contextLength: { gte: criteria.contextLength }
          }),
          ...(criteria.maxLatency && {
            averageLatency: { lte: criteria.maxLatency }
          }),
          ...(criteria.maxCost && {
            costPer1kTokens: { lte: criteria.maxCost }
          }),
          ...(criteria.minQuality && {
            qualityScore: { gte: criteria.minQuality }
          }),
        },
        orderBy: [
          { qualityScore: 'desc' },
          { reliability: 'desc' },
          { averageLatency: 'asc' },
          { costPer1kTokens: 'asc' }
        ]
      });

      return models[0] || null;
    } catch (error) {
      console.error('Error selecting optimal model:', error);
      return null;
    }
  }

  static calculateModelScore(model: any, criteria: {
    priorityWeights: {
      quality: number;
      speed: number;
      cost: number;
      reliability: number;
    };
  }): number {
    const weights = criteria.priorityWeights;
    const maxLatency = 5000; // 5 seconds max
    const maxCost = 0.1; // $0.1 per 1k tokens max

    const qualityScore = model.qualityScore || 0;
    const speedScore = Math.max(0, 1 - (model.averageLatency || 0) / maxLatency);
    const costScore = Math.max(0, 1 - (model.costPer1kTokens || 0) / maxCost);
    const reliabilityScore = model.reliability || 0;

    return (
      qualityScore * weights.quality +
      speedScore * weights.speed +
      costScore * weights.cost +
      reliabilityScore * weights.reliability
    ) / (weights.quality + weights.speed + weights.cost + weights.reliability);
  }
}

// Performance tracking and optimization
export class AIPerformanceTracker {
  static async recordInteraction(agentId: string, modelId: string, metrics: {
    latency: number;
    cost: number;
    tokenCount: number;
    qualityScore?: number;
    success: boolean;
  }): Promise<void> {
    try {
      // Record performance metric
      await prisma.aIPerformanceMetric.create({
        data: {
          agentId,
          modelId,
          metricType: 'latency',
          value: metrics.latency,
          unit: 'ms',
          timeWindow: 'minute',
          aggregation: 'avg',
        }
      });

      await prisma.aIPerformanceMetric.create({
        data: {
          agentId,
          modelId,
          metricType: 'cost',
          value: metrics.cost,
          unit: 'usd',
          timeWindow: 'minute',
          aggregation: 'sum',
        }
      });

      if (metrics.qualityScore !== undefined) {
        await prisma.aIPerformanceMetric.create({
          data: {
            agentId,
            modelId,
            metricType: 'quality',
            value: metrics.qualityScore,
            unit: 'score',
            timeWindow: 'minute',
            aggregation: 'avg',
          }
        });
      }

      // Update agent performance metrics
      const agent = await prisma.aIAgent.findUnique({
        where: { id: agentId }
      });

      if (agent) {
        const newInteractionCount = agent.totalInteractions + 1;
        const newSuccessRate = metrics.success 
          ? (agent.successRate * agent.totalInteractions + 1) / newInteractionCount
          : (agent.successRate * agent.totalInteractions) / newInteractionCount;
        const newAvgResponseTime = (agent.averageResponseTime * agent.totalInteractions + metrics.latency) / newInteractionCount;
        const newCostPerInteraction = (agent.costPerInteraction * agent.totalInteractions + metrics.cost) / newInteractionCount;

        await prisma.aIAgent.update({
          where: { id: agentId },
          data: {
            totalInteractions: newInteractionCount,
            successRate: newSuccessRate,
            averageResponseTime: Math.round(newAvgResponseTime),
            costPerInteraction: newCostPerInteraction,
          }
        });
      }

    } catch (error) {
      console.error('Error recording AI interaction:', error);
    }
  }

  static async getPerformanceMetrics(agentId: string, timeWindow: string = 'hour'): Promise<any[]> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      return await prisma.aIPerformanceMetric.findMany({
        where: {
          agentId,
          timeWindow,
          timestamp: { gte: twentyFourHoursAgo }
        },
        orderBy: { timestamp: 'desc' }
      });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return [];
    }
  }
}