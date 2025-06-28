'use client';

import { TeamMembers } from '@/components/team/TeamMembers';
import { TeamInvitations } from '@/components/team/TeamInvitations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface TeamMembersPageProps {
  params: {
    id: string;
  };
}

export default function TeamMembersPage({ params }: TeamMembersPageProps) {
  // Get current user's role in the team to determine permissions
  const { data: team } = useQuery({
    queryKey: ['team', params.id],
    queryFn: () => api.get(`/api/teams/${params.id}`).then(res => res.team)
  });

  const isOwner = team?.role === 'OWNER';
  const isAdmin = team?.role === 'ADMIN' || isOwner;
  const canManageMembers = isAdmin;

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
        <h1 className="text-3xl font-bold">Team Members</h1>
        <p className="text-muted-foreground">
          Manage team members and invitations
        </p>
      </div>

      {/* Members and Invitations */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TeamMembers teamId={params.id} canManage={canManageMembers} />
        </div>
        <div>
          <TeamInvitations teamId={params.id} canManage={canManageMembers} />
        </div>
      </div>
    </div>
  );
}