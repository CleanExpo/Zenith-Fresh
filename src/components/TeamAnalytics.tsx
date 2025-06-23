'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import { Badge } from './ui/badge';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface TeamAnalyticsProps {
  teamId: string;
}

interface AnalyticsResponse {
  totalRequests: number;
  totalTokens: number;
  growthRate: number;
  usageStats: Array<{
    date: string;
    requests: number;
    tokens: number;
  }>;
}

// High contrast colors for charts
const CHART_COLORS = {
  primary: '#2563EB',    // Blue
  secondary: '#059669',  // Green
  accent: '#7C3AED',     // Purple
  warning: '#D97706',    // Amber
  error: '#DC2626'       // Red
};

export function TeamAnalytics({ teamId }: TeamAnalyticsProps) {
  const { data, isLoading, error } = useQuery<AnalyticsResponse>({
    queryKey: ['teamAnalytics', teamId],
    queryFn: () => api.get(`/api/team/${teamId}/analytics`)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-label="Loading analytics">
        <div className="text-gray-700 dark:text-gray-300">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96" role="alert" aria-label="Error loading analytics">
        <div className="text-red-600 dark:text-red-400">Error loading analytics</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.totalRequests.toLocaleString()}
            </div>
            <Badge
              variant={data.growthRate >= 0 ? 'default' : 'destructive'}
              className="mt-2"
            >
              {data.growthRate >= 0 ? '+' : ''}
              {data.growthRate}% from last month
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.totalTokens.toLocaleString()}
            </div>
            <Badge
              variant={data.growthRate >= 0 ? 'secondary' : 'destructive'}
              className="mt-2"
            >
              {data.growthRate >= 0 ? '+' : ''}
              {data.growthRate}% from last month
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]" role="img" aria-label="Usage over time chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.usageStats}>
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
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
