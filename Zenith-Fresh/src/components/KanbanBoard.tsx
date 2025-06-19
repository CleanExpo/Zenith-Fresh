'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: {
    name: string;
    avatar: string;
    email: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  comments: number;
  attachments: number;
}

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  limit?: number;
}

interface KanbanBoardProps {
  projectId: string;
  className?: string;
}

export function KanbanBoard({ projectId, className = '' }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'backlog',
      title: 'Backlog',
      color: 'bg-gray-100',
      tasks: [
        {
          id: '1',
          title: 'Design homepage wireframes',
          description: 'Create initial wireframes for the homepage layout including hero section, navigation, and footer.',
          assignee: {
            name: 'John Doe',
            avatar: '/api/placeholder/32/32',
            email: 'john@company.com'
          },
          priority: 'medium',
          tags: ['design', 'wireframes'],
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          comments: 3,
          attachments: 1
        },
        {
          id: '2',
          title: 'Set up authentication system',
          description: 'Implement user registration, login, and password reset functionality.',
          assignee: {
            name: 'Jane Smith',
            avatar: '/api/placeholder/32/32',
            email: 'jane@company.com'
          },
          priority: 'high',
          tags: ['backend', 'auth'],
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          comments: 1,
          attachments: 0
        }
      ]
    },
    {
      id: 'todo',
      title: 'To Do',
      color: 'bg-blue-100',
      tasks: [
        {
          id: '3',
          title: 'Create product catalog API',
          description: 'Build REST API endpoints for product management including CRUD operations.',
          assignee: {
            name: 'Bob Johnson',
            avatar: '/api/placeholder/32/32',
            email: 'bob@company.com'
          },
          priority: 'high',
          tags: ['backend', 'api'],
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          comments: 5,
          attachments: 2
        }
      ],
      limit: 5
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: 'bg-yellow-100',
      tasks: [
        {
          id: '4',
          title: 'Implement shopping cart',
          description: 'Add cart functionality with add/remove items, quantity updates, and local storage.',
          assignee: {
            name: 'Alice Wilson',
            avatar: '/api/placeholder/32/32',
            email: 'alice@company.com'
          },
          priority: 'urgent',
          tags: ['frontend', 'cart'],
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000),
          comments: 8,
          attachments: 3
        },
        {
          id: '5',
          title: 'Database schema optimization',
          description: 'Optimize database queries and add proper indexing for better performance.',
          assignee: {
            name: 'Charlie Davis',
            avatar: '/api/placeholder/32/32',
            email: 'charlie@company.com'
          },
          priority: 'medium',
          tags: ['database', 'performance'],
          createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 15 * 60 * 1000),
          comments: 2,
          attachments: 1
        }
      ],
      limit: 3
    },
    {
      id: 'review',
      title: 'Review',
      color: 'bg-purple-100',
      tasks: [
        {
          id: '6',
          title: 'Payment integration testing',
          description: 'Test Stripe payment integration across different scenarios and edge cases.',
          assignee: {
            name: 'Eva Martinez',
            avatar: '/api/placeholder/32/32',
            email: 'eva@company.com'
          },
          priority: 'high',
          tags: ['testing', 'payments'],
          createdAt: new Date(Date.now() - 144 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 45 * 60 * 1000),
          comments: 4,
          attachments: 0
        }
      ],
      limit: 3
    },
    {
      id: 'done',
      title: 'Done',
      color: 'bg-green-100',
      tasks: [
        {
          id: '7',
          title: 'User profile page',
          description: 'Complete user profile page with edit functionality and avatar upload.',
          assignee: {
            name: 'Frank Wilson',
            avatar: '/api/placeholder/32/32',
            email: 'frank@company.com'
          },
          priority: 'medium',
          tags: ['frontend', 'profile'],
          createdAt: new Date(Date.now() - 168 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          comments: 6,
          attachments: 2
        },
        {
          id: '8',
          title: 'Email notification system',
          description: 'Set up automated email notifications for user actions and system events.',
          assignee: {
            name: 'Grace Lee',
            avatar: '/api/placeholder/32/32',
            email: 'grace@company.com'
          },
          priority: 'low',
          tags: ['backend', 'notifications'],
          createdAt: new Date(Date.now() - 192 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
          comments: 2,
          attachments: 1
        }
      ]
    }
  ]);

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'assigned-to-me' | 'high-priority'>('all');

  const dragRef = useRef<HTMLDivElement>(null);

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityText = (priority: Task['priority']) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const formatDueDate = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const handleDragStart = (task: Task, columnId: string) => {
    setDraggedTask(task);
    setDraggedFromColumn(columnId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    
    if (!draggedTask || !draggedFromColumn) return;

    // Check column limits
    const targetColumn = columns.find(col => col.id === targetColumnId);
    if (targetColumn?.limit && targetColumn.tasks.length >= targetColumn.limit && targetColumnId !== draggedFromColumn) {
      alert(`Column "${targetColumn.title}" has reached its limit of ${targetColumn.limit} tasks.`);
      return;
    }

    setColumns(prevColumns => {
      return prevColumns.map(column => {
        if (column.id === draggedFromColumn) {
          // Remove task from source column
          return {
            ...column,
            tasks: column.tasks.filter(task => task.id !== draggedTask.id)
          };
        } else if (column.id === targetColumnId) {
          // Add task to target column
          return {
            ...column,
            tasks: [...column.tasks, { ...draggedTask, updatedAt: new Date() }]
          };
        }
        return column;
      });
    });

    setDraggedTask(null);
    setDraggedFromColumn(null);
  };

  const openTaskModal = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setSelectedTask(null);
    setShowTaskModal(false);
  };

  const filteredColumns = columns.map(column => ({
    ...column,
    tasks: column.tasks.filter(task => {
      switch (filter) {
        case 'assigned-to-me':
          return task.assignee.email === 'john@company.com'; // Current user
        case 'high-priority':
          return task.priority === 'high' || task.priority === 'urgent';
        default:
          return true;
      }
    })
  }));

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Board</h2>
          <p className="text-gray-600">Manage tasks and track progress</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All tasks</option>
            <option value="assigned-to-me">Assigned to me</option>
            <option value="high-priority">High priority</option>
          </select>
          
          {/* Add Task Button */}
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium">
            + Add Task
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex space-x-6 min-w-max pb-6">
          {filteredColumns.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className={`${column.color} rounded-lg p-4 mb-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-600">
                      {column.tasks.length}
                      {column.limit && `/${column.limit}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-3 min-h-32">
                <AnimatePresence>
                  {column.tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      draggable
                      onDragStart={() => handleDragStart(task, column.id)}
                      onClick={() => openTaskModal(task)}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow"
                    >
                      {/* Task Header */}
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight">
                          {task.title}
                        </h4>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0 ml-2 mt-1`}></div>
                      </div>

                      {/* Task Description */}
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {task.description}
                      </p>

                      {/* Tags */}
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {task.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Due Date */}
                      {task.dueDate && (
                        <div className={`text-xs mb-3 ${
                          new Date(task.dueDate) < new Date() ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {formatDueDate(task.dueDate)}
                        </div>
                      )}

                      {/* Task Footer */}
                      <div className="flex items-center justify-between">
                        {/* Assignee */}
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {task.assignee.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          {task.comments > 0 && (
                            <div className="flex items-center space-x-1">
                              <span>💬</span>
                              <span>{task.comments}</span>
                            </div>
                          )}
                          {task.attachments > 0 && (
                            <div className="flex items-center space-x-1">
                              <span>📎</span>
                              <span>{task.attachments}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {showTaskModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(selectedTask.priority)}`}></div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedTask.title}</h2>
                  </div>
                  <button
                    onClick={closeTaskModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Task Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600">{selectedTask.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Assignee</h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {selectedTask.assignee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedTask.assignee.name}</p>
                          <p className="text-xs text-gray-600">{selectedTask.assignee.email}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Priority</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getPriorityColor(selectedTask.priority)}`}>
                        {getPriorityText(selectedTask.priority)}
                      </span>
                    </div>
                  </div>

                  {selectedTask.tags.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTask.dueDate && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Due Date</h3>
                      <p className={`text-sm ${
                        new Date(selectedTask.dueDate) < new Date() ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {selectedTask.dueDate.toLocaleDateString()} ({formatDueDate(selectedTask.dueDate)})
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                      Edit Task
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                      Add Comment
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default KanbanBoard;