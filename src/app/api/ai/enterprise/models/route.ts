/**
 * Advanced Enterprise AI Platform - Model Management API
 * Handles model training, deployment, and management operations
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { z } from 'zod';
import { modelTrainingEngine } from '@/lib/ai/training/model-training-engine';
import { modelRegistry } from '@/lib/ai/training/model-registry';

// Request schemas
const CreateModelRequestSchema = z.object({
  modelName: z.string().min(1),
  baseModel: z.string().min(1),
  trainingData: z.object({
    source: z.enum(['upload', 'database', 'api', 'synthetic']),
    format: z.enum(['json', 'csv', 'parquet', 'jsonl']),
    path: z.string().optional(),
    query: z.string().optional(),
    size: z.number().optional(),
  }),
  hyperparameters: z.object({
    learningRate: z.number().default(0.001),
    batchSize: z.number().default(32),
    epochs: z.number().default(10),
    validationSplit: z.number().min(0).max(1).default(0.2),
    earlyStopping: z.boolean().default(true),
    patience: z.number().default(5),
    optimizer: z.enum(['adam', 'sgd', 'rmsprop']).default('adam'),
    lossFunction: z.string().default('categorical_crossentropy'),
  }).optional(),
  computeConfig: z.object({
    gpuCount: z.number().default(1),
    cpuCount: z.number().default(4),
    memoryGB: z.number().default(16),
    instanceType: z.enum(['standard', 'compute_optimized', 'memory_optimized', 'gpu_optimized']).default('standard'),
  }).optional(),
  outputConfig: z.object({
    modelFormat: z.enum(['pytorch', 'tensorflow', 'onnx', 'huggingface']).default('pytorch'),
    compressionType: z.enum(['none', 'quantization', 'pruning', 'distillation']).default('none'),
    deploymentTarget: z.enum(['cloud', 'edge', 'mobile', 'web']).default('cloud'),
  }).optional(),
});

const RegisterModelRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  version: z.string(),
  modelType: z.enum(['classification', 'regression', 'clustering', 'nlp', 'cv', 'multimodal']),
  framework: z.enum(['pytorch', 'tensorflow', 'scikit-learn', 'huggingface', 'onnx', 'custom']),
  size: z.number(),
  accuracy: z.number().optional(),
  performance: z.object({
    latency: z.number(),
    throughput: z.number(),
    memoryUsage: z.number(),
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
  createdBy: z.string(),
});

const DeployModelRequestSchema = z.object({
  environment: z.enum(['staging', 'production']),
  scalingConfig: z.object({
    minInstances: z.number(),
    maxInstances: z.number(),
    targetUtilization: z.number(),
  }),
  endpoint: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...requestData } = body;

    switch (action) {
      case 'create':
        const createRequest = CreateModelRequestSchema.parse(requestData);
        const modelId = await modelTrainingEngine.createModel(createRequest);
        
        return NextResponse.json({
          success: true,
          modelId,
          message: 'Model training started successfully',
          timestamp: new Date().toISOString(),
        });

      case 'register':
        const registerRequest = RegisterModelRequestSchema.parse(requestData);
        const registryId = await modelRegistry.registerModel(registerRequest);
        
        return NextResponse.json({
          success: true,
          registryId,
          message: 'Model registered successfully',
          timestamp: new Date().toISOString(),
        });

      case 'deploy':
        const { modelId: deployModelId, ...deployConfig } = requestData;
        const deployRequest = DeployModelRequestSchema.parse(deployConfig);
        const endpointUrl = await modelTrainingEngine.deployModel(deployModelId, deployRequest);
        
        return NextResponse.json({
          success: true,
          endpointUrl,
          message: 'Model deployed successfully',
          timestamp: new Date().toISOString(),
        });

      case 'stop_training':
        const { jobId } = requestData;
        const stopped = await modelTrainingEngine.stopTrainingJob(jobId);
        
        return NextResponse.json({
          success: stopped,
          message: stopped ? 'Training job stopped' : 'Failed to stop training job',
          timestamp: new Date().toISOString(),
        });

      case 'create_version':
        const { baseModelId, version, changes, artifacts, createdBy } = requestData;
        const versionId = await modelRegistry.createVersion(baseModelId, {
          version,
          changes,
          artifacts,
          createdBy,
        });
        
        return NextResponse.json({
          success: true,
          versionId,
          message: 'Model version created successfully',
          timestamp: new Date().toISOString(),
        });

      case 'promote':
        const { modelId: promoteModelId, targetStage, promotedBy } = requestData;
        await modelRegistry.promoteModel(promoteModelId, targetStage, promotedBy);
        
        return NextResponse.json({
          success: true,
          message: `Model promoted to ${targetStage}`,
          timestamp: new Date().toISOString(),
        });

      case 'rollback':
        const { modelId: rollbackModelId, targetVersion, rolledBackBy } = requestData;
        await modelRegistry.rollbackModel(rollbackModelId, targetVersion, rolledBackBy);
        
        return NextResponse.json({
          success: true,
          message: `Model rolled back to version ${targetVersion}`,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Model management error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const modelId = searchParams.get('modelId');
    const jobId = searchParams.get('jobId');

    switch (action) {
      case 'list_models':
        const models = modelTrainingEngine.listModels();
        return NextResponse.json({
          success: true,
          models,
          timestamp: new Date().toISOString(),
        });

      case 'get_model':
        if (!modelId) {
          return NextResponse.json(
            { error: 'modelId parameter is required' },
            { status: 400 }
          );
        }
        
        const model = modelTrainingEngine.getModel(modelId);
        if (!model) {
          return NextResponse.json(
            { error: 'Model not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          model,
          timestamp: new Date().toISOString(),
        });

      case 'list_training_jobs':
        const jobs = modelTrainingEngine.listTrainingJobs(modelId || undefined);
        return NextResponse.json({
          success: true,
          jobs,
          timestamp: new Date().toISOString(),
        });

      case 'get_training_job':
        if (!jobId) {
          return NextResponse.json(
            { error: 'jobId parameter is required' },
            { status: 400 }
          );
        }
        
        const job = modelTrainingEngine.getTrainingJob(jobId);
        if (!job) {
          return NextResponse.json(
            { error: 'Training job not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          job,
          timestamp: new Date().toISOString(),
        });

      case 'registry_list':
        const filters = {
          modelType: searchParams.get('modelType') || undefined,
          framework: searchParams.get('framework') || undefined,
          status: searchParams.get('status') || undefined,
          owner: searchParams.get('owner') || undefined,
          tags: searchParams.get('tags')?.split(',') || undefined,
        };
        
        const registryModels = modelRegistry.listModels(filters);
        return NextResponse.json({
          success: true,
          models: registryModels,
          timestamp: new Date().toISOString(),
        });

      case 'registry_get':
        if (!modelId) {
          return NextResponse.json(
            { error: 'modelId parameter is required' },
            { status: 400 }
          );
        }
        
        const registryModel = modelRegistry.getModel(modelId);
        if (!registryModel) {
          return NextResponse.json(
            { error: 'Model not found in registry' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          model: registryModel,
          timestamp: new Date().toISOString(),
        });

      case 'model_versions':
        if (!modelId) {
          return NextResponse.json(
            { error: 'modelId parameter is required' },
            { status: 400 }
          );
        }
        
        const versions = modelRegistry.getModelVersions(modelId);
        return NextResponse.json({
          success: true,
          versions,
          timestamp: new Date().toISOString(),
        });

      case 'compare_models':
        const modelAId = searchParams.get('modelA');
        const modelBId = searchParams.get('modelB');
        
        if (!modelAId || !modelBId) {
          return NextResponse.json(
            { error: 'Both modelA and modelB parameters are required' },
            { status: 400 }
          );
        }
        
        const comparison = await modelRegistry.compareModels(modelAId, modelBId);
        return NextResponse.json({
          success: true,
          comparison,
          timestamp: new Date().toISOString(),
        });

      case 'lineage':
        if (!modelId) {
          return NextResponse.json(
            { error: 'modelId parameter is required' },
            { status: 400 }
          );
        }
        
        const lineage = modelRegistry.getFullLineage(modelId);
        return NextResponse.json({
          success: true,
          lineage,
          timestamp: new Date().toISOString(),
        });

      case 'metrics':
        const trainingMetrics = modelTrainingEngine.getTrainingMetrics();
        const registryAnalytics = modelRegistry.getRegistryAnalytics();
        
        return NextResponse.json({
          success: true,
          metrics: {
            training: trainingMetrics,
            registry: registryAnalytics,
          },
          timestamp: new Date().toISOString(),
        });

      case 'audit_trail':
        if (!modelId) {
          return NextResponse.json(
            { error: 'modelId parameter is required' },
            { status: 400 }
          );
        }
        
        const auditTrail = modelRegistry.getAuditTrail(modelId);
        const deploymentHistory = modelRegistry.getDeploymentHistory(modelId);
        
        return NextResponse.json({
          success: true,
          auditTrail,
          deploymentHistory,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Model management API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const deletedBy = searchParams.get('deletedBy') || 'unknown';

    if (!modelId) {
      return NextResponse.json(
        { error: 'modelId parameter is required' },
        { status: 400 }
      );
    }

    // Try to delete from both training engine and registry
    const deletedFromTraining = await modelTrainingEngine.deleteModel(modelId);
    
    try {
      await modelRegistry.deleteModel(modelId, deletedBy);
    } catch (error) {
      // Model might not be in registry, continue
    }

    return NextResponse.json({
      success: deletedFromTraining,
      message: deletedFromTraining ? 'Model deleted successfully' : 'Model not found',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Model deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}