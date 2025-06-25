/**
 * Trigger Node Executor
 * Handles workflow trigger events
 */

import { NodeExecutor, WorkflowNode, ExecutionContext, NodeMetadata } from '../workflow-engine';
import { logger } from '@/lib/monitoring/enhanced-sentry';

interface TriggerConfig {
  type: 'manual' | 'webhook' | 'schedule' | 'event' | 'api_call';
  data?: Record<string, any>;
}

export class TriggerExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    try {
      const config = node.config as TriggerConfig;
      
      logger.info('Trigger node executed', {
        nodeId: node.id,
        executionId: context.executionId,
        triggerType: config.type
      });

      // Trigger nodes simply pass through their input data
      return {
        triggered: true,
        triggerType: config.type,
        timestamp: new Date().toISOString(),
        data: config.data || context.variables
      };
    } catch (error) {
      logger.error('Trigger execution failed', {
        nodeId: node.id,
        executionId: context.executionId,
        error: error.message
      });
      throw error;
    }
  }

  async validate(node: WorkflowNode): Promise<boolean> {
    const config = node.config as TriggerConfig;
    
    if (!config.type) {
      throw new Error('Trigger type is required');
    }

    const validTypes = ['manual', 'webhook', 'schedule', 'event', 'api_call'];
    if (!validTypes.includes(config.type)) {
      throw new Error(`Invalid trigger type: ${config.type}`);
    }

    return true;
  }

  getMetadata(): NodeMetadata {
    return {
      category: 'Triggers',
      description: 'Start workflow execution based on various trigger events',
      inputs: [],
      outputs: [
        {
          name: 'triggered',
          type: 'boolean',
          description: 'Whether the trigger was activated'
        },
        {
          name: 'triggerType',
          type: 'string',
          description: 'Type of trigger that activated'
        },
        {
          name: 'timestamp',
          type: 'string',
          description: 'ISO timestamp when trigger activated'
        },
        {
          name: 'data',
          type: 'object',
          description: 'Trigger data payload'
        }
      ],
      config: [
        {
          name: 'type',
          type: 'select',
          required: true,
          description: 'Type of trigger',
          defaultValue: 'manual'
        },
        {
          name: 'data',
          type: 'object',
          required: false,
          description: 'Static trigger data',
          defaultValue: {}
        }
      ]
    };
  }
}