'use client';

import { TeamSettingsComponent } from '@/components/team/TeamSettings';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface TeamSettingsPageProps {
  params: {
    id: string;
  };
}

export default function TeamSettingsPage({ params }: TeamSettingsPageProps) {
  const router = useRouter();

  // Get current user's role in the team to determine permissions
  const { data: team, isLoading } = useQuery({
    queryKey: ['team', params.id],
    queryFn: () => api.get(`/api/teams/${params.id}`).then(res => res.team)
  });

  // Redirect if user doesn't have permission
  if (!isLoading && team && team.role !== 'OWNER' && team.role !== 'ADMIN') {
    router.push(`/teams/${params.id}`);
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="mb-6">
        <Link href={`/teams/${params.id}`}>
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Team
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Team Settings</h1>
        <p className="text-muted-foreground">
          Manage team configuration and preferences
        </p>
      </div>

      {/* Settings Component */}
      <TeamSettingsComponent teamId={params.id} />
    </div>
  );
}