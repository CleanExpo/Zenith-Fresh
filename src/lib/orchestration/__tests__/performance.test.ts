/**
 * Performance Test Suite
 * 
 * Load testing and performance benchmarks for the orchestration system.
 */

import { MasterConductor } from '../master-conductor';
import { TaskQueue } from '../task-queue';
import { AgentRegistry } from '../agent-registry';
import { PerformanceOptimizer } from '../performance-optimizer';

// Mock Redis with performance tracking
jest.mock('ioredis', () => {
  return class MockRedis {
    private operations: number = 0;
    private data: Map<string, string> = new Map();

    async ping() { 
      this.operations++;
      return 'PONG'; 
    }
    
    async set(key: string, value: string) { 
      this.operations++;
      this.data.set(key, value);
      return 'OK'; 
    }
    
    async get(key: string) { 
      this.operations++;
      return this.data.get(key) || null; 
    }
    
    async del(key: string) { 
      this.operations++;
      return 1; 
    }
    
    async keys(pattern: string) { 
      this.operations++;
      return Array.from(this.data.keys()); 
    }
    
    async quit() { return 'OK'; }
    async zadd() { this.operations++; return 1; }
    async zrevrange() { this.operations++; return []; }
    async zrem() { this.operations++; return 1; }
    async zcard() { this.operations++; return 0; }
    async publish() { this.operations++; return 1; }
    async setex() { this.operations++; return 'OK'; }

    getOperations() { return this.operations; }
    resetOperations() { this.operations = 0; }
  };
});

// Mock WebSocket
jest.mock('ws', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn((cb) => cb()),
  })),
}));

describe('Orchestration Performance Tests', () => {
  let conductor: MasterConductor;
  let taskQueue: TaskQueue;
  let registry: AgentRegistry;
  let optimizer: PerformanceOptimizer;

  beforeEach(async () => {
    conductor = new MasterConductor({
      maxConcurrentTasks: 100,
      taskTimeoutMs: 300000,
      agentHealthCheckInterval: 30000,
      resourceAllocationStrategy: 'balanced',
      autoScaling: {
        enabled: true,
        minAgents: 10,
        maxAgents: 200,
        scaleUpThreshold: 80,
        scaleDownThreshold: 30,
      },
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0,
      },
    });

    taskQueue = new TaskQueue({
      maxSize: 10000,
      maxRetries: 3,
      retryDelayMs: 1000,
      visibilityTimeoutMs: 300000,
      deadLetterQueue: true,
      batchSize: 50,
      concurrency: 100,
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0,
      },
    });

    registry = new AgentRegistry('redis://localhost:6379');
    optimizer = new PerformanceOptimizer('redis://localhost:6379');

    await Promise.all([
      conductor.initialize(),
      taskQueue.initialize(),
      registry.initialize(),
      optimizer.initialize(),
    ]);
  });

  afterEach(async () => {
    await Promise.all([
      conductor.shutdown(),
      taskQueue.shutdown(),
      registry.shutdown(),
      optimizer.shutdown(),
    ]);
  });

  describe('Throughput Tests', () => {
    test('should handle 1000 agent registrations within 30 seconds', async () => {
      const agentCount = 1000;
      const maxDuration = 30000; // 30 seconds
      
      const startTime = Date.now();
      
      const promises = Array.from({ length: agentCount }, (_, i) =>
        conductor.registerAgent({
          name: `throughput-agent-${i}`,
          type: `type-${i % 10}`,
          status: 'idle',
          capabilities: [{
            type: `capability-${i % 5}`,
            priority: 1,
            maxConcurrency: 3,
            estimatedExecutionTime: 2000,
            dependencies: [],
            resourceRequirements: {
              cpu: 0.5,
              memory: 256,
              network: 10,
            },
          }],
          currentTasks: [],
          metadata: { index: i },
        })
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Agent Registration Throughput:
        - Total: ${agentCount}
        - Successful: ${successful}
        - Failed: ${failed}
        - Duration: ${duration}ms
        - Rate: ${(successful / (duration / 1000)).toFixed(2)} agents/second`);

      expect(duration).toBeLessThan(maxDuration);
      expect(successful).toBeGreaterThan(agentCount * 0.95); // 95% success rate
      expect(successful / (duration / 1000)).toBeGreaterThan(20); // At least 20 agents/second
    });

    test('should handle 5000 task submissions within 60 seconds', async () => {
      // First register some agents
      const agentPromises = Array.from({ length: 50 }, (_, i) =>
        conductor.registerAgent({
          name: `task-throughput-agent-${i}`,
          type: 'task-processor',
          status: 'idle',
          capabilities: [{
            type: 'task-processing',
            priority: 1,
            maxConcurrency: 5,
            estimatedExecutionTime: 1000,
            dependencies: [],
            resourceRequirements: {
              cpu: 1,
              memory: 512,
              network: 20,
            },
          }],
          currentTasks: [],
          metadata: {},
        })
      );

      await Promise.all(agentPromises);

      const taskCount = 5000;
      const maxDuration = 60000; // 60 seconds
      
      const startTime = Date.now();
      
      const taskPromises = Array.from({ length: taskCount }, (_, i) =>
        conductor.submitTask({
          type: 'task-processing',
          priority: ['low', 'medium', 'high'][i % 3] as any,
          payload: { 
            data: `task-data-${i}`,
            timestamp: Date.now(),
            index: i 
          },
          dependencies: [],
          requiredCapabilities: ['task-processing'],
          constraints: {
            maxRetries: 3,
            timeout: 300000,
          },
        })
      );

      const results = await Promise.allSettled(taskPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Task Submission Throughput:
        - Total: ${taskCount}
        - Successful: ${successful}
        - Failed: ${failed}
        - Duration: ${duration}ms
        - Rate: ${(successful / (duration / 1000)).toFixed(2)} tasks/second`);

      expect(duration).toBeLessThan(maxDuration);
      expect(successful).toBeGreaterThan(taskCount * 0.95); // 95% success rate
      expect(successful / (duration / 1000)).toBeGreaterThan(50); // At least 50 tasks/second
    });

    test('should handle mixed operations under heavy load', async () => {
      const totalOperations = 2000;
      const maxDuration = 45000; // 45 seconds
      
      const startTime = Date.now();
      const operations = [];

      // Generate mixed operations
      for (let i = 0; i < totalOperations; i++) {
        const operationType = i % 4;
        
        switch (operationType) {
          case 0: // Agent registration
            operations.push(
              conductor.registerAgent({
                name: `mixed-agent-${i}`,
                type: 'mixed',
                status: 'idle',
                capabilities: [{
                  type: 'mixed-processing',
                  priority: 1,
                  maxConcurrency: 2,
                  estimatedExecutionTime: 1500,
                  dependencies: [],
                  resourceRequirements: {
                    cpu: 0.5,
                    memory: 256,
                    network: 10,
                  },
                }],
                currentTasks: [],
                metadata: {},
              })
            );
            break;
            
          case 1: // Task submission
            operations.push(
              conductor.submitTask({
                type: 'mixed-processing',
                priority: 'medium',
                payload: { index: i },
                dependencies: [],
                requiredCapabilities: ['mixed-processing'],
                constraints: {
                  maxRetries: 3,
                  timeout: 300000,
                },
              })
            );
            break;
            
          case 2: // System metrics query
            operations.push(
              Promise.resolve(conductor.getSystemMetrics())
            );
            break;
            
          case 3: // Agent discovery
            operations.push(
              registry.discover({
                capabilities: ['mixed-processing'],
                minUptime: 0,
              })
            );
            break;
        }
      }

      const results = await Promise.allSettled(operations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Mixed Operations Performance:
        - Total Operations: ${totalOperations}
        - Successful: ${successful}
        - Failed: ${failed}
        - Duration: ${duration}ms
        - Rate: ${(successful / (duration / 1000)).toFixed(2)} ops/second
        - Success Rate: ${(successful / totalOperations * 100).toFixed(2)}%`);

      expect(duration).toBeLessThan(maxDuration);
      expect(successful).toBeGreaterThan(totalOperations * 0.90); // 90% success rate
      expect(successful / (duration / 1000)).toBeGreaterThan(30); // At least 30 ops/second
    });
  });

  describe('Latency Tests', () => {
    test('should maintain low latency under concurrent load', async () => {
      const concurrentRequests = 100;
      const maxAverageLatency = 500; // 500ms
      
      // Pre-register some agents
      const agentPromises = Array.from({ length: 20 }, (_, i) =>
        conductor.registerAgent({
          name: `latency-agent-${i}`,
          type: 'latency-test',
          status: 'idle',
          capabilities: [{
            type: 'latency-processing',
            priority: 1,
            maxConcurrency: 3,
            estimatedExecutionTime: 1000,
            dependencies: [],
            resourceRequirements: {
              cpu: 0.5,
              memory: 256,
              network: 10,
            },
          }],
          currentTasks: [],
          metadata: {},
        })
      );

      await Promise.all(agentPromises);

      // Measure latency for concurrent task submissions
      const latencyPromises = Array.from({ length: concurrentRequests }, async (_, i) => {
        const startTime = Date.now();
        
        await conductor.submitTask({
          type: 'latency-processing',
          priority: 'medium',
          payload: { index: i },
          dependencies: [],
          requiredCapabilities: ['latency-processing'],
          constraints: {
            maxRetries: 3,
            timeout: 300000,
          },
        });
        
        return Date.now() - startTime;
      });

      const latencies = await Promise.all(latencyPromises);
      const averageLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);
      const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

      console.log(`Latency Metrics:
        - Average: ${averageLatency.toFixed(2)}ms
        - Min: ${minLatency}ms
        - Max: ${maxLatency}ms
        - P95: ${p95Latency}ms
        - Samples: ${concurrentRequests}`);

      expect(averageLatency).toBeLessThan(maxAverageLatency);
      expect(p95Latency).toBeLessThan(maxAverageLatency * 2); // P95 should be within 2x average
    });

    test('should handle burst traffic efficiently', async () => {
      const burstSize = 500;
      const burstInterval = 100; // 100ms between bursts
      const numberOfBursts = 5;
      
      const allLatencies: number[] = [];
      
      for (let burst = 0; burst < numberOfBursts; burst++) {
        const burstStartTime = Date.now();
        
        const burstPromises = Array.from({ length: burstSize }, async (_, i) => {
          const taskStartTime = Date.now();
          
          await conductor.submitTask({
            type: 'burst-processing',
            priority: 'high',
            payload: { burst, index: i },
            dependencies: [],
            requiredCapabilities: ['burst-processing'],
            constraints: {
              maxRetries: 3,
              timeout: 300000,
            },
          });
          
          return Date.now() - taskStartTime;
        });

        const burstLatencies = await Promise.all(burstPromises);
        allLatencies.push(...burstLatencies);
        
        const burstDuration = Date.now() - burstStartTime;
        console.log(`Burst ${burst + 1} completed in ${burstDuration}ms`);
        
        // Wait before next burst
        if (burst < numberOfBursts - 1) {
          await new Promise(resolve => setTimeout(resolve, burstInterval));
        }
      }

      const averageLatency = allLatencies.reduce((sum, lat) => sum + lat, 0) / allLatencies.length;
      const maxLatency = Math.max(...allLatencies);
      const p99Latency = allLatencies.sort((a, b) => a - b)[Math.floor(allLatencies.length * 0.99)];

      console.log(`Burst Traffic Metrics:
        - Total Requests: ${allLatencies.length}
        - Average Latency: ${averageLatency.toFixed(2)}ms
        - Max Latency: ${maxLatency}ms
        - P99 Latency: ${p99Latency}ms`);

      expect(averageLatency).toBeLessThan(1000); // 1 second average
      expect(p99Latency).toBeLessThan(5000); // 5 seconds P99
    });
  });

  describe('Memory and Resource Tests', () => {
    test('should not exceed memory limits during high load', async () => {
      const initialMemory = process.memoryUsage();
      const maxMemoryIncrease = 100 * 1024 * 1024; // 100MB increase limit
      
      // Create a large number of objects to test memory management
      const operations = 1000;
      const results = [];

      for (let i = 0; i < operations; i++) {
        // Register agents
        const agentId = await conductor.registerAgent({
          name: `memory-test-agent-${i}`,
          type: 'memory-test',
          status: 'idle',
          capabilities: [{
            type: 'memory-processing',
            priority: 1,
            maxConcurrency: 2,
            estimatedExecutionTime: 1000,
            dependencies: [],
            resourceRequirements: {
              cpu: 0.5,
              memory: 256,
              network: 10,
            },
          }],
          currentTasks: [],
          metadata: { largeData: new Array(1000).fill(`data-${i}`) },
        });

        // Submit tasks
        const taskId = await conductor.submitTask({
          type: 'memory-processing',
          priority: 'medium',
          payload: { 
            index: i,
            largePayload: new Array(500).fill(`payload-${i}`)
          },
          dependencies: [],
          requiredCapabilities: ['memory-processing'],
          constraints: {
            maxRetries: 3,
            timeout: 300000,
          },
        });

        results.push({ agentId, taskId });

        // Check memory every 100 operations
        if (i % 100 === 0) {
          const currentMemory = process.memoryUsage();
          const memoryIncrease = currentMemory.heapUsed - initialMemory.heapUsed;
          
          console.log(`Memory check at operation ${i}:
            - Heap Used: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
            - Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
          
          expect(memoryIncrease).toBeLessThan(maxMemoryIncrease);
        }
      }

      const finalMemory = process.memoryUsage();
      const totalMemoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`Final Memory Stats:
        - Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        - Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        - Increase: ${(totalMemoryIncrease / 1024 / 1024).toFixed(2)}MB
        - Operations: ${operations}`);

      expect(totalMemoryIncrease).toBeLessThan(maxMemoryIncrease);
      expect(results).toHaveLength(operations);
    });

    test('should efficiently manage resources during scaling', async () => {
      const scaleUpSteps = 10;
      const agentsPerStep = 50;
      const tasksPerAgent = 5;
      
      const resourceMetrics = [];

      for (let step = 0; step < scaleUpSteps; step++) {
        const stepStartTime = Date.now();
        
        // Register agents for this step
        const agentPromises = Array.from({ length: agentsPerStep }, (_, i) =>
          conductor.registerAgent({
            name: `scale-agent-${step}-${i}`,
            type: 'scale-test',
            status: 'idle',
            capabilities: [{
              type: 'scale-processing',
              priority: 1,
              maxConcurrency: 3,
              estimatedExecutionTime: 1000,
              dependencies: [],
              resourceRequirements: {
                cpu: 0.5,
                memory: 256,
                network: 10,
              },
            }],
            currentTasks: [],
            metadata: { step },
          })
        );

        const agentIds = await Promise.all(agentPromises);

        // Submit tasks for these agents
        const taskPromises = [];
        for (const agentId of agentIds) {
          for (let t = 0; t < tasksPerAgent; t++) {
            taskPromises.push(
              conductor.submitTask({
                type: 'scale-processing',
                priority: 'medium',
                payload: { step, agent: agentId, taskIndex: t },
                dependencies: [],
                requiredCapabilities: ['scale-processing'],
                constraints: {
                  maxRetries: 3,
                  timeout: 300000,
                },
              })
            );
          }
        }

        await Promise.all(taskPromises);

        const stepEndTime = Date.now();
        const stepDuration = stepEndTime - stepStartTime;
        const currentMemory = process.memoryUsage();
        const systemMetrics = conductor.getSystemMetrics();

        resourceMetrics.push({
          step,
          totalAgents: (step + 1) * agentsPerStep,
          totalTasks: (step + 1) * agentsPerStep * tasksPerAgent,
          stepDuration,
          memoryUsed: currentMemory.heapUsed,
          systemMetrics,
        });

        console.log(`Scaling Step ${step + 1}:
          - Agents: ${(step + 1) * agentsPerStep}
          - Tasks: ${(step + 1) * agentsPerStep * tasksPerAgent}
          - Duration: ${stepDuration}ms
          - Memory: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      }

      // Analyze resource efficiency
      const finalMetrics = resourceMetrics[resourceMetrics.length - 1];
      const initialMetrics = resourceMetrics[0];
      
      const memoryGrowthRate = (finalMetrics.memoryUsed - initialMetrics.memoryUsed) / 
                              (finalMetrics.totalAgents - initialMetrics.totalAgents);
      
      console.log(`Resource Efficiency Analysis:
        - Final Agents: ${finalMetrics.totalAgents}
        - Final Tasks: ${finalMetrics.totalTasks}
        - Memory Growth Rate: ${(memoryGrowthRate / 1024).toFixed(2)}KB per agent`);

      expect(memoryGrowthRate).toBeLessThan(1024 * 1024); // Less than 1MB per agent
      expect(finalMetrics.stepDuration).toBeLessThan(10000); // Last step under 10 seconds
    });
  });

  describe('Stress Tests', () => {
    test('should handle system stress without failures', async () => {
      const stressTestDuration = 30000; // 30 seconds
      const operationsPerSecond = 50;
      const maxFailureRate = 0.05; // 5%
      
      const startTime = Date.now();
      const operations = [];
      let operationCount = 0;
      
      // Generate continuous load
      const loadGenerator = setInterval(() => {
        const currentTime = Date.now();
        if (currentTime - startTime >= stressTestDuration) {
          clearInterval(loadGenerator);
          return;
        }

        // Generate operations
        for (let i = 0; i < operationsPerSecond; i++) {
          operationCount++;
          const opType = operationCount % 3;
          
          if (opType === 0) {
            operations.push(
              conductor.registerAgent({
                name: `stress-agent-${operationCount}`,
                type: 'stress-test',
                status: 'idle',
                capabilities: [{
                  type: 'stress-processing',
                  priority: 1,
                  maxConcurrency: 2,
                  estimatedExecutionTime: 1000,
                  dependencies: [],
                  resourceRequirements: {
                    cpu: 0.5,
                    memory: 256,
                    network: 10,
                  },
                }],
                currentTasks: [],
                metadata: {},
              })
            );
          } else if (opType === 1) {
            operations.push(
              conductor.submitTask({
                type: 'stress-processing',
                priority: 'medium',
                payload: { operation: operationCount },
                dependencies: [],
                requiredCapabilities: ['stress-processing'],
                constraints: {
                  maxRetries: 3,
                  timeout: 300000,
                },
              })
            );
          } else {
            operations.push(
              Promise.resolve(conductor.getSystemMetrics())
            );
          }
        }
      }, 1000);

      // Wait for stress test completion
      await new Promise(resolve => setTimeout(resolve, stressTestDuration + 1000));

      // Process all operations
      const results = await Promise.allSettled(operations);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const failureRate = failed / operations.length;

      console.log(`Stress Test Results:
        - Duration: ${stressTestDuration}ms
        - Total Operations: ${operations.length}
        - Successful: ${successful}
        - Failed: ${failed}
        - Failure Rate: ${(failureRate * 100).toFixed(2)}%
        - Operations/Second: ${(operations.length / (stressTestDuration / 1000)).toFixed(2)}`);

      expect(failureRate).toBeLessThan(maxFailureRate);
      expect(operations.length).toBeGreaterThan(1000); // At least 1000 operations
    });
  });
});