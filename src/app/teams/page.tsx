'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Plus, 
  Calendar,
  Activity,
  Crown,
  Shield,
  User,
  Eye
} from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { CreateTeamModal } from '@/components/team/CreateTeamModal';

interface Team {
  id: string;
  name: string;
  description?: string;
  role: string;
  joinedAt: string;
  createdAt: string;
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
  }>;
  projects: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
  VIEWER: Eye
};

const roleColors = {
  OWNER: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  ADMIN: 'text-blue-600 bg-blue-50 border-blue-200',
  MEMBER: 'text-green-600 bg-green-50 border-green-200',
  VIEWER: 'text-gray-600 bg-gray-50 border-gray-200'
};

export default function TeamsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: teams, isLoading, error } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => api.get('/api/teams').then(res => res.teams)
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading teams...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-destructive">Failed to load teams</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">
            Collaborate with your team members on projects and analytics
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </div>

      {/* Teams Grid */}
      {teams && teams.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const RoleIcon = roleIcons[team.role as keyof typeof roleIcons];
            const roleColorClass = roleColors[team.role as keyof typeof roleColors];

            return (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{team.name}</CardTitle>
                        {team.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {team.description}
                          </p>
                        )}
                      </div>
                      <Badge className={`flex items-center gap-1 ${roleColorClass}`}>
                        <RoleIcon className="h-3 w-3" />
                        {team.role.toLowerCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Team Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {team.members.length} members
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Activity className="h-4 w-4" />
                          {team.projects.length} projects
                        </div>
                      </div>

                      {/* Member Avatars */}
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {team.members.slice(0, 4).map((member) => (
                            <div
                              key={member.id}
                              className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center"
                              title={member.user.name}
                            >
                              {member.user.image ? (
                                <img 
                                  src={member.user.image} 
                                  alt={member.user.name}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <span className="text-xs font-medium">
                                  {member.user.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          ))}
                          {team.members.length > 4 && (
                            <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                              <span className="text-xs font-medium">
                                +{team.members.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Join Date */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Joined {new Date(team.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No teams yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first team to start collaborating with others
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Your First Team
          </Button>
        </div>
      )}

      {/* Create Team Modal */}
      <CreateTeamModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}