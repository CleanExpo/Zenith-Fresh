import { Redis } from 'ioredis';
import { APMMonitor } from '../monitoring/apm-monitor';
import { LoadBalancer } from './load-balancer';

interface ScalingPolicy {
  id: string;
  name: string;
  type: 'reactive' | 'predictive' | 'scheduled';
  enabled: boolean;
  triggers: ScalingTrigger[];
  actions: ScalingAction[];
  cooldown: number; // milliseconds
  minInstances: number;
  maxInstances: number;
  metadata: Record<string, any>;
}

interface ScalingTrigger {
  metric: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  threshold: number;
  duration: number; // milliseconds
  aggregation: 'avg' | 'max' | 'min' | 'sum' | 'p95' | 'p99';
  condition?: 'and' | 'or';
}

interface ScalingAction {
  type: 'scale_up' | 'scale_down' | 'scale_to' | 'notify';
  value: number; // instances to add/remove or target count
  priority: number; // execution order
  parameters?: Record<string, any>;
}

interface ScalingEvent {
  id: string;
  policyId: string;
  timestamp: number;
  type: 'scale_up' | 'scale_down' | 'scale_to';
  trigger: string;
  fromInstances: number;
  toInstances: number;
  duration: number;
  status: 'success' | 'failed' | 'in_progress';
  error?: string;
  metrics: Record<string, number>;
}

interface PredictionModel {
  name: string;
  type: 'linear' | 'polynomial' | 'seasonal' | 'ml';
  accuracy: number;
  lastTrained: number;
  parameters: Record<string, any>;
}

interface ResourceForecast {
  timestamp: number;
  metric: string;
  predicted: number;
  confidence: number;
  horizon: number; // minutes into future
  model: string;
}

/**
 * Predictive Scaling Engine
 */
class PredictiveScaler {
  private models = new Map<string, PredictionModel>();
  private forecasts = new Map<string, ResourceForecast[]>();
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
    this.initializeModels();
  }

  /**
   * Generate resource forecast
   */
  async generateForecast(
    metric: string,
    horizon: number = 60 // minutes
  ): Promise<ResourceForecast[]> {
    const historicalData = await this.getHistoricalData(metric, 7 * 24 * 60); // 7 days
    const model = this.selectBestModel(metric, historicalData);
    
    const forecasts: ResourceForecast[] = [];
    const now = Date.now();

    for (let i = 1; i <= horizon; i++) {
      const timestamp = now + (i * 60 * 1000); // every minute
      const prediction = await this.predict(model, historicalData, i);
      
      forecasts.push({
        timestamp,
        metric,
        predicted: prediction.value,
        confidence: prediction.confidence,
        horizon: i,
        model: model.name,
      });
    }

    this.forecasts.set(metric, forecasts);
    await this.storeForecastsInRedis(metric, forecasts);

    return forecasts;
  }

  /**
   * Check if scaling is needed based on predictions
   */
  async shouldPredictiveScale(
    metric: string,
    threshold: number,
    lookAhead: number = 15 // minutes
  ): Promise<{
    shouldScale: boolean;
    direction: 'up' | 'down';
    confidence: number;
    timeToThreshold: number;
    recommendedInstances: number;
  }> {
    const forecasts = this.forecasts.get(metric) || [];
    const relevantForecasts = forecasts.filter(f => f.horizon <= lookAhead);
    
    if (relevantForecasts.length === 0) {
      return {
        shouldScale: false,
        direction: 'up',
        confidence: 0,
        timeToThreshold: -1,
        recommendedInstances: 0,
      };
    }

    // Find when threshold will be crossed
    const thresholdCrossing = relevantForecasts.find(f => f.predicted > threshold);
    
    if (thresholdCrossing) {
      const avgConfidence = relevantForecasts.reduce((sum, f) => sum + f.confidence, 0) / relevantForecasts.length;
      const peakValue = Math.max(...relevantForecasts.map(f => f.predicted));
      const currentInstances = await this.getCurrentInstanceCount();
      
      // Calculate required instances based on predicted load
      const loadIncrease = peakValue / threshold;
      const recommendedInstances = Math.ceil(currentInstances * loadIncrease);

      return {
        shouldScale: avgConfidence > 0.7, // Only scale if confident
        direction: 'up',
        confidence: avgConfidence,
        timeToThreshold: thresholdCrossing.horizon,
        recommendedInstances,
      };
    }

    return {
      shouldScale: false,
      direction: 'up',
      confidence: 0,
      timeToThreshold: -1,
      recommendedInstances: 0,
    };
  }

  private initializeModels(): void {
    // Linear regression model
    this.models.set('linear', {
      name: 'linear',
      type: 'linear',
      accuracy: 0.75,
      lastTrained: Date.now(),
      parameters: { slope: 0, intercept: 0 },
    });

    // Seasonal model for cyclical patterns
    this.models.set('seasonal', {
      name: 'seasonal',
      type: 'seasonal',
      accuracy: 0.82,
      lastTrained: Date.now(),
      parameters: { 
        dailyPattern: [],
        weeklyPattern: [],
        trend: 0,
      },
    });

    // Polynomial model for non-linear trends
    this.models.set('polynomial', {
      name: 'polynomial',
      type: 'polynomial',
      accuracy: 0.68,
      lastTrained: Date.now(),
      parameters: { coefficients: [] },
    });
  }

  private async getHistoricalData(metric: string, minutes: number): Promise<Array<{ timestamp: number; value: number }>> {
    try {
      const key = `metrics:${metric}`;
      const since = Date.now() - (minutes * 60 * 1000);
      const data = await this.redis.zrangebyscore(key, since, '+inf', 'WITHSCORES');
      
      const points = [];
      for (let i = 0; i < data.length; i += 2) {
        const metricData = JSON.parse(data[i]);
        const timestamp = parseInt(data[i + 1]);
        points.push({ timestamp, value: metricData.value });
      }
      
      return points.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Failed to get historical data:', error);
      return [];
    }
  }

  private selectBestModel(metric: string, data: Array<{ timestamp: number; value: number }>): PredictionModel {
    // Simple model selection based on data characteristics
    if (data.length < 100) {
      return this.models.get('linear')!;
    }

    // Check for seasonal patterns (daily/weekly cycles)
    const hasSeasonality = this.detectSeasonality(data);
    if (hasSeasonality) {
      return this.models.get('seasonal')!;
    }

    // Check for non-linear trends
    const hasNonLinearTrend = this.detectNonLinearTrend(data);
    if (hasNonLinearTrend) {
      return this.models.get('polynomial')!;
    }

    return this.models.get('linear')!;
  }

  private async predict(
    model: PredictionModel,
    data: Array<{ timestamp: number; value: number }>,
    stepsAhead: number
  ): Promise<{ value: number; confidence: number }> {
    if (data.length === 0) {
      return { value: 0, confidence: 0 };
    }

    switch (model.type) {
      case 'linear':
        return this.predictLinear(data, stepsAhead);
      case 'seasonal':
        return this.predictSeasonal(data, stepsAhead);
      case 'polynomial':
        return this.predictPolynomial(data, stepsAhead);
      default:
        return { value: data[data.length - 1].value, confidence: 0.5 };
    }
  }

  private predictLinear(data: Array<{ timestamp: number; value: number }>, stepsAhead: number): { value: number; confidence: number } {
    if (data.length < 2) {
      return { value: data[0]?.value || 0, confidence: 0.3 };
    }

    // Simple linear regression
    const n = data.length;
    const sumX = data.reduce((sum, point, i) => sum + i, 0);
    const sumY = data.reduce((sum, point) => sum + point.value, 0);
    const sumXY = data.reduce((sum, point, i) => sum + i * point.value, 0);
    const sumXX = data.reduce((sum, point, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predicted = slope * (n + stepsAhead - 1) + intercept;
    const confidence = Math.max(0.3, Math.min(0.9, 1 - Math.abs(slope) / 100));

    return { value: Math.max(0, predicted), confidence };
  }

  private predictSeasonal(data: Array<{ timestamp: number; value: number }>, stepsAhead: number): { value: number; confidence: number } {
    // Simplified seasonal prediction
    const hourlyPattern = this.extractHourlyPattern(data);
    const now = new Date();
    const futureHour = (now.getHours() + Math.floor(stepsAhead / 60)) % 24;
    
    const seasonalValue = hourlyPattern[futureHour] || data[data.length - 1].value;
    const trend = this.calculateTrend(data);
    
    const predicted = seasonalValue + (trend * stepsAhead);
    return { value: Math.max(0, predicted), confidence: 0.75 };
  }

  private predictPolynomial(data: Array<{ timestamp: number; value: number }>, stepsAhead: number): { value: number; confidence: number } {
    // Simplified polynomial prediction (quadratic)
    if (data.length < 3) {
      return this.predictLinear(data, stepsAhead);
    }

    const n = data.length;
    const lastValue = data[n - 1].value;
    const secondLastValue = data[n - 2].value;
    const thirdLastValue = data[n - 3].value;

    // Simple quadratic extrapolation
    const firstDiff = lastValue - secondLastValue;
    const secondDiff = firstDiff - (secondLastValue - thirdLastValue);
    
    const predicted = lastValue + (firstDiff * stepsAhead) + (secondDiff * stepsAhead * stepsAhead / 2);
    return { value: Math.max(0, predicted), confidence: 0.6 };
  }

  private detectSeasonality(data: Array<{ timestamp: number; value: number }>): boolean {
    // Simple seasonality detection based on periodic patterns
    if (data.length < 24 * 7) return false; // Need at least a week of hourly data

    const hourlyAverages = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);

    for (const point of data) {
      const hour = new Date(point.timestamp).getHours();
      hourlyAverages[hour] += point.value;
      hourlyCounts[hour]++;
    }

    // Calculate variance between hours
    for (let i = 0; i < 24; i++) {
      if (hourlyCounts[i] > 0) {
        hourlyAverages[i] /= hourlyCounts[i];
      }
    }

    const mean = hourlyAverages.reduce((sum, val) => sum + val, 0) / 24;
    const variance = hourlyAverages.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 24;
    
    return variance > mean * 0.1; // Threshold for seasonality
  }

  private detectNonLinearTrend(data: Array<{ timestamp: number; value: number }>): boolean {
    if (data.length < 10) return false;

    // Check if polynomial fit is significantly better than linear
    const linearError = this.calculateLinearError(data);
    const polynomialError = this.calculatePolynomialError(data);
    
    return polynomialError < linearError * 0.8;
  }

  private calculateLinearError(data: Array<{ timestamp: number; value: number }>): number {
    const prediction = this.predictLinear(data, 0);
    return data.reduce((sum, point) => sum + Math.pow(point.value - prediction.value, 2), 0) / data.length;
  }

  private calculatePolynomialError(data: Array<{ timestamp: number; value: number }>): number {
    // Simplified polynomial error calculation
    return this.calculateLinearError(data) * 0.7; // Mock: assume polynomial is 30% better
  }

  private extractHourlyPattern(data: Array<{ timestamp: number; value: number }>): number[] {
    const hourlyAverages = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);

    for (const point of data) {
      const hour = new Date(point.timestamp).getHours();
      hourlyAverages[hour] += point.value;
      hourlyCounts[hour]++;
    }

    for (let i = 0; i < 24; i++) {
      if (hourlyCounts[i] > 0) {
        hourlyAverages[i] /= hourlyCounts[i];
      }
    }

    return hourlyAverages;
  }

  private calculateTrend(data: Array<{ timestamp: number; value: number }>): number {
    if (data.length < 2) return 0;
    
    const recent = data.slice(-10); // Last 10 points
    const prediction = this.predictLinear(recent, 1);
    return (prediction.value - recent[recent.length - 1].value);
  }

  private async getCurrentInstanceCount(): Promise<number> {
    // Mock implementation - would integrate with load balancer
    return 3; // Default instance count
  }

  private async storeForecastsInRedis(metric: string, forecasts: ResourceForecast[]): Promise<void> {
    try {
      const key = `forecasts:${metric}`;
      await this.redis.setex(key, 3600, JSON.stringify(forecasts)); // Cache for 1 hour
    } catch (error) {
      console.error('Failed to store forecasts:', error);
    }
  }
}

/**
 * Main Auto Scaler
 */
export class AutoScaler {
  private policies = new Map<string, ScalingPolicy>();
  private events: ScalingEvent[] = [];
  private isScaling = false;
  private lastScalingAction = 0;
  private redis: Redis;
  private apm: APMMonitor;
  private loadBalancer: LoadBalancer;
  private predictiveScaler: PredictiveScaler;

  constructor(redis: Redis, apm: APMMonitor, loadBalancer: LoadBalancer) {
    this.redis = redis;
    this.apm = apm;
    this.loadBalancer = loadBalancer;
    this.predictiveScaler = new PredictiveScaler(redis);
    
    this.initializeDefaultPolicies();
    this.startPolicyEvaluation();
  }

  /**
   * Add scaling policy
   */
  addPolicy(policy: ScalingPolicy): void {
    this.policies.set(policy.id, policy);
    console.log(`Added scaling policy: ${policy.name}`);
  }

  /**
   * Remove scaling policy
   */
  removePolicy(policyId: string): void {
    this.policies.delete(policyId);
    console.log(`Removed scaling policy: ${policyId}`);
  }

  /**
   * Enable/disable policy
   */
  togglePolicy(policyId: string, enabled: boolean): void {
    const policy = this.policies.get(policyId);
    if (policy) {
      policy.enabled = enabled;
      console.log(`Policy ${policyId} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Evaluate all policies and execute scaling actions
   */
  async evaluatePolicies(): Promise<{
    evaluatedPolicies: number;
    triggeredActions: number;
    scalingEvents: ScalingEvent[];
  }> {
    if (this.isScaling) {
      return {
        evaluatedPolicies: 0,
        triggeredActions: 0,
        scalingEvents: [],
      };
    }

    const newEvents: ScalingEvent[] = [];
    let evaluatedPolicies = 0;
    let triggeredActions = 0;

    for (const policy of this.policies.values()) {
      if (!policy.enabled) continue;

      evaluatedPolicies++;

      // Check cooldown
      if (Date.now() - this.lastScalingAction < policy.cooldown) {
        continue;
      }

      const shouldTrigger = await this.evaluatePolicy(policy);
      
      if (shouldTrigger.triggered) {
        triggeredActions++;
        const event = await this.executeScalingActions(policy, shouldTrigger.metrics);
        if (event) {
          newEvents.push(event);
          this.events.push(event);
        }
      }
    }

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    return {
      evaluatedPolicies,
      triggeredActions,
      scalingEvents: newEvents,
    };
  }

  /**
   * Get scaling statistics
   */
  getStats(): {
    policies: ScalingPolicy[];
    recentEvents: ScalingEvent[];
    isScaling: boolean;
    lastScalingAction: number;
    totalEvents: number;
    successRate: number;
  } {
    const recentEvents = this.events.slice(-50);
    const successfulEvents = this.events.filter(e => e.status === 'success').length;
    const successRate = this.events.length > 0 ? (successfulEvents / this.events.length) * 100 : 0;

    return {
      policies: Array.from(this.policies.values()),
      recentEvents,
      isScaling: this.isScaling,
      lastScalingAction: this.lastScalingAction,
      totalEvents: this.events.length,
      successRate,
    };
  }

  /**
   * Manual scaling trigger
   */
  async manualScale(
    type: 'scale_up' | 'scale_down' | 'scale_to',
    value: number,
    reason: string = 'Manual trigger'
  ): Promise<ScalingEvent> {
    const policy: ScalingPolicy = {
      id: 'manual',
      name: 'Manual Scaling',
      type: 'reactive',
      enabled: true,
      triggers: [],
      actions: [{ type, value, priority: 1 }],
      cooldown: 0,
      minInstances: 1,
      maxInstances: 100,
      metadata: { reason },
    };

    const stats = await this.loadBalancer.getStats();
    const currentInstances = stats.servers.length;

    const event = await this.executeScalingActions(policy, { 
      current_instances: currentInstances,
      manual_trigger: 1,
    });

    if (event) {
      this.events.push(event);
    }

    return event!;
  }

  /**
   * Get predictive scaling recommendations
   */
  async getPredictiveRecommendations(): Promise<{
    cpuRecommendation: any;
    memoryRecommendation: any;
    responseTimeRecommendation: any;
  }> {
    const [cpuForecast, memoryForecast, responseTimeForecast] = await Promise.all([
      this.predictiveScaler.generateForecast('system_cpu_usage', 30),
      this.predictiveScaler.generateForecast('system_memory_usage', 30),
      this.predictiveScaler.generateForecast('response_time_p95', 30),
    ]);

    const cpuRecommendation = await this.predictiveScaler.shouldPredictiveScale('system_cpu_usage', 80, 15);
    const memoryRecommendation = await this.predictiveScaler.shouldPredictiveScale('system_memory_usage', 85, 15);
    const responseTimeRecommendation = await this.predictiveScaler.shouldPredictiveScale('response_time_p95', 2000, 15);

    return {
      cpuRecommendation: {
        ...cpuRecommendation,
        forecast: cpuForecast.slice(0, 15),
      },
      memoryRecommendation: {
        ...memoryRecommendation,
        forecast: memoryForecast.slice(0, 15),
      },
      responseTimeRecommendation: {
        ...responseTimeRecommendation,
        forecast: responseTimeForecast.slice(0, 15),
      },
    };
  }

  private initializeDefaultPolicies(): void {
    // High CPU usage policy
    this.addPolicy({
      id: 'high-cpu',
      name: 'High CPU Usage Scale Up',
      type: 'reactive',
      enabled: true,
      triggers: [
        {
          metric: 'system_cpu_usage',
          operator: 'gt',
          threshold: 75,
          duration: 300000, // 5 minutes
          aggregation: 'avg',
        },
      ],
      actions: [
        {
          type: 'scale_up',
          value: 2,
          priority: 1,
        },
      ],
      cooldown: 600000, // 10 minutes
      minInstances: 2,
      maxInstances: 20,
      metadata: { category: 'performance' },
    });

    // High memory usage policy
    this.addPolicy({
      id: 'high-memory',
      name: 'High Memory Usage Scale Up',
      type: 'reactive',
      enabled: true,
      triggers: [
        {
          metric: 'system_memory_usage',
          operator: 'gt',
          threshold: 85,
          duration: 180000, // 3 minutes
          aggregation: 'avg',
        },
      ],
      actions: [
        {
          type: 'scale_up',
          value: 1,
          priority: 1,
        },
      ],
      cooldown: 600000, // 10 minutes
      minInstances: 2,
      maxInstances: 20,
      metadata: { category: 'performance' },
    });

    // High response time policy
    this.addPolicy({
      id: 'high-response-time',
      name: 'High Response Time Scale Up',
      type: 'reactive',
      enabled: true,
      triggers: [
        {
          metric: 'response_time_p95',
          operator: 'gt',
          threshold: 2000, // 2 seconds
          duration: 240000, // 4 minutes
          aggregation: 'p95',
        },
      ],
      actions: [
        {
          type: 'scale_up',
          value: 1,
          priority: 1,
        },
      ],
      cooldown: 480000, // 8 minutes
      minInstances: 2,
      maxInstances: 15,
      metadata: { category: 'performance' },
    });

    // Low resource usage scale down policy
    this.addPolicy({
      id: 'low-usage',
      name: 'Low Resource Usage Scale Down',
      type: 'reactive',
      enabled: true,
      triggers: [
        {
          metric: 'system_cpu_usage',
          operator: 'lt',
          threshold: 20,
          duration: 900000, // 15 minutes
          aggregation: 'avg',
        },
        {
          metric: 'system_memory_usage',
          operator: 'lt',
          threshold: 40,
          duration: 900000, // 15 minutes
          aggregation: 'avg',
          condition: 'and',
        },
      ],
      actions: [
        {
          type: 'scale_down',
          value: 1,
          priority: 1,
        },
      ],
      cooldown: 1200000, // 20 minutes
      minInstances: 2,
      maxInstances: 20,
      metadata: { category: 'cost-optimization' },
    });

    // Predictive scaling policy
    this.addPolicy({
      id: 'predictive-cpu',
      name: 'Predictive CPU Scaling',
      type: 'predictive',
      enabled: true,
      triggers: [
        {
          metric: 'system_cpu_usage',
          operator: 'gt',
          threshold: 70,
          duration: 0, // Immediate for predictive
          aggregation: 'avg',
        },
      ],
      actions: [
        {
          type: 'scale_up',
          value: 1,
          priority: 1,
        },
      ],
      cooldown: 900000, // 15 minutes
      minInstances: 2,
      maxInstances: 15,
      metadata: { category: 'predictive', lookAhead: 15 },
    });

    // Scheduled scaling for peak hours
    this.addPolicy({
      id: 'scheduled-peak',
      name: 'Peak Hours Scaling',
      type: 'scheduled',
      enabled: true,
      triggers: [],
      actions: [
        {
          type: 'scale_to',
          value: 6,
          priority: 1,
        },
      ],
      cooldown: 3600000, // 1 hour
      minInstances: 2,
      maxInstances: 20,
      metadata: { 
        category: 'scheduled',
        schedule: '0 8 * * *', // 8 AM daily
        timezone: 'UTC',
      },
    });
  }

  private async evaluatePolicy(policy: ScalingPolicy): Promise<{
    triggered: boolean;
    metrics: Record<string, number>;
  }> {
    const metrics = await this.getCurrentMetrics();
    
    if (policy.type === 'predictive') {
      return this.evaluatePredictivePolicy(policy, metrics);
    } else if (policy.type === 'scheduled') {
      return this.evaluateScheduledPolicy(policy, metrics);
    } else {
      return this.evaluateReactivePolicy(policy, metrics);
    }
  }

  private async evaluateReactivePolicy(policy: ScalingPolicy, metrics: Record<string, number>): Promise<{
    triggered: boolean;
    metrics: Record<string, number>;
  }> {
    let triggered = false;
    let conditionLogic = 'and'; // Default

    for (const trigger of policy.triggers) {
      const metricValue = metrics[trigger.metric];
      if (metricValue === undefined) continue;

      const conditionMet = this.evaluateTriggerCondition(trigger, metricValue);
      
      if (trigger.condition === 'or') {
        conditionLogic = 'or';
        if (conditionMet) {
          triggered = true;
          break;
        }
      } else {
        // AND logic (default)
        if (!conditionMet) {
          triggered = false;
          break;
        }
        triggered = true;
      }
    }

    return { triggered, metrics };
  }

  private async evaluatePredictivePolicy(policy: ScalingPolicy, metrics: Record<string, number>): Promise<{
    triggered: boolean;
    metrics: Record<string, number>;
  }> {
    const trigger = policy.triggers[0]; // Assume single trigger for predictive
    if (!trigger) return { triggered: false, metrics };

    const lookAhead = policy.metadata.lookAhead || 15;
    const prediction = await this.predictiveScaler.shouldPredictiveScale(
      trigger.metric,
      trigger.threshold,
      lookAhead
    );

    return {
      triggered: prediction.shouldScale && prediction.confidence > 0.7,
      metrics: {
        ...metrics,
        predicted_value: prediction.recommendedInstances,
        confidence: prediction.confidence,
        time_to_threshold: prediction.timeToThreshold,
      },
    };
  }

  private async evaluateScheduledPolicy(policy: ScalingPolicy, metrics: Record<string, number>): Promise<{
    triggered: boolean;
    metrics: Record<string, number>;
  }> {
    // Simple scheduled evaluation - in production, use cron parser
    const schedule = policy.metadata.schedule;
    const now = new Date();
    
    // Mock: trigger at 8 AM and 6 PM
    const hour = now.getHours();
    const triggered = hour === 8 || hour === 18;

    return { triggered, metrics };
  }

  private evaluateTriggerCondition(trigger: ScalingTrigger, value: number): boolean {
    switch (trigger.operator) {
      case 'gt':
        return value > trigger.threshold;
      case 'gte':
        return value >= trigger.threshold;
      case 'lt':
        return value < trigger.threshold;
      case 'lte':
        return value <= trigger.threshold;
      case 'eq':
        return Math.abs(value - trigger.threshold) < 0.01;
      default:
        return false;
    }
  }

  private async getCurrentMetrics(): Promise<Record<string, number>> {
    try {
      const dashboardData = await this.apm.getDashboardData();
      const lbStats = await this.loadBalancer.getStats();

      return {
        system_cpu_usage: dashboardData.systemMetrics.cpu.usage,
        system_memory_usage: dashboardData.systemMetrics.memory.usage,
        response_time_avg: dashboardData.applicationMetrics.responseTime.avg,
        response_time_p95: dashboardData.applicationMetrics.responseTime.p95,
        response_time_p99: dashboardData.applicationMetrics.responseTime.p99,
        error_rate: dashboardData.applicationMetrics.requests.errorRate,
        request_rate: dashboardData.applicationMetrics.requests.rate,
        current_instances: lbStats.servers.length,
        healthy_instances: lbStats.healthyServers,
      };
    } catch (error) {
      console.error('Failed to get current metrics:', error);
      return {};
    }
  }

  private async executeScalingActions(policy: ScalingPolicy, metrics: Record<string, number>): Promise<ScalingEvent | null> {
    if (this.isScaling) return null;

    this.isScaling = true;
    this.lastScalingAction = Date.now();

    const eventId = this.generateId();
    const startTime = performance.now();
    const currentInstances = metrics.current_instances || 0;

    try {
      // Sort actions by priority
      const sortedActions = policy.actions.sort((a, b) => a.priority - b.priority);
      let targetInstances = currentInstances;

      for (const action of sortedActions) {
        switch (action.type) {
          case 'scale_up':
            targetInstances = Math.min(currentInstances + action.value, policy.maxInstances);
            break;
          case 'scale_down':
            targetInstances = Math.max(currentInstances - action.value, policy.minInstances);
            break;
          case 'scale_to':
            targetInstances = Math.max(policy.minInstances, Math.min(action.value, policy.maxInstances));
            break;
          case 'notify':
            await this.sendScalingNotification(policy, action, metrics);
            continue;
        }
      }

      // Execute the scaling
      if (targetInstances !== currentInstances) {
        await this.performScaling(currentInstances, targetInstances);
      }

      const event: ScalingEvent = {
        id: eventId,
        policyId: policy.id,
        timestamp: Date.now(),
        type: targetInstances > currentInstances ? 'scale_up' : 
              targetInstances < currentInstances ? 'scale_down' : 'scale_to',
        trigger: `${policy.name} - ${JSON.stringify(policy.triggers[0])}`,
        fromInstances: currentInstances,
        toInstances: targetInstances,
        duration: performance.now() - startTime,
        status: 'success',
        metrics,
      };

      console.log(`Scaling executed: ${currentInstances} → ${targetInstances} instances (Policy: ${policy.name})`);
      return event;

    } catch (error) {
      const event: ScalingEvent = {
        id: eventId,
        policyId: policy.id,
        timestamp: Date.now(),
        type: 'scale_up',
        trigger: `${policy.name} - ${JSON.stringify(policy.triggers[0])}`,
        fromInstances: currentInstances,
        toInstances: currentInstances,
        duration: performance.now() - startTime,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics,
      };

      console.error(`Scaling failed: ${error}`);
      return event;

    } finally {
      this.isScaling = false;
    }
  }

  private async performScaling(fromInstances: number, toInstances: number): Promise<void> {
    // This would integrate with cloud provider APIs or orchestration systems
    // For now, we'll simulate the scaling operation
    
    if (toInstances > fromInstances) {
      // Scale up
      const instancesToAdd = toInstances - fromInstances;
      console.log(`Adding ${instancesToAdd} instances...`);
      
      // Simulate instance launch time
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
      
    } else if (toInstances < fromInstances) {
      // Scale down
      const instancesToRemove = fromInstances - toInstances;
      console.log(`Removing ${instancesToRemove} instances...`);
      
      // Simulate graceful shutdown time
      await new Promise(resolve => setTimeout(resolve, 60000)); // 60 seconds
    }
  }

  private async sendScalingNotification(policy: ScalingPolicy, action: ScalingAction, metrics: Record<string, number>): Promise<void> {
    console.log(`📢 Scaling Notification: Policy "${policy.name}" triggered with metrics:`, metrics);
  }

  private startPolicyEvaluation(): void {
    // Evaluate policies every 2 minutes
    setInterval(async () => {
      try {
        await this.evaluatePolicies();
      } catch (error) {
        console.error('Policy evaluation failed:', error);
      }
    }, 120000);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

/**
 * Factory function
 */
export function createAutoScaler(redis: Redis, apm: APMMonitor, loadBalancer: LoadBalancer): AutoScaler {
  return new AutoScaler(redis, apm, loadBalancer);
}