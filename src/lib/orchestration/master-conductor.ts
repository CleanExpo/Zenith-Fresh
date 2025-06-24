/**
 * Master Conductor - Advanced Agent Orchestration System
 * 
 * The brain of the autonomous ecosystem that coordinates 30+ agents
 * working in parallel for maximum velocity and efficiency.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import { performance } from 'perf_hooks';

// Types and Interfaces
export interface AgentCapability {
  type: string;
  priority: number;
  maxConcurrency: number;
  estimatedExecutionTime: number;
  dependencies: string[];
  resourceRequirements: {
    cpu: number;
    memory: number;
    network: number;
  };
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'busy' | 'error' | 'maintenance' | 'offline';
  capabilities: AgentCapability[];
  currentTasks: string[];
  performance: {
    completedTasks: number;
    averageExecutionTime: number;
    successRate: number;
    lastActivity: Date;
  };
  health: {
    cpu: number;
    memory: number;
    uptime: number;
    errors: number;
  };
  metadata: Record<string, any>;
}

export interface Task {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  dependencies: string[];
  requiredCapabilities: string[];
  constraints: {
    maxRetries: number;
    timeout: number;
    deadline?: Date;
  };
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled';
  assignedAgent?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  retryCount: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  tasks: Task[];
  dependencies: Record<string, string[]>;
  parallelGroups: string[][];
  constraints: {
    maxDuration: number;
    maxRetries: number;
    rollbackOnFailure: boolean;
  };
}

export interface ConductorConfig {
  maxConcurrentTasks: number;
  taskTimeoutMs: number;
  agentHealthCheckInterval: number;
  resourceAllocationStrategy: 'balanced' | 'performance' | 'cost-optimized';
  autoScaling: {
    enabled: boolean;
    minAgents: number;
    maxAgents: number;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
  };
  redis: {
    host: string;
    port: number;
    db: number;
  };
}

/**
 * Master Conductor - Central orchestration hub for all agents
 */
export class MasterConductor extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private taskQueue: Task[] = [];
  private runningTasks: Map<string, Task> = new Map();
  private redis: Redis;
  private config: ConductorConfig;
  private isRunning: boolean = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private taskProcessorInterval?: NodeJS.Timeout;

  constructor(config: ConductorConfig) {
    super();
    this.config = config;
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      db: config.redis.db,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.setupEventHandlers();
  }

  /**
   * Initialize the Master Conductor
   */
  async initialize(): Promise<void> {
    try {
      await this.redis.ping();
      console.log('✅ Master Conductor: Redis connection established');

      // Load existing agents and tasks from Redis
      await this.loadState();

      // Start health monitoring
      this.startHealthMonitoring();

      // Start task processor
      this.startTaskProcessor();

      this.isRunning = true;
      this.emit('initialized');
      
      console.log('🚀 Master Conductor: System initialized and ready');
    } catch (error) {
      console.error('❌ Master Conductor: Initialization failed', error);
      throw error;
    }
  }

  /**
   * Register a new agent with the conductor
   */
  async registerAgent(agent: Omit<Agent, 'id' | 'performance' | 'health'>): Promise<string> {
    const agentId = uuidv4();
    const fullAgent: Agent = {
      ...agent,
      id: agentId,
      performance: {
        completedTasks: 0,
        averageExecutionTime: 0,
        successRate: 1.0,
        lastActivity: new Date(),
      },
      health: {
        cpu: 0,
        memory: 0,
        uptime: 0,
        errors: 0,
      },
    };

    this.agents.set(agentId, fullAgent);
    await this.persistAgentState(agentId);

    this.emit('agentRegistered', fullAgent);
    console.log(`✅ Agent registered: ${agent.name} (${agentId})`);

    return agentId;
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Reassign running tasks
    const runningTasks = Array.from(this.runningTasks.values())
      .filter(task => task.assignedAgent === agentId);

    for (const task of runningTasks) {
      await this.reassignTask(task.id);
    }

    this.agents.delete(agentId);
    await this.redis.del(`agent:${agentId}`);

    this.emit('agentUnregistered', agent);
    console.log(`❌ Agent unregistered: ${agent.name} (${agentId})`);
  }

  /**
   * Submit a new task for execution
   */
  async submitTask(taskData: Omit<Task, 'id' | 'status' | 'createdAt' | 'retryCount'>): Promise<string> {
    const taskId = uuidv4();
    const task: Task = {
      ...taskData,
      id: taskId,
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0,
    };

    this.tasks.set(taskId, task);
    this.taskQueue.push(task);
    await this.persistTaskState(taskId);

    this.emit('taskSubmitted', task);
    console.log(`📋 Task submitted: ${task.type} (${taskId})`);

    // Trigger immediate processing
    this.processTaskQueue();

    return taskId;
  }

  /**
   * Submit a workflow for execution
   */
  async submitWorkflow(workflow: WorkflowDefinition): Promise<string> {
    this.workflows.set(workflow.id, workflow);
    
    // Submit all workflow tasks
    const taskIds: string[] = [];
    for (const task of workflow.tasks) {
      const taskId = await this.submitTask(task);
      taskIds.push(taskId);
    }

    this.emit('workflowSubmitted', { workflow, taskIds });
    console.log(`🔄 Workflow submitted: ${workflow.name} (${workflow.id})`);

    return workflow.id;
  }

  /**
   * Get agent status and performance metrics
   */
  getAgentStatus(agentId?: string): Agent | Agent[] {
    if (agentId) {
      const agent = this.agents.get(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }
      return agent;
    }
    return Array.from(this.agents.values());
  }

  /**
   * Get task status and details
   */
  getTaskStatus(taskId?: string): Task | Task[] {
    if (taskId) {
      const task = this.tasks.get(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }
      return task;
    }
    return Array.from(this.tasks.values());
  }

  /**
   * Get system metrics and performance data
   */
  getSystemMetrics() {
    const agents = Array.from(this.agents.values());
    const tasks = Array.from(this.tasks.values());

    return {
      agents: {
        total: agents.length,
        active: agents.filter(a => a.status === 'busy').length,
        idle: agents.filter(a => a.status === 'idle').length,
        offline: agents.filter(a => a.status === 'offline').length,
        averageLoad: agents.reduce((sum, a) => sum + a.currentTasks.length, 0) / agents.length,
      },
      tasks: {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        running: tasks.filter(t => t.status === 'running').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        failed: tasks.filter(t => t.status === 'failed').length,
        queueSize: this.taskQueue.length,
      },
      performance: {
        averageTaskDuration: this.calculateAverageTaskDuration(),
        systemThroughput: this.calculateSystemThroughput(),
        successRate: this.calculateSystemSuccessRate(),
        resourceUtilization: this.calculateResourceUtilization(),
      },
    };
  }

  /**
   * Process the task queue and assign tasks to agents
   */
  private async processTaskQueue(): Promise<void> {
    if (this.taskQueue.length === 0) return;

    // Sort queue by priority and dependencies
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const tasksToProcess = this.taskQueue.splice(0, this.config.maxConcurrentTasks);

    for (const task of tasksToProcess) {
      await this.assignTaskToAgent(task);
    }
  }

  /**
   * Assign a task to the most suitable agent
   */
  private async assignTaskToAgent(task: Task): Promise<void> {
    const suitableAgents = this.findSuitableAgents(task);
    
    if (suitableAgents.length === 0) {
      // No suitable agents available, put task back in queue
      this.taskQueue.unshift(task);
      return;
    }

    // Select best agent based on strategy
    const selectedAgent = this.selectOptimalAgent(suitableAgents, task);
    
    // Assign task
    task.status = 'assigned';
    task.assignedAgent = selectedAgent.id;
    task.startedAt = new Date();

    selectedAgent.currentTasks.push(task.id);
    selectedAgent.status = 'busy';
    selectedAgent.performance.lastActivity = new Date();

    this.runningTasks.set(task.id, task);

    // Persist state
    await Promise.all([
      this.persistTaskState(task.id),
      this.persistAgentState(selectedAgent.id),
    ]);

    this.emit('taskAssigned', { task, agent: selectedAgent });
    console.log(`🎯 Task assigned: ${task.type} → ${selectedAgent.name}`);

    // Execute task
    this.executeTask(task, selectedAgent);
  }

  /**
   * Execute a task on an agent
   */
  private async executeTask(task: Task, agent: Agent): Promise<void> {
    const startTime = performance.now();
    
    try {
      task.status = 'running';
      await this.persistTaskState(task.id);

      this.emit('taskStarted', { task, agent });

      // Simulate task execution (replace with actual agent communication)
      const result = await this.invokeAgent(agent, task);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Update task
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;

      // Update agent performance
      agent.performance.completedTasks++;
      agent.performance.averageExecutionTime = 
        (agent.performance.averageExecutionTime * (agent.performance.completedTasks - 1) + executionTime) / 
        agent.performance.completedTasks;
      
      this.completeTask(task, agent);

    } catch (error) {
      console.error(`❌ Task execution failed: ${task.id}`, error);
      
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.retryCount++;

      // Update agent error count
      agent.health.errors++;
      agent.performance.successRate = 
        agent.performance.completedTasks / (agent.performance.completedTasks + agent.health.errors);

      // Retry logic
      if (task.retryCount < task.constraints.maxRetries) {
        console.log(`🔄 Retrying task: ${task.id} (attempt ${task.retryCount + 1})`);
        task.status = 'pending';
        this.taskQueue.unshift(task);
      }

      this.completeTask(task, agent);
    }
  }

  /**
   * Complete task execution and cleanup
   */
  private async completeTask(task: Task, agent: Agent): Promise<void> {
    // Remove task from agent
    agent.currentTasks = agent.currentTasks.filter(id => id !== task.id);
    
    // Update agent status
    if (agent.currentTasks.length === 0) {
      agent.status = 'idle';
    }

    // Remove from running tasks
    this.runningTasks.delete(task.id);

    // Persist state
    await Promise.all([
      this.persistTaskState(task.id),
      this.persistAgentState(agent.id),
    ]);

    this.emit('taskCompleted', { task, agent });
    console.log(`✅ Task completed: ${task.type} (${task.id})`);
  }

  /**
   * Find agents suitable for a task
   */
  private findSuitableAgents(task: Task): Agent[] {
    return Array.from(this.agents.values()).filter(agent => {
      // Check if agent is available
      if (agent.status !== 'idle' && agent.currentTasks.length >= agent.capabilities[0]?.maxConcurrency) {
        return false;
      }

      // Check if agent has required capabilities
      const hasRequiredCapabilities = task.requiredCapabilities.every(required =>
        agent.capabilities.some(cap => cap.type === required)
      );

      return hasRequiredCapabilities;
    });
  }

  /**
   * Select optimal agent based on allocation strategy
   */
  private selectOptimalAgent(agents: Agent[], task: Task): Agent {
    switch (this.config.resourceAllocationStrategy) {
      case 'performance':
        return agents.reduce((best, current) => 
          current.performance.successRate > best.performance.successRate ? current : best
        );
      
      case 'cost-optimized':
        return agents.reduce((best, current) => 
          current.currentTasks.length < best.currentTasks.length ? current : best
        );
      
      case 'balanced':
      default:
        return agents.reduce((best, current) => {
          const currentScore = (current.performance.successRate * 0.6) + 
                              ((1 - current.currentTasks.length / 10) * 0.4);
          const bestScore = (best.performance.successRate * 0.6) + 
                           ((1 - best.currentTasks.length / 10) * 0.4);
          return currentScore > bestScore ? current : best;
        });
    }
  }

  /**
   * Invoke agent to execute task (placeholder for actual agent communication)
   */
  private async invokeAgent(agent: Agent, task: Task): Promise<any> {
    // This would be replaced with actual agent communication
    // For now, simulate execution time
    const executionTime = Math.random() * 5000 + 1000; // 1-6 seconds
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    return {
      status: 'success',
      result: `Task ${task.type} completed by ${agent.name}`,
      executionTime,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reassign a task to a different agent
   */
  private async reassignTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Reset task state
    task.status = 'pending';
    task.assignedAgent = undefined;
    task.startedAt = undefined;

    // Add back to queue
    this.taskQueue.unshift(task);
    
    await this.persistTaskState(taskId);
    console.log(`🔄 Task reassigned: ${taskId}`);
  }

  /**
   * Start health monitoring for all agents
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const agent of this.agents.values()) {
        await this.checkAgentHealth(agent);
      }
    }, this.config.agentHealthCheckInterval);
  }

  /**
   * Start task processor
   */
  private startTaskProcessor(): void {
    this.taskProcessorInterval = setInterval(() => {
      if (this.taskQueue.length > 0) {
        this.processTaskQueue();
      }
    }, 1000); // Process every second
  }

  /**
   * Check individual agent health
   */
  private async checkAgentHealth(agent: Agent): Promise<void> {
    try {
      // Simulate health check (replace with actual agent ping)
      const healthData = {
        cpu: Math.random() * 100,
        memory: Math.random() * 8192,
        uptime: Date.now() - agent.performance.lastActivity.getTime(),
        errors: agent.health.errors,
      };

      agent.health = healthData;

      // Update agent status based on health
      if (healthData.cpu > 90 || healthData.memory > 7000) {
        agent.status = 'maintenance';
        console.warn(`⚠️ Agent ${agent.name} under high load`);
      } else if (agent.status === 'maintenance' && healthData.cpu < 70 && healthData.memory < 6000) {
        agent.status = 'idle';
        console.log(`✅ Agent ${agent.name} recovered`);
      }

      await this.persistAgentState(agent.id);

    } catch (error) {
      console.error(`❌ Health check failed for agent ${agent.name}:`, error);
      agent.status = 'offline';
      await this.persistAgentState(agent.id);
    }
  }

  /**
   * Calculate average task duration
   */
  private calculateAverageTaskDuration(): number {
    const completedTasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'completed' && t.startedAt && t.completedAt);

    if (completedTasks.length === 0) return 0;

    const totalDuration = completedTasks.reduce((sum, task) => {
      const duration = task.completedAt!.getTime() - task.startedAt!.getTime();
      return sum + duration;
    }, 0);

    return totalDuration / completedTasks.length;
  }

  /**
   * Calculate system throughput (tasks per minute)
   */
  private calculateSystemThroughput(): number {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    const recentTasks = Array.from(this.tasks.values())
      .filter(t => t.completedAt && t.completedAt > oneMinuteAgo);

    return recentTasks.length;
  }

  /**
   * Calculate system success rate
   */
  private calculateSystemSuccessRate(): number {
    const tasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'completed' || t.status === 'failed');

    if (tasks.length === 0) return 1.0;

    const successfulTasks = tasks.filter(t => t.status === 'completed').length;
    return successfulTasks / tasks.length;
  }

  /**
   * Calculate resource utilization
   */
  private calculateResourceUtilization(): { cpu: number; memory: number; agents: number } {
    const agents = Array.from(this.agents.values());
    
    if (agents.length === 0) {
      return { cpu: 0, memory: 0, agents: 0 };
    }

    const totalCpu = agents.reduce((sum, agent) => sum + agent.health.cpu, 0);
    const totalMemory = agents.reduce((sum, agent) => sum + agent.health.memory, 0);
    const busyAgents = agents.filter(a => a.status === 'busy').length;

    return {
      cpu: totalCpu / agents.length,
      memory: totalMemory / agents.length,
      agents: (busyAgents / agents.length) * 100,
    };
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('error', (error) => {
      console.error('❌ Master Conductor Error:', error);
    });

    this.on('agentRegistered', (agent) => {
      console.log(`🤖 New agent online: ${agent.name}`);
    });

    this.on('taskCompleted', ({ task, agent }) => {
      console.log(`✅ Task completed: ${task.type} by ${agent.name}`);
    });
  }

  /**
   * Load state from Redis
   */
  private async loadState(): Promise<void> {
    try {
      // Load agents
      const agentKeys = await this.redis.keys('agent:*');
      for (const key of agentKeys) {
        const agentData = await this.redis.get(key);
        if (agentData) {
          const agent = JSON.parse(agentData);
          this.agents.set(agent.id, agent);
        }
      }

      // Load tasks
      const taskKeys = await this.redis.keys('task:*');
      for (const key of taskKeys) {
        const taskData = await this.redis.get(key);
        if (taskData) {
          const task = JSON.parse(taskData);
          this.tasks.set(task.id, task);
        }
      }

      console.log(`📊 State loaded: ${this.agents.size} agents, ${this.tasks.size} tasks`);
    } catch (error) {
      console.error('❌ Failed to load state:', error);
    }
  }

  /**
   * Persist agent state to Redis
   */
  private async persistAgentState(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      await this.redis.set(`agent:${agentId}`, JSON.stringify(agent));
    }
  }

  /**
   * Persist task state to Redis
   */
  private async persistTaskState(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      await this.redis.set(`task:${taskId}`, JSON.stringify(task));
    }
  }

  /**
   * Shutdown the conductor gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Master Conductor: Initiating shutdown...');
    
    this.isRunning = false;

    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.taskProcessorInterval) {
      clearInterval(this.taskProcessorInterval);
    }

    // Wait for running tasks to complete (with timeout)
    const shutdownTimeout = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (this.runningTasks.size > 0 && (Date.now() - startTime) < shutdownTimeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Persist final state
    for (const agentId of this.agents.keys()) {
      await this.persistAgentState(agentId);
    }
    for (const taskId of this.tasks.keys()) {
      await this.persistTaskState(taskId);
    }

    // Close Redis connection
    await this.redis.quit();

    this.emit('shutdown');
    console.log('✅ Master Conductor: Shutdown complete');
  }
}

export default MasterConductor;