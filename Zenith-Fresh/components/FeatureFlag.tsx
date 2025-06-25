'use client';

import { ReactNode } from 'react';
import { useFeatureFlag, FEATURE_FLAGS } from '@/lib/feature-flags';

interface FeatureFlagProps {
  feature: keyof typeof FEATURE_FLAGS;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component to conditionally render content based on feature flags
 */
export function FeatureFlag({ feature, children, fallback = null }: FeatureFlagProps) {
  const isEnabled = useFeatureFlag(feature);
  
  return <>{isEnabled ? children : fallback}</>;
}

/**
 * Hook to check multiple feature flags
 */
export function useFeatureFlags(features: (keyof typeof FEATURE_FLAGS)[]): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  
  features.forEach((feature) => {
    flags[feature as string] = useFeatureFlag(feature);
  });
  
  return flags;
}

/**
 * Development-only component to show feature flag status
 */
export function FeatureFlagDebugger() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const allFlags = Object.keys(FEATURE_FLAGS) as (keyof typeof FEATURE_FLAGS)[];
  const flagStatus = useFeatureFlags(allFlags);

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
      <h3 className="text-sm font-bold mb-2">Feature Flags</h3>
      <div className="space-y-1 text-xs">
        {allFlags.map((flag) => (
          <div key={flag as string} className="flex justify-between">
            <span>{flag as string}:</span>
            <span className={flagStatus[flag as string] ? 'text-green-400' : 'text-red-400'}>
              {flagStatus[flag as string] ? 'ON' : 'OFF'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}