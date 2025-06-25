'use client';

import React, { useState, useEffect } from 'react';
import { 
  BoltIcon, 
  LightBulbIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ClockIcon,
  CpuChipIcon,
  ServerIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';

interface Recommendation {
  id: string;
  category: 'performance' | 'cost' | 'security' | 'reliability';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  estimatedImprovement: string;
  status: 'new' | 'in-progress' | 'completed' | 'dismissed';
  relatedMetric: string;
  currentValue: string;
  targetValue: string;
  implementationSteps: string[];
  resources: string[];
  timeframe: string;
  tags: string[];
}

interface OptimizationInsights {
  totalRecommendations: number;
  criticalIssues: number;
  potentialSavings: string;
  estimatedImprovements: {
    responseTime: string;
    throughput: string;
    costSavings: string;
    reliability: string;
  };
}

export function OptimizationRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [insights, setInsights] = useState<OptimizationInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        
        // Generate mock recommendations
        const mockRecommendations = generateMockRecommendations();
        const mockInsights = calculateInsights(mockRecommendations);
        
        setRecommendations(mockRecommendations);
        setInsights(mockInsights);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const generateMockRecommendations = (): Recommendation[] => {
    return [
      {
        id: 'rec-1',
        category: 'performance',
        priority: 'high',
        title: 'Implement Database Connection Pooling',
        description: 'Database connections are being created and destroyed frequently, causing performance overhead.',
        impact: 'Reduce database connection overhead by 60% and improve response times',
        effort: 'medium',
        estimatedImprovement: '40% faster database queries',
        status: 'new',
        relatedMetric: 'Database Response Time',
        currentValue: '45ms average',
        targetValue: '25ms average',
        implementationSteps: [
          'Configure connection pool with max 20 connections',
          'Set connection timeout to 30 seconds',
          'Implement connection health checks',
          'Monitor pool utilization metrics'
        ],
        resources: [
          'Database connection pool documentation',
          'Performance monitoring tools',
          'Database administrator'
        ],
        timeframe: '1-2 weeks',
        tags: ['database', 'performance', 'connections']
      },
      {
        id: 'rec-2',
        category: 'performance',
        priority: 'high',
        title: 'Enable Redis Caching for API Responses',
        description: 'Frequently accessed API endpoints are not utilizing caching, leading to unnecessary database queries.',
        impact: 'Reduce API response time by 70% for cached endpoints',
        effort: 'medium',
        estimatedImprovement: '200ms -> 60ms response time',
        status: 'new',
        relatedMetric: 'API Response Time',
        currentValue: '200ms average',
        targetValue: '60ms average',
        implementationSteps: [
          'Identify cacheable endpoints',
          'Implement Redis caching layer',
          'Set appropriate TTL values',
          'Add cache invalidation logic',
          'Monitor cache hit rates'
        ],
        resources: [
          'Redis documentation',
          'Caching best practices guide',
          'Backend development team'
        ],
        timeframe: '2-3 weeks',
        tags: ['caching', 'redis', 'api', 'performance']
      },
      {
        id: 'rec-3',
        category: 'cost',
        priority: 'medium',
        title: 'Optimize Container Resource Allocation',
        description: 'Containers are over-provisioned with CPU and memory resources that are not being utilized.',
        impact: 'Reduce infrastructure costs by 30% without performance impact',
        effort: 'low',
        estimatedImprovement: '$400/month cost savings',
        status: 'new',
        relatedMetric: 'Resource Utilization',
        currentValue: '45% average utilization',
        targetValue: '75% average utilization',
        implementationSteps: [
          'Analyze resource usage patterns',
          'Right-size container allocations',
          'Implement horizontal auto-scaling',
          'Set resource limits and requests',
          'Monitor cost impact'
        ],
        resources: [
          'Container orchestration documentation',
          'Cost monitoring tools',
          'DevOps team'
        ],
        timeframe: '1 week',
        tags: ['containers', 'cost', 'resources', 'optimization']
      },
      {
        id: 'rec-4',
        category: 'security',
        priority: 'high',
        title: 'Enable Rate Limiting on API Endpoints',
        description: 'API endpoints lack rate limiting, making them vulnerable to abuse and potential DDoS attacks.',
        impact: 'Improve security posture and prevent resource abuse',
        effort: 'low',
        estimatedImprovement: '99% reduction in abusive requests',
        status: 'new',
        relatedMetric: 'API Request Rate',
        currentValue: 'Unlimited',
        targetValue: '1000 req/min per user',
        implementationSteps: [
          'Implement rate limiting middleware',
          'Define rate limits per endpoint',
          'Add rate limit headers',
          'Configure bypass for trusted sources',
          'Monitor rate limit violations'
        ],
        resources: [
          'Rate limiting middleware documentation',
          'Security best practices',
          'Security team'
        ],
        timeframe: '3-5 days',
        tags: ['security', 'rate-limiting', 'api', 'protection']
      },
      {
        id: 'rec-5',
        category: 'reliability',
        priority: 'medium',
        title: 'Implement Circuit Breaker Pattern',
        description: 'External service failures can cascade and impact overall system reliability.',
        impact: 'Improve system resilience and reduce cascade failures',
        effort: 'medium',
        estimatedImprovement: '95% reduction in cascade failures',
        status: 'in-progress',
        relatedMetric: 'System Availability',
        currentValue: '99.8%',
        targetValue: '99.95%',
        implementationSteps: [
          'Identify external dependencies',
          'Implement circuit breaker pattern',
          'Configure failure thresholds',
          'Add fallback mechanisms',
          'Monitor circuit breaker states'
        ],
        resources: [
          'Circuit breaker pattern documentation',
          'Resilience engineering guides',
          'Architecture team'
        ],
        timeframe: '2-3 weeks',
        tags: ['reliability', 'circuit-breaker', 'resilience']
      },
      {
        id: 'rec-6',
        category: 'performance',
        priority: 'low',
        title: 'Implement Image Optimization',
        description: 'Static images are not optimized for web delivery, causing slower page load times.',
        impact: 'Reduce page load time by 25% and bandwidth usage by 40%',
        effort: 'low',
        estimatedImprovement: '1.2s faster page loads',
        status: 'new',
        relatedMetric: 'Page Load Time',
        currentValue: '3.8s average',
        targetValue: '2.6s average',
        implementationSteps: [
          'Implement image compression',
          'Add WebP format support',
          'Enable lazy loading',
          'Use responsive images',
          'Set up CDN for image delivery'
        ],
        resources: [
          'Image optimization tools',
          'CDN documentation',
          'Frontend development team'
        ],
        timeframe: '1 week',
        tags: ['images', 'optimization', 'performance', 'cdn']
      }
    ];
  };

  const calculateInsights = (recommendations: Recommendation[]): OptimizationInsights => {
    const criticalIssues = recommendations.filter(r => r.priority === 'high').length;
    const potentialSavings = '$1,200/month';
    
    return {
      totalRecommendations: recommendations.length,
      criticalIssues,
      potentialSavings,
      estimatedImprovements: {
        responseTime: '65% faster',
        throughput: '40% increase',
        costSavings: '30% reduction',
        reliability: '99.95% uptime'
      }
    };
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const categoryMatch = selectedCategory === 'all' || rec.category === selectedCategory;
    const priorityMatch = selectedPriority === 'all' || rec.priority === selectedPriority;
    return categoryMatch && priorityMatch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return <BoltIcon className="h-5 w-5 text-blue-500" />;
      case 'cost':
        return <CircleStackIcon className="h-5 w-5 text-green-500" />;
      case 'security':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'reliability':
        return <ServerIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <LightBulbIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortIcon = (effort: string) => {
    switch (effort) {
      case 'low':
        return <div className="flex space-x-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div><div className="w-2 h-2 bg-gray-300 rounded-full"></div><div className="w-2 h-2 bg-gray-300 rounded-full"></div></div>;
      case 'medium':
        return <div className="flex space-x-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div><div className="w-2 h-2 bg-yellow-500 rounded-full"></div><div className="w-2 h-2 bg-gray-300 rounded-full"></div></div>;
      case 'high':
        return <div className="flex space-x-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div><div className="w-2 h-2 bg-red-500 rounded-full"></div><div className="w-2 h-2 bg-red-500 rounded-full"></div></div>;
      default:
        return <div className="flex space-x-1"><div className="w-2 h-2 bg-gray-300 rounded-full"></div><div className="w-2 h-2 bg-gray-300 rounded-full"></div><div className="w-2 h-2 bg-gray-300 rounded-full"></div></div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Analyzing system performance...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Insights Overview */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
            <div className="flex items-center">
              <LightBulbIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Recommendations</p>
                <p className="text-2xl font-semibold text-blue-900">{insights.totalRecommendations}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200 p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Critical Issues</p>
                <p className="text-2xl font-semibold text-red-900">{insights.criticalIssues}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
            <div className="flex items-center">
              <CircleStackIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Potential Savings</p>
                <p className="text-2xl font-semibold text-green-900">{insights.potentialSavings}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
            <div className="flex items-center">
              <BoltIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Performance Gain</p>
                <p className="text-2xl font-semibold text-purple-900">{insights.estimatedImprovements.responseTime}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estimated Impact */}
      {insights && (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Estimated Impact of All Recommendations</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{insights.estimatedImprovements.responseTime}</div>
                <div className="text-sm text-gray-500">Response Time Improvement</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{insights.estimatedImprovements.throughput}</div>
                <div className="text-sm text-gray-500">Throughput Increase</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{insights.estimatedImprovements.costSavings}</div>
                <div className="text-sm text-gray-500">Cost Reduction</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">{insights.estimatedImprovements.reliability}</div>
                <div className="text-sm text-gray-500">Target Uptime</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="performance">Performance</option>
            <option value="cost">Cost</option>
            <option value="security">Security</option>
            <option value="reliability">Reliability</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.map((rec) => (
          <div key={rec.id} className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getCategoryIcon(rec.category)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{rec.title}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                        {rec.priority.toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(rec.status)}`}>
                        {rec.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{rec.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <BoltIcon className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-700 font-medium">{rec.estimatedImprovement}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-700">{rec.timeframe}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">Effort:</span>
                        {getEffortIcon(rec.effort)}
                        <span className="text-sm text-gray-500 capitalize">{rec.effort}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Current:</span> {rec.currentValue}
                      </div>
                      <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="font-medium">Target:</span> {rec.targetValue}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {rec.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                  className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowRightIcon 
                    className={`h-5 w-5 transform transition-transform ${
                      expandedId === rec.id ? 'rotate-90' : ''
                    }`} 
                  />
                </button>
              </div>

              {/* Expanded Details */}
              {expandedId === rec.id && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-3">Implementation Steps</h5>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                        {rec.implementationSteps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-3">Required Resources</h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {rec.resources.map((resource, index) => (
                          <li key={index}>{resource}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                      Start Implementation
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium">
                      Mark as Completed
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium">
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="text-center py-12">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No recommendations found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedCategory !== 'all' || selectedPriority !== 'all' 
              ? 'Try adjusting your filters to see more recommendations.'
              : 'Your system is running optimally! Check back later for new recommendations.'
            }
          </p>
        </div>
      )}
    </div>
  );
}