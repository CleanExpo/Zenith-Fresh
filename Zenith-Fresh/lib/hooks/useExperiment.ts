/**
 * useExperiment Hook
 * React hook for A/B testing integration
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  UseExperimentResult,
  UserContext,
  AllocateUserResponse,
  ExperimentError
} from '../../types/ab-testing';

interface UseExperimentOptions {
  userContext?: Partial<UserContext>;
  enabled?: boolean;
  forceVariant?: string;
  onAllocation?: (result: AllocateUserResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for integrating with A/B testing experiments
 */
export function useExperiment(
  experimentId: string,
  options: UseExperimentOptions = {}
): UseExperimentResult {
  const { data: session } = useSession();
  const {
    userContext = {},
    enabled = true,
    forceVariant,
    onAllocation,
    onError
  } = options;

  const [variant, setVariant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [configuration, setConfiguration] = useState<Record<string, any>>();
  const [featureFlags, setFeatureFlags] = useState<Record<string, any>>();
  const [allocationId, setAllocationId] = useState<string>();
  const [error, setError] = useState<Error>();
  const [isAllocated, setIsAllocated] = useState(false);

  // Enhanced user context with session data
  const enhancedUserContext = useMemo((): UserContext => ({
    userId: session?.user?.id,
    sessionId: typeof window !== 'undefined' ? getSessionId() : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    platform: 'web',
    ...userContext
  }), [session?.user?.id, userContext]);

  // Allocate user to experiment variant
  const allocateUser = useCallback(async () => {
    if (!experimentId || !enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(undefined);

      const response = await fetch('/api/experiments/allocate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experimentId,
          userContext: enhancedUserContext,
          forceVariant
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to allocate user to experiment');
      }

      const result: AllocateUserResponse = await response.json();
      
      setVariant(result.variantName);
      setConfiguration(result.configuration);
      setFeatureFlags(result.featureFlags);
      setAllocationId(result.allocationId);
      setIsAllocated(true);

      // Store allocation in local storage for consistency
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `experiment_${experimentId}`,
          JSON.stringify({
            variantName: result.variantName,
            allocationId: result.allocationId,
            timestamp: Date.now()
          })
        );
      }

      onAllocation?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setIsAllocated(false);
      onError?.(error);
      
      // Check for stored allocation as fallback
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`experiment_${experimentId}`);
        if (stored) {
          try {
            const { variantName, allocationId: storedAllocationId } = JSON.parse(stored);
            setVariant(variantName);
            setAllocationId(storedAllocationId);
            setIsAllocated(true);
          } catch {
            // Ignore parse errors
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [experimentId, enhancedUserContext, enabled, forceVariant, onAllocation, onError]);

  // Track event for the experiment
  const trackEvent = useCallback(async (
    eventType: string,
    eventValue?: number,
    eventData?: Record<string, any>
  ) => {
    if (!allocationId && !enhancedUserContext.userId) {
      console.warn('Cannot track event: no allocation ID or user context');
      return;
    }

    try {
      const response = await fetch('/api/experiments/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experimentId,
          allocationId,
          eventType,
          eventValue,
          eventData: {
            ...eventData,
            page: typeof window !== 'undefined' ? window.location.pathname : undefined,
            timestamp: new Date().toISOString()
          },
          userContext: enhancedUserContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to track event');
      }
    } catch (err) {
      console.error('Error tracking experiment event:', err);
      // Don't throw - tracking errors shouldn't break the user experience
    }
  }, [experimentId, allocationId, enhancedUserContext]);

  // Initialize allocation on mount
  useEffect(() => {
    allocateUser();
  }, [allocateUser]);

  return {
    variant,
    isLoading,
    configuration,
    featureFlags,
    trackEvent,
    isAllocated,
    allocationId,
    error
  };
}

/**
 * Hook for managing multiple experiments
 */
export function useExperiments(experimentIds: string[]): Record<string, UseExperimentResult> {
  const results: Record<string, UseExperimentResult> = {};

  for (const experimentId of experimentIds) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[experimentId] = useExperiment(experimentId);
  }

  return results;
}

/**
 * Hook for experiment feature flags
 */
export function useExperimentFeatureFlag(
  experimentId: string,
  flagKey: string,
  defaultValue: any = false
): any {
  const { featureFlags, isLoading, isAllocated } = useExperiment(experimentId);

  if (isLoading || !isAllocated) {
    return defaultValue;
  }

  return featureFlags?.[flagKey] ?? defaultValue;
}

/**
 * Hook for conditional rendering based on experiment variant
 */
export function useVariantComponent<T = React.ComponentType>(
  experimentId: string,
  components: Record<string, T>,
  defaultComponent?: T
): T | null {
  const { variant, isLoading, isAllocated } = useExperiment(experimentId);

  if (isLoading || !isAllocated || !variant) {
    return defaultComponent || null;
  }

  return components[variant] || defaultComponent || null;
}

/**
 * Hook for A/B testing with automatic conversion tracking
 */
export function useExperimentWithConversion(
  experimentId: string,
  conversionEvent: string = 'conversion',
  options: UseExperimentOptions = {}
): UseExperimentResult & {
  trackConversion: (value?: number, data?: Record<string, any>) => Promise<void>;
} {
  const experiment = useExperiment(experimentId, options);

  const trackConversion = useCallback(async (
    value?: number,
    data?: Record<string, any>
  ) => {
    await experiment.trackEvent(conversionEvent, value, data);
  }, [experiment.trackEvent, conversionEvent]);

  return {
    ...experiment,
    trackConversion
  };
}

// Helper functions

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('ab_test_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('ab_test_session_id', sessionId);
  }
  return sessionId;
}

function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export default useExperiment;