/**
 * Parallel Execution Engine
 * 
 * High-performance parallel task execution with dependency management,
 * resource optimization, and fault tolerance.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Worker } from 'worker_threads';
import { Task } from './master-conductor';

export interface ExecutionPlan {
  id: string;
  name: string;
  tasks: Task[];
  dependencies: Map<string, string[]>; // taskId -> [dependencyTaskIds]
  parallelGroups: TaskGroup[];
  constraints: {
    maxConcurrency: number;
    timeout: number;
    retryPolicy: RetryPolicy;
    resourceLimits: ResourceLimits;
  };
  metadata: {
    created: Date;
    estimatedDuration: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface TaskGroup {
  id: string;
  name: string;
  tasks: string[]; // Task IDs
  type: 'sequential' | 'parallel' | 'conditional';
  condition?: string; // JavaScript expression for conditional groups
  maxConcurrency?: number;
  timeout?: number;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface ResourceLimits {
  maxCpuUsage: number; // Percentage
  maxMemoryUsage: number; // MB
  maxNetworkBandwidth: number; // MB/s
  maxDiskIo: number; // MB/s
}

export interface ExecutionContext {
  planId: string;
  taskId: string;
  agentId: string;
  workerId?: string;
  startTime: Date;
  resources: {
    cpu: number;
    memory: number;
    network: number;
    disk: number;
  };
  metadata: Record<string, any>;
}

export interface ExecutionResult {
  taskId: string;
  status: 'success' | 'failure' | 'timeout' | 'cancelled';
  result?: any;
  error?: string;
  duration: number;
  resourceUsage: {
    peakCpu: number;
    peakMemory: number;
    networkBytes: number;
    diskBytes: number;
  };
  metadata: Record<string, any>;
}

export interface ExecutionStats {
  planId: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  runningTasks: number;
  pendingTasks: number;
  averageExecutionTime: number;
  totalExecutionTime: number;
  resourceUtilization: ResourceLimits;
  throughput: number; // tasks per second
}

/**
 * Dependency Graph Manager
 */
class DependencyGraph {
  private dependencies: Map<string, Set<string>> = new Map();
  private dependents: Map<string, Set<string>> = new Map();
  private completed: Set<string> = new Set();

  /**
   * Add dependency relationship
   */
  addDependency(taskId: string, dependsOn: string[]): void {
    if (!this.dependencies.has(taskId)) {
      this.dependencies.set(taskId, new Set());
    }

    for (const dep of dependsOn) {
      this.dependencies.get(taskId)!.add(dep);
      
      if (!this.dependents.has(dep)) {
        this.dependents.set(dep, new Set());
      }
      this.dependents.get(dep)!.add(taskId);
    }
  }

  /**
   * Mark task as completed
   */
  markCompleted(taskId: string): string[] {
    this.completed.add(taskId);
    
    // Find tasks that can now be executed
    const readyTasks: string[] = [];
    const dependents = this.dependents.get(taskId) || new Set();
    
    for (const dependent of dependents) {
      if (this.isReady(dependent)) {
        readyTasks.push(dependent);
      }
    }
    
    return readyTasks;
  }

  /**
   * Check if task is ready to execute
   */
  isReady(taskId: string): boolean {
    const deps = this.dependencies.get(taskId) || new Set();
    return Array.from(deps).every(dep => this.completed.has(dep));
  }

  /**
   * Get all ready tasks
   */
  getReadyTasks(): string[] {
    const readyTasks: string[] = [];
    
    for (const taskId of this.dependencies.keys()) {
      if (!this.completed.has(taskId) && this.isReady(taskId)) {
        readyTasks.push(taskId);
      }
    }
    
    return readyTasks;
  }

  /**
   * Check for circular dependencies
   */
  hasCycles(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleDFS = (taskId: string): boolean => {
      visited.add(taskId);
      recursionStack.add(taskId);

      const deps = this.dependencies.get(taskId) || new Set();
      for (const dep of deps) {
        if (!visited.has(dep)) {
          if (hasCycleDFS(dep)) return true;
        } else if (recursionStack.has(dep)) {
          return true; // Cycle detected
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    for (const taskId of this.dependencies.keys()) {
      if (!visited.has(taskId)) {
        if (hasCycleDFS(taskId)) return true;
      }
    }

    return false;
  }

  /**
   * Get topological order
   */
  getTopologicalOrder(): string[] {
    const visited = new Set<string>();
    const stack: string[] = [];

    const dfs = (taskId: string): void => {
      visited.add(taskId);
      
      const deps = this.dependencies.get(taskId) || new Set();
      for (const dep of deps) {
        if (!visited.has(dep)) {
          dfs(dep);
        }
      }
      
      stack.push(taskId);
    };

    for (const taskId of this.dependencies.keys()) {
      if (!visited.has(taskId)) {
        dfs(taskId);
      }
    }

    return stack.reverse();
  }

  /**
   * Reset graph state
   */
  reset(): void {
    this.completed.clear();
  }
}

/**
 * Resource Monitor
 */
class ResourceMonitor extends EventEmitter {
  private currentUsage: ResourceLimits = {
    maxCpuUsage: 0,
    maxMemoryUsage: 0,
    maxNetworkBandwidth: 0,
    maxDiskIo: 0,
  };
  private limits: ResourceLimits;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(limits: ResourceLimits) {
    super();
    this.limits = limits;
  }

  /**
   * Start monitoring resources
   */
  startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateResourceUsage();
      this.checkLimits();
    }, 1000); // Monitor every second
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }

  /**
   * Check if resources are available for task
   */
  canAllocateResources(required: Partial<ResourceLimits>): boolean {
    return (
      (this.currentUsage.maxCpuUsage + (required.maxCpuUsage || 0)) <= this.limits.maxCpuUsage &&
      (this.currentUsage.maxMemoryUsage + (required.maxMemoryUsage || 0)) <= this.limits.maxMemoryUsage &&
      (this.currentUsage.maxNetworkBandwidth + (required.maxNetworkBandwidth || 0)) <= this.limits.maxNetworkBandwidth &&
      (this.currentUsage.maxDiskIo + (required.maxDiskIo || 0)) <= this.limits.maxDiskIo
    );
  }

  /**
   * Allocate resources for task
   */
  allocateResources(required: Partial<ResourceLimits>): void {
    this.currentUsage.maxCpuUsage += required.maxCpuUsage || 0;
    this.currentUsage.maxMemoryUsage += required.maxMemoryUsage || 0;
    this.currentUsage.maxNetworkBandwidth += required.maxNetworkBandwidth || 0;
    this.currentUsage.maxDiskIo += required.maxDiskIo || 0;
  }

  /**
   * Free resources after task completion
   */
  freeResources(used: Partial<ResourceLimits>): void {
    this.currentUsage.maxCpuUsage = Math.max(0, this.currentUsage.maxCpuUsage - (used.maxCpuUsage || 0));
    this.currentUsage.maxMemoryUsage = Math.max(0, this.currentUsage.maxMemoryUsage - (used.maxMemoryUsage || 0));
    this.currentUsage.maxNetworkBandwidth = Math.max(0, this.currentUsage.maxNetworkBandwidth - (used.maxNetworkBandwidth || 0));
    this.currentUsage.maxDiskIo = Math.max(0, this.currentUsage.maxDiskIo - (used.maxDiskIo || 0));
  }

  /**
   * Get current resource usage
   */
  getCurrentUsage(): ResourceLimits {
    return { ...this.currentUsage };
  }

  /**
   * Update resource usage (simulate actual monitoring)
   */
  private updateResourceUsage(): void {
    // In real implementation, this would read actual system metrics
    // For now, simulate resource usage
    this.currentUsage = {
      maxCpuUsage: Math.min(100, this.currentUsage.maxCpuUsage + (Math.random() - 0.5) * 10),
      maxMemoryUsage: Math.min(8192, this.currentUsage.maxMemoryUsage + (Math.random() - 0.5) * 100),
      maxNetworkBandwidth: Math.min(1000, this.currentUsage.maxNetworkBandwidth + (Math.random() - 0.5) * 50),
      maxDiskIo: Math.min(500, this.currentUsage.maxDiskIo + (Math.random() - 0.5) * 25),
    };
  }

  /**
   * Check if resource limits are exceeded
   */
  private checkLimits(): void {
    if (this.currentUsage.maxCpuUsage > this.limits.maxCpuUsage * 0.9) {
      this.emit('resourceWarning', { type: 'cpu', usage: this.currentUsage.maxCpuUsage, limit: this.limits.maxCpuUsage });
    }
    if (this.currentUsage.maxMemoryUsage > this.limits.maxMemoryUsage * 0.9) {
      this.emit('resourceWarning', { type: 'memory', usage: this.currentUsage.maxMemoryUsage, limit: this.limits.maxMemoryUsage });
    }
  }
}

/**
 * Worker Pool Manager
 */
class WorkerPool {
  private availableWorkers: Worker[] = [];
  private busyWorkers: Map<string, Worker> = new Map();
  private workerCount: number;
  private workerScript: string;

  constructor(workerCount: number, workerScript: string) {
    this.workerCount = workerCount;
    this.workerScript = workerScript;
    this.initializeWorkers();
  }

  /**
   * Initialize worker pool
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new Worker(this.workerScript);
      this.availableWorkers.push(worker);
    }
    console.log(`👷 Worker pool initialized with ${this.workerCount} workers`);
  }

  /**
   * Get available worker
   */
  getWorker(): Worker | null {
    if (this.availableWorkers.length === 0) {
      return null;
    }
    return this.availableWorkers.pop()!;
  }

  /**
   * Return worker to pool
   */
  returnWorker(workerId: string): void {
    const worker = this.busyWorkers.get(workerId);
    if (worker) {
      this.busyWorkers.delete(workerId);
      this.availableWorkers.push(worker);
    }
  }

  /**
   * Execute task in worker
   */
  async executeTask(task: Task, context: ExecutionContext): Promise<ExecutionResult> {
    const worker = this.getWorker();
    if (!worker) {
      throw new Error('No available workers');
    }

    const workerId = uuidv4();
    this.busyWorkers.set(workerId, worker);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.returnWorker(workerId);
        reject(new Error('Task execution timeout'));
      }, task.constraints.timeout);

      worker.once('message', (result: ExecutionResult) => {
        clearTimeout(timeout);
        this.returnWorker(workerId);
        resolve(result);
      });

      worker.once('error', (error) => {
        clearTimeout(timeout);
        this.returnWorker(workerId);
        reject(error);
      });

      // Send task to worker
      worker.postMessage({ task, context });
    });
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      total: this.workerCount,
      available: this.availableWorkers.length,
      busy: this.busyWorkers.size,
    };
  }

  /**
   * Shutdown worker pool
   */
  async shutdown(): Promise<void> {
    const allWorkers = [...this.availableWorkers, ...this.busyWorkers.values()];
    
    const terminationPromises = allWorkers.map(worker => worker.terminate());
    await Promise.allSettled(terminationPromises);
    
    this.availableWorkers = [];
    this.busyWorkers.clear();
    
    console.log('👷 Worker pool shut down');
  }
}

/**
 * Parallel Execution Engine
 */
export class ParallelExecutionEngine extends EventEmitter {
  private executionPlans: Map<string, ExecutionPlan> = new Map();
  private runningExecutions: Map<string, ExecutionContext[]> = new Map();
  private dependencyGraphs: Map<string, DependencyGraph> = new Map();
  private resourceMonitor: ResourceMonitor;
  private workerPool: WorkerPool;
  private executionStats: Map<string, ExecutionStats> = new Map();
  private isRunning: boolean = false;

  constructor(
    workerCount: number = 4,
    workerScript: string = './worker.js',
    resourceLimits: ResourceLimits = {
      maxCpuUsage: 80,
      maxMemoryUsage: 4096,
      maxNetworkBandwidth: 500,
      maxDiskIo: 250,
    }
  ) {
    super();
    this.resourceMonitor = new ResourceMonitor(resourceLimits);
    this.workerPool = new WorkerPool(workerCount, workerScript);
    this.setupEventHandlers();
  }

  /**
   * Initialize the execution engine
   */
  async initialize(): Promise<void> {
    try {
      this.resourceMonitor.startMonitoring();
      this.isRunning = true;
      
      this.emit('initialized');
      console.log('🚀 Parallel Execution Engine: Initialized');
    } catch (error) {
      console.error('❌ Parallel Execution Engine: Initialization failed', error);
      throw error;
    }
  }

  /**
   * Create execution plan
   */
  async createExecutionPlan(planData: Omit<ExecutionPlan, 'id' | 'metadata'>): Promise<string> {
    const planId = uuidv4();
    const plan: ExecutionPlan = {
      ...planData,
      id: planId,
      metadata: {
        created: new Date(),
        estimatedDuration: this.estimatePlanDuration(planData),
        priority: planData.metadata?.priority || 'medium',
      },
    };

    // Validate plan
    this.validateExecutionPlan(plan);

    // Build dependency graph
    const graph = new DependencyGraph();
    for (const [taskId, deps] of plan.dependencies.entries()) {
      graph.addDependency(taskId, deps);
    }

    // Check for circular dependencies
    if (graph.hasCycles()) {
      throw new Error('Execution plan contains circular dependencies');
    }

    this.executionPlans.set(planId, plan);
    this.dependencyGraphs.set(planId, graph);

    // Initialize execution stats
    this.executionStats.set(planId, {
      planId,
      totalTasks: plan.tasks.length,
      completedTasks: 0,
      failedTasks: 0,
      runningTasks: 0,
      pendingTasks: plan.tasks.length,
      averageExecutionTime: 0,
      totalExecutionTime: 0,
      resourceUtilization: { maxCpuUsage: 0, maxMemoryUsage: 0, maxNetworkBandwidth: 0, maxDiskIo: 0 },
      throughput: 0,
    });

    this.emit('planCreated', plan);
    console.log(`📋 Execution plan created: ${plan.name} (${planId})`);

    return planId;
  }

  /**
   * Execute a plan
   */
  async executePlan(planId: string): Promise<ExecutionStats> {
    const plan = this.executionPlans.get(planId);
    if (!plan) {
      throw new Error(`Execution plan ${planId} not found`);
    }

    const graph = this.dependencyGraphs.get(planId)!;
    const stats = this.executionStats.get(planId)!;

    console.log(`🚀 Starting execution plan: ${plan.name}`);
    this.emit('planStarted', { planId, plan });

    const startTime = Date.now();
    const executionContexts: ExecutionContext[] = [];
    this.runningExecutions.set(planId, executionContexts);

    try {
      // Execute tasks according to dependency graph and parallel groups
      await this.executeTaskGroups(plan, graph, executionContexts);

      // Update final stats
      stats.totalExecutionTime = Date.now() - startTime;
      stats.throughput = stats.completedTasks / (stats.totalExecutionTime / 1000);

      this.emit('planCompleted', { planId, stats });
      console.log(`✅ Execution plan completed: ${plan.name}`);

      return stats;

    } catch (error) {
      this.emit('planFailed', { planId, error });
      console.error(`❌ Execution plan failed: ${plan.name}`, error);
      throw error;
    } finally {
      this.runningExecutions.delete(planId);
    }
  }

  /**
   * Cancel execution plan
   */
  async cancelPlan(planId: string): Promise<void> {
    const contexts = this.runningExecutions.get(planId);
    if (!contexts) {
      throw new Error(`No running execution found for plan ${planId}`);
    }

    // Cancel all running tasks
    const cancellationPromises = contexts.map(async (context) => {
      // This would cancel actual task execution
      console.log(`❌ Cancelling task: ${context.taskId}`);
    });

    await Promise.allSettled(cancellationPromises);
    this.runningExecutions.delete(planId);

    this.emit('planCancelled', { planId });
    console.log(`❌ Execution plan cancelled: ${planId}`);
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(planId?: string): ExecutionStats | ExecutionStats[] {
    if (planId) {
      const stats = this.executionStats.get(planId);
      if (!stats) {
        throw new Error(`No statistics found for plan ${planId}`);
      }
      return stats;
    }
    return Array.from(this.executionStats.values());
  }

  /**
   * Get system metrics
   */
  getSystemMetrics() {
    return {
      resourceUsage: this.resourceMonitor.getCurrentUsage(),
      workerPool: this.workerPool.getStats(),
      runningPlans: this.runningExecutions.size,
      totalPlans: this.executionPlans.size,
    };
  }

  /**
   * Execute task groups according to plan
   */
  private async executeTaskGroups(
    plan: ExecutionPlan,
    graph: DependencyGraph,
    executionContexts: ExecutionContext[]
  ): Promise<void> {
    const taskMap = new Map(plan.tasks.map(task => [task.id, task]));
    const completedTasks = new Set<string>();
    const activeTasks = new Map<string, Promise<ExecutionResult>>();

    // Process parallel groups
    for (const group of plan.parallelGroups) {
      await this.executeTaskGroup(group, taskMap, graph, completedTasks, activeTasks, executionContexts, plan);
    }

    // Execute remaining tasks that aren't in any group
    const ungroupedTasks = plan.tasks.filter(task => 
      !plan.parallelGroups.some(group => group.tasks.includes(task.id))
    );

    if (ungroupedTasks.length > 0) {
      const ungroupedGroup: TaskGroup = {
        id: 'ungrouped',
        name: 'Ungrouped Tasks',
        tasks: ungroupedTasks.map(t => t.id),
        type: 'parallel',
        maxConcurrency: plan.constraints.maxConcurrency,
      };

      await this.executeTaskGroup(ungroupedGroup, taskMap, graph, completedTasks, activeTasks, executionContexts, plan);
    }
  }

  /**
   * Execute a task group
   */
  private async executeTaskGroup(
    group: TaskGroup,
    taskMap: Map<string, Task>,
    graph: DependencyGraph,
    completedTasks: Set<string>,
    activeTasks: Map<string, Promise<ExecutionResult>>,
    executionContexts: ExecutionContext[],
    plan: ExecutionPlan
  ): Promise<void> {
    console.log(`📦 Executing task group: ${group.name} (${group.type})`);

    switch (group.type) {
      case 'sequential':
        await this.executeSequentialGroup(group, taskMap, graph, completedTasks, activeTasks, executionContexts, plan);
        break;
      
      case 'parallel':
        await this.executeParallelGroup(group, taskMap, graph, completedTasks, activeTasks, executionContexts, plan);
        break;
      
      case 'conditional':
        await this.executeConditionalGroup(group, taskMap, graph, completedTasks, activeTasks, executionContexts, plan);
        break;
    }
  }

  /**
   * Execute tasks sequentially
   */
  private async executeSequentialGroup(
    group: TaskGroup,
    taskMap: Map<string, Task>,
    graph: DependencyGraph,
    completedTasks: Set<string>,
    activeTasks: Map<string, Promise<ExecutionResult>>,
    executionContexts: ExecutionContext[],
    plan: ExecutionPlan
  ): Promise<void> {
    for (const taskId of group.tasks) {
      if (completedTasks.has(taskId)) continue;

      const task = taskMap.get(taskId);
      if (!task) continue;

      // Wait for dependencies
      await this.waitForDependencies(taskId, graph, activeTasks);

      // Execute task
      const result = await this.executeTask(task, plan, executionContexts);
      
      if (result.status === 'success') {
        completedTasks.add(taskId);
        graph.markCompleted(taskId);
      } else {
        throw new Error(`Task ${taskId} failed: ${result.error}`);
      }
    }
  }

  /**
   * Execute tasks in parallel
   */
  private async executeParallelGroup(
    group: TaskGroup,
    taskMap: Map<string, Task>,
    graph: DependencyGraph,
    completedTasks: Set<string>,
    activeTasks: Map<string, Promise<ExecutionResult>>,
    executionContexts: ExecutionContext[],
    plan: ExecutionPlan
  ): Promise<void> {
    const maxConcurrency = group.maxConcurrency || plan.constraints.maxConcurrency;
    const semaphore = new Array(maxConcurrency).fill(null);
    let semaphoreIndex = 0;

    const taskPromises = group.tasks.map(async (taskId) => {
      if (completedTasks.has(taskId)) return;

      const task = taskMap.get(taskId);
      if (!task) return;

      // Wait for semaphore slot
      await this.acquireSemaphore(semaphore, semaphoreIndex);
      
      try {
        // Wait for dependencies
        await this.waitForDependencies(taskId, graph, activeTasks);

        // Execute task
        const resultPromise = this.executeTask(task, plan, executionContexts);
        activeTasks.set(taskId, resultPromise);
        
        const result = await resultPromise;
        activeTasks.delete(taskId);
        
        if (result.status === 'success') {
          completedTasks.add(taskId);
          graph.markCompleted(taskId);
        } else {
          throw new Error(`Task ${taskId} failed: ${result.error}`);
        }
      } finally {
        this.releaseSemaphore(semaphore, semaphoreIndex);
        semaphoreIndex = (semaphoreIndex + 1) % maxConcurrency;
      }
    });

    await Promise.all(taskPromises);
  }

  /**
   * Execute conditional task group
   */
  private async executeConditionalGroup(
    group: TaskGroup,
    taskMap: Map<string, Task>,
    graph: DependencyGraph,
    completedTasks: Set<string>,
    activeTasks: Map<string, Promise<ExecutionResult>>,
    executionContexts: ExecutionContext[],
    plan: ExecutionPlan
  ): Promise<void> {
    if (!group.condition) {
      console.warn(`⚠️ Conditional group ${group.name} has no condition, skipping`);
      return;
    }

    // Evaluate condition (simplified - in real implementation, this would be more sophisticated)
    const shouldExecute = this.evaluateCondition(group.condition, completedTasks);
    
    if (shouldExecute) {
      console.log(`✅ Condition met for group ${group.name}, executing tasks`);
      await this.executeParallelGroup(group, taskMap, graph, completedTasks, activeTasks, executionContexts, plan);
    } else {
      console.log(`❌ Condition not met for group ${group.name}, skipping`);
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(
    task: Task,
    plan: ExecutionPlan,
    executionContexts: ExecutionContext[]
  ): Promise<ExecutionResult> {
    const context: ExecutionContext = {
      planId: plan.id,
      taskId: task.id,
      agentId: task.assignedAgent || 'system',
      startTime: new Date(),
      resources: {
        cpu: 0,
        memory: 0,
        network: 0,
        disk: 0,
      },
      metadata: task.metadata || {},
    };

    executionContexts.push(context);
    
    const stats = this.executionStats.get(plan.id)!;
    stats.runningTasks++;
    stats.pendingTasks--;

    this.emit('taskStarted', { task, context });
    console.log(`🎯 Executing task: ${task.type} (${task.id})`);

    try {
      // Check resource availability
      const requiredResources = this.estimateTaskResources(task);
      if (!this.resourceMonitor.canAllocateResources(requiredResources)) {
        throw new Error('Insufficient resources available');
      }

      // Allocate resources
      this.resourceMonitor.allocateResources(requiredResources);

      // Execute task using worker pool
      const result = await this.workerPool.executeTask(task, context);

      // Update stats
      stats.runningTasks--;
      if (result.status === 'success') {
        stats.completedTasks++;
      } else {
        stats.failedTasks++;
      }

      // Update average execution time
      stats.averageExecutionTime = (
        (stats.averageExecutionTime * (stats.completedTasks + stats.failedTasks - 1) + result.duration) /
        (stats.completedTasks + stats.failedTasks)
      );

      // Free resources
      this.resourceMonitor.freeResources(requiredResources);

      this.emit('taskCompleted', { task, result, context });
      console.log(`✅ Task completed: ${task.id} (${result.status})`);

      return result;

    } catch (error) {
      stats.runningTasks--;
      stats.failedTasks++;

      // Free resources
      const requiredResources = this.estimateTaskResources(task);
      this.resourceMonitor.freeResources(requiredResources);

      const failedResult: ExecutionResult = {
        taskId: task.id,
        status: 'failure',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - context.startTime.getTime(),
        resourceUsage: { peakCpu: 0, peakMemory: 0, networkBytes: 0, diskBytes: 0 },
        metadata: {},
      };

      this.emit('taskFailed', { task, result: failedResult, context, error });
      console.error(`❌ Task failed: ${task.id}`, error);

      return failedResult;
    }
  }

  /**
   * Wait for task dependencies to complete
   */
  private async waitForDependencies(
    taskId: string,
    graph: DependencyGraph,
    activeTasks: Map<string, Promise<ExecutionResult>>
  ): Promise<void> {
    while (!graph.isReady(taskId)) {
      // Wait for any active dependency to complete
      if (activeTasks.size > 0) {
        await Promise.race(Array.from(activeTasks.values()));
      } else {
        // No active tasks, dependencies might be external
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Acquire semaphore slot
   */
  private async acquireSemaphore(semaphore: any[], index: number): Promise<void> {
    while (semaphore[index] !== null) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    semaphore[index] = true;
  }

  /**
   * Release semaphore slot
   */
  private releaseSemaphore(semaphore: any[], index: number): void {
    semaphore[index] = null;
  }

  /**
   * Estimate task resource requirements
   */
  private estimateTaskResources(task: Task): Partial<ResourceLimits> {
    // This would use actual task analysis in real implementation
    // For now, use simple heuristics based on task type
    const baseResources = {
      maxCpuUsage: 10,
      maxMemoryUsage: 256,
      maxNetworkBandwidth: 10,
      maxDiskIo: 5,
    };

    // Adjust based on task priority
    const priorityMultiplier = { critical: 2, high: 1.5, medium: 1, low: 0.5 };
    const multiplier = priorityMultiplier[task.priority];

    return {
      maxCpuUsage: baseResources.maxCpuUsage * multiplier,
      maxMemoryUsage: baseResources.maxMemoryUsage * multiplier,
      maxNetworkBandwidth: baseResources.maxNetworkBandwidth * multiplier,
      maxDiskIo: baseResources.maxDiskIo * multiplier,
    };
  }

  /**
   * Estimate plan duration
   */
  private estimatePlanDuration(plan: Omit<ExecutionPlan, 'id' | 'metadata'>): number {
    // Simple estimation based on task count and average task duration
    const averageTaskDuration = 5000; // 5 seconds
    const parallelismFactor = Math.min(plan.constraints.maxConcurrency, plan.tasks.length);
    return (plan.tasks.length / parallelismFactor) * averageTaskDuration;
  }

  /**
   * Evaluate condition for conditional groups
   */
  private evaluateCondition(condition: string, completedTasks: Set<string>): boolean {
    try {
      // Simple condition evaluation - in real implementation, this would be more sophisticated
      // For now, just check if specific tasks are completed
      const taskIdMatches = condition.match(/task_(\w+)_completed/g);
      if (taskIdMatches) {
        return taskIdMatches.every(match => {
          const taskId = match.replace('task_', '').replace('_completed', '');
          return completedTasks.has(taskId);
        });
      }
      return true; // Default to true if condition can't be evaluated
    } catch (error) {
      console.error(`❌ Failed to evaluate condition: ${condition}`, error);
      return false;
    }
  }

  /**
   * Validate execution plan
   */
  private validateExecutionPlan(plan: ExecutionPlan): void {
    if (!plan.tasks || plan.tasks.length === 0) {
      throw new Error('Execution plan must have at least one task');
    }

    if (plan.constraints.maxConcurrency < 1) {
      throw new Error('Max concurrency must be at least 1');
    }

    if (plan.constraints.timeout < 1000) {
      throw new Error('Timeout must be at least 1000ms');
    }

    // Validate task group references
    const taskIds = new Set(plan.tasks.map(t => t.id));
    for (const group of plan.parallelGroups) {
      for (const taskId of group.tasks) {
        if (!taskIds.has(taskId)) {
          throw new Error(`Task group ${group.name} references unknown task: ${taskId}`);
        }
      }
    }

    // Validate dependencies
    for (const [taskId, deps] of plan.dependencies.entries()) {
      if (!taskIds.has(taskId)) {
        throw new Error(`Dependency map references unknown task: ${taskId}`);
      }
      for (const dep of deps) {
        if (!taskIds.has(dep)) {
          throw new Error(`Task ${taskId} depends on unknown task: ${dep}`);
        }
      }
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.resourceMonitor.on('resourceWarning', (warning) => {
      console.warn(`⚠️ Resource warning: ${warning.type} usage at ${warning.usage}/${warning.limit}`);
      this.emit('resourceWarning', warning);
    });

    this.on('error', (error) => {
      console.error('❌ Parallel Execution Engine Error:', error);
    });
  }

  /**
   * Shutdown the execution engine
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Parallel Execution Engine: Shutting down...');
    
    this.isRunning = false;

    // Cancel all running executions
    const cancellationPromises = Array.from(this.runningExecutions.keys()).map(planId => 
      this.cancelPlan(planId).catch(err => console.error(`Failed to cancel plan ${planId}:`, err))
    );
    await Promise.allSettled(cancellationPromises);

    // Stop resource monitoring
    this.resourceMonitor.stopMonitoring();

    // Shutdown worker pool
    await this.workerPool.shutdown();

    this.emit('shutdown');
    console.log('✅ Parallel Execution Engine: Shutdown complete');
  }
}

export default ParallelExecutionEngine;