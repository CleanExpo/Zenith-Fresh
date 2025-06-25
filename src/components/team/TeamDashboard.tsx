'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Settings, 
  BarChart3, 
  Plus, 
  Shield, 
  Activity,
  UserPlus,
  Trash2,
  Edit,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { TeamMembers } from './TeamMembers';
import { TeamInvitations } from './TeamInvitations';
import { TeamAnalytics } from './TeamAnalytics';
import { TeamSettingsComponent } from './TeamSettings';
import { CreateTeamModal } from './CreateTeamModal';
import { EditTeamModal } from './EditTeamModal';

export interface Team {
  id: string;
  name: string;
  description?: string;
  role: string;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
  projects: Project[];
  invitations: TeamInvitation[];
  analytics: TeamAnalytics;
  settings: TeamSettings;
}

export interface TeamMember {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  recentActivity?: any[];
  lastActive: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  inviter: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Project {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    tasks: number;
    content: number;
  };
}

export interface TeamAnalytics {
  totalRequests: number;
  totalTokens: number;
  growthRate: number;
  usageStats: Array<{
    date: string;
    requests: number;
    tokens: number;
  }>;
}

export interface TeamSettings {
  id: string;
  timezone: string;
  language: string;
  notifications: {
    email: boolean;
    slack: boolean;
    discord: boolean;
  };
  integrations: {
    slack: boolean;
    discord: boolean;
    github: boolean;
  };
}

interface TeamDashboardProps {
  teamId: string;
}

export function TeamDashboard({ teamId }: TeamDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: team, isLoading, error } = useQuery<Team>({
    queryKey: ['team', teamId],
    queryFn: () => api.get(`/api/teams/${teamId}`).then(res => res.team)
  });

  const deleteTeamMutation = useMutation({
    mutationFn: () => api.delete(`/api/teams/${teamId}`),
    onSuccess: () => {
      toast.success('Team deleted successfully');
      // Redirect to teams list or dashboard
      window.location.href = '/dashboard';
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete team');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading team...</div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-destructive">Failed to load team</div>
      </div>
    );
  }

  const isOwner = team.role === 'OWNER';
  const isAdmin = team.role === 'ADMIN' || isOwner;
  const canManageMembers = isAdmin;
  const canManageSettings = isAdmin;

  const handleDeleteTeam = () => {
    if (confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      deleteTeamMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{team.name}</h1>
            <Badge variant="outline" className="capitalize">
              {team.role.toLowerCase()}
            </Badge>
          </div>
          {team.description && (
            <p className="text-muted-foreground mt-1">{team.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {team.members.length} members
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined {new Date(team.joinedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Team
            </Button>
          )}
          {isOwner && (
            <Button
              variant="destructive"
              onClick={handleDeleteTeam}
              disabled={deleteTeamMutation.isPending}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Team
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.members.length}</div>
            <div className="text-xs text-muted-foreground">
              {team.invitations.length} pending invitations
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.projects.length}</div>
            <div className="text-xs text-muted-foreground">
              {team.projects.filter(p => p.status === 'active').length} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {team.analytics.totalRequests.toLocaleString()}
            </div>
            <div className="flex items-center text-xs">
              {team.analytics.growthRate >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={team.analytics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                {team.analytics.growthRate >= 0 ? '+' : ''}{team.analytics.growthRate}%
              </span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {team.analytics.totalTokens.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              This month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">
            Members
            {team.invitations.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {team.invitations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          {canManageSettings && (
            <TabsTrigger value="settings">Settings</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {team.projects.length > 0 ? (
                  <div className="space-y-3">
                    {team.projects.slice(0, 5).map(project => (
                      <div key={project.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm text-muted-foreground">
                            by {project.user.name} • {project._count.tasks} tasks
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {project.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No projects yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {team.members.slice(0, 5).map(member => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {member.user.image ? (
                          <img 
                            src={member.user.image} 
                            alt={member.user.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {member.user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{member.user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Active {new Date(member.lastActive).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {member.role.toLowerCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TeamMembers teamId={teamId} canManage={canManageMembers} />
            </div>
            <div>
              <TeamInvitations teamId={teamId} canManage={canManageMembers} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <TeamAnalytics teamId={teamId} />
        </TabsContent>

        {canManageSettings && (
          <TabsContent value="settings">
            <TeamSettingsComponent teamId={teamId} />
          </TabsContent>
        )}
      </Tabs>

      {/* Modals */}
      {showEditModal && (
        <EditTeamModal
          team={team}
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}