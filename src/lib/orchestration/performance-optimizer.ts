/**
 * Performance Analytics and Optimization System
 * 
 * Advanced analytics engine that monitors, analyzes, and optimizes
 * the performance of the 30+ agent orchestration system.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';

export interface PerformanceMetric {
  id: string;
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
  unit?: string;
  description?: string;
}

export interface PerformanceReport {
  id: string;
  period: {
    start: Date;
    end: Date;
    duration: number; // milliseconds
  };
  summary: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageExecutionTime: number;
    throughput: number; // tasks per second
    successRate: number;
    errorRate: number;
  };
  agents: {
    totalAgents: number;
    activeAgents: number;
    averageUtilization: number;
    topPerformers: AgentPerformance[];
    underPerformers: AgentPerformance[];
  };
  resources: {
    cpu: ResourceMetrics;
    memory: ResourceMetrics;
    network: ResourceMetrics;
    disk: ResourceMetrics;
  };
  bottlenecks: BottleneckAnalysis[];
  recommendations: OptimizationRecommendation[];
  trends: TrendAnalysis;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  type: string;
  metrics: {
    tasksCompleted: number;
    averageExecutionTime: number;
    successRate: number;
    errorRate: number;
    uptime: number;
    utilization: number;
  };
  score: number; // 0-100 performance score
  ranking: number;
}

export interface ResourceMetrics {
  current: number;
  average: number;
  peak: number;
  utilization: number; // percentage
  trend: 'increasing' | 'decreasing' | 'stable';
  efficiency: number; // 0-100 efficiency score
}

export interface BottleneckAnalysis {
  id: string;
  type: 'agent' | 'task' | 'resource' | 'communication' | 'queue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: {
    affectedAgents: number;
    delayedTasks: number;
    performanceImpact: number; // percentage
    estimatedCost: number; // in terms of lost productivity
  };
  rootCause: string;
  detectedAt: Date;
  duration: number; // milliseconds
}

export interface OptimizationRecommendation {
  id: string;
  type: 'scaling' | 'configuration' | 'resource' | 'workflow' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: {
    estimatedImprovement: number; // percentage
    affectedComponents: string[];
    implementationCost: 'low' | 'medium' | 'high';
    riskLevel: 'low' | 'medium' | 'high';
  };
  implementation: {
    steps: string[];
    estimatedTime: number; // minutes
    prerequisites: string[];
    rollbackPlan: string;
  };
  metrics: {
    baseline: Record<string, number>;
    expected: Record<string, number>;
    measurementPeriod: number; // days
  };
}

export interface TrendAnalysis {
  timeRange: string;
  trends: {
    throughput: TrendData;
    latency: TrendData;
    errorRate: TrendData;
    resourceUtilization: TrendData;
    agentPerformance: TrendData;
  };
  anomalies: AnomalyDetection[];
  seasonality: SeasonalityPattern[];
  predictions: PerformancePrediction[];
}

export interface TrendData {
  direction: 'up' | 'down' | 'stable';
  magnitude: number; // percentage change
  confidence: number; // 0-1
  dataPoints: { timestamp: Date; value: number }[];
  correlation: number; // -1 to 1
}

export interface AnomalyDetection {
  id: string;
  timestamp: Date;
  metric: string;
  actualValue: number;
  expectedValue: number;
  deviation: number; // standard deviations
  severity: 'low' | 'medium' | 'high';
  type: 'spike' | 'drop' | 'drift' | 'oscillation';
  context: Record<string, any>;
}

export interface SeasonalityPattern {
  metric: string;
  pattern: 'hourly' | 'daily' | 'weekly' | 'monthly';
  amplitude: number;
  phase: number;
  confidence: number;
}

export interface PerformancePrediction {
  metric: string;
  timeHorizon: number; // hours
  prediction: number;
  confidence: number; // 0-1
  upperBound: number;
  lowerBound: number;
  factors: string[];
}

export interface OptimizationRule {
  id: string;
  name: string;
  type: 'threshold' | 'pattern' | 'machine_learning';
  condition: string;
  action: OptimizationAction;
  enabled: boolean;
  priority: number;
  cooldown: number; // seconds
  lastTriggered?: Date;
}

export interface OptimizationAction {
  type: 'scale_up' | 'scale_down' | 'rebalance' | 'restart' | 'alert' | 'custom';
  parameters: Record<string, any>;
  confirmationRequired: boolean;
  rollbackAfter?: number; // seconds
}

/**
 * Metrics Collector
 */
class MetricsCollector {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Record a metric
   */
  record(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      id: uuidv4(),
      timestamp: new Date(),
    };

    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    const metricList = this.metrics.get(metric.name)!;
    metricList.push(fullMetric);

    // Keep only last 1000 metrics per type
    if (metricList.length > 1000) {
      metricList.splice(0, metricList.length - 1000);
    }

    // Persist to Redis
    this.persistMetric(fullMetric);
  }

  /**
   * Get metrics by name and time range
   */
  getMetrics(
    name: string,
    startTime?: Date,
    endTime?: Date,
    tags?: Record<string, string>
  ): PerformanceMetric[] {
    const metricList = this.metrics.get(name) || [];
    
    return metricList.filter(metric => {
      // Time range filter
      if (startTime && metric.timestamp < startTime) return false;
      if (endTime && metric.timestamp > endTime) return false;
      
      // Tags filter
      if (tags) {
        for (const [key, value] of Object.entries(tags)) {
          if (metric.tags[key] !== value) return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Get aggregated metrics
   */
  aggregate(
    name: string,
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count',
    startTime?: Date,
    endTime?: Date,
    tags?: Record<string, string>
  ): number {
    const metrics = this.getMetrics(name, startTime, endTime, tags);
    
    if (metrics.length === 0) return 0;
    
    const values = metrics.map(m => m.value);
    
    switch (aggregation) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      default:
        return 0;
    }
  }

  /**
   * Persist metric to Redis
   */
  private async persistMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const key = `metric:${metric.name}:${metric.timestamp.getTime()}`;
      await this.redis.setex(key, 86400, JSON.stringify(metric)); // 24 hours TTL
    } catch (error) {
      console.error('Failed to persist metric:', error);
    }
  }
}

/**
 * Performance Analyzer
 */
class PerformanceAnalyzer {
  private metricsCollector: MetricsCollector;

  constructor(metricsCollector: MetricsCollector) {
    this.metricsCollector = metricsCollector;
  }

  /**
   * Generate performance report
   */
  generateReport(startTime: Date, endTime: Date): PerformanceReport {
    const duration = endTime.getTime() - startTime.getTime();
    
    return {
      id: uuidv4(),
      period: { start: startTime, end: endTime, duration },
      summary: this.analyzeSummary(startTime, endTime),
      agents: this.analyzeAgents(startTime, endTime),
      resources: this.analyzeResources(startTime, endTime),
      bottlenecks: this.detectBottlenecks(startTime, endTime),
      recommendations: this.generateRecommendations(startTime, endTime),
      trends: this.analyzeTrends(startTime, endTime),
    };
  }

  /**
   * Analyze summary metrics
   */
  private analyzeSummary(startTime: Date, endTime: Date): PerformanceReport['summary'] {
    return {
      totalTasks: this.metricsCollector.aggregate('tasks.total', 'max', startTime, endTime),
      completedTasks: this.metricsCollector.aggregate('tasks.completed', 'sum', startTime, endTime),
      failedTasks: this.metricsCollector.aggregate('tasks.failed', 'sum', startTime, endTime),
      averageExecutionTime: this.metricsCollector.aggregate('task.execution_time', 'avg', startTime, endTime),
      throughput: this.metricsCollector.aggregate('system.throughput', 'avg', startTime, endTime),
      successRate: this.metricsCollector.aggregate('system.success_rate', 'avg', startTime, endTime),
      errorRate: this.metricsCollector.aggregate('system.error_rate', 'avg', startTime, endTime),
    };
  }

  /**
   * Analyze agent performance
   */
  private analyzeAgents(startTime: Date, endTime: Date): PerformanceReport['agents'] {
    // Simulate agent analysis
    const agentPerformances: AgentPerformance[] = Array.from({ length: 10 }, (_, i) => ({
      agentId: `agent-${i + 1}`,
      agentName: `Agent ${i + 1}`,
      type: ['content', 'analytics', 'monitoring'][i % 3],
      metrics: {
        tasksCompleted: Math.floor(Math.random() * 100) + 50,
        averageExecutionTime: Math.floor(Math.random() * 5000) + 1000,
        successRate: 90 + Math.random() * 10,
        errorRate: Math.random() * 5,
        uptime: 90 + Math.random() * 10,
        utilization: Math.random() * 100,
      },
      score: 70 + Math.random() * 30,
      ranking: i + 1,
    }));

    return {
      totalAgents: 32,
      activeAgents: 28,
      averageUtilization: 73.5,
      topPerformers: agentPerformances.slice(0, 5),
      underPerformers: agentPerformances.slice(-3),
    };
  }

  /**
   * Analyze resource usage
   */
  private analyzeResources(startTime: Date, endTime: Date): PerformanceReport['resources'] {
    return {
      cpu: {
        current: 67.2,
        average: 65.8,
        peak: 89.3,
        utilization: 67.2,
        trend: 'stable',
        efficiency: 87.5,
      },
      memory: {
        current: 54.8,
        average: 52.3,
        peak: 78.9,
        utilization: 54.8,
        trend: 'increasing',
        efficiency: 82.1,
      },
      network: {
        current: 23.4,
        average: 21.7,
        peak: 45.6,
        utilization: 23.4,
        trend: 'stable',
        efficiency: 91.3,
      },
      disk: {
        current: 12.8,
        average: 11.5,
        peak: 28.7,
        utilization: 12.8,
        trend: 'decreasing',
        efficiency: 88.9,
      },
    };
  }

  /**
   * Detect performance bottlenecks
   */
  private detectBottlenecks(startTime: Date, endTime: Date): BottleneckAnalysis[] {
    return [
      {
        id: 'bottleneck-1',
        type: 'agent',
        severity: 'medium',
        description: 'Agent agent-7 experiencing high CPU usage',
        impact: {
          affectedAgents: 1,
          delayedTasks: 12,
          performanceImpact: 8.5,
          estimatedCost: 150,
        },
        rootCause: 'Memory leak in content processing module',
        detectedAt: new Date(Date.now() - 300000),
        duration: 300000,
      },
      {
        id: 'bottleneck-2',
        type: 'queue',
        severity: 'low',
        description: 'Task queue backlog building up',
        impact: {
          affectedAgents: 0,
          delayedTasks: 8,
          performanceImpact: 3.2,
          estimatedCost: 50,
        },
        rootCause: 'Temporary spike in task submissions',
        detectedAt: new Date(Date.now() - 180000),
        duration: 180000,
      },
    ];
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(startTime: Date, endTime: Date): OptimizationRecommendation[] {
    return [
      {
        id: 'rec-1',
        type: 'scaling',
        priority: 'medium',
        title: 'Scale up content processing agents',
        description: 'Add 2 additional content processing agents to handle increased workload',
        impact: {
          estimatedImprovement: 15.3,
          affectedComponents: ['content-agents', 'task-queue'],
          implementationCost: 'low',
          riskLevel: 'low',
        },
        implementation: {
          steps: [
            'Create agent template for content processing',
            'Deploy 2 new agent instances',
            'Update load balancer configuration',
            'Monitor performance for 1 hour',
          ],
          estimatedTime: 30,
          prerequisites: ['Available compute resources'],
          rollbackPlan: 'Scale down additional agents if performance degrades',
        },
        metrics: {
          baseline: { throughput: 12.4, latency: 2847 },
          expected: { throughput: 14.3, latency: 2450 },
          measurementPeriod: 7,
        },
      },
      {
        id: 'rec-2',
        type: 'configuration',
        priority: 'high',
        title: 'Optimize task queue batch size',
        description: 'Increase task queue batch size from 10 to 15 for better throughput',
        impact: {
          estimatedImprovement: 8.7,
          affectedComponents: ['task-queue', 'all-agents'],
          implementationCost: 'low',
          riskLevel: 'medium',
        },
        implementation: {
          steps: [
            'Update task queue configuration',
            'Restart task queue service',
            'Monitor agent response times',
            'Adjust if necessary',
          ],
          estimatedTime: 15,
          prerequisites: ['Maintenance window'],
          rollbackPlan: 'Revert batch size to original value',
        },
        metrics: {
          baseline: { batchProcessingTime: 450, queueDepth: 15 },
          expected: { batchProcessingTime: 380, queueDepth: 10 },
          measurementPeriod: 3,
        },
      },
    ];
  }

  /**
   * Analyze trends and patterns
   */
  private analyzeTrends(startTime: Date, endTime: Date): TrendAnalysis {
    const now = new Date();
    const dataPoints = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000),
      value: 10 + Math.sin(i * 0.5) * 3 + Math.random() * 2,
    }));

    return {
      timeRange: `${startTime.toISOString()} to ${endTime.toISOString()}`,
      trends: {
        throughput: {
          direction: 'up',
          magnitude: 5.3,
          confidence: 0.87,
          dataPoints,
          correlation: 0.76,
        },
        latency: {
          direction: 'down',
          magnitude: 3.2,
          confidence: 0.91,
          dataPoints: dataPoints.map(dp => ({ ...dp, value: dp.value * 200 })),
          correlation: -0.82,
        },
        errorRate: {
          direction: 'stable',
          magnitude: 0.8,
          confidence: 0.95,
          dataPoints: dataPoints.map(dp => ({ ...dp, value: dp.value * 0.5 })),
          correlation: 0.12,
        },
        resourceUtilization: {
          direction: 'up',
          magnitude: 2.1,
          confidence: 0.78,
          dataPoints: dataPoints.map(dp => ({ ...dp, value: dp.value * 6 + 50 })),
          correlation: 0.65,
        },
        agentPerformance: {
          direction: 'up',
          magnitude: 4.7,
          confidence: 0.83,
          dataPoints: dataPoints.map(dp => ({ ...dp, value: dp.value * 8 + 70 })),
          correlation: 0.71,
        },
      },
      anomalies: [
        {
          id: 'anomaly-1',
          timestamp: new Date(Date.now() - 7200000),
          metric: 'response_time',
          actualValue: 8500,
          expectedValue: 2800,
          deviation: 3.2,
          severity: 'high',
          type: 'spike',
          context: { agentId: 'agent-15', taskType: 'data-processing' },
        },
      ],
      seasonality: [
        {
          metric: 'throughput',
          pattern: 'hourly',
          amplitude: 2.5,
          phase: 14.5,
          confidence: 0.89,
        },
      ],
      predictions: [
        {
          metric: 'throughput',
          timeHorizon: 24,
          prediction: 13.8,
          confidence: 0.82,
          upperBound: 15.1,
          lowerBound: 12.5,
          factors: ['historical_trends', 'seasonal_patterns', 'current_load'],
        },
      ],
    };
  }
}

/**
 * Auto Optimizer
 */
class AutoOptimizer extends EventEmitter {
  private rules: Map<string, OptimizationRule> = new Map();
  private analyzer: PerformanceAnalyzer;
  private optimizationInterval?: NodeJS.Timeout;

  constructor(analyzer: PerformanceAnalyzer) {
    super();
    this.analyzer = analyzer;
    this.initializeDefaultRules();
  }

  /**
   * Start auto optimization
   */
  start(): void {
    this.optimizationInterval = setInterval(() => {
      this.runOptimization();
    }, 60000); // Run every minute
    
    console.log('🤖 Auto Optimizer: Started');
  }

  /**
   * Stop auto optimization
   */
  stop(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = undefined;
    }
    
    console.log('🤖 Auto Optimizer: Stopped');
  }

  /**
   * Add optimization rule
   */
  addRule(rule: OptimizationRule): void {
    this.rules.set(rule.id, rule);
    console.log(`📋 Optimization rule added: ${rule.name}`);
  }

  /**
   * Remove optimization rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    console.log(`📋 Optimization rule removed: ${ruleId}`);
  }

  /**
   * Run optimization cycle
   */
  private async runOptimization(): Promise<void> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    
    try {
      // Generate current performance report
      const report = this.analyzer.generateReport(oneHourAgo, now);
      
      // Evaluate all rules
      for (const rule of this.rules.values()) {
        if (!rule.enabled) continue;
        
        // Check cooldown
        if (rule.lastTriggered && 
            (now.getTime() - rule.lastTriggered.getTime()) < rule.cooldown * 1000) {
          continue;
        }
        
        // Evaluate rule condition
        if (this.evaluateCondition(rule.condition, report)) {
          await this.executeAction(rule, report);
          rule.lastTriggered = now;
        }
      }
      
    } catch (error) {
      console.error('❌ Auto optimization error:', error);
      this.emit('error', error);
    }
  }

  /**
   * Initialize default optimization rules
   */
  private initializeDefaultRules(): void {
    // High CPU usage rule
    this.addRule({
      id: 'high-cpu-scale-up',
      name: 'Scale up on high CPU usage',
      type: 'threshold',
      condition: 'resources.cpu.utilization > 85',
      action: {
        type: 'scale_up',
        parameters: { increment: 2, maxInstances: 50 },
        confirmationRequired: false,
      },
      enabled: true,
      priority: 1,
      cooldown: 300, // 5 minutes
    });

    // Low utilization rule
    this.addRule({
      id: 'low-utilization-scale-down',
      name: 'Scale down on low utilization',
      type: 'threshold',
      condition: 'agents.averageUtilization < 30 AND agents.totalAgents > 10',
      action: {
        type: 'scale_down',
        parameters: { decrement: 1, minInstances: 10 },
        confirmationRequired: true,
      },
      enabled: true,
      priority: 2,
      cooldown: 600, // 10 minutes
    });

    // High error rate rule
    this.addRule({
      id: 'high-error-rate-alert',
      name: 'Alert on high error rate',
      type: 'threshold',
      condition: 'summary.errorRate > 10',
      action: {
        type: 'alert',
        parameters: { severity: 'high', channels: ['email', 'slack'] },
        confirmationRequired: false,
      },
      enabled: true,
      priority: 1,
      cooldown: 300,
    });

    // Queue backlog rule
    this.addRule({
      id: 'queue-backlog-rebalance',
      name: 'Rebalance on queue backlog',
      type: 'threshold',
      condition: 'summary.throughput < 8 AND bottlenecks.length > 0',
      action: {
        type: 'rebalance',
        parameters: { strategy: 'load_based' },
        confirmationRequired: false,
      },
      enabled: true,
      priority: 2,
      cooldown: 180, // 3 minutes
    });
  }

  /**
   * Evaluate rule condition
   */
  private evaluateCondition(condition: string, report: PerformanceReport): boolean {
    try {
      // Simple condition evaluation (in production, use a proper expression parser)
      const context = {
        resources: report.resources,
        agents: report.agents,
        summary: report.summary,
        bottlenecks: report.bottlenecks,
      };

      // Replace condition variables with actual values
      let evaluableCondition = condition;
      
      // Handle dot notation (e.g., resources.cpu.utilization)
      evaluableCondition = evaluableCondition.replace(
        /(\w+)\.(\w+)\.(\w+)/g,
        (match, obj, prop, subprop) => {
          const value = (context as any)[obj]?.[prop]?.[subprop];
          return value !== undefined ? value.toString() : '0';
        }
      );
      
      // Handle two-level dot notation (e.g., agents.averageUtilization)
      evaluableCondition = evaluableCondition.replace(
        /(\w+)\.(\w+)/g,
        (match, obj, prop) => {
          const value = (context as any)[obj]?.[prop];
          return value !== undefined ? value.toString() : '0';
        }
      );
      
      // Handle array length (e.g., bottlenecks.length)
      evaluableCondition = evaluableCondition.replace(
        /(\w+)\.length/g,
        (match, obj) => {
          const arr = (context as any)[obj];
          return Array.isArray(arr) ? arr.length.toString() : '0';
        }
      );

      // Replace AND/OR with JavaScript operators
      evaluableCondition = evaluableCondition
        .replace(/\bAND\b/g, '&&')
        .replace(/\bOR\b/g, '||');

      // Evaluate the condition
      return Function(`"use strict"; return (${evaluableCondition})`)();
      
    } catch (error) {
      console.error(`❌ Failed to evaluate condition: ${condition}`, error);
      return false;
    }
  }

  /**
   * Execute optimization action
   */
  private async executeAction(rule: OptimizationRule, report: PerformanceReport): Promise<void> {
    console.log(`🎯 Executing optimization action: ${rule.name}`);
    
    const action = rule.action;
    
    switch (action.type) {
      case 'scale_up':
        await this.scaleUp(action.parameters);
        break;
      case 'scale_down':
        await this.scaleDown(action.parameters);
        break;
      case 'rebalance':
        await this.rebalance(action.parameters);
        break;
      case 'restart':
        await this.restart(action.parameters);
        break;
      case 'alert':
        await this.sendAlert(action.parameters, rule.name);
        break;
      case 'custom':
        await this.executeCustomAction(action.parameters);
        break;
    }
    
    this.emit('actionExecuted', { rule, action, report });
  }

  /**
   * Scale up agents
   */
  private async scaleUp(parameters: any): Promise<void> {
    const { increment, maxInstances } = parameters;
    console.log(`📈 Scaling up by ${increment} instances (max: ${maxInstances})`);
    // Implementation would trigger actual scaling
  }

  /**
   * Scale down agents
   */
  private async scaleDown(parameters: any): Promise<void> {
    const { decrement, minInstances } = parameters;
    console.log(`📉 Scaling down by ${decrement} instances (min: ${minInstances})`);
    // Implementation would trigger actual scaling
  }

  /**
   * Rebalance workload
   */
  private async rebalance(parameters: any): Promise<void> {
    const { strategy } = parameters;
    console.log(`⚖️ Rebalancing workload using strategy: ${strategy}`);
    // Implementation would trigger workload rebalancing
  }

  /**
   * Restart components
   */
  private async restart(parameters: any): Promise<void> {
    const { component } = parameters;
    console.log(`🔄 Restarting component: ${component}`);
    // Implementation would restart the specified component
  }

  /**
   * Send alert
   */
  private async sendAlert(parameters: any, ruleName: string): Promise<void> {
    const { severity, channels } = parameters;
    console.log(`🚨 Sending ${severity} alert via ${channels.join(', ')}: ${ruleName}`);
    // Implementation would send actual alerts
  }

  /**
   * Execute custom action
   */
  private async executeCustomAction(parameters: any): Promise<void> {
    console.log('🔧 Executing custom action:', parameters);
    // Implementation would execute custom logic
  }
}

/**
 * Performance Optimizer - Main Class
 */
export class PerformanceOptimizer extends EventEmitter {
  private redis: Redis;
  private metricsCollector: MetricsCollector;
  private analyzer: PerformanceAnalyzer;
  private autoOptimizer: AutoOptimizer;
  private isRunning: boolean = false;

  constructor(redisUrl: string) {
    super();
    this.redis = new Redis(redisUrl);
    this.metricsCollector = new MetricsCollector(this.redis);
    this.analyzer = new PerformanceAnalyzer(this.metricsCollector);
    this.autoOptimizer = new AutoOptimizer(this.analyzer);
    this.setupEventHandlers();
  }

  /**
   * Initialize the performance optimizer
   */
  async initialize(): Promise<void> {
    try {
      await this.redis.ping();
      console.log('✅ Performance Optimizer: Redis connection established');

      this.isRunning = true;
      this.emit('initialized');
      
      console.log('🚀 Performance Optimizer: System initialized');
    } catch (error) {
      console.error('❌ Performance Optimizer: Initialization failed', error);
      throw error;
    }
  }

  /**
   * Start performance optimization
   */
  startOptimization(): void {
    this.autoOptimizer.start();
    this.emit('optimizationStarted');
  }

  /**
   * Stop performance optimization
   */
  stopOptimization(): void {
    this.autoOptimizer.stop();
    this.emit('optimizationStopped');
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    this.metricsCollector.record(metric);
  }

  /**
   * Generate performance report
   */
  generateReport(startTime?: Date, endTime?: Date): PerformanceReport {
    const end = endTime || new Date();
    const start = startTime || new Date(end.getTime() - 3600000); // Default to 1 hour ago
    
    return this.analyzer.generateReport(start, end);
  }

  /**
   * Get metrics
   */
  getMetrics(
    name: string,
    startTime?: Date,
    endTime?: Date,
    tags?: Record<string, string>
  ): PerformanceMetric[] {
    return this.metricsCollector.getMetrics(name, startTime, endTime, tags);
  }

  /**
   * Add optimization rule
   */
  addOptimizationRule(rule: OptimizationRule): void {
    this.autoOptimizer.addRule(rule);
  }

  /**
   * Remove optimization rule
   */
  removeOptimizationRule(ruleId: string): void {
    this.autoOptimizer.removeRule(ruleId);
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.autoOptimizer.on('actionExecuted', (event) => {
      console.log(`✅ Optimization action executed: ${event.rule.name}`);
      this.emit('actionExecuted', event);
    });

    this.autoOptimizer.on('error', (error) => {
      console.error('❌ Auto optimizer error:', error);
      this.emit('error', error);
    });

    this.on('error', (error) => {
      console.error('❌ Performance Optimizer Error:', error);
    });
  }

  /**
   * Shutdown the performance optimizer
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Performance Optimizer: Shutting down...');
    
    this.isRunning = false;
    this.autoOptimizer.stop();
    
    await this.redis.quit();
    
    this.emit('shutdown');
    console.log('✅ Performance Optimizer: Shutdown complete');
  }
}

export default PerformanceOptimizer;