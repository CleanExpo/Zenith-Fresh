import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface TeamAnalyticsProps {
  teamId: string;
}

interface AnalyticsData {
  totalRequests: number;
  totalTokens: number;
  growthRate: number;
  usageStats: {
    date: string;
    requests: number;
    tokens: number;
  }[];
}

export function TeamAnalytics({ teamId }: TeamAnalyticsProps) {
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['analytics', teamId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/${teamId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <div className="animate-pulse">
          <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <div className="text-center text-red-600 dark:text-red-400">
          Error loading analytics
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
      <div className="p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
          Team Analytics
        </h3>
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="overflow-hidden rounded-lg bg-gray-50 px-4 py-5 dark:bg-gray-700 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Requests
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {data.totalRequests.toLocaleString()}
            </dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-gray-50 px-4 py-5 dark:bg-gray-700 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Tokens
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {data.totalTokens.toLocaleString()}
            </dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-gray-50 px-4 py-5 dark:bg-gray-700 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
              Growth Rate
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              +{data.growthRate}%
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
} 