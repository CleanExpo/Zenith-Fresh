/**
 * Advanced Enterprise AI Platform - Model Registry
 * Centralized model management, versioning, and deployment system
 */

import { z } from 'zod';

// Model registry schemas
export const ModelRegistryEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string(),
  modelType: z.enum(['classification', 'regression', 'clustering', 'nlp', 'cv', 'multimodal']),
  framework: z.enum(['pytorch', 'tensorflow', 'scikit-learn', 'huggingface', 'onnx', 'custom']),
  size: z.number(), // in MB
  accuracy: z.number().optional(),
  performance: z.object({
    latency: z.number(), // ms
    throughput: z.number(), // requests/second
    memoryUsage: z.number(), // MB
    computeRequirements: z.object({
      cpu: z.number(),
      memory: z.number(),
      gpu: z.boolean(),
    }),
  }),
  tags: z.array(z.string()),
  metadata: z.record(z.any()),
  artifacts: z.object({
    modelFile: z.string(),
    configFile: z.string(),
    weightsFile: z.string().optional(),
    vocabFile: z.string().optional(),
    preprocessor: z.string().optional(),
    postprocessor: z.string().optional(),
  }),
  deployment: z.object({
    status: z.enum(['registered', 'staged', 'production', 'deprecated', 'archived']),
    endpoints: z.array(z.string()),
    lastDeployed: z.date().optional(),
    deploymentConfig: z.record(z.any()).optional(),
  }),
  monitoring: z.object({
    health: z.enum(['healthy', 'warning', 'critical', 'unknown']),
    lastHealthCheck: z.date().optional(),
    metrics: z.record(z.number()).optional(),
    alerts: z.array(z.string()),
  }),
  governance: z.object({
    owner: z.string(),
    approvers: z.array(z.string()),
    approvalStatus: z.enum(['pending', 'approved', 'rejected']),
    complianceChecks: z.array(z.object({
      check: z.string(),
      status: z.enum(['passed', 'failed', 'warning']),
      timestamp: z.date(),
    })),
    auditTrail: z.array(z.object({
      action: z.string(),
      user: z.string(),
      timestamp: z.date(),
      details: z.record(z.any()).optional(),
    })),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),
});

export type ModelRegistryEntry = z.infer<typeof ModelRegistryEntrySchema>;

export interface ModelComparison {
  modelA: string;
  modelB: string;
  metrics: {
    accuracy: { a: number; b: number; winner: 'a' | 'b' | 'tie' };
    latency: { a: number; b: number; winner: 'a' | 'b' | 'tie' };
    throughput: { a: number; b: number; winner: 'a' | 'b' | 'tie' };
    memoryUsage: { a: number; b: number; winner: 'a' | 'b' | 'tie' };
    overallScore: { a: number; b: number; winner: 'a' | 'b' | 'tie' };
  };
  recommendation: string;
}

export interface ModelLineage {
  modelId: string;
  parentModels: string[];
  childModels: string[];
  trainingData: {
    datasets: string[];
    version: string;
    size: number;
  };
  experimentId?: string;
  derivationMethod: 'training' | 'fine_tuning' | 'transfer_learning' | 'distillation';
}

export class ModelRegistry {
  private models: Map<string, ModelRegistryEntry> = new Map();
  private modelLineage: Map<string, ModelLineage> = new Map();
  private deploymentHistory: Map<string, Array<{
    version: string;
    timestamp: Date;
    environment: string;
    status: 'success' | 'failed' | 'rolled_back';
    details: any;
  }>> = new Map();

  // Model registration and management
  public async registerModel(entry: Omit<ModelRegistryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const registryEntry: ModelRegistryEntry = {
      ...entry,
      id: modelId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Validate the entry
    const validatedEntry = ModelRegistryEntrySchema.parse(registryEntry);
    
    // Run compliance checks
    await this.runComplianceChecks(validatedEntry);
    
    // Store the model
    this.models.set(modelId, validatedEntry);
    
    // Record audit trail
    this.recordAuditAction(modelId, 'model_registered', validatedEntry.createdBy, {
      version: validatedEntry.version,
      framework: validatedEntry.framework,
    });
    
    return modelId;
  }

  public async updateModel(modelId: string, updates: Partial<ModelRegistryEntry>, updatedBy: string): Promise<void> {
    const existingModel = this.models.get(modelId);
    if (!existingModel) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    const updatedModel: ModelRegistryEntry = {
      ...existingModel,
      ...updates,
      id: modelId, // Ensure ID doesn't change
      updatedAt: new Date(),
      updatedBy,
    };
    
    // Validate the updated entry
    const validatedEntry = ModelRegistryEntrySchema.parse(updatedModel);
    
    // Store the updated model
    this.models.set(modelId, validatedEntry);
    
    // Record audit trail
    this.recordAuditAction(modelId, 'model_updated', updatedBy, updates);
  }

  public getModel(modelId: string): ModelRegistryEntry | null {
    return this.models.get(modelId) || null;
  }

  public listModels(filters?: {
    modelType?: string;
    framework?: string;
    status?: string;
    owner?: string;
    tags?: string[];
  }): ModelRegistryEntry[] {
    let models = Array.from(this.models.values());
    
    if (filters) {
      if (filters.modelType) {
        models = models.filter(m => m.modelType === filters.modelType);
      }
      if (filters.framework) {
        models = models.filter(m => m.framework === filters.framework);
      }
      if (filters.status) {
        models = models.filter(m => m.deployment.status === filters.status);
      }
      if (filters.owner) {
        models = models.filter(m => m.governance.owner === filters.owner);
      }
      if (filters.tags && filters.tags.length > 0) {
        models = models.filter(m => 
          filters.tags!.some(tag => m.tags.includes(tag))
        );
      }
    }
    
    return models.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  public async deleteModel(modelId: string, deletedBy: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    // Check if model is in production
    if (model.deployment.status === 'production') {
      throw new Error('Cannot delete model in production. Please deprecate it first.');
    }
    
    // Remove model
    this.models.delete(modelId);
    this.modelLineage.delete(modelId);
    this.deploymentHistory.delete(modelId);
    
    // Record audit trail
    this.recordAuditAction(modelId, 'model_deleted', deletedBy);
  }

  // Model versioning
  public async createVersion(baseModelId: string, versionInfo: {
    version: string;
    changes: string;
    artifacts: ModelRegistryEntry['artifacts'];
    createdBy: string;
  }): Promise<string> {
    const baseModel = this.models.get(baseModelId);
    if (!baseModel) {
      throw new Error(`Base model ${baseModelId} not found`);
    }
    
    const versionId = `${baseModelId}_v${versionInfo.version}`;
    
    const versionedModel: ModelRegistryEntry = {
      ...baseModel,
      id: versionId,
      version: versionInfo.version,
      artifacts: versionInfo.artifacts,
      deployment: {
        ...baseModel.deployment,
        status: 'registered',
        endpoints: [],
        lastDeployed: undefined,
      },
      governance: {
        ...baseModel.governance,
        approvalStatus: 'pending',
        auditTrail: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: versionInfo.createdBy,
      updatedBy: versionInfo.createdBy,
    };
    
    this.models.set(versionId, versionedModel);
    
    // Update lineage
    const lineage: ModelLineage = {
      modelId: versionId,
      parentModels: [baseModelId],
      childModels: [],
      trainingData: {
        datasets: [],
        version: versionInfo.version,
        size: 0,
      },
      derivationMethod: 'fine_tuning',
    };
    
    this.modelLineage.set(versionId, lineage);
    
    // Update parent's children
    const parentLineage = this.modelLineage.get(baseModelId);
    if (parentLineage) {
      parentLineage.childModels.push(versionId);
    }
    
    // Record audit trail
    this.recordAuditAction(versionId, 'version_created', versionInfo.createdBy, {
      baseModel: baseModelId,
      version: versionInfo.version,
      changes: versionInfo.changes,
    });
    
    return versionId;
  }

  public getModelVersions(baseModelId: string): ModelRegistryEntry[] {
    return Array.from(this.models.values())
      .filter(model => model.id.startsWith(baseModelId) || model.id === baseModelId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Model comparison
  public async compareModels(modelIdA: string, modelIdB: string): Promise<ModelComparison> {
    const modelA = this.models.get(modelIdA);
    const modelB = this.models.get(modelIdB);
    
    if (!modelA || !modelB) {
      throw new Error('One or both models not found');
    }
    
    const comparison: ModelComparison = {
      modelA: modelIdA,
      modelB: modelIdB,
      metrics: {
        accuracy: {
          a: modelA.accuracy || 0,
          b: modelB.accuracy || 0,
          winner: (modelA.accuracy || 0) > (modelB.accuracy || 0) ? 'a' : 
                  (modelA.accuracy || 0) < (modelB.accuracy || 0) ? 'b' : 'tie',
        },
        latency: {
          a: modelA.performance.latency,
          b: modelB.performance.latency,
          winner: modelA.performance.latency < modelB.performance.latency ? 'a' : 
                  modelA.performance.latency > modelB.performance.latency ? 'b' : 'tie',
        },
        throughput: {
          a: modelA.performance.throughput,
          b: modelB.performance.throughput,
          winner: modelA.performance.throughput > modelB.performance.throughput ? 'a' : 
                  modelA.performance.throughput < modelB.performance.throughput ? 'b' : 'tie',
        },
        memoryUsage: {
          a: modelA.performance.memoryUsage,
          b: modelB.performance.memoryUsage,
          winner: modelA.performance.memoryUsage < modelB.performance.memoryUsage ? 'a' : 
                  modelA.performance.memoryUsage > modelB.performance.memoryUsage ? 'b' : 'tie',
        },
        overallScore: { a: 0, b: 0, winner: 'tie' },
      },
      recommendation: '',
    };
    
    // Calculate overall scores
    const scoreA = this.calculateOverallScore(modelA);
    const scoreB = this.calculateOverallScore(modelB);
    
    comparison.metrics.overallScore = {
      a: scoreA,
      b: scoreB,
      winner: scoreA > scoreB ? 'a' : scoreA < scoreB ? 'b' : 'tie',
    };
    
    // Generate recommendation
    comparison.recommendation = this.generateRecommendation(comparison);
    
    return comparison;
  }

  private calculateOverallScore(model: ModelRegistryEntry): number {
    const accuracy = model.accuracy || 0;
    const latencyScore = Math.max(0, 1 - (model.performance.latency / 1000));
    const throughputScore = Math.min(1, model.performance.throughput / 1000);
    const memoryScore = Math.max(0, 1 - (model.performance.memoryUsage / 1000));
    
    return (accuracy * 0.4 + latencyScore * 0.2 + throughputScore * 0.2 + memoryScore * 0.2);
  }

  private generateRecommendation(comparison: ModelComparison): string {
    const { metrics } = comparison;
    
    if (metrics.overallScore.winner === 'a') {
      return `Model A is recommended based on overall performance. It excels in ${this.getWinningMetrics('a', metrics).join(', ')}.`;
    } else if (metrics.overallScore.winner === 'b') {
      return `Model B is recommended based on overall performance. It excels in ${this.getWinningMetrics('b', metrics).join(', ')}.`;
    } else {
      return 'Both models have similar overall performance. Consider specific use case requirements for selection.';
    }
  }

  private getWinningMetrics(winner: 'a' | 'b', metrics: ModelComparison['metrics']): string[] {
    const winningMetrics: string[] = [];
    
    Object.entries(metrics).forEach(([key, value]) => {
      if (key !== 'overallScore' && value.winner === winner) {
        winningMetrics.push(key);
      }
    });
    
    return winningMetrics;
  }

  // Model deployment
  public async promoteModel(modelId: string, targetStage: 'staged' | 'production', promotedBy: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    // Check approval status
    if (targetStage === 'production' && model.governance.approvalStatus !== 'approved') {
      throw new Error('Model must be approved before production deployment');
    }
    
    // Update deployment status
    model.deployment.status = targetStage;
    model.deployment.lastDeployed = new Date();
    model.updatedAt = new Date();
    model.updatedBy = promotedBy;
    
    // Record deployment history
    this.recordDeployment(modelId, {
      version: model.version,
      timestamp: new Date(),
      environment: targetStage,
      status: 'success',
      details: { promotedBy },
    });
    
    // Record audit trail
    this.recordAuditAction(modelId, 'model_promoted', promotedBy, {
      targetStage,
      version: model.version,
    });
  }

  public async rollbackModel(modelId: string, targetVersion: string, rolledBackBy: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    const targetModel = this.models.get(`${modelId}_v${targetVersion}`);
    if (!targetModel) {
      throw new Error(`Target version ${targetVersion} not found`);
    }
    
    // Update deployment to target version
    model.deployment.status = 'production';
    model.deployment.lastDeployed = new Date();
    model.version = targetVersion;
    model.artifacts = targetModel.artifacts;
    model.updatedAt = new Date();
    model.updatedBy = rolledBackBy;
    
    // Record deployment history
    this.recordDeployment(modelId, {
      version: targetVersion,
      timestamp: new Date(),
      environment: 'production',
      status: 'rolled_back',
      details: { rolledBackBy, previousVersion: model.version },
    });
    
    // Record audit trail
    this.recordAuditAction(modelId, 'model_rolled_back', rolledBackBy, {
      targetVersion,
      previousVersion: model.version,
    });
  }

  // Model governance
  public async approveModel(modelId: string, approver: string, comments?: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    model.governance.approvalStatus = 'approved';
    model.governance.approvers.push(approver);
    model.updatedAt = new Date();
    
    // Record audit trail
    this.recordAuditAction(modelId, 'model_approved', approver, { comments });
  }

  public async rejectModel(modelId: string, approver: string, reason: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    model.governance.approvalStatus = 'rejected';
    model.updatedAt = new Date();
    
    // Record audit trail
    this.recordAuditAction(modelId, 'model_rejected', approver, { reason });
  }

  private async runComplianceChecks(model: ModelRegistryEntry): Promise<void> {
    const checks = [
      { name: 'bias_detection', required: true },
      { name: 'security_scan', required: true },
      { name: 'performance_benchmark', required: false },
      { name: 'documentation_complete', required: true },
    ];
    
    for (const check of checks) {
      const result = await this.executeComplianceCheck(model, check.name);
      
      model.governance.complianceChecks.push({
        check: check.name,
        status: result.passed ? 'passed' : check.required ? 'failed' : 'warning',
        timestamp: new Date(),
      });
    }
  }

  private async executeComplianceCheck(model: ModelRegistryEntry, checkName: string): Promise<{ passed: boolean; details?: any }> {
    // Implementation for various compliance checks
    switch (checkName) {
      case 'bias_detection':
        return { passed: true }; // Simulate bias detection
      case 'security_scan':
        return { passed: true }; // Simulate security scan
      case 'performance_benchmark':
        return { passed: model.accuracy ? model.accuracy > 0.8 : false };
      case 'documentation_complete':
        return { passed: !!model.description && model.tags.length > 0 };
      default:
        return { passed: true };
    }
  }

  // Model monitoring
  public async updateModelHealth(modelId: string, healthStatus: 'healthy' | 'warning' | 'critical', metrics?: Record<string, number>): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    model.monitoring.health = healthStatus;
    model.monitoring.lastHealthCheck = new Date();
    if (metrics) {
      model.monitoring.metrics = { ...model.monitoring.metrics, ...metrics };
    }
    model.updatedAt = new Date();
  }

  public async addModelAlert(modelId: string, alert: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    model.monitoring.alerts.push(alert);
    model.updatedAt = new Date();
  }

  public getModelHealth(modelId: string): ModelRegistryEntry['monitoring'] | null {
    const model = this.models.get(modelId);
    return model ? model.monitoring : null;
  }

  // Lineage tracking
  public setModelLineage(modelId: string, lineage: ModelLineage): void {
    this.modelLineage.set(modelId, lineage);
  }

  public getModelLineage(modelId: string): ModelLineage | null {
    return this.modelLineage.get(modelId) || null;
  }

  public getFullLineage(modelId: string): {
    ancestors: string[];
    descendants: string[];
    lineageTree: any;
  } {
    const ancestors = this.getAncestors(modelId);
    const descendants = this.getDescendants(modelId);
    const lineageTree = this.buildLineageTree(modelId);
    
    return { ancestors, descendants, lineageTree };
  }

  private getAncestors(modelId: string): string[] {
    const ancestors: string[] = [];
    const visited = new Set<string>();
    
    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const lineage = this.modelLineage.get(id);
      if (lineage) {
        lineage.parentModels.forEach(parentId => {
          if (!ancestors.includes(parentId)) {
            ancestors.push(parentId);
            traverse(parentId);
          }
        });
      }
    };
    
    traverse(modelId);
    return ancestors;
  }

  private getDescendants(modelId: string): string[] {
    const descendants: string[] = [];
    const visited = new Set<string>();
    
    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const lineage = this.modelLineage.get(id);
      if (lineage) {
        lineage.childModels.forEach(childId => {
          if (!descendants.includes(childId)) {
            descendants.push(childId);
            traverse(childId);
          }
        });
      }
    };
    
    traverse(modelId);
    return descendants;
  }

  private buildLineageTree(modelId: string): any {
    const lineage = this.modelLineage.get(modelId);
    if (!lineage) return null;
    
    return {
      modelId,
      parents: lineage.parentModels.map(parentId => this.buildLineageTree(parentId)),
      children: lineage.childModels.map(childId => this.buildLineageTree(childId)),
    };
  }

  // Audit and history
  private recordAuditAction(modelId: string, action: string, user: string, details?: any): void {
    const model = this.models.get(modelId);
    if (model) {
      model.governance.auditTrail.push({
        action,
        user,
        timestamp: new Date(),
        details,
      });
    }
  }

  private recordDeployment(modelId: string, deployment: {
    version: string;
    timestamp: Date;
    environment: string;
    status: 'success' | 'failed' | 'rolled_back';
    details: any;
  }): void {
    const history = this.deploymentHistory.get(modelId) || [];
    history.push(deployment);
    this.deploymentHistory.set(modelId, history);
  }

  public getAuditTrail(modelId: string): ModelRegistryEntry['governance']['auditTrail'] | null {
    const model = this.models.get(modelId);
    return model ? model.governance.auditTrail : null;
  }

  public getDeploymentHistory(modelId: string): Array<{
    version: string;
    timestamp: Date;
    environment: string;
    status: 'success' | 'failed' | 'rolled_back';
    details: any;
  }> {
    return this.deploymentHistory.get(modelId) || [];
  }

  // Analytics and reporting
  public getRegistryAnalytics(): {
    totalModels: number;
    modelsByType: Record<string, number>;
    modelsByFramework: Record<string, number>;
    modelsByStatus: Record<string, number>;
    averageAccuracy: number;
    topPerformingModels: Array<{ id: string; score: number }>;
    complianceRate: number;
  } {
    const models = Array.from(this.models.values());
    
    const modelsByType = models.reduce((acc, model) => {
      acc[model.modelType] = (acc[model.modelType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const modelsByFramework = models.reduce((acc, model) => {
      acc[model.framework] = (acc[model.framework] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const modelsByStatus = models.reduce((acc, model) => {
      acc[model.deployment.status] = (acc[model.deployment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const averageAccuracy = models.reduce((acc, model) => acc + (model.accuracy || 0), 0) / models.length;
    
    const topPerformingModels = models
      .map(model => ({ id: model.id, score: this.calculateOverallScore(model) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    const approvedModels = models.filter(m => m.governance.approvalStatus === 'approved').length;
    const complianceRate = approvedModels / models.length;
    
    return {
      totalModels: models.length,
      modelsByType,
      modelsByFramework,
      modelsByStatus,
      averageAccuracy,
      topPerformingModels,
      complianceRate,
    };
  }

  // Cleanup methods
  public cleanup(): void {
    this.models.clear();
    this.modelLineage.clear();
    this.deploymentHistory.clear();
  }
}

// Singleton instance
export const modelRegistry = new ModelRegistry();