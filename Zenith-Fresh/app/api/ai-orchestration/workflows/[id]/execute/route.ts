import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AIModelIntegration } from '@/lib/ai/model-integration';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'model' | 'transform' | 'output';
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config?: any;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

class WorkflowExecutor {
  private nodes: Map<string, WorkflowNode>;
  private edges: WorkflowEdge[];
  private executionContext: Map<string, any>;

  constructor(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
    this.nodes = new Map(nodes.map(node => [node.id, node]));
    this.edges = edges;
    this.executionContext = new Map();
  }

  async execute(input?: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Find trigger nodes
      const triggerNodes = Array.from(this.nodes.values()).filter(node => node.type === 'trigger');
      
      if (triggerNodes.length === 0) {
        throw new Error('No trigger node found in workflow');
      }

      // Start execution from first trigger
      const result = await this.executeNode(triggerNodes[0], input);
      
      return {
        success: true,
        result,
        duration: Date.now() - startTime,
        context: Object.fromEntries(this.executionContext)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        context: Object.fromEntries(this.executionContext)
      };
    }
  }

  private async executeNode(node: WorkflowNode, input?: any): Promise<any> {
    this.executionContext.set(node.id, { input, startTime: Date.now() });
    
    let result: any;

    switch (node.type) {
      case 'trigger':
        result = await this.executeTrigger(node, input);
        break;
      case 'model':
        result = await this.executeModel(node, input);
        break;
      case 'action':
        result = await this.executeAction(node, input);
        break;
      case 'condition':
        result = await this.executeCondition(node, input);
        break;
      case 'transform':
        result = await this.executeTransform(node, input);
        break;
      case 'output':
        result = await this.executeOutput(node, input);
        break;
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }

    // Update execution context
    const context = this.executionContext.get(node.id)!;
    context.result = result;
    context.endTime = Date.now();
    context.duration = context.endTime - context.startTime;

    // Execute next nodes
    const nextNodes = await this.getNextNodes(node.id, result);
    
    if (nextNodes.length > 0) {
      // For now, execute sequentially. Could be parallelized based on workflow design
      for (const nextNode of nextNodes) {
        result = await this.executeNode(nextNode, result);
      }
    }

    return result;
  }

  private async executeTrigger(node: WorkflowNode, input?: any): Promise<any> {
    // Trigger nodes just pass through the input
    return input || { triggered: true, timestamp: new Date().toISOString() };
  }

  private async executeModel(node: WorkflowNode, input?: any): Promise<any> {
    const config = node.data.config || {};
    const modelId = config.modelId;
    
    if (!modelId) {
      throw new Error('Model node requires modelId in configuration');
    }

    // Get model configuration from database
    const model = await prisma.aIModel.findUnique({
      where: { id: modelId }
    });

    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    // Create AI model integration
    const aiModel = new AIModelIntegration({
      provider: model.provider as any,
      modelId: model.modelId,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
      ...(model.configuration as Record<string, any> || {})
    });

    // Prepare messages
    const messages = [];
    
    if (config.systemPrompt) {
      messages.push({
        role: 'system' as const,
        content: config.systemPrompt
      });
    }

    const userContent = typeof input === 'string' ? input : JSON.stringify(input);
    messages.push({
      role: 'user' as const,
      content: userContent
    });

    // Generate response
    const response = await aiModel.generateResponse(messages);
    
    return {
      content: response.content,
      usage: response.usage,
      cost: response.cost,
      latency: response.latency
    };
  }

  private async executeAction(node: WorkflowNode, input?: any): Promise<any> {
    const config = node.data.config || {};
    const actionType = config.actionType;

    switch (actionType) {
      case 'http_request':
        return await this.executeHttpRequest(config, input);
      case 'delay':
        return await this.executeDelay(config, input);
      case 'log':
        return await this.executeLog(config, input);
      default:
        console.log(`Action executed: ${node.data.label}`, input);
        return input;
    }
  }

  private async executeCondition(node: WorkflowNode, input?: any): Promise<any> {
    const config = node.data.config || {};
    const condition = config.condition;
    
    // Simple condition evaluation (could be enhanced with a proper expression parser)
    if (condition) {
      try {
        // Very basic condition evaluation - in production, use a safe expression evaluator
        const result = eval(condition.replace(/input/g, JSON.stringify(input)));
        return { conditionMet: !!result, input };
      } catch (error) {
        console.error('Condition evaluation error:', error);
        return { conditionMet: false, input, error: error instanceof Error ? error.message : String(error) };
      }
    }
    
    return { conditionMet: true, input };
  }

  private async executeTransform(node: WorkflowNode, input?: any): Promise<any> {
    const config = node.data.config || {};
    const transformation = config.transformation;
    
    if (transformation) {
      try {
        // Basic transformation - in production, use a safe expression evaluator
        const result = eval(`(${transformation})(${JSON.stringify(input)})`);
        return result;
      } catch (error) {
        console.error('Transformation error:', error);
        return input;
      }
    }
    
    return input;
  }

  private async executeOutput(node: WorkflowNode, input?: any): Promise<any> {
    const config = node.data.config || {};
    
    console.log(`Output: ${node.data.label}`, input);
    
    // Could save to database, send to webhook, etc.
    return {
      output: input,
      timestamp: new Date().toISOString(),
      nodeId: node.id
    };
  }

  private async executeHttpRequest(config: any, input?: any): Promise<any> {
    const { method = 'POST', url, headers = {}, body } = config;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : JSON.stringify(input)
    });
    
    return await response.json();
  }

  private async executeDelay(config: any, input?: any): Promise<any> {
    const delay = config.delay || 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    return input;
  }

  private async executeLog(config: any, input?: any): Promise<any> {
    const message = config.message || 'Log output';
    console.log(`[Workflow Log] ${message}:`, input);
    return input;
  }

  private async getNextNodes(currentNodeId: string, result?: any): Promise<WorkflowNode[]> {
    const outgoingEdges = this.edges.filter(edge => edge.source === currentNodeId);
    const nextNodes: WorkflowNode[] = [];
    
    for (const edge of outgoingEdges) {
      const nextNode = this.nodes.get(edge.target);
      if (nextNode) {
        // Check edge conditions if any
        if (edge.condition) {
          try {
            const conditionMet = eval(edge.condition.replace(/result/g, JSON.stringify(result)));
            if (conditionMet) {
              nextNodes.push(nextNode);
            }
          } catch (error) {
            console.error('Edge condition evaluation error:', error);
          }
        } else {
          nextNodes.push(nextNode);
        }
      }
    }
    
    return nextNodes;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflowId = params.id;
    const body = await request.json();
    const { input } = body;

    // Get workflow
    const workflow = await prisma.aIWorkflow.findFirst({
      where: { 
        id: workflowId,
        agent: { userId: session.user.id }
      }
    });

    if (!workflow) {
      return NextResponse.json({ 
        error: 'Workflow not found or unauthorized' 
      }, { status: 404 });
    }

    // Create execution record
    const execution = await prisma.aIWorkflowExecution.create({
      data: {
        workflowId: workflow.id,
        status: 'running',
        input: input || {},
        startedAt: new Date()
      }
    });

    try {
      if (!workflow.definition) {
        throw new Error('Workflow definition is missing');
      }

      // Execute workflow
      const executor = new WorkflowExecutor(
        (workflow.definition as any).nodes as WorkflowNode[],
        (workflow.definition as any).edges as WorkflowEdge[]
      );
      
      const result = await executor.execute(input);
      
      // Update execution record
      await prisma.aIWorkflowExecution.update({
        where: { id: execution.id },
        data: {
          status: result.success ? 'completed' : 'failed',
          output: result.result,
          errorMessage: result.error,
          completedAt: new Date(),
          duration: result.duration,
          cost: result.result?.cost || 0,
          tokenUsage: result.result?.usage?.totalTokens || 0
        }
      });

      // Update workflow stats
      const newExecutions = workflow.totalExecutions + 1;
      const newSuccessful = workflow.successfulRuns + (result.success ? 1 : 0);
      const newFailed = workflow.failedRuns + (result.success ? 0 : 1);
      const newAvgRuntime = Math.round(
        (workflow.averageRuntime * workflow.totalExecutions + result.duration) / newExecutions
      );

      await prisma.aIWorkflow.update({
        where: { id: workflow.id },
        data: {
          totalExecutions: newExecutions,
          successfulRuns: newSuccessful,
          failedRuns: newFailed,
          averageRuntime: newAvgRuntime
        }
      });

      return NextResponse.json({ 
        execution: { 
          id: execution.id, 
          ...result 
        } 
      });

    } catch (error) {
      // Update execution record with error
      await prisma.aIWorkflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
          duration: Date.now() - execution.startedAt.getTime()
        }
      });

      throw error;
    }

  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}