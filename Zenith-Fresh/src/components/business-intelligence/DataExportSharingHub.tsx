'use client';

import React, { useState, useEffect } from 'react';
import { ExportConfig, DataRole, DataPermission } from '@/types/business-intelligence/analytics';

interface DataExportSharingHubProps {
  theme?: 'light' | 'dark';
}

interface ExportRequest {
  id: string;
  name: string;
  type: 'dashboard' | 'report' | 'raw_data' | 'insights';
  format: 'csv' | 'json' | 'excel' | 'pdf' | 'powerpoint';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
  requestedBy: string;
  size?: number;
  errorMessage?: string;
}

interface SharedLink {
  id: string;
  name: string;
  type: 'dashboard' | 'report' | 'dataset';
  url: string;
  isPublic: boolean;
  allowedUsers: string[];
  permissions: ('view' | 'download' | 'share')[];
  accessCount: number;
  expiresAt?: Date;
  createdAt: Date;
  createdBy: string;
  password?: string;
}

interface UserPermission {
  userId: string;
  userEmail: string;
  userName: string;
  role: string;
  permissions: DataPermission[];
  lastAccess?: Date;
  isActive: boolean;
}

export function DataExportSharingHub({ theme = 'light' }: DataExportSharingHubProps) {
  const [activeTab, setActiveTab] = useState<'exports' | 'sharing' | 'permissions' | 'activity'>('exports');
  const [exportRequests, setExportRequests] = useState<ExportRequest[]>([]);
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [dataRoles, setDataRoles] = useState<DataRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Export form state
  const [newExport, setNewExport] = useState<{
    name: string;
    type: string;
    format: string;
    dateRange: { start: string; end: string };
    filters: Record<string, any>;
    fields: string[];
    compression: boolean;
    encryption: boolean;
  }>({
    name: '',
    type: 'dashboard',
    format: 'csv',
    dateRange: { start: '', end: '' },
    filters: {},
    fields: [],
    compression: false,
    encryption: false
  });

  // Sharing form state
  const [newShare, setNewShare] = useState<{
    name: string;
    type: string;
    isPublic: boolean;
    allowedUsers: string[];
    permissions: string[];
    expiresAt: string;
    password: string;
  }>({
    name: '',
    type: 'dashboard',
    isPublic: false,
    allowedUsers: [],
    permissions: ['view'],
    expiresAt: '',
    password: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchExportRequests(),
        fetchSharedLinks(),
        fetchUserPermissions(),
        fetchDataRoles()
      ]);
    } catch (error) {
      console.error('Error fetching data export/sharing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExportRequests = async () => {
    const mockRequests: ExportRequest[] = [
      {
        id: 'export-1',
        name: 'Q3 Performance Report',
        type: 'report',
        format: 'pdf',
        status: 'completed',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 90 * 60 * 1000),
        downloadUrl: '/api/exports/q3-performance.pdf',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        requestedBy: 'john.doe@company.com',
        size: 2584000
      },
      {
        id: 'export-2',
        name: 'Customer Data Export',
        type: 'raw_data',
        format: 'csv',
        status: 'processing',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        requestedBy: 'jane.smith@company.com'
      },
      {
        id: 'export-3',
        name: 'Revenue Analytics Dashboard',
        type: 'dashboard',
        format: 'excel',
        status: 'failed',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        requestedBy: 'mike.johnson@company.com',
        errorMessage: 'Data size exceeds export limit'
      }
    ];
    setExportRequests(mockRequests);
  };

  const fetchSharedLinks = async () => {
    const mockLinks: SharedLink[] = [
      {
        id: 'share-1',
        name: 'Executive Dashboard',
        type: 'dashboard',
        url: 'https://app.zenith.engineer/shared/exec-dashboard-abc123',
        isPublic: false,
        allowedUsers: ['exec@company.com', 'cto@company.com'],
        permissions: ['view'],
        accessCount: 245,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        createdBy: 'admin@company.com'
      },
      {
        id: 'share-2',
        name: 'Public Analytics Report',
        type: 'report',
        url: 'https://app.zenith.engineer/public/analytics-report-xyz789',
        isPublic: true,
        allowedUsers: [],
        permissions: ['view', 'download'],
        accessCount: 1543,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdBy: 'marketing@company.com'
      }
    ];
    setSharedLinks(mockLinks);
  };

  const fetchUserPermissions = async () => {
    const mockPermissions: UserPermission[] = [
      {
        userId: 'user-1',
        userEmail: 'john.doe@company.com',
        userName: 'John Doe',
        role: 'admin',
        permissions: [
          { resource: 'dashboards', actions: ['read', 'write', 'delete', 'share'] },
          { resource: 'reports', actions: ['read', 'write', 'delete', 'share'] },
          { resource: 'raw_data', actions: ['read', 'write', 'delete'] }
        ],
        lastAccess: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isActive: true
      },
      {
        userId: 'user-2',
        userEmail: 'jane.smith@company.com',
        userName: 'Jane Smith',
        role: 'analyst',
        permissions: [
          { resource: 'dashboards', actions: ['read', 'share'] },
          { resource: 'reports', actions: ['read', 'write', 'share'] },
          { resource: 'raw_data', actions: ['read'] }
        ],
        lastAccess: new Date(Date.now() - 4 * 60 * 60 * 1000),
        isActive: true
      },
      {
        userId: 'user-3',
        userEmail: 'viewer@company.com',
        userName: 'Guest Viewer',
        role: 'viewer',
        permissions: [
          { resource: 'dashboards', actions: ['read'] },
          { resource: 'reports', actions: ['read'] }
        ],
        lastAccess: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isActive: true
      }
    ];
    setUserPermissions(mockPermissions);
  };

  const fetchDataRoles = async () => {
    const mockRoles: DataRole[] = [
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full access to all data and functionality',
        permissions: [
          { resource: '*', actions: ['read', 'write', 'delete', 'share'] }
        ],
        dashboards: ['*'],
        reports: ['*'],
        dataScopes: ['*']
      },
      {
        id: 'analyst',
        name: 'Data Analyst',
        description: 'Can analyze data and create reports',
        permissions: [
          { resource: 'dashboards', actions: ['read', 'share'] },
          { resource: 'reports', actions: ['read', 'write', 'share'] },
          { resource: 'raw_data', actions: ['read'] }
        ],
        dashboards: ['analytics', 'performance'],
        reports: ['*'],
        dataScopes: ['company_data', 'public_data']
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to approved content',
        permissions: [
          { resource: 'dashboards', actions: ['read'] },
          { resource: 'reports', actions: ['read'] }
        ],
        dashboards: ['executive', 'public'],
        reports: ['public_reports'],
        dataScopes: ['public_data']
      }
    ];
    setDataRoles(mockRoles);
  };

  const createExport = async () => {
    const exportRequest: ExportRequest = {
      id: `export-${Date.now()}`,
      name: newExport.name,
      type: newExport.type as any,
      format: newExport.format as any,
      status: 'pending',
      createdAt: new Date(),
      requestedBy: 'current-user@company.com'
    };

    setExportRequests(prev => [exportRequest, ...prev]);
    
    // Reset form
    setNewExport({
      name: '',
      type: 'dashboard',
      format: 'csv',
      dateRange: { start: '', end: '' },
      filters: {},
      fields: [],
      compression: false,
      encryption: false
    });

    // Simulate processing
    setTimeout(() => {
      setExportRequests(prev => prev.map(req => 
        req.id === exportRequest.id 
          ? { ...req, status: 'processing' as const }
          : req
      ));
    }, 1000);

    setTimeout(() => {
      setExportRequests(prev => prev.map(req => 
        req.id === exportRequest.id 
          ? { 
              ...req, 
              status: 'completed' as const,
              completedAt: new Date(),
              downloadUrl: `/api/exports/${exportRequest.id}.${newExport.format}`,
              size: Math.floor(Math.random() * 5000000) + 100000,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          : req
      ));
    }, 5000);
  };

  const createSharedLink = async () => {
    const sharedLink: SharedLink = {
      id: `share-${Date.now()}`,
      name: newShare.name,
      type: newShare.type as any,
      url: `https://app.zenith.engineer/shared/${Date.now()}`,
      isPublic: newShare.isPublic,
      allowedUsers: newShare.allowedUsers,
      permissions: newShare.permissions as any,
      accessCount: 0,
      expiresAt: newShare.expiresAt ? new Date(newShare.expiresAt) : undefined,
      createdAt: new Date(),
      createdBy: 'current-user@company.com',
      password: newShare.password || undefined
    };

    setSharedLinks(prev => [sharedLink, ...prev]);
    
    // Reset form
    setNewShare({
      name: '',
      type: 'dashboard',
      isPublic: false,
      allowedUsers: [],
      permissions: ['view'],
      expiresAt: '',
      password: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading data export and sharing hub...</span>
      </div>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} px-6 py-4`}>
        <h1 className="text-2xl font-bold">Data Export & Sharing Hub</h1>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Export data, create shared links, and manage access permissions
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'exports', name: 'Data Exports', icon: '📤', count: exportRequests.filter(r => r.status === 'pending' || r.status === 'processing').length },
            { id: 'sharing', name: 'Shared Links', icon: '🔗', count: sharedLinks.filter(l => !l.expiresAt || l.expiresAt > new Date()).length },
            { id: 'permissions', name: 'Access Control', icon: '🔐', count: userPermissions.filter(u => u.isActive).length },
            { id: 'activity', name: 'Activity Log', icon: '📊', count: 0 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : `border-transparent ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'}`
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="px-6 py-6">
        {/* Data Exports Tab */}
        {activeTab === 'exports' && (
          <div className="space-y-6">
            {/* Create New Export */}
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Create New Export</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Export Name</label>
                  <input
                    type="text"
                    value={newExport.name}
                    onChange={(e) => setNewExport(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full rounded border ${
                      theme === 'dark' 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-300 bg-white'
                    } px-3 py-2 text-sm`}
                    placeholder="Export name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Data Type</label>
                  <select
                    value={newExport.type}
                    onChange={(e) => setNewExport(prev => ({ ...prev, type: e.target.value }))}
                    className={`w-full rounded border ${
                      theme === 'dark' 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-300 bg-white'
                    } px-3 py-2 text-sm`}
                  >
                    <option value="dashboard">Dashboard Data</option>
                    <option value="report">Generated Report</option>
                    <option value="raw_data">Raw Data</option>
                    <option value="insights">AI Insights</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Format</label>
                  <select
                    value={newExport.format}
                    onChange={(e) => setNewExport(prev => ({ ...prev, format: e.target.value }))}
                    className={`w-full rounded border ${
                      theme === 'dark' 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-300 bg-white'
                    } px-3 py-2 text-sm`}
                  >
                    <option value="csv">CSV</option>
                    <option value="excel">Excel</option>
                    <option value="json">JSON</option>
                    <option value="pdf">PDF</option>
                    <option value="powerpoint">PowerPoint</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={createExport}
                    disabled={!newExport.name}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Create Export
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Export Options</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newExport.compression}
                        onChange={(e) => setNewExport(prev => ({ ...prev, compression: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Enable compression</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newExport.encryption}
                        onChange={(e) => setNewExport(prev => ({ ...prev, encryption: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Enable encryption</span>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Date Range</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={newExport.dateRange.start}
                      onChange={(e) => setNewExport(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                      className={`w-full rounded border ${
                        theme === 'dark' 
                          ? 'border-gray-600 bg-gray-700 text-white' 
                          : 'border-gray-300 bg-white'
                      } px-3 py-2 text-sm`}
                    />
                    <input
                      type="date"
                      value={newExport.dateRange.end}
                      onChange={(e) => setNewExport(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                      className={`w-full rounded border ${
                        theme === 'dark' 
                          ? 'border-gray-600 bg-gray-700 text-white' 
                          : 'border-gray-300 bg-white'
                      } px-3 py-2 text-sm`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Export Requests List */}
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Export Requests</h3>
              
              <div className="space-y-3">
                {exportRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium">{request.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status.toUpperCase()}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {request.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {request.format.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span>Requested by:</span>
                            <div className="font-medium">{request.requestedBy}</div>
                          </div>
                          <div>
                            <span>Created:</span>
                            <div className="font-medium">{request.createdAt.toLocaleString()}</div>
                          </div>
                          {request.size && (
                            <div>
                              <span>Size:</span>
                              <div className="font-medium">{formatFileSize(request.size)}</div>
                            </div>
                          )}
                          {request.expiresAt && (
                            <div>
                              <span>Expires:</span>
                              <div className="font-medium">{request.expiresAt.toLocaleDateString()}</div>
                            </div>
                          )}
                        </div>
                        
                        {request.errorMessage && (
                          <div className="mt-2 text-sm text-red-600">
                            Error: {request.errorMessage}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        {request.status === 'completed' && request.downloadUrl && (
                          <a
                            href={request.downloadUrl}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                            download
                          >
                            Download
                          </a>
                        )}
                        {request.status === 'processing' && (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Shared Links Tab */}
        {activeTab === 'sharing' && (
          <div className="space-y-6">
            {/* Create New Shared Link */}
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Create Shared Link</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Link Name</label>
                    <input
                      type="text"
                      value={newShare.name}
                      onChange={(e) => setNewShare(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full rounded border ${
                        theme === 'dark' 
                          ? 'border-gray-600 bg-gray-700 text-white' 
                          : 'border-gray-300 bg-white'
                      } px-3 py-2`}
                      placeholder="Shared link name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Content Type</label>
                    <select
                      value={newShare.type}
                      onChange={(e) => setNewShare(prev => ({ ...prev, type: e.target.value }))}
                      className={`w-full rounded border ${
                        theme === 'dark' 
                          ? 'border-gray-600 bg-gray-700 text-white' 
                          : 'border-gray-300 bg-white'
                      } px-3 py-2`}
                    >
                      <option value="dashboard">Dashboard</option>
                      <option value="report">Report</option>
                      <option value="dataset">Dataset</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Permissions</label>
                    <div className="space-y-2">
                      {['view', 'download', 'share'].map(permission => (
                        <label key={permission} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newShare.permissions.includes(permission)}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...newShare.permissions, permission]
                                : newShare.permissions.filter(p => p !== permission);
                              setNewShare(prev => ({ ...prev, permissions: updated }));
                            }}
                            className="rounded"
                          />
                          <span className="text-sm capitalize">{permission}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newShare.isPublic}
                        onChange={(e) => setNewShare(prev => ({ ...prev, isPublic: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Make public (no authentication required)</span>
                    </label>
                  </div>
                  
                  {!newShare.isPublic && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Allowed Users (emails)</label>
                      <textarea
                        value={newShare.allowedUsers.join('\n')}
                        onChange={(e) => setNewShare(prev => ({ 
                          ...prev, 
                          allowedUsers: e.target.value.split('\n').filter(email => email.trim()) 
                        }))}
                        className={`w-full h-20 rounded border ${
                          theme === 'dark' 
                            ? 'border-gray-600 bg-gray-700 text-white' 
                            : 'border-gray-300 bg-white'
                        } px-3 py-2 text-sm`}
                        placeholder="user@example.com&#10;another@example.com"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Expiration Date (optional)</label>
                    <input
                      type="datetime-local"
                      value={newShare.expiresAt}
                      onChange={(e) => setNewShare(prev => ({ ...prev, expiresAt: e.target.value }))}
                      className={`w-full rounded border ${
                        theme === 'dark' 
                          ? 'border-gray-600 bg-gray-700 text-white' 
                          : 'border-gray-300 bg-white'
                      } px-3 py-2`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Password Protection (optional)</label>
                    <input
                      type="password"
                      value={newShare.password}
                      onChange={(e) => setNewShare(prev => ({ ...prev, password: e.target.value }))}
                      className={`w-full rounded border ${
                        theme === 'dark' 
                          ? 'border-gray-600 bg-gray-700 text-white' 
                          : 'border-gray-300 bg-white'
                      } px-3 py-2`}
                      placeholder="Optional password"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={createSharedLink}
                  disabled={!newShare.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Create Shared Link
                </button>
              </div>
            </div>

            {/* Shared Links List */}
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Active Shared Links</h3>
              
              <div className="space-y-4">
                {sharedLinks.map((link) => (
                  <div
                    key={link.id}
                    className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium">{link.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            link.isPublic ? 'text-green-600 bg-green-100' : 'text-blue-600 bg-blue-100'
                          }`}>
                            {link.isPublic ? 'PUBLIC' : 'PRIVATE'}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {link.type.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={link.url}
                              readOnly
                              className={`flex-1 rounded border ${
                                theme === 'dark' 
                                  ? 'border-gray-600 bg-gray-700 text-white' 
                                  : 'border-gray-300 bg-gray-50'
                              } px-3 py-1 text-sm`}
                            />
                            <button
                              onClick={() => copyToClipboard(link.url)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span>Access count:</span>
                            <div className="font-medium">{link.accessCount.toLocaleString()}</div>
                          </div>
                          <div>
                            <span>Created by:</span>
                            <div className="font-medium">{link.createdBy}</div>
                          </div>
                          <div>
                            <span>Created:</span>
                            <div className="font-medium">{link.createdAt.toLocaleDateString()}</div>
                          </div>
                          {link.expiresAt && (
                            <div>
                              <span>Expires:</span>
                              <div className={`font-medium ${
                                link.expiresAt < new Date() ? 'text-red-600' : ''
                              }`}>
                                {link.expiresAt.toLocaleDateString()}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2 text-sm">
                          <span className="text-gray-500">Permissions: </span>
                          <span className="font-medium">{link.permissions.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Access Control Tab */}
        {activeTab === 'permissions' && (
          <div className="space-y-6">
            {/* Data Roles */}
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Data Access Roles</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dataRoles.map((role) => (
                  <div
                    key={role.id}
                    className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <h4 className="font-medium text-lg">{role.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Permissions:</span>
                        <ul className="list-disc list-inside ml-2 text-gray-600">
                          {role.permissions.map((perm, index) => (
                            <li key={index}>
                              {perm.resource}: {perm.actions.join(', ')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Permissions */}
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">User Permissions</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}>
                      <th className="px-4 py-2 text-left">User</th>
                      <th className="px-4 py-2 text-left">Role</th>
                      <th className="px-4 py-2 text-left">Last Access</th>
                      <th className="px-4 py-2 text-left">Permissions</th>
                      <th className="px-4 py-2 text-center">Status</th>
                      <th className="px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPermissions.map((user) => (
                      <tr key={user.userId} className={`border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                        <td className="px-4 py-2">
                          <div>
                            <div className="font-medium">{user.userName}</div>
                            <div className="text-gray-500">{user.userEmail}</div>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {user.lastAccess?.toLocaleString() || 'Never'}
                        </td>
                        <td className="px-4 py-2">
                          <div className="space-y-1">
                            {user.permissions.map((perm, index) => (
                              <div key={index} className="text-xs">
                                <span className="font-medium">{perm.resource}:</span>
                                <span className="ml-1">{perm.actions.join(', ')}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive 
                              ? 'text-green-600 bg-green-100' 
                              : 'text-red-600 bg-red-100'
                          }`}>
                            {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Activity Log Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4">Data Access Activity</h3>
              
              <div className="space-y-3">
                {[
                  { user: 'john.doe@company.com', action: 'Downloaded executive dashboard export', time: '2 minutes ago', type: 'export' },
                  { user: 'jane.smith@company.com', action: 'Accessed shared analytics report', time: '15 minutes ago', type: 'share' },
                  { user: 'admin@company.com', action: 'Created new shared link for Q3 report', time: '1 hour ago', type: 'share' },
                  { user: 'viewer@company.com', action: 'Viewed executive dashboard', time: '2 hours ago', type: 'access' },
                  { user: 'analyst@company.com', action: 'Exported customer data to CSV', time: '3 hours ago', type: 'export' }
                ].map((activity, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${
                            activity.type === 'export' ? 'bg-blue-500' :
                            activity.type === 'share' ? 'bg-green-500' : 'bg-gray-500'
                          }`} />
                          <span className="font-medium">{activity.user}</span>
                          <span className="text-gray-600">{activity.action}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
