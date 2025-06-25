'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckIcon, 
  XMarkIcon, 
  MinusIcon,
  PlusIcon,
  ArrowsUpDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

interface Feature {
  id: string;
  name: string;
  category: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
}

interface Competitor {
  id: string;
  name: string;
  logo?: string;
  domain: string;
}

interface FeatureImplementation {
  competitorId: string;
  featureId: string;
  status: 'available' | 'limited' | 'unavailable' | 'unknown';
  quality: number; // 1-5 rating
  notes?: string;
  lastVerified: string;
}

interface FeatureComparisonProps {
  projectId?: string;
}

export function FeatureComparison({ projectId }: FeatureComparisonProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [implementations, setImplementations] = useState<FeatureImplementation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddFeature, setShowAddFeature] = useState(false);
  const [newFeature, setNewFeature] = useState<Partial<Feature>>({});

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockCompetitors: Competitor[] = [
        { id: 'zenith', name: 'Zenith Platform', domain: 'zenith.engineer' },
        { id: 'webflow', name: 'WebFlow Analytics', domain: 'webflow-analytics.com' },
        { id: 'sitemetrics', name: 'SiteMetrics Pro', domain: 'sitemetrics.pro' },
        { id: 'analyzethis', name: 'AnalyzeThis', domain: 'analyzethis.io' }
      ];

      const mockFeatures: Feature[] = [
        {
          id: '1',
          name: 'Website Performance Analysis',
          category: 'Core Features',
          description: 'Comprehensive website performance monitoring and analysis',
          importance: 'critical'
        },
        {
          id: '2',
          name: 'PDF Report Generation',
          category: 'Reporting',
          description: 'Generate branded PDF reports with analysis results',
          importance: 'high'
        },
        {
          id: '3',
          name: 'Scheduled Scans',
          category: 'Automation',
          description: 'Automated website scanning on custom schedules',
          importance: 'high'
        },
        {
          id: '4',
          name: 'Team Collaboration',
          category: 'Collaboration',
          description: 'Multi-user team management and project sharing',
          importance: 'medium'
        },
        {
          id: '5',
          name: 'API Access',
          category: 'Integration',
          description: 'REST API for external integrations',
          importance: 'high'
        },
        {
          id: '6',
          name: 'White Label Solution',
          category: 'Enterprise',
          description: 'Custom branding and white-label deployment',
          importance: 'medium'
        },
        {
          id: '7',
          name: 'Mobile App',
          category: 'Accessibility',
          description: 'Native mobile application for iOS and Android',
          importance: 'low'
        },
        {
          id: '8',
          name: 'AI-Powered Recommendations',
          category: 'AI Features',
          description: 'AI-driven optimization recommendations',
          importance: 'high'
        },
        {
          id: '9',
          name: 'Competitive Intelligence',
          category: 'Enterprise',
          description: 'Competitor analysis and market intelligence',
          importance: 'medium'
        },
        {
          id: '10',
          name: '24/7 Support',
          category: 'Support',
          description: 'Round-the-clock customer support',
          importance: 'high'
        }
      ];

      const mockImplementations: FeatureImplementation[] = [
        // Zenith Platform
        { competitorId: 'zenith', featureId: '1', status: 'available', quality: 5, lastVerified: '2024-01-15' },
        { competitorId: 'zenith', featureId: '2', status: 'available', quality: 5, lastVerified: '2024-01-15' },
        { competitorId: 'zenith', featureId: '3', status: 'available', quality: 5, lastVerified: '2024-01-15' },
        { competitorId: 'zenith', featureId: '4', status: 'available', quality: 4, lastVerified: '2024-01-15' },
        { competitorId: 'zenith', featureId: '5', status: 'available', quality: 5, lastVerified: '2024-01-15' },
        { competitorId: 'zenith', featureId: '6', status: 'limited', quality: 3, lastVerified: '2024-01-15' },
        { competitorId: 'zenith', featureId: '7', status: 'unavailable', quality: 0, lastVerified: '2024-01-15' },
        { competitorId: 'zenith', featureId: '8', status: 'available', quality: 5, lastVerified: '2024-01-15' },
        { competitorId: 'zenith', featureId: '9', status: 'available', quality: 4, lastVerified: '2024-01-15' },
        { competitorId: 'zenith', featureId: '10', status: 'limited', quality: 3, lastVerified: '2024-01-15' },

        // WebFlow Analytics
        { competitorId: 'webflow', featureId: '1', status: 'available', quality: 4, lastVerified: '2024-01-10' },
        { competitorId: 'webflow', featureId: '2', status: 'available', quality: 3, lastVerified: '2024-01-10' },
        { competitorId: 'webflow', featureId: '3', status: 'available', quality: 4, lastVerified: '2024-01-10' },
        { competitorId: 'webflow', featureId: '4', status: 'limited', quality: 3, lastVerified: '2024-01-10' },
        { competitorId: 'webflow', featureId: '5', status: 'available', quality: 4, lastVerified: '2024-01-10' },
        { competitorId: 'webflow', featureId: '6', status: 'available', quality: 4, lastVerified: '2024-01-10' },
        { competitorId: 'webflow', featureId: '7', status: 'available', quality: 3, lastVerified: '2024-01-10' },
        { competitorId: 'webflow', featureId: '8', status: 'limited', quality: 2, lastVerified: '2024-01-10' },
        { competitorId: 'webflow', featureId: '9', status: 'unavailable', quality: 0, lastVerified: '2024-01-10' },
        { competitorId: 'webflow', featureId: '10', status: 'available', quality: 4, lastVerified: '2024-01-10' },

        // SiteMetrics Pro
        { competitorId: 'sitemetrics', featureId: '1', status: 'available', quality: 3, lastVerified: '2024-01-12' },
        { competitorId: 'sitemetrics', featureId: '2', status: 'limited', quality: 2, lastVerified: '2024-01-12' },
        { competitorId: 'sitemetrics', featureId: '3', status: 'available', quality: 3, lastVerified: '2024-01-12' },
        { competitorId: 'sitemetrics', featureId: '4', status: 'unavailable', quality: 0, lastVerified: '2024-01-12' },
        { competitorId: 'sitemetrics', featureId: '5', status: 'limited', quality: 2, lastVerified: '2024-01-12' },
        { competitorId: 'sitemetrics', featureId: '6', status: 'unavailable', quality: 0, lastVerified: '2024-01-12' },
        { competitorId: 'sitemetrics', featureId: '7', status: 'unavailable', quality: 0, lastVerified: '2024-01-12' },
        { competitorId: 'sitemetrics', featureId: '8', status: 'limited', quality: 2, lastVerified: '2024-01-12' },
        { competitorId: 'sitemetrics', featureId: '9', status: 'unavailable', quality: 0, lastVerified: '2024-01-12' },
        { competitorId: 'sitemetrics', featureId: '10', status: 'limited', quality: 2, lastVerified: '2024-01-12' },

        // AnalyzeThis
        { competitorId: 'analyzethis', featureId: '1', status: 'available', quality: 3, lastVerified: '2024-01-08' },
        { competitorId: 'analyzethis', featureId: '2', status: 'available', quality: 4, lastVerified: '2024-01-08' },
        { competitorId: 'analyzethis', featureId: '3', status: 'limited', quality: 2, lastVerified: '2024-01-08' },
        { competitorId: 'analyzethis', featureId: '4', status: 'limited', quality: 2, lastVerified: '2024-01-08' },
        { competitorId: 'analyzethis', featureId: '5', status: 'available', quality: 3, lastVerified: '2024-01-08' },
        { competitorId: 'analyzethis', featureId: '6', status: 'unavailable', quality: 0, lastVerified: '2024-01-08' },
        { competitorId: 'analyzethis', featureId: '7', status: 'unavailable', quality: 0, lastVerified: '2024-01-08' },
        { competitorId: 'analyzethis', featureId: '8', status: 'available', quality: 4, lastVerified: '2024-01-08' },
        { competitorId: 'analyzethis', featureId: '9', status: 'unavailable', quality: 0, lastVerified: '2024-01-08' },
        { competitorId: 'analyzethis', featureId: '10', status: 'limited', quality: 2, lastVerified: '2024-01-08' }
      ];

      setCompetitors(mockCompetitors);
      setFeatures(mockFeatures);
      setImplementations(mockImplementations);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckIcon className="h-5 w-5 text-green-500" />;
      case 'limited':
        return <MinusIcon className="h-5 w-5 text-yellow-500" />;
      case 'unavailable':
        return <XMarkIcon className="h-5 w-5 text-red-500" />;
      default:
        return <span className="h-5 w-5 text-gray-400">?</span>;
    }
  };

  const getQualityStars = (quality: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < quality ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = ['all', ...Array.from(new Set(features.map(f => f.category)))];
  
  const filteredFeatures = features.filter(feature => {
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
    const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getImplementation = (competitorId: string, featureId: string) => {
    return implementations.find(impl => 
      impl.competitorId === competitorId && impl.featureId === featureId
    );
  };

  const addFeature = () => {
    if (newFeature.name && newFeature.category && newFeature.description) {
      const feature: Feature = {
        id: Date.now().toString(),
        name: newFeature.name,
        category: newFeature.category,
        description: newFeature.description,
        importance: newFeature.importance || 'medium'
      };
      setFeatures([...features, feature]);
      setNewFeature({});
      setShowAddFeature(false);
    }
  };

  const exportComparison = () => {
    // Create CSV export
    const csvData = [
      ['Feature', 'Category', 'Importance', ...competitors.map(c => c.name)],
      ...filteredFeatures.map(feature => [
        feature.name,
        feature.category,
        feature.importance,
        ...competitors.map(competitor => {
          const impl = getImplementation(competitor.id, feature.id);
          return impl ? `${impl.status} (${impl.quality}/5)` : 'unknown';
        })
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'feature-comparison.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feature Comparison</h2>
          <p className="text-gray-600">Compare features across competitors</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportComparison}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowAddFeature(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Feature</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64"
          />
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                {competitors.map(competitor => (
                  <th key={competitor.id} className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                    {competitor.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFeatures.map((feature) => (
                <tr key={feature.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">{feature.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImportanceColor(feature.importance)}`}>
                            {feature.importance}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{feature.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{feature.category}</p>
                      </div>
                    </div>
                  </td>
                  {competitors.map(competitor => {
                    const implementation = getImplementation(competitor.id, feature.id);
                    return (
                      <td key={competitor.id} className="px-6 py-4 text-center">
                        {implementation ? (
                          <div className="space-y-1">
                            <div className="flex justify-center">
                              {getStatusIcon(implementation.status)}
                            </div>
                            <div className="flex justify-center">
                              {getQualityStars(implementation.quality)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(implementation.lastVerified).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Unknown</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <CheckIcon className="h-4 w-4 text-green-500" />
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <MinusIcon className="h-4 w-4 text-yellow-500" />
            <span>Limited</span>
          </div>
          <div className="flex items-center space-x-2">
            <XMarkIcon className="h-4 w-4 text-red-500" />
            <span>Unavailable</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-yellow-400">★★★★★</span>
            <span>Quality Rating</span>
          </div>
        </div>
      </div>

      {/* Add Feature Modal */}
      {showAddFeature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Feature</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feature Name
                </label>
                <input
                  type="text"
                  value={newFeature.name || ''}
                  onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter feature name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={newFeature.category || ''}
                  onChange={(e) => setNewFeature({ ...newFeature, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter category"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newFeature.description || ''}
                  onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importance
                </label>
                <select
                  value={newFeature.importance || 'medium'}
                  onChange={(e) => setNewFeature({ ...newFeature, importance: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddFeature(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={addFeature}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                Add Feature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}