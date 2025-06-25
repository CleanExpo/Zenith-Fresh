'use client';

import { getEnvironmentBannerProps } from '@/lib/environment';
import { AlertTriangle, TestTube } from 'lucide-react';

export function StagingBanner() {
  const bannerProps = getEnvironmentBannerProps();
  
  if (!bannerProps) return null;

  return (
    <div className="bg-yellow-500 border-b border-yellow-600 px-4 py-2">
      <div className="flex items-center justify-center gap-2 text-yellow-900">
        <TestTube className="w-4 h-4" />
        <span className="text-sm font-medium">
          🧪 STAGING ENVIRONMENT - This is a test environment for development purposes
        </span>
        <AlertTriangle className="w-4 h-4" />
      </div>
    </div>
  );
}