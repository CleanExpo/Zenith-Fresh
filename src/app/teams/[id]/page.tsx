'use client';

import { TeamDashboard } from '@/components/team/TeamDashboard';

interface TeamPageProps {
  params: {
    id: string;
  };
}

export default function TeamPage({ params }: TeamPageProps) {
  return <TeamDashboard teamId={params.id} />;
}