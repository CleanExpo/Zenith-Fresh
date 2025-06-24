/**
 * Agent Lifecycle Management System
 * 
 * Comprehensive lifecycle management for agents including deployment,
 * scaling, health monitoring, updates, and graceful shutdown.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import { Agent } from './master-conductor';

export interface AgentTemplate {
  id: string;
  name: string;
  type: string;
  version: string;
  image: string; // Docker image or deployment artifact
  config: AgentConfig;
  resources: ResourceRequirements;
  scaling: ScalingPolicy;
  healthCheck: HealthCheckConfig;
  updatePolicy: UpdatePolicy;
  metadata: {
    description: string;
    tags: string[];
    author: string;
    created: Date;
    updated: Date;
  };
}

export interface AgentConfig {
  environment: Record<string, string>;
  secrets: string[];
  volumes: VolumeMount[];
  ports: PortMapping[];
  networkMode: 'bridge' | 'host' | 'none';
  restartPolicy: 'always' | 'on-failure' | 'no';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface ResourceRequirements {
  cpu: {
    min: number;
    max: number;
    request: number;
  };
  memory: {
    min: number; // MB
    max: number; // MB
    request: number; // MB
  };
  disk: {
    size: number; // GB
    type: 'ssd' | 'hdd';
  };
  network: {
    bandwidth: number; // Mbps
  };
}

export interface VolumeMount {
  name: string;
  mountPath: string;
  readOnly: boolean;
  type: 'persistent' | 'temporary' | 'config';
}

export interface PortMapping {
  containerPort: number;
  hostPort?: number;
  protocol: 'tcp' | 'udp';
  name: string;
}

export interface ScalingPolicy {
  minReplicas: number;
  maxReplicas: number;
  targetCpuUtilization: number;
  targetMemoryUtilization: number;
  scaleUpCooldown: number; // seconds
  scaleDownCooldown: number; // seconds
  customMetrics?: CustomMetric[];
}

export interface CustomMetric {
  name: string;
  targetValue: number;
  query: string; // Prometheus query or similar
}

export interface HealthCheckConfig {
  enabled: boolean;
  httpGet?: {
    path: string;
    port: number;
    scheme: 'http' | 'https';
    headers?: Record<string, string>;
  };
  tcpSocket?: {
    port: number;
  };
  exec?: {
    command: string[];
  };
  initialDelaySeconds: number;
  periodSeconds: number;
  timeoutSeconds: number;
  successThreshold: number;
  failureThreshold: number;
}

export interface UpdatePolicy {
  strategy: 'rolling' | 'recreate' | 'blue-green' | 'canary';
  maxUnavailable: number | string; // number or percentage
  maxSurge: number | string; // number or percentage
  rollbackOnFailure: boolean;
  progressDeadlineSeconds: number;
  canaryConfig?: {
    steps: CanaryStep[];
  };
}

export interface CanaryStep {
  weight: number; // percentage of traffic
  pause?: {
    duration: number; // seconds
    reason: string;
  };
  analysis?: {
    templates: string[];
    args: Record<string, any>;
  };
}

export interface AgentInstance {
  id: string;
  templateId: string;
  name: string;
  status: 'pending' | 'running' | 'stopping' | 'stopped' | 'failed' | 'updating';
  version: string;
  deploymentId: string;
  node: string;
  ip: string;
  ports: { [key: string]: number };
  resources: {
    allocated: ResourceRequirements;
    used: {
      cpu: number;
      memory: number;
      disk: number;
      network: number;
    };
  };
  health: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastCheck: Date;
    checks: HealthCheckResult[];
  };
  metrics: {
    uptime: number;
    restarts: number;
    lastRestart?: Date;
    performance: {
      requestsPerSecond: number;
      averageResponseTime: number;
      errorRate: number;
    };
  };
  lifecycle: {
    created: Date;
    started?: Date;
    stopped?: Date;
    lastUpdate?: Date;
  };
}

export interface HealthCheckResult {
  timestamp: Date;
  type: 'http' | 'tcp' | 'exec';
  status: 'success' | 'failure' | 'timeout';
  message?: string;
  responseTime?: number;
}

export interface DeploymentSpec {
  templateId: string;
  replicas: number;
  environment?: Record<string, string>;
  overrides?: Partial<AgentConfig>;
  placement?: {
    constraints: string[];
    preferences: string[];
  };
}

export interface ScalingEvent {
  timestamp: Date;
  type: 'scale-up' | 'scale-down';
  reason: string;
  previousReplicas: number;
  newReplicas: number;
  metrics?: Record<string, number>;
}

/**
 * Agent Deployment Manager
 */
class DeploymentManager extends EventEmitter {
  private deployments: Map<string, AgentInstance[]> = new Map();
  private redis: Redis;

  constructor(redis: Redis) {
    super();
    this.redis = redis;
  }

  /**
   * Deploy agent instances
   */
  async deploy(spec: DeploymentSpec): Promise<string> {
    const deploymentId = uuidv4();
    const instances: AgentInstance[] = [];

    console.log(`🚀 Deploying ${spec.replicas} instances of template ${spec.templateId}`);

    for (let i = 0; i < spec.replicas; i++) {
      const instance = await this.createInstance(spec, deploymentId, i);
      instances.push(instance);
    }

    this.deployments.set(deploymentId, instances);
    await this.persistDeployment(deploymentId);

    this.emit('deploymentCreated', { deploymentId, instances });
    return deploymentId;
  }

  /**
   * Scale deployment
   */
  async scale(deploymentId: string, replicas: number): Promise<void> {
    const instances = this.deployments.get(deploymentId);
    if (!instances) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    const currentReplicas = instances.length;
    console.log(`📏 Scaling deployment ${deploymentId} from ${currentReplicas} to ${replicas} replicas`);

    if (replicas > currentReplicas) {
      // Scale up
      const newInstances = replicas - currentReplicas;
      for (let i = 0; i < newInstances; i++) {
        const instance = await this.createInstance(
          { templateId: instances[0].templateId, replicas },
          deploymentId,
          currentReplicas + i
        );
        instances.push(instance);
      }
    } else if (replicas < currentReplicas) {
      // Scale down
      const instancesToRemove = currentReplicas - replicas;
      const removedInstances = instances.splice(-instancesToRemove);
      
      for (const instance of removedInstances) {
        await this.stopInstance(instance);
      }
    }

    await this.persistDeployment(deploymentId);
    this.emit('deploymentScaled', { deploymentId, previousReplicas: currentReplicas, newReplicas: replicas });
  }

  /**
   * Update deployment
   */
  async update(deploymentId: string, template: AgentTemplate): Promise<void> {
    const instances = this.deployments.get(deploymentId);
    if (!instances) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    console.log(`🔄 Updating deployment ${deploymentId} to version ${template.version}`);

    switch (template.updatePolicy.strategy) {
      case 'rolling':
        await this.rollingUpdate(instances, template);
        break;
      case 'recreate':
        await this.recreateUpdate(instances, template);
        break;
      case 'blue-green':
        await this.blueGreenUpdate(instances, template);
        break;
      case 'canary':
        await this.canaryUpdate(instances, template);
        break;
    }

    await this.persistDeployment(deploymentId);
    this.emit('deploymentUpdated', { deploymentId, template });
  }

  /**
   * Remove deployment
   */
  async remove(deploymentId: string): Promise<void> {
    const instances = this.deployments.get(deploymentId);
    if (!instances) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    console.log(`🗑️ Removing deployment ${deploymentId}`);

    for (const instance of instances) {
      await this.stopInstance(instance);
    }

    this.deployments.delete(deploymentId);
    await this.redis.del(`deployment:${deploymentId}`);

    this.emit('deploymentRemoved', { deploymentId });
  }

  /**
   * Get deployment instances
   */
  getInstances(deploymentId: string): AgentInstance[] {
    return this.deployments.get(deploymentId) || [];
  }

  /**
   * Create a new agent instance
   */
  private async createInstance(
    spec: DeploymentSpec,
    deploymentId: string,
    index: number
  ): Promise<AgentInstance> {
    const instanceId = uuidv4();
    const instance: AgentInstance = {
      id: instanceId,
      templateId: spec.templateId,
      name: `${spec.templateId}-${deploymentId.substring(0, 8)}-${index}`,
      status: 'pending',
      version: '1.0.0', // Would come from template
      deploymentId,
      node: this.selectNode(),
      ip: this.allocateIP(),
      ports: {},
      resources: {
        allocated: {
          cpu: { min: 0.5, max: 2, request: 1 },
          memory: { min: 512, max: 2048, request: 1024 },
          disk: { size: 10, type: 'ssd' },
          network: { bandwidth: 100 },
        },
        used: { cpu: 0, memory: 0, disk: 0, network: 0 },
      },
      health: {
        status: 'unknown',
        lastCheck: new Date(),
        checks: [],
      },
      metrics: {
        uptime: 0,
        restarts: 0,
        performance: {
          requestsPerSecond: 0,
          averageResponseTime: 0,
          errorRate: 0,
        },
      },
      lifecycle: {
        created: new Date(),
      },
    };

    // Simulate instance startup
    setTimeout(() => {
      instance.status = 'running';
      instance.lifecycle.started = new Date();
      this.emit('instanceStarted', instance);
    }, 2000);

    return instance;
  }

  /**
   * Stop an agent instance
   */
  private async stopInstance(instance: AgentInstance): Promise<void> {
    console.log(`🛑 Stopping instance ${instance.name}`);
    
    instance.status = 'stopping';
    
    // Simulate graceful shutdown
    setTimeout(() => {
      instance.status = 'stopped';
      instance.lifecycle.stopped = new Date();
      this.emit('instanceStopped', instance);
    }, 1000);
  }

  /**
   * Rolling update strategy
   */
  private async rollingUpdate(instances: AgentInstance[], template: AgentTemplate): Promise<void> {
    const maxUnavailable = typeof template.updatePolicy.maxUnavailable === 'string' ? 
      Math.ceil(instances.length * parseInt(template.updatePolicy.maxUnavailable) / 100) :
      template.updatePolicy.maxUnavailable;

    for (let i = 0; i < instances.length; i += maxUnavailable) {
      const batch = instances.slice(i, i + maxUnavailable);
      
      for (const instance of batch) {
        await this.updateInstance(instance, template);
      }
      
      // Wait for batch to be ready before continuing
      await this.waitForInstancesReady(batch);
    }
  }

  /**
   * Recreate update strategy
   */
  private async recreateUpdate(instances: AgentInstance[], template: AgentTemplate): Promise<void> {
    // Stop all instances first
    for (const instance of instances) {
      await this.stopInstance(instance);
    }

    // Wait for all to stop
    await this.waitForInstancesStatus(instances, 'stopped');

    // Start all instances with new version
    for (const instance of instances) {
      await this.updateInstance(instance, template);
    }
  }

  /**
   * Blue-green update strategy
   */
  private async blueGreenUpdate(instances: AgentInstance[], template: AgentTemplate): Promise<void> {
    // Create green environment
    const greenInstances: AgentInstance[] = [];
    
    for (let i = 0; i < instances.length; i++) {
      const greenInstance = await this.createInstance(
        { templateId: template.id, replicas: instances.length },
        instances[i].deploymentId,
        i + 1000 // Offset to avoid conflicts
      );
      greenInstances.push(greenInstance);
    }

    // Wait for green environment to be ready
    await this.waitForInstancesReady(greenInstances);

    // Switch traffic to green
    console.log('🔄 Switching traffic to green environment');

    // Stop blue environment
    for (const instance of instances) {
      await this.stopInstance(instance);
    }

    // Replace blue with green
    instances.splice(0, instances.length, ...greenInstances);
  }

  /**
   * Canary update strategy
   */
  private async canaryUpdate(instances: AgentInstance[], template: AgentTemplate): Promise<void> {
    if (!template.updatePolicy.canaryConfig) {
      throw new Error('Canary configuration not provided');
    }

    const canarySteps = template.updatePolicy.canaryConfig.steps;
    let canaryInstances: AgentInstance[] = [];

    for (const step of canarySteps) {
      const canaryCount = Math.ceil(instances.length * step.weight / 100);
      
      // Create canary instances if needed
      while (canaryInstances.length < canaryCount) {
        const canaryInstance = await this.createInstance(
          { templateId: template.id, replicas: 1 },
          instances[0].deploymentId,
          2000 + canaryInstances.length
        );
        canaryInstances.push(canaryInstance);
      }

      console.log(`🐤 Canary step: ${step.weight}% traffic (${canaryCount} instances)`);

      // Wait for pause if specified
      if (step.pause) {
        console.log(`⏸️ Pausing for ${step.pause.duration}s: ${step.pause.reason}`);
        await new Promise(resolve => setTimeout(resolve, step.pause!.duration * 1000));
      }

      // Run analysis if specified
      if (step.analysis) {
        const analysisResult = await this.runCanaryAnalysis(step.analysis, canaryInstances);
        if (!analysisResult.success) {
          console.log('❌ Canary analysis failed, rolling back');
          await this.rollbackCanary(canaryInstances);
          throw new Error(`Canary analysis failed: ${analysisResult.reason}`);
        }
      }
    }

    // Promote canary to full deployment
    console.log('✅ Canary deployment successful, promoting to full deployment');
    await this.promoteCanary(instances, canaryInstances, template);
  }

  /**
   * Update a single instance
   */
  private async updateInstance(instance: AgentInstance, template: AgentTemplate): Promise<void> {
    console.log(`🔄 Updating instance ${instance.name} to version ${template.version}`);
    
    instance.status = 'updating';
    instance.version = template.version;
    instance.lifecycle.lastUpdate = new Date();
    
    // Simulate update process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    instance.status = 'running';
    console.log(`✅ Instance ${instance.name} updated successfully`);
  }

  /**
   * Wait for instances to be ready
   */
  private async waitForInstancesReady(instances: AgentInstance[]): Promise<void> {
    const timeout = 300000; // 5 minutes
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const readyInstances = instances.filter(i => i.status === 'running' && i.health.status === 'healthy');
      
      if (readyInstances.length === instances.length) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Timeout waiting for instances to be ready');
  }

  /**
   * Wait for instances to reach specific status
   */
  private async waitForInstancesStatus(instances: AgentInstance[], status: AgentInstance['status']): Promise<void> {
    const timeout = 60000; // 1 minute
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const matchingInstances = instances.filter(i => i.status === status);
      
      if (matchingInstances.length === instances.length) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Timeout waiting for instances to reach status: ${status}`);
  }

  /**
   * Run canary analysis
   */
  private async runCanaryAnalysis(
    analysis: { templates: string[]; args: Record<string, any> },
    canaryInstances: AgentInstance[]
  ): Promise<{ success: boolean; reason?: string }> {
    // Simulate analysis (would integrate with monitoring systems)
    console.log('📊 Running canary analysis...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Simulate analysis results
    const errorRate = Math.random() * 0.1; // 0-10% error rate
    const responseTime = Math.random() * 1000 + 100; // 100-1100ms
    
    if (errorRate > 0.05) {
      return { success: false, reason: `High error rate: ${(errorRate * 100).toFixed(2)}%` };
    }
    
    if (responseTime > 800) {
      return { success: false, reason: `High response time: ${responseTime.toFixed(0)}ms` };
    }
    
    return { success: true };
  }

  /**
   * Rollback canary deployment
   */
  private async rollbackCanary(canaryInstances: AgentInstance[]): Promise<void> {
    console.log('🔄 Rolling back canary deployment');
    
    for (const instance of canaryInstances) {
      await this.stopInstance(instance);
    }
  }

  /**
   * Promote canary to full deployment
   */
  private async promoteCanary(
    originalInstances: AgentInstance[],
    canaryInstances: AgentInstance[],
    template: AgentTemplate
  ): Promise<void> {
    // Update remaining original instances
    for (const instance of originalInstances) {
      if (instance.version !== template.version) {
        await this.updateInstance(instance, template);
      }
    }
    
    // Clean up extra canary instances
    if (canaryInstances.length > originalInstances.length) {
      const excessInstances = canaryInstances.slice(originalInstances.length);
      for (const instance of excessInstances) {
        await this.stopInstance(instance);
      }
    }
  }

  /**
   * Select node for deployment (simplified)
   */
  private selectNode(): string {
    const nodes = ['node-1', 'node-2', 'node-3'];
    return nodes[Math.floor(Math.random() * nodes.length)];
  }

  /**
   * Allocate IP address (simplified)
   */
  private allocateIP(): string {
    return `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  /**
   * Persist deployment state
   */
  private async persistDeployment(deploymentId: string): Promise<void> {
    const instances = this.deployments.get(deploymentId);
    if (instances) {
      await this.redis.set(`deployment:${deploymentId}`, JSON.stringify(instances));
    }
  }
}

/**
 * Health Monitor
 */
class HealthMonitor extends EventEmitter {
  private instances: Map<string, AgentInstance> = new Map();
  private monitoringInterval?: NodeJS.Timeout;

  /**
   * Start monitoring
   */
  startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 30000); // Check every 30 seconds
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
   * Add instance to monitoring
   */
  addInstance(instance: AgentInstance): void {
    this.instances.set(instance.id, instance);
  }

  /**
   * Remove instance from monitoring
   */
  removeInstance(instanceId: string): void {
    this.instances.delete(instanceId);
  }

  /**
   * Perform health checks on all instances
   */
  private async performHealthChecks(): Promise<void> {
    const checkPromises = Array.from(this.instances.values()).map(instance => 
      this.checkInstanceHealth(instance)
    );

    await Promise.allSettled(checkPromises);
  }

  /**
   * Check health of a single instance
   */
  private async checkInstanceHealth(instance: AgentInstance): Promise<void> {
    try {
      // Simulate health check (would make actual HTTP/TCP requests)
      const isHealthy = Math.random() > 0.1; // 90% chance of being healthy
      const responseTime = Math.random() * 1000 + 50;

      const result: HealthCheckResult = {
        timestamp: new Date(),
        type: 'http',
        status: isHealthy ? 'success' : 'failure',
        responseTime,
        message: isHealthy ? 'OK' : 'Service unavailable',
      };

      instance.health.checks.push(result);
      instance.health.checks = instance.health.checks.slice(-10); // Keep last 10 checks
      instance.health.lastCheck = new Date();

      // Determine overall health status
      const recentChecks = instance.health.checks.slice(-3);
      const successfulChecks = recentChecks.filter(c => c.status === 'success').length;
      
      if (successfulChecks >= 2) {
        instance.health.status = 'healthy';
      } else {
        instance.health.status = 'unhealthy';
        this.emit('instanceUnhealthy', instance);
      }

    } catch (error) {
      instance.health.status = 'unknown';
      console.error(`❌ Health check failed for instance ${instance.name}:`, error);
    }
  }
}

/**
 * Auto Scaler
 */
class AutoScaler extends EventEmitter {
  private deploymentManager: DeploymentManager;
  private scalingEvents: Map<string, ScalingEvent[]> = new Map();
  private scalingInterval?: NodeJS.Timeout;

  constructor(deploymentManager: DeploymentManager) {
    super();
    this.deploymentManager = deploymentManager;
  }

  /**
   * Start auto scaling
   */
  startAutoScaling(): void {
    this.scalingInterval = setInterval(async () => {
      await this.evaluateScaling();
    }, 60000); // Evaluate every minute
  }

  /**
   * Stop auto scaling
   */
  stopAutoScaling(): void {
    if (this.scalingInterval) {
      clearInterval(this.scalingInterval);
    }
  }

  /**
   * Evaluate scaling decisions
   */
  private async evaluateScaling(): Promise<void> {
    // This would evaluate actual metrics and make scaling decisions
    // For now, simulate scaling events
    console.log('📊 Evaluating auto scaling...');
  }

  /**
   * Record scaling event
   */
  recordScalingEvent(deploymentId: string, event: ScalingEvent): void {
    if (!this.scalingEvents.has(deploymentId)) {
      this.scalingEvents.set(deploymentId, []);
    }
    
    const events = this.scalingEvents.get(deploymentId)!;
    events.push(event);
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
  }

  /**
   * Get scaling history
   */
  getScalingHistory(deploymentId: string): ScalingEvent[] {
    return this.scalingEvents.get(deploymentId) || [];
  }
}

/**
 * Agent Lifecycle Manager
 */
export class AgentLifecycleManager extends EventEmitter {
  private redis: Redis;
  private templates: Map<string, AgentTemplate> = new Map();
  private deploymentManager: DeploymentManager;
  private healthMonitor: HealthMonitor;
  private autoScaler: AutoScaler;
  private isRunning: boolean = false;

  constructor(redisUrl: string) {
    super();
    this.redis = new Redis(redisUrl);
    this.deploymentManager = new DeploymentManager(this.redis);
    this.healthMonitor = new HealthMonitor();
    this.autoScaler = new AutoScaler(this.deploymentManager);
    this.setupEventHandlers();
  }

  /**
   * Initialize the lifecycle manager
   */
  async initialize(): Promise<void> {
    try {
      await this.redis.ping();
      console.log('✅ Agent Lifecycle Manager: Redis connection established');

      // Load existing templates and deployments
      await this.loadState();

      // Start monitoring and auto scaling
      this.healthMonitor.startMonitoring();
      this.autoScaler.startAutoScaling();

      this.isRunning = true;
      this.emit('initialized');
      
      console.log('🚀 Agent Lifecycle Manager: System initialized');
    } catch (error) {
      console.error('❌ Agent Lifecycle Manager: Initialization failed', error);
      throw error;
    }
  }

  /**
   * Register agent template
   */
  async registerTemplate(templateData: Omit<AgentTemplate, 'id' | 'metadata'>): Promise<string> {
    const templateId = uuidv4();
    const template: AgentTemplate = {
      ...templateData,
      id: templateId,
      metadata: {
        ...templateData.metadata,
        created: new Date(),
        updated: new Date(),
      },
    };

    this.templates.set(templateId, template);
    await this.persistTemplate(template);

    this.emit('templateRegistered', template);
    console.log(`📝 Agent template registered: ${template.name} (${templateId})`);

    return templateId;
  }

  /**
   * Update agent template
   */
  async updateTemplate(templateId: string, updates: Partial<AgentTemplate>): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const updatedTemplate: AgentTemplate = {
      ...template,
      ...updates,
      id: templateId,
      metadata: {
        ...template.metadata,
        ...updates.metadata,
        updated: new Date(),
      },
    };

    this.templates.set(templateId, updatedTemplate);
    await this.persistTemplate(updatedTemplate);

    this.emit('templateUpdated', updatedTemplate);
    console.log(`🔄 Agent template updated: ${updatedTemplate.name} (${templateId})`);
  }

  /**
   * Deploy agents
   */
  async deploy(spec: DeploymentSpec): Promise<string> {
    const template = this.templates.get(spec.templateId);
    if (!template) {
      throw new Error(`Template ${spec.templateId} not found`);
    }

    const deploymentId = await this.deploymentManager.deploy(spec);
    
    // Add instances to health monitoring
    const instances = this.deploymentManager.getInstances(deploymentId);
    for (const instance of instances) {
      this.healthMonitor.addInstance(instance);
    }

    return deploymentId;
  }

  /**
   * Scale deployment
   */
  async scale(deploymentId: string, replicas: number): Promise<void> {
    const instances = this.deploymentManager.getInstances(deploymentId);
    const previousReplicas = instances.length;

    await this.deploymentManager.scale(deploymentId, replicas);

    // Record scaling event
    const scalingEvent: ScalingEvent = {
      timestamp: new Date(),
      type: replicas > previousReplicas ? 'scale-up' : 'scale-down',
      reason: 'Manual scaling',
      previousReplicas,
      newReplicas: replicas,
    };

    this.autoScaler.recordScalingEvent(deploymentId, scalingEvent);
  }

  /**
   * Update deployment
   */
  async updateDeployment(deploymentId: string, templateId: string): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    await this.deploymentManager.update(deploymentId, template);
  }

  /**
   * Remove deployment
   */
  async removeDeployment(deploymentId: string): Promise<void> {
    // Remove instances from health monitoring
    const instances = this.deploymentManager.getInstances(deploymentId);
    for (const instance of instances) {
      this.healthMonitor.removeInstance(instance.id);
    }

    await this.deploymentManager.remove(deploymentId);
  }

  /**
   * Get deployment status
   */
  getDeploymentStatus(deploymentId: string): AgentInstance[] {
    return this.deploymentManager.getInstances(deploymentId);
  }

  /**
   * Get all templates
   */
  getTemplates(): AgentTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): AgentTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get scaling history
   */
  getScalingHistory(deploymentId: string): ScalingEvent[] {
    return this.autoScaler.getScalingHistory(deploymentId);
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.deploymentManager.on('instanceStarted', (instance: AgentInstance) => {
      console.log(`🚀 Instance started: ${instance.name}`);
      this.emit('instanceStarted', instance);
    });

    this.deploymentManager.on('instanceStopped', (instance: AgentInstance) => {
      console.log(`🛑 Instance stopped: ${instance.name}`);
      this.emit('instanceStopped', instance);
    });

    this.healthMonitor.on('instanceUnhealthy', (instance: AgentInstance) => {
      console.warn(`⚠️ Instance unhealthy: ${instance.name}`);
      this.emit('instanceUnhealthy', instance);
    });

    this.on('error', (error) => {
      console.error('❌ Agent Lifecycle Manager Error:', error);
    });
  }

  /**
   * Load state from Redis
   */
  private async loadState(): Promise<void> {
    try {
      // Load templates
      const templateKeys = await this.redis.keys('template:*');
      for (const key of templateKeys) {
        const templateData = await this.redis.get(key);
        if (templateData) {
          const template = JSON.parse(templateData);
          this.templates.set(template.id, template);
        }
      }

      console.log(`📊 Lifecycle state loaded: ${this.templates.size} templates`);
    } catch (error) {
      console.error('❌ Failed to load lifecycle state:', error);
    }
  }

  /**
   * Persist template to Redis
   */
  private async persistTemplate(template: AgentTemplate): Promise<void> {
    await this.redis.set(`template:${template.id}`, JSON.stringify(template));
  }

  /**
   * Shutdown the lifecycle manager
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Agent Lifecycle Manager: Shutting down...');
    
    this.isRunning = false;

    // Stop monitoring and auto scaling
    this.healthMonitor.stopMonitoring();
    this.autoScaler.stopAutoScaling();

    // Persist all templates
    for (const template of this.templates.values()) {
      await this.persistTemplate(template);
    }

    await this.redis.quit();
    
    this.emit('shutdown');
    console.log('✅ Agent Lifecycle Manager: Shutdown complete');
  }
}

export default AgentLifecycleManager;