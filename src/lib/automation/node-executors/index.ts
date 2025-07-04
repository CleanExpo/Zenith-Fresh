/**
 * AI Automation Hub - Node Executors
 * Registry and factory for workflow node executors
 */

import { NodeType, NodeExecutor, WorkflowNode, ExecutionContext } from '../workflow-engine';
import { TriggerExecutor } from './trigger-executor';
import { ActionExecutor } from './action-executor';
import { ConditionExecutor } from './condition-executor';
import { AIAgentExecutor } from './ai-agent-executor';
import { APICallExecutor } from './api-call-executor';
import { EmailExecutor } from './email-executor';
import { WebhookExecutor } from './webhook-executor';
import { DelayExecutor } from './delay-executor';
import { TransformExecutor } from './transform-executor';

export class NodeExecutorRegistry {
  private executors: Map<NodeType, NodeExecutor> = new Map();

  constructor() {
    this.registerDefaultExecutors();
  }

  register(nodeType: NodeType, executor: NodeExecutor): void {
    this.executors.set(nodeType, executor);
  }

  get(nodeType: NodeType): NodeExecutor | undefined {
    return this.executors.get(nodeType);
  }

  getAllExecutors(): Map<NodeType, NodeExecutor> {
    return new Map(this.executors);
  }

  private registerDefaultExecutors(): void {
    this.register(NodeType.TRIGGER, new TriggerExecutor());
    this.register(NodeType.ACTION, new ActionExecutor());
    this.register(NodeType.CONDITION, new ConditionExecutor());
    this.register(NodeType.AI_AGENT, new AIAgentExecutor());
    this.register(NodeType.API_CALL, new APICallExecutor());
    this.register(NodeType.EMAIL, new EmailExecutor());
    this.register(NodeType.WEBHOOK, new WebhookExecutor());
    this.register(NodeType.DELAY, new DelayExecutor());
    this.register(NodeType.TRANSFORM, new TransformExecutor());
  }
}

export const nodeExecutorRegistry = new NodeExecutorRegistry();

// Export all executors
export * from './trigger-executor';
export * from './action-executor';
export * from './condition-executor';
export * from './ai-agent-executor';
export * from './api-call-executor';
export * from './email-executor';
export * from './webhook-executor';
export * from './delay-executor';
export * from './transform-executor';