/**
 * Master Conductor Test Suite
 * 
 * Comprehensive tests for the Master Conductor orchestration system.
 */

import { MasterConductor } from '../master-conductor';
import { AgentRegistry } from '../agent-registry';
import { TaskQueue } from '../task-queue';
import { AgentCommunication } from '../agent-communication';

// Mock Redis
jest.mock('ioredis', () => {
  return class MockRedis {
    async ping() { return 'PONG'; }
    async set() { return 'OK'; }
    async get() { return null; }
    async del() { return 1; }
    async keys() { return []; }
    async quit() { return 'OK'; }
    async zadd() { return 1; }
    async zrevrange() { return []; }
    async zrem() { return 1; }
    async zcard() { return 0; }
    async publish() { return 1; }
  };
});

// Mock WebSocket
jest.mock('ws', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn((cb) => cb()),
  })),
}));

describe('MasterConductor', () => {
  let conductor: MasterConductor;
  const mockConfig = {
    maxConcurrentTasks: 10,
    taskTimeoutMs: 300000,
    agentHealthCheckInterval: 30000,
    resourceAllocationStrategy: 'balanced' as const,
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
  };

  beforeEach(async () => {
    conductor = new MasterConductor(mockConfig);
    await conductor.initialize();
  });

  afterEach(async () => {
    await conductor.shutdown();
  });

  describe('Agent Management', () => {
    test('should register a new agent', async () => {
      const agentData = {
        name: 'test-agent',
        type: 'content',
        status: 'idle' as const,
        capabilities: [{
          type: 'content-processing',
          priority: 1,
          maxConcurrency: 5,
          estimatedExecutionTime: 5000,
          dependencies: [],
          resourceRequirements: {
            cpu: 1,
            memory: 512,
            network: 10,
          },
        }],
        currentTasks: [],
        metadata: {
          description: 'Test content processing agent',
          version: '1.0.0',
        },
      };

      const agentId = await conductor.registerAgent(agentData);
      
      expect(agentId).toBeDefined();
      expect(typeof agentId).toBe('string');

      const agentStatus = conductor.getAgentStatus(agentId);
      expect(agentStatus).toBeDefined();
      expect((agentStatus as any).name).toBe('test-agent');
      expect((agentStatus as any).type).toBe('content');
      expect((agentStatus as any).status).toBe('idle');
    });

    test('should unregister an agent', async () => {
      const agentData = {
        name: 'test-agent-2',
        type: 'analytics',
        status: 'idle' as const,
        capabilities: [{
          type: 'analytics',
          priority: 1,
          maxConcurrency: 3,
          estimatedExecutionTime: 3000,
          dependencies: [],
          resourceRequirements: {
            cpu: 0.5,
            memory: 256,
            network: 5,
          },
        }],
        currentTasks: [],
        metadata: {},
      };

      const agentId = await conductor.registerAgent(agentData);
      await conductor.unregisterAgent(agentId);

      expect(() => conductor.getAgentStatus(agentId)).toThrow();
    });

    test('should get system metrics', () => {
      const metrics = conductor.getSystemMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.agents).toBeDefined();
      expect(metrics.tasks).toBeDefined();
      expect(metrics.performance).toBeDefined();
      expect(typeof metrics.agents.total).toBe('number');
      expect(typeof metrics.tasks.total).toBe('number');
    });
  });

  describe('Task Management', () => {
    test('should submit a task', async () => {
      const taskData = {
        type: 'content-analysis',
        priority: 'medium' as const,
        payload: { content: 'test content' },
        dependencies: [],
        requiredCapabilities: ['content-processing'],
        constraints: {
          maxRetries: 3,
          timeout: 300000,
        },
      };

      const taskId = await conductor.submitTask(taskData);
      
      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');

      const taskStatus = conductor.getTaskStatus(taskId);
      expect(taskStatus).toBeDefined();
      expect((taskStatus as any).type).toBe('content-analysis');
      expect((taskStatus as any).status).toBe('pending');
    });

    test('should handle task execution flow', async () => {
      // Register an agent first
      const agentData = {
        name: 'execution-test-agent',
        type: 'content',
        status: 'idle' as const,
        capabilities: [{
          type: 'content-processing',
          priority: 1,
          maxConcurrency: 2,
          estimatedExecutionTime: 2000,
          dependencies: [],
          resourceRequirements: {
            cpu: 1,
            memory: 512,
            network: 10,
          },
        }],
        currentTasks: [],
        metadata: {},
      };

      const agentId = await conductor.registerAgent(agentData);

      // Submit a task
      const taskData = {
        type: 'content-analysis',
        priority: 'high' as const,
        payload: { content: 'test execution content' },
        dependencies: [],
        requiredCapabilities: ['content-processing'],
        constraints: {
          maxRetries: 3,
          timeout: 300000,
        },
      };

      const taskId = await conductor.submitTask(taskData);

      // Wait a bit for task processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const taskStatus = conductor.getTaskStatus(taskId);
      expect(taskStatus).toBeDefined();
      
      // Task should be assigned or running
      expect(['pending', 'assigned', 'running']).toContain((taskStatus as any).status);
    });

    test('should handle workflow submission', async () => {
      const workflow = {
        id: 'test-workflow-1',
        name: 'Test Content Processing Workflow',
        tasks: [
          {
            id: 'task-1',
            type: 'content-extract',
            priority: 'medium' as const,
            payload: { source: 'document.pdf' },
            dependencies: [],
            requiredCapabilities: ['content-processing'],
            constraints: {
              maxRetries: 3,
              timeout: 300000,
            },
            status: 'pending' as const,
            createdAt: new Date(),
            retryCount: 0,
          },
          {
            id: 'task-2',
            type: 'content-analyze',
            priority: 'medium' as const,
            payload: { analysis: 'sentiment' },
            dependencies: ['task-1'],
            requiredCapabilities: ['analytics'],
            constraints: {
              maxRetries: 3,
              timeout: 300000,
            },
            status: 'pending' as const,
            createdAt: new Date(),
            retryCount: 0,
          },
        ],
        dependencies: new Map([
          ['task-2', ['task-1']],
        ]),
        parallelGroups: [],
        constraints: {
          maxDuration: 600000,
          maxRetries: 3,
          rollbackOnFailure: true,
        },
      };

      const workflowId = await conductor.submitWorkflow(workflow);
      
      expect(workflowId).toBeDefined();
      expect(workflowId).toBe('test-workflow-1');
    });
  });

  describe('Performance and Monitoring', () => {
    test('should track performance metrics', () => {
      const metrics = conductor.getSystemMetrics();
      
      expect(metrics.performance).toBeDefined();
      expect(typeof metrics.performance.averageTaskDuration).toBe('number');
      expect(typeof metrics.performance.systemThroughput).toBe('number');
      expect(typeof metrics.performance.successRate).toBe('number');
      expect(metrics.performance.resourceUtilization).toBeDefined();
    });

    test('should handle concurrent task submissions', async () => {
      const taskPromises = Array.from({ length: 5 }, (_, i) => 
        conductor.submitTask({
          type: 'concurrent-test',
          priority: 'medium' as const,
          payload: { index: i },
          dependencies: [],
          requiredCapabilities: ['test-processing'],
          constraints: {
            maxRetries: 3,
            timeout: 300000,
          },
        })
      );

      const taskIds = await Promise.all(taskPromises);
      
      expect(taskIds).toHaveLength(5);
      expect(new Set(taskIds).size).toBe(5); // All IDs should be unique
    });

    test('should handle system shutdown gracefully', async () => {
      const shutdownPromise = conductor.shutdown();
      await expect(shutdownPromise).resolves.toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid agent registration', async () => {
      const invalidAgentData = {
        // Missing required fields
        name: '',
        type: '',
        status: 'idle' as const,
        capabilities: [],
        currentTasks: [],
        metadata: {},
      };

      await expect(conductor.registerAgent(invalidAgentData)).rejects.toThrow();
    });

    test('should handle invalid task submission', async () => {
      const invalidTaskData = {
        // Missing required fields
        type: '',
        priority: 'medium' as const,
        payload: null,
        dependencies: [],
        requiredCapabilities: [],
        constraints: {
          maxRetries: 3,
          timeout: 300000,
        },
      };

      await expect(conductor.submitTask(invalidTaskData)).rejects.toThrow();
    });

    test('should handle agent unregistration with running tasks', async () => {
      // Register agent
      const agentData = {
        name: 'busy-agent',
        type: 'content',
        status: 'busy' as const,
        capabilities: [{
          type: 'content-processing',
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
        currentTasks: ['task-1', 'task-2'],
        metadata: {},
      };

      const agentId = await conductor.registerAgent(agentData);
      
      // Should handle unregistration by reassigning tasks
      await expect(conductor.unregisterAgent(agentId)).resolves.toBeUndefined();
    });
  });

  describe('Load Testing Scenarios', () => {
    test('should handle high agent registration load', async () => {
      const startTime = Date.now();
      
      const registrationPromises = Array.from({ length: 50 }, (_, i) => 
        conductor.registerAgent({
          name: `load-test-agent-${i}`,
          type: `type-${i % 5}`,
          status: 'idle' as const,
          capabilities: [{
            type: `capability-${i % 3}`,
            priority: 1,
            maxConcurrency: 2,
            estimatedExecutionTime: 3000,
            dependencies: [],
            resourceRequirements: {
              cpu: 0.5,
              memory: 256,
              network: 5,
            },
          }],
          currentTasks: [],
          metadata: { index: i },
        })
      );

      const agentIds = await Promise.all(registrationPromises);
      const endTime = Date.now();
      
      expect(agentIds).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Verify all agents are registered
      const allAgents = conductor.getAgentStatus() as any[];
      expect(allAgents.length).toBeGreaterThanOrEqual(50);
    });

    test('should handle high task submission load', async () => {
      const startTime = Date.now();
      
      const taskPromises = Array.from({ length: 100 }, (_, i) => 
        conductor.submitTask({
          type: `load-test-task-${i % 10}`,
          priority: ['low', 'medium', 'high'][i % 3] as any,
          payload: { data: `test-data-${i}` },
          dependencies: [],
          requiredCapabilities: [`capability-${i % 5}`],
          constraints: {
            maxRetries: 3,
            timeout: 300000,
          },
        })
      );

      const taskIds = await Promise.all(taskPromises);
      const endTime = Date.now();
      
      expect(taskIds).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Verify all tasks are tracked
      const allTasks = conductor.getTaskStatus() as any[];
      expect(allTasks.length).toBeGreaterThanOrEqual(100);
    });

    test('should maintain performance under mixed load', async () => {
      const operations = [];
      
      // Mix of agent registrations and task submissions
      for (let i = 0; i < 20; i++) {
        operations.push(
          conductor.registerAgent({
            name: `mixed-load-agent-${i}`,
            type: 'mixed',
            status: 'idle' as const,
            capabilities: [{
              type: 'mixed-processing',
              priority: 1,
              maxConcurrency: 3,
              estimatedExecutionTime: 2000,
              dependencies: [],
              resourceRequirements: {
                cpu: 1,
                memory: 512,
                network: 10,
              },
            }],
            currentTasks: [],
            metadata: {},
          })
        );
        
        operations.push(
          conductor.submitTask({
            type: 'mixed-load-task',
            priority: 'medium' as const,
            payload: { index: i },
            dependencies: [],
            requiredCapabilities: ['mixed-processing'],
            constraints: {
              maxRetries: 3,
              timeout: 300000,
            },
          })
        );
      }

      const startTime = Date.now();
      const results = await Promise.allSettled(operations);
      const endTime = Date.now();
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      expect(successful).toBeGreaterThan(30); // At least 75% success rate
      expect(failed).toBeLessThan(10); // Less than 25% failure rate
      expect(endTime - startTime).toBeLessThan(15000); // Complete within 15 seconds
    });
  });
});