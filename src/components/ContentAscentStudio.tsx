'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  FileText, 
  Target, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Eye,
  Edit3,
  MessageSquare,
  BarChart3,
  Lightbulb,
  Zap,
  Brain,
  Calendar,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Star,
  Activity
} from 'lucide-react';

// Mock data for content briefs and drafts
const mockContentBriefs = [
  {
    id: '1',
    title: 'AI-Driven GEO Strategies for SaaS',
    targetKeyword: 'ai geo optimization',
    status: 'in-progress',
    assignedTo: 'Sarah Chen',
    targetMetrics: { wordCount: 2500, readability: 'Grade 8', contentGrade: 'A' },
    geoTermProgress: { used: 15, total: 50 },
    eeatScore: 75,
    deadline: '2025-01-15',
    project: 'Q1 Content Strategy'
  },
  {
    id: '2',
    title: 'Complete Guide to E-E-A-T Optimization',
    targetKeyword: 'eeat seo guide',
    status: 'review',
    assignedTo: 'Marcus Johnson',
    targetMetrics: { wordCount: 3200, readability: 'Grade 9', contentGrade: 'A+' },
    geoTermProgress: { used: 42, total: 65 },
    eeatScore: 92,
    deadline: '2025-01-20',
    project: 'Authority Building'
  },
  {
    id: '3',
    title: 'Local SEO vs National SEO: When to Use Each',
    targetKeyword: 'local vs national seo',
    status: 'draft',
    assignedTo: 'Elena Rodriguez',
    targetMetrics: { wordCount: 1800, readability: 'Grade 7', contentGrade: 'B+' },
    geoTermProgress: { used: 0, total: 35 },
    eeatScore: 0,
    deadline: '2025-01-25',
    project: 'SEO Fundamentals'
  }
];

const ContentAscentStudio = memo(() => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getProgressColor = useCallback((percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  }, []);

  const filteredBriefs = useMemo(() => {
    return filterStatus === 'all' 
      ? mockContentBriefs 
      : mockContentBriefs.filter(brief => brief.status === filterStatus);
  }, [filterStatus]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Content Ascent Studio</h1>
              <p className="text-sm text-gray-500">Transform strategic insights into optimized content</p>
            </div>
          </div>
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" />
            New Content Brief
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'briefs', label: 'Content Briefs', icon: FileText },
            { id: 'editor', label: 'Editor', icon: Edit3 },
            { id: 'calendar', label: 'Content Calendar', icon: Calendar },
            { id: 'analytics', label: 'Performance', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Briefs</p>
                    <p className="text-3xl font-bold text-gray-900">12</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">+3 from last week</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Content Grade</p>
                    <p className="text-3xl font-bold text-gray-900">A-</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">+0.3 improvement</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Team Velocity</p>
                    <p className="text-3xl font-bold text-gray-900">8.5</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">articles per week</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Published Content</p>
                    <p className="text-3xl font-bold text-gray-900">47</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">this month</p>
              </div>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { action: 'Content approved', item: 'AI-Driven GEO Strategies', user: 'Sarah Chen', time: '2 hours ago' },
                    { action: 'Brief created', item: 'Local SEO Best Practices', user: 'Marcus Johnson', time: '4 hours ago' },
                    { action: 'Review requested', item: 'E-E-A-T Optimization Guide', user: 'Elena Rodriguez', time: '6 hours ago' }
                  ].map((activity, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.user}</span> {activity.action.toLowerCase()}
                        </p>
                        <p className="text-xs text-gray-500">{activity.item} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI Insights
                </h3>
                <div className="space-y-4">
                  <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-purple-900">Trending Topic Opportunity</p>
                        <p className="text-xs text-purple-700 mt-1">
                          &quot;AI content optimization&quot; is trending +45% this week. Consider creating content around this topic.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Optimization Suggestion</p>
                        <p className="text-xs text-blue-700 mt-1">
                          3 articles need E-E-A-T improvements. Adding author bios could boost scores by 15-20%.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'briefs' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search content briefs..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>

            {/* Content Briefs Grid */}
            <div className="grid grid-cols-1 gap-6">
              {filteredBriefs.map((brief) => (
                <div key={brief.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{brief.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(brief.status)}`}>
                          {brief.status.replace('-', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {brief.targetKeyword}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {brief.assignedTo}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Due {brief.deadline}
                        </span>
                      </div>

                      {/* Progress Metrics */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">GEO Terms</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getProgressColor((brief.geoTermProgress.used / brief.geoTermProgress.total) * 100)}`}
                                style={{ width: `${(brief.geoTermProgress.used / brief.geoTermProgress.total) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{brief.geoTermProgress.used}/{brief.geoTermProgress.total}</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1">E-E-A-T Score</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getProgressColor(brief.eeatScore)}`}
                                style={{ width: `${brief.eeatScore}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{brief.eeatScore}%</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 mb-1">Target Grade</p>
                          <span className="text-sm font-semibold text-gray-900">{brief.targetMetrics.contentGrade}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="bg-white rounded-lg border border-gray-200 min-h-[600px]">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900">Real-Time Content Editor</h3>
              <p className="text-sm text-gray-500">Select a content brief to start editing</p>
            </div>
            <div className="p-4 text-center text-gray-500">
              <Edit3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Choose a content brief from the Briefs tab to begin editing</p>
            </div>
          </div>
        )}

        {/* Other tabs would be similarly implemented */}
      </div>
    </div>
  );
});

ContentAscentStudio.displayName = 'ContentAscentStudio';

export default ContentAscentStudio;
