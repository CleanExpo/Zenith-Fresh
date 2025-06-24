/**
 * Integration Test Suite
 * 
 * End-to-end integration tests for the complete orchestration system.
 */

import { MasterConductor } from '../master-conductor';
import { AgentRegistry } from '../agent-registry';
import { TaskQueue } from '../task-queue';
import { AgentCommunication } from '../agent-communication';
import { ParallelExecutionEngine } from '../parallel-execution-engine';
import { AgentLifecycleManager } from '../agent-lifecycle-manager';
import { PerformanceOptimizer } from '../performance-optimizer';

// Mock Redis
jest.mock('ioredis', () => {
  return class MockRedis {
    private data: Map<string, string> = new Map();
    private sortedSets: Map<string, Array<{ score: number; value: string }>> = new Map();

    async ping() { return 'PONG'; }
    
    async set(key: string, value: string) { 
      this.data.set(key, value);
      return 'OK'; 
    }
    
    async get(key: string) { 
      return this.data.get(key) || null; 
    }
    
    async del(key: string) { 
      const existed = this.data.has(key);
      this.data.delete(key);
      return existed ? 1 : 0; 
    }
    
    async keys(pattern: string) { 
      const keys = Array.from(this.data.keys());
      if (pattern === '*') return keys;
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return keys.filter(key => regex.test(key));
    }
    
    async quit() { return 'OK'; }
    
    async zadd(key: string, score: number, value: string) {
      if (!this.sortedSets.has(key)) {
        this.sortedSets.set(key, []);
      }
      const set = this.sortedSets.get(key)!;
      const existing = set.findIndex(item => item.value === value);
      if (existing >= 0) {
        set[existing].score = score;
      } else {
        set.push({ score, value });
      }
      set.sort((a, b) => a.score - b.score);
      return 1;
    }
    
    async zrevrange(key: string, start: number, stop: number) {
      const set = this.sortedSets.get(key) || [];
      return set.slice().reverse().slice(start, stop + 1).map(item => item.value);
    }
    
    async zrem(key: string, ...values: string[]) {
      const set = this.sortedSets.get(key) || [];
      let removed = 0;
      for (const value of values) {
        const index = set.findIndex(item => item.value === value);
        if (index >= 0) {
          set.splice(index, 1);
          removed++;
        }
      }
      return removed;
    }
    
    async zcard(key: string) {
      return (this.sortedSets.get(key) || []).length;
    }
    
    async publish(channel: string, message: string) { return 1; }
    async setex(key: string, ttl: number, value: string) { 
      this.data.set(key, value);
      return 'OK'; 
    }
  };
});

// Mock WebSocket
jest.mock('ws', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn((cb) => cb()),
  })),
}));

// Mock Worker Threads
jest.mock('worker_threads', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    postMessage: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    terminate: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('Orchestration System Integration', () => {
  let conductor: MasterConductor;
  let registry: AgentRegistry;
  let taskQueue: TaskQueue;
  let communication: AgentCommunication;
  let executionEngine: ParallelExecutionEngine;
  let lifecycleManager: AgentLifecycleManager;
  let performanceOptimizer: PerformanceOptimizer;

  const redisUrl = 'redis://localhost:6379';

  beforeAll(async () => {
    // Initialize all components
    conductor = new MasterConductor({
      maxConcurrentTasks: 20,
      taskTimeoutMs: 300000,
      agentHealthCheckInterval: 30000,
      resourceAllocationStrategy: 'balanced',
      autoScaling: {
        enabled: true,
        minAgents: 5,
        maxAgents: 50,
        scaleUpThreshold: 80,
        scaleDownThreshold: 30,
      },
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0,
      },
    });

    registry = new AgentRegistry(redisUrl);
    
    taskQueue = new TaskQueue({
      maxSize: 1000,
      maxRetries: 3,
      retryDelayMs: 1000,
      visibilityTimeoutMs: 300000,
      deadLetterQueue: true,
      batchSize: 10,
      concurrency: 20,
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0,
      },
    });

    communication = new AgentCommunication({
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0,
      },
      websocket: {
        port: 8080,
        pingInterval: 30000,
        pongTimeout: 10000,
        maxConnections: 100,
      },
      message: {
        maxSize: 1048576,
        defaultTimeout: 30000,
        maxRetries: 3,
        compressionThreshold: 1024,
      },
    });

    executionEngine = new ParallelExecutionEngine(4, './worker.js');
    lifecycleManager = new AgentLifecycleManager(redisUrl);
    performanceOptimizer = new PerformanceOptimizer(redisUrl);

    // Initialize all components
    await Promise.all([
      conductor.initialize(),
      registry.initialize(),
      taskQueue.initialize(),
      communication.initialize(),
      executionEngine.initialize(),
      lifecycleManager.initialize(),
      performanceOptimizer.initialize(),
    ]);
  });

  afterAll(async () => {
    // Shutdown all components
    await Promise.all([
      conductor.shutdown(),
      registry.shutdown(),
      taskQueue.shutdown(),
      communication.shutdown(),
      executionEngine.shutdown(),
      lifecycleManager.shutdown(),
      performanceOptimizer.shutdown(),
    ]);
  });

  describe('Component Integration', () => {
    test('should register agents across multiple components', async () => {
      // Register agent in registry
      const registrationId = await registry.register({
        name: 'integration-agent-1',
        type: 'content',
        version: '1.0.0',
        capabilities: [{
          type: 'content-processing',
          priority: 1,
          maxConcurrency: 3,
          estimatedExecutionTime: 5000,
          dependencies: [],
          resourceRequirements: {
            cpu: 1,
            memory: 512,
            network: 10,
          },
        }],
        endpoints: [{
          id: 'endpoint-1',
          type: 'websocket',
          url: 'ws://localhost:8080',
          healthCheck: '/health',
        }],
        tags: ['content', 'processing'],
        metadata: {
          description: 'Integration test agent',
          author: 'test-suite',
          created: new Date(),
          updated: new Date(),
        },
        constraints: {
          maxConcurrentTasks: 5,
          memoryLimit: 1024,
          cpuLimit: 2,
          networkBandwidth: 100,
        },
        sla: {
          uptime: 99.9,
          responseTime: 1000,
          throughput: 100,
        },
      });

      // Register same agent in conductor
      const conductorAgentId = await conductor.registerAgent({
        name: 'integration-agent-1',
        type: 'content',
        status: 'idle',
        capabilities: [{
          type: 'content-processing',
          priority: 1,
          maxConcurrency: 3,
          estimatedExecutionTime: 5000,
          dependencies: [],
          resourceRequirements: {
            cpu: 1,
            memory: 512,
            network: 10,
          },
        }],
        currentTasks: [],
        metadata: {},
      });

      // Register for communication
      await communication.registerAgent(conductorAgentId, ['ws://localhost:8080']);

      // Verify registrations
      expect(registrationId).toBeDefined();
      expect(conductorAgentId).toBeDefined();

      const registryAgent = registry.getRegistration(registrationId);
      const conductorAgent = conductor.getAgentStatus(conductorAgentId);

      expect(registryAgent).toBeDefined();
      expect(conductorAgent).toBeDefined();
      expect(registryAgent?.name).toBe('integration-agent-1');
      expect((conductorAgent as any)?.name).toBe('integration-agent-1');
    });

    test('should handle end-to-end task execution flow', async () => {
      // Register an agent template in lifecycle manager
      const templateId = await lifecycleManager.registerTemplate({
        name: 'e2e-test-agent',
        type: 'analytics',
        version: '1.0.0',
        image: 'analytics-agent:latest',
        config: {
          environment: { NODE_ENV: 'test' },
          secrets: [],
          volumes: [],
          ports: [{ containerPort: 8080, protocol: 'tcp', name: 'http' }],
          networkMode: 'bridge',
          restartPolicy: 'always',
          logLevel: 'info',
        },
        resources: {
          cpu: { min: 0.5, max: 2, request: 1 },
          memory: { min: 512, max: 2048, request: 1024 },
          disk: { size: 10, type: 'ssd' },
          network: { bandwidth: 100 },
        },
        scaling: {
          minReplicas: 1,
          maxReplicas: 5,
          targetCpuUtilization: 70,
          targetMemoryUtilization: 80,
          scaleUpCooldown: 300,
          scaleDownCooldown: 600,
        },
        healthCheck: {
          enabled: true,
          httpGet: { path: '/health', port: 8080, scheme: 'http' },
          initialDelaySeconds: 30,
          periodSeconds: 10,
          timeoutSeconds: 5,
          successThreshold: 1,
          failureThreshold: 3,
        },
        updatePolicy: {
          strategy: 'rolling',
          maxUnavailable: 1,
          maxSurge: 1,
          rollbackOnFailure: true,
          progressDeadlineSeconds: 600,
        },
        metadata: {
          description: 'End-to-end test analytics agent',
          tags: ['analytics', 'test'],
          author: 'test-suite',
          created: new Date(),
          updated: new Date(),
        },
      });

      // Deploy the agent
      const deploymentId = await lifecycleManager.deploy({
        templateId,
        replicas: 2,
        environment: { TEST_MODE: 'true' },
      });

      // Submit tasks through conductor
      const taskIds = await Promise.all([
        conductor.submitTask({
          type: 'analytics-processing',
          priority: 'medium',
          payload: { data: 'test-data-1' },
          dependencies: [],
          requiredCapabilities: ['analytics'],
          constraints: {
            maxRetries: 3,
            timeout: 300000,
          },
        }),
        conductor.submitTask({
          type: 'analytics-processing',
          priority: 'high',
          payload: { data: 'test-data-2' },
          dependencies: [],
          requiredCapabilities: ['analytics'],
          constraints: {
            maxRetries: 3,
            timeout: 300000,
          },
        }),
      ]);

      // Wait for task processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify tasks were submitted
      expect(taskIds).toHaveLength(2);
      expect(taskIds.every(id => typeof id === 'string')).toBe(true);

      // Check deployment status
      const instances = lifecycleManager.getDeploymentStatus(deploymentId);
      expect(instances).toHaveLength(2);
      expect(instances.every(i => i.templateId === templateId)).toBe(true);

      // Verify tasks are tracked
      const allTasks = conductor.getTaskStatus() as any[];
      const submittedTasks = allTasks.filter(task => taskIds.includes(task.id));
      expect(submittedTasks).toHaveLength(2);
    });

    test('should handle performance monitoring and optimization', async () => {
      // Record some performance metrics
      performanceOptimizer.recordMetric({
        name: 'task.execution_time',
        type: 'histogram',
        value: 2500,
        tags: { agent: 'test-agent', task_type: 'analytics' },
        unit: 'ms',
      });

      performanceOptimizer.recordMetric({
        name: 'system.throughput',
        type: 'gauge',
        value: 15.7,
        tags: { system: 'orchestration' },
        unit: 'tasks/min',
      });

      performanceOptimizer.recordMetric({
        name: 'resource.cpu_usage',
        type: 'gauge',
        value: 72.5,
        tags: { resource: 'cpu' },
        unit: 'percent',
      });

      // Generate performance report
      const report = performanceOptimizer.generateReport();

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.agents).toBeDefined();
      expect(report.resources).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    test('should handle communication between components', async () => {
      // Create a communication channel
      const channelId = await communication.createChannel({
        name: 'integration-test-channel',
        type: 'topic',
        participants: [],
        config: {
          persistent: true,
          maxMessages: 1000,
          messageRetention: 3600000,
          allowAnonymous: false,
        },
        metadata: {
          description: 'Test channel for integration',
          created: new Date(),
          lastActivity: new Date(),
          messageCount: 0,
        },
      });

      // Send a message
      const messageId = await communication.sendToChannel(channelId, {
        type: 'event',
        from: 'integration-test',
        payload: { event: 'test-integration', data: 'hello world' },
        priority: 'medium',
        requiresAck: false,
        retryCount: 0,
        maxRetries: 3,
      });

      expect(channelId).toBeDefined();
      expect(messageId).toBeDefined();
      expect(typeof channelId).toBe('string');
      expect(typeof messageId).toBe('string');
    });
  });

  describe('System Resilience', () => {
    test('should handle component failures gracefully', async () => {
      // Simulate agent failure by registering and then "failing" it
      const agentId = await conductor.registerAgent({
        name: 'failure-test-agent',
        type: 'test',
        status: 'idle',
        capabilities: [{
          type: 'test-processing',
          priority: 1,
          maxConcurrency: 1,
          estimatedExecutionTime: 5000,
          dependencies: [],
          resourceRequirements: {
            cpu: 1,
            memory: 512,
            network: 10,
          },
        }],
        currentTasks: [],
        metadata: {},
      });

      // Submit a task to the agent
      const taskId = await conductor.submitTask({
        type: 'test-processing',
        priority: 'medium',
        payload: { test: 'failure-scenario' },
        dependencies: [],
        requiredCapabilities: ['test-processing'],
        constraints: {
          maxRetries: 3,
          timeout: 300000,
        },
      });

      // Simulate agent failure by unregistering it
      await conductor.unregisterAgent(agentId);

      // Task should be reassigned or failed gracefully
      const taskStatus = conductor.getTaskStatus(taskId);
      expect(taskStatus).toBeDefined();

      // System should continue operating
      const metrics = conductor.getSystemMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.agents.total).toBe('number');
    });

    test('should handle high load scenarios', async () => {
      const startTime = Date.now();
      
      // Create multiple agents
      const agentPromises = Array.from({ length: 10 }, (_, i) =>
        conductor.registerAgent({
          name: `load-test-agent-${i}`,
          type: 'load-test',
          status: 'idle',
          capabilities: [{
            type: 'load-processing',
            priority: 1,
            maxConcurrency: 3,
            estimatedExecutionTime: 2000,
            dependencies: [],
            resourceRequirements: {
              cpu: 0.5,
              memory: 256,
              network: 5,
            },
          }],
          currentTasks: [],
          metadata: { loadTest: true },
        })
      );

      const agentIds = await Promise.all(agentPromises);

      // Submit many tasks
      const taskPromises = Array.from({ length: 50 }, (_, i) =>
        conductor.submitTask({
          type: 'load-processing',
          priority: 'medium',
          payload: { index: i, timestamp: Date.now() },
          dependencies: [],
          requiredCapabilities: ['load-processing'],
          constraints: {
            maxRetries: 3,
            timeout: 300000,
          },
        })
      );

      const taskIds = await Promise.all(taskPromises);
      const endTime = Date.now();

      expect(agentIds).toHaveLength(10);
      expect(taskIds).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(15000); // Should complete within 15 seconds

      // Verify system stability
      const metrics = conductor.getSystemMetrics();
      expect(metrics.agents.total).toBeGreaterThanOrEqual(10);
      expect(metrics.tasks.total).toBeGreaterThanOrEqual(50);
    });

    test('should maintain data consistency across components', async () => {
      // Register agent in multiple components and verify consistency
      const agentData = {
        name: 'consistency-test-agent',
        type: 'consistency',
        capabilities: [{
          type: 'consistency-check',
          priority: 1,
          maxConcurrency: 2,
          estimatedExecutionTime: 3000,
          dependencies: [],
          resourceRequirements: {
            cpu: 1,
            memory: 512,
            network: 10,
          },
        }],
      };

      // Register in registry
      const registryId = await registry.register({
        ...agentData,
        version: '1.0.0',
        endpoints: [{
          id: 'endpoint-1',
          type: 'http',
          url: 'http://localhost:8080',
          healthCheck: '/health',
        }],
        tags: ['consistency'],
        metadata: {
          description: 'Consistency test agent',
          author: 'test-suite',
          created: new Date(),
          updated: new Date(),
        },
        constraints: {
          maxConcurrentTasks: 5,
          memoryLimit: 1024,
          cpuLimit: 2,
          networkBandwidth: 100,
        },
        sla: {
          uptime: 99.9,
          responseTime: 1000,
          throughput: 100,
        },
      });

      // Register in conductor
      const conductorId = await conductor.registerAgent({
        ...agentData,
        status: 'idle',
        currentTasks: [],
        metadata: {},
      });

      // Verify both registrations exist and are consistent
      const registryAgent = registry.getRegistration(registryId);
      const conductorAgent = conductor.getAgentStatus(conductorId);

      expect(registryAgent).toBeDefined();
      expect(conductorAgent).toBeDefined();
      expect(registryAgent?.name).toBe(agentData.name);
      expect((conductorAgent as any)?.name).toBe(agentData.name);
      expect(registryAgent?.type).toBe(agentData.type);
      expect((conductorAgent as any)?.type).toBe(agentData.type);
    });
  });

  describe('Performance Benchmarks', () => {
    test('should meet performance SLAs for agent operations', async () => {
      const iterations = 100;
      const startTime = Date.now();

      // Benchmark agent registration
      const registrationPromises = Array.from({ length: iterations }, (_, i) =>
        conductor.registerAgent({
          name: `benchmark-agent-${i}`,
          type: 'benchmark',
          status: 'idle',
          capabilities: [{
            type: 'benchmark-processing',
            priority: 1,
            maxConcurrency: 2,
            estimatedExecutionTime: 1000,
            dependencies: [],
            resourceRequirements: {
              cpu: 0.5,
              memory: 256,
              network: 5,
            },
          }],
          currentTasks: [],
          metadata: {},
        })
      );

      const agentIds = await Promise.all(registrationPromises);
      const registrationTime = Date.now() - startTime;

      // Benchmark task submission
      const taskStartTime = Date.now();
      const taskPromises = Array.from({ length: iterations }, (_, i) =>
        conductor.submitTask({
          type: 'benchmark-processing',
          priority: 'medium',
          payload: { index: i },
          dependencies: [],
          requiredCapabilities: ['benchmark-processing'],
          constraints: {
            maxRetries: 3,
            timeout: 300000,
          },
        })
      );

      const taskIds = await Promise.all(taskPromises);
      const taskSubmissionTime = Date.now() - taskStartTime;

      // Performance assertions
      expect(agentIds).toHaveLength(iterations);
      expect(taskIds).toHaveLength(iterations);
      
      // Should register 100 agents in less than 10 seconds (100ms per agent)
      expect(registrationTime).toBeLessThan(10000);
      
      // Should submit 100 tasks in less than 5 seconds (50ms per task)
      expect(taskSubmissionTime).toBeLessThan(5000);

      console.log(`Performance Metrics:
        - Agent Registration: ${registrationTime}ms for ${iterations} agents (${registrationTime/iterations}ms per agent)
        - Task Submission: ${taskSubmissionTime}ms for ${iterations} tasks (${taskSubmissionTime/iterations}ms per task)`);
    });

    test('should handle concurrent operations efficiently', async () => {
      const concurrentOperations = 50;
      const startTime = Date.now();

      // Mix of different operations running concurrently
      const operations = [];

      for (let i = 0; i < concurrentOperations; i++) {
        // Agent registration
        operations.push(
          conductor.registerAgent({
            name: `concurrent-agent-${i}`,
            type: 'concurrent',
            status: 'idle',
            capabilities: [{
              type: 'concurrent-processing',
              priority: 1,
              maxConcurrency: 1,
              estimatedExecutionTime: 1000,
              dependencies: [],
              resourceRequirements: {
                cpu: 0.5,
                memory: 256,
                network: 5,
              },
            }],
            currentTasks: [],
            metadata: {},
          })
        );

        // Task submission
        operations.push(
          conductor.submitTask({
            type: 'concurrent-processing',
            priority: 'medium',
            payload: { index: i },
            dependencies: [],
            requiredCapabilities: ['concurrent-processing'],
            constraints: {
              maxRetries: 3,
              timeout: 300000,
            },
          })
        );

        // System metrics call
        if (i % 10 === 0) {
          operations.push(
            Promise.resolve(conductor.getSystemMetrics())
          );
        }
      }

      const results = await Promise.allSettled(operations);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      expect(successful).toBeGreaterThan(operations.length * 0.95); // 95% success rate
      expect(failed).toBeLessThan(operations.length * 0.05); // Less than 5% failure rate
      expect(endTime - startTime).toBeLessThan(20000); // Complete within 20 seconds

      console.log(`Concurrent Operations:
        - Total Operations: ${operations.length}
        - Successful: ${successful}
        - Failed: ${failed}
        - Duration: ${endTime - startTime}ms
        - Success Rate: ${(successful / operations.length * 100).toFixed(2)}%`);
    });
  });
});