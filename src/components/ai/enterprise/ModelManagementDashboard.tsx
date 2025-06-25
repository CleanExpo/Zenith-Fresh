'use client';

/**
 * Advanced Enterprise AI Platform - Model Management Dashboard
 * Comprehensive interface for managing AI models, training, and deployment
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Play, 
  Pause, 
  Square, 
  Upload, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Filter,
  Search,
  MoreHorizontal,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Code,
  Database,
  Zap,
  Target
} from 'lucide-react';

interface Model {
  id: string;
  name: string;
  version: string;
  type: 'classification' | 'regression' | 'nlp' | 'cv' | 'multimodal';
  status: 'training' | 'completed' | 'deployed' | 'failed' | 'archived';
  framework: 'pytorch' | 'tensorflow' | 'scikit-learn' | 'huggingface';
  accuracy?: number;
  size: number; // MB
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  deploymentUrl?: string;
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    latency: number;
    throughput: number;
  };
}

interface TrainingJob {
  id: string;
  modelId: string;
  modelName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentEpoch: number;
  totalEpochs: number;
  trainingLoss: number;
  validationLoss: number;
  estimatedTimeRemaining: number;
  resourceUsage: {
    cpuUtilization: number;
    memoryUsage: number;
    gpuUtilization: number;
  };
  createdAt: Date;
}

export const ModelManagementDashboard: React.FC = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'accuracy' | 'size'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Simulate loading models and training jobs
    loadModels();
    loadTrainingJobs();

    // Set up real-time updates for training jobs
    const interval = setInterval(() => {
      updateTrainingJobs();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadModels = () => {
    const mockModels: Model[] = [
      {
        id: 'model_1',
        name: 'Customer Sentiment Analyzer',
        version: '2.1.0',
        type: 'nlp',
        status: 'deployed',
        framework: 'huggingface',
        accuracy: 0.94,
        size: 512,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        createdBy: 'john.doe@company.com',
        deploymentUrl: 'https://api.company.com/sentiment',
        metrics: {
          accuracy: 0.94,
          precision: 0.92,
          recall: 0.96,
          f1Score: 0.94,
          latency: 45,
          throughput: 1200,
        },
      },
      {
        id: 'model_2',
        name: 'Fraud Detection System',
        version: '1.5.2',
        type: 'classification',
        status: 'training',
        framework: 'pytorch',
        size: 256,
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-22'),
        createdBy: 'jane.smith@company.com',
        metrics: {
          latency: 12,
          throughput: 5000,
        },
      },
      {
        id: 'model_3',
        name: 'Price Prediction Model',
        version: '3.0.1',
        type: 'regression',
        status: 'completed',
        framework: 'scikit-learn',
        accuracy: 0.87,
        size: 48,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-25'),
        createdBy: 'bob.wilson@company.com',
        metrics: {
          accuracy: 0.87,
          latency: 8,
          throughput: 8000,
        },
      },
      {
        id: 'model_4',
        name: 'Document Classifier',
        version: '1.2.0',
        type: 'cv',
        status: 'failed',
        framework: 'tensorflow',
        size: 1024,
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-23'),
        createdBy: 'alice.brown@company.com',
        metrics: {
          latency: 120,
          throughput: 100,
        },
      },
    ];
    setModels(mockModels);
  };

  const loadTrainingJobs = () => {
    const mockJobs: TrainingJob[] = [
      {
        id: 'job_1',
        modelId: 'model_2',
        modelName: 'Fraud Detection System',
        status: 'running',
        progress: 65,
        currentEpoch: 13,
        totalEpochs: 20,
        trainingLoss: 0.245,
        validationLoss: 0.289,
        estimatedTimeRemaining: 2400,
        resourceUsage: {
          cpuUtilization: 75,
          memoryUsage: 68,
          gpuUtilization: 92,
        },
        createdAt: new Date('2024-01-22T10:30:00'),
      },
      {
        id: 'job_2',
        modelId: 'model_5',
        modelName: 'Image Recognition v3',
        status: 'pending',
        progress: 0,
        currentEpoch: 0,
        totalEpochs: 50,
        trainingLoss: 0,
        validationLoss: 0,
        estimatedTimeRemaining: 14400,
        resourceUsage: {
          cpuUtilization: 0,
          memoryUsage: 0,
          gpuUtilization: 0,
        },
        createdAt: new Date('2024-01-22T14:15:00'),
      },
    ];
    setTrainingJobs(mockJobs);
  };

  const updateTrainingJobs = () => {
    setTrainingJobs(prevJobs => 
      prevJobs.map(job => {
        if (job.status === 'running') {
          const newProgress = Math.min(job.progress + Math.random() * 5, 100);
          const newEpoch = Math.floor((newProgress / 100) * job.totalEpochs);
          
          return {
            ...job,
            progress: newProgress,
            currentEpoch: newEpoch,
            trainingLoss: Math.max(job.trainingLoss - Math.random() * 0.01, 0.1),
            validationLoss: Math.max(job.validationLoss - Math.random() * 0.008, 0.12),
            estimatedTimeRemaining: Math.max(job.estimatedTimeRemaining - 60, 0),
            resourceUsage: {
              cpuUtilization: 70 + Math.random() * 20,
              memoryUsage: 60 + Math.random() * 25,
              gpuUtilization: 85 + Math.random() * 10,
            },
          };
        }
        return job;
      })
    );
  };

  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || model.status === selectedStatus;
    const matchesType = selectedType === 'all' || model.type === selectedType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedModels = [...filteredModels].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'createdAt':
        aValue = a.createdAt;
        bValue = b.createdAt;
        break;
      case 'accuracy':
        aValue = a.accuracy || 0;
        bValue = b.accuracy || 0;
        break;
      case 'size':
        aValue = a.size;
        bValue = b.size;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'training':
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'training':
      case 'running':
        return <Play className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'archived':
        return <Square className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'classification':
        return <Target className="w-4 h-4" />;
      case 'regression':
        return <TrendingUp className="w-4 h-4" />;
      case 'nlp':
        return <Brain className="w-4 h-4" />;
      case 'cv':
        return <Eye className="w-4 h-4" />;
      case 'multimodal':
        return <Zap className="w-4 h-4" />;
      default:
        return <Code className="w-4 h-4" />;
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Model Management</h1>
          <p className="text-gray-600">Manage your AI models, training, and deployments</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Import Model
          </Button>
          <Button>
            <Brain className="w-4 h-4 mr-2" />
            Create Model
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="models" className="space-y-6">
        <TabsList>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="training">Training Jobs</TabsTrigger>
          <TabsTrigger value="registry">Model Registry</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-6">
          {/* Filters and Search */}
          <Card className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search models..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="deployed">Deployed</option>
                <option value="completed">Completed</option>
                <option value="training">Training</option>
                <option value="failed">Failed</option>
                <option value="archived">Archived</option>
              </select>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="classification">Classification</option>
                <option value="regression">Regression</option>
                <option value="nlp">NLP</option>
                <option value="cv">Computer Vision</option>
                <option value="multimodal">Multimodal</option>
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="accuracy-desc">Highest Accuracy</option>
                <option value="size-asc">Smallest Size</option>
              </select>
            </div>
          </Card>

          {/* Models Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedModels.map((model) => (
              <Card key={model.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(model.type)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{model.name}</h3>
                      <p className="text-sm text-gray-600">v{model.version}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(model.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(model.status)}
                      <span>{model.status}</span>
                    </div>
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Framework</span>
                    <span className="font-medium">{model.framework}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Size</span>
                    <span className="font-medium">{formatFileSize(model.size)}</span>
                  </div>
                  
                  {model.accuracy && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Accuracy</span>
                      <span className="font-medium">{(model.accuracy * 100).toFixed(1)}%</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Latency</span>
                    <span className="font-medium">{model.metrics.latency}ms</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Created by</span>
                    <span className="font-medium">{model.createdBy.split('@')[0]}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <div className="grid gap-6">
            {trainingJobs.map((job) => (
              <Card key={job.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{job.modelName}</h3>
                    <p className="text-sm text-gray-600">Training Job • {job.id}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(job.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(job.status)}
                        <span>{job.status}</span>
                      </div>
                    </Badge>
                    {job.status === 'running' && (
                      <Button variant="outline" size="sm">
                        <Pause className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {job.status === 'running' && (
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{job.progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Epoch</p>
                        <p className="font-semibold">{job.currentEpoch}/{job.totalEpochs}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Training Loss</p>
                        <p className="font-semibold">{job.trainingLoss.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Validation Loss</p>
                        <p className="font-semibold">{job.validationLoss.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Time Remaining</p>
                        <p className="font-semibold">{formatTimeRemaining(job.estimatedTimeRemaining)}</p>
                      </div>
                    </div>

                    {/* Resource Usage */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>CPU</span>
                          <span>{job.resourceUsage.cpuUtilization.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${job.resourceUsage.cpuUtilization}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Memory</span>
                          <span>{job.resourceUsage.memoryUsage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${job.resourceUsage.memoryUsage}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>GPU</span>
                          <span>{job.resourceUsage.gpuUtilization.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${job.resourceUsage.gpuUtilization}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {job.status === 'pending' && (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Training job is queued and waiting to start</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Estimated start time: {formatTimeRemaining(job.estimatedTimeRemaining)}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="registry">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Model Registry</h3>
            <p className="text-gray-600">Centralized model versioning, lineage, and governance.</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline">
                <Database className="w-4 h-4 mr-2" />
                View Registry
              </Button>
              <Button variant="outline">
                <Code className="w-4 h-4 mr-2" />
                Model Lineage
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Registry Settings
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="deployments">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Model Deployments</h3>
            <p className="text-gray-600">Manage model deployments across environments.</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline">
                <Zap className="w-4 h-4 mr-2" />
                Deploy Model
              </Button>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                View Deployments
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Deployment Settings
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};