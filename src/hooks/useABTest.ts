'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserVariant, trackConversion } from '@/lib/ab-testing';

/**
 * React hook for A/B testing
 * This should only be used in client components
 */
export function useABTest(experimentId: string, userId?: string, teamId?: string) {
  const [variant, setVariant] = useState<string>('control');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      const variant = getUserVariant({ 
        experimentId, 
        variants: ['control', 'test'], 
        userId,
        teamId 
      });
      setVariant(variant);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [experimentId, userId, teamId]);

  const recordConversion = useCallback((type: string, value?: number) => {
    if (userId) {
      trackConversion({ 
        experimentId, 
        variant, 
        userId, 
        eventType: type,
        properties: { value }
      });
    }
  }, [experimentId, userId]);

  return { variant, isLoading, recordConversion };
}