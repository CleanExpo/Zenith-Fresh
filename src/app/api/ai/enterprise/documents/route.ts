/**
 * Advanced Enterprise AI Platform - Document Processing API
 * Handles document upload, analysis, and intelligent processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { documentIntelligence } from '@/lib/ai/advanced/document-intelligence';

// Request schemas
const UploadDocumentRequestSchema = z.object({
  name: z.string(),
  type: z.enum(['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'html', 'csv', 'json', 'xml', 'image']),
  content: z.string().optional(),
  base64Data: z.string().optional(),
  url: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

const ProcessingTaskRequestSchema = z.object({
  documentId: z.string(),
  type: z.enum([
    'text_extraction',
    'entity_extraction',
    'classification',
    'summarization',
    'translation',
    'sentiment_analysis',
    'contract_analysis',
    'compliance_check',
    'data_extraction',
    'table_extraction',
    'image_analysis',
    'signature_detection',
    'quality_assessment'
  ]),
  parameters: z.record(z.any()).optional(),
  priority: z.number().min(1).max(10).default(5),
});

const BatchProcessingRequestSchema = z.object({
  documents: z.array(z.string()),
  taskTypes: z.array(z.enum([
    'text_extraction',
    'entity_extraction',
    'classification',
    'summarization',
    'translation',
    'sentiment_analysis',
    'contract_analysis',
    'compliance_check',
    'data_extraction',
    'table_extraction',
    'image_analysis',
    'signature_detection',
    'quality_assessment'
  ])),
  parameters: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...requestData } = body;

    switch (action) {
      case 'upload':
        const uploadRequest = UploadDocumentRequestSchema.parse(requestData);
        
        let documentData: any = {
          name: uploadRequest.name,
          type: uploadRequest.type,
          metadata: uploadRequest.metadata,
        };

        if (uploadRequest.base64Data) {
          documentData.buffer = Buffer.from(uploadRequest.base64Data, 'base64');
        } else if (uploadRequest.content) {
          documentData.content = uploadRequest.content;
        } else if (uploadRequest.url) {
          documentData.url = uploadRequest.url;
        } else {
          return NextResponse.json(
            { error: 'Either base64Data, content, or url must be provided' },
            { status: 400 }
          );
        }
        
        const documentId = await documentIntelligence.uploadDocument(documentData);
        
        return NextResponse.json({
          success: true,
          documentId,
          message: 'Document uploaded successfully',
          timestamp: new Date().toISOString(),
        });

      case 'create_task':
        const taskRequest = ProcessingTaskRequestSchema.parse(requestData);
        const taskId = await documentIntelligence.createProcessingTask(taskRequest);
        
        return NextResponse.json({
          success: true,
          taskId,
          message: 'Processing task created successfully',
          timestamp: new Date().toISOString(),
        });

      case 'batch_process':
        const batchRequest = BatchProcessingRequestSchema.parse(requestData);
        const taskIds = await documentIntelligence.processBatch(
          batchRequest.documents,
          batchRequest.taskTypes,
          batchRequest.parameters
        );
        
        return NextResponse.json({
          success: true,
          taskIds: Object.fromEntries(taskIds),
          message: 'Batch processing started successfully',
          timestamp: new Date().toISOString(),
        });

      case 'cancel_task':
        const { taskId } = requestData;
        const cancelled = await documentIntelligence.cancelProcessingTask(taskId);
        
        return NextResponse.json({
          success: cancelled,
          message: cancelled ? 'Task cancelled successfully' : 'Task not found or cannot be cancelled',
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Document processing error:', error);

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
    const documentId = searchParams.get('documentId');
    const taskId = searchParams.get('taskId');

    switch (action) {
      case 'list_documents':
        const filters = {
          type: searchParams.get('type') as any || undefined,
          language: searchParams.get('language') || undefined,
          processed: searchParams.get('processed') === 'true' ? true : 
                   searchParams.get('processed') === 'false' ? false : undefined,
        };
        
        const documents = documentIntelligence.listDocuments(filters);
        return NextResponse.json({
          success: true,
          documents,
          timestamp: new Date().toISOString(),
        });

      case 'get_document':
        if (!documentId) {
          return NextResponse.json(
            { error: 'documentId parameter is required' },
            { status: 400 }
          );
        }
        
        const document = documentIntelligence.getDocument(documentId);
        if (!document) {
          return NextResponse.json(
            { error: 'Document not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          document,
          timestamp: new Date().toISOString(),
        });

      case 'list_tasks':
        const tasks = documentIntelligence.listProcessingTasks(documentId || undefined);
        return NextResponse.json({
          success: true,
          tasks,
          timestamp: new Date().toISOString(),
        });

      case 'get_task':
        if (!taskId) {
          return NextResponse.json(
            { error: 'taskId parameter is required' },
            { status: 400 }
          );
        }
        
        const task = documentIntelligence.getProcessingTask(taskId);
        if (!task) {
          return NextResponse.json(
            { error: 'Task not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          task,
          timestamp: new Date().toISOString(),
        });

      case 'analytics':
        const analytics = documentIntelligence.getAnalytics();
        return NextResponse.json({
          success: true,
          analytics,
          timestamp: new Date().toISOString(),
        });

      case 'capabilities':
        const capabilities = {
          supportedTypes: ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'html', 'csv', 'json', 'xml', 'image'],
          processingTasks: [
            'text_extraction',
            'entity_extraction',
            'classification',
            'summarization',
            'translation',
            'sentiment_analysis',
            'contract_analysis',
            'compliance_check',
            'data_extraction',
            'table_extraction',
            'image_analysis',
            'signature_detection',
            'quality_assessment'
          ],
          languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'],
          maxFileSize: 100 * 1024 * 1024, // 100MB
          batchLimit: 100,
        };
        
        return NextResponse.json({
          success: true,
          capabilities,
          timestamp: new Date().toISOString(),
        });

      case 'results':
        if (!documentId && !taskId) {
          return NextResponse.json(
            { error: 'Either documentId or taskId parameter is required' },
            { status: 400 }
          );
        }
        
        let results: any[] = [];
        
        if (taskId) {
          const task = documentIntelligence.getProcessingTask(taskId);
          if (task && task.result) {
            results = [{ taskId, type: task.type, result: task.result }];
          }
        } else if (documentId) {
          const tasks = documentIntelligence.listProcessingTasks(documentId);
          results = tasks
            .filter(task => task.result)
            .map(task => ({ taskId: task.id, type: task.type, result: task.result }));
        }
        
        return NextResponse.json({
          success: true,
          results,
          timestamp: new Date().toISOString(),
        });

      case 'queue_status':
        // Get processing queue information
        const queueStatus = {
          activeTasks: 0,
          queuedTasks: 0,
          completedToday: 0,
          failedToday: 0,
          averageProcessingTime: 0,
        };
        
        const allTasks = documentIntelligence.listProcessingTasks();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        queueStatus.activeTasks = allTasks.filter(t => t.status === 'processing').length;
        queueStatus.queuedTasks = allTasks.filter(t => t.status === 'pending').length;
        queueStatus.completedToday = allTasks.filter(t => 
          t.status === 'completed' && t.updatedAt >= today
        ).length;
        queueStatus.failedToday = allTasks.filter(t => 
          t.status === 'failed' && t.updatedAt >= today
        ).length;
        
        const completedTasks = allTasks.filter(t => t.status === 'completed' && t.processingTime);
        queueStatus.averageProcessingTime = completedTasks.length > 0 
          ? completedTasks.reduce((sum, task) => sum + (task.processingTime || 0), 0) / completedTasks.length
          : 0;
        
        return NextResponse.json({
          success: true,
          queueStatus,
          timestamp: new Date().toISOString(),
        });

      case 'export':
        const format = searchParams.get('format') || 'json';
        const exportTaskId = searchParams.get('taskId');
        const exportDocumentId = searchParams.get('documentId');
        
        if (!exportTaskId && !exportDocumentId) {
          return NextResponse.json(
            { error: 'Either taskId or documentId parameter is required' },
            { status: 400 }
          );
        }
        
        let exportData: any = {};
        
        if (exportTaskId) {
          const task = documentIntelligence.getProcessingTask(exportTaskId);
          if (!task) {
            return NextResponse.json(
              { error: 'Task not found' },
              { status: 404 }
            );
          }
          exportData = { task };
        } else if (exportDocumentId) {
          const document = documentIntelligence.getDocument(exportDocumentId);
          const tasks = documentIntelligence.listProcessingTasks(exportDocumentId);
          if (!document) {
            return NextResponse.json(
              { error: 'Document not found' },
              { status: 404 }
            );
          }
          exportData = { document, tasks };
        }
        
        switch (format) {
          case 'csv':
            // Convert to CSV format (simplified)
            let csvData = 'field,value\n';
            const flattenObject = (obj: any, prefix = '') => {
              for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                  flattenObject(obj[key], prefix + key + '.');
                } else {
                  csvData += `${prefix}${key},"${obj[key]}"\n`;
                }
              }
            };
            flattenObject(exportData);
            
            return new NextResponse(csvData, {
              headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="export_${exportTaskId || exportDocumentId}.csv"`,
              },
            });
            
          default:
            return NextResponse.json({
              success: true,
              format,
              data: exportData,
              timestamp: new Date().toISOString(),
            });
        }

      case 'search':
        const query = searchParams.get('query');
        const type = searchParams.get('type');
        
        if (!query) {
          return NextResponse.json(
            { error: 'query parameter is required' },
            { status: 400 }
          );
        }
        
        // Simple search implementation
        let searchResults = documentIntelligence.listDocuments();
        
        if (type) {
          searchResults = searchResults.filter(doc => doc.type === type);
        }
        
        searchResults = searchResults.filter(doc => 
          doc.name.toLowerCase().includes(query.toLowerCase()) ||
          (doc.content && doc.content.toLowerCase().includes(query.toLowerCase()))
        );
        
        return NextResponse.json({
          success: true,
          query,
          results: searchResults,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Document processing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId parameter is required' },
        { status: 400 }
      );
    }

    const deleted = await documentIntelligence.deleteDocument(documentId);

    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Document deleted successfully' : 'Document not found',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}