/**
 * AI Automation Hub - Workflow Engine
 * Weeks 7-8: Enterprise SaaS Development
 * 
 * Core workflow execution engine with enterprise-grade capabilities
 */

import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/monitoring/enhanced-sentry';
import { z } from 'zod';

// Workflow Node Types
export enum NodeType {
  TRIGGER = 'trigger',
  ACTION = 'action',
  CONDITION = 'condition',
  LOOP = 'loop',
  DELAY = 'delay',
  AI_AGENT = 'ai_agent',
  API_CALL = 'api_call',
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  DATABASE = 'database',
  FILE_OPERATION = 'file_operation',
  NOTIFICATION = 'notification',
  TRANSFORM = 'transform',
  INTEGRATION = 'integration'
}

// Workflow Node Schema
export const WorkflowNodeSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(NodeType),
  name: z.string(),
  description: z.string().optional(),
  config: z.record(z.any()),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  inputs: z.array(z.string()).default([]),
  outputs: z.array(z.string()).default([])
});

export const WorkflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  condition: z.string().optional() // For conditional flows
});

export const WorkflowDefinitionSchema = z.object({
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
  variables: z.record(z.any()).default({}),
  config: z.object({
    timeout: z.number().default(300000), // 5 minutes
    retryPolicy: z.object({
      maxRetries: z.number().default(3),
      backoffType: z.enum(['fixed', 'exponential']).default('exponential'),
      backoffDelay: z.number().default(1000)
    }).default({}),
    errorHandling: z.enum(['stop', 'continue', 'retry']).default('stop'),
    parallel: z.boolean().default(false)
  }).default({})
});

export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>;
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

// Execution Context
export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  teamId: string;
  userId?: string;
  variables: Record<string, any>;
  nodeOutputs: Record<string, any>;
  currentNode?: string;
  startTime: Date;
  timeout: number;
}

// Node Executor Interface
export interface NodeExecutor {
  execute(node: WorkflowNode, context: ExecutionContext): Promise<any>;
  validate?(node: WorkflowNode): Promise<boolean>;
  getMetadata?(): NodeMetadata;
}

export interface NodeMetadata {
  category: string;
  description: string;
  inputs: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  config: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    defaultValue?: any;
  }>;
}

// Workflow Engine Class
export class WorkflowEngine {
  private nodeExecutors: Map<NodeType, NodeExecutor> = new Map();
  private runningExecutions: Map<string, ExecutionContext> = new Map();

  constructor() {
    this.registerDefaultExecutors();
  }

  // Register node executors
  registerExecutor(nodeType: NodeType, executor: NodeExecutor): void {
    this.nodeExecutors.set(nodeType, executor);
  }

  // Execute workflow
  async executeWorkflow(
    workflowId: string,
    input: Record<string, any> = {},
    options: {
      teamId: string;
      userId?: string;
      triggeredBy?: string;
      version?: string;
    }
  ): Promise<string> {
    try {
      // Get workflow definition
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: { team: true }
      });

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      if (!workflow.isActive) {
        throw new Error(`Workflow is not active: ${workflowId}`);
      }

      // Parse workflow definition
      const definition = WorkflowDefinitionSchema.parse({
        nodes: workflow.nodes,
        edges: workflow.edges,
        config: workflow.config,
        variables: workflow.variables || {}
      });

      // Create execution record
      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId,
          teamId: options.teamId,
          userId: options.userId,
          version: workflow.version,
          triggeredBy: options.triggeredBy as any || 'MANUAL',
          status: 'PENDING',
          input,
          variables: { ...definition.variables, ...input },
          nodeCount: definition.nodes.length
        }
      });

      // Create execution context
      const context: ExecutionContext = {
        executionId: execution.id,
        workflowId,
        teamId: options.teamId,
        userId: options.userId,
        variables: { ...definition.variables, ...input },
        nodeOutputs: {},
        startTime: new Date(),
        timeout: definition.config.timeout
      };

      this.runningExecutions.set(execution.id, context);

      // Start execution (async)
      this.runExecution(execution.id, definition, context)
        .catch(error => {
          logger.error('Workflow execution failed', {
            executionId: execution.id,
            workflowId,
            error: error.message
          });
        });

      return execution.id;
    } catch (error) {
      logger.error('Failed to start workflow execution', {
        workflowId,
        error: error.message
      });
      throw error;
    }
  }

  // Main execution logic
  private async runExecution(
    executionId: string,
    definition: WorkflowDefinition,
    context: ExecutionContext
  ): Promise<void> {
    try {
      // Update execution status
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'RUNNING',
          startedAt: new Date()
        }
      });

      await this.logExecution(executionId, 'INFO', 'Workflow execution started', {
        nodeCount: definition.nodes.length
      });

      // Find trigger nodes
      const triggerNodes = definition.nodes.filter(node => node.type === NodeType.TRIGGER);
      
      if (triggerNodes.length === 0) {
        throw new Error('No trigger nodes found in workflow');
      }

      // Execute from trigger nodes
      const results = await Promise.all(
        triggerNodes.map(triggerNode => this.executeNode(triggerNode, definition, context))
      );

      // Complete execution
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          duration: Date.now() - context.startTime.getTime(),
          output: context.nodeOutputs
        }
      });

      await this.logExecution(executionId, 'INFO', 'Workflow execution completed successfully');

    } catch (error) {
      // Handle execution error
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          duration: Date.now() - context.startTime.getTime(),
          error: error.message
        }
      });

      await this.logExecution(executionId, 'ERROR', 'Workflow execution failed', {
        error: error.message
      });

      throw error;
    } finally {
      this.runningExecutions.delete(executionId);
    }
  }

  // Execute individual node
  private async executeNode(
    node: WorkflowNode,
    definition: WorkflowDefinition,
    context: ExecutionContext
  ): Promise<any> {
    const startTime = Date.now();
    context.currentNode = node.id;

    try {
      await this.logExecution(context.executionId, 'INFO', `Executing node: ${node.name}`, {
        nodeId: node.id,
        nodeType: node.type
      });

      // Create node execution record
      const nodeExecution = await prisma.nodeExecution.create({
        data: {
          executionId: context.executionId,
          nodeId: node.id,
          nodeType: node.type,
          status: 'RUNNING',
          startedAt: new Date(),
          config: node.config,
          input: this.getNodeInput(node, context)
        }
      });

      // Get executor
      const executor = this.nodeExecutors.get(node.type as NodeType);
      if (!executor) {
        throw new Error(`No executor found for node type: ${node.type}`);
      }

      // Execute node
      const output = await executor.execute(node, context);
      const duration = Date.now() - startTime;

      // Store output
      context.nodeOutputs[node.id] = output;

      // Update node execution
      await prisma.nodeExecution.update({
        where: { id: nodeExecution.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          duration,
          output
        }
      });

      await this.logExecution(context.executionId, 'INFO', `Node completed: ${node.name}`, {
        nodeId: node.id,
        duration
      });

      // Execute next nodes
      const nextNodes = this.getNextNodes(node, definition, context);
      if (nextNodes.length > 0) {
        await Promise.all(
          nextNodes.map(nextNode => this.executeNode(nextNode, definition, context))
        );
      }

      return output;
    } catch (error) {
      const duration = Date.now() - startTime;

      await prisma.nodeExecution.updateMany({
        where: {
          executionId: context.executionId,
          nodeId: node.id,
          status: 'RUNNING'
        },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          duration,
          error: error.message
        }
      });

      await this.logExecution(context.executionId, 'ERROR', `Node failed: ${node.name}`, {
        nodeId: node.id,
        error: error.message
      });

      throw error;
    }
  }

  // Get node input data
  private getNodeInput(node: WorkflowNode, context: ExecutionContext): any {
    const input: Record<string, any> = {};

    // Add variables
    Object.assign(input, context.variables);

    // Add outputs from connected nodes
    node.inputs.forEach(inputId => {
      if (context.nodeOutputs[inputId]) {
        input[inputId] = context.nodeOutputs[inputId];
      }
    });

    return input;
  }

  // Get next nodes to execute
  private getNextNodes(
    currentNode: WorkflowNode,
    definition: WorkflowDefinition,
    context: ExecutionContext
  ): WorkflowNode[] {
    const outgoingEdges = definition.edges.filter(edge => edge.source === currentNode.id);
    const nextNodes: WorkflowNode[] = [];

    for (const edge of outgoingEdges) {
      // Check edge condition if present
      if (edge.condition) {
        const conditionResult = this.evaluateCondition(edge.condition, context);
        if (!conditionResult) continue;
      }

      const nextNode = definition.nodes.find(node => node.id === edge.target);
      if (nextNode) {
        nextNodes.push(nextNode);
      }
    }

    return nextNodes;
  }

  // Evaluate edge condition
  private evaluateCondition(condition: string, context: ExecutionContext): boolean {
    try {
      // Simple condition evaluation (can be extended with a proper expression parser)
      const variables = { ...context.variables, ...context.nodeOutputs };
      const func = new Function('variables', `with(variables) { return ${condition}; }`);
      return Boolean(func(variables));
    } catch (error) {
      logger.warn('Failed to evaluate condition', { condition, error: error.message });
      return false;
    }
  }

  // Log execution events
  private async logExecution(
    executionId: string,
    level: string,
    message: string,
    data?: any
  ): Promise<void> {
    await prisma.workflowLog.create({
      data: {
        executionId,
        level: level as any,
        message,
        data: data || null,
        nodeId: data?.nodeId || null
      }
    });
  }

  // Get execution status
  async getExecutionStatus(executionId: string): Promise<any> {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 10
        },
        nodeExecutions: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return execution;
  }

  // Cancel execution
  async cancelExecution(executionId: string): Promise<void> {
    const context = this.runningExecutions.get(executionId);
    if (context) {
      this.runningExecutions.delete(executionId);
    }

    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date()
      }
    });

    await this.logExecution(executionId, 'INFO', 'Workflow execution cancelled');
  }

  // Register default node executors
  private registerDefaultExecutors(): void {
    // These will be implemented in separate files
    // this.registerExecutor(NodeType.TRIGGER, new TriggerExecutor());
    // this.registerExecutor(NodeType.ACTION, new ActionExecutor());
    // this.registerExecutor(NodeType.CONDITION, new ConditionExecutor());
    // etc.
  }
}

// Singleton instance
export const workflowEngine = new WorkflowEngine();

// Workflow validation
export async function validateWorkflow(definition: WorkflowDefinition): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validate schema
    WorkflowDefinitionSchema.parse(definition);

    // Check for trigger nodes
    const triggerNodes = definition.nodes.filter(node => node.type === NodeType.TRIGGER);
    if (triggerNodes.length === 0) {
      errors.push('Workflow must have at least one trigger node');
    }

    // Check for disconnected nodes
    const connectedNodes = new Set<string>();
    definition.edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    definition.nodes.forEach(node => {
      if (!connectedNodes.has(node.id) && node.type !== NodeType.TRIGGER) {
        warnings.push(`Node "${node.name}" is not connected to any other nodes`);
      }
    });

    // Check for circular dependencies
    const hasCycles = detectCycles(definition);
    if (hasCycles) {
      errors.push('Workflow contains circular dependencies');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error.message],
      warnings
    };
  }
}

// Detect cycles in workflow graph
function detectCycles(definition: WorkflowDefinition): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfsHasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoingEdges = definition.edges.filter(edge => edge.source === nodeId);
    for (const edge of outgoingEdges) {
      if (!visited.has(edge.target)) {
        if (dfsHasCycle(edge.target)) {
          return true;
        }
      } else if (recursionStack.has(edge.target)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of definition.nodes) {
    if (!visited.has(node.id)) {
      if (dfsHasCycle(node.id)) {
        return true;
      }
    }
  }

  return false;
}