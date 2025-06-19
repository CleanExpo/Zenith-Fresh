'use client';

import { useState } from 'react';
import { ActivityFeed } from '../../components/ActivityFeed';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  category: 'system' | 'team' | 'project' | 'security';
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | Notification['category']>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Project Created',
      message: 'Your project "E-commerce Website" has been successfully created and is ready for development.',
      type: 'success',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      category: 'project',
      actionUrl: '/projects/1',
      actionText: 'View Project'
    },
    {
      id: '2',
      title: 'Team Member Invited',
      message: 'John Doe has been invited to join your organization with Editor permissions.',
      type: 'info',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: false,
      category: 'team'
    },
    {
      id: '3',
      title: 'Storage Limit Warning',
      message: 'You are approaching your storage limit (85% used). Consider upgrading your plan to avoid interruptions.',
      type: 'warning',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true,
      category: 'system',
      actionUrl: '/dashboard/organization',
      actionText: 'Upgrade Plan'
    },
    {
      id: '4',
      title: 'Security Alert',
      message: 'A new device has been detected accessing your account from New York, USA.',
      type: 'warning',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: false,
      category: 'security',
      actionUrl: '/dashboard/profile',
      actionText: 'Review Activity'
    },
    {
      id: '5',
      title: 'Backup Completed',
      message: 'Your weekly data backup has been completed successfully. All project data is secured.',
      type: 'success',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
      category: 'system'
    },
    {
      id: '6',
      title: 'Comment on Your Project',
      message: 'Jane Smith left a comment on "Homepage Design": "The new hero section looks fantastic!"',
      type: 'info',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: false,
      category: 'project',
      actionUrl: '/projects/1/pages/homepage',
      actionText: 'View Comment'
    }
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getCategoryIcon = (category: Notification['category']) => {
    switch (category) {
      case 'system': return '⚙️';
      case 'team': return '👥';
      case 'project': return '📁';
      case 'security': return '🔒';
      default: return '📝';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  const filteredNotifications = notifications
    .filter(notification => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !notification.read;
      return notification.category === filter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.timestamp.getTime() - b.timestamp.getTime();
        case 'priority':
          const priorityOrder = { error: 3, warning: 2, info: 1, success: 0 };
          return priorityOrder[b.type] - priorityOrder[a.type];
        default: // newest
          return b.timestamp.getTime() - a.timestamp.getTime();
      }
    });

  const unreadCount = notifications.filter(n => !n.read).length;

  const filters = [
    { label: 'All', value: 'all' as const, count: notifications.length },
    { label: 'Unread', value: 'unread' as const, count: unreadCount },
    { label: 'System', value: 'system' as const, count: notifications.filter(n => n.category === 'system').length },
    { label: 'Team', value: 'team' as const, count: notifications.filter(n => n.category === 'team').length },
    { label: 'Projects', value: 'project' as const, count: notifications.filter(n => n.category === 'project').length },
    { label: 'Security', value: 'security' as const, count: notifications.filter(n => n.category === 'security').length }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">Stay updated with your account activity and team updates</p>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
              
              {/* Filter Options */}
              <div className="space-y-2">
                {filters.map((filterOption) => (
                  <button
                    key={filterOption.value}
                    onClick={() => setFilter(filterOption.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                      filter === filterOption.value
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{filterOption.label}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      filter === filterOption.value
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {filterOption.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Sort Options */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Sort by</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="priority">Priority</option>
                </select>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-2">
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header Actions */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {filter === 'all' ? 'All Notifications' : 
                       filter === 'unread' ? 'Unread Notifications' :
                       `${filter.charAt(0).toUpperCase() + filter.slice(1)} Notifications`}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="divide-y divide-gray-200">
                {filteredNotifications.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                    <p>You're all caught up! No notifications to show.</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-6 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-25' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Icons */}
                        <div className="flex-shrink-0 flex space-x-2">
                          <span className="text-lg">{getTypeIcon(notification.type)}</span>
                          <span className="text-sm">{getCategoryIcon(notification.category)}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            
                            <div className="flex space-x-3">
                              {notification.actionUrl && (
                                <a
                                  href={notification.actionUrl}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  {notification.actionText}
                                </a>
                              )}
                              
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-gray-600 hover:text-gray-800"
                                >
                                  Mark as read
                                </button>
                              )}
                              
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Activity Feed */}
            <ActivityFeed limit={5} />
          </div>
        </div>
      </div>
    </div>
  );
}