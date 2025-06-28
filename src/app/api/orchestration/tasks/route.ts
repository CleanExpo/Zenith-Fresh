/**
 * Task Management API Endpoints
 * 
 * RESTful API for task submission, monitoring, and lifecycle management.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Mock task data generator
const generateMockTask = (id?: string) => {
  const types = ['data-processing', 'content-analysis', 'performance-check', 'integration-sync', 'security-scan'];
  const statuses = ['pending', 'assigned', 'running', 'completed', 'failed', 'cancelled'];
  const priorities = ['low', 'medium', 'high', 'critical'];
  const index = id ? parseInt(id.split('-')[1]) || 1 : Math.floor(Math.random() * 1000) + 1;
  
  const createdAt = new Date(Date.now() - Math.random() * 3600000);
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const startedAt = status !== 'pending' ? new Date(createdAt.getTime() + Math.random() * 300000) : undefined;
  const completedAt = ['completed', 'failed', 'cancelled'].includes(status) ? 
    new Date((startedAt || createdAt).getTime() + Math.random() * 600000) : undefined;

  return {
    id: id || `task-${index}`,
    type: types[Math.floor(Math.random() * types.length)],
    status,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    payload: {
      action: 'process',
      input: `data-${index}`,
      parameters: {
        timeout: 300000,
        retries: 3,
        quality: 'high'
      }
    },
    dependencies: Math.random() > 0.8 ? [`task-${Math.max(1, index - 1)}`] : [],
    requiredCapabilities: [types[Math.floor(Math.random() * types.length)]],
    constraints: {
      maxRetries: 3,
      timeout: 300000,
      deadline: new Date(Date.now() + 3600000).toISOString()
    },
    assignedAgent: status !== 'pending' ? `agent-${Math.floor(Math.random() * 32) + 1}` : undefined,
    createdAt: createdAt.toISOString(),
    startedAt: startedAt?.toISOString(),
    completedAt: completedAt?.toISOString(),
    result: completedAt && status === 'completed' ? {
      status: 'success',
      output: `processed-data-${index}`,
      metrics: {
        processingTime: Math.floor(Math.random() * 10000) + 1000,
        itemsProcessed: Math.floor(Math.random() * 100) + 1,
        qualityScore: Math.random() * 100
      }
    } : undefined,
    error: status === 'failed' ? 'Processing failed due to invalid input format' : undefined,
    retryCount: Math.floor(Math.random() * 3),
    progress: status === 'running' ? Math.floor(Math.random() * 100) : undefined,
    estimatedCompletion: status === 'running' ? 
      new Date(Date.now() + Math.random() * 300000).toISOString() : undefined,
    metadata: {
      source: 'api',
      version: '1.0.0',
      tags: ['automated', 'high-priority'],
      batchId: Math.random() > 0.7 ? `batch-${Math.floor(index / 10) + 1}` : undefined,
      workflowId: Math.random() > 0.8 ? `workflow-${Math.floor(index / 20) + 1}` : undefined
    }
  };
};

/**
 * GET /api/orchestration/tasks
 * List tasks with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const type = searchParams.get('type');
    const assignedAgent = searchParams.get('assignedAgent');
    const batchId = searchParams.get('batchId');
    const workflowId = searchParams.get('workflowId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const includeResult = searchParams.get('include_result') === 'true';
    const includeProgress = searchParams.get('include_progress') === 'true';

    // Generate mock tasks
    let tasks = Array.from({ length: 200 }, (_, i) => generateMockTask(`task-${i + 1}`));

    // Apply filters
    if (status && status !== 'all') {
      tasks = tasks.filter(task => task.status === status);
    }

    if (priority && priority !== 'all') {
      tasks = tasks.filter(task => task.priority === priority);
    }

    if (type && type !== 'all') {
      tasks = tasks.filter(task => task.type === type);
    }

    if (assignedAgent) {
      tasks = tasks.filter(task => task.assignedAgent === assignedAgent);
    }

    if (batchId) {
      tasks = tasks.filter(task => task.metadata.batchId === batchId);
    }

    if (workflowId) {
      tasks = tasks.filter(task => task.metadata.workflowId === workflowId);
    }

    // Apply sorting
    tasks.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const total = tasks.length;
    tasks = tasks.slice(offset, offset + limit);

    // Filter response fields based on query params
    const filteredTasks = tasks.map(task => {
      const filtered: any = {
        id: task.id,
        type: task.type,
        status: task.status,
        priority: task.priority,
        assignedAgent: task.assignedAgent,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        retryCount: task.retryCount,
        constraints: task.constraints,
        requiredCapabilities: task.requiredCapabilities,
        dependencies: task.dependencies,
        metadata: task.metadata
      };

      if (includeResult && task.result) {
        filtered.result = task.result;
      }

      if (includeProgress && task.progress !== undefined) {
        filtered.progress = task.progress;
        filtered.estimatedCompletion = task.estimatedCompletion;
      }

      if (task.error) {
        filtered.error = task.error;
      }

      return filtered;
    });

    // Calculate summary statistics
    const allTasks = Array.from({ length: 200 }, (_, i) => generateMockTask(`task-${i + 1}`));
    const summary = {
      total: allTasks.length,
      byStatus: {
        pending: allTasks.filter(t => t.status === 'pending').length,
        assigned: allTasks.filter(t => t.status === 'assigned').length,
        running: allTasks.filter(t => t.status === 'running').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        failed: allTasks.filter(t => t.status === 'failed').length,
        cancelled: allTasks.filter(t => t.status === 'cancelled').length,
      },
      byPriority: {
        critical: allTasks.filter(t => t.priority === 'critical').length,
        high: allTasks.filter(t => t.priority === 'high').length,
        medium: allTasks.filter(t => t.priority === 'medium').length,
        low: allTasks.filter(t => t.priority === 'low').length,
      },
      averageExecutionTime: 2847,
      successRate: 94.2,
      queueSize: 15
    };

    return NextResponse.json({
      tasks: filteredTasks,
      summary,
      pagination: {
        total: total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      filters: {
        status,
        priority,
        type,
        assignedAgent,
        batchId,
        workflowId
      },
      sorting: {
        sortBy,
        sortOrder
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orchestration/tasks
 * Submit a new task for execution
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      priority = 'medium',
      payload,
      dependencies = [],
      requiredCapabilities,
      constraints = {},
      metadata = {},
      scheduledFor,
      batchId,
      workflowId
    } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { error: 'Task type is required' },
        { status: 400 }
      );
    }

    if (!payload) {
      return NextResponse.json(
        { error: 'Task payload is required' },
        { status: 400 }
      );
    }

    // Validate priority
    if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be one of: low, medium, high, critical' },
        { status: 400 }
      );
    }

    // Generate task ID
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create task
    const task = {
      id: taskId,
      type,
      status: 'pending',
      priority,
      payload,
      dependencies,
      requiredCapabilities: requiredCapabilities || [type],
      constraints: {
        maxRetries: constraints.maxRetries || 3,
        timeout: constraints.timeout || 300000,
        deadline: constraints.deadline || new Date(Date.now() + 3600000).toISOString()
      },
      assignedAgent: undefined,
      createdAt: new Date().toISOString(),
      startedAt: undefined,
      completedAt: undefined,
      result: undefined,
      error: undefined,
      retryCount: 0,
      progress: undefined,
      estimatedCompletion: undefined,
      scheduledFor: scheduledFor || undefined,
      metadata: {
        ...metadata,
        source: 'api',
        version: '1.0.0',
        batchId,
        workflowId
      }
    };

    // In real implementation, this would submit to the task queue
    console.log('Task submitted:', task);

    return NextResponse.json({
      success: true,
      taskId,
      task,
      message: 'Task submitted successfully',
      estimatedStartTime: scheduledFor || new Date(Date.now() + 30000).toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error submitting task:', error);
    return NextResponse.json(
      { error: 'Failed to submit task' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/orchestration/tasks
 * Update task status or configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, updates } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Validate status update if provided
    if (updates.status) {
      const validStatuses = ['pending', 'assigned', 'running', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(updates.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Simulate task update
    const updatedTask = {
      id: taskId,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // In real implementation, this would update the task in the queue
    console.log('Task updated:', updatedTask);

    return NextResponse.json({
      success: true,
      taskId,
      updates: updatedTask,
      message: 'Task updated successfully'
    });

  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orchestration/tasks
 * Cancel a task
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const reason = searchParams.get('reason') || 'User requested cancellation';

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Check if task can be cancelled
    const task = generateMockTask(taskId);
    if (['completed', 'failed', 'cancelled'].includes(task.status)) {
      return NextResponse.json(
        { 
          error: `Cannot cancel task with status: ${task.status}`,
          currentStatus: task.status
        },
        { status: 409 }
      );
    }

    // In real implementation, this would cancel the task
    console.log('Task cancelled:', taskId, 'Reason:', reason);

    return NextResponse.json({
      success: true,
      taskId,
      previousStatus: task.status,
      cancellationReason: reason,
      cancelledAt: new Date().toISOString(),
      message: 'Task cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling task:', error);
    return NextResponse.json(
      { error: 'Failed to cancel task' },
      { status: 500 }
    );
  }
}