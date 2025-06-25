'use client';

import React, { useState, useEffect } from 'react';
import { 
  GlobeAltIcon, 
  ChartBarIcon, 
  TrophyIcon, 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  EyeIcon,
  CurrencyDollarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface Competitor {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  description: string;
  founded: number;
  employees: string;
  funding: string;
  status: 'active' | 'monitoring' | 'inactive';
  lastUpdated: string;
  metrics: {
    trafficRank: number;
    monthlyVisitors: string;
    marketShare: number;
    growthRate: number;
    trustScore: number;
    technologyStack: string[];
  };
  pricing: {
    startingPrice: number;
    currency: string;
    model: 'subscription' | 'one-time' | 'freemium' | 'enterprise';
  };
  strengths: string[];
  weaknesses: string[];
  threats: string[];
  opportunities: string[];
}

interface CompetitorOverviewProps {
  projectId?: string;
}

export function CompetitorOverview({ projectId }: CompetitorOverviewProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    // Simulate API call to fetch competitors
    const fetchCompetitors = async () => {
      setLoading(true);
      try {
        // Mock data - replace with actual API call
        const mockCompetitors: Competitor[] = [
          {
            id: '1',
            name: 'WebFlow Analytics',
            domain: 'webflow-analytics.com',
            description: 'Leading website performance analysis platform',
            founded: 2018,
            employees: '100-250',
            funding: '$50M Series B',
            status: 'active',
            lastUpdated: '2 hours ago',
            metrics: {
              trafficRank: 15420,
              monthlyVisitors: '2.3M',
              marketShare: 12.5,
              growthRate: 23.4,
              trustScore: 87,
              technologyStack: ['React', 'Node.js', 'PostgreSQL', 'AWS']
            },
            pricing: {
              startingPrice: 29,
              currency: 'USD',
              model: 'subscription'
            },
            strengths: ['Strong brand recognition', 'Advanced analytics', 'Good documentation'],
            weaknesses: ['Higher pricing', 'Complex onboarding', 'Limited integrations'],
            threats: ['New market entrants', 'Price competition'],
            opportunities: ['AI integration', 'Mobile analytics', 'International expansion']
          },
          {
            id: '2',
            name: 'SiteMetrics Pro',
            domain: 'sitemetrics.pro',
            description: 'Enterprise website monitoring and optimization',
            founded: 2020,
            employees: '50-100',
            funding: '$15M Series A',
            status: 'monitoring',
            lastUpdated: '1 day ago',
            metrics: {
              trafficRank: 28750,
              monthlyVisitors: '1.1M',
              marketShare: 8.3,
              growthRate: 45.2,
              trustScore: 79,
              technologyStack: ['Vue.js', 'Python', 'MongoDB', 'GCP']
            },
            pricing: {
              startingPrice: 19,
              currency: 'USD',
              model: 'freemium'
            },
            strengths: ['Competitive pricing', 'Fast growing', 'Modern UI'],
            weaknesses: ['Limited enterprise features', 'Newer brand', 'Smaller team'],
            threats: ['Funding dependency', 'Talent acquisition'],
            opportunities: ['Enterprise market', 'Partnership opportunities', 'Feature expansion']
          },
          {
            id: '3',
            name: 'AnalyzeThis',
            domain: 'analyzethis.io',
            description: 'AI-powered website intelligence platform',
            founded: 2019,
            employees: '25-50',
            funding: '$8M Seed',
            status: 'active',
            lastUpdated: '5 hours ago',
            metrics: {
              trafficRank: 45690,
              monthlyVisitors: '650K',
              marketShare: 5.7,
              growthRate: -8.1,
              trustScore: 72,
              technologyStack: ['Angular', 'Java', 'MySQL', 'Azure']
            },
            pricing: {
              startingPrice: 39,
              currency: 'USD',
              model: 'subscription'
            },
            strengths: ['AI capabilities', 'Detailed reports', 'API access'],
            weaknesses: ['Declining growth', 'Limited marketing', 'Outdated UI'],
            threats: ['Market consolidation', 'Technology debt'],
            opportunities: ['UI modernization', 'Marketing investment', 'Strategic partnerships']
          }
        ];
        
        setCompetitors(mockCompetitors);
      } catch (error) {
        console.error('Error fetching competitors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitors();
  }, [projectId]);

  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
    if (growth < 0) return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
    return <MinusIcon className="h-4 w-4 text-gray-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'monitoring': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <h2 className="text-2xl font-bold text-gray-900">Competitor Overview</h2>
          <p className="text-gray-600">Monitor and analyze your competitive landscape</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Competitors</p>
              <p className="text-2xl font-bold text-gray-900">{competitors.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <EyeIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Monitoring</p>
              <p className="text-2xl font-bold text-gray-900">
                {competitors.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <TrophyIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Market Leaders</p>
              <p className="text-2xl font-bold text-gray-900">
                {competitors.filter(c => c.metrics.marketShare > 10).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Growing Fast</p>
              <p className="text-2xl font-bold text-gray-900">
                {competitors.filter(c => c.metrics.growthRate > 20).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Competitors List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitors.map((competitor) => (
            <div
              key={competitor.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedCompetitor(competitor)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <GlobeAltIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{competitor.name}</h3>
                    <p className="text-sm text-gray-500">{competitor.domain}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(competitor.status)}`}>
                  {competitor.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">{competitor.description}</p>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Market Share</span>
                  <span className="font-medium">{competitor.metrics.marketShare}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Monthly Visitors</span>
                  <span className="font-medium">{competitor.metrics.monthlyVisitors}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Growth Rate</span>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(competitor.metrics.growthRate)}
                    <span className="font-medium">{Math.abs(competitor.metrics.growthRate)}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Starting Price</span>
                  <span className="font-medium">
                    ${competitor.pricing.startingPrice}/{competitor.pricing.model === 'subscription' ? 'mo' : 'one-time'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Competitor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market Share
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Visitors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trust Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {competitors.map((competitor) => (
                <tr
                  key={competitor.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedCompetitor(competitor)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <GlobeAltIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{competitor.name}</div>
                        <div className="text-sm text-gray-500">{competitor.domain}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {competitor.metrics.marketShare}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {competitor.metrics.monthlyVisitors}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(competitor.metrics.growthRate)}
                      <span className="text-sm text-gray-900">{Math.abs(competitor.metrics.growthRate)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {competitor.metrics.trustScore}/100
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(competitor.status)}`}>
                      {competitor.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Competitor Detail Modal */}
      {selectedCompetitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedCompetitor.name}</h3>
                <p className="text-gray-600">{selectedCompetitor.domain}</p>
              </div>
              <button
                onClick={() => setSelectedCompetitor(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Company Info</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-500">Founded:</span> {selectedCompetitor.founded}</div>
                  <div><span className="text-gray-500">Employees:</span> {selectedCompetitor.employees}</div>
                  <div><span className="text-gray-500">Funding:</span> {selectedCompetitor.funding}</div>
                  <div><span className="text-gray-500">Last Updated:</span> {selectedCompetitor.lastUpdated}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Key Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-500">Traffic Rank:</span> #{selectedCompetitor.metrics.trafficRank.toLocaleString()}</div>
                  <div><span className="text-gray-500">Monthly Visitors:</span> {selectedCompetitor.metrics.monthlyVisitors}</div>
                  <div><span className="text-gray-500">Market Share:</span> {selectedCompetitor.metrics.marketShare}%</div>
                  <div><span className="text-gray-500">Trust Score:</span> {selectedCompetitor.metrics.trustScore}/100</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Strengths</h4>
                <ul className="text-sm space-y-1">
                  {selectedCompetitor.strengths.map((strength, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Weaknesses</h4>
                <ul className="text-sm space-y-1">
                  {selectedCompetitor.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedCompetitor(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600">
                View Full Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}