/**
 * Delay Node Executor
 * Handles time delays in workflows
 */

import { NodeExecutor, WorkflowNode, ExecutionContext, NodeMetadata } from '../workflow-engine';
import { logger } from '@/lib/monitoring/enhanced-sentry';

interface DelayConfig {
  duration: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
  description?: string;
}

export class DelayExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    try {
      const config = node.config as DelayConfig;
      
      const delayMs = this.convertToMilliseconds(config.duration, config.unit);
      
      logger.info('Delay node executed', {
        nodeId: node.id,
        executionId: context.executionId,
        duration: config.duration,
        unit: config.unit,
        delayMs
      });

      const startTime = Date.now();
      await this.delay(delayMs);
      const actualDelay = Date.now() - startTime;

      return {
        delayed: true,
        duration: config.duration,
        unit: config.unit,
        actualDelayMs: actualDelay,
        completedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Delay execution failed', {
        nodeId: node.id,
        executionId: context.executionId,
        error: error.message
      });
      throw error;
    }
  }

  private convertToMilliseconds(duration: number, unit: string): number {
    switch (unit) {
      case 'seconds':
        return duration * 1000;
      case 'minutes':
        return duration * 60 * 1000;
      case 'hours':
        return duration * 60 * 60 * 1000;
      case 'days':
        return duration * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Invalid time unit: ${unit}`);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async validate(node: WorkflowNode): Promise<boolean> {
    const config = node.config as DelayConfig;
    
    if (!config.duration || config.duration <= 0) {
      throw new Error('Delay duration must be greater than 0');
    }

    const validUnits = ['seconds', 'minutes', 'hours', 'days'];
    if (!validUnits.includes(config.unit)) {
      throw new Error(`Invalid time unit: ${config.unit}`);
    }

    // Check for reasonable limits
    const maxDelayMs = 24 * 60 * 60 * 1000; // 24 hours
    const delayMs = this.convertToMilliseconds(config.duration, config.unit);
    
    if (delayMs > maxDelayMs) {
      throw new Error('Delay cannot exceed 24 hours');
    }

    return true;
  }

  getMetadata(): NodeMetadata {
    return {
      category: 'Utility',
      description: 'Add time delays to control workflow execution timing',
      inputs: [
        {
          name: 'data',
          type: 'object',
          required: false,
          description: 'Input data (passed through unchanged)'
        }
      ],
      outputs: [
        {
          name: 'delayed',
          type: 'boolean',
          description: 'Whether the delay was completed'
        },
        {
          name: 'actualDelayMs',
          type: 'number',
          description: 'Actual delay in milliseconds'
        },
        {
          name: 'completedAt',
          type: 'string',
          description: 'ISO timestamp when delay completed'
        }
      ],
      config: [
        {
          name: 'duration',
          type: 'number',
          required: true,
          description: 'Delay duration'
        },
        {
          name: 'unit',
          type: 'select',
          required: true,
          description: 'Time unit',
          defaultValue: 'seconds'
        },
        {
          name: 'description',
          type: 'string',
          required: false,
          description: 'Optional description of the delay purpose'
        }
      ]
    };
  }
}