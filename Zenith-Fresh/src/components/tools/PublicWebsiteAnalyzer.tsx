'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface AnalysisResults {
  url: string;
  timestamp: string;
  scores: {
    performance: number;
    seo: number;
    security: number;
    accessibility: number;
    overall: number;
  };
  details: {
    [key: string]: {
      score: number;
      issues: string[];
      suggestions: string[];
    };
  };
  metrics: {
    loadTime: number;
    pageSize: number;
    requests: number;
    domElements: number;
  };
  error?: string;
}

export function PublicWebsiteAnalyzer() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeWebsite = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    // Ensure URL has protocol
    let urlToAnalyze = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      urlToAnalyze = 'https://' + url;
    }

    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/website-analyzer/public-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlToAnalyze }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze website');
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Input Section */}
      <div className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && analyzeWebsite()}
            placeholder="Enter website URL (e.g., example.com)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            disabled={isAnalyzing}
          />
          <button
            onClick={analyzeWebsite}
            disabled={isAnalyzing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-red-500 text-sm">{error}</p>
        )}
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="inline-flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Analyzing website performance...</span>
          </div>
        </motion.div>
      )}

      {/* Results Section */}
      {results && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Overall Score */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Overall Score</h2>
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(results.scores.overall)}`}>
                {results.scores.overall}
              </div>
              <div className="text-lg text-gray-600 mt-2">
                {getScoreLabel(results.scores.overall)}
              </div>
            </div>
          </div>

          {/* Category Scores */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(results.scores).map(([category, score]) => {
              if (category === 'overall') return null;
              return (
                <div key={category} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">
                    {category}
                  </h3>
                  <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                    {score}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Analysis */}
          <div className="space-y-6">
            {Object.entries(results.details).map(([category, details]) => (
              <div key={category} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                  {category} Analysis
                </h3>
                
                {details.issues.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-red-600 mb-2">Issues Found:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {details.issues.map((issue, index) => (
                        <li key={index} className="text-sm text-gray-700">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {details.suggestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-600 mb-2">Suggestions:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {details.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-gray-700">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Metrics */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Load Time</p>
                <p className="text-lg font-semibold">{results.metrics.loadTime}ms</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Page Size</p>
                <p className="text-lg font-semibold">
                  {(results.metrics.pageSize / 1024).toFixed(1)} KB
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">DOM Elements</p>
                <p className="text-lg font-semibold">{results.metrics.domElements}</p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>This is a free basic analysis. For advanced features and detailed reports,</p>
            <a href="/auth/signin" className="text-blue-600 hover:text-blue-700">
              sign up for a free account
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}