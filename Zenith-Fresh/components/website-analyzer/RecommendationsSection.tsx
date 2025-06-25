'use client';

import { Recommendations } from '@/types/analyzer';
import { Target, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

interface RecommendationsSectionProps {
  recommendations: Recommendations;
}

export function RecommendationsSection({ recommendations }: RecommendationsSectionProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <TrendingUp className="w-4 h-4" />;
      case 'low': return <Lightbulb className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getEffortBadge = (effort: string) => {
    const effortColors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    return effortColors[effort as keyof typeof effortColors] || 'bg-gray-100 text-gray-800';
  };

  const RecommendationCard = ({ rec, category }: { rec: any; category: string }) => (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
            {getPriorityIcon(rec.priority)}
            <span className="ml-1 uppercase">{rec.priority}</span>
          </span>
          <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEffortBadge(rec.effort)}`}>
            {rec.effort} effort
          </span>
        </div>
        <span className="text-xs text-gray-500 uppercase font-medium">{category}</span>
      </div>
      
      <h4 className="font-semibold text-gray-900 mb-2">{rec.title}</h4>
      <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
      
      <div className="bg-gray-50 rounded p-2">
        <p className="text-xs text-gray-700">
          <span className="font-medium">Expected Impact:</span> {rec.impact}
        </p>
      </div>
    </div>
  );

  const allRecommendations = [
    ...recommendations.performance.map(rec => ({ ...rec, category: 'Performance' })),
    ...recommendations.seo.map(rec => ({ ...rec, category: 'SEO' })),
    ...recommendations.security.map(rec => ({ ...rec, category: 'Security' })),
    ...recommendations.accessibility.map(rec => ({ ...rec, category: 'Accessibility' })),
  ].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
           (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
  });

  const highPriorityCount = allRecommendations.filter(rec => rec.priority === 'high').length;
  const mediumPriorityCount = allRecommendations.filter(rec => rec.priority === 'medium').length;
  const lowPriorityCount = allRecommendations.filter(rec => rec.priority === 'low').length;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Target className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-xl font-semibold">Recommendations</h3>
        </div>
        <div className="text-sm text-gray-600">
          {allRecommendations.length} total recommendations
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{highPriorityCount}</div>
          <div className="text-sm text-red-800">High Priority</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{mediumPriorityCount}</div>
          <div className="text-sm text-yellow-800">Medium Priority</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{lowPriorityCount}</div>
          <div className="text-sm text-green-800">Low Priority</div>
        </div>
      </div>

      {/* Recommendations List */}
      {allRecommendations.length === 0 ? (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Great job!</h4>
          <p className="text-gray-600">No specific recommendations found. Your website is performing well across all analyzed areas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allRecommendations.map((rec, index) => (
            <RecommendationCard key={index} rec={rec} category={rec.category} />
          ))}
        </div>
      )}

      {/* Implementation Guide */}
      {allRecommendations.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <Lightbulb className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Implementation Guide</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Start with high-priority recommendations for maximum impact</li>
                <li>• Focus on low-effort items first for quick wins</li>
                <li>• Test changes in a staging environment before production</li>
                <li>• Re-run analysis after implementing changes to measure improvement</li>
                <li>• Consider the effort vs. impact ratio when prioritizing tasks</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}