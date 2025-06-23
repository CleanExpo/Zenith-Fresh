'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserVariant, trackConversion } from '@/lib/ab-testing';

/**
 * React hook for A/B testing
 * This should only be used in client components
 */
export function useABTest(experimentId: string, userId?: string) {
  const [variant, setVariant] = useState<string>('control');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      getUserVariant(experimentId, userId)
        .then(setVariant)
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [experimentId, userId]);

  const recordConversion = useCallback((type: string, value?: number) => {
    if (userId) {
      trackConversion(experimentId, userId, type, value);
    }
  }, [experimentId, userId]);

  return { variant, isLoading, recordConversion };
}