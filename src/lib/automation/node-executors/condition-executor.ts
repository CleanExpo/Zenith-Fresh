/**
 * Condition Node Executor
 * Handles conditional logic in workflows
 */

import { NodeExecutor, WorkflowNode, ExecutionContext, NodeMetadata } from '../workflow-engine';
import { logger } from '@/lib/monitoring/enhanced-sentry';

interface ConditionConfig {
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
    logic?: 'AND' | 'OR';
  }>;
  defaultPath?: 'true' | 'false';
}

export class ConditionExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    try {
      const config = node.config as ConditionConfig;
      
      logger.info('Condition node executed', {
        nodeId: node.id,
        executionId: context.executionId,
        conditionCount: config.conditions?.length || 0
      });

      const result = this.evaluateConditions(config, context);

      return {
        conditionMet: result,
        evaluatedAt: new Date().toISOString(),
        conditions: config.conditions
      };
    } catch (error) {
      logger.error('Condition execution failed', {
        nodeId: node.id,
        executionId: context.executionId,
        error: error.message
      });
      throw error;
    }
  }

  private evaluateConditions(config: ConditionConfig, context: ExecutionContext): boolean {
    if (!config.conditions || config.conditions.length === 0) {
      return config.defaultPath === 'true';
    }

    const variables = { ...context.variables, ...context.nodeOutputs };
    let result = true;
    let currentLogic: 'AND' | 'OR' = 'AND';

    for (let i = 0; i < config.conditions.length; i++) {
      const condition = config.conditions[i];
      const conditionResult = this.evaluateSingleCondition(condition, variables);

      if (i === 0) {
        result = conditionResult;
      } else {
        if (currentLogic === 'AND') {
          result = result && conditionResult;
        } else {
          result = result || conditionResult;
        }
      }

      // Set logic for next iteration
      if (condition.logic) {
        currentLogic = condition.logic;
      }
    }

    return result;
  }

  private evaluateSingleCondition(
    condition: { field: string; operator: string; value: any },
    variables: Record<string, any>
  ): boolean {
    const fieldValue = this.getFieldValue(condition.field, variables);
    const compareValue = condition.value;

    switch (condition.operator) {
      case 'equals':
      case '==':
        return fieldValue == compareValue;
      
      case 'not_equals':
      case '!=':
        return fieldValue != compareValue;
      
      case 'greater_than':
      case '>':
        return Number(fieldValue) > Number(compareValue);
      
      case 'greater_than_or_equal':
      case '>=':
        return Number(fieldValue) >= Number(compareValue);
      
      case 'less_than':
      case '<':
        return Number(fieldValue) < Number(compareValue);
      
      case 'less_than_or_equal':
      case '<=':
        return Number(fieldValue) <= Number(compareValue);
      
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
      
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
      
      case 'starts_with':
        return String(fieldValue).toLowerCase().startsWith(String(compareValue).toLowerCase());
      
      case 'ends_with':
        return String(fieldValue).toLowerCase().endsWith(String(compareValue).toLowerCase());
      
      case 'is_empty':
        return !fieldValue || fieldValue === '' || fieldValue === null || fieldValue === undefined;
      
      case 'is_not_empty':
        return !!fieldValue && fieldValue !== '' && fieldValue !== null && fieldValue !== undefined;
      
      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(fieldValue);
      
      case 'not_in':
        return !Array.isArray(compareValue) || !compareValue.includes(fieldValue);
      
      case 'regex':
        try {
          const regex = new RegExp(compareValue);
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }
      
      default:
        throw new Error(`Unknown condition operator: ${condition.operator}`);
    }
  }

  private getFieldValue(field: string, variables: Record<string, any>): any {
    // Support dot notation for nested objects
    const parts = field.split('.');
    let value = variables;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  async validate(node: WorkflowNode): Promise<boolean> {
    const config = node.config as ConditionConfig;
    
    if (!config.conditions || !Array.isArray(config.conditions)) {
      throw new Error('Conditions array is required');
    }

    for (const condition of config.conditions) {
      if (!condition.field) {
        throw new Error('Condition field is required');
      }
      if (!condition.operator) {
        throw new Error('Condition operator is required');
      }
    }

    return true;
  }

  getMetadata(): NodeMetadata {
    return {
      category: 'Logic',
      description: 'Evaluate conditions to control workflow flow',
      inputs: [
        {
          name: 'data',
          type: 'object',
          required: false,
          description: 'Data to evaluate conditions against'
        }
      ],
      outputs: [
        {
          name: 'conditionMet',
          type: 'boolean',
          description: 'Whether all conditions were met'
        },
        {
          name: 'evaluatedAt',
          type: 'string',
          description: 'ISO timestamp when condition was evaluated'
        }
      ],
      config: [
        {
          name: 'conditions',
          type: 'array',
          required: true,
          description: 'Array of conditions to evaluate'
        },
        {
          name: 'defaultPath',
          type: 'select',
          required: false,
          description: 'Default path when no conditions are specified',
          defaultValue: 'true'
        }
      ]
    };
  }
}