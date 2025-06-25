/**
 * AI Agent Node Executor
 * Executes AI agent tasks within workflows
 */

import { NodeExecutor, WorkflowNode, ExecutionContext, NodeMetadata } from '../workflow-engine';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/monitoring/enhanced-sentry';

interface AIAgentConfig {
  agentId: string;
  task: string;
  input: Record<string, any>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export class AIAgentExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    try {
      const config = node.config as AIAgentConfig;
      
      if (!config.agentId) {
        throw new Error('AI Agent ID is required');
      }

      // Get agent configuration
      const agent = await prisma.aIAgent.findUnique({
        where: { id: config.agentId }
      });

      if (!agent) {
        throw new Error(`AI Agent not found: ${config.agentId}`);
      }

      if (!agent.isActive) {
        throw new Error(`AI Agent is not active: ${config.agentId}`);
      }

      // Prepare agent execution
      const task = this.interpolateString(config.task, context);
      const input = this.interpolateObject(config.input, context);

      // Create agent execution record
      const execution = await prisma.agentExecution.create({
        data: {
          agentId: config.agentId,
          task,
          input,
          status: 'PENDING',
          userId: context.userId,
          workflowExecutionId: context.executionId
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
        const result = await this.executeAgentTask(agent, task, input, config);

        // Update execution with results
        await prisma.agentExecution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            duration: Date.now() - new Date(execution.createdAt).getTime(),
            output: result,
            tokens: result.tokens,
            cost: result.cost
          }
        });

        // Update agent metrics
        await this.updateAgentMetrics(agent.id, result);

        return result.output;
      } catch (error) {
        await prisma.agentExecution.update({
          where: { id: execution.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            duration: Date.now() - new Date(execution.createdAt).getTime(),
            error: error.message
          }
        });
        throw error;
      }
    } catch (error) {
      logger.error('AI Agent execution failed', {
        nodeId: node.id,
        executionId: context.executionId,
        error: error.message
      });
      throw error;
    }
  }

  private async executeAgentTask(
    agent: any,
    task: string,
    input: Record<string, any>,
    config: AIAgentConfig
  ): Promise<any> {
    const startTime = Date.now();

    try {
      // Prepare the prompt
      const systemPrompt = config.systemPrompt || agent.systemPrompt;
      const temperature = config.temperature ?? agent.temperature;
      const maxTokens = config.maxTokens ?? agent.maxTokens;

      // Create the full prompt
      const fullPrompt = `${systemPrompt}\n\nTask: ${task}\n\nInput Data:\n${JSON.stringify(input, null, 2)}`;

      let result;
      let tokens = 0;
      let cost = 0;

      // Execute based on agent provider
      switch (agent.provider) {
        case 'openai':
          result = await this.executeOpenAIAgent(fullPrompt, temperature, maxTokens);
          tokens = result.usage?.total_tokens || 0;
          cost = this.calculateOpenAICost(tokens, agent.model);
          break;

        case 'anthropic':
          result = await this.executeAnthropicAgent(fullPrompt, temperature, maxTokens);
          tokens = result.usage?.total_tokens || 0;
          cost = this.calculateAnthropicCost(tokens, agent.model);
          break;

        case 'google':
          result = await this.executeGoogleAgent(fullPrompt, temperature, maxTokens);
          tokens = result.usage?.total_tokens || 0;
          cost = this.calculateGoogleCost(tokens, agent.model);
          break;

        default:
          throw new Error(`Unsupported agent provider: ${agent.provider}`);
      }

      return {
        output: result.content || result.text || result.message,
        tokens,
        cost,
        duration: Date.now() - startTime,
        model: agent.model,
        provider: agent.provider
      };
    } catch (error) {
      logger.error('Agent task execution failed', {
        agentId: agent.id,
        provider: agent.provider,
        error: error.message
      });
      throw error;
    }
  }

  private async executeOpenAIAgent(prompt: string, temperature: number, maxTokens: number): Promise<any> {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens
    });

    return {
      content: response.choices[0]?.message?.content,
      usage: response.usage
    };
  }

  private async executeAnthropicAgent(prompt: string, temperature: number, maxTokens: number): Promise<any> {
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }]
    });

    return {
      content: response.content[0]?.text,
      usage: response.usage
    };
  }

  private async executeGoogleAgent(prompt: string, temperature: number, maxTokens: number): Promise<any> {
    // Google AI implementation would go here
    throw new Error('Google AI provider not yet implemented');
  }

  private calculateOpenAICost(tokens: number, model: string): number {
    // OpenAI pricing (cents per 1K tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 3.0, output: 6.0 },
      'gpt-4-turbo': { input: 1.0, output: 3.0 },
      'gpt-3.5-turbo': { input: 0.15, output: 0.2 }
    };

    const rate = pricing[model] || pricing['gpt-4'];
    return (tokens / 1000) * rate.output; // Simplified - assume output tokens
  }

  private calculateAnthropicCost(tokens: number, model: string): number {
    // Anthropic pricing (cents per 1K tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-5-sonnet-20241022': { input: 0.3, output: 1.5 },
      'claude-3-haiku-20240307': { input: 0.025, output: 0.125 }
    };

    const rate = pricing[model] || pricing['claude-3-5-sonnet-20241022'];
    return (tokens / 1000) * rate.output;
  }

  private calculateGoogleCost(tokens: number, model: string): number {
    // Google AI pricing would go here
    return 0;
  }

  private async updateAgentMetrics(agentId: string, result: any): Promise<void> {
    await prisma.aIAgent.update({
      where: { id: agentId },
      data: {
        totalInteractions: { increment: 1 },
        averageResponseTime: result.duration,
        successRate: 100 // Will be calculated properly with failure tracking
      }
    });
  }

  private interpolateString(template: string, context: ExecutionContext): string {
    let result = template;
    
    // Replace variables: {{variable}}
    const variables = { ...context.variables, ...context.nodeOutputs };
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  private interpolateObject(obj: Record<string, any>, context: ExecutionContext): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.interpolateString(value, context);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.interpolateObject(value, context);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  async validate(node: WorkflowNode): Promise<boolean> {
    const config = node.config as AIAgentConfig;
    
    if (!config.agentId) {
      throw new Error('AI Agent ID is required');
    }

    const agent = await prisma.aIAgent.findUnique({
      where: { id: config.agentId }
    });

    if (!agent) {
      throw new Error(`AI Agent not found: ${config.agentId}`);
    }

    return true;
  }

  getMetadata(): NodeMetadata {
    return {
      category: 'AI & ML',
      description: 'Execute tasks using AI agents with various models and capabilities',
      inputs: [
        {
          name: 'data',
          type: 'object',
          required: false,
          description: 'Input data to pass to the AI agent'
        }
      ],
      outputs: [
        {
          name: 'result',
          type: 'string',
          description: 'AI agent response'
        },
        {
          name: 'metadata',
          type: 'object',
          description: 'Execution metadata including tokens used and cost'
        }
      ],
      config: [
        {
          name: 'agentId',
          type: 'string',
          required: true,
          description: 'ID of the AI agent to use'
        },
        {
          name: 'task',
          type: 'string',
          required: true,
          description: 'Task description for the AI agent'
        },
        {
          name: 'input',
          type: 'object',
          required: false,
          description: 'Input data object',
          defaultValue: {}
        },
        {
          name: 'temperature',
          type: 'number',
          required: false,
          description: 'Model temperature (0-1)',
          defaultValue: 0.7
        },
        {
          name: 'maxTokens',
          type: 'number',
          required: false,
          description: 'Maximum tokens to generate',
          defaultValue: 4000
        }
      ]
    };
  }
}