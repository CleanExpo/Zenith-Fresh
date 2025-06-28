/**
 * Agent Registry and Discovery Service
 * 
 * Centralized registry for agent discovery, capability matching,
 * and dynamic service registration/deregistration.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { cache, initRedis, JSONCache } from '@/lib/redis';
import { Agent, AgentCapability } from './master-conductor';

export interface ServiceEndpoint {
  id: string;
  type: 'http' | 'websocket' | 'grpc' | 'queue';
  url: string;
  healthCheck: string;
  authentication?: {
    type: 'bearer' | 'basic' | 'api-key';
    credentials: string;
  };
}

export interface AgentRegistration {
  id: string;
  name: string;
  type: string;
  version: string;
  capabilities: AgentCapability[];
  endpoints: ServiceEndpoint[];
  tags: string[];
  metadata: {
    description: string;
    author: string;
    created: Date;
    updated: Date;
    location?: {
      region: string;
      zone: string;
      datacenter: string;
    };
  };
  constraints: {
    maxConcurrentTasks: number;
    memoryLimit: number;
    cpuLimit: number;
    networkBandwidth: number;
  };
  sla: {
    uptime: number;
    responseTime: number;
    throughput: number;
  };
}

export interface DiscoveryQuery {
  capabilities?: string[];
  tags?: string[];
  region?: string;
  minUptime?: number;
  maxResponseTime?: number;
  minThroughput?: number;
  excludeAgents?: string[];
}

export interface AgentHealth {
  agentId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime: number;
  uptime: number;
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  errors: Array<{
    timestamp: Date;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

/**
 * Agent Registry - Service discovery and registration
 */
export class AgentRegistry extends EventEmitter {
  private cache = cache;
  private registrations: Map<string, AgentRegistration> = new Map();
  private healthStatus: Map<string, AgentHealth> = new Map();
  private discoveryCache: Map<string, { query: DiscoveryQuery; results: string[]; expires: Date }> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private cacheCleanupInterval: NodeJS.Timeout | null = null;

  constructor(redisUrl?: string) {
    super();
    this.init();
    this.setupEventHandlers();
  }

  private async init() {
    await initRedis();
  }

  /**
   * Initialize the registry
   */
  async initialize(): Promise<void> {
    try {
      await this.redis.ping();
      console.log('✅ Agent Registry: Connected to Redis');

      // Load existing registrations
      await this.loadRegistrations();

      // Start health monitoring
      this.startHealthMonitoring();

      // Start cache cleanup
      this.startCacheCleanup();

      this.emit('initialized');
      console.log('🚀 Agent Registry: Service initialized');
    } catch (error) {
      console.error('❌ Agent Registry: Initialization failed', error);
      throw error;
    }
  }

  /**
   * Register a new agent
   */
  async register(registration: Omit<AgentRegistration, 'id' | 'metadata'>): Promise<string> {
    const agentId = uuidv4();
    const fullRegistration: AgentRegistration = {
      ...registration,
      id: agentId,
      metadata: {
        ...registration.metadata,
        created: new Date(),
        updated: new Date(),
      },
    };

    // Validate registration
    this.validateRegistration(fullRegistration);

    // Store in memory and Redis
    this.registrations.set(agentId, fullRegistration);
    await this.persistRegistration(agentId);

    // Initialize health status
    const initialHealth: AgentHealth = {
      agentId,
      status: 'unknown',
      lastCheck: new Date(),
      responseTime: 0,
      uptime: 0,
      metrics: { cpu: 0, memory: 0, disk: 0, network: 0 },
      errors: [],
    };
    this.healthStatus.set(agentId, initialHealth);

    // Clear discovery cache
    this.discoveryCache.clear();

    this.emit('agentRegistered', fullRegistration);
    console.log(`✅ Agent registered: ${registration.name} (${agentId})`);

    return agentId;
  }

  /**
   * Unregister an agent
   */
  async unregister(agentId: string): Promise<void> {
    const registration = this.registrations.get(agentId);
    if (!registration) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Remove from memory and Redis
    this.registrations.delete(agentId);
    this.healthStatus.delete(agentId);
    await this.redis.del(`agent:registration:${agentId}`);
    await this.redis.del(`agent:health:${agentId}`);

    // Clear discovery cache
    this.discoveryCache.clear();

    this.emit('agentUnregistered', registration);
    console.log(`❌ Agent unregistered: ${registration.name} (${agentId})`);
  }

  /**
   * Update agent registration
   */
  async updateRegistration(agentId: string, updates: Partial<AgentRegistration>): Promise<void> {
    const registration = this.registrations.get(agentId);
    if (!registration) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const updatedRegistration: AgentRegistration = {
      ...registration,
      ...updates,
      id: agentId, // Prevent ID changes
      metadata: {
        ...registration.metadata,
        ...updates.metadata,
        updated: new Date(),
      },
    };

    this.validateRegistration(updatedRegistration);
    this.registrations.set(agentId, updatedRegistration);
    await this.persistRegistration(agentId);

    // Clear discovery cache
    this.discoveryCache.clear();

    this.emit('agentUpdated', updatedRegistration);
    console.log(`🔄 Agent updated: ${updatedRegistration.name} (${agentId})`);
  }

  /**
   * Discover agents based on query criteria
   */
  async discover(query: DiscoveryQuery): Promise<AgentRegistration[]> {
    const cacheKey = JSON.stringify(query);
    const cached = this.discoveryCache.get(cacheKey);

    if (cached && cached.expires > new Date()) {
      console.log('📋 Discovery: Using cached results');
      return cached.results.map(id => this.registrations.get(id)!).filter(Boolean);
    }

    console.log('🔍 Discovery: Executing query', query);
    const results = this.executeDiscoveryQuery(query);

    // Cache results for 5 minutes
    this.discoveryCache.set(cacheKey, {
      query,
      results: results.map(r => r.id),
      expires: new Date(Date.now() + 5 * 60 * 1000),
    });

    return results;
  }

  /**
   * Get agent registration by ID
   */
  getRegistration(agentId: string): AgentRegistration | undefined {
    return this.registrations.get(agentId);
  }

  /**
   * Get all registered agents
   */
  getAllRegistrations(): AgentRegistration[] {
    return Array.from(this.registrations.values());
  }

  /**
   * Get agent health status
   */
  getHealthStatus(agentId: string): AgentHealth | undefined {
    return this.healthStatus.get(agentId);
  }

  /**
   * Get all health statuses
   */
  getAllHealthStatuses(): AgentHealth[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Find agents by capability
   */
  findByCapability(capability: string): AgentRegistration[] {
    return Array.from(this.registrations.values()).filter(registration =>
      registration.capabilities.some(cap => cap.type === capability)
    );
  }

  /**
   * Find agents by tag
   */
  findByTag(tag: string): AgentRegistration[] {
    return Array.from(this.registrations.values()).filter(registration =>
      registration.tags.includes(tag)
    );
  }

  /**
   * Get registry statistics
   */
  getStatistics() {
    const registrations = Array.from(this.registrations.values());
    const healthStatuses = Array.from(this.healthStatus.values());

    const capabilityCount = new Map<string, number>();
    const tagCount = new Map<string, number>();
    const typeCount = new Map<string, number>();

    registrations.forEach(reg => {
      // Count capabilities
      reg.capabilities.forEach(cap => {
        capabilityCount.set(cap.type, (capabilityCount.get(cap.type) || 0) + 1);
      });

      // Count tags
      reg.tags.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });

      // Count types
      typeCount.set(reg.type, (typeCount.get(reg.type) || 0) + 1);
    });

    const healthCounts = {
      healthy: healthStatuses.filter(h => h.status === 'healthy').length,
      degraded: healthStatuses.filter(h => h.status === 'degraded').length,
      unhealthy: healthStatuses.filter(h => h.status === 'unhealthy').length,
      unknown: healthStatuses.filter(h => h.status === 'unknown').length,
    };

    return {
      totalAgents: registrations.length,
      capabilities: Object.fromEntries(capabilityCount),
      tags: Object.fromEntries(tagCount),
      types: Object.fromEntries(typeCount),
      health: healthCounts,
      averageUptime: healthStatuses.reduce((sum, h) => sum + h.uptime, 0) / healthStatuses.length || 0,
      averageResponseTime: healthStatuses.reduce((sum, h) => sum + h.responseTime, 0) / healthStatuses.length || 0,
    };
  }

  /**
   * Execute discovery query
   */
  private executeDiscoveryQuery(query: DiscoveryQuery): AgentRegistration[] {
    let results = Array.from(this.registrations.values());

    // Filter by capabilities
    if (query.capabilities && query.capabilities.length > 0) {
      results = results.filter(reg =>
        query.capabilities!.every(cap =>
          reg.capabilities.some(regCap => regCap.type === cap)
        )
      );
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(reg =>
        query.tags!.some(tag => reg.tags.includes(tag))
      );
    }

    // Filter by region
    if (query.region) {
      results = results.filter(reg =>
        reg.metadata.location?.region === query.region
      );
    }

    // Filter by health metrics
    if (query.minUptime !== undefined) {
      results = results.filter(reg => {
        const health = this.healthStatus.get(reg.id);
        return health && health.uptime >= query.minUptime!;
      });
    }

    if (query.maxResponseTime !== undefined) {
      results = results.filter(reg => {
        const health = this.healthStatus.get(reg.id);
        return health && health.responseTime <= query.maxResponseTime!;
      });
    }

    // Exclude specific agents
    if (query.excludeAgents && query.excludeAgents.length > 0) {
      results = results.filter(reg =>
        !query.excludeAgents!.includes(reg.id)
      );
    }

    // Sort by health score (combination of uptime and response time)
    results.sort((a, b) => {
      const healthA = this.healthStatus.get(a.id);
      const healthB = this.healthStatus.get(b.id);

      if (!healthA && !healthB) return 0;
      if (!healthA) return 1;
      if (!healthB) return -1;

      const scoreA = (healthA.uptime * 0.7) + ((1000 - healthA.responseTime) * 0.3);
      const scoreB = (healthB.uptime * 0.7) + ((1000 - healthB.responseTime) * 0.3);

      return scoreB - scoreA;
    });

    return results;
  }

  /**
   * Validate agent registration
   */
  private validateRegistration(registration: AgentRegistration): void {
    if (!registration.name || registration.name.trim().length === 0) {
      throw new Error('Agent name is required');
    }

    if (!registration.type || registration.type.trim().length === 0) {
      throw new Error('Agent type is required');
    }

    if (!registration.capabilities || registration.capabilities.length === 0) {
      throw new Error('At least one capability is required');
    }

    if (!registration.endpoints || registration.endpoints.length === 0) {
      throw new Error('At least one endpoint is required');
    }

    // Validate capabilities
    registration.capabilities.forEach(cap => {
      if (!cap.type || cap.priority < 0 || cap.maxConcurrency < 1) {
        throw new Error(`Invalid capability: ${JSON.stringify(cap)}`);
      }
    });

    // Validate endpoints
    registration.endpoints.forEach(endpoint => {
      if (!endpoint.url || !endpoint.healthCheck) {
        throw new Error(`Invalid endpoint: ${JSON.stringify(endpoint)}`);
      }
    });
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform health checks on all registered agents
   */
  private async performHealthChecks(): Promise<void> {
    const registrations = Array.from(this.registrations.values());
    
    const healthCheckPromises = registrations.map(async (registration) => {
      try {
        const health = await this.checkAgentHealth(registration);
        this.healthStatus.set(registration.id, health);
        await this.persistHealthStatus(registration.id);
      } catch (error) {
        console.error(`❌ Health check failed for ${registration.name}:`, error);
        
        const health = this.healthStatus.get(registration.id);
        if (health) {
          health.status = 'unhealthy';
          health.lastCheck = new Date();
          health.errors.push({
            timestamp: new Date(),
            message: error instanceof Error ? error.message : String(error),
            severity: 'high',
          });
          this.healthStatus.set(registration.id, health);
        }
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Check health of a specific agent
   */
  private async checkAgentHealth(registration: AgentRegistration): Promise<AgentHealth> {
    const startTime = Date.now();
    
    // Find HTTP endpoint for health check
    const httpEndpoint = registration.endpoints.find(ep => ep.type === 'http');
    if (!httpEndpoint) {
      throw new Error('No HTTP endpoint found for health check');
    }

    try {
      // Perform health check (simulated for now)
      // In real implementation, this would make actual HTTP requests
      const responseTime = Math.random() * 1000 + 100; // 100-1100ms
      await new Promise(resolve => setTimeout(resolve, responseTime));

      const health: AgentHealth = {
        agentId: registration.id,
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        uptime: Math.random() * 100, // Simulate uptime percentage
        metrics: {
          cpu: Math.random() * 100,
          memory: Math.random() * 8192,
          disk: Math.random() * 1024,
          network: Math.random() * 1000,
        },
        errors: this.healthStatus.get(registration.id)?.errors || [],
      };

      // Determine health status based on metrics
      if (health.metrics.cpu > 90 || health.metrics.memory > 7000 || health.responseTime > 5000) {
        health.status = 'degraded';
      }

      return health;

    } catch (error) {
      const existingHealth = this.healthStatus.get(registration.id);
      return {
        agentId: registration.id,
        status: 'unhealthy',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        uptime: existingHealth?.uptime || 0,
        metrics: existingHealth?.metrics || { cpu: 0, memory: 0, disk: 0, network: 0 },
        errors: [
          ...(existingHealth?.errors || []),
          {
            timestamp: new Date(),
            message: error instanceof Error ? error.message : String(error),
            severity: 'critical' as const,
          },
        ].slice(-10), // Keep only last 10 errors
      };
    }
  }

  /**
   * Start cache cleanup
   */
  private startCacheCleanup(): void {
    this.cacheCleanupInterval = setInterval(() => {
      const now = new Date();
      for (const [key, cached] of this.discoveryCache.entries()) {
        if (cached.expires < now) {
          this.discoveryCache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  /**
   * Load registrations from Redis
   */
  private async loadRegistrations(): Promise<void> {
    try {
      const registrationKeys = await this.redis.keys('agent:registration:*');
      
      for (const key of registrationKeys) {
        const data = await this.redis.get(key);
        if (data) {
          const registration = JSON.parse(data);
          this.registrations.set(registration.id, registration);
        }
      }

      const healthKeys = await this.redis.keys('agent:health:*');
      
      for (const key of healthKeys) {
        const data = await this.redis.get(key);
        if (data) {
          const health = JSON.parse(data);
          this.healthStatus.set(health.agentId, health);
        }
      }

      console.log(`📊 Registry loaded: ${this.registrations.size} registrations, ${this.healthStatus.size} health records`);
    } catch (error) {
      console.error('❌ Failed to load registrations:', error);
    }
  }

  /**
   * Persist registration to Redis
   */
  private async persistRegistration(agentId: string): Promise<void> {
    const registration = this.registrations.get(agentId);
    if (registration) {
      await this.redis.set(
        `agent:registration:${agentId}`, 
        JSON.stringify(registration),
        'EX', 
        24 * 60 * 60 // 24 hours TTL
      );
    }
  }

  /**
   * Persist health status to Redis
   */
  private async persistHealthStatus(agentId: string): Promise<void> {
    const health = this.healthStatus.get(agentId);
    if (health) {
      await this.redis.set(
        `agent:health:${agentId}`, 
        JSON.stringify(health),
        'EX', 
        60 * 60 // 1 hour TTL
      );
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('error', (error) => {
      console.error('❌ Agent Registry Error:', error);
    });

    this.on('agentRegistered', (registration) => {
      console.log(`🤖 Agent registered: ${registration.name}`);
    });

    this.on('agentUnregistered', (registration) => {
      console.log(`❌ Agent unregistered: ${registration.name}`);
    });
  }

  /**
   * Shutdown the registry
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Agent Registry: Shutting down...');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }

    // Persist all data
    for (const agentId of this.registrations.keys()) {
      await this.persistRegistration(agentId);
    }

    for (const agentId of this.healthStatus.keys()) {
      await this.persistHealthStatus(agentId);
    }

    await this.redis.quit();
    
    this.emit('shutdown');
    console.log('✅ Agent Registry: Shutdown complete');
  }
}

export default AgentRegistry;