/**
 * useExperimentList Hook
 * Hook for managing experiment CRUD operations
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  UseExperimentListResult,
  ExperimentSummary,
  ExperimentDetails,
  CreateExperimentRequest,
  UpdateExperimentRequest
} from '../../types/ab-testing';
import { ExperimentStatus, ExperimentType } from '@prisma/client';

interface UseExperimentListOptions {
  status?: ExperimentStatus;
  type?: ExperimentType;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

/**
 * Hook for managing A/B testing experiments list and CRUD operations
 */
export function useExperimentList(
  options: UseExperimentListOptions = {}
): UseExperimentListResult {
  const { data: session } = useSession();
  const {
    status,
    type,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [experiments, setExperiments] = useState<ExperimentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error>();

  // Fetch experiments from API
  const fetchExperiments = useCallback(async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (type) params.append('type', type);

      const response = await fetch(`/api/experiments?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch experiments');
      }

      const data = await response.json();
      setExperiments(data.experiments || []);
      setError(undefined);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error fetching experiments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, status, type]);

  // Create new experiment
  const createExperiment = useCallback(async (
    experimentData: CreateExperimentRequest
  ): Promise<ExperimentDetails> => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/experiments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(experimentData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create experiment');
    }

    const result = await response.json();
    
    // Refresh the list to include new experiment
    await fetchExperiments();
    
    return result.experiment;
  }, [session?.user?.id, fetchExperiments]);

  // Update existing experiment
  const updateExperiment = useCallback(async (
    experimentData: UpdateExperimentRequest
  ): Promise<ExperimentDetails> => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`/api/experiments/${experimentData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(experimentData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update experiment');
    }

    const result = await response.json();
    
    // Refresh the list to reflect changes
    await fetchExperiments();
    
    return result.experiment;
  }, [session?.user?.id, fetchExperiments]);

  // Delete experiment (archive it)
  const deleteExperiment = useCallback(async (experimentId: string): Promise<void> => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`/api/experiments/${experimentId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete experiment');
    }

    // Refresh the list to remove deleted experiment
    await fetchExperiments();
  }, [session?.user?.id, fetchExperiments]);

  // Start experiment
  const startExperiment = useCallback(async (experimentId: string): Promise<void> => {
    await updateExperiment({
      id: experimentId,
      // This would trigger the experiment to start
      // Additional API endpoint might be needed for experiment control
    });
  }, [updateExperiment]);

  // Stop experiment
  const stopExperiment = useCallback(async (experimentId: string): Promise<void> => {
    await updateExperiment({
      id: experimentId,
      // This would trigger the experiment to stop
      // Additional API endpoint might be needed for experiment control
    });
  }, [updateExperiment]);

  // Pause experiment
  const pauseExperiment = useCallback(async (experimentId: string): Promise<void> => {
    await updateExperiment({
      id: experimentId,
      // This would trigger the experiment to pause
      // Additional API endpoint might be needed for experiment control
    });
  }, [updateExperiment]);

  // Refetch experiments
  const refetch = useCallback(async () => {
    setIsLoading(true);
    await fetchExperiments();
  }, [fetchExperiments]);

  // Initial fetch
  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchExperiments, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchExperiments]);

  return {
    experiments,
    isLoading,
    error,
    refetch,
    createExperiment,
    updateExperiment,
    deleteExperiment,
    // Additional experiment control methods
    startExperiment,
    stopExperiment,
    pauseExperiment
  };
}

/**
 * Hook for filtering and sorting experiments
 */
export function useExperimentFilters(experiments: ExperimentSummary[]) {
  const [filters, setFilters] = useState<{
    status?: ExperimentStatus;
    type?: ExperimentType;
    search?: string;
  }>({});

  const [sortBy, setSortBy] = useState<{
    field: keyof ExperimentSummary;
    direction: 'asc' | 'desc';
  }>({
    field: 'createdAt',
    direction: 'desc'
  });

  const filteredAndSortedExperiments = experiments
    .filter(experiment => {
      if (filters.status && experiment.status !== filters.status) return false;
      if (filters.type && experiment.type !== filters.type) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return experiment.name.toLowerCase().includes(searchLower) ||
               experiment.primaryMetric.toLowerCase().includes(searchLower);
      }
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortBy.field];
      const bValue = b[sortBy.field];
      
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortBy.direction === 'desc' ? -comparison : comparison;
    });

  return {
    filteredExperiments: filteredAndSortedExperiments,
    filters,
    setFilters,
    sortBy,
    setSortBy
  };
}

/**
 * Hook for experiment statistics and metrics
 */
export function useExperimentStats(experiments: ExperimentSummary[]) {
  const stats = {
    total: experiments.length,
    running: experiments.filter(e => e.status === ExperimentStatus.RUNNING).length,
    completed: experiments.filter(e => e.status === ExperimentStatus.COMPLETED).length,
    draft: experiments.filter(e => e.status === ExperimentStatus.DRAFT).length,
    
    // Success metrics
    withWinners: experiments.filter(e => e.winningVariant).length,
    significantResults: experiments.filter(e => e.confidence && e.confidence >= 0.95).length,
    
    // Type breakdown
    abTests: experiments.filter(e => e.type === ExperimentType.AB_TEST).length,
    multivariate: experiments.filter(e => e.type === ExperimentType.MULTIVARIATE).length,
    
    // Average metrics
    avgParticipants: experiments.length > 0 
      ? Math.round(experiments.reduce((sum, e) => sum + e.totalParticipants, 0) / experiments.length)
      : 0,
    avgDaysRunning: experiments.filter(e => e.daysRunning).length > 0
      ? Math.round(experiments.filter(e => e.daysRunning).reduce((sum, e) => sum + (e.daysRunning || 0), 0) / experiments.filter(e => e.daysRunning).length)
      : 0
  };

  return stats;
}

export default useExperimentList;