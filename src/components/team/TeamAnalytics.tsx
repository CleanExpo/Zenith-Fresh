'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Calendar,
  Download
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface TeamAnalyticsProps {
  teamId: string;
}

interface AnalyticsData {
  analytics: {
    totalRequests: number;
    totalTokens: number;
    growthRate: number;
    usageStats: Array<{
      date: string;
      requests: number;
      tokens: number;
    }>;
    dailyAverages: {
      requests: number;
      tokens: number;
    };
    collaboration: {
      totalMembers: number;
      activeMembers: number;
      totalProjects: number;
      activeProjects: number;
      projectsPerMember: number;
    };
    memberActivity: Array<{
      id: string;
      user: {
        id: string;
        name: string;
        email: string;
        image?: string;
      };
      role: string;
      activityCount: number;
      lastActivity: string;
      joinedAt: string;
    }>;
    recentActivity: Array<{
      id: string;
      action: string;
      user: {
        id: string;
        name: string;
        email: string;
      };
      project?: {
        id: string;
        name: string;
      };
      createdAt: string;
      details?: string;
    }>;
    activityByType: Record<string, number>;
    timeframe: string;
  };
}

const CHART_COLORS = {
  primary: '#2563EB',
  secondary: '#059669',
  accent: '#7C3AED',
  warning: '#D97706',
  error: '#DC2626'
};

const ACTIVITY_COLORS = ['#2563EB', '#059669', '#7C3AED', '#D97706', '#DC2626', '#0891B2', '#BE185D'];

export function TeamAnalytics({ teamId }: TeamAnalyticsProps) {
  const [timeframe, setTimeframe] = useState('30d');

  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['teamAnalytics', teamId, timeframe],
    queryFn: () => api.get(`/api/teams/${teamId}/analytics?timeframe=${timeframe}`)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-destructive">Failed to load analytics</div>
      </div>
    );
  }

  const { analytics } = data;

  // Prepare activity type data for pie chart
  const activityTypeData = Object.entries(analytics.activityByType).map(([type, count], index) => ({
    name: type.replace('_', ' ').toLowerCase(),
    value: count,
    fill: ACTIVITY_COLORS[index % ACTIVITY_COLORS.length]
  }));

  const handleExportData = () => {
    const exportData = {
      teamId,
      timeframe,
      exportedAt: new Date().toISOString(),
      analytics
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-analytics-${teamId}-${timeframe}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Analytics</h2>
          <p className="text-muted-foreground">
            Insights and metrics for your team's activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={handleExportData}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalRequests.toLocaleString()}
            </div>
            <div className="flex items-center text-xs mt-1">
              {analytics.growthRate >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={analytics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                {analytics.growthRate >= 0 ? '+' : ''}{analytics.growthRate}%
              </span>
              <span className="text-muted-foreground ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.collaboration.activeMembers}
            </div>
            <div className="text-xs text-muted-foreground">
              of {analytics.collaboration.totalMembers} total members
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.collaboration.activeProjects}
            </div>
            <div className="text-xs text-muted-foreground">
              of {analytics.collaboration.totalProjects} total projects
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.dailyAverages.requests}
            </div>
            <div className="text-xs text-muted-foreground">
              requests per day
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Usage Over Time */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Usage Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.usageStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), 'MMM d')}
                    stroke="#6B7280"
                  />
                  <YAxis yAxisId="left" stroke="#6B7280" />
                  <YAxis yAxisId="right" orientation="right" stroke="#6B7280" />
                  <Tooltip
                    labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.375rem',
                      color: '#F9FAFB'
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="requests"
                    stroke={CHART_COLORS.primary}
                    name="Requests"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="tokens"
                    stroke={CHART_COLORS.secondary}
                    name="Tokens"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Types */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {activityTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Member Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Member Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.memberActivity.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {member.user.image ? (
                        <img 
                          src={member.user.image} 
                          alt={member.user.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {member.user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{member.user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.activityCount} actions
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize text-xs">
                    {member.role.toLowerCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {activity.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>{' '}
                    <span className="text-muted-foreground">
                      {activity.action.replace('_', ' ').toLowerCase()}
                    </span>
                    {activity.project && (
                      <>
                        {' '}in{' '}
                        <span className="font-medium">{activity.project.name}</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(activity.createdAt), 'MMM d, yyyy at h:mm a')}
                  </div>
                </div>
              </div>
            ))}
            
            {analytics.recentActivity.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}