'use client';

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

interface ComparisonData {
  current: any;
  previous: any;
  changes: {
    scoreChange: number;
    analysisCountChange: number;
    alertChange: number;
  };
}

interface ComparisonViewProps {
  projectId: string;
  url?: string;
}

export function ComparisonView({ projectId, url }: ComparisonViewProps) {
  const [comparisonType, setComparisonType] = useState<'period' | 'competitor'>('period');
  const [periodComparison, setPeriodComparison] = useState<ComparisonData | null>(null);
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [competitorData, setCompetitorData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [periodSettings, setPeriodSettings] = useState({
    startDate: '',
    endDate: '',
  });

  const fetchPeriodComparison = async () => {
    if (!periodSettings.startDate || !periodSettings.endDate) return;

    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams({
        projectId,
        comparison: 'period',
        startDate: periodSettings.startDate,
        endDate: periodSettings.endDate,
      });

      if (url) searchParams.append('url', url);

      const response = await fetch(`/api/analytics?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch period comparison');
      }

      const data = await response.json();
      setPeriodComparison(data.comparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comparison');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetitorComparison = async () => {
    if (!competitorUrl) return;

    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams({
        projectId,
        comparison: 'competitor',
        competitorUrl,
      });

      const response = await fetch(`/api/analytics?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch competitor comparison');
      }

      const data = await response.json();
      setCompetitorData(data.comparison || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch competitor data');
    } finally {
      setLoading(false);
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗️';
    if (change < 0) return '↘️';
    return '➡️';
  };

  const renderPeriodComparison = () => {
    if (!periodComparison) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Set date range and click "Compare Periods" to see comparison</p>
        </div>
      );
    }

    const { current, previous, changes } = periodComparison;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border rounded-lg p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Score Change</h4>
            <div className="flex items-center">
              <span className={`text-2xl font-bold ${getChangeColor(changes.scoreChange)}`}>
                {changes.scoreChange > 0 ? '+' : ''}{changes.scoreChange}
              </span>
              <span className="ml-2">{getChangeIcon(changes.scoreChange)}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {previous.averageScore} → {current.averageScore}
            </p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Analysis Count Change</h4>
            <div className="flex items-center">
              <span className={`text-2xl font-bold ${getChangeColor(changes.analysisCountChange)}`}>
                {changes.analysisCountChange > 0 ? '+' : ''}{changes.analysisCountChange}
              </span>
              <span className="ml-2">{getChangeIcon(changes.analysisCountChange)}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {previous.totalAnalyses} → {current.totalAnalyses}
            </p>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Alert Change</h4>
            <div className="flex items-center">
              <span className={`text-2xl font-bold ${getChangeColor(-changes.alertChange)}`}>
                {changes.alertChange > 0 ? '+' : ''}{changes.alertChange}
              </span>
              <span className="ml-2">{getChangeIcon(-changes.alertChange)}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {previous.alerts.total} → {current.alerts.total}
            </p>
          </div>
        </div>

        {/* Detailed Comparison */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Detailed Comparison</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Previous Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Average Score
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {previous.averageScore}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {current.averageScore}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getChangeColor(changes.scoreChange)}`}>
                    {changes.scoreChange > 0 ? '+' : ''}{changes.scoreChange}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Total Analyses
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {previous.totalAnalyses}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {current.totalAnalyses}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getChangeColor(changes.analysisCountChange)}`}>
                    {changes.analysisCountChange > 0 ? '+' : ''}{changes.analysisCountChange}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Active Alerts
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {previous.alerts.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {current.alerts.total}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getChangeColor(-changes.alertChange)}`}>
                    {changes.alertChange > 0 ? '+' : ''}{changes.alertChange}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderCompetitorComparison = () => {
    if (competitorData.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Enter competitor URL and click "Compare" to see competitor analysis</p>
        </div>
      );
    }

    // Create chart data for competitor comparison
    const chartData = {
      labels: competitorData.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Your Score',
          data: competitorData.map(d => d.competitorScore - d.scoreDifference),
          borderColor: '#3B82F6',
          backgroundColor: '#3B82F620',
          tension: 0.4,
        },
        {
          label: 'Competitor Score',
          data: competitorData.map(d => d.competitorScore),
          borderColor: '#EF4444',
          backgroundColor: '#EF444420',
          tension: 0.4,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: 'Performance Comparison Over Time',
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          max: 100,
          title: {
            display: true,
            text: 'Score',
          },
        },
      },
    };

    return (
      <div className="space-y-6">
        {/* Chart */}
        <div className="bg-white border rounded-lg p-6">
          <div style={{ height: '400px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Competitor Analysis Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {competitorData.length > 0 ? (competitorData[0].competitorScore - competitorData[0].scoreDifference) : 0}
              </div>
              <div className="text-sm text-gray-500">Your Latest Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {competitorData.length > 0 ? competitorData[0].competitorScore : 0}
              </div>
              <div className="text-sm text-gray-500">Competitor Latest Score</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                competitorData.length > 0 && competitorData[0].scoreDifference < 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {competitorData.length > 0 ? Math.abs(competitorData[0].scoreDifference) : 0}
              </div>
              <div className="text-sm text-gray-500">
                {competitorData.length > 0 && competitorData[0].scoreDifference < 0 ? 'Points Ahead' : 'Points Behind'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Comparison Type Selector */}
      <div className="flex space-x-4">
        <button
          onClick={() => setComparisonType('period')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            comparisonType === 'period'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Period Comparison
        </button>
        <button
          onClick={() => setComparisonType('competitor')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            comparisonType === 'competitor'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Competitor Comparison
        </button>
      </div>

      {/* Controls */}
      {comparisonType === 'period' ? (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={periodSettings.startDate}
                onChange={(e) => setPeriodSettings(prev => ({ ...prev, startDate: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={periodSettings.endDate}
                onChange={(e) => setPeriodSettings(prev => ({ ...prev, endDate: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={fetchPeriodComparison}
              disabled={loading || !periodSettings.startDate || !periodSettings.endDate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Comparing...' : 'Compare Periods'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Competitor URL</label>
              <input
                type="url"
                value={competitorUrl}
                onChange={(e) => setCompetitorUrl(e.target.value)}
                placeholder="https://competitor.com"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={fetchCompetitorComparison}
              disabled={loading || !competitorUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Compare'}
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <h4 className="font-medium">Error</h4>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      {comparisonType === 'period' ? renderPeriodComparison() : renderCompetitorComparison()}
    </div>
  );
}