'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity,
  Brain,
  Download,
  Plus,
  Settings
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description?: string;
}

interface AIInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'prediction' | 'recommendation';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTeams();
    }
  }, [status]);

  useEffect(() => {
    if (selectedTeam) {
      fetchInsights();
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
        if (data.teams && data.teams.length > 0) {
          setSelectedTeam(data.teams[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    if (!selectedTeam) return;

    try {
      const response = await fetch(
        `/api/analytics/insights/ai?teamId=${selectedTeam}&timeRange=30d`
      );
      if (response.ok) {
        const data = await response.json();
        const allInsights = [
          ...(data.insights.anomalies || []),
          ...(data.insights.trends || []),
          ...(data.insights.predictions || []),
          ...(data.insights.recommendations || [])
        ];
        setInsights(allInsights.slice(0, 5)); // Show top 5 insights
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return <Activity className="w-4 h-4" />;
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'prediction': return <Brain className="w-4 h-4" />;
      case 'recommendation': return <BarChart3 className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to access the analytics dashboard.</p>
            <Button onClick={() => window.location.href = '/auth/signin'}>
              Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">No Teams Found</h2>
            <p className="text-gray-600 mb-4">You need to be part of a team to access analytics.</p>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              </div>
              
              {/* Team Selector */}
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              >
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {selectedTeam && (
              <AnalyticsDashboard 
                teamId={selectedTeam}
                dashboardId="default"
              />
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">AI-Powered Insights</h2>
                <p className="text-gray-600 mt-1">
                  Automated analysis and recommendations based on your data
                </p>
              </div>
              <Button onClick={fetchInsights}>
                <Brain className="w-4 h-4 mr-2" />
                Refresh Insights
              </Button>
            </div>

            {insights.length === 0 ? (
              <Card className="p-8">
                <div className="text-center">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Available</h3>
                  <p className="text-gray-600">
                    AI insights will appear here as your data grows. Try again later.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {insights.map((insight) => (
                  <Card key={insight.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getSeverityColor(insight.severity)}`}>
                          {getTypeIcon(insight.type)}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {insight.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {insight.type}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getSeverityColor(insight.severity)}`}
                            >
                              {insight.severity}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {Math.round(insight.confidence * 100)}% confidence
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {insight.actionable && (
                        <Button size="sm" variant="outline">
                          Take Action
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed">
                      {insight.description}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
                <p className="text-gray-600 mt-1">
                  Create and manage custom analytics reports
                </p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Report
              </Button>
            </div>

            <Card className="p-8">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Report Builder Coming Soon</h3>
                <p className="text-gray-600 mb-4">
                  Advanced report builder with drag-and-drop interface will be available in the next update.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Current Data
                  </Button>
                  <Button variant="outline">
                    Schedule Demo
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}