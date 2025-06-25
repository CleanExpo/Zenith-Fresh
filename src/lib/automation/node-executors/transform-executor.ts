/**
 * Transform Node Executor
 * Handles data transformation in workflows
 */

import { NodeExecutor, WorkflowNode, ExecutionContext, NodeMetadata } from '../workflow-engine';
import { logger } from '@/lib/monitoring/enhanced-sentry';

interface TransformConfig {
  operation: 'map' | 'filter' | 'reduce' | 'sort' | 'format' | 'extract' | 'merge';
  sourceField?: string;
  targetField?: string;
  template?: string;
  script?: string;
  parameters?: Record<string, any>;
}

export class TransformExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    try {
      const config = node.config as TransformConfig;
      
      logger.info('Transform node executed', {
        nodeId: node.id,
        executionId: context.executionId,
        operation: config.operation
      });

      const result = await this.performTransformation(config, context);

      return {
        transformed: true,
        operation: config.operation,
        result,
        transformedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Transform execution failed', {
        nodeId: node.id,
        executionId: context.executionId,
        error: error.message
      });
      throw error;
    }
  }

  private async performTransformation(config: TransformConfig, context: ExecutionContext): Promise<any> {
    const variables = { ...context.variables, ...context.nodeOutputs };
    const sourceData = config.sourceField ? variables[config.sourceField] : variables;

    switch (config.operation) {
      case 'map':
        return this.mapTransform(sourceData, config, context);
      
      case 'filter':
        return this.filterTransform(sourceData, config, context);
      
      case 'reduce':
        return this.reduceTransform(sourceData, config, context);
      
      case 'sort':
        return this.sortTransform(sourceData, config);
      
      case 'format':
        return this.formatTransform(sourceData, config, context);
      
      case 'extract':
        return this.extractTransform(sourceData, config);
      
      case 'merge':
        return this.mergeTransform(sourceData, config, context);
      
      default:
        throw new Error(`Unknown transformation operation: ${config.operation}`);
    }
  }

  private mapTransform(data: any, config: TransformConfig, context: ExecutionContext): any {
    if (!Array.isArray(data)) {
      throw new Error('Map operation requires array input');
    }

    if (config.template) {
      return data.map(item => this.interpolateTemplate(config.template!, { ...context.variables, item }));
    }

    if (config.script) {
      return data.map(item => this.executeScript(config.script!, { ...context.variables, item }));
    }

    return data;
  }

  private filterTransform(data: any, config: TransformConfig, context: ExecutionContext): any {
    if (!Array.isArray(data)) {
      throw new Error('Filter operation requires array input');
    }

    if (config.script) {
      return data.filter(item => {
        const result = this.executeScript(config.script!, { ...context.variables, item });
        return Boolean(result);
      });
    }

    return data;
  }

  private reduceTransform(data: any, config: TransformConfig, context: ExecutionContext): any {
    if (!Array.isArray(data)) {
      throw new Error('Reduce operation requires array input');
    }

    if (config.script) {
      const initialValue = config.parameters?.initialValue || 0;
      return data.reduce((acc, item, index) => {
        return this.executeScript(config.script!, { 
          ...context.variables, 
          accumulator: acc, 
          item, 
          index 
        });
      }, initialValue);
    }

    return data;
  }

  private sortTransform(data: any, config: TransformConfig): any {
    if (!Array.isArray(data)) {
      throw new Error('Sort operation requires array input');
    }

    const sortField = config.parameters?.field;
    const sortOrder = config.parameters?.order || 'asc';

    return [...data].sort((a, b) => {
      let valueA = sortField ? a[sortField] : a;
      let valueB = sortField ? b[sortField] : b;

      // Handle different data types
      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private formatTransform(data: any, config: TransformConfig, context: ExecutionContext): any {
    if (config.template) {
      return this.interpolateTemplate(config.template, { ...context.variables, data });
    }

    // Default formatting operations
    const format = config.parameters?.format;
    
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        if (Array.isArray(data) && data.length > 0) {
          const headers = Object.keys(data[0]);
          const csvRows = [headers.join(',')];
          data.forEach(row => {
            csvRows.push(headers.map(header => row[header]).join(','));
          });
          return csvRows.join('\n');
        }
        return '';
      
      case 'uppercase':
        return String(data).toUpperCase();
      
      case 'lowercase':
        return String(data).toLowerCase();
      
      default:
        return data;
    }
  }

  private extractTransform(data: any, config: TransformConfig): any {
    const fields = config.parameters?.fields || [];
    
    if (Array.isArray(data)) {
      return data.map(item => this.extractFields(item, fields));
    } else {
      return this.extractFields(data, fields);
    }
  }

  private extractFields(obj: any, fields: string[]): any {
    const result: Record<string, any> = {};
    
    fields.forEach(field => {
      const value = this.getNestedValue(obj, field);
      if (value !== undefined) {
        result[field] = value;
      }
    });

    return result;
  }

  private mergeTransform(data: any, config: TransformConfig, context: ExecutionContext): any {
    const mergeWith = config.parameters?.mergeWith;
    const mergeStrategy = config.parameters?.strategy || 'merge';

    if (!mergeWith) {
      throw new Error('Merge operation requires mergeWith parameter');
    }

    const targetData = context.variables[mergeWith] || context.nodeOutputs[mergeWith];

    switch (mergeStrategy) {
      case 'merge':
        return { ...data, ...targetData };
      
      case 'concat':
        if (Array.isArray(data) && Array.isArray(targetData)) {
          return [...data, ...targetData];
        }
        throw new Error('Concat strategy requires both inputs to be arrays');
      
      case 'deep':
        return this.deepMerge(data, targetData);
      
      default:
        throw new Error(`Unknown merge strategy: ${mergeStrategy}`);
    }
  }

  private deepMerge(obj1: any, obj2: any): any {
    const result = { ...obj1 };
    
    for (const key in obj2) {
      if (obj2.hasOwnProperty(key)) {
        if (typeof obj2[key] === 'object' && obj2[key] !== null && !Array.isArray(obj2[key])) {
          result[key] = this.deepMerge(result[key] || {}, obj2[key]);
        } else {
          result[key] = obj2[key];
        }
      }
    }

    return result;
  }

  private interpolateTemplate(template: string, variables: Record<string, any>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  private executeScript(script: string, variables: Record<string, any>): any {
    try {
      // Simple script execution (in production, use a sandboxed environment)
      const func = new Function('variables', `with(variables) { return ${script}; }`);
      return func(variables);
    } catch (error) {
      throw new Error(`Script execution failed: ${error.message}`);
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  async validate(node: WorkflowNode): Promise<boolean> {
    const config = node.config as TransformConfig;
    
    if (!config.operation) {
      throw new Error('Transform operation is required');
    }

    const validOperations = ['map', 'filter', 'reduce', 'sort', 'format', 'extract', 'merge'];
    if (!validOperations.includes(config.operation)) {
      throw new Error(`Invalid transform operation: ${config.operation}`);
    }

    return true;
  }

  getMetadata(): NodeMetadata {
    return {
      category: 'Data',
      description: 'Transform and manipulate data using various operations',
      inputs: [
        {
          name: 'data',
          type: 'any',
          required: true,
          description: 'Data to transform'
        }
      ],
      outputs: [
        {
          name: 'result',
          type: 'any',
          description: 'Transformed data'
        },
        {
          name: 'operation',
          type: 'string',
          description: 'Transform operation that was performed'
        }
      ],
      config: [
        {
          name: 'operation',
          type: 'select',
          required: true,
          description: 'Type of transformation to perform'
        },
        {
          name: 'sourceField',
          type: 'string',
          required: false,
          description: 'Source field to transform'
        },
        {
          name: 'targetField',
          type: 'string',
          required: false,
          description: 'Target field for result'
        },
        {
          name: 'template',
          type: 'text',
          required: false,
          description: 'Template for formatting operations'
        },
        {
          name: 'script',
          type: 'text',
          required: false,
          description: 'JavaScript expression for custom transformations'
        },
        {
          name: 'parameters',
          type: 'object',
          required: false,
          description: 'Additional transformation parameters',
          defaultValue: {}
        }
      ]
    };
  }
}