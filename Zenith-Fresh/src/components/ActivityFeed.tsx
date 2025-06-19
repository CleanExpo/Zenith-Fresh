'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Activity {
  id: string;
  user: {
    name: string;
    avatar: string;
    email: string;
  };
  action: string;
  target: string;
  timestamp: Date;
  type: 'create' | 'update' | 'delete' | 'comment' | 'invite' | 'upload';
  metadata?: {
    [key: string]: any;
  };
}

interface ActivityFeedProps {
  className?: string;
  limit?: number;
  showHeader?: boolean;
}

export function ActivityFeed({ className = '', limit = 10, showHeader = true }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      user: {
        name: 'John Doe',
        avatar: '/api/placeholder/32/32',
        email: 'john@company.com'
      },
      action: 'created',
      target: 'E-commerce Website project',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      type: 'create',
      metadata: { projectId: '1' }
    },
    {
      id: '2',
      user: {
        name: 'Jane Smith',
        avatar: '/api/placeholder/32/32',
        email: 'jane@company.com'
      },
      action: 'updated',
      target: 'Homepage design',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      type: 'update',
      metadata: { pageId: '2' }
    },
    {
      id: '3',
      user: {
        name: 'Bob Johnson',
        avatar: '/api/placeholder/32/32',
        email: 'bob@company.com'
      },
      action: 'commented on',
      target: 'Product page layout',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      type: 'comment',
      metadata: { comment: 'The hero section looks great!' }
    },
    {
      id: '4',
      user: {
        name: 'Alice Wilson',
        avatar: '/api/placeholder/32/32',
        email: 'alice@company.com'
      },
      action: 'invited',
      target: 'Michael Brown to the team',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      type: 'invite',
      metadata: { inviteEmail: 'michael@company.com' }
    },
    {
      id: '5',
      user: {
        name: 'Charlie Davis',
        avatar: '/api/placeholder/32/32',
        email: 'charlie@company.com'
      },
      action: 'uploaded',
      target: '5 images to media library',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      type: 'upload',
      metadata: { fileCount: 5 }
    },
    {
      id: '6',
      user: {
        name: 'Eva Martinez',
        avatar: '/api/placeholder/32/32',
        email: 'eva@company.com'
      },
      action: 'deleted',
      target: 'Old landing page draft',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: 'delete'
    }
  ]);

  const [filter, setFilter] = useState<'all' | Activity['type']>('all');
  const [isLoading, setIsLoading] = useState(false);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'comment': return '💬';
      case 'invite': return '👥';
      case 'upload': return '📁';
      default: return '📝';
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'create': return 'text-green-600 bg-green-100';
      case 'update': return 'text-blue-600 bg-blue-100';
      case 'delete': return 'text-red-600 bg-red-100';
      case 'comment': return 'text-purple-600 bg-purple-100';
      case 'invite': return 'text-yellow-600 bg-yellow-100';
      case 'upload': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const filteredActivities = activities
    .filter(activity => filter === 'all' || activity.type === filter)
    .slice(0, limit);

  const loadMoreActivities = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const filters = [
    { label: 'All', value: 'all' as const },
    { label: 'Created', value: 'create' as const },
    { label: 'Updated', value: 'update' as const },
    { label: 'Comments', value: 'comment' as const },
    { label: 'Invites', value: 'invite' as const }
  ];

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {showHeader && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <button
              onClick={loadMoreActivities}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'View all'}
            </button>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {filters.map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filter === filterOption.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-6">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No recent activity to show</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {activity.user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </span>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user.name}</span>
                        {' '}{activity.action}{' '}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                    </div>
                    
                    {/* Metadata */}
                    {activity.metadata?.comment && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-700">
                        "{activity.metadata.comment}"
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        {activity.type === 'comment' && (
                          <button className="text-xs text-blue-600 hover:text-blue-800">
                            Reply
                          </button>
                        )}
                        {activity.metadata?.projectId && (
                          <a 
                            href={`/projects/${activity.metadata.projectId}`}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Load More Button */}
        {filteredActivities.length > 0 && !showHeader && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMoreActivities}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
              )}
              {isLoading ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityFeed;