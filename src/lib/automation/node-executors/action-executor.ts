/**
 * Action Node Executor
 * Handles generic action operations
 */

import { NodeExecutor, WorkflowNode, ExecutionContext, NodeMetadata } from '../workflow-engine';
import { logger } from '@/lib/monitoring/enhanced-sentry';

interface ActionConfig {
  action: string;
  parameters: Record<string, any>;
  timeout?: number;
}

export class ActionExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    try {
      const config = node.config as ActionConfig;
      
      logger.info('Action node executed', {
        nodeId: node.id,
        executionId: context.executionId,
        action: config.action
      });

      // Execute the specific action
      const result = await this.executeAction(config, context);

      return {
        success: true,
        action: config.action,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Action execution failed', {
        nodeId: node.id,
        executionId: context.executionId,
        error: error.message
      });
      throw error;
    }
  }

  private async executeAction(config: ActionConfig, context: ExecutionContext): Promise<any> {
    const { action, parameters } = config;

    switch (action) {
      case 'log':
        return this.executeLogAction(parameters, context);
      
      case 'set_variable':
        return this.executeSetVariableAction(parameters, context);
      
      case 'calculate':
        return this.executeCalculateAction(parameters, context);
      
      case 'format_string':
        return this.executeFormatStringAction(parameters, context);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async executeLogAction(parameters: Record<string, any>, context: ExecutionContext): Promise<any> {
    const message = this.interpolateString(parameters.message || 'Action executed', context);
    const level = parameters.level || 'info';
    
    logger.log(level, message, {
      executionId: context.executionId,
      workflowId: context.workflowId
    });

    return { logged: true, message, level };
  }

  private async executeSetVariableAction(parameters: Record<string, any>, context: ExecutionContext): Promise<any> {
    const variableName = parameters.name;
    const variableValue = this.interpolateValue(parameters.value, context);

    if (!variableName) {
      throw new Error('Variable name is required');
    }

    // Set the variable in context
    context.variables[variableName] = variableValue;

    return { 
      set: true, 
      variable: variableName, 
      value: variableValue 
    };
  }

  private async executeCalculateAction(parameters: Record<string, any>, context: ExecutionContext): Promise<any> {
    const expression = this.interpolateString(parameters.expression, context);
    
    try {
      // Simple expression evaluation (in production, use a proper expression parser)
      const variables = { ...context.variables, ...context.nodeOutputs };
      const func = new Function('variables', `with(variables) { return ${expression}; }`);
      const result = func(variables);

      return { 
        calculated: true, 
        expression, 
        result 
      };
    } catch (error) {
      throw new Error(`Failed to calculate expression "${expression}": ${error.message}`);
    }
  }

  private async executeFormatStringAction(parameters: Record<string, any>, context: ExecutionContext): Promise<any> {
    const template = parameters.template;
    const formatted = this.interpolateString(template, context);

    return { 
      formatted: true, 
      template, 
      result: formatted 
    };
  }

  private interpolateString(template: string, context: ExecutionContext): string {
    if (typeof template !== 'string') return String(template);
    
    let result = template;
    
    // Replace variables: {{variable}}
    const variables = { ...context.variables, ...context.nodeOutputs };
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  private interpolateValue(value: any, context: ExecutionContext): any {
    if (typeof value === 'string') {
      return this.interpolateString(value, context);
    } else if (typeof value === 'object' && value !== null) {
      const result: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.interpolateValue(val, context);
      }
      return result;
    }
    return value;
  }

  async validate(node: WorkflowNode): Promise<boolean> {
    const config = node.config as ActionConfig;
    
    if (!config.action) {
      throw new Error('Action type is required');
    }

    const validActions = ['log', 'set_variable', 'calculate', 'format_string'];
    if (!validActions.includes(config.action)) {
      throw new Error(`Invalid action type: ${config.action}`);
    }

    return true;
  }

  getMetadata(): NodeMetadata {
    return {
      category: 'Actions',
      description: 'Execute various utility actions like logging, variable setting, and calculations',
      inputs: [
        {
          name: 'data',
          type: 'object',
          required: false,
          description: 'Input data for the action'
        }
      ],
      outputs: [
        {
          name: 'success',
          type: 'boolean',
          description: 'Whether the action completed successfully'
        },
        {
          name: 'result',
          type: 'any',
          description: 'Action result data'
        }
      ],
      config: [
        {
          name: 'action',
          type: 'select',
          required: true,
          description: 'Type of action to execute'
        },
        {
          name: 'parameters',
          type: 'object',
          required: true,
          description: 'Action parameters',
          defaultValue: {}
        },
        {
          name: 'timeout',
          type: 'number',
          required: false,
          description: 'Action timeout in milliseconds',
          defaultValue: 30000
        }
      ]
    };
  }
}