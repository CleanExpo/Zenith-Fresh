// Cost Optimization Engine - Global Scale Infrastructure
// Enterprise-grade cost management and optimization system

// ==================== COST OPTIMIZATION TYPES ====================

export interface CostMetric {
  id: string;
  timestamp: number;
  region: string;
  service: string;
  resourceType: 'compute' | 'storage' | 'network' | 'database' | 'cache' | 'cdn' | 'monitoring';
  cost: number;
  usage: number;
  unit: string;
  billingPeriod: 'hourly' | 'daily' | 'monthly';
  tags: Record<string, string>;
}

export interface CostOptimizationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  resourceTypes: string[];
  conditions: CostCondition[];
  actions: CostAction[];
  savingsPotential: number;
  automationLevel: 'manual' | 'approval_required' | 'automatic';
}

export interface CostCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  timeWindow: number; // in minutes
  evaluationPeriods: number;
}

export interface CostAction {
  type: 'scale_down' | 'rightsizing' | 'schedule' | 'terminate' | 'migrate' | 'optimize';
  parameters: Record<string, any>;
  estimatedSavings: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CostBudget {
  id: string;
  name: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  filters: {
    regions?: string[];
    services?: string[];
    resourceTypes?: string[];
    tags?: Record<string, string>;
  };
  alerts: BudgetAlert[];
  currentSpend: number;
  projectedSpend: number;
  utilizationRate: number;
}

export interface BudgetAlert {
  threshold: number; // percentage of budget
  type: 'email' | 'slack' | 'webhook' | 'pagerduty';
  recipients: string[];
  triggered: boolean;
  lastTriggered?: number;
}

export interface CostRecommendation {
  id: string;
  type: 'rightsizing' | 'scheduling' | 'reserved_instances' | 'spot_instances' | 'storage_optimization' | 'network_optimization';
  resource: string;
  region: string;
  service: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  currentCost: number;
  projectedCost: number;
  monthlySavings: number;
  yearlySpendingRate: number;
  confidence: number;
  implementationEffort: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  actions: string[];
  status: 'pending' | 'implemented' | 'dismissed' | 'in_progress';
  createdAt: number;
  implementedAt?: number;
}

export interface CostForecast {
  period: string;
  startDate: number;
  endDate: number;
  projectedCost: number;
  confidence: number;
  breakdown: {
    region: Record<string, number>;
    service: Record<string, number>;
    resourceType: Record<string, number>;
  };
  assumptions: string[];
  factors: ForecastFactor[];
}

export interface ForecastFactor {
  name: string;
  impact: number; // percentage impact on forecast
  description: string;
}

// ==================== COST OPTIMIZATION ENGINE ====================

export class CostOptimizationEngine {
  private static instance: CostOptimizationEngine;
  private costMetrics: CostMetric[] = [];
  private optimizationRules: Map<string, CostOptimizationRule> = new Map();
  private budgets: Map<string, CostBudget> = new Map();
  private recommendations: CostRecommendation[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeOptimizationRules();
    this.initializeBudgets();
    this.startCostMonitoring();
  }

  static getInstance(): CostOptimizationEngine {
    if (!CostOptimizationEngine.instance) {
      CostOptimizationEngine.instance = new CostOptimizationEngine();
    }
    return CostOptimizationEngine.instance;
  }

  private initializeOptimizationRules(): void {
    const rules: CostOptimizationRule[] = [
      {
        id: 'unused-resources',
        name: 'Unused Resources Detection',
        description: 'Identify and terminate unused compute resources',
        enabled: true,
        priority: 'high',
        resourceTypes: ['compute'],
        conditions: [
          {
            metric: 'cpu_utilization',
            operator: 'lt',
            threshold: 5,
            timeWindow: 1440, // 24 hours
            evaluationPeriods: 7
          },
          {
            metric: 'network_usage',
            operator: 'lt',
            threshold: 1,
            timeWindow: 1440,
            evaluationPeriods: 7
          }
        ],
        actions: [
          {
            type: 'terminate',
            parameters: { grace_period: 24 },
            estimatedSavings: 100,
            riskLevel: 'low'
          }
        ],
        savingsPotential: 15,
        automationLevel: 'approval_required'
      },
      {
        id: 'rightsizing-compute',
        name: 'Compute Rightsizing',
        description: 'Optimize instance sizes based on actual usage',
        enabled: true,
        priority: 'medium',
        resourceTypes: ['compute'],
        conditions: [
          {
            metric: 'cpu_utilization',
            operator: 'lt',
            threshold: 20,
            timeWindow: 10080, // 7 days
            evaluationPeriods: 14
          }
        ],
        actions: [
          {
            type: 'rightsizing',
            parameters: { target_utilization: 70 },
            estimatedSavings: 30,
            riskLevel: 'medium'
          }
        ],
        savingsPotential: 25,
        automationLevel: 'approval_required'
      },
      {
        id: 'storage-lifecycle',
        name: 'Storage Lifecycle Management',
        description: 'Optimize storage costs through intelligent tiering',
        enabled: true,
        priority: 'medium',
        resourceTypes: ['storage'],
        conditions: [
          {
            metric: 'access_frequency',
            operator: 'lt',
            threshold: 1,
            timeWindow: 4320, // 30 days
            evaluationPeriods: 1
          }
        ],
        actions: [
          {
            type: 'migrate',
            parameters: { target_tier: 'cold_storage' },
            estimatedSavings: 60,
            riskLevel: 'low'
          }
        ],
        savingsPotential: 40,
        automationLevel: 'automatic'
      },
      {
        id: 'scheduled-scaling',
        name: 'Scheduled Resource Scaling',
        description: 'Scale resources based on predictable usage patterns',
        enabled: true,
        priority: 'high',
        resourceTypes: ['compute', 'database'],
        conditions: [
          {
            metric: 'usage_pattern_predictability',
            operator: 'gt',
            threshold: 80,
            timeWindow: 10080, // 7 days
            evaluationPeriods: 4
          }
        ],
        actions: [
          {
            type: 'schedule',
            parameters: { 
              scale_down_hours: '18:00-08:00',
              scale_down_ratio: 0.5,
              weekend_scaling: true
            },
            estimatedSavings: 40,
            riskLevel: 'low'
          }
        ],
        savingsPotential: 35,
        automationLevel: 'automatic'
      },
      {
        id: 'spot-instance-optimization',
        name: 'Spot Instance Optimization',
        description: 'Migrate suitable workloads to spot instances',
        enabled: true,
        priority: 'medium',
        resourceTypes: ['compute'],
        conditions: [
          {
            metric: 'fault_tolerance',
            operator: 'gt',
            threshold: 80,
            timeWindow: 1440,
            evaluationPeriods: 1
          },
          {
            metric: 'workload_interruptibility',
            operator: 'gt',
            threshold: 70,
            timeWindow: 1440,
            evaluationPeriods: 1
          }
        ],
        actions: [
          {
            type: 'migrate',
            parameters: { target_type: 'spot_instance' },
            estimatedSavings: 70,
            riskLevel: 'medium'
          }
        ],
        savingsPotential: 60,
        automationLevel: 'approval_required'
      }
    ];

    rules.forEach(rule => {
      this.optimizationRules.set(rule.id, rule);
    });

    console.log(`💰 Cost optimization rules initialized: ${this.optimizationRules.size} rules`);
  }

  private initializeBudgets(): void {
    const budgets: CostBudget[] = [
      {
        id: 'monthly-global',
        name: 'Global Monthly Budget',
        period: 'monthly',
        amount: 50000,
        currency: 'USD',
        filters: {},
        alerts: [
          {
            threshold: 50,
            type: 'email',
            recipients: ['finance@zenith.engineer'],
            triggered: false
          },
          {
            threshold: 80,
            type: 'slack',
            recipients: ['#ops-alerts'],
            triggered: false
          },
          {
            threshold: 95,
            type: 'pagerduty',
            recipients: ['ops-team'],
            triggered: false
          }
        ],
        currentSpend: 0,
        projectedSpend: 0,
        utilizationRate: 0
      },
      {
        id: 'compute-budget',
        name: 'Compute Resources Budget',
        period: 'monthly',
        amount: 25000,
        currency: 'USD',
        filters: {
          resourceTypes: ['compute']
        },
        alerts: [
          {
            threshold: 70,
            type: 'email',
            recipients: ['ops@zenith.engineer'],
            triggered: false
          },
          {
            threshold: 90,
            type: 'slack',
            recipients: ['#infrastructure'],
            triggered: false
          }
        ],
        currentSpend: 0,
        projectedSpend: 0,
        utilizationRate: 0
      },
      {
        id: 'database-budget',
        name: 'Database Resources Budget',
        period: 'monthly',
        amount: 15000,
        currency: 'USD',
        filters: {
          resourceTypes: ['database']
        },
        alerts: [
          {
            threshold: 75,
            type: 'email',
            recipients: ['dba@zenith.engineer'],
            triggered: false
          }
        ],
        currentSpend: 0,
        projectedSpend: 0,
        utilizationRate: 0
      }
    ];

    budgets.forEach(budget => {
      this.budgets.set(budget.id, budget);
    });

    console.log(`💰 Cost budgets initialized: ${this.budgets.size} budgets`);
  }

  private startCostMonitoring(): void {
    // Collect cost metrics every hour
    this.monitoringInterval = setInterval(() => {
      this.collectCostMetrics();
      this.evaluateOptimizationRules();
      this.updateBudgets();
      this.generateRecommendations();
    }, 3600000); // 1 hour

    // Run initial collection
    this.collectCostMetrics();
    
    console.log('💰 Cost monitoring started');
  }

  // ==================== COST METRICS COLLECTION ====================

  private async collectCostMetrics(): Promise<void> {
    const timestamp = Date.now();
    const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'];
    
    for (const region of regions) {
      const regionMetrics = await this.generateRegionCostMetrics(region, timestamp);
      this.costMetrics.push(...regionMetrics);
    }

    // Keep only last 2160 metrics (90 days at hourly intervals)
    if (this.costMetrics.length > 2160) {
      this.costMetrics = this.costMetrics.slice(-2160);
    }
  }

  private async generateRegionCostMetrics(region: string, timestamp: number): Promise<CostMetric[]> {
    const metrics: CostMetric[] = [];
    const baseId = `${region}-${timestamp}`;

    // Compute costs
    const computeInstances = this.getComputeInstanceCount(region);
    const computeCost = computeInstances * this.getRegionComputeCost(region);
    
    metrics.push({
      id: `${baseId}-compute`,
      timestamp,
      region,
      service: 'compute',
      resourceType: 'compute',
      cost: computeCost,
      usage: computeInstances,
      unit: 'instances',
      billingPeriod: 'hourly',
      tags: { instance_type: 'mixed' }
    });

    // Database costs
    const dbInstances = this.getDatabaseInstanceCount(region);
    const dbCost = dbInstances * this.getRegionDatabaseCost(region);
    
    metrics.push({
      id: `${baseId}-database`,
      timestamp,
      region,
      service: 'database',
      resourceType: 'database',
      cost: dbCost,
      usage: dbInstances,
      unit: 'instances',
      billingPeriod: 'hourly',
      tags: { engine: 'postgresql' }
    });

    // Storage costs
    const storageGB = this.getStorageUsage(region);
    const storageCost = storageGB * this.getRegionStorageCost(region);
    
    metrics.push({
      id: `${baseId}-storage`,
      timestamp,
      region,
      service: 'storage',
      resourceType: 'storage',
      cost: storageCost,
      usage: storageGB,
      unit: 'GB',
      billingPeriod: 'hourly',
      tags: { type: 'mixed' }
    });

    // Network costs
    const networkGB = this.getNetworkUsage(region);
    const networkCost = networkGB * this.getRegionNetworkCost(region);
    
    metrics.push({
      id: `${baseId}-network`,
      timestamp,
      region,
      service: 'network',
      resourceType: 'network',
      cost: networkCost,
      usage: networkGB,
      unit: 'GB',
      billingPeriod: 'hourly',
      tags: { type: 'data_transfer' }
    });

    // Cache costs
    const cacheInstances = this.getCacheInstanceCount(region);
    const cacheCost = cacheInstances * this.getRegionCacheCost(region);
    
    metrics.push({
      id: `${baseId}-cache`,
      timestamp,
      region,
      service: 'cache',
      resourceType: 'cache',
      cost: cacheCost,
      usage: cacheInstances,
      unit: 'instances',
      billingPeriod: 'hourly',
      tags: { engine: 'redis' }
    });

    // CDN costs
    const cdnGB = this.getCDNUsage(region);
    const cdnCost = cdnGB * this.getRegionCDNCost(region);
    
    metrics.push({
      id: `${baseId}-cdn`,
      timestamp,
      region,
      service: 'cdn',
      resourceType: 'cdn',
      cost: cdnCost,
      usage: cdnGB,
      unit: 'GB',
      billingPeriod: 'hourly',
      tags: { provider: 'cloudflare' }
    });

    return metrics;
  }

  private getComputeInstanceCount(region: string): number {
    // Simulate instance counts based on region
    const baseCounts: Record<string, number> = {
      'us-east-1': 15,
      'us-west-2': 12,
      'eu-west-1': 8,
      'ap-southeast-1': 6,
      'ap-northeast-1': 5
    };
    
    const variation = 0.8 + (Math.random() * 0.4); // ±20% variation
    return Math.round((baseCounts[region] || 5) * variation);
  }

  private getDatabaseInstanceCount(region: string): number {
    const baseCounts: Record<string, number> = {
      'us-east-1': 3,
      'us-west-2': 2,
      'eu-west-1': 2,
      'ap-southeast-1': 1,
      'ap-northeast-1': 1
    };
    
    return baseCounts[region] || 1;
  }

  private getStorageUsage(region: string): number {
    // GB of storage used
    const baseUsage: Record<string, number> = {
      'us-east-1': 5000,
      'us-west-2': 3000,
      'eu-west-1': 2500,
      'ap-southeast-1': 1500,
      'ap-northeast-1': 1000
    };
    
    const growth = 1 + (Math.random() * 0.1); // Up to 10% growth
    return Math.round((baseUsage[region] || 1000) * growth);
  }

  private getNetworkUsage(region: string): number {
    // GB of network transfer
    const baseUsage: Record<string, number> = {
      'us-east-1': 500,
      'us-west-2': 300,
      'eu-west-1': 250,
      'ap-southeast-1': 150,
      'ap-northeast-1': 100
    };
    
    const variation = 0.7 + (Math.random() * 0.6); // ±30% variation
    return Math.round((baseUsage[region] || 100) * variation);
  }

  private getCacheInstanceCount(region: string): number {
    const baseCounts: Record<string, number> = {
      'us-east-1': 2,
      'us-west-2': 1,
      'eu-west-1': 1,
      'ap-southeast-1': 1,
      'ap-northeast-1': 1
    };
    
    return baseCounts[region] || 1;
  }

  private getCDNUsage(region: string): number {
    // GB of CDN usage
    const baseUsage: Record<string, number> = {
      'us-east-1': 1000,
      'us-west-2': 600,
      'eu-west-1': 500,
      'ap-southeast-1': 300,
      'ap-northeast-1': 200
    };
    
    const variation = 0.8 + (Math.random() * 0.4); // ±20% variation
    return Math.round((baseUsage[region] || 200) * variation);
  }

  // Regional cost multipliers (cost per unit per hour)
  private getRegionComputeCost(region: string): number {
    const costs: Record<string, number> = {
      'us-east-1': 0.12,
      'us-west-2': 0.13,
      'eu-west-1': 0.15,
      'ap-southeast-1': 0.14,
      'ap-northeast-1': 0.16
    };
    
    return costs[region] || 0.12;
  }

  private getRegionDatabaseCost(region: string): number {
    const costs: Record<string, number> = {
      'us-east-1': 0.50,
      'us-west-2': 0.55,
      'eu-west-1': 0.60,
      'ap-southeast-1': 0.58,
      'ap-northeast-1': 0.62
    };
    
    return costs[region] || 0.50;
  }

  private getRegionStorageCost(region: string): number {
    const costs: Record<string, number> = {
      'us-east-1': 0.023,
      'us-west-2': 0.025,
      'eu-west-1': 0.028,
      'ap-southeast-1': 0.026,
      'ap-northeast-1': 0.030
    };
    
    return costs[region] || 0.023;
  }

  private getRegionNetworkCost(region: string): number {
    const costs: Record<string, number> = {
      'us-east-1': 0.09,
      'us-west-2': 0.09,
      'eu-west-1': 0.09,
      'ap-southeast-1': 0.12,
      'ap-northeast-1': 0.14
    };
    
    return costs[region] || 0.09;
  }

  private getRegionCacheCost(region: string): number {
    const costs: Record<string, number> = {
      'us-east-1': 0.25,
      'us-west-2': 0.27,
      'eu-west-1': 0.30,
      'ap-southeast-1': 0.28,
      'ap-northeast-1': 0.32
    };
    
    return costs[region] || 0.25;
  }

  private getRegionCDNCost(region: string): number {
    // CDN costs are generally uniform globally
    return 0.085; // per GB
  }

  // ==================== OPTIMIZATION RULE EVALUATION ====================

  private evaluateOptimizationRules(): void {
    for (const [ruleId, rule] of this.optimizationRules) {
      if (!rule.enabled) continue;
      
      this.evaluateRule(rule);
    }
  }

  private evaluateRule(rule: CostOptimizationRule): void {
    // Get recent metrics for evaluation
    const recentMetrics = this.getRecentCostMetrics(60 * 24); // Last 24 hours
    
    for (const resourceType of rule.resourceTypes) {
      const typeMetrics = recentMetrics.filter(m => m.resourceType === resourceType);
      
      if (typeMetrics.length === 0) continue;
      
      // Group by region and service
      const groups = this.groupMetrics(typeMetrics);
      
      for (const [groupKey, groupMetrics] of groups) {
        const shouldTrigger = this.evaluateConditions(rule.conditions, groupMetrics);
        
        if (shouldTrigger) {
          this.triggerOptimizationActions(rule, groupKey, groupMetrics);
        }
      }
    }
  }

  private groupMetrics(metrics: CostMetric[]): Map<string, CostMetric[]> {
    const groups = new Map<string, CostMetric[]>();
    
    for (const metric of metrics) {
      const key = `${metric.region}-${metric.service}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      
      groups.get(key)!.push(metric);
    }
    
    return groups;
  }

  private evaluateConditions(conditions: CostCondition[], metrics: CostMetric[]): boolean {
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, metrics)) {
        return false;
      }
    }
    
    return true;
  }

  private evaluateCondition(condition: CostCondition, metrics: CostMetric[]): boolean {
    // For this simulation, we'll use simplified condition evaluation
    // In production, this would integrate with actual monitoring systems
    
    const recentMetrics = metrics.slice(-condition.evaluationPeriods);
    if (recentMetrics.length < condition.evaluationPeriods) {
      return false;
    }
    
    const avgValue = recentMetrics.reduce((sum, m) => sum + m.cost, 0) / recentMetrics.length;
    
    switch (condition.operator) {
      case 'gt':
        return avgValue > condition.threshold;
      case 'gte':
        return avgValue >= condition.threshold;
      case 'lt':
        return avgValue < condition.threshold;
      case 'lte':
        return avgValue <= condition.threshold;
      case 'eq':
        return Math.abs(avgValue - condition.threshold) < 0.01;
      default:
        return false;
    }
  }

  private triggerOptimizationActions(
    rule: CostOptimizationRule,
    groupKey: string,
    metrics: CostMetric[]
  ): void {
    const [region, service] = groupKey.split('-');
    
    for (const action of rule.actions) {
      if (rule.automationLevel === 'automatic') {
        this.executeAutomaticAction(rule, action, region, service, metrics);
      } else {
        this.createRecommendation(rule, action, region, service, metrics);
      }
    }
  }

  private executeAutomaticAction(
    rule: CostOptimizationRule,
    action: CostAction,
    region: string,
    service: string,
    metrics: CostMetric[]
  ): void {
    console.log(`🤖 Executing automatic optimization: ${rule.name} - ${action.type} in ${region}/${service}`);
    
    // In production, this would call actual cloud provider APIs
    // For now, just log the action
    
    const currentCost = metrics.reduce((sum, m) => sum + m.cost, 0) / metrics.length;
    const projectedSavings = currentCost * (action.estimatedSavings / 100);
    
    console.log(`   Estimated savings: $${projectedSavings.toFixed(2)}/hour`);
  }

  private createRecommendation(
    rule: CostOptimizationRule,
    action: CostAction,
    region: string,
    service: string,
    metrics: CostMetric[]
  ): void {
    const currentCost = metrics.reduce((sum, m) => sum + m.cost, 0) / metrics.length;
    const projectedCost = currentCost * (1 - action.estimatedSavings / 100);
    const monthlySavings = (currentCost - projectedCost) * 24 * 30; // Convert to monthly
    
    const recommendation: CostRecommendation = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: this.mapActionTypeToRecommendationType(action.type),
      resource: `${service}-${region}`,
      region,
      service,
      priority: rule.priority,
      description: `${rule.description} - ${action.type}`,
      currentCost: currentCost * 24 * 30, // Monthly cost
      projectedCost: projectedCost * 24 * 30, // Monthly cost
      monthlySavings,
      yearlySpendingRate: currentCost * 24 * 365,
      confidence: this.calculateRecommendationConfidence(rule, metrics),
      implementationEffort: this.mapRiskToEffort(action.riskLevel),
      riskLevel: action.riskLevel,
      actions: [
        `Apply ${action.type} optimization`,
        `Monitor performance impact`,
        `Verify cost reduction`
      ],
      status: 'pending',
      createdAt: Date.now()
    };
    
    this.recommendations.push(recommendation);
    console.log(`💡 Recommendation created: ${recommendation.description} - $${monthlySavings.toFixed(2)}/month savings`);
  }

  private mapActionTypeToRecommendationType(actionType: string): CostRecommendation['type'] {
    const mapping: Record<string, CostRecommendation['type']> = {
      'rightsizing': 'rightsizing',
      'schedule': 'scheduling',
      'migrate': 'spot_instances',
      'optimize': 'storage_optimization',
      'terminate': 'rightsizing'
    };
    
    return mapping[actionType] || 'rightsizing';
  }

  private mapRiskToEffort(riskLevel: string): 'low' | 'medium' | 'high' {
    const mapping: Record<string, 'low' | 'medium' | 'high'> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high'
    };
    
    return mapping[riskLevel] || 'medium';
  }

  private calculateRecommendationConfidence(rule: CostOptimizationRule, metrics: CostMetric[]): number {
    // Base confidence on rule priority and data quality
    let confidence = 0.5;
    
    if (rule.priority === 'critical') confidence += 0.3;
    else if (rule.priority === 'high') confidence += 0.2;
    else if (rule.priority === 'medium') confidence += 0.1;
    
    // Increase confidence with more data points
    if (metrics.length > 100) confidence += 0.2;
    else if (metrics.length > 50) confidence += 0.1;
    
    return Math.min(0.95, confidence);
  }

  // ==================== BUDGET MANAGEMENT ====================

  private updateBudgets(): void {
    for (const [budgetId, budget] of this.budgets) {
      this.updateBudget(budget);
    }
  }

  private updateBudget(budget: CostBudget): void {
    const now = Date.now();
    const periodStart = this.getBudgetPeriodStart(budget.period, now);
    const periodEnd = this.getBudgetPeriodEnd(budget.period, periodStart);
    
    // Calculate current spend
    const periodMetrics = this.costMetrics.filter(m => 
      m.timestamp >= periodStart && 
      m.timestamp < periodEnd &&
      this.matchesBudgetFilters(m, budget.filters)
    );
    
    budget.currentSpend = periodMetrics.reduce((sum, m) => sum + m.cost, 0);
    
    // Calculate projected spend
    const elapsedTime = now - periodStart;
    const totalTime = periodEnd - periodStart;
    const projectionRatio = totalTime / elapsedTime;
    budget.projectedSpend = budget.currentSpend * projectionRatio;
    
    // Calculate utilization rate
    budget.utilizationRate = (budget.currentSpend / budget.amount) * 100;
    
    // Check alert thresholds
    this.checkBudgetAlerts(budget);
  }

  private getBudgetPeriodStart(period: string, timestamp: number): number {
    const date = new Date(timestamp);
    
    switch (period) {
      case 'daily':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      case 'weekly':
        const dayOfWeek = date.getDay();
        const startOfWeek = new Date(date.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000));
        return new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate()).getTime();
      case 'monthly':
        return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3);
        return new Date(date.getFullYear(), quarter * 3, 1).getTime();
      case 'yearly':
        return new Date(date.getFullYear(), 0, 1).getTime();
      default:
        return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    }
  }

  private getBudgetPeriodEnd(period: string, periodStart: number): number {
    const startDate = new Date(periodStart);
    
    switch (period) {
      case 'daily':
        return new Date(startDate.getTime() + (24 * 60 * 60 * 1000)).getTime();
      case 'weekly':
        return new Date(startDate.getTime() + (7 * 24 * 60 * 60 * 1000)).getTime();
      case 'monthly':
        return new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1).getTime();
      case 'quarterly':
        return new Date(startDate.getFullYear(), startDate.getMonth() + 3, 1).getTime();
      case 'yearly':
        return new Date(startDate.getFullYear() + 1, 0, 1).getTime();
      default:
        return new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1).getTime();
    }
  }

  private matchesBudgetFilters(metric: CostMetric, filters: CostBudget['filters']): boolean {
    if (filters.regions && !filters.regions.includes(metric.region)) {
      return false;
    }
    
    if (filters.services && !filters.services.includes(metric.service)) {
      return false;
    }
    
    if (filters.resourceTypes && !filters.resourceTypes.includes(metric.resourceType)) {
      return false;
    }
    
    if (filters.tags) {
      for (const [key, value] of Object.entries(filters.tags)) {
        if (metric.tags[key] !== value) {
          return false;
        }
      }
    }
    
    return true;
  }

  private checkBudgetAlerts(budget: CostBudget): void {
    for (const alert of budget.alerts) {
      const shouldTrigger = budget.utilizationRate >= alert.threshold;
      
      if (shouldTrigger && !alert.triggered) {
        this.triggerBudgetAlert(budget, alert);
        alert.triggered = true;
        alert.lastTriggered = Date.now();
      } else if (!shouldTrigger && alert.triggered) {
        alert.triggered = false;
      }
    }
  }

  private triggerBudgetAlert(budget: CostBudget, alert: BudgetAlert): void {
    const message = `Budget Alert: ${budget.name} has reached ${alert.threshold}% of budget ($${budget.currentSpend.toFixed(2)}/$${budget.amount})`;
    
    console.log(`🚨 ${message}`);
    
    // In production, send actual notifications
    for (const recipient of alert.recipients) {
      console.log(`   Sending ${alert.type} notification to: ${recipient}`);
    }
  }

  // ==================== COST FORECASTING ====================

  async generateCostForecast(
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    forecastDays: number = 30
  ): Promise<CostForecast> {
    const historicalDays = 90;
    const historicalMetrics = this.getRecentCostMetrics(historicalDays * 24);
    
    if (historicalMetrics.length === 0) {
      throw new Error('Insufficient historical data for forecasting');
    }
    
    const startDate = Date.now();
    const endDate = startDate + (forecastDays * 24 * 60 * 60 * 1000);
    
    // Calculate trend from historical data
    const dailyCosts = this.aggregateDailyCosts(historicalMetrics);
    const trend = this.calculateTrend(dailyCosts);
    
    // Calculate base projection
    const recentAvgCost = dailyCosts.slice(-7).reduce((sum, cost) => sum + cost, 0) / 7;
    const projectedDailyCost = recentAvgCost * (1 + trend);
    const projectedTotalCost = projectedDailyCost * forecastDays;
    
    // Calculate breakdown by region, service, and resource type
    const breakdown = this.calculateCostBreakdown(historicalMetrics, projectedTotalCost);
    
    // Determine confidence based on historical variance
    const confidence = this.calculateForecastConfidence(dailyCosts, trend);
    
    // Identify forecast factors
    const factors = this.identifyForecastFactors(historicalMetrics, trend);
    
    return {
      period: `${forecastDays} days`,
      startDate,
      endDate,
      projectedCost: projectedTotalCost,
      confidence,
      breakdown,
      assumptions: [
        'Historical usage patterns continue',
        'No significant infrastructure changes',
        'Current pricing remains stable',
        'Seasonal patterns from historical data'
      ],
      factors
    };
  }

  private aggregateDailyCosts(metrics: CostMetric[]): number[] {
    const dailyCosts: Record<string, number> = {};
    
    for (const metric of metrics) {
      const date = new Date(metric.timestamp);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      
      if (!dailyCosts[dayKey]) {
        dailyCosts[dayKey] = 0;
      }
      
      dailyCosts[dayKey] += metric.cost;
    }
    
    return Object.values(dailyCosts);
  }

  private calculateTrend(dailyCosts: number[]): number {
    if (dailyCosts.length < 7) return 0;
    
    const recentWeek = dailyCosts.slice(-7);
    const previousWeek = dailyCosts.slice(-14, -7);
    
    if (previousWeek.length < 7) return 0;
    
    const recentAvg = recentWeek.reduce((sum, cost) => sum + cost, 0) / 7;
    const previousAvg = previousWeek.reduce((sum, cost) => sum + cost, 0) / 7;
    
    return (recentAvg - previousAvg) / previousAvg;
  }

  private calculateCostBreakdown(
    historicalMetrics: CostMetric[],
    projectedTotal: number
  ): CostForecast['breakdown'] {
    const recentMetrics = historicalMetrics.slice(-168); // Last week
    
    const totalHistorical = recentMetrics.reduce((sum, m) => sum + m.cost, 0);
    
    const regionBreakdown: Record<string, number> = {};
    const serviceBreakdown: Record<string, number> = {};
    const resourceTypeBreakdown: Record<string, number> = {};
    
    // Calculate proportions from historical data
    for (const metric of recentMetrics) {
      const regionRatio = metric.cost / totalHistorical;
      const serviceRatio = metric.cost / totalHistorical;
      const resourceRatio = metric.cost / totalHistorical;
      
      regionBreakdown[metric.region] = (regionBreakdown[metric.region] || 0) + (projectedTotal * regionRatio);
      serviceBreakdown[metric.service] = (serviceBreakdown[metric.service] || 0) + (projectedTotal * serviceRatio);
      resourceTypeBreakdown[metric.resourceType] = (resourceTypeBreakdown[metric.resourceType] || 0) + (projectedTotal * resourceRatio);
    }
    
    return {
      region: regionBreakdown,
      service: serviceBreakdown,
      resourceType: resourceTypeBreakdown
    };
  }

  private calculateForecastConfidence(dailyCosts: number[], trend: number): number {
    if (dailyCosts.length < 14) return 0.3;
    
    // Calculate variance in daily costs
    const avgCost = dailyCosts.reduce((sum, cost) => sum + cost, 0) / dailyCosts.length;
    const variance = dailyCosts.reduce((sum, cost) => sum + Math.pow(cost - avgCost, 2), 0) / dailyCosts.length;
    const coefficientOfVariation = Math.sqrt(variance) / avgCost;
    
    // Lower variance = higher confidence
    let confidence = Math.max(0.3, 1 - coefficientOfVariation);
    
    // Stable trends increase confidence
    if (Math.abs(trend) < 0.05) { // Less than 5% change
      confidence += 0.1;
    }
    
    // More historical data increases confidence
    if (dailyCosts.length > 60) {
      confidence += 0.1;
    }
    
    return Math.min(0.95, confidence);
  }

  private identifyForecastFactors(metrics: CostMetric[], trend: number): ForecastFactor[] {
    const factors: ForecastFactor[] = [];
    
    // Trend factor
    if (Math.abs(trend) > 0.02) {
      factors.push({
        name: 'Growth Trend',
        impact: trend * 100,
        description: `${trend > 0 ? 'Increasing' : 'Decreasing'} cost trend detected in historical data`
      });
    }
    
    // Seasonal factor (simplified)
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 10 || currentMonth <= 1) { // Q4/Q1
      factors.push({
        name: 'Seasonal Usage',
        impact: 15,
        description: 'Higher usage expected during end-of-year period'
      });
    }
    
    // Resource utilization factor
    const avgUtilization = this.calculateAverageUtilization(metrics);
    if (avgUtilization > 80) {
      factors.push({
        name: 'High Utilization',
        impact: 20,
        description: 'High resource utilization may lead to scaling needs'
      });
    }
    
    return factors;
  }

  private calculateAverageUtilization(metrics: CostMetric[]): number {
    // Simplified utilization calculation
    // In production, this would use actual utilization metrics
    const computeMetrics = metrics.filter(m => m.resourceType === 'compute');
    return computeMetrics.length > 0 ? 75 : 50; // Default values
  }

  // ==================== HELPER METHODS ====================

  private getRecentCostMetrics(hours: number): CostMetric[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.costMetrics.filter(m => m.timestamp > cutoffTime);
  }

  // ==================== PUBLIC API ====================

  async getCostSummary(timeRangeHours: number = 24): Promise<{
    totalCost: number;
    costByRegion: Record<string, number>;
    costByService: Record<string, number>;
    costByResourceType: Record<string, number>;
    trend: number;
    topCostDrivers: Array<{ name: string; cost: number; percentage: number }>;
  }> {
    const recentMetrics = this.getRecentCostMetrics(timeRangeHours);
    
    const totalCost = recentMetrics.reduce((sum, m) => sum + m.cost, 0);
    
    const costByRegion: Record<string, number> = {};
    const costByService: Record<string, number> = {};
    const costByResourceType: Record<string, number> = {};
    
    for (const metric of recentMetrics) {
      costByRegion[metric.region] = (costByRegion[metric.region] || 0) + metric.cost;
      costByService[metric.service] = (costByService[metric.service] || 0) + metric.cost;
      costByResourceType[metric.resourceType] = (costByResourceType[metric.resourceType] || 0) + metric.cost;
    }
    
    // Calculate trend
    const previousPeriodMetrics = this.costMetrics.filter(m => {
      const cutoffTime = Date.now() - (timeRangeHours * 60 * 60 * 1000);
      const previousCutoffTime = cutoffTime - (timeRangeHours * 60 * 60 * 1000);
      return m.timestamp >= previousCutoffTime && m.timestamp < cutoffTime;
    });
    
    const previousCost = previousPeriodMetrics.reduce((sum, m) => sum + m.cost, 0);
    const trend = previousCost > 0 ? ((totalCost - previousCost) / previousCost) * 100 : 0;
    
    // Top cost drivers
    const allCosts = [
      ...Object.entries(costByService).map(([name, cost]) => ({ name: `Service: ${name}`, cost })),
      ...Object.entries(costByRegion).map(([name, cost]) => ({ name: `Region: ${name}`, cost })),
      ...Object.entries(costByResourceType).map(([name, cost]) => ({ name: `Resource: ${name}`, cost }))
    ];
    
    const topCostDrivers = allCosts
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
      .map(item => ({
        name: item.name,
        cost: item.cost,
        percentage: (item.cost / totalCost) * 100
      }));
    
    return {
      totalCost: Math.round(totalCost * 100) / 100,
      costByRegion,
      costByService,
      costByResourceType,
      trend: Math.round(trend * 100) / 100,
      topCostDrivers
    };
  }

  async getBudgetStatus(): Promise<CostBudget[]> {
    return Array.from(this.budgets.values());
  }

  async getRecommendations(
    status?: 'pending' | 'implemented' | 'dismissed',
    priority?: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<CostRecommendation[]> {
    let filtered = this.recommendations;
    
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    
    if (priority) {
      filtered = filtered.filter(r => r.priority === priority);
    }
    
    return filtered.sort((a, b) => b.monthlySavings - a.monthlySavings);
  }

  async implementRecommendation(recommendationId: string): Promise<boolean> {
    const recommendation = this.recommendations.find(r => r.id === recommendationId);
    
    if (recommendation && recommendation.status === 'pending') {
      recommendation.status = 'implemented';
      recommendation.implementedAt = Date.now();
      
      console.log(`✅ Recommendation implemented: ${recommendation.description}`);
      return true;
    }
    
    return false;
  }

  async dismissRecommendation(recommendationId: string): Promise<boolean> {
    const recommendation = this.recommendations.find(r => r.id === recommendationId);
    
    if (recommendation && recommendation.status === 'pending') {
      recommendation.status = 'dismissed';
      
      console.log(`❌ Recommendation dismissed: ${recommendation.description}`);
      return true;
    }
    
    return false;
  }

  // ==================== CLEANUP ====================

  stopCostMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('🛑 Cost monitoring stopped');
  }
}

export default CostOptimizationEngine;