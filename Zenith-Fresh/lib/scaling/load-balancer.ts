import { Redis } from 'ioredis';
import { performance } from 'perf_hooks';

interface ServerInstance {
  id: string;
  url: string;
  region: string;
  capacity: number;
  currentLoad: number;
  healthy: boolean;
  lastHealthCheck: number;
  responseTime: number;
  connections: number;
  cpu: number;
  memory: number;
  metadata: Record<string, any>;
}

interface LoadBalancingStrategy {
  name: string;
  selectServer(servers: ServerInstance[], request?: any): ServerInstance | null;
}

interface HealthCheckConfig {
  interval: number; // milliseconds
  timeout: number; // milliseconds
  retries: number;
  endpoint: string;
  expectedStatus: number;
  failureThreshold: number;
  recoveryThreshold: number;
}

interface LoadBalancerConfig {
  strategy: 'round_robin' | 'least_connections' | 'weighted_round_robin' | 'ip_hash' | 'geographic' | 'response_time';
  healthCheck: HealthCheckConfig;
  sessionAffinity: boolean;
  stickySessionTTL: number; // seconds
  maxRetries: number;
  circuitBreakerThreshold: number;
  regions: string[];
}

interface LoadBalancerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  serverDistribution: Record<string, number>;
  healthyServers: number;
  unhealthyServers: number;
  regionDistribution: Record<string, number>;
}

/**
 * Load Balancing Strategies
 */
class RoundRobinStrategy implements LoadBalancingStrategy {
  name = 'round_robin';
  private currentIndex = 0;

  selectServer(servers: ServerInstance[]): ServerInstance | null {
    const healthyServers = servers.filter(s => s.healthy);
    if (healthyServers.length === 0) return null;

    const server = healthyServers[this.currentIndex % healthyServers.length];
    this.currentIndex++;
    return server;
  }
}

class LeastConnectionsStrategy implements LoadBalancingStrategy {
  name = 'least_connections';

  selectServer(servers: ServerInstance[]): ServerInstance | null {
    const healthyServers = servers.filter(s => s.healthy);
    if (healthyServers.length === 0) return null;

    return healthyServers.reduce((min, server) => 
      server.connections < min.connections ? server : min
    );
  }
}

class WeightedRoundRobinStrategy implements LoadBalancingStrategy {
  name = 'weighted_round_robin';
  private weights = new Map<string, number>();

  selectServer(servers: ServerInstance[]): ServerInstance | null {
    const healthyServers = servers.filter(s => s.healthy);
    if (healthyServers.length === 0) return null;

    // Calculate weights based on server capacity and current load
    let totalWeight = 0;
    const serverWeights: Array<{ server: ServerInstance; weight: number }> = [];

    for (const server of healthyServers) {
      const weight = Math.max(1, server.capacity - server.currentLoad);
      serverWeights.push({ server, weight });
      totalWeight += weight;
    }

    // Select server based on weight
    let random = Math.random() * totalWeight;
    for (const { server, weight } of serverWeights) {
      random -= weight;
      if (random <= 0) return server;
    }

    return healthyServers[0]; // Fallback
  }
}

class IPHashStrategy implements LoadBalancingStrategy {
  name = 'ip_hash';

  selectServer(servers: ServerInstance[], request?: any): ServerInstance | null {
    const healthyServers = servers.filter(s => s.healthy);
    if (healthyServers.length === 0) return null;

    if (!request?.clientIP) {
      return healthyServers[0]; // Fallback to first server
    }

    // Simple hash of IP address
    const hash = this.hashIP(request.clientIP);
    const index = hash % healthyServers.length;
    return healthyServers[index];
  }

  private hashIP(ip: string): number {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      const char = ip.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

class GeographicStrategy implements LoadBalancingStrategy {
  name = 'geographic';

  selectServer(servers: ServerInstance[], request?: any): ServerInstance | null {
    const healthyServers = servers.filter(s => s.healthy);
    if (healthyServers.length === 0) return null;

    // Try to match client region to server region
    if (request?.region) {
      const regionalServers = healthyServers.filter(s => s.region === request.region);
      if (regionalServers.length > 0) {
        // Use least connections within the region
        return regionalServers.reduce((min, server) => 
          server.connections < min.connections ? server : min
        );
      }
    }

    // Fallback to least connections globally
    return healthyServers.reduce((min, server) => 
      server.connections < min.connections ? server : min
    );
  }
}

class ResponseTimeStrategy implements LoadBalancingStrategy {
  name = 'response_time';

  selectServer(servers: ServerInstance[]): ServerInstance | null {
    const healthyServers = servers.filter(s => s.healthy);
    if (healthyServers.length === 0) return null;

    // Select server with lowest response time
    return healthyServers.reduce((fastest, server) => 
      server.responseTime < fastest.responseTime ? server : fastest
    );
  }
}

/**
 * Circuit Breaker for preventing cascade failures
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  getState(): string {
    return this.state;
  }
}

/**
 * Main Load Balancer Class
 */
export class LoadBalancer {
  private servers = new Map<string, ServerInstance>();
  private strategy: LoadBalancingStrategy;
  private redis: Redis;
  private config: LoadBalancerConfig;
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metrics: LoadBalancerMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0,
    serverDistribution: {},
    healthyServers: 0,
    unhealthyServers: 0,
    regionDistribution: {},
  };

  constructor(redis: Redis, config: LoadBalancerConfig) {
    this.redis = redis;
    this.config = config;
    this.strategy = this.createStrategy(config.strategy);
    this.startHealthChecks();
  }

  /**
   * Add server to the pool
   */
  async addServer(server: Omit<ServerInstance, 'healthy' | 'lastHealthCheck' | 'currentLoad' | 'connections' | 'cpu' | 'memory'>): Promise<void> {
    const fullServer: ServerInstance = {
      ...server,
      healthy: true,
      lastHealthCheck: Date.now(),
      currentLoad: 0,
      connections: 0,
      cpu: 0,
      memory: 0,
    };

    this.servers.set(server.id, fullServer);
    this.circuitBreakers.set(server.id, new CircuitBreaker(this.config.circuitBreakerThreshold));

    // Register in Redis for cluster coordination
    await this.redis.hset('load_balancer:servers', server.id, JSON.stringify(fullServer));
    
    console.log(`Added server ${server.id} to load balancer`);
  }

  /**
   * Remove server from the pool
   */
  async removeServer(serverId: string): Promise<void> {
    this.servers.delete(serverId);
    this.circuitBreakers.delete(serverId);
    
    await this.redis.hdel('load_balancer:servers', serverId);
    
    console.log(`Removed server ${serverId} from load balancer`);
  }

  /**
   * Route request to appropriate server
   */
  async routeRequest(request: {
    clientIP?: string;
    region?: string;
    sessionId?: string;
    path?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    server: ServerInstance | null;
    error?: string;
    retries: number;
  }> {
    const startTime = performance.now();
    let retries = 0;
    let lastError: string | undefined;

    // Check for sticky session
    if (this.config.sessionAffinity && request.sessionId) {
      const stickyServer = await this.getStickyServer(request.sessionId);
      if (stickyServer && stickyServer.healthy) {
        await this.updateServerLoad(stickyServer.id, 1);
        this.updateMetrics(stickyServer, performance.now() - startTime, true);
        return { server: stickyServer, retries: 0 };
      }
    }

    // Try to route request with retries
    while (retries <= this.config.maxRetries) {
      const server = this.strategy.selectServer(Array.from(this.servers.values()), request);
      
      if (!server) {
        lastError = 'No healthy servers available';
        break;
      }

      const circuitBreaker = this.circuitBreakers.get(server.id);
      if (!circuitBreaker) {
        lastError = 'Circuit breaker not found';
        retries++;
        continue;
      }

      try {
        // Test server availability through circuit breaker
        await circuitBreaker.execute(async () => {
          if (!server.healthy) {
            throw new Error('Server is unhealthy');
          }
        });

        // Update server load and session affinity
        await this.updateServerLoad(server.id, 1);
        
        if (this.config.sessionAffinity && request.sessionId) {
          await this.setStickyServer(request.sessionId, server.id);
        }

        this.updateMetrics(server, performance.now() - startTime, true);
        return { server, retries };

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        retries++;
        console.warn(`Request failed on server ${server.id}, retrying... (${retries}/${this.config.maxRetries})`);
      }
    }

    this.updateMetrics(null, performance.now() - startTime, false);
    return { server: null, error: lastError, retries };
  }

  /**
   * Update server metrics
   */
  async updateServerMetrics(serverId: string, metrics: {
    responseTime?: number;
    connections?: number;
    cpu?: number;
    memory?: number;
    currentLoad?: number;
  }): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) return;

    // Update server metrics
    if (metrics.responseTime !== undefined) server.responseTime = metrics.responseTime;
    if (metrics.connections !== undefined) server.connections = metrics.connections;
    if (metrics.cpu !== undefined) server.cpu = metrics.cpu;
    if (metrics.memory !== undefined) server.memory = metrics.memory;
    if (metrics.currentLoad !== undefined) server.currentLoad = metrics.currentLoad;

    // Update in Redis
    await this.redis.hset('load_balancer:servers', serverId, JSON.stringify(server));
  }

  /**
   * Health check implementation
   */
  private async performHealthCheck(server: ServerInstance): Promise<boolean> {
    try {
      const startTime = performance.now();
      
      // Simulate health check HTTP request
      // In production, use actual HTTP client
      const isHealthy = await this.checkServerHealth(server);
      
      server.responseTime = performance.now() - startTime;
      server.lastHealthCheck = Date.now();
      
      return isHealthy;
    } catch (error) {
      console.error(`Health check failed for server ${server.id}:`, error);
      return false;
    }
  }

  private async checkServerHealth(server: ServerInstance): Promise<boolean> {
    // Simulate health check - in production, implement actual HTTP health check
    const healthCheckUrl = `${server.url}${this.config.healthCheck.endpoint}`;
    
    try {
      // Mock health check response
      const mockResponse = {
        status: Math.random() > 0.1 ? 200 : 500, // 90% success rate
        responseTime: Math.random() * 100 + 10, // 10-110ms
      };
      
      if (mockResponse.status === this.config.healthCheck.expectedStatus) {
        server.responseTime = mockResponse.responseTime;
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      const servers = Array.from(this.servers.values());
      
      const healthCheckPromises = servers.map(async server => {
        const isHealthy = await this.performHealthCheck(server);
        
        if (isHealthy !== server.healthy) {
          server.healthy = isHealthy;
          console.log(`Server ${server.id} health changed to: ${isHealthy ? 'healthy' : 'unhealthy'}`);
          
          // Update in Redis
          await this.redis.hset('load_balancer:servers', server.id, JSON.stringify(server));
        }
      });

      await Promise.all(healthCheckPromises);
      await this.updateHealthMetrics();
      
    }, this.config.healthCheck.interval);
  }

  /**
   * Stop health checks
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Get load balancer statistics
   */
  async getStats(): Promise<LoadBalancerMetrics & {
    servers: ServerInstance[];
    circuitBreakerStates: Record<string, string>;
    healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  }> {
    const servers = Array.from(this.servers.values());
    const healthyServers = servers.filter(s => s.healthy);
    
    const circuitBreakerStates: Record<string, string> = {};
    for (const [serverId, breaker] of Array.from(this.circuitBreakers.entries())) {
      circuitBreakerStates[serverId] = breaker.getState();
    }

    let healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (healthyServers.length === 0) {
      healthStatus = 'unhealthy';
    } else if (healthyServers.length < servers.length * 0.8) {
      healthStatus = 'degraded';
    }

    return {
      ...this.metrics,
      servers,
      circuitBreakerStates,
      healthStatus,
    };
  }

  /**
   * Auto-scaling integration
   */
  async shouldScale(): Promise<{
    scaleUp: boolean;
    scaleDown: boolean;
    reason: string;
    suggestedInstances: number;
  }> {
    const servers = Array.from(this.servers.values());
    const healthyServers = servers.filter(s => s.healthy);
    
    if (healthyServers.length === 0) {
      return {
        scaleUp: true,
        scaleDown: false,
        reason: 'No healthy servers available',
        suggestedInstances: Math.max(2, servers.length),
      };
    }

    // Calculate average load across healthy servers
    const avgLoad = healthyServers.reduce((sum, s) => sum + s.currentLoad, 0) / healthyServers.length;
    const avgCpu = healthyServers.reduce((sum, s) => sum + s.cpu, 0) / healthyServers.length;
    const avgConnections = healthyServers.reduce((sum, s) => sum + s.connections, 0) / healthyServers.length;

    // Scale up conditions
    if (avgLoad > 80 || avgCpu > 80 || avgConnections > 1000) {
      return {
        scaleUp: true,
        scaleDown: false,
        reason: `High resource usage: Load ${avgLoad}%, CPU ${avgCpu}%, Connections ${avgConnections}`,
        suggestedInstances: Math.ceil(healthyServers.length * 1.5),
      };
    }

    // Scale down conditions
    if (avgLoad < 20 && avgCpu < 30 && healthyServers.length > 2) {
      return {
        scaleUp: false,
        scaleDown: true,
        reason: `Low resource usage: Load ${avgLoad}%, CPU ${avgCpu}%`,
        suggestedInstances: Math.max(2, Math.floor(healthyServers.length * 0.7)),
      };
    }

    return {
      scaleUp: false,
      scaleDown: false,
      reason: 'Resource usage within normal range',
      suggestedInstances: healthyServers.length,
    };
  }

  /**
   * Graceful server removal for scaling down
   */
  async drainServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) return;

    console.log(`Starting drain process for server ${serverId}`);
    
    // Mark server as unhealthy to stop new requests
    server.healthy = false;
    await this.redis.hset('load_balancer:servers', serverId, JSON.stringify(server));

    // Wait for existing connections to finish (up to 30 seconds)
    const maxWaitTime = 30000;
    const checkInterval = 1000;
    let waitTime = 0;

    while (server.connections > 0 && waitTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitTime += checkInterval;
      
      // Check current connections (would be updated by monitoring)
      console.log(`Server ${serverId} still has ${server.connections} active connections`);
    }

    if (server.connections > 0) {
      console.warn(`Server ${serverId} still has active connections after ${maxWaitTime}ms, forcing removal`);
    }

    await this.removeServer(serverId);
    console.log(`Server ${serverId} successfully drained and removed`);
  }

  /**
   * Private helper methods
   */
  private createStrategy(strategyName: string): LoadBalancingStrategy {
    switch (strategyName) {
      case 'round_robin':
        return new RoundRobinStrategy();
      case 'least_connections':
        return new LeastConnectionsStrategy();
      case 'weighted_round_robin':
        return new WeightedRoundRobinStrategy();
      case 'ip_hash':
        return new IPHashStrategy();
      case 'geographic':
        return new GeographicStrategy();
      case 'response_time':
        return new ResponseTimeStrategy();
      default:
        return new RoundRobinStrategy();
    }
  }

  private async getStickyServer(sessionId: string): Promise<ServerInstance | null> {
    try {
      const serverId = await this.redis.get(`session:${sessionId}`);
      return serverId ? this.servers.get(serverId) || null : null;
    } catch (error) {
      return null;
    }
  }

  private async setStickyServer(sessionId: string, serverId: string): Promise<void> {
    try {
      await this.redis.setex(`session:${sessionId}`, this.config.stickySessionTTL, serverId);
    } catch (error) {
      console.error('Failed to set sticky session:', error);
    }
  }

  private async updateServerLoad(serverId: string, delta: number): Promise<void> {
    const server = this.servers.get(serverId);
    if (server) {
      server.currentLoad = Math.max(0, server.currentLoad + delta);
      await this.redis.hset('load_balancer:servers', serverId, JSON.stringify(server));
    }
  }

  private updateMetrics(server: ServerInstance | null, responseTime: number, success: boolean): void {
    this.metrics.totalRequests++;
    
    if (success && server) {
      this.metrics.successfulRequests++;
      this.metrics.serverDistribution[server.id] = (this.metrics.serverDistribution[server.id] || 0) + 1;
      this.metrics.regionDistribution[server.region] = (this.metrics.regionDistribution[server.region] || 0) + 1;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalResponseTime = this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + responseTime;
    this.metrics.avgResponseTime = totalResponseTime / this.metrics.totalRequests;
  }

  private async updateHealthMetrics(): Promise<void> {
    const servers = Array.from(this.servers.values());
    this.metrics.healthyServers = servers.filter(s => s.healthy).length;
    this.metrics.unhealthyServers = servers.filter(s => !s.healthy).length;
  }
}

/**
 * Load Balancer Factory
 */
export function createLoadBalancer(redis: Redis, config?: Partial<LoadBalancerConfig>): LoadBalancer {
  const defaultConfig: LoadBalancerConfig = {
    strategy: 'least_connections',
    healthCheck: {
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      retries: 3,
      endpoint: '/health',
      expectedStatus: 200,
      failureThreshold: 3,
      recoveryThreshold: 2,
    },
    sessionAffinity: false,
    stickySessionTTL: 3600, // 1 hour
    maxRetries: 3,
    circuitBreakerThreshold: 5,
    regions: ['us-east-1', 'us-west-2', 'eu-west-1'],
  };

  return new LoadBalancer(redis, { ...defaultConfig, ...config });
}

/**
 * Horizontal Scaling Manager
 */
export class HorizontalScaler {
  private loadBalancer: LoadBalancer;
  private redis: Redis;
  private scaling = false;
  private cooldownPeriod = 300000; // 5 minutes
  private lastScaleAction = 0;

  constructor(loadBalancer: LoadBalancer, redis: Redis) {
    this.loadBalancer = loadBalancer;
    this.redis = redis;
  }

  /**
   * Monitor and auto-scale based on metrics
   */
  async monitorAndScale(): Promise<{
    action: 'scale_up' | 'scale_down' | 'no_action';
    reason: string;
    instancesChanged: number;
  }> {
    if (this.scaling) {
      return { action: 'no_action', reason: 'Scaling operation in progress', instancesChanged: 0 };
    }

    const now = Date.now();
    if (now - this.lastScaleAction < this.cooldownPeriod) {
      return { action: 'no_action', reason: 'Cooldown period active', instancesChanged: 0 };
    }

    const scalingDecision = await this.loadBalancer.shouldScale();
    
    if (scalingDecision.scaleUp) {
      return await this.scaleUp(scalingDecision.suggestedInstances, scalingDecision.reason);
    } else if (scalingDecision.scaleDown) {
      return await this.scaleDown(scalingDecision.suggestedInstances, scalingDecision.reason);
    }

    return { action: 'no_action', reason: scalingDecision.reason, instancesChanged: 0 };
  }

  /**
   * Scale up by adding new instances
   */
  private async scaleUp(targetInstances: number, reason: string): Promise<{
    action: 'scale_up';
    reason: string;
    instancesChanged: number;
  }> {
    this.scaling = true;
    this.lastScaleAction = Date.now();

    try {
      const stats = await this.loadBalancer.getStats();
      const currentInstances = stats.servers.length;
      const instancesToAdd = targetInstances - currentInstances;

      console.log(`Scaling up: Adding ${instancesToAdd} instances. Reason: ${reason}`);

      // In production, this would integrate with cloud provider APIs
      for (let i = 0; i < instancesToAdd; i++) {
        await this.addNewInstance();
      }

      return {
        action: 'scale_up',
        reason,
        instancesChanged: instancesToAdd,
      };
    } finally {
      this.scaling = false;
    }
  }

  /**
   * Scale down by removing instances
   */
  private async scaleDown(targetInstances: number, reason: string): Promise<{
    action: 'scale_down';
    reason: string;
    instancesChanged: number;
  }> {
    this.scaling = true;
    this.lastScaleAction = Date.now();

    try {
      const stats = await this.loadBalancer.getStats();
      const currentInstances = stats.servers.length;
      const instancesToRemove = currentInstances - targetInstances;

      console.log(`Scaling down: Removing ${instancesToRemove} instances. Reason: ${reason}`);

      // Select least utilized servers for removal
      const serversToRemove = stats.servers
        .filter(s => s.healthy)
        .sort((a, b) => a.currentLoad - b.currentLoad)
        .slice(0, instancesToRemove);

      // Gracefully drain and remove servers
      for (const server of serversToRemove) {
        await this.loadBalancer.drainServer(server.id);
        await this.removeInstance(server.id);
      }

      return {
        action: 'scale_down',
        reason,
        instancesChanged: instancesToRemove,
      };
    } finally {
      this.scaling = false;
    }
  }

  /**
   * Add new instance (integrates with cloud provider)
   */
  private async addNewInstance(): Promise<void> {
    // In production, this would call cloud provider APIs to launch new instances
    const newServerId = `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await this.loadBalancer.addServer({
      id: newServerId,
      url: `http://${newServerId}.internal.example.com`,
      region: 'us-east-1', // Would be determined by scaling policy
      capacity: 100,
      responseTime: 50,
      metadata: {
        instanceType: 't3.medium',
        launchedAt: new Date().toISOString(),
      },
    });

    console.log(`Added new instance: ${newServerId}`);
  }

  /**
   * Remove instance (integrates with cloud provider)
   */
  private async removeInstance(serverId: string): Promise<void> {
    // In production, this would call cloud provider APIs to terminate instances
    console.log(`Terminated instance: ${serverId}`);
  }

  /**
   * Get scaling metrics and status
   */
  async getScalingStatus(): Promise<{
    isScaling: boolean;
    lastScaleAction: number;
    cooldownRemaining: number;
    currentInstances: number;
    recommendedAction: string;
  }> {
    const stats = await this.loadBalancer.getStats();
    const scalingDecision = await this.loadBalancer.shouldScale();
    const now = Date.now();

    return {
      isScaling: this.scaling,
      lastScaleAction: this.lastScaleAction,
      cooldownRemaining: Math.max(0, this.cooldownPeriod - (now - this.lastScaleAction)),
      currentInstances: stats.servers.length,
      recommendedAction: scalingDecision.scaleUp ? 'Scale Up' : 
                        scalingDecision.scaleDown ? 'Scale Down' : 'No Action',
    };
  }
}