'use client';

import React from 'react';
import { CompetitiveIntelligenceDashboard } from '@/components/competitive-intelligence/CompetitiveIntelligenceDashboard';
import { FeatureFlag } from '@/components/FeatureFlag';

export default function CompetitiveIntelligencePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FeatureFlag feature="COMPETITIVE_INTELLIGENCE">
          <CompetitiveIntelligenceDashboard />
        </FeatureFlag>
      </div>
    </div>
  );
}