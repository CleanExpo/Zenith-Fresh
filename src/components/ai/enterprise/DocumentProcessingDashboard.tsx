'use client';

/**
 * Advanced Enterprise AI Platform - Document Processing Dashboard
 * Interface for managing document analysis, extraction, and processing
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Brain,
  Shield,
  BarChart3,
  Users,
  Settings,
  Trash2,
  RefreshCw,
  Archive,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileAudio
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt' | 'html' | 'csv' | 'json' | 'xml' | 'image';
  size: number;
  pages?: number;
  language: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  uploadedAt: Date;
  processedAt?: Date;
  uploadedBy: string;
  processingTasks: ProcessingTask[];
}

interface ProcessingTask {
  id: string;
  type: 'text_extraction' | 'entity_extraction' | 'classification' | 'summarization' | 'translation' | 'sentiment_analysis' | 'contract_analysis' | 'compliance_check' | 'data_extraction' | 'table_extraction' | 'quality_assessment';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: any;
  error?: string;
  processingTime?: number;
  createdAt: Date;
  completedAt?: Date;
}

interface ProcessingResult {
  documentId: string;
  taskType: string;
  confidence: number;
  extractedText?: string;
  entities?: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  classification?: {
    category: string;
    confidence: number;
  };
  summary?: string;
  sentiment?: {
    score: number;
    label: string;
  };
  tables?: Array<{
    id: string;
    headers: string[];
    rows: string[][];
  }>;
  qualityScore?: number;
}

export const DocumentProcessingDashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
    
    // Set up real-time updates for processing tasks
    const interval = setInterval(() => {
      updateProcessingTasks();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const loadDocuments = () => {
    const mockDocuments: Document[] = [
      {
        id: 'doc_1',
        name: 'Service Agreement Contract.pdf',
        type: 'pdf',
        size: 2048576, // 2MB
        pages: 15,
        language: 'en',
        status: 'completed',
        uploadedAt: new Date('2024-01-20T10:30:00'),
        processedAt: new Date('2024-01-20T10:35:00'),
        uploadedBy: 'john.doe@company.com',
        processingTasks: [
          {
            id: 'task_1',
            type: 'text_extraction',
            status: 'completed',
            processingTime: 15000,
            createdAt: new Date('2024-01-20T10:30:00'),
            completedAt: new Date('2024-01-20T10:30:15'),
          },
          {
            id: 'task_2',
            type: 'contract_analysis',
            status: 'completed',
            processingTime: 45000,
            createdAt: new Date('2024-01-20T10:30:15'),
            completedAt: new Date('2024-01-20T10:31:00'),
          },
          {
            id: 'task_3',
            type: 'compliance_check',
            status: 'completed',
            processingTime: 30000,
            createdAt: new Date('2024-01-20T10:31:00'),
            completedAt: new Date('2024-01-20T10:31:30'),
          },
        ],
      },
      {
        id: 'doc_2',
        name: 'Financial Report Q4.xlsx',
        type: 'xlsx',
        size: 1536000, // 1.5MB
        language: 'en',
        status: 'processing',
        uploadedAt: new Date('2024-01-22T14:15:00'),
        uploadedBy: 'jane.smith@company.com',
        processingTasks: [
          {
            id: 'task_4',
            type: 'data_extraction',
            status: 'processing',
            progress: 75,
            createdAt: new Date('2024-01-22T14:15:00'),
          },
          {
            id: 'task_5',
            type: 'table_extraction',
            status: 'pending',
            createdAt: new Date('2024-01-22T14:15:00'),
          },
        ],
      },
      {
        id: 'doc_3',
        name: 'Customer Feedback Survey.docx',
        type: 'docx',
        size: 512000, // 512KB
        pages: 8,
        language: 'en',
        status: 'failed',
        uploadedAt: new Date('2024-01-21T09:45:00'),
        uploadedBy: 'bob.wilson@company.com',
        processingTasks: [
          {
            id: 'task_6',
            type: 'text_extraction',
            status: 'completed',
            processingTime: 8000,
            createdAt: new Date('2024-01-21T09:45:00'),
            completedAt: new Date('2024-01-21T09:45:08'),
          },
          {
            id: 'task_7',
            type: 'sentiment_analysis',
            status: 'failed',
            error: 'Insufficient text quality for analysis',
            createdAt: new Date('2024-01-21T09:45:08'),
          },
        ],
      },
      {
        id: 'doc_4',
        name: 'Product Specification.pdf',
        type: 'pdf',
        size: 3072000, // 3MB
        pages: 25,
        language: 'en',
        status: 'uploaded',
        uploadedAt: new Date('2024-01-22T16:20:00'),
        uploadedBy: 'alice.brown@company.com',
        processingTasks: [],
      },
    ];
    setDocuments(mockDocuments);
  };

  const updateProcessingTasks = () => {
    setDocuments(prevDocs => 
      prevDocs.map(doc => {
        if (doc.status === 'processing') {
          const updatedTasks = doc.processingTasks.map(task => {
            if (task.status === 'processing' && task.progress !== undefined) {
              const newProgress = Math.min(task.progress + Math.random() * 10, 100);
              if (newProgress >= 100) {
                return {
                  ...task,
                  status: 'completed' as const,
                  progress: 100,
                  completedAt: new Date(),
                  processingTime: Date.now() - task.createdAt.getTime(),
                };
              }
              return { ...task, progress: newProgress };
            }
            return task;
          });

          // Check if all tasks are completed
          const allCompleted = updatedTasks.every(task => task.status === 'completed' || task.status === 'failed');
          
          return {
            ...doc,
            processingTasks: updatedTasks,
            status: allCompleted ? 'completed' as const : 'processing' as const,
            processedAt: allCompleted ? new Date() : undefined,
          };
        }
        return doc;
      })
    );
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'uploaded':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'uploaded':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'docx':
      case 'txt':
      case 'html':
        return <FileText className="w-5 h-5" />;
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-5 h-5" />;
      case 'image':
        return <FileImage className="w-5 h-5" />;
      case 'video':
        return <FileVideo className="w-5 h-5" />;
      case 'audio':
        return <FileAudio className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'text_extraction':
        return <FileText className="w-4 h-4" />;
      case 'entity_extraction':
        return <Search className="w-4 h-4" />;
      case 'classification':
        return <Filter className="w-4 h-4" />;
      case 'sentiment_analysis':
        return <Brain className="w-4 h-4" />;
      case 'contract_analysis':
        return <Shield className="w-4 h-4" />;
      case 'compliance_check':
        return <Shield className="w-4 h-4" />;
      case 'data_extraction':
        return <BarChart3 className="w-4 h-4" />;
      case 'table_extraction':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'quality_assessment':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTaskType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    // Simulate file upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newDocuments = Array.from(files).map((file, index) => ({
      id: `doc_${Date.now()}_${index}`,
      name: file.name,
      type: file.name.split('.').pop()?.toLowerCase() as Document['type'] || 'pdf',
      size: file.size,
      language: 'en',
      status: 'uploaded' as const,
      uploadedAt: new Date(),
      uploadedBy: 'current.user@company.com',
      processingTasks: [],
    }));
    
    setDocuments(prev => [...newDocuments, ...prev]);
    setIsUploading(false);
  };

  const startProcessing = (documentId: string, taskTypes: ProcessingTask['type'][]) => {
    setDocuments(prev => 
      prev.map(doc => {
        if (doc.id === documentId) {
          const newTasks = taskTypes.map(type => ({
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            status: 'pending' as const,
            createdAt: new Date(),
          }));
          
          return {
            ...doc,
            status: 'processing' as const,
            processingTasks: [...doc.processingTasks, ...newTasks],
          };
        }
        return doc;
      })
    );
  };

  const getProcessingStats = () => {
    const total = documents.length;
    const completed = documents.filter(d => d.status === 'completed').length;
    const processing = documents.filter(d => d.status === 'processing').length;
    const failed = documents.filter(d => d.status === 'failed').length;
    const uploaded = documents.filter(d => d.status === 'uploaded').length;
    
    return { total, completed, processing, failed, uploaded };
  };

  const stats = getProcessingStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Processing</h1>
          <p className="text-gray-600">Intelligent document analysis and data extraction</p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.xlsx,.pptx,.txt,.html,.csv,.json,.xml,.png,.jpg,.jpeg"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button asChild disabled={isUploading}>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Documents'}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
            </div>
            <RefreshCw className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Uploaded</p>
              <p className="text-2xl font-bold text-gray-600">{stats.uploaded}</p>
            </div>
            <Clock className="w-8 h-8 text-gray-600" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="processing">Processing Queue</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search documents..."
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
                <option value="uploaded">Uploaded</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="pdf">PDF</option>
                <option value="docx">Word</option>
                <option value="xlsx">Excel</option>
                <option value="txt">Text</option>
                <option value="image">Image</option>
              </select>
            </div>
          </Card>

          {/* Documents List */}
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <Card key={document.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getFileIcon(document.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{document.name}</h3>
                        <Badge className={getStatusColor(document.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(document.status)}
                            <span>{document.status}</span>
                          </div>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Size:</span> {formatFileSize(document.size)}
                        </div>
                        {document.pages && (
                          <div>
                            <span className="font-medium">Pages:</span> {document.pages}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Language:</span> {document.language.toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium">Uploaded:</span> {document.uploadedAt.toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Uploaded by:</span> {document.uploadedBy.split('@')[0]}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Processing Tasks */}
                {document.processingTasks.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-3">Processing Tasks</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {document.processingTasks.map((task) => (
                        <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            {getTaskIcon(task.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {formatTaskType(task.type)}
                            </p>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(task.status)} size="sm">
                                {task.status}
                              </Badge>
                              {task.progress !== undefined && (
                                <span className="text-xs text-gray-600">
                                  {task.progress.toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                {document.status === 'uploaded' && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => startProcessing(document.id, ['text_extraction', 'entity_extraction'])}
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Quick Analysis
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => startProcessing(document.id, ['contract_analysis', 'compliance_check'])}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Contract Analysis
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => startProcessing(document.id, ['data_extraction', 'table_extraction'])}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Data Extraction
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="processing">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Processing Queue</h3>
            <p className="text-gray-600">Real-time view of document processing tasks.</p>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Processing Results</h3>
            <p className="text-gray-600">View and export document analysis results.</p>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Document Analytics</h3>
            <p className="text-gray-600">Insights and metrics from document processing.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};