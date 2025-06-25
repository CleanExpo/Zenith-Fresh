'use client';

import { AnalysisResults } from '@/types/analyzer';
import { ScoreCard } from './ScoreCard';
import { PerformanceSection } from './PerformanceSection';
import { SEOSection } from './SEOSection';
import { SecuritySection } from './SecuritySection';
import { AccessibilitySection } from './AccessibilitySection';
import { RecommendationsSection } from './RecommendationsSection';

interface AnalysisDisplayProps {
  results: AnalysisResults;
}

export function AnalysisDisplay({ results }: AnalysisDisplayProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
            <p className="text-gray-600 mt-1">{results.url}</p>
            <p className="text-sm text-gray-500 mt-1">
              Analyzed on {formatDate(results.timestamp)}
            </p>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(results.overallScore)}`}>
              {results.overallScore}
            </div>
            <div className="text-sm text-gray-500 mt-1">Overall Score</div>
          </div>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ScoreCard
          title="Performance"
          score={Math.round((100 - results.performance.loadTime / 50) * 100) / 100}
          description="Page load speed and metrics"
          color="blue"
        />
        <ScoreCard
          title="SEO"
          score={results.seo.score}
          description="Search engine optimization"
          color="green"
        />
        <ScoreCard
          title="Security"
          score={results.security.score}
          description="Security headers and vulnerabilities"
          color="red"
        />
        <ScoreCard
          title="Accessibility"
          score={results.accessibility.score}
          description="Web accessibility compliance"
          color="purple"
        />
      </div>

      {/* Detailed Sections */}
      <div className="space-y-8">
        <PerformanceSection metrics={results.performance} />
        <SEOSection analysis={results.seo} />
        <SecuritySection findings={results.security} />
        <AccessibilitySection audit={results.accessibility} />
        <RecommendationsSection recommendations={results.recommendations} />
      </div>
    </div>
  );
}