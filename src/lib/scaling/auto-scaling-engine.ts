// Auto-Scaling Engine - Massive Scale Infrastructure  
// Enterprise-grade predictive auto-scaling system

// ==================== AUTO-SCALING TYPES ====================

export interface AutoScalingConfig {
  enabled: boolean;
  strategy: 'reactive' | 'predictive' | 'hybrid';
  minInstances: number;
  maxInstances: number;
  targetMetrics: {
    cpu: number;
    memory: number;
    requestRate: number;
    responseTime: number;
    queueDepth: number;
  };
  scaleUpPolicy: ScalingPolicy;
  scaleDownPolicy: ScalingPolicy;
  cooldownPeriods: {
    scaleUp: number;
    scaleDown: number;
  };
  regions: RegionConfig[];
}

export interface ScalingPolicy {
  threshold: number;
  increment: number;
  evaluationPeriods: number;
  dataPointsToAlarm: number;
  comparisonOperator: 'GreaterThanThreshold' | 'LessThanThreshold';
}

export interface RegionConfig {
  region: string;
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  priority: number;
  costMultiplier: number;
  latencyTarget: number;
}

export interface ScalingMetrics {
  timestamp: number;
  region: string;
  instanceCount: number;
  cpuUtilization: number;
  memoryUtilization: number;
  requestRate: number;
  responseTime: number;
  queueDepth: number;
  errorRate: number;
  cost: number;
}

export interface PredictiveModel {
  name: string;
  algorithm: 'linear_regression' | 'arima' | 'lstm' | 'prophet';
  features: string[];
  accuracy: number;
  lastTrained: number;
  predictions: PredictionWindow[];
}

export interface PredictionWindow {
  timestamp: number;
  predictedLoad: number;
  confidence: number;
  recommendedInstances: number;
}

export interface ScalingEvent {
  id: string;
  timestamp: number;
  region: string;
  action: 'scale_up' | 'scale_down' | 'no_action';
  trigger: string;
  fromInstances: number;
  toInstances: number;
  duration: number;
  success: boolean;
  reason: string;
  cost: number;
}

// ==================== AUTO-SCALING ENGINE ====================

export class AutoScalingEngine {
  private static instance: AutoScalingEngine;
  private config: AutoScalingConfig;
  private metrics: ScalingMetrics[] = [];
  private events: ScalingEvent[] = [];
  private predictiveModels: Map<string, PredictiveModel> = new Map();
  private lastScalingAction: Map<string, number> = new Map();
  private currentInstances: Map<string, number> = new Map();

  private constructor() {
    this.config = this.initializeConfig();
    this.initializePredictiveModels();
    this.startMetricsCollection();
  }

  static getInstance(): AutoScalingEngine {
    if (!AutoScalingEngine.instance) {
      AutoScalingEngine.instance = new AutoScalingEngine();
    }
    return AutoScalingEngine.instance;
  }

  private initializeConfig(): AutoScalingConfig {
    return {
      enabled: true,
      strategy: 'hybrid',
      minInstances: 2,
      maxInstances: 500,
      targetMetrics: {
        cpu: 70,
        memory: 80,
        requestRate: 1000,
        responseTime: 200,
        queueDepth: 100
      },
      scaleUpPolicy: {
        threshold: 80,
        increment: 2,
        evaluationPeriods: 2,
        dataPointsToAlarm: 2,
        comparisonOperator: 'GreaterThanThreshold'
      },
      scaleDownPolicy: {
        threshold: 30,
        increment: 1,
        evaluationPeriods: 5,
        dataPointsToAlarm: 5,
        comparisonOperator: 'LessThanThreshold'
      },
      cooldownPeriods: {
        scaleUp: 300,    // 5 minutes
        scaleDown: 900   // 15 minutes
      },
      regions: [
        {
          region: 'us-east-1',
          enabled: true,
          minInstances: 3,
          maxInstances: 200,
          priority: 1,
          costMultiplier: 1.0,
          latencyTarget: 50
        },
        {
          region: 'us-west-2',
          enabled: true,
          minInstances: 2,
          maxInstances: 150,
          priority: 2,
          costMultiplier: 1.05,
          latencyTarget: 75
        },
        {
          region: 'eu-west-1',
          enabled: true,
          minInstances: 2,
          maxInstances: 100,
          priority: 3,
          costMultiplier: 1.15,
          latencyTarget: 60
        },
        {
          region: 'ap-southeast-1',
          enabled: true,
          minInstances: 1,
          maxInstances: 80,
          priority: 4,
          costMultiplier: 1.20,
          latencyTarget: 100
        },
        {
          region: 'ap-northeast-1',
          enabled: true,
          minInstances: 1,
          maxInstances: 80,
          priority: 5,
          costMultiplier: 1.18,
          latencyTarget: 120
        }
      ]
    };
  }

  private initializePredictiveModels(): void {
    // CPU utilization prediction model
    this.predictiveModels.set('cpu_prediction', {
      name: 'CPU Utilization Predictor',
      algorithm: 'arima',
      features: ['cpu_utilization', 'request_rate', 'hour_of_day', 'day_of_week'],
      accuracy: 0.85,
      lastTrained: Date.now() - (24 * 60 * 60 * 1000), // 24 hours ago
      predictions: []
    });

    // Request rate prediction model
    this.predictiveModels.set('request_prediction', {
      name: 'Request Rate Predictor',
      algorithm: 'prophet',
      features: ['request_rate', 'hour_of_day', 'day_of_week', 'is_holiday'],
      accuracy: 0.82,
      lastTrained: Date.now() - (24 * 60 * 60 * 1000),
      predictions: []
    });

    // Memory utilization prediction model
    this.predictiveModels.set('memory_prediction', {
      name: 'Memory Utilization Predictor',
      algorithm: 'linear_regression',
      features: ['memory_utilization', 'active_users', 'data_volume'],
      accuracy: 0.78,
      lastTrained: Date.now() - (24 * 60 * 60 * 1000),
      predictions: []
    });

    console.log(`🤖 Predictive models initialized: ${this.predictiveModels.size} models`);
  }

  private startMetricsCollection(): void {
    // Start collecting metrics every 30 seconds
    setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Run scaling evaluation every minute
    setInterval(() => {
      this.evaluateScaling();
    }, 60000);

    // Update predictions every 5 minutes
    setInterval(() => {
      this.updatePredictions();
    }, 300000);

    console.log('📊 Auto-scaling metrics collection started');
  }

  // ==================== METRICS COLLECTION ====================

  private async collectMetrics(): Promise<void> {
    for (const regionConfig of this.config.regions) {
      if (!regionConfig.enabled) continue;

      const metrics = await this.getCurrentMetrics(regionConfig.region);
      this.metrics.push(metrics);
    }

    // Keep only last 2880 metrics (24 hours at 30-second intervals)
    if (this.metrics.length > 2880) {
      this.metrics = this.metrics.slice(-2880);
    }
  }

  private async getCurrentMetrics(region: string): Promise<ScalingMetrics> {
    // In production, these would come from actual monitoring systems
    const baseLoad = this.getRegionBaseLoad(region);
    const timeOfDay = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Simulate realistic metrics with time-based patterns
    const cpuUtilization = this.simulateMetric(baseLoad * 50, timeOfDay, dayOfWeek, 'cpu');
    const memoryUtilization = this.simulateMetric(baseLoad * 60, timeOfDay, dayOfWeek, 'memory');
    const requestRate = this.simulateMetric(baseLoad * 800, timeOfDay, dayOfWeek, 'requests');
    const responseTime = this.simulateMetric(100 / baseLoad, timeOfDay, dayOfWeek, 'latency');
    const queueDepth = Math.max(0, this.simulateMetric(baseLoad * 50, timeOfDay, dayOfWeek, 'queue'));
    
    return {
      timestamp: Date.now(),
      region,
      instanceCount: this.currentInstances.get(region) || this.getRegionConfig(region)?.minInstances || 2,
      cpuUtilization: Math.min(100, Math.max(0, cpuUtilization)),
      memoryUtilization: Math.min(100, Math.max(0, memoryUtilization)),
      requestRate: Math.max(0, requestRate),
      responseTime: Math.max(10, responseTime),
      queueDepth: Math.max(0, queueDepth),
      errorRate: Math.random() * 2, // 0-2% error rate
      cost: this.calculateRegionCost(region, this.currentInstances.get(region) || 2)
    };
  }

  private getRegionBaseLoad(region: string): number {
    // Simulate different load patterns per region
    const loadMap: Record<string, number> = {
      'us-east-1': 1.2,
      'us-west-2': 0.9,
      'eu-west-1': 0.8,
      'ap-southeast-1': 0.6,
      'ap-northeast-1': 0.7
    };
    return loadMap[region] || 1.0;
  }

  private simulateMetric(base: number, hour: number, dayOfWeek: number, type: string): number {
    // Business hours pattern (9 AM - 6 PM weekdays)
    let timeMultiplier = 1.0;
    
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekdays
      if (hour >= 9 && hour <= 18) {
        timeMultiplier = 1.5; // 50% higher during business hours
      } else if (hour >= 6 && hour <= 9 || hour >= 18 && hour <= 22) {
        timeMultiplier = 1.2; // 20% higher during peak adjacent hours
      } else {
        timeMultiplier = 0.6; // 40% lower during off hours
      }
    } else { // Weekends
      timeMultiplier = 0.8; // 20% lower on weekends
    }

    // Add some randomness
    const randomFactor = 0.8 + (Math.random() * 0.4); // ±20% variance
    
    return base * timeMultiplier * randomFactor;
  }

  private calculateRegionCost(region: string, instances: number): number {
    const regionConfig = this.getRegionConfig(region);
    const baseCostPerInstance = 0.12; // $0.12 per hour per instance
    const multiplier = regionConfig?.costMultiplier || 1.0;
    
    return instances * baseCostPerInstance * multiplier;
  }

  // ==================== SCALING EVALUATION ====================

  private async evaluateScaling(): Promise<void> {
    if (!this.config.enabled) return;

    for (const regionConfig of this.config.regions) {
      if (!regionConfig.enabled) continue;

      await this.evaluateRegionScaling(regionConfig);
    }
  }

  private async evaluateRegionScaling(regionConfig: RegionConfig): Promise<void> {
    const recentMetrics = this.getRecentMetrics(regionConfig.region, 5); // Last 5 minutes
    if (recentMetrics.length === 0) return;

    const latestMetrics = recentMetrics[recentMetrics.length - 1];
    const currentInstances = latestMetrics.instanceCount;

    // Check cooldown periods
    const lastAction = this.lastScalingAction.get(regionConfig.region) || 0;
    const timeSinceLastAction = Date.now() - lastAction;

    let scalingDecision: 'scale_up' | 'scale_down' | 'no_action' = 'no_action';
    let targetInstances = currentInstances;
    let trigger = '';

    // Evaluate scaling based on strategy
    switch (this.config.strategy) {
      case 'reactive':
        const reactiveDecision = await this.evaluateReactiveScaling(recentMetrics, regionConfig);
        scalingDecision = reactiveDecision.action;
        targetInstances = reactiveDecision.targetInstances;
        trigger = reactiveDecision.trigger;
        break;

      case 'predictive':
        const predictiveDecision = await this.evaluatePredictiveScaling(regionConfig);
        scalingDecision = predictiveDecision.action;
        targetInstances = predictiveDecision.targetInstances;
        trigger = predictiveDecision.trigger;
        break;

      case 'hybrid':
        const reactiveResult = await this.evaluateReactiveScaling(recentMetrics, regionConfig);
        const predictiveResult = await this.evaluatePredictiveScaling(regionConfig);
        
        // Use the more aggressive scaling decision
        if (reactiveResult.action === 'scale_up' || predictiveResult.action === 'scale_up') {
          scalingDecision = 'scale_up';
          targetInstances = Math.max(reactiveResult.targetInstances, predictiveResult.targetInstances);
          trigger = `Hybrid: ${reactiveResult.trigger} + ${predictiveResult.trigger}`;
        } else if (reactiveResult.action === 'scale_down' && predictiveResult.action === 'scale_down') {
          scalingDecision = 'scale_down';
          targetInstances = Math.min(reactiveResult.targetInstances, predictiveResult.targetInstances);
          trigger = `Hybrid: ${reactiveResult.trigger} + ${predictiveResult.trigger}`;
        }
        break;
    }

    // Apply cooldown logic
    if (scalingDecision === 'scale_up' && timeSinceLastAction < this.config.cooldownPeriods.scaleUp * 1000) {
      scalingDecision = 'no_action';
      trigger = 'Scale-up cooldown active';
    } else if (scalingDecision === 'scale_down' && timeSinceLastAction < this.config.cooldownPeriods.scaleDown * 1000) {
      scalingDecision = 'no_action';
      trigger = 'Scale-down cooldown active';
    }

    // Execute scaling decision
    if (scalingDecision !== 'no_action' && targetInstances !== currentInstances) {
      await this.executeScaling(regionConfig.region, scalingDecision, currentInstances, targetInstances, trigger);
    }
  }

  private async evaluateReactiveScaling(
    metrics: ScalingMetrics[],
    regionConfig: RegionConfig
  ): Promise<{ action: 'scale_up' | 'scale_down' | 'no_action'; targetInstances: number; trigger: string }> {
    const latestMetrics = metrics[metrics.length - 1];
    const avgCpu = metrics.reduce((sum, m) => sum + m.cpuUtilization, 0) / metrics.length;
    const avgMemory = metrics.reduce((sum, m) => sum + m.memoryUtilization, 0) / metrics.length;
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;

    // Scale up conditions
    if (avgCpu > this.config.scaleUpPolicy.threshold ||
        avgMemory > this.config.targetMetrics.memory ||
        avgResponseTime > this.config.targetMetrics.responseTime ||
        latestMetrics.queueDepth > this.config.targetMetrics.queueDepth) {
      
      const increment = this.config.scaleUpPolicy.increment;
      const targetInstances = Math.min(
        latestMetrics.instanceCount + increment,
        regionConfig.maxInstances
      );
      
      return {
        action: 'scale_up',
        targetInstances,
        trigger: `Reactive: CPU=${avgCpu.toFixed(1)}%, Memory=${avgMemory.toFixed(1)}%, ResponseTime=${avgResponseTime.toFixed(1)}ms`
      };
    }

    // Scale down conditions
    if (avgCpu < this.config.scaleDownPolicy.threshold &&
        avgMemory < this.config.targetMetrics.memory * 0.5 &&
        avgResponseTime < this.config.targetMetrics.responseTime * 0.5 &&
        latestMetrics.queueDepth < this.config.targetMetrics.queueDepth * 0.3) {
      
      const decrement = this.config.scaleDownPolicy.increment;
      const targetInstances = Math.max(
        latestMetrics.instanceCount - decrement,
        regionConfig.minInstances
      );
      
      return {
        action: 'scale_down',
        targetInstances,
        trigger: `Reactive: Low utilization - CPU=${avgCpu.toFixed(1)}%, Memory=${avgMemory.toFixed(1)}%`
      };
    }

    return {
      action: 'no_action',
      targetInstances: latestMetrics.instanceCount,
      trigger: 'Reactive: Metrics within target ranges'
    };
  }

  private async evaluatePredictiveScaling(
    regionConfig: RegionConfig
  ): Promise<{ action: 'scale_up' | 'scale_down' | 'no_action'; targetInstances: number; trigger: string }> {
    const predictions = await this.getPredictions(regionConfig.region, 30); // Next 30 minutes
    if (predictions.length === 0) {
      return { action: 'no_action', targetInstances: 0, trigger: 'No predictions available' };
    }

    const currentInstances = this.currentInstances.get(regionConfig.region) || regionConfig.minInstances;
    const maxPredictedLoad = Math.max(...predictions.map(p => p.predictedLoad));
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

    // Only act on high-confidence predictions
    if (avgConfidence < 0.7) {
      return { action: 'no_action', targetInstances: currentInstances, trigger: 'Low prediction confidence' };
    }

    const recommendedInstances = Math.max(...predictions.map(p => p.recommendedInstances));
    
    if (recommendedInstances > currentInstances * 1.2) {
      const targetInstances = Math.min(recommendedInstances, regionConfig.maxInstances);
      return {
        action: 'scale_up',
        targetInstances,
        trigger: `Predictive: Expected load increase to ${maxPredictedLoad.toFixed(1)} (confidence: ${(avgConfidence * 100).toFixed(1)}%)`
      };
    }

    if (recommendedInstances < currentInstances * 0.8) {
      const targetInstances = Math.max(recommendedInstances, regionConfig.minInstances);
      return {
        action: 'scale_down',
        targetInstances,
        trigger: `Predictive: Expected load decrease to ${maxPredictedLoad.toFixed(1)} (confidence: ${(avgConfidence * 100).toFixed(1)}%)`
      };
    }

    return {
      action: 'no_action',
      targetInstances: currentInstances,
      trigger: 'Predictive: No significant load change expected'
    };
  }

  // ==================== SCALING EXECUTION ====================

  private async executeScaling(
    region: string,
    action: 'scale_up' | 'scale_down',
    fromInstances: number,
    toInstances: number,
    trigger: string
  ): Promise<void> {
    const eventId = `scaling_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    console.log(`🔄 ${action.toUpperCase()} in ${region}: ${fromInstances} → ${toInstances} (${trigger})`);

    try {
      // Simulate scaling operation
      await this.performScalingOperation(region, action, fromInstances, toInstances);
      
      const duration = Date.now() - startTime;
      const cost = this.calculateScalingCost(region, action, Math.abs(toInstances - fromInstances));

      // Record successful scaling event
      this.recordScalingEvent({
        id: eventId,
        timestamp: startTime,
        region,
        action,
        trigger,
        fromInstances,
        toInstances,
        duration,
        success: true,
        reason: 'Scaling operation completed successfully',
        cost
      });

      // Update current instance count
      this.currentInstances.set(region, toInstances);
      this.lastScalingAction.set(region, Date.now());

      console.log(`✅ Scaling completed in ${region}: ${fromInstances} → ${toInstances} (${duration}ms)`);

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record failed scaling event
      this.recordScalingEvent({
        id: eventId,
        timestamp: startTime,
        region,
        action,
        trigger,
        fromInstances,
        toInstances,
        duration,
        success: false,
        reason: `Scaling failed: ${error}`,
        cost: 0
      });

      console.error(`❌ Scaling failed in ${region}:`, error);
    }
  }

  private async performScalingOperation(
    region: string,
    action: 'scale_up' | 'scale_down',
    fromInstances: number,
    toInstances: number
  ): Promise<void> {
    // In production, this would call cloud provider APIs
    // Simulate realistic scaling times
    const instanceDiff = Math.abs(toInstances - fromInstances);
    const scalingTime = action === 'scale_up' ? 
      instanceDiff * 30000 : // 30 seconds per instance to scale up
      instanceDiff * 10000;  // 10 seconds per instance to scale down

    await new Promise(resolve => setTimeout(resolve, Math.min(scalingTime, 120000))); // Max 2 minutes
  }

  private calculateScalingCost(region: string, action: 'scale_up' | 'scale_down', instanceCount: number): number {
    const regionConfig = this.getRegionConfig(region);
    const baseCost = 0.12; // $0.12 per hour per instance
    const multiplier = regionConfig?.costMultiplier || 1.0;
    
    // Scale up costs more due to provisioning overhead
    const operationCost = action === 'scale_up' ? 0.05 : 0.01; // One-time cost per operation
    
    return (baseCost * multiplier * instanceCount) + operationCost;
  }

  // ==================== PREDICTIVE MODELING ====================

  private async updatePredictions(): Promise<void> {
    for (const regionConfig of this.config.regions) {
      if (!regionConfig.enabled) continue;

      await this.generatePredictions(regionConfig.region);
    }
  }

  private async generatePredictions(region: string): Promise<void> {
    const historicalMetrics = this.getRecentMetrics(region, 1440); // Last 24 hours
    if (historicalMetrics.length < 60) return; // Need at least 1 hour of data

    for (const [modelName, model] of this.predictiveModels) {
      const predictions = await this.runPredictiveModel(model, historicalMetrics, region);
      model.predictions = predictions;
    }

    console.log(`🔮 Updated predictions for region: ${region}`);
  }

  private async runPredictiveModel(
    model: PredictiveModel,
    historicalMetrics: ScalingMetrics[],
    region: string
  ): Promise<PredictionWindow[]> {
    const predictions: PredictionWindow[] = [];
    const now = Date.now();

    // Generate predictions for the next 2 hours (every 5 minutes)
    for (let i = 1; i <= 24; i++) {
      const predictionTime = now + (i * 5 * 60 * 1000); // 5-minute intervals
      
      let predictedLoad: number;
      let confidence: number;

      switch (model.algorithm) {
        case 'linear_regression':
          ({ predictedLoad, confidence } = this.linearRegressionPredict(historicalMetrics, predictionTime));
          break;
        case 'arima':
          ({ predictedLoad, confidence } = this.arimaPredict(historicalMetrics, predictionTime));
          break;
        case 'prophet':
          ({ predictedLoad, confidence } = this.prophetPredict(historicalMetrics, predictionTime));
          break;
        default:
          ({ predictedLoad, confidence } = this.simpleMovingAverage(historicalMetrics, predictionTime));
      }

      const recommendedInstances = this.calculateRecommendedInstances(predictedLoad, region);

      predictions.push({
        timestamp: predictionTime,
        predictedLoad,
        confidence,
        recommendedInstances
      });
    }

    return predictions;
  }

  private linearRegressionPredict(metrics: ScalingMetrics[], predictionTime: number): { predictedLoad: number; confidence: number } {
    // Simplified linear regression based on time trend
    const n = metrics.length;
    const timePoints = metrics.map((_, i) => i);
    const loads = metrics.map(m => m.cpuUtilization);

    const sumX = timePoints.reduce((a, b) => a + b, 0);
    const sumY = loads.reduce((a, b) => a + b, 0);
    const sumXY = timePoints.reduce((sum, x, i) => sum + x * loads[i], 0);
    const sumXX = timePoints.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const futureTimePoint = n + ((predictionTime - metrics[n - 1].timestamp) / (5 * 60 * 1000));
    const predictedLoad = intercept + slope * futureTimePoint;

    // Calculate confidence based on R-squared
    const avgY = sumY / n;
    const ssRes = loads.reduce((sum, y, i) => sum + Math.pow(y - (intercept + slope * timePoints[i]), 2), 0);
    const ssTot = loads.reduce((sum, y) => sum + Math.pow(y - avgY, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    const confidence = Math.max(0.3, Math.min(0.95, rSquared));

    return { predictedLoad: Math.max(0, predictedLoad), confidence };
  }

  private arimaPredict(metrics: ScalingMetrics[], predictionTime: number): { predictedLoad: number; confidence: number } {
    // Simplified ARIMA-like prediction using recent trend and seasonality
    const recentMetrics = metrics.slice(-48); // Last 4 hours
    const trend = this.calculateTrend(recentMetrics);
    const seasonality = this.calculateSeasonality(predictionTime);
    
    const lastValue = recentMetrics[recentMetrics.length - 1].cpuUtilization;
    const predictedLoad = lastValue + trend + seasonality;
    
    return { 
      predictedLoad: Math.max(0, Math.min(100, predictedLoad)), 
      confidence: 0.75 
    };
  }

  private prophetPredict(metrics: ScalingMetrics[], predictionTime: number): { predictedLoad: number; confidence: number } {
    // Simplified Prophet-like prediction with trend and weekly seasonality
    const hourlySeasonality = this.calculateHourlySeasonality(predictionTime);
    const weeklySeasonality = this.calculateWeeklySeasonality(predictionTime);
    const trend = this.calculateTrend(metrics.slice(-168)); // Last week
    
    const baseline = metrics.slice(-24).reduce((sum, m) => sum + m.cpuUtilization, 0) / 24;
    const predictedLoad = baseline + trend + hourlySeasonality + weeklySeasonality;
    
    return { 
      predictedLoad: Math.max(0, Math.min(100, predictedLoad)), 
      confidence: 0.82 
    };
  }

  private simpleMovingAverage(metrics: ScalingMetrics[], predictionTime: number): { predictedLoad: number; confidence: number } {
    const windowSize = Math.min(12, metrics.length); // 1-hour window
    const recentMetrics = metrics.slice(-windowSize);
    const avgLoad = recentMetrics.reduce((sum, m) => sum + m.cpuUtilization, 0) / recentMetrics.length;
    
    return { predictedLoad: avgLoad, confidence: 0.6 };
  }

  private calculateTrend(metrics: ScalingMetrics[]): number {
    if (metrics.length < 2) return 0;
    
    const first = metrics[0].cpuUtilization;
    const last = metrics[metrics.length - 1].cpuUtilization;
    const periods = metrics.length;
    
    return (last - first) / periods;
  }

  private calculateSeasonality(timestamp: number): number {
    const hour = new Date(timestamp).getHours();
    // Simple business hours seasonality
    if (hour >= 9 && hour <= 17) {
      return 10; // 10% increase during business hours
    } else if (hour >= 6 && hour <= 9 || hour >= 17 && hour <= 22) {
      return 5; // 5% increase during adjacent hours
    }
    return -5; // 5% decrease during off hours
  }

  private calculateHourlySeasonality(timestamp: number): number {
    const hour = new Date(timestamp).getHours();
    // Sinusoidal pattern with peak at 2 PM
    return 15 * Math.sin((hour - 6) * Math.PI / 12);
  }

  private calculateWeeklySeasonality(timestamp: number): number {
    const dayOfWeek = new Date(timestamp).getDay();
    // Lower load on weekends
    return dayOfWeek === 0 || dayOfWeek === 6 ? -10 : 5;
  }

  private calculateRecommendedInstances(predictedLoad: number, region: string): number {
    const regionConfig = this.getRegionConfig(region);
    if (!regionConfig) return 2;

    // Calculate instances needed based on predicted load
    const targetCpuPerInstance = this.config.targetMetrics.cpu;
    const safetyMargin = 1.2; // 20% safety margin
    
    const requiredInstances = Math.ceil((predictedLoad / targetCpuPerInstance) * safetyMargin);
    
    return Math.max(
      regionConfig.minInstances,
      Math.min(regionConfig.maxInstances, requiredInstances)
    );
  }

  // ==================== HELPER METHODS ====================

  private getRecentMetrics(region: string, minutes: number): ScalingMetrics[] {
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    return this.metrics.filter(m => m.region === region && m.timestamp > cutoffTime);
  }

  private getRegionConfig(region: string): RegionConfig | undefined {
    return this.config.regions.find(r => r.region === region);
  }

  private getPredictions(region: string, minutes: number): PredictionWindow[] {
    const cutoffTime = Date.now() + (minutes * 60 * 1000);
    const predictions: PredictionWindow[] = [];
    
    for (const model of this.predictiveModels.values()) {
      predictions.push(...model.predictions.filter(p => p.timestamp <= cutoffTime));
    }
    
    return predictions.sort((a, b) => a.timestamp - b.timestamp);
  }

  private recordScalingEvent(event: ScalingEvent): void {
    this.events.push(event);
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  // ==================== PUBLIC API ====================

  async getScalingMetrics(): Promise<{
    currentInstances: Record<string, number>;
    totalInstances: number;
    totalCost: number;
    averageUtilization: number;
    scalingEvents: number;
    efficiency: number;
  }> {
    const currentInstances: Record<string, number> = {};
    let totalInstances = 0;
    let totalCost = 0;
    
    for (const region of this.config.regions) {
      const instances = this.currentInstances.get(region.region) || region.minInstances;
      currentInstances[region.region] = instances;
      totalInstances += instances;
      totalCost += this.calculateRegionCost(region.region, instances);
    }
    
    const recentMetrics = this.metrics.filter(m => m.timestamp > Date.now() - 3600000); // Last hour
    const averageUtilization = recentMetrics.length > 0 ? 
      recentMetrics.reduce((sum, m) => sum + m.cpuUtilization, 0) / recentMetrics.length : 0;
    
    const recentEvents = this.events.filter(e => e.timestamp > Date.now() - 3600000);
    const scalingEvents = recentEvents.length;
    
    // Calculate efficiency (utilization vs cost)
    const efficiency = averageUtilization > 0 ? averageUtilization / (totalCost * 100) : 0;
    
    return {
      currentInstances,
      totalInstances,
      totalCost: Math.round(totalCost * 100) / 100,
      averageUtilization: Math.round(averageUtilization * 100) / 100,
      scalingEvents,
      efficiency: Math.round(efficiency * 10000) / 100 // Convert to percentage
    };
  }

  async getScalingEvents(region?: string, hours: number = 24): Promise<ScalingEvent[]> {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    let events = this.events.filter(e => e.timestamp > cutoffTime);
    
    if (region) {
      events = events.filter(e => e.region === region);
    }
    
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  async updateConfig(newConfig: Partial<AutoScalingConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    console.log('✅ Auto-scaling configuration updated');
  }

  getConfig(): AutoScalingConfig {
    return this.config;
  }

  // Initialize instance counts for all regions
  async initializeRegions(): Promise<void> {
    for (const regionConfig of this.config.regions) {
      if (regionConfig.enabled && !this.currentInstances.has(regionConfig.region)) {
        this.currentInstances.set(regionConfig.region, regionConfig.minInstances);
      }
    }
    
    console.log(`🌍 Auto-scaling initialized for ${this.currentInstances.size} regions`);
  }
}

export default AutoScalingEngine;