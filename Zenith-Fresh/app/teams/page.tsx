'use client';

import { TeamList } from '@/components/teams/TeamList';
import { TeamListErrorBoundary } from '@/components/error-boundaries';

export default function TeamsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TeamListErrorBoundary>
        <TeamList />
      </TeamListErrorBoundary>
    </div>
  );
}